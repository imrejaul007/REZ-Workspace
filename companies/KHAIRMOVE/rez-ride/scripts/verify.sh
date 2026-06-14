#!/bin/bash
# ReZ Ride - Verify Mobile Apps

echo "============================================"
echo "ReZ Ride - Verifying Mobile Apps"
echo "============================================"
echo ""

check_file() {
    if [ -f "$1" ]; then
        echo "✅ $1"
    else
        echo "❌ $1 - MISSING"
    fi
}

check_dir() {
    if [ -d "$1" ]; then
        echo "✅ $1/"
    else
        echo "❌ $1/ - MISSING"
    fi
}

# =============================================
# USER APP
# =============================================
echo "USER APP"
echo "---------"
cd apps/user-app

check_file "package.json"
check_file "app.json"
check_file "babel.config.js"
check_file "metro.config.js"
check_file "index.js"
check_file "tsconfig.json"
check_dir "src/screens"
check_dir "src/services"
check_dir "src/stores"
check_dir "src/api"
check_dir "assets"

echo ""

# Count screens
SCREEN_COUNT=$(ls src/screens/*.tsx 2>/dev/null | wc -l | tr -d ' ')
echo "Screens: $SCREEN_COUNT"

echo ""

# =============================================
# DRIVER APP
# =============================================
echo "DRIVER APP"
echo "----------"
cd ../driver-app

check_file "package.json"
check_file "app.json"
check_file "babel.config.js"
check_file "metro.config.js"
check_file "index.js"
check_file "tsconfig.json"
check_dir "src/screens"
check_dir "src/services"
check_dir "assets"

echo ""

# Count screens
SCREEN_COUNT=$(ls src/screens/*.tsx 2>/dev/null | wc -l | tr -d ' ')
echo "Screens: $SCREEN_COUNT"

echo ""
echo "============================================"
echo "✅ Verification Complete"
echo "============================================"
echo ""
echo "To build:"
echo "  eas login"
echo "  cd apps/user-app && eas build --profile preview --platform all"
echo "  cd apps/driver-app && eas build --profile preview --platform all"
echo ""
