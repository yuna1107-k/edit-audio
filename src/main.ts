import "./style.css";
import { decodeAudioFile } from "./phase1-upload-playback/decodeAudioFile";
import { drawWaveform } from "./phase1-upload-playback/drawWaveform";
import { setupUploadArea } from "./phase1-upload-playback/uploadArea";
import { AudioPlayer } from "./phase1-upload-playback/audioPlayer";
import type { LoadedAudio } from "./shared/types";

const app = document.querySelector<HTMLDivElement>("#app");

if (app) {
  app.innerHTML = `
    <main>
      <h1>音声加工ツール</h1>
      <div id="drop-zone" class="drop-zone">
        <p>音声ファイルをドラッグ&ドロップ、またはクリックして選択</p>
        <input id="file-input" type="file" accept="audio/*" hidden />
      </div>
      <p id="file-info" class="file-info"></p>
      <canvas id="waveform" width="600" height="120"></canvas>
      <div class="controls">
        <button id="play-button" type="button" disabled>再生</button>
        <button id="stop-button" type="button" disabled>停止</button>
      </div>
    </main>
  `;

  const dropZone = document.querySelector<HTMLDivElement>("#drop-zone")!;
  const fileInput = document.querySelector<HTMLInputElement>("#file-input")!;
  const fileInfo = document.querySelector<HTMLParagraphElement>("#file-info")!;
  const canvas = document.querySelector<HTMLCanvasElement>("#waveform")!;
  const playButton = document.querySelector<HTMLButtonElement>("#play-button")!;
  const stopButton = document.querySelector<HTMLButtonElement>("#stop-button")!;

  const audioContext = new AudioContext();
  const player = new AudioPlayer(audioContext);
  let loaded: LoadedAudio | null = null;

  const setPlayingState = (isPlaying: boolean) => {
    playButton.disabled = isPlaying || !loaded;
    stopButton.disabled = !isPlaying;
  };

  setupUploadArea(dropZone, fileInput, async (file) => {
    fileInfo.textContent = `読み込み中: ${file.name}`;
    try {
      loaded = await decodeAudioFile(file, audioContext);
      const { duration, sampleRate, numberOfChannels } = loaded.buffer;
      fileInfo.textContent =
        `${loaded.fileName} (${duration.toFixed(2)}秒 / ` +
        `${sampleRate}Hz / ${numberOfChannels}ch)`;
      drawWaveform(canvas, loaded.buffer);
      setPlayingState(false);
    } catch {
      fileInfo.textContent = `${file.name} を音声として読み込めませんでした`;
      loaded = null;
      setPlayingState(false);
    }
  });

  playButton.addEventListener("click", () => {
    if (!loaded) return;
    setPlayingState(true);
    player.play(loaded.buffer, () => setPlayingState(false));
  });

  stopButton.addEventListener("click", () => {
    player.stop();
    setPlayingState(false);
  });
}
