import { useState } from 'react'
import { CheckIcon, CopyIcon } from './icons'

export function RoomCodeChip({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard access denied — silently ignore, the code is still visible
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Copy room code"
      className="flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-3 py-1 text-xs tracking-widest text-gray-300 transition hover:border-accent/50 hover:text-white"
    >
      {code}
      {copied ? (
        <CheckIcon className="h-3 w-3 text-online" />
      ) : (
        <CopyIcon className="h-3 w-3 text-gray-500" />
      )}
    </button>
  )
}
