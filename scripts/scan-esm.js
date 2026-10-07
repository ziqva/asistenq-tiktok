const fs = require('fs');
const path = require('path');

function getImports(dir) {
  let files = [];
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      files = files.concat(getImports(full));
    } else if (f.endsWith('.ts')) {
      files.push(full);
    }
  }
  return files;
}

const allTs = getImports('src');
const packages = new Set();

for (const file of allTs) {
  const content = fs.readFileSync(file, 'utf8');
  const importRegex = /(?:import\s+[\s\S]*?from\s+['"]([^'"]+)['"]|require\(['"]([^'"]+)['"]\))/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const mod = match[1] || match[2];
    if (!mod.startsWith('.') && !mod.startsWith('/') && !mod.startsWith('electron')) {
      const name = mod.split('/')[0].startsWith('@') ? mod.split('/').slice(0, 2).join('/') : mod.split('/')[0];
      packages.add(name);
    }
  }
}

console.log('Detected external imports in src/:', Array.from(packages));

for (const pkg of packages) {
  try {
    const resolved = require.resolve(pkg);
    let cur = path.dirname(resolved);
    while (cur && cur !== path.dirname(cur)) {
      const pjson = path.join(cur, 'package.json');
      if (fs.existsSync(pjson)) {
        const data = JSON.parse(fs.readFileSync(pjson, 'utf8'));
        if (data.name === pkg) {
          if (data.type === 'module') {
            console.log('>>> FOUND ESM-ONLY PACKAGE:', pkg, 'at', resolved);
          }
          break;
        }
      }
      cur = path.dirname(cur);
    }
  } catch (err) {
    console.log('Error checking package:', pkg, err.code || err.message);
  }
}
