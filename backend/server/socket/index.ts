import type { Server } from 'socket.io'
import { registerRoomHandlers } from './rooms.js'
import type { ClientToServerEvents, ServerToClientEvents } from './types.js'

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>

export function registerSocketHandlers(io: TypedServer) {
  io.on('connection', (socket) => {
    console.log(`socket connected: ${socket.id}`)
    registerRoomHandlers(io, socket)
  })
}
