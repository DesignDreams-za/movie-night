export function PrivacyFooter() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-2 text-center">
      <p className="text-[11px] leading-relaxed text-gray-500">
        🔒 Private &amp; encrypted. Voice calls are peer-to-peer (WebRTC, DTLS-SRTP encrypted) and
        never touch our server. Movie files stay on your own device and are never uploaded
        anywhere. Chat is relayed over an encrypted connection and is never logged or stored.
      </p>
      <p className="text-[11px] leading-relaxed text-amber-500/90">
        ⚠️ We don't monitor, review, or store what you watch, say, or share in a room. Everyone in
        a room is solely responsible for the content they choose to share — this platform only
        provides the connection between you and takes no responsibility for that content.
      </p>
    </div>
  )
}
