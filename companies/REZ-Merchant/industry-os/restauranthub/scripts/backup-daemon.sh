#!/bin/bash

# RestaurantHub Backup Daemon
# Runs backup operations on schedule and monitors backup health

set -e

# Configuration
BACKUP_SCHEDULE="${BACKUP_SCHEDULE:-0 2 * * *}"  # Daily at 2 AM
HEALTH_CHECK_INTERVAL="${HEALTH_CHECK_INTERVAL:-3600}"  # 1 hour
LOG_FILE="/logs/backup-daemon.log"
PID_FILE="/tmp/backup-daemon.pid"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Function to check if daemon is already running
check_running() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            error "Backup daemon is already running (PID: $pid)"
            exit 1
        else
            warning "Removing stale PID file"
            rm -f "$PID_FILE"
        fi
    fi
}

# Function to create PID file
create_pid_file() {
    echo $$ > "$PID_FILE"
    log "Backup daemon started (PID: $$)"
}

# Function to cleanup on exit
cleanup() {
    log "Backup daemon shutting down..."
    rm -f "$PID_FILE"
    exit 0
}

# Function to perform scheduled backup
scheduled_backup() {
    local current_time=$(date)
    local day_of_week=$(date +%u)  # 1=Monday, 7=Sunday
    local day_of_month=$(date +%d)

    log "Performing scheduled backup at $current_time"

    # Always do daily backup
    if /scripts/backup-scheduler.sh daily; then
        success "Daily backup completed successfully"
    else
        error "Daily backup failed"
        send_alert "BACKUP_FAILED" "Daily backup failed at $current_time"
    fi

    # Weekly backup on Sunday
    if [ "$day_of_week" = "7" ]; then
        log "Performing weekly backup (Sunday)"
        if /scripts/backup-scheduler.sh weekly; then
            success "Weekly backup completed successfully"
        else
            error "Weekly backup failed"
            send_alert "BACKUP_FAILED" "Weekly backup failed at $current_time"
        fi
    fi

    # Monthly backup on 1st day of month
    if [ "$day_of_month" = "01" ]; then
        log "Performing monthly backup (1st of month)"
        if /scripts/backup-scheduler.sh monthly; then
            success "Monthly backup completed successfully"
        else
            error "Monthly backup failed"
            send_alert "BACKUP_FAILED" "Monthly backup failed at $current_time"
        fi
    fi

    # Sync to S3 if configured
    if [ -n "$S3_BUCKET" ]; then
        log "Syncing backups to S3..."
        if /scripts/s3-sync.sh; then
            success "S3 sync completed successfully"
        else
            error "S3 sync failed"
            send_alert "S3_SYNC_FAILED" "S3 sync failed at $current_time"
        fi
    fi

    # Test restoration periodically (weekly)
    if [ "$day_of_week" = "7" ]; then
        log "Performing weekly restoration test"
        if /scripts/backup-scheduler.sh test-restore; then
            success "Restoration test passed"
        else
            error "Restoration test failed"
            send_alert "RESTORE_TEST_FAILED" "Restoration test failed at $current_time"
        fi
    fi
}

# Function to perform health checks
health_check() {
    log "Performing backup system health check"

    local health_status="OK"
    local issues=()

    # Check database connectivity
    if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" > /dev/null 2>&1; then
        health_status="CRITICAL"
        issues+=("Database not accessible")
    fi

    # Check backup directory
    if [ ! -d "/backups" ] || [ ! -w "/backups" ]; then
        health_status="CRITICAL"
        issues+=("Backup directory not accessible")
    fi

    # Check disk space (warn if > 80%, critical if > 90%)
    local disk_usage=$(df /backups | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$disk_usage" -gt 90 ]; then
        health_status="CRITICAL"
        issues+=("Disk usage critical: ${disk_usage}%")
    elif [ "$disk_usage" -gt 80 ]; then
        if [ "$health_status" = "OK" ]; then
            health_status="WARNING"
        fi
        issues+=("Disk usage high: ${disk_usage}%")
    fi

    # Check recent backup existence
    local latest_backup=$(find /backups/daily -name "*.tar.gz" -mtime -1 2>/dev/null | head -1)
    if [ -z "$latest_backup" ]; then
        health_status="WARNING"
        issues+=("No recent backup found")
    fi

    # Report health status
    case "$health_status" in
        "OK")
            success "Backup system health: OK"
            ;;
        "WARNING")
            warning "Backup system health: WARNING - ${issues[*]}"
            send_alert "HEALTH_WARNING" "Backup system issues: ${issues[*]}"
            ;;
        "CRITICAL")
            error "Backup system health: CRITICAL - ${issues[*]}"
            send_alert "HEALTH_CRITICAL" "Critical backup system issues: ${issues[*]}"
            ;;
    esac

    # Log backup statistics
    log_backup_stats
}

# Function to log backup statistics
log_backup_stats() {
    local daily_count=$(ls /backups/daily/*.tar.gz 2>/dev/null | wc -l)
    local weekly_count=$(ls /backups/weekly/*.tar.gz 2>/dev/null | wc -l)
    local monthly_count=$(ls /backups/monthly/*.tar.gz 2>/dev/null | wc -l)
    local total_size=$(du -sh /backups 2>/dev/null | cut -f1)

    log "Backup Statistics:"
    log "  Daily backups: $daily_count"
    log "  Weekly backups: $weekly_count"
    log "  Monthly backups: $monthly_count"
    log "  Total storage: $total_size"
}

# Function to send alerts
send_alert() {
    local alert_type="$1"
    local message="$2"

    log "ALERT [$alert_type]: $message"

    # Send to webhook if configured
    if [ -n "$WEBHOOK_URL" ]; then
        if ! curl -s --max-time 10 -X POST -H "Content-Type: application/json" \
             -d "{\"text\":\"RestaurantHub Backup Alert [$alert_type]: $message\"}" \
             "$WEBHOOK_URL" > /dev/null 2>&1; then
            warning "Failed to send webhook alert"
        fi
    fi

    # Send email if configured
    if [ -n "$ALERT_EMAIL" ]; then
        echo "$message" | timeout 10 mail -s "RestaurantHub Backup Alert: $alert_type" "$ALERT_EMAIL" 2>/dev/null || true
    fi

    # Write to metrics for monitoring systems
    echo "backup_alert{type=\"$alert_type\"} 1 $(date +%s)" >> /logs/backup-metrics.prom
}

# Function to handle signals
signal_handler() {
    local signal="$1"
    log "Received signal: $signal"
    cleanup
}

# Function to run backup schedule
run_scheduler() {
    log "Starting backup scheduler with cron schedule: $BACKUP_SCHEDULE"

    # Create crontab for scheduled backups
    echo "$BACKUP_SCHEDULE /scripts/backup-daemon.sh run-backup" > /tmp/backup-crontab

    # Install crontab
    crontab /tmp/backup-crontab

    # Start cron daemon
    crond -f &
    local cron_pid=$!

    log "Cron daemon started (PID: $cron_pid)"

    # Keep daemon running
    while true; do
        sleep "$HEALTH_CHECK_INTERVAL"
        health_check
    done
}

# Function to run immediate backup (called by cron)
run_backup() {
    # Ensure only one backup runs at a time
    local lock_file="/tmp/backup.lock"

    if [ -f "$lock_file" ]; then
        local lock_pid=$(cat "$lock_file")
        if ps -p "$lock_pid" > /dev/null 2>&1; then
            warning "Backup already running (PID: $lock_pid), skipping"
            exit 0
        else
            warning "Removing stale lock file"
            rm -f "$lock_file"
        fi
    fi

    # Create lock file
    echo $$ > "$lock_file"

    # Run backup
    scheduled_backup

    # Remove lock file
    rm -f "$lock_file"
}

# Main function
main() {
    local command="${1:-daemon}"

    case "$command" in
        "daemon")
            check_running
            create_pid_file

            # Set up signal handlers
            trap 'signal_handler SIGTERM' TERM
            trap 'signal_handler SIGINT' INT
            trap 'signal_handler SIGHUP' HUP

            log "=== RestaurantHub Backup Daemon Started ==="
            log "Schedule: $BACKUP_SCHEDULE"
            log "Health check interval: ${HEALTH_CHECK_INTERVAL}s"

            # Initial health check
            health_check

            # Start scheduler
            run_scheduler
            ;;

        "run-backup")
            run_backup
            ;;

        "health-check")
            health_check
            ;;

        "stop")
            if [ -f "$PID_FILE" ]; then
                local pid=$(cat "$PID_FILE")
                if ps -p "$pid" > /dev/null 2>&1; then
                    log "Stopping backup daemon (PID: $pid)"
                    kill "$pid"
                    rm -f "$PID_FILE"
                    success "Backup daemon stopped"
                else
                    warning "Backup daemon not running"
                    rm -f "$PID_FILE"
                fi
            else
                warning "PID file not found, daemon may not be running"
            fi
            ;;

        "status")
            if [ -f "$PID_FILE" ]; then
                local pid=$(cat "$PID_FILE")
                if ps -p "$pid" > /dev/null 2>&1; then
                    success "Backup daemon is running (PID: $pid)"
                    health_check
                else
                    error "Backup daemon not running (stale PID file)"
                fi
            else
                error "Backup daemon is not running"
            fi
            ;;

        *)
            echo "Usage: $0 {daemon|run-backup|health-check|stop|status}"
            echo ""
            echo "Commands:"
            echo "  daemon      - Start backup daemon"
            echo "  run-backup  - Run scheduled backup (called by cron)"
            echo "  health-check - Perform health check"
            echo "  stop        - Stop backup daemon"
            echo "  status      - Show daemon status"
            exit 1
            ;;
    esac
}

# Execute main function if script is run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi