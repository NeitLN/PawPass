# MochiIllustration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `MochiIllustration` component — the app's mascot artwork, rendered in 7 MVP states, with the white-sticker-keyline problem solved via an always-on drop-shadow plus a size-gated tinted backdrop.

**Architecture:** A single presentational React component (`src/components/ui/MochiIllustration.tsx`) mapping a `state` enum to a bundled PNG import, with `size` (enum → fixed px) and `backdrop` (`auto`/`cream`/`none`) props controlling a small wrapper `<div>` + `<img>`. No state management, no external data — pure props in, markup out. First component in the repo, so this plan also stands up Vitest's jsdom + React Testing Library environment.

**Tech Stack:** React 19, TypeScript, Tailwind v4 (`@theme` tokens from `src/styles/tokens.css`), Vitest, @testing-library/react, @testing-library/jest-dom, jsdom.

## Global Constraints

- Windows 10/11 x64 only — no platform-specific code needed here, but don't assume a Unix shell in any command.
- Không hardcode màu — mọi màu qua token đã có trong `src/styles/tokens.css` (`bg-muzzle-cream`, v.v.); nếu thiếu token, thêm vào `tokens.css` trước khi dùng.
- Chỉ 7 state MVP: `neutral`, `wave`, `search`, `security`, `sync`, `offline`, `success`. Không thêm `"import"` (post-MVP, không có asset).
- `alt` mặc định là chuỗi rỗng `""` (ảnh trang trí theo WCAG) — không phải chuỗi cố định baked-in.
- `size` là enum (`"sm" | "md" | "lg" | "xl"` → 48/80/160/240px), không phải số px thô.
- `backdrop` là enum ba giá trị (`"auto" | "cream" | "none"`), không phải boolean.
- Nguồn ảnh gốc: `docs/brand-reference/pawpass-shiba-genz-cute-pack/{01-wave-genz,02-security-genz,03-organize-accounts-genz,04-search-genz,05-notification-genz,06-success-genz,07-support-genz}.png` — copy (không di chuyển, giữ nguyên bản gốc trong `docs/`) sang `src/assets/brand/mochi/` với tên mới.

---

### Task 1: Test environment + assets + MochiIllustration component

**Files:**

- Create: `src/assets/brand/mochi/neutral.png`, `wave.png`, `search.png`, `security.png`, `success.png`, `sync.png`, `offline.png` (copied from `docs/brand-reference/pawpass-shiba-genz-cute-pack/`)
- Create: `src/test/setup.ts`
- Create: `src/components/ui/MochiIllustration.tsx`
- Create: `src/components/ui/MochiIllustration.test.tsx`
- Modify: `vite.config.ts` (test environment + setupFiles)
- Modify: `src/styles/tokens.css` (add `--drop-shadow-elevation-1`)
- Modify: `package.json` (new devDependencies, via `pnpm add`)

**Interfaces:**

- Consumes: `--color-muzzle-cream`, `--shadow-elevation-1` tokens from `src/styles/tokens.css` (Sprint 1 sub-project 1).
- Produces: `MochiIllustration` component, `MochiState`/`MochiSize`/`MochiBackdrop` exported types — Sprint 1 sub-projects 4-6 (AccountCard, forms, Detail page) import these by name.

- [ ] **Step 1: Copy the 7 source images into the bundled assets folder**

```bash
mkdir -p "src/assets/brand/mochi"
cp "docs/brand-reference/pawpass-shiba-genz-cute-pack/03-organize-accounts-genz.png" "src/assets/brand/mochi/neutral.png"
cp "docs/brand-reference/pawpass-shiba-genz-cute-pack/01-wave-genz.png" "src/assets/brand/mochi/wave.png"
cp "docs/brand-reference/pawpass-shiba-genz-cute-pack/04-search-genz.png" "src/assets/brand/mochi/search.png"
cp "docs/brand-reference/pawpass-shiba-genz-cute-pack/02-security-genz.png" "src/assets/brand/mochi/security.png"
cp "docs/brand-reference/pawpass-shiba-genz-cute-pack/06-success-genz.png" "src/assets/brand/mochi/success.png"
cp "docs/brand-reference/pawpass-shiba-genz-cute-pack/05-notification-genz.png" "src/assets/brand/mochi/sync.png"
cp "docs/brand-reference/pawpass-shiba-genz-cute-pack/07-support-genz.png" "src/assets/brand/mochi/offline.png"
```

