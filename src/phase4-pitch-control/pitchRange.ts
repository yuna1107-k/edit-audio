export const MIN_PITCH_SEMITONES = -12;
export const MAX_PITCH_SEMITONES = 12;

export function clampPitchSemitones(semitones: number): number {
  return Math.min(
    MAX_PITCH_SEMITONES,
    Math.max(MIN_PITCH_SEMITONES, semitones),
  );
}
