const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'supabase', 'migrations');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  const policyRegex = /CREATE\s+POLICY\s+"([^"]+)"\s+ON\s+public\.([a-zA-Z0-9_]+)/g;
  
  content = content.replace(policyRegex, (match, policyName, tableName) => {
    modified = true;
    return `DROP POLICY IF EXISTS "${policyName}" ON public.${tableName};\n${match}`;
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
}
