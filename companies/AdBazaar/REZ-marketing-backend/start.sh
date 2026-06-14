#!/bin/bash
# Start all Marketing services concurrently

echo "Starting REZ Marketing Backend..."

# Marketing Service (4000)
cd services/marketing-service && npm start &
sleep 2

# Ads Service (4007)
cd ../ads-service && npm start &
sleep 2

# Lead Intelligence (4106)
cd ../lead-intelligence && npm start &
sleep 2

# Decision Service (4027)
cd ../decision-service && npm start &
sleep 2

# Unified Messaging (4025)
cd ../unified-messaging && npm start &

echo "All Marketing services started"
wait
