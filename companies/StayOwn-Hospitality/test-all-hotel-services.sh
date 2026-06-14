#!/bin/bash
# Comprehensive Hotel Ecosystem Test Runner

set -e

echo "=============================================="
echo "   Hotel Ecosystem Test Runner"
echo "=============================================="
echo ""

BASE_DIR="/Users/rejaulkarim/Documents/ReZ Full App"
TOTAL_PASS=0
TOTAL_FAIL=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test a service
test_service() {
    local name=$1
    local dir=$2
    local port=$3

    echo -e "${YELLOW}Testing $name...${NC}"

    if [ ! -d "$dir" ]; then
        echo -e "${RED}  Directory not found: $dir${NC}"
        return 1
    fi

    cd "$dir"

    # Check if tests exist
    if [ ! -f "package.json" ]; then
        echo -e "${YELLOW}  No package.json found${NC}"
        return 0
    fi

    # Install deps if needed
    if [ ! -d "node_modules" ]; then
        npm install > /dev/null 2>&1 || true
    fi

    # Run tests
    if npm test -- --run 2>&1 | tee /tmp/test_output_$$.txt; then
        echo -e "${GREEN}  ✅ $name tests PASSED${NC}"
        TOTAL_PASS=$((TOTAL_PASS + 1))
    else
        echo -e "${RED}  ❌ $name tests FAILED${NC}"
        TOTAL_FAIL=$((TOTAL_FAIL + 1))
    fi

    cd - > /dev/null
    echo ""
}

# Test API endpoint
test_api() {
    local name=$1
    local url=$2

    echo -e "${YELLOW}Testing $name API...${NC}"

    response=$(curl -s -w "\n%{http_code}" "$url")
    status=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)

    if [ "$status" = "200" ]; then
        echo -e "${GREEN}  ✅ $name API: OK${NC}"
        return 0
    else
        echo -e "${RED}  ❌ $name API: FAILED (status: $status)${NC}"
        return 1
    fi
}

echo "=============================================="
echo "   UNIT TESTS"
echo "=============================================="
echo ""

# Test each service with unit tests
test_service "Dynamic Pricing" "$BASE_DIR/rez-dynamic-pricing-service"
test_service "Gift Cards" "$BASE_DIR/rez-gift-card-service"
test_service "Spa" "$BASE_DIR/rez-spa-service"

echo "=============================================="
echo "   API TESTS"
echo "=============================================="
echo ""

# Test APIs
test_api "Dynamic Pricing" "http://localhost:4040/health"
test_api "Guest Mobile App" "http://localhost:4041/health"
test_api "Booking Engine" "http://localhost:4042/health"
test_api "Room Service" "http://localhost:4043/health"
test_api "Channel Manager" "http://localhost:4021/health"
test_api "Multi-Property" "http://localhost:4046/health"
test_api "Gift Cards" "http://localhost:4047/health"
test_api "Laundry" "http://localhost:4048/health"
test_api "Spa" "http://localhost:4049/health"

echo ""
echo "=============================================="
echo "   RESULTS"
echo "=============================================="
echo ""
echo -e "Unit Tests Passed: ${GREEN}$TOTAL_PASS${NC}"
echo -e "Unit Tests Failed: ${RED}$TOTAL_FAIL${NC}"
echo ""

if [ $TOTAL_FAIL -eq 0 ]; then
    echo -e "${GREEN}✅ ALL TESTS PASSED${NC}"
    exit 0
else
    echo -e "${RED}❌ SOME TESTS FAILED${NC}"
    exit 1
fi
