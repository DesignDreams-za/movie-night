import { randomUUID } from 'node:crypto'
import type { Server, Socket } from 'socket.io'
import type { ClientToServerEvents, ServerToClientEvents, SocketData } from './types.js'

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, object, SocketData>
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, object, SocketData>

// Ephemeral by design: no history, just a live broadcast to the room.
export function registerReactionHandlers(io: TypedServer, socket: TypedSocket) {
  socket.on('reaction:send', ({ emoji }) => {
    const code = socket.data.roomCode
    if (!code) return
    io.to(code).emit('reaction:receive', { id: randomUUID(), emoji, userId: socket.id })
  })
}
