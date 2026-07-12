import { useRef, useState, type DragEvent } from 'react'
import { useVideoPlayer } from '../hooks/useVideoPlayer'
import { VideoControls } from './VideoControls'

export function VideoPlayer() {
  const player = useVideoPlayer()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDraggingOver, setIsDraggingOver] = useState(false)

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

  return (
    <div
      data-video-container
      onDragOver={(e) => {
        e.preventDefault()
        setIsDraggingOver(true)
      }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={handleDrop}
      className={`relative flex min-h-[320px] flex-1 flex-col justify-end overflow-hidden rounded-lg border bg-black ${
        isDraggingOver ? 'border-accent' : 'border-border'
      }`}
    >
      <video ref={player.videoRef} className="absolute inset-0 h-full w-full" />

      {!player.fileName && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-gray-300"
        >
          <span className="text-sm">Drag and drop a movie file here</span>
          <span className="text-xs text-gray-600">or click to browse</span>
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {player.fileName && (
        <VideoControls
          isPlaying={player.isPlaying}
          currentTime={player.currentTime}
          duration={player.duration}
          volume={player.volume}
          isMuted={player.isMuted}
          isFullscreen={player.isFullscreen}
          onTogglePlay={player.togglePlay}
          onSeek={player.seek}
          onVolumeChange={player.changeVolume}
          onToggleMute={player.toggleMute}
          onToggleFullscreen={player.toggleFullscreen}
        />
      )}
    </div>
  )
}
