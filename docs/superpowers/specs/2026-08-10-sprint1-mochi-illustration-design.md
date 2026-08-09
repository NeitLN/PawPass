# Sprint 1 / Sub-project 3: MochiIllustration

- Status: Approved
- Date: 2026-08-10
- Phạm vi: component `MochiIllustration` (7 state MVP), asset trong `src/assets/brand/mochi/`, test Vitest + React Testing Library (cài mới). Không có màn hình thật nào dùng nó — các sub-project sau (AccountCard empty state, Detail, form...) sẽ import và dùng.
- Tư vấn kỹ thuật: Opus 5, đã đo pixel thật trên 7 file PNG nguồn (bbox, ΔE màu, tỷ lệ pixel trắng/bán trong suốt) trước khi đề xuất — số liệu trong tài liệu này lấy từ đó, không phải ước lượng.

## Bối cảnh & vấn đề

SOURCE-OF-TRUTH §8.1 định nghĩa 8 trạng thái mascot: Neutral, Wave, Search, Security, Sync, Offline, Success, Import. §8.3 đã đo: 5/8 có ảnh thật (`pawpass-shiba-genz-cute-pack/`), Sync/Offline dùng tạm ảnh Notification/Support, Import là post-MVP chưa cần.

Toàn bộ 7 ảnh có viền trắng phong cách sticker, biến mất trên nền `Surface` (`#f8f6f2`, gần trắng) — đây là "vấn đề keyline trắng" mà §8.3 giao cho sub-project này quyết định.

## Số đo thật (giải nén PNG, không phải ước lượng)

| Asset                    | content bbox | viền trắng (median) | % pixel trắng |
| ------------------------ | ------------ | ------------------- | ------------- |
| 01-wave                  | 1028×970     | 12px                | 12.4%         |
| 02-security              | 964×1058     | 9px                 | 5.0%          |
| 03-organize (Neutral)    | 984×1138     | 15px                | 12.1%         |
| 04-search                | 993×1100     | 19px                | 14.7%         |
| 05-notification (→ sync) | 915×1036     | 20px                | 15.8%         |
| 06-success               | 1014×1020    | 26px                | 17.6%         |
| 07-support (→ offline)   | 875×1030     | 20px                | 13.6%         |

Tương phản: viền trắng trên Surface = **1.08:1** (vô hình). Trên Muzzle Cream = **1.24:1** luminance nhưng **ΔE 22.4** (so với ΔE 3.7 trên Surface) — thứ cứu được viền là **độ chênh màu**, không phải độ sáng. Quy ra kích thước hiển thị: viền co còn **dưới 1px ở 48px** — tan biến bất kể có nền tint hay không. Ở 240px viền còn 1.7–5px — đây là size nền tint mới thật sự có tác dụng.

**Kết luận ngược với giả định ban đầu:** nền tint cần ở size LỚN, không phải size nhỏ.

## Quyết định

1. **Luôn bật `drop-shadow` từ `--shadow-elevation-1`** trên mọi instance, mọi size — trace theo alpha silhouette, cho viền một mép nhìn thấy được ở bất kỳ nền/size nào, chi phí gần bằng 0 (pixel bán trong suốt/antialias chỉ 0.0–0.3% mỗi ảnh nên không bị nhoè).
2. **Nền Muzzle Cream chỉ bật tự động ở `md`/`lg`/`xl`, không bật ở `sm`** (`backdrop="auto"`, mặc định) — vì ở 48px viền đã tan biến, nền tint không cứu được gì, chỉ thêm chi tiết thừa. Hai màn hero (onboarding, vault-locked) tự có nền màu riêng của màn hình → truyền `backdrop="none"`. Còn `backdrop="cream"` để ép bật khi cần.
3. **`size` là enum, không phải số px thô**: `sm`=48 (toast) · `md`=80 (dashboard header, khớp trần 88px của §5.2) · `lg`=160 (empty state) · `xl`=240 (hero onboarding/vault-lock).
4. **`alt` mặc định rỗng (`""`), có prop ghi đè.** Mochi luôn đứng cạnh text đã đủ nghĩa (heading, toast copy...) → ảnh trang trí theo WCAG 1.1.1. **Sửa mâu thuẫn SOURCE-OF-TRUTH:** §7.5 nói "alt text cố định", §7.6 nói "ảnh trang trí dùng alt rỗng" — hai câu ngược nhau. Quyết định này nghiêng theo §7.6; sẽ sửa §7.5 cho khớp trong cùng lúc.
5. **Đĩa nền: `overflow: visible`, đường kính = 100% box.** Một số ảnh (03-organize) vươn tới cách đỉnh canvas 52px — tai/phụ kiện sẽ tràn ra ngoài hình tròn nội tiếp, đây là chủ đích (giống Duolingo/Intercom), không phải lỗi cần crop.
6. **Không dựng bảng scale/offset riêng cho từng ảnh** dù bbox lệch tới 17% giữa các state — hai state không bao giờ hiển thị cùng lúc nên sai lệch không nhận ra được trong thực tế.
7. **`draggable={false}`, `user-select: none`** trên ảnh — mascot có thể kéo được là một papercut thật trên desktop app.
8. **Copy ảnh vào `src/assets/brand/mochi/`, import ES module** (không dùng `/public` + string path) — đổi tên file sai sẽ là lỗi build, không phải lỗi im lặng lúc chạy.

