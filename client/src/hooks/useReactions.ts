import { useEffect, useState } from 'react'
import { useSocket } from '../contexts/SocketContext'
import type { ReactionPayload } from '../types/room'

export interface FloatingReaction extends ReactionPayload {
  drift: number
}

const LIFETIME_MS = 2200

// Ephemeral, no history — each floating reaction removes itself after it
// finishes animating. Send and receive are split into two hooks since the
// emoji picker only needs to emit, while the video overlay only needs the
// incoming feed.
export function useReactionFeed() {
  const { socket } = useSocket()
  const [reactions, setReactions] = useState<FloatingReaction[]>([])

  useEffect(() => {
    function handleReaction(payload: ReactionPayload) {
      const drift = Math.round((Math.random() - 0.5) * 40)
      setReactions((current) => [...current, { ...payload, drift }])
      setTimeout(() => {
        setReactions((current) => current.filter((r) => r.id !== payload.id))
      }, LIFETIME_MS)
    }

    socket.on('reaction:receive', handleReaction)
    return () => {
      socket.off('reaction:receive', handleReaction)
    }
  }, [socket])

  return reactions
}

export function useSendReaction() {
  const { socket } = useSocket()
  return (emoji: string) => socket.emit('reaction:send', { emoji })
}
