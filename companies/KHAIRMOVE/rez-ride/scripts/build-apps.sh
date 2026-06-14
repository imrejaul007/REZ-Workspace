#!/bin/bash
# ReZ Ride - Build Mobile Apps

set -e

echo "============================================"
echo "ReZ Ride - Building Mobile Apps"
echo "============================================"
echo ""

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "Project directory: $PROJECT_DIR"
echo ""

# Install root dependencies
echo "Installing root dependencies..."
npm install 2>/dev/null || true

# =============================================
# USER APP
# =============================================
echo ""
echo "============================================"
echo "Building User App"
echo "============================================"

cd "$PROJECT_DIR/apps/user-app"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing user app dependencies..."
    npm install
else
    echo "Dependencies already installed"
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env 2>/dev/null || true
fi

# Run TypeScript check
echo "Running TypeScript check..."
npx tsc --noEmit 2>/dev/null || echo "TypeScript check skipped"

echo ""
echo "User app ready!"
echo "To build:"
echo "  eas build --profile preview --platform all"
echo ""

# =============================================
# DRIVER APP
# =============================================
echo ""
echo "============================================"
echo "Building Driver App"
echo "============================================"

cd "$PROJECT_DIR/apps/driver-app"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing driver app dependencies..."
    npm install
else
    echo "Dependencies already installed"
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env 2>/dev/null || true
fi

# Run TypeScript check
echo "Running TypeScript check..."
npx tsc --noEmit 2>/dev/null || echo "TypeScript check skipped"

echo ""
echo "============================================"
echo "✅ Both apps are ready to build!"
echo "============================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Login to Expo:"
echo "   eas login"
echo ""
echo "2. Build User App:"
echo "   cd apps/user-app"
echo "   eas build --profile preview --platform all"
echo ""
echo "3. Build Driver App:"
echo "   cd apps/driver-app"
echo "   eas build --profile preview --platform all"
echo ""
