# Add/Edit Account Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modal wizard (5 bước: Platform → Identity → Login → Follower → Review) để tạo/sửa tài khoản, validate bằng React Hook Form + Zod. UI-only — `onSubmit` trả về dữ liệu đã validate, không mã hoá/lưu Supabase thật.

**Architecture:** Một `useForm` instance trải toàn bộ 5 bước (không tách form theo bước). `currentStep` là `useState` trong `AddEditAccountModal`. Next gọi `trigger()` theo đúng field của bước hiện tại; Back giữ nguyên dữ liệu (RHF mặc định `shouldUnregister: false`). Zod: 1 schema gốc + factory theo `mode` (`"add"` bắt buộc password, `"edit"` cho phép rỗng).

**Tech Stack:** React 19 + TypeScript, `react-hook-form` + `zod` + `@hookform/resolvers` (mới thêm), Vitest + Testing Library (đã có).

## Global Constraints

- Chỉ 3 platform theo `PLATFORMS` (`src/types/account.ts`) — không thêm platform nào khác.
- `test.globals` là `false` — mọi file test import tường minh `describe/it/expect/vi` từ `"vitest"`.
- Không test tên class Tailwind hay CSS layout — dùng `getByLabelText`/`getByRole`/`getByTestId`.
- Không mã hoá/lưu Supabase thật — `onSubmit(values)` chỉ gọi callback nhận `AccountFormValues` đã validate.
- Không validate allowlist domain của `avatarUrl`/`profileUrl` — chỉ kiểm định dạng URL bằng Zod. Chặn `javascript:`/`data:`/homograph domain là việc của Rust lúc mở tài khoản (§4.4, ngoài phạm vi).
- **Không `.trim()` trên `accountPassword`/`emailPassword`** — khoảng trắng có thể là một phần hợp lệ của mật khẩu thật.
- Platform bị khoá (`disabled`) khi `mode === "edit"`.
- Mode `"edit"`: `accountPassword` rỗng hợp lệ, nghĩa là "không đổi" — schema edit không bắt buộc field này.
- Toàn bộ chuỗi hiển thị tiếng Việt, gom vào `src/lib/strings.ts` namespace `accountForm`.
- Không xây `ui/Input.tsx`/`ui/Button.tsx` biến thể dùng chung toàn app — field viết trực tiếp trong từng step.
- Không upload file avatar — chỉ input URL text, tái dùng component `AccountAvatar` có sẵn để preview.

---

### Task 1: Cài dependency + `strings.accountForm` + `schema.ts`

**Files:**

- Modify: `package.json`, `pnpm-lock.yaml` (thêm `zod`, `react-hook-form`, `@hookform/resolvers`)
- Modify: `src/lib/strings.ts` (thêm namespace `accountForm`)
- Create: `src/components/account/add-edit-account/schema.ts`
- Create: `src/components/account/add-edit-account/schema.test.ts`

**Interfaces:**

- Consumes: `PLATFORMS` từ `src/types/account.ts`.
- Produces: `makeAccountSchema(mode)`, `STEP_IDS`, `STEP_FIELDS`, `EMPTY_ACCOUNT_FORM_VALUES`, type `AccountFormMode`, type `AccountFormInput` (giá trị thô trong form, dùng cho `register`/`watch`/`errors`), type `AccountFormValues` (giá trị đã parse, dùng cho `onSubmit`) — mọi task sau đều dùng các export này.

> **Vì sao 2 type thay vì 1** (khác với bản nháp trong spec thiết kế): `followerCount` dùng `z.preprocess` để chuyển chuỗi rỗng/chuỗi số thành `number | null`. Đã kiểm tra thật bằng `tsc`: nếu chỉ dùng một type `z.infer<...>` cho cả `useForm<T>` lẫn `onSubmit`, TypeScript báo lỗi `Type 'unknown' is not assignable to type 'number | null'` ngay tại `zodResolver(schema)` — vì input thô (trước preprocess) và output (sau preprocess) là hai kiểu khác nhau. Cách đúng đã xác minh chạy sạch bằng `tsc --noEmit` thật: `AccountFormInput = z.input<...>` cho form state, `AccountFormValues = z.output<...>` cho `onSubmit`. `useForm<AccountFormInput, unknown, AccountFormValues>(...)` là chữ ký chính xác.

- [ ] **Step 1: Cài 3 dependency**

```bash
pnpm add zod@^4 react-hook-form@^7 @hookform/resolvers@^5
```

Expected: `package.json`/`pnpm-lock.yaml` có 3 gói mới. Không cần `@types/*` riêng — cả 3 gói tự bundle type định nghĩa.

- [ ] **Step 2: Thêm namespace `accountForm` vào `src/lib/strings.ts`**

Thêm vào object `strings` hiện có (giữ nguyên `dashboard`, `account`, `clipboard`, `status` đã có):

```ts
  accountForm: {
    stepTitlePlatform: "Chọn nền tảng",
    stepTitleIdentity: "Thông tin tài khoản",
    stepTitleLogin: "Thông tin đăng nhập",
    stepTitleFollower: "Số người theo dõi",
    stepTitleReview: "Xem lại và lưu",
    continueButton: "Tiếp tục",
    backButton: "Quay lại",
    saveButton: "Lưu",
    cancelButton: "Huỷ",
    displayNameLabel: "Tên hiển thị",
    usernameLabel: "Tên người dùng",
    avatarUrlLabel: "URL ảnh đại diện",
    profileUrlLabel: "URL trang cá nhân",
    locationLabel: "Địa điểm",
    loginEmailLabel: "Email đăng nhập",
    accountPasswordLabel: "Mật khẩu tài khoản",
    recoveryEmailLabel: "Email khôi phục",
    emailPasswordLabel: "Mật khẩu email",
    twoFactorNoteLabel: "Ghi chú 2FA / mã khôi phục",
    followerCountLabel: "Số người theo dõi hiện tại",
    displayNameRequired: "Tên hiển thị là bắt buộc",
    invalidUrl: "URL không hợp lệ",
    invalidEmail: "Email không hợp lệ",
    passwordRequired: "Mật khẩu tài khoản là bắt buộc",
    invalidFollowerCount: "Số người theo dõi phải là số nguyên không âm",
    passwordUnchangedPlaceholder: "Để trống nếu không đổi",
    duplicateWarning:
      "Có thể trùng với một tài khoản đã có (cùng nền tảng và username/email).",
  },
```

- [ ] **Step 3: Viết test trước cho schema (chưa tồn tại — sẽ fail)**

Tạo `src/components/account/add-edit-account/schema.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { makeAccountSchema, STEP_FIELDS } from "./schema";

const validBase = {
  platform: "facebook" as const,
  displayName: "Nguyễn Văn A",
  username: "",
  avatarUrl: "",
  profileUrl: "",
  location: "",
  loginEmail: "a@b.com",
  accountPassword: "",
  recoveryEmail: "",
  emailPassword: "",
  twoFactorNote: "",
  followerCount: "",
};

describe("makeAccountSchema", () => {
  it("mode add requires a non-empty accountPassword", () => {
    const schema = makeAccountSchema("add");
    expect(schema.safeParse({ ...validBase, accountPassword: "" }).success).toBe(false);
    expect(schema.safeParse({ ...validBase, accountPassword: "hunter2" }).success).toBe(true);
  });

  it("mode edit allows an empty accountPassword (unchanged)", () => {
    const schema = makeAccountSchema("edit");
    expect(schema.safeParse({ ...validBase, accountPassword: "" }).success).toBe(true);
  });

  it("converts an empty followerCount to null", () => {
    const schema = makeAccountSchema("add");
    const result = schema.safeParse({ ...validBase, accountPassword: "x", followerCount: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.followerCount).toBeNull();
  });

  it("parses a numeric followerCount string into a number", () => {
    const schema = makeAccountSchema("add");
    const result = schema.safeParse({
      ...validBase,
      accountPassword: "x",
      followerCount: "1200",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.followerCount).toBe(1200);
  });

  it("rejects a negative followerCount", () => {
    const schema = makeAccountSchema("add");
    const result = schema.safeParse({ ...validBase, accountPassword: "x", followerCount: "-5" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid loginEmail", () => {
    const schema = makeAccountSchema("add");
    const result = schema.safeParse({
      ...validBase,
      accountPassword: "x",
      loginEmail: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid avatarUrl but allows an empty one", () => {
    const schema = makeAccountSchema("add");
    expect(
      schema.safeParse({ ...validBase, accountPassword: "x", avatarUrl: "not-a-url" }).success,
    ).toBe(false);
    expect(schema.safeParse({ ...validBase, accountPassword: "x", avatarUrl: "" }).success).toBe(
      true,
    );
  });

  it("does not trim accountPassword", () => {
    const schema = makeAccountSchema("add");
    const result = schema.safeParse({ ...validBase, accountPassword: "  hunter2  " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.accountPassword).toBe("  hunter2  ");
  });

  it("STEP_FIELDS covers every schema field exactly once across all steps", () => {
    const allFields = Object.values(STEP_FIELDS).flat();
    const schema = makeAccountSchema("add");
    const schemaKeys = Object.keys(schema.shape);
    expect(new Set(allFields)).toEqual(new Set(schemaKeys));
  });
});
```

