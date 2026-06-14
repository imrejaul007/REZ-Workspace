#!/bin/bash
# RTMN Kubernetes Deployment Script

set -e

NAMESPACE="rtmn"
CONTEXT="${KUBECTL_CONTEXT:-minikube}"

echo "🚀 Deploying RTMN Platform to Kubernetes"
echo "   Namespace: $NAMESPACE"
echo "   Context: $CONTEXT"

# Check prerequisites
command -v kubectl >/dev/null 2>&1 || { echo "kubectl is required but not installed."; exit 1; }
command -v kustomize >/dev/null 2>&1 || { echo "kustomize is recommended for deployment."; exit 1; }

# Apply base configuration
echo "📦 Applying base configuration..."
kubectl --context=$CONTEXT apply -f base/namespace.yaml

# Apply secrets (requires manual editing first)
echo "🔐 Applying secrets..."
read -p "Have you updated secrets.yaml with real values? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please edit base/secrets.yaml with your credentials first!"
    exit 1
fi
kubectl --context=$CONTEXT apply -f base/secrets.yaml

# Apply rest of configuration
echo "📋 Applying ConfigMaps..."
kubectl --context=$CONTEXT apply -f base/configmap.yaml

echo "🐳 Applying Deployments..."
kubectl --context=$CONTEXT apply -f base/deployments.yaml

echo "🌐 Applying Services..."
kubectl --context=$CONTEXT apply -f base/services.yaml

echo "🗄️  Applying StatefulSets..."
kubectl --context=$CONTEXT apply -f base/statefulsets.yaml

echo "📡 Applying Ingress..."
kubectl --context=$CONTEXT apply -f base/ingress.yaml

echo "⚖️  Applying HPA..."
kubectl --context=$CONTEXT apply -f base/hpa.yaml

# Wait for deployments
echo "⏳ Waiting for deployments to be ready..."
kubectl --context=$CONTEXT wait --for=condition=available --timeout=300s deployment/rtmn-complete -n $NAMESPACE
kubectl --context=$CONTEXT wait --for=condition=available --timeout=300s deployment/energy-os -n $NAMESPACE
kubectl --context=$CONTEXT wait --for=condition=available --timeout=300s deployment/boa-dashboard -n $NAMESPACE

# Show status
echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Status:"
kubectl --context=$CONTEXT get pods -n $NAMESPACE
echo ""
echo "🌐 Services:"
kubectl --context=$CONTEXT get svc -n $NAMESPACE
echo ""
echo "📝 Next steps:"
echo "   1. Update /etc/hosts: echo '127.0.0.1 rtmn.example.com' | sudo tee -a /etc/hosts"
echo "   2. Access dashboard: http://rtmn.example.com"
echo "   3. API: http://rtmn.example.com/api"
