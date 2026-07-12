import { CloseIcon } from './icons'

interface UserBadgeProps {
  name: string
  online: boolean
  onKick?: () => void
}

export function UserBadge({ name, online, onKick }: UserBadgeProps) {
  return (
    <div className="group flex items-center gap-2 rounded-full border border-transparent py-1 pl-1 pr-2.5 text-sm text-gray-200 transition hover:border-border">
      <span className="relative flex h-2 w-2">
        {online && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-online opacity-60" />
        )}
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${online ? 'bg-online' : 'bg-offline'}`}
        />
      </span>
      {name}
      {onKick && (
        <button
          type="button"
          onClick={onKick}
          title={`Remove ${name}`}
          className="text-gray-600 opacity-0 transition hover:text-red-400 group-hover:opacity-100"
        >
          <CloseIcon className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}