Expected: `ls src/assets/brand/mochi/` shows exactly 7 files named `neutral.png`, `wave.png`, `search.png`, `security.png`, `success.png`, `sync.png`, `offline.png`. The `docs/brand-reference/...` originals remain untouched (this was a copy, not a move).

- [ ] **Step 2: Install the testing environment**

```bash
pnpm add -D jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 3: Point Vitest at jsdom and add a setup file**

Create `src/test/setup.ts`:

```ts
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";

afterEach(() => {
  cleanup();
});
```

The explicit `afterEach(cleanup)` is required here, not optional boilerplate: `@testing-library/react`'s own auto-cleanup only self-registers when it detects `afterEach` as a _global_ (Vitest's `test.globals: true`), and this project's `vite.config.ts` intentionally does not set that (keeping the explicit-import style already used in `format.test.ts`). Without this, DOM nodes from one test in `MochiIllustration.test.tsx` would still be present when the next test runs `screen.getByRole(...)`, which throws once more than one match exists in the document.

In `vite.config.ts`, change the `test` block from:

```ts
  test: {
    environment: "node",
  },
```

to:

```ts
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
```

This is a global change — `src/lib/format.test.ts` is pure functions with no DOM dependency, so it is unaffected by the environment switch.

- [ ] **Step 4: Add the drop-shadow token**

In `src/styles/tokens.css`, inside the existing `@theme { ... }` block, add this line immediately after the existing `--shadow-elevation-2` line:

```css
--drop-shadow-elevation-1: 0 2px 8px rgb(0 12 36 / 0.06);
```

(Same value as `--shadow-elevation-1` — Tailwind's `@theme` needs a separate `--drop-shadow-*` key to generate a `drop-shadow-elevation-1` utility class; CSS `filter: drop-shadow()` and `box-shadow` don't share one token namespace in Tailwind v4.)

- [ ] **Step 5: Write the failing tests**

Create `src/components/ui/MochiIllustration.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MochiIllustration, type MochiState } from "./MochiIllustration";

const STATES: MochiState[] = [
  "neutral",
  "wave",
  "search",
  "security",
  "sync",
  "offline",
  "success",
];

describe("MochiIllustration state to asset mapping", () => {
  it.each(STATES)('state "%s" resolves to a src file named after it', (state) => {
    const { container } = render(<MochiIllustration state={state} />);
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img!.getAttribute("src")).toContain(state);
  });
});

