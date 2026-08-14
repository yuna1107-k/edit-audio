import {
  computeNotchFilterParams,
  type FrequencyBand,
} from "./notchFilterParams";

export function createNotchFilterChain(
  context: BaseAudioContext,
  bands: FrequencyBand[],
): BiquadFilterNode[] {
  return bands.map((band) => {
    const { frequency, Q } = computeNotchFilterParams(band);
    const filter = context.createBiquadFilter();
    filter.type = "notch";
    filter.frequency.value = frequency;
    filter.Q.value = Q;
    return filter;
  });
}

/**
 * source -> ...nodes -> destination の順に直列接続する。
 * nodesが空の場合はsourceとdestinationを直結する(=無加工)。
 */
export function connectChain(
  source: AudioNode,
  nodes: AudioNode[],
  destination: AudioNode,
): void {
  const chain = [source, ...nodes, destination];
  for (let i = 0; i < chain.length - 1; i++) {
    chain[i].connect(chain[i + 1]);
  }
}
