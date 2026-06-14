#!/bin/bash

# S3 Backup Sync Script for RestaurantHub
# Syncs local backups to AWS S3 or S3-compatible storage

set -e

# Configuration
S3_BUCKET="${S3_BUCKET:-}"
S3_PREFIX="${S3_PREFIX:-restauranthub-backups}"
AWS_REGION="${AWS_REGION:-us-east-1}"
LOCAL_BACKUP_DIR="/backups"
LOG_FILE="/logs/s3-sync.log"
RETENTION_DAYS=90  # Keep S3 backups for 90 days

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

# Function to check prerequisites
check_prerequisites() {
    log "Checking S3 sync prerequisites..."

    # Check if S3 bucket is configured
    if [ -z "$S3_BUCKET" ]; then
        error "S3_BUCKET environment variable not set"
        return 1
    fi

    # Check if AWS CLI is available
    if ! command -v aws &> /dev/null; then
        error "AWS CLI not found"
        return 1
    fi

    # Check AWS credentials
    if ! aws sts get-caller-identity > /dev/null 2>&1; then
        error "AWS credentials not configured or invalid"
        return 1
    fi

    # Check if local backup directory exists
    if [ ! -d "$LOCAL_BACKUP_DIR" ]; then
        error "Local backup directory not found: $LOCAL_BACKUP_DIR"
        return 1
    fi

    success "Prerequisites check passed"
    return 0
}

# Function to test S3 connectivity
test_s3_connectivity() {
    log "Testing S3 connectivity..."

    # Test if bucket exists and is accessible
    if aws s3 ls "s3://$S3_BUCKET" > /dev/null 2>&1; then
        success "S3 bucket accessible: $S3_BUCKET"
        return 0
    else
        error "Cannot access S3 bucket: $S3_BUCKET"
        return 1
    fi
}

# Function to sync backups to S3
sync_to_s3() {
    local backup_type="$1"
    local local_dir="$LOCAL_BACKUP_DIR/$backup_type"
    local s3_path="s3://$S3_BUCKET/$S3_PREFIX/$backup_type/"

    if [ ! -d "$local_dir" ]; then
        warning "Local backup directory not found: $local_dir"
        return 0
    fi

    log "Syncing $backup_type backups to S3..."
    log "Source: $local_dir"
    log "Destination: $s3_path"

    # Count files to sync
    local file_count=$(find "$local_dir" -name "*.tar.gz" -type f | wc -l)

    if [ "$file_count" -eq 0 ]; then
        warning "No backup files found in $local_dir"
        return 0
    fi

    log "Found $file_count backup files to sync"

    # Sync with progress and metadata
    if aws s3 sync "$local_dir" "$s3_path" \
        --storage-class STANDARD_IA \
        --metadata "backup-type=$backup_type,created-by=restauranthub-backup-daemon" \
        --exclude "*" \
        --include "*.tar.gz" \
        --delete \
        --exact-timestamps; then
        success "✓ $backup_type backups synced successfully"
        return 0
    else
        error "✗ Failed to sync $backup_type backups"
        return 1
    fi
}

# Function to verify S3 sync
verify_s3_sync() {
    local backup_type="$1"
    local local_dir="$LOCAL_BACKUP_DIR/$backup_type"
    local s3_path="s3://$S3_BUCKET/$S3_PREFIX/$backup_type/"

    log "Verifying $backup_type backup sync..."

    # Get local file count
    local local_count=$(find "$local_dir" -name "*.tar.gz" -type f 2>/dev/null | wc -l)

    # Get S3 file count
    local s3_count=$(aws s3 ls "$s3_path" --recursive | grep "\.tar\.gz$" | wc -l)

    log "Local files: $local_count, S3 files: $s3_count"

    if [ "$local_count" -eq "$s3_count" ]; then
        success "✓ $backup_type sync verification passed"
        return 0
    else
        error "✗ $backup_type sync verification failed (count mismatch)"
        return 1
    fi
}

# Function to cleanup old S3 backups
cleanup_old_s3_backups() {
    log "Cleaning up old S3 backups (retention: $RETENTION_DAYS days)..."

    local cutoff_date=$(date -d "$RETENTION_DAYS days ago" +%Y-%m-%d)
    local deleted_count=0

    # List and delete old backups
    for backup_type in daily weekly monthly; do
        local s3_path="s3://$S3_BUCKET/$S3_PREFIX/$backup_type/"

        log "Checking $backup_type backups older than $cutoff_date..."

        # Get list of old files
        local old_files=$(aws s3 ls "$s3_path" --recursive | \
                         awk -v cutoff="$cutoff_date" '$1 < cutoff {print $4}' | \
                         grep "\.tar\.gz$" || true)

        if [ -n "$old_files" ]; then
            while IFS= read -r file; do
                local full_path="s3://$S3_BUCKET/$file"
                log "Deleting old backup: $file"

                if aws s3 rm "$full_path"; then
                    deleted_count=$((deleted_count + 1))
                else
                    error "Failed to delete: $file"
                fi
            done <<< "$old_files"
        fi
    done

    if [ $deleted_count -gt 0 ]; then
        success "✓ Cleaned up $deleted_count old S3 backups"
    else
        log "No old S3 backups to clean up"
    fi
}