describe("MochiIllustration alt text", () => {
  it("defaults to an empty alt, excluded from the accessibility tree", () => {
    render(<MochiIllustration state="wave" />);
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("is exposed by name when alt is provided", () => {
    render(<MochiIllustration state="wave" alt="Mochi vẫy tay chào" />);
    expect(screen.getByRole("img", { name: "Mochi vẫy tay chào" })).toBeInTheDocument();
  });
});

describe("MochiIllustration backdrop", () => {
  it('shows the backdrop by default ("auto") at size lg', () => {
    render(<MochiIllustration state="neutral" size="lg" />);
    expect(screen.getByTestId("mochi-backdrop")).toBeInTheDocument();
  });

  it('hides the backdrop by default ("auto") at size sm', () => {
    render(<MochiIllustration state="neutral" size="sm" />);
    expect(screen.queryByTestId("mochi-backdrop")).toBeNull();
  });

  it('backdrop="none" hides it even at size lg', () => {
    render(<MochiIllustration state="neutral" size="lg" backdrop="none" />);
    expect(screen.queryByTestId("mochi-backdrop")).toBeNull();
  });

  it('backdrop="cream" shows it even at size sm', () => {
    render(<MochiIllustration state="neutral" size="sm" backdrop="cream" />);
    expect(screen.getByTestId("mochi-backdrop")).toBeInTheDocument();
  });
});

describe("MochiIllustration sizing", () => {
  it("sets width/height attributes matching the size prop", () => {
    const { container } = render(<MochiIllustration state="neutral" size="sm" />);
    const img = container.querySelector("img");
    expect(img!.getAttribute("width")).toBe("48");
    expect(img!.getAttribute("height")).toBe("48");
  });
});
```

- [ ] **Step 6: Run the tests to verify they fail**

Run: `pnpm test`
Expected: FAIL — `MochiIllustration.tsx` does not exist yet, so the import fails (`Cannot find module './MochiIllustration'` or similar). The pre-existing `format.test.ts` suite should still be unaffected (still passes) once the module-resolution error for the new file is the only failure.

- [ ] **Step 7: Implement the component**

Create `src/components/ui/MochiIllustration.tsx`:

```tsx
import neutralSrc from "../../assets/brand/mochi/neutral.png";
import waveSrc from "../../assets/brand/mochi/wave.png";
import searchSrc from "../../assets/brand/mochi/search.png";
import securitySrc from "../../assets/brand/mochi/security.png";
import successSrc from "../../assets/brand/mochi/success.png";
import syncSrc from "../../assets/brand/mochi/sync.png";
import offlineSrc from "../../assets/brand/mochi/offline.png";

export type MochiState =
  "neutral" | "wave" | "search" | "security" | "sync" | "offline" | "success";

export type MochiSize = "sm" | "md" | "lg" | "xl";
export type MochiBackdrop = "auto" | "cream" | "none";

export interface MochiIllustrationProps {
  state: MochiState;
  size?: MochiSize;
  backdrop?: MochiBackdrop;
  alt?: string;
  className?: string;
}

const STATE_SRC: Record<MochiState, string> = {
  neutral: neutralSrc,
  wave: waveSrc,
  search: searchSrc,
  security: securitySrc,
  sync: syncSrc,
  offline: offlineSrc,
  success: successSrc,
};

const SIZE_PX: Record<MochiSize, number> = {
  sm: 48,
  md: 80,
  lg: 160,
  xl: 240,
};

function resolveBackdrop(backdrop: MochiBackdrop, size: MochiSize): boolean {
  if (backdrop === "none") return false;
  if (backdrop === "cream") return true;
  return size !== "sm"; // "auto": every size except sm, where the keyline has already dissolved
}

export function MochiIllustration({
  state,
  size = "md",
  backdrop = "auto",
  alt = "",
  className = "",
}: MochiIllustrationProps) {
  const px = SIZE_PX[size];
  const showBackdrop = resolveBackdrop(backdrop, size);

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: px, height: px }}
    >
      {showBackdrop && (
        <div
          data-testid="mochi-backdrop"
          className="absolute inset-0 rounded-full bg-muzzle-cream"
        />
      )}
      <img
        src={STATE_SRC[state]}
        alt={alt}
        draggable={false}
        width={px}
        height={px}
        className="relative block select-none drop-shadow-elevation-1"
      />
    </div>
  );
}

export default MochiIllustration;
```

- [ ] **Step 8: Run the tests to verify they pass**

Run: `pnpm test`
Expected: PASS — all `MochiIllustration.test.tsx` cases green, plus the pre-existing `format.test.ts` suite still green (17 total: 10 from `format.test.ts` + 7 `it.each` state cases + 6 named tests in `MochiIllustration.test.tsx` — count may read differently depending on how Vitest reports `it.each`, but zero failures either way).

- [ ] **Step 9: Run the full quality gate**

```bash
pnpm lint
pnpm format:check
pnpm typecheck
pnpm build
```

Expected: all four exit 0. If `format:check` fails, run `pnpm format` once and re-check (this normalizes the new files' style, not their logic).

- [ ] **Step 10: Commit**

```bash
git add src/assets/brand/mochi/ src/test/setup.ts src/components/ui/MochiIllustration.tsx src/components/ui/MochiIllustration.test.tsx vite.config.ts src/styles/tokens.css package.json pnpm-lock.yaml
git commit -m "feat: MochiIllustration component (7 state, drop-shadow + gated backdrop), cài React Testing Library"
```

---

### Task 2: Fix the SOURCE-OF-TRUTH §7.5/§7.6 alt-text contradiction

**Files:**

- Modify: `docs/SOURCE-OF-TRUTH.md` (§7.5, one sentence)

**Interfaces:**

- Consumes: nothing.
- Produces: a doc correction other readers can trust — no code depends on this.

- [ ] **Step 1: Fix the contradiction**

In `docs/SOURCE-OF-TRUTH.md`, find this sentence in §7.5 (Component inventory):

```text
MochiIllustration với enum state, kích thước và alt text cố định.
```

Replace it with:

```text
MochiIllustration với enum state, kích thước cố định; alt mặc định rỗng (ảnh trang trí, khớp §7.6), có prop ghi đè khi một chỗ dùng cụ thể cần mô tả.
```

This resolves the contradiction with §7.6 ("ảnh trang trí dùng alt rỗng") in favor of §7.6, per the accessibility reasoning in `docs/superpowers/specs/2026-08-10-sprint1-mochi-illustration-design.md` (Mochi always appears beside text that already carries the message, so WCAG 1.1.1 places it on the decorative branch).

- [ ] **Step 2: Commit**

```bash
git add docs/SOURCE-OF-TRUTH.md
git commit -m "docs: sửa mâu thuẫn §7.5/§7.6 về alt text của MochiIllustration"
```

---

### Task 3: Manual visual verification

**Files:**

- Modify: `src/pages/DashboardPage.tsx` (temporarily, reverted at the end of this task)

**Interfaces:**

- Consumes: `MochiIllustration` from Task 1.
- Produces: nothing lasting — this task's only output is a human-observed confirmation, recorded in this task's own report. No later task depends on any file state this task leaves behind.

This task exists because automated tests cannot answer the visual question that motivated the whole component: does the white keyline actually read against the Muzzle Cream backdrop, at each size, for real artwork? Testing Library confirms the backdrop element exists or doesn't — it cannot confirm the keyline is legible. This needs a human looking at the running app.

- [ ] **Step 1: Temporarily wire every state and size onto the Dashboard placeholder**

Replace the full contents of `src/pages/DashboardPage.tsx` with:

```tsx
import {
  MochiIllustration,
  type MochiSize,
  type MochiState,
} from "../components/ui/MochiIllustration";

