import { useSocket } from '../contexts/SocketContext'

export function useModeration() {
  const { socket } = useSocket()

  function kickUser(userId: string) {
    socket.emit('room:kick', { userId })
  }

  function muteUser(userId: string) {
    socket.emit('room:mute-user', { userId })
  }

  return { kickUser, muteUser }
}
