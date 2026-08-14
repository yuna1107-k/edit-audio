export class AudioPlayer {
  private source: AudioBufferSourceNode | null = null;

  constructor(private readonly context: AudioContext) {}

  play(buffer: AudioBuffer, onEnded?: () => void): void {
    this.stop();
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.connect(this.context.destination);
    source.onended = () => onEnded?.();
    source.start();
    this.source = source;
  }

  stop(): void {
    if (!this.source) return;
    try {
      this.source.stop();
    } catch {
      // すでに再生終了している場合は無視
    }
    this.source.disconnect();
    this.source = null;
  }

  get isPlaying(): boolean {
    return this.source !== null;
  }
}
