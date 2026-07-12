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

export interface VideoPlayPayload {
  currentTime: number
}

export interface VideoPausePayload {
  currentTime: number
}

export interface VideoSeekPayload {
  time: number
}

export interface VideoSyncPayload {
  currentTime: number
  isPlaying: boolean
}

export interface WebRTCOfferPayload {
  sdp: RTCSessionDescriptionInit
}

export interface WebRTCAnswerPayload {
  sdp: RTCSessionDescriptionInit
}

export interface WebRTCIceCandidatePayload {
  candidate: RTCIceCandidateInit
}

export interface ChatMessage {
  id: string
  userId: string
  name: string
  text: string
  timestamp: number
}

export interface ServerToClientEvents {
  'user:joined': (user: RoomUser) => void
  'user:left': (userId: string) => void
  'video:play': (payload: VideoPlayPayload) => void
  'video:pause': (payload: VideoPausePayload) => void
  'video:seek': (payload: VideoSeekPayload) => void
  'video:sync': (payload: VideoSyncPayload) => void
  'voice:ready': () => void
  'webrtc:offer': (payload: WebRTCOfferPayload) => void
  'webrtc:answer': (payload: WebRTCAnswerPayload) => void
  'webrtc:ice-candidate': (payload: WebRTCIceCandidatePayload) => void
  'chat:message': (message: ChatMessage) => void
}

export interface ClientToServerEvents {
  'room:create': (payload: { name: string }, callback: (result: RoomResult) => void) => void
  'room:join': (
    payload: { code: string; name: string },
    callback: (result: RoomResult) => void,
  ) => void
  'video:play': (payload: VideoPlayPayload) => void
  'video:pause': (payload: VideoPausePayload) => void
  'video:seek': (payload: VideoSeekPayload) => void
  'video:sync': (payload: VideoSyncPayload) => void
  'voice:ready': () => void
  'webrtc:offer': (payload: WebRTCOfferPayload) => void
  'webrtc:answer': (payload: WebRTCAnswerPayload) => void
  'webrtc:ice-candidate': (payload: WebRTCIceCandidatePayload) => void
  'chat:message': (payload: { text: string }) => void
}
