# AccountCard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `AccountCard` and its three sub-components (`PlatformBadge`, `StatusPill`, `AccountAvatar`) — the densest, most-reused display surface in PawPass, showing one social-media-account record with platform icon, avatar (with initials fallback), status, follower count, and two action buttons.

**Architecture:** Five new presentational React components (no data fetching — everything arrives via props) plus a shared `AccountSummary`/`Platform`/`AccountStatus` type module and one new pure function (`avatarInitial`). `AccountCard` composes the other three; none of the three sub-components know about `AccountSummary` or each other. Three officially-sourced platform icon images (Facebook, Instagram, Gmail) round out the asset set alongside the existing Mochi illustrations.

**Tech Stack:** React 19, TypeScript, Tailwind v4 tokens (already in `src/styles/tokens.css`), `lucide-react` (new dependency — generic UI icons only, never platform/brand marks), Vitest + React Testing Library.

## Global Constraints

- Chỉ 3 nền tảng, 5 trạng thái — đúng theo `PLATFORMS`/`ACCOUNT_STATUSES` (không thêm state/platform nào khác).
- `followerCount: 0` phải hiển thị `"0"`, không bao giờ hiển thị `"Chưa nhập"` (BR-04 — release blocker theo SOURCE-OF-TRUTH §15.3 nếu sai).
- Không tô màu lại 2 icon Facebook/Instagram bằng token accent (`--color-account-*`) — vi phạm brand guideline của Meta đã ghi trong spec. Chỉ dùng icon với màu gốc.
- Không truyền `profile_url`/`avatar_path` (tên cột DB thật) vào bất kỳ component nào — chỉ `avatarUrl` (đã resolve) và `canOpen` (boolean, không phải URL).
- Callback `onOpenAccount`/`onUpdateFollower` nhận `(id: string)`, không nhận cả object và không nhận 0 tham số.
- Toàn bộ chuỗi hiển thị là tiếng Việt (SOURCE-OF-TRUTH §7.7, đã áp dụng từ Sprint 1 sub-project 1).
- `test.globals` là `false` trong dự án này — mọi file test phải import tường minh `describe/it/expect/vi` từ `"vitest"`, không dùng global. `afterEach(cleanup)` đã có sẵn toàn cục trong `src/test/setup.ts`, không cần lặp lại trong từng file.
- Không test tên class Tailwind hay việc CSS có ellipsis thật hay không (jsdom không có layout) — dùng `data-testid`/`title` attribute làm bằng chứng thay thế.

---

### Task 1: Foundation — `src/types/account.ts` + `avatarInitial()`

**Files:**

- Create: `src/types/account.ts`
- Modify: `src/lib/format.ts` (thêm `avatarInitial`)
- Modify: `src/lib/format.test.ts` (thêm test cho `avatarInitial`)

**Interfaces:**

- Consumes: không có gì mới — chỉ dùng `Intl.Segmenter` (built-in JS).
- Produces: `PLATFORMS`, `ACCOUNT_STATUSES` (mảng `as const`), `Platform`, `AccountStatus`, `AccountSummary` (type/interface) — Task 2-5 import các type này. `avatarInitial(displayName: string): string` — Task 4 (AccountAvatar) gọi hàm này.

- [ ] **Step 1: Tạo `src/types/account.ts`**

```ts
export const PLATFORMS = ["facebook", "instagram", "google"] as const;
export const ACCOUNT_STATUSES = ["active", "review", "inactive", "locked", "archived"] as const;

export type Platform = (typeof PLATFORMS)[number];
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

/** Những gì AccountCard cần để hiển thị — một phép chiếu của bảng `accounts`
 * (SOURCE-OF-TRUTH §10.2), không phải bản sao nguyên hàng. Không bao giờ chứa
 * secret, owner_id, row_version, hay bất kỳ cột nào ngoài phạm vi hiển thị. */
export interface AccountSummary {
  id: string;
  platform: Platform;
  status: AccountStatus;
  displayName: string;
  username: string | null;
  loginEmail: string | null;
  /** Đã resolve sẵn thành URL hiển thị được — không phải avatar_path (Supabase
   * Storage path) thô. Việc resolve signed URL là việc của tầng data (Sprint 3). */
  avatarUrl: string | null;
  followerCount: number | null;
  followerUpdatedAt: Date | null;
}
```

- [ ] **Step 2: Viết test cho `avatarInitial` (chưa tồn tại — test sẽ fail vì thiếu import)**

Mở `src/lib/format.test.ts`, đổi dòng import từ:

```ts
import { formatDate, formatFollowerCount, formatNumber, formatRelativeDays } from "./format";
```

thành:

```ts
import {
  avatarInitial,
  formatDate,
  formatFollowerCount,
  formatNumber,
  formatRelativeDays,
} from "./format";
```

Thêm khối `describe` này vào cuối file:

```ts
describe("avatarInitial", () => {
  it("takes the last token's initial for a Vietnamese name", () => {
    expect(avatarInitial("Nguyễn Văn A")).toBe("A");
  });

  it("gives the same result for NFD-normalized input as NFC", () => {
    const nfc = "Trần Thị Ánh";
    expect(avatarInitial(nfc.normalize("NFD"))).toBe(avatarInitial(nfc));
  });

  it("skips a leading/trailing emoji token and uses the last real word", () => {
    expect(avatarInitial("✨ Mochi Shop ✨")).toBe("S");
  });

  it("handles a single-token brand name", () => {
    expect(avatarInitial("PawPass")).toBe("P");
  });

  it('handles "Đ" correctly — a letter naive ASCII-folding gets wrong', () => {
    expect(avatarInitial("Đặng Đình Đức")).toBe("Đ");
  });

  it("returns a placeholder for empty or whitespace-only input", () => {
    expect(avatarInitial("")).toBe("?");
    expect(avatarInitial("   ")).toBe("?");
  });
});
```

Every expected value above was computed by actually running the function in Node before writing this plan — they are not estimates. In particular `"✨ Mochi Shop ✨"` → `"S"` (from "Shop", the last non-symbol token), not "M" — the rule is strictly "last named token," applied uniformly even to brand/shop names.

