import { useEffect, useRef, useState, type DragEvent } from 'react'
import { useVideoPlayer } from '../hooks/useVideoPlayer'
import { useVideoSync } from '../hooks/useVideoSync'
import { VideoControls } from './VideoControls'
import { FullscreenChatOverlay } from './FullscreenChatOverlay'
import { ReactionsOverlay } from './ReactionsOverlay'
import { FilmIcon, PauseIcon, PlayIcon } from './icons'

const IDLE_HIDE_MS = 2600

export function VideoPlayer() {
  const player = useVideoPlayer()
  const sync = useVideoSync(player)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [controlsVisible, setControlsVisible] = useState(true)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  function scheduleHide() {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    if (player.isPlaying) {
      hideTimerRef.current = setTimeout(() => setControlsVisible(false), IDLE_HIDE_MS)
    }
  }

  function wakeControls() {
    setControlsVisible(true)
    scheduleHide()
  }

  useEffect(() => {
    if (!player.isPlaying) {
      setControlsVisible(true)
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    } else {
      scheduleHide()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player.isPlaying])

  useEffect(() => () => clearTimeout(hideTimerRef.current), [])

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDraggingOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('video/')) {
      player.loadFile(file)
    }
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) player.loadFile(file)
  }

  const showChrome = controlsVisible || !player.isPlaying

  return (
    <div
      data-video-container
      onMouseMove={wakeControls}
      onDragOver={(e) => {
        e.preventDefault()
        setIsDraggingOver(true)
      }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={handleDrop}
      className={`group relative flex min-h-[320px] flex-1 flex-col justify-end overflow-hidden rounded-xl border bg-black transition-colors lg:h-full ${
        isDraggingOver ? 'border-accent' : 'border-border'
      } ${player.fileName && !showChrome ? 'cursor-none' : ''}`}
    >
      <video
        ref={player.videoRef}
        onClick={player.fileName ? sync.handleTogglePlay : undefined}
        className="absolute inset-0 h-full w-full"
      />

      {player.fileName && (
        <div
          className={`pointer-events-none absolute inset-0 z-10 flex items-center justify-center transition-opacity duration-300 ${
            player.isPlaying ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <button
            type="button"
            onClick={sync.handleTogglePlay}
            className="pointer-events-auto flex h-16 w-16 items-center justify-center rounded-full bg-black/50 text-white shadow-2xl ring-1 ring-white/10 backdrop-blur transition hover:scale-105 hover:bg-black/60"
            aria-label={player.isPlaying ? 'Pause' : 'Play'}
          >
            {player.isPlaying ? (
              <PauseIcon className="h-7 w-7" />
            ) : (
              <PlayIcon className="ml-1 h-7 w-7" />
            )}
          </button>
        </div>
      )}

      {!player.fileName && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-gray-500 transition hover:text-gray-300"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-gray-700 transition group-hover:border-accent/60 group-hover:text-accent">
            <FilmIcon className="h-6 w-6" />
          </span>
          {sync.otherFileInfo ? (
            <>
              <span className="text-sm font-medium text-gray-300">
                {sync.otherFileInfo.name} loaded &ldquo;{sync.otherFileInfo.fileName}&rdquo;
              </span>
              <span className="text-xs text-gray-600">
                Drop the same file here so you're both watching it
              </span>
            </>
          ) : (
            <>
              <span className="text-sm font-medium">Drag and drop a movie file here</span>
              <span className="text-xs text-gray-600">or click to browse</span>
            </>
          )}
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      <ReactionsOverlay />

      {player.isFullscreen && <FullscreenChatOverlay />}

      {player.fileName && (
        <div
          onMouseEnter={() => hideTimerRef.current && clearTimeout(hideTimerRef.current)}
          onMouseLeave={scheduleHide}
          className={`relative z-20 transition-opacity duration-300 ${
            showChrome ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          <VideoControls
            isPlaying={player.isPlaying}
            currentTime={player.currentTime}
            duration={player.duration}
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
