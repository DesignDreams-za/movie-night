import { useEffect, useRef, useState } from 'react'
import { useAudioLevel } from '../hooks/useAudioLevel'
import type { useMicrophone } from '../hooks/useMicrophone'
import type { PeerStatus } from '../hooks/useVoiceChat'
import { useModeration } from '../hooks/useModeration'
import { useRoom } from '../contexts/RoomContext'
import { PersonAvatar } from './PersonAvatar'
import { MicIcon, MicOffIcon, VolumeIcon } from './icons'

interface RemoteParticipantProps {
  name: string
  stream: MediaStream | null
  status: PeerStatus | undefined
  volume: number
  onForceMute?: () => void
}

function RemoteParticipant({ name, stream, status, volume, onForceMute }: RemoteParticipantProps) {
  const isSpeaking = useAudioLevel(stream)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    if (audioRef.current) audioRef.current.srcObject = stream
  }, [stream])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  return (
    <>
      <PersonAvatar
        name={name}
        isSpeaking={isSpeaking}
        isOnline={status === 'connected'}
        onForceMute={onForceMute}
      />
      <audio ref={audioRef} autoPlay />
    </>
  )
}

interface VoiceChatProps {
  mic: ReturnType<typeof useMicrophone>
  remoteAudioStreams: Record<string, MediaStream>
  peerStatuses: Record<string, PeerStatus>
}

export function VoiceChat({ mic, remoteAudioStreams, peerStatuses }: VoiceChatProps) {
  const { room, you } = useRoom()
  const { muteUser } = useModeration()
  const isSpeakingLocally = useAudioLevel(mic.stream)
  const [volume, setVolume] = useState(1)

  const others = room?.users.filter((user) => user.id !== you?.id) ?? []
  const anyConnecting = others.some(
    (user) => peerStatuses[user.id] && peerStatuses[user.id] !== 'connected',
  )

  const statusLabel = mic.error
    ? 'Mic unavailable'
    : others.length === 0
      ? 'Waiting…'
      : anyConnecting
        ? 'Connecting…'
        : 'Connected'

  return (
    <section className="flex w-full shrink-0 flex-col gap-3 rounded-xl border border-border bg-surface p-3.5 shadow-lg shadow-black/20">
      <div className="flex flex-wrap gap-4">
        <PersonAvatar
          name={you?.name ?? 'You'}
          isSpeaking={isSpeakingLocally}
          isOnline={!!mic.stream}
        />
        {others.map((user) => (
          <RemoteParticipant
            key={user.id}
            name={user.name}
            stream={remoteAudioStreams[user.id] ?? null}
            status={peerStatuses[user.id]}
            volume={volume}
            onForceMute={you?.isHost ? () => muteUser(user.id) : undefined}
          />
        ))}
      </div>

      <div className="flex items-center gap-3 border-t border-border pt-3">
        <button
          type="button"
          onClick={mic.toggleMute}
          disabled={!mic.stream}
          title={mic.isMuted ? 'Unmute' : 'Mute'}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition disabled:opacity-40 ${
            mic.isMuted
              ? 'border-accent/40 bg-accent/15 text-accent'
              : 'border-border text-gray-200 hover:bg-surface-hover'
          }`}
        >
          {mic.isMuted ? <MicOffIcon className="h-4 w-4" /> : <MicIcon className="h-4 w-4" />}
        </button>

        <div className="flex flex-1 items-center gap-1.5">
          <VolumeIcon className="h-3.5 w-3.5 shrink-0 text-gray-500" />
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
        </div>

        <span className="shrink-0 text-[10px] leading-tight text-gray-500">{statusLabel}</span>
      </div>
    </section>
  )
}
