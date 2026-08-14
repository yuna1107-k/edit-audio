import { describe, expect, it } from "vitest";
import { buildExportFileName } from "../../src/phase5-export/exportFileName";

describe("buildExportFileName", () => {
  it("replaces the extension with -edited.wav", () => {
    expect(buildExportFileName("voice-memo.mp3")).toBe(
      "voice-memo-edited.wav",
    );
  });

  it("handles file names without an extension", () => {
    expect(buildExportFileName("recording")).toBe("recording-edited.wav");
  });

  it("only strips the final extension when the name contains dots", () => {
    expect(buildExportFileName("my.song.v2.wav")).toBe(
      "my.song.v2-edited.wav",
    );
  });
});
