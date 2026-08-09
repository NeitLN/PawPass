import { useEffect, useState } from "react";
import { avatarInitial } from "../../lib/format";

export interface AccountAvatarProps {
  avatarUrl: string | null;
  displayName: string;
  size?: number;
}

/** Avatar 88×88 mặc định (§5.3), object-fit cover, chữ cái đại diện khi
 * không có ảnh HOẶC ảnh tải lỗi — đây là 2 tình huống khác nhau, cả hai
 * đều phải rơi về cùng một fallback. */
export function AccountAvatar({ avatarUrl, displayName, size = 88 }: AccountAvatarProps) {
  const [failed, setFailed] = useState(false);

  // Reset trạng thái lỗi khi avatarUrl đổi — nếu không, một avatar mới hợp lệ
  // vẫn bị coi là lỗi do state cũ còn sót lại từ ảnh trước (ví dụ khi lưới
  // account re-sort và component instance được React tái sử dụng).
  useEffect(() => {
    setFailed(false);
  }, [avatarUrl]);

  const showImage = avatarUrl !== null && !failed;

  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-card bg-muzzle-cream font-brand text-2xl font-bold text-fur-orange-text"
      style={{ width: size, height: size }}
    >
      {showImage ? (
        <img
          src={avatarUrl}
          alt={displayName}
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        avatarInitial(displayName)
      )}
    </div>
  );
}

export default AccountAvatar;
