---
title: "PawPass — Source of Truth"
product_name: "PawPass"
mascot_name: "Mochi"
target_platform: "Windows desktop"
version: "4.1"
last_updated: "2026-08-09"
based_on: "Turtly_Master_Roadmap_Design_Specification.md v1.0 (08/08/2026)"
---

# PAWPASS — SOURCE OF TRUTH

**Desktop Account Manager • Windows • Facebook · Instagram · Google/Gmail**
Sản phẩm **PawPass** • Mascot **Mochi** • _One Paw, Endless Access._

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

> **v4.1 (09/08/2026) — lấp khoảng trống chặn Sprint 1–3.** Bản 4.0 đủ chi tiết để bắt đầu Sprint 0 nhưng còn 12 chỗ khiến Sprint 1–3 không code thẳng được: bảng màu thiếu status color và chưa đo tương phản (hoá ra **fail WCAG AA ở 5 chỗ, gồm cả nút chính**), §5.3/§7.4 còn sót hex của brand rùa cũ, schema payload bí mật chưa định nghĩa, format recovery key chưa chốt, thiếu cột `row_version` và tombstone cho xoá cứng, `account_secrets`/`account_metrics` thiếu `owner_id`, AT-15…AT-25 chưa đánh số. Tất cả đã được chốt trong bản này — xem §7.2, §7.7, §10.2, §11.2, §11.4, §11.6, §15.2. **Mọi giá trị màu trong §7.2 là số đo thật, không ước lượng.**

**Thứ tự ưu tiên:** file này → `REVIEW-2026-08-08.md` (để tra lý do một quyết định, lưu ý các phần liên quan Meta trong đó đã lỗi thời) → `Turtly_Master_Roadmap_Design_Specification.md` gốc (để so sánh, không dùng để lấy giá trị vì file này đã cập nhật).

---

## 1. Quyết định sản phẩm

| Hạng mục      | Quyết định                                                                                                  |
| ------------- | ----------------------------------------------------------------------------------------------------------- |
| Người dùng    | Một chủ sở hữu; có thể dùng nhiều máy Windows                                                               |
| Nền tảng MVP  | Facebook, Instagram, Google/Gmail                                                                           |
| Dữ liệu chính | Tên, username, email, mật khẩu tài khoản, mật khẩu email, follower, location, URL, trạng thái, ghi chú, tag |
| Follower      | **Nhập tay.** Hiển thị số đã ghi và ngày cập nhật gần nhất — không có đồng bộ tự động qua API               |
| Mở tài khoản  | Mở URL trong trình duyệt mặc định; không lưu cookie, không tự điền form đăng nhập                           |
| Cloud         | Supabase Auth + Postgres + Realtime — **từ ngày đầu**, không tách pha                                       |
| Desktop       | Tauri 2 + React + TypeScript; gói cài đặt Windows                                                           |
| Mã hoá        | Secret payload mã hoá trên máy; master password riêng với mật khẩu đăng nhập PawPass                        |
| Thời gian     | 6 tuần full-time hoặc 8–10 tuần bán thời gian                                                               |

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

### 1.3 Ưu tiên nếu thiếu thời gian _(dựa trên Master Roadmap §15.1, đã bỏ mục Meta)_

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

| Tình huống          | Nhu cầu                        | Kết quả mong muốn                                                        |
| ------------------- | ------------------------------ | ------------------------------------------------------------------------ |
| Tìm tài khoản       | Nhớ một phần tên/email         | Search ra card đúng trong ≤1 giây                                        |
| Kiểm tra follower   | Xem số đã ghi gần nhất         | Card hiển thị số và ngày mình cập nhật lần cuối — không giả vờ real-time |
| Đổi máy             | Đăng nhập PawPass trên PC khác | Metadata tải về; nhập master password để mở secrets                      |
| Mở tài khoản        | Đi đến profile hoặc Gmail      | Trình duyệt mở đúng URL; app không giả lập đăng nhập                     |
| Cập nhật credential | Đổi mật khẩu tài khoản/email   | Lưu phiên bản mới, không rò vào history/log                              |

---

## 3. Yêu cầu chức năng và quy tắc nghiệp vụ

### 3.1 Functional requirements P0

| ID        | Yêu cầu                                                                    | Tiêu chí chấp nhận                                                                | Nghiệm thu bởi             |
| --------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | -------------------------- |
| FR-01     | Đăng nhập PawPass                                                          | Email/password hoặc magic link; session khôi phục sau khi mở lại app              | AT-24                      |
| FR-02     | Mở kho bí mật                                                              | Nhập master password; sai không làm lộ thông tin hoặc log plaintext               | AT-01, AT-02               |
| FR-03     | Danh sách tài khoản                                                        | Grid card có avatar, platform, tên, username/email, follower, status, last update | AT-10, AT-21               |
| FR-04     | CRUD tài khoản                                                             | Tạo, xem, sửa, archive; validation theo platform                                  | AT-01, AT-15               |
| FR-05     | Xem/copy secrets                                                           | Mặc định che; reveal tạm thời; copy có thông báo và dọn clipboard                 | AT-09, AT-18               |
| FR-06     | Tìm kiếm/lọc                                                               | Theo tên, username, email, platform, status và tag                                | AT-16                      |
| FR-07     | Mở tài khoản                                                               | Chỉ mở URL http/https hợp lệ bằng trình duyệt mặc định                            | AT-08                      |
| FR-08     | Đồng bộ nhiều máy                                                          | Thay đổi metadata và ciphertext đồng bộ qua Supabase                              | AT-03, AT-14, AT-23, AT-26 |
| FR-09     | Follower nhập tay                                                          | Cho phép nhập tay, cập nhật, hoặc để trống; ghi rõ ngày cập nhật                  | AT-17                      |
| FR-10     | Auto-lock                                                                  | Khóa kho sau thời gian không hoạt động hoặc khi người dùng khóa thủ công          | AT-13, AT-22               |
| **FR-17** | **Recovery key** _(mới — lấp khoảng trống của §11.5 checklist, xem §11.2)_ | Sinh khi tạo vault, hiện đúng một lần, bắt buộc xác nhận đã lưu, tải `.txt` được  | AT-12                      |
| **FR-18** | **Đổi master password** _(mới, cùng lý do)_                                | Cần master hiện tại hoặc recovery key; không mã hoá lại toàn bộ secrets           | AT-12, AT-20               |

### 3.2 Functional requirements P1

- **FR-13** — Lịch sử các lần cập nhật follower (thủ công) dạng danh sách; chart để post-MVP nếu cần.
- **FR-14** — Dashboard summary: tổng tài khoản, active, cần kiểm tra.
- **FR-15** — Mochi empty/error/success states theo mascot system.
- **FR-16** — Device list và nút đăng xuất các session khác.

> **Nghiệm thu bởi (QA-01 — Master Roadmap gốc có 16 FR và 10 AT nhưng không ánh xạ; đối chiếu tay lộ ra 8 FR không AT nào phủ).** FR-13: (chưa có AT — chart để post-MVP nên chấp nhận được) · FR-14: AT-19 · FR-15: (không có AT — trạng thái mascot phủ bởi AT-11 a11y và review thị giác) · FR-16: AT-25. Luật áp cho mọi FR mới thêm sau này: **một FR không có AT thì không được đánh dấu hoàn thành.**
>
> _v4.1: AT-15…AT-25 giờ đã được đánh số và mô tả riêng từng cái ở §15.2 — trước đó 11 ID chỉ có 6 mô tả gộp một dòng, nên luật trên không thể áp được._
>
> **Đã bỏ (09/08/2026):** FR-11 (OAuth Meta và follower sync tự động), FR-12 (nút "Đồng bộ ngay"/"Sync all" có cooldown) — xem §0. Số ID không tái sử dụng để lịch sử quyết định còn tra được.

### 3.3 Quy tắc nghiệp vụ

- **BR-01** — Mỗi account thuộc đúng một owner_id; mọi query client phải bị giới hạn bởi `auth.uid()`.
- **BR-02** — Một record được xem là trùng khi cùng owner + platform + normalized username; email trùng chỉ cảnh báo, không chặn.
- **BR-03** — Archive là mặc định thay cho delete cứng; xóa vĩnh viễn yêu cầu xác nhận lại.
- **BR-04** — Follower count phải là số nguyên ≥0 hoặc null; không dùng 0 để biểu diễn "chưa nhập".
- **BR-05** — Trường secrets được ghi trong một encrypted payload có version để hỗ trợ đổi thuật toán/migration.
- **BR-06** — Nút mở tài khoản bị vô hiệu hóa nếu URL không hợp lệ; URL do platform template sinh ra được ưu tiên.
- **BR-07** _(trước là BR-09 — DATA-03, cần một quy tắc chuẩn hoá rõ ràng vì §10.2 chỉ ghi chú "normalized_username để unique mềm" mà không định nghĩa)_ — Chuẩn hoá username = bỏ ký tự `@` đầu, `lower()`, `trim()`. Áp dụng ở đúng một tầng (repository), không lặp lại logic ở nhiều nơi.

> **Đã bỏ (09/08/2026):** BR-07 cũ (không chạy song song sync job — gắn với `sync_jobs`), BR-08 cũ (token hết hạn chuyển `reauth_required`) — cả hai chỉ tồn tại vì Meta OAuth. Xem §0.

---

## 4. Luồng người dùng và cấu trúc màn hình

### 4.1 Information architecture

| Khu vực   | Màn hình           | Chức năng                                         |
| --------- | ------------------ | ------------------------------------------------- |
| Workspace | Dashboard          | Tổng quan, quick filters, account grid            |
| Accounts  | All Accounts       | Tìm kiếm, lọc, sort, grid/list view               |
| Accounts  | Account Detail     | Thông tin, secrets, follower history, notes       |
| Actions   | Add / Edit Account | Form theo platform; validation và preview card    |
| System    | Settings           | Profile, security, auto-lock, devices, appearance |

> **Đã bỏ:** màn hình "Sync Center" (job gần đây, kết nối lại OAuth) — không còn job hay OAuth nào để theo dõi.

### 4.2 Luồng onboarding lần đầu

