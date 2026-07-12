import { useEffect, useState } from 'react'

const SPEAKING_THRESHOLD = 18
const HANGOVER_MS = 400

// Detects "is this stream currently making noise" locally — used for both
// the local mic stream and the incoming remote stream, so no extra
// signaling is needed to show a speaking indicator for either person.
export function useAudioLevel(stream: MediaStream | null) {
  const [isSpeaking, setIsSpeaking] = useState(false)

  useEffect(() => {
    if (!stream || stream.getAudioTracks().length === 0) {
      setIsSpeaking(false)
      return
    }

    const audioContext = new AudioContext()
    const source = audioContext.createMediaStreamSource(stream)
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 512
    source.connect(analyser)

    const data = new Uint8Array(analyser.frequencyBinCount)
    let frameId: number
    let lastSpokeAt = 0

    function tick() {
      analyser.getByteFrequencyData(data)
      const average = data.reduce((sum, value) => sum + value, 0) / data.length
      const now = performance.now()

      if (average > SPEAKING_THRESHOLD) {
        lastSpokeAt = now
        setIsSpeaking(true)
      } else if (now - lastSpokeAt > HANGOVER_MS) {
        setIsSpeaking(false)
      }

      frameId = requestAnimationFrame(tick)
    }
    tick()

    return () => {
      cancelAnimationFrame(frameId)
      source.disconnect()
      void audioContext.close()
    }
  }, [stream])

  return isSpeaking
}
