import { useProfile } from "../../hooks/useProfile";
import { BadgeCheck } from "lucide-react";

interface VerifiedTickProps {
  /** Pass the user ID to auto-fetch verification status */
  userId?: string | null;
  /** OR pass isVerified directly if you already have it */
  isVerified?: boolean;
  className?: string;
}

export function VerifiedTick({ userId, isVerified, className = "w-4 h-4" }: VerifiedTickProps) {
  const { data: profile } = useProfile(isVerified !== undefined ? undefined : (userId ?? undefined));

  const verified = isVerified ?? (profile ? !!(profile as any).isVerifiedExpert : false);

  if (!verified) return null;

  return (
    <span title="Verified Expert on Patchwork">
      <BadgeCheck
        className={`inline-block shrink-0 ${className}`}
        style={{ fill: "#1D9BF0", color: "white" }}
        aria-label="Verified Expert"
      />
    </span>
  );
}
