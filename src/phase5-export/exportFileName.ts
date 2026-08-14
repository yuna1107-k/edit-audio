export function buildExportFileName(originalFileName: string): string {
  const base = originalFileName.replace(/\.[^./\\]+$/, "");
  return `${base}-edited.wav`;
}
