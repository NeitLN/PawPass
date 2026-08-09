# PawPass

**Trình quản lý tài khoản mạng xã hội cho Windows.** Facebook · Instagram · Google/Gmail.
Mascot **Mochi**. *One Paw, Endless Access.*

Thay thế file Excel chứa 50–200 tài khoản bằng một app desktop: tìm nhanh, mở đúng trang bằng một nút, và **mật khẩu được mã hoá trên máy trước khi rời thiết bị**.

---

## Đọc gì trước

> **[`docs/SOURCE-OF-TRUTH.md`](docs/SOURCE-OF-TRUTH.md)** — đọc hết file này trước khi code.

Đó là tài liệu quyết định duy nhất: phạm vi, yêu cầu chức năng, thiết kế, kiến trúc, mô hình dữ liệu, bảo mật, kế hoạch, và tiêu chí nghiệm thu.

| File | Vai trò |
|---|---|
| [`docs/SOURCE-OF-TRUTH.md`](docs/SOURCE-OF-TRUTH.md) | **Tài liệu duy nhất.** Bắt đầu từ đây — tự chứa, không phụ thuộc file nào khác |
| [`docs/REVIEW-2026-08-08.md`](docs/REVIEW-2026-08-08.md) | Biên bản review 6 vai — tra khi muốn biết "tại sao lại chốt thế" (đọc ghi chú ở đầu file trước) |
| [`docs/brand-reference/`](docs/brand-reference/) | Logo, wordmark, app icon và 7 tư thế Mochi (`pawpass-shiba-genz-cute-pack/`) — **6/8 trạng thái đã có**. Xem SOURCE-OF-TRUTH §8.3 |

Không còn `DECISIONS.md`/`BRAND.md`/`UI.md` — nội dung còn hiệu lực đã nằm trong `SOURCE-OF-TRUTH.md`, dựa trực tiếp trên `Turtly_Master_Roadmap_Design_Specification.md` gốc.

---

## Trạng thái

**Sprint 0 — chưa bắt đầu.** Repo mới, chưa có code. Rust đã cài, Supabase project đã tạo (09/08/2026).

Một roadmap **6 tuần** duy nhất (không tách bản phát hành) — Supabase và đồng bộ đa máy là **P0 ngay từ Sprint 3**. **Không có Meta OAuth/follower tự động** — đã bỏ khỏi scope 09/08/2026, follower chỉ nhập tay. Xem [`docs/SOURCE-OF-TRUTH.md` §12](docs/SOURCE-OF-TRUTH.md#12-roadmap-6-tuần).

## Việc tiếp theo

Xem [`docs/SOURCE-OF-TRUTH.md` §18](docs/SOURCE-OF-TRUTH.md#18-bắt-đầu-từ-đâu).

1. ~~Cài Rust~~ ✅
2. ~~Tạo Supabase project~~ ✅
3. ~~Đổi brand sang PawPass/Mochi~~ ✅ (09/08/2026)
4. ~~Lấp 12 khoảng trống chặn Sprint 1–3~~ ✅ (SOURCE-OF-TRUTH v4.1)
5. Scaffold Tauri 2 + React + TS + Vite + Tailwind, pnpm workspace
6. Sinh **khoá updater** — cửa một chiều, xem §9.3
7. Sinh nốt **2 tư thế Mochi còn thiếu** (Sync, Offline) + wordmark dạng font thật (§8.3) — hạng mục riêng, không chặn Sprint 1

## Stack

Tauri 2 · React · TypeScript · Vite · Tailwind CSS + Radix/shadcn · TanStack Query + Zustand · React Hook Form + Zod · Supabase (Auth/Postgres/Realtime — không có Edge Functions/Cron, không cần) · Argon2id + XChaCha20-Poly1305 trong Rust *(không dùng Tauri Stronghold — xem §9.1)*

## Nguyên tắc không thương lượng

- Không lưu mật khẩu plaintext ở bất kỳ đâu: DB, log, crash report, file cấu hình.
- Không scraping, không cookie harvesting, không tự động đăng nhập.
- Follower **luôn nhập tay** — không có đồng bộ tự động qua API nào.
- Không hardcode màu. Thiếu giá trị → thêm vào `tokens.css` trước, **đo tương phản WCAG AA**, ghi vào SOURCE-OF-TRUTH §7.2, rồi mới dùng.
- Không `DELETE` cứng bản ghi `accounts` — xoá vĩnh viễn là tombstone (§11.7). Xoá cứng làm máy khác không bao giờ biết.
