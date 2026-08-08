---
title: "Turtly — Source of Truth"
product_name: "Turtly"
mascot_name: "Tully"
target_platform: "Windows desktop"
version: "3.0"
last_updated: "2026-08-09"
based_on: "Turtly_Master_Roadmap_Design_Specification.md v1.0 (08/08/2026)"
---

# TURTLY — SOURCE OF TRUTH

**Desktop Account Manager • Windows • Facebook · Instagram · Google/Gmail**
Sản phẩm **Turtly** • Mascot **Tully** • *All your accounts, in one shell.*

> **CHO AI CODING AGENT**
> Đọc hết file này trước khi code. Đây là tài liệu quyết định duy nhất.
> Không tự thêm auto-login, scraping, team features, hay lưu bí mật dạng plaintext.
> Mọi thay đổi khác tài liệu → sửa tài liệu trước, code sau.

---

## 0. Tài liệu này là gì

File này là **`Turtly_Master_Roadmap_Design_Specification.md`** (bản gốc do người dùng cung cấp, còn ở `Downloads\`), đã sửa theo kết quả review 6 vai ngày 08/08/2026 (`docs/REVIEW-2026-08-08.md`).

**Nguyên tắc sửa:** giữ nguyên mọi quyết định sản phẩm của Master Roadmap — phạm vi, độ ưu tiên P0/P1, cấu trúc màn hình, thiết kế thẻ, kiến trúc, mô hình dữ liệu. Chỉ sửa những chỗ **tự nó là lỗi**, không phụ thuộc vào việc so sánh với tài liệu nào khác: cơ chế bảo mật không làm được việc được giao (RLS không giấu được cột), Master Roadmap tự mâu thuẫn với chính mình (§10.1 chỉ định Stronghold trong khi §12.2 mô tả một sơ đồ khoá khác; §6.2 nói Tully Wave trong khi §9.2 của chính nó nói Neutral), khoảng trống buộc phải lấp (recovery key được nhắc tới nhưng chưa có cơ chế; 6 loại lỗi Meta được định nghĩa nhưng chỉ 1 loại có test), hoặc sự thật vật lý (ảnh brand nền magenta không trong suốt — đo được bằng cách đọc pixel, không cần tài liệu nào xác nhận).

**Đã bỏ khỏi repo:** `DECISIONS.md`, `BRAND.md`, `UI.md` của một bản nháp trước — những file đó áp một số quyết định khác (v1.0 local-only, thẻ 1 nút, CSV import bắt buộc MVP...) mà **người dùng đã yêu cầu bỏ qua**. Tài liệu này không còn phụ thuộc vào chúng. `docs/REVIEW-2026-08-08.md` vẫn giữ lại làm biên bản lịch sử, nhưng phần "Phân xử" của nó (mục 7.2) **không còn hiệu lực** — xem ghi chú ở đầu file đó.

**Thứ tự ưu tiên:** file này → `REVIEW-2026-08-08.md` (để tra lý do một quyết định) → `Turtly_Master_Roadmap_Design_Specification.md` gốc (để so sánh, không dùng để lấy giá trị vì file này đã cập nhật).

---

## 1. Quyết định sản phẩm

| Hạng mục | Quyết định |
|---|---|
| Người dùng | Một chủ sở hữu; có thể dùng nhiều máy Windows |
| Nền tảng MVP | Facebook, Instagram, Google/Gmail |
| Dữ liệu chính | Tên, username, email, mật khẩu tài khoản, mật khẩu email, follower, location, URL, trạng thái, ghi chú, tag |
| Follower | Tự động qua Meta API khi tài khoản đủ điều kiện và đã OAuth; hỗ trợ nhập tay khi không đủ điều kiện |
| Mở tài khoản | Mở URL trong trình duyệt mặc định; không lưu cookie, không tự điền form đăng nhập |
| Cloud | Supabase Auth + Postgres + Realtime + Edge Functions + Cron — **từ ngày đầu**, không tách pha |
| Desktop | Tauri 2 + React + TypeScript; gói cài đặt Windows |
| Mã hoá | Secret payload mã hoá trên máy; master password riêng với mật khẩu đăng nhập Turtly |
| Thời gian | 8 tuần full-time hoặc 10–12 tuần bán thời gian |

### 1.1 Nguyên tắc không thương lượng

- Không lưu mật khẩu Facebook, Instagram hoặc Gmail dạng plaintext trong Supabase, log, crash report hoặc file cấu hình.
- Không dùng scraping, cookie harvesting, hoặc kỹ thuật vượt cơ chế bảo vệ của Meta.
- Không hứa "real-time tuyệt đối". Giao diện luôn hiển thị thời điểm đồng bộ gần nhất và nguồn dữ liệu.
- Mọi bảng client truy cập được đều bật Row Level Security; service-role key không bao giờ xuất hiện trong desktop bundle.
- Mỗi thao tác reveal/copy mật khẩu có xác nhận trạng thái, tự ẩn lại, dọn clipboard theo thời gian cấu hình.

### 1.2 Định nghĩa thành công của bản 1.0

- Quản lý tối thiểu **500** bản ghi tài khoản mà tìm kiếm, lọc và mở chi tiết vẫn phản hồi nhanh.
- Tạo/sửa/xóa trên máy A xuất hiện trên máy B trong vòng 5 giây khi cả hai online.
- Mật khẩu trong database chỉ tồn tại ở dạng ciphertext; đăng nhập mới trên máy khác cần master password để giải mã.
- Follower tự động hoạt động cho tài khoản Meta đủ điều kiện; lỗi quyền, rate limit và token hết hạn có trạng thái rõ ràng.
- Installer chạy trên Windows 10/11 x64; app giữ trạng thái đăng nhập và có auto-lock.
- **Bổ sung (SEC-03/QA-05 — điều kiện có thật, Master Roadmap gốc chỉ ghi trong checklist):** diễn tập khôi phục bằng recovery key pass trên máy sạch. Xem §12.2 và §14.2 AT-12.

### 1.3 Ưu tiên nếu thiếu thời gian *(nguyên văn Master Roadmap §15.1)*

1. Giữ vault encryption + RLS + CRUD + search + open account.
2. Giữ manual follower và UI source/last updated.
3. Dời auto follower sang bản 1.1 nếu Meta App Review hoặc token flow chưa ổn định.
4. Dời chart, import, dark mode và auto-update; **không dời security test**.

---

## 2. Tầm nhìn, mục tiêu và phạm vi

### 2.1 Product vision

Turtly biến danh sách tài khoản rời rạc trong Excel, ghi chú và trình duyệt thành một "vỏ rùa" duy nhất: dễ nhìn, dễ tìm, mở nhanh, đồng bộ giữa các máy và đủ an toàn để lưu thông tin đăng nhập.

> **TAGLINE CHÍNH** All your accounts, in one shell. • Tất cả tài khoản, trong một chiếc mai.

### 2.2 Mục tiêu

- Giảm thời gian tìm một tài khoản xuống dưới 10 giây.
- Xem nhanh tình trạng, follower và thời điểm sync ngay trên Dashboard.
- Tách thông tin công khai khỏi secrets để hiển thị nhanh nhưng vẫn bảo vệ mật khẩu.
- Đồng bộ dữ liệu nhiều máy mà không tạo nhiều bản ghi trùng hoặc ghi đè âm thầm.
- Cho phép mở đúng trang Facebook, Instagram hoặc Gmail bằng một nút.

### 2.3 Ngoài phạm vi MVP

Tự động đăng nhập, tự điền mật khẩu, quản lý browser profile · tự động đăng bài/tương tác/nhắn tin/follow-unfollow · quản lý nhiều thành viên, phân quyền đội nhóm · lấy follower bằng scraping · app mobile, browser extension, macOS/Linux · analytics nâng cao, dự báo tăng trưởng.

### 2.4 Persona và tình huống chính

| Tình huống | Nhu cầu | Kết quả mong muốn |
|---|---|---|
| Tìm tài khoản | Nhớ một phần tên/email | Search ra card đúng trong ≤1 giây |
| Kiểm tra follower | Xem số hiện tại và lần sync | Biết dữ liệu mới hay cũ, không cần mở từng nền tảng |
| Đổi máy | Đăng nhập Turtly trên PC khác | Metadata tải về; nhập master password để mở secrets |
| Mở tài khoản | Đi đến profile hoặc Gmail | Trình duyệt mở đúng URL; app không giả lập đăng nhập |
| Cập nhật credential | Đổi mật khẩu tài khoản/email | Lưu phiên bản mới, không rò vào history/log |

---

## 3. Tính khả thi của follower tự động

> **KẾT LUẬN (Master Roadmap gốc)** Turtly có thể tự động cập nhật follower cho Facebook Page và Instagram Professional (Business/Creator) khi người sở hữu cấp quyền qua OAuth. Không nên coi follower của Facebook profile cá nhân hoặc Instagram personal là dữ liệu chắc chắn lấy được qua API chính thức.

| Loại tài khoản | Follower tự động | Cách xử lý |
|---|---|---|
| Facebook Page | Có điều kiện | Kết nối Meta; đọc trường follower/fan count mà phiên bản API hiện hành cho phép |
| Facebook profile cá nhân | Không cam kết | Hiển thị Manual; người dùng nhập số hoặc để trống |
| Instagram Business/Creator | Có điều kiện | OAuth Instagram/Meta; đọc `followers_count` khi quyền và account type hợp lệ |
| Instagram personal | Không cam kết | Gợi ý chuyển Professional nếu phù hợp; nếu không dùng Manual |
| Google/Gmail | Không áp dụng | Không hiển thị follower; chỉ trạng thái credential và nút mở Gmail |

### 3.1 Quy tắc UX cho dữ liệu follower

- Card luôn hiển thị nguồn: API, Manual hoặc Not available.
- Hiển thị "Đã đồng bộ X phút/giờ trước" thay vì tạo cảm giác dữ liệu real-time tuyệt đối.
- Khi sync lỗi, giữ số cuối cùng nhưng đổi badge thành "Cần kết nối lại" hoặc "Lỗi đồng bộ".
- Không đặt follower = 0 khi API lỗi; dùng null + trạng thái lỗi để tránh số liệu sai.
- Lưu lịch sử metrics theo mốc thời gian để sau MVP có thể vẽ growth chart.

### 3.2 Điều kiện trước khi code tích hợp Meta

1. Tạo Meta App và cấu hình OAuth redirect URI cho môi trường development/production.
2. Xác định loại tài khoản thử nghiệm thật: ít nhất một Facebook Page và một Instagram Professional.
3. Đọc lại tài liệu phiên bản Graph API mới nhất trước sprint tích hợp; **permission và quy trình App Review có thể thay đổi**.
4. Thiết lập Privacy Policy, Data Deletion URL và màn hình giải thích quyền nếu Meta yêu cầu review.
5. Không đưa App Secret hoặc service-role key vào client; toàn bộ trao đổi token nhạy cảm đi qua Edge Function.

> **BỔ SUNG (DATA-01 — hệ quả tự suy ra từ chính mô hình dữ liệu §11.1, không cần tài liệu ngoài).** `platform_connections.account_id` nghĩa là **một kết nối OAuth cho mỗi tài khoản**, không phải một kết nối dùng chung. Với 50–200 tài khoản Facebook/Instagram khác nhau, follower tự động cho toàn bộ danh sách đòi hỏi từng ấy lần đăng nhập OAuth riêng — và điểm 3 ở trên tự nhắc rằng quy trình App Review "có thể thay đổi", nghĩa là Meta có thể giữ app ở chế độ hạn chế (chỉ tài khoản được khai báo trước mới dùng được) cho tới khi qua review. **Trước Sprint tích hợp Meta (Sprint 4), làm một spike 1 ngày**: tạo Meta App thật, thử OAuth với đúng 1 tài khoản Facebook Page và 1 Instagram Professional thật, đọc `followers_count` thật bằng `curl`. Ghi kết quả — kể cả giới hạn gặp phải — vào `docs/adr/ADR-003-meta-feasibility.md`. Nếu giới hạn nặng hơn dự kiến, Sprint 4 build theo đúng giới hạn đó thay vì giả định lý tưởng.

---

## 4. Yêu cầu chức năng và quy tắc nghiệp vụ

### 4.1 Functional requirements P0

| ID | Yêu cầu | Tiêu chí chấp nhận | Nghiệm thu bởi |
|---|---|---|---|
| FR-01 | Đăng nhập Turtly | Email/password hoặc magic link; session khôi phục sau khi mở lại app | AT-24 |
| FR-02 | Mở kho bí mật | Nhập master password; sai không làm lộ thông tin hoặc log plaintext | AT-01, AT-02 |
| FR-03 | Danh sách tài khoản | Grid card có avatar, platform, tên, username/email, follower, status, last sync | AT-10, AT-19 |
| FR-04 | CRUD tài khoản | Tạo, xem, sửa, archive; validation theo platform | AT-01, AT-15 |
| FR-05 | Xem/copy secrets | Mặc định che; reveal tạm thời; copy có thông báo và dọn clipboard | AT-09 |
| FR-06 | Tìm kiếm/lọc | Theo tên, username, email, platform, status và tag | AT-16 |
| FR-07 | Mở tài khoản | Chỉ mở URL http/https hợp lệ bằng trình duyệt mặc định | AT-08 |
| FR-08 | Đồng bộ nhiều máy | Thay đổi metadata và ciphertext đồng bộ qua Supabase | AT-03, AT-14 |
| FR-09 | Follower manual | Cho phép nhập tay và ghi rõ nguồn/manual timestamp | AT-17 |
| FR-10 | Auto-lock | Khóa kho sau thời gian không hoạt động hoặc khi người dùng khóa thủ công | AT-13 |
| **FR-17** | **Recovery key** *(mới — lấp khoảng trống của §12.5 checklist, xem §12.2)* | Sinh khi tạo vault, hiện đúng một lần, bắt buộc xác nhận đã lưu, tải `.txt` được | AT-12 |
| **FR-18** | **Đổi master password** *(mới, cùng lý do)* | Cần master hiện tại hoặc recovery key; không mã hoá lại toàn bộ secrets | AT-12 |

### 4.2 Functional requirements P1

- **FR-11** — OAuth Meta và follower sync tự động.
- **FR-12** — Nút "Đồng bộ ngay" từng tài khoản và "Sync all" có cooldown.
- **FR-13** — Lịch sử follower 30/90 ngày dạng danh sách; chart để post-MVP nếu cần.
- **FR-14** — Dashboard summary: tổng tài khoản, active, cần kiểm tra, sync lỗi.
- **FR-15** — Tully empty/error/success states theo mascot system.
- **FR-16** — Device list và nút đăng xuất các session khác.

> **Nghiệm thu bởi (QA-01 — Master Roadmap gốc có 16 FR và 10 AT nhưng không ánh xạ; đối chiếu tay lộ ra 8 FR không AT nào phủ).** FR-11: AT-05, AT-06 · FR-12: AT-18 · FR-13: (chưa có AT — chart để post-MVP nên chấp nhận được) · FR-14: AT-19 · FR-16: AT-25. Luật áp cho mọi FR mới thêm sau này: **một FR không có AT thì không được đánh dấu hoàn thành.**

### 4.3 Quy tắc nghiệp vụ

- **BR-01** — Mỗi account thuộc đúng một owner_id; mọi query client phải bị giới hạn bởi `auth.uid()`.
- **BR-02** — Một record được xem là trùng khi cùng owner + platform + normalized username; email trùng chỉ cảnh báo, không chặn.
- **BR-03** — Archive là mặc định thay cho delete cứng; xóa vĩnh viễn yêu cầu xác nhận lại.
- **BR-04** — Follower count phải là số nguyên ≥0 hoặc null; không dùng 0 để biểu diễn "chưa biết".
- **BR-05** — Trường secrets được ghi trong một encrypted payload có version để hỗ trợ đổi thuật toán/migration.
- **BR-06** — Nút mở tài khoản bị vô hiệu hóa nếu URL không hợp lệ; URL do platform template sinh ra được ưu tiên.
- **BR-07** — Manual sync không chạy song song hai job cho cùng account.
- **BR-08** — Token hết hạn chuyển connection status sang `reauth_required`; không xóa lịch sử follower.
- **BR-09** *(mới — DATA-03, cần một quy tắc chuẩn hoá rõ ràng vì §11.2 chỉ ghi chú "normalized_username để unique mềm" mà không định nghĩa)* — Chuẩn hoá username = bỏ ký tự `@` đầu, `lower()`, `trim()`. Áp dụng ở đúng một tầng (repository/Edge Function), không lặp lại logic ở nhiều nơi.

---

## 5. Luồng người dùng và cấu trúc màn hình

### 5.1 Information architecture

| Khu vực | Màn hình | Chức năng |
|---|---|---|
| Workspace | Dashboard | Tổng quan, quick filters, account grid, sync status |
| Accounts | All Accounts | Tìm kiếm, lọc, sort, grid/list view |
| Accounts | Account Detail | Thông tin, secrets, follower history, connection, notes |
| Actions | Add / Edit Account | Form theo platform; validation và preview card |
| System | Sync Center | Job gần đây, lỗi, kết nối lại OAuth |
| System | Settings | Profile, security, auto-lock, devices, appearance |

### 5.2 Luồng onboarding lần đầu

1. Mở app → màn hình Tully Wave → đăng nhập hoặc tạo tài khoản Turtly.
2. Tạo master password → hệ thống tạo recovery key một lần → yêu cầu lưu ra nơi an toàn *(cơ chế cụ thể ở §12.2)*.
3. Khởi tạo kho rỗng → chọn "Thêm tài khoản đầu tiên".
4. Điền thông tin cơ bản và secrets → xem preview Account Card → lưu.
5. Tùy chọn kết nối Meta ngay hoặc để follower ở chế độ Manual.
6. Về Dashboard → Tully Success + gợi ý tạo thêm tài khoản.

> **ĐIỀU KIỆN TIÊN QUYẾT (UX-06 — logic tự suy, không có trong Master Roadmap gốc nhưng cần thiết).** Bước 4 thu thập secrets (mật khẩu tài khoản, mật khẩu email, recovery code). Nếu vault chưa unlock ở bước này, app không có DEK để mã hoá — người dùng gõ xong 4 trường nhạy cảm rồi mới bị chặn, và cách "sửa" tự nhiên (giữ tạm trong React state chờ unlock) là chính hành vi mà §10.3 cấm. **Nút "Thêm tài khoản" vô hiệu hoá khi vault khoá**, kèm tooltip mở dialog unlock trước khi vào form.

### 5.3 Luồng thêm tài khoản

- **Bước 1 — Platform**: Chọn Facebook, Instagram hoặc Google/Gmail.
- **Bước 2 — Identity**: Avatar, display name, username, profile URL, location.
- **Bước 3 — Login**: Email đăng nhập, mật khẩu tài khoản, recovery email, mật khẩu email, 2FA note/recovery code.
- **Bước 4 — Metrics**: Chọn API/Manual/None; nếu Manual nhập follower và ngày cập nhật.
- **Bước 5 — Review**: Preview card, kiểm tra duplicate warning, lưu.

### 5.4 Luồng mở tài khoản

1. Người dùng nhấn "Mở tài khoản" trên card hoặc detail.
2. App xác thực URL thuộc http/https và đúng template theo platform.
3. Tauri Opener mở trình duyệt mặc định. Với Gmail dùng URL có tham số `authuser=email` nếu có thể.
4. Nếu trình duyệt chưa đăng nhập đúng tài khoản, người dùng tự chọn/đăng nhập trong trình duyệt.

> **KHÔNG LÀM TRONG MVP** Không inject JavaScript, không tự điền mật khẩu, không đọc cookie trình duyệt và không chạy Selenium/Puppeteer để vượt cơ chế đăng nhập.
>
> **BỔ SUNG (ARCH — validate URL ở Rust là điều kiện đủ, không phải chỉ "http/https hợp lệ").** Chặn thêm: credential nhúng trong URL (`https://user:pass@…`), host ngoài allowlist theo platform (`facebook.com`, `instagram.com`, `mail.google.com`), và chuẩn hoá punycode để chặn homograph domain giả dạng. Xem AT-08.

---

## 6. Thiết kế Dashboard và Account Card

### 6.1 Layout Desktop

| Vùng | Kích thước/Quy tắc | Nội dung |
|---|---|---|
| App window | Min 1180×720; mặc định 1440×900 | Không ép full-screen; ghi nhớ kích thước/cửa sổ |
| Sidebar | 240 px; có collapsed 76 px | Logo, Dashboard, Accounts, Sync Center, Settings |
| Topbar | 72 px | Tiêu đề, search toàn cục, Sync all, Add account, avatar |
| Content | Padding 28–32 px | Summary cards → filter bar → account grid |
| Account grid | Min card 340 px; gap 20 px | 3 cột ở 1440 px, 2 cột khi cửa sổ hẹp |

### 6.2 Dashboard composition

- Header: "Good evening, Tiến" + Tully **Neutral** nhỏ, không chiếm quá 88 px chiều cao.
- Summary: Total Accounts, Active, Needs Attention, Sync Errors; card số liệu cao 104–116 px.
- Search/filter: search 360 px, platform segmented control, status dropdown, sort dropdown.
- Account grid: ưu tiên card có mật độ vừa; không đưa password ra Dashboard.
- Empty state: Tully Search + CTA "Thêm tài khoản đầu tiên".

> **SỬA (UX-05 — Master Roadmap tự mâu thuẫn với chính mình).** §6.2 gốc ghi "Tully Wave nhỏ" ở header Dashboard, nhưng bảng §9.2 "Quy tắc sử dụng mascot" (cũng của Master Roadmap) định nghĩa `Wave → Onboarding, welcome back` và `Neutral → Dashboard greeting`. Đây không phải hai tài liệu khác nhau — cùng một file tự nói ngược nhau. Bảng §9.2 thắng vì nó là bảng quy tắc, còn §6.2 là mô tả. Header Dashboard dùng **Tully Neutral**, không phải Wave.

### 6.3 Account Card — mẫu tham chiếu

| Thành phần | Đặc tả đề xuất |
|---|---|
| Container | 340–380 px; padding 18 px; radius 18 px; border #D8E4E0; shadow `0 8 24 rgba(11,46,40,.08)` |
| Platform badge | 32 px, chồng góc avatar; icon chính thức, có accessible label |
| Avatar | 88×88 px; radius 18 px; object-fit cover; fallback initials |
| Identity | Display name 16 px/700; username 13 px; email 13 px muted; ellipsis + tooltip |
| Status | Pill Active/Review/Inactive/Locked; không chỉ dùng màu để truyền đạt |
| Follower | Icon 16 px + compact number; kèm source trong tooltip/detail |
| Sync row | Divider; icon trạng thái + "Đã đồng bộ 8 phút trước" |
| Actions | Secondary "Đồng bộ"; Primary-outline "Mở tài khoản"; min height 42 px |

### 6.4 Các trạng thái card

| Trạng thái | Màu/biểu tượng | Hành vi |
|---|---|---|
| Active | Green + check | Mọi hành động khả dụng |
| Manual | Gray + edit | Follower nhập tay; Sync đổi thành "Cập nhật" |
| Syncing | Teal + spinner | Khóa nút sync; vẫn cho mở tài khoản |
| Needs re-auth | Amber + key | CTA đổi thành "Kết nối lại" |
| Error | Red + warning | Hiển thị lỗi ngắn; detail có mã và cách xử lý |
| Archived | Muted | Ẩn mặc định khỏi Dashboard; có Restore |

> **ĐÁNG CÂN NHẮC, không phải mặc định (UX-01 — quan sát, để lại làm ghi chú vì hai lý do độc lập với bất kỳ tài liệu nào khác).** (a) Nút "Đồng bộ" trên card chỉ có tác dụng cho account ở chế độ `api`; theo §3, phần lớn Facebook profile cá nhân và Instagram personal ở chế độ Manual — với nhóm này, nút Đồng bộ sẽ disabled ở trạng thái ổn định của sản phẩm, không chỉ ở giai đoạn đầu. (b) container 340–380px + avatar 88px + 2 nút ngang hàng đẩy card khá cao; với mục tiêu 500+ account (§1) đó là nhiều lần cuộn hơn. Nếu muốn thử nghiệm, có thể rút avatar xuống 40–48px và gộp "Đồng bộ" vào menu `⋯`, chỉ giữ "Mở tài khoản" làm nút chính. **Đây là gợi ý, không phải yêu cầu — giữ đặc tả gốc ở trên làm mặc định** trừ khi có ý kiến khác.

---

## 7. Trang chi tiết tài khoản

### 7.1 Bố cục

Trang chi tiết dùng layout 2 cột: cột chính 65% cho identity, follower và notes; cột phụ 35% cho credential vault, trạng thái connection và quick actions. Ở cửa sổ hẹp, cột phụ xuống dưới. Header trang giữ avatar, platform, tên, status và các nút Edit / Open account / More.

### 7.2 Nhóm dữ liệu hiển thị

| Nhóm | Trường | Bảo vệ/hiển thị |
|---|---|---|
| Identity | Display name, username, avatar, platform, profile URL | Hiển thị bình thường |
| Contact | Login email, recovery email, phone, location | Email copy được; phone tùy chọn |
| Secrets | Account password, email password, recovery codes, 2FA note | Che mặc định; reveal/copy có timeout |
| Metrics | Follower hiện tại, nguồn, last sync, lịch sử | Không dùng 0 thay null |
| Connection | OAuth status, scopes, token expiry, last error | Không bao giờ hiển thị raw token |
| Metadata | Tags, status, notes, created/updated, device cuối sửa | Notes hỗ trợ plain text; không HTML tùy ý |

> **LƯU Ý RIÊNG TƯ, không phải cấm (SEC-02 — mềm hơn bản trước vì lý lẽ mạnh nhất từng dùng lấy từ một tài liệu khác đã bị bỏ).** `notes` là cột text thường trên Supabase (§11.2) — plaintext trên cloud, không mã hoá. Đây là lựa chọn hợp lý cho ghi chú thông thường (tag, ngữ cảnh). Nhưng vì đây là field tự do, người dùng có thể vô tình gõ vào đó thông tin nhạy (số điện thoại khôi phục, gợi ý bảo mật). **Khuyến nghị:** thêm một dòng gợi ý nhỏ dưới ô notes trong UI — *"Không nên ghi số điện thoại khôi phục hay câu hỏi bảo mật vào đây — trường này không mã hoá."* Không cần đổi schema.

### 7.3 Credential Vault interaction

- Khối secrets có trạng thái Locked/Unlocked độc lập với phiên đăng nhập cloud.
- Nhấn Reveal yêu cầu app vault đang unlocked; sau 15 giây tự che lại.
- Nhấn Copy hiển thị toast "Đã sao chép — clipboard sẽ được xóa sau 30 giây".
- Không cho chụp màn hình là tính năng best-effort, không xem đó là biện pháp bảo mật chính.
- Edit secret tạo `updated_at` và audit event nhưng không lưu plaintext cũ.
- Auto-lock mặc định 10 phút; tùy chọn 1/5/10/30 phút hoặc khi app minimize.

> **SỬA — lời hứa clipboard không giữ được nguyên văn trên Windows (SEC-04, sự thật về Windows, không phụ thuộc tài liệu nào).** Windows Clipboard History (`Win+V`) giữ một bản sao riêng mà việc xoá clipboard của app **không** động tới. Toast không nên hứa "clipboard sẽ được xóa" như một đảm bảo tuyệt đối — đổi thành *"Đã sao chép — Turtly sẽ xoá sau 30 giây"*. Trước khi xoá, **so sánh nội dung hiện tại**: chỉ xoá nếu vẫn đúng là thứ Turtly đã ghi, để không xoá mất thứ người dùng vừa copy sau đó. Nếu phát hiện Clipboard History đang bật (đọc registry `HKCU\Software\Microsoft\Clipboard\EnableClipboardHistory`), hiện một banner cảnh báo **đúng một lần** trong Settings.
>
> **SỬA — bổ sung tác nhân khoá còn thiếu (SEC-05).** "Không hoạt động" và "minimize" không đủ. Bắt buộc khoá thêm khi: khoá màn hình Windows (`WTS_SESSION_LOCK`), sleep/hibernate, thoát app, đăng xuất Turtly — các tác nhân này không tuỳ chọn. Xem AT-13.

### 7.4 Validation quan trọng

- **Facebook**: URL phải thuộc facebook.com; username chuẩn hóa bỏ @; follower chỉ nhận API khi Page đã liên kết.
- **Instagram**: URL thuộc instagram.com; username lowercase; account type chọn Personal/Creator/Business.
- **Gmail**: Email hợp lệ; URL mặc định tự sinh; follower không áp dụng.
- **Secrets**: Không giới hạn ký tự đặc biệt; không trim mật khẩu; không ghi vào analytics/log.
- **Location**: Text tự do tối đa 120 ký tự; không cần GPS trong MVP.

---

## 8. Hệ thống thiết kế Turtly

### 8.1 Brand personality

Turtly nên tạo cảm giác thân thiện, bình tĩnh và đáng tin: mềm mại hơn một công cụ quản trị doanh nghiệp nhưng nghiêm túc hơn một ứng dụng mascot thuần giải trí. "Chiếc mai" là ẩn dụ cho nơi gom và bảo vệ tài khoản; các ô trên mai gợi dashboard modules.

### 8.2 Color tokens

**Từ Master Roadmap gốc §8.2 — giữ nguyên:**

| Token | Hex | Vai trò |
|---|---|---|
| Deep Teal | `#0E3D3B` | Brand primary, heading, sidebar, app icon background |
| Green Teal | `#1E6F6A` | Primary action, link, selected state |
| Mint | `#A7E1D2` | Tint, success background, illustration |
| Soft Lime | `#CDEB7A` | Accent nhỏ, highlight; không dùng cho body text |
| Dark Forest | `#0B2E28` | Text đậm/dark mode surface |
| Surface | `#F6F8F7` | Nền app |
| Border | `#D8E4E0` | Border card/input/divider |
| Danger | `#A33B3B` | Delete, security error; luôn kèm icon/text |

> **LẤP KHOẢNG TRỐNG (UX-03 — §8.2 gốc không định nghĩa màu cho 4 trong 6 trạng thái mà §6.4 đặt tên bằng lời: "Green" cho Active, "Amber" cho Needs re-auth, "Red" cho Error, "Teal" cho Syncing, "Gray" cho Manual. §8.6 tự đặt mục tiêu WCAG 2.2 AA. Cần giá trị hex thật để build được và để đo được tương phản.** Bốn màu dưới đây hài hoà với palette có sẵn và đã kiểm tra đạt ≥4.5:1 trên nền trắng cho phần chữ:

| Trạng thái | Icon/viền | Chữ (≥4.5:1 trên trắng) | Nền chip nhạt |
|---|---|---|---|
| Success (Active) | `#2E9B64` | `#1F6E46` | `#EAF5EF` |
| Warning (Needs re-auth) | `#E3A32B` | `#8A5D0F` | `#FBF3E3` |
| Error | `#D95C59` hoặc dùng thẳng **Danger** `#A33B3B` *(đã đạt 6,5:1)* | `#A93832` | `#FBECEB` |
| Info (Syncing) | Green Teal `#1E6F6A` | — (dùng cùng Green Teal, đạt 5,4:1) | `#E9F2F0` |
| Inactive (Manual/Archived) | `#8A9691` | `#5F6F6B` | `#EFF2F1` |

Trạng thái luôn là **icon + chữ**, không chỉ dựa vào màu (§8.6).

### 8.3 Typography

| Vai trò | Font | Style |
|---|---|---|
| Logo/brand headline | Nunito Sans | Bold / ExtraBold, tròn và thân thiện |
| UI/body/data | Inter | Regular / Medium / Semibold |
| Fallback | Arial / system-ui | Khi font chưa tải hoặc trên renderer hệ thống |
| Numeric metrics | Inter | Tabular numbers để follower không nhảy chiều rộng |

### 8.4 Spacing, radius và elevation

- Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40 px.
- Radius: input/button 10–12 px; card 16–18 px; modal 20–24 px; pill 999 px.
- Border: 1 px; focus ring 3 px `rgba(30,111,106,.25)`.
- Elevation 1: `0 2 8 rgba(11,46,40,.05)`; Elevation 2: `0 8 24 rgba(11,46,40,.08)`.
- Motion: 160–220 ms ease-out; tôn trọng `prefers-reduced-motion`.

### 8.5 Component inventory

Button: primary, secondary, outline, ghost, danger; icon-only luôn có tooltip · Input: text, password, search, select, combobox, tag input; label không dùng placeholder thay thế · AccountCard, StatCard, PlatformBadge, StatusPill, SyncIndicator · SecretField, CopyButton, RevealButton, VaultLockBanner · EmptyState, ErrorState, Skeleton, Toast, ConfirmDialog, Drawer/Modal · TullyIllustration với enum state, kích thước và alt text cố định.

### 8.6 Accessibility

- Mục tiêu WCAG 2.2 AA cho contrast, focus, keyboard và label.
- Toàn bộ flow CRUD, unlock, reveal, copy, sync và open account dùng được bằng bàn phím.
- Status không dựa riêng vào màu; có text và icon.
- Avatar/mascot có alt text theo ngữ cảnh; ảnh trang trí dùng alt rỗng.
- Cỡ chữ UI tối thiểu 12 px cho metadata, body chính 14–16 px.

> **BỔ SUNG (UX-09 — mục tiêu này không có test nào phủ trong Master Roadmap gốc).** Thêm **AT-11**: đi hết luồng `mở app → unlock vault → tìm kiếm → mở chi tiết → reveal → copy → mở tài khoản` chỉ bằng bàn phím; axe-core trên Dashboard và Detail phải 0 lỗi `serious`/`critical`.

---

## 9. Logo và mascot Tully

Các hình trong `docs/brand-reference/` là tài sản định hướng, **chưa phải asset production**.

### 9.1–9.2 Mascot system

Tully có 8 trạng thái: Neutral, Wave, Search, Security, Sync, Offline, Success, Import.

| State | Dùng tại | Không dùng |
|---|---|---|
| Neutral | Dashboard greeting, About | Lặp lại trên mọi card |
| Wave | Onboarding, welcome back | Error hoặc security warning |
| Search | Empty search, no result | Loading |
| Security | Create master password, vault locked | Success toast nhỏ |
| Sync | Sync Center, background job | Khi mất kết nối hoàn toàn |
| Offline | No network, paused sync | Lỗi credentials |
| Success | Create/import/sync thành công | Hiển thị liên tục sau action |
| Import | Post-MVP CSV/Excel import | MVP nếu chưa có import |

### 9.3 Asset — trạng thái thật *(UX-07, UX-08 — đo trực tiếp trên file ảnh, độc lập với mọi tài liệu)*

Đã giải nén 22 file PNG trong `docs/brand-reference/` và đọc pixel trực tiếp:

| Vấn đề | Bằng chứng |
|---|---|
| Nền magenta **nung cứng** vào ảnh | 22/22 file có kênh alpha nhưng **0,0 % pixel trong suốt**; `pixel(0,0) = (250, 3, 250, 255)` |
| Magenta **không sạch** | Dao động `#FA03FA`…`#F505EF` giữa các pixel → đã qua nén mất dữ liệu. Chroma-key sẽ để lại viền tím quanh cạnh khử răng cưa |
| Toàn bộ **raster, độ phân giải thấp** | Lớn nhất 399×219. App icon Windows cần 256×256 trong ICO đa kích thước |
| Wordmark **không phải Nunito Sans** | Chữ vẽ trong ảnh render — không kern lại, không đổi cỡ, không dựng lại được |
| **8 pose không cùng một con rùa** | Tỷ lệ thân, cỡ mắt, hình ô trên mai và sắc xanh khác nhau từng pose |
| Bản mono giữ **chấm sáng ở mắt** | Ở 16 px chấm đó nhỏ hơn một pixel → mark thành khối đen không đặc điểm ở taskbar/favicon |

**Việc phải làm** — hạng mục riêng 1–2 ngày, không lẫn vào sprint code: vẽ lại logomark + 8 pose thành SVG phẳng cùng một hệ dựng hình (cùng lưới, cùng độ dày nét, cùng token màu §8.2) · dựng wordmark bằng Nunito Sans ExtraBold thật, kern tay · thêm `logomark-small.svg` riêng cho ≤24px (bỏ chi tiết mắt) · xuất app icon từ vector 1024×1024 → ICO đa kích thước.

**Cho tới khi có SVG thật:** dùng placeholder hình học đơn giản từ màu Mint. Không tự sinh mascot khác phong cách.

---

## 10. Kiến trúc kỹ thuật

### 10.1 Technology stack

| Layer | Công nghệ | Lý do |
|---|---|---|
| Desktop shell | Tauri 2 + Rust stable | Bundle nhẹ; permission allowlist; gọi native command rõ ràng |
| Frontend | React + TypeScript + Vite | Hệ sinh thái mạnh, component hóa |
| UI | Tailwind CSS + Radix/shadcn primitives tùy biến | Nhanh nhưng vẫn giữ brand Turtly |
| State/data | TanStack Query + Zustand | Tách server cache và local UI state |
| Forms | React Hook Form + Zod | Validation type-safe |
| Cloud | Supabase Auth/Postgres/Realtime/Edge/Cron | Đủ cho một người dùng nhiều máy |
| **Local secrets** | **Argon2id + XChaCha20-Poly1305 + zeroize (Rust)** *(sửa — xem dưới)* | Kho khóa cục bộ tự triển khai |
| Testing | Vitest, Testing Library, Playwright + tauri-driver | Unit, component, desktop smoke test |

> **SỬA (ARCH-02 — Master Roadmap tự mâu thuẫn với chính mình, không cần tài liệu ngoài để thấy).** §10.1 gốc chỉ định **Tauri Stronghold** cho local secrets. Nhưng §12.2 (cùng file) mô tả đầy đủ một sơ đồ khoá khác: DEK 32 byte → Argon2id sinh KEK từ master password → KEK bọc DEK → nonce riêng mỗi payload + XChaCha20-Poly1305/AES-256-GCM. Đây là **hai cơ chế khác nhau cho cùng một việc**. Sơ đồ §12.2 bắt buộc phải là cái thật vì nó tương thích đa thiết bị (wrapped_dek đồng bộ qua Supabase được); Stronghold là snapshot file cục bộ, không đồng bộ được, nên máy B không mở được secrets bằng Stronghold của máy A. **Bỏ Stronghold**, dùng trực tiếp `argon2` + `chacha20poly1305` + `zeroize` + `rand` trong Rust, đúng như §12.2 đã mô tả.

### 10.2 Repository structure

```text
turtly/
├─ src/                      # React UI
│  ├─ app/                   # router, providers, layouts
│  ├─ features/accounts/     # CRUD, card, detail, forms
│  ├─ features/vault/        # unlock, reveal, copy lifecycle
│  ├─ features/sync/         # job state, connection UI
│  ├─ components/ui/         # branded primitives
│  ├─ lib/supabase/          # client + typed queries
│  └─ assets/brand/          # approved logo/Tully assets (SVG)
├─ src-tauri/
│  ├─ src/commands/          # encrypt/decrypt/open URL/clipboard
│  ├─ src/security/          # key lifecycle, Argon2id, XChaCha20
│  ├─ capabilities/          # minimum permissions
│  └─ tauri.conf.json
├─ supabase/
│  ├─ migrations/            # schema + RLS + indexes
│  ├─ functions/meta-oauth/
│  ├─ functions/sync-followers/
│  └─ seed.sql
├─ tests/                    # unit, integration, e2e
└─ docs/                     # ADR, API limits, release notes
```

### 10.3 Ranh giới trách nhiệm

- React không trực tiếp giải mã payload; gọi Tauri command và chỉ nhận giá trị khi UI cần reveal/edit.
- Supabase client dùng publishable key + JWT; mọi bảng public bật RLS.
- Edge Function giữ provider/app secrets và service credential; xác minh user trước mọi thao tác.
- Meta token nằm trong vùng server-only; desktop chỉ thấy connection status và metadata không nhạy cảm.
- Tauri capabilities chỉ allow URL/provider cần thiết; không cấp shell/filesystem rộng nếu không dùng.

> **BỔ SUNG (ARCH-07 — sự thật kỹ thuật về Tauri IPC, độc lập với tài liệu).** IPC tuần tự hoá qua JSON, nên plaintext reveal sẽ trở thành một `String` JavaScript — bất biến, GC dọn không xoá nội dung, không zeroize được từ JS. Giảm thiểu: **đúng hai** lệnh Rust chạm plaintext — `reveal_secret` (trả chuỗi, dùng cho hiển thị 15 giây) và `copy_secret_to_clipboard` (**không trả chuỗi về JS**, Rust ghi thẳng clipboard — đường mặc định). Giá trị reveal không đặt vào React state, giữ trong `ref`. Mô hình đe doạ của Turtly không bao gồm kẻ tấn công đã chạy được mã trên máy hoặc dump được bộ nhớ tiến trình — ghi rõ giới hạn này ra để không hứa quá.
>
> **BỔ SUNG (ARCH-08 — danh sách capability cụ thể, Master Roadmap gốc chỉ nói nguyên tắc mà không liệt kê).**

| Permission | Lý do |
|---|---|
| `core:default` | Tối thiểu để chạy |
| `opener:allow-open-url` có scope `https://*.facebook.com/*`, `https://*.instagram.com/*`, `https://mail.google.com/*` | FR-07, scope ở tầng capability chứ không chỉ validate trong Rust |
| `clipboard-manager:allow-write-text` | FR-05 copy. **Không** cấp `read-text` |
| `updater:default` | Xem §15.2 |
| `shell:*`, `fs:*` rộng, `http:*` | **Không cấp** — không tính năng nào cần |

> **BỔ SUNG (ARCH-05 — cửa một chiều của Tauri updater, sự thật kỹ thuật).** Tauri updater xác thực bản cập nhật bằng cặp khoá ký riêng; public key phải nằm **trong bản build đã phát hành**. Nếu bản đầu tiên ship không có public key, không bản nào sau này tự cập nhật được cho máy đang chạy bản đó — phải gỡ cài lại tay. Chi phí sinh khoá bây giờ (~30 phút) rẻ hơn rất nhiều so với sửa sau. **Sinh khoá updater ở Sprint 0**, nhúng public key vào `tauri.conf.json` ngay cả khi chưa bật updater (`active: false`).

---

## 11. Mô hình dữ liệu

### 11.1 Các bảng chính

| Bảng | Vai trò | Trường cốt lõi |
|---|---|---|
| profiles | Hồ sơ chủ Turtly | id, display_name, avatar_url, timezone, settings_json |
| accounts | Metadata tài khoản | id, owner_id, platform, name, username, emails, location, profile_url, status, tags, timestamps |
| account_secrets | Payload đã mã hóa | account_id, ciphertext, nonce, algorithm, key_version, updated_at |
| user_keyrings | DEK đã được master password bọc | owner_id, wrapped_dek, salt, kdf_params, version |
| account_metrics | Lịch sử follower | account_id, metric_type, value, source, recorded_at |
| **platform_connections** | OAuth — **client đọc trạng thái, không đọc token** *(sửa, xem dưới)* | account_id, provider, external_id, scopes, status, expires_at |
| **platform_connection_secrets** | **Token — mới** | connection_id, access_token_ciphertext, refresh_token_ciphertext, nonce, key_version |
| sync_jobs | Theo dõi job | account_id, status, trigger, attempts, started_at, finished_at, error_code, **heartbeat_at** |
| devices | Thiết bị/session | owner_id, device_name, platform, last_seen_at, revoked_at |
| audit_events | Sự kiện bảo mật không chứa secret | owner_id, action, entity_id, device_id, created_at |

> **SỬA — RLS không giấu được cột (SEC-01, sự thật về Postgres, không phụ thuộc tài liệu nào).** Master Roadmap gốc §12.3 định nói *"platform_connections raw token không cho client đọc"* và giao việc đó cho RLS. Nhưng **RLS lọc theo hàng, không ẩn được cột** — không có cách nào viết policy trả về hàng mà giấu một cột trong hàng đó. Nếu client được `select` một hàng của `platform_connections`, nó đọc được toàn bộ cột kể cả token. Sửa: **tách hai bảng.**

```sql
-- Client đọc được: chỉ trạng thái
create table platform_connections (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  owner_id   uuid not null references auth.users(id),
  provider text not null, external_id text, scopes text[],
  status text not null,              -- active | reauth_required | revoked | unsupported
  expires_at timestamptz,
  last_error_code text,              -- mã lỗi, KHÔNG phải thông điệp thô của Meta
  updated_at timestamptz not null default now()
);
alter table platform_connections enable row level security;
create policy own_conn on platform_connections for select using (owner_id = auth.uid());
-- KHÔNG có policy insert/update/delete cho client: chỉ Edge Function ghi.

-- Client KHÔNG BAO GIỜ chạm tới
create table platform_connection_secrets (
  connection_id uuid primary key references platform_connections(id) on delete cascade,
  access_token_ciphertext bytea not null,
  refresh_token_ciphertext bytea,
  nonce bytea not null, key_version int not null default 1,
  updated_at timestamptz not null default now()
);
alter table platform_connection_secrets enable row level security;
-- RLS bật + KHÔNG policy nào = mọi truy cập bằng anon/authenticated đều bị từ chối.
revoke all on platform_connection_secrets from anon, authenticated;
```

Khoá mã hoá token nằm trong Supabase Vault, chỉ Edge Function (service role) đọc được.

### 11.2 accounts — field specification

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
| follower_mode | text | api \| manual \| none |
| follower_current | bigint | Nullable; cache hiển thị nhanh — **chỉ ghi bởi Edge Function**, xem §11.3 |
| follower_synced_at | timestamptz | Nullable |
| tags | text[] | Mặc định empty array |
| notes | text | Plain text; nullable — xem lưu ý §7.2 |
| created_at/updated_at | timestamptz | Server timestamps |
| archived_at | timestamptz | Soft delete |

> **SỬA (DATA-03 — ba khoảng trống schema, tự lộ ra khi đọc kỹ §11.2/§11.3, không cần đối chiếu tài liệu khác):**
> 1. `normalized_username` được nhắc như một khái niệm ("để unique mềm") nhưng **không phải cột thật** trong bảng — mà §11.3 lại đặt unique index trên chính nó. Migration sẽ fail vì tham chiếu cột không tồn tại. → thêm thành generated column, công thức ở bảng trên.
> 2. `citext` (kiểu chuẩn hoá không phân biệt hoa-thường của Postgres) cần `create extension citext` — không được nhắc tới, và **không tồn tại trên SQLite** nếu sau này có bản offline-first. Dùng `text` thường + luôn lưu giá trị đã `lower()` ở tầng ghi (repository/Edge Function), một quy tắc áp một chỗ.
> 3. `follower_current` được ghi chú "cache hiển thị nhanh" nhưng không có gì đảm bảo nó khớp với `account_metrics` — nguồn thật. **Chỉ Edge Function `sync-followers` được ghi hai cột `follower_current`/`follower_synced_at`, trong cùng transaction với insert vào `account_metrics`.** Client không bao giờ ghi hai cột này (cưỡng chế bằng column-level grant hoặc trigger từ chối).

### 11.3 Index và constraint tối thiểu

- Index `accounts(owner_id, archived_at, updated_at desc)`.
- Index `accounts(owner_id, platform, status)`.
- Unique partial index `owner_id + platform + normalized_username` khi username khác null và chưa archived.
- Index `account_metrics(account_id, metric_type, recorded_at desc)`.
- **Unique partial** `sync_jobs(account_id) where status in ('queued','running')` để tránh chạy song song *(BR-07)*.
- Trigger `updated_at`; không trigger decrypt hoặc xử lý secret trong database public.
- **Bổ sung (DATA-04):** `alter publication supabase_realtime add table accounts, account_secrets;` — thiếu dòng này thì Realtime không lỗi gì cả, chỉ đơn giản là không có sự kiện nào tới. Dễ quên, dễ không phát hiện ra.
- **Bổ sung (DATA-05 — dọn job kẹt).** `sync_jobs` thêm cột `heartbeat_at`, Edge Function cập nhật mỗi 10 giây khi chạy. Cron riêng mỗi 15 phút: `update sync_jobs set status='failed', error_code='TIMEOUT' where status='running' and heartbeat_at < now() - interval '5 minutes';` — nếu không có việc này, một Edge Function bị timeout/crash sẽ để lại job `running` mãi mãi, chặn vĩnh viễn sync tiếp theo của account đó (do unique partial index ở trên).

---

## 12. Bảo mật và đồng bộ đa thiết bị

### 12.1 Hai lớp đăng nhập khác nhau

- Supabase account password/magic link: chứng minh quyền truy cập dữ liệu cloud.
- Master password: giải mã kho bí mật. Không gửi master password lên server và không dùng lại mật khẩu Supabase.

### 12.2 Quy trình tạo khóa

1. Sinh DEK ngẫu nhiên 32 byte trên thiết bị.
2. Từ master password + salt, dùng Argon2id sinh KEK với tham số được version hóa: `m=64 MiB, t=3, p=1`.
3. Dùng KEK bọc DEK; upload `wrapped_dek` + salt + kdf_params, không upload KEK/master password.
4. Mỗi secret payload dùng nonce riêng và **XChaCha20-Poly1305** *(chốt một thuật toán duy nhất, không để ngỏ "hoặc AES-GCM" — nonce 192-bit cho phép sinh ngẫu nhiên mà không lo trùng, tránh lớp lỗi nguy hiểm nhất của AES-GCM khi tự quản nonce)*.
5. DEK đã mở chỉ sống trong vùng bảo vệ cục bộ (`Zeroizing<[u8; 32]>` ở Rust) và bị xóa khi auto-lock/logout.

> **LẤP KHOẢNG TRỐNG (SEC-03/FR-17/FR-18 — Master Roadmap gốc chỉ có một ô tick "Recovery key hiển thị một lần; có luồng rotate master password" trong checklist §12.5, không mô tả cơ chế. Đây là luồng hậu quả cao nhất trong sản phẩm — mất master password không có recovery hợp lệ = mất vĩnh viễn mật khẩu của mọi tài khoản.)**
>
> **Recovery key là KEK thứ hai độc lập.** Sinh 32 byte ngẫu nhiên → mã hoá Base32 chia nhóm có ký tự kiểm tra → bọc **cùng một DEK**. `user_keyrings` có hai bản bọc: `wrapped_dek_by_master` và `wrapped_dek_by_recovery`. Mở được bằng một trong hai.
>
> **Đổi master password** = giải DEK bằng master cũ hoặc recovery → salt mới → KEK mới → bọc lại DEK → ghi đè `wrapped_dek_by_master`. **DEK không đổi**, nên không phải mã hoá lại `account_secrets`. Recovery key cũ vẫn hợp lệ sau khi đổi master — phải nói rõ cho người dùng, kèm nút "Sinh recovery key mới" nếu muốn vô hiệu hoá cái cũ.
>
> Onboarding (§5.2 bước 2): hiện recovery key **đúng một lần**, bắt buộc người dùng gõ lại một phần để xác nhận đã lưu (không cho bấm "Tôi đã lưu" suông), có nút tải `.txt`.

### 12.3 RLS policy pattern

Tất cả bảng thuộc người dùng có `owner_id = auth.uid()` cho SELECT/INSERT/UPDATE/DELETE. `platform_connection_secrets` **không có policy nào** — xem §11.1. Storage avatar dùng path theo user id và policy tương tự.

> **BỔ SUNG (DATA-07 — khuôn mẫu bắt buộc cho mọi Edge Function).** Service role đứng trên RLS. Nếu function nhận `account_id` từ request body và thao tác luôn, bất kỳ người dùng đã đăng nhập nào cũng chạm được dữ liệu người khác — lỗ hổng này vượt qua mọi test RLS thông thường vì test đó chạy qua client với anon key, không qua Edge Function.

```ts
// 1. Lấy user từ JWT của người gọi — KHÔNG lấy từ body.
const { data: { user }, error } = await userClient.auth.getUser();
if (error || !user) return json(401, { code: 'UNAUTHENTICATED' });

// 2. Xác minh quyền sở hữu TRƯỚC khi chạm service role.
const { data: owned } = await serviceClient
  .from('accounts').select('id')
  .eq('id', body.account_id).eq('owner_id', user.id)   // ← dòng quyết định
  .maybeSingle();
if (!owned) return json(404, { code: 'NOT_FOUND' });    // 404, không phải 403

// 3. Từ đây mới dùng serviceClient cho việc thật.
```

### 12.4 Đồng bộ và xử lý xung đột

- Metadata dùng optimistic update + `updated_at`/version integer để phát hiện stale write.
- Nếu hai máy sửa cùng bản ghi, app không âm thầm last-write-wins cho secrets; hiển thị conflict dialog với thời điểm và device.
- Secrets thay đổi theo payload nguyên khối; mỗi update tăng `key_version`/`payload_version`.
- Realtime subscription cập nhật cache; khi reconnect thực hiện full delta fetch theo `updated_at`.
- Offline MVP: cho xem cache metadata; secrets chỉ mở nếu vault cục bộ còn hợp lệ.

> **SỬA (SEC-07 — conflict dialog không nên phơi giá trị bí mật).** Payload secrets là khối nguyên chứa 5 trường. Nếu conflict dialog hiện "cả hai phiên bản để chọn" theo nghĩa đen, nó phải giải mã và hiện cả 5 trường của cả hai máy cùng lúc — vi phạm nguyên tắc che mặc định (FR-05). Dialog chỉ nên hiện: thời điểm sửa, tên thiết bị, **danh sách tên trường đã đổi** (so sau khi giải mã cục bộ, chỉ so bằng không hiện giá trị). Ba lựa chọn: `Giữ bản máy này` · `Lấy bản máy kia` · `Xem chi tiết` (reveal có timeout, từng trường).
>
> **BỔ SUNG (DATA-04 — 3 chi tiết khiến "delta fetch theo updated_at" không hoạt động như mô tả nếu bỏ qua).** (a) `updated_at` dùng để so sánh phải là **giờ server** (trigger Postgres ghi bằng `now()`), không phải đồng hồ máy client — lệch giờ giữa hai máy sẽ làm bỏ sót bản ghi. (b) Delta fetch reconnect **không được lọc `deleted_at is null`** — nó cần nhận cả bản ghi đã xoá mềm để áp việc xoá vào cache cục bộ, nếu không xoá trên máy A sẽ không bao giờ tới máy B. (c) Thứ tự: delta fetch xong rồi mới bật lại Realtime subscription, để không bỏ sót sự kiện phát ra trong lúc offline (Realtime không tự bù khoảng mất kết nối).
>
> **Follower ghi bởi Edge Function không nên bị đè bởi client.** Nếu client PATCH cả hàng `accounts` khi sửa metadata (kể cả những cột nó không đổi), có rủi ro ghi đè giá trị `follower_current` mà cron vừa cập nhật. Client chỉ nên PATCH **các trường thực sự thay đổi**, không gửi cả hàng.

### 12.5 Security checklist

- [ ] Không commit `.env`, Meta App Secret, Supabase secret/service key.
- [ ] Ẩn secrets khỏi logs, telemetry, error messages và DevTools production.
- [ ] Disable remote navigation và CSP chỉ cho origin cần thiết.
- [ ] Validate URL ở Rust trước khi opener thực thi *(mở rộng ở §5.4)*.
- [ ] Rate limit unlock attempts; tăng delay sau nhiều lần sai — **biện pháp chính vẫn là tham số Argon2id** (~0,3–0,5s mỗi lần thử), rate limit UI chỉ chống dò thủ công tại chỗ *(SEC-06)*.
- [ ] Recovery key hiển thị một lần; có luồng rotate master password *(cơ chế: §12.2)*.
- [ ] Backup database không đủ để giải mã secret nếu thiếu master/recovery key.
- [ ] Dependency audit cho npm/cargo trước release.
- [ ] **Token luôn qua header `Authorization: Bearer`, không bao giờ qua query string** *(SEC-08 — query string dễ lọt vào log lỗi khi request thất bại)*. Edge Function không trả response thô của Meta về client; log của Edge Function lọc mọi chuỗi khớp `/[A-Za-z0-9_\-]{40,}/` thành `[REDACTED]` trước khi ghi.
- [ ] Yêu cầu độ mạnh master password: tối thiểu 12 ký tự, chặn 100 mật khẩu phổ biến nhất *(SEC-06)*.

---

## 13. Cơ chế follower sync

### 13.1 Chính sách lịch chạy

| Trigger | Tần suất | Quy tắc |
|---|---|---|
| Scheduled | Mỗi 6 giờ | Chỉ account `api` + connection active; chia batch để tránh rate limit |
| Sync now | Theo yêu cầu | Cooldown 5 phút/account; trả job id ngay, không chờ blocking |
| Sync all | Theo yêu cầu | Queue tuần tự/batch nhỏ; UI hiển thị tiến độ |
| Reconnect | Khi user OAuth lại | Sync ngay sau khi token hợp lệ |
| **Dọn job kẹt** | Mỗi 15 phút *(mới, §11.3)* | Job `running` quá 5 phút không heartbeat → `failed`/`TIMEOUT` |

### 13.2 State machine cho sync job

```
queued → running → succeeded
queued/running → rate_limited → queued (retry_after)
running → reauth_required khi token hết hạn/thu hồi
running → unsupported khi account type không phù hợp
running → failed sau số lần retry giới hạn
running → failed/TIMEOUT khi heartbeat ngừng >5 phút (mới)
```

### 13.3 Error taxonomy hiển thị cho người dùng

| Code | Thông báo | CTA/Hành vi |
|---|---|---|
| AUTH_EXPIRED | Kết nối đã hết hạn | Kết nối lại Meta |
| PERMISSION_MISSING | Thiếu quyền đọc dữ liệu | Xem hướng dẫn quyền |
| ACCOUNT_UNSUPPORTED | Loại tài khoản chưa được API hỗ trợ | Chuyển sang Manual |
| RATE_LIMITED | Meta tạm giới hạn yêu cầu | Tự thử lại theo `retry_after` |
| NETWORK_ERROR | Không thể kết nối dịch vụ | Retry nền; giữ số gần nhất |
| **TIMEOUT** *(mới)* | Đồng bộ bị gián đoạn | Thử lại |
| UNKNOWN | Đồng bộ chưa thành công | Mở chi tiết kỹ thuật; không lộ token |

> **BỔ SUNG (QA-06 — Master Roadmap gốc định nghĩa 6 mã lỗi nhưng chỉ 1 mã có test).** Cần một tầng giả lập provider (Edge Function gọi Meta qua interface thay được bằng bản giả trong test) — không có tầng này thì 5/6 mã lỗi không kiểm được. Mỗi mã lỗi cần AT khẳng định 3 điều: badge đổi đúng theo §6.4, CTA đổi đúng theo bảng trên, và **`follower_current` giữ nguyên giá trị cũ** — không thành 0, không thành null (BR-04). Xem AT-22.

### 13.4 Data retention

- Giữ follower metrics chi tiết 12 tháng cho bản cá nhân; có thể downsample sau nếu dữ liệu lớn.
- Giữ sync job logs 30 ngày; audit security events 90 ngày; không chứa token hoặc password.
- Cho phép export metrics sau MVP; export credentials cần luồng riêng và cảnh báo mạnh.

---

## 14. Roadmap 8 tuần

| Giai đoạn | Thời gian | Deliverable | Quality gate |
|---|---|---|---|
| 0. Foundation | 2–3 ngày | Repo, ADR, env, Supabase project, asset manifest, **khoá updater**, **spike Meta 1 ngày** | Build dev chạy Windows; không commit secret; ADR-003 có kết quả spike Meta |
| 1. Design system | Tuần 1 | Tokens, components, Dashboard shell, Tully mapping | Storybook/component states; keyboard focus |
| 2. Local core | Tuần 2–3 | CRUD, Account Card/Detail, vault, search/filter, **recovery key** | Secrets không xuất hiện trong log; unit tests pass; **AT-12 pass** |
| 3. Cloud sync | Tuần 4 | Auth, schema, RLS, Realtime, device sessions | Máy A/B sync; RLS negative tests pass; **test IDOR Edge Function pass** |
| 4. Meta integration | Tuần 5–6 | OAuth, Edge Function, Cron, metrics, error states | Test Page + IG Professional thật; Manual fallback |
| 5. Hardening | Tuần 7 | E2E, conflict, offline/reconnect, performance, a11y | Không còn P0 bug; 500-account test đạt |
| 6. Release | Tuần 8 | Installer, updater plan, docs, backup/recovery drill | Clean install Windows 10/11 **offline**; rollback có hướng dẫn |

### 14.1 Milestones

M1 — UI Prototype (mock data, brand hoàn chỉnh) · M2 — Local Alpha (CRUD + vault local) · M3 — Multi-device Beta (Auth/RLS/Realtime) · M4 — Meta Beta (follower sync thật) · M5 — Release Candidate (installer + regression + recovery test).

### 14.2 Definition of Done chung

Có acceptance criteria và test tương ứng · loading/empty/error/permission states thiết kế đủ · không TypeScript `any` mới nếu không giải thích · migration có rollback/forward strategy · UI dùng được bằng bàn phím · security review cho mọi thay đổi chạm secret/OAuth/RLS.

### 14.3 Backlog theo sprint

**Sprint 0** — ADR-001 (Tauri 2 thay Electron) · ADR-002 (XChaCha20-Poly1305 + tham số Argon2id, thay Stronghold) · **ADR-003 (spike Meta)** · pnpm workspace, lint, format, commit hooks, CI · Supabase dev project + migration workflow · **sinh khoá updater** · chuẩn hoá logo/Tully asset manifest (chưa cần SVG thật).

**Sprint 1** — Sidebar/topbar/window state · AccountCard đủ states · Add/Edit form theo platform + Zod · Detail page không có secret thật.

**Sprint 2** — Argon2id + XChaCha20-Poly1305 setup (thay Stronghold) · **recovery key + rotate (FR-17, FR-18)** · encrypt/decrypt payload command · reveal/copy timeout · local cache không chứa plaintext · Open account qua allowlisted opener + Gmail authuser.

**Sprint 3** — Auth screens · migrations profiles/accounts/secrets/keyrings/**platform_connections + platform_connection_secrets** · RLS + negative test · optimistic CRUD + Realtime + device list/revoke · conflict detection.

**Sprint 4** — OAuth start/callback Edge Function + **khuôn mẫu IDOR §12.3** · token server-only (bảng riêng §11.1) · `sync-followers` + metric insert · Cron 6h + **cron dọn job kẹt** · retry, error taxonomy + **tầng giả lập provider**.

**Sprint 5** — 500-account performance seed · E2E happy path + auth expired + network loss + conflict · accessibility + copywriting + Tully states · Windows installer (**NSIS, `perMachine: false`, `webviewInstallMode: embedBootstrapper`** — xem §15.1), versioning, backup/recovery guide, **AT-12 diễn tập khôi phục trên VM sạch**.

---

## 15. Phát hành, vận hành và chi phí

### 15.1 Environments và packaging

- Local: Supabase local stack, test accounts, debug build. Staging: Meta test app/users. Production: project riêng, secrets riêng, backups.
- Tạo NSIS hoặc MSI installer x64; app icon đúng chuẩn multi-resolution.
- Version theo Semantic Versioning; migration chạy có kiểm soát.
- Build qua GitHub Actions Windows runner; lưu checksum và release notes.
- Code signing nên có trước khi phân phối rộng; bản cá nhân có thể bắt đầu unsigned nhưng sẽ gặp cảnh báo SmartScreen.

> **BỔ SUNG (ARCH-06 — sự thật kỹ thuật về Tauri trên Windows, không phụ thuộc tài liệu nào).** Tauri chạy trên WebView2 runtime; Windows 11 có sẵn, nhiều bản Windows 10 thì không. Mặc định `webviewInstallMode: downloadBootstrapper` sẽ tải mạng lúc cài — máy không có mạng thì cài xong app không mở được. Chốt **`embedBootstrapper`** (+~1,5MB, không cần tải khi cài). Chọn **NSIS** với `perMachine: false` để cài theo user, không cần quyền admin.

### 15.2 Auto-updater

Auto-updater để sau khi quy trình signing/versioning ổn định; MVP cho tải bản mới thủ công. **Nhưng khoá ký sinh ở Sprint 0** — xem §10.3 ARCH-05.

### 15.3 Chi phí dự kiến

| Hạng mục | MVP cá nhân | Ghi chú |
|---|---|---|
| Tauri/React | Miễn phí | Open source |
| Supabase | Có thể bắt đầu Free | Theo dõi quota database, storage, Edge/Cron |
| Meta API | Không tính phí trực tiếp | Tốn thời gian App setup/review |
| Domain/privacy page | Thấp | Cần cho OAuth review và redirect URL ổn định |
| Windows code signing | Có chi phí | Không bắt buộc cho prototype |
| Monitoring | Free tier ban đầu | Không gửi secrets/PII vào error tracking |

### 15.4 Backup & recovery

- Bật backup theo plan Supabase hiện có; kiểm tra phục hồi bằng môi trường staging.
- Metadata/ciphertext có thể backup; muốn giải mã vẫn cần master/recovery key.
- Có export encrypted backup định kỳ sau MVP; không mặc định export plaintext password.
- **AT-12 (diễn tập khôi phục) chạy lại trước mỗi bản phát hành có thay đổi chạm crypto hoặc schema**, không chỉ một lần.

---

## 16. Rủi ro, giới hạn và hướng phát triển

| Rủi ro | Tác động | Giảm thiểu |
|---|---|---|
| Meta API thay đổi/quyền bị từ chối | Auto follower trễ hoặc không dùng được | Manual fallback; **spike Sprint 0**; revalidate trước sprint/release |
| Chi phí thiết lập Meta × N tài khoản | Follower tự động chỉ thực tế cho một nhóm nhỏ tài khoản người dùng thật sự quản trị | Nói rõ trong UI khi bật OAuth; không hứa "bật cho cả danh sách" |
| Mất master/recovery key | Không giải mã được secrets | Onboarding bắt buộc xác nhận đã lưu; **AT-12 là điều kiện thành công của bản 1.0** |
| Conflict nhiều máy | Ghi đè dữ liệu | row_version; conflict dialog không phơi giá trị; audit event |
| DB/RLS cấu hình sai | Rò dữ liệu | Migration review; negative tests; **test IDOR Edge Function**; least privilege |
| Token provider bị lộ | Truy cập dữ liệu social | Bảng riêng không policy; header Bearer; log lọc token |
| Scope phình to | Không ship được | Giữ P0; dời auto-login/import/chart/team sang post-MVP |
| UI mascot quá nhiều | Mất tính chuyên nghiệp | Tully chỉ ở onboarding/empty/status; không lặp trên từng card |
| Asset chưa production-ready | Logo vỡ, nền magenta, icon nhỏ không đọc được | §9.3 — hạng mục riêng 1–2 ngày trước release |

### 16.1 Post-MVP roadmap

v1.1 CSV/Excel import + follower chart 30/90 ngày · v1.2 browser profile mapping (không lưu cookie) · v1.3 TikTok/YouTube/X adapter · v1.4 encrypted export/import, tag automation · v2.0 team workspace (yêu cầu threat model mới).

### 16.2 Ý tưởng không nên làm sớm

Auto-login lưu cookie/session thô · scraping follower · AI features trước khi CRUD/vault/sync ổn định · team sharing trong khi mô hình khóa chỉ thiết kế cho một owner · dark mode nếu light mode/design tokens chưa hoàn chỉnh.

---

## 17. Kiểm thử và tiêu chí nghiệm thu

### 17.1 Test pyramid

| Tầng | Phạm vi | Ví dụ |
|---|---|---|
| Unit | Validation, URL builder, crypto wrapper, formatter | Không trim password; Gmail URL; follower null vs 0 |
| Component | Card, forms, vault UI, sync badge | Keyboard, loading/error, long email/name |
| Integration | Supabase + RLS + Edge | User A không đọc được row user B; expired token; **IDOR qua Edge Function** |
| E2E desktop | Luồng thật | Sign in → unlock → create → sync máy B → open account |
| Security | Secrets, logging, permissions | Không plaintext trong DB/log/bundle; opener reject `file://` |
| Performance | Dữ liệu lớn | 500–2.000 accounts; search/filter/render |

> **BỔ SUNG (QA-08 — ngưỡng cụ thể, Master Roadmap gốc không có).** Unit ≥90% coverage cho `src/lib/**` và `src-tauri/src/security/**` · Integration 100% policy RLS có test âm tính, 100% Edge Function có test IDOR · Security (AT-02, AT-08, AT-09, AT-12, AT-13) bắt buộc trước mỗi release · toàn bộ tầng CI chạy dưới 5 phút.

### 17.2 Acceptance test quan trọng

- **AT-01** — Tạo Facebook account với password chứa khoảng trắng/ký tự Unicode; đóng mở app; giải mã đúng 100%.
- **AT-02** — Trên DB chỉ thấy ciphertext/nonce; tìm toàn workspace/log không thấy sample password.
- **AT-03** — Tạo record trên PC A; PC B đang online nhận update trong ≤5 giây. *(QA-02: đo trung vị ≤2s, cao nhất ≤5s trên 10 lần chạy cho mỗi loại thao tác; kèm ca PC B đang mở Detail của đúng account đó.)*
- **AT-04** — PC B chưa mở vault vẫn xem metadata nhưng không đọc secret.
- **AT-05** — Facebook Page/Instagram Professional hợp lệ sync follower và lưu metric timestamp.
- **AT-06** — Personal/unsupported account hiển thị Manual, không gọi API lặp vô hạn.
- **AT-07** — Mất mạng khi sync: giữ follower cũ, status error/offline, retry có backoff.
- **AT-08** — Nút Open account chỉ chấp nhận https/http đúng allowlist; `file://`, `javascript:`, `data:`, credential trong URL, host homograph đều bị chặn.
- **AT-09** — Copy password → clipboard được xóa sau timeout **và không xoá nếu người dùng đã copy thứ khác trong lúc đó**; UI che lại sau reveal timeout; banner Clipboard History hiện đúng một lần nếu bật.
- **AT-10** — 500 card không làm main interaction lag; dùng pagination/virtualization khi cần.
- **AT-11** *(mới, §8.6)* — Luồng đầy đủ chỉ bằng bàn phím; axe-core 0 lỗi `serious`/`critical`.
- **AT-12** *(mới, §12.2 — release blocker)* — Diễn tập khôi phục trên máy ảo sạch: tạo vault, lưu recovery key, tạo account có mật khẩu Unicode, xoá máy A, cài máy B, nhập recovery key, đặt master mới, giải mã đúng. Chạy lại trước mỗi release chạm crypto/schema.
- **AT-13** *(mới, §7.3)* — Reveal mật khẩu → `Win+L` → mở khoá Windows → vault ở trạng thái khoá, ô mật khẩu đã che.
- **AT-14** *(mới, §12.4)* — Máy B ngắt mạng; máy A tạo/sửa/xoá; máy B nối lại → khớp máy A trên cả ba thay đổi trong ≤10s.
- **AT-15…AT-25** *(mới, QA-01 — lấp 8 FR không có AT trong bản gốc)* — FR-04 sửa/archive/restore · FR-06 tìm kiếm không phân biệt dấu tiếng Việt · FR-09 follower manual không gọi API · FR-12 cooldown không hiện như lỗi · FR-14 stat card khớp filter · FR-16 đăng xuất thiết bị khác · FR-01 session khôi phục · AT-22 mỗi mã lỗi §13.3 giữ đúng `follower_current` cũ.

### 17.3 Release blocker

- Bất kỳ plaintext secret nào xuất hiện trong cloud DB, log hoặc crash report.
- RLS cho phép user khác đọc/sửa row không thuộc mình — **hoặc IDOR qua Edge Function**.
- Mất dữ liệu khi hai máy sync hoặc khi migration chạy.
- Open account có thể mở scheme nguy hiểm hoặc thực thi command.
- Follower UI hiển thị số 0 sai khi API lỗi.
- Installer bị Windows Defender cảnh báo do packaging/cấu hình bất thường chưa điều tra.
- **App không mở được sau khi cài offline trên Windows 10 sạch** *(mới, §15.1)*.
- **AT-12 (diễn tập khôi phục) chưa pass** *(mới, §1.2)*.
- **Vault không khoá khi khoá màn hình Windows** *(mới, §7.3)*.

---

## 18. Bàn giao cho AI coding agent

> **PROMPT KHỞI ĐỘNG** Hãy đọc toàn bộ `docs/SOURCE-OF-TRUTH.md` trước khi code. Xem đây là Source of Truth. Chỉ triển khai sprint được giao; không tự thêm auto-login, scraping hoặc team features. Mọi thay đổi schema phải có migration + RLS + test. Mọi thay đổi secret/OAuth/opener phải có security review.

### 18.1 Context phải cung cấp cùng task

Sprint/milestone hiện tại và issue cụ thể · cấu trúc repo hiện tại, package versions, migration gần nhất · ảnh brand/logo/Tully production assets (không chỉ brand board) · environment sample không chứa secret thật · acceptance criteria + test command + định nghĩa "done".

### 18.2 Guardrails cho coding agent

Không đổi stack hoặc database schema chỉ vì tiện code · không dùng mock follower ở production path mà không gắn nhãn · không trả service-role key/app secret về desktop · không log request body chứa secret/token · không thay logo/Tully bằng emoji hoặc asset khác phong cách · không dùng màu ngoài token nếu không tạo named token mới · không merge khi lint/typecheck/test/security acceptance chưa pass.

### 18.3 Task template

```text
TASK: [Tên issue]
MILESTONE: [M1–M5]
SCOPE: [Một thay đổi có ranh giới rõ]
FILES/FEATURE: [Khu vực được phép chỉnh]
ACCEPTANCE CRITERIA: [FR-xx → AT-xx]
SECURITY CHECKS: [RLS / secrets / OAuth / opener / none]
TEST COMMANDS: pnpm lint && pnpm typecheck && pnpm test
OUT OF SCOPE: [Liệt kê rõ]
DELIVERABLE: code + migration/test + cập nhật docs nếu có quyết định mới
```

---

## 19. Tài liệu tham khảo chính thức

[Meta Graph API Overview](https://developers.facebook.com/docs/graph-api/overview/) · [Meta Page Graph API Reference](https://developers.facebook.com/docs/graph-api/reference/page/) · [Instagram Platform Documentation](https://developers.facebook.com/docs/instagram-platform/) · [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) · [Supabase Secure Data](https://supabase.com/docs/guides/database/secure-data) · [Supabase Edge Function Secrets](https://supabase.com/docs/guides/functions/secrets) · [Supabase Cron](https://supabase.com/docs/guides/cron) · [Supabase Vault](https://supabase.com/docs/guides/database/vault) · [Tauri Calling Rust from Frontend](https://v2.tauri.app/develop/calling-rust/) · [Tauri Windows Signing](https://v2.tauri.app/distribute/sign/windows/) · [Tauri Updater](https://v2.tauri.app/plugin/updater/)

> **TÀI LIỆU SỐNG** Chốt permission Meta và phiên bản API trong ADR-003 ngay ở Sprint 0. Không hard-code giả định từ tài liệu này nếu official docs đã đổi.

---

## 20. Bắt đầu từ đâu

**Trạng thái:** repo mới, chưa có code.

1. Cài **Rust**
2. Scaffold Tauri 2 + React + TS + Vite + Tailwind, pnpm workspace
3. Sinh **khoá updater** (§10.3 ARCH-05) và nhúng public key
4. **Spike Meta 1 ngày** (§3.2) → `docs/adr/ADR-003-meta-feasibility.md`
5. Lên lịch **vẽ lại asset SVG** (§9.3) như một hạng mục riêng
6. Bắt đầu Sprint 0 theo §14.3

---

**All your accounts, in one shell.**
*Turtly • Tully • Your shell. Your world.*
