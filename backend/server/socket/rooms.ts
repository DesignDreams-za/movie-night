import type { Server, Socket } from 'socket.io'
import {
  MAX_USERS_PER_ROOM,
  addUserToRoom,
  createRoomWithHost,
  getRoom,
  removeUserBySocketId,
} from './roomStore.js'
import type { ClientToServerEvents, RoomUser, ServerToClientEvents } from './types.js'

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>

export function registerRoomHandlers(io: TypedServer, socket: TypedSocket) {
  socket.on('room:create', ({ name }, callback) => {
    const you: RoomUser = { id: socket.id, name, isHost: true }
    const room = createRoomWithHost(you)
    socket.join(room.code)
    callback({ ok: true, room, you })
  })

  socket.on('room:join', ({ code, name }, callback) => {
    const normalizedCode = code.trim().toUpperCase()
    const room = getRoom(normalizedCode)

    if (!room) {
      callback({ ok: false, error: 'Room not found' })
      return
    }
    if (room.users.length >= MAX_USERS_PER_ROOM) {
      callback({ ok: false, error: 'Room is full' })
      return
    }

    const you: RoomUser = { id: socket.id, name, isHost: false }
    const updatedRoom = addUserToRoom(normalizedCode, you)
    socket.join(normalizedCode)
    socket.to(normalizedCode).emit('user:joined', you)
    callback({ ok: true, room: updatedRoom, you })
  })

  socket.on('disconnect', () => {
    console.log(`socket disconnected: ${socket.id}`)
    const result = removeUserBySocketId(socket.id)
    if (result) {
      io.to(result.code).emit('user:left', result.userId)
    }
  })
}
