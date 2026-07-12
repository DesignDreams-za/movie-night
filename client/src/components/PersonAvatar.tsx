import { useEffect, useRef } from 'react'
import { MicOffIcon } from './icons'

const AVATAR_GRADIENTS = [
  'from-pink-500 to-rose-600',
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-500',
  'from-amber-500 to-orange-600',
  'from-emerald-500 to-teal-600',
  'from-fuchsia-500 to-pink-600',
]

function gradientForName(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length]
}

interface PersonAvatarProps {
  name: string
  isSpeaking: boolean
  isOnline: boolean
  onForceMute?: () => void
  videoStream?: MediaStream | null
  mirrored?: boolean
}

export function PersonAvatar({
  name,
  isSpeaking,
  isOnline,
  onForceMute,
  videoStream,
  mirrored,
}: PersonAvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || '?'
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = videoStream ?? null
  }, [videoStream])

  const ringClasses = isSpeaking
    ? 'ring-2 ring-online ring-offset-2 ring-offset-surface'
    : 'ring-2 ring-transparent'

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative">
        {videoStream ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={mirrored ? { transform: 'scaleX(-1)' } : undefined}
            className={`h-14 w-14 rounded-full border border-border object-cover shadow-lg transition-all duration-200 ${ringClasses}`}
          />
        ) : (
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br text-sm font-semibold text-white shadow-lg transition-all duration-200 ${gradientForName(name)} ${
              isOnline ? 'opacity-100' : 'opacity-35 grayscale'
            } ${ringClasses}`}
            style={
              isSpeaking
                ? { boxShadow: '0 0 0 4px rgba(34, 197, 94, 0.18), 0 0 14px rgba(34, 197, 94, 0.35)' }
                : undefined
            }
          >
            {initial}
          </div>
        )}
        {onForceMute && (
          <button
            type="button"
            onClick={onForceMute}
            title={`Mute ${name}`}
            className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-surface text-gray-400 shadow transition hover:text-accent"
          >
            <MicOffIcon className="h-3 w-3" />
          </button>
        )}
      </div>
      <span className="max-w-[4rem] truncate text-[10px] text-gray-500">{name}</span>
    </div>
  )
}