1. Mở app → màn hình Mochi Wave → đăng nhập hoặc tạo tài khoản PawPass.
2. Tạo master password → hệ thống tạo recovery key một lần → yêu cầu lưu ra nơi an toàn _(cơ chế cụ thể ở §11.2)_.
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

| Vùng         | Kích thước/Quy tắc              | Nội dung                                        |
| ------------ | ------------------------------- | ----------------------------------------------- |
| App window   | Min 1180×720; mặc định 1440×900 | Không ép full-screen; ghi nhớ kích thước/cửa sổ |
| Sidebar      | 240 px; có collapsed 76 px      | Logo, Dashboard, Accounts, Settings             |
| Topbar       | 72 px                           | Tiêu đề, search toàn cục, Add account, avatar   |
| Content      | Padding 28–32 px                | Summary cards → filter bar → account grid       |
| Account grid | Min card 340 px; gap 20 px      | 3 cột ở 1440 px, 2 cột khi cửa sổ hẹp           |

### 5.2 Dashboard composition

- Header: "Chào buổi tối, Tiến" + Mochi **Neutral** nhỏ, không chiếm quá 88 px chiều cao _(tiếng Việt — xem §7.7)_.
- Summary: Total Accounts, Active, Needs Attention; card số liệu cao 104–116 px.
- Search/filter: search 360 px, platform segmented control, status dropdown, sort dropdown.
- Account grid: ưu tiên card có mật độ vừa; không đưa password ra Dashboard.
- Empty state: Mochi Search + CTA "Thêm tài khoản đầu tiên".

> **SỬA (UX-05 — Master Roadmap tự mâu thuẫn với chính mình).** §6.2 gốc ghi "Mochi Wave nhỏ" ở header Dashboard, nhưng bảng §9.2 "Quy tắc sử dụng mascot" (cũng của Master Roadmap) định nghĩa `Wave → Onboarding, welcome back` và `Neutral → Dashboard greeting`. Đây không phải hai tài liệu khác nhau — cùng một file tự nói ngược nhau. Bảng §9.2 thắng vì nó là bảng quy tắc, còn §6.2 là mô tả. Header Dashboard dùng **Mochi Neutral**, không phải Wave.
>
> **Đã bỏ (09/08/2026):** stat card "Sync Errors" — không còn tác vụ tự động nào có thể lỗi.

### 5.3 Account Card — mẫu tham chiếu

| Thành phần     | Đặc tả đề xuất                                                                           |
| -------------- | ---------------------------------------------------------------------------------------- |
| Container      | 340–380 px; padding 18 px; radius 18 px; border 1 px `Border`; shadow Elevation 2 (§7.4) |
| Platform badge | 32 px, chồng góc avatar; icon chính thức, có accessible label                            |
| Avatar         | 88×88 px; radius 18 px; object-fit cover; fallback initials                              |
| Identity       | Display name 16 px/700; username 13 px; email 13 px muted; ellipsis + tooltip            |
| Status         | Pill Active/Review/Inactive/Locked; không chỉ dùng màu để truyền đạt                     |
| Follower       | Icon 16 px + compact number; kèm ngày cập nhật trong tooltip/detail                      |
| Update row     | Divider; "Đã cập nhật 8 ngày trước" hoặc "Chưa cập nhật follower"                        |
| Actions        | Secondary "Cập nhật follower"; Primary-outline "Mở tài khoản"; min height 42 px          |

> **Đã bỏ (09/08/2026):** nút "Đồng bộ" (đã đổi thành "Cập nhật follower" — mở form nhập tay tại chỗ, không gọi API nào).

### 5.4 Các trạng thái card

Token màu ở **§7.2.2** — mỗi trạng thái có bộ `-bg` / `-text` / `-solid` đã đo AA. Không tự chọn hex ở đây.

| Trạng thái | Token (§7.2.2)                  | Icon        | Hành vi                                                 |
| ---------- | ------------------------------- | ----------- | ------------------------------------------------------- |
| Active     | Active / Success                | check       | Mọi hành động khả dụng                                  |
| Review     | Review / Warning                | cờ          | Cần người dùng xem lại thông tin tài khoản              |
| Inactive   | Inactive / Neutral              | chấm rỗng   | Tài khoản không dùng thường xuyên, vẫn đầy đủ chức năng |
| Locked     | Locked / Danger                 | ổ khoá      | Người dùng tự khoá tài khoản này khỏi thao tác nhanh    |
| Archived   | Inactive / Neutral, opacity 60% | hộp lưu trữ | Ẩn mặc định khỏi Dashboard; có Restore                  |

> **Đã bỏ (09/08/2026):** trạng thái "Manual" (mọi tài khoản giờ đều là nhập tay, không còn gì để phân biệt), "Syncing" và "Needs re-auth" (chỉ tồn tại vì OAuth).
>
> **ĐÁNG CÂN NHẮC, không phải mặc định (UX-01 — quan sát, để lại làm ghi chú).** Container 340–380px + avatar 88px + 2 nút ngang hàng đẩy card khá cao; với mục tiêu 500+ account (§1.2) đó là nhiều lần cuộn hơn. Nếu muốn thử nghiệm, có thể rút avatar xuống 40–48px và gộp "Cập nhật follower" vào menu `⋯`, chỉ giữ "Mở tài khoản" làm nút chính. **Đây là gợi ý, không phải yêu cầu — giữ đặc tả gốc ở trên làm mặc định** trừ khi có ý kiến khác.

---

## 6. Trang chi tiết tài khoản

### 6.1 Bố cục

Trang chi tiết dùng layout 2 cột: cột chính 65% cho identity, follower và notes; cột phụ 35% cho credential vault và quick actions. Ở cửa sổ hẹp, cột phụ xuống dưới. Header trang giữ avatar, platform, tên, status và các nút Edit / Open account / More.

### 6.2 Nhóm dữ liệu hiển thị

| Nhóm     | Trường                                                     | Bảo vệ/hiển thị                           |
| -------- | ---------------------------------------------------------- | ----------------------------------------- |
| Identity | Display name, username, avatar, platform, profile URL      | Hiển thị bình thường                      |
| Contact  | Login email, recovery email, phone, location               | Email copy được; phone tùy chọn           |
| Secrets  | Account password, email password, recovery codes, 2FA note | Che mặc định; reveal/copy có timeout      |
| Metrics  | Follower hiện tại, ngày cập nhật, lịch sử                  | Không dùng 0 thay null                    |
| Metadata | Tags, status, notes, created/updated, device cuối sửa      | Notes hỗ trợ plain text; không HTML tùy ý |

> **Đã bỏ (09/08/2026):** nhóm "Connection" (OAuth status, scopes, token expiry) — không còn OAuth nào để hiển thị trạng thái.
>
> **LƯU Ý RIÊNG TƯ, không phải cấm (SEC-02 — mềm hơn bản trước vì lý lẽ mạnh nhất từng dùng lấy từ một tài liệu khác đã bị bỏ).** `notes` là cột text thường trên Supabase (§10.2) — plaintext trên cloud, không mã hoá. Đây là lựa chọn hợp lý cho ghi chú thông thường (tag, ngữ cảnh). Nhưng vì đây là field tự do, người dùng có thể vô tình gõ vào đó thông tin nhạy (số điện thoại khôi phục, gợi ý bảo mật). **Khuyến nghị:** thêm một dòng gợi ý nhỏ dưới ô notes trong UI — _"Không nên ghi số điện thoại khôi phục hay câu hỏi bảo mật vào đây — trường này không mã hoá."_ Không cần đổi schema.

### 6.3 Credential Vault interaction

- Khối secrets có trạng thái Locked/Unlocked độc lập với phiên đăng nhập cloud.
- Nhấn Reveal yêu cầu app vault đang unlocked; sau 15 giây tự che lại.
- Nhấn Copy hiển thị toast "Đã sao chép — clipboard sẽ được xóa sau 30 giây".
- Không cho chụp màn hình là tính năng best-effort, không xem đó là biện pháp bảo mật chính.
- Edit secret tạo `updated_at` và audit event nhưng không lưu plaintext cũ.
- Auto-lock mặc định 10 phút; tùy chọn 1/5/10/30 phút hoặc khi app minimize.

> **SỬA — lời hứa clipboard không giữ được nguyên văn trên Windows (SEC-04, sự thật về Windows, không phụ thuộc tài liệu nào).** Windows Clipboard History (`Win+V`) giữ một bản sao riêng mà việc xoá clipboard của app **không** động tới. Toast không nên hứa "clipboard sẽ được xóa" như một đảm bảo tuyệt đối — đổi thành _"Đã sao chép — PawPass sẽ xoá sau 30 giây"_. Trước khi xoá, **so sánh nội dung hiện tại**: chỉ xoá nếu vẫn đúng là thứ PawPass đã ghi, để không xoá mất thứ người dùng vừa copy sau đó. Nếu phát hiện Clipboard History đang bật (đọc registry `HKCU\Software\Microsoft\Clipboard\EnableClipboardHistory`), hiện một banner cảnh báo **đúng một lần** trong Settings.
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
>
> **ĐÃ ĐO TƯƠNG PHẢN (v4.1) — TODO cũ đã đóng.** Mọi số ở cột "Tỷ lệ" là kết quả tính WCAG 2.x thật (công thức luminance tương đối), không ước lượng bằng mắt. **Bảng 4.0 fail AA ở 5 chỗ** — đáng chú ý nhất: chữ trắng trên nút `Fur Orange` chỉ đạt **3.26** (cần 4.5), tức nút chính của app không dùng được chữ trắng. Cách sửa nằm ở §7.2.1.

#### Token nền tảng _(sample từ ảnh, không đổi giá trị)_

| Token             | Hex           | Vai trò                                                        | Tỷ lệ trên Surface         |
| ----------------- | ------------- | -------------------------------------------------------------- | -------------------------- |
| Fur Orange        | `#E46C00`     | Brand primary — **chỉ dùng làm nền/mảng lớn**, không làm chữ   | 3.02 ❌ chữ                |
| Shield Navy       | `#000C24`     | Text chính, app icon background, dark mode surface, viền khiên | 18.05 ✅                   |
| Muzzle Cream      | `#FCE4C0`     | Tint, nền nhạt, illustration                                   | — (nền)                    |
| Outline Black     | `#000000`     | Viền nét vẽ mascot/logomark — **không** dùng cho text          | —                          |
| Surface           | `#F8F6F2`     | Nền app                                                        | — (nền gốc)                |
| Border            | `#E8DFD0`     | Divider và viền **trang trí** (card, section)                  | 1.22 — hợp lệ, xem ghi chú |
| **Border Strong** | **`#9A8A70`** | Viền **điều khiển** (input, select, checkbox, combobox)        | **3.12 ✅**                |

> **Vì sao có hai token border.** WCAG 2.2 §1.4.11 (Non-text Contrast) yêu cầu **≥3:1** cho ranh giới nào _cần thiết để nhận ra một điều khiển_. `#E8DFD0` chỉ đạt **1.22** — dùng cho viền input thì người thị lực kém không thấy ô nhập ở đâu. Nhưng viền card/divider là **trang trí thuần** (card đã tự phân tách bằng nền + shadow), nên 1.22 ở đó không vi phạm gì. Quy tắc: **thứ gì bấm/gõ được thì dùng `Border Strong`; thứ gì chỉ để chia vùng thì dùng `Border`.**

#### §7.2.1 Token dẫn xuất cho chữ _(mới — bắt buộc)_

Fur Orange và các accent **không đạt AA khi làm chữ**. Mỗi màu có một biến thể `-text` đậm hơn, đo sẵn:

| Token                | Hex       | Dùng cho                               | Trên Surface | Chữ trắng trên nó |
| -------------------- | --------- | -------------------------------------- | ------------ | ----------------- |
| `--fur-orange`       | `#E46C00` | Nền nút chính, sidebar, mảng brand     | 3.02         | 3.26 ❌           |
| `--fur-orange-hover` | `#CD6100` | Hover nút chính                        | 3.67         | 3.96 ❌           |
| `--fur-orange-text`  | `#AB5100` | Link, chữ nhấn màu brand trên nền sáng | **4.98 ✅**  | 5.37 ✅           |

> **CHỐT — nút chính dùng chữ Shield Navy, không dùng chữ trắng.**
> `Shield Navy #000C24` trên `Fur Orange #E46C00` = **5.98 ✅**; trên hover `#CD6100` = **4.92 ✅**. Đây cũng là cặp màu đúng brand nhất (khiên navy trên lông cam của Mochi).
> Trạng thái pressed **không** làm nền tối thêm (xuống `#AB5100` thì navy chỉ còn 3.63 ❌) — thay bằng bỏ shadow + dịch 1px.

#### §7.2.2 Status color _(mới — bản 4.0 hoàn toàn không có bảng này)_

§5.4 yêu cầu Active/Review/Inactive/Locked nhưng bản 4.0 chỉ ghi tên màu ("Green", "Amber") mà không có hex nào. Bảng dưới lấp chỗ đó. Mỗi trạng thái có **3 giá trị**: nền pill, chữ trên pill, và màu icon/viền đặc.

| Trạng thái         | `-bg` (nền pill) | `-text` (chữ + icon) | Tỷ lệ text/bg | `-solid` (chấm, viền) | Solid trên Surface       |
| ------------------ | ---------------- | -------------------- | ------------- | --------------------- | ------------------------ |
| Active / Success   | `#DFF3E7`        | `#116039`            | **6.57 ✅**   | `#1F9254`             | 3.67 ✅ (non-text)       |
| Review / Warning   | `#FDF0D2`        | `#7A5200`            | **6.12 ✅**   | `#F2A81E`             | 1.87 — chỉ dùng kèm viền |
| Inactive / Neutral | `#ECEEF2`        | `#4A5364`            | **6.66 ✅**   | `#8A93A3`             | 2.87 ✅ (non-text)       |
| Locked / Danger    | `#FBE2E0`        | `#B3271A`            | **5.29 ✅**   | `#B3271A`             | 6.04 ✅                  |
| Info               | `#DEEAFB`        | `#1C56B6`            | **5.65 ✅**   | `#246CE4`             | 4.48 ✅                  |

**`Danger` đổi từ `#F05448` sang `#B3271A`.** Hai lý do cùng lúc: (1) `#F05448` làm chữ chỉ đạt **3.21 ❌**, không dùng được cho thông báo lỗi mà §7.6 bắt buộc phải là icon **+ chữ**; (2) nó trùng đúng giá trị `Account Coral`. Đổi Danger giải quyết cả hai — `Account Coral` là màu sample thật từ logo nên giữ nguyên, còn Danger vốn là màu chức năng, đổi tự do.

`Review/Warning -solid #F2A81E` gần với `Fur Orange` về sắc độ. Không sao, vì §7.6 cấm truyền đạt trạng thái **chỉ bằng màu** — pill Review luôn có icon cờ + chữ "Cần xem lại". Không bao giờ dùng chấm vàng trần.

#### §7.2.3 Accent nền tảng

**Ba màu thẻ tài khoản** (từ 3 card phía sau đầu Mochi trong ảnh gốc) — accent phân loại nền tảng. Dùng làm **nền badge/viền trái card**, không dùng làm chữ:

| Token         | Hex       | Nền tảng         | Ghi chú                                    |
| ------------- | --------- | ---------------- | ------------------------------------------ |
| Account Blue  | `#246CE4` | **Facebook**     | Trùng hệ màu thương hiệu Facebook, dễ nhận |
| Account Pink  | `#D8186C` | **Instagram**    | Gần dải hồng/tím của Instagram             |
| Account Coral | `#F05448` | **Google/Gmail** | Gmail có sắc đỏ; coral là biến thể mềm hơn |

Badge nền tảng **luôn có icon chính thức của nền tảng** (§5.3), nên màu chỉ là lớp nhận diện phụ — không phải thứ duy nhất phân biệt Facebook với Instagram.

Trạng thái luôn là **icon + chữ**, không chỉ dựa vào màu (§7.6) — quy tắc này **không đổi**.

> **Quy tắc bắt buộc khi code.** Mọi giá trị trên nằm trong `src/styles/tokens.css` dưới dạng CSS custom property. Trong component **không được viết hex trực tiếp**. Thiếu màu → thêm token có tên + đo tương phản + ghi vào bảng này trước, rồi mới dùng.

### 7.3 Typography

| Vai trò             | Font              | Style                                             |
| ------------------- | ----------------- | ------------------------------------------------- |
| Logo/brand headline | Nunito Sans       | Bold / ExtraBold, tròn và thân thiện              |
| UI/body/data        | Inter             | Regular / Medium / Semibold                       |
| Fallback            | Arial / system-ui | Khi font chưa tải hoặc trên renderer hệ thống     |
| Numeric metrics     | Inter             | Tabular numbers để follower không nhảy chiều rộng |

### 7.4 Spacing, radius và elevation

- Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40 px.
- Radius: input/button 10–12 px; card 16–18 px; modal 20–24 px; pill 999 px.
- Border: 1 px — `Border` cho divider/card, `Border Strong` cho input/điều khiển (§7.2).
- Focus ring: 3 px `rgba(228,108,0,.45)` _(dẫn xuất Fur Orange)_, offset 2 px. Trên nền cam đặc thì đổi sang `rgba(0,12,36,.55)` để còn thấy.
- Elevation 1: `0 2 8 rgba(0,12,36,.06)`; Elevation 2: `0 8 24 rgba(0,12,36,.10)`.
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

### 7.7 Ngôn ngữ giao diện _(mới v4.1 — bản 4.0 lẫn hai thứ tiếng)_

**Toàn bộ UI là tiếng Việt.** Bản 4.0 tự mâu thuẫn: §5.2 ghi header `"Good evening, Tiến"` (tiếng Anh) trong khi §5.3 ghi `"Đã cập nhật 8 ngày trước"` (tiếng Việt). PawPass là app một người dùng, người dùng đó nói tiếng Việt — chọn tiếng Việt, không làm i18n trong MVP.

| Hạng mục           | Quy tắc                                                                                     |
| ------------------ | ------------------------------------------------------------------------------------------- |
| Chuỗi UI           | Tiếng Việt, có dấu đầy đủ                                                                   |
| Tên riêng kỹ thuật | Giữ nguyên: Facebook, Instagram, Gmail, Supabase, master password, recovery key             |
| Ngày/giờ           | `dd/MM/yyyy`, giờ 24h; định dạng tương đối tiếng Việt ("8 ngày trước", "vừa xong")          |
| Số                 | Dấu chấm ngăn nghìn (`1.234.567`); follower rút gọn `1,2K` / `3,4M`                         |
| Chuỗi trong code   | Không hardcode rải rác — gom vào `src/lib/strings.ts` để sau này bật i18n không phải đi tìm |
| Log/lỗi kỹ thuật   | Tiếng Anh (dành cho dev), **không** hiện nguyên văn cho người dùng                          |

Không dùng thư viện i18n trong MVP — gom chuỗi một chỗ là đủ để sau này thêm mà không phải viết lại.

---

## 8. Logo và mascot Mochi

> **ĐỔI MASCOT (09/08/2026).** Brand cũ là con rùa Tully; 22 file PNG của brand đó **đã xoá khỏi repo** (09/08/2026) — không còn liên quan tới bất cứ việc gì. Cần tra lại thì xem lịch sử git tại commit `8b77c31`, đừng khôi phục vào working tree. Mascot chính thức từ nay là **Mochi**, một chú Shiba Inu, dựa trên `docs/brand-reference/mochi-logo.png`.

Các hình trong `docs/brand-reference/` là tài sản định hướng, **chưa phải asset production** (trừ khi ghi rõ khác ở §8.2).

### 8.1 Mascot system

Mochi có 8 trạng thái: Neutral, Wave, Search, Security, Sync, Offline, Success, Import.

| State    | Dùng tại                                     | Không dùng                   |
| -------- | -------------------------------------------- | ---------------------------- |
| Neutral  | Dashboard greeting, About                    | Lặp lại trên mọi card        |
| Wave     | Onboarding, welcome back                     | Error hoặc security warning  |
| Search   | Empty search, no result                      | Loading                      |
| Security | Create master password, vault locked         | Success toast nhỏ            |
| Sync     | Đồng bộ dữ liệu giữa các máy, background job | Khi mất kết nối hoàn toàn    |
| Offline  | No network, paused sync                      | Lỗi credentials              |
| Success  | Create/import/sync thành công                | Hiển thị liên tục sau action |
| Import   | Post-MVP CSV/Excel import                    | MVP nếu chưa có import       |

