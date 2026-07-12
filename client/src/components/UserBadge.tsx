interface UserBadgeProps {
  name: string
  online: boolean
  onKick?: () => void
}

export function UserBadge({ name, online, onKick }: UserBadgeProps) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-200">
      <span
        className={online ? 'h-2 w-2 rounded-full bg-online' : 'h-2 w-2 rounded-full bg-offline'}
      />
      {name}
      {onKick && (
        <button
          type="button"
          onClick={onKick}
          title={`Remove ${name}`}
          className="text-xs text-gray-500 hover:text-red-400"
        >
          ✕
        </button>
      )}
    </div>
  )
}
