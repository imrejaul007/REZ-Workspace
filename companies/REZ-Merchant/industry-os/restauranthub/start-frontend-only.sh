#!/bin/bash

echo "🚀 Starting Resturistan Frontend (Standalone Mode)"
echo "=================================================="
echo ""

# Kill existing processes on our ports
echo "🔧 Cleaning up existing processes..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:3002 | xargs kill -9 2>/dev/null || true

echo "✅ Ports cleared"
echo ""

# Start only the web frontend
echo "🌐 Starting Next.js Frontend..."
cd apps/web
npm run dev &

WEB_PID=$!
echo "✅ Frontend started (PID: $WEB_PID)"
echo ""

echo "🎉 Frontend is now running!"
echo ""
echo "📱 Access URLs:"
echo "   Frontend: http://localhost:3001"
echo ""
echo "📝 Note: Running in mock data mode"
echo "   - All features visible with sample data"
echo "   - User authentication simulated"
echo "   - Database operations mocked"
echo ""
echo "🔑 Test the following features:"
echo "   ✅ Landing page and navigation"
echo "   ✅ User dashboards (all 5 roles)"
echo "   ✅ Marketplace browsing and cart"
echo "   ✅ Job portal listings"
echo "   ✅ Community discussions"
echo "   ✅ Wallet and transactions"
echo "   ✅ Admin analytics"
echo ""
echo "Press Ctrl+C to stop the frontend"

# Wait for frontend process
wait $WEB_PID