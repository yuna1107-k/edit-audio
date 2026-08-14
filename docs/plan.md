# 音声加工Webアプリ 開発計画書

## 1. 概要

入力した音声ファイルに対して、以下の3つの加工を自由に組み合わせて適用し、加工後の音声ファイルを生成・ダウンロードできるWebアプリを開発する。

- **再生スピード**の変更（例: 0.5x 〜 2.0x）
- **音の高さ（ピッチ）**の変更（例: -12 〜 +12 半音）
- **カットする周波数帯域**の指定（例: 300Hz〜3000Hzをカット、など任意の帯域を除去）

処理はすべて**ブラウザ内（クライアントサイド）**で完結させ、Cloudflareの技術はホスティングと配信のみに用いる。音声データや個人情報が外部サーバーへ送信されることはない。

## 2. ゴール / 非ゴール

### ゴール
- ブラウザに音声ファイル（wav/mp3等）をドラッグ&ドロップ or 選択してアップロードできる
- スピード・ピッチ・カット周波数帯域をUI上のスライダー等で指定し、プレビュー再生できる
- 加工後の音声をファイル（wav）として書き出し、ダウンロードできる
- Cloudflare Workers（Static Assets）でホスティングし、`public/` 配下の静的アセットのみで完結する構成にする

### 非ゴール（初期スコープ外）
- サーバーサイドでの音声処理（重い変換をWorkers上で行うことは対象外。CPU/メモリ制限とファイルサイズの都合上、クライアント処理を採用）
- アカウント機能・音声ファイルの永続保存/共有機能（将来拡張として検討）
- 高度なノイズ除去・AI系の音声強調（将来拡張として検討）

## 3. 想定ユーザー / ユースケース

- ポッドキャストやボイスメモの倍速確認・耳コピ用のピッチ/速度調整
- 特定の周波数帯（ノイズ、ハムノイズ、こもり音など）を簡易的にカットしたラフな下処理
- 個人の学習・趣味用途での手軽な音声加工（アカウント登録不要、即時ダウンロード）

## 4. プライバシー / セキュリティ方針

- **音声処理はすべてクライアント（ブラウザ）側で実行**し、アップロードされた音声ファイルはネットワークに送信しない
- APIキーやシークレット、個人情報を含むファイルは `public/` および Git リポジトリに一切配置しない
- サーバーサイドの処理を追加する場合も、Cloudflareの環境変数/Secrets機能（`wrangler secret`）を利用し、リポジトリにはハードコードしない
- `.gitignore` で `.dev.vars` や `.env*` 等の秘密情報ファイルを除外する
- 将来的にR2等でファイルを一時保存する機能を追加する場合は、オプトイン・自動削除（TTL）を前提とする

## 5. 技術スタック

| 領域 | 技術 |
|---|---|
| ホスティング/配信 | Cloudflare Workers（Static Assets） |
| デプロイ/CLI | Wrangler |
| フロントエンド | TypeScript + Vite（ビルド成果物を `public/` に出力） |
| 音声処理 | Web Audio API（`OfflineAudioContext`, `BiquadFilterNode`） |
| 速度/ピッチ独立制御 | soundtouchjs（WSOLA/位相ボコーダ方式、クライアントサイド完結） |
| 音声エンコード | 独自WAVエンコーダ（PCM書き出し） |
| テスト | Vitest（ユニット）, Playwright（E2E, 任意） |
| CI/CD | GitHub Actions + `wrangler deploy` |

Cloudflare Workers はビルド済み静的ファイル（HTML/JS/CSS）の配信のみを担当し、音声処理ロジックそのものはすべてブラウザ内のJavaScript/WebAudioで完結させる。これにより、APIキーなしでも成立するシンプルな構成になる。

## 6. アーキテクチャ

```
[ユーザーのブラウザ]
  1. 音声ファイルを選択 (File API)
  2. AudioContext.decodeAudioData でデコード
  3. UIでスピード/ピッチ/カット周波数帯域を設定
  4. OfflineAudioContext + BiquadFilterNode + soundtouchjs で加工をレンダリング
  5. 加工結果をWAVにエンコードしてBlob生成
  6. <a download> でローカルにダウンロード

[Cloudflare Workers (Static Assets)]
  - public/ 配下の index.html, JS, CSS を配信するのみ
  - サーバーサイドAPIなし（初期スコープ）、外部通信なし
```

音声データはユーザーのブラウザ内メモリのみに存在し、サーバーには一切送信されない。

## 7. ディレクトリ構成（フェーズ別）

開発フェーズごとにソースディレクトリを分割し、各フェーズの成果物を最終的に `src/main.ts` で統合してビルドし、`public/` へ出力する。

```
edit-audio/
├─ public/                        # Workers Static Assets が配信するビルド成果物（Git管理・秘密情報は置かない）
│  ├─ index.html
│  └─ assets/                     # Viteのビルド出力 (js/css)
├─ src/
│  ├─ phase0-scaffold/            # プロジェクト雛形・共通設定（tsconfig, lint設定 等）
│  ├─ phase1-upload-playback/     # ファイルアップロード・デコード・波形表示・無加工再生
│  ├─ phase2-frequency-cut/       # 周波数帯域カット (BiquadFilterNode)
│  ├─ phase3-speed-control/       # 再生スピード変更 (playbackRate 連動モード)
│  ├─ phase4-pitch-control/       # ピッチ独立制御 (soundtouchjs)
│  ├─ phase5-export/              # WAVエンコード・ダウンロード
│  ├─ shared/                     # フェーズ間で共有する型定義・ユーティリティ
│  └─ main.ts                     # 各フェーズモジュールを統合するエントリポイント
├─ worker/
│  └─ index.ts                    # Cloudflare Worker エントリ（静的配信設定）
├─ tests/
│  ├─ unit/                       # Vitest（フェーズ対応のディレクトリで分割）
│  └─ e2e/                        # Playwright
├─ docs/
│  └─ plan.md                     # 本計画書
├─ wrangler.jsonc
├─ package.json
└─ vite.config.ts
```

