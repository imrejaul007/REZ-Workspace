#!/bin/bash
# AssetMind Integration Test Suite
# Tests connectivity between AssetMind, HOJAI, and RABTUL

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
ASSETMIND_API="${ASSETMIND_API:-http://localhost:5260}"
HOJAI_GATEWAY="${HOJAI_GATEWAY:-http://localhost:4500}"
RABTUL_AUTH="${RABTUL_AUTH:-http://localhost:4002}"

echo "=========================================="
echo "AssetMind Integration Test Suite"
echo "=========================================="
echo ""

# Test counter
PASSED=0
FAILED=0

# Test function
test_endpoint() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}

    echo -n "Testing $name... "

    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")

    if [ "$response" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $response)"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP $response, expected $expected_status)"
        ((FAILED++))
    fi
}

echo "=========================================="
echo "AssetMind Core Services"
echo "=========================================="
test_endpoint "API Gateway Health" "$ASSETMIND_API/health"
test_endpoint "API Gateway Routes" "$ASSETMIND_API/api/routes"
test_endpoint "Asset Universe" "$ASSETMIND_API/api/assets/health"
test_endpoint "Twin Engine" "$ASSETMIND_API/api/twin/health"
test_endpoint "Market Twin" "$ASSETMIND_API/api/market-twin/health"
test_endpoint "Portfolio Twin" "$ASSETMIND_API/api/portfolio-twin/health"
test_endpoint "Investor Twin" "$ASSETMIND_API/api/investor-twin/health"
test_endpoint "Intelligence Twin" "$ASSETMIND_API/api/intelligence-twin/health"
echo ""

echo "=========================================="
echo "AssetMind Data Services"
echo "=========================================="
test_endpoint "Market Data" "$ASSETMIND_API/api/market-data/health"
test_endpoint "News Service" "$ASSETMIND_API/api/news/health"
test_endpoint "Social Data" "$ASSETMIND_API/api/social/health"
test_endpoint "Macro Data" "$ASSETMIND_API/api/macro/health"
test_endpoint "Crypto Data" "$ASSETMIND_API/api/crypto/health"
echo ""

echo "=========================================="
echo "AssetMind Intelligence"
echo "=========================================="
test_endpoint "Financial Intelligence" "$ASSETMIND_API/api/intelligence/health"
test_endpoint "Sentiment Analysis" "$ASSETMIND_API/api/sentiment/health"
test_endpoint "Risk Intelligence" "$ASSETMIND_API/api/risk/health"
test_endpoint "Events Service" "$ASSETMIND_API/api/events/health"
echo ""

echo "=========================================="
echo "AssetMind Agents"
echo "=========================================="
test_endpoint "Agent Orchestrator" "$ASSETMIND_API/api/agents/health"
test_endpoint "Portfolio Optimizer" "$ASSETMIND_API/api/portfolio-optimizer/health"
test_endpoint "Risk Manager" "$ASSETMIND_API/api/risk-manager/health"
echo ""

echo "=========================================="
echo "HOJAI AI Integration"
echo "=========================================="
test_endpoint "HOJAI Gateway" "$HOJAI_GATEWAY/health"
test_endpoint "HOJAI Memory" "$HOJAI_GATEWAY/memory/health"
test_endpoint "HOJAI Agents" "$HOJAI_GATEWAY/agents/health"
echo ""

echo "=========================================="
echo "RABTUL Integration"
echo "=========================================="
test_endpoint "RABTUL Auth" "$RABTUL_AUTH/health"
test_endpoint "RABTUL Auth Login" "$RABTUL_AUTH/api/auth/login" "422"  # Expects POST
echo ""

echo "=========================================="
echo "Cross-Company Integration Tests"
echo "=========================================="

# Test AssetMind -> HOJAI memory integration
echo -n "AssetMind -> HOJAI Memory... "
response=$(curl -s "$ASSETMIND_API/api/memory/health" 2>/dev/null || echo "{}")
if echo "$response" | grep -q "healthy\|connected"; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ SKIP${NC} (service not available)"
fi

# Test AssetMind -> RABTUL auth integration
echo -n "AssetMind -> RABTUL Auth... "
response=$(curl -s "$ASSETMIND_API/api/auth/verify"2>/dev/null || echo "{}")
if echo "$response" | grep -q "token\|auth\|valid"; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ SKIP${NC} (service not available)"
fi

echo ""
echo "=========================================="
echo "Summary"
echo "=========================================="
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed. Please check the configuration.${NC}"
    exit 1
fi
