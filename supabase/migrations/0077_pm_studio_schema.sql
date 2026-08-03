-- PM Studio MVP Schema

-- 1. PM Profiles
CREATE TABLE pm_profile (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    total_case_studies_completed INTEGER DEFAULT 0,
    total_decisions_completed INTEGER DEFAULT 0,
    learning_streak INTEGER DEFAULT 0,
    hours_practiced NUMERIC DEFAULT 0.0,
    average_ai_score NUMERIC DEFAULT 0.0
);

-- 2. PM Skills
CREATE TABLE pm_skills (
    user_id UUID PRIMARY KEY REFERENCES pm_profile(id) ON DELETE CASCADE,
    product_discovery_score NUMERIC DEFAULT 0.0,
    strategy_score NUMERIC DEFAULT 0.0,
    prioritization_score NUMERIC DEFAULT 0.0,
    customer_thinking_score NUMERIC DEFAULT 0.0,
    communication_score NUMERIC DEFAULT 0.0,
    analytics_score NUMERIC DEFAULT 0.0,
    execution_score NUMERIC DEFAULT 0.0,
    leadership_score NUMERIC DEFAULT 0.0,
    product_sense_score NUMERIC DEFAULT 0.0,
    stakeholder_management_score NUMERIC DEFAULT 0.0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Case Studies
CREATE TABLE pm_case_studies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
    estimated_time_minutes INTEGER NOT NULL,
    initial_context JSONB NOT NULL, -- e.g., analytics, constraints, feedback
    category TEXT NOT NULL
);

-- 4. Case Attempts
CREATE TABLE pm_case_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_study_id UUID REFERENCES pm_case_studies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL CHECK (status IN ('In Progress', 'Completed', 'Abandoned')),
    user_responses JSONB DEFAULT '[]'::jsonb,
    ai_evaluation JSONB,
    overall_score NUMERIC
);

-- 5. Decision Scenarios
CREATE TABLE pm_decision_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT NOT NULL,
    context TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
    category TEXT NOT NULL
);

-- 6. Decision Attempts
CREATE TABLE pm_decision_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID REFERENCES pm_decision_scenarios(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_reasoning TEXT NOT NULL,
    ai_evaluation JSONB NOT NULL, -- includes strengths, weaknesses, score breakdown
    overall_score NUMERIC NOT NULL
);

-- 7. PM Scores (Historical Tracking)
CREATE TABLE pm_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('Case Study', 'Decision')),
    activity_id UUID NOT NULL, -- references either pm_case_attempts or pm_decision_attempts
    product_discovery_impact NUMERIC DEFAULT 0.0,
    prioritization_impact NUMERIC DEFAULT 0.0,
    strategic_thinking_impact NUMERIC DEFAULT 0.0,
    customer_focus_impact NUMERIC DEFAULT 0.0,
    communication_impact NUMERIC DEFAULT 0.0,
    analytics_impact NUMERIC DEFAULT 0.0,
    execution_impact NUMERIC DEFAULT 0.0,
    overall_score NUMERIC NOT NULL
);

-- 8. PM Activity Feed
CREATE TABLE pm_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    activity_type TEXT NOT NULL, -- e.g., 'Completed Case Study', 'Earned Badge'
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- RLS Policies
ALTER TABLE pm_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_case_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_case_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_decision_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_decision_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_activity ENABLE ROW LEVEL SECURITY;

-- Allow users to read all profiles but only update their own
CREATE POLICY "Users can read all PM profiles" ON pm_profile FOR SELECT USING (true);
CREATE POLICY "Users can update own PM profile" ON pm_profile FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can read all PM skills" ON pm_skills FOR SELECT USING (true);
CREATE POLICY "Users can update own PM skills" ON pm_skills FOR UPDATE USING (auth.uid() = user_id);

-- Case studies and scenarios are public read
CREATE POLICY "Case studies are public" ON pm_case_studies FOR SELECT USING (true);
CREATE POLICY "Decision scenarios are public" ON pm_decision_scenarios FOR SELECT USING (true);

-- Attempts and scores are private to the user
CREATE POLICY "Users can manage own case attempts" ON pm_case_attempts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own decision attempts" ON pm_decision_attempts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own scores" ON pm_scores FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own activity" ON pm_activity FOR ALL USING (auth.uid() = user_id);

-- Seeding MVP Decision Scenarios
INSERT INTO pm_decision_scenarios (title, context, difficulty, category) VALUES
('The Growth Dilemma', 'Revenue has declined. Marketing wants discounts. Engineering wants infrastructure improvements. Sales wants new features. Customer Support wants bug fixes.', 'Intermediate', 'Prioritization'),
('Launch Week Crisis', 'A critical production bug appears during launch week. Delay launch or continue?', 'Advanced', 'Execution'),
('Aggressive Growth vs Satisfaction', 'Leadership wants aggressive growth. Customer satisfaction is declining. Where do you invest?', 'Intermediate', 'Strategy'),
('Resource Halving', 'Engineering capacity is reduced by 50%. How do you reprioritise the roadmap?', 'Advanced', 'Prioritization'),
('The Whale Dilemma', 'Your largest customer requests a custom feature. Building it delays your public roadmap. What do you do?', 'Intermediate', 'Customer Thinking');

-- Seeding MVP Case Study
INSERT INTO pm_case_studies (title, description, difficulty, estimated_time_minutes, initial_context, category) VALUES
('Spotify Retention Drop', 'You''ve just joined Spotify as a Product Manager. Your retention has dropped by 18%. Analyze the situation and turn it around.', 'Intermediate', 30, '{"analytics": "Retention down 18% MoM in US market.", "feedback": "Users complaining about podcast UI taking over music.", "constraints": "Engineering is locked in Q3 for backend migration."}', 'Product Discovery');
