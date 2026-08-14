import { defineConfig } from "vite";

// public/ is Cloudflare Workers' static assets directory (the deployed output),
// so Vite's own "copy public/ verbatim" behavior is disabled here to avoid a
// source/output collision, and the build output is pointed at public/ instead.
export default defineConfig({
  publicDir: false,
  build: {
    outDir: "public",
    emptyOutDir: true,
  },
});
