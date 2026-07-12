import { useReactionFeed } from '../hooks/useReactions'

export function ReactionsOverlay() {
  const reactions = useReactionFeed()

  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      {reactions.map((reaction) => (
        <span
          key={reaction.id}
          style={{ '--drift': `${reaction.drift}px` } as React.CSSProperties}
          className="animate-reaction-float absolute bottom-16 right-10 text-4xl drop-shadow-lg"
        >
          {reaction.emoji}
        </span>
      ))}
    </div>
  )
}
