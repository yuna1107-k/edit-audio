export interface FrequencyBand {
  low: number;
  high: number;
}

export interface NotchFilterParams {
  frequency: number;
  Q: number;
}

/**
 * 下限/上限Hzから、BiquadFilterNode(notch)に設定する
 * 中心周波数とQ値を求める。
 */
export function computeNotchFilterParams({
  low,
  high,
}: FrequencyBand): NotchFilterParams {
  if (low <= 0) {
    throw new RangeError("low must be greater than 0");
  }
  if (high <= low) {
    throw new RangeError("high must be greater than low");
  }

  const frequency = Math.sqrt(low * high);
  const Q = frequency / (high - low);

  return { frequency, Q };
}
