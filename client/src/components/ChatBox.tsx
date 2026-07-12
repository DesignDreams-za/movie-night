import { useEffect, useRef, useState } from 'react'
import { useChat } from '../hooks/useChat'
import { useRoom } from '../contexts/RoomContext'

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function ChatBox() {
  const { you } = useRoom()
  const { messages, sendMessage } = useChat()
  const [draft, setDraft] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.trim()) return
    sendMessage(draft)
    setDraft('')
  }

  return (
    <section className="flex flex-col rounded-lg border border-border bg-surface p-3">
      <div ref={listRef} className="mb-2 flex max-h-56 flex-col gap-2 overflow-y-auto">
        {messages.length === 0 && (
          <p className="py-1 text-xs text-gray-600">No messages yet — say hi 👋</p>
        )}
        {messages.map((message) => {
          const isOwn = message.userId === you?.id
          return (
            <div key={message.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
              <span className="text-[10px] text-gray-500">
                {message.name} · {formatTime(message.timestamp)}
              </span>
              <span
                className={`max-w-[80%] rounded-lg px-3 py-1.5 text-sm ${
                  isOwn ? 'bg-accent text-white' : 'bg-surface-hover text-gray-100'
                }`}
              >
                {message.text}
              </span>
            </div>
          )
        })}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Message…"
          className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-gray-100 outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white transition hover:bg-accent-hover disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </section>
  )
}
