import { configDefaults, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [react(), tailwindcss()],

  // Vite's PostCSS loader searches upward through parent directories for a
  // postcss.config.* file. This project doesn't use PostCSS directly (Tailwind
  // is wired through the Vite plugin above), so an inline empty config stops
  // that upward search — otherwise an unrelated project higher up the
  // directory tree could shadow this one's build with a config file that
  // references dependencies this project doesn't install.
  css: { postcss: {} },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },

  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    // Vitest's own defaults only exclude node_modules/.git. This repo keeps
    // other git worktrees under .claude/worktrees/ (each a full checkout with
    // its own src/ tree) — without this, Vitest discovers and runs their test
    // files too, and two copies of the same test rendering into what turns
    // out to be shared jsdom state produces flaky "multiple elements found"
    // failures that have nothing to do with the code under test.
    exclude: [...configDefaults.exclude, "**/.claude/**"],
  },
}));
