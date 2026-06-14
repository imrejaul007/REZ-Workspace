#!/bin/bash
# =============================================================================
# AdBazaar - Stop All Services
# =============================================================================

set -e

echo "Stopping AdBazaar services..."

BASE_DIR="/Users/rejaulkarim/Documents/ReZ Full App/AdBazaar"
cd "$BASE_DIR"

# Kill all running services
for pid_file in logs/*.pid; do
    if [ -f "$pid_file" ]; then
        name=$(basename "$pid_file" .pid)
        pid=$(cat "$pid_file")

        if ps -p $pid &> /dev/null; then
            kill $pid 2>/dev/null && echo "Stopped $name" || true
        fi

        rm "$pid_file"
    fi
done

# Kill any remaining node processes in this directory
pkill -f "node.*/AdBazaar/" 2>/dev/null || true

# Kill processes on our ports
PORTS="4000 4007 4018 4020 4100 4520 4521 4522 4523 4524 4525"
PORTS="$PORTS 4800 4801 4802 4803 4805 4806 4807 4808"
PORTS="$PORTS 4870 4950 4951 4952 4953 4954 4955"
PORTS="$PORTS 4960 4961 4962 4963 4964 4965 4966 4967 4968 4969"
PORTS="$PORTS 4970 4971 4972 4973 4974"
PORTS="$PORTS 5080 5081 5082 5083 5090 5091 5092 5093"
PORTS="$PORTS 5100 5101 5102 5103 5105 5110 5111 5112 5113"

for port in $PORTS; do
    lsof -ti :$port | xargs kill 2>/dev/null || true
done

echo "✅ All services stopped"
echo "Logs saved in logs/"
