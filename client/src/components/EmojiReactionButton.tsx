import { useState } from 'react'
import { useSendReaction } from '../hooks/useReactions'

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '👏', '🎉', '🔥', '😢']

export function EmojiReactionButton() {
  const sendReaction = useSendReaction()
  const [open, setOpen] = useState(false)

  function handlePick(emoji: string) {
    sendReaction(emoji)
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base transition hover:bg-surface-hover"
        aria-label="Send a reaction"
      >
        😊
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close reaction picker"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div className="animate-fade-in-up absolute bottom-full left-0 z-50 mb-2 grid w-44 grid-cols-4 gap-1 rounded-xl border border-border bg-surface p-2 shadow-2xl shadow-black/40">
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handlePick(emoji)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-xl transition hover:bg-surface-hover"
              >
                {emoji}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
