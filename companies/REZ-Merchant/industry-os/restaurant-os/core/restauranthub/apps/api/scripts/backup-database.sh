#!/bin/bash

# RestaurantHub Database Backup Script
# This script creates backups of PostgreSQL database with rotation

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Load environment variables
if [ -f "$PROJECT_DIR/.env" ]; then
    source "$PROJECT_DIR/.env"
fi

# Database configuration from environment
DB_HOST="${DATABASE_HOST:-localhost}"
DB_PORT="${DATABASE_PORT:-5432}"
DB_NAME="${DATABASE_NAME:-restauranthub}"
DB_USER="${DATABASE_USER:-postgres}"
DB_PASSWORD="${DATABASE_PASSWORD}"

# S3 configuration for remote backup (optional)
S3_BUCKET="${BACKUP_S3_BUCKET:-}"
AWS_REGION="${AWS_REGION:-us-east-1}"

# Logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$BACKUP_DIR/backup.log"
}

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Initialize log
log "Starting database backup process"

# Function to clean old backups
cleanup_old_backups() {
    log "Cleaning up backups older than $RETENTION_DAYS days"
    
    find "$BACKUP_DIR" -name "restauranthub_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete || true
    find "$BACKUP_DIR" -name "restauranthub_backup_*.sql" -type f -mtime +$RETENTION_DAYS -delete || true
    
    log "Cleanup completed"
}

# Function to create database backup
create_backup() {
    local backup_file="$BACKUP_DIR/restauranthub_backup_$TIMESTAMP.sql"
    local compressed_backup="$backup_file.gz"
    
    log "Creating backup: $backup_file"
    
    # Set password for pg_dump
    export PGPASSWORD="$DB_PASSWORD"
    
    # Create backup with custom options
    if pg_dump \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --dbname="$DB_NAME" \
        --verbose \
        --clean \
        --if-exists \
        --create \
        --format=plain \
        --encoding=UTF8 \
        --no-owner \
        --no-privileges \
        --file="$backup_file"; then
        
        log "Database dump completed successfully"
        
        # Compress the backup
        log "Compressing backup file"
        if gzip "$backup_file"; then
            log "Backup compressed: $compressed_backup"
            
            # Verify the backup
            if verify_backup "$compressed_backup"; then
                log "Backup verification successful"
                return 0
            else
                log "ERROR: Backup verification failed"
                return 1
            fi
        else
            log "ERROR: Failed to compress backup"
            return 1
        fi
    else
        log "ERROR: Database dump failed"
        return 1
    fi
    
    unset PGPASSWORD
}

# Function to verify backup integrity
verify_backup() {
    local backup_file="$1"
    
    log "Verifying backup integrity: $backup_file"
    
    # Check if file exists and is not empty
    if [ ! -f "$backup_file" ] || [ ! -s "$backup_file" ]; then
        log "ERROR: Backup file is missing or empty"
        return 1
    fi
    
    # Test gzip integrity
    if ! gzip -t "$backup_file"; then
        log "ERROR: Backup file is corrupted (gzip test failed)"
        return 1
    fi
    
    # Check if backup contains expected content
    if ! zgrep -q "PostgreSQL database dump" "$backup_file"; then
        log "ERROR: Backup file doesn't contain expected PostgreSQL dump header"
        return 1
    fi
    
    # Check file size (should be reasonable for a database dump)
    local file_size=$(stat -f%z "$backup_file" 2>/dev/null || stat -c%s "$backup_file")
    if [ "$file_size" -lt 1000 ]; then
        log "ERROR: Backup file is suspiciously small ($file_size bytes)"
        return 1
    fi
    
    log "Backup verification passed (size: $file_size bytes)"
    return 0
}

# Function to upload backup to S3 (optional)
upload_to_s3() {
    local backup_file="$1"
    
    if [ -z "$S3_BUCKET" ]; then
        log "S3 backup not configured, skipping upload"
        return 0
    fi
    
    log "Uploading backup to S3: s3://$S3_BUCKET/"
    
    if command -v aws >/dev/null 2>&1; then
        local s3_key="database-backups/$(basename "$backup_file")"
        
        if aws s3 cp "$backup_file" "s3://$S3_BUCKET/$s3_key" \
            --region "$AWS_REGION" \
            --storage-class STANDARD_IA \
            --metadata "backup-date=$TIMESTAMP,database=$DB_NAME"; then
            log "Backup uploaded successfully to S3"
            
            # Set lifecycle policy for S3 backups (optional)
            setup_s3_lifecycle_policy
        else
            log "ERROR: Failed to upload backup to S3"
            return 1
        fi
    else
        log "ERROR: AWS CLI not found, cannot upload to S3"
        return 1
    fi
}

