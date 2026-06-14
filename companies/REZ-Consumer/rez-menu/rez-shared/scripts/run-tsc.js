#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const pkgDir = path.resolve(__dirname, '..');
const candidates = [
  path.join(pkgDir, 'node_modules', '.bin', 'tsc'),
  path.join(pkgDir, '..', 'node_modules', '.bin', 'tsc'),
  path.join(pkgDir, '..', '..', 'node_modules', '.bin', 'tsc'),
];
const tsc = candidates.find(c => fs.existsSync(c)) || 'tsc';
try { execSync(`"${tsc}"`, { stdio: 'inherit', cwd: pkgDir }); } catch { process.exit(1); }
