interface PersonAvatarProps {
  name: string
  isSpeaking: boolean
  isOnline: boolean
}

export function PersonAvatar({ name, isSpeaking, isOnline }: PersonAvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || '?'

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold ring-2 transition ${
          isSpeaking ? 'ring-online' : 'ring-transparent'
        } ${isOnline ? 'bg-surface-hover text-gray-100' : 'bg-surface-hover/40 text-gray-600'}`}
      >
        {initial}
      </div>
      <span className="max-w-[3.5rem] truncate text-[10px] text-gray-500">{name}</span>
    </div>
  )
}
