# Sprint 1 / Sub-project 4: AccountCard

- Status: Approved
- Date: 2026-08-10
- Phạm vi: `AccountCard`, `PlatformBadge`, `StatusPill`, `AccountAvatar` components; `src/types/account.ts`; `avatarInitial()` trong `format.ts`; 3 icon nền tảng chính thức. Không có data layer thật (Supabase ở Sprint 3) — component nhận `AccountSummary` qua props, không tự fetch/mutate gì.
- Tư vấn kỹ thuật: Opus 5 — tự fetch các trang Meta/Google Brand Resource Center và kiểm tra `lucide-react`/`simple-icons` thật (không đoán từ trí nhớ) trước khi đề xuất nguồn icon.

## Bối cảnh

Sprint 1 sub-project 4 trong chuỗi 6 mảnh (tokens ✅, App shell ✅, MochiIllustration ✅, **AccountCard**, Add/Edit form, Detail page). AccountCard là component hiển thị dày đặc nhất trong app — theo SOURCE-OF-TRUTH §5.3/§5.4, dùng lại `format.ts`/`strings.ts` (sub-project 1) và token màu status (§7.2.2, sub-project 1).

## Quyết định

### 1. Icon nền tảng — vendor thủ công, không dùng thư viện icon thương hiệu

Đã kiểm chứng thật (không đoán):

- **`lucide-react` v1 đã gỡ hết icon thương hiệu** (Facebook/Instagram trả 404 trên bản mới nhất) vì rủi ro pháp lý — chỉ còn icon chung (check, flag, lock, archive...).
- **`simple-icons` còn đủ 4 icon** nhưng có 3 vấn đề: (a) chỉ có bản đơn sắc, trong khi Meta cấm đổi màu logo Facebook sang màu khác ("Do not recolor our logo to your own brand colors") — mà token `--color-account-blue` của ta khác hẳn Facebook Blue thật; (b) icon có thể bị gỡ khỏi thư viện theo yêu cầu pháp lý bất cứ lúc nào (đã từng xảy ra ở quy mô lớn); (c) Meta ghi rõ không được lấy logo từ "third-party icon libraries."
- **Google cho phép rõ ràng** việc dùng icon nhỏ để chỉ ra sản phẩm tích hợp với Google, miễn không ngụ ý được xác nhận (endorsement) — đúng use-case của app này.

**Quyết định:** tự tải icon chính thức, lưu tại `docs/brand-reference/platform-icons/` (nguồn gốc) rồi copy vào `src/components/ui/icons/`:

| Nền tảng  | Nguồn                                                         | Định dạng | Lý do                                                                                                                                                                                                                               |
| --------- | ------------------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Facebook  | Meta Brand Resource Center — Facebook Logo (Primary Logo)     | PNG       | Bộ chính thức của Meta không có bản SVG, chỉ .ai/.png                                                                                                                                                                               |
| Instagram | Meta Brand Resource Center — Instagram Brand (Gradient Glyph) | PNG       | Bản SVG chính thức nặng 10.9MB (Illustrator nhúng kèm ảnh raster bên trong) — không thực tế để inline; PNG (2.6MB, độ phân giải cao) dùng được ngay theo đúng pattern `MochiIllustration` (import ES module, browser tự downsample) |
| Gmail     | `fonts.gstatic.com` — Google product logo CDN chính thức      | SVG       | File sạch, 616 bytes, fetch công khai không cần xác thực — đã tự tải và xác minh                                                                                                                                                    |

**Dùng icon Gmail (phong bì), không dùng logo "G" của Google** — vì tài khoản trong app này chính là địa chỉ Gmail (§6.4), và chữ "G" gắn liền với quy tắc thương hiệu "Sign in with Google" (ngụ ý tích hợp đăng nhập mà app không có).

**Không tô màu lại 2 icon PNG** (Facebook/Instagram) bằng token accent — đúng nguyên văn hướng dẫn thương hiệu. Token `--color-account-blue/pink/coral` (§7.2.3) dùng cho các chi tiết khác (viền trái card, chip lọc...), không phải để nhuộm icon.

### 2. Data contract — `src/types/account.ts`, không phải type cục bộ

