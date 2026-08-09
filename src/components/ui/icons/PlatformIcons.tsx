// Nguồn icon (tải 10/08/2026, xem docs/brand-reference/platform-icons/):
// - facebook: Meta Brand Resource Center — Facebook Logo (Primary Logo, icon tròn chính thức)
// - instagram: Meta Brand Resource Center — Instagram Brand (Gradient Glyph chính thức)
// - gmail: Google product logo CDN (fonts.gstatic.com) — icon phong bì Gmail, không phải logo "G"
import facebookIconSrc from "../../../assets/brand/platforms/facebook.png";
import instagramIconSrc from "../../../assets/brand/platforms/instagram.png";
import gmailIconSrc from "../../../assets/brand/platforms/gmail.svg";
import type { Platform } from "../../../types/account";

export const PLATFORM_ICON_SRC: Record<Platform, string> = {
  facebook: facebookIconSrc,
  instagram: instagramIconSrc,
  google: gmailIconSrc,
};

export const PLATFORM_LABEL: Record<Platform, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  google: "Gmail",
};
