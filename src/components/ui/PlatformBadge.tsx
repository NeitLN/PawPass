import { PLATFORM_ICON_SRC, PLATFORM_LABEL } from "./icons/PlatformIcons";
import type { Platform } from "../../types/account";

export interface PlatformBadgeProps {
  platform: Platform;
  size?: number;
}

/**
 * Icon nền tảng chính thức trong một đĩa nền trắng — không tô lại màu icon
 * (vi phạm brand guideline của Meta). Đĩa nền + padding 72% giúp 3 icon có
 * hình dạng gốc khác nhau (tròn/vuông bo/phẳng) trông đồng bộ ở cùng kích thước.
 */
export function PlatformBadge({ platform, size = 32 }: PlatformBadgeProps) {
  return (
    <div
      className="flex items-center justify-center rounded-full bg-white shadow-elevation-1"
      style={{ width: size, height: size }}
    >
      <img
        src={PLATFORM_ICON_SRC[platform]}
        alt={PLATFORM_LABEL[platform]}
        className="h-[72%] w-[72%] object-contain"
      />
    </div>
  );
}

export default PlatformBadge;
