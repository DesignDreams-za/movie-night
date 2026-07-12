import type { Socket } from 'socket.io'
import { getRoom } from './roomStore.js'
import type { ClientToServerEvents, ServerToClientEvents, SocketData } from './types.js'

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, object, SocketData>

// Either person can play/pause/seek; the server just relays to the other
// socket in the room. video:sync is a periodic authoritative snapshot from
// the host, used by the other player to correct drift.
export function registerVideoSyncHandlers(socket: TypedSocket) {
  socket.on('video:play', (payload) => {
    const code = socket.data.roomCode
    if (code) socket.to(code).emit('video:play', payload)
  })

  socket.on('video:pause', (payload) => {
    const code = socket.data.roomCode
    if (code) socket.to(code).emit('video:pause', payload)
  })

  socket.on('video:seek', (payload) => {
    const code = socket.data.roomCode
    if (code) socket.to(code).emit('video:seek', payload)
  })

  socket.on('video:sync', (payload) => {
    const code = socket.data.roomCode
    if (code) socket.to(code).emit('video:sync', payload)
  })

  socket.on('video:file-loaded', ({ fileName }) => {
    const code = socket.data.roomCode
    if (!code) return
    const sender = getRoom(code)?.users.find((user) => user.id === socket.id)
    if (!sender) return
    socket.to(code).emit('video:file-loaded', { name: sender.name, fileName })
  })
}
