const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'supabase', 'migrations', '0025_moderation_queue.sql');

let content = fs.readFileSync(filePath, 'utf8');

// Remove UTF-8 BOM if present
if (content.charCodeAt(0) === 0xFEFF) {
  content = content.slice(1);
}
// Remove any leading whitespace or weird chars just in case
content = content.replace(/^\s+/, '');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Removed BOM from 0025_moderation_queue.sql');
