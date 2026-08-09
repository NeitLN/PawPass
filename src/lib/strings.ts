export const strings = {
  dashboard: {
    greeting: (name: string) => `Chào buổi tối, ${name}`,
  },
  account: {
    updatedAgo: (days: number) => `Đã cập nhật ${days} ngày trước`,
    updatedToday: "Đã cập nhật hôm nay",
    neverUpdatedFollower: "Chưa cập nhật follower",
    followerNotEntered: "Chưa nhập",
  },
  clipboard: {
    copiedWillClear: "Đã sao chép — PawPass sẽ xoá sau 30 giây",
  },
} as const;