const STATES: MochiState[] = [
  "neutral",
  "wave",
  "search",
  "security",
  "sync",
  "offline",
  "success",
];

const SIZES: MochiSize[] = ["sm", "md", "lg", "xl"];

function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <p className="text-base">Trang Dashboard — nội dung ở sub-project sau</p>
      {SIZES.map((size) => (
        <div key={size}>
          <p className="mb-2 text-sm font-semibold text-shield-navy">size={size}</p>
          <div className="flex flex-wrap items-end gap-4 bg-surface p-4">
            {STATES.map((state) => (
              <MochiIllustration key={state} state={state} size={size} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default DashboardPage;
```

- [ ] **Step 2: Boot the app and observe**

```bash
nohup pnpm tauri dev > tauri-dev-visual-check.log 2>&1 &
```

Poll until ready (this is a cached incremental Rust build after Sprint 1 sub-project 2 already compiled the same dependency tree once — expect well under a minute, not the multi-minute cold-compile times seen on first-ever runs):

```bash
until grep -qE "Finished|error\[|error:" tauri-dev-visual-check.log 2>/dev/null; do sleep 2; done
tail -10 tauri-dev-visual-check.log
```

Expected: `Finished` and `Running` with no error. Confirm the window process is alive (`tasklist //FI "IMAGENAME eq pawpass.exe"`), then look at the actual window: 4 rows (one per size), each showing all 7 states. Check specifically:

- At `sm` (48px): no cream disc behind any state (expected — `resolveBackdrop` returns `false` for `sm` under `"auto"`).
- At `md`/`lg`/`xl`: a cream circle behind every state, character silhouette (including ears/props that may extend past the circle at `neutral`) visible with a clear dark edge against both the cream disc and the page's `Surface` background behind it.
- No image is draggable (try dragging one with the mouse — it should not detach/ghost-drag).

- [ ] **Step 3: Record the observation, then kill the process**

```bash
taskkill //F //IM pawpass.exe
rm -f tauri-dev-visual-check.log
```

- [ ] **Step 4: Revert the temporary Dashboard wiring**

```bash
git checkout -- src/pages/DashboardPage.tsx
git status --short
```

Expected: `git status --short` shows nothing for `src/pages/DashboardPage.tsx` (back to the Task-2-of-sub-project-2 placeholder). No commit for this task — it produced no lasting file change, only a human-verified observation.

---

## Self-Review Notes

**Spec coverage:** all 8 numbered decisions in the spec map to Task 1 (drop-shadow token, size-gated backdrop enum, size enum, alt default, backdrop disc overflow/no-crop via `rounded-full` + no `overflow-hidden` on the wrapper, no per-asset scale table, `draggable={false}`/`select-none`, asset copy+ES-import) plus Task 2 (the one doc fix named in decision 4) plus Task 3 (the spec's explicitly-flagged testing gap, "cần xác nhận bằng mắt").

**Placeholder scan:** no TBD/TODO; every code block is complete, runnable content, not a description of what to write.

**Type consistency:** `MochiState`/`MochiSize`/`MochiBackdrop` and the `MochiIllustrationProps` shape are defined once in Task 1 Step 7 and referenced identically (same prop names, same union members) in Task 1's own tests (Step 5) and Task 3's temporary Dashboard wiring — no renamed fields between them.
