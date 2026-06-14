#!/bin/bash
rm -rf dist
mkdir -p dist
find src -name "*.ts" ! -name "*.test.ts" -exec tsx --transpile-only {} + 2>/dev/null || true
