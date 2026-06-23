import { VerifiedTick } from './VerifiedTick';

interface OrganizationBadgeProps {
  orgName?: string | null;
  orgLogo?: string | null;
  isVerified?: boolean;
}

export function OrganizationBadge({ orgName, orgLogo, isVerified }: OrganizationBadgeProps) {
  if (!orgName) return null;

  return (
    <div className="flex items-center gap-1.5 text-[12px] text-slate-500 font-medium truncate">
      <span className="truncate">{orgName}</span>
      {isVerified && <VerifiedTick isVerified={true} className="w-3.5 h-3.5 shrink-0" />}
      {orgLogo && (
        <img src={orgLogo} alt={orgName} className="w-3.5 h-3.5 rounded-sm object-cover shrink-0 ml-0.5" />
      )}
    </div>
  );
}
