# MAI — HỆ THIẾT KẾ GIAO DIỆN

**Tài liệu:** Design system & đặc tả dashboard
**Đứng cùng cấp với:** `docs/ROADMAP.md`, `docs/DECISIONS.md`
**Áp dụng từ:** Sprint 1, việc 1.1 (design tokens)
**Phiên bản:** v1 · 06/08/2026
**Vị trí đề nghị trong repo:** `docs/UI.md`

> **Cách dùng file này (đọc trước khi viết dòng CSS đầu tiên):**
> File này quyết định *hình thức*. `DECISIONS.md` quyết định *hành vi*. Khi hai bên mâu thuẫn, `DECISIONS.md` thắng — vì QĐ-01..08 đã trả giá bằng tranh luận, còn màu sắc thì đổi được.
> Không tự thêm màu, không tự thêm font, không tự thêm bo góc ngoài bảng token ở Phần 2. Cần một giá trị chưa có → thêm vào token trước, dùng sau.

---

## MỤC LỤC

- [Phần 0 — Luật cho agent](#phần-0--luật-cho-agent)
- [Phần 1 — Thương hiệu](#phần-1--thương-hiệu)
- [Phần 2 — Token](#phần-2--token)
- [Phần 3 — Chữ](#phần-3--chữ)
- [Phần 4 — Tài sản đồ hoạ](#phần-4--tài-sản-đồ-hoạ)
- [Phần 5 — Nguyên tắc bố cục](#phần-5--nguyên-tắc-bố-cục)
- [Phần 6 — Đặc tả từng khối của dashboard](#phần-6--đặc-tả-từng-khối-của-dashboard)
- [Phần 7 — Bản cũ sai ở đâu: bảng đối chiếu 14 điểm](#phần-7--bản-cũ-sai-ở-đâu-bảng-đối-chiếu-14-điểm)
- [Phần 8 — Trạng thái rỗng, đang tải, lỗi](#phần-8--trạng-thái-rỗng-đang-tải-lỗi)
- [Phần 9 — Chữ trong giao diện](#phần-9--chữ-trong-giao-diện)
- [Phần 10 — Sàn chất lượng bắt buộc](#phần-10--sàn-chất-lượng-bắt-buộc)
- [Phần 11 — Cấm](#phần-11--cấm)
- [Phần 12 — Checklist nghiệm thu](#phần-12--checklist-nghiệm-thu)

---

# PHẦN 0 — LUẬT CHO AGENT

1. **Không hardcode màu.** Mọi màu đi qua biến CSS hoặc class Tailwind sinh từ token. Thấy `#2563EB` hay `bg-blue-600` trong diff là sai.
2. **Không dựng UI cho tính năng chưa tới sprint của nó.** Nav trỏ vào màn hình trống, tab TikTok chưa có provider, checkbox "để sau này nếu cần" — đều là UI chết (lỗi #43 trong Phụ lục A của roadmap). Thà thiếu mục còn hơn có mục bấm vào không ra gì.
3. **Mọi trạng thái = icon + chữ.** Không có ngoại lệ. Phân biệt bằng riêng màu là lỗi accessibility đã ghi nhận (lỗi #40).
4. **Số liệu dùng font mono, `tabular-nums`.** Follower, chênh lệch, ID, đường dẫn.
5. **Nhãn tiếng Việt thống nhất.** Không `ACTIVE`, không `CONNECTED`, không `Synced` (lỗi #33).
6. **Mỗi thẻ một nút chính.** QĐ-04. Nút thứ hai đi vào menu `⋯`.
7. Component nói chuyện với dữ liệu qua `AccountRepository`, không gọi SQLite/Supabase trực tiếp. Luật này của `DECISIONS.md`, nhắc lại vì nó bị vi phạm nhiều nhất ở tầng UI.

---

# PHẦN 1 — THƯƠNG HIỆU

**Tên sản phẩm:** Mai
**Một câu:** Giữ 128 tài khoản trong máy bạn, thay cho file Excel.

Ba ý chi phối mọi quyết định hình thức:

| Ý | Nghĩa | Xuất hiện ở đâu |
|---|---|---|
| **Mai là cái vỏ** | Con rùa mang nhà theo mình — dữ liệu nằm trong máy, không nằm trên server ai khác | Linh vật, giọng văn màn hình trống |
| **Ổ khoá cũng là một dòng danh sách** | Logo là hình tròn trên hai vạch: đọc là lỗ khoá, mà cũng là avatar trên hai dòng chữ | Logo, favicon, icon app |
| **Vảy mai = thẻ tài khoản** | Lục giác lặp lại thành hoạ tiết nền và khối trang trí duy nhất được phép | Icon app, nền hero, màn hình trống |

**Tông giọng:** điềm đạm, nói thẳng, không xin lỗi. Sản phẩm giữ mật khẩu của người ta — nó không được phép nói năng như một con chatbot vui tính.

---

# PHẦN 2 — TOKEN

Nguồn duy nhất: `src/styles/tokens.css`. Tailwind đọc lại từ đây.

## 2.1 · CSS variables

```css
/* src/styles/tokens.css */
:root {
  /* thương hiệu */
  --color-ink:      #0B2E2A;
  --color-jade:     #1E6B58;   /* màu thương hiệu */
  --color-jade-d:   #12503F;
  --color-jade-l:   #2F8B72;
  --color-brass:    #C9902F;   /* CHỈ dùng cho hành động chính */
  --color-paper:    #EEF2EF;
  --color-stone:    #6B7C77;

  /* bề mặt — sáng */
  --bg:         #F7F9F7;
  --bg-card:    #FFFFFF;
  --line:       #D6DFDA;
  --text:       #0B2E2A;
  --text-muted: #6B7C77;

  /* trạng thái tài khoản (kèm icon Lucide bắt buộc) */
  --state-ok:    #1E8A6B;  /* circle-check   · Hoạt động */
  --state-warn:  #B0791F;  /* triangle-alert · Cần chú ý */
  --state-err:   #B23C33;  /* circle-x       · Lỗi đồng bộ */
  --state-idle:  #6B7C77;  /* circle-minus   · Chưa kết nối */
  --state-local: #46766B;  /* lock           · Chỉ lưu trong máy */

  /* bo góc */
  --r-ctrl: 10px;  --r-card: 14px;  --r-tile: 17px;  --r-pill: 999px;

  /* spacing — thang 4px, không dùng giá trị lẻ */
  --s-1: 4px;  --s-2: 8px;  --s-3: 12px; --s-4: 16px;
  --s-5: 20px; --s-6: 24px; --s-8: 32px; --s-10: 40px;

  /* độ nổi — chỉ 2 mức, không có mức thứ ba */
  --shadow-card:  0 1px 2px rgba(11,46,42,.06);
  --shadow-float: 0 12px 32px rgba(11,46,42,.16);
}

[data-theme="dark"] {
  --bg:         #0E2724;
  --bg-card:    #143A34;
  --line:       #235349;
  --text:       #E4EEEA;
  --text-muted: #8FA8A1;

  --state-ok:    #4FCBA4;
  --state-warn:  #E0A63C;
  --state-err:   #E4695E;
  --state-idle:  #8FA8A1;
  --state-local: #7FA69B;
}
```

## 2.2 · Tailwind

```ts
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      ink:   '#0B2E2A',
      jade:  { DEFAULT: '#1E6B58', dark: '#12503F', light: '#2F8B72' },
      brass: '#C9902F',
      paper: '#EEF2EF',
      stone: '#6B7C77',
      line:  '#D6DFDA',
      state: { ok: '#1E8A6B', warn: '#B0791F', err: '#B23C33', idle: '#6B7C77', local: '#46766B' },
    },
    borderRadius: { ctrl: '10px', card: '14px', tile: '17px' },
    fontFamily: {
      display: ['Bricolage Grotesque', 'sans-serif'],
      sans:    ['Be Vietnam Pro', 'Segoe UI', 'sans-serif'],
      mono:    ['JetBrains Mono', 'ui-monospace', 'monospace'],
    },
    boxShadow: {
      card:  '0 1px 2px rgba(11,46,42,.06)',
      float: '0 12px 32px rgba(11,46,42,.16)',
    },
  },
}
```

## 2.3 · Luật dùng màu

| Màu | Được dùng cho | Cấm dùng cho |
|---|---|---|
| `brass` | Nút chính (một nút mỗi vùng), vòng focus | Nền lớn, icon trang trí, viền thẻ, chữ body |
| `jade` | Nav đang chọn, link, đường biểu đồ chính, avatar mặc định | Nền của chữ jade |
| `state-*` | Chip trạng thái, chấm trong biểu đồ tròn, viền cảnh báo | Nút, tiêu đề |
| `stone` | Chữ phụ, nhãn, đường trục biểu đồ | Chữ chính |

**Một màn hình chỉ được có một nút `brass`.** Nếu thấy hai, một trong hai phải là `ghost`.

## 2.4 · Font chữ trong app đóng gói

Không gọi Google Fonts lúc chạy — app phải chạy offline hoàn toàn ở v1.0, và CSP trong `tauri.conf.json` sẽ chặn (việc A4, Sprint 0). Tải `.woff2` vào `src/assets/fonts/` và khai báo `@font-face` cục bộ. Lấy subset `latin` + `vietnamese`.

---

# PHẦN 3 — CHỮ

Cả ba font đều có bộ dấu tiếng Việt đầy đủ. Đây là tiêu chí chọn đầu tiên, không phải thẩm mỹ: phần lớn nội dung là tên trang và ghi chú tiếng Việt.

| Vai trò | Font | Dùng ở đâu |
|---|---|---|
| Tiêu đề | **Bricolage Grotesque** 700/800 | Tên trang, số liệu lớn ở thẻ thống kê. Không dùng dưới 20 px |
| Giao diện | **Be Vietnam Pro** 400/500/600 | Toàn bộ nhãn, nút, body, tên tài khoản |
| Dữ liệu | **JetBrains Mono** 400/500 | Follower, chênh lệch, UUID, đường dẫn, thời gian đồng bộ |

## Thang chữ

| Token | Cỡ / đậm / font | Dùng cho |
|---|---|---|
| `display` | 40 · 800 · display | Tiêu đề trang ("Tổng quan tài khoản") |
| `stat` | 32 · 800 · display, `tabular-nums` | Con số trong thẻ thống kê |
| `title` | 20 · 700 · sans | Tiêu đề thẻ, tiêu đề Sheet |
| `body` | 15 · 400 · sans | Nội dung |
| `label` | 13 · 600 · sans | Nút, nhãn, mục nav |
| `data` | 12 · 500 · mono | Số liệu trong thẻ và bảng |
| `caption` | 11.5 · 500 · mono, letter-spacing .1em, uppercase | Nhãn nhóm, eyebrow |

Line-height: tiêu đề 1.08, body 1.6. Tiếng Việt có dấu chồng hai tầng (ề, ẫ, ợ) — **không đặt line-height dưới 1.45 cho bất kỳ chữ nào ≤ 15 px**, dấu sẽ chạm dòng trên trong bảng dày.

---

# PHẦN 4 — TÀI SẢN ĐỒ HOẠ

Thư mục: `src/assets/brand/`. File gốc SVG nằm trong bộ nhận diện đã bàn giao.

| File | Dùng ở đâu |
|---|---|
| `mark.svg` | Logo khối, nền sáng — sidebar |
| `mark-inverse.svg` | Nền tối |
| `glyph.svg` | Chỉ phần lỗ khoá, ăn theo `currentColor` |
| `favicon.svg` | ≤ 24 px, nét đã làm dày |
| `app-icon.svg` / `.ico` | Cửa sổ Tauri, taskbar, shortcut |
| `lockup-h.svg` | Màn hình đăng nhập, About, tài liệu |
| `mascot.svg` / `-locked` / `-sync` | Màn hình trống, màn khoá, lúc chờ |

## 4.1 · Logo — dán thẳng vào code

```html
<!-- glyph: ăn màu theo currentColor, dùng cho nav và nút -->
<svg viewBox="0 0 64 64" role="img" aria-label="Mai">
  <g fill="currentColor">
    <circle cx="32" cy="21.5" r="7.5"/>
    <rect x="16" y="34" width="32" height="7" rx="3.5"/>
    <rect x="21.5" y="44" width="21" height="7" rx="3.5"/>
  </g>
</svg>

<!-- mark: logo khối đầy đủ -->
<svg viewBox="0 0 64 64" role="img" aria-label="Mai">
  <rect x="2" y="2" width="60" height="60" rx="17" fill="#1E6B58"/>
  <g fill="#EEF2EF">
    <circle cx="32" cy="21.5" r="7.5"/>
    <rect x="16" y="34" width="32" height="7" rx="3.5"/>
    <rect x="21.5" y="44" width="21" height="7" rx="3.5"/>
  </g>
</svg>
```

**Quy tắc:** chừa quanh logo khoảng trống bằng đường kính hình tròn bên trong. Cỡ nhỏ nhất của `mark` là 24 px; nhỏ hơn thì dùng `favicon.svg`. Không xoay, không kéo méo, không đổi màu.

## 4.2 · Linh vật Mai — dán thẳng vào code

```html
<svg viewBox="0 0 240 220" role="img" aria-label="Mai">
  <defs><clipPath id="mai-dome"><path d="M52,132 A68,70 0 0 1 188,132 Z"/></clipPath></defs>
  <ellipse cx="84" cy="176" rx="14" ry="9" fill="#2F8B72"/>
  <ellipse cx="156" cy="176" rx="14" ry="9" fill="#2F8B72"/>
  <ellipse cx="58" cy="150" rx="20" ry="11" fill="#2F8B72" transform="rotate(-32 58 150)"/>
  <ellipse cx="182" cy="150" rx="20" ry="11" fill="#2F8B72" transform="rotate(32 182 150)"/>
  <path d="M52,132 A68,70 0 0 1 188,132 Z" fill="#1E6B58"/>
  <g clip-path="url(#mai-dome)">
    <path d="M 83.1,133 L 64,144 L 44.9,133 L 44.9,111 L 64,100 L 83.1,111 Z" fill="#17604E"/>
    <path d="M 195.1,133 L 176,144 L 156.9,133 L 156.9,111 L 176,100 L 195.1,111 Z" fill="#17604E"/>
    <path d="M 103.3,84 L 86,94 L 68.7,84 L 68.7,64 L 86,54 L 103.3,64 Z" fill="#17604E"/>
    <path d="M 171.3,84 L 154,94 L 136.7,84 L 136.7,64 L 154,54 L 171.3,64 Z" fill="#17604E"/>
    <path d="M 137.3,62 L 120,72 L 102.7,62 L 102.7,42 L 120,32 L 137.3,42 Z" fill="#17604E"/>
    <path d="M 140.8,114 L 120,126 L 99.2,114 L 99.2,90 L 120,78 L 140.8,90 Z" fill="#EEF2EF"/>
  </g>
  <g fill="#1E6B58">
    <circle cx="120" cy="92" r="5.4"/>
    <rect x="109" y="103" width="22" height="5.4" rx="2.7"/>
    <rect x="113" y="112" width="14" height="5.4" rx="2.7"/>
  </g>
  <rect x="50" y="124" width="140" height="20" rx="10" fill="#12503F"/>
  <circle cx="120" cy="160" r="27" fill="#2F8B72"/>
  <circle cx="110" cy="155" r="6.8" fill="#EEF2EF"/><circle cx="111.4" cy="156.4" r="3.3" fill="#0B2E2A"/>
  <circle cx="113.1" cy="154.3" r="1.3" fill="#EEF2EF"/>
  <circle cx="130" cy="155" r="6.8" fill="#EEF2EF"/><circle cx="131.4" cy="156.4" r="3.3" fill="#0B2E2A"/>
  <circle cx="133.1" cy="154.3" r="1.3" fill="#EEF2EF"/>
  <ellipse cx="99" cy="167" rx="5.5" ry="3.3" fill="#C9902F" opacity=".38"/>
  <ellipse cx="141" cy="167" rx="5.5" ry="3.3" fill="#C9902F" opacity=".38"/>
  <path d="M114,170 q6,5.5 12,0" fill="none" stroke="#0B2E2A" stroke-width="2.6" stroke-linecap="round" opacity=".75"/>
</svg>
```

**Mai được xuất hiện ở:** màn hình trống (chưa có tài khoản, tìm không ra kết quả), màn hình khoá (bản `-locked`, đầu rụt vào mai), lúc chờ đồng bộ dài (bản `-sync`), màn hình About.

**Mai không được xuất hiện ở:** toast, hộp thoại xác nhận xoá, màn hình lỗi đồng bộ, thanh công cụ, cạnh mọi thứ liên quan tới mật khẩu. Lúc người dùng đang sợ mất dữ liệu, một con rùa dễ thương là thứ gây khó chịu.

## 4.3 · Icon

Chỉ dùng **Lucide React**, `stroke-width={2}`, cỡ 16 / 20 / 24. Không trộn bộ icon khác. Không dùng emoji trong giao diện.

Ánh xạ cố định, dùng đúng như bảng này ở mọi màn hình:

| Ý nghĩa | Icon |
|---|---|
| Hoạt động | `circle-check` |
| Cần chú ý / token sắp hết hạn | `triangle-alert` |
| Lỗi đồng bộ | `circle-x` |
| Chưa kết nối | `circle-minus` |
| Chỉ lưu trong máy | `lock` |
| Đồng bộ | `refresh-cw` |
| Mở tài khoản | `external-link` |
| Sao chép | `copy` |
| Hiện mật khẩu | `eye` / `eye-off` |
| Thêm tuỳ chọn | `ellipsis` |
| Nhập từ Excel/CSV | `file-up` |
| Sao lưu | `shield-check` |

---

# PHẦN 5 — NGUYÊN TẮC BỐ CỤC

```
┌────────────┬───────────────────────────────────────────────────────┐
│  sidebar   │  topbar: tiêu đề trang · tìm kiếm · 1 nút brass       │
│  240px     ├───────────────────────────────────────────────────────┤
│  cố định   │                                                       │
│            │  nội dung, max-width 1280, padding 32                  │
│  logo top  │                                                       │
│  user bot  │                                                       │
└────────────┴───────────────────────────────────────────────────────┘
```

- Lưới nội dung 12 cột, gap 20 px.
- Bề mặt chỉ có 2 tầng: nền `--bg`, thẻ `--bg-card` + viền `--line` + `shadow-card`. Không có tầng thứ ba, không có thẻ lồng thẻ.
- Sheet chi tiết trượt từ phải, rộng 480 px, `shadow-float`, nền phía sau **không cuộn** và **không bị xoá** (QĐ-04). URL vẫn là `/accounts/:id`.
- Breakpoint nhỏ nhất phải chạy được: 1024 px (cửa sổ desktop thu nhỏ). Dưới 1180 px sidebar rút còn icon 64 px.

---

# PHẦN 6 — ĐẶC TẢ TỪNG KHỐI CỦA DASHBOARD

## 6.1 · Sidebar

- Nền `--bg-card`, viền phải `--line`.
- Trên cùng: `mark.svg` 32 px + chữ "Mai" (display 20/800). **Bỏ chữ "Account Manager"** — tên dài không phải logo.
- Mục nav: cao 44 px, bo `--r-ctrl`, icon 20 px + nhãn `label`. Mục đang chọn: nền `jade` 10%, chữ `jade`, thêm vạch đứng 3 px `jade` bên trái — **không chỉ đổi màu chữ**.
- **Nav theo mốc phát hành, không dựng sẵn:**

| Mục | Có từ |
|---|---|
| Tổng quan | v1.0 |
| Tài khoản | v1.0 |
| Cài đặt | v1.0 |
| Sao lưu | v1.0 (Sprint 4) |
| Đồng bộ | v1.1 |
| Tích hợp | v1.2 |

- Dưới cùng: avatar + tên chủ máy + `chevron-down`. Ở v1.0 chưa có tài khoản đăng nhập (Supabase Auth tới v1.1) — hiển thị "Máy này" + đường dẫn kho dữ liệu ở `caption`, không bịa ra vai trò "Owner".

## 6.2 · Topbar

- Tiêu đề trang `display` + phụ đề `body` màu `--text-muted`.
- Ô tìm kiếm: rộng tối đa 420 px, icon `search`, placeholder "Tìm tên, email, ghi chú…". **Tìm kiếm phải quét cả trường `notes`** (lỗi #24) — nếu chưa quét thì đổi placeholder cho khớp, không hứa suông.
- Một nút `brass` duy nhất: "Thêm tài khoản" (`plus`).
- **Bỏ chuông thông báo.** Không có trung tâm thông báo trong phạm vi v1, và Realtime ở v1.1 sẽ đẻ ra hàng chục sự kiện mỗi lần cron chạy (lỗi #41). Thay bằng dòng `caption` mono: "Đồng bộ lần cuối 14:20".

## 6.3 · Thẻ thống kê (hàng 4 thẻ)

- Cấu trúc: nhãn `label` màu muted → số `stat` mono tabular → dòng so sánh `data`.
- Icon trong ô vuông 44 px bo `--r-ctrl`, nền màu thẻ 10%.
- Bốn thẻ: Tổng tài khoản · Đang hoạt động · Đã kết nối · Tổng followers.
- **Dòng "so với 30 ngày trước" chỉ hiện khi có dữ liệu lịch sử thật.** Ở v1.0 và v1.1 chưa có bảng `follower_snapshots` đầy 30 ngày → ẩn hẳn dòng đó, không hiện `+0%`, không hiện mũi tên xám. Thẻ "Tổng followers" ở v1.0 hiển thị con số nhập tay lần cuối kèm `caption`: "nhập tay".
- Định dạng số: nhóm ba chữ số bằng **dấu chấm** theo chuẩn tiếng Việt (`1.240.000`), rút gọn thì `1,24 tr` — **không trộn `1,24M`** như bản cũ.

## 6.4 · Biểu đồ tăng trưởng followers

- Recharts, `AreaChart`, một đường `jade` `strokeWidth={2}`, vùng tô gradient `jade` 18% → 0.
- Trục và lưới: `--line`, chữ trục `data` màu `--stone`. Bỏ lưới dọc.
- Tooltip: nền `--ink`, chữ `--paper`, số mono.
- Bộ chọn khoảng: 7 / 30 / 90 ngày, dạng segmented, không phải dropdown.
- **Ba trạng thái bắt buộc**, không chỉ có trạng thái đẹp:
  - *chưa đủ dữ liệu* (< 2 mốc): "Cần ít nhất hai lần đồng bộ để vẽ được đường. Lần đồng bộ đầu đã ghi mốc hôm nay."
  - *tính năng chưa bật* (v1.0/v1.1): thay biểu đồ bằng khối giải thích + link tới trang Tích hợp, không hiện đường giả.
  - *lỗi tải* (lỗi #26): "Không đọc được lịch sử follower." + nút "Thử lại".

## 6.5 · Biểu đồ tròn trạng thái đồng bộ

- Donut, độ dày 22 px, giữa là tổng + nhãn "Tổng".
- Ba lát: `state-ok` / `state-warn` / `state-idle`. **Mỗi mục trong chú giải phải có icon riêng**, không chỉ chấm tròn màu.
- Số liệu bên phải: nhãn + `n (x%)` mono, căn phải. Sửa lỗi bản cũ: `22 (17%).` — dấu chấm thừa, và 66+17+17 = 100 nhưng 84+22+22 = 128 ✓, giữ đúng tổng.
- Nút "Đồng bộ tất cả" (`refresh-cw`) đặt ở đây, **chỉ có từ v1.2** và **disable kèm tooltip giải thích** khi không có tài khoản nào đã kết nối. Trong lúc chạy: đổi thành nút huỷ, kèm tiến độ `n/84`.

## 6.6 · Thẻ tài khoản — phần bị sửa nhiều nhất

Bản cũ nhồi 10 đơn vị thông tin và hai nút ngang trọng số vào 300 px. QĐ-04 chốt lại:

```
┌──────────────────────────────────────────┐
│ [avatar 40] Mai Hương Boutique      [⋯] │
│             @maihuong.boutique           │   ← mono, muted
│                                          │
│ ⊘ Hoạt động            256.800 follower  │   ← chip trái, số mono phải
│ Đồng bộ 8 phút trước                     │   ← caption
│                                          │
│ [        Mở tài khoản        ]           │   ← 1 nút brass, full width
└──────────────────────────────────────────┘
```

- **Bỏ ảnh lớn.** Ảnh chiếm 55–60% chiều cao mà gần như không mang thông tin (lỗi #37). Avatar 40 px bo `--r-ctrl` là đủ. Không có avatar → chữ cái đầu trên nền màu sinh từ hash tên (việc 3.4).
- **Bỏ email khỏi thẻ.** Chuyển vào Sheet chi tiết.
- **Bỏ nút "Đồng bộ" khỏi thẻ.** Nút này chỉ hợp lệ với tài khoản đã kết nối → disable vĩnh viễn trên đa số thẻ. Đưa vào menu `⋯` cùng với Sửa, Sao chép mật khẩu, Xoá.
- Huy hiệu nền tảng: icon nhỏ 16 px ở góc avatar, **màu đơn sắc `--stone`**, không dùng logo màu của Facebook/Instagram — bốn logo màu rực cạnh nhau phá vỡ bảng màu và tạo vấn đề nhãn hiệu khi phát hành.
- Cả thẻ **không** click được. Bản cũ để thẻ click toàn bộ mà bên trong lại có nút → nested interactive control, hỏng bàn phím và screen reader (lỗi #34). Chỉ nút và menu là điểm bấm; mở chi tiết bằng nút hoặc bằng phím `Enter` khi thẻ được focus như một `role="link"` duy nhất — chọn một, không làm cả hai.
- Bộ lọc nền tảng phía trên: **chỉ hiện nền tảng đã có provider**. v1.2 có Facebook + Instagram. **Bỏ tab TikTok** cho tới khi có provider thật.

## 6.7 · Nút

| Loại | Hình thức | Dùng khi |
|---|---|---|
| `primary` | nền `brass`, chữ `#25190A`, đậm 700, cao 40, bo `--r-ctrl` | Hành động chính duy nhất của vùng |
| `secondary` | nền trong suốt, viền `--line`, chữ `--text` | Hành động phụ |
| `ghost` | không viền, chữ `--text-muted`, hiện nền khi hover | Menu `⋯`, đóng Sheet |
| `danger` | chữ `state-err`, viền `state-err` 40% | Xoá — luôn kèm hộp thoại xác nhận gõ tên |

Trạng thái disable: opacity .45 + `cursor: not-allowed` + **tooltip nói vì sao**. Nút disable không giải thích là nút vô nghĩa.

---

# PHẦN 7 — BẢN CŨ SAI Ở ĐÂU: BẢNG ĐỐI CHIẾU 14 ĐIỂM

Dùng bảng này để review diff. Cột cuối là chỗ đã ghi nhận vấn đề.

| # | Bản cũ | Bản mới | Căn cứ |
|---|---|---|---|
| 1 | Xanh dương `#2563EB` toàn giao diện | Jade + đồng thau theo token | Nhận diện |
| 2 | Thẻ có 2 nút ngang trọng số | 1 nút `brass` + menu `⋯` | QĐ-04 |
| 3 | Email hiển thị trên thẻ | Chuyển vào Sheet chi tiết | QĐ-04 |
| 4 | Ảnh lớn chiếm hơn nửa thẻ | Avatar 40 px | Lỗi #37 |
| 5 | Chip `Active` tiếng Anh, chỉ có chấm màu | "Hoạt động" + icon `circle-check` | Lỗi #33, #40 |
| 6 | Trạng thái phân biệt hoàn toàn bằng màu | Icon + chữ ở mọi trạng thái | Lỗi #40 |
| 7 | Tab TikTok | Bỏ, chỉ hiện nền tảng có provider | Lỗi #43 (UI chết) |
| 8 | Nav "Đồng bộ", "Tích hợp" có sẵn từ v1.0 | Hiện theo mốc phát hành | Lỗi #43 |
| 9 | Chuông thông báo có badge | Bỏ; thay bằng dòng "Đồng bộ lần cuối" | Lỗi #41 |
| 10 | "12% so với 30 ngày trước" ở v1.0 | Ẩn khi chưa có lịch sử thật | Không bịa dữ liệu |
| 11 | `1,24M` — trộn quy ước phân cách | `1.240.000` / `1,24 tr` | Nhất quán tiếng Việt |
| 12 | Biểu đồ chỉ có trạng thái đẹp | Thêm rỗng / chưa bật / lỗi | Lỗi #26 |
| 13 | Cả thẻ click được, bên trong có nút | Chỉ nút là điểm bấm | Lỗi #34, #35 |
| 14 | Logo màu của từng nền tảng | Icon đơn sắc `--stone` | Nhất quán + nhãn hiệu |

---

# PHẦN 8 — TRẠNG THÁI RỖNG, ĐANG TẢI, LỖI

Mỗi danh sách và mỗi biểu đồ phải có đủ **bốn** trạng thái. Bản cũ chỉ có trạng thái đẹp.

| Trạng thái | Hình thức | Chữ mẫu |
|---|---|---|
| Đang tải | Skeleton đúng hình dạng thẻ thật, không spinner giữa màn | — |
| Rỗng lần đầu | Linh vật Mai + 2 nút | "Chưa có tài khoản nào. Nhập file Excel đang dùng, hoặc thêm tài khoản đầu tiên." |
| Không có kết quả lọc | Không dùng linh vật, chỉ chữ + nút xoá lọc | "Không có tài khoản nào khớp \"abc\". Xoá bộ lọc" |
| Lỗi | Icon `triangle-alert` màu `state-err` + nút thử lại | "Không đọc được kho dữ liệu. Thử lại" |

Skeleton: nền `--line` ở 40%, nhấp nháy 1.4 s, **tắt hoàn toàn khi `prefers-reduced-motion`**.

Màn hình khoá (Sprint 5, lỗi #23 — màn hình đầu tiên người dùng thấy mà spec quên đặc tả): nền `--ink`, `mascot-locked.svg` 160 px, `lockup-h-dark.svg`, một ô mật khẩu, một nút `brass` "Mở khoá". Không có gì khác trên màn hình đó.

---

# PHẦN 9 — CHỮ TRONG GIAO DIỆN

- **Sentence case** ở mọi nơi. Không VIẾT HOA TOÀN BỘ trừ `caption`.
- Nút nói đúng việc nó làm, và giữ nguyên tên xuyên suốt luồng: nút "Sao lưu" → toast "Đã sao lưu". Không "Submit", không "OK".
- Lỗi không xin lỗi, không mơ hồ: nói chuyện gì xảy ra và làm gì tiếp. ❌ "Rất tiếc, đã có lỗi xảy ra." ✅ "Token của Trạm Chim Trời đã hết hạn. Kết nối lại để tiếp tục cập nhật follower."
- Màn hình trống là lời mời làm việc, không phải thông báo buồn.
- Nhãn cố định — dùng đúng chuỗi này, không sáng tác thêm:

| Khái niệm | Nhãn |
|---|---|
| account | tài khoản |
| sync | đồng bộ |
| connected | đã kết nối |
| active | hoạt động |
| followers | follower *(giữ nguyên, người dùng gọi vậy)* |
| backup | sao lưu |
| restore | khôi phục |
| import | nhập từ Excel |
| notes | ghi chú |

- Không bao giờ để chữ "mật khẩu" cạnh chữ "đám mây"/"cloud" trong cùng một câu khẳng định, trừ khi câu đó là: "Mật khẩu không bao giờ rời khỏi máy này."

---

# PHẦN 10 — SÀN CHẤT LƯỢNG BẮT BUỘC

- Tương phản chữ ≥ 4.5:1, chữ lớn ≥ 3:1. Đã kiểm: `--text` trên `--bg-card`, `--text-muted` trên `--bg-card`, chữ `#25190A` trên `brass`.
- Focus nhìn thấy được: viền `brass` 3 px, offset 3 px, trên **mọi** phần tử bấm được. Không `outline: none` ở bất kỳ đâu.
- Đi được toàn bộ dashboard bằng bàn phím. Sheet: focus trap, `Esc` đóng, trả focus về nút đã mở nó.
- `prefers-reduced-motion: reduce` → tắt mọi transition và animation, kể cả skeleton và Sheet trượt.
- Danh sách > 200 thẻ: virtualize (`@tanstack/react-virtual`). Dưới ngưỡng đó không virtualize (câu hỏi Q1).
- Không có văn bản nào trong app là ảnh.

---

# PHẦN 11 — CẤM

1. Không thêm màu ngoài token. Không gradient trừ vùng tô dưới đường biểu đồ và icon app.
2. Không glassmorphism, không neumorphism, không viền phát sáng, không bóng nhiều lớp.
3. Không hai nút `brass` trên cùng một màn hình.
4. Không dùng linh vật ở màn hình lỗi, hộp thoại xoá, hay bất kỳ chỗ nào liên quan tới mật khẩu.
5. Không dựng UI cho tính năng chưa tới sprint của nó.
6. Không hiển thị số liệu giả, số 0 giả, hay phần trăm giả khi chưa có dữ liệu.
7. Không dùng emoji làm icon.
8. Không hiển thị mật khẩu ở dạng chữ trong bất kỳ danh sách nào — chỉ trong Sheet, chỉ sau khi bấm `eye`, chỉ trong 30 giây.
9. Không log, không đặt vào `title`, không đặt vào `aria-label` bất cứ thứ gì là mật khẩu, token, cookie hay authorization code.
10. Không tải font, ảnh, script từ mạng lúc chạy — CSP sẽ chặn và app phải chạy offline.

---

# PHẦN 12 — CHECKLIST NGHIỆM THU

Chạy trước khi đóng bất kỳ sprint nào có đụng UI.

- [ ] `grep -rE "#[0-9a-fA-F]{6}" src/ --include=*.tsx` → chỉ còn kết quả trong `tokens.css` và file SVG brand
- [ ] `grep -r "blue-\|indigo-\|violet-" src/` → 0 kết quả
- [ ] Mọi chip trạng thái có icon đi kèm
- [ ] Mỗi màn hình đúng một nút `brass`
- [ ] Mọi danh sách có đủ 4 trạng thái: loading / rỗng / không kết quả / lỗi
- [ ] Tab qua toàn bộ trang bằng bàn phím, không mất dấu focus ở đâu
- [ ] Bật `prefers-reduced-motion` → không còn chuyển động nào
- [ ] Thu cửa sổ về 1024 px → không vỡ, không cuộn ngang
- [ ] Đổi `data-theme="dark"` → không có chữ nào biến mất
- [ ] Số liệu dùng mono + `tabular-nums`, phân cách bằng dấu chấm
- [ ] Không có nhãn tiếng Anh lọt vào giao diện
- [ ] Không có mục nav nào bấm vào ra màn hình trống

---

*Hết. Sửa file này trước khi sửa component — nếu một quyết định hình thức không nằm ở đây, nó chưa được quyết.*
