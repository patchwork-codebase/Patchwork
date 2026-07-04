import { supabase } from './src/app/components/auth/AuthContext';

async function test() {
  const { data, error } = await supabase.from('user_badges').select('*, badge:badges(*)');
  console.log(JSON.stringify(data, null, 2));
  console.log('Error:', error);
}

test();
