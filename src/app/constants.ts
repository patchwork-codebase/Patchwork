/**
 * Centralised constants for Patchwork.
 *
 * Query keys and channel-name builders live here so that hooks and
 * components never hard-code raw strings and can't accidentally
 * collide with one another.
 */

// ---------------------------------------------------------------------------
// React-Query cache keys
// ---------------------------------------------------------------------------

export const QUERY_KEYS = {
  rooms: (search: string, category: string) => ['rooms', search, category] as const,
  roomDetails: (roomId: string) => ['room-details', roomId] as const,
  userRooms: (userId: string) => ['user-rooms', userId] as const,
  observedRooms: (userId: string) => ['observed-rooms', userId] as const,
  observerStats: (userId: string) => ['observer-stats', userId] as const,
  profile: (userId: string) => ['profile', userId] as const,
  feedUpdates: ['feed-updates-v2'] as const,
  notifications: (userId: string) => ['notifications', userId] as const,
  dashboardStats: (userId: string) => ['dashboard-stats', userId] as const,
  recentActivity: (userId: string) => ['recent-activity', userId] as const,
  roomObservers: (roomId: string) => ['room-observers', roomId] as const,
} as const;

// ---------------------------------------------------------------------------
// Supabase Realtime channel name builders
// Supabase channel topics are prefixed with `realtime:` internally so
// we use stable, human-readable names and let removeStaleChannel handle the
// lookup by exact topic string.
// ---------------------------------------------------------------------------

export const CHANNEL_NAMES = {
  publicRooms: 'public-rooms',
  feedUpdates: 'feed-updates-live',
  roomDetails: (roomId: string) => `room-details-${roomId}`,
  userRooms: (userId: string) => `user-rooms-${userId}`,
  observedRooms: (userId: string) => `observed-rooms-${userId}`,
  userProfile: (userId: string) => `user-profile-${userId}`,
} as const;

// ---------------------------------------------------------------------------
// Predefined Categories for Explore Builders
// ---------------------------------------------------------------------------
export const EXPLORE_CATEGORIES = [
  "All",
  "Design",
  "Product",
  "Engineering",
  "Marketing",
  "Growth",
  "Community"
] as const;
