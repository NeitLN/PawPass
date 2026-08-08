# DECISIONS — QUYẾT ĐỊNH RÀNG BUỘC

**Trạng thái:** đang hiệu lực · **Cập nhật:** 09/08/2026 *(thêm QĐ-15…QĐ-20 sau review 6 vai)*

> Đây là **nhật ký quyết định, có lý do**. `SOURCE-OF-TRUTH.md` là tài liệu triển khai hợp nhất và đứng trên file này.
> `UI.md` quyết định **bố cục**. `BRAND.md` quyết định **nhận diện**. `tokens.css` giữ **giá trị thật**.
> Khi mâu thuẫn, thứ tự thắng: `SOURCE-OF-TRUTH.md` → `DECISIONS.md` → `BRAND.md` (màu/font/mascot) → `UI.md` (bố cục/component).
>
> **`SPEC.md` và `ROADMAP.md` đã bị bỏ khỏi repo ngày 09/08/2026** khi làm lại từ đầu — toàn bộ nội dung còn hiệu lực của chúng đã được hợp nhất vào `SOURCE-OF-TRUTH.md`. Cột **"Ghi đè"** và các tham chiếu kiểu *"ghi đè SPEC §11.1"* bên dưới là **ghi chép lịch sử**, giữ lại để biết mỗi quyết định sinh ra để sửa điều gì. Không cần đi tìm hai file đó.
>
> **Mỗi lần đổi ý → sửa tài liệu trước, code sau.**

---

## MỤC LỤC

| # | Quyết định | Ghi đè |
|---|---|---|
| [QĐ-01](#qđ-01--cắt-v1-thành-3-bản-phát-hành-độc-lập) | Cắt v1 thành 3 bản phát hành độc lập | — |
| [QĐ-02](#qđ-02--trường-notes-ở-local-vĩnh-viễn-không-lên-cloud) | `notes` chỉ nằm local, ciphertext | SPEC §11.1 |
| [QĐ-03](#qđ-03--bỏ-lww-conflict-resolution-thay-bằng-column-level-grant) | Bỏ LWW, dùng column-level grant | SPEC §10.30 |
| [QĐ-04](#qđ-04--card-có-1-hành-động-chính-chi-tiết-mở-dạng-sheet) | Card 1 hành động chính, chi tiết = Sheet | SPEC §5.3, §7 |
| [QĐ-05](#qđ-05--meta-chạy-ở-development-mode-cho-v12) | Meta ở Development mode | — |
| [QĐ-06](#qđ-06--bỏ-tùy-chọn-đồng-bộ-15-phút) | Đồng bộ tối thiểu 30 phút | SPEC §9.7 |
| [QĐ-07](#qđ-07--backup-dùng-passphrase-độc-lập-không-dùng-khóa-os) | Backup dùng passphrase + Argon2id | SPEC §14.1 |
| [QĐ-08](#qđ-08--csv-import-vào-mvp-không-để-post-v1) | CSV Import vào MVP | SPEC §26 |
| [QĐ-09](#qđ-09--turtly-thắng-màu-và-font-uimd-thắng-bố-cục) | Hoà giải Turtly ↔ Mai | UI.md §1, §2.2, §3 |
| [QĐ-10](#qđ-10--dưới-100-tài-khoản--không-virtualization) | <100 tài khoản → bỏ virtualization | — |
| [QĐ-11](#qđ-11--sprint-1-chạy-trên-vite-thuần-chưa-cần-rust) | Sprint 1 chạy trên Vite thuần | ROADMAP S0/A8 |
| [QĐ-12](#qđ-12--tailwind-v4-token-nằm-trong-css-không-có-tailwindconfigts) | Tailwind v4, không có `tailwind.config.ts` | UI.md §2.2, ROADMAP S1/1.1 |
| [QĐ-13](#qđ-13--thẻ-tài-khoản-dùng-stretched-link-cả-thẻ-bấm-được-1-tab-stop) | Thẻ dùng stretched link | UI.md §6.6 (một câu) |
| [QĐ-14](#qđ-14--mỗi-màu-trạng-thái-có-biến-thể-text-đậm-hơn) | Màu trạng thái có biến thể `-text` | BRAND.md §5.3 |
| [QĐ-15](#qđ-15--một-cơ-chế-đồng-bộ-duy-nhất-cron-server-6-giờ) | Một cơ chế sync: Cron 6 giờ | QĐ-06 |
| [QĐ-16](#qđ-16--bỏ-stronghold-dùng-rust-crypto-trực-tiếp) | Bỏ Stronghold, Rust crypto trực tiếp | Master Roadmap §10.1 |
| [QĐ-17](#qđ-17--token-meta-ở-bảng-riêng-không-có-policy-rls-không-giấu-được-cột) | Token Meta ở bảng riêng, không policy | Master Roadmap §12.3 |
| [QĐ-18](#qđ-18--recovery-key-là-kek-thứ-hai-độc-lập) | Recovery key = KEK thứ hai | — |
| [QĐ-19](#qđ-19--sinh-khoá-updater-ở-sprint-0-dù-chưa-bật-updater) | Sinh khoá updater ở Sprint 0 | Master Roadmap §17.2 |
| [QĐ-20](#qđ-20--spike-meta-1-ngày-ở-sprint-0-trước-mọi-code-tích-hợp) | Spike Meta 1 ngày ở Sprint 0 | Master Roadmap §3 |

---

# PHẦN A — 8 QUYẾT ĐỊNH GỐC

*Nguyên văn từ `ROADMAP.md` Phần 0. Không sửa nội dung, chỉ chép sang đây để thành một nơi tra cứu duy nhất.*

## QĐ-01 · Cắt v1 thành 3 bản phát hành độc lập

**PM đề xuất · Architect phản biện · Đã giải quyết**

v1.0 là local-only **nhưng schema và tầng repository được thiết kế cloud-ready ngay từ ngày đầu** — dùng UUID thay vì autoincrement, có sẵn `updated_at` / `deleted_at` / `server_updated_at`, và tất cả UI chỉ nói chuyện qua interface `AccountRepository`. Lên v1.1 chỉ thay implementation, không sửa UI.

- **Chi phí phát sinh:** ~1 ngày công
- **Đổi lại:** có sản phẩm dùng được sau ~2 tuần thay vì ~6 tuần; Meta App Review không còn nằm trên đường tới hạn phát hành

**Hệ quả ràng buộc code:**
- Không component React nào được `import` SQLite hay Supabase client. Tất cả đi qua `AccountRepository`.
- ID sinh bằng `crypto.randomUUID()`, không bao giờ dùng số tăng dần.
- Mọi bảng có `updated_at`, `deleted_at`, `server_updated_at` **từ Sprint 2**, kể cả khi v1.0 chưa dùng tới `server_updated_at`.

## QĐ-02 · Trường `notes` ở local vĩnh viễn, không lên cloud

**Security thắng.** *(ghi đè SPEC §11.1)*

Spec §6.4 gợi ý người dùng ghi vào notes *"số điện thoại khôi phục, tình trạng 2FA"*, trong khi §11.1 để `notes` là cột TEXT thường trên Supabase. Tài liệu bỏ rất nhiều công để password không rời khỏi máy, rồi lại mời đẩy SĐT khôi phục lên cloud plaintext — với hầu hết kịch bản chiếm tài khoản, SĐT khôi phục có giá trị ngang hoặc hơn password.

**Hệ quả:** `notes` biến mất khỏi bảng `accounts` trên Supabase, chuyển vào `local_account_secrets` dưới dạng ciphertext.

## QĐ-03 · Bỏ LWW conflict resolution, thay bằng column-level grant

**Architect + Security thống nhất.** *(ghi đè SPEC §10.30)*

Spec §10.30 giải quyết conflict bằng "bản ghi có `updated_at` mới hơn thắng". Điều này gây mất dữ liệu thật:

1. `09:00` — offline, người dùng sửa `notes`, op vào queue kèm snapshot cả hàng
2. `09:15` — cron chạy trên server, ghi `current_followers = 15300`
3. `09:30` — có mạng, client flush queue, gửi **cả hàng** → **đè `current_followers` về 15200**

**Không giải quyết conflict — làm cho conflict không thể xảy ra.** Client và Edge Function ghi hai tập cột rời nhau, Postgres cưỡng chế bằng column-level privilege.

## QĐ-04 · Card có 1 hành động chính, chi tiết mở dạng Sheet

**UI/UX thắng.** *(ghi đè SPEC §5.3, §7)*

- Card hiện tại chứa 10 đơn vị thông tin trong 270–300px → không quét được
- Hai nút ngang trọng số, trong đó `Đồng bộ` chỉ hợp lệ với tài khoản đã kết nối → disabled vĩnh viễn trên đa số card
- Chi tiết dạng route riêng làm mất scroll position và bộ lọc mỗi lần quay lại

**Chốt:** bỏ email khỏi card, giảm ảnh, chỉ 1 nút chính (`Mở tài khoản`), `Đồng bộ` xuống menu `⋯`. Chi tiết render dạng Sheet trượt từ phải, giữ nguyên grid phía sau (URL vẫn `/accounts/:id` để deep-link được).

## QĐ-05 · Meta chạy ở Development mode cho v1.2

**Meta Specialist + PM.**

Spec không nhắc một chữ nào về **App Review** và **Business Verification**, nhưng đó là rào cản lớn nhất của tính năng follower sync. Ở Live mode cần review + pháp nhân doanh nghiệp, và use case "công cụ cá nhân thay Excel" thường bị từ chối.

**Chốt:** xây cho Development mode. Giới hạn: mỗi tài khoản Facebook phải được thêm làm **Tester** trong App Dashboard và **tự đăng nhập chấp nhận lời mời**. Ghi rõ giới hạn này trong UI và tài liệu người dùng.

## QĐ-06 · Bỏ tùy chọn đồng bộ 15 phút

*(ghi đè SPEC §9.7)*

Mặc định **60 phút**, cho phép hạ xuống 30 phút. Follower không thay đổi đủ nhanh để cần hơn, và 15 phút nhân 4 lần rủi ro chạm rate limit của Meta.

## QĐ-07 · Backup dùng passphrase độc lập, không dùng khóa OS

**Security.** *(ghi đè SPEC §14.1)*

Nếu dùng khóa keyring: khóa DPAPI không di chuyển được sang máy khác → máy hỏng, cài lại Windows, có file backup trong tay nhưng **không giải mã được**. Backup thất bại đúng ở kịch bản nó sinh ra để chống.

**Chốt:** backup mã hóa bằng passphrase người dùng nhập, qua Argon2id.

## QĐ-08 · CSV Import vào MVP, không để post-v1

**PM.** *(ghi đè SPEC §26)*

Toàn bộ mệnh đề giá trị là "thay thế file Excel", người dùng **đang có** file Excel với N dòng. Không có import → trải nghiệm đầu tiên là gõ tay lại 50–200 tài khoản qua form 15 trường → đa số bỏ cuộc và quay lại Excel.

---

# PHẦN B — QUYẾT ĐỊNH PHÁT SINH

## QĐ-09 · Turtly thắng màu và font, `UI.md` thắng bố cục

**Chốt ngày 07/08/2026 · người dùng quyết** *(ghi đè UI.md §1, §2.2, §3)*

### Vấn đề

`UI.md` (06/08 23:32) đặt tên sản phẩm là **Mai**, dùng jade + **brass** + Bricolage Grotesque / Be Vietnam Pro.
`BRAND.md` (07/08 00:15) đặt tên là **Turtly**, mascot **Tully**, dùng Deep Teal + Green Teal + Nunito Sans / Inter, và **không có brass**.

Hai file mô tả cùng một sản phẩm nhưng khác tên, khác toàn bộ bảng màu và cả ba font. `BRAND.md` mới hơn và tự tuyên bố canonical ("do not silently revert to older draft values"), nhưng `UI.md` chứa các luật hệ thống mà `BRAND.md` không có: token spacing 4px, đúng 2 mức shadow, luật "một màn hình một nút chính", spec card đã chốt ở Sprint 1, và lý do chọn font là **dấu tiếng Việt**.

### Chốt

| Hạng mục | Nguồn thắng | Giá trị |
|---|---|---|
| Tên sản phẩm, mascot, tagline | `BRAND.md` | Turtly · Tully · *All your accounts, in one shell.* |
| Bảng màu | `BRAND.md` §5 | Deep Teal `#0E3D3B`, Green Teal `#1E6F6A`, Mint `#A7E1D2`, Soft Lime `#CDEB7A`, Dark Forest `#0B2E28` |
| Màu trạng thái | `BRAND.md` §5.3 | success `#2E9B64` · warning `#E3A32B` · error `#D95C59` · info `#3B82C4` · inactive `#8A9691` |
| Font tiêu đề / UI | `BRAND.md` §6 | Nunito Sans / Inter |
| Font số liệu | `UI.md` §3 | **JetBrains Mono** — `BRAND.md` không nói tới, không có mâu thuẫn |
| Thang chữ | `BRAND.md` §6.3 | Display 32 / H1 28 / H2 22 / H3 18 / Body 14 / Small 13 / Label 12 / Caption 11 |
| Bố cục, spacing, radius, shadow | `UI.md` §2, §5, §6 | thang 4px · `--r-ctrl/card/tile/pill` · đúng 2 mức shadow |
| Spec card, empty/loading/error, checklist | `UI.md` §6.6, §8, §12 | giữ nguyên |
| Luật cho agent | `UI.md` §0 | giữ nguyên cả 7 điều |

### Ba hệ quả cần xử lý rõ, vì hai file không nói tới

**1. `brass` bị bỏ — thay bằng gì?**

`UI.md` dùng `brass #C9902F` cho *nút chính* và *vòng focus*, và cưỡng chế "một màn hình chỉ một nút brass". Turtly không có màu vàng đồng nào. Nếu ánh xạ thẳng brass → Green Teal thì nút chính trùng màu với nav-đang-chọn và link, làm mất trật tự thị giác mà luật đó sinh ra để bảo vệ.

**Chốt ánh xạ hai tầng, chỉ dùng màu canonical của Turtly:**

| Vai trò cũ (`UI.md`) | Màu mới | Căn cứ |
|---|---|---|
| Nút chính (`brass`) | **Green Teal `#1E6F6A`** | `BRAND.md` §5.4 nói rõ Green Teal dùng cho *Buttons* |
| Nav đang chọn, link, đường biểu đồ (`jade`) | **Deep Teal `#0E3D3B`** | `BRAND.md` §5.4: *selected states where appropriate* |
| Vòng focus | **Deep Teal `#0E3D3B`**, `outline-offset: 2px` | Green Teal đặt trên nút Green Teal sẽ vô hình |
| Điểm nhấn nhỏ, chấm chỉ báo | **Soft Lime `#CDEB7A`** | `BRAND.md` §5.4: *tiny active indicator*, dùng tiết chế |

**Luật "một màn hình một nút chính" (QĐ-04) vẫn giữ nguyên hiệu lực** — chỉ đổi màu, không đổi luật.

**2. Line-height cho dấu tiếng Việt**

`BRAND.md` là tài liệu tiếng Anh và không nói gì về dấu. `UI.md` §3 có luật: **không đặt line-height dưới 1.45 cho bất kỳ chữ nào ≤ 15px**, vì tiếng Việt có dấu chồng hai tầng (ề, ẫ, ợ) sẽ chạm dòng trên trong bảng dày.

Thang chữ Turtly có Body 14 / Small 13 / Label 12 / Caption 11 — **tất cả đều ≤ 15px**. Luật này **giữ nguyên và áp cho toàn bộ thang chữ Turtly**. Không có mâu thuẫn, chỉ là `BRAND.md` không lường tới.

**3. Font phải có bộ dấu tiếng Việt và phải nhúng cục bộ**

Nunito Sans và Inter đều có subset `vietnamese` trên Google Fonts. **Tải `.woff2` (subset `latin` + `vietnamese`) vào `src/assets/fonts/` và khai báo `@font-face` cục bộ.** Không gọi Google Fonts lúc chạy — app phải chạy offline hoàn toàn ở v1.0 và CSP trong `tauri.conf.json` sẽ chặn. Luật này của `UI.md` §2.4, giữ nguyên.

### Còn treo

`BRAND.md` §9–12 định nghĩa mascot Tully và 8 pose T01–T08 (NEUTRAL, WAVE, SEARCH, SECURITY, SYNC, OFFLINE, SUCCESS, IMPORT) nhưng **file SVG chưa tồn tại**. Sprint 1 cần pose cho màn hình trống. Cho tới khi có asset thật: dùng placeholder hình học từ `--color-mint`, **không tự sinh mascot khác** (`BRAND.md` §0 điều 2). Ghi lại ở đây để không quên.

## QĐ-10 · Dưới 100 tài khoản → không virtualization

**Chốt ngày 07/08/2026 · trả lời Q1 của ROADMAP §2.1**

Số tài khoản thật hiện dưới 100. `AccountGrid` render thẳng toàn bộ, không dùng `@tanstack/react-virtual`.

Vẫn giữ: `React.memo` trên `AccountCard`, debounce search 200ms (ROADMAP S1/1.9).

**Xem lại khi nào:** Sprint 3, sau khi CSV Import cho con số thật. Nếu vượt 300 → thêm virtualization, và đó là lúc `AccountGrid` phải viết lại.

## QĐ-11 · Sprint 1 chạy trên Vite thuần, chưa cần Rust

**Chốt ngày 07/08/2026** *(ghi đè ROADMAP Sprint 0 việc A8)*

Rust chưa được cài trên máy. Sprint 1 là UI với dữ liệu giả, không gọi một lệnh Tauri nào — chạy đủ bằng `npm run dev` trong trình duyệt.

- Scaffold `src-tauri/` dựng ở Sprint 0 (Tauri 2.x + `capabilities/default.json` theo `SOURCE-OF-TRUTH.md` §9.5), kể cả khi Sprint 1 chưa gọi tới.
- CSP trong `tauri.conf.json` cấu hình **ngay ở Sprint 0**, không đợi v1.1 — quên là mọi request Supabase fail im lặng.
- DoD Sprint 0: `npm run dev` mở được app trong trình duyệt.
- **Cổng chặn:** phải cài Rust xong **trước khi bắt đầu Sprint 2**, vì Sprint 2 là SQLite + crypto trong Rust.

**Cập nhật 09/08/2026 (làm lại từ đầu):** repo mới chưa có scaffold nào. Việc cài Rust và dựng scaffold **đều nằm ở Sprint 0** — xem `SOURCE-OF-TRUTH.md` §19.

## QĐ-12 · Tailwind v4 — token nằm trong CSS, không có `tailwind.config.ts`

**Chốt ngày 07/08/2026** *(ghi đè UI.md §2.2, ROADMAP S1 việc 1.1)*

`UI.md` §2.2 và ROADMAP S1/1.1 đều giả định `tailwind.config.ts` theo kiểu Tailwind v3. Tailwind v4 bỏ file config JS — token khai báo bằng `@theme` ngay trong CSS, và plugin dùng `@tailwindcss/vite` thay cho PostCSS.

Điều này **hợp với `UI.md` §2 hơn bản gốc**: file đó đã tuyên bố *"Nguồn duy nhất: `src/styles/tokens.css`. Tailwind đọc lại từ đây."* — v4 làm đúng như vậy, không còn hai nơi khai báo màu phải giữ đồng bộ bằng tay.

- Token: `src/styles/tokens.css`, khối `@theme`.
- **Không tạo `tailwind.config.ts`.** Thấy file này trong repo là sai.
- Luật `UI.md` §0 điều 1 (không hardcode màu) không đổi.

## QĐ-13 · Thẻ tài khoản dùng stretched link — cả thẻ bấm được, 1 tab-stop

**Chốt ngày 07/08/2026** *(giải mâu thuẫn ROADMAP Sprint 1 ↔ UI.md §6.6)*

### Vấn đề

Hai tài liệu nói ngược nhau về việc thẻ có bấm được không:

| Nguồn | Nội dung |
|---|---|
| `ROADMAP.md` Sprint 1, "Kỹ thuật bắt buộc" | *"Toàn card click được · 1 tab-stop duy nhất"* — kèm mẫu code stretched link `after:absolute after:inset-0` |
| `UI.md` §6.6 | *"Cả thẻ **không** click được. […] Chỉ nút và menu là điểm bấm"* |

Cả hai đều viện dẫn cùng một lỗi (#34 — nested interactive controls làm hỏng bàn phím và screen reader). Chúng đồng ý về **vấn đề**, khác nhau về **cách sửa**.

### Chốt: dùng stretched link

`UI.md` §6.6 ngay sau câu cấm lại tự mở đường: *"mở chi tiết bằng nút **hoặc** bằng phím `Enter` khi thẻ được focus như một `role="link"` duy nhất — chọn một, không làm cả hai."*

Vế thứ hai đó **chính là** stretched link. `ROADMAP.md` chỉ nói rõ cách hiện thực nó. Vậy hai file không thật sự bất đồng về mục tiêu — chọn vế 2, và lấy đoạn code của roadmap làm chuẩn.

```tsx
<article className="relative …">
  <h3>
    <a href={`/accounts/${id}`} className="stretched-link">
      {accountName}
    </a>
  </h3>
  {/* … nội dung không tương tác … */}
  <button className="relative z-10" onClick={openBrowser}>Mở tài khoản</button>
  <DropdownMenu triggerClassName="relative z-10" />
</article>
```

Thoả **cả ba** yêu cầu mà hai file cùng đòi:

- Không có phần tử tương tác nào lồng trong phần tử tương tác khác — `::after` là pseudo-element, không phải node
- Đúng **một** tab-stop cho vùng thân thẻ; `Enter` mở Sheet chi tiết
- Không cần `stopPropagation` ở bất kỳ đâu — nút và menu nổi lên bằng `z-10`, sự kiện không bao giờ chạm tới link

**Phân vai hai hành động** — đây là chỗ dễ nhầm nhất:

| Điểm bấm | Hành động | Đích |
|---|---|---|
| Thân thẻ (stretched link) | Xem chi tiết | Sheet trượt từ phải, URL `/accounts/:id` |
| Nút `Mở tài khoản` | Mở trình duyệt vào đúng profile | Lệnh Tauri (Sprint 3) |
| Menu `⋯` | Sửa · Đồng bộ · Sao chép mật khẩu · Xoá | — |

Class `.stretched-link` khai báo một lần ở `src/styles/global.css`, không lặp lại chuỗi Tailwind ở từng component.

### Phần của `UI.md` §6.6 vẫn giữ nguyên

Bố cục thẻ theo `UI.md`, **không** theo sơ đồ trong `ROADMAP.md` (hai sơ đồ khác nhau: avatar 40 px chứ không phải 56 px, có `@handle`, chip trạng thái và số follower nằm cùng một hàng, nút chính chiếm hết chiều ngang). Cùng với đó: bỏ ảnh lớn, bỏ email, bỏ nút `Đồng bộ` khỏi thẻ, huy hiệu nền tảng đơn sắc `--color-text-muted`.

## QĐ-14 · Mỗi màu trạng thái có biến thể `-text` đậm hơn

**Chốt ngày 07/08/2026** *(bổ sung BRAND.md §5.3)*

Bảng màu trạng thái của `BRAND.md` §5.3 không đạt sàn tương phản 4.5:1 của `UI.md` §10 khi dùng làm **chữ** trên nền sáng:

| Màu | Giá trị canonical | Tương phản trên `#FFFFFF` | Đạt 4.5:1? |
|---|---|---|---|
| success | `#2E9B64` | ≈ 3,4:1 | ✗ |
| warning | `#E3A32B` | ≈ 2,0:1 | ✗ |
| error | `#D95C59` | ≈ 3,3:1 | ✗ |
| info | `#3B82C4` | ≈ 3,7:1 | ✗ |
| inactive | `#8A9691` | ≈ 2,8:1 | ✗ |

Chip trạng thái của Turtly luôn là **icon + chữ** (`UI.md` §0 điều 3), nên phần chữ bắt buộc phải đạt ngưỡng. `BRAND.md` §5.3 tự nói màu trạng thái *"must serve usability, not branding"* — làm đậm để đọc được là đúng tinh thần tài liệu, không phải đi ngược nó.

**Chốt:** mỗi trạng thái có ba token.

| Token | Dùng cho | Ngưỡng phải đạt |
|---|---|---|
| `--color-<state>` | icon, viền, lát biểu đồ tròn, chấm | 3:1 với nền kề |
| `--color-<state>-text` | **chữ** trong chip, nhãn, thông báo | 4.5:1 trên `--color-surface` |
| `--color-<state>-bg` | nền chip (canonical ở ~10%) | — |

Giá trị canonical **không bị sửa** — nó vẫn là `--color-<state>` và vẫn là thứ xuất hiện ở icon và biểu đồ, tức là ở nơi người ta nhận ra thương hiệu. Chỉ thêm biến thể cho chữ.

Thêm một trạng thái riêng của Turtly không có trong `BRAND.md`: `--color-local` (Green Teal) — *"Chỉ lưu trong máy"*, kèm icon `lock`. Đây là lời hứa cốt lõi của sản phẩm nên dùng màu thương hiệu chứ không dùng màu trạng thái trung tính.

---

# PHẦN C — SAU REVIEW 6 VAI (08/08/2026)

*Nguồn: `REVIEW-2026-08-08.md` — review `Turtly_Master_Roadmap_Design_Specification.md` v1.0 bởi 6 vai (PM, UI/UX, Architect, Security, Supabase & Meta, QA). Kết quả: 9 Blocker, 16 High, 20 Medium, 1 Low.*

*Master Roadmap được viết **không biết `DECISIONS.md` tồn tại**, nên 11 điểm trong đó là hồi quy về phương án đã bị bác bỏ có lý do; 4 điểm mâu thuẫn với mã nguồn đã commit. Phân xử: `DECISIONS.md` thắng 9/11, Master Roadmap thắng 1/11, chia 1/11. Sáu quyết định dưới đây là phần thật sự mới.*

*Tài liệu hợp nhất: **`SOURCE-OF-TRUTH.md`**, đứng trên file này trong thứ tự ưu tiên.*

## QĐ-15 · Một cơ chế đồng bộ duy nhất: Cron server 6 giờ

**Meta Specialist đề xuất · PO chốt** *(sửa đổi QĐ-06)*

QĐ-06 chốt tần suất đồng bộ mặc định 60 phút, sàn 30 phút. Master Roadmap §13.1 chốt Cron server mỗi 6 giờ. Hai tài liệu nói về **hai cơ chế khác nhau** nhưng dùng chung khái niệm "tần suất đồng bộ", nên sẽ được cài thành hai thứ chồng nhau: một Cron server 6 giờ **và** một bộ đếm client 60 phút cùng gọi sync.

Lý lẽ của §13.1 đúng hơn: follower không đổi đủ nhanh để cần hàng giờ, và **Meta rate limit tính theo app chứ không theo account** — 60 phút × 50 tài khoản = 1.200 lệnh gọi/ngày cho một số thay đổi vài lần một tuần.

**Chốt:**
- **Một** cơ chế: Cron server, mỗi **6 giờ**. Bỏ hẳn polling phía client.
- **Bỏ tuỳ chọn tần suất khỏi Settings.** Thay bằng một dòng chữ: *"Turtly tự cập nhật follower mỗi 6 giờ. Cần số mới ngay? Dùng nút Đồng bộ."*
- Giữ nguyên `Sync now` cooldown 5 phút/account và `Sync all` hàng đợi tuần tự.
- Thêm cron dọn job kẹt mỗi 15 phút: `status='running' and heartbeat_at < now() - interval '5 minutes'` → `failed` + `TIMEOUT`.

## QĐ-16 · Bỏ Stronghold, dùng Rust crypto trực tiếp

**Architect + Security thống nhất** *(ghi đè Master Roadmap §10.1)*

Master Roadmap §10.1 chỉ định Tauri Stronghold, rồi §12.2 lại mô tả đầy đủ một sơ đồ khoá tự dựng (DEK → Argon2id KEK → wrapped_dek → nonce riêng mỗi payload). **Hai cơ chế chồng lên nhau** — Stronghold tự nó đã là một snapshot mã hoá bằng passphrase với Argon2 bên trong.

Quan trọng hơn: sơ đồ §12.2 **bắt buộc phải là cái thật** cho đa thiết bị. Stronghold snapshot là file cục bộ, không đồng bộ được, nên máy B không thể mở secrets bằng Stronghold của máy A. Giữ cả hai nghĩa là có hai kho khoá, hai lần dẫn xuất từ master password, và một lớp thừa.

**Chốt:**
- **Không dùng** `tauri-plugin-stronghold`. Dùng `argon2` · `chacha20poly1305` · `zeroize` · `rand` trực tiếp.
- Thuật toán: **XChaCha20-Poly1305**, không để ngỏ "hoặc AES-GCM". Nonce 192-bit cho phép sinh ngẫu nhiên mà không lo trùng — tránh hẳn lớp lỗi nguy hiểm nhất của AES-GCM khi tự quản nonce.
- Tham số Argon2id **version hoá từ v1.0**: `m = 64 MiB, t = 3, p = 1`, lưu trong `kdf_params` cùng `salt`.
- DEK đã mở sống trong `Zeroizing<[u8; 32]>` ở Rust, **không bao giờ qua IPC sang JS**.
- Ghi vào `ADR-002`.

## QĐ-17 · Token Meta ở bảng riêng không có policy — RLS không giấu được cột

**Security thắng.** *(ghi đè Master Roadmap §12.3)*

Master Roadmap §12.3 ghi *"`platform_connections` raw token không cho client đọc"* và giao việc đó cho RLS. **Cơ chế được chỉ định không làm được việc được giao:** Row Level Security lọc theo **hàng**, không ẩn được **cột**. Không có cách nào viết policy trả về hàng nhưng giấu một cột.

Đây là lỗi cơ chế chứ không phải lỗi cấu hình, nên nó **không bị phát hiện** bởi bất kỳ test RLS kiểu "user A không đọc được hàng của user B" — token bị lộ cho **chính chủ**, tức là kịch bản test luôn pass.

**Chốt:** tách hai bảng.
- `platform_connections` — client đọc được: `status`, `scopes`, `expires_at`, `last_error_code` (**mã** lỗi, không phải thông điệp thô của Meta). Policy `select` theo `owner_id`; **không có** policy insert/update/delete cho client.
- `platform_connection_secrets` — `access_token_ciphertext`, `refresh_token_ciphertext`, `nonce`, `key_version`. **RLS bật + không policy nào** + `revoke all from anon, authenticated`. Chỉ Edge Function với service role chạm tới.
- Khoá mã hoá token nằm trong **Supabase Vault**.
- Nghiệm thu: integration test dùng anon key + JWT của **chính chủ** chạy `select * from platform_connection_secrets` và nhận lỗi permission.

**Kèm theo — khuôn mẫu bắt buộc cho mọi Edge Function.** Service role **đứng trên RLS**. Function phải: lấy user từ JWT của người gọi (không từ body) → xác minh `owner_id = user.id` **trước** khi chạm service client → trả **404** (không phải 403) khi không sở hữu. Mỗi function có ≥1 test IDOR.

## QĐ-18 · Recovery key là KEK thứ hai độc lập

**Security + QA.** *(bổ sung — Master Roadmap không đặc tả)*

Recovery key và rotate master password xuất hiện **duy nhất một lần** trong Master Roadmap, dưới dạng một ô tick trong checklist §12.5. Không có FR, không có acceptance test, không có mô tả cơ chế.

Đây là luồng có hậu quả cao nhất trong sản phẩm: mất master password mà không có recovery hợp lệ = **mất vĩnh viễn mật khẩu của 50–200 tài khoản**, không ai khôi phục được. Một cơ chế chưa đặc tả sẽ được ứng biến lúc code, và ứng biến trong crypto là nơi sinh lỗi nghiêm trọng.

**Chốt:**
- Recovery key = **KEK thứ hai độc lập**. Sinh 32 byte ngẫu nhiên → mã hoá thành Base32 chia nhóm có ký tự kiểm tra → bọc **cùng một DEK**.
- `user_keyrings` có **hai** bản bọc: `wrapped_dek_by_master` và `wrapped_dek_by_recovery`. Mở được bằng một trong hai.
- **Đổi master password** = giải DEK bằng master cũ hoặc recovery → salt mới → KEK mới → bọc lại. **DEK không đổi** nên không phải mã hoá lại `account_secrets`. Recovery key cũ **vẫn hợp lệ** — phải nói rõ cho người dùng, kèm nút "Sinh recovery key mới".
- **FR-18** (P0 v1.0) — sinh khi tạo vault, hiện **đúng một lần**, bắt buộc gõ lại 4 nhóm ngẫu nhiên để xác nhận (không cho bấm "Tôi đã lưu" suông), có nút tải `.txt`.
- **FR-19** (P0 v1.0) — đổi master password.
- **AT-12** — diễn tập khôi phục trên VM Windows sạch, và **đây là release blocker**. Chạy lại trước mỗi bản phát hành có thay đổi chạm crypto hoặc schema.

## QĐ-19 · Sinh khoá updater ở Sprint 0 dù chưa bật updater

**Architect.** *(sửa đổi Master Roadmap §17.2)*

Master Roadmap §17.2 hoãn auto-updater tới sau khi quy trình signing ổn định, MVP cho tải thủ công. Nhưng Tauri updater xác thực bản cập nhật bằng **cặp khoá ký riêng**, và public key phải nằm trong `tauri.conf.json` **của bản đã phát hành**.

**Đây là cửa một chiều.** Nếu v1.0 ship không có public key thì v1.1 không thể tự cập nhật cho máy đang chạy v1.0 — người dùng buộc phải gỡ và cài lại tay. Với một app quản lý mật khẩu, "gỡ rồi cài lại" là thao tác người dùng sẽ do dự vì sợ mất dữ liệu.

Chi phí làm bây giờ: ~30 phút. Chi phí làm sau: mọi máy đã cài phải cài lại thủ công.

**Chốt:**
- **Sprint 0:** `tauri signer generate` → private key vào GitHub Actions secret → public key vào `plugins.updater.pubkey`.
- **v1.0:** `updater.active = false`. Không endpoint, không kiểm tra cập nhật, không thêm bề mặt tấn công. Chỉ khoá đã có sẵn trong bản build.
- **v1.1:** bật `active = true` + endpoint.
- **Mất private key = không bao giờ đẩy được bản cập nhật cho các máy đã cài.** Sao lưu ngoài repo và ngoài máy phát triển.

## QĐ-20 · Spike Meta 1 ngày ở Sprint 0, trước mọi code tích hợp

**Meta Specialist.** *(bổ sung Master Roadmap §3)*

Master Roadmap §3 đánh giá tính khả thi ở tầng **API có hỗ trợ hay không**, và ở tầng đó kết luận đúng: Facebook Page và Instagram Professional đọc được follower count. Nhưng tính khả thi thật của **sản phẩm này** bị quyết định ở tầng khác.

Mô hình dữ liệu đặt `platform_connections.account_id` — **một kết nối OAuth cho mỗi tài khoản**, phản ánh đúng thực tế (50–200 tài khoản Facebook/Instagram *khác nhau*, mỗi cái có mật khẩu riêng — đó là lý do app này tồn tại). Hệ quả chưa được nói ra ở đâu cả:

> Để đồng bộ follower tự động cho N tài khoản, người dùng phải thực hiện **N lần luồng OAuth riêng biệt**, mỗi lần đăng nhập Facebook bằng đúng tài khoản đó. Cộng QĐ-05 (Development mode), mỗi tài khoản còn phải được **thêm làm Tester và tự đăng nhập chấp nhận lời mời**. Ước tính 3–5 phút mỗi tài khoản, và Meta giới hạn số vai trò trên mỗi app.

Thêm một tầng: IG Professional muốn dùng Graph API thường phải liên kết với một Facebook Page do chính tài khoản đang OAuth quản trị. Chuỗi IG Pro → Page → FB user → tester invite → OAuth có 5 mắt xích, mỗi mắt xích là một chỗ tài khoản thật sẽ rớt ra.

**Chốt:**
- **Spike 1 ngày ở Sprint 0**, trước mọi code tích hợp: tạo Meta App → cấu hình redirect URI → mời **1 tài khoản thật** làm tester → tài khoản đó chấp nhận → chạy hết OAuth bằng `curl` → đọc `followers_count` thật. **Không viết code Turtly nào.**
- Kết quả vào `docs/adr/ADR-003-meta-feasibility.md`: request/response thật (đã che token), phiên bản Graph API, permission thật sự cần.
- **Spike thất bại → cắt v1.2 ngay ở tuần 1**, không phải tuần 6.
- `follower_mode` **mặc định `manual`** cho mọi tài khoản mới. `api` là thứ người dùng bật cho từng tài khoản, sau màn hình giải thích 3 điều kiện.
- Tiêu chí thành công v1.2 thu hẹp thành: *"follower tự động đúng cho **ít nhất 1 Facebook Page và 1 Instagram Professional thật**; mọi loại khác hiển thị Manual với nguồn và thời điểm rõ ràng."*
