import { useEffect, useRef, useState } from 'react'
import { useChat } from '../hooks/useChat'
import { useRoom } from '../contexts/RoomContext'
import { SendIcon } from './icons'

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function ChatBox() {
  const { you } = useRoom()
  const { messages, sendMessage } = useChat()
  const [draft, setDraft] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.trim()) return
    sendMessage(draft)
    setDraft('')
  }

  return (
    <section className="flex flex-col rounded-xl border border-border bg-surface p-3.5 shadow-lg shadow-black/20">
      <div ref={listRef} className="mb-2 flex max-h-56 flex-col gap-2.5 overflow-y-auto">
        {messages.length === 0 && (
          <p className="py-1 text-xs text-gray-600">No messages yet — say hi 👋</p>
        )}
        {messages.map((message) => {
          const isOwn = message.userId === you?.id
          return (
            <div
              key={message.id}
              className={`animate-fade-in-up flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
            >
              <span className="mb-0.5 text-[10px] text-gray-500">
                {message.name} · {formatTime(message.timestamp)}
              </span>
              <span
                className={`max-w-[80%] rounded-2xl px-3 py-1.5 text-sm leading-snug shadow-sm ${
                  isOwn
                    ? 'rounded-br-md bg-gradient-to-br from-accent to-rose-600 text-white'
                    : 'rounded-bl-md bg-surface-hover text-gray-100'
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
          className="flex-1 rounded-full border border-border bg-background px-4 py-1.5 text-sm text-gray-100 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-rose-600 text-white shadow transition hover:scale-105 hover:shadow-accent/30 disabled:pointer-events-none disabled:opacity-40"
          aria-label="Send"
        >
          <SendIcon className="h-3.5 w-3.5" />
        </button>
      </form>
    </section>
  )
}