### 8.2 Asset — trạng thái thật _(đo trực tiếp trên file ảnh, độc lập với mọi tài liệu)_

`mochi-logo.png` đã giải nén và đọc pixel trực tiếp — **khác hẳn kết quả của 22 file rùa cũ**, phần lớn đạt chuẩn kỹ thuật:

| Chỉ số                               | Kết quả                           | Đạt chuẩn production?                                                |
| ------------------------------------ | --------------------------------- | -------------------------------------------------------------------- |
| Kích thước                           | 1254×1254 px                      | ✅ đủ cho app icon 256×256 và hero display                           |
| Kênh alpha                           | Có (RGBA, colortype 6)            | ✅                                                                   |
| Pixel trong suốt hoàn toàn           | 48,4%                             | ✅                                                                   |
| Pixel viền lưng chừng (khử răng cưa) | chỉ 0,3% — rất sạch               | ✅ không có viền rác                                                 |
| Định dạng                            | **Raster PNG**, không phải vector | ⚠️ đủ dùng cho icon/hero tĩnh, **không co giãn vô hạn được** như SVG |
| Số tư thế có sẵn                     | **1** (tư thế chào/neutral)       | ⚠️ **đã lỗi thời — xem §8.3**                                        |
| Wordmark "PawPass"                   | Không có trong ảnh                | ⚠️ **đã lỗi thời — xem §8.3**                                        |

### 8.3 Asset đã bổ sung 09/08/2026 _(mới v4.1 — bảng §8.2 đo trước khi có bộ ảnh này)_

Đã thêm 4 nhóm file vào `docs/brand-reference/`. Số liệu dưới đây **đo trực tiếp trên file**, cùng phương pháp §8.2:

| File                            | Kích thước | Alpha                   | Trong suốt | Ghi chú                                                           |
| ------------------------------- | ---------- | ----------------------- | ---------- | ----------------------------------------------------------------- |
| `pawpass-app-logo.png`          | 1254²      | **KHÔNG** (colortype 2) | —          | Nền navy đặc, bo góc squircle                                     |
| `pawpass-logo-with-name.png`    | 1254²      | ✅ RGBA                 | 60,0%      | Logomark **+ wordmark** dựng sẵn                                  |
| `pawpass.png`                   | 1254²      | ✅ RGBA                 | 48,4%      | **Trùng byte với `mochi-logo.png`** (cùng MD5) — xoá một cái được |
| `pawpass-shiba-genz-cute-pack/` | 1254² × 7  | ✅ RGBA                 | 55–62%     | 7 tư thế toàn thân, phong cách sticker                            |

**Ánh xạ 8 trạng thái §8.1 — còn thiếu 2, không phải 7:**

| State       | Asset                           |                           |
| ----------- | ------------------------------- | ------------------------- |
| Neutral     | `03-organize-accounts-genz.png` | ✅                        |
| Wave        | `01-wave-genz.png`              | ✅                        |
| Search      | `04-search-genz.png`            | ✅                        |
| Security    | `02-security-genz.png`          | ✅                        |
| Success     | `06-success-genz.png`           | ✅                        |
| **Sync**    | —                               | ❌ **còn thiếu**          |
| **Offline** | —                               | ❌ **còn thiếu**          |
| Import      | —                               | post-MVP (§8.1), chưa cần |

Dư ra `05-notification-genz.png` và `07-support-genz.png` — chưa state nào trong §8.1 dùng tới. Không ép gán; để dành cho toast nhắc cập nhật follower và màn hình trợ giúp nếu sau này cần.

**Bốn lưu ý kỹ thuật, đều là thứ đo được:**

1. **Dùng `03-organize-accounts` làm Neutral, không dùng `mochi-logo.png`.** Cả 7 ảnh trong pack là **toàn thân**, còn `mochi-logo.png` là **chân dung đầu**. Trộn hai định dạng trong cùng một component `MochiIllustration` sẽ làm mascot lúc to lúc nhỏ giữa các màn hình. `mochi-logo.png` vẫn là logomark chính thức (sidebar, app icon, About) — chỉ là không nằm trong bộ minh hoạ.
2. **Keyline trắng của phong cách sticker sẽ tàng hình trên `Surface #F8F6F2`.** Nền app gần như trắng. Hoặc đặt mascot trên khối nền tint `Muzzle Cream`, hoặc xuất lại bản không keyline. Quyết ở Sprint 1 lúc dựng `MochiIllustration`.
3. **`pawpass-app-logo.png` không có kênh alpha và nền là navy, không phải cam.** §7.2 bản 4.0 ghi "Fur Orange — app icon background"; ảnh thật thì ngược lại. **Ảnh thắng** — nó là asset đã dựng và navy làm nền icon tương phản tốt hơn với bộ lông cam của Mochi. §7.2 đã sửa theo.
4. **Wordmark đã có nhưng vẽ chung vào ảnh raster** — đúng thứ mục 2 dưới đây dặn không nên làm. Dùng được cho splash/About/README ở cỡ lớn; **không** dùng cho sidebar hay chỗ nào dưới ~200px vì không kern lại và không đổi cỡ sạch được. Dựng lại bằng font thật vẫn còn trong danh sách việc.

**Việc còn thiếu trước khi coi là production-ready:**

1. **2 tư thế còn lại (Sync, Offline).** Dùng một ảnh trong pack làm character reference (img2img) để giữ đúng tỷ lệ đầu/mắt/tai — sinh rời từng cái bằng prompt độc lập là đúng cái đã hỏng với 22 file rùa cũ.
2. **Wordmark dạng vector/text thật** — dựng bằng Nunito Sans ExtraBold (§7.3), tách khỏi ảnh mascot.
3. **App icon multi-resolution** — xuất `.ico` các cỡ 16/24/32/48/64/128/256, kiểm riêng bản 16px xem còn nhận ra không (mắt/mũi Mochi khá chi tiết, có thể vỡ ở cỡ rất nhỏ — chưa kiểm tra).
4. **Không có bản outline/mono** — cần cho system tray hoặc chỗ chỉ nhận icon đơn sắc.

**Cho tới khi có Sync và Offline:** dùng tạm `05-notification` cho Sync và `07-support` cho Offline — cùng phong cách, cùng nhân vật, tốt hơn hẳn placeholder hình học. Không trộn phong cách rùa cũ vào bất kỳ đâu.

---

## 9. Kiến trúc kỹ thuật

### 9.1 Technology stack

| Layer             | Công nghệ                                                             | Lý do                                                        |
| ----------------- | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| Desktop shell     | Tauri 2 + Rust stable                                                 | Bundle nhẹ; permission allowlist; gọi native command rõ ràng |
| Frontend          | React + TypeScript + Vite                                             | Hệ sinh thái mạnh, component hóa                             |
| UI                | Tailwind CSS + Radix/shadcn primitives tùy biến                       | Nhanh nhưng vẫn giữ brand PawPass                            |
| State/data        | TanStack Query + Zustand                                              | Tách server cache và local UI state                          |
| Forms             | React Hook Form + Zod                                                 | Validation type-safe                                         |
| Cloud             | Supabase Auth/Postgres/Realtime                                       | Đủ cho một người dùng nhiều máy                              |
| **Local secrets** | **Argon2id + XChaCha20-Poly1305 + zeroize (Rust)** _(sửa — xem dưới)_ | Kho khóa cục bộ tự triển khai                                |
| Testing           | Vitest, Testing Library, Playwright + tauri-driver                    | Unit, component, desktop smoke test                          |

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

| Permission                                                                                                            | Lý do                                                            |
| --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `core:default`                                                                                                        | Tối thiểu để chạy                                                |
| `opener:allow-open-url` có scope `https://*.facebook.com/*`, `https://*.instagram.com/*`, `https://mail.google.com/*` | FR-07, scope ở tầng capability chứ không chỉ validate trong Rust |
| `clipboard-manager:allow-write-text`                                                                                  | FR-05 copy. **Không** cấp `read-text`                            |
| `updater:default`                                                                                                     | Xem §13.2                                                        |
| `shell:*`, `fs:*` rộng, `http:*`                                                                                      | **Không cấp** — không tính năng nào cần                          |

> **BỔ SUNG (ARCH-05 — cửa một chiều của Tauri updater, sự thật kỹ thuật).** Tauri updater xác thực bản cập nhật bằng cặp khoá ký riêng; public key phải nằm **trong bản build đã phát hành**. Nếu bản đầu tiên ship không có public key, không bản nào sau này tự cập nhật được cho máy đang chạy bản đó — phải gỡ cài lại tay. Chi phí sinh khoá bây giờ (~30 phút) rẻ hơn rất nhiều so với sửa sau. **Sinh khoá updater ở Sprint 0**, nhúng public key vào `tauri.conf.json` ngay cả khi chưa bật updater (`active: false`).

---

## 10. Mô hình dữ liệu

### 10.1 Các bảng chính

| Bảng            | Vai trò                            | Trường cốt lõi                                                                                   |
| --------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------ |
| profiles        | Hồ sơ chủ PawPass                  | id, display_name, avatar_url, timezone, settings_json                                            |
| accounts        | Metadata tài khoản                 | id, owner_id, platform, name, username, emails, location, profile_url, status, tags, timestamps  |
| account_secrets | Payload đã mã hóa                  | **owner_id**, account_id, ciphertext, nonce, algorithm, key_version, payload_version, updated_at |
| user_keyrings   | DEK đã được master password bọc    | owner_id, wrapped_dek_by_master, wrapped_dek_by_recovery, salt, kdf_params, version              |
| account_metrics | Lịch sử cập nhật follower thủ công | **owner_id**, account_id, value, recorded_at                                                     |
| devices         | Thiết bị/session                   | owner_id, device_name, platform, last_seen_at, revoked_at                                        |
| audit_events    | Sự kiện bảo mật không chứa secret  | owner_id, action, entity_id, device_id, created_at                                               |

