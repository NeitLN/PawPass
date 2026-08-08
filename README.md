# Turtly

**Trình quản lý tài khoản mạng xã hội cho Windows.** Facebook · Instagram · Google/Gmail.
Mascot **Tully**. *All your accounts, in one shell.*

Thay thế file Excel chứa 50–200 tài khoản bằng một app desktop: tìm nhanh, mở đúng trang bằng một nút, và **mật khẩu được mã hoá trên máy trước khi rời thiết bị**.

---

## Đọc gì trước

> **[`docs/SOURCE-OF-TRUTH.md`](docs/SOURCE-OF-TRUTH.md)** — đọc hết file này trước khi code.

Đó là tài liệu quyết định duy nhất: phạm vi, yêu cầu chức năng, thiết kế, kiến trúc, mô hình dữ liệu, bảo mật, kế hoạch, và tiêu chí nghiệm thu.

| File | Vai trò |
|---|---|
| [`docs/SOURCE-OF-TRUTH.md`](docs/SOURCE-OF-TRUTH.md) | **Tài liệu duy nhất.** Bắt đầu từ đây — tự chứa, không phụ thuộc file nào khác |
| [`docs/REVIEW-2026-08-08.md`](docs/REVIEW-2026-08-08.md) | Biên bản review 6 vai — tra khi muốn biết "tại sao lại chốt thế" (đọc ghi chú ở đầu file trước) |
| [`docs/brand-reference/`](docs/brand-reference/) | 22 ảnh tham chiếu thị giác. **Chưa phải asset production** — xem SOURCE-OF-TRUTH §9.3 |

Không còn `DECISIONS.md`/`BRAND.md`/`UI.md` — nội dung còn hiệu lực đã nằm trong `SOURCE-OF-TRUTH.md`, dựa trực tiếp trên `Turtly_Master_Roadmap_Design_Specification.md` gốc.

---

## Trạng thái

**Sprint 0 — chưa bắt đầu.** Repo mới, chưa có code.

Một roadmap 8 tuần duy nhất (không tách bản phát hành) — Supabase và đồng bộ đa máy là **P0 ngay từ Sprint 3**, Meta OAuth ở Sprint 4–5. Xem [`docs/SOURCE-OF-TRUTH.md` §14](docs/SOURCE-OF-TRUTH.md#14-roadmap-8-tuần).

## Việc tiếp theo

Xem [`docs/SOURCE-OF-TRUTH.md` §20](docs/SOURCE-OF-TRUTH.md#20-bắt-đầu-từ-đâu).

1. Cài **Rust**
2. Scaffold Tauri 2 + React + TS + Vite + Tailwind, pnpm workspace
3. Sinh **khoá updater** — cửa một chiều, xem §10.3
4. **Spike Meta 1 ngày** (§3.2) → `docs/adr/ADR-003-meta-feasibility.md`
5. Vẽ lại **asset SVG** (§9.3) — hạng mục riêng 1–2 ngày

## Stack

Tauri 2 · React · TypeScript · Vite · Tailwind CSS + Radix/shadcn · TanStack Query + Zustand · React Hook Form + Zod · Supabase (Auth/Postgres/Realtime/Edge/Cron) · Argon2id + XChaCha20-Poly1305 trong Rust *(không dùng Tauri Stronghold — xem §10.1)*

## Nguyên tắc không thương lượng

- Không lưu mật khẩu plaintext ở bất kỳ đâu: DB, log, crash report, file cấu hình.
- Không scraping, không cookie harvesting, không tự động đăng nhập.
- Follower lỗi **≠ 0** — giữ giá trị cũ kèm badge lỗi.
- Không hardcode màu. Thiếu giá trị → thêm vào `tokens.css` trước, dùng sau.
