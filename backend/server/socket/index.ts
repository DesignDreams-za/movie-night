import type { Server } from 'socket.io'
import { registerRoomHandlers } from './rooms.js'
import { registerVideoSyncHandlers } from './videoSync.js'
import { registerVoiceSignalingHandlers } from './voiceSignaling.js'
import { registerChatHandlers } from './chat.js'
import { registerModerationHandlers } from './moderation.js'
import type { ClientToServerEvents, ServerToClientEvents, SocketData } from './types.js'

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, object, SocketData>

export function registerSocketHandlers(io: TypedServer) {
  io.on('connection', (socket) => {
    console.log(`socket connected: ${socket.id}`)
    registerRoomHandlers(io, socket)
    registerVideoSyncHandlers(socket)
    registerVoiceSignalingHandlers(io, socket)
    registerChatHandlers(io, socket)
    registerModerationHandlers(io, socket)
  })
}
