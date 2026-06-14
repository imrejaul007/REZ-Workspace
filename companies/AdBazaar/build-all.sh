#!/bin/bash
# Build all AdBazaar services
# Usage: ./build-all.sh

set -e

echo "🔨 Building all AdBazaar services..."
echo ""

success=0
failed=0

for dir in */; do
  if [ -f "$dir/package.json" ]; then
    echo "Building $dir..."
    cd "$dir"
    
    if npm run build 2>/dev/null; then
      echo "  ✅ $dir built"
      success=$((success+1))
    else
      echo "  ❌ $dir failed"
      failed=$((failed+1))
    fi
    
    cd ..
    echo ""
  fi
done

echo "========================================"
echo "Build complete!"
echo "  ✅ Success: $success"
echo "  ❌ Failed: $failed"
echo "========================================"
