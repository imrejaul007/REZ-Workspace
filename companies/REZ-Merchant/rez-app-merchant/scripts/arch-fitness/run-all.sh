#!/bin/bash
# MER-MED-14 FIX: Master runner for all arch-fitness tests.
# Run all architectural compliance checks against the merchant app.

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="${1:-app}"

echo "Running arch-fitness tests on: $APP_DIR"
echo "============================================"

PASS=0
FAIL=0

for script in "$SCRIPT_DIR"/no-*.sh; do
  name=$(basename "$script" .sh)
  echo ""
  echo "--- $name ---"
  if bash "$script" "$APP_DIR"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
  fi
done

echo ""
echo "============================================"
echo "Results: $PASS passed, $FAIL failed"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