```ts
export const PLATFORMS = ["facebook", "instagram", "google"] as const;
export const ACCOUNT_STATUSES = ["active", "review", "inactive", "locked", "archived"] as const;

export type Platform = (typeof PLATFORMS)[number];
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export interface AccountSummary {
  id: string;
  platform: Platform;
  status: AccountStatus;
  displayName: string;
  username: string | null;
  loginEmail: string | null;
  avatarUrl: string | null;
  followerCount: number | null;
  followerUpdatedAt: Date | null;
}
```

Lý do dùng type dùng chung thay vì khai báo trong `AccountCard.tsx`: `Platform`/`AccountStatus` sẽ còn được `PlatformBadge`, `StatusPill`, filter Dashboard (§5.2), Zod schema của Add/Edit form (sub-project 5), và trang Detail (sub-project 6) dùng lại — khai báo trùng lặp ở nhiều nơi là cách chắc chắn để một ngày filter "quên" biết về trạng thái `archived`.

Ba quyết định đặt tên có trọng lượng:

- **`avatarUrl` chứ không phải `avatarPath`** (tên cột DB thật là `avatar_path`, một Supabase Storage path). Đặt tên là `avatarUrl` buộc việc resolve signed URL nằm ở tầng data (Sprint 3), không rò vào component hiển thị — đây là ranh giới quan trọng nhất trong toàn bộ contract.
- **camelCase ở biên UI**, snake_case ở tầng repository — một hàm `toAccountSummary(row)` duy nhất sau này, một chỗ để sửa.
- **`followerUpdatedAt: Date | null`** khớp thẳng với `formatRelativeDays` đã có — không parse ISO string trong component.

```ts
interface AccountCardProps {
  account: AccountSummary;
  canOpen?: boolean; // BR-06: cha tính, card không tự validate URL
  onOpenAccount: (id: string) => void;
  onUpdateFollower: (id: string) => void;
  className?: string;
}
```

**Callback nhận `id`, không nhận cả object và không nhận 0 tham số.** `onOpenAccount()` không tham số buộc phải tạo closure riêng cho mỗi card và khiến test "đã bấm đúng card nào" trở nên vô nghĩa; nhận cả object khiến test dễ vỡ theo mọi thay đổi fixture. `id` là tối thiểu ổn định, đủ để cha tra ra URL.

**`canOpen` tồn tại vì BR-06** ("Nút mở tài khoản bị vô hiệu hóa nếu URL không hợp lệ"). Card cần biết có mở được không nhưng **không được nhận `profile_url`** — validate URL nằm ở Rust theo allowlist (§4.4, §11). Một boolean do cha tính đáp ứng BR-06 mà không để URL lọt vào tầng hiển thị.

### 3. `avatarInitial()` — vào `format.ts`, có test riêng

Không tầm thường như nhìn qua — `name[0]` ngây thơ vỡ ở 2 trường hợp cụ thể, cả hai rơi đúng vào tiếng Việt:

```
'🐶'[0]                       →  "\ud83d"   // lone surrogate, hiện thành ô vuông lỗi
'ệ'.normalize('NFD')[0]       →  "e"        // dấu bị tách rời rồi rớt mất
```

Dữ liệu NFD không hiếm — đây là dạng macOS/một số nguồn CSV/paste xuất ra.

```ts
const GRAPHEMES = new Intl.Segmenter("vi", { granularity: "grapheme" });

/** Chữ cái đại diện cho avatar khi không có ảnh. Lấy tên gọi (token cuối), §5.3. */
export function avatarInitial(displayName: string): string {
  const tokens = displayName.normalize("NFC").trim().split(/\s+/).filter(Boolean);
  const named = tokens.filter((t) => /^[\p{L}\p{N}]/u.test(t));
  const source = named.at(-1) ?? tokens.at(-1) ?? "";
  const [first] = GRAPHEMES.segment(source);
  return first ? first.segment.toUpperCase() : "?";
}
```

Khởi tạo `Segmenter` ở module scope (một lần, không phải mỗi render — đáng kể ở lưới 500 card theo §1.2).