## File structure

```
src/
  assets/brand/mochi/
    neutral.png    ← docs/brand-reference/.../03-organize-accounts-genz.png
    wave.png       ← 01-wave-genz.png
    search.png     ← 04-search-genz.png
    security.png   ← 02-security-genz.png
    success.png    ← 06-success-genz.png
    sync.png       ← 05-notification-genz.png (tạm, xem §8.3)
    offline.png    ← 07-support-genz.png (tạm, xem §8.3)
  components/
    ui/
      MochiIllustration.tsx
      MochiIllustration.test.tsx
```

`MochiIllustration` vào `components/ui/` (không phải `app/`) — đây là primitive branded, dùng lại ở nhiều feature khác nhau (đúng vị trí SOURCE-OF-TRUTH §9.2 đặt cho "branded primitives").

## Component

```tsx
type MochiState = "neutral" | "wave" | "search" | "security" | "sync" | "offline" | "success";
type MochiSize = "sm" | "md" | "lg" | "xl";
type MochiBackdrop = "auto" | "cream" | "none";

interface MochiIllustrationProps {
  state: MochiState;
  size?: MochiSize; // default "md"
  backdrop?: MochiBackdrop; // default "auto"
  alt?: string; // default ""
  className?: string;
}
```

`size` map sang px cụ thể (48/80/160/240), set cứng `width`/`height` trên thẻ `<img>` để chống layout shift. `backdrop="auto"` bật đĩa cream khi size ∈ {md, lg, xl}, tắt khi size = sm.

## Test setup (Vitest + React Testing Library — lần đầu trong repo)

Cài `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`. Đổi `vite.config.ts`: `test.environment` từ `"node"` sang `"jsdom"` (toàn cục — `format.test.ts` là hàm thuần, không bị ảnh hưởng), thêm `setupFiles` cho jest-dom matcher.

Test cases (~10-12 assertion, một file):

1. Bảng state → filename đúng cho cả 7 state (quan trọng nhất — `sync`→`05-notification`/`offline`→`07-support` chỉ ghi trong prose, đổi nhầm file không có gì báo lỗi type).
2. Mỗi state resolve ra `src` không rỗng.
3. `alt` mặc định rỗng, ảnh không có "tên" trong accessibility tree (`queryByRole('img')` phải null khi alt rỗng).
4. Truyền `alt` cụ thể thì ảnh có tên (`getByRole('img', {name: ...})`).
5. Backdrop auto: có mặt ở `lg`, không có ở `sm`; `backdrop="none"` tắt được ở `lg`; `backdrop="cream"` bật được ở `sm`.
6. `size` map đúng `width`/`height` attribute.

**Giới hạn đã biết:** RTL không trả lời được câu "viền có thật sự thấy rõ trên nền cream ở từng size" — cần xác nhận bằng mắt (boot app thật, xem cả 4 size × vài state).

## Ngoài phạm vi

Không có "import" state (post-MVP). Không có Storybook (roadmap ghi ở Sprint sau, §14). Không kiểm tra riêng cho Windows High Contrast — ghi vào AT-11 checklist để làm sau, không chặn sub-project này. Không dựng bảng scale/offset riêng theo từng ảnh.
