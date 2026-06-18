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
  createdAt: string;
  updatedAt: string;
  created_at?: string;
  updated_at?: string;
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
  github_url?: string | null;
  linkedin_url?: string | null;
  website?: string | null;
  twitter?: string | null;
  isVerifiedExpert?: boolean;
  onboardingCallScheduled?: boolean;
  signupCompletedAt?: string | null;
  followerCount?: number;
  followers?: string[];
  followingCount?: number;
  isFollowing?: boolean;
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
