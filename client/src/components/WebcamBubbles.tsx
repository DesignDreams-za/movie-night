import { useEffect, useRef } from 'react'
import { useRoom } from '../contexts/RoomContext'
import type { useCamera } from '../hooks/useCamera'
import { CameraIcon, CameraOffIcon } from './icons'

interface BubbleProps {
  stream: MediaStream
  name: string
  mirrored?: boolean
}

function Bubble({ stream, name, mirrored }: BubbleProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream
  }, [stream])

  return (
    <div className="flex flex-col items-center gap-1.5">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={mirrored ? { transform: 'scaleX(-1)' } : undefined}
        className="h-32 w-32 rounded-full border-2 border-border object-cover shadow-lg shadow-black/30"
      />
      <span className="max-w-[8rem] truncate text-xs text-gray-400">{name}</span>
    </div>
  )
}

interface WebcamBubblesProps {
  camera: ReturnType<typeof useCamera>
  remoteVideoStreams: Record<string, MediaStream>
}

// Deliberately NOT rendered inside the video container: anything outside
// the fullscreened element is hidden by the browser while fullscreen, so
// placing this here means the bubbles only ever show in the normal page
// view, with no extra fullscreen-detection logic needed. Wrapped in the
// same bordered-card treatment as the voice/chat panels so it reads as a
// real, stable part of the layout instead of a couple of stray circles
// that only sometimes have something in them.
export function WebcamBubbles({ camera, remoteVideoStreams }: WebcamBubblesProps) {
  const { room, you } = useRoom()
  const others = room?.users.filter((user) => user.id !== you?.id) ?? []

  return (
    <section className="flex flex-wrap items-center justify-center gap-6 rounded-xl border border-border bg-surface p-4 shadow-lg shadow-black/20">
      <div className="relative">
        {camera.isEnabled && camera.stream ? (
          <Bubble stream={camera.stream} name="You" mirrored />
        ) : (
          <button
            type="button"
            onClick={camera.toggle}
            title="Turn on camera"
            className="flex h-32 w-32 flex-col items-center justify-center gap-2 rounded-full border-2 border-dashed border-gray-700 text-gray-500 transition hover:border-accent/60 hover:text-accent"
          >
            <CameraIcon className="h-8 w-8" />
            <span className="text-xs">Turn on camera</span>
          </button>
        )}
        {camera.isEnabled && (
          <button
            type="button"
            onClick={camera.toggle}
            title="Turn off camera"
            className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface/90 text-gray-300 shadow transition hover:text-accent"
          >
            <CameraOffIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {others.map((user) =>
        remoteVideoStreams[user.id] ? (
          <Bubble key={user.id} stream={remoteVideoStreams[user.id]} name={user.name} />
        ) : null,
      )}
    </section>
  )
}
