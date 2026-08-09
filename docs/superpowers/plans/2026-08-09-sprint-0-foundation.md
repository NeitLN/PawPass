# Sprint 0 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the PawPass repo skeleton so Sprint 1 can start writing real UI/design-system code on day one: ADRs recorded, Tauri 2 + React + TS + Vite + Tailwind v4 scaffolded and verified to actually boot on this Windows machine, lint/format/pre-commit/CI wired, Supabase project linked, updater signing key generated, and the brand asset inventory turned into a machine-readable manifest.

**Architecture:** Single-package pnpm project at repo root (not a multi-package `pnpm-workspace.yaml` — the repo structure in SOURCE-OF-TRUTH §9.2 is one app, not a monorepo; "pnpm workspace" in the Sprint 0 backlog means "pnpm-managed project," not literal workspace packages). Tauri 2 owns `src-tauri/` (Rust), Vite owns the frontend build, Tailwind v4 is wired through `@tailwindcss/vite` (no `postcss.config.js`). CI runs on `windows-latest` only — this app never targets Linux/macOS.

**Tech Stack:** Tauri 2, React 19, TypeScript ~5.8, Vite 7, Tailwind CSS v4, oxlint, Prettier, Husky v9 + lint-staged, pnpm, Supabase CLI 2.x, GitHub Actions.

## Global Constraints

- Không lưu mật khẩu plaintext ở bất kỳ đâu: DB, log, crash report, file cấu hình (SOURCE-OF-TRUTH §1.1).
- Không hardcode màu — thiếu token thì thêm vào `tokens.css` trước (Sprint 1 work; Sprint 0 must not paint itself into a corner that makes this harder).
- Một project Supabase duy nhất cho dev và production, project ref `nzcnojcnnfiqeujfhccx` (SOURCE-OF-TRUTH §13.1).
- Không tự thêm Meta OAuth, Edge Functions, hay Cron dưới bất kỳ hình thức nào (SOURCE-OF-TRUTH §0, §16.2).
- Windows 10/11 x64 là nền tảng duy nhất — không có Linux/macOS build target ở bất kỳ đâu trong repo (CI, docs, scripts).
- `.env` thật không bao giờ được commit; chỉ `.env.example` với giá trị rỗng (đã tồn tại — không sửa trong sprint này).
- Mọi thay đổi phải để lại `git status` sạch (không file lạ ngoài ý muốn) trước khi commit.

---

### Task 1: Verify local toolchain

**Files:** none — this task only runs commands and records their output; no files are created or modified.

**Interfaces:**

- Consumes: nothing.
- Produces: a working shell environment (`pnpm` on `PATH`) that every later task depends on.

- [ ] **Step 1: Check Node.js is v20 or newer**

Run: `node -v`
Expected: a version string `v20.x.x` or higher (this machine has `v24.12.0`, which satisfies it).

- [ ] **Step 2: Install pnpm globally if it is not already on PATH**

Run: `pnpm -v`
If this fails with "command not found", run:

```bash
npm install -g pnpm
```

Then re-run `pnpm -v`. Record the exact version printed — it goes into `package.json` in Task 4 (Step 6).

- [ ] **Step 3: Confirm the Rust toolchain and Windows MSVC target**

Run: `rustc --version && cargo --version && rustup show`
Expected: `rustc`/`cargo` print version strings, and the `active toolchain` line in `rustup show` reads `stable-x86_64-pc-windows-msvc`. If the active toolchain is anything else (e.g. `gnu`), stop and install the MSVC toolchain first — Tauri on Windows requires it (`rustup toolchain install stable-x86_64-pc-windows-msvc` then `rustup default stable-x86_64-pc-windows-msvc`).

- [ ] **Step 4: Confirm the MSVC linker is reachable**

Run:

```bash
mkdir -p /tmp/rustprobe && cd /tmp/rustprobe && cargo init --name rustprobe -q && cargo build -q && test -f target/debug/rustprobe.exe && echo "LINKER OK" && cd - && rm -rf /tmp/rustprobe
```

Expected output: `LINKER OK`. If the build fails with a linker error, Visual Studio Build Tools (Desktop development with C++ workload) are missing — install them before continuing; Tauri cannot produce a Windows binary without this.

- [ ] **Step 5: Confirm WebView2 runtime is installed**

Run (PowerShell):

```powershell
Get-ItemProperty "HKLM:\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}" -Name pv -ErrorAction SilentlyContinue | Select-Object -ExpandProperty pv
```

Expected: a version string (this machine has `151.0.4129.72`). If empty, install the WebView2 Evergreen Runtime before Task 4's verification step, or `pnpm tauri dev` will fail to open a window. Windows 11 ships this by default; only older Windows 10 installs are likely to be missing it.

- [ ] **Step 6: Confirm you are logged into the Supabase CLI**

Run: `supabase projects list`
Expected: a JSON array containing a project with `"ref":"nzcnojcnnfiqeujfhccx"`. If this errors with an auth prompt, run `supabase login` first (interactive — follow its browser prompt).

- [ ] **Step 7: Commit**

Nothing to commit — this task only verifies environment state. Proceed to Task 2.

---

### Task 2: Write ADR-001 (Tauri 2 over Electron)

**Files:**

