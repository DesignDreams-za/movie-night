import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRoom } from '../contexts/RoomContext'
import { PrivacyFooter } from '../components/PrivacyFooter'

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
    <div className="flex min-h-full flex-col items-center justify-center gap-6 px-4">
      <h1 className="text-3xl font-semibold text-gray-100">Movie Night ❤️</h1>

      <div className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-border bg-surface p-6">
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm text-gray-100 outline-none focus:border-accent"
        />

        <button
          type="button"
          onClick={handleCreate}
          disabled={pending || !name.trim()}
          className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white transition hover:bg-accent-hover disabled:opacity-50"
        >
          Create Room
        </button>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="h-px flex-1 bg-border" />
          or
          <div className="h-px flex-1 bg-border" />
        </div>

        <input
          type="text"
          placeholder="Room code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm uppercase tracking-widest text-gray-100 outline-none focus:border-accent"
        />

        <button
          type="button"
          onClick={handleJoin}
          disabled={pending || !name.trim() || !code.trim()}
          className="rounded-md border border-border px-3 py-2 text-sm font-medium text-gray-100 transition hover:bg-surface-hover disabled:opacity-50"
        >
          Join Room
        </button>

        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>

      <div className="max-w-sm">
        <PrivacyFooter />
      </div>
    </div>
  )
}
