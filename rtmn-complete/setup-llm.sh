#!/bin/bash
# RTMN LLM Setup Script
# Configure AI providers for Business Copilot

set -e

echo "🤖 RTMN LLM Setup"
echo "================"
echo ""

# Check for existing .env
if [ -f .env ]; then
    echo "📁 Found existing .env file"
    read -p "Backup and regenerate? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cp .env .env.backup
        echo "✅ Backed up to .env.backup"
    fi
fi

# Copy example env
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env from .env.example"
fi

echo ""
echo "LLM Provider Options:"
echo "1. OpenAI (GPT-4) - Most capable, requires API key"
echo "2. Anthropic (Claude) - Excellent reasoning, requires API key"
echo "3. Local LLM (Ollama) - Free, runs locally, less capable"
echo "4. Demo Mode - No API key, uses pre-built responses"
echo ""

read -p "Select provider (1-4) [4]: " choice
choice=${choice:-4}

case $choice in
    1)
        echo "📝 OpenAI selected"
        read -p "Enter your OpenAI API key: " api_key
        sed -i '' "s/LLM_API_KEY=.*/LLM_API_KEY=$api_key/" .env
        echo "✅ OpenAI configured"
        ;;
    2)
        echo "📝 Anthropic selected"
        read -p "Enter your Anthropic API key: " api_key
        sed -i '' "s/ANTHROPIC_API_KEY=.*/ANTHROPIC_API_KEY=$api_key/" .env
        echo "✅ Anthropic configured"
        ;;
    3)
        echo "📝 Local LLM (Ollama) selected"
        read -p "Ollama URL [http://localhost:11434]: " ollama_url
        ollama_url=${ollama_url:-http://localhost:11434}
        read -p "Model name [llama3]: " model_name
        model_name=${model_name:-llama3}
        echo "LOCAL_LLM_URL=$ollama_url" >> .env
        echo "LOCAL_LLM_MODEL=$model_name" >> .env
        echo "✅ Local LLM configured"
        echo ""
        echo "💡 Make sure Ollama is running: brew install ollama && ollama serve"
        ;;
    4)
        echo "📝 Demo Mode selected (no API key needed)"
        echo "✅ Demo mode is default - no changes needed"
        ;;
esac

echo ""
echo "📋 Current Configuration:"
grep -E "^(LLM_API_KEY|ANTHROPIC_API_KEY|LOCAL_LLM)" .env 2>/dev/null || echo "No LLM keys configured (Demo mode)"
echo ""
echo "🚀 To start RTMN with your LLM:"
echo "   npm run dev"
echo ""
echo "📖 To change settings later, edit .env file"
