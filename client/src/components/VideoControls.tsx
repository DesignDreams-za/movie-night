function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

interface VideoControlsProps {
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  isFullscreen: boolean
  onTogglePlay: () => void
  onSeek: (time: number) => void
  onVolumeChange: (value: number) => void
  onToggleMute: () => void
  onToggleFullscreen: () => void
}

export function VideoControls({
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  isFullscreen,
  onTogglePlay,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onToggleFullscreen,
}: VideoControlsProps) {
  return (
    <div className="flex items-center gap-3 bg-black/70 px-4 py-2 backdrop-blur">
      <button
        type="button"
        onClick={onTogglePlay}
        className="text-lg text-gray-100 hover:text-accent"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>

      <span className="w-10 shrink-0 text-right text-xs text-gray-400">
        {formatTime(currentTime)}
      </span>

      <input
        type="range"
        min={0}
        max={duration || 0}
        step={0.1}
        value={currentTime}
        onChange={(e) => onSeek(Number(e.target.value))}
        style={{ accentColor: 'var(--color-accent)' }}
        className="h-1 flex-1 cursor-pointer"
      />

      <span className="w-10 shrink-0 text-xs text-gray-400">{formatTime(duration)}</span>

      <button
        type="button"
        onClick={onToggleMute}
        className="text-sm text-gray-100 hover:text-accent"
        aria-label={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted || volume === 0 ? '🔇' : '🔊'}
      </button>

      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={isMuted ? 0 : volume}
        onChange={(e) => onVolumeChange(Number(e.target.value))}
        style={{ accentColor: 'var(--color-accent)' }}
        className="h-1 w-20 cursor-pointer"
      />

      <button
        type="button"
        onClick={onToggleFullscreen}
        className="text-sm text-gray-100 hover:text-accent"
        aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
      >
        {isFullscreen ? '⤡' : '⤢'}
      </button>
    </div>
  )
}
