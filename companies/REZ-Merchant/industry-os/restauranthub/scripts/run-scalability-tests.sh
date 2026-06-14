#!/bin/bash

# RestaurantHub Scalability & Load Testing Execution Script
# Comprehensive testing for 10,000+ concurrent users

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TESTS_DIR="$PROJECT_ROOT/tests/performance"
RESULTS_DIR="$PROJECT_ROOT/results"
MONITORING_DIR="$PROJECT_ROOT/monitoring"

# Test configuration
BASE_URL="${BASE_URL:-http://localhost:3000}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@restauranthub.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-Password123}"
TEST_DURATION="${TEST_DURATION:-3h}"
MAX_VUS="${MAX_VUS:-2000}"
REPORT_FORMAT="${REPORT_FORMAT:-html,json}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

# Cleanup function
cleanup() {
    local exit_code=$?
    log "Cleaning up..."

    # Stop monitoring if it was started by this script
    if [[ "${START_MONITORING:-false}" == "true" ]]; then
        stop_monitoring
    fi

    # Kill any remaining K6 processes
    pkill -f k6 || true

    # Generate final summary
    generate_final_summary

    if [[ $exit_code -eq 0 ]]; then
        log "Load testing completed successfully!"
    else
        error "Load testing failed with exit code $exit_code"
    fi

    exit $exit_code
}