- Create: `docs/adr/0001-tauri-2-over-electron.md`

**Interfaces:**

- Consumes: nothing.
- Produces: a permanent architecture-decision record other ADRs and future contributors can link to.

- [ ] **Step 1: Create the ADR directory and file**

```bash
mkdir -p docs/adr
```

Write `docs/adr/0001-tauri-2-over-electron.md` with this exact content:

```markdown
# ADR-001: Dùng Tauri 2 thay vì Electron

- Status: Accepted
- Date: 2026-08-09
- Nguồn quyết định: `docs/SOURCE-OF-TRUTH.md` §9.1, Sprint 0 backlog §12.3

## Context

PawPass là một desktop app quản lý mật khẩu tài khoản mạng xã hội, chạy trên
Windows 10/11 x64, xử lý dữ liệu nhạy cảm (mật khẩu tài khoản, mật khẩu email,
recovery code) ngay trên máy người dùng trước khi mã hoá gửi lên Supabase.

Hai lựa chọn desktop shell khả dĩ cho một frontend React + TypeScript:
Electron (bundle Chromium + Node.js riêng) và Tauri 2 (dùng WebView2 có sẵn
của hệ điều hành, backend native viết bằng Rust).

## Decision

Dùng **Tauri 2** làm desktop shell.

Lý do quyết định:

1. **Bundle nhẹ hơn nhiều.** Electron đóng gói cả một bản Chromium runtime
   (~150-200 MB); Tauri dùng WebView2 đã có sẵn trên Windows 11 (và cài kèm
   nhẹ trên Windows 10 qua `embedBootstrapper`, xem SOURCE-OF-TRUTH §13.1) —
   installer chỉ vài MB thay vì hàng trăm MB.
2. **Rust cho lớp bảo mật.** Toàn bộ logic mã hoá (Argon2id, XChaCha20-Poly1305,
   zeroize) chạy trong Rust — ngôn ngữ có kiểu bộ nhớ an toàn và hệ sinh thái
   crypto trưởng thành (`argon2`, `chacha20poly1305`, `zeroize` crates), thay
   vì phải tự triển khai hoặc tin tưởng một binding Node.js cho việc này.
   Electron không ép buộc ranh giới rõ ràng giữa "vùng chạm plaintext" và
   phần còn lại; Tauri's IPC command boundary làm việc đó tự nhiên hơn
   (SOURCE-OF-TRUTH §9.3 ARCH-07: đúng hai lệnh Rust chạm plaintext).
3. **Permission allowlist tường minh.** Tauri 2 capabilities system yêu cầu
   khai báo rõ từng permission (`opener:allow-open-url` với scope domain cụ
   thể, `clipboard-manager:allow-write-text` không kèm `read-text`, v.v. —
   xem SOURCE-OF-TRUTH §9.3 ARCH-08). Electron không có cơ chế tương đương
   sẵn có; phải tự dựng bằng tay và dễ bỏ sót.
4. **Gọi native command rõ ràng.** Ranh giới React ↔ Rust là các lệnh
   `#[tauri::command]` có kiểu tường minh, dễ audit trong review bảo mật
   (SOURCE-OF-TRUTH §12.2: "security review cho mọi thay đổi chạm secret").

## Consequences

- Toàn bộ logic mã hoá viết bằng Rust, không phải TypeScript/Node — cần
  thành thạo Rust cho phần `src-tauri/src/security/` (Sprint 2).
- Không có hệ sinh thái Electron-only (một số thư viện Node native chỉ hỗ
  trợ Electron) — chưa gặp nhu cầu nào trong scope MVP của PawPass.
- WebView2 là runtime bắt buộc trên máy người dùng cuối; đã xử lý bằng
  `webviewInstallMode: embedBootstrapper` (SOURCE-OF-TRUTH §13.1 ARCH-06).
- Testing desktop-level dùng `tauri-driver` thay vì Spectron/Playwright cho
  Electron (SOURCE-OF-TRUTH §9.1 test pyramid).
```

- [ ] **Step 2: Commit**

```bash
git add docs/adr/0001-tauri-2-over-electron.md
git commit -m "docs: thêm ADR-001 (Tauri 2 thay Electron)"
```

---

### Task 3: Write ADR-002 (Argon2id + XChaCha20-Poly1305 over Stronghold)

**Files:**

- Create: `docs/adr/0002-argon2id-xchacha20-over-stronghold.md`

**Interfaces:**

- Consumes: nothing.
- Produces: a permanent architecture-decision record Sprint 2's crypto implementation task will cite directly.

- [ ] **Step 1: Write the ADR**

Write `docs/adr/0002-argon2id-xchacha20-over-stronghold.md` with this exact content:

```markdown
# ADR-002: Argon2id + XChaCha20-Poly1305 tự triển khai, thay vì Tauri Stronghold

- Status: Accepted
- Date: 2026-08-09
- Nguồn quyết định: `docs/SOURCE-OF-TRUTH.md` §9.1 ARCH-02, §11.2

## Context

