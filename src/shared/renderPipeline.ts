import {
  createNotchFilterChain,
  connectChain,
} from "../phase2-frequency-cut/filterChain";
import type { FrequencyBand } from "../phase2-frequency-cut/notchFilterParams";
import { shiftPitchAndTempo } from "../phase4-pitch-control/pitchShift";

export type PitchMode = "linked" | "independent";

export interface RenderOptions {
  /** ピッチの変更方法。"linked"=速度に連動(デフォルト)、"independent"=速度と独立。 */
  pitchMode?: PitchMode;
  /** linkedモードで使う再生速度。1が等速。 */
  playbackRate?: number;
  /** independentモードで使う速度(tempo)。1が等速、ピッチには影響しない。 */
  tempo?: number;
  /** independentモードで使うピッチ変化量(半音)。0が無変換、速度には影響しない。 */
  pitchSemitones?: number;
  /** カットする周波数帯域(複数指定可)。 */
  bands?: FrequencyBand[];
}

async function renderBandCuts(
  buffer: AudioBuffer,
  playbackRate: number,
  bands: FrequencyBand[],
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

/**
 * 速度/ピッチ/周波数帯域カットを適用してAudioBufferをレンダリングする、
 * Phase1のデコード結果に対する共通加工パイプライン。
 */
export async function renderAudio(
  buffer: AudioBuffer,
  audioContext: BaseAudioContext,
  {
    pitchMode = "linked",
    playbackRate = 1,
    tempo = 1,
    pitchSemitones = 0,
    bands = [],
  }: RenderOptions = {},
): Promise<AudioBuffer> {
  if (pitchMode === "independent") {
    // SoundTouchJSの合成結果は、呼び出し側が渡したAudioContextの
    // createBufferで生成されるため、実体は常にAudioBufferとなる。
    const shifted = shiftPitchAndTempo(buffer, audioContext, {
      tempo,
      pitchSemitones,
    }) as AudioBuffer;
    return renderBandCuts(shifted, 1, bands);
  }

  return renderBandCuts(buffer, playbackRate, bands);
}
