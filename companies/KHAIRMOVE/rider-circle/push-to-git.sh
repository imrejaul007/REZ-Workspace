#!/bin/bash
# RiderCircle - Push to Git Script
# Run this script to initialize git and push to GitHub

set -e

echo "🚀 RiderCircle - Git Push Script"
echo "================================"

cd "$(dirname "$0")"

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing git repository..."
    git init
else
    echo "✅ Git already initialized"
fi

# Configure git (if needed)
echo ""
echo "⚙️  Configuring git..."
git config user.email "dev@ridercircle.app" 2>/dev/null || true
git config user.name "RiderCircle Dev" 2>/dev/null || true

# Add remote (update URL for your repo)
echo ""
echo "🔗 Adding remote origin..."
echo "⚠️  Update the URL below with your GitHub repo URL"
echo ""
echo "Example: git remote add origin https://github.com/your-org/rider-circle.git"
echo ""

# Check if remote exists
if git remote -v | grep -q "origin"; then
    echo "✅ Remote 'origin' already exists"
else
    echo "📝 To add remote, run:"
    echo "   git remote add origin https://github.com/YOUR_ORG/rider-circle.git"
fi

# Add all files
echo ""
echo "📤 Staging all files..."
git add .

# Check status
echo ""
echo "📋 Git status:"
git status --short

# Commit
echo ""
echo "💾 Creating commit..."
git commit -m "feat: RiderCircle v1.0.0 - The Operating System for Adventure Mobility

- Express + MongoDB backend with 7 models
- Expo mobile app with 17 screens
- Socket.io real-time presence tracking
- RABTUL + HOJAI integrations
- Docker + Railway deployment
- Full documentation (README, CLAUDE, DEPLOYMENT)
- CI/CD with GitHub Actions"

# Push
echo ""
echo "🚀 Pushing to remote..."
echo ""
echo "⚠️  To push, run:"
echo "   git push -u origin main"
echo ""
echo "Or provide your repo URL:"
echo "   git remote set-url origin YOUR_GIT_URL"
echo "   git push -u origin main"

echo ""
echo "✅ Setup complete!"