Tài liệu Master Roadmap gốc (v1.0, 08/08/2026) chỉ định hai cơ chế khác
nhau cho cùng một việc — mã hoá secrets cục bộ — mà không nhận ra chúng
mâu thuẫn: §10.1 của tài liệu đó nói dùng **Tauri Stronghold** (plugin
official, lưu snapshot file mã hoá cục bộ), còn §12.2 của chính tài liệu
đó mô tả đầy đủ một sơ đồ khác: DEK 32 byte ngẫu nhiên → Argon2id sinh KEK
từ master password → KEK bọc DEK → mỗi secret payload có nonce riêng +
XChaCha20-Poly1305.

Đây không phải một lựa chọn giữa hai phương án tương đương — chỉ một
trong hai tương thích với yêu cầu đồng bộ đa thiết bị đã chốt ở
SOURCE-OF-TRUTH §1 (Supabase Auth/Postgres/Realtime từ ngày đầu, không
tách pha).

## Decision

Bỏ Stronghold. Tự triển khai bằng các crate Rust `argon2` + `chacha20poly1305`

- `zeroize` + `rand`, đúng theo sơ đồ đã mô tả ở §12.2 gốc (nay là
  SOURCE-OF-TRUTH §11.2).

Lý do quyết định:

1. **Stronghold không đồng bộ được giữa các máy.** Stronghold lưu một
   snapshot file cục bộ, mã hoá bằng khoá riêng của máy đó. Máy B không
   có cách nào mở được snapshot của máy A. Sơ đồ DEK/KEK ở §12.2 thì có:
   `wrapped_dek_by_master` là một giá trị nhỏ, đồng bộ được qua cột
   Postgres bình thường (`user_keyrings.wrapped_dek_by_master`) — bất kỳ
   máy nào biết master password đều giải mã ra cùng một DEK.
2. **PawPass cần đúng một DEK dùng chung, không phải một kho khoá cục bộ
   mỗi máy.** Đây là yêu cầu kiến trúc, không phải sở thích: FR-08 (đồng
   bộ đa máy) và AT-03/AT-14 (SOURCE-OF-TRUTH §15.2) đòi hỏi máy B mở
   được đúng những secrets mà máy A vừa tạo, ngay sau khi đồng bộ xong.
3. **Kiểm soát trực tiếp tham số KDF.** Tự dùng crate `argon2` cho phép
   version-hoá tham số (`m=64 MiB, t=3, p=1` — SOURCE-OF-TRUTH §11.2) và
   tăng dần theo thời gian mà không phụ thuộc vào lộ trình phát triển của
   plugin Stronghold.
