interface PersonAvatarProps {
  name: string
  isSpeaking: boolean
  isOnline: boolean
  onForceMute?: () => void
}

export function PersonAvatar({ name, isSpeaking, isOnline, onForceMute }: PersonAvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || '?'

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold ring-2 transition ${
            isSpeaking ? 'ring-online' : 'ring-transparent'
          } ${isOnline ? 'bg-surface-hover text-gray-100' : 'bg-surface-hover/40 text-gray-600'}`}
        >
          {initial}
        </div>
        {onForceMute && (
          <button
            type="button"
            onClick={onForceMute}
            title={`Mute ${name}`}
            className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-surface text-[9px] leading-none text-gray-400 hover:text-accent"
          >
            🔇
          </button>
        )}
      </div>
      <span className="max-w-[3.5rem] truncate text-[10px] text-gray-500">{name}</span>
    </div>
  )
}