各 `src/phaseN-*/` ディレクトリは、原則そのフェーズのfeatureブランチ・Pull Requestの中でのみ変更する。フェーズ完了後は `shared/` へ共通化できるロジックを移動し、後続フェーズが参照する。

## 8. 音声処理の詳細設計

### 8.1 再生スピード / ピッチ
- **連動モード**（デフォルト・シンプル）: `playbackRate` を変更することで速度とピッチを同時に変化させる（テープ早回しのような挙動）
- **独立モード**: soundtouchjs（WSOLA/位相ボコーダアルゴリズム）を用いて、速度とピッチを個別に指定可能にする
- UI: スライダーで 0.5x〜2.0x（速度）、-12〜+12半音（ピッチ）を指定

### 8.2 周波数帯域カット
- Web Audio APIの `BiquadFilterNode`（`type: 'notch'`）を用いてバンドストップフィルタを構成
- ユーザーが指定した「下限Hz・上限Hz」から、中心周波数 `center = sqrt(low * high)` とQ値 `Q = center / (high - low)` を算出してフィルタに設定
- 複数帯域のカットに対応する場合は、フィルタノードをチェーン接続する

### 8.3 レンダリング〜書き出し
1. `OfflineAudioContext` 上に音源→（ピッチ/速度処理）→フィルタチェーン→出力、の順でノードを接続
2. `startRendering()` で `AudioBuffer` を取得
3. `AudioBuffer` をPCM WAV形式にエンコード（16bit PCM）
4. `Blob` 化して `URL.createObjectURL` からダウンロードリンクを生成

## 9. 画面構成（概要）

1. **アップロードエリア**: ドラッグ&ドロップ / ファイル選択
2. **波形表示**: 読み込んだ音声の簡易波形（Canvas描画）
3. **パラメータパネル**:
   - 速度スライダー
   - ピッチスライダー（独立モード切替トグル）
   - カット周波数帯域（下限/上限の2つのスライダー or 数値入力）
4. **プレビュー再生ボタン**（加工後の試聴、フル書き出し前のプレビュー）
5. **書き出し/ダウンロードボタン**

## 10. 開発フェーズと機能単位のIssue分割

各フェーズは対応する `src/phaseN-*/` ディレクトリの開発に対応し、フェーズ内はさらに機能単位でGitHub Issueに分割してfeatureブランチ・Pull Requestで進める。

| フェーズ | ディレクトリ | 機能単位のIssue |
|---|---|---|
| Phase 0: 雛形構築 | `src/phase0-scaffold/` | Vite+TypeScriptセットアップ / wrangler.jsonc設定（Workers Static Assets） / GitHub Actions CI雛形（lint・test） |
| Phase 1: アップロード・再生 | `src/phase1-upload-playback/` | ファイルアップロードUI（D&D/選択） / decodeAudioDataによるデコード処理 / 波形表示（Canvas） / 無加工音声のプレビュー再生 |
| Phase 2: 周波数帯域カット | `src/phase2-frequency-cut/` | カット帯域指定UI（下限/上限） / notchフィルタでのバンドストップ実装 / 複数帯域カット対応（フィルタチェーン） |
| Phase 3: 再生スピード | `src/phase3-speed-control/` | 速度スライダーUI / playbackRateによる連動モード実装 |
| Phase 4: ピッチ独立制御 | `src/phase4-pitch-control/` | soundtouchjs導入・ラッパー実装 / 独立モードUI（トグル+スライダー） / 速度・ピッチ独立レンダリングパイプライン統合 |
| Phase 5: 書き出し | `src/phase5-export/` | WAVエンコーダ実装（PCM16bit） / ダウンロードボタン・Blob生成 / 書き出し前プレビュー機能 |
| Phase 6: テスト・デプロイ | `tests/`, CI設定 | Vitestユニットテスト整備（フィルタ計算・WAVエンコーダ） / Playwright E2Eテスト整備 / GitHub Actionsによる自動デプロイ設定 |

## 11. テスト計画

- **ユニットテスト**: 周波数帯域→Q値/中心周波数の計算、WAVエンコーダのバイナリ構造、パラメータのバリデーション
- **手動/E2Eテスト**: 実際の音声ファイルを用いたアップロード〜加工〜ダウンロードの一連の動作確認（複数ブラウザ）
- 加工前後の音声データはテスト用サンプル（著作権フリー音源）を使用し、個人情報を含む音声は使用しない

## 12. デプロイ

- Wranglerを用いて Cloudflare Workers（Static Assets）にデプロイ
- `wrangler.jsonc` で `public/` をアセットディレクトリとして指定
- GitHub Actionsにより、`main` ブランチへのマージ時に自動デプロイ（Cloudflare API TokenはGitHub Secretsで管理し、リポジトリには含めない）

## 13. 将来的な拡張（スコープ外・検討事項）

- R2バケットを使った加工結果の一時保存・共有リンク発行（TTL付き）
- Workers AIを用いたノイズ抑制・音声強調
- MP3等の圧縮フォーマットでの書き出し対応
- 複数帯域の同時カット・イコライザーUI
