const fs = require('fs');
const path = require('path');
const content = fs.readFileSync('src/routeGroups.js', 'utf-8');
const imports = content.match(/import\(['"](.*?)['"]\)/g);
if (imports) {
  imports.forEach(imp => {
    const p = imp.match(/import\(['"](.*?)['"]\)/)[1];
    let resolved = path.join('src', p);
    if (!fs.existsSync(resolved) && !fs.existsSync(resolved + '.jsx') && !fs.existsSync(resolved + '.js')) {
      console.log('MISSING:', resolved);
    }
  });
} else {
  console.log('No imports found');
}
