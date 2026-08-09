---
title: "PawPass — Source of Truth"
product_name: "PawPass"
mascot_name: "Mochi"
target_platform: "Windows desktop"
version: "4.0"
last_updated: "2026-08-09"
based_on: "Turtly_Master_Roadmap_Design_Specification.md v1.0 (08/08/2026)"
---

# TURTLY — SOURCE OF TRUTH

**Desktop Account Manager • Windows • Facebook · Instagram · Google/Gmail**
Sản phẩm **PawPass** • Mascot **Mochi** • *One Paw, Endless Access.*

> **CHO AI CODING AGENT**
> Đọc hết file này trước khi code. Đây là tài liệu quyết định duy nhất.
> Không tự thêm auto-login, scraping, team features, hay lưu bí mật dạng plaintext.
> Mọi thay đổi khác tài liệu → sửa tài liệu trước, code sau.

---

## 0. Tài liệu này là gì

File này là **`Turtly_Master_Roadmap_Design_Specification.md`** (bản gốc do người dùng cung cấp, còn ở `Downloads\`), đã sửa theo kết quả review 6 vai ngày 08/08/2026 (`docs/REVIEW-2026-08-08.md`).

**Nguyên tắc sửa:** giữ nguyên mọi quyết định sản phẩm của Master Roadmap — phạm vi, độ ưu tiên P0/P1, cấu trúc màn hình, thiết kế thẻ, kiến trúc, mô hình dữ liệu. Chỉ sửa những chỗ **tự nó là lỗi**, không phụ thuộc vào việc so sánh với tài liệu nào khác: cơ chế bảo mật không làm được việc được giao (RLS không giấu được cột), Master Roadmap tự mâu thuẫn với chính mình (§10.1 chỉ định Stronghold trong khi §12.2 mô tả một sơ đồ khoá khác; §6.2 nói Mochi Wave trong khi §9.2 của chính nó nói Neutral), khoảng trống buộc phải lấp (recovery key được nhắc tới nhưng chưa có cơ chế), hoặc sự thật vật lý (ảnh brand nền magenta không trong suốt — đo được bằng cách đọc pixel, không cần tài liệu nào xác nhận).

**Đã bỏ khỏi repo:** `DECISIONS.md`, `BRAND.md`, `UI.md` của một bản nháp trước — những file đó áp một số quyết định khác mà **người dùng đã yêu cầu bỏ qua**. Tài liệu này không còn phụ thuộc vào chúng. `docs/REVIEW-2026-08-08.md` vẫn giữ lại làm biên bản lịch sử, nhưng phần "Phân xử" của nó (mục 7.2) **không còn hiệu lực** — xem ghi chú ở đầu file đó.

> **QUYẾT ĐỊNH PHẠM VI 09/08/2026 — bỏ follower tự động qua Meta API.** Master Roadmap gốc coi follower tự động (OAuth Meta, Edge Function, Cron sync) là P1. Người dùng đã thử luồng thiết lập thật (tạo Meta App, Graph API Explorer, OAuth) và quyết định **không đáng công sức** so với giá trị mang lại cho một app cá nhân quản lý dưới 100 tài khoản. Follower trong PawPass **chỉ nhập tay**. Toàn bộ phần liên quan Meta OAuth, `platform_connections`, `platform_connection_secrets`, `sync_jobs`, Edge Functions, Cron, và error taxonomy của follower sync đã bị xoá khỏi tài liệu này — không phải hoãn, mà bỏ hẳn khỏi kiến trúc. Nếu muốn làm lại sau, đây là một tính năng mới cần thiết kế lại từ đầu, không phải "bật lại" một phần đã tắt.

**Thứ tự ưu tiên:** file này → `REVIEW-2026-08-08.md` (để tra lý do một quyết định, lưu ý các phần liên quan Meta trong đó đã lỗi thời) → `Turtly_Master_Roadmap_Design_Specification.md` gốc (để so sánh, không dùng để lấy giá trị vì file này đã cập nhật).

---

## 1. Quyết định sản phẩm

| Hạng mục | Quyết định |
|---|---|
| Người dùng | Một chủ sở hữu; có thể dùng nhiều máy Windows |
| Nền tảng MVP | Facebook, Instagram, Google/Gmail |
| Dữ liệu chính | Tên, username, email, mật khẩu tài khoản, mật khẩu email, follower, location, URL, trạng thái, ghi chú, tag |
| Follower | **Nhập tay.** Hiển thị số đã ghi và ngày cập nhật gần nhất — không có đồng bộ tự động qua API |
| Mở tài khoản | Mở URL trong trình duyệt mặc định; không lưu cookie, không tự điền form đăng nhập |
| Cloud | Supabase Auth + Postgres + Realtime — **từ ngày đầu**, không tách pha |
| Desktop | Tauri 2 + React + TypeScript; gói cài đặt Windows |
| Mã hoá | Secret payload mã hoá trên máy; master password riêng với mật khẩu đăng nhập PawPass |
| Thời gian | 6 tuần full-time hoặc 8–10 tuần bán thời gian |

### 1.1 Nguyên tắc không thương lượng

- Không lưu mật khẩu Facebook, Instagram hoặc Gmail dạng plaintext trong Supabase, log, crash report hoặc file cấu hình.
- Không dùng scraping, cookie harvesting, hoặc kỹ thuật tự động lấy dữ liệu từ Facebook/Instagram/Gmail ngoài việc mở trình duyệt.
- Không hứa "real-time tuyệt đối". Giao diện luôn hiển thị thời điểm đồng bộ gần nhất và nguồn dữ liệu.
- Mọi bảng client truy cập được đều bật Row Level Security; service-role key không bao giờ xuất hiện trong desktop bundle.
- Mỗi thao tác reveal/copy mật khẩu có xác nhận trạng thái, tự ẩn lại, dọn clipboard theo thời gian cấu hình.

### 1.2 Định nghĩa thành công của bản 1.0

- Quản lý tối thiểu **500** bản ghi tài khoản mà tìm kiếm, lọc và mở chi tiết vẫn phản hồi nhanh.
- Tạo/sửa/xóa trên máy A xuất hiện trên máy B trong vòng 5 giây khi cả hai online.
- Mật khẩu trong database chỉ tồn tại ở dạng ciphertext; đăng nhập mới trên máy khác cần master password để giải mã.
- Installer chạy trên Windows 10/11 x64; app giữ trạng thái đăng nhập và có auto-lock.
- **Bổ sung (SEC-03/QA-05 — điều kiện có thật, Master Roadmap gốc chỉ ghi trong checklist):** diễn tập khôi phục bằng recovery key pass trên máy sạch. Xem §11.2 và §15.2 AT-12.

### 1.3 Ưu tiên nếu thiếu thời gian *(dựa trên Master Roadmap §15.1, đã bỏ mục Meta)*

1. Giữ vault encryption + RLS + CRUD + search + open account.
2. Giữ follower nhập tay và hiển thị ngày cập nhật rõ ràng.
3. Dời chart, import, dark mode và auto-update; **không dời security test**.

---

## 2. Tầm nhìn, mục tiêu và phạm vi

### 2.1 Product vision

PawPass biến danh sách tài khoản rời rạc trong Excel, ghi chú và trình duyệt thành một nơi duy nhất: dễ nhìn, dễ tìm, mở nhanh, đồng bộ giữa các máy và đủ an toàn để lưu thông tin đăng nhập — như Mochi canh cửa, trung thành và đáng tin.

> **TAGLINE CHÍNH** One Paw, Endless Access. • Một dấu chân, mọi tài khoản.

### 2.2 Mục tiêu

- Giảm thời gian tìm một tài khoản xuống dưới 10 giây.
- Xem nhanh tình trạng, follower và ngày cập nhật gần nhất ngay trên Dashboard.
- Tách thông tin công khai khỏi secrets để hiển thị nhanh nhưng vẫn bảo vệ mật khẩu.
- Đồng bộ dữ liệu nhiều máy mà không tạo nhiều bản ghi trùng hoặc ghi đè âm thầm.
- Cho phép mở đúng trang Facebook, Instagram hoặc Gmail bằng một nút.

### 2.3 Ngoài phạm vi MVP

Follower tự động qua Meta API/OAuth · tự động đăng nhập, tự điền mật khẩu, quản lý browser profile · tự động đăng bài/tương tác/nhắn tin/follow-unfollow · quản lý nhiều thành viên, phân quyền đội nhóm · lấy follower bằng scraping · app mobile, browser extension, macOS/Linux · analytics nâng cao, dự báo tăng trưởng.

### 2.4 Persona và tình huống chính

| Tình huống | Nhu cầu | Kết quả mong muốn |
|---|---|---|
| Tìm tài khoản | Nhớ một phần tên/email | Search ra card đúng trong ≤1 giây |
| Kiểm tra follower | Xem số đã ghi gần nhất | Card hiển thị số và ngày mình cập nhật lần cuối — không giả vờ real-time |
| Đổi máy | Đăng nhập PawPass trên PC khác | Metadata tải về; nhập master password để mở secrets |
| Mở tài khoản | Đi đến profile hoặc Gmail | Trình duyệt mở đúng URL; app không giả lập đăng nhập |
| Cập nhật credential | Đổi mật khẩu tài khoản/email | Lưu phiên bản mới, không rò vào history/log |

---

## 3. Yêu cầu chức năng và quy tắc nghiệp vụ

### 3.1 Functional requirements P0

| ID | Yêu cầu | Tiêu chí chấp nhận | Nghiệm thu bởi |
|---|---|---|---|
| FR-01 | Đăng nhập PawPass | Email/password hoặc magic link; session khôi phục sau khi mở lại app | AT-24 |
| FR-02 | Mở kho bí mật | Nhập master password; sai không làm lộ thông tin hoặc log plaintext | AT-01, AT-02 |
| FR-03 | Danh sách tài khoản | Grid card có avatar, platform, tên, username/email, follower, status, last update | AT-10, AT-19 |
| FR-04 | CRUD tài khoản | Tạo, xem, sửa, archive; validation theo platform | AT-01, AT-15 |
| FR-05 | Xem/copy secrets | Mặc định che; reveal tạm thời; copy có thông báo và dọn clipboard | AT-09 |
| FR-06 | Tìm kiếm/lọc | Theo tên, username, email, platform, status và tag | AT-16 |
| FR-07 | Mở tài khoản | Chỉ mở URL http/https hợp lệ bằng trình duyệt mặc định | AT-08 |
| FR-08 | Đồng bộ nhiều máy | Thay đổi metadata và ciphertext đồng bộ qua Supabase | AT-03, AT-14 |
| FR-09 | Follower nhập tay | Cho phép nhập tay, cập nhật, hoặc để trống; ghi rõ ngày cập nhật | AT-17 |
| FR-10 | Auto-lock | Khóa kho sau thời gian không hoạt động hoặc khi người dùng khóa thủ công | AT-13 |
| **FR-17** | **Recovery key** *(mới — lấp khoảng trống của §11.5 checklist, xem §11.2)* | Sinh khi tạo vault, hiện đúng một lần, bắt buộc xác nhận đã lưu, tải `.txt` được | AT-12 |
| **FR-18** | **Đổi master password** *(mới, cùng lý do)* | Cần master hiện tại hoặc recovery key; không mã hoá lại toàn bộ secrets | AT-12 |

### 3.2 Functional requirements P1

- **FR-13** — Lịch sử các lần cập nhật follower (thủ công) dạng danh sách; chart để post-MVP nếu cần.
- **FR-14** — Dashboard summary: tổng tài khoản, active, cần kiểm tra.
- **FR-15** — Mochi empty/error/success states theo mascot system.
- **FR-16** — Device list và nút đăng xuất các session khác.

> **Nghiệm thu bởi (QA-01 — Master Roadmap gốc có 16 FR và 10 AT nhưng không ánh xạ; đối chiếu tay lộ ra 8 FR không AT nào phủ).** FR-13: (chưa có AT — chart để post-MVP nên chấp nhận được) · FR-14: AT-19 · FR-16: AT-25. Luật áp cho mọi FR mới thêm sau này: **một FR không có AT thì không được đánh dấu hoàn thành.**
>
> **Đã bỏ (09/08/2026):** FR-11 (OAuth Meta và follower sync tự động), FR-12 (nút "Đồng bộ ngay"/"Sync all" có cooldown) — xem §0. Số ID không tái sử dụng để lịch sử quyết định còn tra được.

### 3.3 Quy tắc nghiệp vụ

- **BR-01** — Mỗi account thuộc đúng một owner_id; mọi query client phải bị giới hạn bởi `auth.uid()`.
- **BR-02** — Một record được xem là trùng khi cùng owner + platform + normalized username; email trùng chỉ cảnh báo, không chặn.
- **BR-03** — Archive là mặc định thay cho delete cứng; xóa vĩnh viễn yêu cầu xác nhận lại.
- **BR-04** — Follower count phải là số nguyên ≥0 hoặc null; không dùng 0 để biểu diễn "chưa nhập".
- **BR-05** — Trường secrets được ghi trong một encrypted payload có version để hỗ trợ đổi thuật toán/migration.
- **BR-06** — Nút mở tài khoản bị vô hiệu hóa nếu URL không hợp lệ; URL do platform template sinh ra được ưu tiên.
- **BR-07** *(trước là BR-09 — DATA-03, cần một quy tắc chuẩn hoá rõ ràng vì §10.2 chỉ ghi chú "normalized_username để unique mềm" mà không định nghĩa)* — Chuẩn hoá username = bỏ ký tự `@` đầu, `lower()`, `trim()`. Áp dụng ở đúng một tầng (repository), không lặp lại logic ở nhiều nơi.

> **Đã bỏ (09/08/2026):** BR-07 cũ (không chạy song song sync job — gắn với `sync_jobs`), BR-08 cũ (token hết hạn chuyển `reauth_required`) — cả hai chỉ tồn tại vì Meta OAuth. Xem §0.

---

## 4. Luồng người dùng và cấu trúc màn hình

### 4.1 Information architecture

| Khu vực | Màn hình | Chức năng |
|---|---|---|
| Workspace | Dashboard | Tổng quan, quick filters, account grid |
| Accounts | All Accounts | Tìm kiếm, lọc, sort, grid/list view |
| Accounts | Account Detail | Thông tin, secrets, follower history, notes |
| Actions | Add / Edit Account | Form theo platform; validation và preview card |
| System | Settings | Profile, security, auto-lock, devices, appearance |

> **Đã bỏ:** màn hình "Sync Center" (job gần đây, kết nối lại OAuth) — không còn job hay OAuth nào để theo dõi.

### 4.2 Luồng onboarding lần đầu

1. Mở app → màn hình Mochi Wave → đăng nhập hoặc tạo tài khoản PawPass.
2. Tạo master password → hệ thống tạo recovery key một lần → yêu cầu lưu ra nơi an toàn *(cơ chế cụ thể ở §11.2)*.
3. Khởi tạo kho rỗng → chọn "Thêm tài khoản đầu tiên".
4. Điền thông tin cơ bản và secrets → xem preview Account Card → lưu.
5. Tuỳ chọn nhập follower ngay hoặc bỏ qua, cập nhật sau.
6. Về Dashboard → Mochi Success + gợi ý tạo thêm tài khoản.

> **ĐIỀU KIỆN TIÊN QUYẾT (UX-06 — logic tự suy, không có trong Master Roadmap gốc nhưng cần thiết).** Bước 4 thu thập secrets (mật khẩu tài khoản, mật khẩu email, recovery code). Nếu vault chưa unlock ở bước này, app không có DEK để mã hoá — người dùng gõ xong 4 trường nhạy cảm rồi mới bị chặn, và cách "sửa" tự nhiên (giữ tạm trong React state chờ unlock) là chính hành vi mà §9.3 cấm. **Nút "Thêm tài khoản" vô hiệu hoá khi vault khoá**, kèm tooltip mở dialog unlock trước khi vào form.

### 4.3 Luồng thêm tài khoản

- **Bước 1 — Platform**: Chọn Facebook, Instagram hoặc Google/Gmail.
- **Bước 2 — Identity**: Avatar, display name, username, profile URL, location.
- **Bước 3 — Login**: Email đăng nhập, mật khẩu tài khoản, recovery email, mật khẩu email, 2FA note/recovery code.
- **Bước 4 — Follower**: Nhập số hiện tại (tuỳ chọn) — có thể bỏ trống và cập nhật sau.
- **Bước 5 — Review**: Preview card, kiểm tra duplicate warning, lưu.

### 4.4 Luồng mở tài khoản

1. Người dùng nhấn "Mở tài khoản" trên card hoặc detail.
2. App xác thực URL thuộc http/https và đúng template theo platform.
3. Tauri Opener mở trình duyệt mặc định. Với Gmail dùng URL có tham số `authuser=email` nếu có thể.
4. Nếu trình duyệt chưa đăng nhập đúng tài khoản, người dùng tự chọn/đăng nhập trong trình duyệt.

> **KHÔNG LÀM TRONG MVP** Không inject JavaScript, không tự điền mật khẩu, không đọc cookie trình duyệt và không chạy Selenium/Puppeteer để vượt cơ chế đăng nhập.
>
> **BỔ SUNG (ARCH — validate URL ở Rust là điều kiện đủ, không phải chỉ "http/https hợp lệ").** Chặn thêm: credential nhúng trong URL (`https://user:pass@…`), host ngoài allowlist theo platform (`facebook.com`, `instagram.com`, `mail.google.com`), và chuẩn hoá punycode để chặn homograph domain giả dạng. Xem AT-08.

---

## 5. Thiết kế Dashboard và Account Card

### 5.1 Layout Desktop

| Vùng | Kích thước/Quy tắc | Nội dung |
|---|---|---|
| App window | Min 1180×720; mặc định 1440×900 | Không ép full-screen; ghi nhớ kích thước/cửa sổ |
| Sidebar | 240 px; có collapsed 76 px | Logo, Dashboard, Accounts, Settings |
| Topbar | 72 px | Tiêu đề, search toàn cục, Add account, avatar |
| Content | Padding 28–32 px | Summary cards → filter bar → account grid |
| Account grid | Min card 340 px; gap 20 px | 3 cột ở 1440 px, 2 cột khi cửa sổ hẹp |

### 5.2 Dashboard composition

- Header: "Good evening, Tiến" + Mochi **Neutral** nhỏ, không chiếm quá 88 px chiều cao.
- Summary: Total Accounts, Active, Needs Attention; card số liệu cao 104–116 px.
- Search/filter: search 360 px, platform segmented control, status dropdown, sort dropdown.
- Account grid: ưu tiên card có mật độ vừa; không đưa password ra Dashboard.
- Empty state: Mochi Search + CTA "Thêm tài khoản đầu tiên".

> **SỬA (UX-05 — Master Roadmap tự mâu thuẫn với chính mình).** §6.2 gốc ghi "Mochi Wave nhỏ" ở header Dashboard, nhưng bảng §9.2 "Quy tắc sử dụng mascot" (cũng của Master Roadmap) định nghĩa `Wave → Onboarding, welcome back` và `Neutral → Dashboard greeting`. Đây không phải hai tài liệu khác nhau — cùng một file tự nói ngược nhau. Bảng §9.2 thắng vì nó là bảng quy tắc, còn §6.2 là mô tả. Header Dashboard dùng **Mochi Neutral**, không phải Wave.
>
> **Đã bỏ (09/08/2026):** stat card "Sync Errors" — không còn tác vụ tự động nào có thể lỗi.

### 5.3 Account Card — mẫu tham chiếu

| Thành phần | Đặc tả đề xuất |
|---|---|
| Container | 340–380 px; padding 18 px; radius 18 px; border #D8E4E0; shadow `0 8 24 rgba(11,46,40,.08)` |
| Platform badge | 32 px, chồng góc avatar; icon chính thức, có accessible label |
| Avatar | 88×88 px; radius 18 px; object-fit cover; fallback initials |
| Identity | Display name 16 px/700; username 13 px; email 13 px muted; ellipsis + tooltip |
| Status | Pill Active/Review/Inactive/Locked; không chỉ dùng màu để truyền đạt |
| Follower | Icon 16 px + compact number; kèm ngày cập nhật trong tooltip/detail |
| Update row | Divider; "Đã cập nhật 8 ngày trước" hoặc "Chưa cập nhật follower" |
| Actions | Secondary "Cập nhật follower"; Primary-outline "Mở tài khoản"; min height 42 px |

> **Đã bỏ (09/08/2026):** nút "Đồng bộ" (đã đổi thành "Cập nhật follower" — mở form nhập tay tại chỗ, không gọi API nào).

### 5.4 Các trạng thái card

| Trạng thái | Màu/biểu tượng | Hành vi |
|---|---|---|
| Active | Green + check | Mọi hành động khả dụng |
| Review | Amber + flag | Cần người dùng xem lại thông tin tài khoản |
| Inactive | Gray | Tài khoản không dùng thường xuyên, vẫn đầy đủ chức năng |
| Locked | Red + lock | Người dùng tự khoá tài khoản này khỏi thao tác nhanh |
| Archived | Muted | Ẩn mặc định khỏi Dashboard; có Restore |

> **Đã bỏ (09/08/2026):** trạng thái "Manual" (mọi tài khoản giờ đều là nhập tay, không còn gì để phân biệt), "Syncing" và "Needs re-auth" (chỉ tồn tại vì OAuth).
>
> **ĐÁNG CÂN NHẮC, không phải mặc định (UX-01 — quan sát, để lại làm ghi chú).** Container 340–380px + avatar 88px + 2 nút ngang hàng đẩy card khá cao; với mục tiêu 500+ account (§1.2) đó là nhiều lần cuộn hơn. Nếu muốn thử nghiệm, có thể rút avatar xuống 40–48px và gộp "Cập nhật follower" vào menu `⋯`, chỉ giữ "Mở tài khoản" làm nút chính. **Đây là gợi ý, không phải yêu cầu — giữ đặc tả gốc ở trên làm mặc định** trừ khi có ý kiến khác.

---

## 6. Trang chi tiết tài khoản

### 6.1 Bố cục

Trang chi tiết dùng layout 2 cột: cột chính 65% cho identity, follower và notes; cột phụ 35% cho credential vault và quick actions. Ở cửa sổ hẹp, cột phụ xuống dưới. Header trang giữ avatar, platform, tên, status và các nút Edit / Open account / More.

### 6.2 Nhóm dữ liệu hiển thị

| Nhóm | Trường | Bảo vệ/hiển thị |
|---|---|---|
| Identity | Display name, username, avatar, platform, profile URL | Hiển thị bình thường |
| Contact | Login email, recovery email, phone, location | Email copy được; phone tùy chọn |
| Secrets | Account password, email password, recovery codes, 2FA note | Che mặc định; reveal/copy có timeout |
| Metrics | Follower hiện tại, ngày cập nhật, lịch sử | Không dùng 0 thay null |
| Metadata | Tags, status, notes, created/updated, device cuối sửa | Notes hỗ trợ plain text; không HTML tùy ý |

> **Đã bỏ (09/08/2026):** nhóm "Connection" (OAuth status, scopes, token expiry) — không còn OAuth nào để hiển thị trạng thái.
>
> **LƯU Ý RIÊNG TƯ, không phải cấm (SEC-02 — mềm hơn bản trước vì lý lẽ mạnh nhất từng dùng lấy từ một tài liệu khác đã bị bỏ).** `notes` là cột text thường trên Supabase (§10.2) — plaintext trên cloud, không mã hoá. Đây là lựa chọn hợp lý cho ghi chú thông thường (tag, ngữ cảnh). Nhưng vì đây là field tự do, người dùng có thể vô tình gõ vào đó thông tin nhạy (số điện thoại khôi phục, gợi ý bảo mật). **Khuyến nghị:** thêm một dòng gợi ý nhỏ dưới ô notes trong UI — *"Không nên ghi số điện thoại khôi phục hay câu hỏi bảo mật vào đây — trường này không mã hoá."* Không cần đổi schema.

### 6.3 Credential Vault interaction

- Khối secrets có trạng thái Locked/Unlocked độc lập với phiên đăng nhập cloud.
- Nhấn Reveal yêu cầu app vault đang unlocked; sau 15 giây tự che lại.
- Nhấn Copy hiển thị toast "Đã sao chép — clipboard sẽ được xóa sau 30 giây".
- Không cho chụp màn hình là tính năng best-effort, không xem đó là biện pháp bảo mật chính.
- Edit secret tạo `updated_at` và audit event nhưng không lưu plaintext cũ.
- Auto-lock mặc định 10 phút; tùy chọn 1/5/10/30 phút hoặc khi app minimize.

> **SỬA — lời hứa clipboard không giữ được nguyên văn trên Windows (SEC-04, sự thật về Windows, không phụ thuộc tài liệu nào).** Windows Clipboard History (`Win+V`) giữ một bản sao riêng mà việc xoá clipboard của app **không** động tới. Toast không nên hứa "clipboard sẽ được xóa" như một đảm bảo tuyệt đối — đổi thành *"Đã sao chép — PawPass sẽ xoá sau 30 giây"*. Trước khi xoá, **so sánh nội dung hiện tại**: chỉ xoá nếu vẫn đúng là thứ PawPass đã ghi, để không xoá mất thứ người dùng vừa copy sau đó. Nếu phát hiện Clipboard History đang bật (đọc registry `HKCU\Software\Microsoft\Clipboard\EnableClipboardHistory`), hiện một banner cảnh báo **đúng một lần** trong Settings.
>
> **SỬA — bổ sung tác nhân khoá còn thiếu (SEC-05).** "Không hoạt động" và "minimize" không đủ. Bắt buộc khoá thêm khi: khoá màn hình Windows (`WTS_SESSION_LOCK`), sleep/hibernate, thoát app, đăng xuất PawPass — các tác nhân này không tuỳ chọn. Xem AT-13.

### 6.4 Validation quan trọng

- **Facebook**: URL phải thuộc facebook.com; username chuẩn hóa bỏ @; follower luôn là nhập tay.
- **Instagram**: URL thuộc instagram.com; username lowercase; account type chọn Personal/Creator/Business (chỉ để phân loại, không ảnh hưởng follower).
- **Gmail**: Email hợp lệ; URL mặc định tự sinh; follower không áp dụng.
- **Secrets**: Không giới hạn ký tự đặc biệt; không trim mật khẩu; không ghi vào analytics/log.
- **Location**: Text tự do tối đa 120 ký tự; không cần GPS trong MVP.

---

## 7. Hệ thống thiết kế PawPass

### 7.1 Brand personality

PawPass nên tạo cảm giác thân thiện, bình tĩnh và đáng tin: mềm mại hơn một công cụ quản trị doanh nghiệp nhưng nghiêm túc hơn một ứng dụng mascot thuần giải trí. Mochi — chú Shiba trung thành — là ẩn dụ cho người canh cổng: thân thiện khi chào, nghiêm túc khi giữ bí mật. **Chiếc khiên có ổ khoá** đeo trên cổ Mochi là ẩn dụ cho kho mật khẩu được mã hoá; mỗi tài khoản là một "dấu chân" (paw print) được gom lại một chỗ.

### 7.2 Color tokens

> **ĐỔI BẢNG MÀU (09/08/2026) — lấy pixel thật từ `mochi-logo.png`, không đoán bằng mắt.** Bảng Deep Teal/Green Teal/Mint của Master Roadmap gốc gắn với brand "rùa" cũ, không còn dùng. Bảng dưới đây sample trực tiếp từ ảnh Mochi (script đọc raw PNG, xem `docs/brand-reference/`).

| Token | Hex | Vai trò |
|---|---|---|
| Fur Orange | `#E46C00` | Brand primary, heading, sidebar, app icon background, nút chính |
| Shield Navy | `#000C24` | Text đậm, dark mode surface, viền khiên |
| Muzzle Cream | `#FCE4C0` | Tint, nền nhạt, illustration |
| Outline Black | `#000000` | Viền nét vẽ mascot/logomark — **không** dùng cho text |
| Surface | `#F8F6F2` | Nền app *(kem trung tính, hài hoà với Muzzle Cream — chưa đo tương phản, xem TODO §7.6)* |
| Border | `#E8DFD0` | Border card/input/divider *(dẫn xuất từ Muzzle Cream, tối hơn 12%)* |
| Danger | `#F05448` | Delete, security error; luôn kèm icon/text |

**Ba màu thẻ tài khoản** (từ 3 card phía sau đầu Mochi trong ảnh gốc) — dùng làm accent phân loại nền tảng, không dùng cho text:

| Token | Hex | Vai trò |
|---|---|---|
| Account Blue | `#246CE4` | Accent — có thể gán cho một nhóm nền tảng (ví dụ Gmail) |
| Account Pink | `#D8186C` | Accent — nhóm nền tảng khác (ví dụ Instagram) |
| Account Coral | `#F05448` | Accent — nhóm nền tảng khác (ví dụ Facebook) — **trùng giá trị với Danger**, cần tách nếu dùng cùng lúc trên một màn hình (xem TODO bên dưới) |

> **TODO trước Sprint 1 — hai việc chưa xong:**
> 1. **Chưa đo tương phản WCAG.** Không có giá trị `-text`/`-bg` cho trạng thái (Success/Warning/Error/Inactive) như bảng cũ từng có — bảng màu cũ đã bị bỏ cùng với brand rùa, và bảng màu mới **chưa** được kiểm tra đạt ≥4.5:1 trên nền `Surface`. Trước khi dùng `Fur Orange`/`Account Blue`/`Account Pink`/`Account Coral` làm **chữ**, phải đo lại — nhiều khả năng cần biến thể đậm hơn giống cơ chế `-text` cũ (§7.6 đặt mục tiêu WCAG 2.2 AA, chưa có gì đảm bảo bảng mới đạt).
> 2. **`Account Coral` trùng `Danger` (`#F05448`).** Nếu badge nền tảng và trạng thái lỗi cùng xuất hiện trên một card, chúng sẽ cùng màu và gây nhầm lẫn — cần đổi một trong hai trước khi code StatusChip.

Trạng thái luôn là **icon + chữ**, không chỉ dựa vào màu (§7.6) — quy tắc này **không đổi**, chỉ giá trị hex đổi.

### 7.3 Typography

| Vai trò | Font | Style |
|---|---|---|
| Logo/brand headline | Nunito Sans | Bold / ExtraBold, tròn và thân thiện |
| UI/body/data | Inter | Regular / Medium / Semibold |
| Fallback | Arial / system-ui | Khi font chưa tải hoặc trên renderer hệ thống |
| Numeric metrics | Inter | Tabular numbers để follower không nhảy chiều rộng |

### 7.4 Spacing, radius và elevation

- Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40 px.
- Radius: input/button 10–12 px; card 16–18 px; modal 20–24 px; pill 999 px.
- Border: 1 px; focus ring 3 px `rgba(30,111,106,.25)`.
- Elevation 1: `0 2 8 rgba(11,46,40,.05)`; Elevation 2: `0 8 24 rgba(11,46,40,.08)`.
- Motion: 160–220 ms ease-out; tôn trọng `prefers-reduced-motion`.

### 7.5 Component inventory

Button: primary, secondary, outline, ghost, danger; icon-only luôn có tooltip · Input: text, password, search, select, combobox, tag input; label không dùng placeholder thay thế · AccountCard, StatCard, PlatformBadge, StatusPill, SyncIndicator (trạng thái đồng bộ đa thiết bị, không phải follower) · SecretField, CopyButton, RevealButton, VaultLockBanner · EmptyState, ErrorState, Skeleton, Toast, ConfirmDialog, Drawer/Modal · MochiIllustration với enum state, kích thước và alt text cố định.

### 7.6 Accessibility

- Mục tiêu WCAG 2.2 AA cho contrast, focus, keyboard và label.
- Toàn bộ flow CRUD, unlock, reveal, copy và open account dùng được bằng bàn phím.
- Status không dựa riêng vào màu; có text và icon.
- Avatar/mascot có alt text theo ngữ cảnh; ảnh trang trí dùng alt rỗng.
- Cỡ chữ UI tối thiểu 12 px cho metadata, body chính 14–16 px.

> **BỔ SUNG (UX-09 — mục tiêu này không có test nào phủ trong Master Roadmap gốc).** Thêm **AT-11**: đi hết luồng `mở app → unlock vault → tìm kiếm → mở chi tiết → reveal → copy → mở tài khoản` chỉ bằng bàn phím; axe-core trên Dashboard và Detail phải 0 lỗi `serious`/`critical`.

---

## 8. Logo và mascot Mochi

> **ĐỔI MASCOT (09/08/2026).** Brand cũ là con rùa Tully; 22 file PNG cũ trong `docs/brand-reference/` thuộc về brand đó và **không còn liên quan** — đã chuyển vào `docs/brand-reference/_obsolete-turtle/`, giữ lại chỉ để tra lịch sử, không dùng cho bất kỳ việc gì. Mascot chính thức từ nay là **Mochi**, một chú Shiba Inu, dựa trên `docs/brand-reference/mochi-logo.png`.

Các hình trong `docs/brand-reference/` là tài sản định hướng, **chưa phải asset production** (trừ khi ghi rõ khác ở §8.2).

### 8.1 Mascot system

Mochi có 8 trạng thái: Neutral, Wave, Search, Security, Sync, Offline, Success, Import.

| State | Dùng tại | Không dùng |
|---|---|---|
| Neutral | Dashboard greeting, About | Lặp lại trên mọi card |
| Wave | Onboarding, welcome back | Error hoặc security warning |
| Search | Empty search, no result | Loading |
| Security | Create master password, vault locked | Success toast nhỏ |
| Sync | Đồng bộ dữ liệu giữa các máy, background job | Khi mất kết nối hoàn toàn |
| Offline | No network, paused sync | Lỗi credentials |
| Success | Create/import/sync thành công | Hiển thị liên tục sau action |
| Import | Post-MVP CSV/Excel import | MVP nếu chưa có import |

### 8.2 Asset — trạng thái thật *(đo trực tiếp trên file ảnh, độc lập với mọi tài liệu)*

`mochi-logo.png` đã giải nén và đọc pixel trực tiếp — **khác hẳn kết quả của 22 file rùa cũ**, phần lớn đạt chuẩn kỹ thuật:

| Chỉ số | Kết quả | Đạt chuẩn production? |
|---|---|---|
| Kích thước | 1254×1254 px | ✅ đủ cho app icon 256×256 và hero display |
| Kênh alpha | Có (RGBA, colortype 6) | ✅ |
| Pixel trong suốt hoàn toàn | 48,4% | ✅ |
| Pixel viền lưng chừng (khử răng cưa) | chỉ 0,3% — rất sạch | ✅ không có viền rác |
| Định dạng | **Raster PNG**, không phải vector | ⚠️ đủ dùng cho icon/hero tĩnh, **không co giãn vô hạn được** như SVG |
| Số tư thế có sẵn | **1** (tư thế chào/neutral) | ❌ còn thiếu 7/8 trạng thái (Wave, Search, Security, Sync, Offline, Success, Import) |
| Wordmark "PawPass" | Không có trong ảnh | ❌ cần làm riêng |

**Việc còn thiếu trước khi coi là production-ready:**

1. **7 tư thế còn lại.** Nếu sinh rời từng tư thế bằng AI (mỗi lần một prompt độc lập) thì lặp lại đúng rủi ro của 22 file rùa cũ — tỷ lệ đầu/mắt/tai lệch nhau giữa các lần sinh. Cách an toàn hơn: dùng `mochi-logo.png` làm ảnh tham chiếu (img2img / character reference) cho từng tư thế sau, giữ đúng seed hoặc reference image xuyên suốt.
2. **Wordmark "PawPass"** — dựng riêng bằng font thật (Nunito Sans ExtraBold hoặc font khác nếu đổi theo §7.3), không vẽ chung vào ảnh mascot để còn kern/đổi cỡ được.
3. **App icon multi-resolution** — xuất từ `mochi-logo.png` (đã đủ 1254px) xuống các cỡ 16/24/32/48/64/128/256, kiểm tra riêng bản 16px xem còn nhận ra được không (mắt/mũi Mochi khá chi tiết, có thể vỡ ở cỡ rất nhỏ — chưa kiểm tra).
4. **Không có bản outline/mono** — cần cho theme tối hoặc chỗ chỉ nhận icon đơn sắc (ví dụ system tray).

**Cho tới khi có đủ 8 tư thế:** dùng `mochi-logo.png` (tư thế Neutral) cho mọi trạng thái mascot cần dùng trước — tốt hơn placeholder hình học vì đây đã là asset thật, chỉ thiếu biến thể. Không trộn phong cách rùa cũ vào bất kỳ đâu.

---

## 9. Kiến trúc kỹ thuật

### 9.1 Technology stack

| Layer | Công nghệ | Lý do |
|---|---|---|
| Desktop shell | Tauri 2 + Rust stable | Bundle nhẹ; permission allowlist; gọi native command rõ ràng |
| Frontend | React + TypeScript + Vite | Hệ sinh thái mạnh, component hóa |
| UI | Tailwind CSS + Radix/shadcn primitives tùy biến | Nhanh nhưng vẫn giữ brand PawPass |
| State/data | TanStack Query + Zustand | Tách server cache và local UI state |
| Forms | React Hook Form + Zod | Validation type-safe |
| Cloud | Supabase Auth/Postgres/Realtime | Đủ cho một người dùng nhiều máy |
| **Local secrets** | **Argon2id + XChaCha20-Poly1305 + zeroize (Rust)** *(sửa — xem dưới)* | Kho khóa cục bộ tự triển khai |
| Testing | Vitest, Testing Library, Playwright + tauri-driver | Unit, component, desktop smoke test |

> **SỬA (ARCH-02 — Master Roadmap tự mâu thuẫn với chính mình, không cần tài liệu ngoài để thấy).** §10.1 gốc chỉ định **Tauri Stronghold** cho local secrets. Nhưng §12.2 (cùng file) mô tả đầy đủ một sơ đồ khoá khác: DEK 32 byte → Argon2id sinh KEK từ master password → KEK bọc DEK → nonce riêng mỗi payload + XChaCha20-Poly1305/AES-256-GCM. Đây là **hai cơ chế khác nhau cho cùng một việc**. Sơ đồ §12.2 bắt buộc phải là cái thật vì nó tương thích đa thiết bị (wrapped_dek đồng bộ qua Supabase được); Stronghold là snapshot file cục bộ, không đồng bộ được, nên máy B không mở được secrets bằng Stronghold của máy A. **Bỏ Stronghold**, dùng trực tiếp `argon2` + `chacha20poly1305` + `zeroize` + `rand` trong Rust, đúng như §12.2 đã mô tả.
>
> **Đã bỏ (09/08/2026):** Edge Functions và Cron khỏi tầng Cloud — cả hai chỉ tồn tại để phục vụ Meta OAuth và follower sync tự động. Không có tác vụ nào khác trong scope hiện tại cần chạy server-side. Nếu Sprint sau cần một Edge Function vì lý do khác, thêm lại khi có nhu cầu thật.

### 9.2 Repository structure

```text
pawpass/
├─ src/                      # React UI
│  ├─ app/                   # router, providers, layouts
│  ├─ features/accounts/     # CRUD, card, detail, forms
│  ├─ features/vault/        # unlock, reveal, copy lifecycle
│  ├─ components/ui/         # branded primitives
│  ├─ lib/supabase/          # client + typed queries
│  └─ assets/brand/          # approved logo/Mochi assets (SVG hoặc PNG production)
├─ src-tauri/
│  ├─ src/commands/          # encrypt/decrypt/open URL/clipboard
│  ├─ src/security/          # key lifecycle, Argon2id, XChaCha20
│  ├─ capabilities/          # minimum permissions
│  └─ tauri.conf.json
├─ supabase/
│  ├─ migrations/            # schema + RLS + indexes
│  └─ seed.sql
├─ tests/                    # unit, integration, e2e
└─ docs/                     # ADR, API limits, release notes
```

> **Đã bỏ (09/08/2026):** `features/sync/` (job state, connection UI của Meta) và `supabase/functions/{meta-oauth,sync-followers}/` — không còn Edge Function nào trong scope.

### 9.3 Ranh giới trách nhiệm

- React không trực tiếp giải mã payload; gọi Tauri command và chỉ nhận giá trị khi UI cần reveal/edit.
- Supabase client dùng publishable key + JWT; mọi bảng public bật RLS.
- Tauri capabilities chỉ allow URL/provider cần thiết; không cấp shell/filesystem rộng nếu không dùng.

> **BỔ SUNG (ARCH-07 — sự thật kỹ thuật về Tauri IPC, độc lập với tài liệu).** IPC tuần tự hoá qua JSON, nên plaintext reveal sẽ trở thành một `String` JavaScript — bất biến, GC dọn không xoá nội dung, không zeroize được từ JS. Giảm thiểu: **đúng hai** lệnh Rust chạm plaintext — `reveal_secret` (trả chuỗi, dùng cho hiển thị 15 giây) và `copy_secret_to_clipboard` (**không trả chuỗi về JS**, Rust ghi thẳng clipboard — đường mặc định). Giá trị reveal không đặt vào React state, giữ trong `ref`. Mô hình đe doạ của PawPass không bao gồm kẻ tấn công đã chạy được mã trên máy hoặc dump được bộ nhớ tiến trình — ghi rõ giới hạn này ra để không hứa quá.
>
> **BỔ SUNG (ARCH-08 — danh sách capability cụ thể, Master Roadmap gốc chỉ nói nguyên tắc mà không liệt kê).**

| Permission | Lý do |
|---|---|
| `core:default` | Tối thiểu để chạy |
| `opener:allow-open-url` có scope `https://*.facebook.com/*`, `https://*.instagram.com/*`, `https://mail.google.com/*` | FR-07, scope ở tầng capability chứ không chỉ validate trong Rust |
| `clipboard-manager:allow-write-text` | FR-05 copy. **Không** cấp `read-text` |
| `updater:default` | Xem §13.2 |
| `shell:*`, `fs:*` rộng, `http:*` | **Không cấp** — không tính năng nào cần |

> **BỔ SUNG (ARCH-05 — cửa một chiều của Tauri updater, sự thật kỹ thuật).** Tauri updater xác thực bản cập nhật bằng cặp khoá ký riêng; public key phải nằm **trong bản build đã phát hành**. Nếu bản đầu tiên ship không có public key, không bản nào sau này tự cập nhật được cho máy đang chạy bản đó — phải gỡ cài lại tay. Chi phí sinh khoá bây giờ (~30 phút) rẻ hơn rất nhiều so với sửa sau. **Sinh khoá updater ở Sprint 0**, nhúng public key vào `tauri.conf.json` ngay cả khi chưa bật updater (`active: false`).

---

## 10. Mô hình dữ liệu

### 10.1 Các bảng chính

| Bảng | Vai trò | Trường cốt lõi |
|---|---|---|
| profiles | Hồ sơ chủ PawPass | id, display_name, avatar_url, timezone, settings_json |
| accounts | Metadata tài khoản | id, owner_id, platform, name, username, emails, location, profile_url, status, tags, timestamps |
| account_secrets | Payload đã mã hóa | account_id, ciphertext, nonce, algorithm, key_version, updated_at |
| user_keyrings | DEK đã được master password bọc | owner_id, wrapped_dek_by_master, wrapped_dek_by_recovery, salt, kdf_params, version |
| account_metrics | Lịch sử cập nhật follower thủ công | account_id, value, recorded_at |
| devices | Thiết bị/session | owner_id, device_name, platform, last_seen_at, revoked_at |
| audit_events | Sự kiện bảo mật không chứa secret | owner_id, action, entity_id, device_id, created_at |

> **Đã bỏ (09/08/2026):** `platform_connections`, `platform_connection_secrets` (OAuth server-only), `sync_jobs` (theo dõi job đồng bộ follower) — toàn bộ ba bảng này chỉ tồn tại để phục vụ Meta OAuth và cron sync, xem §0. Cùng với đó, mọi RLS pattern/khuôn mẫu IDOR viết riêng cho Edge Function gọi Meta cũng đã bỏ — không còn Edge Function nào trong scope.

### 10.2 accounts — field specification

| Field | Type | Rule |
|---|---|---|
| id | uuid | PK, `gen_random_uuid()` |
| owner_id | uuid | FK `auth.users`; RLS boundary |
| platform | enum/text | facebook \| instagram \| google |
| account_type | text | page/profile/business/creator/personal/gmail |
| display_name | text | Bắt buộc, 1–120 ký tự |
| username | text | Nullable |
| **normalized_username** | text | **Cột thật** *(sửa — DATA-03, xem dưới)*, `generated always as (lower(trim(leading '@' from username))) stored` |
| login_email | text | Lưu đã `lower()` sẵn *(sửa — không dùng `citext`, xem dưới)* |
| recovery_email | text | Nullable, cùng quy tắc |
| location | text | Nullable, ≤120 ký tự |
| profile_url | text | URL đã validate |
| avatar_path | text | Supabase Storage path hoặc remote URL được kiểm soát |
| status | text | active \| review \| inactive \| locked \| archived |
| follower_current | bigint | Nullable; số người dùng nhập tay lần gần nhất |
| **follower_updated_at** | timestamptz | Nullable *(đổi tên từ `follower_synced_at` — không còn "sync", chỉ có "update" thủ công)* |
| tags | text[] | Mặc định empty array |
| notes | text | Plain text; nullable — xem lưu ý §6.2 |
| created_at/updated_at | timestamptz | Server timestamps |
| archived_at | timestamptz | Soft delete |

> **Đã bỏ (09/08/2026):** cột `follower_mode` (`api \| manual \| none`) — không còn `api` để phân biệt, follower luôn là nhập tay hoặc trống.

> **SỬA (DATA-03 — hai khoảng trống schema, tự lộ ra khi đọc kỹ §10.2/§10.3, không cần đối chiếu tài liệu khác):**
> 1. `normalized_username` được nhắc như một khái niệm ("để unique mềm") nhưng **không phải cột thật** trong bảng — mà §10.3 lại đặt unique index trên chính nó. Migration sẽ fail vì tham chiếu cột không tồn tại. → thêm thành generated column, công thức ở bảng trên.
> 2. `citext` (kiểu chuẩn hoá không phân biệt hoa-thường của Postgres) cần `create extension citext` — không được nhắc tới, và **không tồn tại trên SQLite** nếu sau này có bản offline-first. Dùng `text` thường + luôn lưu giá trị đã `lower()` ở tầng ghi (repository), một quy tắc áp một chỗ.

### 10.3 Index và constraint tối thiểu

- Index `accounts(owner_id, archived_at, updated_at desc)`.
- Index `accounts(owner_id, platform, status)`.
- Unique partial index `owner_id + platform + normalized_username` khi username khác null và chưa archived.
- Index `account_metrics(account_id, recorded_at desc)`.
- Trigger `updated_at`; không trigger decrypt hoặc xử lý secret trong database public.
- **Bổ sung (DATA-04):** `alter publication supabase_realtime add table accounts, account_secrets;` — thiếu dòng này thì Realtime không lỗi gì cả, chỉ đơn giản là không có sự kiện nào tới. Dễ quên, dễ không phát hiện ra.

> **Đã bỏ (09/08/2026):** unique partial index và cron dọn job kẹt của `sync_jobs` — bảng đó không còn tồn tại.

---

## 11. Bảo mật và đồng bộ đa thiết bị

### 11.1 Hai lớp đăng nhập khác nhau

- Supabase account password/magic link: chứng minh quyền truy cập dữ liệu cloud.
- Master password: giải mã kho bí mật. Không gửi master password lên server và không dùng lại mật khẩu Supabase.

### 11.2 Quy trình tạo khóa

1. Sinh DEK ngẫu nhiên 32 byte trên thiết bị.
2. Từ master password + salt, dùng Argon2id sinh KEK với tham số được version hóa: `m=64 MiB, t=3, p=1`.
3. Dùng KEK bọc DEK; upload `wrapped_dek` + salt + kdf_params, không upload KEK/master password.
4. Mỗi secret payload dùng nonce riêng và **XChaCha20-Poly1305** *(chốt một thuật toán duy nhất, không để ngỏ "hoặc AES-GCM" — nonce 192-bit cho phép sinh ngẫu nhiên mà không lo trùng, tránh lớp lỗi nguy hiểm nhất của AES-GCM khi tự quản nonce)*.
5. DEK đã mở chỉ sống trong vùng bảo vệ cục bộ (`Zeroizing<[u8; 32]>` ở Rust) và bị xóa khi auto-lock/logout.

> **LẤP KHOẢNG TRỐNG (SEC-03/FR-17/FR-18 — Master Roadmap gốc chỉ có một ô tick "Recovery key hiển thị một lần; có luồng rotate master password" trong checklist §11.5, không mô tả cơ chế. Đây là luồng hậu quả cao nhất trong sản phẩm — mất master password không có recovery hợp lệ = mất vĩnh viễn mật khẩu của mọi tài khoản.)**
>
> **Recovery key là KEK thứ hai độc lập.** Sinh 32 byte ngẫu nhiên → mã hoá Base32 chia nhóm có ký tự kiểm tra → bọc **cùng một DEK**. `user_keyrings` có hai bản bọc: `wrapped_dek_by_master` và `wrapped_dek_by_recovery`. Mở được bằng một trong hai.
>
> **Đổi master password** = giải DEK bằng master cũ hoặc recovery → salt mới → KEK mới → bọc lại DEK → ghi đè `wrapped_dek_by_master`. **DEK không đổi**, nên không phải mã hoá lại `account_secrets`. Recovery key cũ vẫn hợp lệ sau khi đổi master — phải nói rõ cho người dùng, kèm nút "Sinh recovery key mới" nếu muốn vô hiệu hoá cái cũ.
>
> Onboarding (§4.2 bước 2): hiện recovery key **đúng một lần**, bắt buộc người dùng gõ lại một phần để xác nhận đã lưu (không cho bấm "Tôi đã lưu" suông), có nút tải `.txt`.

### 11.3 RLS policy pattern

Tất cả bảng thuộc người dùng có `owner_id = auth.uid()` cho SELECT/INSERT/UPDATE/DELETE. Storage avatar dùng path theo user id và policy tương tự.

> **Đã bỏ (09/08/2026):** phần bàn về RLS-không-giấu-được-cột (SEC-01) và khuôn mẫu IDOR cho Edge Function (DATA-07) — cả hai chỉ có ý nghĩa khi có bảng chứa token (`platform_connection_secrets`) hoặc Edge Function gọi service role. Không còn cái nào trong scope. Nếu về sau thêm bất kỳ Edge Function nào, viết lại khuôn mẫu xác minh sở hữu trước khi dùng service role — đây vẫn là nguyên tắc đúng, chỉ là hiện tại không có chỗ nào áp dụng nó.

### 11.4 Đồng bộ và xử lý xung đột

- Metadata dùng optimistic update + `updated_at`/version integer để phát hiện stale write.
- Nếu hai máy sửa cùng bản ghi, app không âm thầm last-write-wins cho secrets; hiển thị conflict dialog với thời điểm và device.
- Secrets thay đổi theo payload nguyên khối; mỗi update tăng `key_version`/`payload_version`.
- Realtime subscription cập nhật cache; khi reconnect thực hiện full delta fetch theo `updated_at`.
- Offline MVP: cho xem cache metadata; secrets chỉ mở nếu vault cục bộ còn hợp lệ.

> **SỬA (SEC-07 — conflict dialog không nên phơi giá trị bí mật).** Payload secrets là khối nguyên chứa 5 trường. Nếu conflict dialog hiện "cả hai phiên bản để chọn" theo nghĩa đen, nó phải giải mã và hiện cả 5 trường của cả hai máy cùng lúc — vi phạm nguyên tắc che mặc định (FR-05). Dialog chỉ nên hiện: thời điểm sửa, tên thiết bị, **danh sách tên trường đã đổi** (so sau khi giải mã cục bộ, chỉ so bằng không hiện giá trị). Ba lựa chọn: `Giữ bản máy này` · `Lấy bản máy kia` · `Xem chi tiết` (reveal có timeout, từng trường).
>
> **BỔ SUNG (DATA-04 — 3 chi tiết khiến "delta fetch theo updated_at" không hoạt động như mô tả nếu bỏ qua).** (a) `updated_at` dùng để so sánh phải là **giờ server** (trigger Postgres ghi bằng `now()`), không phải đồng hồ máy client — lệch giờ giữa hai máy sẽ làm bỏ sót bản ghi. (b) Delta fetch reconnect **không được lọc `deleted_at is null`** — nó cần nhận cả bản ghi đã xoá mềm để áp việc xoá vào cache cục bộ, nếu không xoá trên máy A sẽ không bao giờ tới máy B. (c) Thứ tự: delta fetch xong rồi mới bật lại Realtime subscription, để không bỏ sót sự kiện phát ra trong lúc offline (Realtime không tự bù khoảng mất kết nối).

### 11.5 Security checklist

- [ ] Không commit `.env`, Supabase secret/service key.
- [ ] Ẩn secrets khỏi logs, telemetry, error messages và DevTools production.
- [ ] Disable remote navigation và CSP chỉ cho origin cần thiết.
- [ ] Validate URL ở Rust trước khi opener thực thi *(mở rộng ở §4.4)*.
- [ ] Rate limit unlock attempts; tăng delay sau nhiều lần sai — **biện pháp chính vẫn là tham số Argon2id** (~0,3–0,5s mỗi lần thử), rate limit UI chỉ chống dò thủ công tại chỗ *(SEC-06)*.
- [ ] Recovery key hiển thị một lần; có luồng rotate master password *(cơ chế: §11.2)*.
- [ ] Backup database không đủ để giải mã secret nếu thiếu master/recovery key.
- [ ] Dependency audit cho npm/cargo trước release.
- [ ] Yêu cầu độ mạnh master password: tối thiểu 12 ký tự, chặn 100 mật khẩu phổ biến nhất *(SEC-06)*.

---

## 12. Roadmap 6 tuần

| Giai đoạn | Thời gian | Deliverable | Quality gate |
|---|---|---|---|
| 0. Foundation | 2–3 ngày | Repo, ADR, env, Supabase project, asset manifest, **khoá updater** | Build dev chạy Windows; không commit secret |
| 1. Design system | Tuần 1 | Tokens, components, Dashboard shell, Mochi mapping | Storybook/component states; keyboard focus |
| 2. Local core | Tuần 2–3 | CRUD, Account Card/Detail, vault, search/filter, **recovery key** | Secrets không xuất hiện trong log; unit tests pass; **AT-12 pass** |
| 3. Cloud sync | Tuần 4 | Auth, schema, RLS, Realtime, device sessions | Máy A/B sync; RLS negative tests pass |
| 4. Hardening | Tuần 5 | E2E, conflict, offline/reconnect, performance, a11y | Không còn P0 bug; 500-account test đạt |
| 5. Release | Tuần 6 | Installer, updater plan, docs, backup/recovery drill | Clean install Windows 10/11 **offline**; rollback có hướng dẫn |

> **Đã bỏ (09/08/2026):** giai đoạn "Meta integration" (2 tuần) và spike Meta ở Foundation — roadmap co từ 8 xuống 6 tuần vì đây là công việc thật sự cắt được, không phải hoãn.

### 12.1 Milestones

M1 — UI Prototype (mock data, brand hoàn chỉnh) · M2 — Local Alpha (CRUD + vault local) · M3 — Multi-device Beta (Auth/RLS/Realtime) · M4 — Release Candidate (installer + regression + recovery test).

### 12.2 Definition of Done chung

Có acceptance criteria và test tương ứng · loading/empty/error/permission states thiết kế đủ · không TypeScript `any` mới nếu không giải thích · migration có rollback/forward strategy · UI dùng được bằng bàn phím · security review cho mọi thay đổi chạm secret/RLS.

### 12.3 Backlog theo sprint

**Sprint 0** — ADR-001 (Tauri 2 thay Electron) · ADR-002 (XChaCha20-Poly1305 + tham số Argon2id, thay Stronghold) · pnpm workspace, lint, format, commit hooks, CI · `supabase link` project đã tạo + migration workflow (§13.1 — một project duy nhất) · **sinh khoá updater** · chuẩn hoá logo/Mochi asset manifest (chưa cần SVG thật).

**Sprint 1** — Sidebar/topbar/window state · AccountCard đủ states · Add/Edit form theo platform + Zod · Detail page không có secret thật.

**Sprint 2** — Argon2id + XChaCha20-Poly1305 setup (thay Stronghold) · **recovery key + rotate (FR-17, FR-18)** · encrypt/decrypt payload command · reveal/copy timeout · local cache không chứa plaintext · Open account qua allowlisted opener + Gmail authuser.

**Sprint 3** — Auth screens · migrations profiles/accounts/secrets/keyrings · RLS + negative test · optimistic CRUD + Realtime + device list/revoke · conflict detection.

**Sprint 4** — 500-account performance seed · E2E happy path + auth expired + network loss + conflict · accessibility + copywriting + Mochi states.

**Sprint 5** — Windows installer (**NSIS, `perMachine: false`, `webviewInstallMode: embedBootstrapper`** — xem §13.1), versioning, backup/recovery guide, **AT-12 diễn tập khôi phục trên VM sạch**.

---

## 13. Phát hành, vận hành và chi phí

### 13.1 Environments và packaging

- **Một project Supabase duy nhất, dùng chung dev và production** *(quyết định 09/08/2026 — app cá nhân một người dùng, không cần tách local/staging/production; đơn giản hơn không phải chạy Docker/`supabase start` nền liên tục)*. Project ref `nzcnojcnnfiqeujfhccx`. Migration chạy trực tiếp lên project này qua Supabase CLI (`supabase link` + `supabase db push`), không có bước "test trên local trước".
- Tạo NSIS hoặc MSI installer x64; app icon đúng chuẩn multi-resolution.
- Version theo Semantic Versioning; migration chạy có kiểm soát.
- Build qua GitHub Actions Windows runner; lưu checksum và release notes.
- Code signing nên có trước khi phân phối rộng; bản cá nhân có thể bắt đầu unsigned nhưng sẽ gặp cảnh báo SmartScreen.

> **BỔ SUNG (ARCH-06 — sự thật kỹ thuật về Tauri trên Windows, không phụ thuộc tài liệu nào).** Tauri chạy trên WebView2 runtime; Windows 11 có sẵn, nhiều bản Windows 10 thì không. Mặc định `webviewInstallMode: downloadBootstrapper` sẽ tải mạng lúc cài — máy không có mạng thì cài xong app không mở được. Chốt **`embedBootstrapper`** (+~1,5MB, không cần tải khi cài). Chọn **NSIS** với `perMachine: false` để cài theo user, không cần quyền admin.

### 13.2 Auto-updater

Auto-updater để sau khi quy trình signing/versioning ổn định; MVP cho tải bản mới thủ công. **Nhưng khoá ký sinh ở Sprint 0** — xem §9.3 ARCH-05.

### 13.3 Chi phí dự kiến

| Hạng mục | MVP cá nhân | Ghi chú |
|---|---|---|
| Tauri/React | Miễn phí | Open source |
| Supabase | Có thể bắt đầu Free | Theo dõi quota database, storage |
| Windows code signing | Có chi phí | Không bắt buộc cho prototype |
| Monitoring | Free tier ban đầu | Không gửi secrets/PII vào error tracking |

> **Đã bỏ (09/08/2026):** dòng "Meta API" và "Domain/privacy page" — cả hai chỉ cần thiết cho Meta App Review.

### 13.4 Backup & recovery

- Bật backup theo plan Supabase hiện có; kiểm tra phục hồi bằng môi trường staging.
- Metadata/ciphertext có thể backup; muốn giải mã vẫn cần master/recovery key.
- Có export encrypted backup định kỳ sau MVP; không mặc định export plaintext password.
- **AT-12 (diễn tập khôi phục) chạy lại trước mỗi bản phát hành có thay đổi chạm crypto hoặc schema**, không chỉ một lần.

---

## 14. Rủi ro, giới hạn và hướng phát triển

| Rủi ro | Tác động | Giảm thiểu |
|---|---|---|
| Mất master/recovery key | Không giải mã được secrets | Onboarding bắt buộc xác nhận đã lưu; **AT-12 là điều kiện thành công của bản 1.0** |
| Conflict nhiều máy | Ghi đè dữ liệu | row_version; conflict dialog không phơi giá trị; audit event |
| DB/RLS cấu hình sai | Rò dữ liệu | Migration review; negative tests; least privilege |
| Scope phình to | Không ship được | Giữ P0; dời auto-login/import/chart/team sang post-MVP |
| UI mascot quá nhiều | Mất tính chuyên nghiệp | Mochi chỉ ở onboarding/empty/status; không lặp trên từng card |
| Asset chưa đủ bộ | Chỉ có 1/8 tư thế Mochi, chưa có wordmark, chưa xuất app icon | §8.2 — hạng mục riêng, tiến độ tuỳ vào cách sinh 7 tư thế còn lại |

> **Đã bỏ (09/08/2026):** rủi ro "Meta API thay đổi/quyền bị từ chối", "Chi phí thiết lập Meta × N tài khoản", "Token provider bị lộ" — không còn Meta trong scope.

### 14.1 Post-MVP roadmap

v1.1 CSV/Excel import + follower chart 30/90 ngày · v1.2 browser profile mapping (không lưu cookie) · v1.3 TikTok/YouTube/X adapter (nếu quyết định làm follower tự động trở lại — thiết kế mới, không phải bật lại phần đã bỏ) · v1.4 encrypted export/import, tag automation · v2.0 team workspace (yêu cầu threat model mới).

### 14.2 Ý tưởng không nên làm sớm

Auto-login lưu cookie/session thô · scraping follower · AI features trước khi CRUD/vault/sync ổn định · team sharing trong khi mô hình khóa chỉ thiết kế cho một owner · dark mode nếu light mode/design tokens chưa hoàn chỉnh.

---

## 15. Kiểm thử và tiêu chí nghiệm thu

### 15.1 Test pyramid

| Tầng | Phạm vi | Ví dụ |
|---|---|---|
| Unit | Validation, URL builder, crypto wrapper, formatter | Không trim password; Gmail URL; follower null vs 0 |
| Component | Card, forms, vault UI | Keyboard, loading/error, long email/name |
| Integration | Supabase + RLS | User A không đọc được row user B |
| E2E desktop | Luồng thật | Sign in → unlock → create → sync máy B → open account |
| Security | Secrets, logging, permissions | Không plaintext trong DB/log/bundle; opener reject `file://` |
| Performance | Dữ liệu lớn | 500–2.000 accounts; search/filter/render |

> **BỔ SUNG (QA-08 — ngưỡng cụ thể, Master Roadmap gốc không có).** Unit ≥90% coverage cho `src/lib/**` và `src-tauri/src/security/**` · Integration 100% policy RLS có test âm tính · Security (AT-02, AT-08, AT-09, AT-12, AT-13) bắt buộc trước mỗi release · toàn bộ tầng CI chạy dưới 5 phút.

### 15.2 Acceptance test quan trọng

- **AT-01** — Tạo Facebook account với password chứa khoảng trắng/ký tự Unicode; đóng mở app; giải mã đúng 100%.
- **AT-02** — Trên DB chỉ thấy ciphertext/nonce; tìm toàn workspace/log không thấy sample password.
- **AT-03** — Tạo record trên PC A; PC B đang online nhận update trong ≤5 giây. *(QA-02: đo trung vị ≤2s, cao nhất ≤5s trên 10 lần chạy cho mỗi loại thao tác; kèm ca PC B đang mở Detail của đúng account đó.)*
- **AT-04** — PC B chưa mở vault vẫn xem metadata nhưng không đọc secret.
- **AT-08** — Nút Open account chỉ chấp nhận https/http đúng allowlist; `file://`, `javascript:`, `data:`, credential trong URL, host homograph đều bị chặn.
- **AT-09** — Copy password → clipboard được xóa sau timeout **và không xoá nếu người dùng đã copy thứ khác trong lúc đó**; UI che lại sau reveal timeout; banner Clipboard History hiện đúng một lần nếu bật.
- **AT-10** — 500 card không làm main interaction lag; dùng pagination/virtualization khi cần.
- **AT-11** *(mới, §7.6)* — Luồng đầy đủ chỉ bằng bàn phím; axe-core 0 lỗi `serious`/`critical`.
- **AT-12** *(mới, §11.2 — release blocker)* — Diễn tập khôi phục trên máy ảo sạch: tạo vault, lưu recovery key, tạo account có mật khẩu Unicode, xoá máy A, cài máy B, nhập recovery key, đặt master mới, giải mã đúng. Chạy lại trước mỗi release chạm crypto/schema.
- **AT-13** *(mới, §6.3)* — Reveal mật khẩu → `Win+L` → mở khoá Windows → vault ở trạng thái khoá, ô mật khẩu đã che.
- **AT-14** *(mới, §11.4)* — Máy B ngắt mạng; máy A tạo/sửa/xoá; máy B nối lại → khớp máy A trên cả ba thay đổi trong ≤10s.
- **AT-15…AT-25** *(mới, QA-01 — lấp các FR không có AT trong bản gốc)* — FR-04 sửa/archive/restore · FR-06 tìm kiếm không phân biệt dấu tiếng Việt · FR-09 follower nhập tay lưu đúng ngày cập nhật · FR-14 stat card khớp filter · FR-16 đăng xuất thiết bị khác · FR-01 session khôi phục.

> **Đã bỏ (09/08/2026):** AT-05, AT-06, AT-07 (đều kiểm follower sync qua Meta).

### 15.3 Release blocker

- Bất kỳ plaintext secret nào xuất hiện trong cloud DB, log hoặc crash report.
- RLS cho phép user khác đọc/sửa row không thuộc mình.
- Mất dữ liệu khi hai máy sync hoặc khi migration chạy.
- Open account có thể mở scheme nguy hiểm hoặc thực thi command.
- Follower hiển thị 0 thay vì "chưa nhập" khi ô trống *(BR-04)*.
- Installer bị Windows Defender cảnh báo do packaging/cấu hình bất thường chưa điều tra.
- **App không mở được sau khi cài offline trên Windows 10 sạch** *(mới, §13.1)*.
- **AT-12 (diễn tập khôi phục) chưa pass** *(mới, §1.2)*.
- **Vault không khoá khi khoá màn hình Windows** *(mới, §6.3)*.

---

## 16. Bàn giao cho AI coding agent

> **PROMPT KHỞI ĐỘNG** Hãy đọc toàn bộ `docs/SOURCE-OF-TRUTH.md` trước khi code. Xem đây là Source of Truth. Chỉ triển khai sprint được giao; không tự thêm auto-login, scraping, Meta OAuth hoặc team features. Mọi thay đổi schema phải có migration + RLS + test. Mọi thay đổi secret/opener phải có security review.

### 16.1 Context phải cung cấp cùng task

Sprint/milestone hiện tại và issue cụ thể · cấu trúc repo hiện tại, package versions, migration gần nhất · ảnh brand/logo/Mochi production assets (không chỉ brand board) · environment sample không chứa secret thật · acceptance criteria + test command + định nghĩa "done".

### 16.2 Guardrails cho coding agent

Không đổi stack hoặc database schema chỉ vì tiện code · **không tự thêm lại Meta OAuth/Edge Function/Cron dưới bất kỳ hình thức nào — đã bị bỏ khỏi scope, xem §0** · không trả service-role key/app secret về desktop · không log request body chứa secret/token · không thay logo/Mochi bằng emoji hoặc asset khác phong cách · không dùng màu ngoài token nếu không tạo named token mới · không merge khi lint/typecheck/test/security acceptance chưa pass.

### 16.3 Task template

```text
TASK: [Tên issue]
MILESTONE: [M1–M4]
SCOPE: [Một thay đổi có ranh giới rõ]
FILES/FEATURE: [Khu vực được phép chỉnh]
ACCEPTANCE CRITERIA: [FR-xx → AT-xx]
SECURITY CHECKS: [RLS / secrets / opener / none]
TEST COMMANDS: pnpm lint && pnpm typecheck && pnpm test
OUT OF SCOPE: [Liệt kê rõ]
DELIVERABLE: code + migration/test + cập nhật docs nếu có quyết định mới
```

---

## 17. Tài liệu tham khảo chính thức

[Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) · [Supabase Secure Data](https://supabase.com/docs/guides/database/secure-data) · [Supabase Vault](https://supabase.com/docs/guides/database/vault) · [Tauri Calling Rust from Frontend](https://v2.tauri.app/develop/calling-rust/) · [Tauri Windows Signing](https://v2.tauri.app/distribute/sign/windows/) · [Tauri Updater](https://v2.tauri.app/plugin/updater/)

---

## 18. Bắt đầu từ đâu

**Trạng thái:** repo mới, chưa có code. Rust và Supabase project đã sẵn sàng (09/08/2026).

1. ~~Cài Rust~~ ✅
2. ~~Tạo Supabase project~~ ✅ (project riêng cho PawPass)
3. Scaffold Tauri 2 + React + TS + Vite + Tailwind, pnpm workspace
4. Sinh **khoá updater** (§9.3 ARCH-05) và nhúng public key
5. Sinh nốt **7 tư thế Mochi còn lại** + wordmark "PawPass" (§8.2) như một hạng mục riêng
6. Bắt đầu Sprint 0 theo §12.3

---

**One Paw, Endless Access.**
*PawPass • Mochi • Your accounts. Always within paw's reach.*
