export interface Badge {
  id: string;
  title: string;
  description: string;
  badge_type: 'level' | 'achievement' | 'recognition';
  icon_name: string;
  color_theme: string;
  points_required: number;
  created_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  evidence_url?: string;
  verified: boolean;
  issued_at: string;
  badge?: Badge; // Expanded in Supabase join
}

export interface ReputationEvent {
  id: string;
  user_id: string;
  room_id?: string;
  action_type: string;
  points: number;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// Derived type for frontend logic
export interface BuilderLevel {
  currentLevel: Badge;
  nextLevel?: Badge;
  progress: number; // 0 to 100
  pointsToNext: number;
}
