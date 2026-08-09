import { Users } from "lucide-react";
import { formatFollowerCount, formatRelativeDays } from "../../lib/format";
import { strings } from "../../lib/strings";
import type { AccountSummary } from "../../types/account";
import { AccountAvatar } from "./AccountAvatar";
import { PlatformBadge } from "../ui/PlatformBadge";
import { StatusPill } from "../ui/StatusPill";

export interface AccountCardProps {
  account: AccountSummary;
  /** BR-06: cha tính, card không tự validate URL. */
  canOpen?: boolean;
  onOpenAccount: (id: string) => void;
  onUpdateFollower: (id: string) => void;
  className?: string;
}

const BUTTON_BASE =
  "focus-ring flex min-h-[42px] flex-1 items-center justify-center rounded-control px-3 text-sm font-semibold";

const CARD_BASE = "w-[340px] rounded-card border border-border p-[18px]";

/** §5.4: card Archived "chìm" vào nền trang (nền Surface, không shadow) thay vì
 * nổi lên như thẻ trắng. Không dùng opacity — xem §5.4.1 vì sao opacity fail AA. */
const CARD_NORMAL_SURFACE = "bg-white shadow-elevation-2";
const CARD_ARCHIVED_SURFACE = "bg-surface";

export function AccountCard({
  account,
  canOpen = true,
  onOpenAccount,
  onUpdateFollower,
  className = "",
}: AccountCardProps) {
  const cardSurface = account.status === "archived" ? CARD_ARCHIVED_SURFACE : CARD_NORMAL_SURFACE;

  return (
    <div data-testid="account-card" className={`${CARD_BASE} ${cardSurface} ${className}`}>
      <div className="mb-3 flex items-start gap-3">
        <div className="relative shrink-0">
          <AccountAvatar avatarUrl={account.avatarUrl} displayName={account.displayName} />
          <div className="absolute -right-1 -bottom-1">
            <PlatformBadge platform={account.platform} />
          </div>
        </div>

        <div className="min-w-0 flex-1 pt-1">
          <p className="truncate text-base font-bold text-shield-navy" title={account.displayName}>
            {account.displayName}
          </p>
          {account.username && (
            <p className="truncate text-[13px] text-shield-navy" title={account.username}>
              {account.username}
            </p>
          )}
          {account.loginEmail && (
            <p className="truncate text-[13px] text-status-neutral-text" title={account.loginEmail}>
              {account.loginEmail}
            </p>
          )}
        </div>
      </div>

      <StatusPill status={account.status} />

      <div className="mt-3 flex items-center gap-1.5 text-sm text-shield-navy tabular-nums">
        <Users size={16} aria-hidden={true} />
        <span>{formatFollowerCount(account.followerCount)}</span>
      </div>

      <div className="mt-2 border-t border-border pt-2 text-xs text-status-neutral-text">
        {formatRelativeDays(account.followerUpdatedAt)}
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className={`${BUTTON_BASE} border border-border-strong text-shield-navy`}
          onClick={() => onUpdateFollower(account.id)}
        >
          {strings.account.updateFollowerButton}
        </button>
        <button
          type="button"
          disabled={!canOpen}
          className={`${BUTTON_BASE} border border-fur-orange text-fur-orange-text disabled:cursor-not-allowed disabled:opacity-50`}
          onClick={() => onOpenAccount(account.id)}
        >
          {strings.account.openAccountButton}
        </button>
      </div>
    </div>
  );
}

export default AccountCard;
