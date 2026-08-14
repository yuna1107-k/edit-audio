declare module "soundtouchjs" {
  export interface SoundTouchSource {
    readonly numberOfChannels: number;
    getChannelData(channel: number): Float32Array;
  }

  export class SoundTouch {
    tempo: number;
    pitch: number;
    pitchSemitones: number;
  }

  export class WebAudioBufferSource {
    constructor(buffer: SoundTouchSource);
  }

  export class SimpleFilter {
    constructor(sourceSound: WebAudioBufferSource, pipe: SoundTouch);
    extract(target: Float32Array, numFrames: number): number;
  }
}