- [ ] **Step 3: Chạy test để xác nhận fail**

Run: `pnpm test`
Expected: FAIL — `avatarInitial` không tồn tại trong `./format` (lỗi import/resolve), các test khác trong `format.test.ts` không bị ảnh hưởng bởi lỗi import này thì vẫn nên fail cùng nhóm do lỗi module-level.

- [ ] **Step 4: Thêm `avatarInitial` vào `src/lib/format.ts`**

Thêm vào cuối file (giữ nguyên toàn bộ nội dung hiện có của file, chỉ thêm mới):

```ts
const GRAPHEMES = new Intl.Segmenter("vi", { granularity: "grapheme" });

/**
 * Chữ cái đại diện cho avatar khi không có ảnh, lấy tên gọi (token cuối), §5.3.
 * Dùng Intl.Segmenter để tách theo grapheme cluster — xử lý đúng cả input dạng
 * NFD (dấu tách rời, ví dụ từ macOS): Segmenter gộp base+dấu thành một cụm,
 * không cắt giữa chừng như string indexing thường ([0]) sẽ làm.
 */
export function avatarInitial(displayName: string): string {
  const tokens = displayName.normalize("NFC").trim().split(/\s+/).filter(Boolean);
  const named = tokens.filter((t) => /^[\p{L}\p{N}]/u.test(t));
  const source = named.at(-1) ?? tokens.at(-1) ?? "";
  const first = [...GRAPHEMES.segment(source)][0];
  return first ? first.segment.toUpperCase() : "?";
}
```

- [ ] **Step 5: Chạy test để xác nhận pass**

Run: `pnpm test`
Expected: PASS — toàn bộ `format.test.ts` xanh (10 test cũ + 6 test mới = 16), `MochiIllustration.test.tsx` không bị ảnh hưởng (25 test cũ vẫn xanh). Tổng 41 test.

- [ ] **Step 6: Chạy quality gate đầy đủ**

```bash
pnpm lint
pnpm format:check
pnpm typecheck
pnpm build
```

Expected: cả 4 lệnh exit 0.

- [ ] **Step 7: Commit**

```bash
git add src/types/account.ts src/lib/format.ts src/lib/format.test.ts
git commit -m "feat: types/account.ts + avatarInitial() cho AccountCard"
```

---

### Task 2: Platform icons + `PlatformBadge`

**Files:**

- Create: `src/assets/brand/platforms/facebook.png` (copy từ `docs/brand-reference/platform-icons/facebook-icon-official.png`)
- Create: `src/assets/brand/platforms/instagram.png` (copy từ `docs/brand-reference/platform-icons/instagram-icon-official.png`)
- Create: `src/assets/brand/platforms/gmail.svg` (copy từ `docs/brand-reference/platform-icons/gmail-icon-official.svg`)
- Create: `src/components/ui/icons/PlatformIcons.tsx`
- Create: `src/components/ui/PlatformBadge.tsx`
- Create: `src/components/ui/PlatformBadge.test.tsx`
- Modify: `package.json` (thêm `lucide-react` — dùng ở Task 3, cài luôn ở đây vì đây là task đầu tiên cần icon)

**Interfaces:**

- Consumes: `Platform` type từ Task 1.
- Produces: `PlatformBadge` component (`{ platform: Platform; size?: number }`) — Task 5 (AccountCard) dùng.

- [ ] **Step 1: Copy 3 icon đã tải sẵn (đã có trong `docs/brand-reference/platform-icons/` — xem provenance ở đó)**

```bash
mkdir -p "src/assets/brand/platforms"
cp "docs/brand-reference/platform-icons/facebook-icon-official.png" "src/assets/brand/platforms/facebook.png"
cp "docs/brand-reference/platform-icons/instagram-icon-official.png" "src/assets/brand/platforms/instagram.png"
cp "docs/brand-reference/platform-icons/gmail-icon-official.svg" "src/assets/brand/platforms/gmail.svg"
```

Expected: `ls src/assets/brand/platforms/` cho ra đúng 3 file `facebook.png`, `instagram.png`, `gmail.svg`. File gốc trong `docs/brand-reference/platform-icons/` vẫn còn nguyên (đây là copy, không phải move).

- [ ] **Step 2: Cài `lucide-react`**

```bash
pnpm add lucide-react
```

- [ ] **Step 3: Tạo `src/components/ui/icons/PlatformIcons.tsx`**

```tsx
// Nguồn icon (tải 10/08/2026, xem docs/brand-reference/platform-icons/):
// - facebook: Meta Brand Resource Center — Facebook Logo (Primary Logo, icon tròn chính thức)
// - instagram: Meta Brand Resource Center — Instagram Brand (Gradient Glyph chính thức)
// - gmail: Google product logo CDN (fonts.gstatic.com) — icon phong bì Gmail, không phải logo "G"
import facebookIconSrc from "../../../assets/brand/platforms/facebook.png";
import instagramIconSrc from "../../../assets/brand/platforms/instagram.png";
import gmailIconSrc from "../../../assets/brand/platforms/gmail.svg";
import type { Platform } from "../../../types/account";

export const PLATFORM_ICON_SRC: Record<Platform, string> = {
  facebook: facebookIconSrc,
  instagram: instagramIconSrc,
  google: gmailIconSrc,
};

export const PLATFORM_LABEL: Record<Platform, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  google: "Gmail",
};
```

- [ ] **Step 4: Viết test trước cho `PlatformBadge` (chưa tồn tại — sẽ fail)**

