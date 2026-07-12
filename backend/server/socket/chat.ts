import { randomUUID } from 'node:crypto'
import type { Server, Socket } from 'socket.io'
import { getRoom } from './roomStore.js'
import type { ClientToServerEvents, ServerToClientEvents, SocketData } from './types.js'

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, object, SocketData>
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, object, SocketData>

export function registerChatHandlers(io: TypedServer, socket: TypedSocket) {
  socket.on('chat:message', ({ text }) => {
    const code = socket.data.roomCode
    if (!code) return

    const trimmed = text.trim()
    if (!trimmed) return

    const room = getRoom(code)
    const sender = room?.users.find((user) => user.id === socket.id)
    if (!sender) return

    io.to(code).emit('chat:message', {
      id: randomUUID(),
      userId: sender.id,
      name: sender.name,
      text: trimmed,
      timestamp: Date.now(),
    })
  })
}
