import { useState } from 'react'
import { useChat } from '../hooks/useChat'
import { useRoom } from '../contexts/RoomContext'

const VISIBLE_MESSAGE_COUNT = 5

export function FullscreenChatOverlay() {
  const { you } = useRoom()
  const { messages, sendMessage } = useChat()
  const [draft, setDraft] = useState('')
  const recent = messages.slice(-VISIBLE_MESSAGE_COUNT)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.trim()) return
    sendMessage(draft)
    setDraft('')
  }

  return (
    <div className="absolute bottom-16 right-4 z-30 flex w-64 flex-col gap-1.5">
      {recent.map((message) => {
        const isOwn = message.userId === you?.id
        return (
          <div
            key={message.id}
            className={`max-w-full self-end rounded-lg px-3 py-1.5 text-xs shadow-lg backdrop-blur ${
              isOwn ? 'bg-accent/90 text-white' : 'bg-black/60 text-gray-100'
            }`}
          >
            {!isOwn && (
              <div className="mb-0.5 text-[10px] font-medium text-gray-300">{message.name}</div>
            )}
            {message.text}
          </div>
        )
      })}

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Message…"
          className="w-full rounded-md border border-white/10 bg-black/60 px-2.5 py-1.5 text-xs text-gray-100 outline-none backdrop-blur placeholder:text-gray-500 focus:border-accent"
        />
      </form>
    </div>
  )
}
