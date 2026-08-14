import "./style.css";
import { decodeAudioFile } from "./phase1-upload-playback/decodeAudioFile";
import { drawWaveform } from "./phase1-upload-playback/drawWaveform";
import { setupUploadArea } from "./phase1-upload-playback/uploadArea";
import { AudioPlayer } from "./phase1-upload-playback/audioPlayer";
import { renderWithBandCuts } from "./phase2-frequency-cut/offlineRender";
import type { FrequencyBand } from "./phase2-frequency-cut/notchFilterParams";
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

      <section class="band-section">
        <h2>カットする周波数帯域</h2>
        <div class="band-inputs">
          <label>下限(Hz) <input id="band-low" type="number" min="1" value="300" /></label>
          <label>上限(Hz) <input id="band-high" type="number" min="2" value="3000" /></label>
          <button id="add-band" type="button">帯域を追加</button>
        </div>
        <p id="band-error" class="band-error"></p>
        <ul id="band-list" class="band-list"></ul>
        <button id="preview-button" type="button" disabled>加工後をプレビュー再生</button>
      </section>
    </main>
  `;

  const dropZone = document.querySelector<HTMLDivElement>("#drop-zone")!;
  const fileInput = document.querySelector<HTMLInputElement>("#file-input")!;
  const fileInfo = document.querySelector<HTMLParagraphElement>("#file-info")!;
  const canvas = document.querySelector<HTMLCanvasElement>("#waveform")!;
  const playButton = document.querySelector<HTMLButtonElement>("#play-button")!;
  const stopButton = document.querySelector<HTMLButtonElement>("#stop-button")!;

  const bandLowInput = document.querySelector<HTMLInputElement>("#band-low")!;
  const bandHighInput = document.querySelector<HTMLInputElement>("#band-high")!;
  const addBandButton = document.querySelector<HTMLButtonElement>("#add-band")!;
  const bandError = document.querySelector<HTMLParagraphElement>("#band-error")!;
  const bandList = document.querySelector<HTMLUListElement>("#band-list")!;
  const previewButton = document.querySelector<HTMLButtonElement>("#preview-button")!;

  const audioContext = new AudioContext();
  const player = new AudioPlayer(audioContext);
  let loaded: LoadedAudio | null = null;
  let bands: FrequencyBand[] = [];

  const setPlayingState = (isPlaying: boolean) => {
    playButton.disabled = isPlaying || !loaded;
    stopButton.disabled = !isPlaying;
    previewButton.disabled = isPlaying || !loaded;
  };

  const renderBandList = () => {
    bandList.innerHTML = bands
      .map(
        (band, index) =>
          `<li>${band.low}Hz - ${band.high}Hz <button type="button" data-index="${index}">削除</button></li>`,
      )
      .join("");
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

  addBandButton.addEventListener("click", () => {
    const low = Number(bandLowInput.value);
    const high = Number(bandHighInput.value);

    if (!(low > 0) || !(high > low)) {
      bandError.textContent =
        "下限は0より大きく、上限は下限より大きい値を指定してください";
      return;
    }

    bandError.textContent = "";
    bands = [...bands, { low, high }];
    renderBandList();
  });

  bandList.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;
    const index = Number(target.dataset.index);
    bands = bands.filter((_, i) => i !== index);
    renderBandList();
  });

  previewButton.addEventListener("click", async () => {
    if (!loaded) return;
    setPlayingState(true);
    try {
      const rendered = await renderWithBandCuts(loaded.buffer, bands);
      player.play(rendered, () => setPlayingState(false));
    } catch {
      bandError.textContent = "プレビューの生成に失敗しました";
      setPlayingState(false);
    }
  });
}
