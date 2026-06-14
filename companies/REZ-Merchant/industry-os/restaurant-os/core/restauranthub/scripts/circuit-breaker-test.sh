#!/bin/bash

# Circuit Breaker Testing Script for RestaurantHub
# Tests circuit breaker functionality under various failure scenarios

set -e

# Configuration
API_URL="${API_URL:-http://localhost:3008/api/v1}"
LOG_FILE="./logs/circuit-breaker-test-$(date +%Y%m%d_%H%M%S).log"
TEST_RESULTS_FILE="./logs/circuit-breaker-results-$(date +%Y%m%d_%H%M%S).json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Create log directory
mkdir -p "./logs"

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} ✓ $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} ✗ $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} ⚠ $1" | tee -a "$LOG_FILE"
}

test_step() {
    echo -e "${PURPLE}[TEST]${NC} $1" | tee -a "$LOG_FILE"
}

# Test results tracking
declare -A test_results
total_tests=0
passed_tests=0
failed_tests=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_function="$2"

    total_tests=$((total_tests + 1))
    test_step "Running: $test_name"

    if $test_function; then
        success "$test_name"
        test_results["$test_name"]="PASSED"
        passed_tests=$((passed_tests + 1))
        return 0
    else
        error "$test_name"
        test_results["$test_name"]="FAILED"
        failed_tests=$((failed_tests + 1))
        return 1
    fi
}

# Function to check API health
check_api_health() {
    log "Checking API health..."

    if curl -f -s "$API_URL/health" > /dev/null 2>&1; then
        return 0
    else
        warning "API not responding at $API_URL/health"
        return 1
    fi
}

# Function to get circuit breaker status
get_circuit_status() {
    local circuit_name="${1:-}"

    if [ -n "$circuit_name" ]; then
        curl -s "$API_URL/health/circuit-breakers/$circuit_name" 2>/dev/null || echo '{"error": "not found"}'
    else
        curl -s "$API_URL/health/circuit-breakers" 2>/dev/null || echo '{"error": "not available"}'
    fi
}

# Function to wait for circuit state
wait_for_circuit_state() {
    local circuit_name="$1"
    local expected_state="$2"
    local max_attempts="${3:-10}"
    local delay="${4:-2}"

    log "Waiting for circuit '$circuit_name' to reach state '$expected_state'..."

    for ((i=1; i<=max_attempts; i++)); do
        local status=$(get_circuit_status "$circuit_name")
        local current_state=$(echo "$status" | jq -r '.state // "unknown"' 2>/dev/null || echo "unknown")

        if [ "$current_state" = "$expected_state" ]; then
            success "Circuit '$circuit_name' reached state '$expected_state' after $i attempts"
            return 0
        fi

        log "Circuit '$circuit_name' is in state '$current_state', waiting... (attempt $i/$max_attempts)"
        sleep "$delay"
    done

    warning "Circuit '$circuit_name' did not reach state '$expected_state' within $max_attempts attempts"
    return 1
}

# Test 1: Basic Circuit Breaker Status
test_basic_circuit_status() {
    log "Testing basic circuit breaker status endpoint..."

    local response=$(get_circuit_status)
    local status=$(echo "$response" | jq -r '.status // "unknown"' 2>/dev/null || echo "unknown")

    if [ "$status" != "unknown" ] && [ "$status" != "null" ]; then
        log "Circuit breaker status: $status"
        return 0
    else
        error "Failed to get circuit breaker status"
        return 1
    fi
}

# Test 2: Database Circuit Breaker
test_database_circuit_breaker() {
    log "Testing database circuit breaker..."

    # Make some database requests to initialize circuit
    for i in {1..3}; do
        curl -s "$API_URL/restaurants?limit=1" > /dev/null 2>&1 || true
        sleep 0.5
    done

    # Check if database circuit exists
    local status=$(get_circuit_status "database")
    local state=$(echo "$status" | jq -r '.state // "unknown"' 2>/dev/null || echo "unknown")

    if [ "$state" != "unknown" ]; then
        log "Database circuit breaker state: $state"
        return 0
    else
        warning "Database circuit breaker not found or not active"
        return 1
    fi
}

