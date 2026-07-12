import { generateRoomCode } from './roomCode.js'
import type { RoomState, RoomUser } from './types.js'

export const MAX_USERS_PER_ROOM = 2

const rooms = new Map<string, RoomState>()

export function getRoom(code: string): RoomState | undefined {
  return rooms.get(code)
}

export function createRoomWithHost(host: RoomUser): RoomState {
  let code = generateRoomCode()
  while (rooms.has(code)) {
    code = generateRoomCode()
  }
  const room: RoomState = { code, users: [host] }
  rooms.set(code, room)
  return room
}

export function addUserToRoom(code: string, user: RoomUser): RoomState {
  const room = rooms.get(code)
  if (!room) throw new Error('Room not found')
  room.users.push(user)
  return room
}

export function removeUserBySocketId(socketId: string): { code: string; userId: string } | undefined {
  for (const room of rooms.values()) {
    const index = room.users.findIndex((user) => user.id === socketId)
    if (index === -1) continue

    room.users.splice(index, 1)
    if (room.users.length === 0) {
      rooms.delete(room.code)
    }
    return { code: room.code, userId: socketId }
  }
  return undefined
}
