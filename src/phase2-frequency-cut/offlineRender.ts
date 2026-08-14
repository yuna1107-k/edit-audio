import { createNotchFilterChain, connectChain } from "./filterChain";
import type { FrequencyBand } from "./notchFilterParams";

export async function renderWithBandCuts(
  buffer: AudioBuffer,
  bands: FrequencyBand[],
): Promise<AudioBuffer> {
  const offlineContext = new OfflineAudioContext(
    buffer.numberOfChannels,
    buffer.length,
    buffer.sampleRate,
  );

  const source = offlineContext.createBufferSource();
  source.buffer = buffer;

  const filters = createNotchFilterChain(offlineContext, bands);
  connectChain(source, filters, offlineContext.destination);

  source.start();
  return offlineContext.startRendering();
}
