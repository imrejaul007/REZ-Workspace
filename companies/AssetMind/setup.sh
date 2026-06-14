#!/bin/bash

# AssetMind Setup Script
# This script initializes git, sets up environment, and starts the application

set -e  # Exit on error

echo "========================================"
echo "AssetMind Setup Script"
echo "========================================"

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Step 1: Initialize git if not already initialized
echo ""
echo "[1/3] Checking git repository..."
if [ -d ".git" ]; then
    echo "  Git repository already initialized"
else
    echo "  Initializing git repository..."
    git init
    echo "  Git repository initialized"
fi

# Step 2: Create .env from .env.example
echo ""
echo "[2/3] Setting up environment variables..."
if [ -f ".env" ]; then
    echo "  .env file already exists (skipped)"
else
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "  Created .env from .env.example"
        echo "  Please edit .env with your production values before deploying"
    else
        echo "  ERROR: .env.example not found!"
        exit 1
    fi
fi

# Step 3: Run docker-compose up
echo ""
echo "[3/3] Starting services with Docker Compose..."
if ! command -v docker &> /dev/null; then
    echo "  ERROR: Docker is not installed or not in PATH"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "  ERROR: Docker Compose is not installed or not in PATH"
    exit 1
fi

docker-compose up -d

echo ""
echo "========================================"
echo "Setup complete!"
echo "========================================"
echo ""
echo "Services are starting. Check status with:"
echo "  docker-compose ps"
echo "  docker-compose logs -f"
echo ""
echo "Access the application at http://localhost:3000"
echo ""
echo "To stop services: docker-compose down"
echo ""