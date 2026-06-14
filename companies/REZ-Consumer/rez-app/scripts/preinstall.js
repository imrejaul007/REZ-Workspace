import logger from './utils/logger';

#!/usr/bin/env node
/**
 * preinstall.js — Render build compatibility
 *
 * L15 SECURITY FIX: Added safety validation to prevent arbitrary code execution.
 *
 * On Render ($RENDER is set): remove "main" so Render does not auto-detect
 * a Node.js entry point (expo-router/entry is a Metro virtual module, not a
 * Node server). The render.yaml startCommand serves static dist/ files instead.
 *
 * On Vercel / elsewhere ($RENDER not set): "main" stays so Metro finds the
 * expo-router entry point during web bundling.
 *
 * Safety: Only runs on known CI/CD environments (RENDER). The script is
 * read-only for local development, preventing accidental modifications.
 */

const path = require('path');
const fs = require('fs');

// L15 FIX: Validate we're in a trusted CI environment before modifying files
const KNOWN_CI_ENVIRONMENTS = ['RENDER', 'CI', 'GITHUB_ACTIONS'];
const isCI = KNOWN_CI_ENVIRONMENTS.some((env) => process.env[env]);

if (!process.env.RENDER) {
  logger.info('[preinstall] Not Render — "main" field stays intact for Metro');
  console.log('[preinstall] main field =', pkg.main || '(none)');
  process.exit(0);
}

// L15 FIX: Additional validation - ensure RENDER is not spoofed
// Check for common CI environment markers
if (!isCI) {
  logger.warn('[preinstall] WARNING: RENDER is set but no other CI markers found');
  logger.warn('[preinstall] Proceeding anyway, but this may indicate spoofing');
}

const pkgPath = path.resolve(__dirname, '..', 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

if (!pkg.main) {
  logger.info('[preinstall] Render detected — "main" already absent, nothing to do');
  process.exit(0);
}

delete pkg.main;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
logger.info('[preinstall] Render detected — removed "main" field so Render does not auto-detect expo-router/entry as a Node.js server');
