import { useEffect, useState } from 'react'
import { useSocket } from '../contexts/SocketContext'
import { useRoom } from '../contexts/RoomContext'
import type { useVideoPlayer } from './useVideoPlayer'

const DRIFT_THRESHOLD_SECONDS = 0.3
const SYNC_INTERVAL_MS = 4000

interface PresentedState {
  currentTime: number
  isPlaying: boolean
  duration: number
}

// The host's video is the only real, seekable copy of the movie (see
// useMovieBroadcast — everyone else just watches a live stream of it).
// So the host applies play/pause/seek directly to their own video element,
// while a viewer's controls only ever emit a request for the host to act
// on; the change then shows up automatically through the live stream a
// moment later. A viewer's own <video> has no meaningful duration/
// currentTime of its own (it's a live feed), so their progress bar reads
// from this synced "presented" state instead of their video element.
export function useVideoSync(player: ReturnType<typeof useVideoPlayer>) {
  const { socket } = useSocket()
  const { you } = useRoom()
  const isHost = !!you?.isHost
  const [presented, setPresented] = useState<PresentedState>({
    currentTime: 0,
    isPlaying: false,
    duration: 0,
  })

  useEffect(() => {
    function handleRemotePlay({ currentTime }: { currentTime: number }) {
      if (isHost) {
        const video = player.videoRef.current
        if (!video || !video.duration) return
        if (Math.abs(video.currentTime - currentTime) > DRIFT_THRESHOLD_SECONDS) {
          video.currentTime = currentTime
        }
        void video.play().catch(() => {})
      } else {
        setPresented((current) => ({ ...current, currentTime, isPlaying: true }))
      }
    }

    function handleRemotePause({ currentTime }: { currentTime: number }) {
      if (isHost) {
        const video = player.videoRef.current
        if (!video || !video.duration) return
        video.currentTime = currentTime
        video.pause()
      } else {
        setPresented((current) => ({ ...current, currentTime, isPlaying: false }))
      }
    }

    function handleRemoteSeek({ time }: { time: number }) {
      if (isHost) {
        const video = player.videoRef.current
        if (!video || !video.duration) return
        video.currentTime = time
      } else {
        setPresented((current) => ({ ...current, currentTime: time }))
      }
    }

    function handleRemoteSync({
      currentTime,
      isPlaying,
      duration,
    }: {
      currentTime: number
      isPlaying: boolean
      duration: number
    }) {
      if (isHost) return // the host is the one broadcasting this, not consuming it
      const video = player.videoRef.current
      if (video && Math.abs(video.currentTime - currentTime) > DRIFT_THRESHOLD_SECONDS) {
        video.currentTime = currentTime
      }
      setPresented({ currentTime, isPlaying, duration })
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
  }, [socket, player.videoRef, isHost])

  useEffect(() => {
    if (!isHost) return
    function emitSync() {
      const video = player.videoRef.current
      if (!video || !video.duration) return
      socket.emit('video:sync', {
        currentTime: video.currentTime,
        isPlaying: !video.paused,
        duration: video.duration,
      })
    }
    emitSync()
    const interval = setInterval(emitSync, SYNC_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [isHost, socket, player.videoRef, player.fileName])

  function handleTogglePlay() {
    if (isHost) {
      const video = player.videoRef.current
      if (!video) return
      if (video.paused) {
        player.play()
        socket.emit('video:play', { currentTime: video.currentTime })
      } else {
        player.pause()
        socket.emit('video:pause', { currentTime: video.currentTime })
      }
    } else {
      const next = !presented.isPlaying
      setPresented((current) => ({ ...current, isPlaying: next }))
      if (next) socket.emit('video:play', { currentTime: presented.currentTime })
      else socket.emit('video:pause', { currentTime: presented.currentTime })
    }
  }

  function handleSeek(time: number) {
    if (isHost) {
      player.seek(time)
      socket.emit('video:seek', { time })
    } else {
      setPresented((current) => ({ ...current, currentTime: time }))
      socket.emit('video:seek', { time })
    }
  }

  return { handleTogglePlay, handleSeek, presented, isHost }
}
