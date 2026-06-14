#!/bin/bash

# Restaurant App - GitHub Push Script
# This script will push your complete restaurant platform to GitHub

echo "🚀 RestaurantHub - Pushing to GitHub"
echo "Repository: https://github.com/imrejaul007/restaurantapp"
echo ""

# Check if we're in the right directory
if [ ! -f "README.md" ] || [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    echo "Current directory: $(pwd)"
    echo "Expected files: README.md, frontend/, backend/"
    exit 1
fi

# Check git status
echo "📋 Checking git status..."
git status

echo ""
echo "📊 Project Statistics:"
echo "- $(find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | wc -l | xargs) TypeScript/JavaScript files"
echo "- $(find . -name "*.json" | wc -l | xargs) JSON configuration files" 
echo "- $(find . -name "*.md" | wc -l | xargs) Documentation files"
echo "- $(git log --oneline | wc -l | xargs) Git commits ready"

echo ""
echo "🔐 GitHub Authentication Required"
echo "When prompted, enter:"
echo "  Username: imrejaul007" 
echo "  Password: [Your GitHub Personal Access Token]"
echo ""
echo "💡 If you don't have a Personal Access Token:"
echo "   1. Go to: https://github.com/settings/tokens"
echo "   2. Generate new token (classic)"
echo "   3. Select 'repo' permissions"
echo "   4. Use token as password"
echo ""

read -p "Ready to push? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Pushing to GitHub..."
    
    # Push to GitHub
    git push -u origin main
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "🎉 SUCCESS! Your restaurant platform is now live on GitHub!"
        echo "🔗 View at: https://github.com/imrejaul007/restaurantapp"
        echo ""
        echo "📦 What was uploaded:"
        echo "✅ Complete Restaurant Industry SaaS Platform"
        echo "✅ 3 Role-based dashboards (Admin, Restaurant, Employee)"  
        echo "✅ Social media-style interface"
        echo "✅ Job portal and marketplace"
        echo "✅ Employee verification system"
        echo "✅ Community forum features"
        echo "✅ Responsive design for mobile & desktop"
        echo "✅ Production-ready with Docker"
        echo ""
        echo "🚀 Next steps:"
        echo "1. Visit your GitHub repo: https://github.com/imrejaul007/restaurantapp"
        echo "2. Check the README.md for setup instructions"
        echo "3. Deploy to production when ready!"
    else
        echo ""
        echo "❌ Push failed. Please check your credentials and try again."
        echo "💡 Common issues:"
        echo "   - Wrong username/token"
        echo "   - Token doesn't have 'repo' permissions"
        echo "   - Network connectivity issues"
    fi
else
    echo "Push cancelled. Run this script again when ready!"
fi