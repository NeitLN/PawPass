import { describe, expect, it, vi } from "vitest";
import { formatDate, formatFollowerCount, formatNumber, formatRelativeDays } from "./format";

describe("formatFollowerCount", () => {
  it("shows 'Chưa nhập' for null, never '0' — BR-04", () => {
    expect(formatFollowerCount(null)).toBe("Chưa nhập");
  });

  it("shows a real zero as '0', distinct from null", () => {
    expect(formatFollowerCount(0)).toBe("0");
  });

  it("does not shorten counts under 1000", () => {
    expect(formatFollowerCount(999)).toBe("999");
  });

  it("shortens thousands with a comma decimal and K suffix", () => {
    expect(formatFollowerCount(1234)).toBe("1,2K");
  });

  it("shortens millions with a comma decimal and M suffix", () => {
    expect(formatFollowerCount(3_400_000)).toBe("3,4M");
  });
});

describe("formatNumber", () => {
  it("uses dot as the thousands separator", () => {
    expect(formatNumber(1_234_567)).toBe("1.234.567");
  });
});

describe("formatRelativeDays", () => {
  it("shows 'Chưa cập nhật follower' for null", () => {
    expect(formatRelativeDays(null)).toBe("Chưa cập nhật follower");
  });

  it("shows 'Đã cập nhật hôm nay' for today", () => {
    expect(formatRelativeDays(new Date())).toBe("Đã cập nhật hôm nay");
  });

  it("shows day count for a past date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 10));
    expect(formatRelativeDays(new Date(2026, 7, 2))).toBe("Đã cập nhật 8 ngày trước");
    vi.useRealTimers();
  });
});

describe("formatDate", () => {
  it("formats as dd/MM/yyyy", () => {
    expect(formatDate(new Date(2026, 7, 9))).toBe("09/08/2026");
  });
});