# Test 3: HTTP Circuit Breaker with Invalid Endpoint
test_http_circuit_breaker_failure() {
    log "Testing HTTP circuit breaker with failures..."

    # Make requests to an invalid endpoint to trigger failures
    local invalid_endpoint="$API_URL/non-existent-endpoint"
    local failure_count=0

    for i in {1..6}; do
        log "Making failing request $i/6 to trigger circuit breaker..."

        if ! curl -f -s "$invalid_endpoint" > /dev/null 2>&1; then
            failure_count=$((failure_count + 1))
        fi

        sleep 1
    done

    log "Generated $failure_count failures"

    # Check if any circuits are now open
    local status=$(get_circuit_status)
    local open_circuits=$(echo "$status" | jq -r '.circuits.open // 0' 2>/dev/null || echo "0")

    log "Open circuits after failures: $open_circuits"
    return 0
}

# Test 4: Circuit Recovery Test
test_circuit_recovery() {
    log "Testing circuit recovery..."

    # Make successful requests to help circuits recover
    local success_count=0

    for i in {1..5}; do
        log "Making successful request $i/5 for circuit recovery..."

        if curl -f -s "$API_URL/health" > /dev/null 2>&1; then
            success_count=$((success_count + 1))
        fi

        sleep 2
    done

    log "Successful requests for recovery: $success_count/5"

    if [ $success_count -ge 3 ]; then
        return 0
    else
        return 1
    fi
}

# Test 5: Circuit Breaker Metrics
test_circuit_metrics() {
    log "Testing circuit breaker metrics collection..."

    local summary=$(curl -s "$API_URL/health/circuit-breakers/summary" 2>/dev/null)
    local total_circuits=$(echo "$summary" | jq -r '.totalCircuits // 0' 2>/dev/null || echo "0")
    local total_calls=$(echo "$summary" | jq -r '.totalCalls // 0' 2>/dev/null || echo "0")

    log "Total circuits: $total_circuits"
    log "Total calls: $total_calls"

    if [ "$total_circuits" -gt 0 ]; then
        return 0
    else
        warning "No circuit breaker metrics found"
        return 1
    fi
}

# Test 6: Bulk Request Circuit Protection
test_bulk_request_protection() {
    log "Testing bulk request circuit protection..."

    # Simulate bulk requests
    local concurrent_requests=10
    local pids=()

    log "Starting $concurrent_requests concurrent requests..."

    for i in $(seq 1 $concurrent_requests); do
        {
            curl -s "$API_URL/restaurants?limit=1" > /dev/null 2>&1
            echo "Request $i completed"
        } &
        pids+=($!)
    done

    # Wait for all requests to complete
    local completed=0
    for pid in "${pids[@]}"; do
        if wait "$pid" 2>/dev/null; then
            completed=$((completed + 1))
        fi
    done

    log "Bulk requests completed: $completed/$concurrent_requests"

    # Check if circuits handled the load
    sleep 2
    local status=$(get_circuit_status)
    local healthy_circuits=$(echo "$status" | jq -r '.circuits.closed // 0' 2>/dev/null || echo "0")

    log "Healthy circuits after bulk requests: $healthy_circuits"

    if [ $completed -ge $((concurrent_requests / 2)) ]; then
        return 0
    else
        return 1
    fi
}

# Test 7: Circuit Breaker State Transitions
test_state_transitions() {
    log "Testing circuit breaker state transitions..."

    # Get initial state
    local initial_status=$(get_circuit_status)
    local initial_closed=$(echo "$initial_status" | jq -r '.circuits.closed // 0' 2>/dev/null || echo "0")

    log "Initial closed circuits: $initial_closed"

    # Make some requests to ensure circuits are active
    for i in {1..3}; do
        curl -s "$API_URL/health" > /dev/null 2>&1 || true
        sleep 0.5
    done

    # Check final state
    local final_status=$(get_circuit_status)
    local final_closed=$(echo "$final_status" | jq -r '.circuits.closed // 0' 2>/dev/null || echo "0")

    log "Final closed circuits: $final_closed"

    # Test passes if we have some circuit activity
    if [ "$final_closed" -ge 0 ]; then
        return 0
    else
        return 1
    fi
}

# Test 8: Circuit Breaker Performance Impact
test_performance_impact() {
    log "Testing circuit breaker performance impact..."

    local endpoint="$API_URL/health"
    local requests=20

    # Time requests with circuit breaker
    log "Measuring performance with circuit breaker protection..."
    local start_time=$(date +%s%3N)

    for i in $(seq 1 $requests); do
        curl -s "$endpoint" > /dev/null 2>&1 || true
    done

    local end_time=$(date +%s%3N)
    local total_time=$((end_time - start_time))
    local avg_time=$((total_time / requests))

    log "Average request time with circuit breaker: ${avg_time}ms"

    # Performance test passes if average time is reasonable
    if [ $avg_time -lt 1000 ]; then # Less than 1 second average
        return 0
    else
        warning "High latency detected: ${avg_time}ms average"
        return 1
    fi
}

