import {
  createNotchFilterChain,
  connectChain,
} from "../phase2-frequency-cut/filterChain";
import type { FrequencyBand } from "../phase2-frequency-cut/notchFilterParams";

export interface RenderOptions {
  /** 再生速度(連動モード)。1が等速、値が大きいほど速く/高音に、小さいほど遅く/低音になる。 */
  playbackRate?: number;
  /** カットする周波数帯域(複数指定可)。 */
  bands?: FrequencyBand[];
}

/**
 * speed(playbackRate)と周波数帯域カットを適用してAudioBufferをレンダリングする。
 * Phase1のデコード結果に対して、Phase2/Phase3の加工を合成する共通パイプライン。
 */
export async function renderAudio(
  buffer: AudioBuffer,
  { playbackRate = 1, bands = [] }: RenderOptions = {},
): Promise<AudioBuffer> {
  const renderedLength = Math.max(1, Math.ceil(buffer.length / playbackRate));
  const offlineContext = new OfflineAudioContext(
    buffer.numberOfChannels,
    renderedLength,
    buffer.sampleRate,
  );

  const source = offlineContext.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = playbackRate;

  const filters = createNotchFilterChain(offlineContext, bands);
  connectChain(source, filters, offlineContext.destination);

  source.start();
  return offlineContext.startRendering();
}
