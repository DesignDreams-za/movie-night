// Not yet in this TypeScript version's bundled DOM lib, but supported by
// every browser this app targets (Chrome, Edge, modern Firefox/Safari).
interface HTMLMediaElement {
  captureStream(frameRate?: number): MediaStream
}
