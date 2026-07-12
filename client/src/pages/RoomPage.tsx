import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useRoom } from '../contexts/RoomContext'
import { UserBadge } from '../components/UserBadge'
import { VideoPlayer } from '../components/VideoPlayer'
import { VoiceChat } from '../components/VoiceChat'
import { WebcamBubbles } from '../components/WebcamBubbles'
import { ChatBox } from '../components/ChatBox'
import { useModeration } from '../hooks/useModeration'
import { useMicrophone } from '../hooks/useMicrophone'
import { useCamera } from '../hooks/useCamera'
import { useVoiceChat } from '../hooks/useVoiceChat'
import { PrivacyLink } from '../components/PrivacyLink'
import { RoomCodeChip } from '../components/RoomCodeChip'

export function RoomPage() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { room, you } = useRoom()
  const { kickUser } = useModeration()

  // Owned here rather than inside VoiceChat/WebcamBubbles: a call is one set
  // of peer connections carrying both audio and video, so whatever consumes
  // the mic must share the exact same connections as whatever consumes the
  // camera, not create a second, competing set.
  const mic = useMicrophone()
  const camera = useCamera()
  const { remoteAudioStreams, remoteVideoStreams, peerStatuses } = useVoiceChat(
    mic.stream,
    camera.stream,
  )

  useEffect(() => {
    if (!room || room.code !== code) {
      navigate('/', { replace: true })
    }
  }, [room, code, navigate])

  if (!room || room.code !== code) return null

  return (
    <div className="flex min-h-full flex-col gap-4 p-4 lg:h-full">
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

      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
        <VideoPlayer />

        <aside className="flex w-full flex-col gap-4 lg:h-full lg:w-80 lg:shrink-0">
          <VoiceChat mic={mic} remoteAudioStreams={remoteAudioStreams} peerStatuses={peerStatuses} />
          <div className="min-h-0 lg:flex-1">
            <ChatBox />
          </div>
        </aside>
      </div>

      <WebcamBubbles camera={camera} remoteVideoStreams={remoteVideoStreams} />

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-600">Signed in as {you?.name}</p>
        <PrivacyLink />
      </div>
    </div>
  )
}
