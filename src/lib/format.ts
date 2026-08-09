import { strings } from "./strings";

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("vi-VN").format(n);
}

export function formatFollowerCount(n: number | null): string {
  if (n === null) return strings.account.followerNotEntered;
  if (n < 1000) return String(n);
  const [divisor, suffix] = n < 1_000_000 ? [1_000, "K"] : [1_000_000, "M"];
  return `${(n / divisor).toFixed(1).replace(".", ",")}${suffix}`;
}

export function formatRelativeDays(date: Date | null): string {
  if (date === null) return strings.account.neverUpdatedFollower;
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  return days === 0 ? strings.account.updatedToday : strings.account.updatedAgo(days);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

const GRAPHEMES = new Intl.Segmenter("vi", { granularity: "grapheme" });

/**
 * Chữ cái đại diện cho avatar khi không có ảnh, lấy tên gọi (token cuối), §5.3.
 * Dùng Intl.Segmenter để tách theo grapheme cluster — xử lý đúng cả input dạng
 * NFD (dấu tách rời, ví dụ từ macOS): Segmenter gộp base+dấu thành một cụm,
 * không cắt giữa chừng như string indexing thường ([0]) sẽ làm.
 */
export function avatarInitial(displayName: string): string {
  const tokens = displayName.normalize("NFC").trim().split(/\s+/).filter(Boolean);
  const named = tokens.filter((t) => /^[\p{L}\p{N}]/u.test(t));
  const source = named.at(-1) ?? tokens.at(-1) ?? "";
  const first = [...GRAPHEMES.segment(source)][0];
  return first ? first.segment.toUpperCase() : "?";
}
