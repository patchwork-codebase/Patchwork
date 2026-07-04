import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oaielnxqahmywdpisomd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9haWVsbnhxYWhteXdkcGlzb21kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1MDk1OTgsImV4cCI6MjA5NjA4NTU5OH0.jYhn5D7ne4kQJs6InDBTVhcQOopKlbmp-z6ldcS26b8';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: rpc, error: err3 } = await supabase.rpc('get_top_observers', { p_builder_id: '867a1eff-b70e-4a93-9ed6-aa3cb2bbd2eb' });
  console.log('RPC:', JSON.stringify(rpc?.slice(0,2), null, 2), err3);
}

check();
