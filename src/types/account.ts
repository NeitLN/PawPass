export const PLATFORMS = ["facebook", "instagram", "google"] as const;
export const ACCOUNT_STATUSES = ["active", "review", "inactive", "locked", "archived"] as const;

export type Platform = (typeof PLATFORMS)[number];
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

/** Những gì AccountCard cần để hiển thị — một phép chiếu của bảng `accounts`
 * (SOURCE-OF-TRUTH §10.2), không phải bản sao nguyên hàng. Không bao giờ chứa
 * secret, owner_id, row_version, hay bất kỳ cột nào ngoài phạm vi hiển thị. */
export interface AccountSummary {
  id: string;
  platform: Platform;
  status: AccountStatus;
  displayName: string;
  username: string | null;
  loginEmail: string | null;
  /** Đã resolve sẵn thành URL hiển thị được — không phải avatar_path (Supabase
   * Storage path) thô. Việc resolve signed URL là việc của tầng data (Sprint 3). */
  avatarUrl: string | null;
  followerCount: number | null;
  followerUpdatedAt: Date | null;
}
