# ADR-002: Argon2id + XChaCha20-Poly1305 tự triển khai, thay vì Tauri Stronghold

- Status: Accepted
- Date: 2026-08-09
- Nguồn quyết định: `docs/SOURCE-OF-TRUTH.md` §9.1 ARCH-02, §11.2

## Context

Tài liệu Master Roadmap gốc (v1.0, 08/08/2026) chỉ định hai cơ chế khác
nhau cho cùng một việc — mã hoá secrets cục bộ — mà không nhận ra chúng
mâu thuẫn: §10.1 của tài liệu đó nói dùng **Tauri Stronghold** (plugin
official, lưu snapshot file mã hoá cục bộ), còn §12.2 của chính tài liệu
đó mô tả đầy đủ một sơ đồ khác: DEK 32 byte ngẫu nhiên → Argon2id sinh KEK
từ master password → KEK bọc DEK → mỗi secret payload có nonce riêng +
XChaCha20-Poly1305.

Đây không phải một lựa chọn giữa hai phương án tương đương — chỉ một
trong hai tương thích với yêu cầu đồng bộ đa thiết bị đã chốt ở
SOURCE-OF-TRUTH §1 (Supabase Auth/Postgres/Realtime từ ngày đầu, không
tách pha).

## Decision

Bỏ Stronghold. Tự triển khai bằng các crate Rust `argon2` + `chacha20poly1305`
+ `zeroize` + `rand`, đúng theo sơ đồ đã mô tả ở §12.2 gốc (nay là
SOURCE-OF-TRUTH §11.2).

Lý do quyết định:

1. **Stronghold không đồng bộ được giữa các máy.** Stronghold lưu một
   snapshot file cục bộ, mã hoá bằng khoá riêng của máy đó. Máy B không
   có cách nào mở được snapshot của máy A. Sơ đồ DEK/KEK ở §12.2 thì có:
   `wrapped_dek_by_master` là một giá trị nhỏ, đồng bộ được qua cột
   Postgres bình thường (`user_keyrings.wrapped_dek_by_master`) — bất kỳ
   máy nào biết master password đều giải mã ra cùng một DEK.
2. **PawPass cần đúng một DEK dùng chung, không phải một kho khoá cục bộ
   mỗi máy.** Đây là yêu cầu kiến trúc, không phải sở thích: FR-08 (đồng
   bộ đa máy) và AT-03/AT-14 (SOURCE-OF-TRUTH §15.2) đòi hỏi máy B mở
   được đúng những secrets mà máy A vừa tạo, ngay sau khi đồng bộ xong.
3. **Kiểm soát trực tiếp tham số KDF.** Tự dùng crate `argon2` cho phép
   version-hoá tham số (`m=64 MiB, t=3, p=1` — SOURCE-OF-TRUTH §11.2) và
   tăng dần theo thời gian mà không phụ thuộc vào lộ trình phát triển của
   plugin Stronghold.
4. **Ít bề mặt tấn công hơn cho nhu cầu thực tế.** PawPass không cần toàn
   bộ tính năng của Stronghold (nhiều vault, actor model, snapshot
   versioning) — chỉ cần đúng một thao tác: bọc/mở một DEK 32 byte bằng
   một mật khẩu. Tự triển khai với các crate đã kiểm toán kỹ
   (RustCrypto's `chacha20poly1305`) là bề mặt nhỏ hơn, dễ audit hơn.

## Consequences

- PawPass tự chịu trách nhiệm toàn bộ vòng đời khoá (Sprint 2), không dựa
  vào plugin bên thứ ba cho phần bảo mật lõi. Mọi thay đổi ở
  `src-tauri/src/security/` bắt buộc security review (SOURCE-OF-TRUTH
  §12.2 DoD).
- Payload bí mật dùng schema riêng đã chốt ở SOURCE-OF-TRUTH §11.6 —
  không tương thích ngược với bất kỳ định dạng nào Stronghold có thể đã
  tạo ra nếu một bản thử nghiệm trước đó dùng nó (không có — repo chưa có
  code, không có dữ liệu cần migrate).
- DEK không bao giờ rời khỏi Rust dưới dạng plaintext lâu dài; chỉ sống
  trong `Zeroizing<[u8; 32]>` (SOURCE-OF-TRUTH §11.2 bước 5).
