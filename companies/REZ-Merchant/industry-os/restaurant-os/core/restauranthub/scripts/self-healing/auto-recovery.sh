#!/bin/bash

# RestaurantHub Self-Healing Auto-Recovery Script
# AI Sentry - Automated Problem Detection and Resolution

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/var/log/restauranthub/self-healing.log"
PROMETHEUS_URL="${PROMETHEUS_URL:-http://prometheus:9090}"
ALERTMANAGER_URL="${ALERTMANAGER_URL:-http://alertmanager:9093}"
WEBHOOK_URL="${WEBHOOK_URL:-http://webhook-notifications:9999/webhook}"
DOCKER_COMPOSE_FILE="${DOCKER_COMPOSE_FILE:-docker-compose.yml}"

# Metrics collection
PUSHGATEWAY_URL="${PUSHGATEWAY_URL:-http://pushgateway:9091}"
METRICS_JOB="self-healing"

# Recovery attempt limits
MAX_RESTART_ATTEMPTS=3
MAX_RECOVERY_ATTEMPTS=5
RECOVERY_COOLDOWN=300  # 5 minutes

# Logging function
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

# Send metrics to Pushgateway
send_metric() {
    local metric_name="$1"
    local metric_value="$2"
    local labels="$3"

    curl -s -X POST "${PUSHGATEWAY_URL}/metrics/job/${METRICS_JOB}/instance/auto-recovery" \
        --data-binary "# HELP ${metric_name} Self-healing metric
# TYPE ${metric_name} gauge
${metric_name}${labels} ${metric_value}" || true
}

