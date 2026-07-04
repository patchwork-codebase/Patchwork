import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  // Check users table
  const { data: users, error: err1 } = await supabase.from('users').select('id, name, avatar, avatar_url').limit(5);
  console.log('Users:', users, err1);

  // Check profiles table
  const { data: profiles, error: err2 } = await supabase.from('profiles').select('id, avatar_url').limit(5);
  console.log('Profiles:', profiles, err2);
  
  // Call RPC
  const { data: rpc, error: err3 } = await supabase.rpc('get_top_observers', { p_builder_id: '867a1eff-b70e-4a93-9ed6-aa3cb2bbd2eb' });
  console.log('RPC:', rpc?.slice(0,2), err3);
}

check();
