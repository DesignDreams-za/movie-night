import { generateRoomCode } from './roomCode.js'
import type { RoomState, RoomUser } from './types.js'

export const MAX_USERS_PER_ROOM = 6

const rooms = new Map<string, RoomState>()
const readyUsersByRoom = new Map<string, Set<string>>()

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
    readyUsersByRoom.get(room.code)?.delete(socketId)

    if (room.users.length === 0) {
      rooms.delete(room.code)
      readyUsersByRoom.delete(room.code)
    }
    return { code: room.code, userId: socketId }
  }
  return undefined
}

// Marks a user as voice-ready and returns everyone in the room who was
// already ready before this call, so the newly-ready client can initiate
// handshakes with all of them immediately.
export function markUserReady(code: string, userId: string): string[] {
  let readySet = readyUsersByRoom.get(code)
  if (!readySet) {
    readySet = new Set()
    readyUsersByRoom.set(code, readySet)
  }
  const alreadyReady = Array.from(readySet)
  readySet.add(userId)
  return alreadyReady
}