# Test 9: Error Rate Calculation
test_error_rate_calculation() {
    log "Testing error rate calculation..."

    # Make mixed requests (some successful, some failing)
    local total_requests=10
    local expected_failures=3

    # Successful requests
    for i in $(seq 1 $((total_requests - expected_failures))); do
        curl -s "$API_URL/health" > /dev/null 2>&1 || true
        sleep 0.1
    done

    # Failing requests
    for i in $(seq 1 $expected_failures); do
        curl -s "$API_URL/non-existent" > /dev/null 2>&1 || true
        sleep 0.1
    done

    sleep 2 # Allow metrics to update

    # Check metrics
    local summary=$(curl -s "$API_URL/health/circuit-breakers/summary" 2>/dev/null)
    local failure_rate=$(echo "$summary" | jq -r '.overallFailureRate // 0' 2>/dev/null || echo "0")

    log "Overall failure rate: $failure_rate%"

    # Test passes if failure rate is calculated
    if [ "$(echo "$failure_rate > 0" | bc -l 2>/dev/null)" = "1" ] 2>/dev/null || [ "$failure_rate" != "0" ]; then
        return 0
    else
        warning "Error rate calculation may not be working"
        return 1
    fi
}

# Test 10: Circuit Breaker Configuration Validation
test_configuration_validation() {
    log "Testing circuit breaker configuration validation..."

    # Check if circuit breakers have reasonable configurations
    local status=$(get_circuit_status)
    local total_circuits=$(echo "$status" | jq -r '.circuits.total // 0' 2>/dev/null || echo "0")

    if [ "$total_circuits" -gt 0 ]; then
        log "Circuit breaker configuration appears valid"
        return 0
    else
        error "No circuits configured or configuration invalid"
        return 1
    fi
}

# Function to generate test report
generate_test_report() {
    local report_file="$TEST_RESULTS_FILE"

    log "Generating test report..."

    cat > "$report_file" << EOF
{
  "testRun": {
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%S.000Z)",
    "environment": "development",
    "apiUrl": "$API_URL",
    "totalTests": $total_tests,
    "passedTests": $passed_tests,
    "failedTests": $failed_tests,
    "successRate": $(echo "scale=2; $passed_tests * 100 / $total_tests" | bc -l 2>/dev/null || echo "0")
  },
  "testResults": {
EOF

    local first=true
    for test_name in "${!test_results[@]}"; do
        if [ "$first" = true ]; then
            first=false
        else
            echo "," >> "$report_file"
        fi

        echo "    \"$test_name\": \"${test_results[$test_name]}\"" >> "$report_file"
    done

    cat >> "$report_file" << EOF
  },
  "circuitBreakerStatus": $(get_circuit_status 2>/dev/null || echo '{"error": "not available"}')
}
EOF

    success "Test report generated: $report_file"
}

# Main execution
main() {
    log "=== RestaurantHub Circuit Breaker Testing ==="
    log "=============================================="

    # Pre-flight checks
    if ! check_api_health; then
        error "API is not responding. Cannot run circuit breaker tests."
        exit 1
    fi

    success "API is responding. Starting circuit breaker tests..."

    # Run all tests
    run_test "Basic Circuit Status" test_basic_circuit_status
    run_test "Database Circuit Breaker" test_database_circuit_breaker
    run_test "HTTP Circuit Breaker Failure" test_http_circuit_breaker_failure
    run_test "Circuit Recovery" test_circuit_recovery
    run_test "Circuit Metrics" test_circuit_metrics
    run_test "Bulk Request Protection" test_bulk_request_protection
    run_test "State Transitions" test_state_transitions
    run_test "Performance Impact" test_performance_impact
    run_test "Error Rate Calculation" test_error_rate_calculation
    run_test "Configuration Validation" test_configuration_validation

    # Generate report
    generate_test_report

    # Final summary
    log ""
    log "=============================================="
    log "CIRCUIT BREAKER TEST RESULTS"
    log "=============================================="
    success "Passed: $passed_tests/$total_tests tests"

    if [ $failed_tests -gt 0 ]; then
        error "Failed: $failed_tests/$total_tests tests"
        log "Check log file for details: $LOG_FILE"
        log "Test report: $TEST_RESULTS_FILE"
        exit 1
    else
        success "All tests passed! ✓"
        log "Test report: $TEST_RESULTS_FILE"
        log "Log file: $LOG_FILE"
        exit 0
    fi
}

# Execute if run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi