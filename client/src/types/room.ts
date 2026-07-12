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

export interface WebRTCOfferOutgoing {
  to: string
  sdp: RTCSessionDescriptionInit
}

export interface WebRTCOfferIncoming {
  from: string
  sdp: RTCSessionDescriptionInit
}

export interface WebRTCAnswerOutgoing {
  to: string
  sdp: RTCSessionDescriptionInit
}

export interface WebRTCAnswerIncoming {
  from: string
  sdp: RTCSessionDescriptionInit
}

export interface WebRTCIceCandidateOutgoing {
  to: string
  candidate: RTCIceCandidateInit
}

export interface WebRTCIceCandidateIncoming {
  from: string
  candidate: RTCIceCandidateInit
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
  'room:kick': (payload: { userId: string }) => void
  'room:mute-user': (payload: { userId: string }) => void
}
