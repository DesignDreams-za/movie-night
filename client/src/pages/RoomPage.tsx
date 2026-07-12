import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useRoom } from '../contexts/RoomContext'
import { UserBadge } from '../components/UserBadge'
import { VideoPlayer } from '../components/VideoPlayer'
import { VoiceChat } from '../components/VoiceChat'
import { ChatBox } from '../components/ChatBox'

export function RoomPage() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { room, you } = useRoom()

  useEffect(() => {
    if (!room || room.code !== code) {
      navigate('/', { replace: true })
    }
  }, [room, code, navigate])

  if (!room || room.code !== code) return null

  return (
    <div className="flex min-h-full flex-col gap-4 p-4">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-gray-100">Movie Night ❤️</h1>
          <span className="rounded-md border border-border px-2 py-0.5 text-xs tracking-widest text-gray-400">
            Room: {room.code}
          </span>
        </div>
        <div className="flex items-center gap-4">
          {room.users.map((user) => (
            <UserBadge key={user.id} name={user.name} online={true} />
          ))}
          {room.users.length < 2 && <UserBadge name="Waiting for the other person…" online={false} />}
        </div>
      </header>

      <VideoPlayer />

      <div className="grid gap-4 sm:grid-cols-2">
        <VoiceChat />
        <ChatBox />
      </div>

      <p className="text-xs text-gray-600">Signed in as {you?.name}</p>
    </div>
  )
}
