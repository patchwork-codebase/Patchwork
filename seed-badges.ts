import { supabase } from './src/app/components/auth/AuthContext';

async function seed() {
  const { data: existing } = await supabase.from('badges').select('*').eq('badge_type', 'recognition');
  
  if (existing && existing.length < 4) {
    console.log("Seeding badges...");
    await supabase.from('badges').insert([
      { title: 'Community Leader', description: 'Hosted 5 or more highly active build rooms.', badge_type: 'recognition', icon_name: 'award', color_theme: 'emerald', points_required: 0 },
      { title: 'Top 1% Contributor', description: 'Consistently provided top-tier feedback.', badge_type: 'recognition', icon_name: 'star', color_theme: 'amber', points_required: 0 },
      { title: 'Bug Hunter', description: 'Identified and fixed critical issues during builds.', badge_type: 'recognition', icon_name: 'shield', color_theme: 'rose', points_required: 0 }
    ]);
  }
  
  const { data } = await supabase.from('badges').select('*').eq('badge_type', 'recognition');
  console.log("Badges:", JSON.stringify(data, null, 2));
}

seed();
