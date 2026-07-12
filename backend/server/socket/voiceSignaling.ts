import type { Server, Socket } from 'socket.io'
import { markUserReady } from './roomStore.js'
import type { ClientToServerEvents, ServerToClientEvents, SocketData } from './types.js'

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, object, SocketData>
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, object, SocketData>

// Pure relay: the server never inspects SDP/ICE contents, it just routes
// between specific peers (WebRTC is point-to-point, so with more than two
// people in a room, signaling must target one peer, not broadcast to all).
export function registerVoiceSignalingHandlers(io: TypedServer, socket: TypedSocket) {
  socket.on('voice:ready', () => {
    const code = socket.data.roomCode
    if (!code) return

    const alreadyReady = markUserReady(code, socket.id)
    socket.emit('voice:peers-ready', { userIds: alreadyReady })
    socket.to(code).emit('voice:ready', { userId: socket.id })
  })

  socket.on('webrtc:offer', ({ to, sdp }) => {
    io.to(to).emit('webrtc:offer', { from: socket.id, sdp })
  })

  socket.on('webrtc:answer', ({ to, sdp }) => {
    io.to(to).emit('webrtc:answer', { from: socket.id, sdp })
  })

  socket.on('webrtc:ice-candidate', ({ to, candidate }) => {
    io.to(to).emit('webrtc:ice-candidate', { from: socket.id, candidate })
  })
}