4. **Ít bề mặt tấn công hơn cho nhu cầu thực tế.** PawPass không cần toàn
   bộ tính năng của Stronghold (nhiều vault, actor model, snapshot
   versioning) — chỉ cần đúng một thao tác: bọc/mở một DEK 32 byte bằng
   một mật khẩu. Tự triển khai với các crate đã kiểm toán kỹ
   (RustCrypto's `chacha20poly1305`) là bề mặt nhỏ hơn, dễ audit hơn.

## Consequences

- PawPass tự chịu trách nhiệm toàn bộ vòng đời khoá (Sprint 2), không dựa
  vào plugin bên thứ ba cho phần bảo mật lõi. Mọi thay đổi ở
  `src-tauri/src/security/` bắt buộc security review (SOURCE-OF-TRUTH
  §12.2 DoD).
- Payload bí mật dùng schema riêng đã chốt ở SOURCE-OF-TRUTH §11.6 —
  không tương thích ngược với bất kỳ định dạng nào Stronghold có thể đã
  tạo ra nếu một bản thử nghiệm trước đó dùng nó (không có — repo chưa có
  code, không có dữ liệu cần migrate).
- DEK không bao giờ rời khỏi Rust dưới dạng plaintext lâu dài; chỉ sống
  trong `Zeroizing<[u8; 32]>` (SOURCE-OF-TRUTH §11.2 bước 5).
```

- [ ] **Step 2: Commit**

```bash
git add docs/adr/0002-argon2id-xchacha20-over-stronghold.md
git commit -m "docs: thêm ADR-002 (Argon2id + XChaCha20-Poly1305 thay Stronghold)"
```

---

### Task 4: Scaffold Tauri 2 + React + TS + Vite

**Files:**

- Create (via `create-tauri-app`, then moved into repo root): `package.json`, `index.html`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `src/main.tsx`, `src/App.tsx`, `src/App.css`, `src/vite-env.d.ts`, `src/assets/react.svg`, `public/tauri.svg`, `public/vite.svg`, `.vscode/extensions.json`, `src-tauri/**` (Cargo.toml, build.rs, src/main.rs, src/lib.rs, tauri.conf.json, capabilities/default.json, icons/*).
- Modify: `.gitignore` (append four missing rules — see Step 5).
- Do NOT touch: `README.md`, `docs/`, `.env.example` — `create-tauri-app` generates its own generic `README.md` and would silently overwrite ours if scaffolded directly into the repo root. This task scaffolds into a throwaway subfolder first and moves only the new files up.

**Interfaces:**

- Consumes: pnpm from Task 1.
- Produces: a `pnpm tauri dev`-able Tauri app. Later tasks (5, 6, 7, 8) all add to this `package.json` and this `src/` tree.

**⚠️ Do not run `create-tauri-app` with `.` as the project name directly in the repo root.** It has been verified (in an isolated copy) to unconditionally overwrite `README.md` and `.gitignore` and delete `docs/`, `.env.example`, and any other existing top-level files when given `--force` on a non-empty directory. The steps below scaffold into a subfolder and move only the new files up, which was verified safe in an isolated copy of this exact repo state.

- [ ] **Step 1: Scaffold into a throwaway subfolder**

```bash
npx --yes create-tauri-app@latest pawpass-scaffold-tmp --manager pnpm --template react-ts --identifier com.pawpass.app -y
```

Expected: a `pawpass-scaffold-tmp/` directory appears containing `package.json`, `src/`, `src-tauri/`, etc.

- [ ] **Step 2: Move the generated files into the repo root, excluding README.md and .gitignore**

```bash
cd pawpass-scaffold-tmp
mv index.html package.json tsconfig.json tsconfig.node.json vite.config.ts src src-tauri public .vscode ../
cd ..
rm -rf pawpass-scaffold-tmp
```

Expected: `ls` at repo root now shows `index.html`, `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `src/`, `src-tauri/`, `public/`, `.vscode/` alongside the pre-existing `README.md`, `docs/`, `.env.example`, `.gitignore`, `.superpowers/`. `pawpass-scaffold-tmp/` no longer exists.

- [ ] **Step 3: Verify nothing pre-existing was touched**

```bash
git status --short
```

Expected: every line is `??` (untracked, new) for the files moved in Step 2 — no line shows `README.md`, `docs/...`, `.env.example`, or `.gitignore` as modified or deleted. If any of those four show up as changed, stop and investigate before proceeding (do not commit).

- [ ] **Step 4: Set the product name and identifier correctly**

The scaffold used `pawpass-scaffold-tmp` as the folder name, which `create-tauri-app` also wrote into `package.json`'s `"name"` and `src-tauri/tauri.conf.json`'s `"productName"` / window `"title"`. Fix both:

In `package.json`, change:

```json
  "name": "pawpass-scaffold-tmp",
```

to:

```json
  "name": "pawpass",
```

In `src-tauri/tauri.conf.json`, change:

```json
  "productName": "pawpass-scaffold-tmp",
```

to:

```json
  "productName": "PawPass",
```

and change:

```json
        "title": "pawpass-scaffold-tmp",
```

to:

```json
        "title": "PawPass",
```

- [ ] **Step 5: Merge in the four `.gitignore` rules the scaffold has that our existing file doesn't**

Our existing `.gitignore` already covers `node_modules/`, `dist/`, `src-tauri/target/`, `src-tauri/gen/`, and more (it was written with Tauri in mind from the start). It is missing four categories the scaffold's own `.gitignore` has. Add them — do not replace the file, append to it.

Add this block to the end of `.gitignore`:

```gitignore

# --- log files (from create-tauri-app scaffold) ---
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*
*.sw?

# --- VS Code local settings (keep only the shared extension recommendations) ---
.vscode/*
!.vscode/extensions.json
```

- [ ] **Step 6: Pin the exact pnpm version and Node floor for reproducibility**

Add these two fields to `package.json` (top level, alongside `"name"` and `"private"`) — replace `<PNPM_VERSION>` with whatever `pnpm -v` printed in Task 1 Step 2:

```json
  "packageManager": "pnpm@<PNPM_VERSION>",
  "engines": {
    "node": ">=20"
  },
```

- [ ] **Step 7: Install dependencies**

```bash
pnpm install
```

If this fails with `[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: esbuild@...`, run:

```bash
pnpm approve-builds --all
```

Then re-run `pnpm install`.

- [ ] **Step 8: Verify the frontend builds**

```bash
pnpm build
```

Expected: exits 0, produces a `dist/` folder. (This step will keep failing until Task 5 fixes a real, already-confirmed environment issue — see the note below — if the build error mentions `Cannot find module '@tailwindcss/postcss'` or references a `postcss.config.mjs` path outside this repo, that is Task 5's fix, not a bug in this task. If you see a _different_ build error, stop and diagnose before continuing.)

- [ ] **Step 9: Verify the full Tauri app actually boots on this machine**

```bash
pnpm tauri dev
```

Expected: this compiles ~360 Rust crates the first time (takes 1-3 minutes; subsequent runs are incremental and much faster), then opens a desktop window titled "PawPass" showing the default Vite+React demo page. Confirm the window opens with no error dialog, then close it (or Ctrl+C in the terminal) before continuing. This is the Sprint 0 quality gate from SOURCE-OF-TRUTH §12 ("Build dev chạy Windows") — it must be run and observed once by a human, not just inferred from `cargo check` succeeding.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "chore: scaffold Tauri 2 + React + TS + Vite qua create-tauri-app"
```

---

### Task 5: Wire up Tailwind CSS v4

**Files:**

- Modify: `vite.config.ts`, `src/main.tsx`, `package.json` (via `pnpm add`)
- Create: `src/index.css`
- Delete: `src/App.css`, `src/assets/react.svg` (only referenced by the demo counter page this task replaces)

**Interfaces:**

- Consumes: the scaffold from Task 4.
- Produces: a working Tailwind v4 pipeline. Sprint 1's `tokens.css` work (SOURCE-OF-TRUTH §7.2) will `@import` into `src/index.css` alongside the Tailwind import added here.

- [ ] **Step 1: Install Tailwind v4 and its Vite plugin**

```bash
pnpm add -D tailwindcss @tailwindcss/vite
```

- [ ] **Step 2: Replace `vite.config.ts` with this exact content**

This machine (and any machine where the repo lives under a user profile directory that also contains an unrelated Node/Tailwind project higher up the tree) can have a stray `postcss.config.*` file in a parent directory. Vite's PostCSS loader searches upward through parent directories by default and will find and try to load such a file even though this project uses the Tailwind Vite plugin, not PostCSS — causing a `Cannot find module '@tailwindcss/postcss'` build failure that has nothing to do with this project's own dependencies. Setting `css.postcss` to a literal empty object stops that upward search. This was reproduced and confirmed fixed in testing.

```typescript
import { defineConfig } from "vite";
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
}));
```

- [ ] **Step 3: Create `src/index.css`**

```css
@import "tailwindcss";
```

- [ ] **Step 4: Delete the unused demo stylesheet and asset**

```bash
rm src/App.css src/assets/react.svg
rmdir src/assets 2>/dev/null || true
```

- [ ] **Step 5: Replace `src/App.tsx` with a minimal placeholder**

The scaffold's default counter demo imports `./App.css` and `reactLogo`, both just deleted. Sprint 1 replaces this file's contents entirely with the real Dashboard shell (SOURCE-OF-TRUTH §5) — this placeholder exists only to prove the Tailwind pipeline actually applies utility classes, verified below.

```tsx
function App() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-900 text-orange-400">
      <h1 className="text-3xl font-bold">PawPass</h1>
    </main>
  );
}

export default App;
```

- [ ] **Step 6: Replace `src/main.tsx` to import the new stylesheet**

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 7: Verify Tailwind utility classes actually compile, not just that the build succeeds**

```bash
pnpm build
grep -o "min-h-screen\|bg-slate-900\|text-orange-400" dist/assets/*.css | sort -u
```

Expected: all three class names printed back — confirms Tailwind actually processed and emitted CSS for the classes used, not just its base reset layer.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: wire up Tailwind CSS v4 qua @tailwindcss/vite"
```

---

### Task 6: Add oxlint + Prettier

**Files:**

- Create: `.oxlintrc.json`, `.prettierrc.json`, `.prettierignore`
- Modify: `package.json` (add `lint`, `lint:fix`, `format`, `format:check`, `typecheck` scripts)

**Interfaces:**

- Consumes: the scaffold from Task 4.
- Produces: `pnpm lint`, `pnpm format:check`, `pnpm typecheck` — Task 7 (pre-commit hook) and Task 8 (CI) both call these by name.

- [ ] **Step 1: Install oxlint and Prettier**

```bash
pnpm add -D oxlint prettier
```

- [ ] **Step 2: Create `.oxlintrc.json`**

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["typescript", "unicorn", "oxc", "react", "react-hooks"],
  "categories": {
    "correctness": "error",
    "suspicious": "warn",
    "perf": "warn"
  },
  "rules": {
    "react/react-in-jsx-scope": "off"
  },
  "env": { "builtin": true, "browser": true }
}
```

The `react/react-in-jsx-scope` rule is disabled because this project uses the automatic JSX runtime (`"jsx": "react-jsx"` in `tsconfig.json`, set by the scaffold) — `React` is never meant to be in scope for JSX to work, so the rule is a false positive here. This was confirmed by running oxlint against the scaffolded template.

- [ ] **Step 3: Create `.prettierrc.json`**

```json
{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "all",
  "printWidth": 100
}
```

- [ ] **Step 4: Create `.prettierignore`**

```
dist/
node_modules/
src-tauri/target/
src-tauri/gen/
pnpm-lock.yaml
```

- [ ] **Step 5: Add scripts to `package.json`**

Add these entries to the `"scripts"` object (alongside the existing `dev`, `build`, `preview`, `tauri`):

```json
    "lint": "oxlint .",
    "lint:fix": "oxlint . --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "typecheck": "tsc --noEmit"
```

- [ ] **Step 6: Run format once to normalize the files this plan just created**

```bash
pnpm format
```

- [ ] **Step 7: Verify lint, format, and typecheck all pass clean**

```bash
pnpm lint
pnpm format:check
pnpm typecheck
```

Expected: all three exit 0 with no errors.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: thêm oxlint + Prettier"
```

---

### Task 7: Add Husky + lint-staged pre-commit hook

**Files:**

- Create: `.husky/pre-commit`, `.lintstagedrc.json`
- Modify: `package.json` (add `"prepare": "husky"` script, add `husky`/`lint-staged` devDependencies)

**Interfaces:**

- Consumes: `pnpm lint:fix` and `pnpm format` from Task 6 (referenced by name inside `.lintstagedrc.json`).
- Produces: a `git commit` gate that auto-fixes and blocks on lint/format/rustfmt issues in staged files.

- [ ] **Step 1: Install husky and lint-staged**

```bash
pnpm add -D husky lint-staged
```

- [ ] **Step 2: Initialize husky**

```bash
pnpm exec husky init
```

Expected: creates `.husky/pre-commit` (containing `npm test` by default) and adds `"prepare": "husky"` to `package.json`'s `"scripts"`.

- [ ] **Step 3: Replace `.husky/pre-commit` with this exact content**

```sh
pnpm exec lint-staged
```

- [ ] **Step 4: Create `.lintstagedrc.json`**

```json
{
  "*.{ts,tsx}": ["oxlint --fix", "prettier --write"],
  "*.{json,md,css,html,yml,yaml}": ["prettier --write"],
  "src-tauri/**/*.rs": ["rustfmt --edition 2021"]
}
```

- [ ] **Step 5: Verify the hook actually runs**

```bash
git add -A
git commit -m "chore: thêm Husky + lint-staged pre-commit hook"
```

Expected: the commit output shows `lint-staged` running (its own progress output) before the commit completes. If the hook does not fire at all, re-run `pnpm exec husky init` and check that `git config core.hooksPath` points at `.husky` (husky sets this automatically).

---

### Task 8: Add GitHub Actions CI workflow

**Files:**

- Create: `.github/workflows/ci.yml`

**Interfaces:**

- Consumes: `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm build` (Task 6), `cargo fmt`/`cargo clippy` (Rust toolchain from Task 1).
- Produces: a CI gate for future pull requests. No later task depends on this one.

- [ ] **Step 1: Create `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  check:
    # PawPass only ships Windows — no Linux/macOS job exists on purpose.
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "pnpm"

      - uses: dtolnay/rust-toolchain@stable
        with:
          components: rustfmt, clippy

      - uses: Swatinem/rust-cache@v2
        with:
          workspaces: "src-tauri -> target"

      - name: Install frontend dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint (frontend)
        run: pnpm lint

      - name: Format check (frontend)
        run: pnpm format:check

      - name: Typecheck (frontend)
        run: pnpm typecheck

      - name: Build (frontend)
        run: pnpm build

      - name: Format check (Rust)
        run: cargo fmt --manifest-path src-tauri/Cargo.toml --check

      - name: Lint (Rust)
        run: cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
