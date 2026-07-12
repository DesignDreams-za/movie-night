import { useEffect, useState } from 'react'
import { useSocket } from '../contexts/SocketContext'
import type { ChatMessage } from '../types/room'

export function useChat() {
  const { socket } = useSocket()
  const [messages, setMessages] = useState<ChatMessage[]>([])

  useEffect(() => {
    function handleMessage(message: ChatMessage) {
      setMessages((current) => [...current, message])
    }

    socket.on('chat:message', handleMessage)
    return () => {
      socket.off('chat:message', handleMessage)
    }
  }, [socket])

  function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return
    socket.emit('chat:message', { text: trimmed })
  }

  return { messages, sendMessage }
}