**Lấy đúng 1 grapheme từ token CUỐI, không phải 2 chữ cái kiểu phương Tây từ họ.** Lý do riêng cho tiếng Việt: tên gọi (từ cuối) là thứ định danh một người, không phải họ. "Nguyễn Văn A" → "A"; kiểu phương Tây ("NA") sẽ lấy họ trước — gần 40% người Việt họ Nguyễn, trong một lưới tài khoản của một người dùng, chữ cái họ gần như không phân biệt được gì ("NA / NB / NC" nhìn giống hệt nhau). Nhiều `display_name` cũng không phải tên người (tên page, tên shop) — token cuối vẫn là lựa chọn hợp lý.

Test trong `format.test.ts` (6 case): tên 3 từ tiếng Việt → đúng từ cuối; **input NFD cho cùng kết quả với NFC** (test này là lý do hàm tồn tại); tên bắt đầu bằng emoji → không vỡ, không trả lone surrogate; tên thương hiệu 1 từ; "Đặng Đình Đức" → "Đ" (chữ hay bị xử lý sai bởi ASCII-fold ngây thơ); chuỗi rỗng/toàn khoảng trắng → "?" không throw.

### 4. Tách file

```
src/
  types/account.ts
  lib/format.ts                          # + avatarInitial()
  components/
    ui/
      PlatformBadge.tsx + .test.tsx      # { platform, size? } — không biết AccountSummary
      StatusPill.tsx    + .test.tsx      # { status } — không biết AccountSummary
      icons/PlatformIcons.tsx            # 3 icon đã tải, kèm comment nguồn gốc + ngày tải
    account/
      AccountCard.tsx  + .test.tsx
      AccountAvatar.tsx                  # tách vì có state (ảnh lỗi → chữ cái đại diện)
      mockAccounts.ts                    # dữ liệu mẫu, dùng chung cho test lẫn kiểm bằng mắt
```

- **`PlatformBadge`/`StatusPill` vào `ui/`** — primitive không biết gì về `AccountSummary`, đúng như component inventory (§7.5) liệt kê chúng tách biệt với `AccountCard`. Cả hai có ít nhất 3 điểm dùng lại đã biết trước (card, trang Detail §6.1, dropdown lọc/preview form §5.2/§4.3) — không phải suy đoán tương lai.
- **`AccountCard` vào `account/` mới** — biết về follower/mở tài khoản, không phải primitive thuần.
- **`AccountAvatar` tách riêng vì có state**, không phải vì tái dùng — cần `useState` theo dõi ảnh lỗi (`onError`). Hai lưu ý đúng khi implement: avatar null và avatar lỗi là 2 tình huống khác nhau (spec chỉ nói tới null, phải xử lý cả lỗi tải ảnh); và phải `key={avatarUrl}` trên `<img>` để reset state lỗi khi avatar đổi — nếu không, card re-sort trong lưới có thể giữ nguyên trạng thái lỗi cũ dù avatar mới hợp lệ.
- **Không tách** follower row / update row / actions row — chỉ dùng ở đúng một chỗ, không state riêng.
- **Không dựng `ui/Button.tsx`** trong sub-project này — §7.5 đặc tả Button 5 biến thể, xứng đáng một lượt riêng. Hai nút ở đây viết inline, gom class chung vào một hằng số cục bộ để sau này tách ra là một thao tác move đơn giản.

### 5. Test

**`format.test.ts`**: +6 case cho `avatarInitial` (mục 3).

**`AccountCard.test.tsx`** (~14-18 `it`, dùng `it.each(ACCOUNT_STATUSES)` — import từ `types/account.ts`, không khai báo mảng riêng trong test):

1. Bấm "Mở tài khoản" gọi đúng `onOpenAccount(id)`, **không gọi** `onUpdateFollower` — bắt lỗi copy-paste handler, thứ ảnh chụp màn hình không thấy được.
2. Cả 5 trạng thái đều hiện chữ tiếng Việt **và** một icon trong pill (bằng chứng cho AT-21).
3. Avatar cả 3 đường: null → không có `<img>`, hiện chữ cái đại diện; có ảnh → `<img>` có `alt` **không rỗng** (khác Mochi — avatar cần alt có nghĩa, §7.6 phân biệt ảnh trang trí và ảnh mang thông tin); `fireEvent.error(img)` → chuyển sang chữ cái đại diện.
4. `followerCount: null` → "Chưa nhập"; **`followerCount: 0` → "0"** (không phải "Chưa nhập" — đúng lỗi `n || fallback` mà BR-04 tồn tại để chặn).
5. `PlatformBadge` có accessible name đúng cho cả 3 nền tảng (`getByRole("img", {name: "Facebook"})`).
6. Tên/email dài có attribute `title` (điều duy nhất test được về ellipsis trong jsdom — jsdom không có layout thật nên không đo được có ellipsis hay không).