Tạo `src/components/ui/PlatformBadge.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlatformBadge } from "./PlatformBadge";
import { PLATFORMS } from "../../types/account";

describe("PlatformBadge", () => {
  it.each([
    ["facebook", "Facebook"],
    ["instagram", "Instagram"],
    ["google", "Gmail"],
  ] as const)('has an accessible name "%s" -> "%s"', (platform, expectedLabel) => {
    render(<PlatformBadge platform={platform} />);
    expect(screen.getByRole("img", { name: expectedLabel })).toBeInTheDocument();
  });

  it("covers every platform in the shared PLATFORMS list", () => {
    expect(PLATFORMS).toEqual(["facebook", "instagram", "google"]);
  });

  it("defaults to a 32px badge", () => {
    const { container } = render(<PlatformBadge platform="facebook" />);
    const badge = container.firstElementChild as HTMLElement;
    expect(badge.style.width).toBe("32px");
    expect(badge.style.height).toBe("32px");
  });

  it("accepts a custom size", () => {
    const { container } = render(<PlatformBadge platform="facebook" size={48} />);
    const badge = container.firstElementChild as HTMLElement;
    expect(badge.style.width).toBe("48px");
    expect(badge.style.height).toBe("48px");
  });
});
```

- [ ] **Step 5: Chạy test để xác nhận fail**

Run: `pnpm test`
Expected: FAIL — `./PlatformBadge` chưa tồn tại.

- [ ] **Step 6: Tạo `src/components/ui/PlatformBadge.tsx`**

```tsx
import { PLATFORM_ICON_SRC, PLATFORM_LABEL } from "./icons/PlatformIcons";
import type { Platform } from "../../types/account";

export interface PlatformBadgeProps {
  platform: Platform;
  size?: number;
}

/**
 * Icon nền tảng chính thức trong một đĩa nền trắng — không tô lại màu icon
 * (vi phạm brand guideline của Meta). Đĩa nền + padding 72% giúp 3 icon có
 * hình dạng gốc khác nhau (tròn/vuông bo/phẳng) trông đồng bộ ở cùng kích thước.
 */
export function PlatformBadge({ platform, size = 32 }: PlatformBadgeProps) {
  return (
    <div
      className="flex items-center justify-center rounded-full bg-white shadow-elevation-1"
      style={{ width: size, height: size }}
    >
      <img
        src={PLATFORM_ICON_SRC[platform]}
        alt={PLATFORM_LABEL[platform]}
        className="h-[72%] w-[72%] object-contain"
      />
    </div>
  );
}

export default PlatformBadge;
```

- [ ] **Step 7: Chạy test để xác nhận pass**

Run: `pnpm test`
Expected: PASS — 5 test mới xanh (3 từ `it.each` + 2 khác).

- [ ] **Step 8: Chạy quality gate**

```bash
pnpm lint && pnpm format:check && pnpm typecheck && pnpm build
```

Expected: cả 4 lệnh exit 0. Nếu `lint`/`typecheck` báo lỗi liên quan tới import ảnh (`.png`/`.svg`), kiểm tra `src/vite-env.d.ts` đã có `/// <reference types="vite/client" />` chưa — dòng này đã tồn tại sẵn từ Sprint 0, không cần thêm.

- [ ] **Step 9: Commit**

```bash
git add src/assets/brand/platforms/ src/components/ui/icons/ src/components/ui/PlatformBadge.tsx src/components/ui/PlatformBadge.test.tsx package.json pnpm-lock.yaml
git commit -m "feat: PlatformBadge + icon nền tảng chính thức (Facebook/Instagram/Gmail), cài lucide-react"
```

---

### Task 3: `StatusPill`

**Files:**

- Modify: `src/lib/strings.ts` (thêm namespace `status`)
- Create: `src/components/ui/StatusPill.tsx`
- Create: `src/components/ui/StatusPill.test.tsx`

**Interfaces:**

- Consumes: `AccountStatus`, `ACCOUNT_STATUSES` từ Task 1. `lucide-react` từ Task 2.
- Produces: `StatusPill` component (`{ status: AccountStatus }`), có `data-testid="status-pill"` trên phần tử gốc — Task 5 dùng cả component lẫn testid này.

- [ ] **Step 1: Thêm chuỗi trạng thái vào `src/lib/strings.ts`**

Thêm namespace `status` mới vào object `strings` hiện có (giữ nguyên `dashboard`, `account`, `clipboard` đã có):

```ts
  status: {
    active: "Hoạt động",
    review: "Cần xem lại",
    inactive: "Không hoạt động",
    locked: "Đã khoá",
    archived: "Đã lưu trữ",
  },
```

- [ ] **Step 2: Viết test trước (chưa tồn tại — sẽ fail)**

Tạo `src/components/ui/StatusPill.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusPill } from "./StatusPill";
import { ACCOUNT_STATUSES } from "../../types/account";
import { strings } from "../../lib/strings";

const EXPECTED_LABEL: Record<(typeof ACCOUNT_STATUSES)[number], string> = {
  active: strings.status.active,
  review: strings.status.review,
  inactive: strings.status.inactive,
  locked: strings.status.locked,
  archived: strings.status.archived,
};

describe("StatusPill", () => {
  it.each(ACCOUNT_STATUSES)('renders the Vietnamese label and an icon for "%s"', (status) => {
    render(<StatusPill status={status} />);
    expect(screen.getByText(EXPECTED_LABEL[status])).toBeInTheDocument();
    const pill = screen.getByTestId("status-pill");
    expect(pill.querySelector("svg")).not.toBeNull();
  });

  it('renders literal Vietnamese text "Đã khoá" for the locked status', () => {
    render(<StatusPill status="locked" />);
    expect(screen.getByText("Đã khoá")).toBeInTheDocument();
  });
});
```

Test thứ hai cố tình assert chuỗi tiếng Việt viết thẳng (không qua `strings.status.locked`) — để không pass "giả" nếu chuỗi trong `strings.ts` lỡ bị gõ sai/để rỗng.

- [ ] **Step 3: Chạy test để xác nhận fail**

Run: `pnpm test`
Expected: FAIL — `./StatusPill` chưa tồn tại.

- [ ] **Step 4: Tạo `src/components/ui/StatusPill.tsx`**

