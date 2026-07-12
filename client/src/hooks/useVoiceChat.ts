import { useEffect, useRef, useState } from 'react'
import { useSocket } from '../contexts/SocketContext'
import { useRoom } from '../contexts/RoomContext'

const ICE_SERVERS: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }]
const RECONNECT_GRACE_MS = 2500

export type VoiceConnectionStatus = 'waiting' | 'connecting' | 'connected' | 'reconnecting'

// The host always initiates the WebRTC offer once both people are in the
// room and mic-ready — a fixed initiator avoids two peers racing to offer
// at the same time. Everything else (mute, volume, speaking indicator) is
// local-only and lives in the components/hooks that use this one.
export function useVoiceChat(localStream: MediaStream | null) {
  const { socket } = useSocket()
  const { room, you } = useRoom()
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [status, setStatus] = useState<VoiceConnectionStatus>('waiting')

  const pcRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const isHostRef = useRef(false)
  const bothInRoomRef = useRef(false)
  const localReadyRef = useRef(false)
  const remoteReadyRef = useRef(false)
  const hasInitiatedRef = useRef(false)
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([])
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  localStreamRef.current = localStream
  isHostRef.current = !!you?.isHost
  bothInRoomRef.current = (room?.users.length ?? 0) >= 2

  function teardownPeerConnection() {
    pcRef.current?.close()
    pcRef.current = null
    hasInitiatedRef.current = false
    pendingCandidatesRef.current = []
    setRemoteStream(null)
  }

  function createPeerConnection() {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })

    localStreamRef.current?.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current!)
    })

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0] ?? null)
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('webrtc:ice-candidate', { candidate: event.candidate.toJSON() })
      }
    }

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setStatus('connected')
        if (reconnectTimerRef.current) {
          clearTimeout(reconnectTimerRef.current)
          reconnectTimerRef.current = null
        }
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setStatus('reconnecting')
        if (!reconnectTimerRef.current) {
          reconnectTimerRef.current = setTimeout(() => {
            reconnectTimerRef.current = null
            teardownPeerConnection()
            void maybeInitiate()
          }, RECONNECT_GRACE_MS)
        }
      }
    }

    pcRef.current = pc
    return pc
  }

  async function maybeInitiate() {
    if (!isHostRef.current) return
    if (!localReadyRef.current || !remoteReadyRef.current) return
    if (hasInitiatedRef.current) return
    hasInitiatedRef.current = true

    setStatus('connecting')
    const pc = createPeerConnection()
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    socket.emit('webrtc:offer', { sdp: offer })
  }

  useEffect(() => {
    async function flushPendingCandidates(pc: RTCPeerConnection) {
      for (const candidate of pendingCandidatesRef.current) {
        await pc.addIceCandidate(candidate)
      }
      pendingCandidatesRef.current = []
    }

    async function handleOffer({ sdp }: { sdp: RTCSessionDescriptionInit }) {
      setStatus('connecting')
      const pc = pcRef.current ?? createPeerConnection()
      await pc.setRemoteDescription(sdp)
      await flushPendingCandidates(pc)
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      socket.emit('webrtc:answer', { sdp: answer })
    }

    async function handleAnswer({ sdp }: { sdp: RTCSessionDescriptionInit }) {
      const pc = pcRef.current
      if (!pc) return
      await pc.setRemoteDescription(sdp)
      await flushPendingCandidates(pc)
    }

    async function handleIceCandidate({ candidate }: { candidate: RTCIceCandidateInit }) {
      const pc = pcRef.current
      if (!pc || !pc.remoteDescription) {
        pendingCandidatesRef.current.push(candidate)
        return
      }
      await pc.addIceCandidate(candidate)
    }

    function handleVoiceReady() {
      remoteReadyRef.current = true
      void maybeInitiate()
    }

    function handleUserLeft() {
      remoteReadyRef.current = false
      localReadyRef.current = false
      teardownPeerConnection()
      setStatus('waiting')
    }

    socket.on('webrtc:offer', handleOffer)
    socket.on('webrtc:answer', handleAnswer)
    socket.on('webrtc:ice-candidate', handleIceCandidate)
    socket.on('voice:ready', handleVoiceReady)
    socket.on('user:left', handleUserLeft)

    return () => {
      socket.off('webrtc:offer', handleOffer)
      socket.off('webrtc:answer', handleAnswer)
      socket.off('webrtc:ice-candidate', handleIceCandidate)
      socket.off('voice:ready', handleVoiceReady)
      socket.off('user:left', handleUserLeft)
    }
  }, [socket])

  useEffect(() => {
    if (localStream && bothInRoomRef.current && !localReadyRef.current) {
      localReadyRef.current = true
      socket.emit('voice:ready')
      void maybeInitiate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localStream, room?.users.length])

  useEffect(() => {
    return () => {
      teardownPeerConnection()
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
    }
  }, [])

  return { remoteStream, status }
}
