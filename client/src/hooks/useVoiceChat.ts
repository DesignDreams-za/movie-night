import { useEffect, useRef, useState } from 'react'
import { useSocket } from '../contexts/SocketContext'
import { useRoom } from '../contexts/RoomContext'

const ICE_SERVERS: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }]
const RECONNECT_GRACE_MS = 2500

export type PeerStatus = 'connecting' | 'connected' | 'reconnecting'

// WebRTC is pairwise, so with more than two people this hook maintains one
// RTCPeerConnection per other participant. Whichever side has the "lower"
// socket id initiates the offer for a given pair — a simple, deterministic
// way to avoid both sides racing to offer at once, without needing a fixed
// "host always initiates" rule (which doesn't generalize past two peers).
export function useVoiceChat(localStream: MediaStream | null) {
  const { socket } = useSocket()
  const { room } = useRoom()
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({})
  const [peerStatuses, setPeerStatuses] = useState<Record<string, PeerStatus>>({})

  const peersRef = useRef(new Map<string, RTCPeerConnection>())
  const localStreamRef = useRef<MediaStream | null>(null)
  const localReadyRef = useRef(false)
  const pendingCandidatesRef = useRef(new Map<string, RTCIceCandidateInit[]>())
  const reconnectTimersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  localStreamRef.current = localStream

  function removePeer(peerId: string) {
    peersRef.current.get(peerId)?.close()
    peersRef.current.delete(peerId)
    pendingCandidatesRef.current.delete(peerId)

    const timer = reconnectTimersRef.current.get(peerId)
    if (timer) {
      clearTimeout(timer)
      reconnectTimersRef.current.delete(peerId)
    }

    setRemoteStreams((current) => {
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

    localStreamRef.current?.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current!)
    })

    pc.ontrack = (event) => {
      const stream = event.streams[0]
      if (stream) setRemoteStreams((current) => ({ ...current, [peerId]: stream }))
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('webrtc:ice-candidate', { to: peerId, candidate: event.candidate.toJSON() })
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
              void connectToPeer(peerId)
            }, RECONNECT_GRACE_MS),
          )
        }
      }
    }

    peersRef.current.set(peerId, pc)
    setPeerStatuses((current) => ({ ...current, [peerId]: 'connecting' }))
    return pc
  }

  async function connectToPeer(peerId: string) {
    if (!localReadyRef.current) return
    if (peersRef.current.has(peerId)) return
    if ((socket.id ?? '') >= peerId) return // the other side initiates for this pair

    const pc = createPeerConnection(peerId)
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    socket.emit('webrtc:offer', { to: peerId, sdp: offer })
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
      void connectToPeer(userId)
    }

    function handlePeersReady({ userIds }: { userIds: string[] }) {
      userIds.forEach((id) => void connectToPeer(id))
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
    if (localStream && (room?.users.length ?? 0) >= 2 && !localReadyRef.current) {
      localReadyRef.current = true
      socket.emit('voice:ready')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localStream, room?.users.length])

  useEffect(() => {
    const peers = peersRef.current
    const timers = reconnectTimersRef.current
    return () => {
      peers.forEach((pc) => pc.close())
      peers.clear()
      timers.forEach((timer) => clearTimeout(timer))
    }
  }, [])

  return { remoteStreams, peerStatuses }
}
