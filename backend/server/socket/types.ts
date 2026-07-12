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

// WebRTC is peer-to-peer, so with more than two people in a room, offers/
// answers/ICE candidates must be routed to a specific peer rather than
// broadcast to the whole room. The server never inspects SDP/ICE contents,
// so they're typed loosely here; the client types the same events with
// real DOM WebRTC types.
export interface WebRTCOfferOutgoing {
  to: string
  sdp: unknown
}

export interface WebRTCOfferIncoming {
  from: string
  sdp: unknown
}

export interface WebRTCAnswerOutgoing {
  to: string
  sdp: unknown
}

export interface WebRTCAnswerIncoming {
  from: string
  sdp: unknown
}

export interface WebRTCIceCandidateOutgoing {
  to: string
  candidate: unknown
}

export interface WebRTCIceCandidateIncoming {
  from: string
  candidate: unknown
}

export interface VoiceReadyBroadcast {
  userId: string
}

export interface VoicePeersReadyPayload {
  userIds: string[]
}

export interface ChatMessage {
  id: string
  userId: string
  name: string
  text: string
  timestamp: number
}

export interface ReactionPayload {
  id: string
  emoji: string
  userId: string
}

export interface SocketData {
  roomCode?: string
}

export interface ServerToClientEvents {
  'user:joined': (user: RoomUser) => void
  'user:left': (userId: string) => void
  'video:play': (payload: VideoPlayPayload) => void
  'video:pause': (payload: VideoPausePayload) => void
  'video:seek': (payload: VideoSeekPayload) => void
  'video:sync': (payload: VideoSyncPayload) => void
  'voice:ready': (payload: VoiceReadyBroadcast) => void
  'voice:peers-ready': (payload: VoicePeersReadyPayload) => void
  'webrtc:offer': (payload: WebRTCOfferIncoming) => void
  'webrtc:answer': (payload: WebRTCAnswerIncoming) => void
  'webrtc:ice-candidate': (payload: WebRTCIceCandidateIncoming) => void
  'chat:message': (message: ChatMessage) => void
  'reaction:receive': (payload: ReactionPayload) => void
  'room:kicked': () => void
  'room:force-muted': () => void
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
  'webrtc:offer': (payload: WebRTCOfferOutgoing) => void
  'webrtc:answer': (payload: WebRTCAnswerOutgoing) => void
  'webrtc:ice-candidate': (payload: WebRTCIceCandidateOutgoing) => void
  'chat:message': (payload: { text: string }) => void
  'reaction:send': (payload: { emoji: string }) => void
  'room:kick': (payload: { userId: string }) => void
  'room:mute-user': (payload: { userId: string }) => void
}
