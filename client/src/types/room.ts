export interface RoomUser {
  id: string
  name: string
  isHost: boolean
}

export interface RoomState {
  code: string
  users: RoomUser[]
}

export type RoomResult =
  | { ok: true; room: RoomState; you: RoomUser }
  | { ok: false; error: string }

export interface ServerToClientEvents {
  'user:joined': (user: RoomUser) => void
  'user:left': (userId: string) => void
}

export interface ClientToServerEvents {
  'room:create': (payload: { name: string }, callback: (result: RoomResult) => void) => void
  'room:join': (
    payload: { code: string; name: string },
    callback: (result: RoomResult) => void,
  ) => void
}