```

This intentionally runs `pnpm build` (Vite frontend only), not `pnpm tauri build` (full installer bundling) — a full Windows installer build is slow and belongs to the release workflow Sprint 5 sets up (SOURCE-OF-TRUTH §13.1), not the every-commit CI gate.

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: thêm GitHub Actions CI (lint, format, typecheck, build) trên windows-latest"
```

---

### Task 9: Link the Supabase project and document the migration workflow

**Files:**

- Create: `supabase/config.toml`, `supabase/.gitignore` (via `supabase init`)
- Modify: `README.md` (add a short "Supabase workflow" note)

**Interfaces:**

- Consumes: the authenticated Supabase CLI session from Task 1 Step 6.
- Produces: `supabase/` scaffold that Sprint 3's migrations (SOURCE-OF-TRUTH §10, §12.3) will populate.

- [ ] **Step 1: Initialize the Supabase local config**

```bash
supabase init --workdir .
```

Expected: creates `supabase/config.toml` and `supabase/.gitignore`.

- [ ] **Step 2: Link to the existing PawPass project**

```bash
supabase link --project-ref nzcnojcnnfiqeujfhccx
```

Expected: confirms the link (this project ref was already visible and authenticated in `supabase projects list` from Task 1 Step 6 — it is the project SOURCE-OF-TRUTH §13.1 names as the single dev+production project). This command only writes local link state; it does not touch remote schema or data.

