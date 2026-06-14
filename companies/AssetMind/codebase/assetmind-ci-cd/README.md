# CI/CD Configuration

GitHub Actions CI/CD for AssetMind.

## Workflows

### CI Pipeline
- Run tests on push
- Coverage reports
- Lint checks

### CD Pipeline
- Deploy to staging
- Deploy to production
- Docker builds

## Quick Start

```bash
# View workflows
ls .github/workflows/

# Run locally
act -W .github/workflows/ci.yml
```

## Secrets Required

```bash
DOCKER_USERNAME
DOCKER_PASSWORD
SENTRY_DSN
```