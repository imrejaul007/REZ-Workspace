#!/bin/bash

# Test Runner Script for RestaurantHub API
# This script runs comprehensive tests with proper setup and teardown

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_color() {
    printf "${1}${2}${NC}\n"
}

print_color $BLUE "🚀 RestaurantHub API Test Suite Runner"
print_color $BLUE "======================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_color $RED "❌ Error: Not in the API directory. Please run from apps/api/"
    exit 1
fi

# Parse command line arguments
TEST_TYPE="${1:-all}"
COVERAGE="${2:-false}"
VERBOSE="${3:-false}"

print_color $YELLOW "📋 Test Configuration:"
echo "  Test Type: $TEST_TYPE"
echo "  Coverage: $COVERAGE"
echo "  Verbose: $VERBOSE"
echo ""

# Setup test environment
print_color $YELLOW "🔧 Setting up test environment..."

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    print_color $YELLOW "📦 Installing dependencies..."
    npm install
fi

# Generate Prisma client
print_color $YELLOW "🗄️  Generating Prisma client..."
npm run prisma:generate

# Setup test database
print_color $YELLOW "🗄️  Setting up test database..."
export NODE_ENV=test
export DATABASE_URL="postgresql://postgres:password@localhost:5432/restauranthub_test"

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    print_color $RED "❌ PostgreSQL is not running. Please start PostgreSQL first."
    exit 1
fi

# Create test database if it doesn't exist
createdb restauranthub_test 2>/dev/null || true

# Run migrations
npx prisma migrate deploy

# Start Redis if not running (for CI environments)
if ! redis-cli ping > /dev/null 2>&1; then
    print_color $YELLOW "🔴 Starting Redis server..."
    redis-server --daemonize yes --port 6379
fi

print_color $GREEN "✅ Test environment ready!"
echo ""

# Function to run tests with error handling
run_test() {
    local test_name=$1
    local test_command=$2
    
    print_color $BLUE "🧪 Running $test_name..."
    if eval $test_command; then
        print_color $GREEN "✅ $test_name passed!"
    else
        print_color $RED "❌ $test_name failed!"
        return 1
    fi
    echo ""
}

# Main test execution
case $TEST_TYPE in
    "unit")
        print_color $BLUE "🔬 Running Unit Tests Only"
        echo "================================"
        if [ "$COVERAGE" == "true" ]; then
            run_test "Unit Tests with Coverage" "npm run test:cov -- --testPathPattern=unit"
        else
            run_test "Unit Tests" "npm run test:unit"
        fi
        ;;
        
    "integration")
        print_color $BLUE "🔗 Running Integration Tests Only"
        echo "=================================="
        run_test "Integration Tests" "npm run test:integration"
        ;;
        
    "e2e")
        print_color $BLUE "🌐 Running E2E Tests Only"
        echo "=========================="
        run_test "E2E Tests" "npm run test:e2e"
        ;;
        
    "performance")
        print_color $BLUE "⚡ Running Performance Tests Only"
        echo "=================================="
        run_test "Performance Tests" "npm run test:performance"
        ;;
        
    "verification")
        print_color $BLUE "🔐 Running Verification Tests Only"
        echo "==================================="
        run_test "Verification Unit Tests" "npm run test:verification -- --testPathPattern=unit"
        run_test "Verification Integration Tests" "npm run test:verification -- --testPathPattern=integration"
        run_test "Verification E2E Tests" "npm run test:verification -- --testPathPattern=e2e"
        ;;
        
    "ci")
        print_color $BLUE "🤖 Running CI Test Suite"
        echo "========================="
        run_test "Unit Tests with Coverage" "npm run test:cov"
        run_test "Integration Tests" "npm run test:integration"
        run_test "E2E Tests" "npm run test:e2e"
        run_test "Performance Tests" "npm run test:performance"
        ;;
        
    "all"|*)
        print_color $BLUE "🎯 Running Complete Test Suite"
        echo "==============================="
        
        # Run linting first
        run_test "Linting" "npm run lint"
        
        # Run type checking
        run_test "Type Checking" "npx tsc --noEmit"
        
        # Run unit tests
        if [ "$COVERAGE" == "true" ]; then
            run_test "Unit Tests with Coverage" "npm run test:cov"
        else
            run_test "Unit Tests" "npm run test"
        fi
        
        # Run integration tests
        run_test "Integration Tests" "npm run test:integration"
        
        # Run E2E tests
        run_test "E2E Tests" "npm run test:e2e"
        
        # Run performance tests (optional for local development)
        if [ "$TEST_TYPE" == "ci" ]; then
            run_test "Performance Tests" "npm run test:performance"
        fi
        ;;
esac

# Cleanup
print_color $YELLOW "🧹 Cleaning up test environment..."

# Drop test database
dropdb restauranthub_test 2>/dev/null || true

# Stop Redis if we started it
if [ "$TEST_TYPE" == "ci" ]; then
    redis-cli shutdown 2>/dev/null || true
fi

print_color $GREEN "🎉 All tests completed successfully!"
print_color $BLUE "=================================="

# Generate test report summary
if [ "$COVERAGE" == "true" ]; then
    print_color $YELLOW "📊 Coverage Report:"
    echo "  HTML Report: coverage/lcov-report/index.html"
    echo "  LCOV File: coverage/lcov.info"
fi

print_color $YELLOW "📋 Test Results Summary:"
echo "  ✅ Tests completed successfully"
echo "  📁 Logs available in test output above"
echo "  🔍 For detailed analysis, check coverage reports"

echo ""
print_color $GREEN "Ready for deployment! 🚀"