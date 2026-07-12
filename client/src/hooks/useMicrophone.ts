import { useEffect, useRef, useState } from 'react'
import { useSocket } from '../contexts/SocketContext'

export function useMicrophone() {
  const { socket } = useSocket()
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    let cancelled = false

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((mediaStream) => {
        if (cancelled) {
          mediaStream.getTracks().forEach((track) => track.stop())
          return
        }
        streamRef.current = mediaStream
        setStream(mediaStream)
      })
      .catch(() => {
        setError('Microphone access was denied')
      })

    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [])

  useEffect(() => {
    function handleForceMuted() {
      if (!streamRef.current) return
      streamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = false
      })
      setIsMuted(true)
    }

    socket.on('room:force-muted', handleForceMuted)
    return () => {
      socket.off('room:force-muted', handleForceMuted)
    }
  }, [socket])

  function toggleMute() {
    if (!streamRef.current) return
    const next = !isMuted
    streamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !next
    })
    setIsMuted(next)
  }

  return { stream, error, isMuted, toggleMute }
}
