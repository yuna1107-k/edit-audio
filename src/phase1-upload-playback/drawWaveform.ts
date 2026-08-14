import { computePeaks } from "./waveformPeaks";

export function drawWaveform(
  canvas: HTMLCanvasElement,
  buffer: AudioBuffer,
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;
  const channelData = buffer.getChannelData(0);
  const peaks = computePeaks(channelData, width);
  const mid = height / 2;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#1d4ed8";

  peaks.forEach((peak, x) => {
    const y1 = mid - peak.max * mid;
    const y2 = mid - peak.min * mid;
    ctx.fillRect(x, y1, 1, Math.max(1, y2 - y1));
  });
}
