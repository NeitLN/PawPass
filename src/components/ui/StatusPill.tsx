import { Archive, Check, Circle, Flag, Lock } from "lucide-react";
import type { ComponentType } from "react";
import type { AccountStatus } from "../../types/account";
import { strings } from "../../lib/strings";

export interface StatusPillProps {
  status: AccountStatus;
}

interface StatusConfig {
  label: string;
  Icon: ComponentType<{ size?: number; "aria-hidden"?: boolean }>;
  bg: string;
  text: string;
}

const STATUS_CONFIG: Record<AccountStatus, StatusConfig> = {
  active: {
    label: strings.status.active,
    Icon: Check,
    bg: "bg-status-active-bg",
    text: "text-status-active-text",
  },
  review: {
    label: strings.status.review,
    Icon: Flag,
    bg: "bg-status-warning-bg",
    text: "text-status-warning-text",
  },
  inactive: {
    label: strings.status.inactive,
    Icon: Circle,
    bg: "bg-status-neutral-bg",
    text: "text-status-neutral-text",
  },
  locked: {
    label: strings.status.locked,
    Icon: Lock,
    bg: "bg-status-danger-bg",
    text: "text-status-danger-text",
  },
  archived: {
    label: strings.status.archived,
    Icon: Archive,
    bg: "bg-status-neutral-bg",
    text: "text-status-neutral-text",
  },
};

/** Trạng thái luôn là icon + chữ, không chỉ dựa vào màu (SOURCE-OF-TRUTH §7.6). */
export function StatusPill({ status }: StatusPillProps) {
  const { label, Icon, bg, text } = STATUS_CONFIG[status];
  return (
    <span
      data-testid="status-pill"
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${bg} ${text}`}
    >
      <Icon size={14} aria-hidden={true} />
      {label}
    </span>
  );
}

export default StatusPill;
