import { useEffect, useRef, useState } from 'react'
import { useChat } from '../hooks/useChat'
import { useRoom } from '../contexts/RoomContext'
import type { ChatMessage } from '../types/room'

const VISIBLE_MS = 4500
const REMOVE_MS = 5000

function ToastBubble({ message, isOwn }: { message: ChatMessage; isOwn: boolean }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const showFrame = requestAnimationFrame(() => setVisible(true))
    const hideTimer = setTimeout(() => setVisible(false), VISIBLE_MS)
    return () => {
      cancelAnimationFrame(showFrame)
      clearTimeout(hideTimer)
    }
  }, [])

  return (
    <div
      className={`max-w-full self-end rounded-2xl px-3 py-1.5 text-xs shadow-lg backdrop-blur transition-all duration-500 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
      } ${
        isOwn
          ? 'rounded-br-md bg-gradient-to-br from-accent/90 to-rose-600/90 text-white'
          : 'rounded-bl-md bg-black/65 text-gray-100'
      }`}
    >
      {!isOwn && <div className="mb-0.5 text-[10px] font-medium text-gray-300">{message.name}</div>}
      {message.text}
    </div>
  )
}

// View-only: sending a message while fullscreen means exiting fullscreen
// and using the normal chat panel. This overlay just surfaces new messages
// as brief, auto-dismissing notifications so you don't miss one.
export function FullscreenChatOverlay() {
  const { you } = useRoom()
  const { messages } = useChat()
  const [toasts, setToasts] = useState<ChatMessage[]>([])
  const seenCountRef = useRef(messages.length)

  useEffect(() => {
    if (messages.length > seenCountRef.current) {
      const newMessages = messages.slice(seenCountRef.current)
      setToasts((current) => [...current, ...newMessages])
      newMessages.forEach((message) => {
        setTimeout(() => {
          setToasts((current) => current.filter((toast) => toast.id !== message.id))
        }, REMOVE_MS)
      })
    }
    seenCountRef.current = messages.length
  }, [messages])

  if (toasts.length === 0) return null

  return (
    <div className="pointer-events-none absolute bottom-16 right-4 z-30 flex w-64 flex-col gap-1.5">
      {toasts.map((message) => (
        <ToastBubble key={message.id} message={message} isOwn={message.userId === you?.id} />
      ))}
    </div>
  )
}
