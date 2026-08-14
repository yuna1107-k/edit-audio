import { describe, expect, it } from "vitest";
import {
  shiftPitchAndTempo,
  type PcmBuffer,
  type PcmBufferFactory,
} from "../../src/phase4-pitch-control/pitchShift";

class FakePcmBuffer implements PcmBuffer {
  constructor(
    public readonly numberOfChannels: number,
    public readonly sampleRate: number,
    private readonly channels: Float32Array[],
  ) {}

  getChannelData(channel: number): Float32Array {
    return this.channels[channel];
  }
}

class FakeBufferFactory implements PcmBufferFactory {
  createBuffer(
    numberOfChannels: number,
    length: number,
    sampleRate: number,
  ): FakePcmBuffer {
    const channels = Array.from(
      { length: numberOfChannels },
      () => new Float32Array(length),
    );
    return new FakePcmBuffer(numberOfChannels, sampleRate, channels);
  }
}

function createToneBuffer(seconds: number, sampleRate = 44100): FakePcmBuffer {
  const length = Math.round(seconds * sampleRate);
  const data = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    data[i] = Math.sin((2 * Math.PI * 440 * i) / sampleRate);
  }
  return new FakePcmBuffer(1, sampleRate, [data]);
}

describe("shiftPitchAndTempo", () => {
  it("keeps the channel count and matches the input length at normal tempo/pitch", () => {
    const input = createToneBuffer(1);
    const factory = new FakeBufferFactory();

    const output = shiftPitchAndTempo(input, factory, {
      tempo: 1,
      pitchSemitones: 0,
    });

    expect(output.numberOfChannels).toBe(1);
    expect(output.getChannelData(0).length).toBe(
      input.getChannelData(0).length,
    );
  });

  it("halves the output length when tempo is doubled", () => {
    const input = createToneBuffer(1);
    const factory = new FakeBufferFactory();

    const fast = shiftPitchAndTempo(input, factory, { tempo: 2 });

    expect(fast.getChannelData(0).length).toBe(
      Math.round(input.getChannelData(0).length / 2),
    );
  });

  it("does not change length when only pitch is shifted", () => {
    const input = createToneBuffer(1);
    const factory = new FakeBufferFactory();

    const shifted = shiftPitchAndTempo(input, factory, { pitchSemitones: 7 });

    expect(shifted.getChannelData(0).length).toBe(
      input.getChannelData(0).length,
    );
  });

  it("preserves stereo channel data independently", () => {
    const sampleRate = 44100;
    const length = sampleRate;
    const left = new Float32Array(length);
    const right = new Float32Array(length);
    for (let i = 0; i < length; i++) {
      left[i] = Math.sin((2 * Math.PI * 440 * i) / sampleRate);
      right[i] = Math.sin((2 * Math.PI * 880 * i) / sampleRate);
    }
    const stereoInput = new FakePcmBuffer(2, sampleRate, [left, right]);
    const factory = new FakeBufferFactory();

    const output = shiftPitchAndTempo(stereoInput, factory, { tempo: 1 });

    expect(output.numberOfChannels).toBe(2);
    expect(output.getChannelData(1).length).toBe(length);
  });
});
