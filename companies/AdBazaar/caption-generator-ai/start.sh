#!/bin/bash
# Start script for caption-generator-ai service

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Check for required environment variables
if [ -z "$OPENAI_API_KEY" ]; then
  echo "Error: OPENAI_API_KEY is not set"
  echo "Please copy .env.example to .env and configure your API keys"
  exit 1
fi

# Start the service
echo "Starting caption-generator-ai on port ${PORT:-5091}..."
npm run dev
