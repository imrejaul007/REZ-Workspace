#!/bin/bash

# REZ Verify QR - API Test Suite
# Tests all major API endpoints

set -e

BASE_URL="${BASE_URL:-http://localhost:4003}"
PASS=0
FAIL=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

test() {
    local name="$1"
    local expected="$2"
    shift 2
    local result

    echo -n "  Testing: $name... "

    if result=$("$@" 2>/dev/null); then
        if [[ "$expected" == "success" ]]; then
            echo -e "${GREEN}✓ PASS${NC}"
            ((PASS++))
        elif [[ "$result" == *"$expected"* ]]; then
            echo -e "${GREEN}✓ PASS${NC}"
            ((PASS++))
        else
            echo -e "${RED}✗ FAIL${NC} (expected: $expected)"
            ((FAIL++))
        fi
    else
        echo -e "${RED}✗ FAIL${NC} (request failed)"
        ((FAIL++))
    fi
}

test_json() {
    local name="$1"
    local field="$2"
    shift 3
    local result

    echo -n "  Testing: $name... "

    if result=$("$@" 2>/dev/null); then
        if [[ "$result" == *"$field"* ]]; then
            echo -e "${GREEN}✓ PASS${NC}"
            ((PASS++))
        else
            echo -e "${RED}✗ FAIL${NC} (missing: $field)"
            ((FAIL++))
        fi
    else
        echo -e "${RED}✗ FAIL${NC} (request failed)"
        ((FAIL++))
    fi
}

echo -e "${BLUE}"
echo "  _____ _______  _____  "
echo " |__   _|__   __|/ ____|"
echo "    | |  | |  | | (___  "
echo "    | |  | |  |  \___ \ "
echo "   _| |_ | |  | |____) |"
echo "  |_____||_|  |_|_____/ "
echo ""
echo -e "  API Test Suite v2.0${NC}"
echo ""

# Check if service is running
echo -e "${YELLOW}Checking service...${NC}"
if ! curl -s "$BASE_URL/health" > /dev/null 2>&1; then
    echo -e "${RED}✗ Service not running at $BASE_URL${NC}"
    echo "  Start with: npm run dev"
    exit 1
fi

# Get version
VERSION=$(curl -s "$BASE_URL/health" | grep -o '"version":"[^"]*"' | cut -d'"' -f4)
echo -e "${GREEN}✓ Service running (v$VERSION)${NC}"
echo ""

# ============================================
# CORE VERIFICATION TESTS
# ============================================
echo -e "${BLUE}Core Verification APIs${NC}"

test "Verify invalid serial" "serial_number" \
    curl -s -X POST "$BASE_URL/api/verify" \
    -H "Content-Type: application/json" \
    -d '{"serial_number":"INVALID123"}'

test "Health check" "healthy" \
    curl -s "$BASE_URL/health"

test "Health has features" "features" \
    curl -s "$BASE_URL/health"

echo ""

# ============================================
# OWNERSHIP PASSPORT TESTS
# ============================================
echo -e "${BLUE}Ownership Passport APIs${NC}"

test "Get warranty plans" "plans" \
    curl -s "$BASE_URL/api/warranty-plans"

test "Get resale buyer check (no data)" "serial_number" \
    curl -s "$BASE_URL/api/resale/buyer-check/TEST123"

echo ""

# ============================================
# OEM DASHBOARD TESTS
# ============================================
echo -e "${BLUE}OEM Dashboard APIs${NC}"

test "OEM Dashboard" "summary" \
    curl -s "$BASE_URL/oem/demo_brand/dashboard"

test "Counterfeit Analytics" "total_reports" \
    curl -s "$BASE_URL/oem/demo_brand/counterfeit-analytics"

test "Regional Analytics" "heatmap" \
    curl -s "$BASE_URL/oem/demo_brand/regional-analytics"

test "Fraud Maps" "active_patterns" \
    curl -s "$BASE_URL/oem/demo_brand/fraud-maps"

test "Predictive Analytics" "predictions" \
    curl -s "$BASE_URL/oem/demo_brand/predictive-analytics"

test "Activation Rates" "total_serials" \
    curl -s "$BASE_URL/oem/demo_brand/activation-rates"

echo ""

# ============================================
# NOTIFICATION TESTS
# ============================================
echo -e "${BLUE}Notification APIs${NC}"

test "WhatsApp Templates" "templates" \
    curl -s "$BASE_URL/api/whatsapp/templates"

echo ""

# ============================================
# PAYMENT TESTS (basic validation)
# ============================================
echo -e "${BLUE}Payment APIs${NC}"

test "Payment link validation (missing params)" "amount" \
    curl -s -X POST "$BASE_URL/api/payments/create-link" \
    -H "Content-Type: application/json" \
    -d '{"customer_phone":"test"}'

echo ""

# ============================================
# SUMMARY
# ============================================
echo -e "${BLUE}========================================${NC}"
echo -e "Test Results:"
echo -e "  ${GREEN}Passed:${NC} $PASS"
echo -e "  ${RED}Failed:${NC} $FAIL"
echo -e "${BLUE}========================================${NC}"

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed.${NC}"
    exit 1
fi
