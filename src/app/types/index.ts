/**
 * Centralized domain types for Patchwork.
 * All interfaces here reflect the camelCase-normalized shape returned by normalizeRow().
 */

// ---------------------------------------------------------------------------
// Core domain types
// ---------------------------------------------------------------------------

export interface RoomObserver {
  observerId: string;
  roomId: string;
  joinedAt?: string;
}

export interface Update {
  id: string;
  roomId: string;
  authorId: string;
  authorName: string;
  content: string;
  type?: string;
  mediaUrl?: string | null;
  codeSnippet?: string | null;
  figmaUrl?: string | null;
  draft?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Reaction {
  id: string;
  roomId: string;
  updateId: string;
  observerId: string;
  observerName: string;
  type: string;
  text?: string | null;
  createdAt: string;
}

export interface Room {
  id: string;
  title: string;
  description?: string | null;
  status: 'active' | 'shipped' | 'paused' | 'completed' | 'draft' | 'stalled';
  builderId: string;
  builderName: string;
  builderIsVerifiedExpert?: boolean;
  builderOrgName?: string | null;
  builderOrgLogo?: string | null;
  builderAvatarUrl?: string | null;
  tags?: string[];
  coverImage?: string | null;
  primaryLink?: string | null;
  projectStage?: string | null;
  primaryGoal?: string | null;
  isPrivate?: boolean;
  inviteToken?: string | null;
  whitelistedDomains?: string[] | null;
  observerCount?: number;
  updateCount?: number;
  latestUpdate?: { content: string; createdAt: string } | null;
  createdAt: string;
  updatedAt: string;
  retrospectiveNote?: string | null;

  // Joined / hydrated relations (not always present)
  updates?: Update[];
  reactions?: Reaction[];
  roomObservers?: RoomObserver[];
}

export interface Profile {
  id: string;
  email: string;
  name: string;
  role: 'builder' | 'observer' | 'admin';
  reputation?: number;
  bio?: string | null;
  avatarUrl?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  website?: string | null;
  twitter?: string | null;
  isVerifiedExpert?: boolean;
  onboardingCallScheduled?: boolean;
  signupCompletedAt?: string | null;
  followerCount?: number;
  followers?: string[];
  followingCount?: number;
  isFollowing?: boolean;
  organizationName?: string | null;
  organizationLogoUrl?: string | null;
  createdAt?: string;
}

// ---------------------------------------------------------------------------
// Observer stats
// ---------------------------------------------------------------------------

export interface ObserverStats {
  totalReactions: number;
  sharpInsights: number;
  shippedProducts: number;
  roomsFollowed: number;
}

// ---------------------------------------------------------------------------
// Reaction config (used across BuildRoom / RoomFeed)
// ---------------------------------------------------------------------------

export interface ReactionConfigEntry {
  emoji: string;
  label: string;
  color: string;
  badge: string;
}

export type ReactionConfig = Record<string, ReactionConfigEntry>;
