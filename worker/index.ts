interface Env {
  ASSETS: Fetcher;
}

export default {
  async fetch(request, env) {
    // 音声処理はすべてブラウザ側(Web Audio API)で完結するため、
    // このWorkerはpublic/配下の静的アセット配信のみを担当する。
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
