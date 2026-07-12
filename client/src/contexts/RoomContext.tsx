import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useSocket } from './SocketContext'
import type { RoomState, RoomUser } from '../types/room'

interface RoomContextValue {
  room: RoomState | null
  you: RoomUser | null
  error: string | null
  createRoom: (name: string) => Promise<RoomState | null>
  joinRoom: (code: string, name: string) => Promise<RoomState | null>
}

const RoomContext = createContext<RoomContextValue | null>(null)

export function RoomProvider({ children }: { children: ReactNode }) {
  const { socket } = useSocket()
  const [room, setRoom] = useState<RoomState | null>(null)
  const [you, setYou] = useState<RoomUser | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    function handleUserJoined(user: RoomUser) {
      setRoom((current) => (current ? { ...current, users: [...current.users, user] } : current))
    }

    function handleUserLeft(userId: string) {
      setRoom((current) =>
        current ? { ...current, users: current.users.filter((u) => u.id !== userId) } : current,
      )
    }

    function handleKicked() {
      setRoom(null)
      setYou(null)
      setError('You were removed from the room by the host.')
    }

    socket.on('user:joined', handleUserJoined)
    socket.on('user:left', handleUserLeft)
    socket.on('room:kicked', handleKicked)

    return () => {
      socket.off('user:joined', handleUserJoined)
      socket.off('user:left', handleUserLeft)
      socket.off('room:kicked', handleKicked)
    }
  }, [socket])

  function createRoom(name: string) {
    setError(null)
    return new Promise<RoomState | null>((resolve) => {
      socket.emit('room:create', { name }, (result) => {
        if (!result.ok) {
          setError(result.error)
          resolve(null)
          return
        }
        setRoom(result.room)
        setYou(result.you)
        resolve(result.room)
      })
    })
  }

  function joinRoom(code: string, name: string) {
    setError(null)
    return new Promise<RoomState | null>((resolve) => {
      socket.emit('room:join', { code: code.trim().toUpperCase(), name }, (result) => {
        if (!result.ok) {
          setError(result.error)
          resolve(null)
          return
        }
        setRoom(result.room)
        setYou(result.you)
        resolve(result.room)
      })
    })
  }

  return (
    <RoomContext.Provider value={{ room, you, error, createRoom, joinRoom }}>
      {children}
    </RoomContext.Provider>
  )
}

export function useRoom() {
  const context = useContext(RoomContext)
  if (!context) throw new Error('useRoom must be used within a RoomProvider')
  return context
}
