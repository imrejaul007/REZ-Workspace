# Kubernetes Manifests

Kubernetes deployment configurations for AssetMind.

## Files

- `assetmind-hub.yaml` - Main deployment

## Usage

```bash
# Apply manifests
kubectl apply -f k8s/

# Check status
kubectl get pods -l app=assetmind

# Scale
kubectl scale deployment assetmind-hub --replicas=3
```

## Resources

- Deployment configs
- Service definitions
- Horizontal Pod Autoscaler
- Ingress rules