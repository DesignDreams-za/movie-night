import type { Socket } from 'socket.io'
import type { ClientToServerEvents, ServerToClientEvents, SocketData } from './types.js'

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, object, SocketData>

// Pure relay: the server never inspects SDP/ICE contents, it just forwards
// between the two sockets in a room so the peers can negotiate directly.
export function registerVoiceSignalingHandlers(socket: TypedSocket) {
  socket.on('voice:ready', () => {
    const code = socket.data.roomCode
    if (code) socket.to(code).emit('voice:ready')
  })

  socket.on('webrtc:offer', (payload) => {
    const code = socket.data.roomCode
    if (code) socket.to(code).emit('webrtc:offer', payload)
  })

  socket.on('webrtc:answer', (payload) => {
    const code = socket.data.roomCode
    if (code) socket.to(code).emit('webrtc:answer', payload)
  })

  socket.on('webrtc:ice-candidate', (payload) => {
    const code = socket.data.roomCode
    if (code) socket.to(code).emit('webrtc:ice-candidate', payload)
  })
}
