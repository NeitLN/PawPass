import neutralSrc from "../../assets/brand/mochi/neutral.png";
import waveSrc from "../../assets/brand/mochi/wave.png";
import searchSrc from "../../assets/brand/mochi/search.png";
import securitySrc from "../../assets/brand/mochi/security.png";
import successSrc from "../../assets/brand/mochi/success.png";
import syncSrc from "../../assets/brand/mochi/sync.png";
import offlineSrc from "../../assets/brand/mochi/offline.png";

export type MochiState =
  "neutral" | "wave" | "search" | "security" | "sync" | "offline" | "success";

export type MochiSize = "sm" | "md" | "lg" | "xl";
export type MochiBackdrop = "auto" | "cream" | "none";

export interface MochiIllustrationProps {
  state: MochiState;
  size?: MochiSize;
  backdrop?: MochiBackdrop;
  alt?: string;
  className?: string;
}

const STATE_SRC: Record<MochiState, string> = {
  neutral: neutralSrc,
  wave: waveSrc,
  search: searchSrc,
  security: securitySrc,
  sync: syncSrc,
  offline: offlineSrc,
  success: successSrc,
};

const SIZE_PX: Record<MochiSize, number> = {
  sm: 48,
  md: 80,
  lg: 160,
  xl: 240,
};

function resolveBackdrop(backdrop: MochiBackdrop, size: MochiSize): boolean {
  if (backdrop === "none") return false;
  if (backdrop === "cream") return true;
  return size !== "sm"; // "auto": every size except sm, where the keyline has already dissolved
}

export function MochiIllustration({
  state,
  size = "md",
  backdrop = "auto",
  alt = "",
  className = "",
}: MochiIllustrationProps) {
  const px = SIZE_PX[size];
  const showBackdrop = resolveBackdrop(backdrop, size);

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: px, height: px }}
    >
      {showBackdrop && (
        <div
          data-testid="mochi-backdrop"
          className="absolute inset-0 rounded-full bg-muzzle-cream"
        />
      )}
      <img
        src={STATE_SRC[state]}
        alt={alt}
        draggable={false}
        width={px}
        height={px}
        className="relative block select-none drop-shadow-elevation-1"
      />
    </div>
  );
}

export default MochiIllustration;
