#!/bin/bash
# Commit and push social automation infrastructure

cd "$(dirname "$0")"

echo "Staging files..."
git add -A

echo "Checking staged files..."
git status --short | grep -v node_modules | head -50

echo ""
echo "Committing..."
git commit -m "feat(AdBazaar): Add production infrastructure for social automation

## Infrastructure Added (June 8, 2026)

### Docker
- Dockerfiles for all 20 services (multi-stage builds)
- .dockerignore files for optimized builds
- Health checks included

### Kubernetes
- Deployment manifests (2 replicas each)
- Service manifests (ClusterIP)
- Ingress rules with TLS
- ConfigMaps for environment variables
- HPA (Horizontal Pod Autoscaling)
- Prometheus annotations

### CI/CD
- GitHub Actions CI workflow (ci-social-automation.yml)
- Deploy workflow (deploy-social-automation.yml)
- Test workflow (test-all-services.yml)
- Matrix strategy for parallel builds

### Documentation
- Complete SOCIAL-AUTOMATION-SUITE.md
- Build plan documentation

Closes #production-infrastructure
Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"

echo ""
echo "Pushing to origin..."
git push origin main

echo ""
echo "Done!"
