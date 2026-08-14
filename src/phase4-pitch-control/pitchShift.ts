import { SimpleFilter, SoundTouch, WebAudioBufferSource } from "soundtouchjs";

export interface PcmBuffer {
  readonly numberOfChannels: number;
  readonly sampleRate: number;
  getChannelData(channel: number): Float32Array;
}

export interface PcmBufferFactory {
  createBuffer(
    numberOfChannels: number,
    length: number,
    sampleRate: number,
  ): PcmBuffer;
}

export interface PitchShiftOptions {
  /** 1が等速。tempoのみを変えてもピッチは変化しない。 */
  tempo?: number;
  /** 0が無変換。半音単位でのピッチシフト量。速度には影響しない。 */
  pitchSemitones?: number;
}

const FRAME_SIZE = 4096;

/**
 * SoundTouchJSのSimpleFilterは、入力バッファの残りが一定量を下回ると
 * 内部のstretch/transposeパイプラインの実行(process())を止めてしまい、
 * 音声末尾が欠落する。十分な無音を末尾に付加してから全量を処理し、
 * 想定される出力長にトリミングすることで末尾欠落を防ぐ。
 */
const TAIL_PAD_FRAMES = 40000;

function createPaddedSource(buffer: PcmBuffer, padFrames: number): PcmBuffer {
  const originalLength = buffer.getChannelData(0).length;
  const channels: Float32Array[] = [];
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const padded = new Float32Array(originalLength + padFrames);
    padded.set(buffer.getChannelData(c));
    channels.push(padded);
  }
  return {
    numberOfChannels: buffer.numberOfChannels,
    sampleRate: buffer.sampleRate,
    getChannelData: (channel) => channels[channel],
  };
}

/**
 * SoundTouchJSを用いて、速度(tempo)とピッチ(pitchSemitones)を
 * 独立に変更したPCMバッファを合成する(独立モード)。
 */
export function shiftPitchAndTempo(
  buffer: PcmBuffer,
  bufferFactory: PcmBufferFactory,
  { tempo = 1, pitchSemitones = 0 }: PitchShiftOptions = {},
): PcmBuffer {
  const soundTouch = new SoundTouch();
  soundTouch.tempo = tempo;
  soundTouch.pitchSemitones = pitchSemitones;

  const paddedBuffer = createPaddedSource(buffer, TAIL_PAD_FRAMES);
  const source = new WebAudioBufferSource(paddedBuffer);
  const filter = new SimpleFilter(source, soundTouch);

  const targetFrames = Math.max(
    1,
    Math.round(buffer.getChannelData(0).length / tempo),
  );

  const numberOfChannels = buffer.numberOfChannels;
  const output = bufferFactory.createBuffer(
    numberOfChannels,
    targetFrames,
    buffer.sampleRate,
  );
  const left = output.getChannelData(0);
  const right = numberOfChannels > 1 ? output.getChannelData(1) : null;

  const frame = new Float32Array(FRAME_SIZE * 2);
  let offset = 0;
  while (offset < targetFrames) {
    const framesExtracted = filter.extract(frame, FRAME_SIZE);
    if (framesExtracted === 0) break;

    const framesToCopy = Math.min(framesExtracted, targetFrames - offset);
    for (let i = 0; i < framesToCopy; i++) {
      const l = frame[i * 2];
      const r = frame[i * 2 + 1];
      if (right) {
        left[offset + i] = l;
        right[offset + i] = r;
      } else {
        left[offset + i] = (l + r) / 2;
      }
    }
    offset += framesToCopy;
  }

  return output;
}
