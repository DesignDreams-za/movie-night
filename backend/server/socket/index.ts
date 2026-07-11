import type { Server } from 'socket.io'

export function registerSocketHandlers(io: Server) {
  io.on('connection', (socket) => {
    console.log(`socket connected: ${socket.id}`)

    socket.on('disconnect', () => {
      console.log(`socket disconnected: ${socket.id}`)
    })
  })
}
