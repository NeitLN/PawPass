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
| [`docs/SOURCE-OF-TRUTH.md`](docs/SOURCE-OF-TRUTH.md) | **Tài liệu triển khai.** Bắt đầu từ đây |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | Nhật ký quyết định QĐ-01…QĐ-20, kèm lý do |
| [`docs/REVIEW-2026-08-08.md`](docs/REVIEW-2026-08-08.md) | Biên bản review 6 vai — tra khi muốn biết "tại sao lại chốt thế" |
| [`docs/BRAND.md`](docs/BRAND.md) | Nhận diện: màu, font, mascot |
| [`docs/UI.md`](docs/UI.md) | Bố cục, spacing, component |
| [`docs/brand-reference/`](docs/brand-reference/) | 22 ảnh tham chiếu thị giác. **Chưa phải asset production** — xem SOURCE-OF-TRUTH §8.8 |

**Thứ tự ưu tiên khi tài liệu mâu thuẫn:**

```
SOURCE-OF-TRUTH.md → DECISIONS.md → BRAND.md (màu/font/mascot) → UI.md (bố cục/component)
```

---

## Trạng thái

**Sprint 0 — chưa bắt đầu.** Repo mới, chưa có code.

Ba bản phát hành *(QĐ-01)*:

| Bản | Nội dung |
|---|---|
| **v1.0** | Local-only: UI, CRUD, vault mã hoá, tìm kiếm, mở tài khoản, CSV import, recovery key |
| **v1.1** | Supabase: Auth, RLS, Realtime, đồng bộ đa máy |
| **v1.2** | Meta OAuth, follower sync tự động |

Schema và tầng repository **cloud-ready từ ngày đầu** — lên v1.1 chỉ thay implementation của `AccountRepository`, không sửa UI.

## Việc tiếp theo

Xem [`docs/SOURCE-OF-TRUTH.md` §19](docs/SOURCE-OF-TRUTH.md#19-bắt-đầu-từ-đâu).

1. Cài **Rust** — cổng chặn của QĐ-11
2. Scaffold Tauri 2 + React 19 + TS + Vite 7 + Tailwind v4
3. Sinh **khoá updater** *(QĐ-19 — cửa một chiều)*
4. **Spike Meta 1 ngày** *(QĐ-20)* → `docs/adr/ADR-003-meta-feasibility.md`
5. Vẽ lại **asset SVG** (§8.8) — hạng mục riêng 1–2 ngày

## Stack

Tauri 2 · React 19 · TypeScript · Vite 7 · Tailwind v4 *(token trong `@theme`, **không có `tailwind.config.ts`** — QĐ-12)* · SQLite (v1.0) · Supabase (v1.1+) · Argon2id + XChaCha20-Poly1305 *(QĐ-16)*

## Nguyên tắc không thương lượng

- Không lưu mật khẩu plaintext ở bất kỳ đâu: DB, log, crash report, file cấu hình.
- Không scraping, không cookie harvesting, không tự động đăng nhập.
- Follower lỗi **≠ 0** — giữ giá trị cũ kèm badge lỗi.
- Không hardcode màu. Thiếu giá trị → thêm vào `tokens.css` trước, dùng sau.
