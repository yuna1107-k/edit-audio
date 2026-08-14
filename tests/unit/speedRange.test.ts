import { describe, expect, it } from "vitest";
import {
  MAX_PLAYBACK_RATE,
  MIN_PLAYBACK_RATE,
  clampPlaybackRate,
} from "../../src/phase3-speed-control/speedRange";

describe("clampPlaybackRate", () => {
  it("passes values within range through unchanged", () => {
    expect(clampPlaybackRate(1)).toBe(1);
    expect(clampPlaybackRate(1.25)).toBe(1.25);
  });

  it("clamps values below the minimum", () => {
    expect(clampPlaybackRate(0.1)).toBe(MIN_PLAYBACK_RATE);
  });

  it("clamps values above the maximum", () => {
    expect(clampPlaybackRate(10)).toBe(MAX_PLAYBACK_RATE);
  });
});
