const { createClient } = require('@supabase/supabase-js');
const projectId = "oaielnxqahmywdpisomd";
const publicAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9haWVsbnhxYWhteXdkcGlzb21kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1MDk1OTgsImV4cCI6MjA5NjA4NTU5OH0.jYhn5D7ne4kQJs6InDBTVhcQOopKlbmp-z6ldcS26b8";

const supabase = createClient(`https://${projectId}.supabase.co`, publicAnonKey);

async function main() {
  const { data, error } = await supabase.rpc('verify_email_token', {
    token_val: 'dummy-token'
  });

  if (error) {
    console.error('RPC Call Error:', error.message, error);
  } else {
    console.log('RPC Call Success. Return value:', data);
  }
}
main();
