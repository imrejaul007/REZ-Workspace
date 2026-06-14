#!/bin/bash
# =============================================================================
# AdBazaar - Service Status
# =============================================================================

echo "=========================================="
echo "  ADBAZAAR SERVICE STATUS"
echo "=========================================="
echo ""

check_port() {
    local port=$1
    local name=$2

    if lsof -i :$port &> /dev/null; then
        status=$(curl -s http://localhost:$port/health 2>/dev/null | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
        if [ "$status" = "healthy" ]; then
            echo -e "✅ Port $port ($name): \033[0;32mHEALTHY\033[0m"
        elif [ -n "$status" ]; then
            echo -e "⚠️  Port $port ($name): \033[0;33m$status\033[0m"
        else
            echo -e "⚠️  Port $port ($name): \033[0;33mSTARTING\033[0m"
        fi
    else
        echo -e "❌ Port $port ($name): \033[0;31mSTOPPED\033[0m"
    fi
}

echo "Core Marketing"
check_port 4000 "Marketing"
check_port 4007 "ADS Service"
check_port 4018 "DOOH"
check_port 4020 "Automation"
check_port 4100 "Attribution"
echo ""

echo "SSP"
check_port 4520 "SSP Gateway"
check_port 4523 "SSP Bidding"
echo ""

echo "Intent Exchange"
check_port 4800 "Signal Aggregator"
check_port 4801 "Prediction Engine"
check_port 4802 "Intent Marketplace"
echo ""

echo "Business Growth OS"
check_port 4870 "HOJAI Gateway"
check_port 4960 "Marketing OS"
check_port 4961 "CDP"
check_port 4962 "Pixel"
check_port 4963 "Verification"
check_port 4964 "Clean Room"
check_port 4965 "Marketing Agent"
check_port 4966 "Event Stream"
check_port 4967 "Intelligence Graph"
check_port 4968 "Data Marketplace"
check_port 4969 "Revenue Intel"
check_port 4970 "Creator Wallet"
check_port 4971 "Personalization"
check_port 4972 "Agency OS"
check_port 4973 "Competitive Intel"
check_port 4974 "Community Media"
echo ""

echo "Ecosystem"
check_port 4530 "REZ Ride"
check_port 4951 "Airzy"
check_port 4952 "StayOwn"
check_port 4953 "BuzzLocal"
check_port 4954 "CorpPerks"
check_port 4955 "Ecosystem Hub"
echo ""

echo "Social Automation"
check_port 5080 "Instagram Shop"
check_port 5081 "Instagram Publishing"
check_port 5091 "Caption AI"
check_port 5092 "Content Calendar"
echo ""

echo "=========================================="
echo "Run ./start-all-services.sh to start all services"
echo "Run ./stop-all-services.sh to stop all services"
echo "=========================================="
