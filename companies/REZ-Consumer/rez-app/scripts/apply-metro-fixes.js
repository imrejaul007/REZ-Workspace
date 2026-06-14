#!/usr/bin/env node
/**
 * Post-install script to apply defensive null-check fixes to @expo/metro-config
 * This is needed because patch-package can't handle @expo/metro-config due to version conflicts.
 * Run automatically via postinstall in package.json or manually.
 */

const fs = require('fs');
const path = require('path');

const packageName = '@expo/metro-config';
const nodeModulesPath = path.join(__dirname, '..', 'node_modules', packageName);
const filePath = path.join(nodeModulesPath, 'build', 'serializer', 'serializeChunks.js');

function applyFixes() {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ ${filePath} not found, skipping metro-config fixes`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    // Fix 1: Add null check to pathToRegex function
    if (!content.includes('if (typeof path !== \'string\')')) {
      const oldPathToRegex = `function pathToRegex(path) {
    // Escape regex special characters, except for '*'
    let regexSafePath = path.replace`;

      const newPathToRegex = `function pathToRegex(path) {
    if (typeof path !== 'string') {
        return /^$/;
    }
    // Escape regex special characters, except for '*'
    let regexSafePath = path.replace`;

      content = content.replace(oldPathToRegex, newPathToRegex);
    }

    // Fix 2: Add null check for absolutePath in getComputedPathsForAsyncDependencies
    if (!content.includes('// Guard against undefined absolutePath')) {
      const oldCode = `if (dependency.data.data.asyncType) {
                    const chunkContainingModule`;

      const newCode = `if (dependency.data.data.asyncType) {
                    // Guard against undefined absolutePath
                    if (dependency.absolutePath == null) {
                        return;
                    }
                    const chunkContainingModule`;

      content = content.replace(oldCode, newCode);
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Applied defensive fixes to @expo/metro-config');
  } catch (error) {
    console.error('⚠️ Failed to apply metro-config fixes:', error.message);
  }
}

applyFixes();
