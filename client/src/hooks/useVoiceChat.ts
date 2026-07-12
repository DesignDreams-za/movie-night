import { useEffect, useRef, useState } from 'react'
import { useSocket } from '../contexts/SocketContext'
import { useRoom } from '../contexts/RoomContext'

const ICE_SERVERS: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }]
const RECONNECT_GRACE_MS = 2500

export type PeerStatus = 'connecting' | 'connected' | 'reconnecting'

// WebRTC is pairwise, so with more than two people this hook maintains one
// RTCPeerConnection per other participant, carrying both the mic track and
// (if enabled) the camera track.
//
// Renegotiation (e.g. someone toggles their camera on mid-call) can be
// triggered by either side, so this follows the standard "Perfect
// Negotiation" pattern instead of a static "only one side ever offers"
// rule: whoever has the "higher" socket id is "polite" for a given pair —
// if both sides happen to create an offer at the same time, the polite
// side rolls its own back and accepts the other's, while the impolite side
// just ignores the incoming collision and lets its own offer proceed. The
// impolite side still creates the peer connection eagerly on initial
// connect; the polite side creates it lazily on first receiving an offer.
export function useVoiceChat(localAudioStream: MediaStream | null, localVideoStream: MediaStream | null) {
  const { socket } = useSocket()
  const { room } = useRoom()
  const [remoteAudioStreams, setRemoteAudioStreams] = useState<Record<string, MediaStream>>({})
  const [remoteVideoStreams, setRemoteVideoStreams] = useState<Record<string, MediaStream>>({})
  const [peerStatuses, setPeerStatuses] = useState<Record<string, PeerStatus>>({})

  const peersRef = useRef(new Map<string, RTCPeerConnection>())
  const localAudioStreamRef = useRef<MediaStream | null>(null)
  const localVideoStreamRef = useRef<MediaStream | null>(null)
  const localReadyRef = useRef(false)
  const pendingCandidatesRef = useRef(new Map<string, RTCIceCandidateInit[]>())
  const reconnectTimersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const politeRef = useRef(new Map<string, boolean>())
  const makingOfferRef = useRef(new Map<string, boolean>())

  localAudioStreamRef.current = localAudioStream
  localVideoStreamRef.current = localVideoStream

  function removePeer(peerId: string) {
    peersRef.current.get(peerId)?.close()
    peersRef.current.delete(peerId)
    pendingCandidatesRef.current.delete(peerId)
    politeRef.current.delete(peerId)
    makingOfferRef.current.delete(peerId)

    const timer = reconnectTimersRef.current.get(peerId)
    if (timer) {
      clearTimeout(timer)
      reconnectTimersRef.current.delete(peerId)
    }

    setRemoteAudioStreams((current) => {
      if (!(peerId in current)) return current
      const next = { ...current }
      delete next[peerId]
      return next
    })
    setRemoteVideoStreams((current) => {
      if (!(peerId in current)) return current
      const next = { ...current }
      delete next[peerId]
      return next
    })
    setPeerStatuses((current) => {
      if (!(peerId in current)) return current
      const next = { ...current }
      delete next[peerId]
      return next
    })
  }

  function createPeerConnection(peerId: string) {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
    politeRef.current.set(peerId, (socket.id ?? '') >= peerId)
    makingOfferRef.current.set(peerId, false)

    localAudioStreamRef.current?.getTracks().forEach((track) => {
      pc.addTrack(track, localAudioStreamRef.current!)
    })
    localVideoStreamRef.current?.getTracks().forEach((track) => {
      pc.addTrack(track, localVideoStreamRef.current!)
    })

    pc.ontrack = (event) => {
      const stream = event.streams[0]
      const track = event.track
      if (!stream) return

      if (track.kind !== 'video') {
        setRemoteAudioStreams((current) => ({ ...current, [peerId]: stream }))
        return
      }

      // A remote camera toggling off mid-call doesn't fire a fresh ontrack —
      // the existing track just mutes. Toggling back on unmutes the same
      // track rather than creating a new one, so both directions need
      // explicit handling, not just the initial add here.
      const addVideo = () => setRemoteVideoStreams((current) => ({ ...current, [peerId]: stream }))
      const removeVideo = () =>
        setRemoteVideoStreams((current) => {
          if (!(peerId in current)) return current
          const next = { ...current }
          delete next[peerId]
          return next
        })

      if (!track.muted) addVideo()
      track.onunmute = addVideo
      track.onmute = removeVideo
      track.onended = removeVideo
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('webrtc:ice-candidate', { to: peerId, candidate: event.candidate.toJSON() })
      }
    }

    // Fires once for the initial connection (tracks added above) and again
    // any time tracks are added/removed afterward (e.g. camera toggle) —
    // from whichever side made that local change.
    pc.onnegotiationneeded = async () => {
      try {
        makingOfferRef.current.set(peerId, true)
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        socket.emit('webrtc:offer', { to: peerId, sdp: offer })
      } finally {
        makingOfferRef.current.set(peerId, false)
      }
    }

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setPeerStatuses((current) => ({ ...current, [peerId]: 'connected' }))
        const timer = reconnectTimersRef.current.get(peerId)
        if (timer) {
          clearTimeout(timer)
          reconnectTimersRef.current.delete(peerId)
        }
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setPeerStatuses((current) => ({ ...current, [peerId]: 'reconnecting' }))
        if (!reconnectTimersRef.current.has(peerId)) {
          reconnectTimersRef.current.set(
            peerId,
            setTimeout(() => {
              reconnectTimersRef.current.delete(peerId)
              removePeer(peerId)
              connectToPeer(peerId)
            }, RECONNECT_GRACE_MS),
          )
        }
      }
    }

    peersRef.current.set(peerId, pc)
    setPeerStatuses((current) => ({ ...current, [peerId]: 'connecting' }))
    return pc
  }

  function connectToPeer(peerId: string) {
    if (!localReadyRef.current) return
    if (peersRef.current.has(peerId)) return
    if ((socket.id ?? '') >= peerId) return // the other side initiates for this pair
    createPeerConnection(peerId)
  }

  useEffect(() => {
    async function flushPending(peerId: string, pc: RTCPeerConnection) {
      const pending = pendingCandidatesRef.current.get(peerId) ?? []
      for (const candidate of pending) {
        await pc.addIceCandidate(candidate)
      }
      pendingCandidatesRef.current.delete(peerId)
    }

    async function handleOffer({ from, sdp }: { from: string; sdp: RTCSessionDescriptionInit }) {
      const pc = peersRef.current.get(from) ?? createPeerConnection(from)
      const isPolite = politeRef.current.get(from) ?? false
      const isCollision = makingOfferRef.current.get(from) || pc.signalingState !== 'stable'

      if (isCollision && !isPolite) return // impolite side ignores the collision, its own offer wins

      if (isCollision && isPolite) {
        await pc.setLocalDescription({ type: 'rollback' })
      }
      await pc.setRemoteDescription(sdp)
      await flushPending(from, pc)
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      socket.emit('webrtc:answer', { to: from, sdp: answer })
    }

    async function handleAnswer({ from, sdp }: { from: string; sdp: RTCSessionDescriptionInit }) {
      const pc = peersRef.current.get(from)
      if (!pc) return
      await pc.setRemoteDescription(sdp)
      await flushPending(from, pc)
    }

    async function handleIceCandidate({
      from,
      candidate,
    }: {
      from: string
      candidate: RTCIceCandidateInit
    }) {
      const pc = peersRef.current.get(from)
      if (!pc || !pc.remoteDescription) {
        const list = pendingCandidatesRef.current.get(from) ?? []
        list.push(candidate)
        pendingCandidatesRef.current.set(from, list)
        return
      }
      await pc.addIceCandidate(candidate)
    }

    function handleVoiceReady({ userId }: { userId: string }) {
      connectToPeer(userId)
    }

    function handlePeersReady({ userIds }: { userIds: string[] }) {
      userIds.forEach((id) => connectToPeer(id))
    }

    function handleUserLeft(userId: string) {
      removePeer(userId)
    }

    socket.on('webrtc:offer', handleOffer)
    socket.on('webrtc:answer', handleAnswer)
    socket.on('webrtc:ice-candidate', handleIceCandidate)
    socket.on('voice:ready', handleVoiceReady)
    socket.on('voice:peers-ready', handlePeersReady)
    socket.on('user:left', handleUserLeft)

    return () => {
      socket.off('webrtc:offer', handleOffer)
      socket.off('webrtc:answer', handleAnswer)
      socket.off('webrtc:ice-candidate', handleIceCandidate)
      socket.off('voice:ready', handleVoiceReady)
      socket.off('voice:peers-ready', handlePeersReady)
      socket.off('user:left', handleUserLeft)
    }
  }, [socket])

  useEffect(() => {
    if (localAudioStream && (room?.users.length ?? 0) >= 2 && !localReadyRef.current) {
      localReadyRef.current = true
      socket.emit('voice:ready')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localAudioStream, room?.users.length])

  // Add/remove/replace the video track on every existing connection whenever
  // the local camera stream changes (toggled on, off, or swapped).
  useEffect(() => {
    const newTrack = localVideoStream?.getVideoTracks()[0] ?? null
    peersRef.current.forEach((pc) => {
      const videoSender = pc.getSenders().find((sender) => sender.track?.kind === 'video')
      if (newTrack && !videoSender) {
        pc.addTrack(newTrack, localVideoStream!)
      } else if (!newTrack && videoSender) {
        pc.removeTrack(videoSender)
      } else if (newTrack && videoSender && videoSender.track !== newTrack) {
        void videoSender.replaceTrack(newTrack)
      }
    })
  }, [localVideoStream])

  useEffect(() => {
    const peers = peersRef.current
    const timers = reconnectTimersRef.current
    return () => {
      peers.forEach((pc) => pc.close())
      peers.clear()
      timers.forEach((timer) => clearTimeout(timer))
    }
  }, [])

  return { remoteAudioStreams, remoteVideoStreams, peerStatuses }
}