# Function to create S3 lifecycle policy
create_lifecycle_policy() {
    log "Setting up S3 lifecycle policy for backup retention..."

    local policy_file="/tmp/s3-lifecycle-policy.json"

    cat > "$policy_file" << EOF
{
    "Rules": [
        {
            "ID": "RestaurantHubBackupRetention",
            "Status": "Enabled",
            "Filter": {
                "Prefix": "$S3_PREFIX/"
            },
            "Transitions": [
                {
                    "Days": 30,
                    "StorageClass": "STANDARD_IA"
                },
                {
                    "Days": 60,
                    "StorageClass": "GLACIER"
                },
                {
                    "Days": 365,
                    "StorageClass": "DEEP_ARCHIVE"
                }
            ],
            "Expiration": {
                "Days": 2555
            }
        }
    ]
}
EOF

    if aws s3api put-bucket-lifecycle-configuration \
        --bucket "$S3_BUCKET" \
        --lifecycle-configuration file://"$policy_file"; then
        success "✓ S3 lifecycle policy created"
        rm -f "$policy_file"
        return 0
    else
        error "✗ Failed to create S3 lifecycle policy"
        rm -f "$policy_file"
        return 1
    fi
}

# Function to get S3 backup status
get_s3_status() {
    log "=== S3 Backup Status ==="

    for backup_type in daily weekly monthly; do
        local s3_path="s3://$S3_BUCKET/$S3_PREFIX/$backup_type/"
        local file_count=$(aws s3 ls "$s3_path" --recursive | grep "\.tar\.gz$" | wc -l)

        log "$backup_type backups in S3: $file_count files"

        if [ "$file_count" -gt 0 ]; then
            # Get latest backup info
            local latest=$(aws s3 ls "$s3_path" --recursive | grep "\.tar\.gz$" | sort | tail -1)
            if [ -n "$latest" ]; then
                local size=$(echo "$latest" | awk '{print $3}')
                local date=$(echo "$latest" | awk '{print $1" "$2}')
                local file=$(echo "$latest" | awk '{print $4}' | basename)
                local size_mb=$((size / 1024 / 1024))

                log "  Latest: $file (${size_mb}MB, $date)"
            fi
        fi
    done

    # Get total S3 usage
    local total_size=$(aws s3 ls "s3://$S3_BUCKET/$S3_PREFIX/" --recursive --summarize | \
                      grep "Total Size:" | awk '{print $3}')

    if [ -n "$total_size" ]; then
        local total_mb=$((total_size / 1024 / 1024))
        log "Total S3 storage: ${total_mb}MB"
    fi
}

# Function to restore backup from S3
restore_from_s3() {
    local backup_type="$1"
    local backup_file="$2"
    local target_dir="${3:-/tmp/s3-restore}"

    log "Restoring backup from S3..."
    log "Type: $backup_type"
    log "File: $backup_file"
    log "Target: $target_dir"

    # Create target directory
    mkdir -p "$target_dir"

    # Download from S3
    local s3_path="s3://$S3_BUCKET/$S3_PREFIX/$backup_type/$backup_file"
    local local_path="$target_dir/$backup_file"

    if aws s3 cp "$s3_path" "$local_path"; then
        success "✓ Backup downloaded from S3: $local_path"

        # Verify integrity
        if tar -tzf "$local_path" > /dev/null 2>&1; then
            success "✓ Backup integrity verified"
            echo "$local_path"
            return 0
        else
            error "✗ Backup integrity check failed"
            return 1
        fi
    else
        error "✗ Failed to download backup from S3"
        return 1
    fi
}

# Main function
main() {
    local command="${1:-sync}"

    case "$command" in
        "sync")
            log "=== Starting S3 Backup Sync ==="

            if ! check_prerequisites; then
                error "Prerequisites check failed"
                exit 1
            fi

            if ! test_s3_connectivity; then
                error "S3 connectivity test failed"
                exit 1
            fi

            # Sync all backup types
            local sync_success=true

            for backup_type in daily weekly monthly; do
                if ! sync_to_s3 "$backup_type"; then
                    sync_success=false
                fi

                if ! verify_s3_sync "$backup_type"; then
                    sync_success=false
                fi
            done

            # Cleanup old backups
            cleanup_old_s3_backups

            if [ "$sync_success" = true ]; then
                success "=== S3 Backup Sync Completed Successfully ==="
            else
                error "=== S3 Backup Sync Completed with Errors ==="
                exit 1
            fi
            ;;

        "status")
            check_prerequisites && get_s3_status
            ;;

        "setup-lifecycle")
            check_prerequisites && create_lifecycle_policy
            ;;

        "restore")
            local backup_type="$2"
            local backup_file="$3"
            local target_dir="$4"

            if [ -z "$backup_type" ] || [ -z "$backup_file" ]; then
                error "Usage: $0 restore <backup_type> <backup_file> [target_dir]"
                exit 1
            fi

            check_prerequisites && restore_from_s3 "$backup_type" "$backup_file" "$target_dir"
            ;;

        "test")
            log "=== Testing S3 Connectivity ==="
            check_prerequisites && test_s3_connectivity
            ;;

        *)
            echo "Usage: $0 {sync|status|setup-lifecycle|restore|test}"
            echo ""
            echo "Commands:"
            echo "  sync            - Sync local backups to S3"
            echo "  status          - Show S3 backup status"
            echo "  setup-lifecycle - Create S3 lifecycle policy"
            echo "  restore         - Restore backup from S3"
            echo "  test            - Test S3 connectivity"
            exit 1
            ;;
    esac
}

# Execute main function if script is run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi