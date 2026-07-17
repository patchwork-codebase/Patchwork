export const STORAGE_KEYS = {
  cookieConsent: "cookieConsent",
  lastVerificationSent: "lastVerificationSent",
  welcomeTourSeen: (userId: string) => `welcome_tour_seen_${userId}`,
  observerRoomStep: (userId: string) => `observer_room_step_${userId}`,
  checklistDismissed: (userId: string) => `checklist_dismissed_${userId}`,
};

export function toCamelCase(key: string) {
  return key.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
}

export function normalizeRow<T = unknown>(row: unknown): T {
  if (!row || typeof row !== 'object') return row as T;
  return Object.entries(row).reduce((result: Record<string, unknown>, [key, value]) => {
    const camelKey = toCamelCase(key);
    if (Array.isArray(value)) {
      result[camelKey] = value.map(item => (typeof item === 'object' && item !== null ? normalizeRow(item) : item));
    } else if (value && typeof value === 'object') {
      result[camelKey] = normalizeRow(value);
    } else {
      result[camelKey] = value;
    }
    return result;
  }, {} as Record<string, unknown>) as T;
}

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

import { avatarStore } from './avatarStore';

export function registerAvatarUrl(userId: string, url: string | null | undefined) {
  if (userId && url && url.startsWith('http')) {
    avatarStore.set(userId, url);
  }
}

export function getAvatarUrl(seed: string) {
  if (!seed) return "https://api.dicebear.com/9.x/micah/svg?seed=fallback&backgroundColor=transparent";
  if (seed.startsWith('http')) return seed;
  
  // Check global store for a real uploaded photo by this userId
  const cached = avatarStore.get(seed);
  if (cached) return cached;
  
  return `https://api.dicebear.com/9.x/micah/svg?seed=${encodeURIComponent(seed)}&backgroundColor=transparent`;
}


/**
 * Returns the accurate observer count for a room.
 * The `observer_count` DB column can lag behind the actual join table,
 * so we prefer the length of the loaded `roomObservers` array when available.
 */
export function getObserverCount(room: {
  observerCount?: number | null;
  roomObservers?: { observerId: string }[] | null;
}): number {
  if (room.roomObservers && room.roomObservers.length > 0) {
    return room.roomObservers.length;
  }
  return room.observerCount ?? 0;
}

/**
 * Generates a URL to add a certification to a user's LinkedIn profile.
 */
export function generateLinkedInCertUrl(title: string, dateIso: string, credentialUrl: string, orgId?: string) {
  const baseUrl = "https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME";
  const name = encodeURIComponent(title);
  
  const date = new Date(dateIso);
  const issueYear = date.getFullYear();
  const issueMonth = date.getMonth() + 1; // 1-12
  
  let url = `${baseUrl}&name=${name}&issueYear=${issueYear}&issueMonth=${issueMonth}&certUrl=${encodeURIComponent(credentialUrl)}`;
  if (orgId) {
    url += `&organizationId=${orgId}`;
  }
  
  return url;
}