- [ ] **Step 4: Chạy test để xác nhận fail**

Run: `pnpm test`
Expected: FAIL — `./schema` chưa tồn tại.

- [ ] **Step 5: Tạo `src/components/account/add-edit-account/schema.ts`**

```ts
import { z } from "zod";
import { PLATFORMS } from "../../../types/account";
import { strings } from "../../../lib/strings";

export const STEP_IDS = ["platform", "identity", "login", "follower", "review"] as const;
export type StepId = (typeof STEP_IDS)[number];

const baseAccountSchema = z.object({
  platform: z.enum(PLATFORMS),
  displayName: z.string().trim().min(1, strings.accountForm.displayNameRequired),
  username: z.string().trim().optional().or(z.literal("")),
  avatarUrl: z.string().trim().url(strings.accountForm.invalidUrl).optional().or(z.literal("")),
  profileUrl: z.string().trim().url(strings.accountForm.invalidUrl).optional().or(z.literal("")),
  location: z.string().trim().optional().or(z.literal("")),
  loginEmail: z.string().trim().email(strings.accountForm.invalidEmail),
  accountPassword: z.string(),
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
    z.number().int().min(0, strings.accountForm.invalidFollowerCount).nullable(),
  ),
});

export type AccountFormMode = "add" | "edit";

export function makeAccountSchema(mode: AccountFormMode) {
  return mode === "add"
    ? baseAccountSchema.extend({
        accountPassword: z.string().min(1, strings.accountForm.passwordRequired),
      })
    : baseAccountSchema;
}

/** Giá trị thô trong form — dùng cho `register`/`watch`/`errors` (RHF). */
export type AccountFormInput = z.input<ReturnType<typeof makeAccountSchema>>;
/** Giá trị đã parse — dùng cho `onSubmit` (sau khi qua preprocess/validate). */
export type AccountFormValues = z.output<ReturnType<typeof makeAccountSchema>>;

export const STEP_FIELDS: Record<StepId, readonly (keyof AccountFormInput)[]> = {
  platform: ["platform"],
  identity: ["displayName", "username", "avatarUrl", "profileUrl", "location"],
  login: ["loginEmail", "accountPassword", "recoveryEmail", "emailPassword", "twoFactorNote"],
  follower: ["followerCount"],
  review: [],
};

export const EMPTY_ACCOUNT_FORM_VALUES: AccountFormInput = {
  platform: "facebook",
  displayName: "",
  username: "",
  avatarUrl: "",
  profileUrl: "",
  location: "",
  loginEmail: "",
  accountPassword: "",
  recoveryEmail: "",
  emailPassword: "",
  twoFactorNote: "",
  followerCount: null,
};
```

- [ ] **Step 6: Chạy test để xác nhận pass**

Run: `pnpm test`
Expected: PASS — 9 test mới xanh.

- [ ] **Step 7: Chạy quality gate**

```bash
pnpm lint && pnpm format:check && pnpm typecheck && pnpm build
```

Expected: cả 4 lệnh exit 0.

- [ ] **Step 8: Commit**

```bash
git add package.json pnpm-lock.yaml src/lib/strings.ts src/components/account/add-edit-account/schema.ts src/components/account/add-edit-account/schema.test.ts
git commit -m "feat: schema Zod cho Add/Edit Account form, cài react-hook-form"
```

---

### Task 2: `findDuplicates`

**Files:**

- Create: `src/components/account/add-edit-account/findDuplicates.ts`
- Create: `src/components/account/add-edit-account/findDuplicates.test.ts`

**Interfaces:**

- Consumes: `AccountSummary` (`src/types/account.ts`), `AccountFormInput` (Task 1).
- Produces: `findDuplicates(values, existingAccounts): AccountSummary[]` — Task 5 (ReviewStep) dùng.

- [ ] **Step 1: Viết test trước (chưa tồn tại — sẽ fail)**

Tạo `src/components/account/add-edit-account/findDuplicates.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { findDuplicates } from "./findDuplicates";
import type { AccountSummary } from "../../../types/account";

const EXISTING: AccountSummary[] = [
  {
    id: "acc-1",
    platform: "facebook",
    status: "active",
    displayName: "Nguyễn Văn A",
    username: "@nguyenvana",
    loginEmail: "nguyenvana@gmail.com",
    avatarUrl: null,
    followerCount: 100,
    followerUpdatedAt: null,
  },
];

describe("findDuplicates", () => {
  it("finds a match on same platform + same username", () => {
    const result = findDuplicates(
      { platform: "facebook", username: "@nguyenvana", loginEmail: "" },
      EXISTING,
    );
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("acc-1");
  });

  it("finds a match on same platform + same loginEmail", () => {
    const result = findDuplicates(
      { platform: "facebook", username: "", loginEmail: "nguyenvana@gmail.com" },
      EXISTING,
    );
    expect(result).toHaveLength(1);
  });

  it("is case-insensitive and trims whitespace", () => {
    const result = findDuplicates(
      { platform: "facebook", username: "  @NGUYENVANA  ", loginEmail: "" },
      EXISTING,
    );
    expect(result).toHaveLength(1);
  });

  it("does not match a different platform with the same username", () => {
    const result = findDuplicates(
      { platform: "instagram", username: "@nguyenvana", loginEmail: "" },
      EXISTING,
    );
    expect(result).toHaveLength(0);
  });

  it("returns empty when both username and loginEmail are blank", () => {
    const result = findDuplicates({ platform: "facebook", username: "", loginEmail: "" }, EXISTING);
    expect(result).toHaveLength(0);
  });

  it("returns empty for an empty existingAccounts list", () => {
    const result = findDuplicates(
      { platform: "facebook", username: "@nguyenvana", loginEmail: "" },
      [],
    );
    expect(result).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `pnpm test`
Expected: FAIL — `./findDuplicates` chưa tồn tại.

- [ ] **Step 3: Tạo `src/components/account/add-edit-account/findDuplicates.ts`**

```ts
import type { AccountSummary } from "../../../types/account";
import type { AccountFormInput } from "./schema";

/** So sánh trong bộ nhớ với danh sách account đã có — không gọi backend.
 * Trùng khi cùng platform và (username khớp HOẶC loginEmail khớp), so
 * không phân biệt hoa/thường và bỏ qua khoảng trắng đầu/cuối. */
export function findDuplicates(
  values: Pick<AccountFormInput, "platform" | "username" | "loginEmail">,
  existingAccounts: AccountSummary[],
): AccountSummary[] {
  const normalize = (s: string | null | undefined) => (s ?? "").trim().toLowerCase();
  const username = normalize(values.username);
  const loginEmail = normalize(values.loginEmail);

  if (!username && !loginEmail) return [];

  return existingAccounts.filter((account) => {
    if (account.platform !== values.platform) return false;
    const sameUsername = username !== "" && normalize(account.username) === username;
    const sameEmail = loginEmail !== "" && normalize(account.loginEmail) === loginEmail;
    return sameUsername || sameEmail;
  });
}
```

- [ ] **Step 4: Chạy test để xác nhận pass**

Run: `pnpm test`
Expected: PASS — 6 test mới xanh.

- [ ] **Step 5: Chạy quality gate**

```bash
pnpm lint && pnpm format:check && pnpm typecheck && pnpm build
```

Expected: cả 4 lệnh exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/components/account/add-edit-account/findDuplicates.ts src/components/account/add-edit-account/findDuplicates.test.ts
git commit -m "feat: findDuplicates cho Add/Edit Account form"
```

---

### Task 3: `PlatformStep` + `FollowerStep`

**Files:**

- Create: `src/components/account/add-edit-account/steps/PlatformStep.tsx`
- Create: `src/components/account/add-edit-account/steps/PlatformStep.test.tsx`
- Create: `src/components/account/add-edit-account/steps/FollowerStep.tsx`
- Create: `src/components/account/add-edit-account/steps/FollowerStep.test.tsx`

**Interfaces:**

- Consumes: `PLATFORMS` (`types/account.ts`), `PLATFORM_LABEL` (`src/components/ui/icons/PlatformIcons.tsx`), `AccountFormInput`/`AccountFormMode` (Task 1). Phải render bên trong một `FormProvider` (dùng `useFormContext`).
- Produces: `PlatformStep({ mode })`, `FollowerStep()` — Task 6 (modal) ghép vào.

Cả hai step phải render bên trong một form context thật để test — helper dùng chung trong mỗi file test:

```tsx
function renderWithForm(ui: React.ReactElement, mode: AccountFormMode = "add") {
  function Wrapper() {
    const methods = useForm<AccountFormInput, unknown, AccountFormValues>({
      resolver: zodResolver(makeAccountSchema(mode)),
      defaultValues: EMPTY_ACCOUNT_FORM_VALUES,
    });
    return <FormProvider {...methods}>{ui}</FormProvider>;
  }
  return render(<Wrapper />);
}
```

- [ ] **Step 1: Viết test trước cho `PlatformStep` (chưa tồn tại — sẽ fail)**

Tạo `src/components/account/add-edit-account/steps/PlatformStep.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlatformStep } from "./PlatformStep";
import {
  EMPTY_ACCOUNT_FORM_VALUES,
  makeAccountSchema,
  type AccountFormInput,
  type AccountFormMode,
  type AccountFormValues,
} from "../schema";

function renderWithForm(mode: AccountFormMode = "add") {
  function Wrapper() {
    const methods = useForm<AccountFormInput, unknown, AccountFormValues>({
      resolver: zodResolver(makeAccountSchema(mode)),
      defaultValues: EMPTY_ACCOUNT_FORM_VALUES,
    });
    return (
      <FormProvider {...methods}>
        <PlatformStep mode={mode} />
      </FormProvider>
    );
  }
  return render(<Wrapper />);
}

describe("PlatformStep", () => {
  it("renders a radio for each of the 3 platforms", () => {
    renderWithForm();
    expect(screen.getByRole("radio", { name: "Facebook" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Instagram" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Gmail" })).toBeInTheDocument();
  });

  it("has Facebook selected by default", () => {
    renderWithForm();
    expect(screen.getByRole("radio", { name: "Facebook" })).toBeChecked();
  });

  it("disables all radios in edit mode", () => {
    renderWithForm("edit");
    expect(screen.getByRole("radio", { name: "Facebook" })).toBeDisabled();
    expect(screen.getByRole("radio", { name: "Instagram" })).toBeDisabled();
    expect(screen.getByRole("radio", { name: "Gmail" })).toBeDisabled();
  });

  it("leaves radios enabled in add mode", () => {
    renderWithForm("add");
    expect(screen.getByRole("radio", { name: "Facebook" })).not.toBeDisabled();
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `pnpm test`
Expected: FAIL — `./PlatformStep` chưa tồn tại.

- [ ] **Step 3: Tạo `src/components/account/add-edit-account/steps/PlatformStep.tsx`**

```tsx
import { useFormContext } from "react-hook-form";
import { PLATFORMS } from "../../../../types/account";
import { PLATFORM_LABEL } from "../../../ui/icons/PlatformIcons";
import { strings } from "../../../../lib/strings";
import type { AccountFormInput, AccountFormMode } from "../schema";

export interface PlatformStepProps {
  mode: AccountFormMode;
}

export function PlatformStep({ mode }: PlatformStepProps) {
  const { register } = useFormContext<AccountFormInput>();

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-sm font-semibold text-shield-navy">
        {strings.accountForm.stepTitlePlatform}
      </legend>
      <div className="flex gap-3">
        {PLATFORMS.map((platform) => (
          <label
            key={platform}
            className="flex flex-1 items-center gap-2 rounded-control border border-border-strong px-3 py-3 text-sm font-medium text-shield-navy has-disabled:cursor-not-allowed has-disabled:opacity-60"
          >
            <input
              type="radio"
              value={platform}
              disabled={mode === "edit"}
              className="focus-ring h-4 w-4 accent-fur-orange"
              {...register("platform")}
            />
            {PLATFORM_LABEL[platform]}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default PlatformStep;
```

`has-disabled:` là arbitrary variant `:has()` của Tailwind v4 — chỉ ảnh hưởng dáng vẻ khi disabled, không ảnh hưởng test (test kiểm `toBeDisabled()` trên chính `<input>`, không kiểm class).

- [ ] **Step 4: Chạy test để xác nhận pass**

Run: `pnpm test`
Expected: PASS — 4 test mới xanh.

- [ ] **Step 5: Viết test trước cho `FollowerStep` (chưa tồn tại — sẽ fail)**

Tạo `src/components/account/add-edit-account/steps/FollowerStep.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FollowerStep } from "./FollowerStep";
import {
  EMPTY_ACCOUNT_FORM_VALUES,
  makeAccountSchema,
  type AccountFormInput,
  type AccountFormValues,
} from "../schema";

function renderWithForm() {
  function Wrapper() {
    const methods = useForm<AccountFormInput, unknown, AccountFormValues>({
      resolver: zodResolver(makeAccountSchema("add")),
      defaultValues: EMPTY_ACCOUNT_FORM_VALUES,
    });
    return (
      <FormProvider {...methods}>
        <FollowerStep />
      </FormProvider>
    );
  }
  return render(<Wrapper />);
}

describe("FollowerStep", () => {
  it("renders a labeled number input, empty by default", () => {
    renderWithForm();
    const input = screen.getByLabelText("Số người theo dõi hiện tại");
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue(null);
  });

  it("accepts typed numeric input", () => {
    renderWithForm();
    const input = screen.getByLabelText("Số người theo dõi hiện tại");
    fireEvent.change(input, { target: { value: "1200" } });
    expect(input).toHaveValue(1200);
  });
});
```

- [ ] **Step 6: Chạy test để xác nhận fail**

Run: `pnpm test`
Expected: FAIL — `./FollowerStep` chưa tồn tại.

- [ ] **Step 7: Tạo `src/components/account/add-edit-account/steps/FollowerStep.tsx`**

```tsx
import { useFormContext } from "react-hook-form";
import { strings } from "../../../../lib/strings";
import type { AccountFormInput } from "../schema";

export function FollowerStep() {
  const {
    register,
    formState: { errors },
  } = useFormContext<AccountFormInput>();

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="followerCount" className="text-sm font-semibold text-shield-navy">
        {strings.accountForm.followerCountLabel}
      </label>
      <input
        id="followerCount"
        type="number"
        min={0}
        step={1}
        className="focus-ring h-10 rounded-control border border-border-strong bg-white px-3 text-sm"
        {...register("followerCount")}
      />
      {errors.followerCount && (
        <p className="text-sm text-danger">{errors.followerCount.message}</p>
      )}
    </div>
  );
}

export default FollowerStep;
```

- [ ] **Step 8: Chạy test để xác nhận pass**

Run: `pnpm test`
Expected: PASS — 2 test mới xanh.

- [ ] **Step 9: Chạy quality gate**

```bash
pnpm lint && pnpm format:check && pnpm typecheck && pnpm build
```

Expected: cả 4 lệnh exit 0.

- [ ] **Step 10: Commit**

```bash
git add src/components/account/add-edit-account/steps/PlatformStep.tsx src/components/account/add-edit-account/steps/PlatformStep.test.tsx src/components/account/add-edit-account/steps/FollowerStep.tsx src/components/account/add-edit-account/steps/FollowerStep.test.tsx
git commit -m "feat: PlatformStep + FollowerStep cho Add/Edit Account form"
```

---

### Task 4: `IdentityStep` + `LoginStep`

**Files:**

- Create: `src/components/account/add-edit-account/steps/IdentityStep.tsx`
- Create: `src/components/account/add-edit-account/steps/IdentityStep.test.tsx`
- Create: `src/components/account/add-edit-account/steps/LoginStep.tsx`
- Create: `src/components/account/add-edit-account/steps/LoginStep.test.tsx`

**Interfaces:**

- Consumes: `AccountAvatar` (`src/components/account/AccountAvatar.tsx`), `AccountFormInput`/`AccountFormMode` (Task 1).
- Produces: `IdentityStep()`, `LoginStep({ mode })` — Task 6 ghép vào.

- [ ] **Step 1: Viết test trước cho `IdentityStep` (chưa tồn tại — sẽ fail)**

Tạo `src/components/account/add-edit-account/steps/IdentityStep.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IdentityStep } from "./IdentityStep";
import {
  EMPTY_ACCOUNT_FORM_VALUES,
  makeAccountSchema,
  type AccountFormInput,
  type AccountFormValues,
} from "../schema";

function renderWithForm() {
  function Wrapper() {
    const methods = useForm<AccountFormInput, unknown, AccountFormValues>({
      resolver: zodResolver(makeAccountSchema("add")),
      defaultValues: EMPTY_ACCOUNT_FORM_VALUES,
    });
    return (
      <FormProvider {...methods}>
        <IdentityStep />
      </FormProvider>
    );
  }
  return render(<Wrapper />);
}

describe("IdentityStep", () => {
  it("renders all 5 labeled fields", () => {
    renderWithForm();
    expect(screen.getByLabelText("Tên hiển thị")).toBeInTheDocument();
    expect(screen.getByLabelText("Tên người dùng")).toBeInTheDocument();
    expect(screen.getByLabelText("URL ảnh đại diện")).toBeInTheDocument();
    expect(screen.getByLabelText("URL trang cá nhân")).toBeInTheDocument();
    expect(screen.getByLabelText("Địa điểm")).toBeInTheDocument();
  });

  it("shows initials in the avatar preview when displayName is typed and avatarUrl is empty", () => {
    renderWithForm();
    fireEvent.change(screen.getByLabelText("Tên hiển thị"), {
      target: { value: "Nguyễn Văn A" },
    });
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("updates the avatar preview image when a valid avatarUrl is typed", () => {
    renderWithForm();
    fireEvent.change(screen.getByLabelText("Tên hiển thị"), {
      target: { value: "Nguyễn Văn A" },
    });
    fireEvent.change(screen.getByLabelText("URL ảnh đại diện"), {
      target: { value: "https://example.com/a.png" },
    });
    expect(screen.getByRole("img", { name: "Nguyễn Văn A" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `pnpm test`
Expected: FAIL — `./IdentityStep` chưa tồn tại.

- [ ] **Step 3: Tạo `src/components/account/add-edit-account/steps/IdentityStep.tsx`**

```tsx
import { useFormContext, useWatch } from "react-hook-form";
import { AccountAvatar } from "../../AccountAvatar";
import { strings } from "../../../../lib/strings";
import type { AccountFormInput } from "../schema";

export function IdentityStep() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<AccountFormInput>();
  const avatarUrl = useWatch({ control, name: "avatarUrl" });
  const displayName = useWatch({ control, name: "displayName" });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <AccountAvatar avatarUrl={avatarUrl || null} displayName={displayName || "?"} size={64} />
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="avatarUrl" className="text-sm font-semibold text-shield-navy">
            {strings.accountForm.avatarUrlLabel}
          </label>
          <input
            id="avatarUrl"
            type="text"
            className="focus-ring h-10 rounded-control border border-border-strong bg-white px-3 text-sm"
            {...register("avatarUrl")}
          />
          {errors.avatarUrl && <p className="text-sm text-danger">{errors.avatarUrl.message}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="displayName" className="text-sm font-semibold text-shield-navy">
          {strings.accountForm.displayNameLabel}
        </label>
        <input
          id="displayName"
          type="text"
          className="focus-ring h-10 rounded-control border border-border-strong bg-white px-3 text-sm"
          {...register("displayName")}
        />
        {errors.displayName && <p className="text-sm text-danger">{errors.displayName.message}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="username" className="text-sm font-semibold text-shield-navy">
          {strings.accountForm.usernameLabel}
        </label>
        <input
          id="username"
          type="text"
          className="focus-ring h-10 rounded-control border border-border-strong bg-white px-3 text-sm"
          {...register("username")}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="profileUrl" className="text-sm font-semibold text-shield-navy">
          {strings.accountForm.profileUrlLabel}
        </label>
        <input
          id="profileUrl"
          type="text"
          className="focus-ring h-10 rounded-control border border-border-strong bg-white px-3 text-sm"
          {...register("profileUrl")}
        />
        {errors.profileUrl && <p className="text-sm text-danger">{errors.profileUrl.message}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="location" className="text-sm font-semibold text-shield-navy">
          {strings.accountForm.locationLabel}
        </label>
        <input
          id="location"
          type="text"
          className="focus-ring h-10 rounded-control border border-border-strong bg-white px-3 text-sm"
          {...register("location")}
        />
      </div>
    </div>
  );
}

export default IdentityStep;
```

- [ ] **Step 4: Chạy test để xác nhận pass**

Run: `pnpm test`
Expected: PASS — 3 test mới xanh.

- [ ] **Step 5: Viết test trước cho `LoginStep` (chưa tồn tại — sẽ fail)**

Tạo `src/components/account/add-edit-account/steps/LoginStep.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginStep } from "./LoginStep";
import {
  EMPTY_ACCOUNT_FORM_VALUES,
  makeAccountSchema,
  type AccountFormInput,
  type AccountFormMode,
  type AccountFormValues,
} from "../schema";

function renderWithForm(mode: AccountFormMode) {
  function Wrapper() {
    const methods = useForm<AccountFormInput, unknown, AccountFormValues>({
      resolver: zodResolver(makeAccountSchema(mode)),
      defaultValues: EMPTY_ACCOUNT_FORM_VALUES,
    });
    return (
      <FormProvider {...methods}>
        <LoginStep mode={mode} />
      </FormProvider>
    );
  }
  return render(<Wrapper />);
}

describe("LoginStep", () => {
  it("renders all 5 labeled fields", () => {
    renderWithForm("add");
    expect(screen.getByLabelText("Email đăng nhập")).toBeInTheDocument();
    expect(screen.getByLabelText("Mật khẩu tài khoản")).toBeInTheDocument();
    expect(screen.getByLabelText("Email khôi phục")).toBeInTheDocument();
    expect(screen.getByLabelText("Mật khẩu email")).toBeInTheDocument();
    expect(screen.getByLabelText("Ghi chú 2FA / mã khôi phục")).toBeInTheDocument();
  });

  it("password fields have no placeholder in add mode", () => {
    renderWithForm("add");
    expect(screen.getByLabelText("Mật khẩu tài khoản")).not.toHaveAttribute("placeholder");
  });

  it("password fields show the unchanged-placeholder in edit mode", () => {
    renderWithForm("edit");
    expect(screen.getByLabelText("Mật khẩu tài khoản")).toHaveAttribute(
      "placeholder",
      "Để trống nếu không đổi",
    );
  });

  it("uses type=password for the two password fields", () => {
    renderWithForm("add");
    expect(screen.getByLabelText("Mật khẩu tài khoản")).toHaveAttribute("type", "password");
    expect(screen.getByLabelText("Mật khẩu email")).toHaveAttribute("type", "password");
  });
});
```

- [ ] **Step 6: Chạy test để xác nhận fail**

Run: `pnpm test`
Expected: FAIL — `./LoginStep` chưa tồn tại.

- [ ] **Step 7: Tạo `src/components/account/add-edit-account/steps/LoginStep.tsx`**

```tsx
import { useFormContext } from "react-hook-form";
import { strings } from "../../../../lib/strings";
import type { AccountFormInput, AccountFormMode } from "../schema";

export interface LoginStepProps {
  mode: AccountFormMode;
}

export function LoginStep({ mode }: LoginStepProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<AccountFormInput>();
  const passwordPlaceholder =
    mode === "edit" ? strings.accountForm.passwordUnchangedPlaceholder : undefined;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="loginEmail" className="text-sm font-semibold text-shield-navy">
          {strings.accountForm.loginEmailLabel}
        </label>
        <input
          id="loginEmail"
          type="text"
          className="focus-ring h-10 rounded-control border border-border-strong bg-white px-3 text-sm"
          {...register("loginEmail")}
        />
        {errors.loginEmail && <p className="text-sm text-danger">{errors.loginEmail.message}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="accountPassword" className="text-sm font-semibold text-shield-navy">
          {strings.accountForm.accountPasswordLabel}
        </label>
        <input
          id="accountPassword"
          type="password"
          placeholder={passwordPlaceholder}
          className="focus-ring h-10 rounded-control border border-border-strong bg-white px-3 text-sm"
          {...register("accountPassword")}
        />
        {errors.accountPassword && (
          <p className="text-sm text-danger">{errors.accountPassword.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="recoveryEmail" className="text-sm font-semibold text-shield-navy">
          {strings.accountForm.recoveryEmailLabel}
        </label>
        <input
          id="recoveryEmail"
          type="text"
          className="focus-ring h-10 rounded-control border border-border-strong bg-white px-3 text-sm"
          {...register("recoveryEmail")}
        />
        {errors.recoveryEmail && (
          <p className="text-sm text-danger">{errors.recoveryEmail.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="emailPassword" className="text-sm font-semibold text-shield-navy">
          {strings.accountForm.emailPasswordLabel}
        </label>
        <input
          id="emailPassword"
          type="password"
          placeholder={passwordPlaceholder}
          className="focus-ring h-10 rounded-control border border-border-strong bg-white px-3 text-sm"
          {...register("emailPassword")}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="twoFactorNote" className="text-sm font-semibold text-shield-navy">
          {strings.accountForm.twoFactorNoteLabel}
        </label>
        <input
          id="twoFactorNote"
          type="text"
          placeholder={passwordPlaceholder}
          className="focus-ring h-10 rounded-control border border-border-strong bg-white px-3 text-sm"
          {...register("twoFactorNote")}
        />
      </div>
    </div>
  );
}

export default LoginStep;
```

- [ ] **Step 8: Chạy test để xác nhận pass**

Run: `pnpm test`
Expected: PASS — 4 test mới xanh.

- [ ] **Step 9: Chạy quality gate**

```bash
pnpm lint && pnpm format:check && pnpm typecheck && pnpm build
```

Expected: cả 4 lệnh exit 0.

- [ ] **Step 10: Commit**

```bash
git add src/components/account/add-edit-account/steps/IdentityStep.tsx src/components/account/add-edit-account/steps/IdentityStep.test.tsx src/components/account/add-edit-account/steps/LoginStep.tsx src/components/account/add-edit-account/steps/LoginStep.test.tsx
git commit -m "feat: IdentityStep + LoginStep cho Add/Edit Account form"
```

---

### Task 5: `ReviewStep`

**Files:**

- Create: `src/components/account/add-edit-account/steps/ReviewStep.tsx`
- Create: `src/components/account/add-edit-account/steps/ReviewStep.test.tsx`

**Interfaces:**

- Consumes: `AccountAvatar`, `PlatformBadge` (`src/components/ui/PlatformBadge.tsx`), `PLATFORM_LABEL`, `findDuplicates` (Task 2), `AccountSummary`, `AccountFormInput` (Task 1).
- Produces: `ReviewStep({ existingAccounts })` — Task 6 ghép vào.

- [ ] **Step 1: Viết test trước (chưa tồn tại — sẽ fail)**

Tạo `src/components/account/add-edit-account/steps/ReviewStep.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ReviewStep } from "./ReviewStep";
import {
  EMPTY_ACCOUNT_FORM_VALUES,
  makeAccountSchema,
  type AccountFormInput,
  type AccountFormValues,
} from "../schema";
import type { AccountSummary } from "../../../../types/account";

const EXISTING: AccountSummary[] = [
  {
    id: "acc-1",
    platform: "facebook",
    status: "active",
    displayName: "Nguyễn Văn A",
    username: "@nguyenvana",
    loginEmail: "nguyenvana@gmail.com",
    avatarUrl: null,
    followerCount: 100,
    followerUpdatedAt: null,
  },
];

function renderWithForm(defaultValues: AccountFormInput, existingAccounts: AccountSummary[] = []) {
  function Wrapper() {
    const methods = useForm<AccountFormInput, unknown, AccountFormValues>({
      resolver: zodResolver(makeAccountSchema("add")),
      defaultValues,
    });
    return (
      <FormProvider {...methods}>
        <ReviewStep existingAccounts={existingAccounts} />
      </FormProvider>
    );
  }
  return render(<Wrapper />);
}

describe("ReviewStep", () => {
  it("shows the display name and platform badge", () => {
    renderWithForm({
      ...EMPTY_ACCOUNT_FORM_VALUES,
      displayName: "Trần Thị B",
      platform: "instagram",
    });
    expect(screen.getByText("Trần Thị B")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Instagram" })).toBeInTheDocument();
  });

  it("shows no duplicate banner when nothing matches", () => {
    renderWithForm(
      { ...EMPTY_ACCOUNT_FORM_VALUES, displayName: "Trần Thị B", username: "@tranthib" },
      EXISTING,
    );
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("shows a duplicate banner when platform + username match an existing account", () => {
    renderWithForm(
      {
        ...EMPTY_ACCOUNT_FORM_VALUES,
        displayName: "Nguyễn Văn A (2)",
        platform: "facebook",
        username: "@nguyenvana",
      },
      EXISTING,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `pnpm test`
Expected: FAIL — `./ReviewStep` chưa tồn tại.

- [ ] **Step 3: Tạo `src/components/account/add-edit-account/steps/ReviewStep.tsx`**

```tsx
import { useFormContext, useWatch } from "react-hook-form";
import { AccountAvatar } from "../../AccountAvatar";
import { PlatformBadge } from "../../../ui/PlatformBadge";
import { PLATFORM_LABEL } from "../../../ui/icons/PlatformIcons";
import { strings } from "../../../../lib/strings";
import { findDuplicates } from "../findDuplicates";
import type { AccountSummary } from "../../../../types/account";
import type { AccountFormInput } from "../schema";

export interface ReviewStepProps {
  existingAccounts: AccountSummary[];
}

export function ReviewStep({ existingAccounts }: ReviewStepProps) {
  const { control } = useFormContext<AccountFormInput>();
  const values = useWatch({ control });
  const platform = values.platform ?? "facebook";
  const hasDuplicate =
    findDuplicates(
      { platform, username: values.username, loginEmail: values.loginEmail },
      existingAccounts,
    ).length > 0;

  return (
    <div className="flex flex-col gap-4">
      {hasDuplicate && (
        <div
          role="alert"
          className="rounded-control border border-status-warning-solid bg-status-warning-bg px-3 py-2 text-sm text-status-warning-text"
        >
          {strings.accountForm.duplicateWarning}
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <AccountAvatar
            avatarUrl={values.avatarUrl || null}
            displayName={values.displayName || "?"}
          />
          <div className="absolute -right-1 -bottom-1">
            <PlatformBadge platform={platform} />
          </div>
        </div>
        <div>
          <p className="text-base font-bold text-shield-navy">{values.displayName}</p>
          {values.username && <p className="text-sm text-shield-navy">{values.username}</p>}
          <p className="text-sm text-status-neutral-text">{PLATFORM_LABEL[platform]}</p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <dt className="text-status-neutral-text">{strings.accountForm.loginEmailLabel}</dt>
        <dd className="text-shield-navy">{values.loginEmail || "—"}</dd>
        <dt className="text-status-neutral-text">{strings.accountForm.profileUrlLabel}</dt>
        <dd className="text-shield-navy">{values.profileUrl || "—"}</dd>
        <dt className="text-status-neutral-text">{strings.accountForm.locationLabel}</dt>
        <dd className="text-shield-navy">{values.location || "—"}</dd>
        <dt className="text-status-neutral-text">{strings.accountForm.followerCountLabel}</dt>
        <dd className="text-shield-navy">{values.followerCount ?? "—"}</dd>
      </dl>
    </div>
  );
}

export default ReviewStep;
```

- [ ] **Step 4: Chạy test để xác nhận pass**

Run: `pnpm test`
Expected: PASS — 3 test mới xanh.

- [ ] **Step 5: Chạy quality gate**

```bash
pnpm lint && pnpm format:check && pnpm typecheck && pnpm build
```

Expected: cả 4 lệnh exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/components/account/add-edit-account/steps/ReviewStep.tsx src/components/account/add-edit-account/steps/ReviewStep.test.tsx
git commit -m "feat: ReviewStep (preview + cảnh báo trùng) cho Add/Edit Account form"
```

---

### Task 6: `AddEditAccountModal` (ghép toàn bộ wizard)

**Files:**

- Create: `src/components/account/add-edit-account/AddEditAccountModal.tsx`
- Create: `src/components/account/add-edit-account/AddEditAccountModal.test.tsx`

**Interfaces:**

- Consumes: mọi export của Task 1-5 (`schema.ts`, `findDuplicates.ts`, 5 step component).
- Produces: `AddEditAccountModal({ mode, existingAccounts, initialValues?, onSubmit, onClose })` — Task 7 (kiểm bằng mắt) dùng.

- [ ] **Step 1: Viết test trước (chưa tồn tại — sẽ fail)**

Tạo `src/components/account/add-edit-account/AddEditAccountModal.test.tsx`:

> **Quan trọng — vì sao mọi test đều `async`/dùng `findBy*`, không dùng `getBy*` ngay sau khi bấm "Tiếp tục"/"Lưu":** `handleNext` (gọi `trigger()`) và `handleSubmit` (RHF) đều trả về `Promise` thật — kể cả khi validation "luôn đúng" (ví dụ bước Platform có sẵn giá trị mặc định hợp lệ), `trigger()` vẫn resolve bất đồng bộ qua ít nhất 1 microtask. Đã tự kiểm chứng bằng một test scratch thật trong chính repo này: `fireEvent.click` rồi `expect` ngay lập tức (không `await`) trên một handler `async` **FAIL thật** (state chưa kịp cập nhật); đổi sang `await screen.findByText(...)` thì **PASS**. Quy tắc cho mọi test bấm "Tiếp tục"/"Lưu" trong file này: sau `fireEvent.click`, luôn `await screen.findBy...` (không `getBy...`) để đợi bước kế tiếp render, hoặc `await waitFor(() => expect(...))` cho các assertion không phải "phần tử xuất hiện" (như `toHaveFocus()`, `toHaveBeenCalled()`).

```tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AddEditAccountModal } from "./AddEditAccountModal";
import type { AccountSummary } from "../../../types/account";

const EXISTING: AccountSummary[] = [
  {
    id: "acc-1",
    platform: "facebook",
    status: "active",
    displayName: "Nguyễn Văn A",
    username: "@nguyenvana",
    loginEmail: "nguyenvana@gmail.com",
    avatarUrl: null,
    followerCount: 100,
    followerUpdatedAt: null,
  },
];

async function goToIdentityStep() {
  fireEvent.click(screen.getByRole("button", { name: "Tiếp tục" })); // Platform -> Identity
  await screen.findByLabelText("Tên hiển thị");
}

async function goToLoginStep() {
  await goToIdentityStep();
  fireEvent.change(screen.getByLabelText("Tên hiển thị"), {
    target: { value: "Trần Thị B" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Tiếp tục" })); // Identity -> Login
  await screen.findByLabelText("Email đăng nhập");
}

describe("AddEditAccountModal", () => {
  it("blocks Next on the Identity step when displayName is empty, and focuses it", async () => {
    render(
      <AddEditAccountModal mode="add" existingAccounts={[]} onSubmit={vi.fn()} onClose={vi.fn()} />,
    );
    await goToIdentityStep();
    fireEvent.click(screen.getByRole("button", { name: "Tiếp tục" })); // blocked here
    await waitFor(() => expect(screen.getByLabelText("Tên hiển thị")).toHaveFocus());
  });

  it("keeps entered data when navigating Back", async () => {
    render(
      <AddEditAccountModal mode="add" existingAccounts={[]} onSubmit={vi.fn()} onClose={vi.fn()} />,
    );
    await goToLoginStep();
    fireEvent.click(screen.getByRole("button", { name: "Quay lại" })); // Login -> Identity (sync, handleBack không gọi trigger())
    expect(await screen.findByLabelText("Tên hiển thị")).toHaveValue("Trần Thị B");
  });

  it("add mode blocks Save when accountPassword is empty", async () => {
    const onSubmit = vi.fn();
    render(
      <AddEditAccountModal
        mode="add"
        existingAccounts={[]}
        onSubmit={onSubmit}
        onClose={vi.fn()}
      />,
    );
    await goToLoginStep();
    fireEvent.change(screen.getByLabelText("Email đăng nhập"), {
      target: { value: "tranthib@gmail.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Tiếp tục" })); // Login -> Follower, blocked
    await waitFor(() => expect(screen.getByLabelText("Mật khẩu tài khoản")).toHaveFocus());
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("edit mode disables the Platform step and allows an empty accountPassword through to submit", async () => {
    const onSubmit = vi.fn();
    render(
      <AddEditAccountModal
        mode="edit"
        existingAccounts={[]}
        initialValues={{ displayName: "Nguyễn Văn A", loginEmail: "nguyenvana@gmail.com" }}
        onSubmit={onSubmit}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByRole("radio", { name: "Facebook" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Tiếp tục" })); // Platform -> Identity
    await screen.findByLabelText("Tên hiển thị");
    fireEvent.click(screen.getByRole("button", { name: "Tiếp tục" })); // Identity -> Login
    await screen.findByLabelText("Email đăng nhập");
    fireEvent.click(screen.getByRole("button", { name: "Tiếp tục" })); // Login -> Follower (password rỗng, hợp lệ ở edit mode)
    await screen.findByLabelText("Số người theo dõi hiện tại");
    fireEvent.click(screen.getByRole("button", { name: "Tiếp tục" })); // Follower -> Review
    const saveButton = await screen.findByRole("button", { name: "Lưu" });
    fireEvent.click(saveButton);
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0].accountPassword).toBe("");
  });

  it("shows the duplicate banner on Review when data matches an existing account", async () => {
    render(
      <AddEditAccountModal
        mode="add"
        existingAccounts={EXISTING}
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    await goToIdentityStep(); // Platform(facebook, mặc định) -> Identity
    fireEvent.change(screen.getByLabelText("Tên hiển thị"), {
      target: { value: "Nguyễn Văn A (2)" },
    });
    fireEvent.change(screen.getByLabelText("Tên người dùng"), {
      target: { value: "@nguyenvana" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Tiếp tục" })); // Identity -> Login
    await screen.findByLabelText("Email đăng nhập");
    fireEvent.change(screen.getByLabelText("Email đăng nhập"), {
      target: { value: "khac@gmail.com" },
    });
    fireEvent.change(screen.getByLabelText("Mật khẩu tài khoản"), {
      target: { value: "hunter2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Tiếp tục" })); // Login -> Follower
    await screen.findByLabelText("Số người theo dõi hiện tại");
    fireEvent.click(screen.getByRole("button", { name: "Tiếp tục" })); // Follower -> Review
    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });

  it("closing via Cancel does not call onSubmit", () => {
    const onSubmit = vi.fn();
    const onClose = vi.fn();
    render(
      <AddEditAccountModal
        mode="add"
        existingAccounts={[]}
        onSubmit={onSubmit}
        onClose={onClose}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Huỷ" })); // onClose gọi trực tiếp, không qua trigger() — sync thật
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `pnpm test`
Expected: FAIL — `./AddEditAccountModal` chưa tồn tại.

- [ ] **Step 3: Tạo `src/components/account/add-edit-account/AddEditAccountModal.tsx`**

```tsx
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  EMPTY_ACCOUNT_FORM_VALUES,
  makeAccountSchema,
  STEP_FIELDS,
  STEP_IDS,
  type AccountFormInput,
  type AccountFormMode,
  type AccountFormValues,
  type StepId,
} from "./schema";
import { PlatformStep } from "./steps/PlatformStep";
import { IdentityStep } from "./steps/IdentityStep";
import { LoginStep } from "./steps/LoginStep";
import { FollowerStep } from "./steps/FollowerStep";
import { ReviewStep } from "./steps/ReviewStep";
import { strings } from "../../../lib/strings";
import type { AccountSummary } from "../../../types/account";

export interface AddEditAccountModalProps {
  mode: AccountFormMode;
  existingAccounts: AccountSummary[];
  initialValues?: Partial<AccountFormInput>;
  onSubmit: (values: AccountFormValues) => void;
  onClose: () => void;
}

const STEP_TITLES: Record<StepId, string> = {
  platform: strings.accountForm.stepTitlePlatform,
  identity: strings.accountForm.stepTitleIdentity,
  login: strings.accountForm.stepTitleLogin,
  follower: strings.accountForm.stepTitleFollower,
  review: strings.accountForm.stepTitleReview,
};

export function AddEditAccountModal({
  mode,
  existingAccounts,
  initialValues,
  onSubmit,
  onClose,
}: AddEditAccountModalProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const stepId = STEP_IDS[stepIndex];

  const methods = useForm<AccountFormInput, unknown, AccountFormValues>({
    resolver: zodResolver(makeAccountSchema(mode)),
    defaultValues: { ...EMPTY_ACCOUNT_FORM_VALUES, ...initialValues },
    mode: "onBlur",
  });
  const {
    trigger,
    setFocus,
    handleSubmit,
    formState: { errors },
  } = methods;

  async function handleNext() {
    const fields = STEP_FIELDS[stepId];
    const valid = fields.length === 0 || (await trigger(fields));
    if (!valid) {
      const firstInvalid = fields.find((field) => errors[field]);
      if (firstInvalid) setFocus(firstInvalid);
      return;
    }
    setStepIndex((i) => Math.min(i + 1, STEP_IDS.length - 1));
  }

  function handleBack() {
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-form-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-shield-navy/40"
    >
      <div className="flex max-h-[90vh] w-[480px] flex-col rounded-modal bg-white p-6 shadow-elevation-2">
        <h2 id="account-form-title" className="mb-4 text-lg font-bold text-shield-navy">
          {STEP_TITLES[stepId]}
        </h2>

        <FormProvider {...methods}>
          <form
            className="flex flex-1 flex-col gap-4 overflow-y-auto"
            onSubmit={handleSubmit(onSubmit)}
          >
            {stepId === "platform" && <PlatformStep mode={mode} />}
            {stepId === "identity" && <IdentityStep />}
            {stepId === "login" && <LoginStep mode={mode} />}
            {stepId === "follower" && <FollowerStep />}
            {stepId === "review" && <ReviewStep existingAccounts={existingAccounts} />}

            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <button
                type="button"
                onClick={onClose}
                className="focus-ring rounded-control px-3 py-2 text-sm font-semibold text-shield-navy"
              >
                {strings.accountForm.cancelButton}
              </button>
              <div className="flex gap-2">
                {stepIndex > 0 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="focus-ring rounded-control border border-border-strong px-3 py-2 text-sm font-semibold text-shield-navy"
                  >
                    {strings.accountForm.backButton}
                  </button>
                )}
                {stepId === "review" ? (
                  <button
                    type="submit"
                    className="focus-ring rounded-control border border-fur-orange px-3 py-2 text-sm font-semibold text-fur-orange-text"
                  >
                    {strings.accountForm.saveButton}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="focus-ring rounded-control border border-fur-orange px-3 py-2 text-sm font-semibold text-fur-orange-text"
                  >
                    {strings.accountForm.continueButton}
                  </button>
                )}
              </div>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}

export default AddEditAccountModal;
```

- [ ] **Step 4: Chạy test để xác nhận pass**

Run: `pnpm test`
Expected: PASS — 6 test mới xanh.

- [ ] **Step 5: Chạy quality gate**

```bash
pnpm lint && pnpm format:check && pnpm typecheck && pnpm build
```

Expected: cả 4 lệnh exit 0. Tổng test toàn repo tại thời điểm này = 72 (đã có trước Task 1) + 9 (Task 1) + 6 (Task 2) + 6 (Task 3) + 7 (Task 4) + 3 (Task 5) + 6 (Task 6) = 109. **Đừng coi con số này là bắt buộc phải khớp tuyệt đối** — plan trước (AccountCard) từng tính sai tổng do đếm nhầm `it.each`; nếu số thực tế lệch nhỏ, hãy tự đếm lại số `it(` thực có trong các file `*.test.ts(x)` mới tạo và xác nhận không có test nào fail, thay vì cố ép khớp con số 109.

- [ ] **Step 6: Commit**

```bash
git add src/components/account/add-edit-account/AddEditAccountModal.tsx src/components/account/add-edit-account/AddEditAccountModal.test.tsx
git commit -m "feat: AddEditAccountModal — ghép wizard 5 bước"
```

---

### Task 7: Kiểm bằng mắt

**Files:**

- Modify: `src/pages/DashboardPage.tsx` (tạm thời, revert cuối task)

**Interfaces:**

- Consumes: `AddEditAccountModal` (Task 6), `MOCK_ACCOUNTS` (`src/components/account/mockAccounts.ts`, đã có từ AccountCard).
- Produces: không có gì tồn tại lâu dài — task này chỉ ghi lại quan sát trong report của chính nó.

Test tự động không trả lời được: wizard có thực sự dễ dùng bằng bàn phím không (Tab qua các field, Enter có vô tình submit sớm không), banner cảnh báo trùng có đủ nổi bật không, radio Platform có rõ ràng đang chọn cái nào không khi nhìn thật.

- [ ] **Step 1: Wire tạm vào `DashboardPage.tsx`**

Thay toàn bộ nội dung `src/pages/DashboardPage.tsx` bằng:

```tsx
import { useState } from "react";
import { AddEditAccountModal } from "../components/account/add-edit-account/AddEditAccountModal";
import { MOCK_ACCOUNTS } from "../components/account/mockAccounts";
import type { AccountFormValues } from "../components/account/add-edit-account/schema";

function DashboardPage() {
  const [open, setOpen] = useState<"add" | "edit" | null>(null);

  return (
    <div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setOpen("add")}
          className="rounded-control border border-fur-orange px-4 py-2 text-sm font-semibold text-fur-orange-text"
        >
          Mở form Thêm tài khoản
        </button>
        <button
          type="button"
          onClick={() => setOpen("edit")}
          className="rounded-control border border-border-strong px-4 py-2 text-sm font-semibold text-shield-navy"
        >
          Mở form Sửa tài khoản (Nguyễn Văn A)
        </button>
      </div>

      {open && (
        <AddEditAccountModal
          mode={open}
          existingAccounts={MOCK_ACCOUNTS}
          initialValues={
            open === "edit"
              ? {
                  platform: "facebook",
                  displayName: "Nguyễn Văn A",
                  username: "@nguyenvana",
                  loginEmail: "nguyenvana@gmail.com",
                }
              : undefined
          }
          onSubmit={(values) => {
            console.log("submit", values);
            setOpen(null);
          }}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  );
}

export default DashboardPage;
```

- [ ] **Step 2: Boot app, chụp màn hình — dùng đúng pattern DPI-aware đã dùng ở AccountCard**

```bash
nohup pnpm tauri dev > tauri-dev-visual-check.log 2>&1 &
```

Poll tới khi build xong:

```bash
until grep -qE "Finished|error\[|error:" tauri-dev-visual-check.log 2>/dev/null; do sleep 2; done
tail -10 tauri-dev-visual-check.log
tasklist //FI "IMAGENAME eq pawpass.exe"
```

Chụp màn hình bằng PowerShell — **bắt buộc gọi `SetProcessDPIAware()` trước `GetWindowRect`/`MoveWindow`/`CopyFromScreen`** (bài học từ AccountCard Task 6: máy chạy ở scale 125%, thiếu dòng này khiến toạ độ ảo và toạ độ vật lý lệch nhau, ảnh chụp bị cắt/lẫn cửa sổ khác mà trông giống lỗi CSS thật):

```powershell
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class DpiAwareCapture {
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
  public struct RECT { public int Left; public int Top; public int Right; public int Bottom; }
}
"@
[DpiAwareCapture]::SetProcessDPIAware() | Out-Null
Add-Type -AssemblyName System.Drawing
$proc = Get-Process -Name "pawpass" -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
if (-not $proc) { Write-Error "Không tìm thấy tiến trình pawpass.exe có cửa sổ"; exit 1 }
[DpiAwareCapture]::SetForegroundWindow($proc.MainWindowHandle) | Out-Null
Start-Sleep -Milliseconds 1000
$rect = New-Object DpiAwareCapture+RECT
[DpiAwareCapture]::GetWindowRect($proc.MainWindowHandle, [ref]$rect) | Out-Null
$width = $rect.Right - $rect.Left
$height = $rect.Bottom - $rect.Top
$bmp = New-Object System.Drawing.Bitmap $width, $height
$graphics = [System.Drawing.Graphics]::FromImage($bmp)
$graphics.CopyFromScreen($rect.Left, $rect.Top, 0, 0, $bmp.Size)
$bmp.Save("<SDD_WORKSPACE>\addedit-01-dashboard.png", [System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose()
$bmp.Dispose()
Write-Output "Saved: $width x $height"
```

(`<SDD_WORKSPACE>` = thư mục workspace SDD của kế hoạch này, in ra bởi `sdd-workspace` lúc bắt đầu — không lưu vào repo.)

Lặp lại, click "Mở form Thêm tài khoản" (dùng `SendKeys`/click toạ độ hoặc đơn giản mô tả trong report là đã tự bấm bằng chuột thật nếu cần), chụp:

- `addedit-02-platform-empty.png` — bước 1 vừa mở.
- `addedit-03-identity-error.png` — bấm Tiếp tục ở Identity mà chưa nhập gì (hiện lỗi "Tên hiển thị là bắt buộc").
- `addedit-04-review-duplicate.png` — điền trùng với `MOCK_ACCOUNTS` (vd platform Facebook, username `@nguyenvana` — trùng `acc-1`), đi tới Review, banner cảnh báo hiện.
- `addedit-05-edit-mode.png` — bấm "Mở form Sửa tài khoản", ở bước Platform.

- [ ] **Step 3: Đọc cả 5 ảnh, đánh giá cụ thể (viết vào report, không chỉ "trông ổn")**

1. Radio Platform đã chọn (Facebook mặc định) có rõ ràng đang được chọn không khi nhìn thật (không chỉ dựa vào việc test đã pass `toBeChecked()`)?
2. Lỗi "Tên hiển thị là bắt buộc" có hiện đúng màu `text-danger`, đọc được, không đè lên field khác?
3. Banner cảnh báo trùng ở Review có đủ nổi bật (màu nền `status-warning-bg`) để người dùng không lướt qua?
4. Ở Edit mode, 3 radio Platform có trông rõ ràng là "bị khoá, không bấm được" không (không chỉ đúng thuộc tính `disabled` mà còn _nhìn_ ra được)?
5. Modal có che đúng phần nội dung phía sau (overlay tối `bg-shield-navy/40`) không, hay bị lỗi z-index/layout?

- [ ] **Step 4: Dọn tiến trình và log**

```bash
taskkill //F //IM pawpass.exe
rm -f tauri-dev-visual-check.log
```

- [ ] **Step 5: Revert `DashboardPage.tsx`**

```bash
git checkout -- src/pages/DashboardPage.tsx
git status --short
```

Expected: `git status --short` trống. Không commit cho task này.

---

## Self-Review Notes

**Spec coverage:** cả 8 mục "Quyết định" trong spec đều có task tương ứng — phạm vi UI-only (Task 6-7 không mã hoá/lưu gì), RHF+Zod (Task 1), Zod schema 1-base-+ factory (Task 1), Edit mode khoá Platform + password rỗng (Task 3, 6), cảnh báo trùng (Task 2, 5), avatar URL input (Task 4), tách file (toàn bộ cấu trúc task), test (từng task riêng + tích hợp ở Task 6).

**Placeholder scan:** không TBD/TODO; mọi code block chạy được thật, đã verify bằng `tsc`/`node` trước khi đưa vào plan (không đoán API react-hook-form/zod từ trí nhớ).

**Type consistency:** `AccountFormInput`/`AccountFormValues`/`AccountFormMode`/`StepId`/`STEP_IDS`/`STEP_FIELDS`/`makeAccountSchema`/`EMPTY_ACCOUNT_FORM_VALUES` định nghĩa đúng một lần ở Task 1 (`schema.ts`), mọi task sau import lại y hệt tên — không đổi tên field giữa chừng. `findDuplicates` giữ đúng chữ ký `(values, existingAccounts) => AccountSummary[]` xuyên suốt Task 2, 5, 6.

**Correction quan trọng thứ hai (phát hiện khi verify thật, không có trong spec thiết kế):** test wizard (Task 6) ban đầu viết đồng bộ (`fireEvent.click` rồi assert ngay). Đã tự dựng một test scratch thật trong repo để kiểm chứng: `fireEvent.click` một nút gọi handler `async` (dù chỉ `await Promise.resolve()`), rồi `expect` ngay lập tức — **FAIL thật** vì state chưa kịp cập nhật; `await screen.findByText(...)` — **PASS**. `handleNext`/`handleSubmit` trong `AddEditAccountModal` đều `await trigger()`/là hàm RHF bất đồng bộ thật, nên mọi test bấm "Tiếp tục"/"Lưu" đã được viết lại dùng `await screen.findBy...`/`await waitFor(...)` thay vì `getBy...` đồng bộ (xem ghi chú trong Task 6 Step 1). `handleBack`/nút "Huỷ" không gọi `trigger()` nên vẫn đồng bộ thật, không cần `await`.

**Correction quan trọng so với spec thiết kế:** spec ban đầu dùng một type `AccountFormValues = z.infer<...>` duy nhất. Khi verify thật bằng `tsc --noEmit` (không đoán), phát hiện `followerCount` dùng `z.preprocess` khiến input/output khác kiểu — nếu chỉ dùng 1 type, `zodResolver()` không gán được vào `useForm<T>` (lỗi `Type 'unknown' is not assignable to type 'number | null'`). Đã sửa: tách `AccountFormInput` (`z.input`) và `AccountFormValues` (`z.output`), `useForm<AccountFormInput, unknown, AccountFormValues>(...)` — đã chạy `tsc` thật xác nhận sạch lỗi. Cũng đã verify: Zod hiện tại (v4.4.3) vẫn hỗ trợ cú pháp chained `.email(message)`/`.url(message)` với message dạng chuỗi (không bắt buộc đổi sang `z.email()`/object message như một số tài liệu v4 khác gợi ý), và `.extend()` thay thế đúng field trùng tên chứ không nhân đôi trong `.shape`.
