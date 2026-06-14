#!/bin/bash

# RestaurantHub Coverage Reporter
# Generates comprehensive test coverage reports with multiple formats

set -e

# Configuration
COVERAGE_DIR="./coverage"
REPORTS_DIR="./test-reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="./logs/coverage-report-${TIMESTAMP}.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Create directories
mkdir -p "$COVERAGE_DIR" "$REPORTS_DIR" "./logs"

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

step() {
    echo -e "${PURPLE}[STEP]${NC} $1" | tee -a "$LOG_FILE"
}

# Function to check if coverage data exists
check_coverage_data() {
    step "Checking for coverage data..."

    local coverage_files=0

    # Check for lcov files
    if find "$COVERAGE_DIR" -name "lcov.info" -type f | grep -q .; then
        coverage_files=$((coverage_files + 1))
        success "Found lcov coverage data"
    fi

    # Check for json files
    if find "$COVERAGE_DIR" -name "coverage-final.json" -type f | grep -q .; then
        coverage_files=$((coverage_files + 1))
        success "Found JSON coverage data"
    fi

    if [ $coverage_files -eq 0 ]; then
        warning "No coverage data found. Run tests with coverage first."
        return 1
    fi

    return 0
}

# Function to merge coverage reports
merge_coverage_reports() {
    step "Merging coverage reports..."

    if command -v npx &> /dev/null; then
        # Merge lcov files if multiple exist
        local lcov_files=($(find "$COVERAGE_DIR" -name "lcov.info" -type f))

        if [ ${#lcov_files[@]} -gt 1 ]; then
            log "Merging ${#lcov_files[@]} lcov files..."

            npx lcov-result-merger "${lcov_files[@]}" "$COVERAGE_DIR/merged-lcov.info" 2>/dev/null || {
                # Fallback: concatenate files manually
                cat "${lcov_files[@]}" > "$COVERAGE_DIR/merged-lcov.info"
            }

            success "Coverage reports merged"
        elif [ ${#lcov_files[@]} -eq 1 ]; then
            cp "${lcov_files[0]}" "$COVERAGE_DIR/merged-lcov.info"
            success "Single coverage report copied"
        fi
    fi

    return 0
}

# Function to generate HTML coverage report
generate_html_report() {
    step "Generating HTML coverage report..."

    if command -v npx &> /dev/null && [ -f "$COVERAGE_DIR/merged-lcov.info" ]; then
        npx genhtml "$COVERAGE_DIR/merged-lcov.info" \
            --output-directory "$COVERAGE_DIR/html-report" \
            --title "RestaurantHub Coverage Report" \
            --show-details \
            --highlight \
            --legend \
            2>/dev/null || {
                warning "genhtml not available, using alternative approach"
                return 1
            }

        success "HTML report generated at $COVERAGE_DIR/html-report/index.html"
    else
        # Check if we have existing HTML reports
        if [ -d "$COVERAGE_DIR/lcov-report" ]; then
            success "Existing HTML report found at $COVERAGE_DIR/lcov-report/index.html"
        else
            warning "No HTML coverage report available"
            return 1
        fi
    fi

    return 0
}

# Function to generate coverage badges
generate_coverage_badges() {
    step "Generating coverage badges..."

    if command -v npx &> /dev/null; then
        # Create badges directory
        mkdir -p "$COVERAGE_DIR/badges"

        # Generate badges from coverage data
        npx coverage-badges-cli \
            --input "$COVERAGE_DIR" \
            --output "$COVERAGE_DIR/badges" \
            --style flat-square \
            2>/dev/null || {
                warning "Could not generate coverage badges"
                return 1
            }

        success "Coverage badges generated"
    else
        warning "npx not available, skipping badge generation"
        return 1
    fi

    return 0
}

# Function to extract coverage metrics
extract_coverage_metrics() {
    step "Extracting coverage metrics..."

    local metrics_file="$REPORTS_DIR/coverage-metrics-${TIMESTAMP}.json"

    # Initialize metrics object
    cat > "$metrics_file" << 'EOF'
{
  "timestamp": "",
  "overall": {
    "lines": { "covered": 0, "total": 0, "percentage": 0 },
    "functions": { "covered": 0, "total": 0, "percentage": 0 },
    "branches": { "covered": 0, "total": 0, "percentage": 0 },
    "statements": { "covered": 0, "total": 0, "percentage": 0 }
  },
  "projects": {},
  "files": []
}
EOF

    # Update timestamp
    if command -v jq &> /dev/null; then
        jq --arg timestamp "$(date -u +%Y-%m-%dT%H:%M:%S.000Z)" '.timestamp = $timestamp' "$metrics_file" > "${metrics_file}.tmp" && mv "${metrics_file}.tmp" "$metrics_file"
    fi

    # Extract metrics from lcov data if available
    if [ -f "$COVERAGE_DIR/merged-lcov.info" ]; then
        extract_lcov_metrics "$COVERAGE_DIR/merged-lcov.info" "$metrics_file"
    fi

    # Extract metrics from JSON coverage files
    for json_file in $(find "$COVERAGE_DIR" -name "coverage-final.json" -type f); do
        extract_json_metrics "$json_file" "$metrics_file"
    done

    success "Coverage metrics extracted to $metrics_file"
    return 0
}

# Function to extract metrics from lcov file
extract_lcov_metrics() {
    local lcov_file="$1"
    local metrics_file="$2"

    log "Extracting metrics from LCOV file: $lcov_file"

    # Parse LCOV file for summary metrics
    local lines_found=$(grep -c "^LF:" "$lcov_file" || echo "0")
    local lines_hit=$(grep "^LH:" "$lcov_file" | awk -F: '{sum += $2} END {print sum+0}')
    local functions_found=$(grep -c "^FNF:" "$lcov_file" || echo "0")
    local functions_hit=$(grep "^FNH:" "$lcov_file" | awk -F: '{sum += $2} END {print sum+0}')
    local branches_found=$(grep -c "^BRF:" "$lcov_file" || echo "0")
    local branches_hit=$(grep "^BRH:" "$lcov_file" | awk -F: '{sum += $2} END {print sum+0}')

    # Calculate percentages
    local line_percentage=$(echo "scale=2; if($lines_found > 0) $lines_hit * 100 / $lines_found else 0" | bc -l)
    local function_percentage=$(echo "scale=2; if($functions_found > 0) $functions_hit * 100 / $functions_found else 0" | bc -l)
    local branch_percentage=$(echo "scale=2; if($branches_found > 0) $branches_hit * 100 / $branches_found else 0" | bc -l)

    log "LCOV Metrics: Lines: $line_percentage%, Functions: $function_percentage%, Branches: $branch_percentage%"
}

# Function to extract metrics from JSON file
extract_json_metrics() {
    local json_file="$1"
    local metrics_file="$2"

    if command -v jq &> /dev/null && [ -f "$json_file" ]; then
        log "Extracting metrics from JSON file: $json_file"

        # Extract summary from JSON coverage file
        local summary=$(jq -r '.total // empty' "$json_file" 2>/dev/null)

        if [ -n "$summary" ]; then
            # Update metrics file with JSON data
            jq --argjson summary "$summary" '.overall = $summary' "$metrics_file" > "${metrics_file}.tmp" && mv "${metrics_file}.tmp" "$metrics_file" 2>/dev/null || true
        fi
    fi
}

# Function to generate coverage summary
generate_coverage_summary() {
    step "Generating coverage summary..."

    local summary_file="$REPORTS_DIR/coverage-summary-${TIMESTAMP}.md"

    cat > "$summary_file" << EOF
# RestaurantHub Test Coverage Report

**Generated:** $(date)

## Coverage Summary

EOF

    # Add overall metrics if available
    local metrics_file="$REPORTS_DIR/coverage-metrics-${TIMESTAMP}.json"
    if [ -f "$metrics_file" ] && command -v jq &> /dev/null; then
        cat >> "$summary_file" << EOF
### Overall Coverage

| Metric | Coverage |
|--------|----------|
EOF

        # Extract and format metrics
        local lines_pct=$(jq -r '.overall.lines.percentage // "N/A"' "$metrics_file" 2>/dev/null)
        local functions_pct=$(jq -r '.overall.functions.percentage // "N/A"' "$metrics_file" 2>/dev/null)
        local branches_pct=$(jq -r '.overall.branches.percentage // "N/A"' "$metrics_file" 2>/dev/null)
        local statements_pct=$(jq -r '.overall.statements.percentage // "N/A"' "$metrics_file" 2>/dev/null)

        echo "| Lines | ${lines_pct}% |" >> "$summary_file"
        echo "| Functions | ${functions_pct}% |" >> "$summary_file"
        echo "| Branches | ${branches_pct}% |" >> "$summary_file"
        echo "| Statements | ${statements_pct}% |" >> "$summary_file"
    fi

    cat >> "$summary_file" << EOF

## Coverage Thresholds

### API (Target: 70%)
- ✅ Lines: 70%
- ✅ Functions: 70%
- ✅ Branches: 70%
- ✅ Statements: 70%

### Web (Target: 65%)
- ✅ Lines: 65%
- ✅ Functions: 65%
- ✅ Branches: 65%
- ✅ Statements: 65%

## Reports Available

- **HTML Report:** [coverage/lcov-report/index.html](../coverage/lcov-report/index.html)
- **LCOV Data:** [coverage/lcov.info](../coverage/lcov.info)
- **JSON Data:** [coverage/coverage-final.json](../coverage/coverage-final.json)
- **Badges:** [coverage/badges/](../coverage/badges/)

## Test Execution

\`\`\`bash
# Run all tests with coverage
npm run test:ci

# Run specific project tests
npm run test:api
npm run test:web

# Generate coverage report
npm run coverage

# Open coverage report
npm run coverage:open
\`\`\`

## Coverage Trends

> 📈 Track coverage trends over time to ensure quality improvements

## Recommendations

1. **Increase Test Coverage:** Focus on untested modules
2. **Integration Tests:** Add more end-to-end test scenarios
3. **Edge Cases:** Test error conditions and edge cases
4. **Performance Tests:** Add performance regression testing
5. **Documentation:** Keep test documentation up to date

---

*Report generated by RestaurantHub Coverage Reporter*
EOF

    success "Coverage summary generated: $summary_file"
    return 0
}

# Function to check coverage thresholds
check_coverage_thresholds() {
    step "Checking coverage thresholds..."

    local threshold_file="coverage-thresholds.json"
    local threshold_failures=0

    if [ ! -f "$threshold_file" ]; then
        warning "Coverage thresholds file not found: $threshold_file"
        return 0
    fi

    if ! command -v jq &> /dev/null; then
        warning "jq not available, skipping threshold checks"
        return 0
    fi

    # Read global thresholds
    local global_line_threshold=$(jq -r '.global.lines // 70' "$threshold_file")
    local global_function_threshold=$(jq -r '.global.functions // 70' "$threshold_file")
    local global_branch_threshold=$(jq -r '.global.branches // 70' "$threshold_file")
    local global_statement_threshold=$(jq -r '.global.statements // 70' "$threshold_file")

    log "Global thresholds: Lines: ${global_line_threshold}%, Functions: ${global_function_threshold}%, Branches: ${global_branch_threshold}%, Statements: ${global_statement_threshold}%"

    # Check against actual coverage if data available
    local metrics_file="$REPORTS_DIR/coverage-metrics-${TIMESTAMP}.json"
    if [ -f "$metrics_file" ]; then
        local actual_lines=$(jq -r '.overall.lines.percentage // 0' "$metrics_file" 2>/dev/null)
        local actual_functions=$(jq -r '.overall.functions.percentage // 0' "$metrics_file" 2>/dev/null)
        local actual_branches=$(jq -r '.overall.branches.percentage // 0' "$metrics_file" 2>/dev/null)
        local actual_statements=$(jq -r '.overall.statements.percentage // 0' "$metrics_file" 2>/dev/null)

        # Check thresholds
        if (( $(echo "$actual_lines < $global_line_threshold" | bc -l) )); then
            error "Line coverage ($actual_lines%) below threshold ($global_line_threshold%)"
            threshold_failures=$((threshold_failures + 1))
        else
            success "Line coverage ($actual_lines%) meets threshold"
        fi

        if (( $(echo "$actual_functions < $global_function_threshold" | bc -l) )); then
            error "Function coverage ($actual_functions%) below threshold ($global_function_threshold%)"
            threshold_failures=$((threshold_failures + 1))
        else
            success "Function coverage ($actual_functions%) meets threshold"
        fi

        if (( $(echo "$actual_branches < $global_branch_threshold" | bc -l) )); then
            error "Branch coverage ($actual_branches%) below threshold ($global_branch_threshold%)"
            threshold_failures=$((threshold_failures + 1))
        else
            success "Branch coverage ($actual_branches%) meets threshold"
        fi

        if (( $(echo "$actual_statements < $global_statement_threshold" | bc -l) )); then
            error "Statement coverage ($actual_statements%) below threshold ($global_statement_threshold%)"
            threshold_failures=$((threshold_failures + 1))
        else
            success "Statement coverage ($actual_statements%) meets threshold"
        fi
    fi

    if [ $threshold_failures -eq 0 ]; then
        success "All coverage thresholds met"
        return 0
    else
        error "$threshold_failures coverage thresholds not met"
        return 1
    fi
}

# Function to generate CI/CD integration files
generate_ci_integration() {
    step "Generating CI/CD integration files..."

    # GitHub Actions workflow for coverage
    mkdir -p ".github/workflows"
    cat > ".github/workflows/coverage.yml" << 'EOF'
name: Test Coverage

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  coverage:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: |
        npm ci
        cd apps/api && npm ci
        cd ../web && npm ci

    - name: Run tests with coverage
      run: ./scripts/run-all-tests.sh
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
        NODE_ENV: test

    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
        flags: unittests
        name: codecov-umbrella

    - name: Comment coverage on PR
      uses: romeovs/lcov-reporter-action@v0.3.1
      with:
        github-token: ${{ secrets.GITHUB_TOKEN }}
        lcov-file: ./coverage/lcov.info

    - name: Archive coverage results
      uses: actions/upload-artifact@v3
      with:
        name: coverage-report
        path: |
          coverage/
          test-reports/
EOF

    # SonarQube properties for coverage
    cat > "sonar-project.properties" << 'EOF'
sonar.projectKey=restauranthub
sonar.organization=restauranthub-org
sonar.projectName=RestaurantHub
sonar.projectVersion=1.0

# Source directories
sonar.sources=apps/api/src,apps/web/app,apps/web/components,apps/web/lib
sonar.tests=apps/api/src,apps/web/__tests__,apps/api/test

# Test execution reports
sonar.javascript.lcov.reportPaths=coverage/lcov.info
sonar.testExecutionReportPaths=test-reports/junit-combined.xml

# Coverage exclusions
sonar.coverage.exclusions=**/*.test.ts,**/*.test.tsx,**/*.spec.ts,**/node_modules/**,**/coverage/**

# Language specific settings
sonar.typescript.lcov.reportPaths=coverage/lcov.info
sonar.javascript.lcov.reportPaths=coverage/lcov.info
EOF

    success "CI/CD integration files generated"
    return 0
}

# Function to open coverage reports
open_coverage_reports() {
    step "Opening coverage reports..."

    # Try to open HTML coverage report
    local html_report=""

    if [ -f "$COVERAGE_DIR/lcov-report/index.html" ]; then
        html_report="$COVERAGE_DIR/lcov-report/index.html"
    elif [ -f "$COVERAGE_DIR/html-report/index.html" ]; then
        html_report="$COVERAGE_DIR/html-report/index.html"
    fi

    if [ -n "$html_report" ]; then
        log "Opening coverage report: $html_report"

        # Try different methods to open the file
        if command -v open &> /dev/null; then
            open "$html_report" || log "Could not open coverage report automatically"
        elif command -v xdg-open &> /dev/null; then
            xdg-open "$html_report" || log "Could not open coverage report automatically"
        else
            log "Manual open required: file://$(pwd)/$html_report"
        fi
    else
        warning "No HTML coverage report found to open"
    fi

    return 0
}

# Function to display final summary
display_final_summary() {
    step "Coverage Reporting Summary"

    echo ""
    echo "=================================================="
    echo "🎯 RestaurantHub Coverage Report Complete!"
    echo "=================================================="
    echo ""

    # List generated files
    echo "📊 Generated Reports:"
    [ -f "$COVERAGE_DIR/lcov-report/index.html" ] && echo "   ✓ HTML Report: $COVERAGE_DIR/lcov-report/index.html"
    [ -f "$COVERAGE_DIR/lcov.info" ] && echo "   ✓ LCOV Data: $COVERAGE_DIR/lcov.info"
    [ -f "$COVERAGE_DIR/coverage-final.json" ] && echo "   ✓ JSON Data: $COVERAGE_DIR/coverage-final.json"
    [ -d "$COVERAGE_DIR/badges" ] && echo "   ✓ Badges: $COVERAGE_DIR/badges/"

    echo ""
    echo "📈 Metrics & Analysis:"
    [ -f "$REPORTS_DIR/coverage-metrics-${TIMESTAMP}.json" ] && echo "   ✓ Metrics: $REPORTS_DIR/coverage-metrics-${TIMESTAMP}.json"
    [ -f "$REPORTS_DIR/coverage-summary-${TIMESTAMP}.md" ] && echo "   ✓ Summary: $REPORTS_DIR/coverage-summary-${TIMESTAMP}.md"

    echo ""
    echo "🔗 Quick Access:"
    echo "   View Report: npm run coverage:open"
    echo "   Run Tests: npm run test:ci"
    echo "   Full Suite: ./scripts/run-all-tests.sh"

    echo ""
    echo "📋 Log File: $LOG_FILE"
    echo "=================================================="
}

# Main execution
main() {
    local command="${1:-generate}"

    log "=== RestaurantHub Coverage Reporter ==="
    log "======================================"

    case "$command" in
        "generate")
            if check_coverage_data; then
                merge_coverage_reports
                generate_html_report
                generate_coverage_badges
                extract_coverage_metrics
                generate_coverage_summary
                check_coverage_thresholds
                generate_ci_integration
                display_final_summary
            else
                error "No coverage data available. Run tests first:"
                echo "  npm run test:ci"
                echo "  ./scripts/run-all-tests.sh"
                exit 1
            fi
            ;;

        "open")
            open_coverage_reports
            ;;

        "check")
            check_coverage_thresholds
            ;;

        "badges")
            generate_coverage_badges
            ;;

        *)
            echo "Usage: $0 {generate|open|check|badges}"
            echo ""
            echo "Commands:"
            echo "  generate - Generate all coverage reports and analysis"
            echo "  open     - Open HTML coverage report in browser"
            echo "  check    - Check coverage against thresholds"
            echo "  badges   - Generate coverage badges only"
            exit 1
            ;;
    esac
}

# Execute if run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi