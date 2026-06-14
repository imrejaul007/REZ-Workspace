#!/bin/bash

# RestaurantHub Automated Backup Scheduler
# This script manages automated database backups with retention policies

set -e

# Configuration
DB_NAME="restauranthub"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"
BACKUP_DIR="./backups"
BACKUP_RETENTION_DAYS=30
BACKUP_RETENTION_WEEKS=12
BACKUP_RETENTION_MONTHS=12
LOG_FILE="./logs/backup-scheduler.log"

# Create directories
mkdir -p "$BACKUP_DIR/daily"
mkdir -p "$BACKUP_DIR/weekly"
mkdir -p "$BACKUP_DIR/monthly"
mkdir -p "./logs"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to create backup
create_backup() {
    local backup_type="$1"
    local backup_dir="$BACKUP_DIR/$backup_type"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$backup_dir/restauranthub_${backup_type}_${timestamp}.tar.gz"

    log "Creating $backup_type backup..."

    # Create compressed backup
    pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --format=tar --compress=9 --file="$backup_file" \
        --verbose --no-password >> "$LOG_FILE" 2>&1

    if [ -f "$backup_file" ] && [ -s "$backup_file" ]; then
        log "✓ $backup_type backup created: $backup_file"

        # Calculate backup size
        local size=$(du -h "$backup_file" | cut -f1)
        log "Backup size: $size"

        return 0
    else
        log "✗ $backup_type backup failed"
        return 1
    fi
}

# Function to cleanup old backups
cleanup_old_backups() {
    local backup_type="$1"
    local retention_days="$2"
    local backup_dir="$BACKUP_DIR/$backup_type"

    log "Cleaning up old $backup_type backups (retention: $retention_days days)..."

    # Find and remove old backups
    local deleted_count=0
    while IFS= read -r -d '' backup_file; do
        rm "$backup_file"
        deleted_count=$((deleted_count + 1))
        log "Deleted old backup: $(basename "$backup_file")"
    done < <(find "$backup_dir" -name "*.tar.gz" -type f -mtime +$retention_days -print0 2>/dev/null)

    if [ $deleted_count -gt 0 ]; then
        log "✓ Cleaned up $deleted_count old $backup_type backups"
    else
        log "No old $backup_type backups to clean up"
    fi
}

# Function to verify backup integrity
verify_backup() {
    local backup_file="$1"

    log "Verifying backup integrity: $(basename "$backup_file")"

    if tar -tzf "$backup_file" > /dev/null 2>&1; then
        log "✓ Backup integrity verified"
        return 0
    else
        log "✗ Backup integrity check failed"
        return 1
    fi
}

# Function to send backup status notification
send_notification() {
    local status="$1"
    local message="$2"

    # This could be extended to send email, Slack, etc.
    log "NOTIFICATION [$status]: $message"

    # Example: Send to webhook (uncomment if needed)
    # curl -X POST -H "Content-Type: application/json" \
    #      -d "{\"text\":\"RestaurantHub Backup $status: $message\"}" \
    #      "$WEBHOOK_URL" 2>/dev/null || true
}

# Daily backup
daily_backup() {
    log "=== Starting Daily Backup ==="

    if create_backup "daily"; then
        # Get the latest backup file
        local latest_backup=$(ls -t "$BACKUP_DIR/daily"/*.tar.gz 2>/dev/null | head -1)

        if [ -n "$latest_backup" ] && verify_backup "$latest_backup"; then
            cleanup_old_backups "daily" "$BACKUP_RETENTION_DAYS"
            send_notification "SUCCESS" "Daily backup completed successfully"
            log "=== Daily Backup Completed Successfully ==="
        else
            send_notification "FAILED" "Daily backup verification failed"
            log "=== Daily Backup Failed (Verification) ==="
            return 1
        fi
    else
        send_notification "FAILED" "Daily backup creation failed"
        log "=== Daily Backup Failed (Creation) ==="
        return 1
    fi
}

# Weekly backup
weekly_backup() {
    log "=== Starting Weekly Backup ==="

    if create_backup "weekly"; then
        local latest_backup=$(ls -t "$BACKUP_DIR/weekly"/*.tar.gz 2>/dev/null | head -1)

        if [ -n "$latest_backup" ] && verify_backup "$latest_backup"; then
            cleanup_old_backups "weekly" $((BACKUP_RETENTION_WEEKS * 7))
            send_notification "SUCCESS" "Weekly backup completed successfully"
            log "=== Weekly Backup Completed Successfully ==="
        else
            send_notification "FAILED" "Weekly backup verification failed"
            log "=== Weekly Backup Failed (Verification) ==="
            return 1
        fi
    else
        send_notification "FAILED" "Weekly backup creation failed"
        log "=== Weekly Backup Failed (Creation) ==="
        return 1
    fi
}

# Monthly backup
monthly_backup() {
    log "=== Starting Monthly Backup ==="

    if create_backup "monthly"; then
        local latest_backup=$(ls -t "$BACKUP_DIR/monthly"/*.tar.gz 2>/dev/null | head -1)

        if [ -n "$latest_backup" ] && verify_backup "$latest_backup"; then
            cleanup_old_backups "monthly" $((BACKUP_RETENTION_MONTHS * 30))
            send_notification "SUCCESS" "Monthly backup completed successfully"
            log "=== Monthly Backup Completed Successfully ==="
        else
            send_notification "FAILED" "Monthly backup verification failed"
            log "=== Monthly Backup Failed (Verification) ==="
            return 1
        fi
    else
        send_notification "FAILED" "Monthly backup creation failed"
        log "=== Monthly Backup Failed (Creation) ==="
        return 1
    fi
}

# Function to display backup status
backup_status() {
    log "=== Backup Status Report ==="

    for backup_type in daily weekly monthly; do
        local backup_dir="$BACKUP_DIR/$backup_type"
        local count=$(ls "$backup_dir"/*.tar.gz 2>/dev/null | wc -l)
        local latest=$(ls -t "$backup_dir"/*.tar.gz 2>/dev/null | head -1)

        log "$backup_type backups: $count files"

        if [ -n "$latest" ]; then
            local size=$(du -h "$latest" | cut -f1)
            local date=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$latest" 2>/dev/null || stat -c "%y" "$latest" 2>/dev/null | cut -d' ' -f1-2)
            log "  Latest: $(basename "$latest") ($size, $date)"
        else
            log "  No backups found"
        fi
    done

    # Calculate total backup storage usage
    local total_size=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
    log "Total backup storage: $total_size"
}

# Function to test backup restoration
test_restore() {
    local backup_type="${1:-daily}"
    local backup_dir="$BACKUP_DIR/$backup_type"
    local latest_backup=$(ls -t "$backup_dir"/*.tar.gz 2>/dev/null | head -1)
    local test_db="${DB_NAME}_restore_test"

    if [ -z "$latest_backup" ]; then
        log "✗ No $backup_type backup found for restoration test"
        return 1
    fi

    log "Testing restoration from: $(basename "$latest_backup")"

    # Drop test database if exists
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres \
         -c "DROP DATABASE IF EXISTS \"$test_db\";" > /dev/null 2>&1

    # Create test database
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres \
         -c "CREATE DATABASE \"$test_db\";" > /dev/null 2>&1

    # Restore backup
    pg_restore -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$test_db" \
               "$latest_backup" --verbose --no-password >> "$LOG_FILE" 2>&1

    if [ $? -eq 0 ]; then
        # Verify restored data
        local table_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$test_db" \
                           -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs)

        if [ "$table_count" -gt 0 ]; then
            log "✓ Restoration test successful ($table_count tables restored)"

            # Cleanup test database
            psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres \
                 -c "DROP DATABASE \"$test_db\";" > /dev/null 2>&1

            return 0
        else
            log "✗ Restoration test failed (no tables found)"
            return 1
        fi
    else
        log "✗ Restoration test failed (pg_restore error)"
        return 1
    fi
}

# Main function
main() {
    local command="${1:-daily}"

    case "$command" in
        "daily")
            daily_backup
            ;;
        "weekly")
            weekly_backup
            ;;
        "monthly")
            monthly_backup
            ;;
        "status")
            backup_status
            ;;
        "test-restore")
            test_restore "${2:-daily}"
            ;;
        "cleanup")
            cleanup_old_backups "daily" "$BACKUP_RETENTION_DAYS"
            cleanup_old_backups "weekly" $((BACKUP_RETENTION_WEEKS * 7))
            cleanup_old_backups "monthly" $((BACKUP_RETENTION_MONTHS * 30))
            ;;
        *)
            echo "Usage: $0 {daily|weekly|monthly|status|test-restore|cleanup}"
            echo ""
            echo "Commands:"
            echo "  daily        - Create daily backup"
            echo "  weekly       - Create weekly backup"
            echo "  monthly      - Create monthly backup"
            echo "  status       - Show backup status"
            echo "  test-restore - Test restoration from latest backup"
            echo "  cleanup      - Clean up old backups according to retention policy"
            exit 1
            ;;
    esac
}

# Execute main function if script is run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi