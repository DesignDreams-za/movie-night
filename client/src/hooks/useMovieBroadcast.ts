import { useEffect, useRef, useState } from 'react'
import { useSocket } from '../contexts/SocketContext'
import { useRoom } from '../contexts/RoomContext'

const ICE_SERVERS: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }]
const RECONNECT_GRACE_MS = 2500

export type MovieStreamStatus = 'waiting' | 'connecting' | 'connected' | 'reconnecting'

// The movie itself streams from whoever loaded it (the host) to everyone
// else in the room, over its own dedicated peer connection per viewer —
// unlike the voice/camera call, this is one-directional and always
// initiated by the host, so there's no glare/tie-breaking to handle: the
// host always offers, the viewer always answers.
export function useMovieBroadcast(
  isHost: boolean,
  videoRef: React.RefObject<HTMLVideoElement | null>,
  fileName: string | null,
) {
  const { socket } = useSocket()
  const { room, you } = useRoom()
  const [incomingStream, setIncomingStream] = useState<MediaStream | null>(null)
  const [status, setStatus] = useState<MovieStreamStatus>('waiting')

  const peersRef = useRef(new Map<string, RTCPeerConnection>())
  const capturedStreamRef = useRef<MediaStream | null>(null)
  const pendingCandidatesRef = useRef(new Map<string, RTCIceCandidateInit[]>())
  const reconnectTimersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  async function flushPending(peerId: string, pc: RTCPeerConnection) {
    const pending = pendingCandidatesRef.current.get(peerId) ?? []
    for (const candidate of pending) {
      await pc.addIceCandidate(candidate)
    }
    pendingCandidatesRef.current.delete(peerId)
  }

  function closePeer(peerId: string) {
    peersRef.current.get(peerId)?.close()
    peersRef.current.delete(peerId)
    pendingCandidatesRef.current.delete(peerId)
    const timer = reconnectTimersRef.current.get(peerId)
    if (timer) {
      clearTimeout(timer)
      reconnectTimersRef.current.delete(peerId)
    }
  }

  // ---------- HOST: capture the loaded file and offer it to every viewer ----------
  useEffect(() => {
    if (!isHost || !fileName) return
    const video = videoRef.current
    if (!video) return

    let cleanup: (() => void) | null = null

    // captureStream() must wait until the browser actually knows the
    // media's tracks — calling it the instant a file loads (before the
    // container's been parsed) silently returns a stream with zero tracks.
    function start() {
      const stream = video!.captureStream()
      capturedStreamRef.current = stream

      function connectToViewer(viewerId: string) {
        if (peersRef.current.has(viewerId)) return
        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
        stream.getTracks().forEach((track) => pc.addTrack(track, stream))

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('movie:ice-candidate', { to: viewerId, candidate: event.candidate.toJSON() })
          }
        }

        pc.onnegotiationneeded = async () => {
          const offer = await pc.createOffer()
          await pc.setLocalDescription(offer)
          socket.emit('movie:offer', { to: viewerId, sdp: offer })
        }

        pc.onconnectionstatechange = () => {
          if (pc.connectionState === 'connected') {
            const timer = reconnectTimersRef.current.get(viewerId)
            if (timer) {
              clearTimeout(timer)
              reconnectTimersRef.current.delete(viewerId)
            }
          } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
            if (!reconnectTimersRef.current.has(viewerId)) {
              reconnectTimersRef.current.set(
                viewerId,
                setTimeout(() => {
                  reconnectTimersRef.current.delete(viewerId)
                  closePeer(viewerId)
                  connectToViewer(viewerId)
                }, RECONNECT_GRACE_MS),
              )
            }
          }
        }

        peersRef.current.set(viewerId, pc)
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

      function handleUserJoined(user: { id: string }) {
        connectToViewer(user.id)
      }

      function handleUserLeft(userId: string) {
        closePeer(userId)
      }

      const others = room?.users.filter((user) => user.id !== you?.id) ?? []
      others.forEach((user) => connectToViewer(user.id))

      socket.on('movie:answer', handleAnswer)
      socket.on('movie:ice-candidate', handleIceCandidate)
      socket.on('user:joined', handleUserJoined)
      socket.on('user:left', handleUserLeft)

      cleanup = () => {
        socket.off('movie:answer', handleAnswer)
        socket.off('movie:ice-candidate', handleIceCandidate)
        socket.off('user:joined', handleUserJoined)
        socket.off('user:left', handleUserLeft)
        peersRef.current.forEach((_pc, peerId) => closePeer(peerId))
        stream.getTracks().forEach((track) => track.stop())
        capturedStreamRef.current = null
      }
    }

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      start()
    } else {
      video.addEventListener('loadeddata', start, { once: true })
    }

    return () => {
      video.removeEventListener('loadeddata', start)
      cleanup?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, fileName])

  // ---------- VIEWER: receive the offer from whoever is hosting ----------
  useEffect(() => {
    if (isHost) return

    async function handleOffer({ from, sdp }: { from: string; sdp: RTCSessionDescriptionInit }) {
      setStatus('connecting')
      let pc = peersRef.current.get(from)
      if (!pc) {
        pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })

        pc.ontrack = (event) => {
          setIncomingStream(event.streams[0] ?? null)
        }

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('movie:ice-candidate', { to: from, candidate: event.candidate.toJSON() })
          }
        }

        pc.onconnectionstatechange = () => {
          if (pc!.connectionState === 'connected') setStatus('connected')
          else if (pc!.connectionState === 'failed' || pc!.connectionState === 'disconnected') {
            setStatus('reconnecting')
          }
        }

        peersRef.current.set(from, pc)
      }

      await pc.setRemoteDescription(sdp)
      await flushPending(from, pc)
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      socket.emit('movie:answer', { to: from, sdp: answer })
    }

    async function handleIceCandidate({ from, candidate }: { from: string; candidate: RTCIceCandidateInit }) {
      const pc = peersRef.current.get(from)
      if (!pc || !pc.remoteDescription) {
        const list = pendingCandidatesRef.current.get(from) ?? []
        list.push(candidate)
        pendingCandidatesRef.current.set(from, list)
        return
      }
      await pc.addIceCandidate(candidate)
    }

    function handleUserLeft(userId: string) {
      if (peersRef.current.has(userId)) {
        closePeer(userId)
        setIncomingStream(null)
        setStatus('waiting')
      }
    }

    socket.on('movie:offer', handleOffer)
    socket.on('movie:ice-candidate', handleIceCandidate)
    socket.on('user:left', handleUserLeft)

    return () => {
      socket.off('movie:offer', handleOffer)
      socket.off('movie:ice-candidate', handleIceCandidate)
      socket.off('user:left', handleUserLeft)
    }
  }, [isHost, socket])

  useEffect(() => {
    const peers = peersRef.current
    const timers = reconnectTimersRef.current
    return () => {
      peers.forEach((pc) => pc.close())
      peers.clear()
      timers.forEach((timer) => clearTimeout(timer))
    }
  }, [])

  return { incomingStream, status }
}