# Send notification
send_notification() {
    local severity="$1"
    local summary="$2"
    local description="$3"
    local action_taken="$4"

    local payload=$(cat <<EOF
{
  "receiver": "self-healing-alerts",
  "status": "firing",
  "alerts": [{
    "status": "firing",
    "labels": {
      "alertname": "SelfHealingAction",
      "severity": "$severity",
      "team": "platform",
      "component": "self-healing",
      "instance": "auto-recovery"
    },
    "annotations": {
      "summary": "$summary",
      "description": "$description",
      "action_taken": "$action_taken",
      "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    },
    "startsAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  }],
  "groupLabels": {
    "alertname": "SelfHealingAction"
  }
}
EOF
)

    curl -s -X POST "$WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d "$payload" || log "ERROR" "Failed to send notification"
}

# Check if service is healthy
check_service_health() {
    local service="$1"
    local check_url="$2"

    if curl -sf "$check_url" >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Get Prometheus metrics
get_prometheus_metric() {
    local query="$1"
    local encoded_query=$(printf '%s' "$query" | sed 's/ /%20/g' | sed 's/{/%7B/g' | sed 's/}/%7D/g')

    curl -s "${PROMETHEUS_URL}/api/v1/query?query=${encoded_query}" | \
        jq -r '.data.result[0].value[1] // "0"' 2>/dev/null || echo "0"
}

# Restart Docker service
restart_docker_service() {
    local service="$1"
    local attempt="$2"

    log "INFO" "Attempting to restart service: $service (attempt $attempt)"

    if docker-compose -f "$DOCKER_COMPOSE_FILE" restart "$service"; then
        log "INFO" "Successfully restarted service: $service"
        send_metric "self_healing_service_restarts_total" "1" "{service=\"$service\",result=\"success\"}"
        return 0
    else
        log "ERROR" "Failed to restart service: $service"
        send_metric "self_healing_service_restarts_total" "1" "{service=\"$service\",result=\"failure\"}"
        return 1
    fi
}

# Scale service
scale_service() {
    local service="$1"
    local replicas="$2"

    log "INFO" "Scaling service $service to $replicas replicas"

    if docker-compose -f "$DOCKER_COMPOSE_FILE" up -d --scale "$service=$replicas"; then
        log "INFO" "Successfully scaled service: $service to $replicas replicas"
        send_metric "self_healing_service_scaling_total" "1" "{service=\"$service\",replicas=\"$replicas\",result=\"success\"}"
        return 0
    else
        log "ERROR" "Failed to scale service: $service"
        send_metric "self_healing_service_scaling_total" "1" "{service=\"$service\",replicas=\"$replicas\",result=\"failure\"}"
        return 1
    fi
}

# Clear Redis cache
clear_redis_cache() {
    log "INFO" "Clearing Redis cache due to performance issues"

    if docker exec -it restauranthub-redis redis-cli FLUSHALL; then
        log "INFO" "Successfully cleared Redis cache"
        send_metric "self_healing_cache_clears_total" "1" "{cache=\"redis\",result=\"success\"}"
        send_notification "warning" "Redis Cache Cleared" "Automatically cleared Redis cache due to performance issues" "cache_clear"
        return 0
    else
        log "ERROR" "Failed to clear Redis cache"
        send_metric "self_healing_cache_clears_total" "1" "{cache=\"redis\",result=\"failure\"}"
        return 1
    fi
}

# Database maintenance
perform_database_maintenance() {
    log "INFO" "Performing database maintenance"

    # Analyze and vacuum database
    if docker exec -it restauranthub-postgres psql -U postgres -d restauranthub -c "ANALYZE; VACUUM;"; then
        log "INFO" "Successfully performed database maintenance"
        send_metric "self_healing_db_maintenance_total" "1" "{result=\"success\"}"
        send_notification "info" "Database Maintenance Completed" "Automatically performed database ANALYZE and VACUUM" "db_maintenance"
        return 0
    else
        log "ERROR" "Failed to perform database maintenance"
        send_metric "self_healing_db_maintenance_total" "1" "{result=\"failure\"}"
        return 1
    fi
}

# Kill long-running queries
kill_long_running_queries() {
    local max_duration="$1"

    log "INFO" "Killing queries running longer than $max_duration"

    local query="SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'active' AND now() - query_start > interval '$max_duration';"

    if docker exec -it restauranthub-postgres psql -U postgres -d restauranthub -c "$query"; then
        log "INFO" "Successfully killed long-running queries"
        send_metric "self_healing_long_queries_killed_total" "1" "{result=\"success\"}"
        send_notification "warning" "Long-running Queries Terminated" "Automatically killed queries running longer than $max_duration" "query_termination"
        return 0
    else
        log "ERROR" "Failed to kill long-running queries"
        send_metric "self_healing_long_queries_killed_total" "1" "{result=\"failure\"}"
        return 1
    fi
}

# System cleanup
perform_system_cleanup() {
    log "INFO" "Performing system cleanup"

    # Clean Docker images and containers
    docker system prune -f --volumes

    # Clean logs older than 7 days
    find /var/log/restauranthub -name "*.log" -mtime +7 -delete

    # Clean temp files
    find /tmp -name "*restauranthub*" -mtime +1 -delete

    log "INFO" "System cleanup completed"
    send_metric "self_healing_system_cleanups_total" "1" "{result=\"success\"}"
    send_notification "info" "System Cleanup Completed" "Automatically performed system cleanup and maintenance" "system_cleanup"
}

# Check API service health
check_api_health() {
    local api_up=$(get_prometheus_metric 'up{job="restauranthub-api"}')
    local api_response_time=$(get_prometheus_metric 'histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{job="restauranthub-api"}[5m])) by (le))')
    local api_error_rate=$(get_prometheus_metric '(sum(rate(http_requests_total{status=~"5..",job="restauranthub-api"}[5m])) / sum(rate(http_requests_total{job="restauranthub-api"}[5m]))) * 100')

    # Check if API is down
    if [ "$api_up" != "1" ]; then
        log "WARNING" "API service is down, attempting recovery"

        for attempt in $(seq 1 $MAX_RESTART_ATTEMPTS); do
            if restart_docker_service "api" "$attempt"; then
                sleep 30  # Wait for service to start
                if check_service_health "api" "http://api:3000/api/v1/auth/health"; then
                    send_notification "warning" "API Service Recovered" "API service was down and has been automatically restarted" "service_restart"
                    return 0
                fi
            fi
            sleep 60  # Wait before next attempt
        done

        log "ERROR" "Failed to recover API service after $MAX_RESTART_ATTEMPTS attempts"
        send_notification "critical" "API Service Recovery Failed" "Unable to recover API service after multiple restart attempts" "recovery_failed"
        return 1
    fi

    # Check response time
    if [ "$(echo "$api_response_time > 2.0" | bc -l)" = "1" ]; then
        log "WARNING" "API response time is high: ${api_response_time}s"

        # Try scaling up
        scale_service "api" "3"
        clear_redis_cache

        send_notification "warning" "API Performance Issue Detected" "High response time detected, scaled API service and cleared cache" "performance_optimization"
    fi

    # Check error rate
    if [ "$(echo "$api_error_rate > 5.0" | bc -l)" = "1" ]; then
        log "WARNING" "API error rate is high: ${api_error_rate}%"

        # Restart service and clear cache
        restart_docker_service "api" "1"
        clear_redis_cache

        send_notification "warning" "High API Error Rate Detected" "High error rate detected, restarted API service and cleared cache" "error_mitigation"
    fi
}

# Check database health
check_database_health() {
    local db_up=$(get_prometheus_metric 'pg_up')
    local db_connections=$(get_prometheus_metric '(pg_stat_database_numbackends / pg_settings_max_connections) * 100')
    local slow_queries=$(get_prometheus_metric 'pg_stat_activity_max_tx_duration{datname!=""}')

    # Check if database is down
    if [ "$db_up" != "1" ]; then
        log "WARNING" "Database is down, attempting recovery"

        restart_docker_service "postgres" "1"
        send_notification "critical" "Database Recovery Attempted" "Database was down, attempted automatic restart" "db_restart"
        return 1
    fi

    # Check connection usage
    if [ "$(echo "$db_connections > 80.0" | bc -l)" = "1" ]; then
        log "WARNING" "Database connection usage is high: ${db_connections}%"

        # Kill idle connections
        docker exec -it restauranthub-postgres psql -U postgres -d restauranthub -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND now() - state_change > interval '10 minutes';"

        send_notification "warning" "High Database Connections" "High connection usage detected, terminated idle connections" "connection_cleanup"
    fi

    # Check for slow queries
    if [ "$(echo "$slow_queries > 60.0" | bc -l)" = "1" ]; then
        log "WARNING" "Slow database queries detected: ${slow_queries}s"

        kill_long_running_queries "5 minutes"
        perform_database_maintenance
    fi
}

# Check memory usage
check_memory_usage() {
    local memory_usage=$(get_prometheus_metric '(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100')

    if [ "$(echo "$memory_usage > 90.0" | bc -l)" = "1" ]; then
        log "WARNING" "High memory usage detected: ${memory_usage}%"

        # Perform system cleanup
        perform_system_cleanup

        # Restart memory-intensive services
        restart_docker_service "api" "1"

        send_notification "warning" "High Memory Usage" "High memory usage detected, performed cleanup and service restart" "memory_optimization"
    fi
}

# Check disk usage
check_disk_usage() {
    local disk_usage=$(get_prometheus_metric '(1 - (node_filesystem_avail_bytes{fstype!="tmpfs"} / node_filesystem_size_bytes{fstype!="tmpfs"})) * 100')

    if [ "$(echo "$disk_usage > 85.0" | bc -l)" = "1" ]; then
        log "WARNING" "High disk usage detected: ${disk_usage}%"

        # Perform cleanup
        perform_system_cleanup

        # Clean old logs
        find /var/log -name "*.log" -mtime +3 -delete

        send_notification "warning" "High Disk Usage" "High disk usage detected, performed cleanup operations" "disk_cleanup"
    fi
}

# Check Redis health
check_redis_health() {
    local redis_up=$(get_prometheus_metric 'redis_up')
    local redis_memory=$(get_prometheus_metric '(redis_memory_used_bytes / redis_memory_max_bytes) * 100')

    if [ "$redis_up" != "1" ]; then
        log "WARNING" "Redis is down, attempting recovery"
        restart_docker_service "redis" "1"
        send_notification "warning" "Redis Recovery Attempted" "Redis was down, attempted automatic restart" "redis_restart"
    fi

    if [ "$(echo "$redis_memory > 90.0" | bc -l)" = "1" ]; then
        log "WARNING" "Redis memory usage is high: ${redis_memory}%"
        clear_redis_cache
    fi
}

# Main recovery function
main() {
    log "INFO" "Starting self-healing auto-recovery check"

    # Record start time
    local start_time=$(date +%s)
    send_metric "self_healing_check_started_timestamp" "$start_time" ""

    # Check if we're in cooldown period
    local last_recovery_file="/tmp/last_recovery_timestamp"
    if [[ -f "$last_recovery_file" ]]; then
        local last_recovery=$(cat "$last_recovery_file")
        local current_time=$(date +%s)
        local time_diff=$((current_time - last_recovery))

        if [ "$time_diff" -lt "$RECOVERY_COOLDOWN" ]; then
            log "INFO" "In cooldown period, skipping recovery check"
            exit 0
        fi
    fi

    # Perform health checks and recovery actions
    local recovery_actions=0

    # API Health Check
    if ! check_api_health; then
        ((recovery_actions++))
    fi

    # Database Health Check
    if ! check_database_health; then
        ((recovery_actions++))
    fi

    # Redis Health Check
    if ! check_redis_health; then
        ((recovery_actions++))
    fi

    # System Resource Checks
    check_memory_usage
    check_disk_usage

    # Record recovery actions
    if [ "$recovery_actions" -gt 0 ]; then
        echo "$(date +%s)" > "$last_recovery_file"
        send_metric "self_healing_recovery_actions_total" "$recovery_actions" ""
        log "INFO" "Completed $recovery_actions recovery actions"
    else
        log "INFO" "No recovery actions needed - system is healthy"
    fi

    # Record completion
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    send_metric "self_healing_check_duration_seconds" "$duration" ""
    send_metric "self_healing_check_completed_timestamp" "$end_time" ""

    log "INFO" "Self-healing check completed in ${duration} seconds"
}

# Error handling
trap 'log "ERROR" "Self-healing script failed with exit code $?"; send_metric "self_healing_check_failures_total" "1" ""; exit 1' ERR

# Run main function
main "$@"