```tsx
import { Archive, Check, Circle, Flag, Lock } from "lucide-react";
import type { ComponentType } from "react";
import type { AccountStatus } from "../../types/account";
import { strings } from "../../lib/strings";

export interface StatusPillProps {
  status: AccountStatus;
}

interface StatusConfig {
  label: string;
  Icon: ComponentType<{ size?: number; "aria-hidden"?: boolean }>;
  bg: string;
  text: string;
}

const STATUS_CONFIG: Record<AccountStatus, StatusConfig> = {
  active: {
    label: strings.status.active,
    Icon: Check,
    bg: "bg-status-active-bg",
    text: "text-status-active-text",
  },
  review: {
    label: strings.status.review,
    Icon: Flag,
    bg: "bg-status-warning-bg",
    text: "text-status-warning-text",
  },
  inactive: {
    label: strings.status.inactive,
    Icon: Circle,
    bg: "bg-status-neutral-bg",
    text: "text-status-neutral-text",
  },
  locked: {
    label: strings.status.locked,
    Icon: Lock,
    bg: "bg-status-danger-bg",
    text: "text-status-danger-text",
  },
  archived: {
    label: strings.status.archived,
    Icon: Archive,
    bg: "bg-status-neutral-bg",
    text: "text-status-neutral-text",
  },
};

/** Trạng thái luôn là icon + chữ, không chỉ dựa vào màu (SOURCE-OF-TRUTH §7.6). */
export function StatusPill({ status }: StatusPillProps) {
  const { label, Icon, bg, text } = STATUS_CONFIG[status];
  return (
    <span
      data-testid="status-pill"
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${bg} ${text}`}
    >
      <Icon size={14} aria-hidden={true} />
      {label}
    </span>
  );
}

export default StatusPill;
```

- [ ] **Step 5: Chạy test để xác nhận pass**

Run: `pnpm test`
Expected: PASS — 6 test mới xanh (5 từ `it.each` + 1).

- [ ] **Step 6: Chạy quality gate**

```bash
pnpm lint && pnpm format:check && pnpm typecheck && pnpm build
```

Expected: cả 4 lệnh exit 0.

- [ ] **Step 7: Commit**

```bash
git add src/lib/strings.ts src/components/ui/StatusPill.tsx src/components/ui/StatusPill.test.tsx
git commit -m "feat: StatusPill (5 trạng thái, icon + chữ)"
```

---

### Task 4: `AccountAvatar`

**Files:**

- Create: `src/components/account/AccountAvatar.tsx`
- Create: `src/components/account/AccountAvatar.test.tsx`

**Interfaces:**

- Consumes: `avatarInitial` từ Task 1.
- Produces: `AccountAvatar` component (`{ avatarUrl: string | null; displayName: string; size?: number }`) — Task 5 dùng.

- [ ] **Step 1: Viết test trước (chưa tồn tại — sẽ fail)**

Tạo `src/components/account/AccountAvatar.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AccountAvatar } from "./AccountAvatar";

