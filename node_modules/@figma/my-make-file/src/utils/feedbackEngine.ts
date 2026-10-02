export type FeedbackCategory = 'Bug' | 'Idea' | 'Critique' | 'Encouragement' | 'Uncategorized';

export interface FeedbackAnalysis {
  category: FeedbackCategory;
  signalScore: number;
}

export function analyzeFeedbackSignal(content: string, isExpert: boolean = false): FeedbackAnalysis {
  if (!content || content.trim().length === 0) {
    return { category: 'Uncategorized', signalScore: 0 };
  }

  const text = content.toLowerCase();
  let category: FeedbackCategory = 'Uncategorized';

  // 1. Categorization Heuristics
  const bugRegex = /(broken|error|bug|issue|crash|fix|glitch|not working|fail)/i;
  const ideaRegex = /(what if|suggest|idea|could you|feature|maybe try|would be cool|what about)/i;
  const critiqueRegex = /(confusing|hard to use|contrast|improve|ux|ui|layout|clunky|weird)/i;
  const encouragementRegex = /(awesome|great job|fire|looks good|love this|congrats|amazing|nice|cool|wow)/i;

  if (bugRegex.test(text)) category = 'Bug';
  else if (ideaRegex.test(text)) category = 'Idea';
  else if (critiqueRegex.test(text)) category = 'Critique';
  else if (encouragementRegex.test(text)) category = 'Encouragement';

  // 2. Signal Scoring Heuristics
  let score = 0;

  // A. Length & Depth (Max 40 points)
  // Give 1 point for every 10 characters, capped at 40 points.
  const lengthScore = Math.min(40, Math.floor(content.length / 10));
  score += lengthScore;

  // B. Observer Reputation (Multiplier/Bonus)
  if (isExpert) {
    score += 30; // Verified experts get an instant +30 bump
  }

  // C. Question Density (Max 20 points)
  // Engagement often comes as questions.
  const questionCount = (content.match(/\?/g) || []).length;
  score += Math.min(20, questionCount * 10);

  // D. Formatting / Effort (Max 20 points)
  // High effort usually involves markdown.
  if (content.includes('```') || content.includes('`')) score += 10; // Code snippets
  if (content.includes('- ') || content.includes('* ')) score += 10; // Bullet points
  if (content.includes('http') || content.match(/\[.*\]\(.*\)/)) score += 10; // Links

  // Cap score at 100
  score = Math.min(100, score);

  return {
    category,
    signalScore: score
  };
}
