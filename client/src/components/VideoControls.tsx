import { PauseIcon, PlayIcon, MuteIcon, VolumeIcon, FullscreenIcon, ExitFullscreenIcon } from './icons'

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function trackFill(value: number, max: number): React.CSSProperties {
  const pct = max > 0 ? (value / max) * 100 : 0
  return {
    background: `linear-gradient(to right, var(--color-accent) ${pct}%, rgba(255,255,255,0.16) ${pct}%)`,
  }
}

const SLIDER_THUMB =
  '[&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_0_3px_rgba(236,72,153,0.35)] [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125'

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
    <div className="flex items-center gap-3 bg-gradient-to-t from-black/85 via-black/50 to-transparent px-4 pb-3 pt-8">
      <button
        type="button"
        onClick={onTogglePlay}
        className="text-gray-100 transition hover:scale-110 hover:text-accent"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="h-5 w-5" />}
      </button>

      <span className="w-10 shrink-0 text-right text-xs tabular-nums text-gray-300">
        {formatTime(currentTime)}
      </span>

      <input
        type="range"
        min={0}
        max={duration || 0}
        step={0.1}
        value={currentTime}
        onChange={(e) => onSeek(Number(e.target.value))}
        style={trackFill(currentTime, duration || 0)}
        className={`h-1 flex-1 cursor-pointer appearance-none rounded-full ${SLIDER_THUMB}`}
      />

      <span className="w-10 shrink-0 text-xs tabular-nums text-gray-300">
        {formatTime(duration)}
      </span>

      <button
        type="button"
        onClick={onToggleMute}
        className="text-gray-100 transition hover:scale-110 hover:text-accent"
        aria-label={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted || volume === 0 ? (
          <MuteIcon className="h-4 w-4" />
        ) : (
          <VolumeIcon className="h-4 w-4" />
        )}
      </button>

      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={isMuted ? 0 : volume}
        onChange={(e) => onVolumeChange(Number(e.target.value))}
        style={trackFill(isMuted ? 0 : volume, 1)}
        className={`h-1 w-20 cursor-pointer appearance-none rounded-full ${SLIDER_THUMB}`}
        aria-label="Volume"
      />

      <button
        type="button"
        onClick={onToggleFullscreen}
        className="text-gray-100 transition hover:scale-110 hover:text-accent"
        aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
      >
        {isFullscreen ? (
          <ExitFullscreenIcon className="h-4 w-4" />
        ) : (
          <FullscreenIcon className="h-4 w-4" />
        )}
      </button>
    </div>
  )
}