- [ ] **Step 3: Add a "Việc tiếp theo" note to README.md documenting the push workflow**

Find this line in `README.md`:

```markdown
Stack
```

Insert a new section immediately before it:

````markdown
## Quy trình Supabase

Migration nằm ở `supabase/migrations/` (chưa có file nào — schema thật bắt đầu ở Sprint 3, xem `docs/SOURCE-OF-TRUTH.md` §10). Một project Supabase duy nhất cho cả dev và production (project ref `nzcnojcnnfiqeujfhccx`) — không có bước "test trên local trước". Khi có migration:

```bash
supabase migration new <ten_migration>
# ... viết SQL vào file vừa tạo ...
supabase db push
```
````

Không dùng `supabase start` (Docker) cho vòng lặp phát triển thường ngày — xem lý do ở SOURCE-OF-TRUTH §13.1.

---

- [ ] **Step 4: Commit**

```bash
git add supabase/ README.md
git commit -m "chore: supabase link project nzcnojcnnfiqeujfhccx + ghi lại quy trình migration"
```

---

### Task 10: Generate the Tauri updater signing keypair

**Files:**

- Modify: `src-tauri/tauri.conf.json` (add `plugins.updater.pubkey`)

**Interfaces:**

- Consumes: `@tauri-apps/cli` from Task 4 (provides the `pnpm tauri signer generate` command).
- Produces: a public key embedded in the very first build. No later Sprint-0 task depends on this; Sprint 5 wires up the actual updater plugin and endpoint.

**⚠️ This task must be run by a human at the keyboard, not delegated to an agent.** The private key this generates is a permanent secret — SOURCE-OF-TRUTH §9.3 ARCH-05 calls it "cửa một chiều": if it's lost, no future build can push updates to anyone who already installed a version signed with it. It should be protected by a password only the human knows, stored in a password manager, never pasted into a chat session or committed to git.

