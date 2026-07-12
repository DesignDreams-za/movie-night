import { useEffect, useRef, useState, type DragEvent } from 'react'
import { useVideoPlayer } from '../hooks/useVideoPlayer'
import { useVideoSync } from '../hooks/useVideoSync'
import { useMovieBroadcast } from '../hooks/useMovieBroadcast'
import { useRoom } from '../contexts/RoomContext'
import { VideoControls } from './VideoControls'
import { FullscreenChatOverlay } from './FullscreenChatOverlay'
import { ReactionsOverlay } from './ReactionsOverlay'
import { FilmIcon, PauseIcon, PlayIcon } from './icons'

const IDLE_HIDE_MS = 2600

export function VideoPlayer() {
  const { room } = useRoom()
  const player = useVideoPlayer()
  const sync = useVideoSync(player)
  const movie = useMovieBroadcast(sync.isHost, player.videoRef, player.fileName)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [controlsVisible, setControlsVisible] = useState(true)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const hasContent = sync.isHost ? !!player.fileName : !!movie.incomingStream
  const isPlaying = sync.isHost ? player.isPlaying : sync.presented.isPlaying
  const currentTime = sync.isHost ? player.currentTime : sync.presented.currentTime
  const duration = sync.isHost ? player.duration : sync.presented.duration
  const hostName = room?.users.find((user) => user.isHost)?.name

  // Viewers don't load a file — their <video> just renders whatever the
  // host is streaming, so its srcObject is wired here instead of via drag-
  // and-drop, and it always plays (pausing would just freeze the local
  // render of a live feed, not actually pause anything for anyone).
  useEffect(() => {
    if (sync.isHost) return
    const video = player.videoRef.current
    if (!video) return
    if (video.srcObject !== movie.incomingStream) {
      video.srcObject = movie.incomingStream
      if (movie.incomingStream) void video.play().catch(() => {})
    }
  }, [sync.isHost, movie.incomingStream, player.videoRef])

  function scheduleHide() {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    if (isPlaying) {
      hideTimerRef.current = setTimeout(() => setControlsVisible(false), IDLE_HIDE_MS)
    }
  }

  function wakeControls() {
    setControlsVisible(true)
    scheduleHide()
  }

  useEffect(() => {
    if (!isPlaying) {
      setControlsVisible(true)
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    } else {
      scheduleHide()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying])

  useEffect(() => () => clearTimeout(hideTimerRef.current), [])

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDraggingOver(false)
    if (!sync.isHost) return
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('video/')) {
      player.loadFile(file)
    }
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) player.loadFile(file)
  }

  const showChrome = controlsVisible || !isPlaying

  return (
    <div
      data-video-container
      onMouseMove={wakeControls}
      onDragOver={(e) => {
        if (!sync.isHost) return
        e.preventDefault()
        setIsDraggingOver(true)
      }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={handleDrop}
      className={`group relative flex min-h-[320px] flex-1 flex-col justify-end overflow-hidden rounded-xl border bg-black transition-colors lg:h-full ${
        isDraggingOver ? 'border-accent' : 'border-border'
      } ${hasContent && !showChrome ? 'cursor-none' : ''}`}
    >
      <video
        ref={player.videoRef}
        onClick={hasContent ? sync.handleTogglePlay : undefined}
        className="absolute inset-0 h-full w-full"
      />

      {hasContent && (
        <div
          className={`pointer-events-none absolute inset-0 z-10 flex items-center justify-center transition-opacity duration-300 ${
            isPlaying ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <button
            type="button"
            onClick={sync.handleTogglePlay}
            className="pointer-events-auto flex h-16 w-16 items-center justify-center rounded-full bg-black/50 text-white shadow-2xl ring-1 ring-white/10 backdrop-blur transition hover:scale-105 hover:bg-black/60"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <PauseIcon className="h-7 w-7" />
            ) : (
              <PlayIcon className="ml-1 h-7 w-7" />
            )}
          </button>
        </div>
      )}

      {!hasContent && sync.isHost && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-gray-500 transition hover:text-gray-300"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-gray-700 transition group-hover:border-accent/60 group-hover:text-accent">
            <FilmIcon className="h-6 w-6" />
          </span>
          <span className="text-sm font-medium">Drag and drop a movie file here</span>
          <span className="text-xs text-gray-600">or click to browse</span>
        </button>
      )}

      {!hasContent && !sync.isHost && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-gray-500">
          <span className="flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-gray-700">
            <FilmIcon className="h-6 w-6" />
          </span>
          <span className="text-sm font-medium">
            Waiting for {hostName ?? 'the host'} to start the movie…
          </span>
          <span className="text-xs text-gray-600">It'll appear here automatically</span>
        </div>
      )}

      {sync.isHost && (
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileInputChange}
          className="hidden"
        />
      )}

      <ReactionsOverlay />

      {player.isFullscreen && <FullscreenChatOverlay />}

      {hasContent && (
        <div
          onMouseEnter={() => hideTimerRef.current && clearTimeout(hideTimerRef.current)}
          onMouseLeave={scheduleHide}
          className={`relative z-20 transition-opacity duration-300 ${
            showChrome ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          <VideoControls
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            volume={player.volume}
            isMuted={player.isMuted}
            isFullscreen={player.isFullscreen}
            onTogglePlay={sync.handleTogglePlay}
            onSeek={sync.handleSeek}
            onVolumeChange={player.changeVolume}
            onToggleMute={player.toggleMute}
            onToggleFullscreen={player.toggleFullscreen}
          />
        </div>
      )}
    </div>
  )
}
