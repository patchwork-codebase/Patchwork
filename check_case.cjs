const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory() && !file.includes('node_modules') && !file.includes('.git')) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src');
const errors = [];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const regex = /from\s+['"](\.[^'"]+)['"]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const importPath = match[1];
    const dir = path.dirname(file);
    let target = path.resolve(dir, importPath);
    let found = false;
    
    // Check extensions
    const exts = ['', '.ts', '.tsx', '/index.ts', '/index.tsx'];
    for (const ext of exts) {
      if (fs.existsSync(target + ext)) {
        target += ext;
        found = true;
        break;
      }
    }
    
    if (found) {
      const realPath = fs.realpathSync(target);
      if (realPath !== target) {
        errors.push(`Exact case mismatch: ${importPath} in ${file}\n  Requested: ${target}\n  Real path: ${realPath}`);
      }
    }
  }
});

console.log('Checking imports...');
if (errors.length) {
  console.log(errors.join('\n'));
} else {
  console.log('No case mismatches found.');
}
