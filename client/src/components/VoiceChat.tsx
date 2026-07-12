import { useEffect, useRef, useState } from 'react'
import { useMicrophone } from '../hooks/useMicrophone'
import { useAudioLevel } from '../hooks/useAudioLevel'
import { useVoiceChat } from '../hooks/useVoiceChat'

const STATUS_LABEL = {
  waiting: 'Waiting for the other person…',
  connecting: 'Connecting…',
  connected: 'Connected',
  reconnecting: 'Reconnecting…',
} as const

export function VoiceChat() {
  const mic = useMicrophone()
  const { remoteStream, status } = useVoiceChat(mic.stream)
  const isSpeakingLocally = useAudioLevel(mic.stream)
  const isSpeakingRemotely = useAudioLevel(remoteStream)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [volume, setVolume] = useState(1)

  useEffect(() => {
    if (audioRef.current) audioRef.current.srcObject = remoteStream
  }, [remoteStream])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  return (
    <section className="flex flex-col gap-2.5 rounded-lg border border-border bg-surface p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-300">
          🎤 {mic.error ? 'Microphone unavailable' : STATUS_LABEL[status]}
        </span>
        <button
          type="button"
          onClick={mic.toggleMute}
          disabled={!mic.stream}
          className={`rounded-md border px-3 py-1 text-xs font-medium transition disabled:opacity-50 ${
            mic.isMuted
              ? 'border-accent bg-accent/20 text-accent'
              : 'border-border text-gray-200 hover:bg-surface-hover'
          }`}
        >
          {mic.isMuted ? 'Unmute' : 'Mute'}
        </button>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex shrink-0 items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            <span
              className={`h-2 w-2 rounded-full ${isSpeakingLocally ? 'bg-online' : 'bg-offline'}`}
            />
            You
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className={`h-2 w-2 rounded-full ${isSpeakingRemotely ? 'bg-online' : 'bg-offline'}`}
            />
            Them
          </span>
        </div>

        <div className="flex max-w-32 flex-1 items-center gap-2">
          <span className="text-xs text-gray-500">🔊</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            style={{ accentColor: 'var(--color-accent)' }}
            className="h-1 flex-1 cursor-pointer"
          />
        </div>
      </div>

      <audio ref={audioRef} autoPlay />
    </section>
  )
}
