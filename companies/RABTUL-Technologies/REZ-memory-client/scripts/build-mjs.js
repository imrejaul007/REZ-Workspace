const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'dist');
const files = fs.readdirSync(srcDir);

for (const file of files) {
  if (file.endsWith('.js')) {
    const content = fs.readFileSync(path.join(srcDir, file), 'utf8');
    const mjsContent = content
      .replace(/require\(/g, 'require(')
      .replace(/exports\./g, 'exports.')
      .replace(/module\.exports/g, 'exports');
    fs.writeFileSync(path.join(srcDir, file.replace('.js', '.mjs')), mjsContent);
  }
}
console.log('ESM build complete');
