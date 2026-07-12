import { useEffect, useRef, useState } from 'react'

// Opt-in, unlike the mic which auto-connects — nobody's camera turns on
// without them explicitly clicking to enable it.
export function useCamera() {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  async function enable() {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 320 }, height: { ideal: 240 }, frameRate: { ideal: 24 } },
      })
      streamRef.current = mediaStream
      setStream(mediaStream)
      setError(null)
    } catch {
      setError('Camera access was denied')
    }
  }

  function disable() {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setStream(null)
  }

  function toggle() {
    if (streamRef.current) disable()
    else void enable()
  }

  return { stream, error, isEnabled: !!stream, toggle }
}
