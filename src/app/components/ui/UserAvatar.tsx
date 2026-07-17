import React, { useState } from 'react';
import { useAvatar } from '../../hooks/useAvatar';

export interface UserAvatarProps {
  /** The unique ID of the user (highest priority for fetching real avatar) */
  userId: string;
  /** The name of the user (used for alt text and fallback generation) */
  name?: string | null;
  /** A direct URL to an avatar (e.g. from an API response) */
  avatarUrl?: string | null;
  /** Tailwind classes to apply to the image element */
  className?: string;
  /** Whether the image should be lazy loaded (defaults to true) */
  lazy?: boolean;
}

export function UserAvatar({ 
  userId, 
  name, 
  avatarUrl, 
  className = "w-full h-full object-cover",
  lazy = true
}: UserAvatarProps) {
  const reactiveUrl = useAvatar(userId, name, avatarUrl);
  const [hasError, setHasError] = useState(false);

  // If the image fundamentally fails to load (e.g. 404, network error, invalid url)
  // we fallback to a simple robust initial gradient.
  if (hasError && name) {
    return (
      <div className={`bg-gradient-to-br from-primary-500 to-violet-500 flex items-center justify-center ${className}`}>
        <span style={{ color: 'white', fontWeight: 900 }} className="text-[0.4em] leading-none drop-shadow-sm">
          {name.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }

  if (hasError && !name) {
    return (
      <div className={`bg-slate-200 flex items-center justify-center ${className}`}>
        <span style={{ color: 'white', fontWeight: 900 }} className="text-[0.4em] leading-none drop-shadow-sm">
          ?
        </span>
      </div>
    );
  }

  return (
    <img 
      src={reactiveUrl}
      alt={name || "User avatar"}
      className={className}
      onError={() => setHasError(true)}
      loading={lazy ? "lazy" : undefined}
    />
  );
}
