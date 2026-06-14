#!/bin/bash

# AssetMind - Push to Git
# Run: ./push-to-git.sh

set -e

cd "/Users/rejaulkarim/Documents/ReZ Full App/AssetMind"

echo "=== AssetMind Git Push ==="
echo ""

# Set remote
echo "1. Setting remote..."
git remote remove origin 2>/dev/null || true
git remote add origin git@github.com:imrejaul007/AssetMind.git

# Check status
echo ""
echo "2. Git status:"
git status --short | head -20

# Add all files
echo ""
echo "3. Adding all files..."
git add -A

# Commit
echo ""
echo "4. Committing..."
git commit -m "AssetMind v2.0 - RexMind AI, Multi-Agent, RL Trading, Semantic Search

Features Added:
- RexMind AI: Proprietary 75M parameter financial model
- Multi-Agent System: 10 specialized AI agents (FinRobot-style)
- Semantic Search: AlphaSense-style natural language queries
- RL Trading: FinRL-style deep reinforcement learning
- Financial Memory: Prediction learning loop
- Briefing Service: Daily intelligence
- Knowledge Graph: Supply chain intelligence

New Services (10):
- assetmind-multiagent (5190)
- assetmind-semantic-search (5170)
- assetmind-rl-trading (5180)
- assetmind-memory (5030)
- assetmind-briefing (5200)
- assetmind-capital-flow (5183)
- assetmind-research (5130)
- assetmind-execution (5161)
- assetmind-admin (5251)
- assetmind-db (5432)
- assetmind-mobile (Expo React Native)

Total Services: 85+
AI Agents: 23+
Documentation: Complete

Version 2.0 - June 9, 2026"

# Push
echo ""
echo "5. Pushing to GitHub..."
git push -u origin main

echo ""
echo "=== Done! ==="