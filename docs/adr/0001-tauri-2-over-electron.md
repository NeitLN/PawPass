# ADR-001: Dùng Tauri 2 thay vì Electron

- Status: Accepted
- Date: 2026-08-09
- Nguồn quyết định: `docs/SOURCE-OF-TRUTH.md` §9.1, Sprint 0 backlog §12.3

## Context

PawPass là một desktop app quản lý mật khẩu tài khoản mạng xã hội, chạy trên
Windows 10/11 x64, xử lý dữ liệu nhạy cảm (mật khẩu tài khoản, mật khẩu email,
recovery code) ngay trên máy người dùng trước khi mã hoá gửi lên Supabase.

Hai lựa chọn desktop shell khả dĩ cho một frontend React + TypeScript:
Electron (bundle Chromium + Node.js riêng) và Tauri 2 (dùng WebView2 có sẵn
của hệ điều hành, backend native viết bằng Rust).

## Decision

Dùng **Tauri 2** làm desktop shell.

Lý do quyết định:

1. **Bundle nhẹ hơn nhiều.** Electron đóng gói cả một bản Chromium runtime
   (~150-200 MB); Tauri dùng WebView2 đã có sẵn trên Windows 11 (và cài kèm
   nhẹ trên Windows 10 qua `embedBootstrapper`, xem SOURCE-OF-TRUTH §13.1) —
   installer chỉ vài MB thay vì hàng trăm MB.
2. **Rust cho lớp bảo mật.** Toàn bộ logic mã hoá (Argon2id, XChaCha20-Poly1305,
   zeroize) chạy trong Rust — ngôn ngữ có kiểu bộ nhớ an toàn và hệ sinh thái
   crypto trưởng thành (`argon2`, `chacha20poly1305`, `zeroize` crates), thay
   vì phải tự triển khai hoặc tin tưởng một binding Node.js cho việc này.
   Electron không ép buộc ranh giới rõ ràng giữa "vùng chạm plaintext" và
   phần còn lại; Tauri's IPC command boundary làm việc đó tự nhiên hơn
   (SOURCE-OF-TRUTH §9.3 ARCH-07: đúng hai lệnh Rust chạm plaintext).
3. **Permission allowlist tường minh.** Tauri 2 capabilities system yêu cầu
   khai báo rõ từng permission (`opener:allow-open-url` với scope domain cụ
   thể, `clipboard-manager:allow-write-text` không kèm `read-text`, v.v. —
   xem SOURCE-OF-TRUTH §9.3 ARCH-08). Electron không có cơ chế tương đương
   sẵn có; phải tự dựng bằng tay và dễ bỏ sót.
4. **Gọi native command rõ ràng.** Ranh giới React ↔ Rust là các lệnh
   `#[tauri::command]` có kiểu tường minh, dễ audit trong review bảo mật
   (SOURCE-OF-TRUTH §12.2: "security review cho mọi thay đổi chạm secret").

## Consequences

- Toàn bộ logic mã hoá viết bằng Rust, không phải TypeScript/Node — cần
  thành thạo Rust cho phần `src-tauri/src/security/` (Sprint 2).
- Không có hệ sinh thái Electron-only (một số thư viện Node native chỉ hỗ
  trợ Electron) — chưa gặp nhu cầu nào trong scope MVP của PawPass.
- WebView2 là runtime bắt buộc trên máy người dùng cuối; đã xử lý bằng
  `webviewInstallMode: embedBootstrapper` (SOURCE-OF-TRUTH §13.1 ARCH-06).
- Testing desktop-level dùng `tauri-driver` thay vì Spectron/Playwright cho
  Electron (SOURCE-OF-TRUTH §9.1 test pyramid).
