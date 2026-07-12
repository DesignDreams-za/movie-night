import type { Server, Socket } from 'socket.io'
import type { ClientToServerEvents, ServerToClientEvents, SocketData } from './types.js'

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, object, SocketData>
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, object, SocketData>

// Pure relay, same pattern as voiceSignaling.ts, but kept on its own event
// names so the movie broadcast (host -> viewer, one-directional) never gets
// mixed up with the call's signaling (mic/camera, symmetric mesh) on the
// same pair of people.
export function registerMovieSignalingHandlers(io: TypedServer, socket: TypedSocket) {
  socket.on('movie:offer', ({ to, sdp }) => {
    io.to(to).emit('movie:offer', { from: socket.id, sdp })
  })

  socket.on('movie:answer', ({ to, sdp }) => {
    io.to(to).emit('movie:answer', { from: socket.id, sdp })
  })

  socket.on('movie:ice-candidate', ({ to, candidate }) => {
    io.to(to).emit('movie:ice-candidate', { from: socket.id, candidate })
  })
}
