# REZ-Merchant Deployment Templates

Standardized templates for deploying all REZ-Merchant services to production.

## Structure

```
templates/
├── docker/                  # Docker configuration
│   ├── Dockerfile.production
│   ├── docker-compose.yml
│   └── docker-compose.staging.yml
├── kubernetes/              # Kubernetes manifests
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── configmap.yaml
│   ├── secret.yaml
│   ├── hpa.yaml
│   └── serviceaccount.yaml
├── ci/                      # GitHub Actions workflows
│   ├── docker-publish.yml
│   ├── test.yml
│   ├── kubernetes-deploy.yml
│   └── render-deploy.yml
├── security/                # Security middleware
│   ├── middleware.ts
│   ├── errorHandler.ts
│   └── logger.ts
├── health/                  # Health check routes
│   └── healthRoutes.ts
├── validation/              # Zod validation schemas
│   └── zod.ts
└── render.yaml              # Render.com blueprint
```

## Usage

### Applying Templates to a Service

1. Copy the appropriate template files to your service directory
2. Replace template variables:
   - `${SERVICE_NAME}` - Service name (e.g., rez-merchant-service)
   - `${PORT}` - Service port (e.g., 4005)
   - `${DB_NAME}` - Database name
   - `${JWT_SECRET}` - JWT secret from environment

### Docker Deployment

```bash
# Copy templates
cp templates/docker/Dockerfile.production ./Dockerfile
cp templates/docker/docker-compose.yml ./docker-compose.yml

# Set environment variables
cp templates/.env.example .env
# Edit .env with your values

# Build and run
docker-compose up -d
```

### Kubernetes Deployment

```bash
# Render templates with your values
SERVICE_NAME=rez-merchant-service PORT=4005 envsubst < templates/kubernetes/deployment.yaml | kubectl apply -f -

# Or use Kustomize for overlays
```

### Render Deployment

```bash
# Copy render.yaml
cp templates/render.yaml ./render.yaml

# Deploy via Render CLI
render deploy --spec=render.yaml
```

## Template Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SERVICE_NAME` | Service identifier | - |
| `PORT` | Application port | 3000 |
| `DB_NAME` | MongoDB database | app |
| `JWT_SECRET` | JWT signing secret | - |
| `NAMESPACE` | K8s namespace | rez-merchant |
| `VERSION` | Image version | latest |
| `REPLICAS` | K8s replica count | 2 |

## Security

All templates include:
- Non-root user in Docker
- Security headers (Helmet)
- CORS configuration
- Rate limiting
- MongoDB injection prevention
- Request ID tracking
- Structured logging (Winston)

## Health Checks

All services should expose:
- `/health` - Basic health
- `/health/live` - Liveness probe
- `/health/ready` - Readiness probe
- `/healthz` - K8s compatibility
- `/metrics` - Prometheus metrics

## CI/CD

The GitHub Actions workflows support:
- Docker build and push to GHCR
- TypeScript compilation
- Jest test execution
- Kubernetes deployment
- Render deployment

## Notes

- Templates are designed for Node.js 20+
- MongoDB 6+ and Redis 7+ are the standard infrastructure
- All secrets should be managed via environment variables or K8s secrets
- Services should follow the 12-factor app methodology