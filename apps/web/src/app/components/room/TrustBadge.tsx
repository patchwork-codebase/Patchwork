import type { Profile, TrustLevel } from '../../types';

interface TrustBadgeProps {
  profile?: Pick<Profile, 'role' | 'isVerifiedExpert' | 'trustLevelOverride'> | null;
  className?: string;
  size?: 'xs' | 'sm' | 'md';
}

/** Derive trust level from profile fields */
export function getTrustLevel(
  profile?: Pick<Profile, 'role' | 'isVerifiedExpert' | 'trustLevelOverride'> | null
): TrustLevel | null {
  if (!profile) return null;
  if (profile.trustLevelOverride) return profile.trustLevelOverride as TrustLevel;
  if (profile.role === 'admin') return 'Verified Admin';
  if (profile.isVerifiedExpert) return 'Verified Expert';
  if (profile.role === 'builder') return 'Verified Builder';
  return 'Community Contributor';
}

const TRUST_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  'Verified Admin': {
    label: 'Admin',
    color: 'bg-red-500/10 text-red-500 border border-red-500/20',
    icon: '🛡️',
  },
  'Verified Expert': {
    label: 'Expert',
    color: 'bg-amber-500/10 text-amber-600 border border-amber-500/20',
    icon: '⭐',
  },
  'Verified Builder': {
    label: 'Builder',
    color: 'bg-primary-400/10 text-primary-400 border border-primary-400/20',
    icon: '🔨',
  },
  'Verified Investor': {
    label: 'Investor',
    color: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20',
    icon: '💼',
  },
  'Verified Founder': {
    label: 'Founder',
    color: 'bg-violet-500/10 text-violet-600 border border-violet-500/20',
    icon: '🚀',
  },
  'Verified Organization': {
    label: 'Organization',
    color: 'bg-blue-500/10 text-blue-600 border border-blue-500/20',
    icon: '🏢',
  },
  'Founding Member': {
    label: 'Founding Member',
    color: 'bg-orange-500/10 text-orange-600 border border-orange-500/20',
    icon: '🌟',
  },
  'Community Contributor': {
    label: 'Member',
    color: 'bg-slate-100 text-slate-500 border border-slate-200',
    icon: '👤',
  },
};

const SIZE_CLASSES = {
  xs: 'text-[9px] px-1.5 py-0.5 gap-1',
  sm: 'text-[10px] px-2 py-0.5 gap-1',
  md: 'text-[11px] px-2.5 py-1 gap-1.5',
};

/**
 * Displays a user's trust level as a small badge.
 * Derives trust level from profile role + verification status.
 */
export function TrustBadge({ profile, className = '', size = 'sm' }: TrustBadgeProps) {
  const level = getTrustLevel(profile);
  if (!level) return null;

  const config = TRUST_CONFIG[level] ?? TRUST_CONFIG['Community Contributor'];

  return (
    <span
      className={`inline-flex items-center font-bold uppercase tracking-wider rounded-full ${SIZE_CLASSES[size]} ${config.color} ${className}`}
      title={level}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}

/**
 * Returns the label for a room member role — used in team lists and invite cards.
 */
export const ROLE_LABELS: Record<string, { label: string; icon: string; description: string; color: string }> = {
  observer: {
    label: 'Observer',
    icon: '👁️',
    description: 'Can view public updates and react',
    color: 'bg-slate-100 text-slate-600',
  },
  collaborator: {
    label: 'Collaborator',
    icon: '🤝',
    description: 'Can view all updates and contribute',
    color: 'bg-blue-50 text-blue-600',
  },
  team_member: {
    label: 'Team Member',
    icon: '👥',
    description: 'Full access to room content and workspace',
    color: 'bg-indigo-50 text-indigo-600',
  },
  expert: {
    label: 'Expert',
    icon: '⭐',
    description: 'Verified expert with review access',
    color: 'bg-amber-50 text-amber-700',
  },
  investor: {
    label: 'Investor',
    icon: '💼',
    description: 'Access to investor-specific content',
    color: 'bg-emerald-50 text-emerald-700',
  },
  co_founder: {
    label: 'Co-Founder',
    icon: '🚀',
    description: 'Full co-founder access',
    color: 'bg-violet-50 text-violet-700',
  },
  org_member: {
    label: 'Org Member',
    icon: '🏢',
    description: 'Verified organization member',
    color: 'bg-sky-50 text-sky-700',
  },
};