# Function to setup S3 lifecycle policy
setup_s3_lifecycle_policy() {
    if [ -z "$S3_BUCKET" ]; then
        return 0
    fi
    
    local lifecycle_policy='{
        "Rules": [
            {
                "ID": "DatabaseBackupLifecycle",
                "Status": "Enabled",
                "Filter": {
                    "Prefix": "database-backups/"
                },
                "Transitions": [
                    {
                        "Days": 30,
                        "StorageClass": "GLACIER"
                    },
                    {
                        "Days": 90,
                        "StorageClass": "DEEP_ARCHIVE"
                    }
                ],
                "Expiration": {
                    "Days": 365
                }
            }
        ]
    }'
    
    # Check if lifecycle policy already exists
    if ! aws s3api get-bucket-lifecycle-configuration --bucket "$S3_BUCKET" >/dev/null 2>&1; then
        log "Setting up S3 lifecycle policy for backups"
        echo "$lifecycle_policy" | aws s3api put-bucket-lifecycle-configuration \
            --bucket "$S3_BUCKET" \
            --lifecycle-configuration file:///dev/stdin
    fi
}

# Function to send notification
send_notification() {
    local status="$1"
    local message="$2"
    
    # Slack notification (if configured)
    if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
        local color="good"
        [ "$status" != "success" ] && color="danger"
        
        curl -X POST -H 'Content-type: application/json' \
            --data "{
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"title\": \"Database Backup $status\",
                    \"text\": \"$message\",
                    \"fields\": [
                        {\"title\": \"Database\", \"value\": \"$DB_NAME\", \"short\": true},
                        {\"title\": \"Timestamp\", \"value\": \"$TIMESTAMP\", \"short\": true},
                        {\"title\": \"Host\", \"value\": \"$(hostname)\", \"short\": true}
                    ]
                }]
            }" \
            "$SLACK_WEBHOOK_URL" >/dev/null 2>&1 || true
    fi
    
    # Email notification (if configured)
    if [ -n "${NOTIFICATION_EMAIL:-}" ] && command -v mail >/dev/null 2>&1; then
        echo "$message" | mail -s "RestaurantHub Database Backup $status" "$NOTIFICATION_EMAIL" || true
    fi
}

# Function to show backup statistics
show_backup_stats() {
    log "Backup Statistics:"
    log "- Backup directory: $BACKUP_DIR"
    log "- Total backups: $(find "$BACKUP_DIR" -name "restauranthub_backup_*.sql.gz" | wc -l)"
    log "- Disk usage: $(du -sh "$BACKUP_DIR" | cut -f1)"
    log "- Latest backup: $(ls -t "$BACKUP_DIR"/restauranthub_backup_*.sql.gz 2>/dev/null | head -1 | xargs basename 2>/dev/null || echo 'None')"
}

# Main execution
main() {
    local exit_code=0
    
    # Check prerequisites
    if ! command -v pg_dump >/dev/null 2>&1; then
        log "ERROR: pg_dump not found. Please install PostgreSQL client tools."
        exit 1
    fi
    
    if [ -z "${DB_PASSWORD:-}" ]; then
        log "ERROR: DATABASE_PASSWORD environment variable is required"
        exit 1
    fi
    
    # Test database connection
    export PGPASSWORD="$DB_PASSWORD"
    if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -q; then
        log "ERROR: Cannot connect to database"
        unset PGPASSWORD
        exit 1
    fi
    unset PGPASSWORD
    
    # Perform backup
    if create_backup; then
        local backup_file="$BACKUP_DIR/restauranthub_backup_$TIMESTAMP.sql.gz"
        
        # Upload to S3 if configured
        if [ -n "$S3_BUCKET" ]; then
            upload_to_s3 "$backup_file" || exit_code=1
        fi
        
        # Cleanup old backups
        cleanup_old_backups
        
        # Show statistics
        show_backup_stats
        
        if [ $exit_code -eq 0 ]; then
            log "Backup process completed successfully"
            send_notification "success" "Database backup completed successfully. File: $(basename "$backup_file")"
        else
            log "Backup process completed with warnings"
            send_notification "warning" "Database backup completed but S3 upload failed. Local backup: $(basename "$backup_file")"
        fi
    else
        log "ERROR: Backup process failed"
        send_notification "failed" "Database backup failed. Please check the logs."
        exit 1
    fi
}

# Handle script arguments
case "${1:-backup}" in
    "backup")
        main
        ;;
    "cleanup")
        cleanup_old_backups
        ;;
    "stats")
        show_backup_stats
        ;;
    "verify")
        if [ -z "${2:-}" ]; then
            echo "Usage: $0 verify <backup-file>"
            exit 1
        fi
        verify_backup "$2"
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [backup|cleanup|stats|verify <file>|help]"
        echo ""
        echo "Commands:"
        echo "  backup  - Create database backup (default)"
        echo "  cleanup - Remove old backup files"
        echo "  stats   - Show backup statistics"
        echo "  verify  - Verify backup file integrity"
        echo "  help    - Show this help message"
        echo ""
        echo "Environment variables:"
        echo "  DATABASE_PASSWORD - Database password (required)"
        echo "  BACKUP_DIR        - Backup directory (default: ./backups)"
        echo "  RETENTION_DAYS    - Days to keep backups (default: 30)"
        echo "  BACKUP_S3_BUCKET  - S3 bucket for remote backup"
        echo "  SLACK_WEBHOOK_URL - Slack webhook for notifications"
        echo "  NOTIFICATION_EMAIL - Email for notifications"
        ;;
    *)
        echo "Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac