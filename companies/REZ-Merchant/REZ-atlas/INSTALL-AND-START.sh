#!/bin/bash

# REZ Atlas - Install Dependencies and Start
# Run this script from REZ-atlas directory

echo "=============================================="
echo "🗺️  REZ ATLAS - Installing & Starting"
echo "=============================================="

cd "$(dirname "$0")"

# Function to install and start service
install_and_start() {
    local name=$1
    local dir=$2
    local port=$3

    echo ""
    echo "📦 Installing $name..."
    if [ -d "$dir" ]; then
        cd "$dir"
        npm install > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            echo "✅ $name installed"
        else
            echo "⚠️  $name install had issues (may be ok)"
        fi
        cd ..
    else
        echo "❌ Directory $dir not found"
    fi
}

# Install core services
echo ""
echo "Installing Core Services..."
install_and_start "Atlas Gateway" "REZ-atlas-gateway" 5150
install_and_start "Atlas Discover" "REZ-atlas-discover" 5151
install_and_start "Atlas Maps" "REZ-atlas-maps" 5152
install_and_start "Atlas Twin" "REZ-atlas-twin" 5153
install_and_start "Atlas Score" "REZ-atlas-score" 5154
install_and_start "Atlas Signals" "REZ-atlas-signals" 5155

echo ""
echo "Installing Sales Intelligence..."
install_and_start "Atlas Territory" "REZ-atlas-territory" 5170
install_and_start "Atlas Routes" "REZ-atlas-routes" 5171
install_and_start "Atlas Copilot" "REZ-atlas-copilot" 5172
install_and_start "Atlas Graph" "REZ-atlas-graph" 5173

echo ""
echo "Installing UI..."
install_and_start "Atlas Dashboard" "REZ-atlas-dashboard" 5190
install_and_start "Atlas Field App" "REZ-atlas-field-app" 5191

echo ""
echo "=============================================="
echo "✅ Installation complete!"
echo "=============================================="
echo ""
echo "To start services manually:"
echo "  cd REZ-atlas-gateway && npm run dev"
echo ""
echo "Or run:"
echo "  ./START-ATLAS.sh"
echo ""
echo "Health checks:"
echo "  curl http://localhost:5150/health"
echo "=============================================="