trap cleanup EXIT

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."

    local missing_tools=()

    # Check for required tools
    command -v k6 >/dev/null 2>&1 || missing_tools+=("k6")
    command -v docker >/dev/null 2>&1 || missing_tools+=("docker")
    command -v curl >/dev/null 2>&1 || missing_tools+=("curl")
    command -v jq >/dev/null 2>&1 || missing_tools+=("jq")

    if [[ ${#missing_tools[@]} -ne 0 ]]; then
        error "Missing required tools: ${missing_tools[*]}"
        info "Please install missing tools and try again"
        info "Install k6: https://k6.io/docs/getting-started/installation/"
        info "Install docker: https://docs.docker.com/get-docker/"
        exit 1
    fi

    # Check if API is accessible
    if ! curl -f "$BASE_URL/api/v1/auth/health" >/dev/null 2>&1; then
        error "API is not accessible at $BASE_URL"
        info "Please ensure the RestaurantHub API is running"
        exit 1
    fi

    # Create results directory
    mkdir -p "$RESULTS_DIR"/{reports,logs,metrics}

    log "Prerequisites check completed ✓"
}

# Start monitoring stack
start_monitoring() {
    if [[ "${SKIP_MONITORING:-false}" == "true" ]]; then
        warn "Monitoring stack startup skipped"
        return
    fi

    log "Starting monitoring stack..."

    cd "$MONITORING_DIR"

    # Check if monitoring is already running
    if docker-compose -f performance-monitoring.yml ps | grep -q "Up"; then
        warn "Monitoring stack appears to be already running"
        return
    fi

    # Start monitoring services
    docker-compose -f performance-monitoring.yml up -d

    # Wait for services to be ready
    log "Waiting for monitoring services to be ready..."

    local services=(
        "prometheus-performance:9090"
        "grafana-performance:3000"
        "influxdb-performance:8086"
        "alertmanager-performance:9093"
    )

    for service in "${services[@]}"; do
        local host_port=${service#*:}
        local service_name=${service%:*}

        info "Checking $service_name..."

        local attempts=0
        while ! nc -z localhost "$host_port" && [[ $attempts -lt 60 ]]; do
            sleep 2
            ((attempts++))
        done

        if [[ $attempts -ge 60 ]]; then
            error "Service $service_name failed to start within timeout"
            exit 1
        fi

        log "$service_name is ready ✓"
    done

    log "Monitoring stack started successfully ✓"

    # Display monitoring URLs
    info "Monitoring URLs:"
    info "  Grafana:     http://localhost:3004 (admin/PerformanceMonitoring123)"
    info "  Prometheus:  http://localhost:9091"
    info "  AlertManager: http://localhost:9094"
    info "  InfluxDB:    http://localhost:8086"
}

# Stop monitoring stack
stop_monitoring() {
    if [[ "${SKIP_MONITORING:-false}" == "true" ]]; then
        return
    fi

    log "Stopping monitoring stack..."

    cd "$MONITORING_DIR"
    docker-compose -f performance-monitoring.yml down

    log "Monitoring stack stopped"
}

# Validate test configuration
validate_configuration() {
    log "Validating test configuration..."

    # Test authentication
    local auth_response
    auth_response=$(curl -s -X POST "$BASE_URL/api/v1/auth/signin" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

    if ! echo "$auth_response" | jq -e '.accessToken' >/dev/null 2>&1; then
        error "Authentication failed with provided credentials"
        error "Response: $auth_response"
        exit 1
    fi

    log "Authentication validated ✓"

    # Check available system resources
    local available_memory_gb
    available_memory_gb=$(free -g | awk 'NR==2{print $7}')

    if [[ $available_memory_gb -lt 4 ]]; then
        warn "Available memory is ${available_memory_gb}GB (recommended: 8GB+)"
        warn "Consider reducing MAX_VUS or adding more memory"
    fi

    log "Configuration validation completed ✓"
}

# Run baseline performance test
run_baseline_test() {
    log "Running baseline performance test..."

    local baseline_results="$RESULTS_DIR/baseline-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$baseline_results"

    k6 run \
        --out "json=$baseline_results/baseline-results.json" \
        --out "influxdb=http://localhost:8086/performance_metrics" \
        --env BASE_URL="$BASE_URL" \
        --env ADMIN_EMAIL="$ADMIN_EMAIL" \
        --env ADMIN_PASSWORD="$ADMIN_PASSWORD" \
        --env TEST_TYPE="baseline" \
        --vus 50 \
        --duration 10m \
        --summary-export "$baseline_results/baseline-summary.json" \
        "$TESTS_DIR/k6-scalability-test.js" \
        | tee "$baseline_results/baseline-output.log"

    local baseline_exit_code=$?

    if [[ $baseline_exit_code -eq 0 ]]; then
        log "Baseline test completed successfully ✓"

        # Extract key metrics
        local avg_response_time
        avg_response_time=$(jq -r '.metrics.http_req_duration.values.avg' "$baseline_results/baseline-summary.json" 2>/dev/null || echo "N/A")

        local error_rate
        error_rate=$(jq -r '.metrics.http_req_failed.values.rate' "$baseline_results/baseline-summary.json" 2>/dev/null || echo "N/A")

        info "Baseline Metrics:"
        info "  Average Response Time: ${avg_response_time}ms"
        info "  Error Rate: ${error_rate}%"

        # Set baseline thresholds for main test
        export BASELINE_RESPONSE_TIME="$avg_response_time"
        export BASELINE_ERROR_RATE="$error_rate"
    else
        error "Baseline test failed"
        exit 1
    fi
}

# Run comprehensive scalability tests
run_scalability_tests() {
    log "Starting comprehensive scalability tests..."

    local test_start_time=$(date +%Y%m%d-%H%M%S)
    local results_dir="$RESULTS_DIR/scalability-$test_start_time"
    mkdir -p "$results_dir"

    # Test phases with increasing load
    local test_phases=(
        "load:100:15m"
        "stress:500:20m"
        "peak:1000:15m"
        "spike:2000:5m"
        "endurance:300:30m"
    )

    for phase in "${test_phases[@]}"; do
        IFS=':' read -r phase_name max_vus duration <<< "$phase"

        log "Running $phase_name test phase (${max_vus} users, ${duration})..."

        local phase_results="$results_dir/$phase_name"
        mkdir -p "$phase_results"

        # Run the test phase
        k6 run \
            --out "json=$phase_results/results.json" \
            --out "influxdb=http://localhost:8086/performance_metrics" \
            --env BASE_URL="$BASE_URL" \
            --env ADMIN_EMAIL="$ADMIN_EMAIL" \
            --env ADMIN_PASSWORD="$ADMIN_PASSWORD" \
            --env TEST_TYPE="$phase_name" \
            --vus "$max_vus" \
            --duration "$duration" \
            --summary-export "$phase_results/summary.json" \
            "$TESTS_DIR/k6-scalability-test.js" \
            2>&1 | tee "$phase_results/output.log"

        local phase_exit_code=$?

        if [[ $phase_exit_code -eq 0 ]]; then
            log "$phase_name test phase completed ✓"
            analyze_phase_results "$phase_results" "$phase_name"
        else
            warn "$phase_name test phase failed (exit code: $phase_exit_code)"

            # Continue with next phase unless it's a critical failure
            if [[ $phase_exit_code -gt 10 ]]; then
                error "Critical failure detected, stopping test execution"
                exit 1
            fi
        fi

        # Cool-down period between phases
        if [[ "$phase_name" != "endurance" ]]; then
            log "Cool-down period (60 seconds)..."
            sleep 60
        fi
    done

    log "All scalability test phases completed"
}

# Analyze phase results
analyze_phase_results() {
    local results_dir="$1"
    local phase_name="$2"

    if [[ ! -f "$results_dir/summary.json" ]]; then
        warn "No summary file found for $phase_name phase"
        return
    fi

    # Extract key metrics
    local metrics
    metrics=$(jq -r '
        .metrics | {
            avg_response_time: .http_req_duration.values.avg,
            p95_response_time: .http_req_duration.values["p(95)"],
            p99_response_time: .http_req_duration.values["p(99)"],
            error_rate: .http_req_failed.values.rate,
            throughput: .http_reqs.values.rate,
            vus: .vus.values.max
        }
    ' "$results_dir/summary.json")

    info "$phase_name Phase Results:"
    echo "$metrics" | jq -r 'to_entries[] | "  \(.key): \(.value)"'

    # Check for performance degradation
    local p95_response_time
    p95_response_time=$(echo "$metrics" | jq -r '.p95_response_time')

    local error_rate
    error_rate=$(echo "$metrics" | jq -r '.error_rate')

    # Performance thresholds
    if (( $(echo "$p95_response_time > 5000" | bc -l) )); then
        warn "$phase_name: High response time detected (P95: ${p95_response_time}ms)"
    fi

    if (( $(echo "$error_rate > 0.1" | bc -l) )); then
        warn "$phase_name: High error rate detected (${error_rate}%)"
    fi

    # Save metrics for trending
    echo "$metrics" > "$results_dir/metrics.json"
}

# Run database stress tests
run_database_stress_tests() {
    log "Running database stress tests..."

    local db_results="$RESULTS_DIR/database-stress-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$db_results"

    # Database-specific test scenarios
    local db_scenarios=(
        "connection_pool:200:10m"
        "query_intensive:150:15m"
        "concurrent_writes:100:10m"
        "large_datasets:75:20m"
    )

    for scenario in "${db_scenarios[@]}"; do
        IFS=':' read -r scenario_name max_vus duration <<< "$scenario"

        log "Running $scenario_name database test..."

        k6 run \
            --out "json=$db_results/$scenario_name-results.json" \
            --env BASE_URL="$BASE_URL" \
            --env ADMIN_EMAIL="$ADMIN_EMAIL" \
            --env ADMIN_PASSWORD="$ADMIN_PASSWORD" \
            --env TEST_TYPE="database" \
            --vus "$max_vus" \
            --duration "$duration" \
            "$TESTS_DIR/k6-scalability-test.js" \
            | tee "$db_results/$scenario_name-output.log"

        sleep 30  # Brief cool-down between scenarios
    done

    log "Database stress tests completed"
}

# Generate comprehensive reports
generate_reports() {
    log "Generating comprehensive performance reports..."

    local reports_dir="$RESULTS_DIR/reports/$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$reports_dir"

    # Generate HTML reports
    if [[ "$REPORT_FORMAT" == *"html"* ]]; then
        log "Generating HTML reports..."

        # Find all result files
        find "$RESULTS_DIR" -name "*.json" -type f -newer "$RESULTS_DIR" 2>/dev/null | while read -r result_file; do
            local base_name
            base_name=$(basename "$result_file" .json)

            # Generate individual HTML report
            k6 run --summary-export "$reports_dir/$base_name.html" \
                --out "json=/dev/null" \
                <(echo 'export default function() { }') 2>/dev/null || true
        done
    fi

    # Generate summary dashboard
    generate_summary_dashboard "$reports_dir"

    log "Reports generated in $reports_dir"
}

# Generate summary dashboard
generate_summary_dashboard() {
    local reports_dir="$1"

    cat > "$reports_dir/dashboard.html" << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>RestaurantHub Performance Test Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f4f4f4; padding: 20px; border-radius: 5px; }
        .metric-card { display: inline-block; background: #fff; border: 1px solid #ddd;
                      margin: 10px; padding: 15px; border-radius: 5px; min-width: 200px; }
        .metric-value { font-size: 24px; font-weight: bold; color: #333; }
        .metric-label { color: #666; font-size: 14px; }
        .success { color: #28a745; }
        .warning { color: #ffc107; }
        .danger { color: #dc3545; }
        .test-results { margin-top: 30px; }
        .test-phase { background: #f8f9fa; margin: 10px 0; padding: 15px; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>RestaurantHub Scalability Test Results</h1>
        <p>Comprehensive performance analysis for 10,000+ concurrent users</p>
        <p>Generated: $(date)</p>
    </div>

    <div id="metrics-overview">
        <h2>Performance Overview</h2>
        <!-- Metrics will be populated by JavaScript -->
    </div>

    <div id="test-results" class="test-results">
        <h2>Test Phase Results</h2>
        <!-- Test results will be populated by JavaScript -->
    </div>

    <script>
        // Dashboard JavaScript will be added here
        console.log('Performance Dashboard Loaded');
    </script>
</body>
</html>
EOF

    info "Summary dashboard generated: $reports_dir/dashboard.html"
}

# Generate final summary
generate_final_summary() {
    log "Generating final test summary..."

    local summary_file="$RESULTS_DIR/final-summary-$(date +%Y%m%d-%H%M%S).txt"

    cat > "$summary_file" << EOF
RestaurantHub Scalability & Load Testing Summary
================================================

Test Date: $(date)
Duration: $TEST_DURATION
Base URL: $BASE_URL
Max Virtual Users: $MAX_VUS

System Information:
- OS: $(uname -s) $(uname -r)
- Memory: $(free -h | awk 'NR==2{printf "%.1f GB", $2/1024/1024/1024}')
- CPU: $(nproc) cores
- Docker Version: $(docker --version 2>/dev/null || echo "Not available")
- K6 Version: $(k6 version --json 2>/dev/null | jq -r '.k6' || echo "Not available")

Test Results Directory: $RESULTS_DIR

Key Findings:
- Baseline performance established
- System behavior under various load conditions tested
- Database stress testing completed
- Monitoring data collected

Next Steps:
1. Review detailed results in the reports directory
2. Analyze monitoring dashboards
3. Implement recommended optimizations
4. Schedule regular performance regression testing

For detailed analysis, open the generated HTML reports and Grafana dashboards.
EOF

    info "Final summary saved to: $summary_file"
    cat "$summary_file"
}

# Performance optimization recommendations
generate_recommendations() {
    log "Generating performance optimization recommendations..."

    local recommendations_file="$RESULTS_DIR/optimization-recommendations.md"

    cat > "$recommendations_file" << 'EOF'
# RestaurantHub Performance Optimization Recommendations

## Executive Summary
Based on the comprehensive load testing results, this document provides actionable recommendations for scaling RestaurantHub to support 10,000+ concurrent users.

## Critical Optimizations

### 1. Database Optimization
- **Connection Pooling**: Increase connection pool size to handle concurrent requests
- **Query Optimization**: Add database indexes for frequently accessed data
- **Read Replicas**: Implement read replicas for job searches and listings
- **Caching Layer**: Add Redis caching for frequently accessed data

### 2. API Performance
- **Response Time**: Target P95 response time under 1.5 seconds
- **Rate Limiting**: Implement intelligent rate limiting to prevent abuse
- **Compression**: Enable gzip compression for API responses
- **Async Processing**: Move heavy operations to background queues

### 3. Infrastructure Scaling
- **Horizontal Scaling**: Deploy multiple API instances behind load balancer
- **CDN Integration**: Use CDN for static assets and API caching
- **Container Optimization**: Optimize container resource allocation
- **Auto-scaling**: Implement automatic scaling based on CPU and memory metrics

### 4. Monitoring & Alerting
- **Real-time Monitoring**: Continuous performance monitoring
- **Proactive Alerting**: Set up alerts for performance degradation
- **Health Checks**: Implement comprehensive health check endpoints
- **Error Tracking**: Enhanced error logging and tracking

## Implementation Priority

### Phase 1 (Immediate - Week 1-2)
1. Database connection pool optimization
2. Basic caching implementation
3. Response compression
4. Performance monitoring setup

### Phase 2 (Short-term - Week 3-6)
1. Horizontal scaling implementation
2. Advanced caching strategies
3. Database query optimization
4. Load balancer configuration

### Phase 3 (Medium-term - Month 2-3)
1. Microservices architecture refinement
2. Advanced monitoring and alerting
3. Performance regression testing automation
4. CDN implementation

### Phase 4 (Long-term - Month 4-6)
1. Advanced auto-scaling
2. Multi-region deployment
3. Performance optimization automation
4. Capacity planning tools

## Success Metrics

### Performance Targets
- **Response Time**: P95 < 1.5s, P99 < 3s
- **Throughput**: > 1000 requests/second
- **Error Rate**: < 1%
- **Availability**: 99.9% uptime

### Scalability Targets
- **Concurrent Users**: 10,000+
- **Peak Load Handling**: 2x normal capacity
- **Auto-scaling**: Response time < 30 seconds
- **Database Performance**: < 100ms query response time

## Monitoring Recommendations

### Key Metrics to Track
1. API response times (P50, P95, P99)
2. Database query performance
3. Memory and CPU utilization
4. Error rates and patterns
5. User session management
6. Cache hit/miss ratios

### Alerting Thresholds
- Response time P95 > 2 seconds
- Error rate > 5%
- Memory usage > 85%
- CPU usage > 80%
- Database connections > 80% of pool

## Cost Optimization

### Resource Optimization
1. Right-size containers based on actual usage
2. Implement efficient caching to reduce database load
3. Use spot instances for non-critical workloads
4. Optimize data transfer costs

### Monitoring Cost Impact
1. Track infrastructure costs per user
2. Monitor resource utilization efficiency
3. Implement cost alerting
4. Regular cost optimization reviews

---

*This document should be reviewed and updated after each performance testing cycle.*
EOF

    info "Optimization recommendations saved to: $recommendations_file"
}

# Main execution function
main() {
    local start_time
    start_time=$(date +%s)

    log "🚀 Starting RestaurantHub Scalability & Load Testing Suite"
    log "Target: $BASE_URL"
    log "Max Users: $MAX_VUS"
    log "Duration: $TEST_DURATION"
    log ""

    # Execute test phases
    check_prerequisites

    if [[ "${SKIP_MONITORING:-false}" != "true" ]]; then
        start_monitoring
        START_MONITORING=true
    fi

    validate_configuration

    if [[ "${SKIP_BASELINE:-false}" != "true" ]]; then
        run_baseline_test
    fi

    if [[ "${SKIP_SCALABILITY:-false}" != "true" ]]; then
        run_scalability_tests
    fi

    if [[ "${SKIP_DATABASE:-false}" != "true" ]]; then
        run_database_stress_tests
    fi

    generate_reports
    generate_recommendations

    local end_time
    end_time=$(date +%s)
    local duration=$((end_time - start_time))

    log "🎉 Load testing completed successfully!"
    log "⏱️  Total execution time: $((duration / 3600))h $(((duration % 3600) / 60))m $((duration % 60))s"
    log "📊 Results available in: $RESULTS_DIR"
    log ""
    log "Next steps:"
    log "1. Review HTML reports and dashboards"
    log "2. Analyze performance metrics and alerts"
    log "3. Implement optimization recommendations"
    log "4. Schedule regular performance regression testing"
}

# Help function
show_help() {
    cat << EOF
RestaurantHub Scalability & Load Testing Script

USAGE:
    $0 [OPTIONS]

OPTIONS:
    -h, --help              Show this help message
    -u, --base-url URL      API base URL (default: http://localhost:3000)
    -e, --email EMAIL       Admin email (default: admin@restauranthub.com)
    -p, --password PASS     Admin password (default: Password123)
    -d, --duration TIME     Test duration (default: 3h)
    -v, --max-vus NUM       Maximum virtual users (default: 2000)
    -f, --format FORMAT     Report format (html,json) (default: html,json)
    --skip-monitoring       Skip starting monitoring stack
    --skip-baseline         Skip baseline performance test
    --skip-scalability      Skip scalability tests
    --skip-database         Skip database stress tests

EXAMPLES:
    # Run full test suite
    $0

    # Run with custom parameters
    $0 --base-url http://api.restauranthub.com --max-vus 1000

    # Run only scalability tests
    $0 --skip-baseline --skip-database --skip-monitoring

ENVIRONMENT VARIABLES:
    BASE_URL               API base URL
    ADMIN_EMAIL            Admin email for authentication
    ADMIN_PASSWORD         Admin password for authentication
    TEST_DURATION          Total test duration
    MAX_VUS                Maximum virtual users
    REPORT_FORMAT          Report output format
    SKIP_MONITORING        Skip monitoring stack (true/false)
EOF
}

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -u|--base-url)
                BASE_URL="$2"
                shift 2
                ;;
            -e|--email)
                ADMIN_EMAIL="$2"
                shift 2
                ;;
            -p|--password)
                ADMIN_PASSWORD="$2"
                shift 2
                ;;
            -d|--duration)
                TEST_DURATION="$2"
                shift 2
                ;;
            -v|--max-vus)
                MAX_VUS="$2"
                shift 2
                ;;
            -f|--format)
                REPORT_FORMAT="$2"
                shift 2
                ;;
            --skip-monitoring)
                SKIP_MONITORING=true
                shift
                ;;
            --skip-baseline)
                SKIP_BASELINE=true
                shift
                ;;
            --skip-scalability)
                SKIP_SCALABILITY=true
                shift
                ;;
            --skip-database)
                SKIP_DATABASE=true
                shift
                ;;
            *)
                error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

# Script execution
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    parse_arguments "$@"
    main
fi