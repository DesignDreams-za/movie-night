import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRoom } from '../contexts/RoomContext'
import { PrivacyLink } from '../components/PrivacyLink'
import { HashIcon, UserIcon } from '../components/icons'

export function HomePage() {
  const navigate = useNavigate()
  const { createRoom, joinRoom, error } = useRoom()
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [pending, setPending] = useState(false)

  async function handleCreate() {
    if (!name.trim()) return
    setPending(true)
    const room = await createRoom(name.trim())
    setPending(false)
    if (room) navigate(`/room/${room.code}`)
  }

  async function handleJoin() {
    if (!name.trim() || !code.trim()) return
    setPending(true)
    const room = await joinRoom(code.trim(), name.trim())
    setPending(false)
    if (room) navigate(`/room/${room.code}`)
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-8 px-4">
      <div className="flex flex-col items-center gap-2">
        <div className="relative">
          <span className="absolute inset-0 -z-10 scale-150 animate-pulse rounded-full bg-accent/25 blur-2xl" />
          <h1 className="flex items-center gap-2 text-4xl font-bold tracking-tight">
            <span className="bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent">
              Movie Night
            </span>
            <span>❤️</span>
          </h1>
        </div>
        <p className="text-sm text-gray-500">Your own private watch party.</p>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-border bg-surface p-6 shadow-2xl shadow-black/40">
        <label className="group relative flex items-center">
          <UserIcon className="pointer-events-none absolute left-3 h-4 w-4 text-gray-600 transition group-focus-within:text-accent" />
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-3 text-sm text-gray-100 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </label>

        <button
          type="button"
          onClick={handleCreate}
          disabled={pending || !name.trim()}
          className="rounded-lg bg-gradient-to-r from-accent to-rose-600 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition hover:shadow-accent/40 hover:brightness-110 disabled:pointer-events-none disabled:opacity-40 disabled:shadow-none"
        >
          Create Room
        </button>

        <div className="flex items-center gap-2 text-xs text-gray-600">
          <div className="h-px flex-1 bg-border" />
          or
          <div className="h-px flex-1 bg-border" />
        </div>

        <label className="group relative flex items-center">
          <HashIcon className="pointer-events-none absolute left-3 h-4 w-4 text-gray-600 transition group-focus-within:text-accent" />
          <input
            type="text"
            placeholder="Room code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-3 text-sm uppercase tracking-widest text-gray-100 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </label>

        <button
          type="button"
          onClick={handleJoin}
          disabled={pending || !name.trim() || !code.trim()}
          className="rounded-lg border border-border px-3 py-2.5 text-sm font-medium text-gray-100 transition hover:border-gray-600 hover:bg-surface-hover disabled:pointer-events-none disabled:opacity-40"
        >
          Join Room
        </button>

        {error && <p className="text-center text-sm text-red-400">{error}</p>}
      </div>

      <PrivacyLink />
    </div>
  )
}
