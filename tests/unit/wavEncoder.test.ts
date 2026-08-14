import { describe, expect, it } from "vitest";
import {
  encodeWav,
  type EncodablePcmBuffer,
} from "../../src/phase5-export/wavEncoder";

function readAscii(view: DataView, offset: number, length: number): string {
  let text = "";
  for (let i = 0; i < length; i++) {
    text += String.fromCharCode(view.getUint8(offset + i));
  }
  return text;
}

describe("encodeWav", () => {
  it("writes a valid RIFF/WAVE header matching the buffer's format", () => {
    const sampleRate = 44100;
    const numberOfChannels = 2;
    const length = 10;
    const channels = [new Float32Array(length), new Float32Array(length)];
    const buffer: EncodablePcmBuffer = {
      numberOfChannels,
      sampleRate,
      length,
      getChannelData: (c) => channels[c],
    };

    const arrayBuffer = encodeWav(buffer);
    const view = new DataView(arrayBuffer);

    expect(readAscii(view, 0, 4)).toBe("RIFF");
    expect(readAscii(view, 8, 4)).toBe("WAVE");
    expect(readAscii(view, 12, 4)).toBe("fmt ");
    expect(view.getUint16(20, true)).toBe(1); // PCM
    expect(view.getUint16(22, true)).toBe(numberOfChannels);
    expect(view.getUint32(24, true)).toBe(sampleRate);
    expect(view.getUint16(34, true)).toBe(16); // bits per sample
    expect(readAscii(view, 36, 4)).toBe("data");

    const expectedDataSize = length * numberOfChannels * 2;
    expect(view.getUint32(40, true)).toBe(expectedDataSize);
    expect(arrayBuffer.byteLength).toBe(44 + expectedDataSize);
  });

  it("round-trips interleaved sample values within 16bit PCM precision", () => {
    const channelData = new Float32Array([0, 0.5, -0.5, 1, -1]);
    const buffer: EncodablePcmBuffer = {
      numberOfChannels: 1,
      sampleRate: 8000,
      length: channelData.length,
      getChannelData: () => channelData,
    };

    const arrayBuffer = encodeWav(buffer);
    const view = new DataView(arrayBuffer);

    const readSample = (i: number) => view.getInt16(44 + i * 2, true) / 0x8000;

    expect(readSample(0)).toBeCloseTo(0, 3);
    expect(readSample(1)).toBeCloseTo(0.5, 3);
    expect(readSample(2)).toBeCloseTo(-0.5, 3);
    expect(readSample(3)).toBeCloseTo(1, 3);
    expect(readSample(4)).toBeCloseTo(-1, 3);
  });

  it("clamps out-of-range samples instead of overflowing", () => {
    const channelData = new Float32Array([2, -2]);
    const buffer: EncodablePcmBuffer = {
      numberOfChannels: 1,
      sampleRate: 8000,
      length: channelData.length,
      getChannelData: () => channelData,
    };

    const arrayBuffer = encodeWav(buffer);
    const view = new DataView(arrayBuffer);

    expect(view.getInt16(44, true)).toBe(0x7fff);
    expect(view.getInt16(46, true)).toBe(-0x8000);
  });
});
