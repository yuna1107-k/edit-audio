export interface PeakPair {
  min: number;
  max: number;
}

/**
 * チャンネルデータをbucketCount個のバケットに分割し、
 * 各バケットの最小/最大振幅を求める（波形描画用のダウンサンプリング）。
 */
export function computePeaks(
  channelData: Float32Array,
  bucketCount: number,
): PeakPair[] {
  if (bucketCount <= 0 || channelData.length === 0) return [];

  const samplesPerBucket = channelData.length / bucketCount;
  const peaks: PeakPair[] = [];

  for (let i = 0; i < bucketCount; i++) {
    const start = Math.floor(i * samplesPerBucket);
    const end = Math.max(start + 1, Math.floor((i + 1) * samplesPerBucket));
    let min = channelData[start] ?? 0;
    let max = channelData[start] ?? 0;
    for (let j = start; j < end && j < channelData.length; j++) {
      const value = channelData[j];
      if (value < min) min = value;
      if (value > max) max = value;
    }
    peaks.push({ min, max });
  }

  return peaks;
}
