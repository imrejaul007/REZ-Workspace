#!/bin/bash
# Productionize Services Script
# This script adds production-ready infrastructure to services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Service templates directory
TEMPLATES_DIR="$(dirname "$0")/../templates"

# Log function
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Usage
usage() {
    echo "Usage: $0 <service-path> [port] [db-name]"
    echo "Example: $0 rez-pos-service 4081 rez_pos"
    exit 1
}

# Check if service exists
if [ -z "$1" ]; then
    usage
fi

SERVICE_PATH="$1"
SERVICE_NAME=$(basename "$SERVICE_PATH")
PORT="${2:-3000}"
DB_NAME="${3:-rez_merchant}"

if [ ! -d "$SERVICE_PATH" ]; then
    error "Service directory not found: $SERVICE_PATH"
    exit 1
fi

log "Productionizing service: $SERVICE_NAME (port: $PORT, db: $DB_NAME)"

# Create kubernetes directory
mkdir -p "$SERVICE_PATH/kubernetes"

# Copy templates
log "Copying templates..."

# Dockerfile
if [ ! -f "$SERVICE_PATH/Dockerfile" ]; then
    sed "s/\${PORT:-3000}/$PORT/g" "$TEMPLATES_DIR/docker/Dockerfile.production" > "$SERVICE_PATH/Dockerfile"
    log "Created Dockerfile"
else
    warn "Dockerfile already exists, skipping"
fi

# docker-compose.yml
if [ ! -f "$SERVICE_PATH/docker-compose.yml" ]; then
    sed -e "s/\${PORT:-3000}/$PORT/g" \
        -e "s/\${DB_NAME:-app}/$DB_NAME/g" \
        -e "s/\${SERVICE_NAME}/$SERVICE_NAME/g" \
        "$TEMPLATES_DIR/docker/docker-compose.yml" > "$SERVICE_PATH/docker-compose.yml"
    log "Created docker-compose.yml"
else
    warn "docker-compose.yml already exists, skipping"
fi

# render.yaml
if [ ! -f "$SERVICE_PATH/render.yaml" ]; then
    sed -e "s/\${SERVICE_NAME}/$SERVICE_NAME/g" \
        -e "s/\${PORT:-3000}/$PORT/g" \
        "$TEMPLATES_DIR/render.yaml" > "$SERVICE_PATH/render.yaml"
    log "Created render.yaml"
else
    warn "render.yaml already exists, skipping"
fi

# .env.example
if [ ! -f "$SERVICE_PATH/.env.example" ]; then
    sed -e "s/\${SERVICE_NAME}/$SERVICE_NAME/g" \
        -e "s/\${PORT:-3000}/$PORT/g" \
        -e "s/\${DB_NAME:-app}/$DB_NAME/g" \
        "$TEMPLATES_DIR/.env.example" > "$SERVICE_PATH/.env.example"
    log "Created .env.example"
else
    warn ".env.example already exists, skipping"
fi

# Kubernetes manifests
log "Creating Kubernetes manifests..."

# deployment.yaml
sed -e "s/\${SERVICE_NAME}/$SERVICE_NAME/g" \
    -e "s/\${PORT:-3000}/$PORT/g" \
    -e "s/\${DB_NAME:-app}/$DB_NAME/g" \
    "$TEMPLATES_DIR/kubernetes/deployment.yaml" > "$SERVICE_PATH/kubernetes/deployment.yaml"

# service.yaml
sed -e "s/\${SERVICE_NAME}/$SERVICE_NAME/g" \
    -e "s/\${PORT:-3000}/$PORT/g" \
    "$TEMPLATES_DIR/kubernetes/service.yaml" > "$SERVICE_PATH/kubernetes/service.yaml"

# ingress.yaml
sed -e "s/\${SERVICE_NAME}/$SERVICE_NAME/g" \
    -e "s/\${PORT:-3000}/$PORT/g" \
    -e "s/\${SERVICE_PATH}/$(echo $SERVICE_NAME | tr '[:upper:]' '[:lower:]' | tr '_' '-')/g" \
    "$TEMPLATES_DIR/kubernetes/ingress.yaml" > "$SERVICE_PATH/kubernetes/ingress.yaml"

# configmap.yaml
sed -e "s/\${SERVICE_NAME}/$SERVICE_NAME/g" \
    -e "s/\${PORT:-3000}/$PORT/g" \
    -e "s/\${DB_NAME:-app}/$DB_NAME/g" \
    "$TEMPLATES_DIR/kubernetes/configmap.yaml" > "$SERVICE_PATH/kubernetes/configmap.yaml"

# secret.yaml
sed -e "s/\${SERVICE_NAME}/$SERVICE_NAME/g" \
    -e "s/\${DB_NAME:-app}/$DB_NAME/g" \
    "$TEMPLATES_DIR/kubernetes/secret.yaml" > "$SERVICE_PATH/kubernetes/secret.yaml"

# hpa.yaml
sed -e "s/\${SERVICE_NAME}/$SERVICE_NAME/g" \
    "$TEMPLATES_DIR/kubernetes/hpa.yaml" > "$SERVICE_PATH/kubernetes/hpa.yaml"

log "Created Kubernetes manifests"

# Create k8s directory for service account
mkdir -p "$SERVICE_PATH/kubernetes"
cat > "$SERVICE_PATH/kubernetes/serviceaccount.yaml" << 'EOF'
apiVersion: v1
kind: ServiceAccount
metadata:
  name: SERVICE_NAME-sa
  namespace: rez-merchant
---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: SERVICE_NAME-pdb
  namespace: rez-merchant
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app: SERVICE_NAME
EOF

sed -i "s/SERVICE_NAME/$SERVICE_NAME/g" "$SERVICE_PATH/kubernetes/serviceaccount.yaml"

log "Productionization complete for $SERVICE_NAME!"
log "Next steps:"
log "  1. Review the generated files"
log "  2. Update .env.example with service-specific variables"
log "  3. Update src/index.ts to add security middleware"
log "  4. Run 'npm install' to install new dependencies"
log "  5. Test with 'docker-compose up'"
