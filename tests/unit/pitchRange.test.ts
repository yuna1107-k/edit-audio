import { describe, expect, it } from "vitest";
import {
  MAX_PITCH_SEMITONES,
  MIN_PITCH_SEMITONES,
  clampPitchSemitones,
} from "../../src/phase4-pitch-control/pitchRange";

describe("clampPitchSemitones", () => {
  it("passes values within range through unchanged", () => {
    expect(clampPitchSemitones(0)).toBe(0);
    expect(clampPitchSemitones(-3)).toBe(-3);
  });

  it("clamps values below the minimum", () => {
    expect(clampPitchSemitones(-100)).toBe(MIN_PITCH_SEMITONES);
  });

  it("clamps values above the maximum", () => {
    expect(clampPitchSemitones(100)).toBe(MAX_PITCH_SEMITONES);
  });
});
