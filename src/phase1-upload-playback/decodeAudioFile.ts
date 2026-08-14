import type { LoadedAudio } from "../shared/types";

export async function decodeAudioFile(
  file: File,
  audioContext: BaseAudioContext,
): Promise<LoadedAudio> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = await audioContext.decodeAudioData(arrayBuffer);
  return { fileName: file.name, buffer };
}
