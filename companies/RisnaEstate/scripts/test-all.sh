#!/bin/bash
# RisnaEstate - Health Check Script
# Run: bash scripts/test-all.sh

BASE_URL=${1:-http://localhost:3000}

echo "=========================================="
echo "RisnaEstate Health Check"
echo "=========================================="
echo ""

SERVICES=(
  "Gateway:3000"
  "Property:4100"
  "Lead:4101"
  "Visa:4102"
  "Referral:4103"
  "Broker:4104"
  "CRM:4105"
  "Media:4106"
  "Builder:4107"
  "Notification:4108"
  "Payment:4109"
  "Intelligence:4110"
  "WhatsApp:4111"
  "Investment:4112"
  "Distribution:4113"
)

PASS=0
FAIL=0

for service in "${SERVICES[@]}"; do
  name="${service%:*}"
  port="${service#*:}"

  echo -n "Checking $name ($port)... "

  if curl -sf "http://localhost:$port/health" > /dev/null 2>&1; then
    echo "✅ UP"
    ((PASS++))
  else
    echo "❌ DOWN"
    ((FAIL++))
  fi
done

echo ""
echo "=========================================="
echo "Results: $PASS passed, $FAIL failed"
echo "=========================================="

# Test API endpoints
echo ""
echo "Testing API Endpoints..."
echo ""

echo -n "GET /api/v1/properties... "
curl -sf "${BASE_URL}/api/v1/properties?limit=1" > /dev/null && echo "✅" || echo "❌"

echo -n "GET /api/v1/leads... "
curl -sf "${BASE_URL}/api/v1/leads?limit=1" > /dev/null && echo "✅" || echo "❌"

echo -n "GET /api/v1/visa/programs... "
curl -sf "${BASE_URL}/api/v1/visa/programs" > /dev/null && echo "✅" || echo "❌"

echo ""
echo "=========================================="
echo "API Test Complete"
echo "=========================================="
