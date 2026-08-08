---
title: "Turtly — Source of Truth"
product_name: "Turtly"
mascot_name: "Tully"
target_platform: "Windows desktop"
version: "2.0"
last_updated: "2026-08-09"
supersedes: "Turtly_Master_Roadmap_Design_Specification.md v1.0"
---

# TURTLY — SOURCE OF TRUTH

**Desktop Account Manager • Windows • Facebook · Instagram · Google/Gmail**
Sản phẩm **Turtly** • Mascot **Tully** • *All your accounts, in one shell.*

> **CHO AI CODING AGENT**
> Đọc hết file này trước khi code. Đây là tài liệu quyết định duy nhất.
> Không tự thêm auto-login, scraping, team features, hay lưu bí mật dạng plaintext.
> Mọi thay đổi khác tài liệu → sửa tài liệu trước, code sau.

---

## 0. Tài liệu này là gì, và thứ tự ưu tiên

File này hợp nhất **`Turtly_Master_Roadmap_Design_Specification.md` v1.0** (08/08/2026) với **`DECISIONS.md`** (QĐ-01…QĐ-14, 07/08/2026), sau phiên review 6 vai ngày 08/08/2026 (`REVIEW-2026-08-08.md` — 9 Blocker, 16 High, 20 Medium).

Master Roadmap được viết mà không biết `DECISIONS.md` tồn tại, nên 11 điểm trong đó là **hồi quy** về các phương án đã bị bác bỏ có lý do, 4 điểm trong số đó mâu thuẫn với mã nguồn đã commit. Phân xử: `DECISIONS.md` thắng 9/11.

> **REPO LÀM LẠI TỪ ĐẦU — 09/08/2026.** Bản code trước đó (Sprint 0–1) đã bị bỏ cùng với `SPEC.md` và `ROADMAP.md`. Repo hiện tại **chỉ có tài liệu, chưa có code**. Bắt đầu từ Sprint 0 (§13.3, §19).

**Thứ tự ưu tiên khi mâu thuẫn:**

```
SOURCE-OF-TRUTH.md  →  DECISIONS.md  →  BRAND.md (màu/font/mascot)  →  UI.md (bố cục/component)
```

| File | Vai trò |
|---|---|
| **`SOURCE-OF-TRUTH.md`** ← file này | Sản phẩm, phạm vi, hành vi, kiến trúc, kế hoạch |
| `DECISIONS.md` | Nhật ký quyết định QĐ-01…QĐ-20, có lý do |
| `BRAND.md` | Nhận diện: màu, font, mascot |
| `UI.md` | Bố cục, spacing, component, checklist |
| `REVIEW-2026-08-08.md` | Biên bản review 6 vai, để tra lý do |
| `brand-reference/` | 22 ảnh tham chiếu thị giác. **Chưa phải asset production** — §8.8 |
| `src/styles/tokens.css` | **Sẽ tạo ở Sprint 1.** Từ lúc đó nó giữ *giá trị* màu/chữ/khoảng cách và tài liệu ngừng lặp lại |

**Luật chống trôi:** giá trị (hex, px, tham số) sống ở **đúng một nơi**. Tài liệu mô tả *hành vi và trạng thái*; `tokens.css` giữ *giá trị*; `UI.md` giữ *bố cục*.

---

## 1. Quyết định sản phẩm

| Hạng mục | Quyết định |
|---|---|
| Người dùng | Một chủ sở hữu, nhiều máy Windows |
| Nền tảng | Facebook · Instagram · Google/Gmail |
| Dữ liệu | Tên, username, email, mật khẩu tài khoản, mật khẩu email, follower, location, URL, trạng thái, ghi chú, tag |
| Follower | **Manual là mặc định.** Tự động qua Meta API chỉ cho tài khoản đủ điều kiện, người dùng bật thủ công từng cái (§3) |
| Mở tài khoản | Mở URL trong trình duyệt mặc định. Không cookie, không tự điền form |
| Kho dữ liệu | v1.0 SQLite cục bộ · v1.1+ thêm Supabase |
| Desktop | Tauri 2 + React 19 + TypeScript + Vite 7 + Tailwind v4 |
| Mã hoá | Argon2id → KEK → bọc DEK → XChaCha20-Poly1305. Master password riêng với mật khẩu đăng nhập Turtly |
| Thời gian | 8 tuần full-time · 10–12 tuần bán thời gian |

### 1.1 Nguyên tắc không thương lượng

- Không lưu mật khẩu dạng plaintext ở bất kỳ đâu: DB, log, crash report, file cấu hình, analytics.
- Không scraping, không cookie harvesting, không vượt cơ chế bảo vệ của Meta.
- Không hứa real-time tuyệt đối. Luôn hiển thị **nguồn dữ liệu** và **thời điểm đồng bộ**.
- Mọi bảng client truy cập được đều bật RLS. Service-role key không bao giờ vào desktop bundle.
- Mọi thao tác reveal/copy có xác nhận trạng thái, tự ẩn lại, dọn clipboard.
- **Follower lỗi ≠ 0.** Giữ giá trị cũ + badge lỗi. Không bao giờ hiển thị 0 thay cho "chưa biết".

### 1.2 Ba bản phát hành *(QĐ-01)*

v1.0 là local-only, **nhưng schema và tầng repository cloud-ready từ ngày đầu**: UUID thay autoincrement, có sẵn `updated_at`/`deleted_at`/`server_updated_at`, mọi UI chỉ nói chuyện qua interface `AccountRepository`. Lên v1.1 chỉ thay implementation, không sửa UI.

| Bản | Nội dung | Định nghĩa thành công |
|---|---|---|
| **v1.0** | UI, CRUD, vault, tìm kiếm, mở tài khoản, **CSV import**, recovery key | Quản lý **300** tài khoản mà tìm/lọc/mở chi tiết vẫn nhanh · mật khẩu trong DB chỉ ở dạng ciphertext · **AT-12 (diễn tập khôi phục) pass trên máy ảo sạch** · installer chạy trên Windows 10/11 x64 offline · auto-lock hoạt động |
| **v1.1** | Supabase Auth, schema, RLS, Realtime, đồng bộ đa máy, device list | Tạo/sửa/xoá trên máy A xuất hiện trên máy B: trung vị ≤2s, cao nhất ≤5s · máy mới cần master password hoặc recovery key để mở secrets · RLS negative test pass |
| **v1.2** | Meta OAuth, follower sync, Cron, error taxonomy | Follower tự động đúng cho **ít nhất 1 Facebook Page và 1 Instagram Professional thật** · mọi loại khác hiển thị Manual với nguồn và thời điểm rõ ràng · lỗi quyền/rate limit/token hết hạn có trạng thái riêng |

**Ưu tiên nếu thiếu thời gian:** giữ vault + CRUD + search + import + mở tài khoản → giữ manual follower và nhãn nguồn/thời điểm → dời follower tự động sang v1.2 → dời chart, dark mode, auto-update. **Không dời security test.**

---

## 2. Mục tiêu và phạm vi

### 2.1 Mục tiêu

- Tìm một tài khoản dưới 10 giây.
- Xem tình trạng, follower và thời điểm sync ngay trên màn hình chính.
- Tách thông tin công khai khỏi bí mật: hiển thị nhanh nhưng vẫn bảo vệ mật khẩu.
- Đồng bộ nhiều máy không tạo bản ghi trùng, không ghi đè âm thầm.
- Mở đúng trang Facebook/Instagram/Gmail bằng một nút.

### 2.2 Ngoài phạm vi

**Vĩnh viễn không làm:** tự động đăng nhập, tự điền mật khẩu, quản lý browser profile bằng cookie thô · đăng bài / tương tác / follow-unfollow tự động · scraping follower · lưu cookie hoặc session thô.

**Post-v1:** import Excel (ngoài CSV) · follower chart 30/90 ngày · browser profile mapping (không lưu cookie) · TikTok/YouTube/X · encrypted export/import · **hàng đợi chỉnh sửa offline** · team workspace + RBAC *(cần threat model mới)* · AI features · **dark mode** *(§8.2 chỉ định nghĩa bảng màu sáng. Không thêm khối `[data-theme="dark"]` vào `tokens.css` cho tới khi có sprint đo lại toàn bộ tương phản — token chưa kiểm chứng nằm sẵn trong repo là bẫy: sẽ có người bật nó)* · thu hồi từng thiết bị *(cần Edge Function service role)*.

### 2.3 Tình huống chính

| Tình huống | Nhu cầu | Kết quả |
|---|---|---|
| Tìm tài khoản | Nhớ một phần tên/email | Kết quả ra trong ≤1 giây, **không phân biệt dấu** |
| Kiểm tra follower | Xem số hiện tại và lần sync | Biết dữ liệu mới hay cũ, không cần mở từng nền tảng |
| Đổi máy | Đăng nhập trên PC khác | Metadata tải về; nhập master password để mở secrets |
| Mở tài khoản | Đi tới profile hoặc Gmail | Trình duyệt mở đúng URL; app không giả lập đăng nhập |
| Chuyển từ Excel | Đang có file 50–200 dòng | **CSV import** có map cột, preview, cảnh báo trùng |
| Mất máy | Máy cũ hỏng hoàn toàn | Cài máy mới → recovery key → mở lại toàn bộ secrets |

---

## 3. Tính khả thi của follower tự động

> **CHI PHÍ THIẾT LẬP — ĐỌC TRƯỚC KHI HỨA VỚI NGƯỜI DÙNG**
> Follower tự động **không phải một công tắc bật cho cả danh sách**. Mỗi tài khoản muốn dùng phải:
> 1. là **Facebook Page** hoặc **Instagram Professional** (Business/Creator);
> 2. được thêm làm **Tester** trong Meta App **và tự đăng nhập chấp nhận lời mời** — giới hạn của Development mode *(QĐ-05)*;
> 3. đi qua **một luồng OAuth riêng**, đăng nhập bằng đúng tài khoản đó.
>
> Ước tính **3–5 phút mỗi tài khoản**, và Meta giới hạn số vai trò trên mỗi app.
> **`manual` là chế độ mặc định và là đường đi chính của sản phẩm.** `api` là thứ người dùng bật cho từng tài khoản mà họ thật sự quản trị.

| Loại tài khoản | Follower tự động | Xử lý |
|---|---|---|
| Facebook Page | Có điều kiện | OAuth Meta → đọc trường follower/fan count mà API hiện hành cho phép |
| Facebook profile cá nhân | **Không** | Manual; người dùng nhập số hoặc để trống |
| Instagram Business/Creator | Có điều kiện | OAuth → `followers_count`. Thường cần liên kết với một Facebook Page do chính tài khoản đó quản trị |
| Instagram personal | **Không** | Gợi ý chuyển Professional; nếu không thì Manual |
| Google/Gmail | Không áp dụng | Không hiển thị follower; chỉ trạng thái credential + nút mở Gmail |

### 3.1 Quy tắc UX cho dữ liệu follower

- Card **luôn** hiển thị nguồn: `API` · `Manual` · `Không có`.
- Hiển thị "Đã đồng bộ 8 phút trước", không tạo cảm giác real-time.
- Sync lỗi → **giữ số cuối cùng**, đổi badge thành "Cần kết nối lại" hoặc "Lỗi đồng bộ".
- **Không bao giờ đặt follower = 0 khi API lỗi.** Dùng `null` + trạng thái lỗi *(BR-04)*.
- Lưu lịch sử metrics theo mốc thời gian để post-v1 vẽ chart được.

### 3.2 Cổng chặn — Spike Meta *(QĐ-20)*

**Sprint 0, 1 ngày, trước mọi code tích hợp.** Tạo Meta App → cấu hình OAuth redirect URI → mời **1 tài khoản thật** làm tester → tài khoản đó đăng nhập chấp nhận → chạy hết luồng OAuth bằng `curl` → đọc được `followers_count` thật.

Kết quả ghi vào `docs/adr/ADR-003-meta-feasibility.md`: request/response thật (đã che token), phiên bản Graph API, danh sách permission thật sự cần.

**Spike thất bại → cắt v1.2 ngay ở tuần 1**, không phải tuần 6. App vẫn thay được Excel mà không có follower tự động.

Trước sprint tích hợp còn phải: đọc lại tài liệu Graph API bản mới nhất *(permission và quy trình review đổi thường xuyên)*; chuẩn bị Privacy Policy + Data Deletion URL nếu Meta yêu cầu; App Secret và service-role key **không bao giờ** vào client.

---

## 4. Yêu cầu chức năng

**Quy ước:** mỗi FR có `Bản` ∈ {v1.0, v1.1, v1.2} và `Mức` ∈ {P0 = bắt buộc cho bản đó, P1 = bỏ được nếu trễ}. **Không dùng ký hiệu P2.**
**Luật:** *một FR không có AT đang pass thì không được đánh dấu hoàn thành* — và đó là release blocker #10.

### 4.1 v1.0 — Local

| ID | Yêu cầu | Mức | Tiêu chí chấp nhận | Nghiệm thu bởi |
|---|---|---|---|---|
| FR-02 | Mở kho bí mật | P0 | Nhập master password; sai không lộ thông tin, không log plaintext | AT-01, AT-02 |
| FR-03 | Danh sách tài khoản | P0 | Grid card: avatar, nền tảng, tên, username, follower, trạng thái, last sync | AT-10, AT-19 |
| FR-04 | CRUD tài khoản | P0 | Tạo, xem, sửa, archive/restore; validation theo nền tảng | AT-01, AT-15 |
| FR-05 | Xem/copy secrets | P0 | Mặc định che; reveal tạm thời; copy có thông báo và dọn clipboard | AT-09 |
| FR-06 | Tìm kiếm và lọc | P0 | Theo tên, username, email, nền tảng, trạng thái, tag. **Không phân biệt hoa thường và không phân biệt dấu** | AT-16 |
| FR-07 | Mở tài khoản | P0 | Chỉ mở URL `http`/`https` hợp lệ trong trình duyệt mặc định | AT-08 |
| FR-09 | Follower manual | P0 | Nhập tay, ghi rõ nguồn + thời điểm cập nhật | AT-17 |
| FR-10 | Auto-lock | P0 | Khoá sau thời gian nhàn rỗi, khi khoá màn hình Windows, khi sleep, hoặc khoá thủ công | AT-13 |
| **FR-17** | **CSV import** *(QĐ-08)* | **P0** | Chọn file → map cột → preview 10 dòng → cảnh báo trùng theo BR-02 → import → báo cáo `N thành công / M bỏ qua / K lỗi` + tải file lỗi | AT-21 |
| **FR-18** | **Recovery key** *(QĐ-18)* | **P0** | Sinh khi tạo vault, hiện **đúng một lần**, bắt buộc gõ lại 4 nhóm ngẫu nhiên để xác nhận đã lưu, có nút tải `.txt` | AT-12 |
| **FR-19** | **Đổi master password** *(QĐ-18)* | **P0** | Cần master hiện tại **hoặc** recovery key. DEK không đổi → không mã hoá lại secrets. Recovery key cũ vẫn hợp lệ — **nói rõ điều này** + nút "Sinh recovery key mới" | AT-12 |
| FR-15 | Tully states | P1 | Empty/error/success theo hệ mascot §8.5 | — |

### 4.2 v1.1 — Cloud

| ID | Yêu cầu | Mức | Tiêu chí chấp nhận | Nghiệm thu bởi |
|---|---|---|---|---|
| FR-01 | Đăng nhập Turtly | P0 | Email/password hoặc magic link; session khôi phục sau khi mở lại app | AT-24 |
| FR-08 | Đồng bộ nhiều máy | P0 | Metadata và ciphertext đồng bộ; delta fetch khi reconnect | AT-03, AT-14 |
| FR-20 | Chế độ chỉ đọc khi offline | P0 | Mất kết nối → banner + vô hiệu hoá Thêm/Sửa/Xoá. **Vault vẫn mở được, secrets vẫn đọc được** | AT-20 |
| FR-14 | Dashboard summary | P1 | 4 stat card đúng số đếm; bấm vào áp đúng filter | AT-19 |
| FR-16 | Đăng xuất thiết bị khác | P1 | **Một** nút "Đăng xuất khỏi mọi thiết bị khác" → `signOut({scope:'others'})`. Không thu hồi từng máy | AT-25 |

### 4.3 v1.2 — Meta

| ID | Yêu cầu | Mức | Tiêu chí chấp nhận | Nghiệm thu bởi |
|---|---|---|---|---|
| FR-11 | OAuth Meta + follower sync | P0 | Token server-only; connection status hiển thị trên UI | AT-05, AT-06 |
| FR-12 | Đồng bộ ngay / Sync all | P0 | Cooldown 5 phút/account; `Sync all` chạy hàng đợi tuần tự có tiến độ | AT-18 |
| FR-13 | Lịch sử follower 30/90 ngày | P1 | Dạng danh sách. Chart để post-v1 | — |

### 4.4 Quy tắc nghiệp vụ

- **BR-01** — Mỗi account thuộc đúng một `owner_id`; mọi query client bị giới hạn bởi `auth.uid()`.
- **BR-02** — Trùng = cùng `owner_id` + `platform` + `normalized_username`. Email trùng chỉ **cảnh báo**, không chặn.
- **BR-03** — Archive là mặc định thay cho xoá cứng. Xoá vĩnh viễn cần xác nhận lại.
- **BR-04** — Follower là số nguyên ≥0 **hoặc `null`**. Không dùng 0 để biểu diễn "chưa biết".
- **BR-05** — Secrets nằm trong **một** encrypted payload có `version`, để đổi thuật toán mà không phá dữ liệu cũ.
- **BR-06** — Nút mở tài khoản vô hiệu hoá nếu URL không hợp lệ. Ưu tiên URL sinh từ template theo nền tảng.
- **BR-07** — Không chạy song song hai sync job cho cùng một account.
- **BR-08** — Token hết hạn → `status = reauth_required`. **Không xoá lịch sử follower.**
- **BR-09** — Chuẩn hoá username áp **một** quy tắc duy nhất ở tầng repository, giống hệt nhau trên SQLite và Postgres: `lower(trim(bỏ '@' đầu))`. Email lưu đã `lower()` sẵn.

---

## 5. Màn hình và luồng

### 5.1 Information architecture

Ba màn hình ở v1.0. **Dashboard và All Accounts là một màn hình** — chúng chỉ khác bộ lọc mặc định, và tách ra là nhân đôi công việc mà không đổi lấy gì.

| Màn hình | Bản | Nội dung |
|---|---|---|
| **Tài khoản** `/accounts` | v1.0 | 4 stat card (Tổng · Hoạt động · Cần kiểm tra · Lỗi đồng bộ) — **mỗi cái là một filter bấm được** → thanh tìm kiếm/lọc → grid card |
| **Chi tiết** `/accounts/:id` | v1.0 | **Sheet** trượt từ phải, giữ nguyên grid phía sau |
| **Thêm/Sửa** | v1.0 | Sheet hoặc modal, 3 bước |
| **Cài đặt** `/settings` | v1.0 | Bảo mật, auto-lock, master password, recovery key, giao diện · v1.1 thêm thiết bị · v1.2 thêm panel 20 sync job gần nhất |

**Không có màn hình Sync Center.** Trạng thái sync sống trên card và trong Sheet.

### 5.2 Onboarding lần đầu

1. Mở app → Tully **Wave** → đăng nhập hoặc tạo tài khoản Turtly *(v1.0: chỉ tạo hồ sơ cục bộ)*
2. Tạo master password — **tối thiểu 12 ký tự**, chặn 100 mật khẩu phổ biến nhất, có thanh đo độ mạnh
3. **Sinh recovery key** → hiện một lần → bắt buộc gõ lại 4 nhóm ngẫu nhiên để xác nhận → cho tải `.txt` *(FR-18)*
4. Kho rỗng → **hai** lựa chọn ngang nhau: `Nhập từ file CSV` · `Thêm tài khoản đầu tiên`
5. Về màn hình chính → Tully **Success**

> Bước 4 phải đặt CSV import **ngang hàng** với thêm tay. Người dùng đang có file Excel — đó là lý do họ cài app.

### 5.3 Thêm tài khoản — 3 bước

**Điều kiện tiên quyết:** nút `Thêm tài khoản` vô hiệu hoá khi vault đang khoá, tooltip *"Mở kho bí mật để thêm tài khoản"*. Bấm vào → mở dialog unlock trước, xong mới vào form. **Không bao giờ** cho người dùng gõ xong trường bí mật rồi mới bị chặn.

| Bước | Nội dung |
|---|---|
| 1 — Nền tảng và định danh | Facebook / Instagram / Google · avatar, tên hiển thị, username, profile URL, location |
| 2 — Đăng nhập và số liệu | Email đăng nhập, mật khẩu tài khoản, recovery email, mật khẩu email, 2FA note/recovery code, ghi chú · **và** follower manual + ngày cập nhật |
| 3 — Xem lại | Preview bằng **chính component `AccountCard`** · cảnh báo trùng theo BR-02 · lưu |

*Ở v1.0 chưa có Meta nên "chọn API/Manual" không phải một bước riêng — nó là một trường trong bước 2. Với 50–200 tài khoản cần nhập, mỗi bước thừa nhân lên 50–200 lần.*

### 5.4 Mở tài khoản

1. Bấm `Mở tài khoản` trên card hoặc trong Sheet
2. **Rust** xác thực URL: scheme ∈ {`http`, `https`} · host khớp allowlist theo nền tảng · **không có credential trong URL** (`https://user:pass@…`) · chuẩn hoá punycode chống homograph
3. Tauri Opener mở trình duyệt mặc định. Gmail dùng tham số `authuser=<email>` nếu có
4. Trình duyệt chưa đăng nhập đúng tài khoản → người dùng tự chọn trong trình duyệt

> **Không làm:** inject JavaScript · tự điền mật khẩu · đọc cookie trình duyệt · chạy Selenium/Puppeteer.

---

## 6. Dashboard và Account Card

### 6.1 Layout

| Vùng | Quy tắc | Nội dung |
|---|---|---|
| Cửa sổ | Min 1180×720, mặc định 1440×900, nhớ kích thước | Không ép full-screen |
| Sidebar | 240 px, thu gọn 76 px | Logo, Tài khoản, Cài đặt |
| Topbar | 72 px | Tiêu đề, tìm kiếm toàn cục, Thêm tài khoản, trạng thái vault, avatar |
| Nội dung | Padding theo thang 4 px | Stat card → thanh lọc → grid |
| Grid | Card tối thiểu 340 px, gap 20 px | 3 cột ở 1440 px, 2 cột khi hẹp |
| **Sheet chi tiết** | **560 px**; full-width khi cửa sổ < 900 px | Trượt từ phải, grid giữ nguyên phía sau |

**Header:** lời chào + Tully **Neutral** 32 px *(bảng §8.5 thắng — không phải Wave)*, chỉ hiện khi grid có ≥1 tài khoản, cao không quá 88 px.

**Luật Tully:** tối đa **một** Tully trên một màn hình tại một thời điểm. Không có Tully trong Sheet chi tiết và trong form.

### 6.2 Account Card *(QĐ-04 + QĐ-13)*

```
[avatar 40] Tên tài khoản (2 dòng, line-clamp)        [⋯]
            @username  (mono, muted)

⊘ Hoạt động                        256.800 follower
Đồng bộ 8 phút trước

[             Mở tài khoản             ]
```

| Thành phần | Đặc tả |
|---|---|
| Container | `--radius-card` · padding thang 4 px · `--shadow-card` · `--color-border` |
| Avatar | **40 px**, huy hiệu nền tảng chồng góc, **đơn sắc** `--color-text-muted`, có accessible label |
| Tên | 2 dòng cố định (`min-h-12`), `line-clamp-2` — không nhảy layout khi tên dài |
| Username | `--font-mono`, `--text-label`, muted. `null` → giữ chỗ bằng khoảng trắng |
| Trạng thái | Chip **icon + chữ**, không bao giờ chỉ có màu. Dùng `--color-<state>-text` cho chữ |
| Follower | Số `data-numeric` (JetBrains Mono, tabular). Nguồn hiện trong Sheet |
| Sync | `--text-caption`, muted |
| Hành động | **Một** nút chính `Mở tài khoản`, full width |

**Không có trên card:** email · nút `Đồng bộ` · ảnh lớn.
`Đồng bộ · Sửa · Sao chép mật khẩu · Xoá` nằm trong menu `⋯`.

**Tương tác — stretched link:** thân thẻ là **một** `<a>` duy nhất phủ toàn card qua `::after` → mở Sheet `/accounts/:id`. Nút và menu nổi bằng `relative z-10`. Không cần `stopPropagation` ở đâu cả. Đúng **3 tab-stop**: thân thẻ, `⋯`, `Mở tài khoản`.

### 6.3 Trạng thái card

| Trạng thái | Màu + icon | Hành vi |
|---|---|---|
| Hoạt động | success + check | Mọi hành động khả dụng |
| Chỉ lưu trong máy | `--color-local` + lock | Riêng của Turtly — lời hứa cốt lõi nên dùng màu thương hiệu |
| Manual | inactive + edit | Follower nhập tay; menu `⋯` đổi `Đồng bộ` → `Cập nhật` |
| Đang đồng bộ | info + spinner | Khoá mục Đồng bộ; vẫn mở tài khoản được |
| Cần kết nối lại | warning + key | Menu `⋯` đổi thành `Kết nối lại` |
| Lỗi | error + warning | Lỗi ngắn trên card; mã lỗi và cách xử lý trong Sheet |
| Đã lưu trữ | inactive, mờ | Ẩn khỏi grid mặc định; có `Khôi phục` |

---

## 7. Sheet chi tiết

### 7.1 Bố cục

**Sheet trượt từ phải, một cột** *(QĐ-04)*. URL `/accounts/:id` để deep-link được; đóng Sheet trả về `/accounts` với **scroll position và bộ lọc nguyên vẹn** — đây chính là lý do không dùng route riêng.

`Esc` đóng Sheet. Focus bị giữ trong Sheet khi mở, và trả về đúng card vừa mở khi đóng.

Header Sheet: avatar, nền tảng, tên, chip trạng thái, nút `Sửa` · `Mở tài khoản` · `⋯`.

### 7.2 Nhóm dữ liệu — thứ tự hiển thị

| # | Nhóm | Trường | Bảo vệ |
|---|---|---|---|
| 1 | Identity | Tên hiển thị, username, avatar, nền tảng, profile URL | Bình thường |
| 2 | **Secrets** | Mật khẩu tài khoản, mật khẩu email, recovery code, 2FA note, **ghi chú** *(QĐ-02)* | Che mặc định; reveal/copy có timeout. **Nền `--color-local-bg` + viền** để đọc ra là vùng khác về bản chất |
| 3 | Metrics | Follower hiện tại, **nguồn**, last sync, lịch sử | Không dùng 0 thay `null` |
| 4 | Connection | OAuth status, scopes, token expiry, **mã lỗi cuối** | **Không bao giờ** hiển thị raw token |
| 5 | Contact | Email đăng nhập, recovery email, phone, location | Email copy được |
| 6 | Metadata | Tags, trạng thái, created/updated, thiết bị sửa cuối | — |

> **`notes` là secret** *(QĐ-02)*. Người dùng được hướng dẫn ghi vào đó số điện thoại khôi phục và tình trạng 2FA — trong hầu hết kịch bản chiếm tài khoản, số điện thoại khôi phục có giá trị **ngang hoặc hơn** mật khẩu. Hệ quả phải nói ra: **không tìm kiếm được theo `notes` khi vault đang khoá.**

### 7.3 Credential Vault

- Khối secrets có trạng thái Khoá/Mở **độc lập** với phiên đăng nhập cloud.
- `Reveal` cần vault đang mở → hiện **15 giây** rồi tự che lại.
- Giá trị reveal **không đặt vào React state** — giữ trong `ref`, ghi thẳng DOM, xoá khi hết giờ hoặc unmount.
- `Copy` → **Rust ghi thẳng vào clipboard**, không trả chuỗi về JS. Toast: *"Đã sao chép — Turtly sẽ xoá sau 30 giây"*.
- Trước khi xoá clipboard, **so sánh** nội dung hiện tại: khác → không đụng vào *(tránh xoá mất dữ liệu người dùng vừa copy)*.
- **Cảnh báo Clipboard History một lần:** nếu `HKCU\Software\Microsoft\Clipboard\EnableClipboardHistory` bật → banner trong Cài đặt: *"Lịch sử clipboard của Windows đang bật. Mật khẩu bạn sao chép sẽ còn trong `Win+V` sau khi Turtly xoá clipboard."* + hướng dẫn tắt. Có nút "Đã hiểu", không lặp lại.
- Sửa secret → cập nhật `updated_at` + audit event, **không lưu plaintext cũ**.
- Chống chụp màn hình là best-effort, **không** coi là biện pháp bảo mật.

### 7.4 Validation

- **Facebook** — URL thuộc `facebook.com`; username bỏ `@`; follower chỉ nhận `api` khi Page đã liên kết.
- **Instagram** — URL thuộc `instagram.com`; username lowercase; loại tài khoản Personal/Creator/Business.
- **Gmail** — email hợp lệ; URL tự sinh; không có follower.
- **Secrets** — **không giới hạn ký tự đặc biệt, không trim, không ghi vào log/analytics.**
- **Location** — text tự do ≤120 ký tự.

---

## 8. Hệ thống thiết kế

### 8.1 Tinh thần

Thân thiện, bình tĩnh, đáng tin — mềm hơn công cụ quản trị doanh nghiệp, nghiêm túc hơn app mascot giải trí. "Chiếc mai" là ẩn dụ cho nơi gom và bảo vệ tài khoản; các ô trên mai gợi các module dashboard.

### 8.2 Màu

> Bảng dưới đây là **nội dung phải tạo ra ở Sprint 1** trong `src/styles/tokens.css`, khối `@theme` của Tailwind v4 *(QĐ-12 — không có `tailwind.config.ts`)*. **Sau khi file đó tồn tại, nó là nguồn duy nhất** và tài liệu này ngừng lặp lại giá trị hex.
> Dẫn xuất từ `BRAND.md` §5 và `DECISIONS.md` QĐ-09/QĐ-14.

**Thương hiệu** — không sửa nếu không có yêu cầu rõ ràng:

| Token | Hex |
|---|---|
| `--color-deep-teal` | `#0e3d3b` |
| `--color-green-teal` | `#1e6f6a` |
| `--color-mint` | `#a7e1d2` |
| `--color-soft-lime` | `#cdeb7a` |
| `--color-dark-forest` | `#0b2e28` |
| `--color-neutral-gray` | `#e7ebef` |

**Bề mặt và chữ** — đúng **hai** tầng bề mặt, không có tầng thứ ba:

| Token | Hex |
|---|---|
| `--color-bg` | `#f8faf9` |
| `--color-surface` | `#ffffff` |
| `--color-border` | `#e7ebef` |
| `--color-text` | `#0b2e28` |
| `--color-text-secondary` | `#5f6f6b` |
| `--color-text-muted` | `#899692` |

**Trạng thái** — mỗi cái ba biến thể *(QĐ-14)*:

| Trạng thái | `--color-<s>` | `--color-<s>-text` | `--color-<s>-bg` |
|---|---|---|---|
| `success` | `#2e9b64` | `#1f6e46` | `#eaf5ef` |
| `warning` | `#e3a32b` | `#8a5d0f` | `#fbf3e3` |
| `error` | `#d95c59` | `#a93832` | `#fbeceb` |
| `info` | `#3b82c4` | `#2a5f91` | `#eaf2f9` |
| `inactive` | `#8a9691` | `#5f6f6b` | `#eff2f1` |
| **`local`** | `#1e6f6a` | `#0e3d3b` | `#e9f2f0` |

**Ánh xạ vai trò** *(QĐ-09 — `brass` của `UI.md` bị bỏ)*:

| Vai trò | Token |
|---|---|
| Nút chính | `--color-green-teal` |
| Nav đang chọn, link | `--color-deep-teal` |
| Vòng focus | `--color-deep-teal`, `outline-offset: 2px` |
| Điểm nhấn nhỏ, chấm chỉ báo | `--color-soft-lime`, dùng tiết chế |

**Trạng thái — mỗi cái có 3 biến thể** *(QĐ-14)*:

| Token | Dùng cho | Ngưỡng |
|---|---|---|
| `--color-<state>` | icon, viền, chấm | ≥3:1 với nền kề |
| `--color-<state>-text` | **chữ** trong chip, nhãn, thông báo | **≥4.5:1** trên `--color-surface` |
| `--color-<state>-bg` | nền chip | — |

States: `success` · `warning` · `error` · `info` · `inactive` · **`local`** *(riêng của Turtly — "Chỉ lưu trong máy", dùng màu thương hiệu vì đó là lời hứa cốt lõi)*.

> Biến thể `-text` tồn tại vì **cả 5 màu canonical đều trượt sàn 4.5:1** khi làm chữ (2,0–3,7:1). Chip của Turtly luôn là icon **+ chữ**, nên phần chữ bắt buộc phải đạt ngưỡng.
> **Không dùng:** `Danger #A33B3B`, `Surface #F6F8F7`, `Border #D8E4E0` — ba giá trị này trôi khỏi `BRAND.md` trong quá trình diễn giải và đã bị loại.

### 8.3 Chữ

| Vai trò | Font | Token |
|---|---|---|
| Tiêu đề, logo | **Nunito Sans** | `--font-display` |
| UI, body | **Inter** | `--font-sans` |
| **Số liệu** | **JetBrains Mono** *(QĐ-09)* | `--font-mono`, thuộc tính `data-numeric` |

Thang: Display 32 / H1 28 / H2 22 / H3 18 / Body 14 / Small 13 / Label 12 / Caption 11.

- **Line-height không dưới 1,45 cho mọi cỡ ≤15 px.** Tiếng Việt có dấu chồng hai tầng (ề, ẫ, ợ) sẽ chạm dòng trên. Body/Small/Label/Caption **đều** ≤15 px nên luật này áp cho gần hết thang chữ.
- Cỡ nhỏ nhất là **11 px**, chỉ dùng cho `--text-caption` (mono, timestamp). Body chính 14 px, label 12 px.
- Font **nhúng cục bộ** dạng `.woff2` subset `latin` + `vietnamese` trong `src/assets/fonts/`. Không gọi Google Fonts lúc chạy — CSP chặn và app phải chạy offline.

### 8.4 Khoảng cách, bo góc, độ nổi

- **Spacing:** `--spacing: 4px`. Tailwind v4 sinh sẵn cả thang từ giá trị này. Không dùng giá trị lẻ.
- **Radius:** `--radius-ctrl: 10px` · `--radius-card: 14px` · `--radius-tile: 17px` · `--radius-pill: 999px`.
- **Elevation — đúng hai mức**, không có mức thứ ba, không bóng nhiều lớp:
  `--shadow-card: 0 1px 2px rgb(11 46 40 / 0.06)` · `--shadow-float: 0 12px 32px rgb(11 46 40 / 0.16)`.
- **Focus ring:** `--color-deep-teal`, `outline-offset: 2px`.
- **Motion:** 160–220 ms ease-out, tôn trọng `prefers-reduced-motion`.

**Thang chữ — giá trị cho `@theme`:**

| Token | rem | px | Line-height |
|---|---|---|---|
| `--text-display` | 2 | 32 | 1.15 |
| `--text-h1` | 1.75 | 28 | 1.2 |
| `--text-h2` | 1.375 | 22 | 1.3 |
| `--text-h3` | 1.125 | 18 | 1.4 |
| `--text-body` | 0.875 | 14 | **1.6** |
| `--text-small` | 0.8125 | 13 | **1.55** |
| `--text-label` | 0.75 | 12 | **1.5** |
| `--text-caption` | 0.6875 | 11 | **1.5** |

*Bốn dòng cuối đều ≤15 px nên áp luật line-height ≥1,45 của §8.3.*

**Font stack:**
`--font-display: "Nunito Sans", "Segoe UI", system-ui, sans-serif`
`--font-sans: "Inter", "Segoe UI", system-ui, sans-serif`
`--font-mono: "JetBrains Mono", "Cascadia Mono", ui-monospace, monospace`

### 8.5 Mascot Tully

| State | Dùng tại | Không dùng |
|---|---|---|
| Neutral | **Lời chào màn hình chính**, About | Lặp trên mọi card |
| Wave | Onboarding, chào mừng quay lại | Lỗi hoặc cảnh báo bảo mật |
| Search | Tìm kiếm rỗng, không có kết quả | Loading |
| Security | Tạo master password, vault khoá | Toast thành công nhỏ |
| Sync | Job nền | Khi mất kết nối hoàn toàn |
| Offline | Mất mạng, tạm dừng sync | Lỗi credentials |
| Success | Tạo/import/sync thành công | Hiển thị liên tục sau hành động |
| Import | Luồng CSV import | — |

`TullyIllustration` nhận `state` là enum 8 giá trị, có kích thước và alt text cố định.

### 8.6 Component inventory

Button (primary/secondary/outline/ghost/danger; icon-only luôn có tooltip) · Input (text, password, search, select, combobox, tag — **label không thay bằng placeholder**) · AccountCard, StatCard, PlatformBadge, StatusChip, SyncIndicator · SecretField, CopyButton, RevealButton, VaultLockBanner · EmptyState, ErrorState, Skeleton, Toast, ConfirmDialog, Sheet · TullyIllustration.

### 8.7 Accessibility

Mục tiêu **WCAG 2.2 AA**, nghiệm thu bằng **AT-11**.

- Toàn bộ luồng CRUD, unlock, reveal, copy, sync, mở tài khoản dùng được **chỉ bằng bàn phím**.
- Trạng thái **không bao giờ chỉ dựa vào màu** — luôn có icon + chữ.
- Mọi phần tử nhận focus có vòng focus nhìn thấy: `--color-deep-teal`, `outline-offset: 2px`.
- Sheet giữ focus bên trong, trả focus về phần tử mở nó khi đóng.
- Avatar/mascot có alt text theo ngữ cảnh; ảnh trang trí dùng `alt=""`.
- axe-core trên màn hình chính và Sheet: **0 lỗi mức `serious`/`critical`**.

### 8.8 Asset — trạng thái thật *(Blocker)*

**Bộ ảnh trong `docs/brand-reference/` (22 file) chưa dùng được.** Kiểm tra bằng cách giải nén PNG và đọc pixel:

| Vấn đề | Bằng chứng |
|---|---|
| Nền magenta **nung cứng** vào ảnh | 22/22 file có kênh alpha nhưng **0,0 % pixel trong suốt**; `pixel(0,0) = (250, 3, 250, 255)` |
| Magenta **không sạch** | Dao động `#FA03FA`…`#F505EF` giữa các pixel → đã qua nén mất dữ liệu. Chroma-key sẽ để lại viền tím quanh cạnh khử răng cưa |
| Toàn bộ **raster, độ phân giải thấp** | Lớn nhất 399×219. App icon Windows cần 256×256 trong ICO đa kích thước |
| Wordmark **không phải Nunito Sans** | Chữ vẽ trong ảnh render — không kern lại, không đổi cỡ, không dựng lại được |
| **8 pose không cùng một con rùa** | Tỷ lệ thân, cỡ mắt, hình ô trên mai và sắc xanh khác nhau từng pose (pose 6 mai sáng hơn + đường chia trắng; pose 7 mắt to hơn rõ rệt) |
| Bản mono giữ **chấm sáng ở mắt** | Ở 16 px chấm đó nhỏ hơn một pixel → mark thành khối đen không đặc điểm |

**Việc phải làm** — một hạng mục riêng trong lịch, **1–2 ngày**, không làm lẫn vào sprint code:

1. Ảnh tham chiếu đã nằm ở `docs/brand-reference/`. **Không file nào trong đó được vào `src/`.**
2. Vẽ lại logomark + 8 pose thành **SVG phẳng**, một hệ dựng hình chung: cùng lưới, cùng độ dày nét, cùng token màu, cùng khoảng đệm quang học.
3. Wordmark: dựng bằng **Nunito Sans ExtraBold**, kern tay, xuất SVG đã outline.
4. **`logomark-small.svg`** riêng cho ≤24 px: bỏ chân, bỏ chi tiết mắt, giữ bóng mai + 4 ô.
5. App icon: vector 1024×1024 → ICO đa kích thước 16/24/32/48/64/128/256.

**Checklist repo:** `logo-primary-horizontal.svg` · `logo-stacked.svg` · `logomark.svg` · `logomark-small.svg` · `logo-mono-dark.svg` · `logo-mono-light.svg` · `app-icon-1024.png` + ICO · `mascot/tully-{neutral,wave,search,security,sync,offline,success,import}.svg`

**Cho tới khi có SVG thật:** dùng placeholder hình học từ `--color-mint` *(QĐ-09)*. **Không tự sinh mascot khác.**

**Nghiệm thu:** `src/assets/brand/` chỉ chứa `.svg` (trừ icon đã xuất) · mọi PNG mascot có ≥20 % pixel `alpha=0` · mở trên nền sáng và nền Deep Teal không thấy viền lạ · **icon 16 px vẫn nhận ra là con rùa**.

---

## 9. Kiến trúc

### 9.1 Stack — kèm **khi nào** đưa vào

| Lớp | Công nghệ | Đưa vào ở |
|---|---|---|
| Desktop shell | **Tauri 2** + Rust stable | có |
| Frontend | React 19 + TypeScript + Vite 7 | có |
| UI | **Tailwind v4** — token trong `@theme`, **không có `tailwind.config.ts`** *(QĐ-12)* | có |
| Crypto | `argon2` · `chacha20poly1305` · `zeroize` · `rand` *(QĐ-16)* | Sprint 2 |
| Kho cục bộ | **SQLite** (`tauri-plugin-sql` hoặc `rusqlite`) | Sprint 2 |
| Forms | React Hook Form + **Zod** | Sprint 2 |
| Primitives | **Radix** — chỉ `dialog` (Sheet), `dropdown-menu`, `select`, `tooltip` | Sprint 2 |
| Cloud | Supabase Auth/Postgres/Realtime/Edge/Cron | v1.1 |
| Server cache | TanStack Query | **v1.1** — v1.0 đọc SQLite cục bộ, chưa có cache mạng để quản |
| Testing | Vitest + Testing Library | có |
| E2E | Playwright + tauri-driver | Sprint 5 |

**Không dùng:** `shadcn/ui` *(xung đột QĐ-12: phát sinh component giả định config v3 và bảng màu HSL riêng; repo đã có primitive viết tay theo token)* · `zustand` *(state duy nhất cần chia sẻ là trạng thái khoá/mở của vault — một Context là đủ)* · `Tauri Stronghold` *(QĐ-16)* · `pnpm workspace` *(một app, không có package chia sẻ — giữ `npm`)*.

### 9.2 Cấu trúc repo

```text
src/
├─ app/            # App.tsx, router, providers
├─ components/
│  ├─ account/     # AccountCard, AccountGrid, AccountSheet, StatusChip…
│  ├─ layout/      # AppShell, Sidebar, Topbar
│  ├─ states/      # Empty, Error, NoResult, Skeleton
│  └─ ui/          # Button, Input, Dialog… (primitive có thương hiệu)
├─ hooks/
├─ services/       # AccountRepository (interface) + implementation
├─ lib/            # thuần hàm: filter, format, validate, cn
├─ types/ · styles/ · assets/ · mocks/
src-tauri/
├─ src/commands/   # encrypt/decrypt, open_url, clipboard
├─ src/security/   # vòng đời khoá, Argon2id, XChaCha20
├─ capabilities/
└─ tauri.conf.json
supabase/          # v1.1+ : migrations/, functions/, seed.sql
tests/ · docs/
```

**Luật ranh giới** *(hệ quả ràng buộc của QĐ-01)*:

> Không component nào trong `components/` hay `pages/` được `import` SQLite, Supabase client, hay `@tauri-apps/api` **trực tiếp**. Tất cả đi qua `services/AccountRepository`.

Cưỡng chế bằng ESLint `no-restricted-imports` chặn `@supabase/*`, `@tauri-apps/*`, `sql.js` trong `src/components/**` và `src/pages/**`. CI fail khi vi phạm.

ID sinh bằng `crypto.randomUUID()`, **không bao giờ** dùng số tăng dần.

### 9.3 Kho dữ liệu theo bản phát hành

| Bản | Metadata | Secrets | Cơ chế |
|---|---|---|---|
| **v1.0** | **SQLite cục bộ** | cột `ciphertext` **trong chính SQLite** | Tất cả trong máy |
| **v1.1** | SQLite = cache · Supabase = nguồn | ciphertext đồng bộ lên Supabase | Đổi implementation của `AccountRepository` |
| **v1.2** | như v1.1 | như v1.1 | + `platform_connections` server-only |

Vị trí DB: `%APPDATA%/Turtly/turtly.db` qua `app_data_dir()`. **Không** đặt cạnh file exe.

Schema SQLite v1.0 dùng **cùng tên cột và cùng kiểu** với schema Postgres v1.1 (UUID dạng `TEXT`, có `updated_at`/`deleted_at`/`server_updated_at` từ Sprint 2 kể cả khi v1.0 chưa dùng tới), để lên v1.1 không phải viết lớp ánh xạ.

### 9.4 Ranh giới React ↔ Rust

- React **không giải mã** payload. Nó gọi lệnh Tauri và chỉ nhận giá trị khi UI cần reveal/edit.
- **Đúng hai** lệnh Rust chạm plaintext:
  - `reveal_secret(account_id, field)` — trả chuỗi, dùng cho hiển thị 15 giây.
  - `copy_secret_to_clipboard(account_id, field)` — **không trả chuỗi về JS**, Rust ghi thẳng clipboard. Đây là đường mặc định; Reveal là ngoại lệ.
- DEK đã mở sống trong `Zeroizing<[u8; 32]>` ở Rust, **không bao giờ qua IPC**.
- DevTools tắt ở bản production.

> **Giới hạn mô hình đe doạ — phải nói ra.** Tauri IPC tuần tự hoá qua JSON, nên giá trị reveal trở thành một `String` JavaScript. Chuỗi JS bất biến và bị GC dọn **không xoá nội dung** — không zeroize được từ phía JS. Mô hình đe doạ của Turtly **không** bao gồm kẻ tấn công đã chạy được mã trên máy hoặc dump được bộ nhớ tiến trình.

### 9.5 Tauri capabilities — least privilege

| Permission | Bản | Lý do |
|---|---|---|
| `core:default` | v1.0 | Tối thiểu để chạy |
| `opener:allow-open-url` **có scope** `https://*.facebook.com/*`, `https://*.instagram.com/*`, `https://mail.google.com/*` | v1.0 | FR-07. Scope ở **tầng capability**, không chỉ validate trong Rust — hai lớp |
| `sql:default` | v1.0 | Kho cục bộ |
| `clipboard-manager:allow-write-text` | v1.0 | FR-05. **Không** cấp `read-text` |
| `updater:default` | v1.1 | §14.2 |
| `shell:*` · `fs:*` rộng · `http:*` | **Không cấp** | Không tính năng nào cần |

CSP cấu hình trong `tauri.conf.json` **ngay từ đầu**, không đợi v1.1 — quên là mọi request Supabase fail im lặng.

---

## 10. Mô hình dữ liệu

### 10.1 Các bảng

| Bảng | Bản | Vai trò |
|---|---|---|
| `accounts` | v1.0 | Metadata tài khoản |
| `account_secrets` | v1.0 | Payload đã mã hoá (**gồm cả `notes`**) |
| `user_keyrings` | v1.0 | **Hai** bản bọc DEK: bằng master, bằng recovery |
| `account_metrics` | v1.0 | Lịch sử follower |
| `audit_events` | v1.0 | Sự kiện bảo mật, **không chứa secret** |
| `profiles` | v1.1 | Hồ sơ chủ Turtly |
| `devices` | v1.1 | Thiết bị/session |
| `platform_connections` | v1.2 | Trạng thái OAuth — **client đọc được** |
| `platform_connection_secrets` | v1.2 | Token — **client không bao giờ chạm** *(QĐ-17)* |
| `sync_jobs` | v1.2 | Theo dõi job |

### 10.2 `accounts`

| Field | Type | Rule |
|---|---|---|
| `id` | uuid | PK, `gen_random_uuid()` / `crypto.randomUUID()` |
| `owner_id` | uuid | FK `auth.users`; ranh giới RLS (v1.1+) |
| `platform` | text | `facebook` \| `instagram` \| `google` |
| `account_type` | text | page/profile/business/creator/personal/gmail |
| `display_name` | text | Bắt buộc, 1–120 ký tự |
| `username` | text | Nullable |
| **`normalized_username`** | text | **Cột thật**, Postgres: `generated always as (lower(trim(leading '@' from username))) stored`. SQLite: cột thường do repository ghi, **cùng quy tắc** *(BR-09)* |
| `login_email` | text | Lưu đã `lower()` sẵn. **Không dùng `citext`** — một quy tắc chuẩn hoá, áp một chỗ, giống nhau trên cả hai kho |
| `recovery_email` | text | Nullable, cùng quy tắc |
| `location` | text | Nullable, ≤120 ký tự |
| `profile_url` | text | URL đã validate |
| `avatar_path` | text | Đường dẫn cục bộ (v1.0) hoặc Storage path |
| `status` | text | active \| review \| inactive \| locked \| archived |
| `follower_mode` | text | **Mặc định `manual`** · api \| manual \| none |
| `follower_current` | bigint | Nullable. **Chỉ Edge Function ghi** — xem §10.3 |
| `follower_synced_at` | timestamptz | Nullable, cùng ràng buộc |
| `tags` | text[] | Mặc định mảng rỗng |
| `created_at` / `updated_at` / `server_updated_at` | timestamptz | `server_updated_at` do trigger Postgres ghi bằng `now()` |
| `deleted_at` / `archived_at` | timestamptz | Xoá mềm |

> **`notes` KHÔNG có ở đây** *(QĐ-02)*. Nó là một khoá **bên trong** encrypted payload của `account_secrets`.

### 10.3 Index và constraint

- `accounts(owner_id, archived_at, updated_at desc)`
- `accounts(owner_id, platform, status)`
- **Unique partial** `(owner_id, platform, normalized_username)` khi `username is not null and archived_at is null` → BR-02
- `account_metrics(account_id, metric_type, recorded_at desc)`
- **Unique partial** `sync_jobs(account_id) where status in ('queued','running')` → BR-07
- Trigger `updated_at` và `server_updated_at`. **Không** trigger nào giải mã hoặc xử lý secret trong database.
- v1.1: `alter publication supabase_realtime add table accounts, account_secrets;` — **quên dòng này thì không có lỗi nào, chỉ là không có sự kiện Realtime nào tới.**

**Luật ghi `follower_current`:** `follower_current` và `follower_synced_at` **chỉ** được ghi bởi Edge Function `sync-followers`, trong **cùng transaction** với insert vào `account_metrics`. Client không bao giờ ghi hai cột này — cưỡng chế bằng column-level grant *(QĐ-03)*.

---

## 11. Bảo mật và đồng bộ

### 11.1 Hai lớp đăng nhập khác nhau

- **Mật khẩu Supabase / magic link** — chứng minh quyền truy cập dữ liệu cloud.
- **Master password** — giải mã kho bí mật. **Không gửi lên server, không dùng lại mật khẩu Supabase.**

### 11.2 Sơ đồ khoá *(QĐ-16, QĐ-18)*

```
                    ┌──────────────────┐
  master password ──┤ Argon2id + salt  ├── KEK_master ──┐
                    │ m=64MiB t=3 p=1  │                │  bọc
                    └──────────────────┘                ├──► DEK (32 byte ngẫu nhiên)
                    ┌──────────────────┐                │
  recovery key ─────┤ Argon2id + salt  ├── KEK_recovery ┘
   (32 byte, Base32)└──────────────────┘

  user_keyrings: wrapped_dek_by_master · wrapped_dek_by_recovery · salt · kdf_params · version
  account_secrets: XChaCha20-Poly1305(DEK, nonce riêng mỗi payload) · payload_version
```

1. Sinh DEK ngẫu nhiên 32 byte **trên thiết bị**.
2. Từ master password + salt → Argon2id → KEK. Tham số `m=64 MiB, t=3, p=1` được **version hoá** trong `kdf_params` để đổi về sau mà không phá dữ liệu cũ.
3. Recovery key là **KEK thứ hai độc lập** — 32 byte ngẫu nhiên mã hoá thành Base32 chia nhóm có ký tự kiểm tra, bọc **cùng một DEK**. Mở được bằng một trong hai.
4. Mỗi payload dùng **nonce riêng** + **XChaCha20-Poly1305**. Chọn XChaCha vì nonce 192-bit cho phép sinh ngẫu nhiên mà không lo trùng — tránh hẳn lớp lỗi nguy hiểm nhất của AES-GCM khi tự quản nonce.
5. **Đổi master password** = giải DEK bằng master cũ (hoặc recovery) → salt mới → KEK mới → bọc lại DEK → ghi đè `wrapped_dek_by_master`. **DEK không đổi**, nên không phải mã hoá lại `account_secrets`. Recovery key cũ **vẫn hợp lệ** — phải nói rõ cho người dùng, kèm nút "Sinh recovery key mới".
6. DEK đã mở sống trong `Zeroizing` cục bộ, **xoá khi auto-lock/logout**.

### 11.3 Chống dò master password

> **Biện pháp chính là tham số Argon2id** (~0,3–0,5 s mỗi lần thử trên máy để bàn hiện đại). Rate limit ở UI chỉ chống dò thủ công tại chỗ — với vault cục bộ, kẻ tấn công có file DB sẽ tấn công `wrapped_dek` **ngoài app**.

- Yêu cầu độ mạnh khi tạo: **≥12 ký tự**, chặn 100 mật khẩu phổ biến nhất, có thanh đo.
- Sai 5 lần → chờ 30 giây. Sai 10 lần → chờ 5 phút. Bộ đếm lưu **trên đĩa** — khởi động lại app không reset.

### 11.4 Auto-lock *(FR-10)*

- **Không hoạt động** = không có thao tác chuột/phím **trong cửa sổ Turtly**, đo bằng Rust (JS không thấy khi cửa sổ mất focus).
- Khoá theo thời gian nhàn rỗi: mặc định **10 phút**, tuỳ chọn 1/5/10/30.
- **Khoá bắt buộc, không tuỳ chọn:** khoá màn hình Windows (`WTS_SESSION_LOCK`) · sleep/hibernate · thoát app · đăng xuất Turtly.
- **Khoá khi minimize: tuỳ chọn, mặc định TẮT** — nó xung đột với luồng chính "copy mật khẩu → chuyển sang trình duyệt", và bật mặc định sẽ khiến người dùng đặt auto-lock 30 phút hoặc tắt hẳn.
- Khi khoá: zeroize DEK, huỷ mọi giá trị đang reveal, đóng phần Secrets nếu Sheet đang mở.

### 11.5 RLS — và chỗ RLS **không** làm được *(QĐ-17)*

Mọi bảng thuộc người dùng có policy `owner_id = auth.uid()` cho SELECT/INSERT/UPDATE/DELETE. Storage avatar dùng path theo user id với policy tương tự.

> **RLS lọc theo hàng, không giấu được cột.** Không có cách nào viết policy trả về hàng nhưng ẩn một cột. Vì vậy token Meta **không thể** được bảo vệ bằng RLS.

```sql
-- Client đọc được: chỉ trạng thái
create table platform_connections (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  owner_id   uuid not null references auth.users(id),
  provider text not null, external_id text, scopes text[],
  status text not null,              -- active | reauth_required | revoked | unsupported
  expires_at timestamptz,
  last_error_code text,              -- MÃ lỗi, không phải thông điệp thô của Meta
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

Khoá mã hoá token nằm trong **Supabase Vault**, chỉ Edge Function (service role) đọc được.

### 11.6 Khuôn mẫu bắt buộc cho **mọi** Edge Function

> Service role **đứng trên RLS**. Nếu function nhận `account_id` từ body và thao tác luôn, bất kỳ người dùng đã đăng nhập nào cũng chạm được dữ liệu của người khác. Lỗ hổng này **vượt qua** bộ test RLS thông thường vì test đó chạy qua client với anon key, không qua Edge Function.

```ts
// 1. Lấy user từ JWT của người gọi — KHÔNG lấy từ body.
const { data: { user }, error } = await userClient.auth.getUser();
if (error || !user) return json(401, { code: 'UNAUTHENTICATED' });

// 2. Xác minh quyền sở hữu TRƯỚC khi chạm service role.
const { data: owned } = await serviceClient
  .from('accounts').select('id')
  .eq('id', body.account_id)
  .eq('owner_id', user.id)          // ← dòng quyết định
  .maybeSingle();
if (!owned) return json(404, { code: 'NOT_FOUND' });   // 404, không phải 403

// 3. Từ đây mới được dùng serviceClient cho việc thật.
```

- `owner_id` **không bao giờ** đọc từ request body.
- Trả **404** thay vì 403 — không xác nhận sự tồn tại của bản ghi người khác.
- Mỗi Edge Function có ≥1 test gọi bằng JWT của user B lên `account_id` của user A và khẳng định nhận 404.

### 11.7 Đồng bộ và xung đột

**Metadata — làm cho conflict không thể xảy ra** *(QĐ-03)*. Client và Edge Function ghi **hai tập cột rời nhau**, cưỡng chế bằng column-level privilege của Postgres. Không có LWW, không có conflict resolution, vì không có conflict.

*Lý do QĐ-03 tồn tại:* `09:00` offline sửa `notes`, op vào queue kèm snapshot **cả hàng** → `09:15` cron ghi `current_followers = 15300` → `09:30` client flush queue gửi cả hàng → **đè `current_followers` về 15200**.

**Secrets — conflict dialog, nhưng không phơi giá trị** *(SEC-07)*. Payload là khối nguyên chứa 5 trường bí mật, nên dialog:

- Hiển thị **duy nhất**: thời điểm sửa, tên thiết bị, và **danh sách tên trường đã đổi** (so sánh sau khi giải mã cục bộ, chỉ so bằng). Ví dụ: *"Máy DESKTOP-A lúc 14:32 đã đổi: Mật khẩu tài khoản, Ghi chú."*
- Ba lựa chọn: `Giữ bản của máy này` · `Lấy bản từ máy kia` · `Xem chi tiết` (reveal có timeout, từng trường một).
- Ghi `audit_event` `conflict_resolved` kèm `device_id` thắng.

**Realtime và reconnect:**

1. Delta fetch dùng **`server_updated_at`** (do trigger Postgres ghi), client lưu **giá trị lớn nhất nó đã thấy** — **không** dùng đồng hồ máy mình, vì lệch giờ giữa hai máy sẽ làm bỏ sót bản ghi.
2. Delta fetch **không lọc `deleted_at`** — phải nhận cả bản ghi đã xoá mềm để áp việc xoá vào cache.
3. Thứ tự: **delta fetch xong rồi mới bật lại subscription**, bỏ qua sự kiện có `server_updated_at` ≤ mốc đã fetch.
4. Realtime **không bù được** khoảng mất kết nối — sự kiện phát ra lúc client offline là mất vĩnh viễn. Delta fetch là cơ chế bù duy nhất.

**Offline (v1.1) — chế độ chỉ đọc** *(FR-20)*. Mất kết nối → banner *"Không có kết nối — đang xem dữ liệu đã tải. Không thể sửa cho tới khi kết nối lại."*, vô hiệu hoá Thêm/Sửa/Xoá kèm tooltip. **Vault vẫn mở được và secrets vẫn đọc được** — đây là điểm mạnh thật của kiến trúc local-first. Hàng đợi chỉnh sửa offline → post-v1, cần mô hình conflict riêng.

### 11.8 Không rò token qua thông báo lỗi

> Đường rò token dễ xảy ra nhất đi qua đúng con đường được thiết kế để hữu ích: hiển thị lỗi cho người dùng gỡ rối. Và nó vượt qua mọi checklist "không log token" vì lập trình viên không log token — họ log *lỗi*.

- **Luôn** gửi token qua header `Authorization: Bearer`, **không bao giờ** qua query string.
- Edge Function **không bao giờ** trả response thô của Meta về client. Nó ánh xạ sang đúng 6 mã của §12.3 và ghi vào `platform_connections.last_error_code`. "Chi tiết kỹ thuật" cho người dùng = mã lỗi + `trace_id`.
- Body thô chỉ vào log của Edge Function, **sau khi** chạy qua bộ lọc thay mọi chuỗi khớp `/[A-Za-z0-9_\-]{40,}/` bằng `[REDACTED]`.
- Không đưa error object của provider vào error tracking. Chỉ gửi mã lỗi đã ánh xạ.

### 11.9 Security checklist

- [ ] Không commit `.env`, Meta App Secret, Supabase service key
- [ ] Ẩn secrets khỏi log, telemetry, error message và DevTools production
- [ ] Tắt remote navigation; CSP chỉ cho origin cần thiết
- [ ] Validate URL **ở Rust** trước khi opener chạy — chặn `file:`, `javascript:`, `data:`, credential trong URL, homograph
- [ ] Rate limit unlock, bộ đếm lưu trên đĩa
- [ ] Recovery key hiện một lần, có xác nhận đã lưu, có luồng rotate
- [ ] Backup database **không đủ** để giải mã secret nếu thiếu master/recovery key
- [ ] Dependency audit npm + cargo trước mỗi bản phát hành

---

## 12. Follower sync (v1.2)

### 12.1 Lịch chạy — **một** cơ chế duy nhất *(QĐ-15)*

| Trigger | Tần suất | Quy tắc |
|---|---|---|
| **Cron server** | **Mỗi 6 giờ** | Chỉ account `follower_mode = api` + connection `active`; chia batch tránh rate limit |
| Sync now | Theo yêu cầu | Cooldown **5 phút/account**; trả job id ngay, không blocking |
| Sync all | Theo yêu cầu | Hàng đợi tuần tự, UI hiển thị tiến độ |
| Reconnect | Sau khi OAuth lại | Sync ngay khi token hợp lệ |
| **Dọn job kẹt** | Mỗi 15 phút | `status='running' and heartbeat_at < now() - interval '5 minutes'` → `failed` + `TIMEOUT` |

**Bỏ polling phía client và bỏ tuỳ chọn tần suất trong Cài đặt.** Thay bằng một dòng chữ: *"Turtly tự cập nhật follower mỗi 6 giờ. Cần số mới ngay? Dùng nút Đồng bộ."*

*Sửa đổi QĐ-06: 60 phút × 50 tài khoản = 1.200 lệnh gọi/ngày cho một số thay đổi vài lần một tuần, và Meta rate limit tính theo **app** chứ không theo account.*

### 12.2 State machine

```
queued → running → succeeded
queued/running → rate_limited → queued (theo retry_after)
running → reauth_required   (token hết hạn hoặc bị thu hồi)
running → unsupported       (loại tài khoản không phù hợp)
running → failed            (hết số lần retry)
running → failed/TIMEOUT    (heartbeat ngừng > 5 phút)
```

`sync_jobs` có `heartbeat_at`, Edge Function cập nhật mỗi 10 giây khi chạy. Khi insert bị chặn bởi unique index → **không phải lỗi**: trả về job đang chạy, UI hiện "Đang đồng bộ…".

### 12.3 Error taxonomy

| Code | Thông báo | CTA |
|---|---|---|
| `AUTH_EXPIRED` | Kết nối đã hết hạn | Kết nối lại Meta |
| `PERMISSION_MISSING` | Thiếu quyền đọc dữ liệu | Xem hướng dẫn quyền |
| `ACCOUNT_UNSUPPORTED` | Loại tài khoản chưa được API hỗ trợ | Chuyển sang Manual |
| `RATE_LIMITED` | Meta tạm giới hạn yêu cầu | Tự thử lại theo `retry_after` |
| `NETWORK_ERROR` | Không thể kết nối dịch vụ | Retry nền, giữ số gần nhất |
| **`TIMEOUT`** | Đồng bộ bị gián đoạn | Thử lại |
| `UNKNOWN` | Đồng bộ chưa thành công | Mã lỗi + `trace_id`, **không lộ token** |

**Với mọi mã lỗi:** badge đổi theo §6.3, CTA đổi theo bảng trên, và **`follower_current` giữ nguyên giá trị cũ** — không thành 0, không thành null *(BR-04, release blocker #5)*.

**Yêu cầu kiến trúc:** Edge Function gọi Meta qua **interface thay được bằng bản giả** trong test. Không có tầng này thì 5/7 mã lỗi không kiểm được. Chốt trước Sprint 4.

### 12.4 Data retention

Follower metrics chi tiết **12 tháng** · sync job logs **30 ngày** · audit security events **90 ngày**. Không mục nào chứa token hay password. Export metrics sau MVP; export credentials cần luồng riêng và cảnh báo mạnh.

---

## 13. Kế hoạch

### 13.1 Roadmap

| Giai đoạn | Thời gian | Deliverable | Quality gate |
|---|---|---|---|
| **0. Foundation** | 3–4 ngày | **Scaffold Tauri 2 + React 19 + TS + Vite 7 + Tailwind v4**, cài Rust, ADR, env, **khoá updater (QĐ-19)**, **spike Meta 1 ngày (QĐ-20)**, asset manifest | `npm run dev` chạy được · không commit secret · ADR-003 có request/response Meta thật |
| **1. Design system** | Tuần 1 | `tokens.css` theo §8.2/§8.4, font nhúng cục bộ, component, shell, mapping Tully | Component states · keyboard focus · chip trạng thái đạt 4.5:1 |
| **2. Local core** | Tuần 2–3 | **SQLite**, CRUD, Card/Sheet, vault, recovery key, search, **CSV import** | Secrets không xuất hiện trong log · **AT-12 pass** · unit test pass |
| — | | **▶ RELEASE GATE v1.0** | 10 release blocker §14.3 đều pass |
| **3. Cloud sync** | Tuần 4 | Auth, schema, RLS, Realtime, delta fetch, devices | Máy A/B sync · RLS negative test pass · **test IDOR Edge Function pass** |
| — | | **▶ RELEASE GATE v1.1** | |
| **4. Meta** | Tuần 5–6 | OAuth, Edge Function, Cron, metrics, error states | Test trên Page + IG Professional thật · Manual fallback hoạt động |
| — | | **▶ RELEASE GATE v1.2** | |
| **5. Hardening** | Tuần 7 | E2E, conflict, offline/reconnect, hiệu năng, a11y | Không còn P0 bug · test 300 tài khoản đạt |
| **6. Release** | Tuần 8 | Installer, docs, diễn tập backup/recovery | Clean install Windows 10/11 **offline** · rollback có hướng dẫn |

*Ước lượng giả định một lập trình viên làm tương đối tập trung. Vừa học vừa làm → kéo thành 10–12 tuần, **không cắt kiểm thử và không bỏ mã hoá**.*

**Việc riêng, chạy song song:** vẽ lại asset SVG (§8.8), 1–2 ngày, phải xong trước RELEASE GATE v1.0.

### 13.2 Definition of Done

- Có acceptance criteria và **AT tương ứng đang pass**. Một FR không có AT thì không được đánh dấu hoàn thành.
- Loading/empty/error/permission states được thiết kế, không chỉ happy path.
- Không có `any` TypeScript mới nếu không giải thích. Lint, typecheck, test pass.
- Migration có chiến lược forward/rollback và test trên database trống.
- UI dùng được bằng bàn phím · Tully đúng state · copy tiếng Việt nhất quán.
- **Security review** cho mọi thay đổi chạm tới secret, OAuth, opener, hoặc RLS.

### 13.3 Backlog theo sprint

**Sprint 0** — **cài Rust** · scaffold Tauri 2 + React 19 + TS + Vite 7 + Tailwind v4 · CSP trong `tauri.conf.json` **ngay từ đầu** *(quên là mọi request Supabase fail im lặng ở v1.1)* · ADR-001 (Tauri 2 thay Electron) · ADR-002 (XChaCha20-Poly1305 + tham số Argon2id) · **ADR-003 (spike Meta)** · lint/format/commit hook/CI · ESLint `no-restricted-imports` theo §9.2 · **sinh khoá updater (QĐ-19)**.

> **Bẫy môi trường.** Repo nằm trong `C:\Users\Viet Tien\` vốn cũng là một git repo khác và có `postcss.config.mjs` riêng. Vite leo ngược cây thư mục và bắt nhầm file đó → build fail. Chặn bằng `css: { postcss: {} }` trong `vite.config.ts` ngay khi scaffold.

**Sprint 1** — `tokens.css` theo §8.2/§8.4 · font `.woff2` subset `latin`+`vietnamese` nhúng cục bộ · Button/Input/StatusChip · sidebar/topbar/window state · AccountCard đủ states *(§6.2, §6.3)* · Sheet + skeleton/error states · dữ liệu giả.

**Sprint 2** — SQLite schema + `AccountRepository` local · vault create/unlock/lock · encrypt/decrypt command · **recovery key + rotate (FR-18, FR-19)** · reveal/copy timeout · **CSV import (FR-17)** · form theo nền tảng + Zod · opener allowlist + Gmail `authuser`.

**Sprint 3** — màn hình Auth · migrations profiles/accounts/secrets/keyrings · RLS + negative test · column-level grant *(QĐ-03)* · optimistic CRUD + Realtime + delta fetch · devices · chế độ chỉ đọc offline.

**Sprint 4** — OAuth start/callback Edge Function + **khuôn mẫu §11.6** · token server-only *(QĐ-17)* · `sync-followers` + metric insert · Cron 6 giờ + cron dọn job kẹt · cooldown, retry, error taxonomy · **tầng giả lập provider**.

**Sprint 5** — seed 300 tài khoản + benchmark · E2E happy path + auth expired + mất mạng + conflict · a11y + copywriting + Tully states · installer, versioning, release notes, hướng dẫn backup/recovery.

---

## 14. Kiểm thử

### 14.1 Test pyramid

| Tầng | Ngưỡng | Chạy ở đâu |
|---|---|---|
| Unit | Độ phủ **≥90 %** cho `src/lib/**` và `src-tauri/src/security/**` | CI, mọi push |
| Component | Mọi component trong `components/account/**` và `components/ui/**` có test cho ≥3 trạng thái (bình thường / rỗng-hoặc-null / dữ liệu dài) | CI, mọi push |
| Integration | **100 %** policy RLS có test âm tính · **100 %** Edge Function có test IDOR | CI, mọi push (Supabase local) |
| E2E desktop | 1 luồng hạnh phúc + AT-08, AT-09, AT-13 | CI, trên PR vào `main` |
| Security | AT-02, AT-08, AT-09, **AT-12**, AT-13 | **Bắt buộc trước mỗi bản phát hành** |
| Performance | AT-10 ở **300** tài khoản | Trước mỗi bản phát hành |

**Toàn bộ tầng chạy ở CI phải xong dưới 5 phút** — vượt quá thì người ta bắt đầu bỏ qua.

### 14.2 Acceptance tests

| ID | Nội dung |
|---|---|
| **AT-01** | Tạo tài khoản Facebook với mật khẩu chứa **khoảng trắng và ký tự Unicode** → đóng mở app → giải mã đúng 100 % |
| **AT-02** | Dump DB chỉ thấy ciphertext/nonce; grep toàn workspace và log không thấy chuỗi mật khẩu mồi |
| **AT-03** | *(v1.1)* Cả hai máy online mạng gia đình thật, app ở màn hình `Tài khoản`, vault mở. Đo từ khi máy A nhận phản hồi lưu thành công tới khi thẻ xuất hiện trong DOM máy B. **10 lần** cho mỗi thao tác (tạo/sửa/archive). Đạt khi **trung vị ≤2 s và cao nhất ≤5 s**, không lần nào thất bại. **+ Ca:** máy B đang mở Sheet của đúng tài khoản đó → nội dung cập nhật, không giữ giá trị cũ, không đóng đột ngột |
| **AT-04** | Máy B chưa mở vault vẫn xem được metadata nhưng **không** đọc được secret. Offline vẫn mở được vault và đọc được secret đã tải |
| **AT-05** | Facebook Page + Instagram Professional hợp lệ sync follower và lưu metric có timestamp |
| **AT-06** | Tài khoản personal/unsupported hiển thị Manual, **không** gọi API lặp vô hạn |
| **AT-07** | Mất mạng khi sync: giữ follower cũ, status error/offline, retry có backoff |
| **AT-08** | Nút mở tài khoản chỉ chấp nhận `http`/`https` thuộc allowlist. Chặn `file://`, `javascript:`, `data:`, credential trong URL, host homograph, shell command |
| **AT-09** | (a) copy → chờ 30 s → clipboard rỗng · (b) copy → copy thứ khác → chờ 30 s → **nội dung mới còn nguyên** · (c) bật Clipboard History → banner hiện **đúng một lần** · reveal tự che sau 15 s |
| **AT-10** | **300** tài khoản: gõ-tới-thấy-kết-quả ≤200 ms, cuộn grid không rớt khung hình. Vượt 300 sau CSV import → mở lại QĐ-10 |
| **AT-11** | Đi hết luồng `mở app → unlock → tìm kiếm → mở Sheet → reveal → copy → đóng Sheet → mở tài khoản` **chỉ bằng bàn phím**. Vòng focus nhìn thấy ở mọi bước. Sheet giữ và trả focus đúng. axe-core: 0 lỗi `serious`/`critical` |
| **AT-12** | **DIỄN TẬP KHÔI PHỤC — release blocker.** Máy A: tạo vault, lưu recovery key, tạo 5 tài khoản có mật khẩu Unicode và khoảng trắng, ghi lại giá trị mong đợi. Xoá hoàn toàn máy A. Máy B (**VM Windows sạch**): cài installer, **nhập recovery key** (không dùng master password), đặt master mới → cả 5 mật khẩu giải mã đúng từng ký tự. Khởi động lại → mở bằng master **mới** → vẫn đúng. **+ Ca:** nhập sai recovery key 3 lần → không rò thông tin nào về độ dài hay nội dung khoá đúng |
| **AT-13** | Mở vault → reveal một mật khẩu → `Win+L` → mở khoá Windows → Turtly ở trạng thái **vault khoá** và ô mật khẩu đã che. Test Rust khẳng định DEK bị zeroize |
| **AT-14** | *(v1.1)* Máy B ngắt mạng; máy A tạo 1, sửa 1, **xoá 1**; máy B nối lại → sau ≤10 s khớp máy A trên **cả ba** thay đổi. Chạy tự động |
| **AT-15** | Sửa tên và username → đóng mở app → giá trị mới còn đúng. Archive → biến khỏi grid mặc định → hiện khi lọc `Đã lưu trữ` → Restore về `active` |
| **AT-16** | 3 tài khoản tên gần giống; tìm theo tên/username/email/tag; lọc theo nền tảng và trạng thái. **`nguyen` tìm ra `Nguyễn`** (không phân biệt dấu, không phân biệt hoa thường) |
| **AT-17** | Nhập follower tay → card hiển thị nguồn `Manual` + thời điểm nhập · **không** phát sinh lệnh gọi API nào |
| **AT-18** | Bấm `Đồng bộ` hai lần trong 5 phút → lần hai bị cooldown chặn với thông báo rõ, **không phải thông báo lỗi** |
| **AT-19** | 4 stat card khớp số đếm thật; bấm vào áp đúng filter |
| **AT-20** | *(v1.1)* Ngắt mạng → banner trong ≤10 s → Thêm/Sửa/Xoá vô hiệu hoá → **vẫn mở được Sheet và reveal được mật khẩu** → nối lại → banner biến mất, chức năng trở lại, delta fetch chạy |
| **AT-21** | **CSV import, 7 ca** — xem bảng §14.3 |
| **AT-22** | Một ca cho **mỗi** mã lỗi §12.3. Mỗi ca khẳng định **ba** điều: badge đổi đúng · CTA đổi đúng · **`follower_current` giữ nguyên**, không thành 0, không thành null |
| **AT-23** | `RATE_LIMITED` với `retry_after: 300` → job chuyển `rate_limited` → **không** thử lại trước 300 s → thử lại sau đó → thành công → badge trở lại bình thường. **+ BR-08:** token bị thu hồi → `reauth_required` → **lịch sử metrics không bị xoá** → kết nối lại → lịch sử liền mạch |
| **AT-24** | *(v1.1)* Đăng nhập, đóng app, mở lại → session khôi phục, không phải đăng nhập lại |
| **AT-25** | *(v1.1)* Bấm "Đăng xuất khỏi mọi thiết bị khác" → máy kia mất session, **máy đang bấm vẫn đăng nhập** |

### 14.3 AT-21 — CSV import, 7 ca

| Ca | Đầu vào | Mong đợi |
|---|---|---|
| 1 | 200 dòng hợp lệ | 200 tài khoản; báo cáo `200/0/0`; số đếm trên stat card khớp |
| 2 | **BOM UTF-8** + tên tiếng Việt có dấu | Dấu đúng, không thành `NguyÃªn` |
| 3 | Mật khẩu chứa dấu phẩy và dấu ngoặc kép | Giữ nguyên ký tự, **không trim**, giải mã lại đúng |
| 4 | 5 dòng trùng theo BR-02 | Cảnh báo ở preview; người dùng chọn bỏ qua hay tạo mới; **không im lặng ghi đè** |
| 5 | Dòng thiếu `display_name` | Dòng đó bị từ chối, **các dòng khác vẫn vào**; file lỗi tải về được có số dòng + lý do |
| 6 | 200 dòng, **đóng app ở dòng ~100** | Mở lại: hoặc 0 dòng, hoặc 100 dòng đầy đủ. **Không có bản ghi nửa vời, không có secret chưa mã hoá** |
| 7 | Import khi **vault đang khoá** | Bị chặn ngay từ đầu với thông báo rõ; **không đọc file** |

### 14.4 Release blocker

| # | Blocker | Kiểm chứng bằng |
|---|---|---|
| 1 | Plaintext secret trong DB, log hoặc crash report | AT-02 + grep chuỗi mồi trên dump DB và toàn bộ log |
| 2 | RLS cho phép đọc/sửa row của người khác | Test RLS âm tính + **test IDOR qua Edge Function** |
| 3 | Mất dữ liệu khi hai máy sync hoặc khi migration chạy | AT-03, AT-14, migration trên bản sao dữ liệu thật |
| 4 | Open account mở được scheme nguy hiểm | AT-08 |
| 5 | Follower hiển thị 0 sai khi API lỗi | AT-22, mọi mã lỗi |
| 6 | Installer bị Defender cảnh báo do packaging bất thường | Cài trên VM Windows sạch |
| **7** | **AT-12 (diễn tập khôi phục) chưa pass** | AT-12 trên VM sạch |
| **8** | **Vault không khoá khi khoá màn hình Windows** | AT-13 |
| **9** | **App không mở được sau khi cài offline trên Windows 10 sạch** | §15.1 |
| **10** | **Bất kỳ FR nào ở P0 không có AT tương ứng đang pass** | Bảng ánh xạ FR↔AT §4 |

---

## 15. Phát hành và vận hành

### 15.1 Đóng gói Windows

- **NSIS**, `perMachine: false` — cài theo user, **không cần quyền admin**. Một app cá nhân không nên đòi UAC.
- **`webviewInstallMode: embedBootstrapper`** (+~1,5 MB). WebView2 có sẵn trên Windows 11 nhưng **nhiều bản Windows 10 thì không**, và mặc định `downloadBootstrapper` sẽ tải mạng lúc cài → máy không mạng thì cài xong app không mở được, không có thông báo hữu ích. → Release blocker #9.
- App icon multi-resolution đúng chuẩn (§8.8).
- Semantic Versioning; migration chạy có kiểm soát.
- Build qua GitHub Actions Windows runner; lưu checksum và release notes.
- Code signing **nên có** trước khi phân phối rộng; bản cá nhân có thể bắt đầu unsigned nhưng sẽ gặp cảnh báo SmartScreen.

### 15.2 Auto-updater *(QĐ-19 — cửa một chiều)*

Tauri updater xác thực bản cập nhật bằng **cặp khoá ký riêng**, và public key phải nằm trong `tauri.conf.json` **của bản đã phát hành**. Nếu v1.0 ship không có public key thì v1.1 **không thể tự cập nhật cho máy đang chạy v1.0** — người dùng buộc phải gỡ và cài lại tay. Với một app quản lý mật khẩu, "gỡ rồi cài lại" là thao tác người dùng sẽ do dự vì sợ mất dữ liệu.

1. **Sprint 0:** `tauri signer generate` → private key vào GitHub Actions secret → public key vào `plugins.updater.pubkey`.
2. **v1.0:** `updater.active = false`. Không endpoint, không kiểm tra cập nhật, không thêm bề mặt tấn công. Chỉ **khoá đã có sẵn trong bản build**.
3. **v1.1:** bật `active = true` + endpoint.

> **Mất private key của updater = không bao giờ đẩy được bản cập nhật cho các máy đã cài.** Sao lưu ngoài repo và ngoài máy phát triển.

### 15.3 Môi trường và chi phí

**Local:** Supabase local stack, test account, debug build. **Staging:** Meta test app/user, database riêng, telemetry tối thiểu. **Production:** project riêng, secrets riêng, backup, code signing khi có điều kiện.

| Hạng mục | MVP cá nhân | Ghi chú |
|---|---|---|
| Tauri/React | Miễn phí | Open source |
| Supabase | Bắt đầu Free | Theo dõi quota database/storage/Edge/Cron |
| Meta API | Không tính phí trực tiếp | Tốn thời gian setup và tuân thủ policy |
| Domain + privacy page | Thấp | Cần cho OAuth redirect URI ổn định |
| Windows code signing | Có chi phí | Không bắt buộc cho prototype |
| Monitoring | Free tier | **Không gửi secrets/PII vào error tracking** |

### 15.4 Backup và khôi phục

- Bật backup theo plan Supabase; kiểm tra phục hồi bằng môi trường staging.
- Metadata/ciphertext backup được; **muốn giải mã vẫn cần master hoặc recovery key**.
- Encrypted export định kỳ → post-v1. **Không mặc định export plaintext password.**
- Backup dùng **passphrase độc lập qua Argon2id**, **không dùng khoá OS** *(QĐ-07)* — khoá DPAPI không di chuyển sang máy khác, nên backup sẽ thất bại đúng ở kịch bản nó sinh ra để chống.
- **AT-12 chạy lại trước mỗi bản phát hành** có thay đổi chạm tới crypto hoặc schema, không chỉ một lần ở v1.0.

---

## 16. Rủi ro

| Rủi ro | Tác động | Giảm thiểu |
|---|---|---|
| Meta API đổi / quyền bị từ chối | Follower tự động trễ hoặc không dùng được | **Spike Sprint 0 (QĐ-20)** · Manual là mặc định · adapter theo provider · revalidate trước mỗi sprint |
| **Chi phí thiết lập Meta × N tài khoản** | Tính năng đắt nhất chỉ dùng được cho một nhóm nhỏ | Nói ra ngay ở §3 · thu hẹp tiêu chí thành công v1.2 xuống "≥1 Page + ≥1 IG Pro thật" |
| Mất master/recovery key | **Không giải mã được secrets, vĩnh viễn** | FR-18 bắt buộc xác nhận đã lưu · **AT-12 là release blocker** · cảnh báo rõ trong onboarding |
| Conflict nhiều máy | Ghi đè dữ liệu | Column-level grant *(QĐ-03)* · conflict dialog cho secrets · audit event |
| DB/RLS cấu hình sai | Rò dữ liệu | Migration review · negative test · **test IDOR Edge Function** · least privilege |
| Token provider bị lộ | Truy cập dữ liệu social | Bảng riêng không policy *(QĐ-17)* · header Bearer · bộ lọc redact log |
| Scope phình to | Không ship được | Ba ranh giới phát hành *(QĐ-01)* · P2 bị bỏ khỏi quy ước · Sync Center bị cắt |
| Mascot quá nhiều | Mất tính chuyên nghiệp | Tối đa **1 Tully/màn hình** · không có Tully trong Sheet và form |
| **Asset chưa production-ready** | Logo vỡ, nền magenta, icon 16 px không đọc được | §8.8 — hạng mục riêng 1–2 ngày, xong trước RELEASE GATE v1.0 |

---

## 17. Bàn giao cho AI coding agent

> **PROMPT KHỞI ĐỘNG**
> Đọc toàn bộ `docs/SOURCE-OF-TRUTH.md` trước khi code. Đây là Source of Truth.
> Chỉ triển khai sprint được giao. Không tự thêm auto-login, scraping, hay team features.
> Mọi thay đổi schema phải có migration + RLS + test. Mọi thay đổi chạm secret/OAuth/opener phải có security review.

### 17.1 Context phải cung cấp cùng task

- [ ] Sprint/milestone hiện tại và issue cụ thể
- [ ] Cấu trúc repo hiện tại, phiên bản package, migration gần nhất
- [ ] **Asset production thật** (SVG), không phải brand board
- [ ] Environment sample **không chứa secret thật**
- [ ] Acceptance criteria + mã AT + lệnh test + định nghĩa "done"

### 17.2 Guardrails

- [ ] Không đổi stack hoặc schema chỉ vì tiện code
- [ ] Không dùng mock follower ở production path mà không gắn nhãn
- [ ] Không trả service-role key hoặc app secret về desktop
- [ ] Không log request body chứa secret/token
- [ ] Không thay logo/Tully bằng emoji hoặc asset khác phong cách
- [ ] **Không hardcode màu** — thiếu giá trị thì thêm vào `tokens.css` trước, dùng sau
- [ ] **Không tạo `tailwind.config.ts`** — thấy file này trong repo là sai *(QĐ-12)*
- [ ] Không component nào import SQLite/Supabase/Tauri trực tiếp — đi qua `AccountRepository`
- [ ] Không merge khi lint/typecheck/test/security acceptance chưa pass

### 17.3 Task template

```text
TASK:        [Tên issue]
BẢN:         [v1.0 | v1.1 | v1.2]
SPRINT:      [0–5]
SCOPE:       [Một thay đổi có ranh giới rõ]
FILES:       [Khu vực được phép chỉnh]
FR:          [FR-xx]
ACCEPTANCE:  [AT-xx — phải pass]
SECURITY:    [RLS / secrets / OAuth / opener / none]
TEST:        npm run lint && npm run typecheck && npm test
OUT OF SCOPE:[Liệt kê rõ]
DELIVERABLE: code + migration/test + cập nhật docs nếu có quyết định mới
```

---

## 18. Tài liệu tham khảo

Phải đọc lại **tại thời điểm triển khai** — API, permission, quota và quy trình review đổi thường xuyên:

[Meta Graph API Overview](https://developers.facebook.com/docs/graph-api/overview/) · [Page Reference](https://developers.facebook.com/docs/graph-api/reference/page/) · [Instagram Platform](https://developers.facebook.com/docs/instagram-platform/) · [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) · [Secure Data](https://supabase.com/docs/guides/database/secure-data) · [Edge Function Secrets](https://supabase.com/docs/guides/functions/secrets) · [Cron](https://supabase.com/docs/guides/cron) · [Vault](https://supabase.com/docs/guides/database/vault) · [Tauri: Calling Rust](https://v2.tauri.app/develop/calling-rust/) · [Tauri: Windows Signing](https://v2.tauri.app/distribute/sign/windows/) · [Tauri: Updater](https://v2.tauri.app/plugin/updater/)

> **Chốt phiên bản Graph API và danh sách permission trong ADR-003 ngay ở Sprint 0** *(QĐ-20)*. Không hard-code giả định từ tài liệu này nếu official docs đã đổi.

---

## 19. Bắt đầu từ đâu

**Trạng thái:** repo mới, **chỉ có tài liệu, chưa có code**. Bắt đầu từ Sprint 0.

**Việc tiếp theo, theo thứ tự:**

1. **Cài Rust** — cổng chặn của QĐ-11, và Sprint 2 là SQLite + crypto trong Rust
2. **Scaffold** Tauri 2 + React 19 + TS + Vite 7 + Tailwind v4. Nhớ `css: { postcss: {} }` trong `vite.config.ts` *(§13.3)* và CSP trong `tauri.conf.json` ngay từ đầu
3. Sinh **khoá updater** *(QĐ-19)* và nhúng public key — **cửa một chiều**, 30 phút bây giờ so với cài lại tay mọi máy sau này
4. **Spike Meta 1 ngày** *(QĐ-20)* → `docs/adr/ADR-003-meta-feasibility.md`. Thất bại → cắt v1.2 ngay ở tuần 1
5. Lên lịch **vẽ lại asset SVG** (§8.8) như một hạng mục riêng 1–2 ngày, chạy song song
6. **Sprint 1** — `tokens.css` + font + component + AccountCard theo §6.2
7. **Sprint 2** — SQLite + vault + recovery key + CSV import

**Thứ tự này giữ nguyên tinh thần của cả hai tài liệu gốc:** xây UI, CRUD và vault trước; cloud sync sau; Meta cuối cùng. Nhờ vậy app vẫn có giá trị ngay cả khi Meta App Review chậm hoặc một số loại tài khoản không hỗ trợ follower tự động.

---

**All your accounts, in one shell.**
*Turtly • Tully • Your shell. Your world.*
