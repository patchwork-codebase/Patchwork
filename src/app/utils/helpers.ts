export function toCamelCase(key: string) {
  if (key === 'onboarding_call_scheduled' || key === 'signup_completed_at') return key;
  return key.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
}

export function normalizeRow(row: any): any {
  if (!row || typeof row !== 'object') return row;
  return Object.entries(row).reduce((result: any, [key, value]) => {
    const camelKey = toCamelCase(key);
    if (Array.isArray(value)) {
      result[camelKey] = value.map(item => (typeof item === 'object' && item !== null ? normalizeRow(item) : item));
    } else if (value && typeof value === 'object') {
      result[camelKey] = normalizeRow(value);
    } else {
      result[camelKey] = value;
    }
    return result;
  }, {});
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

export function getAvatarUrl(seed: string) {
  if (!seed) return "https://api.dicebear.com/9.x/micah/svg?seed=fallback&backgroundColor=transparent";
  return `https://api.dicebear.com/9.x/micah/svg?seed=${encodeURIComponent(seed)}&backgroundColor=transparent`;
}
