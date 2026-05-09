#!/bin/bash
###############################################################################
# SuperPrompt Database Backup Script
# Run via cron: 0 2 * * * /opt/superprompt/backup.sh >> /var/log/superprompt-backup.log 2>&1
###############################################################################

set -e

# Configuration
BACKUP_DIR="/tmp/superprompt_backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="superprompt_${DATE}.sql.gz"
RETENTION_DAYS=7

# Oracle Object Storage configuration (optional)
OCI_BUCKET="${OCI_BUCKET:-superprompt-backups}"
OCI_COMPARTMENT_ID="${OCI_COMPARTMENT_ID:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] INFO:${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARN:${NC} $1"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

# Check if running inside container
is_docker() {
    if [ -f /.dockerenv ]; then
        return 0
    fi
    return 1
}

# Get database container name
get_db_container() {
    if is_docker; then
        # Running inside container - try to connect via host network
        echo "localhost"
    else
        # Running on host - find the docker container
        docker ps -q --filter "name=superprompt-db" --filter "name=postgres" --format "{{.Names}}" | head -1
    fi
}

# Main backup function
backup_postgres() {
    local db_container
    db_container=$(get_db_container)

    log_info "Starting PostgreSQL backup..."

    # Create backup directory
    mkdir -p "$BACKUP_DIR"

    # Create backup using pg_dump
    if is_docker; then
        # Inside container - use localhost
        PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump -h localhost -U superprompt -d superprompt | gzip > "$BACKUP_DIR/$BACKUP_NAME"
    else
        # On host - use docker exec
        docker exec "$db_container" pg_dump -U superprompt -d superprompt | gzip > "$BACKUP_DIR/$BACKUP_NAME"
    fi

    if [ $? -eq 0 ]; then
        log_info "Backup created successfully: $BACKUP_NAME"
    else
        log_error "Backup failed!"
        return 1
    fi

    # Show backup size
    local size
    size=$(du -h "$BACKUP_DIR/$BACKUP_NAME" | cut -f1)
    log_info "Backup size: $size"
}

# Upload to Oracle Object Storage (if configured)
upload_to_oci() {
    if [ -z "$OCI_BUCKET" ] || [ -z "$OCI_COMPARTMENT_ID" ]; then
        log_warn "OCI not configured - skipping upload"
        return 0
    fi

    if ! command -v os &> /dev/null; then
        log_warn "OCI CLI not installed - skipping upload"
        return 0
    fi

    log_info "Uploading backup to Oracle Object Storage..."

    os object put \
        --bucket-name "$OCI_BUCKET" \
        --name "superprompt/$BACKUP_NAME" \
        --file-path "$BACKUP_DIR/$BACKUP_NAME" \
        --compartment-id "$OCI_COMPARTMENT_ID"

    if [ $? -eq 0 ]; then
        log_info "Backup uploaded to OCI"
    else
        log_warn "OCI upload failed"
    fi
}

# Cleanup old backups
cleanup_old_backups() {
    log_info "Cleaning up backups older than $RETENTION_DAYS days..."

    # Clean local backups
    find "$BACKUP_DIR" -name "superprompt_*.sql.gz" -mtime +$RETENTION_DAYS -delete

    local local_count
    local_count=$(find "$BACKUP_DIR" -name "superprompt_*.sql.gz" | wc -l)
    log_info "Local backups remaining: $local_count"

    # Clean OCI backups (if configured)
    if [ -n "$OCI_BUCKET" ] && command -v os &> /dev/null; then
        log_info "Cleaning up OCI backups..."
        # Note: OCI cleanup would require lifecycle policy or manual script
    fi
}

# Verification (optional)
verify_backup() {
    local backup_file="$BACKUP_DIR/$BACKUP_NAME"

    if [ ! -f "$backup_file" ]; then
        log_error "Backup file not found"
        return 1
    fi

    # Verify gzip integrity
    if ! gzip -t "$backup_file" 2>/dev/null; then
        log_error "Backup file is corrupted"
        return 1
    fi

    log_info "Backup verification passed"
    return 0
}

# Main execution
main() {
    log_info "=== SuperPrompt Backup Started ==="

    backup_postgres || exit 1

    verify_backup || exit 1

    upload_to_oci

    cleanup_old_backups

    log_info "=== SuperPrompt Backup Complete ==="
}

# Run main function
main "$@"