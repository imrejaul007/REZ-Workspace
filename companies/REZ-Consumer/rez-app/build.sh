#!/bin/bash
# REZ App Build Script
# Run from REZ-App directory

set -e

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Building from: $(pwd)"
echo "Contents:"
ls -la

# Build for Android
echo "Building Android..."
eas build --platform android --profile preview --non-interactive

# Build for iOS (requires Apple credentials)
# echo "Building iOS..."
# eas build --platform ios --profile preview --non-interactive
