export interface EncodablePcmBuffer {
  readonly numberOfChannels: number;
  readonly sampleRate: number;
  readonly length: number;
  getChannelData(channel: number): Float32Array;
}

const BYTES_PER_SAMPLE = 2; // 16bit PCM
const WAV_HEADER_SIZE = 44;

function floatTo16BitPcm(sample: number): number {
  const clamped = Math.max(-1, Math.min(1, sample));
  return clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
}

function writeAsciiString(view: DataView, offset: number, text: string): void {
  for (let i = 0; i < text.length; i++) {
    view.setUint8(offset + i, text.charCodeAt(i));
  }
}

/**
 * AudioBuffer相当のPCMデータを、16bit PCM WAV形式のArrayBufferにエンコードする。
 */
export function encodeWav(buffer: EncodablePcmBuffer): ArrayBuffer {
  const { numberOfChannels, sampleRate, length } = buffer;
  const blockAlign = numberOfChannels * BYTES_PER_SAMPLE;
  const dataSize = length * blockAlign;

  const arrayBuffer = new ArrayBuffer(WAV_HEADER_SIZE + dataSize);
  const view = new DataView(arrayBuffer);

  writeAsciiString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeAsciiString(view, 8, "WAVE");

  writeAsciiString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // fmtチャンクサイズ
  view.setUint16(20, 1, true); // PCM形式
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true); // バイトレート
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, BYTES_PER_SAMPLE * 8, true); // ビット深度

  writeAsciiString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  const channels: Float32Array[] = [];
  for (let c = 0; c < numberOfChannels; c++) {
    channels.push(buffer.getChannelData(c));
  }

  let offset = WAV_HEADER_SIZE;
  for (let i = 0; i < length; i++) {
    for (let c = 0; c < numberOfChannels; c++) {
      view.setInt16(offset, floatTo16BitPcm(channels[c][i]), true);
      offset += BYTES_PER_SAMPLE;
    }
  }

  return arrayBuffer;
}
