#!/bin/bash

echo "🚀 Starting Restaurant SaaS Platform - Local Development"
echo "=================================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Start PostgreSQL with Docker
echo "🐘 Starting PostgreSQL database..."
docker run -d \
  --name restaurant-saas-postgres \
  -e POSTGRES_DB=restaurant_saas \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password123 \
  -p 5432:5432 \
  --rm \
  postgres:15-alpine

# Wait for PostgreSQL to start
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

# Check if database is ready
until docker exec restaurant-saas-postgres pg_isready -U postgres > /dev/null 2>&1; do
    echo "⏳ Waiting for database to be ready..."
    sleep 2
done

echo "✅ PostgreSQL is ready!"
echo ""

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "📊 Running database migrations..."
npx prisma migrate dev --name init

# Seed the database
echo "🌱 Seeding database with sample data..."
npx prisma db seed

echo "✅ Backend setup complete!"
echo ""

# Start backend server in background
echo "🖥️  Starting backend server..."
npm run start:dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

echo "✅ Backend started on http://localhost:8000"
echo ""

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../frontend
if [ ! -d "node_modules" ]; then
    npm install
fi

echo "✅ Frontend dependencies installed!"
echo ""

# Start frontend server
echo "🌐 Starting frontend server..."
echo ""
echo "=================================================="
echo "🎉 Restaurant SaaS Platform is starting..."
echo "=================================================="
echo "📖 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8000/api/v1"
echo "📚 API Docs: http://localhost:8000/api/docs"
echo "=================================================="
echo ""
echo "🔑 Sample Login Credentials:"
echo "Admin: admin@restauranthub.com / admin123"
echo "Restaurant: restaurant@example.com / password123"
echo "Employee: employee@example.com / password123"
echo "Vendor: vendor@example.com / password123"
echo ""
echo "Press Ctrl+C to stop all services"
echo "=================================================="

# Start frontend (this will run in foreground)
npm run dev

# Cleanup when script exits
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    kill $BACKEND_PID 2>/dev/null
    docker stop restaurant-saas-postgres 2>/dev/null
    echo "✅ All services stopped"
}

trap cleanup EXIT