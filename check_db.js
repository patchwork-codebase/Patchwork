import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const supabaseUrl = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const supabaseServiceKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
  console.log("Checking expert_applications table...");
  const { data: apps, error: err1 } = await supabase.from('expert_applications').select('*');
  if (err1) {
    console.error("Error fetching apps:", err1);
  } else {
    console.log("Found applications:", apps.length);
    console.log(apps);
  }

  console.log("\nChecking admins in users table...");
  const { data: users, error: err2 } = await supabase.from('users').select('id, name, email, role');
  if (err2) {
    console.error("Error fetching users:", err2);
  } else {
    console.log("Admins:", users.filter(u => u.role === 'admin' || u.role === 'superadmin'));
  }
}

check();
