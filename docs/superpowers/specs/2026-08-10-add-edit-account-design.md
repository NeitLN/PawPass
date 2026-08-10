# Sprint 1 / Sub-project 5: Add/Edit Account form

- Status: Approved
- Date: 2026-08-10
- Phạm vi: modal wizard 5 bước tạo/sửa tài khoản (Platform → Identity → Login → Follower → Review), validate bằng React Hook Form + Zod. **Chỉ UI + validation** — `onSubmit(values)` gọi callback nhận dữ liệu đã validate, không tự mã hoá/lưu Supabase (vault/crypto layer chưa tồn tại, sẽ là sub-project riêng sau này).
- Tư vấn kỹ thuật: Opus 5 — xác nhận React Hook Form + Zod đã là quyết định có sẵn trong SOURCE-OF-TRUTH §10.1 (không phải lựa chọn mới), đề xuất cấu trúc schema/state/file.

## Bối cảnh

Sprint 1 sub-project 5 trong chuỗi 6 mảnh (tokens ✅, App shell ✅, MochiIllustration ✅, AccountCard ✅, **Add/Edit form**, Detail page). SOURCE-OF-TRUTH §4.3 mô tả luồng đầy đủ gồm cả bước nhập secrets (mật khẩu tài khoản, mật khẩu email, 2FA) cần mã hoá bằng DEK trước khi lưu — nhưng project hiện chưa có bất kỳ code vault/crypto/Supabase-persistence nào (đã kiểm tra `src/`, `src-tauri/src/`). Quyết định đầu tiên của brainstorm này là giới hạn scope lại UI-only, nhất quán với cách AccountCard đã làm (mock data, không backend thật).

## Quyết định

### 1. Phạm vi: UI + Zod validation, không crypto/persistence

`AddEditAccountModal` nhận `onSubmit: (values: AccountFormValues) => void` và `existingAccounts: AccountSummary[]` qua props. Component cha (chưa xây ở sub-project này) sẽ chịu trách nhiệm mã hoá secrets và gọi Supabase khi sprint vault/crypto hoàn thành. Việc này giữ modal test được đầy đủ bằng mock data, không bị chặn bởi hạ tầng chưa tồn tại.

**Vault-lock check (§4.2, UX-06) không xây thật ở đây** — nút "Add account" nhận `disabled?: boolean` (mặc định `false`) làm chỗ móc nối cho sprint vault sau, không có logic unlock/tooltip thật.

### 2. Cấu trúc form: React Hook Form + Zod (đã chốt sẵn ở §10.1, không phải lựa chọn mới)

Một `useForm` instance trải dài cả 5 bước — Review cần thấy toàn bộ field cùng lúc để preview + kiểm trùng, và Back phải giữ nguyên dữ liệu đã nhập ở bước trước. `shouldUnregister: false` (mặc định của RHF) đảm bảo unmount một bước không làm rớt giá trị đã nhập.

`currentStep` là `useState<number>` riêng trong `AddEditAccountModal` — vị trí UI, không phải dữ liệu form, không thuộc RHF state.

Next ở mỗi bước gọi `await trigger(STEP_FIELDS[step])` — chỉ validate đúng field của bước đó. Field lỗi đầu tiên nhận focus qua `setFocus()` (đáp ứng AT-11 — luồng bàn phím, §7.6).

```ts
// schema.ts
export const STEP_FIELDS = {
  platform: ["platform"],
  identity: ["displayName", "username", "avatarUrl", "profileUrl", "location"],
  login: ["loginEmail", "accountPassword", "recoveryEmail", "emailPassword", "twoFactorNote"],
  follower: ["followerCount"],
  review: [],
} as const satisfies Record<string, readonly (keyof AccountFormValues)[]>;
```

### 3. Zod schema: 1 base object + factory theo mode, không 5 schema riêng

Một `ZodObject` gốc duy nhất (không `.refine()` ở gốc — sẽ trả về `ZodEffects`, phá `.pick()`/`.extend()` sau này):

```ts
const baseAccountSchema = z.object({
  platform: z.enum(PLATFORMS),
  displayName: z.string().trim().min(1, strings.accountForm.displayNameRequired),
  username: z.string().trim().optional().or(z.literal("")),
  avatarUrl: z.string().trim().url(strings.accountForm.invalidUrl).optional().or(z.literal("")),
  profileUrl: z.string().trim().url(strings.accountForm.invalidUrl).optional().or(z.literal("")),
  location: z.string().trim().optional().or(z.literal("")),
  loginEmail: z.string().trim().email(strings.accountForm.invalidEmail),
  accountPassword: z.string(), // required/optional khác nhau theo mode — xem factory dưới
  recoveryEmail: z
    .string()
    .trim()
    .email(strings.accountForm.invalidEmail)
    .optional()
    .or(z.literal("")),
  emailPassword: z.string().optional().or(z.literal("")),
  twoFactorNote: z.string().trim().optional().or(z.literal("")),
  followerCount: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number().int().min(0).nullable(),
  ),
});

export function makeAccountSchema(mode: "add" | "edit") {
  return mode === "add"
    ? baseAccountSchema.extend({
        accountPassword: z.string().min(1, strings.accountForm.passwordRequired),
      })
    : baseAccountSchema; // edit: accountPassword rỗng hợp lệ = "không đổi"
}

export type AccountFormValues = z.infer<ReturnType<typeof makeAccountSchema>>;
```

Cả hai biến thể suy ra cùng một type `AccountFormValues` (`accountPassword` luôn là `string`, không `string | undefined`) — `onSubmit` không phải rẽ nhánh theo mode.

