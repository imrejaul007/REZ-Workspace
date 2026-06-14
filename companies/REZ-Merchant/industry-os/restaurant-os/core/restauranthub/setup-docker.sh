#!/bin/bash

# Docker Installation Script for macOS
echo "🚀 Resturistan App - Docker Setup Script"
echo "========================================"
echo ""

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ This script is for macOS only"
    exit 1
fi

echo "📦 Docker Desktop is required but not installed."
echo ""
echo "Please install Docker Desktop manually:"
echo ""
echo "1. Visit: https://www.docker.com/products/docker-desktop/"
echo "2. Download Docker Desktop for Mac"
echo "3. Install the application"
echo "4. Start Docker Desktop from Applications"
echo "5. Wait for Docker to be ready (icon in menu bar)"
echo ""
echo "After installation, run this verification command:"
echo "  docker --version"
echo ""
echo "Then run the setup script again:"
echo "  ./start-infrastructure.sh"