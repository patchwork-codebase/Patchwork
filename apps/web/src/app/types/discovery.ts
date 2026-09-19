export interface DiscoveryProject {
  id: string;
  builder_id: string;
  title: string;
  problem_statement?: string;
  audience?: string;
  market?: string;
  pain_level?: string;
  confidence_score: number;
  status: 'active' | 'converted' | 'killed' | 'archived';
  converted_room_id?: string;
  created_at: string;
  updated_at: string;
}

export interface DiscoveryHypothesis {
  id: string;
  project_id: string;
  statement: string;
  success_indicators?: string;
  failure_indicators?: string;
  created_at: string;
  updated_at: string;
}

export interface DiscoveryAssumption {
  id: string;
  project_id: string;
  assumption: string;
  status: 'untested' | 'validated' | 'invalidated';
  created_at: string;
  updated_at: string;
}

export interface DiscoveryInterview {
  id: string;
  project_id: string;
  interviewee_name?: string;
  interviewee_role?: string;
  interviewee_company?: string;
  interview_date?: string;
  notes?: string;
  recording_url?: string;
  summary?: string;
  key_insights?: string;
  created_at: string;
  updated_at: string;
}

export interface DiscoverySignal {
  id: string;
  project_id: string;
  type: string;
  status: 'positive' | 'negative' | 'neutral';
  description?: string;
  impact_weight: number;
  source_reference_id?: string;
  created_at: string;
  updated_at: string;
}

export interface DiscoveryReview {
  id: string;
  project_id: string;
  reviewer_id: string;
  problem_quality?: string;
  research_quality?: string;
  evidence_quality?: string;
  market_opportunity?: string;
  decision_quality?: string;
  general_feedback?: string;
  created_at: string;
  updated_at: string;
}

export interface DiscoveryDecision {
  id: string;
  project_id: string;
  decision: 'proceed_to_build' | 'need_more_research' | 'pivot' | 'kill_idea';
  rationale?: string;
  created_at: string;
}