- [ ] **Step 1 (human): Generate the keypair**

Run, choosing a real password when prompted (do not leave it empty):

```bash
pnpm tauri signer generate -w ~/.tauri/pawpass-updater.key
```

This writes two files: `~/.tauri/pawpass-updater.key` (private — keep it out of this repo, back it up somewhere durable) and `~/.tauri/pawpass-updater.key.pub` (public — safe to embed in the app). The command also prints the public key content to the terminal.

- [ ] **Step 2 (human or agent, using the public key printed in Step 1): Embed the public key**

In `src-tauri/tauri.conf.json`, add a `plugins` block with the public key content from Step 1 (do not add the `updater` Rust plugin dependency or register it in `src-tauri/src/lib.rs` yet — that is Sprint 5's job, once signing/versioning is otherwise ready per SOURCE-OF-TRUTH §13.2):

```json
  "plugins": {
    "updater": {
      "pubkey": "<PASTE THE PUBLIC KEY CONTENT FROM STEP 1 HERE>",
      "endpoints": []
    }
  },
```

Add this as a new top-level key in `tauri.conf.json`, alongside `"app"` and `"bundle"`.

- [ ] **Step 3: Verify the app still builds with the new config key present**

```bash
pnpm build
cargo check --manifest-path src-tauri/Cargo.toml
```

Expected: both exit 0. The `updater` config block is inert JSON at this point (no plugin registered to read it), so this should have no effect on the running app — this step exists to confirm adding it didn't break config parsing.

- [ ] **Step 4: Commit**

```bash
git add src-tauri/tauri.conf.json
git commit -m "chore: nhúng public key sinh cho Tauri updater (SOURCE-OF-TRUTH §9.3 ARCH-05)"
```

Do **not** `git add` anything under `~/.tauri/` — it is outside the repo and must stay that way.

---

### Task 11: Create the brand asset manifest and close out Sprint 0

**Files:**

- Create: `docs/brand-reference/manifest.json`
- Modify: `README.md` (check off the Sprint 0 items in "Việc tiếp theo")

**Interfaces:**

- Consumes: the asset inventory already documented in `docs/SOURCE-OF-TRUTH.md` §8.3.
- Produces: a machine-readable catalog Sprint 1's `MochiIllustration` component can eventually read from, instead of the prose table in §8.3 (which stays as the human-readable source; this file is the same information in a form code can consume).

- [ ] **Step 1: Create `docs/brand-reference/manifest.json`**

```json
{
  "$comment": "Sinh từ docs/SOURCE-OF-TRUTH.md §8.3 (09/08/2026). Cập nhật cả hai chỗ khi thêm/đổi asset.",
  "updated": "2026-08-09",
  "assets": [
    {
      "id": "app-icon-source",
      "file": "docs/brand-reference/pawpass-app-logo.png",
      "role": "app-icon-source",
      "mascotState": null,
      "width": 1254,
      "height": 1254,
      "hasAlpha": false,
      "background": "navy-squircle",
      "productionReady": false,
      "notes": "Nguồn duy nhất cho app icon multi-resolution (SOURCE-OF-TRUTH §13.1). Chưa xuất .ico các cỡ 16-256px — việc còn thiếu #3 ở §8.3."
    },
    {
      "id": "wordmark-lockup",
      "file": "docs/brand-reference/pawpass-logo-with-name.png",
      "role": "wordmark-with-logomark",
      "mascotState": null,
      "width": 1254,
      "height": 1254,
      "hasAlpha": true,
      "transparentPercent": 60.0,
      "productionReady": false,
      "notes": "Wordmark vẽ chung vào ảnh raster — dùng được cho splash/About/README ở cỡ lớn, không dùng cho sidebar hay dưới ~200px. Cần dựng lại bằng Nunito Sans ExtraBold (việc còn thiếu #2 ở §8.3)."
    },
    {
      "id": "logomark-portrait",
      "file": "docs/brand-reference/mochi-logo.png",
      "role": "logomark-portrait-head",
      "mascotState": null,
      "width": 1254,
      "height": 1254,
      "hasAlpha": true,
      "transparentPercent": 48.4,
      "productionReady": true,
      "notes": "Logomark chính thức (sidebar, app icon nguồn phụ, About). Trùng byte với pawpass.png (cùng MD5) — chỉ giữ file này, đừng dùng cả hai."
    },
    {
      "id": "mascot-neutral",
      "file": "docs/brand-reference/pawpass-shiba-genz-cute-pack/03-organize-accounts-genz.png",
      "role": "mascot-illustration",
      "mascotState": "neutral",
      "width": 1254,
      "height": 1254,
      "hasAlpha": true,
      "productionReady": true,
      "notes": "Toàn thân, không dùng chung với mochi-logo.png (chân dung đầu) trong cùng MochiIllustration component."
    },
    {
      "id": "mascot-wave",
      "file": "docs/brand-reference/pawpass-shiba-genz-cute-pack/01-wave-genz.png",
      "role": "mascot-illustration",
      "mascotState": "wave",
      "width": 1254,
      "height": 1254,
      "hasAlpha": true,
      "productionReady": true,
      "notes": null
    },
    {
      "id": "mascot-security",
      "file": "docs/brand-reference/pawpass-shiba-genz-cute-pack/02-security-genz.png",
      "role": "mascot-illustration",
      "mascotState": "security",
      "width": 1254,
      "height": 1254,
      "hasAlpha": true,
      "productionReady": true,
      "notes": null
    },
    {
      "id": "mascot-search",
      "file": "docs/brand-reference/pawpass-shiba-genz-cute-pack/04-search-genz.png",
      "role": "mascot-illustration",
      "mascotState": "search",
      "width": 1254,
      "height": 1254,
      "hasAlpha": true,
      "productionReady": true,
      "notes": null
    },
    {
      "id": "mascot-success",
      "file": "docs/brand-reference/pawpass-shiba-genz-cute-pack/06-success-genz.png",
      "role": "mascot-illustration",
      "mascotState": "success",
      "width": 1254,
      "height": 1254,
      "hasAlpha": true,
      "productionReady": true,
      "notes": null
    },
    {
      "id": "mascot-notification-unassigned",
      "file": "docs/brand-reference/pawpass-shiba-genz-cute-pack/05-notification-genz.png",
      "role": "mascot-illustration",
      "mascotState": null,
      "width": 1254,
      "height": 1254,
      "hasAlpha": true,
      "productionReady": true,
      "notes": "Chưa gán state nào trong §8.1. Dùng tạm cho Sync (§8.3) cho tới khi có asset thật."
    },
    {
      "id": "mascot-support-unassigned",
      "file": "docs/brand-reference/pawpass-shiba-genz-cute-pack/07-support-genz.png",
      "role": "mascot-illustration",
      "mascotState": null,
      "width": 1254,
      "height": 1254,
      "hasAlpha": true,
      "productionReady": true,
      "notes": "Chưa gán state nào trong §8.1. Dùng tạm cho Offline (§8.3) cho tới khi có asset thật."
    }
  ],
  "mascotStateCoverage": {
    "neutral": "mascot-neutral",
    "wave": "mascot-wave",
    "search": "mascot-search",
    "security": "mascot-security",
    "success": "mascot-success",
    "sync": null,
    "offline": null,
    "import": null
  },
  "openTasks": [
    "Sinh 2 tư thế còn thiếu: Sync, Offline (dùng ảnh trong pack làm character reference)",
    "Dựng wordmark dạng vector/text thật bằng Nunito Sans ExtraBold, tách khỏi ảnh mascot",
    "Xuất app icon .ico các cỡ 16/24/32/48/64/128/256 từ pawpass-app-logo.png, kiểm riêng bản 16px",
    "Xuất bản outline/mono cho system tray"
  ]
}
```

- [ ] **Step 2: Update README.md's "Việc tiếp theo" checklist**

Find this block in `README.md`:

```markdown
5. Scaffold Tauri 2 + React + TS + Vite + Tailwind, pnpm workspace
6. Sinh **khoá updater** — cửa một chiều, xem §9.3
```

Replace it with:

```markdown
5. ~~Scaffold Tauri 2 + React + TS + Vite + Tailwind, pnpm workspace~~ ✅ (Sprint 0)
6. ~~Sinh **khoá updater**~~ ✅ (Sprint 0)
```

- [ ] **Step 3: Final Sprint 0 verification — the quality gate from SOURCE-OF-TRUTH §12**

Run the full check sequence one more time from a clean state to confirm nothing in Tasks 5-11 broke anything from Task 4:

```bash
pnpm install
pnpm lint
pnpm format:check
pnpm typecheck
pnpm build
cargo fmt --manifest-path src-tauri/Cargo.toml --check
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
git status --short
```

Expected: every command exits 0, and `git status --short` is empty (everything committed). This matches SOURCE-OF-TRUTH §12's Sprint 0 quality gate: "Build dev chạy Windows; không commit secret."

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "docs: brand asset manifest + chốt Sprint 0"
```

---

## Self-Review Notes

**Spec coverage against SOURCE-OF-TRUTH §12.3 Sprint 0 backlog:**

- ADR-001, ADR-002 → Tasks 2, 3.
- pnpm workspace, lint, format, commit hooks, CI → Tasks 4, 6, 7, 8.
- `supabase link` + migration workflow → Task 9.
- Sinh khoá updater → Task 10.
- Chuẩn hoá logo/Mochi asset manifest → Task 11.
- Sprint 0 quality gate ("Build dev chạy Windows; không commit secret") → Task 4 Step 9 (human-observed boot) and Task 11 Step 3 (full re-verification).

**Deviations from the literal spec text, and why:**

- §9.3 ARCH-05 says embed the pubkey "ngay cả khi chưa bật updater (`active: false`)" — Tauri v2's actual updater plugin config schema has no `active` boolean (that was Tauri v1 semantics). Task 10 achieves the same intent — pubkey shipped in the first build, updater not functionally live — by adding the config block without registering the Rust plugin, rather than by setting a field that doesn't exist in v2.
- "pnpm workspace" is implemented as a single-package pnpm project, not a `pnpm-workspace.yaml` multi-package workspace — the repo structure in §9.2 is one app, and no second package exists that would justify one. Documented in this plan's Architecture section.
