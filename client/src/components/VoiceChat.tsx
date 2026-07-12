import { useEffect, useRef, useState } from 'react'
import { useMicrophone } from '../hooks/useMicrophone'
import { useAudioLevel } from '../hooks/useAudioLevel'
import { useVoiceChat } from '../hooks/useVoiceChat'
import { useRoom } from '../contexts/RoomContext'
import { PersonAvatar } from './PersonAvatar'

const STATUS_LABEL = {
  waiting: 'Waiting…',
  connecting: 'Connecting…',
  connected: 'Connected',
  reconnecting: 'Reconnecting…',
} as const

export function VoiceChat() {
  const { room, you } = useRoom()
  const mic = useMicrophone()
  const { remoteStream, status } = useVoiceChat(mic.stream)
  const isSpeakingLocally = useAudioLevel(mic.stream)
  const isSpeakingRemotely = useAudioLevel(remoteStream)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [volume, setVolume] = useState(1)

  const otherUser = room?.users.find((user) => user.id !== you?.id)

  useEffect(() => {
    if (audioRef.current) audioRef.current.srcObject = remoteStream
  }, [remoteStream])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  return (
    <section className="flex w-32 shrink-0 flex-col items-center gap-2.5 rounded-lg border border-border bg-surface p-3">
      <div className="flex gap-3">
        <PersonAvatar name={you?.name ?? 'You'} isSpeaking={isSpeakingLocally} isOnline={!!mic.stream} />
        <PersonAvatar
          name={otherUser?.name ?? 'Them'}
          isSpeaking={isSpeakingRemotely}
          isOnline={status === 'connected'}
        />
      </div>

      <button
        type="button"
        onClick={mic.toggleMute}
        disabled={!mic.stream}
        title={mic.isMuted ? 'Unmute' : 'Mute'}
        className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm transition disabled:opacity-50 ${
          mic.isMuted
            ? 'border-accent bg-accent/20 text-accent'
            : 'border-border text-gray-200 hover:bg-surface-hover'
        }`}
      >
        {mic.isMuted ? '🔇' : '🎤'}
      </button>

      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={volume}
        onChange={(e) => setVolume(Number(e.target.value))}
        style={{ accentColor: 'var(--color-accent)' }}
        className="h-1 w-full cursor-pointer"
        aria-label="Volume"
      />

      <span className="text-center text-[10px] leading-tight text-gray-500">
        {mic.error ? 'Mic unavailable' : STATUS_LABEL[status]}
      </span>

      <audio ref={audioRef} autoPlay />
    </section>
  )
}
