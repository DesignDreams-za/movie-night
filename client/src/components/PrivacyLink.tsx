import { useState } from 'react'
import { ShieldIcon, CloseIcon } from './icons'

export function PrivacyLink() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mx-auto flex items-center gap-1.5 text-[11px] text-gray-600 transition hover:text-gray-400"
      >
        <ShieldIcon className="h-3.5 w-3.5" />
        Privacy &amp; terms
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="animate-fade-in-up w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-100">
                <ShieldIcon className="h-4 w-4 text-accent" />
                Privacy &amp; terms
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-gray-500 transition hover:text-gray-200"
                aria-label="Close"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs leading-relaxed">
              <p className="text-gray-400">
                Voice calls are peer-to-peer (WebRTC, DTLS-SRTP encrypted) and never touch our
                server. Movie files stay on your own device and are never uploaded anywhere. Chat
                is relayed over an encrypted connection and is never logged or stored.
              </p>
              <p className="text-amber-500/90">
                We don't monitor, review, or store what you watch, say, or share in a room.
                Everyone in a room is solely responsible for the content they choose to share —
                this platform only provides the connection between you and takes no
                responsibility for that content.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