describe("AccountAvatar", () => {
  it("shows initials, no <img>, when avatarUrl is null", () => {
    const { container } = render(<AccountAvatar avatarUrl={null} displayName="Nguyễn Văn A" />);
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("shows an <img> with alt = displayName when avatarUrl is set", () => {
    render(<AccountAvatar avatarUrl="data:image/png;base64,abc" displayName="Nguyễn Văn A" />);
    expect(screen.getByRole("img", { name: "Nguyễn Văn A" })).toBeInTheDocument();
  });

  it("falls back to initials after the image fails to load", () => {
    render(<AccountAvatar avatarUrl="https://invalid.invalid/a.png" displayName="Nguyễn Văn A" />);
    const img = screen.getByRole("img", { name: "Nguyễn Văn A" });
    fireEvent.error(img);
    expect(screen.queryByRole("img", { name: "Nguyễn Văn A" })).toBeNull();
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("resets the error state when avatarUrl changes to a new value", () => {
    const { rerender } = render(
      <AccountAvatar avatarUrl="https://invalid.invalid/a.png" displayName="Nguyễn Văn A" />,
    );
    fireEvent.error(screen.getByRole("img", { name: "Nguyễn Văn A" }));
    expect(screen.getByText("A")).toBeInTheDocument();

    rerender(<AccountAvatar avatarUrl="data:image/png;base64,def" displayName="Nguyễn Văn A" />);
    expect(screen.getByRole("img", { name: "Nguyễn Văn A" })).toBeInTheDocument();
  });
});
```

Test thứ 4 khoá lại đúng cái bug thật đã lường trước: nếu component tái sử dụng instance qua một lần re-sort lưới (avatar mới hợp lệ thay cho avatar cũ bị lỗi), state lỗi cũ không được giữ lại.

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `pnpm test`
Expected: FAIL — `./AccountAvatar` chưa tồn tại.

- [ ] **Step 3: Tạo `src/components/account/AccountAvatar.tsx`**

```tsx
import { useEffect, useState } from "react";
import { avatarInitial } from "../../lib/format";

export interface AccountAvatarProps {
  avatarUrl: string | null;
  displayName: string;
  size?: number;
}

/** Avatar 88×88 mặc định (§5.3), object-fit cover, chữ cái đại diện khi
 * không có ảnh HOẶC ảnh tải lỗi — đây là 2 tình huống khác nhau, cả hai
 * đều phải rơi về cùng một fallback. */
export function AccountAvatar({ avatarUrl, displayName, size = 88 }: AccountAvatarProps) {
  const [failed, setFailed] = useState(false);

  // Reset trạng thái lỗi khi avatarUrl đổi — nếu không, một avatar mới hợp lệ
  // vẫn bị coi là lỗi do state cũ còn sót lại từ ảnh trước (ví dụ khi lưới
  // account re-sort và component instance được React tái sử dụng).
  useEffect(() => {
    setFailed(false);
  }, [avatarUrl]);

  const showImage = avatarUrl !== null && !failed;

  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-card bg-muzzle-cream font-brand text-2xl font-bold text-fur-orange-text"
      style={{ width: size, height: size }}
    >
      {showImage ? (
        <img
          src={avatarUrl}
          alt={displayName}
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        avatarInitial(displayName)
      )}
    </div>
  );
}

export default AccountAvatar;
```

- [ ] **Step 4: Chạy test để xác nhận pass**

Run: `pnpm test`
Expected: PASS — 4 test mới xanh.

- [ ] **Step 5: Chạy quality gate**

```bash
pnpm lint && pnpm format:check && pnpm typecheck && pnpm build
```

Expected: cả 4 lệnh exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/components/account/AccountAvatar.tsx src/components/account/AccountAvatar.test.tsx
git commit -m "feat: AccountAvatar (fallback chữ cái đại diện, xử lý ảnh lỗi)"
```

---

### Task 5: `AccountCard` + dữ liệu mẫu

**Files:**

- Modify: `src/lib/strings.ts` (thêm 2 nhãn nút vào namespace `account`)
- Create: `src/components/account/AccountCard.tsx`
- Create: `src/components/account/AccountCard.test.tsx`
- Create: `src/components/account/mockAccounts.ts`

**Interfaces:**

- Consumes: `AccountSummary`, `ACCOUNT_STATUSES` (Task 1); `PlatformBadge` (Task 2); `StatusPill` với `data-testid="status-pill"` (Task 3); `AccountAvatar` (Task 4); `formatFollowerCount`, `formatRelativeDays` (đã có từ Sprint 1 sub-project 1).
- Produces: `AccountCard` component, `MOCK_ACCOUNTS: AccountSummary[]` — Task 6 dùng cả hai để wire tạm vào Dashboard.

- [ ] **Step 1: Thêm 2 nhãn nút vào `src/lib/strings.ts`**

Thêm vào namespace `account` đã có (không xoá các key hiện có: `updatedAgo`, `updatedToday`, `neverUpdatedFollower`, `followerNotEntered`):

```ts
    updateFollowerButton: "Cập nhật follower",
    openAccountButton: "Mở tài khoản",
```

- [ ] **Step 2: Viết test trước cho `AccountCard` (chưa tồn tại — sẽ fail)**

Tạo `src/components/account/AccountCard.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AccountCard } from "./AccountCard";
import { ACCOUNT_STATUSES, type AccountSummary } from "../../types/account";

const BASE_ACCOUNT: AccountSummary = {
  id: "acc-1",
  platform: "facebook",
  status: "active",
  displayName: "Nguyễn Văn A",
  username: "@nguyenvana",
  loginEmail: "nguyenvana@gmail.com",
  avatarUrl: null,
  followerCount: 1000,
  followerUpdatedAt: new Date(),
};

describe("AccountCard actions", () => {
  it("calls onOpenAccount with the account id, and not onUpdateFollower", () => {
    const onOpenAccount = vi.fn();
    const onUpdateFollower = vi.fn();
    render(
      <AccountCard
        account={BASE_ACCOUNT}
        onOpenAccount={onOpenAccount}
        onUpdateFollower={onUpdateFollower}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Mở tài khoản" }));
    expect(onOpenAccount).toHaveBeenCalledWith("acc-1");
    expect(onUpdateFollower).not.toHaveBeenCalled();
  });

  it("calls onUpdateFollower with the account id, and not onOpenAccount", () => {
    const onOpenAccount = vi.fn();
    const onUpdateFollower = vi.fn();
    render(
      <AccountCard
        account={BASE_ACCOUNT}
        onOpenAccount={onOpenAccount}
        onUpdateFollower={onUpdateFollower}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Cập nhật follower" }));
    expect(onUpdateFollower).toHaveBeenCalledWith("acc-1");
    expect(onOpenAccount).not.toHaveBeenCalled();
  });

  it("disables the open-account button when canOpen is false", () => {
    render(
      <AccountCard
        account={BASE_ACCOUNT}
        canOpen={false}
        onOpenAccount={vi.fn()}
        onUpdateFollower={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Mở tài khoản" })).toBeDisabled();
  });

  it("leaves the open-account button enabled by default (canOpen defaults true)", () => {
    render(
      <AccountCard account={BASE_ACCOUNT} onOpenAccount={vi.fn()} onUpdateFollower={vi.fn()} />,
    );
    expect(screen.getByRole("button", { name: "Mở tài khoản" })).not.toBeDisabled();
  });
});

describe("AccountCard status", () => {
  it.each(ACCOUNT_STATUSES)('renders a status pill for "%s"', (status) => {
    render(
      <AccountCard
        account={{ ...BASE_ACCOUNT, status }}
        onOpenAccount={vi.fn()}
        onUpdateFollower={vi.fn()}
      />,
    );
    expect(screen.getByTestId("status-pill")).toBeInTheDocument();
  });
});

describe("AccountCard avatar", () => {
  it("shows initials when avatarUrl is null", () => {
    render(
      <AccountCard
        account={{ ...BASE_ACCOUNT, avatarUrl: null }}
        onOpenAccount={vi.fn()}
        onUpdateFollower={vi.fn()}
      />,
    );
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("shows an img with a non-empty alt when avatarUrl is set", () => {
    render(
      <AccountCard
        account={{ ...BASE_ACCOUNT, avatarUrl: "data:image/png;base64,abc" }}
        onOpenAccount={vi.fn()}
        onUpdateFollower={vi.fn()}
      />,
    );
    expect(screen.getByRole("img", { name: "Nguyễn Văn A" })).toBeInTheDocument();
  });

  it("falls back to initials after the avatar image fails to load", () => {
    render(
      <AccountCard
        account={{ ...BASE_ACCOUNT, avatarUrl: "https://invalid.invalid/a.png" }}
        onOpenAccount={vi.fn()}
        onUpdateFollower={vi.fn()}
      />,
    );
    fireEvent.error(screen.getByRole("img", { name: "Nguyễn Văn A" }));
    expect(screen.queryByRole("img", { name: "Nguyễn Văn A" })).toBeNull();
    expect(screen.getByText("A")).toBeInTheDocument();
  });
});

describe("AccountCard follower count", () => {
  it('shows "Chưa nhập" when followerCount is null', () => {
    render(
      <AccountCard
        account={{ ...BASE_ACCOUNT, followerCount: null }}
        onOpenAccount={vi.fn()}
        onUpdateFollower={vi.fn()}
      />,
    );
    expect(screen.getByText("Chưa nhập")).toBeInTheDocument();
  });

  it('shows "0" when followerCount is exactly zero, never "Chưa nhập" — BR-04', () => {
    render(
      <AccountCard
        account={{ ...BASE_ACCOUNT, followerCount: 0 }}
        onOpenAccount={vi.fn()}
        onUpdateFollower={vi.fn()}
      />,
    );
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.queryByText("Chưa nhập")).toBeNull();
  });

  it('shows "Chưa cập nhật follower" when followerUpdatedAt is null', () => {
    render(
      <AccountCard
        account={{ ...BASE_ACCOUNT, followerUpdatedAt: null }}
        onOpenAccount={vi.fn()}
        onUpdateFollower={vi.fn()}
      />,
    );
    expect(screen.getByText("Chưa cập nhật follower")).toBeInTheDocument();
  });
});

describe("AccountCard platform badge", () => {
  it("shows the correct accessible platform name for each platform", () => {
    const { rerender } = render(
      <AccountCard
        account={{ ...BASE_ACCOUNT, platform: "facebook" }}
        onOpenAccount={vi.fn()}
        onUpdateFollower={vi.fn()}
      />,
    );
    expect(screen.getByRole("img", { name: "Facebook" })).toBeInTheDocument();

    rerender(
      <AccountCard
        account={{ ...BASE_ACCOUNT, platform: "instagram" }}
        onOpenAccount={vi.fn()}
        onUpdateFollower={vi.fn()}
      />,
    );
    expect(screen.getByRole("img", { name: "Instagram" })).toBeInTheDocument();

    rerender(
      <AccountCard
        account={{ ...BASE_ACCOUNT, platform: "google" }}
        onOpenAccount={vi.fn()}
        onUpdateFollower={vi.fn()}
      />,
    );
    expect(screen.getByRole("img", { name: "Gmail" })).toBeInTheDocument();
  });
});

describe("AccountCard truncation", () => {
  it("sets a title attribute with the full display name for long names", () => {
    const longName = "A".repeat(60);
    render(
      <AccountCard
        account={{ ...BASE_ACCOUNT, displayName: longName }}
        onOpenAccount={vi.fn()}
        onUpdateFollower={vi.fn()}
      />,
    );
    expect(screen.getByTitle(longName)).toBeInTheDocument();
  });

  it("sets a title attribute with the full email for long emails", () => {
    const longEmail = `${"a".repeat(50)}@example.com`;
    render(
      <AccountCard
        account={{ ...BASE_ACCOUNT, loginEmail: longEmail }}
        onOpenAccount={vi.fn()}
        onUpdateFollower={vi.fn()}
      />,
    );
    expect(screen.getByTitle(longEmail)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Chạy test để xác nhận fail**

Run: `pnpm test`
Expected: FAIL — `./AccountCard` chưa tồn tại.

- [ ] **Step 4: Tạo `src/components/account/AccountCard.tsx`**

```tsx
import { Users } from "lucide-react";
import { formatFollowerCount, formatRelativeDays } from "../../lib/format";
import { strings } from "../../lib/strings";
import type { AccountSummary } from "../../types/account";
import { AccountAvatar } from "./AccountAvatar";
import { PlatformBadge } from "../ui/PlatformBadge";
import { StatusPill } from "../ui/StatusPill";

export interface AccountCardProps {
  account: AccountSummary;
  /** BR-06: cha tính, card không tự validate URL. */
  canOpen?: boolean;
  onOpenAccount: (id: string) => void;
  onUpdateFollower: (id: string) => void;
  className?: string;
}

const BUTTON_BASE =
  "focus-ring flex min-h-[42px] flex-1 items-center justify-center rounded-control px-3 text-sm font-semibold";

export function AccountCard({
  account,
  canOpen = true,
  onOpenAccount,
  onUpdateFollower,
  className = "",
}: AccountCardProps) {
  return (
    <div
      className={`w-[340px] rounded-card border border-border bg-white p-[18px] shadow-elevation-2 ${className}`}
    >
      <div className="mb-3 flex items-start gap-3">
        <div className="relative shrink-0">
          <AccountAvatar avatarUrl={account.avatarUrl} displayName={account.displayName} />
          <div className="absolute -right-1 -bottom-1">
            <PlatformBadge platform={account.platform} />
          </div>
        </div>

        <div className="min-w-0 flex-1 pt-1">
          <p className="truncate text-base font-bold text-shield-navy" title={account.displayName}>
            {account.displayName}
          </p>
          {account.username && (
            <p className="truncate text-[13px] text-shield-navy" title={account.username}>
              {account.username}
            </p>
          )}
          {account.loginEmail && (
            <p className="truncate text-[13px] text-status-neutral-text" title={account.loginEmail}>
              {account.loginEmail}
            </p>
          )}
        </div>
      </div>

      <StatusPill status={account.status} />

      <div className="mt-3 flex items-center gap-1.5 text-sm text-shield-navy tabular-nums">
        <Users size={16} aria-hidden={true} />
        <span>{formatFollowerCount(account.followerCount)}</span>
      </div>

      <div className="mt-2 border-t border-border pt-2 text-xs text-status-neutral-text">
        {formatRelativeDays(account.followerUpdatedAt)}
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className={`${BUTTON_BASE} border border-border-strong text-shield-navy`}
          onClick={() => onUpdateFollower(account.id)}
        >
          {strings.account.updateFollowerButton}
        </button>
        <button
          type="button"
          disabled={!canOpen}
          className={`${BUTTON_BASE} border border-fur-orange text-fur-orange-text disabled:cursor-not-allowed disabled:opacity-50`}
          onClick={() => onOpenAccount(account.id)}
        >
          {strings.account.openAccountButton}
        </button>
      </div>
    </div>
  );
}

export default AccountCard;
```

- [ ] **Step 5: Chạy test để xác nhận pass**

Run: `pnpm test`
Expected: PASS — 15 test mới xanh.

- [ ] **Step 6: Tạo `src/components/account/mockAccounts.ts`**

```ts
import type { AccountSummary } from "../../types/account";

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

const AVATAR_DATA_URI =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='88' height='88'%3E%3Crect width='88' height='88' fill='%23E46C00'/%3E%3C/svg%3E";

/** Dữ liệu mẫu — dùng cho cả test lẫn kiểm bằng mắt (Task 6). Phủ đủ: 5 trạng
 * thái, 3 nền tảng, avatar null/lỗi, follower null/0, tên+email dài (ellipsis),
 * tên có emoji, chữ "Đ". */
export const MOCK_ACCOUNTS: AccountSummary[] = [
  {
    id: "acc-1",
    platform: "facebook",
    status: "active",
    displayName: "Nguyễn Văn A",
    username: "@nguyenvana",
    loginEmail: "nguyenvana@gmail.com",
    avatarUrl: AVATAR_DATA_URI,
    followerCount: 1234567,
    followerUpdatedAt: daysAgo(0),
  },
  {
    id: "acc-2",
    platform: "instagram",
    status: "review",
    displayName: "Trần Thị Ánh Nguyệt — Shop Phụ Kiện Handmade Hà Nội ✨",
    username: "@tranthianhnguyet.handmade.hanoi",
    loginEmail: "a-very-long-address.for.truncation@a-long-domain-name.com.vn",
    avatarUrl: null,
    followerCount: 8900,
    followerUpdatedAt: daysAgo(8),
  },
  {
    id: "acc-3",
    platform: "google",
    status: "inactive",
    displayName: "Mochi Shop",
    username: null,
    loginEmail: "mochi.shop.official@gmail.com",
    avatarUrl: "https://invalid.invalid/a.png",
    followerCount: null,
    followerUpdatedAt: null,
  },
  {
    id: "acc-4",
    platform: "facebook",
    status: "locked",
    displayName: "PawPass Official Page",
    username: "@pawpass.official",
    loginEmail: null,
    avatarUrl: AVATAR_DATA_URI,
    followerCount: 0,
    followerUpdatedAt: daysAgo(45),
  },
  {
    id: "acc-5",
    platform: "instagram",
    status: "archived",
    displayName: "Đặng Đình Đức",
    username: "@dangdinhduc",
    loginEmail: "dangdinhduc@outlook.com",
    avatarUrl: AVATAR_DATA_URI,
    followerCount: 12,
    followerUpdatedAt: daysAgo(365),
  },
];
```

`https://invalid.invalid/...` dùng domain `.invalid` — dành riêng theo RFC 2606, lỗi ngay lập tức, không cần mạng thật hay chờ timeout.

- [ ] **Step 7: Chạy quality gate**

```bash
pnpm test
pnpm lint && pnpm format:check && pnpm typecheck && pnpm build
```

Expected: cả năm lệnh exit 0. Test count kỳ vọng: 41 (sau Task 1) + 5 (Task 2) + 6 (Task 3) + 4 (Task 4) + 15 (Task 5) = 71.

- [ ] **Step 8: Commit**

```bash
git add src/lib/strings.ts src/components/account/AccountCard.tsx src/components/account/AccountCard.test.tsx src/components/account/mockAccounts.ts
git commit -m "feat: AccountCard (compose Avatar/Badge/Pill) + dữ liệu mẫu"
```

---

### Task 6: Kiểm bằng mắt

**Files:**

- Modify: `src/pages/DashboardPage.tsx` (tạm thời, revert cuối task)

**Interfaces:**

- Consumes: `AccountCard`, `MOCK_ACCOUNTS` từ Task 5.
- Produces: không có gì tồn tại lâu dài — task này chỉ tạo ra một quan sát đã xác nhận, ghi trong report của chính nó. Không task nào sau phụ thuộc vào trạng thái file mà task này để lại.

Test tự động không trả lời được câu hỏi mà cả sub-project này tồn tại để giải quyết: tên/email dài có thực sự ellipsis đúng không (jsdom không có layout thật), pill Review có đọc nhầm thành nút cam của Topbar không, 2 nút 42px có vỡ xuống 2 dòng trong 340px không. Cần mắt người/agent nhìn ảnh chụp thật.

- [ ] **Step 1: Wire tạm `MOCK_ACCOUNTS` vào `DashboardPage.tsx`**

Thay toàn bộ nội dung `src/pages/DashboardPage.tsx` bằng:

```tsx
import { AccountCard } from "../components/account/AccountCard";
import { MOCK_ACCOUNTS } from "../components/account/mockAccounts";

function DashboardPage() {
  return (
    <div className="flex flex-wrap gap-5">
      {MOCK_ACCOUNTS.map((account) => (
        <AccountCard
          key={account.id}
          account={account}
          onOpenAccount={(id) => console.log("open", id)}
          onUpdateFollower={(id) => console.log("update follower", id)}
        />
      ))}
    </div>
  );
}

export default DashboardPage;
```

- [ ] **Step 2: Boot app, chụp màn hình ở 1440px (mặc định) — dùng đúng pattern đã dùng ở MochiIllustration**

```bash
nohup pnpm tauri dev > tauri-dev-visual-check.log 2>&1 &
```

Poll tới khi build xong (kế thừa cache từ các task trước — dưới 1 phút):

```bash
until grep -qE "Finished|error\[|error:" tauri-dev-visual-check.log 2>/dev/null; do sleep 2; done
tail -10 tauri-dev-visual-check.log
tasklist //FI "IMAGENAME eq pawpass.exe"
```

Expected: `Finished`/`Running`, không có error, tasklist cho ra một PID.

Chụp màn hình bằng PowerShell (script đã dùng thành công ở MochiIllustration Task 3 — dùng `Get-Process` lấy `MainWindowHandle` thay vì `FindWindow` vì `FindWindow` từng thất bại dù cửa sổ tồn tại thật):

```powershell
Add-Type -AssemblyName System.Drawing
$proc = Get-Process -Name "pawpass" -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
if (-not $proc) { Write-Error "Không tìm thấy tiến trình pawpass.exe có cửa sổ"; exit 1 }
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class Win32Screenshot2 {
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
  public struct RECT { public int Left; public int Top; public int Right; public int Bottom; }
}
"@
[Win32Screenshot2]::SetForegroundWindow($proc.MainWindowHandle) | Out-Null
Start-Sleep -Milliseconds 800
$rect = New-Object Win32Screenshot2+RECT
[Win32Screenshot2]::GetWindowRect($proc.MainWindowHandle, [ref]$rect) | Out-Null
$width = $rect.Right - $rect.Left
$height = $rect.Bottom - $rect.Top
$bmp = New-Object System.Drawing.Bitmap $width, $height
$graphics = [System.Drawing.Graphics]::FromImage($bmp)
$graphics.CopyFromScreen($rect.Left, $rect.Top, 0, 0, $bmp.Size)
$bmp.Save("C:\Users\Viet Tien\Downloads\PawPass\.claude\worktrees\account-card\.superpowers\sdd\2026-08-10-account-card\accountcard-1440.png", [System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose()
$bmp.Dispose()
Write-Output "Saved: $width x $height"
```

(Đường dẫn lưu ảnh giả định workspace SDD ở `.claude/worktrees/account-card/.superpowers/sdd/2026-08-10-account-card/` — nếu thư mục thực tế khác, lưu vào đúng thư mục SDD workspace của kế hoạch này, không lưu vào repo.)

- [ ] **Step 3: Resize cửa sổ xuống 1180px (giới hạn tối thiểu §5.1), chụp lần 2**

```powershell
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class Win32Resize {
  [DllImport("user32.dll")] public static extern bool MoveWindow(IntPtr hWnd, int X, int Y, int nWidth, int nHeight, bool bRepaint);
}
"@
$proc = Get-Process -Name "pawpass" -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
[Win32Resize]::MoveWindow($proc.MainWindowHandle, 0, 0, 1180, 900, $true) | Out-Null
Start-Sleep -Milliseconds 500
```

Lặp lại đúng script chụp màn hình ở Step 2 (đổi tên file output thành `accountcard-1180.png`).

- [ ] **Step 4: Đọc cả 2 ảnh, tự đánh giá theo đúng 7 điểm trong spec**

Dùng Read tool trên cả `accountcard-1440.png` và `accountcard-1180.png`, xem xét cụ thể (viết vào report, không chỉ nói "trông ổn"):

1. Card #2 (tên 54 ký tự) — ellipsis đúng 1 dòng hay bị vỡ layout? 5 card có cùng chiều cao không?
2. Email 60 ký tự của card #2 — ellipsis có nằm gọn trong padding không, có đè lên status pill không?
3. Card #5 (Archived, opacity nếu có áp dụng) — còn đọc được nội dung không?
4. Chữ cái đại diện trong khung 88px của card #3 (avatar lỗi) — có hiện avatar vỡ hình thoáng qua trước khi chuyển initials không (kiểm tra bằng cách chờ hết animation lúc chụp, không chụp ngay lúc mới boot)?
5. **Pill "Cần xem lại" (Review) của card #2 và nút cam ở Topbar trong cùng khung hình** — có đọc nhầm thành cùng một loại hành động không?
6. Cột follower (`1,2M`/`8,9K`/`Chưa nhập`/`0`/`12`) — có thẳng hàng, không nhảy chiều rộng không?
7. Hai nút "Cập nhật follower"/"Mở tài khoản" trong card 340px — có vỡ xuống 2 dòng không?

- [ ] **Step 5: Dọn tiến trình và log**

```bash
taskkill //F //IM pawpass.exe
rm -f tauri-dev-visual-check.log
```

- [ ] **Step 6: Revert `DashboardPage.tsx`**

```bash
git checkout -- src/pages/DashboardPage.tsx
git status --short
```

Expected: `git status --short` trống (không có gì thay đổi lâu dài). Không commit cho task này.

---

## Self-Review Notes

**Spec coverage:** cả 6 mục "Quyết định" trong spec đều có task tương ứng — icon nền tảng (Task 2), data contract (Task 1), `avatarInitial` (Task 1), tách file (Task 2-5), test (từng Task riêng + tổng ở Task 5), dữ liệu mẫu + kiểm bằng mắt (Task 6, đúng 7 điểm named trong spec).

**Placeholder scan:** không có TBD/TODO; mọi khối code là nội dung đầy đủ, chạy được, không phải mô tả suông.

**Type consistency:** `AccountSummary`/`Platform`/`AccountStatus`/`PLATFORMS`/`ACCOUNT_STATUSES` định nghĩa đúng một lần ở Task 1, các Task sau import lại y hệt tên, không đổi tên field giữa chừng (`avatarUrl` dùng nhất quán từ Task 1 tới Task 6, không lẫn `avatarPath`/`avatar_path` ở đâu). `onOpenAccount`/`onUpdateFollower` giữ đúng chữ ký `(id: string) => void` xuyên suốt Task 5-6. Test case expected values (`avatarInitial`) đã chạy thật trong Node trước khi viết vào plan, không phải suy đoán.

**Correction so với spec/thảo luận trước đó:** khi viết plan, đã chạy thật `Intl.Segmenter` trên input NFD và phát hiện nó tự gộp đúng grapheme cluster (base + dấu) **không cần** `.normalize("NFC")` — lời giải thích "normalize để tránh vỡ trên input NFD" trong bản thảo luận trước là không chính xác về nguyên nhân (dù kết luận vẫn đúng: hàm hoạt động đúng trên NFD). Đã sửa comment trong code ở Task 1 Step 4 để quy đúng nguyên nhân cho `Intl.Segmenter`, không giữ lời giải thích sai dù hành vi cuối cùng không đổi. Giữ `.normalize("NFC")` lại vì vô hại và có ích cho bước filter regex/`toUpperCase()` phía sau, chỉ sửa lời giải thích.
