#!/bin/bash

# ===========================================
# INVISIBLE HOTEL - API TESTER
# ===========================================

BASE_URL="http://localhost"

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║         INVISIBLE HOTEL - API TESTER                         ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test function
test_api() {
    local name=$1
    local url=$2
    local method=${3:-GET}
    local data=$4

    echo -e "${BLUE}Testing:${NC} $name"
    echo -e "  URL: $method $url"

    if [ "$method" = "POST" ] && [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST "$url" -H "Content-Type: application/json" -d "$data")
    else
        response=$(curl -s -w "\n%{http_code}" "$url")
    fi

    http_code=$(echo "$response" | tail -1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        echo -e "  ${GREEN}✓ Success${NC} (HTTP $http_code)"
        echo "$body" | head -c 300 | python3 -m json.tool 2>/dev/null || echo "$body" | head -c 300
    else
        echo -e "  ${RED}✗ Failed${NC} (HTTP $http_code)"
        echo "$body" | head -c 100
    fi
    echo ""
}

case "${1:-all}" in
    "all")
        echo "=== RUNNING ALL TESTS ==="
        echo ""

        echo "━━━ INVISIBLE HOTEL SERVICES ━━━"
        test_api "AI Front Desk" "$BASE_URL:3800/health"
        test_api "Minibar" "$BASE_URL:3810/health"
        test_api "Restaurant" "$BASE_URL:3811/health"
        test_api "Spa" "$BASE_URL:3812/health"
        test_api "Room Controls" "$BASE_URL:3814/health"
        test_api "Loyalty" "$BASE_URL:3818/health"
        test_api "Smart Lock" "$BASE_URL:3825/health"
        test_api "Pre-Arrival" "$BASE_URL:3828/health"
        test_api "Zero Checkout" "$BASE_URL:3827/health"
        test_api "Integration Gateway" "$BASE_URL:3898/health"

        echo "━━━ HOJAI AI ━━━"
        test_api "Staybot" "$BASE_URL:4840/health"
        test_api "Memory" "$BASE_URL:4520/health"
        test_api "Genie" "$BASE_URL:4703/health"

        echo "━━━ RABTUL ━━━"
        test_api "Payment" "$BASE_URL:4001/health"
        test_api "Auth" "$BASE_URL:4002/health"
        test_api "Wallet" "$BASE_URL:4004/health"

        echo "━━━ REZ-MERCHANT ━━━"
        test_api "PMS" "$BASE_URL:4031/health"
        test_api "Housekeeping" "$BASE_URL:4021/health"
        test_api "Booking" "$BASE_URL:4042/health"
        ;;

    "guest")
        echo "=== GUEST JOURNEY E2E TEST ==="
        echo ""

        # 1. Create Booking
        echo "━━━ Step 1: Create Booking ━━━"
        BOOKING=$(curl -s -X POST "$BASE_URL:4042/bookings" \
            -H "Content-Type: application/json" \
            -d '{"guestId":"demo","hotelId":"hotel-1","roomId":"101","checkIn":"2026-06-15","checkOut":"2026-06-17"}')
        echo "$BOOKING" | python3 -m json.tool
        BOOKING_ID=$(echo "$BOOKING" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")

        echo ""
        echo "━━━ Step 2: Pre-Arrival ━━━"
        curl -s -X POST "$BASE_URL:3828/prearrival" \
            -H "Content-Type: application/json" \
            -d '{"guestId":"demo","hotelId":"hotel-1","roomId":"101","bookingId":"'$BOOKING_ID'","checkIn":"2026-06-15","checkOut":"2026-06-17"}' | python3 -m json.tool

        echo ""
        echo "━━━ Step 3: Room Control ━━━"
        curl -s -X POST "$BASE_URL:3814/rooms/101/init" \
            -H "Content-Type: application/json" \
            -d '{"guestId":"demo","hotelId":"hotel-1"}' | python3 -m json.tool | head -10

        curl -s -X POST "$BASE_URL:3814/rooms/101/ac" \
            -H "Content-Type: application/json" \
            -d '{"power":"on","temp":22}' | python3 -m json.tool

        echo ""
        echo "━━━ Step 4: Minibar ━━━"
        curl -s -X POST "$BASE_URL:3810/guests/demo/consume" \
            -H "Content-Type: application/json" \
            -d '{"hotelId":"hotel-1","roomId":"101","itemId":"beer-1","quantity":2}' | python3 -m json.tool

        echo ""
        echo "━━━ Step 5: AI Concierge ━━━"
        curl -s -X POST "$BASE_URL:4840/api/chat" \
            -H "Content-Type: application/json" \
            -d '{"message":"Book a spa appointment","sessionId":"demo","guestId":"demo"}' | python3 -m json.tool

        echo ""
        echo "━━━ Step 6: Payment ━━━"
        curl -s -X POST "$BASE_URL:4001/payments/charge" \
            -H "Content-Type: application/json" \
            -d '{"amount":1500,"currency":"INR","guestId":"demo","description":"Hotel services"}' | python3 -m json.tool
        ;;

    "ai")
        echo "=== HOJAI AI TEST ==="
        echo ""

        echo "━━━ Staybot ━━━"
        curl -s -X POST "$BASE_URL:4840/api/chat" \
            -H "Content-Type: application/json" \
            -d '{"message":"I need a late checkout","sessionId":"test","guestId":"demo"}' | python3 -m json.tool

        echo ""
        echo "━━━ Memory ━━━"
        curl -s -X POST "$BASE_URL:4520/guests/demo/memory" \
            -H "Content-Type: application/json" \
            -d '{"type":"preference","content":"Prefers memory foam pillow"}' | python3 -m json.tool

        echo ""
        echo "━━━ Genie Briefing ━━━"
        curl -s "$BASE_URL:4703/api/genie/demo/briefing" | python3 -m json.tool
        ;;

    "payment")
        echo "=== PAYMENT FLOW TEST ==="
        echo ""

        echo "━━━ Credit Wallet ━━━"
        curl -s -X POST "$BASE_URL:4004/wallets/demo/credit" \
            -H "Content-Type: application/json" \
            -d '{"amount":5000,"description":"Welcome bonus"}' | python3 -m json.tool

        echo ""
        echo "━━━ Charge Payment ━━━"
        curl -s -X POST "$BASE_URL:4001/payments/charge" \
            -H "Content-Type: application/json" \
            -d '{"amount":2500,"currency":"INR","guestId":"demo","description":"Spa treatment"}' | python3 -m json.tool

        echo ""
        echo "━━━ Check Wallet Balance ━━━"
        curl -s "$BASE_URL:4004/wallets/demo" | python3 -m json.tool
        ;;

    "status")
        echo "=== ECOSYSTEM STATUS ==="
        echo ""
        curl -s "$BASE_URL:3898/ecosystem/summary" | python3 -m json.tool
        ;;

    *)
        echo "Usage: $0 {all|guest|ai|payment|status}"
        echo ""
        echo "  all     - Test all services"
        echo "  guest   - Run guest journey E2E"
        echo "  ai      - Test HOJAI AI services"
        echo "  payment - Test payment flow"
        echo "  status  - Check ecosystem status"
        ;;
esac

echo ""
echo "═══ TEST COMPLETE ═══"