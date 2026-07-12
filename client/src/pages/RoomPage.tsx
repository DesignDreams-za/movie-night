import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useRoom } from '../contexts/RoomContext'
import { UserBadge } from '../components/UserBadge'
import { VideoPlayer } from '../components/VideoPlayer'
import { VoiceChat } from '../components/VoiceChat'
import { ChatBox } from '../components/ChatBox'
import { useModeration } from '../hooks/useModeration'
import { PrivacyLink } from '../components/PrivacyLink'
import { RoomCodeChip } from '../components/RoomCodeChip'

export function RoomPage() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { room, you } = useRoom()
  const { kickUser } = useModeration()

  useEffect(() => {
    if (!room || room.code !== code) {
      navigate('/', { replace: true })
    }
  }, [room, code, navigate])

  if (!room || room.code !== code) return null

  return (
    <div className="flex min-h-full flex-col gap-4 p-4">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3 shadow-lg shadow-black/20">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold tracking-tight text-gray-100">Movie Night ❤️</h1>
          <RoomCodeChip code={room.code} />
        </div>
        <div className="flex items-center gap-1">
          {room.users.map((user) => (
            <UserBadge
              key={user.id}
              name={user.name}
              online={true}
              onKick={you?.isHost && user.id !== you.id ? () => kickUser(user.id) : undefined}
            />
          ))}
          {room.users.length < 2 && (
            <UserBadge name="Waiting for the other person…" online={false} />
          )}
        </div>
      </header>

      <VideoPlayer />

      <div className="flex items-start gap-4">
        <VoiceChat />
        <div className="min-w-0 flex-1">
          <ChatBox />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-600">Signed in as {you?.name}</p>
        <PrivacyLink />
      </div>
    </div>
  )
}
