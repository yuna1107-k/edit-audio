import { describe, expect, it } from "vitest";
import { computeNotchFilterParams } from "../../src/phase2-frequency-cut/notchFilterParams";

describe("computeNotchFilterParams", () => {
  it("computes the geometric-mean center frequency and Q from the band width", () => {
    const { frequency, Q } = computeNotchFilterParams({ low: 300, high: 3000 });

    expect(frequency).toBeCloseTo(Math.sqrt(300 * 3000), 5);
    expect(Q).toBeCloseTo(frequency / (3000 - 300), 5);
  });

  it("produces a narrower band (higher Q) for a tighter frequency range", () => {
    const narrow = computeNotchFilterParams({ low: 990, high: 1010 });
    const wide = computeNotchFilterParams({ low: 500, high: 1500 });

    expect(narrow.Q).toBeGreaterThan(wide.Q);
  });

  it("throws when low is not positive", () => {
    expect(() => computeNotchFilterParams({ low: 0, high: 100 })).toThrow(
      RangeError,
    );
  });

  it("throws when high is not greater than low", () => {
    expect(() => computeNotchFilterParams({ low: 500, high: 500 })).toThrow(
      RangeError,
    );
    expect(() => computeNotchFilterParams({ low: 500, high: 100 })).toThrow(
      RangeError,
    );
  });
});
