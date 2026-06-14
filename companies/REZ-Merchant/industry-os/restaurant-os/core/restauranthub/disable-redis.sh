#!/bin/bash

# Script to temporarily disable Redis dependencies in all services

echo "Disabling Redis dependencies in services..."

# List of service files that use RedisService
declare -a services=(
    "apps/api/src/modules/restaurants/restaurants.service.ts"
    "apps/api/src/modules/vendors/vendors.service.ts"
    "apps/api/src/modules/employees/employees.service.ts"
    "apps/api/src/modules/auth/auth.service.ts"
    "apps/api/src/modules/search/search.service.ts"
    "apps/api/src/modules/monitoring/monitoring.service.ts"
    "apps/api/src/modules/websocket/websocket.service.ts"
    "apps/api/src/modules/health/health.service.ts"
    "apps/api/src/modules/auth/strategies/jwt.strategy.ts"
)

# Disable Redis imports and constructor params
for service in "${services[@]}"; do
    if [ -f "$service" ]; then
        echo "Processing $service..."
        
        # Comment out Redis import
        sed -i.bak 's/^import { RedisService }/\/\/ import { RedisService }/g' "$service"
        
        # Comment out RedisService in constructor
        sed -i.bak 's/private redisService: RedisService,/\/\/ private redisService: RedisService, \/\/ Temporarily disabled/g' "$service"
        
        # Comment out all redisService usage
        sed -i.bak 's/await this\.redisService\./\/\/ await this\.redisService\./g' "$service"
        sed -i.bak 's/this\.redisService\./\/\/ this\.redisService\./g' "$service"
        
        echo "  ✓ Processed $service"
    else
        echo "  ! File not found: $service"
    fi
done

echo "Redis disabled in all services!"