> **Đã bỏ (09/08/2026):** `platform_connections`, `platform_connection_secrets` (OAuth server-only), `sync_jobs` (theo dõi job đồng bộ follower) — toàn bộ ba bảng này chỉ tồn tại để phục vụ Meta OAuth và cron sync, xem §0. Cùng với đó, mọi RLS pattern/khuôn mẫu IDOR viết riêng cho Edge Function gọi Meta cũng đã bỏ — không còn Edge Function nào trong scope.
>
> **THÊM `owner_id` VÀO `account_secrets` VÀ `account_metrics` (mới v4.1).** §11.3 tuyên bố RLS pattern là `owner_id = auth.uid()` cho _"tất cả bảng thuộc người dùng"_, nhưng bản 4.0 chỉ cho hai bảng này cột `account_id`. Không có `owner_id` thì policy buộc phải viết `exists (select 1 from accounts a where a.id = account_id and a.owner_id = auth.uid())` — chạy đúng, nhưng là **một khuôn mẫu policy thứ hai** phải nhớ và kiểm riêng, và Postgres phải join thêm cho mọi hàng ở mọi truy vấn.
>
> Chốt: **denormalize `owner_id` vào cả hai bảng.** Mọi bảng dùng đúng một câu policy giống hệt nhau, và mọi index đều bắt đầu bằng `owner_id`. Giữ đồng nhất bằng foreign key ghép — `foreign key (account_id, owner_id) references accounts (id, owner_id)` (cần `unique (id, owner_id)` trên `accounts`). Postgres tự bảo đảm `owner_id` không bao giờ lệch với account cha; không phải tin vào code app.

> **Realtime và tombstone.** `account_secrets` cũng phải nằm trong publication Realtime (§10.3) — khi máy A sửa mật khẩu, máy B cần biết ciphertext đã đổi, dù chưa mở vault.

### 10.2 accounts — field specification

| Field                   | Type        | Rule                                                                                                              |
| ----------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------- |
| id                      | uuid        | PK, `gen_random_uuid()`                                                                                           |
| owner_id                | uuid        | FK `auth.users`; RLS boundary                                                                                     |
| platform                | enum/text   | facebook \| instagram \| google                                                                                   |
| account_type            | text        | page/profile/business/creator/personal/gmail                                                                      |
| display_name            | text        | Bắt buộc, 1–120 ký tự                                                                                             |
| username                | text        | Nullable                                                                                                          |
| **normalized_username** | text        | **Cột thật** _(sửa — DATA-03, xem dưới)_, `generated always as (lower(trim(leading '@' from username))) stored`   |
| login_email             | text        | Lưu đã `lower()` sẵn _(sửa — không dùng `citext`, xem dưới)_                                                      |
| recovery_email          | text        | Nullable, cùng quy tắc                                                                                            |
| location                | text        | Nullable, ≤120 ký tự                                                                                              |
| profile_url             | text        | URL đã validate                                                                                                   |
| avatar_path             | text        | Supabase Storage path hoặc remote URL được kiểm soát                                                              |
| status                  | text        | active \| review \| inactive \| locked \| archived                                                                |
| follower_current        | bigint      | Nullable; số người dùng nhập tay lần gần nhất                                                                     |
| **follower_updated_at** | timestamptz | Nullable _(đổi tên từ `follower_synced_at` — không còn "sync", chỉ có "update" thủ công)_                         |
| tags                    | text[]      | Mặc định empty array                                                                                              |
| notes                   | text        | Plain text; nullable — xem lưu ý §6.2                                                                             |
| created_at/updated_at   | timestamptz | Server timestamps — **luôn ghi bằng `now()` trong trigger**, không nhận từ client (§11.4 DATA-04a)                |
| **row_version**         | integer     | **Mới v4.1.** `not null default 1`; trigger `+1` mỗi UPDATE. Cột dùng để phát hiện stale write (§11.4)            |
| archived_at             | timestamptz | **Ẩn khỏi Dashboard, khôi phục được.** Dữ liệu còn nguyên (§11.7)                                                 |
| **deleted_at**          | timestamptz | **Mới v4.1 — tombstone.** Xoá vĩnh viễn: mọi cột dữ liệu bị NULL, hàng ở lại để máy khác biết mà xoá theo (§11.7) |

> **Đã bỏ (09/08/2026):** cột `follower_mode` (`api \| manual \| none`) — không còn `api` để phân biệt, follower luôn là nhập tay hoặc trống.

> **BỔ SUNG v4.1 — vì sao phải có `row_version` như một cột riêng.** §11.4 nói "dùng `updated_at`/version integer để phát hiện stale write" và bảng rủi ro §14 gọi thẳng tên `row_version`, nhưng field spec bản 4.0 **không có cột nào như thế** — migration viết đúng theo spec sẽ không có chỗ để bám. Không thể dùng `updated_at` thay thế: `timestamptz` của Postgres có độ phân giải micro-giây, hai UPDATE trong cùng một micro-giây sẽ ra cùng giá trị, và điều kiện `where updated_at = $expected` khi đó im lặng cho qua đúng cái ghi đè mà nó phải chặn. Số nguyên tăng dần thì không có ca đó.
>
> Mọi lệnh UPDATE từ app đều mang dạng `... where id = $1 and row_version = $2`. Trả về 0 hàng = có máy khác đã sửa trước → mở conflict dialog (§11.4). Không bao giờ UPDATE mà không kèm điều kiện này.

> **SỬA (DATA-03 — hai khoảng trống schema, tự lộ ra khi đọc kỹ §10.2/§10.3, không cần đối chiếu tài liệu khác):**
>
> 1. `normalized_username` được nhắc như một khái niệm ("để unique mềm") nhưng **không phải cột thật** trong bảng — mà §10.3 lại đặt unique index trên chính nó. Migration sẽ fail vì tham chiếu cột không tồn tại. → thêm thành generated column, công thức ở bảng trên.
> 2. `citext` (kiểu chuẩn hoá không phân biệt hoa-thường của Postgres) cần `create extension citext` — không được nhắc tới, và **không tồn tại trên SQLite** nếu sau này có bản offline-first. Dùng `text` thường + luôn lưu giá trị đã `lower()` ở tầng ghi (repository), một quy tắc áp một chỗ.

### 10.3 Index và constraint tối thiểu

- Index `accounts(owner_id, archived_at, updated_at desc)`.
- Index `accounts(owner_id, platform, status)`.
- Unique partial index `owner_id + platform + normalized_username` khi username khác null, **chưa archived và chưa deleted**.
- Index `account_metrics(owner_id, account_id, recorded_at desc)`.
- Trigger `updated_at`; không trigger decrypt hoặc xử lý secret trong database public.
- **Bổ sung (DATA-04):** `alter publication supabase_realtime add table accounts, account_secrets;` — thiếu dòng này thì Realtime không lỗi gì cả, chỉ đơn giản là không có sự kiện nào tới. Dễ quên, dễ không phát hiện ra.
- **Mới v4.1 — một trigger làm cả hai việc.** `updated_at = now()` và `row_version = old.row_version + 1` phải nằm trong **cùng một trigger `before update`**, không tách. Tách ra thì có ngày một cái chạy còn cái kia không.
- **Mới v4.1 — index cho delta fetch:** `accounts(owner_id, updated_at desc)` **không** partial, không lọc `deleted_at`. Delta fetch lúc reconnect cần quét được cả hàng tombstone (§11.7); index partial sẽ giấu đúng những hàng nó cần thấy.
- **Mới v4.1 — `unique (id, owner_id)` trên `accounts`.** Không phải để tra cứu (`id` đã là PK) mà để làm đích cho foreign key ghép của `account_secrets`/`account_metrics` — xem §10.1.

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
4. Mỗi secret payload dùng nonce riêng và **XChaCha20-Poly1305** _(chốt một thuật toán duy nhất, không để ngỏ "hoặc AES-GCM" — nonce 192-bit cho phép sinh ngẫu nhiên mà không lo trùng, tránh lớp lỗi nguy hiểm nhất của AES-GCM khi tự quản nonce)_.
5. DEK đã mở chỉ sống trong vùng bảo vệ cục bộ (`Zeroizing<[u8; 32]>` ở Rust) và bị xóa khi auto-lock/logout.

> **LẤP KHOẢNG TRỐNG (SEC-03/FR-17/FR-18 — Master Roadmap gốc chỉ có một ô tick "Recovery key hiển thị một lần; có luồng rotate master password" trong checklist §11.5, không mô tả cơ chế. Đây là luồng hậu quả cao nhất trong sản phẩm — mất master password không có recovery hợp lệ = mất vĩnh viễn mật khẩu của mọi tài khoản.)**
>
> **Recovery key là KEK thứ hai độc lập.** Sinh 32 byte ngẫu nhiên → mã hoá Base32 chia nhóm có ký tự kiểm tra → bọc **cùng một DEK**. `user_keyrings` có hai bản bọc: `wrapped_dek_by_master` và `wrapped_dek_by_recovery`. Mở được bằng một trong hai.
>
> **Đổi master password** = giải DEK bằng master cũ hoặc recovery → salt mới → KEK mới → bọc lại DEK → ghi đè `wrapped_dek_by_master`. **DEK không đổi**, nên không phải mã hoá lại `account_secrets`. Recovery key cũ vẫn hợp lệ sau khi đổi master — phải nói rõ cho người dùng, kèm nút "Sinh recovery key mới" nếu muốn vô hiệu hoá cái cũ.
>
> Onboarding (§4.2 bước 2): hiện recovery key **đúng một lần**, bắt buộc người dùng gõ lại một phần để xác nhận đã lưu (không cho bấm "Tôi đã lưu" suông), có nút tải `.txt`.

#### 11.2.1 Format recovery key _(mới v4.1 — bản 4.0 chỉ ghi "Base32 chia nhóm có ký tự kiểm tra")_

Đây là **quyết định vĩnh viễn**: key sinh hôm nay phải đọc lại được sau nhiều năm, nên format phải cố định trước khi có key đầu tiên tồn tại.

| Hạng mục              | Chốt                                                                                                                              |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Entropy               | 32 byte từ CSPRNG (`rand::rngs::OsRng`) — **cùng độ dài DEK**, không rút gọn                                                      |
| Bảng mã               | **Crockford Base32** — `0123456789ABCDEFGHJKMNPQRSTVWXYZ` (bỏ `I`, `L`, `O`, `U` để không nhầm khi chép tay)                      |
| Độ dài thân           | 256 bit ÷ 5 = **52 ký tự**                                                                                                        |
| Checksum              | **2 ký tự** = 10 bit đầu của `SHA-256(32 byte gốc)`, mã hoá cùng bảng Crockford                                                   |
| Tổng                  | **54 ký tự**, chia **9 nhóm × 6**, ngăn bằng `-`                                                                                  |
| Ví dụ hình thức       | `H4KZ0P-9WQ2NM-3TVXBR-…-7YJ5CD` (9 nhóm)                                                                                          |
| Chuẩn hoá khi nhập    | Bỏ `-` và mọi khoảng trắng → `upper()` → map `I`,`L`→`1`, `O`→`0` (đúng chuẩn Crockford). Người dùng chép nhầm chữ/số vẫn mở được |
| Xác nhận ở onboarding | App chọn **ngẫu nhiên 2 trong 9 nhóm**, bắt gõ lại đúng cả hai. Sai thì hiện lại key và cho thử lại — **không** cho bỏ qua        |
| File `.txt` tải về    | Chứa key + ngày tạo + một dòng cảnh báo. **Không** chứa email, không chứa tên tài khoản nào                                       |

**Checksum để làm gì:** phân biệt "gõ sai" với "sai key". Nếu checksum không khớp → báo _"Recovery key nhập chưa đúng, kiểm tra lại"_ ngay lập tức, không cần chạy Argon2id. Nếu checksum khớp nhưng giải DEK thất bại → đây là một key **hợp lệ về hình thức nhưng của vault khác**, thông báo khác hẳn. Không có checksum thì hai ca này trông giống nhau và người dùng không biết mình gõ nhầm hay mất key.

### 11.3 RLS policy pattern

Tất cả bảng thuộc người dùng có `owner_id = auth.uid()` cho SELECT/INSERT/UPDATE/DELETE. Storage avatar dùng path theo user id và policy tương tự.

> **Một khuôn mẫu duy nhất, không có ngoại lệ (v4.1).** Sau khi thêm `owner_id` vào `account_secrets` và `account_metrics` (§10.1), **cả 7 bảng** dùng đúng một dạng policy:
>
> ```sql
> create policy "owner_all" on <table>
>   for all
>   to authenticated
>   using      (owner_id = (select auth.uid()))
>   with check (owner_id = (select auth.uid()));
> ```
>
> Hai chi tiết bắt buộc, không phải tuỳ chọn:
>
> - **`(select auth.uid())` chứ không phải `auth.uid()`.** Bọc trong subquery cho phép Postgres tính một lần rồi cache (InitPlan) thay vì gọi lại cho từng hàng. Ở mức 500–2.000 bản ghi (§1.2) khác biệt này đo được.
> - **Phải có `with check`, không chỉ `using`.** `using` lọc hàng đọc/sửa được; `with check` mới chặn việc **ghi vào** một `owner_id` không phải của mình. Thiếu nó thì user A INSERT được hàng mang `owner_id` của user B.
>
> Test âm tính (§15.1) phải phủ cả hai vế: A không SELECT được hàng của B, **và** A không INSERT/UPDATE được hàng mang `owner_id` của B.

> **Đã bỏ (09/08/2026):** phần bàn về RLS-không-giấu-được-cột (SEC-01) và khuôn mẫu IDOR cho Edge Function (DATA-07) — cả hai chỉ có ý nghĩa khi có bảng chứa token (`platform_connection_secrets`) hoặc Edge Function gọi service role. Không còn cái nào trong scope. Nếu về sau thêm bất kỳ Edge Function nào, viết lại khuôn mẫu xác minh sở hữu trước khi dùng service role — đây vẫn là nguyên tắc đúng, chỉ là hiện tại không có chỗ nào áp dụng nó.

### 11.4 Đồng bộ và xử lý xung đột

- Metadata dùng optimistic update + **`row_version`** (§10.2) để phát hiện stale write: mọi UPDATE kèm `where row_version = $expected`, trả về 0 hàng nghĩa là có xung đột.
- Nếu hai máy sửa cùng bản ghi, app không âm thầm last-write-wins cho secrets; hiển thị conflict dialog với thời điểm và device.
- Secrets thay đổi theo payload nguyên khối; mỗi update tăng `key_version`/`payload_version`.
- Realtime subscription cập nhật cache; khi reconnect thực hiện full delta fetch theo `updated_at`.
- Offline MVP: cho xem cache metadata; secrets chỉ mở nếu vault cục bộ còn hợp lệ.

> **SỬA (SEC-07 — conflict dialog không nên phơi giá trị bí mật).** Payload secrets là khối nguyên chứa 5 trường. Nếu conflict dialog hiện "cả hai phiên bản để chọn" theo nghĩa đen, nó phải giải mã và hiện cả 5 trường của cả hai máy cùng lúc — vi phạm nguyên tắc che mặc định (FR-05). Dialog chỉ nên hiện: thời điểm sửa, tên thiết bị, **danh sách tên trường đã đổi** (so sau khi giải mã cục bộ, chỉ so bằng không hiện giá trị). Ba lựa chọn: `Giữ bản máy này` · `Lấy bản máy kia` · `Xem chi tiết` (reveal có timeout, từng trường).
>
> **BỔ SUNG (DATA-04 — 3 chi tiết khiến "delta fetch theo updated_at" không hoạt động như mô tả nếu bỏ qua).** (a) `updated_at` dùng để so sánh phải là **giờ server** (trigger Postgres ghi bằng `now()`), không phải đồng hồ máy client — lệch giờ giữa hai máy sẽ làm bỏ sót bản ghi. (b) Delta fetch reconnect **không được lọc `deleted_at is null`** — nó cần nhận cả bản ghi đã xoá để áp việc xoá vào cache cục bộ, nếu không xoá trên máy A sẽ không bao giờ tới máy B. _(v4.1: cột `deleted_at` và cơ chế tombstone giờ đã được định nghĩa thật ở §10.2 và §11.7 — bản 4.0 nhắc tới cột này nhưng chưa từng tạo ra nó.)_ (c) Thứ tự: delta fetch xong rồi mới bật lại Realtime subscription, để không bỏ sót sự kiện phát ra trong lúc offline (Realtime không tự bù khoảng mất kết nối).

### 11.5 Security checklist

- [ ] Không commit `.env`, Supabase secret/service key.
- [ ] Ẩn secrets khỏi logs, telemetry, error messages và DevTools production.
- [ ] Disable remote navigation và CSP chỉ cho origin cần thiết.
- [ ] Validate URL ở Rust trước khi opener thực thi _(mở rộng ở §4.4)_.
- [ ] Rate limit unlock attempts; tăng delay sau nhiều lần sai — **biện pháp chính vẫn là tham số Argon2id** (~0,3–0,5s mỗi lần thử), rate limit UI chỉ chống dò thủ công tại chỗ _(SEC-06)_.
- [ ] Recovery key hiển thị một lần; có luồng rotate master password _(cơ chế: §11.2)_.
- [ ] Backup database không đủ để giải mã secret nếu thiếu master/recovery key.
- [ ] Dependency audit cho npm/cargo trước release.
- [ ] Yêu cầu độ mạnh master password: tối thiểu 12 ký tự, chặn 100 mật khẩu phổ biến nhất _(SEC-06)_.

### 11.6 Schema payload bí mật _(mới v4.1 — BR-05 yêu cầu payload có version nhưng bản 4.0 chưa định nghĩa nội dung)_

Không có bảng này thì `reveal_secret(field)` không có enum field hợp lệ, và conflict dialog §11.4 ("hiện danh sách **tên trường** đã đổi") không có tên nào để liệt kê.

**Đúng 5 trường** — khớp con số ở SEC-07 §11.4:

```jsonc
{
  "v": 1,                        // payload version, BR-05
  "account_password":  "…",      // bắt buộc, string, không trim, không giới hạn ký tự
  "email_password":    "…"|null, // mật khẩu hòm thư đăng nhập
  "recovery_codes":    ["…"],    // mảng string, mặc định [] — mã 2FA dùng một lần
  "twofa_note":        "…"|null, // ghi chú 2FA tự do (tên app authenticator, v.v.)
  "recovery_phone":    "…"|null  // SĐT khôi phục — xem ghi chú bên dưới
}
```

| Quy tắc                        | Chi tiết                                                                                                                        |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Trường nào **không** vào đây   | `login_email`, `recovery_email` là **cột plaintext** trong `accounts` (§10.2) — cần để tìm kiếm và hiển thị nhanh, không mã hoá |
| Thứ tự khoá                    | Serialize **sắp xếp theo alphabet** trước khi mã hoá, để hai máy sinh cùng đầu vào cho cùng nội dung                            |
| Trường rỗng                    | Ghi `null` / `[]`, **không** bỏ khoá khỏi JSON — giữ hình dạng ổn định giữa các version                                         |
| Enum field cho `reveal_secret` | Đúng 5 tên trên. Rust từ chối mọi tên khác — không nhận string tuỳ ý từ JS                                                      |
| Đổi version                    | Tăng `v`, viết hàm migrate `v(n) → v(n+1)` chạy lúc giải mã. Không bao giờ đọc payload mà không kiểm `v`                        |

> **`recovery_phone` nằm trong payload, không phải cột.** §6.2 bản 4.0 liệt kê "phone" ở nhóm Contact nhưng §10.2 **không có cột `phone` nào** — một khoảng trống chưa ai để ý. Đặt nó vào payload mã hoá là lựa chọn đúng: SĐT khôi phục chính là thứ mà ghi chú SEC-02 §6.2 dặn _đừng_ gõ vào ô `notes` không mã hoá. Vậy thì phải có chỗ mã hoá cho nó — chính là đây.

### 11.7 Xoá và tombstone _(mới v4.1 — bản 4.0 để hở một đường mất đồng bộ)_

**Vấn đề của bản 4.0.** DATA-04(b) §11.4 dặn delta fetch _"không được lọc `deleted_at is null`"_ — nhưng §10.2 **không có cột `deleted_at`**, chỉ có `archived_at`. Tệ hơn: BR-03 cho phép **xoá vĩnh viễn** có xác nhận. Nếu đó là `DELETE` thật, hàng biến mất khỏi bảng, và delta fetch theo `updated_at` **không có cách nào** báo cho máy B biết — máy B giữ bản ghi đó mãi mãi. Xoá trên máy A không bao giờ tới máy B.

**Chốt: `DELETE` cứng bị cấm ở tầng app. Ba trạng thái, không phải hai.**

| Trạng thái              | Cột                      | Người dùng thấy gì                | Dữ liệu còn gì                             |
| ----------------------- | ------------------------ | --------------------------------- | ------------------------------------------ |
| Bình thường             | cả hai `null`            | Trong danh sách                   | Đủ                                         |
| **Archived**            | `archived_at` có giá trị | Ẩn khỏi Dashboard, có nút Restore | **Đủ** — khôi phục được nguyên vẹn         |
| **Deleted (tombstone)** | `deleted_at` có giá trị  | Không thấy ở đâu cả               | **Chỉ còn `id`, `owner_id`, `deleted_at`** |

Khi người dùng xác nhận xoá vĩnh viễn:

1. `UPDATE accounts SET deleted_at = now(), display_name = NULL, username = NULL, login_email = NULL, … WHERE id = $1` — xoá sạch mọi cột dữ liệu, **giữ lại hàng**.
2. `DELETE FROM account_secrets WHERE account_id = $1` — ciphertext đi luôn, không cần tombstone vì nó không bao giờ được truy vấn độc lập.
3. `DELETE FROM account_metrics WHERE account_id = $1`.
4. Ghi `audit_events`.

Máy B nhận hàng tombstone qua delta fetch/Realtime → thấy `deleted_at` khác null → xoá khỏi cache cục bộ. Đó là toàn bộ lý do tombstone tồn tại.

**Dọn tombstone:** hàng có `deleted_at < now() - interval '90 days'` được xoá cứng thật. 90 ngày dài hơn mọi khoảng offline hợp lý của một máy cá nhân. Chạy bằng một câu lệnh trong app lúc khởi động, **không cần pg_cron** (§9.1 đã bỏ Cron khỏi scope — không thêm lại chỉ vì việc này).

**Mọi truy vấn đọc phải lọc `deleted_at is null`. Đúng một ngoại lệ: delta fetch lúc reconnect.**

---

## 12. Roadmap 6 tuần

| Giai đoạn        | Thời gian | Deliverable                                                        | Quality gate                                                       |
| ---------------- | --------- | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| 0. Foundation    | 2–3 ngày  | Repo, ADR, env, Supabase project, asset manifest, **khoá updater** | Build dev chạy Windows; không commit secret                        |
| 1. Design system | Tuần 1    | Tokens, components, Dashboard shell, Mochi mapping                 | Storybook/component states; keyboard focus                         |
| 2. Local core    | Tuần 2–3  | CRUD, Account Card/Detail, vault, search/filter, **recovery key**  | Secrets không xuất hiện trong log; unit tests pass; **AT-12 pass** |
| 3. Cloud sync    | Tuần 4    | Auth, schema, RLS, Realtime, device sessions                       | Máy A/B sync; RLS negative tests pass                              |
| 4. Hardening     | Tuần 5    | E2E, conflict, offline/reconnect, performance, a11y                | Không còn P0 bug; 500-account test đạt                             |
| 5. Release       | Tuần 6    | Installer, updater plan, docs, backup/recovery drill               | Clean install Windows 10/11 **offline**; rollback có hướng dẫn     |

> **Đã bỏ (09/08/2026):** giai đoạn "Meta integration" (2 tuần) và spike Meta ở Foundation — roadmap co từ 8 xuống 6 tuần vì đây là công việc thật sự cắt được, không phải hoãn.

### 12.1 Milestones

M1 — UI Prototype (mock data, brand hoàn chỉnh) · M2 — Local Alpha (CRUD + vault local) · M3 — Multi-device Beta (Auth/RLS/Realtime) · M4 — Release Candidate (installer + regression + recovery test).

### 12.2 Definition of Done chung

Có acceptance criteria và test tương ứng · loading/empty/error/permission states thiết kế đủ · không TypeScript `any` mới nếu không giải thích · migration có rollback/forward strategy · UI dùng được bằng bàn phím · security review cho mọi thay đổi chạm secret/RLS.

### 12.3 Backlog theo sprint

**Sprint 0** — ADR-001 (Tauri 2 thay Electron) · ADR-002 (XChaCha20-Poly1305 + tham số Argon2id, thay Stronghold) · pnpm workspace, lint, format, commit hooks, CI · `supabase link` project đã tạo + migration workflow (§13.1 — một project duy nhất) · **sinh khoá updater** · chuẩn hoá logo/Mochi asset manifest (chưa cần SVG thật).

**Sprint 1** — `tokens.css` từ **bảng §7.2 đã đo** (gồm `-text`, status color, `Border Strong`) · Sidebar/topbar/window state · AccountCard đủ 5 states (AT-21) · `MochiIllustration` với 8 state, **quyết vấn đề keyline trắng §8.3** · Add/Edit form theo platform + Zod · Detail page không có secret thật · `strings.ts` tiếng Việt (§7.7).

**Sprint 2** — Argon2id + XChaCha20-Poly1305 setup (thay Stronghold) · **payload schema §11.6 + migrate theo `v`** · **recovery key Crockford Base32 §11.2.1 (FR-17)** · **rotate master, DEK giữ nguyên (FR-18, AT-20)** · encrypt/decrypt payload command · reveal/copy timeout · local cache không chứa plaintext · Open account qua allowlisted opener + Gmail authuser.

**Sprint 3** — Auth screens · migrations profiles/accounts/secrets/keyrings **có `row_version`, `deleted_at`, `owner_id` denormalized, `unique(id, owner_id)`** · **RLS một khuôn mẫu cho cả 7 bảng + negative test cả `using` lẫn `with check` (§11.3)** · optimistic CRUD kèm `where row_version = $n` + Realtime + device list/revoke · conflict detection · **tombstone + dọn 90 ngày (§11.7, AT-26)**.

**Sprint 4** — 500-account performance seed · E2E happy path + auth expired + network loss + conflict · accessibility + copywriting + Mochi states.

**Sprint 5** — Windows installer (**NSIS, `perMachine: false`, `webviewInstallMode: embedBootstrapper`** — xem §13.1), versioning, backup/recovery guide, **AT-12 diễn tập khôi phục trên VM sạch**.

---

## 13. Phát hành, vận hành và chi phí

### 13.1 Environments và packaging

- **Một project Supabase duy nhất, dùng chung dev và production** _(quyết định 09/08/2026 — app cá nhân một người dùng, không cần tách local/staging/production; đơn giản hơn không phải chạy Docker/`supabase start` nền liên tục)_. Project ref `nzcnojcnnfiqeujfhccx`. Migration chạy trực tiếp lên project này qua Supabase CLI (`supabase link` + `supabase db push`), không có bước "test trên local trước".
- **Biến môi trường (mới v4.1 — bản 4.0 cho project ref nhưng không nói biến tên gì).** Đúng hai biến, cả hai đều an toàn khi lộ vì đã có RLS chắn:

| Biến                            | Giá trị                                    | Ghi chú                                 |
| ------------------------------- | ------------------------------------------ | --------------------------------------- |
| `VITE_SUPABASE_URL`             | `https://nzcnojcnnfiqeujfhccx.supabase.co` |                                         |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | publishable/anon key                       | **Không bao giờ** là `service_role` key |

`.env.example` commit vào repo với giá trị rỗng; `.env` thật đã bị `.gitignore` chặn. Nếu có lúc nào cần một biến thứ ba mà nó là **secret thật**, thì nó không thuộc về desktop bundle — dừng lại và thiết kế lại, đừng thêm vào đây.

- Tạo NSIS hoặc MSI installer x64; app icon đúng chuẩn multi-resolution — nguồn là `pawpass-app-logo.png` (nền navy squircle, §8.3), không phải logomark nền trong suốt.
- Version theo Semantic Versioning; migration chạy có kiểm soát.
- Build qua GitHub Actions Windows runner; lưu checksum và release notes.
- Code signing nên có trước khi phân phối rộng; bản cá nhân có thể bắt đầu unsigned nhưng sẽ gặp cảnh báo SmartScreen.

> **BỔ SUNG (ARCH-06 — sự thật kỹ thuật về Tauri trên Windows, không phụ thuộc tài liệu nào).** Tauri chạy trên WebView2 runtime; Windows 11 có sẵn, nhiều bản Windows 10 thì không. Mặc định `webviewInstallMode: downloadBootstrapper` sẽ tải mạng lúc cài — máy không có mạng thì cài xong app không mở được. Chốt **`embedBootstrapper`** (+~1,5MB, không cần tải khi cài). Chọn **NSIS** với `perMachine: false` để cài theo user, không cần quyền admin.

### 13.2 Auto-updater

Auto-updater để sau khi quy trình signing/versioning ổn định; MVP cho tải bản mới thủ công. **Nhưng khoá ký sinh ở Sprint 0** — xem §9.3 ARCH-05.

### 13.3 Chi phí dự kiến

| Hạng mục             | MVP cá nhân         | Ghi chú                                  |
| -------------------- | ------------------- | ---------------------------------------- |
| Tauri/React          | Miễn phí            | Open source                              |
| Supabase             | Có thể bắt đầu Free | Theo dõi quota database, storage         |
| Windows code signing | Có chi phí          | Không bắt buộc cho prototype             |
| Monitoring           | Free tier ban đầu   | Không gửi secrets/PII vào error tracking |

> **Đã bỏ (09/08/2026):** dòng "Meta API" và "Domain/privacy page" — cả hai chỉ cần thiết cho Meta App Review.

### 13.4 Backup & recovery

- Bật backup theo plan Supabase hiện có; kiểm tra phục hồi bằng môi trường staging.
- Metadata/ciphertext có thể backup; muốn giải mã vẫn cần master/recovery key.
- Có export encrypted backup định kỳ sau MVP; không mặc định export plaintext password.
- **AT-12 (diễn tập khôi phục) chạy lại trước mỗi bản phát hành có thay đổi chạm crypto hoặc schema**, không chỉ một lần.

---

## 14. Rủi ro, giới hạn và hướng phát triển

| Rủi ro                  | Tác động                                                                             | Giảm thiểu                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| Mất master/recovery key | Không giải mã được secrets                                                           | Onboarding bắt buộc xác nhận đã lưu; **AT-12 là điều kiện thành công của bản 1.0**      |
| Conflict nhiều máy      | Ghi đè dữ liệu                                                                       | row_version; conflict dialog không phơi giá trị; audit event                            |
| DB/RLS cấu hình sai     | Rò dữ liệu                                                                           | Migration review; negative tests; least privilege                                       |
| Scope phình to          | Không ship được                                                                      | Giữ P0; dời auto-login/import/chart/team sang post-MVP                                  |
| UI mascot quá nhiều     | Mất tính chuyên nghiệp                                                               | Mochi chỉ ở onboarding/empty/status; không lặp trên từng card                           |
| Asset chưa đủ bộ        | Thiếu 2/8 tư thế Mochi (Sync, Offline); wordmark chỉ có bản raster; chưa xuất `.ico` | §8.3 — dùng tạm `05-notification`/`07-support` cho hai state thiếu, không chặn Sprint 1 |

> **Đã bỏ (09/08/2026):** rủi ro "Meta API thay đổi/quyền bị từ chối", "Chi phí thiết lập Meta × N tài khoản", "Token provider bị lộ" — không còn Meta trong scope.

### 14.1 Post-MVP roadmap

v1.1 CSV/Excel import + follower chart 30/90 ngày · v1.2 browser profile mapping (không lưu cookie) · v1.3 TikTok/YouTube/X adapter (nếu quyết định làm follower tự động trở lại — thiết kế mới, không phải bật lại phần đã bỏ) · v1.4 encrypted export/import, tag automation · v2.0 team workspace (yêu cầu threat model mới).

### 14.2 Ý tưởng không nên làm sớm

Auto-login lưu cookie/session thô · scraping follower · AI features trước khi CRUD/vault/sync ổn định · team sharing trong khi mô hình khóa chỉ thiết kế cho một owner · dark mode nếu light mode/design tokens chưa hoàn chỉnh.

---

## 15. Kiểm thử và tiêu chí nghiệm thu

### 15.1 Test pyramid

| Tầng        | Phạm vi                                            | Ví dụ                                                        |
| ----------- | -------------------------------------------------- | ------------------------------------------------------------ |
| Unit        | Validation, URL builder, crypto wrapper, formatter | Không trim password; Gmail URL; follower null vs 0           |
| Component   | Card, forms, vault UI                              | Keyboard, loading/error, long email/name                     |
| Integration | Supabase + RLS                                     | User A không đọc được row user B                             |
| E2E desktop | Luồng thật                                         | Sign in → unlock → create → sync máy B → open account        |
| Security    | Secrets, logging, permissions                      | Không plaintext trong DB/log/bundle; opener reject `file://` |
| Performance | Dữ liệu lớn                                        | 500–2.000 accounts; search/filter/render                     |

> **BỔ SUNG (QA-08 — ngưỡng cụ thể, Master Roadmap gốc không có).** Unit ≥90% coverage cho `src/lib/**` và `src-tauri/src/security/**` · Integration 100% policy RLS có test âm tính · Security (AT-02, AT-08, AT-09, AT-12, AT-13) bắt buộc trước mỗi release · toàn bộ tầng CI chạy dưới 5 phút.

### 15.2 Acceptance test quan trọng

- **AT-01** — Tạo Facebook account với password chứa khoảng trắng/ký tự Unicode; đóng mở app; giải mã đúng 100%.
- **AT-02** — Trên DB chỉ thấy ciphertext/nonce; tìm toàn workspace/log không thấy sample password.
- **AT-03** — Tạo record trên PC A; PC B đang online nhận update trong ≤5 giây. _(QA-02: đo trung vị ≤2s, cao nhất ≤5s trên 10 lần chạy cho mỗi loại thao tác; kèm ca PC B đang mở Detail của đúng account đó.)_
- **AT-04** — PC B chưa mở vault vẫn xem metadata nhưng không đọc secret.
- **AT-08** — Nút Open account chỉ chấp nhận https/http đúng allowlist; `file://`, `javascript:`, `data:`, credential trong URL, host homograph đều bị chặn.
- **AT-09** — Copy password → clipboard được xóa sau timeout **và không xoá nếu người dùng đã copy thứ khác trong lúc đó**; UI che lại sau reveal timeout; banner Clipboard History hiện đúng một lần nếu bật.
- **AT-10** — 500 card không làm main interaction lag; dùng pagination/virtualization khi cần.
- **AT-11** _(mới, §7.6)_ — Luồng đầy đủ chỉ bằng bàn phím; axe-core 0 lỗi `serious`/`critical`.
- **AT-12** _(mới, §11.2 — release blocker)_ — Diễn tập khôi phục trên máy ảo sạch: tạo vault, lưu recovery key, tạo account có mật khẩu Unicode, xoá máy A, cài máy B, nhập recovery key, đặt master mới, giải mã đúng. Chạy lại trước mỗi release chạm crypto/schema.
- **AT-13** _(mới, §6.3)_ — Reveal mật khẩu → `Win+L` → mở khoá Windows → vault ở trạng thái khoá, ô mật khẩu đã che.
- **AT-14** _(mới, §11.4)_ — Máy B ngắt mạng; máy A tạo/sửa/xoá; máy B nối lại → khớp máy A trên cả ba thay đổi trong ≤10s.
  **AT-15…AT-25** _(QA-01 — lấp các FR không có AT trong bản gốc)_. Bản 4.0 gộp 11 ID này vào **một dòng chỉ có 6 mô tả**, và thứ tự không khớp với cột "Nghiệm thu bởi" ở §3.1 (§3.1 gán FR-14 → AT-19, nhưng đếm theo dòng đó lại ra AT-18; AT-20…AT-23 không thuộc về ai). Luật QA-01 _"FR không có AT thì không được đánh dấu hoàn thành"_ vì thế tự vô hiệu. **v4.1 đánh số dứt điểm:**

| AT    | FR    | Nội dung                                                                                                                                    |
| ----- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| AT-15 | FR-04 | Sửa → archive → restore một account; dữ liệu và secrets nguyên vẹn sau vòng đó                                                              |
| AT-16 | FR-06 | Tìm kiếm **không phân biệt dấu tiếng Việt** — gõ `tien` ra `Tiến`; và không phân biệt hoa/thường                                            |
| AT-17 | FR-09 | Follower nhập tay lưu đúng `follower_updated_at`; ô trống lưu `null`, **không** lưu `0` (BR-04)                                             |
| AT-18 | FR-05 | Round-trip **cả 5 trường** payload (§11.6): mã hoá → lưu → tải lại → giải mã, khớp từng ký tự kể cả Unicode và khoảng trắng đầu/cuối        |
| AT-19 | FR-14 | Stat card (Tổng/Active/Cần xem lại) khớp đúng số hàng mà filter đang áp trả về                                                              |
| AT-20 | FR-18 | Đổi master password → **DEK không đổi**: mọi `account_secrets` cũ vẫn giải mã được mà không ghi lại hàng nào; recovery key cũ vẫn dùng được |
| AT-21 | FR-03 | AccountCard render đủ 5 trạng thái (§5.4) với icon + chữ; tên/email dài bị ellipsis chứ không vỡ layout                                     |
| AT-22 | FR-10 | Auto-lock kích hoạt đủ **cả 5 tác nhân** (§6.3 SEC-05): hết giờ, minimize, khoá màn hình, sleep, thoát app                                  |
| AT-23 | FR-08 | Conflict dialog chỉ hiện **tên trường** đã đổi + thời điểm + tên thiết bị — không hiện giá trị nào (§11.4 SEC-07)                           |
| AT-24 | FR-01 | Đóng app → mở lại → session Supabase khôi phục, **vault vẫn ở trạng thái khoá**                                                             |
| AT-25 | FR-16 | Đăng xuất thiết bị khác từ máy này; máy kia mất quyền đọc ở lần gọi API kế tiếp                                                             |

**AT-26** _(mới v4.1, §11.7)_ — Xoá vĩnh viễn trên máy A → máy B (đang online) không còn thấy account đó trong ≤5s; hàng tombstone còn lại trong DB **không chứa `display_name`, `username`, `login_email` hay bất kỳ dữ liệu nào**, và `account_secrets` tương ứng đã bị xoá hẳn.

> **Đã bỏ (09/08/2026):** AT-05, AT-06, AT-07 (đều kiểm follower sync qua Meta).

### 15.3 Release blocker

- Bất kỳ plaintext secret nào xuất hiện trong cloud DB, log hoặc crash report.
- RLS cho phép user khác đọc/sửa row không thuộc mình.
- Mất dữ liệu khi hai máy sync hoặc khi migration chạy.
- Open account có thể mở scheme nguy hiểm hoặc thực thi command.
- Follower hiển thị 0 thay vì "chưa nhập" khi ô trống _(BR-04)_.
- Installer bị Windows Defender cảnh báo do packaging/cấu hình bất thường chưa điều tra.
- **App không mở được sau khi cài offline trên Windows 10 sạch** _(mới, §13.1)_.
- **AT-12 (diễn tập khôi phục) chưa pass** _(mới, §1.2)_.
- **Vault không khoá khi khoá màn hình Windows** _(mới, §6.3)_.

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
3. ~~Đổi brand sang PawPass/Mochi~~ ✅ · ~~thêm bộ asset Mochi~~ ✅ (§8.3)
4. ~~Lấp 12 khoảng trống chặn Sprint 1–3~~ ✅ (v4.1 — xem §0)
5. Scaffold Tauri 2 + React + TS + Vite + Tailwind, pnpm workspace
6. Sinh **khoá updater** (§9.3 ARCH-05) và nhúng public key
7. Sinh nốt **2 tư thế Mochi còn thiếu** (Sync, Offline) + wordmark dạng font thật (§8.3) — hạng mục riêng, **không chặn Sprint 1**
8. Bắt đầu Sprint 0 theo §12.3

> **Tình trạng tài liệu tính đến v4.1:** không còn hạng mục nào bị chặn vì thiếu quyết định. Sprint 0–5 đều code thẳng được. Những việc còn hở là việc **sản xuất asset** (mục 7), không phải việc thiết kế.

---

**One Paw, Endless Access.**
_PawPass • Mochi • Your accounts. Always within paw's reach._
