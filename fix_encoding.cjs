const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'supabase', 'migrations', '0025_moderation_queue.sql');

// Read file as buffer
const buffer = fs.readFileSync(filePath);

let content = '';

// Check if it's UTF-16 LE
if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
  content = buffer.toString('utf16le');
} else {
  // If not UTF-16, just read it as utf8 (though it might have UTF8 BOM)
  content = buffer.toString('utf8');
}

// Write back as plain UTF8
fs.writeFileSync(filePath, content, 'utf8');
console.log('Converted 0025_moderation_queue.sql to UTF-8');