**Không `.trim()` trên `accountPassword`/`emailPassword`** (khác với mọi field text khác trong schema) — khoảng trắng đầu/cuối có thể là một phần hợp lệ của mật khẩu thật (AT-01 đã kiểm "password chứa khoảng trắng/ký tự Unicode" ở tầng lưu trữ); tự động cắt bớt ở đây sẽ âm thầm đổi giá trị người dùng định lưu.

**Không validate domain/allowlist của `profileUrl`/`avatarUrl` ở đây** — chỉ kiểm định dạng URL hợp lệ bằng Zod. Việc chặn `javascript:`/`data:`/homograph domain là trách nhiệm của Rust khi _mở_ tài khoản (§4.4, AT-08), không phải lúc nhập liệu.

### 4. Edit mode: khoá Platform, mật khẩu rỗng = không đổi

- Bước Platform hiển thị nhưng `disabled` khi `mode === "edit"` — platform gắn với icon/URL mở tài khoản, đổi sau khi tạo là hành vi lạ.
- `accountPassword`/`emailPassword`/`twoFactorNote` prefill rỗng (không hiển thị lại giá trị cũ — form này không có quyền giải mã), kèm placeholder "Để trống nếu không đổi".
- Schema edit không bắt buộc các field mật khẩu (mục 3) — submit với các field này rỗng hợp lệ, hiểu là "giữ nguyên giá trị đã lưu".

### 5. Cảnh báo trùng (Review, bước 5)

Hàm thuần `findDuplicates(values, existingAccounts)` — so `platform` + (`username` hoặc `loginEmail`, không rỗng) trùng khớp với `existingAccounts`. Trùng → banner cảnh báo ở đầu bước Review, **không chặn submit** (người dùng tự quyết, ví dụ tài khoản phụ dùng chung username). Đặt trong file riêng `findDuplicates.ts` để unit-test như hàm thuần (giống `format.test.ts`), không cần render component.

### 6. Avatar: ô nhập URL, tái dùng `AccountAvatar`

Không có upload file (chưa có Supabase Storage). Bước Identity có input text cho `avatarUrl`, preview trực tiếp bằng component `AccountAvatar` đã có (đọc giá trị qua `useWatch` thay vì state riêng — RHF không re-render toàn form khi field khác đổi). Fallback chữ cái đại diện hoạt động sẵn nếu để trống hoặc URL lỗi tải — không cần logic mới.

### 7. Tách file

```
src/components/account/add-edit-account/
  AddEditAccountModal.tsx    # dialog shell, focus trap, FormProvider, điều hướng bước, aria-live vùng lỗi
  AddEditAccountModal.test.tsx
  schema.ts                  # makeAccountSchema, STEP_FIELDS, type AccountFormValues
  schema.test.ts
  findDuplicates.ts
  findDuplicates.test.ts
  steps/
    PlatformStep.tsx  + .test.tsx
    IdentityStep.tsx  + .test.tsx
    LoginStep.tsx     + .test.tsx
    FollowerStep.tsx  + .test.tsx
    ReviewStep.tsx    + .test.tsx
```

Theo đúng tiền lệ `src/components/ui/icons/PlatformIcons.tsx` — tách subfolder khi một feature phát sinh nhiều file phụ trợ. Không có barrel file (`index.ts`) — import trực tiếp theo đường dẫn, đúng pattern hiện tại của repo. Mỗi step consume context qua `useFormContext()`, không nhận props form rời rạc.

Chuỗi tiếng Việt gom vào namespace mới `strings.accountForm.*` trong `src/lib/strings.ts` hiện có (nhãn nút Tiếp tục/Quay lại/Lưu/Huỷ, tiêu đề từng bước, thông báo lỗi validation, placeholder mật khẩu ở Edit mode, text banner trùng).

### 8. Test

Theo đúng nguyên tắc đã lập ở AccountCard: `getByLabelText`/`getByRole`/`userEvent`, không assert class Tailwind, không test CSS layout.

- **`schema.test.ts`**: mode add bắt buộc password, mode edit cho phép rỗng; `followerCount` "" → `null`; URL sai định dạng bị chặn; email sai định dạng bị chặn.
- **`findDuplicates.test.ts`**: trùng platform+username → cảnh báo; trùng platform+loginEmail → cảnh báo; khác platform cùng username → không cảnh báo; danh sách rỗng → không cảnh báo.
- **Từng Step**: render đúng field, đúng nhãn tiếng Việt, đúng required/optional.
- **`AddEditAccountModal.test.tsx`** (tích hợp toàn wizard):
  1. Next bị chặn khi bước hiện tại có field invalid; field lỗi đầu tiên nhận focus.
  2. Back giữ nguyên giá trị đã nhập ở bước trước (không mất dữ liệu khi quay lại).
  3. Add mode: `accountPassword` rỗng chặn submit ở Review.
  4. Edit mode: bước Platform disabled; `accountPassword` rỗng **không** chặn submit.
  5. `onSubmit` nhận đúng object `AccountFormValues`, gọi đúng 1 lần.
  6. Banner cảnh báo trùng hiện đúng lúc dữ liệu trùng `existingAccounts`.
  7. Đóng modal (Huỷ/Esc) không gọi `onSubmit`.

## Ngoài phạm vi

Không mã hoá/lưu Supabase thật (sprint vault/crypto riêng). Không validate allowlist URL theo platform (Rust, §4.4). Không vault-lock logic thật (chỉ chừa prop `disabled`). Không upload file avatar (chỉ URL text). Không xây `ui/Input.tsx`/`ui/Button.tsx` biến thể dùng chung toàn app — field trong form này viết trực tiếp, đủ dùng cho phạm vi 1 wizard.
