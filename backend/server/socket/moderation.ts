import type { Server, Socket } from 'socket.io'
import { getRoom, removeUserBySocketId } from './roomStore.js'
import type { ClientToServerEvents, ServerToClientEvents, SocketData } from './types.js'

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, object, SocketData>
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, object, SocketData>

function isRequesterHost(socket: TypedSocket): boolean {
  const code = socket.data.roomCode
  if (!code) return false
  return !!getRoom(code)?.users.find((user) => user.id === socket.id)?.isHost
}

export function registerModerationHandlers(io: TypedServer, socket: TypedSocket) {
  socket.on('room:kick', ({ userId }) => {
    const code = socket.data.roomCode
    if (!code || userId === socket.id || !isRequesterHost(socket)) return

    const targetSocket = io.sockets.sockets.get(userId)
    targetSocket?.emit('room:kicked')
    targetSocket?.leave(code)

    const result = removeUserBySocketId(userId)
    if (result) io.to(code).emit('user:left', result.userId)

    targetSocket?.disconnect(true)
  })

  socket.on('room:mute-user', ({ userId }) => {
    if (userId === socket.id || !isRequesterHost(socket)) return
    io.sockets.sockets.get(userId)?.emit('room:force-muted')
  })
}
