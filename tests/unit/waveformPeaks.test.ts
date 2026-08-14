import { describe, expect, it } from "vitest";
import { computePeaks } from "../../src/phase1-upload-playback/waveformPeaks";

describe("computePeaks", () => {
  it("returns an empty array for empty input", () => {
    expect(computePeaks(new Float32Array([]), 10)).toEqual([]);
  });

  it("returns an empty array when bucketCount is not positive", () => {
    expect(computePeaks(new Float32Array([0.1, 0.2]), 0)).toEqual([]);
  });

  it("finds the min/max of each bucket", () => {
    const data = new Float32Array([0, 0.5, -0.5, 1, -1, 0.2, 0.3, 0.1]);
    const peaks = computePeaks(data, 2);

    expect(peaks).toHaveLength(2);
    expect(peaks[0].min).toBeCloseTo(-0.5, 5);
    expect(peaks[0].max).toBeCloseTo(1, 5);
    expect(peaks[1].min).toBeCloseTo(-1, 5);
    expect(peaks[1].max).toBeCloseTo(0.3, 5);
  });

  it("covers every sample across buckets without gaps", () => {
    const data = new Float32Array(100).map((_, i) => i / 100);
    const peaks = computePeaks(data, 7);

    expect(peaks).toHaveLength(7);
    expect(peaks[0].min).toBeCloseTo(0, 5);
    expect(peaks[peaks.length - 1].max).toBeCloseTo(0.99, 5);
  });
});