Assert **chuỗi tiếng Việt trực tiếp** (`"Đã cập nhật hôm nay"`), không import từ `strings.ts` — test đọc `getByText(strings.x)` sẽ pass ngay cả khi giá trị đó lỡ bị gõ thành `""`.

**Không test**: tên class Tailwind, có ellipsis thật không (cần mắt nhìn), snapshot, opacity 60% của Archived (thuần CSS — nếu cần bằng chứng thì expose `data-archived="true"` thay vì test class).

### 6. Dữ liệu mẫu + kiểm bằng mắt

`mockAccounts.ts` xuất `MOCK_ACCOUNTS: AccountSummary[]`, dùng chung cho test và trang kiểm — không viết inline trong page (để còn sống sót sau khi gỡ code tạm, vì Dashboard rỗng/loading sau này cũng cần fixture).

5 bản ghi, ngày dùng `daysAgo(n)` tính từ `Date.now()` (không hardcode ISO — tránh 1 năm sau ảnh chụp "Đã cập nhật 214 ngày trước" bị lệch), phủ đủ: cả 5 trạng thái, cả 3 nền tảng, avatar null, avatar lỗi (`https://invalid.invalid/...` — domain dành riêng theo RFC 2606, lỗi ngay không cần mạng thật), follower null, **follower = 0**, tên 54 ký tự + email 60 ký tự (kiểm ellipsis không vỡ layout — AT-21), tên có emoji, chữ "Đ".

Avatar dùng `data:` URI SVG hình vuông đơn giản (không hotlink URL thật — ảnh mạng thật sẽ lỗi hết dưới CSP của Tauri hoặc khi offline, lúc đó "test" fallback avatar mà chẳng học được gì).

Wire tạm vào `DashboardPage.tsx` (không phải `AccountsPage`) để Topbar's nút cam "Add account" nằm cùng khung hình — cần cho việc kiểm màu Review pill không trùng với Fur Orange (bên dưới). Chụp ở **cả 1440px (3 cột) và 1180px (2 cột, giới hạn tối thiểu §5.1)** — kết luận ellipsis khác nhau ở mỗi độ rộng.

Điều cần nhìn cụ thể:

1. Tên 54 ký tự ellipsis đúng 1 dòng, không đẩy card cao hơn card khác (dấu hiệu: 5 card cùng chiều cao).
2. Email 60 ký tự ở 13px không tràn xuống dưới status pill.
3. Archived ở opacity 60% — bảng màu §7.2 đo ở opacity 100%, tổ hợp này chưa được đo, cần xem còn đọc được không.
4. Chữ cái đại diện trong khung 88px — căn giữa đúng, và trường hợp ảnh lỗi có nháy hình vỡ trước khi chuyển sang chữ cái không.
5. **Pill Review cạnh nút cam của Topbar trong cùng khung hình** — §7.2 từng cảnh báo `--color-status-warning-solid` gần với Fur Orange, cần xác nhận không đọc nhầm thành cùng một loại hành động.
6. Cột số follower (`1,2M`/`8,9K`/`0`/`12`) không nhảy chiều rộng — §7.3 yêu cầu tabular numbers.
7. Hai nút 42px không bị vỡ xuống 2 dòng trong 340px card (18px padding hai bên) — đây là rủi ro vỡ layout khả dĩ nhất của cả component, và chính là điều ghi chú UX-01 (§5.4) e ngại.

## Ngoài phạm vi

Không có data fetching/mutation thật (Sprint 3). Không validate URL (Rust, sub-project khác). Không xây `ui/Button.tsx` 5 biến thể. Không tô màu lại icon nền tảng bằng token accent. Không test ellipsis bằng jsdom (cần mắt nhìn — đã có ở mục 6).
