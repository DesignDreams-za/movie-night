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
}

export function PersonAvatar({ name, isSpeaking, isOnline, onForceMute }: PersonAvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || '?'

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br text-xs font-semibold text-white shadow-lg transition-all duration-200 ${gradientForName(name)} ${
            isOnline ? 'opacity-100' : 'opacity-35 grayscale'
          } ${isSpeaking ? 'ring-2 ring-online ring-offset-2 ring-offset-surface' : 'ring-2 ring-transparent'}`}
          style={
            isSpeaking
              ? { boxShadow: '0 0 0 4px rgba(34, 197, 94, 0.18), 0 0 14px rgba(34, 197, 94, 0.35)' }
              : undefined
          }
        >
          {initial}
        </div>
        {onForceMute && (
          <button
            type="button"
            onClick={onForceMute}
            title={`Mute ${name}`}
            className="absolute -right-1 -top-1 flex h-[18px] w-[18px] items-center justify-center rounded-full border border-border bg-surface text-gray-400 shadow transition hover:text-accent"
          >
            <MicOffIcon className="h-2.5 w-2.5" />
          </button>
        )}
      </div>
      <span className="max-w-[3.5rem] truncate text-[10px] text-gray-500">{name}</span>
    </div>
  )
}
