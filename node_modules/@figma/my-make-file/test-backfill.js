const url = 'https://oaielnxqahmywdpisomd.supabase.co/functions/v1/backfill-welcome-emails';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9haWVsbnhxYWhteXdkcGlzb21kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1MDk1OTgsImV4cCI6MjA5NjA4NTU5OH0.jYhn5D7ne4kQJs6InDBTVhcQOopKlbmp-z6ldcS26b8';

async function test() {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  });
  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Result:', text);
}
test();
