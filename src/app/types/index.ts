/**
 * Centralized domain types for Patchwork.
 * All interfaces here reflect the camelCase-normalized shape returned by normalizeRow().
 */

// ---------------------------------------------------------------------------
// IP Protection & Trust — shared enums
// ---------------------------------------------------------------------------

export type RoomVisibility = 'public' | 'unlisted' | 'private' | 'org_only' | 'nda_protected';

export type RoomMemberRole =
  | 'observer'
  | 'collaborator'
  | 'team_member'
  | 'expert'
  | 'investor'
  | 'co_founder'
  | 'org_member';

export type TrustLevel =
  | 'Verified Builder'
  | 'Verified Expert'
  | 'Verified Investor'
  | 'Verified Founder'
  | 'Verified Organization'
  | 'Community Contributor'
  | 'Founding Member'
  | 'Verified Admin';

/** Per-artifact-type visibility overrides stored as JSON on the room */
export interface ContentPermissions {
  documents?: RoomMemberRole | 'public' | 'private';
  decisions?: RoomMemberRole | 'public' | 'private';
  designs?: RoomMemberRole | 'public' | 'private';
  images?: RoomMemberRole | 'public' | 'private';
  videos?: RoomMemberRole | 'public' | 'private';
  research?: RoomMemberRole | 'public' | 'private';
  notes?: RoomMemberRole | 'public' | 'private';
  files?: RoomMemberRole | 'public' | 'private';
}

/** Content protection flags stored as JSON on the room */
export interface ProtectionFlags {
  disableDownloads?: boolean;
  disableCopy?: boolean;
  watermark?: boolean;
  blurSensitiveSections?: boolean;
  requirePermissionToOpen?: boolean;
}

// ---------------------------------------------------------------------------
// Core domain types
// ---------------------------------------------------------------------------

export interface RoomObserver {
  observerId: string;
  roomId: string;
  role?: RoomMemberRole;
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

  // Privacy (legacy + new)
  isPrivate?: boolean;                           // kept for backward-compat; derived from visibility
  visibility?: RoomVisibility;                   // canonical privacy level
  inviteToken?: string | null;
  whitelistedDomains?: string[] | null;

  // IP Protection fields
  contentPermissions?: ContentPermissions | null;
  protectionFlags?: ProtectionFlags | null;
  ndaText?: string | null;                       // null = use global NDA template
  authorshipTimestamp?: string | null;           // ISO timestamp of room creation

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
  domain_reputation?: Record<string, number>;
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
  expertAvailable?: boolean;
  expertOpenSlots?: number;
  expertAvgResponseHours?: number;
  expertLevel?: 'bronze' | 'silver' | 'gold' | 'platinum';
  expertDomains?: string[];
  expertReviewScore?: number;
  expertReviewsCompleted?: number;
  expertAcceptanceRate?: number;
  expertStripeAccountId?: string | null;
  expertPricePerReview?: number;
  interests?: string[];
  createdAt?: string;
  city?: string;
  domain?: string;
  emailVerified?: boolean;
  gender?: string;
  phoneCountryCode?: string;
  phoneNumber?: string;
  skills?: string[];
  avatar?: string | null; // legacy map for AuthContext
  signup_completed_at?: string | null; // legacy map for AuthContext
  github_url?: string | null; // legacy map for AuthContext
  linkedin_url?: string | null; // legacy map for AuthContext
  trustLevelOverride?: string | null;
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
  desc: string;
}

export type ReactionConfig = Record<string, ReactionConfigEntry>;

// ---------------------------------------------------------------------------
// IP Protection & Trust — new table types
// ---------------------------------------------------------------------------

export type AccessLogAction =
  | 'viewed'
  | 'joined'
  | 'left'
  | 'downloaded_file'
  | 'exported_doc'
  | 'copied_invite_link'
  | 'nda_accepted'
  | 'nda_declined'
  | 'invited'
  | 'invitation_accepted'
  | 'invitation_declined'
  | 'invitation_revoked'
  | 'removed'
  | 'role_changed';

export interface AccessLogEntry {
  id: string;
  roomId: string;
  userId?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  action: AccessLogAction;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export type BuildTimelineEventType =
  | 'room_created'
  | 'room_visibility_changed'
  | 'update_posted'
  | 'decision_logged'
  | 'file_uploaded'
  | 'design_shared'
  | 'milestone_reached'
  | 'research_added'
  | 'note_added'
  | 'doc_linked'
  | 'member_joined'
  | 'expert_review_requested'
  | 'expert_review_completed'
  | 'nda_accepted'
  | 'room_closed';

export interface BuildTimelineEvent {
  id: string;
  roomId: string;
  actorId?: string | null;
  actorName: string;
  eventType: BuildTimelineEventType;
  eventSummary: string;
  eventData?: Record<string, unknown>;
  versionHash?: string | null;
  createdAt: string;
}

export interface NdaAcceptance {
  id: string;
  roomId: string;
  userId: string;
  ndaVersion: string;
  acceptedAt: string;
  userAgent?: string | null;
}

export interface NdaTemplate {
  version: string;
  title: string;
  body: string;
}
