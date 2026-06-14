#!/bin/bash

# RestaurantHub Database Restore Script
# This script restores PostgreSQL database from backup files

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups}"

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
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

# Function to list available backups
list_backups() {
    log "Available local backups:"
    
    if [ -d "$BACKUP_DIR" ]; then
        local backups=$(find "$BACKUP_DIR" -name "restauranthub_backup_*.sql.gz" -type f | sort -r)
        
        if [ -z "$backups" ]; then
            log "No local backups found in $BACKUP_DIR"
        else
            local count=1
            for backup in $backups; do
                local filename=$(basename "$backup")
                local size=$(ls -lh "$backup" | awk '{print $5}')
                local date=$(ls -l "$backup" | awk '{print $6, $7, $8}')
                log "[$count] $filename ($size) - $date"
                count=$((count + 1))
            done
        fi
    else
        log "Backup directory $BACKUP_DIR does not exist"
    fi
    
    # List S3 backups if configured
    if [ -n "$S3_BUCKET" ] && command -v aws >/dev/null 2>&1; then
        log ""
        log "Available S3 backups:"
        
        if aws s3 ls "s3://$S3_BUCKET/database-backups/" --region "$AWS_REGION" 2>/dev/null | grep -q "restauranthub_backup_"; then
            aws s3 ls "s3://$S3_BUCKET/database-backups/" --region "$AWS_REGION" | grep "restauranthub_backup_" | sort -r
        else
            log "No S3 backups found"
        fi
    fi
}

# Function to download backup from S3
download_from_s3() {
    local s3_key="$1"
    local local_file="$BACKUP_DIR/$(basename "$s3_key")"
    
    if [ -z "$S3_BUCKET" ]; then
        log "ERROR: S3 bucket not configured"
        return 1
    fi
    
    log "Downloading backup from S3: $s3_key"
    
    mkdir -p "$BACKUP_DIR"
    
    if aws s3 cp "s3://$S3_BUCKET/$s3_key" "$local_file" --region "$AWS_REGION"; then
        log "Backup downloaded successfully: $local_file"
        echo "$local_file"
    else
        log "ERROR: Failed to download backup from S3"
        return 1
    fi
}

# Function to verify backup before restore
verify_backup() {
    local backup_file="$1"
    
    log "Verifying backup file: $backup_file"
    
    # Check if file exists
    if [ ! -f "$backup_file" ]; then
        log "ERROR: Backup file not found: $backup_file"
        return 1
    fi
    
    # Check if file is empty
    if [ ! -s "$backup_file" ]; then
        log "ERROR: Backup file is empty: $backup_file"
        return 1
    fi
    
    # Test gzip integrity for compressed files
    if [[ "$backup_file" == *.gz ]]; then
        if ! gzip -t "$backup_file"; then
            log "ERROR: Backup file is corrupted (gzip test failed)"
            return 1
        fi
    fi
    
    # Check if backup contains expected content
    local check_cmd
    if [[ "$backup_file" == *.gz ]]; then
        check_cmd="zgrep"
    else
        check_cmd="grep"
    fi
    
    if ! $check_cmd -q "PostgreSQL database dump" "$backup_file"; then
        log "ERROR: Backup file doesn't contain expected PostgreSQL dump header"
        return 1
    fi
    
    log "Backup verification passed"
    return 0
}

# Function to create database backup before restore
create_pre_restore_backup() {
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_file="$BACKUP_DIR/pre_restore_backup_$timestamp.sql.gz"
    
    log "Creating pre-restore backup: $backup_file"
    
    mkdir -p "$BACKUP_DIR"
    
    export PGPASSWORD="$DB_PASSWORD"
    
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
        --no-privileges | gzip > "$backup_file"; then
        
        log "Pre-restore backup created successfully: $backup_file"
        unset PGPASSWORD
        return 0
    else
        log "ERROR: Failed to create pre-restore backup"
        unset PGPASSWORD
        return 1
    fi
}

# Function to restore database
restore_database() {
    local backup_file="$1"
    local skip_backup="${2:-false}"
    
    log "Starting database restore from: $backup_file"
    
    # Verify backup first
    if ! verify_backup "$backup_file"; then
        return 1
    fi
    
    # Create pre-restore backup unless skipped
    if [ "$skip_backup" != "true" ]; then
        if ! create_pre_restore_backup; then
            log "WARNING: Failed to create pre-restore backup, continuing anyway..."
        fi
    fi
    
    # Set password for psql
    export PGPASSWORD="$DB_PASSWORD"
    
    # Test database connection
    if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -q; then
        log "ERROR: Cannot connect to database server"
        unset PGPASSWORD
        return 1
    fi
    
    # Terminate existing connections to the database
    log "Terminating existing connections to database: $DB_NAME"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" -c "
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();
    " >/dev/null 2>&1 || true
    
    # Restore the database
    log "Restoring database..."
    
    local restore_cmd
    if [[ "$backup_file" == *.gz ]]; then
        restore_cmd="gunzip -c \"$backup_file\""
    else
        restore_cmd="cat \"$backup_file\""
    fi
    
    if eval "$restore_cmd" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" -v ON_ERROR_STOP=1; then
        log "Database restore completed successfully"
        
        # Run post-restore tasks
        post_restore_tasks
        
        unset PGPASSWORD
        return 0
    else
        log "ERROR: Database restore failed"
        unset PGPASSWORD
        return 1
    fi
}

