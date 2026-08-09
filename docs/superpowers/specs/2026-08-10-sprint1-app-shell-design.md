# Sprint 1 / Sub-project 2: App shell (Sidebar/Topbar/window state)

- Status: Approved
- Date: 2026-08-10
- Phạm vi: Sidebar, Topbar, layout bọc (`AppShell`), routing giữa 3 trang rỗng, khôi phục kích thước cửa sổ. Không có nội dung trang thật (Dashboard/AccountCard/Settings thật) — đó là các sub-project sau.

## Quyết định

1. **Routing: `react-router-dom`.** App có 4-5 trang top-level, không cần type-safe routing phức tạp của TanStack Router; react-router là lựa chọn tiêu chuẩn, tư liệu nhiều nhất.
2. **`Sidebar`/`Topbar` nằm trong `src/app/`**, không phải `components/ui/` — đây là khung riêng của app, không phải primitive tái dùng.
3. **`src/pages/`** — thư mục mới (SOURCE-OF-TRUTH không đặt tên trước), chỉ chứa route component top-level, rỗng ở bước này.
4. **Sidebar collapse: session-only**, không lưu qua lần mở app sau — không có yêu cầu persist trong SOURCE-OF-TRUTH, thêm sau nếu cần.
5. **Search/Add account trong Topbar: chỉ UI, chưa wire logic thật** — cần AccountCard + data layer (sub-project 4, 5) mới có gì để search/add.
6. **Window state: `tauri-plugin-window-state`** (plugin chính thức) — không tự viết logic lưu/khôi phục.
7. **Sửa `tauri.conf.json`** cho khớp §5.1: `width: 1440, height: 900, minWidth: 1180, minHeight: 720` (hiện đang là default scaffold 800×600).

## File structure

```
src/
  app/
    router.tsx       # createBrowserRouter, route Dashboard/Accounts/Settings
    AppShell.tsx      # Sidebar + Topbar + <Outlet/>
    Sidebar.tsx
    Topbar.tsx
  pages/
    DashboardPage.tsx
    AccountsPage.tsx
    SettingsPage.tsx
```

`src/main.tsx` đổi sang dùng `<RouterProvider router={router} />` thay vì `<App />` trực tiếp.

## Sidebar (§5.1)

- 240px mở / 76px thu gọn.
- Logo PawPass trên cùng.
- Nav: Dashboard · Accounts · Settings — dùng `NavLink` của react-router, active route dùng `bg-status-active-bg` + `text-fur-orange-text` (token đã có từ sub-project 1).
- Nút toggle collapse ở cuối sidebar, state lưu trong `useState` cục bộ của `AppShell` (không cần Zustand cho một boolean phạm vi hẹp này).

## Topbar (§5.1)

- Cao 72px.
- Tiêu đề trang: lấy theo route hiện tại (map route → tiêu đề, đơn giản qua `useLocation`).
- Ô search 360px: input thuần, `disabled` — placeholder "Tìm tài khoản..." nhưng không submit gì.
- Nút "Add account": `disabled`, tooltip (native `title` attribute) "Sắp có ở Sprint 1".
- Avatar: hình tròn 36px, chữ cái đầu tên tạm ("T" — hardcode, chưa có auth).

## Window state

1. `pnpm tauri add window-state` — cài cả JS (`@tauri-apps/plugin-window-state`) và Rust (`tauri-plugin-window-state`), tự đăng ký permission vào `capabilities/default.json`.
2. `src-tauri/src/lib.rs` thêm `.plugin(tauri_plugin_window_state::Builder::default().build())`.
3. `tauri.conf.json`: cập nhật window size theo §5.1.

## Test

Không có logic phức tạp mới cần unit test (routing/layout là cấu hình, không phải hàm thuần). Kiểm tra bằng cách chạy `pnpm tauri dev` và xác nhận: bấm Sidebar đổi được cả 3 trang, resize cửa sổ rồi đóng/mở lại app giữ đúng kích thước.

## Ngoài phạm vi

Không có nội dung trang thật. Không wire search/add account. Không persist trạng thái collapse sidebar. Không có avatar/auth thật.
