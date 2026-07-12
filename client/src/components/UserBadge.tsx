interface UserBadgeProps {
  name: string
  online: boolean
}

export function UserBadge({ name, online }: UserBadgeProps) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-200">
      <span
        className={online ? 'h-2 w-2 rounded-full bg-online' : 'h-2 w-2 rounded-full bg-offline'}
      />
      {name}
    </div>
  )
}
