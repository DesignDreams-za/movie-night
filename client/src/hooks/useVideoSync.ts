import { useEffect } from 'react'
import { useSocket } from '../contexts/SocketContext'
import { useRoom } from '../contexts/RoomContext'
import type { useVideoPlayer } from './useVideoPlayer'

const DRIFT_THRESHOLD_SECONDS = 0.3
const SYNC_INTERVAL_MS = 4000

// Either person can play/pause/seek — every action broadcasts to the other
// player. The host additionally broadcasts a periodic snapshot so both
// players reconcile if they've quietly drifted apart.
export function useVideoSync(player: ReturnType<typeof useVideoPlayer>) {
  const { socket } = useSocket()
  const { you } = useRoom()

  useEffect(() => {
    function handleRemotePlay({ currentTime }: { currentTime: number }) {
      const video = player.videoRef.current
      if (!video || !video.duration) return
      if (Math.abs(video.currentTime - currentTime) > DRIFT_THRESHOLD_SECONDS) {
        video.currentTime = currentTime
      }
      void video.play().catch(() => {})
    }

    function handleRemotePause({ currentTime }: { currentTime: number }) {
      const video = player.videoRef.current
      if (!video || !video.duration) return
      video.currentTime = currentTime
      video.pause()
    }

    function handleRemoteSeek({ time }: { time: number }) {
      const video = player.videoRef.current
      if (!video || !video.duration) return
      video.currentTime = time
    }

    function handleRemoteSync({ currentTime, isPlaying }: { currentTime: number; isPlaying: boolean }) {
      const video = player.videoRef.current
      if (!video || !video.duration) return
      if (Math.abs(video.currentTime - currentTime) > DRIFT_THRESHOLD_SECONDS) {
        video.currentTime = currentTime
      }
      if (isPlaying && video.paused) void video.play().catch(() => {})
      if (!isPlaying && !video.paused) video.pause()
    }

    socket.on('video:play', handleRemotePlay)
    socket.on('video:pause', handleRemotePause)
    socket.on('video:seek', handleRemoteSeek)
    socket.on('video:sync', handleRemoteSync)

    return () => {
      socket.off('video:play', handleRemotePlay)
      socket.off('video:pause', handleRemotePause)
      socket.off('video:seek', handleRemoteSeek)
      socket.off('video:sync', handleRemoteSync)
    }
  }, [socket, player.videoRef])

  useEffect(() => {
    if (!you?.isHost) return
    const interval = setInterval(() => {
      const video = player.videoRef.current
      if (!video || !video.duration) return
      socket.emit('video:sync', { currentTime: video.currentTime, isPlaying: !video.paused })
    }, SYNC_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [you?.isHost, socket, player.videoRef])

  function handleTogglePlay() {
    const video = player.videoRef.current
    if (!video) return
    if (video.paused) {
      player.play()
      socket.emit('video:play', { currentTime: video.currentTime })
    } else {
      player.pause()
      socket.emit('video:pause', { currentTime: video.currentTime })
    }
  }

  function handleSeek(time: number) {
    player.seek(time)
    socket.emit('video:seek', { time })
  }

  return { handleTogglePlay, handleSeek }
}
