import type { AccountSummary } from "../../types/account";

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

const AVATAR_DATA_URI =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='88' height='88'%3E%3Crect width='88' height='88' fill='%23E46C00'/%3E%3C/svg%3E";

/** Dữ liệu mẫu — dùng cho cả test lẫn kiểm bằng mắt (Task 6). Phủ đủ: 5 trạng
 * thái, 3 nền tảng, avatar null/lỗi, follower null/0, tên+email dài (ellipsis),
 * tên có emoji, chữ "Đ". */
export const MOCK_ACCOUNTS: AccountSummary[] = [
  {
    id: "acc-1",
    platform: "facebook",
    status: "active",
    displayName: "Nguyễn Văn A",
    username: "@nguyenvana",
    loginEmail: "nguyenvana@gmail.com",
    avatarUrl: AVATAR_DATA_URI,
    followerCount: 1234567,
    followerUpdatedAt: daysAgo(0),
  },
  {
    id: "acc-2",
    platform: "instagram",
    status: "review",
    displayName: "Trần Thị Ánh Nguyệt — Shop Phụ Kiện Handmade Hà Nội ✨",
    username: "@tranthianhnguyet.handmade.hanoi",
    loginEmail: "a-very-long-address.for.truncation@a-long-domain-name.com.vn",
    avatarUrl: null,
    followerCount: 8900,
    followerUpdatedAt: daysAgo(8),
  },
  {
    id: "acc-3",
    platform: "google",
    status: "inactive",
    displayName: "Mochi Shop",
    username: null,
    loginEmail: "mochi.shop.official@gmail.com",
    avatarUrl: "https://invalid.invalid/a.png",
    followerCount: null,
    followerUpdatedAt: null,
  },
  {
    id: "acc-4",
    platform: "facebook",
    status: "locked",
    displayName: "PawPass Official Page",
    username: "@pawpass.official",
    loginEmail: null,
    avatarUrl: AVATAR_DATA_URI,
    followerCount: 0,
    followerUpdatedAt: daysAgo(45),
  },
  {
    id: "acc-5",
    platform: "instagram",
    status: "archived",
    displayName: "Đặng Đình Đức",
    username: "@dangdinhduc",
    loginEmail: "dangdinhduc@outlook.com",
    avatarUrl: AVATAR_DATA_URI,
    followerCount: 12,
    followerUpdatedAt: daysAgo(365),
  },
];
