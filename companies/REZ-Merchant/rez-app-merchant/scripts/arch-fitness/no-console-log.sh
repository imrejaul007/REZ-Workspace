#!/bin/bash
# MER-MED-05/14 FIX: Detect bare console.log/info/warn/error calls outside __DEV__ blocks.
# Production code should use the centralized logger from @/utils/logger.

set -e

SOURCE_DIR="${1:-app}"
# Find console.log/info/warn/error calls but ignore:
# - __DEV__ blocks (development-only logging is fine)
# - Comments
# - node_modules
COUNT=$(grep -rn --include='*.ts' --include='*.tsx' \
  -e 'console\.log' \
  -e 'console\.info' \
  -e 'console\.warn' \
  -e 'console\.error' \
  "$SOURCE_DIR" 2>/dev/null | \
  grep -v 'node_modules' | \
  grep -v '__DEV__' | \
  grep -v '//.*console\.' | \
  grep -v 'installProductionConsoleGuard' | \
  grep -v 'logger\.error.*console' | \
  grep -v 'redact' | \
  grep -v 'originalError' | \
  grep -v 'logger\.warn.*console' | \
  wc -l | tr -d ' ')

if [ "$COUNT" -gt 0 ]; then
  echo "FAIL: Found $COUNT bare console call(s) in $SOURCE_DIR (outside __DEV__)"
  grep -rn --include='*.ts' --include='*.tsx' \
    -e 'console\.log' \
    -e 'console\.info' \
    -e 'console\.warn' \
    -e 'console\.error' \
    "$SOURCE_DIR" 2>/dev/null | \
    grep -v 'node_modules' | \
    grep -v '__DEV__' | \
    grep -v '//.*console\.' | \
    grep -v 'installProductionConsoleGuard' | \
    grep -v 'logger\.error.*console' | \
    grep -v 'redact' | \
    grep -v 'originalError' | \
    grep -v 'logger\.warn.*console' | \
    head -20
  echo ""
  echo "To fix: Replace bare console calls with logger from '@/utils/logger'"
  exit 1
fi

echo "PASS: No bare console calls found in $SOURCE_DIR"
exit 0
