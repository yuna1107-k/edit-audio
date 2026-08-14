# edit-audio

音声ファイルの**再生スピード**・**ピッチ(音の高さ)**・**カットする周波数帯域**を指定して、加工した音声ファイル(WAV)を生成・ダウンロードできるWebアプリです。

音声処理はすべてブラウザ内(クライアントサイド)で完結し、音声データが外部サーバーへ送信されることはありません。

## 特徴

- 音声ファイルのアップロード(ドラッグ&ドロップ / ファイル選択)と波形表示
- 再生スピードの変更(0.5x〜2.0x)
  - 連動モード: 速度に合わせてピッチも変化(テープ早回し)
  - 独立モード: [soundtouchjs](https://github.com/cutterbl/SoundTouchJS) により速度とピッチを個別に変更
- 任意の周波数帯域をカット(複数帯域指定可、`BiquadFilterNode`のnotchフィルタを使用)
- 加工後の音声をブラウザ内でプレビュー再生
- 加工後の音声をWAV(16bit PCM)として書き出し・ダウンロード

## 技術スタック

- [Cloudflare Workers](https://developers.cloudflare.com/workers/)(Static Assets) — `public/`配下の静的ファイルを配信するのみ
- [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
- Web Audio API(`OfflineAudioContext` / `BiquadFilterNode`)
- [soundtouchjs](https://github.com/cutterbl/SoundTouchJS)(速度・ピッチ独立変更)
- [Vitest](https://vitest.dev/)(ユニットテスト) / [Playwright](https://playwright.dev/)(E2Eテスト)
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/)(デプロイ)

詳しい設計は [docs/plan.md](./docs/plan.md) を参照してください。

## セットアップ

```bash
npm install
```

## 開発

```bash
npm run dev
```

`http://localhost:5173` でローカル開発サーバーが起動します。

## ビルド

```bash
npm run build
```

`public/` ディレクトリにビルド成果物が出力されます(Cloudflare Workersが配信するディレクトリと同一です)。

## テスト

```bash
npm run lint        # ESLint
npm run typecheck   # TypeScript型チェック
npm run test         # Vitestユニットテスト
npm run test:e2e     # Playwright E2Eテスト
```

## デプロイ

```bash
npm run build
npx wrangler deploy
```

`wrangler.jsonc` で `public/` を静的アセットディレクトリとして配信するよう設定しています。APIキーやシークレットは一切コード内に含まれません。

## ディレクトリ構成

```
edit-audio/
├─ public/                        # Cloudflare Workersが配信するビルド成果物
├─ src/
│  ├─ phase1-upload-playback/     # アップロード・デコード・波形表示・再生
│  ├─ phase2-frequency-cut/       # 周波数帯域カット
│  ├─ phase3-speed-control/       # 再生速度(連動モード)
│  ├─ phase4-pitch-control/       # ピッチ独立モード
│  ├─ phase5-export/              # WAV書き出し
│  ├─ shared/                     # フェーズ間で共有する型・加工パイプライン
│  └─ main.ts                     # エントリポイント
├─ worker/                        # Cloudflare Worker(静的アセット配信)
├─ tests/
│  ├─ unit/                       # Vitest
│  └─ e2e/                        # Playwright
├─ docs/plan.md                   # 開発計画書
└─ wrangler.jsonc
```
