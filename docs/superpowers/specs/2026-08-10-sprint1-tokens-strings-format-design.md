# Sprint 1 / Sub-project 1: Design tokens + strings hạ tầng

- Status: Approved
- Date: 2026-08-10
- Phạm vi: `src/styles/tokens.css`, `src/lib/strings.ts`, `src/lib/format.ts` + test. Không có component UI nào trong sub-project này — đó là các sub-project sau (Sidebar/topbar, MochiIllustration, AccountCard, form, Detail page).

## Bối cảnh

Sprint 1 theo `docs/SOURCE-OF-TRUTH.md` §12.3 gồm 6 mảnh phụ thuộc lẫn nhau. Mảnh này là nền — mọi component sau đều cần tokens màu và (nếu có chữ) strings/format đã có sẵn.

## Quyết định

1. **Không xuất token màu ra hằng số TypeScript.** Sprint 1 chỉ dùng qua Tailwind class (`bg-fur-orange`...); thêm TS constants sau nếu có nhu cầu thật (canvas/chart).
2. **Tách `format.ts` khỏi `strings.ts`.** `strings.ts` chỉ chứa chuỗi UI tĩnh (để chuyển sang i18n thật sau này không phải lục code); `format.ts` chứa logic tính toán (ngày tương đối, rút gọn follower).
3. **`tokens.css` dùng Tailwind v4 `@theme` directive** — sinh utility class trực tiếp từ token (`bg-fur-orange`, `text-status-active-text`...), đúng convention Tailwind v4, tránh phải viết `bg-[var(--x)]` thủ công khắp nơi.
4. **Không tạo token spacing riêng.** Thang 4/8/12/16/20/24/32/40px ở §7.4 trùng khớp chính xác thang mặc định của Tailwind (`p-1`…`p-10`) — dùng thẳng, không cần đặt tên lại.
5. **Cài Vitest ngay trong sub-project này** vì `format.ts` có logic thật cần test (BR-04), chưa cài Testing Library/Playwright — chưa có component để test.

## `tokens.css` — nội dung

```css
@import "tailwindcss";

@theme {
  --color-fur-orange: #e46c00;
  --color-fur-orange-hover: #cd6100;
  --color-fur-orange-text: #ab5100;
  --color-shield-navy: #000c24;
  --color-muzzle-cream: #fce4c0;
  --color-surface: #f8f6f2;
  --color-border: #e8dfd0;
  --color-border-strong: #9a8a70;
  --color-danger: #b3271a;

  --color-status-active-bg: #dff3e7;
  --color-status-active-text: #116039;
  --color-status-active-solid: #1f9254;
  --color-status-warning-bg: #fdf0d2;
  --color-status-warning-text: #7a5200;
  --color-status-warning-solid: #f2a81e;
  --color-status-neutral-bg: #eceef2;
  --color-status-neutral-text: #4a5364;
  --color-status-neutral-solid: #8a93a3;
  --color-status-danger-bg: #fbe2e0;
  --color-status-danger-text: #b3271a;
  --color-status-danger-solid: #b3271a;
  --color-status-info-bg: #deeafb;
  --color-status-info-text: #1c56b6;
  --color-status-info-solid: #246ce4;

  --color-account-blue: #246ce4;
  --color-account-pink: #d8186c;
  --color-account-coral: #f05448;

  --radius-control: 0.625rem;
  --radius-card: 1.125rem;
  --radius-modal: 1.375rem;

  --shadow-elevation-1: 0 2px 8px rgb(0 12 36 / 0.06);
  --shadow-elevation-2: 0 8px 24px rgb(0 12 36 / 0.1);

  --font-brand: "Nunito Sans", system-ui, sans-serif;
  --font-body: "Inter", system-ui, sans-serif;
}

.focus-ring {
  box-shadow: 0 0 0 3px rgb(228 108 0 / 0.45);
}
.focus-ring-on-solid {
  box-shadow: 0 0 0 3px rgb(0 12 36 / 0.55);
}
```

Không có token cho `Outline Black` (#000000) — chỉ dùng trong file ảnh mascot, không phải token UI lặp lại. Không có token cho motion (160-220ms) — chưa có animation nào trong Sprint 1 cần đến.

`src/index.css` đổi từ `@import "tailwindcss";` thành `@import "./styles/tokens.css";` (tokens.css tự import tailwindcss ở dòng đầu).

## `strings.ts` — nội dung khởi tạo

```ts
export const strings = {
  dashboard: {
    greeting: (name: string) => `Chào buổi tối, ${name}`,
  },
  account: {
    updatedAgo: (days: number) => `Đã cập nhật ${days} ngày trước`,
    updatedToday: "Đã cập nhật hôm nay",
    neverUpdatedFollower: "Chưa cập nhật follower",
    followerNotEntered: "Chưa nhập",
  },
  clipboard: {
    copiedWillClear: "Đã sao chép — PawPass sẽ xoá sau 30 giây",
  },
} as const;
```

Chỉ chứa chuỗi đã quyết định cụ thể trong SOURCE-OF-TRUTH — không bịa chuỗi cho màn hình chưa thiết kế. Các sub-project sau tự thêm namespace của mình.

## `format.ts` — nội dung

```ts
import { strings } from "./strings";

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("vi-VN").format(n);
}

export function formatFollowerCount(n: number | null): string {
  if (n === null) return strings.account.followerNotEntered;
  if (n < 1000) return String(n);
  const [divisor, suffix] = n < 1_000_000 ? [1_000, "K"] : [1_000_000, "M"];
  return `${(n / divisor).toFixed(1).replace(".", ",")}${suffix}`;
}

export function formatRelativeDays(date: Date | null): string {
  if (date === null) return strings.account.neverUpdatedFollower;
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  return days === 0 ? strings.account.updatedToday : strings.account.updatedAgo(days);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}
```

## Test bắt buộc (BR-04 — release blocker theo §15.3 nếu sai)

`src/lib/format.test.ts`:

- `formatFollowerCount(null)` → `"Chưa nhập"` — không bao giờ `"0"`.
- `formatFollowerCount(0)` → `"0"` — 0 thật khác với chưa nhập.
- `formatFollowerCount(1234)` → `"1,2K"`.
- `formatFollowerCount(3_400_000)` → `"3,4M"`.
- `formatFollowerCount(999)` → `"999"` (chưa rút gọn dưới 1000).
- `formatRelativeDays(null)` → `"Chưa cập nhật follower"`.
- `formatDate(new Date(2026, 7, 9))` → `"09/08/2026"`.

## Ngoài phạm vi

Không có component nào. Không có TS constants cho màu. Không cài Testing Library/Playwright. Không có token motion/spacing riêng.