# Function to run post-restore tasks
post_restore_tasks() {
    log "Running post-restore tasks..."
    
    export PGPASSWORD="$DB_PASSWORD"
    
    # Update database statistics
    log "Updating database statistics..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "ANALYZE;" >/dev/null 2>&1 || true
    
    # Reindex database
    log "Reindexing database..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "REINDEX DATABASE $DB_NAME;" >/dev/null 2>&1 || true
    
    # Run Prisma migrations to ensure schema is up to date
    if [ -f "$PROJECT_DIR/package.json" ] && command -v npm >/dev/null 2>&1; then
        log "Running Prisma migrations..."
        cd "$PROJECT_DIR"
        npm run db:migrate:deploy >/dev/null 2>&1 || true
        npm run db:generate >/dev/null 2>&1 || true
    fi
    
    unset PGPASSWORD
    
    log "Post-restore tasks completed"
}

# Function to show database info
show_database_info() {
    export PGPASSWORD="$DB_PASSWORD"
    
    log "Database information:"
    
    # Database size
    local db_size=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT pg_size_pretty(pg_database_size('$DB_NAME'));
    " 2>/dev/null | xargs)
    
    # Table count
    local table_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
    " 2>/dev/null | xargs)
    
    # Record counts for main tables
    local user_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT COUNT(*) FROM \"User\";
    " 2>/dev/null | xargs || echo "0")
    
    local restaurant_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT COUNT(*) FROM \"Restaurant\";
    " 2>/dev/null | xargs || echo "0")
    
    local order_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT COUNT(*) FROM \"Order\";
    " 2>/dev/null | xargs || echo "0")
    
    log "- Database: $DB_NAME"
    log "- Size: $db_size"
    log "- Tables: $table_count"
    log "- Users: $user_count"
    log "- Restaurants: $restaurant_count"
    log "- Orders: $order_count"
    
    unset PGPASSWORD
}

# Function to prompt for confirmation
confirm() {
    local message="$1"
    
    echo -n "$message (y/N): "
    read -r response
    
    case "$response" in
        [yY]|[yY][eE][sS])
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

# Main execution
main() {
    local backup_file="$1"
    local skip_backup="${2:-false}"
    
    # Check prerequisites
    if ! command -v pg_dump >/dev/null 2>&1 || ! command -v psql >/dev/null 2>&1; then
        log "ERROR: PostgreSQL client tools (pg_dump, psql) not found"
        exit 1
    fi
    
    if [ -z "${DB_PASSWORD:-}" ]; then
        log "ERROR: DATABASE_PASSWORD environment variable is required"
        exit 1
    fi
    
    # Handle S3 backup file
    if [[ "$backup_file" == s3://* ]]; then
        local s3_key="${backup_file#s3://$S3_BUCKET/}"
        backup_file=$(download_from_s3 "$s3_key")
        if [ $? -ne 0 ]; then
            exit 1
        fi
    elif [[ "$backup_file" == database-backups/* ]]; then
        backup_file=$(download_from_s3 "$backup_file")
        if [ $? -ne 0 ]; then
            exit 1
        fi
    fi
    
    # Make backup file path absolute
    if [ ! -f "$backup_file" ]; then
        # Try in backup directory
        local alt_path="$BACKUP_DIR/$backup_file"
        if [ -f "$alt_path" ]; then
            backup_file="$alt_path"
        else
            log "ERROR: Backup file not found: $backup_file"
            exit 1
        fi
    fi
    
    log "Restore configuration:"
    log "- Backup file: $backup_file"
    log "- Target database: $DB_NAME@$DB_HOST:$DB_PORT"
    log "- Pre-restore backup: $([ "$skip_backup" = "true" ] && echo "disabled" || echo "enabled")"
    
    # Show current database info
    show_database_info
    
    # Confirm restore
    if ! confirm "⚠️  This will REPLACE the current database. Continue?"; then
        log "Restore cancelled by user"
        exit 0
    fi
    
    # Perform restore
    if restore_database "$backup_file" "$skip_backup"; then
        log "✅ Database restore completed successfully"
        
        # Show updated database info
        log ""
        log "Updated database information:"
        show_database_info
    else
        log "❌ Database restore failed"
        exit 1
    fi
}

# Handle script arguments
case "${1:-help}" in
    "list")
        list_backups
        ;;
    "info")
        show_database_info
        ;;
    "restore")
        if [ -z "${2:-}" ]; then
            echo "ERROR: Backup file path is required"
            echo "Usage: $0 restore <backup-file> [--skip-backup]"
            exit 1
        fi
        
        local skip_backup="false"
        if [ "${3:-}" = "--skip-backup" ]; then
            skip_backup="true"
        fi
        
        main "$2" "$skip_backup"
        ;;
    "help"|"-h"|"--help")
        echo "RestaurantHub Database Restore Script"
        echo ""
        echo "Usage: $0 <command> [options]"
        echo ""
        echo "Commands:"
        echo "  list                    - List available backup files"
        echo "  info                    - Show current database information"
        echo "  restore <file>          - Restore database from backup file"
        echo "  restore <file> --skip-backup - Restore without creating pre-restore backup"
        echo "  help                    - Show this help message"
        echo ""
        echo "Backup file can be:"
        echo "  - Local file path (absolute or relative to backup directory)"
        echo "  - S3 path: database-backups/restauranthub_backup_20241201_120000.sql.gz"
        echo "  - Full S3 URL: s3://bucket-name/database-backups/backup.sql.gz"
        echo ""
        echo "Examples:"
        echo "  $0 list"
        echo "  $0 info"
        echo "  $0 restore restauranthub_backup_20241201_120000.sql.gz"
        echo "  $0 restore database-backups/restauranthub_backup_20241201_120000.sql.gz"
        echo "  $0 restore /path/to/backup.sql.gz --skip-backup"
        echo ""
        echo "Environment variables:"
        echo "  DATABASE_PASSWORD - Database password (required)"
        echo "  BACKUP_DIR        - Backup directory (default: ./backups)"
        echo "  BACKUP_S3_BUCKET  - S3 bucket for remote backups"
        ;;
    *)
        echo "Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac