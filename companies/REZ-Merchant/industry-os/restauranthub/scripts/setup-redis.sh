#!/bin/bash

# Redis Setup Script for RestaurantHub
echo "🔧 Setting up Redis for RestaurantHub..."

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to start Redis using Docker (preferred method)
start_redis_docker() {
    echo "📦 Starting Redis using Docker..."

    # Stop any existing Redis container
    docker stop restauranthub-redis 2>/dev/null || true
    docker rm restauranthub-redis 2>/dev/null || true

    # Start new Redis container
    docker run -d \
        --name restauranthub-redis \
        -p 6379:6379 \
        -v restauranthub-redis-data:/data \
        redis:7-alpine \
        redis-server \
        --requirepass restauranthub_redis_secret \
        --appendonly yes \
        --maxmemory 256mb \
        --maxmemory-policy allkeys-lru

    if [ $? -eq 0 ]; then
        echo "✅ Redis started successfully with Docker"
        echo "🔐 Password: restauranthub_redis_secret"
        echo "🌐 Connection: redis://:restauranthub_redis_secret@localhost:6379"
        return 0
    else
        echo "❌ Failed to start Redis with Docker"
        return 1
    fi
}

# Function to start Redis using Homebrew (macOS)
start_redis_homebrew() {
    echo "🍺 Starting Redis using Homebrew..."

    # Check if Redis is installed
    if ! command -v redis-server &> /dev/null; then
        echo "📥 Installing Redis using Homebrew..."
        brew install redis
    fi

    # Start Redis service
    brew services start redis

    if [ $? -eq 0 ]; then
        echo "✅ Redis started successfully with Homebrew"
        echo "🌐 Connection: redis://localhost:6379"
        return 0
    else
        echo "❌ Failed to start Redis with Homebrew"
        return 1
    fi
}

# Function to start Redis using package manager (Linux)
start_redis_linux() {
    echo "🐧 Starting Redis on Linux..."

    # Detect Linux distribution and install Redis
    if command -v apt-get &> /dev/null; then
        sudo apt-get update
        sudo apt-get install -y redis-server
        sudo systemctl start redis-server
        sudo systemctl enable redis-server
    elif command -v yum &> /dev/null; then
        sudo yum install -y redis
        sudo systemctl start redis
        sudo systemctl enable redis
    elif command -v dnf &> /dev/null; then
        sudo dnf install -y redis
        sudo systemctl start redis
        sudo systemctl enable redis
    else
        echo "❌ Unsupported Linux distribution"
        return 1
    fi

    echo "✅ Redis started successfully on Linux"
    echo "🌐 Connection: redis://localhost:6379"
    return 0
}

# Main setup logic
echo "🔍 Checking if Redis is already running on port 6379..."
if check_port 6379; then
    echo "✅ Redis is already running on port 6379"
    echo "Testing connection..."

    # Test connection
    if command -v redis-cli &> /dev/null; then
        redis-cli ping 2>/dev/null
        if [ $? -eq 0 ]; then
            echo "✅ Redis connection test successful"
            exit 0
        fi
    fi

    echo "⚠️  Redis is running but connection test failed"
    echo "You may need to configure authentication"
    exit 0
fi

echo "🚀 Redis not running, attempting to start..."

# Try different methods based on the platform
if command -v docker &> /dev/null; then
    echo "🐳 Docker detected, using Docker setup..."
    if start_redis_docker; then
        echo "✅ Redis setup completed successfully!"
        echo ""
        echo "📋 Environment Variables to add to your .env file:"
        echo "REDIS_ENABLED=true"
        echo "REDIS_HOST=localhost"
        echo "REDIS_PORT=6379"
        echo "REDIS_PASSWORD=restauranthub_redis_secret"
        echo "REDIS_URL=redis://:restauranthub_redis_secret@localhost:6379"
        echo ""
        echo "🧪 Test the connection with:"
        echo "redis-cli -h localhost -p 6379 -a restauranthub_redis_secret ping"
        exit 0
    fi
fi

# Fallback to OS-specific methods
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 macOS detected, using Homebrew..."
    if start_redis_homebrew; then
        echo "✅ Redis setup completed successfully!"
        exit 0
    fi
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "🐧 Linux detected..."
    if start_redis_linux; then
        echo "✅ Redis setup completed successfully!"
        exit 0
    fi
fi

echo "❌ Failed to start Redis with any method"
echo "📋 Manual setup instructions:"
echo "1. Install Redis manually for your system"
echo "2. Start Redis server on port 6379"
echo "3. Update .env file with REDIS_ENABLED=true"
echo ""
echo "For development, you can also use mock mode by setting:"
echo "MOCK_DATABASE=true or REDIS_ENABLED=false"
exit 1