#!/bin/bash

# Reddit Integration Service - Start Script
set -e

echo "Starting Reddit Integration Service..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Check for .env file
if [ ! -f ".env" ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo "Please edit .env with your Reddit OAuth credentials!"
fi

# Start the service
echo "Starting service on port 5110..."
npm run dev
