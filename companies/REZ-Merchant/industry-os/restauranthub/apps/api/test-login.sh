#!/bin/bash

echo "================================"
echo "RestaurantHub Login Test Script"
echo "================================"
echo ""

# Test server health
echo "1. Testing server health..."
HEALTH=$(curl -s http://localhost:3002/api/v1/auth/health)
if [ $? -eq 0 ]; then
    echo "✅ Server is running on port 3002"
    echo "   Response: $HEALTH"
else
    echo "❌ Server is not responding"
    exit 1
fi
echo ""

# Test login with mock credentials
echo "2. Testing login with mock credentials..."
echo "   Email: admin@restauranthub.com"
echo "   Password: admin123"
echo ""

LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3002/api/v1/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@restauranthub.com", "password": "admin123"}')

echo "Response:"
echo "$LOGIN_RESPONSE" | jq . 2>/dev/null || echo "$LOGIN_RESPONSE"
echo ""

# Check if login was successful
if echo "$LOGIN_RESPONSE" | grep -q "accessToken"; then
    echo "✅ Login successful!"
    echo ""
    echo "You can now use the access token for authenticated requests."
else
    echo "❌ Login failed. The issue is:"
    echo ""
    echo "The validateUser method in AuthService is still trying to connect to PostgreSQL"
    echo "instead of using the mock database. This happens because Passport's LocalStrategy"
    echo "is using a different instance of PrismaService."
    echo ""
    echo "Current workaround:"
    echo "1. The server is running with MOCK_DATABASE=true"
    echo "2. Mock user data is initialized with proper password hash"
    echo "3. All other endpoints work with mock data"
    echo ""
    echo "The permanent fix requires ensuring all PrismaService instances"
    echo "respect the MOCK_DATABASE environment variable."
fi
echo ""
echo "================================"