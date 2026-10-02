
const url = 'https://oaielnxqahmywdpisomd.supabase.co/functions/v1/send-password-reset-email';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9haWVsbnhxYWhteXdkcGlzb21kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1MDk1OTgsImV4cCI6MjA5NjA4NTU5OH0.jYhn5D7ne4kQJs6InDBTVhcQOopKlbmp-z6ldcS26b8';

async function test() {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email: 'patchwork020@gmail.com' })
  });
  console.log(res.status);
  const text = await res.text();
  console.log(text);
}
test();
