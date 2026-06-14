#!/bin/bash

# RestaurantHub Automated Backup & Restoration Testing Script
# This script tests database backup and restoration functionality

set -e

# Configuration
DB_NAME="restauranthub"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"
BACKUP_DIR="./backups"
TEST_DB_NAME="${DB_NAME}_test_restore"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="./logs/backup-restore-test-${TIMESTAMP}.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Create necessary directories
mkdir -p "$BACKUP_DIR"
mkdir -p "./logs"

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

run_test() {
    local test_name="$1"
    local test_command="$2"

    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    log "Running test: $test_name"

    if eval "$test_command"; then
        success "✓ $test_name passed"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        error "✗ $test_name failed"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Function to check database connection
check_db_connection() {
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1
}

# Function to create test data
create_test_data() {
    log "Creating test data for backup testing..."

    cat << EOF | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1
-- Insert test restaurant
INSERT INTO "Restaurant" (id, name, email, phone, address, city, state, "zipCode", cuisine, description, "isActive", "createdAt", "updatedAt")
VALUES ('test-restaurant-backup', 'Test Restaurant for Backup', 'test@backup.com', '555-0123', '123 Test St', 'Test City', 'TS', '12345', 'Test Cuisine', 'Test restaurant for backup testing', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Insert test user
INSERT INTO "User" (id, email, "firstName", "lastName", role, "isActive", "createdAt", "updatedAt")
VALUES ('test-user-backup', 'testuser@backup.com', 'Test', 'User', 'CUSTOMER', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

-- Insert test job
INSERT INTO "Job" (id, title, description, type, "salaryMin", "salaryMax", requirements, "restaurantId", "isActive", "createdAt", "updatedAt")
VALUES ('test-job-backup', 'Test Job for Backup', 'Test job description', 'FULL_TIME', 30000, 50000, 'Test requirements', 'test-restaurant-backup', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;
EOF

    if [ $? -eq 0 ]; then
        success "Test data created successfully"
        return 0
    else
        error "Failed to create test data"
        return 1
    fi
}

# Function to verify test data exists
verify_test_data() {
    local db_name="$1"

    local restaurant_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$db_name" -t -c "SELECT COUNT(*) FROM \"Restaurant\" WHERE id = 'test-restaurant-backup';" 2>/dev/null | xargs)
    local user_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$db_name" -t -c "SELECT COUNT(*) FROM \"User\" WHERE id = 'test-user-backup';" 2>/dev/null | xargs)
    local job_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$db_name" -t -c "SELECT COUNT(*) FROM \"Job\" WHERE id = 'test-job-backup';" 2>/dev/null | xargs)

    if [ "$restaurant_count" = "1" ] && [ "$user_count" = "1" ] && [ "$job_count" = "1" ]; then
        return 0
    else
        return 1
    fi
}

# Function to create database backup
create_backup() {
    local backup_file="$BACKUP_DIR/restauranthub_backup_${TIMESTAMP}.sql"

    log "Creating database backup..."
    pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$backup_file" --verbose --no-password

    if [ -f "$backup_file" ] && [ -s "$backup_file" ]; then
        success "Backup created: $backup_file"
        echo "$backup_file"
        return 0
    else
        error "Backup creation failed"
        return 1
    fi
}

# Function to create compressed backup
create_compressed_backup() {
    local backup_file="$BACKUP_DIR/restauranthub_backup_${TIMESTAMP}.tar.gz"

    log "Creating compressed database backup..."
    pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" --format=tar --compress=9 --file="$backup_file" --verbose --no-password

    if [ -f "$backup_file" ] && [ -s "$backup_file" ]; then
        success "Compressed backup created: $backup_file"
        echo "$backup_file"
        return 0
    else
        error "Compressed backup creation failed"
        return 1
    fi
}

# Function to restore database from backup
restore_backup() {
    local backup_file="$1"
    local target_db="$2"

    log "Restoring database from backup: $backup_file"

    # Drop test database if exists
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS \"$target_db\";" > /dev/null 2>&1

    # Create test database
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE \"$target_db\";" > /dev/null 2>&1

    # Restore from backup
    if [[ "$backup_file" == *.tar.gz ]]; then
        pg_restore -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$target_db" "$backup_file" --verbose --no-password > /dev/null 2>&1
    else
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$target_db" -f "$backup_file" > /dev/null 2>&1
    fi

    if [ $? -eq 0 ]; then
        success "Database restored successfully to: $target_db"
        return 0
    else
        error "Database restoration failed"
        return 1
    fi
}

# Function to cleanup test database
cleanup_test_db() {
    log "Cleaning up test database..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS \"$TEST_DB_NAME\";" > /dev/null 2>&1
}

# Function to test backup file integrity
test_backup_integrity() {
    local backup_file="$1"

    log "Testing backup file integrity..."

    if [[ "$backup_file" == *.tar.gz ]]; then
        # Test tar.gz file
        if tar -tzf "$backup_file" > /dev/null 2>&1; then
            return 0
        else
            return 1
        fi
    else
        # Test SQL file
        if grep -q "PostgreSQL database dump" "$backup_file" 2>/dev/null; then
            return 0
        else
            return 1
        fi
    fi
}

# Function to measure backup/restore performance
measure_performance() {
    local operation="$1"
    local start_time=$(date +%s.%N)

    "$@"
    local exit_code=$?

    local end_time=$(date +%s.%N)
    local duration=$(echo "$end_time - $start_time" | bc -l)

    log "Performance: $operation completed in ${duration}s"
    return $exit_code
}

# Function to run incremental backup test
test_incremental_backup() {
    log "Testing incremental backup functionality..."

    # Create base backup
    local base_backup="$BACKUP_DIR/base_backup_${TIMESTAMP}.sql"
    pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$base_backup" --verbose --no-password > /dev/null 2>&1

    # Add more test data
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
        INSERT INTO \"Restaurant\" (id, name, email, phone, address, city, state, \"zipCode\", cuisine, description, \"isActive\", \"createdAt\", \"updatedAt\")
        VALUES ('test-restaurant-incremental', 'Incremental Test Restaurant', 'incremental@test.com', '555-0124', '124 Test St', 'Test City', 'TS', '12346', 'Test Cuisine', 'Incremental test restaurant', true, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
    " > /dev/null 2>&1

    # Create incremental backup (simulated by full backup with newer timestamp)
    local incremental_backup="$BACKUP_DIR/incremental_backup_${TIMESTAMP}.sql"
    pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$incremental_backup" --verbose --no-password > /dev/null 2>&1

    # Test if incremental backup contains new data
    if grep -q "test-restaurant-incremental" "$incremental_backup"; then
        return 0
    else
        return 1
    fi
}

# Function to test point-in-time recovery simulation
test_point_in_time_recovery() {
    log "Testing point-in-time recovery simulation..."

    # Record current timestamp
    local recovery_point=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT NOW();" | xargs)

    # Create backup at this point
    local pit_backup="$BACKUP_DIR/pit_backup_${TIMESTAMP}.sql"
    pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$pit_backup" --verbose --no-password > /dev/null 2>&1

    # Simulate data changes after recovery point
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
        UPDATE \"Restaurant\" SET name = 'Modified After Recovery Point' WHERE id = 'test-restaurant-backup';
    " > /dev/null 2>&1

    # Restore to point-in-time
    restore_backup "$pit_backup" "${TEST_DB_NAME}_pit"

    # Verify data is from recovery point
    local restored_name=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "${TEST_DB_NAME}_pit" -t -c "SELECT name FROM \"Restaurant\" WHERE id = 'test-restaurant-backup';" 2>/dev/null | xargs)

    # Cleanup
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS \"${TEST_DB_NAME}_pit\";" > /dev/null 2>&1

    if [ "$restored_name" = "Test Restaurant for Backup" ]; then
        return 0
    else
        return 1
    fi
}

# Main execution
main() {
    log "Starting RestaurantHub Backup & Restoration Testing"
    log "=================================================="

    # Pre-test checks
    run_test "Database Connection" "check_db_connection"
    run_test "Test Data Creation" "create_test_data"

    # Backup tests
    log "\n--- Backup Tests ---"

    run_test "SQL Backup Creation" "
        BACKUP_FILE=\$(create_backup)
        test -f \"\$BACKUP_FILE\" && test -s \"\$BACKUP_FILE\"
    "

    run_test "Compressed Backup Creation" "
        COMPRESSED_BACKUP=\$(create_compressed_backup)
        test -f \"\$COMPRESSED_BACKUP\" && test -s \"\$COMPRESSED_BACKUP\"
    "

    run_test "Backup File Integrity (SQL)" "
        BACKUP_FILE=\$(ls $BACKUP_DIR/restauranthub_backup_${TIMESTAMP}.sql 2>/dev/null | head -1)
        test_backup_integrity \"\$BACKUP_FILE\"
    "

    run_test "Backup File Integrity (Compressed)" "
        COMPRESSED_BACKUP=\$(ls $BACKUP_DIR/restauranthub_backup_${TIMESTAMP}.tar.gz 2>/dev/null | head -1)
        test_backup_integrity \"\$COMPRESSED_BACKUP\"
    "

    # Restoration tests
    log "\n--- Restoration Tests ---"

    run_test "SQL Backup Restoration" "
        BACKUP_FILE=\$(ls $BACKUP_DIR/restauranthub_backup_${TIMESTAMP}.sql 2>/dev/null | head -1)
        restore_backup \"\$BACKUP_FILE\" \"$TEST_DB_NAME\"
    "

    run_test "Restored Data Verification" "verify_test_data \"$TEST_DB_NAME\""

    run_test "Compressed Backup Restoration" "
        COMPRESSED_BACKUP=\$(ls $BACKUP_DIR/restauranthub_backup_${TIMESTAMP}.tar.gz 2>/dev/null | head -1)
        restore_backup \"\$COMPRESSED_BACKUP\" \"${TEST_DB_NAME}_compressed\"
    "

    run_test "Compressed Restored Data Verification" "verify_test_data \"${TEST_DB_NAME}_compressed\""

    # Advanced tests
    log "\n--- Advanced Tests ---"

    run_test "Incremental Backup Test" "test_incremental_backup"
    run_test "Point-in-Time Recovery Test" "test_point_in_time_recovery"

    # Performance tests
    log "\n--- Performance Tests ---"

    run_test "Backup Performance Test" "
        measure_performance 'Backup' create_backup > /dev/null
    "

    run_test "Restore Performance Test" "
        BACKUP_FILE=\$(ls $BACKUP_DIR/restauranthub_backup_${TIMESTAMP}.sql 2>/dev/null | head -1)
        measure_performance 'Restore' restore_backup \"\$BACKUP_FILE\" \"${TEST_DB_NAME}_perf\" > /dev/null
    "

    # Cleanup
    log "\n--- Cleanup ---"
    cleanup_test_db
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS \"${TEST_DB_NAME}_compressed\";" > /dev/null 2>&1
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS \"${TEST_DB_NAME}_perf\";" > /dev/null 2>&1

    # Remove test data from main database
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
        DELETE FROM \"Job\" WHERE id IN ('test-job-backup');
        DELETE FROM \"Restaurant\" WHERE id IN ('test-restaurant-backup', 'test-restaurant-incremental');
        DELETE FROM \"User\" WHERE id IN ('test-user-backup');
    " > /dev/null 2>&1

    # Results summary
    log "\n=================================================="
    log "Backup & Restoration Testing Results"
    log "=================================================="
    success "Passed: $PASSED_TESTS/$TOTAL_TESTS tests"

    if [ $FAILED_TESTS -gt 0 ]; then
        error "Failed: $FAILED_TESTS/$TOTAL_TESTS tests"
        log "Check log file for details: $LOG_FILE"
        exit 1
    else
        success "All tests passed! ✓"
        log "Log file: $LOG_FILE"
        exit 0
    fi
}

# Check if script is being sourced or executed
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi