#!/bin/bash
# Script to generate Kubernetes manifests for all services
# Usage: ./generate-k8s-manifests.sh <service-name> <port> <image-name>

SERVICE_NAME=${1:-rez-service}
PORT=${2:-3000}
IMAGE_NAME=${3:-$SERVICE_NAME}

BASE_DIR="/Users/rejaulkarim/Documents/RTMN/companies/REZ-Merchant"
K8S_DIR="$BASE_DIR/$SERVICE_NAME/kubernetes"

mkdir -p "$K8S_DIR"

# deployment.yaml
cat > "$K8S_DIR/deployment.yaml" << EOF
# Kubernetes Deployment for $SERVICE_NAME
apiVersion: apps/v1
kind: Deployment
metadata:
  name: $SERVICE_NAME
  namespace: rez-merchant
  labels:
    app: $SERVICE_NAME
    version: latest
    managed-by: rez-merchant
spec:
  replicas: 2
  selector:
    matchLabels:
      app: $SERVICE_NAME
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: $SERVICE_NAME
        version: latest
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "$PORT"
        prometheus.io/path: "/metrics"
    spec:
      serviceAccountName: ${SERVICE_NAME}-sa
      securityContext:
        runAsNonRoot: true
        runAsUser: 1001
        fsGroup: 1001
      containers:
        - name: $SERVICE_NAME
          image: ghcr.io/imrejaul007/${IMAGE_NAME}:latest
          imagePullPolicy: Always
          ports:
            - name: http
              containerPort: $PORT
              protocol: TCP
          envFrom:
            - configMapRef:
                name: ${SERVICE_NAME}-config
            - secretRef:
                name: ${SERVICE_NAME}-secrets
          env:
            - name: POD_NAME
              valueFrom:
                fieldRef:
                  fieldPath: metadata.name
            - name: POD_NAMESPACE
              valueFrom:
                fieldRef:
                  fieldPath: metadata.namespace
          resources:
            requests:
              cpu: 100m
              memory: 256Mi
            limits:
              cpu: 500m
              memory: 512Mi
          livenessProbe:
            httpGet:
              path: /health/live
              port: http
            initialDelaySeconds: 15
            periodSeconds: 20
            timeoutSeconds: 5
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /health/ready
              port: http
            initialDelaySeconds: 10
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3
          startupProbe:
            httpGet:
              path: /health
              port: http
            initialDelaySeconds: 5
            periodSeconds: 10
            timeoutSeconds: 3
            failureThreshold: 30
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop:
                - ALL
          volumeMounts:
            - name: tmp-dir
              mountPath: /tmp
      volumes:
        - name: tmp-dir
          emptyDir: {}
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchLabels:
                    app: $SERVICE_NAME
                topologyKey: kubernetes.io/hostname
EOF

# service.yaml
cat > "$K8S_DIR/service.yaml" << EOF
# Kubernetes Service for $SERVICE_NAME
apiVersion: v1
kind: Service
metadata:
  name: $SERVICE_NAME
  namespace: rez-merchant
  labels:
    app: $SERVICE_NAME
    managed-by: rez-merchant
  annotations:
    description: "$SERVICE_NAME service"
spec:
  type: ClusterIP
  ports:
    - name: http
      port: $PORT
      targetPort: http
      protocol: TCP
  selector:
    app: $SERVICE_NAME
EOF

# configmap.yaml
cat > "$K8S_DIR/configmap.yaml" << EOF
# Kubernetes ConfigMap for $SERVICE_NAME
apiVersion: v1
kind: ConfigMap
metadata:
  name: ${SERVICE_NAME}-config
  namespace: rez-merchant
  labels:
    app: $SERVICE_NAME
    managed-by: rez-merchant
data:
  NODE_ENV: "production"
  PORT: "$PORT"
  LOG_LEVEL: "info"
  SERVICE_NAME: "$SERVICE_NAME"
  SERVICE_VERSION: "latest"
  FEATURE_METRICS_ENABLED: "true"
  FEATURE_TRACING_ENABLED: "true"
  CORS_ORIGINS: "https://app.rezmerchant.com,https://admin.rezmerchant.com"
  RATE_LIMIT_MAX: "100"
  RATE_LIMIT_WINDOW_MS: "60000"
  MONGODB_DATABASE: "${SERVICE_NAME}"
  REDIS_DATABASE: "0"
EOF

# secret.yaml
cat > "$K8S_DIR/secret.yaml" << EOF
# Kubernetes Secret for $SERVICE_NAME
# DO NOT commit actual values - use sealed-secrets or external secrets operator
apiVersion: v1
kind: Secret
metadata:
  name: ${SERVICE_NAME}-secrets
  namespace: rez-merchant
  labels:
    app: $SERVICE_NAME
    managed-by: rez-merchant
type: Opaque
stringData:
  JWT_SECRET: "\${JWT_SECRET}"
  JWT_EXPIRES_IN: "24h"
  MONGODB_URI: "mongodb://mongodb-master:27017/${SERVICE_NAME}"
  MONGODB_USERNAME: "\${MONGODB_USERNAME:-}"
  MONGODB_PASSWORD: "\${MONGODB_PASSWORD:-}"
  REDIS_URL: "redis://redis-master:6379"
  REDIS_PASSWORD: "\${REDIS_PASSWORD:-}"
  SENTRY_DSN: "\${SENTRY_DSN:-}"
  SLACK_WEBHOOK_URL: "\${SLACK_WEBHOOK_URL:-}"
  INTERNAL_API_KEY: "\${INTERNAL_API_KEY:-}"
EOF

# ingress.yaml
cat > "$K8S_DIR/ingress.yaml" << EOF
# Kubernetes Ingress for $SERVICE_NAME
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: $SERVICE_NAME
  namespace: rez-merchant
  labels:
    app: $SERVICE_NAME
    managed-by: rez-merchant
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "300"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "300"
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
    nginx.ingress.kubernetes.io/configuration-snippet: |
      more_set_headers "X-Request-ID \$request_id";
spec:
  tls:
    - hosts:
        - api.rezmerchant.com
      secretName: ${SERVICE_NAME}-tls
  rules:
    - host: api.rezmerchant.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: $SERVICE_NAME
                port:
                  number: $PORT
EOF

# hpa.yaml
cat > "$K8S_DIR/hpa.yaml" << EOF
# Kubernetes HPA for $SERVICE_NAME
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ${SERVICE_NAME}-hpa
  namespace: rez-merchant
  labels:
    app: $SERVICE_NAME
    managed-by: rez-merchant
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: $SERVICE_NAME
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
        - type: Percent
          value: 100
          periodSeconds: 15
        - type: Pods
          value: 4
          periodSeconds: 15
      selectPolicy: Max
EOF

# serviceaccount.yaml
cat > "$K8S_DIR/serviceaccount.yaml" << EOF
# Kubernetes ServiceAccount for $SERVICE_NAME
apiVersion: v1
kind: ServiceAccount
metadata:
  name: ${SERVICE_NAME}-sa
  namespace: rez-merchant
  labels:
    app: $SERVICE_NAME
    managed-by: rez-merchant
  annotations:
    description: Service account for $SERVICE_NAME

---
# PodDisruptionBudget for high availability
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: ${SERVICE_NAME}-pdb
  namespace: rez-merchant
  labels:
    app: $SERVICE_NAME
    managed-by: rez-merchant
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app: $SERVICE_NAME

---
# NetworkPolicy for service isolation
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: ${SERVICE_NAME}-network-policy
  namespace: rez-merchant
spec:
  podSelector:
    matchLabels:
      app: $SERVICE_NAME
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: ingress-nginx
      ports:
        - protocol: TCP
          port: $PORT
    - from:
        - podSelector: {}
  egress:
    - to:
        - podSelector:
            matchLabels:
              app: mongodb
      ports:
        - protocol: TCP
          port: 27017
    - to:
        - podSelector:
            matchLabels:
              app: redis
      ports:
        - protocol: TCP
          port: 6379
    - to:
        - namespaceSelector: {}
EOF

echo "Generated Kubernetes manifests for $SERVICE_NAME at $K8S_DIR"
ls -la "$K8S_DIR"