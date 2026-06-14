# AssetMind Deployment Guide

This guide covers deploying AssetMind to AWS, GCP, and Azure cloud platforms.

## Prerequisites

- Docker and Docker Compose installed
- AWS CLI / GCP CLI / Azure CLI configured
- Git initialized repository

## Quick Setup (Local Development)

```bash
# Run the setup script
chmod +x setup.sh
./setup.sh
```

---

## AWS Deployment

### Option 1: ECS (Elastic Container Service)

#### Step 1: Configure AWS Credentials
```bash
aws configure
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <your-account>.dkr.ecr.us-east-1.amazonaws.com
```

#### Step 2: Create ECR Repository
```bash
aws ecr create-repository --repository-name assetmind --region us-east-1
```

#### Step 3: Build and Push Docker Image
```bash
docker build -t assetmind .
docker tag assetmind:latest <your-account>.dkr.ecr.us-east-1.amazonaws.com/assetmind:latest
docker push <your-account>.dkr.ecr.us-east-1.amazonaws.com/assetmind:latest
```

#### Step 4: Create ECS Cluster
```bash
aws ecs create-cluster --cluster-name assetmind-cluster
```

#### Step 5: Register Task Definition
```bash
aws ecs register-task-definition --cli-input-json file://ecs-task-definition.json
```

#### Step 6: Create Service
```bash
aws ecs create-service --cluster assetmind-cluster --task-definition assetmind --desired-count 2 --launch-type FARGATE --network-configuration "awsvpcConfiguration={subnets=[<subnet-id>],securityGroups=[<sg-id>]}"
```

### Option 2: Elastic Beanstalk

```bash
# Install EB CLI
pip install awsebcli

# Initialize EB application
eb init -p docker assetmind

# Create environment
eb create assetmind-prod

# Deploy
eb deploy
```

### Option 3: EC2 with Docker

```bash
# SSH into EC2 instance
ssh -i your-key.pem ec2-user@<public-ip>

# Install Docker
sudo yum install docker
sudo systemctl start docker

# Clone repository
git clone https://github.com/your-org/assetmind.git
cd assetmind

# Configure environment
cp .env.example .env
nano .env  # Add production values

# Run Docker Compose
docker-compose up -d
```

---

## GCP Deployment

### Option 1: Cloud Run

#### Step 1: Configure GCP Project
```bash
gcloud config set project your-project-id
gcloud services enable run.googleapis.com cloudbuild.googleapis.com
```

#### Step 2: Build and Deploy to Cloud Run
```bash
# Build container
gcloud builds submit --tag gcr.io/your-project-id/assetmind:latest

# Deploy to Cloud Run
gcloud run deploy assetmind \
  --image gcr.io/your-project-id/assetmind:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000 \
  --set-env-vars "NODE_ENV=production"
```

### Option 2: GKE (Kubernetes)

```bash
# Create GKE cluster
gcloud container clusters create assetmind-cluster \
  --zone us-central1-a \
  --num-nodes 3

# Get credentials
gcloud container clusters get-credentials assetmind-cluster --zone us-central1-a

# Apply Kubernetes manifests
kubectl apply -f kubernetes/deployment.yaml
kubectl apply -f kubernetes/service.yaml

# Scale application
kubectl scale deployment assetmind --replicas=3
```

### Option 3: Compute Engine

```bash
# SSH into VM
gcloud compute ssh instance-name --zone=us-central1-a

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Clone and deploy
git clone https://github.com/your-org/assetmind.git
cd assetmind
docker-compose up -d
```

---

## Azure Deployment

### Option 1: Azure Container Instances

```bash
# Login to Azure
az login

# Create resource group
az group create --name assetmind-rg --location eastus

# Deploy container
az container create \
  --resource-group assetmind-rg \
  --name assetmind \
  --image <your-registry>.azurecr.io/assetmind:latest \
  --dns-name-label assetmind-app \
  --ports 3000 \
  --environment-variables NODE_ENV=production
```

### Option 2: Azure App Service (Web App for Containers)

```bash
# Create App Service Plan
az appservice plan create --resource-group assetmind-rg --name assetmind-plan --sku B1 --is-linux

# Create Web App
az webapp create \
  --resource-group assetmind-rg \
  --plan assetmind-plan \
  --name assetmind-app \
  --deployment-container-image-name <your-registry>.azurecr.io/assetmind:latest

# Configure environment variables
az webapp config appsettings set \
  --resource-group assetmind-rg \
  --name assetmind-app \
  --settings NODE_ENV=production PORT=3000
```

### Option 3: Azure Kubernetes Service (AKS)

```bash
# Create AKS cluster
az aks create \
  --resource-group assetmind-rg \
  --name assetmind-cluster \
  --node-count 3 \
  --enable-addons monitoring \
  --generate-ssh-keys

# Get credentials
az aks get-credentials --resource-group assetmind-rg --name assetmind-cluster

# Deploy
kubectl apply -f kubernetes/deployment.yaml
kubectl apply -f kubernetes/service.yaml
```

---

## Docker Compose (Production)

For production with docker-compose:

```bash
# Create production override file
cat > docker-compose.prod.yml << EOF
version: '3.8'
services:
  app:
    restart: always
    environment:
      - NODE_ENV=production
    deploy:
      replicas: 2
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
EOF

# Deploy
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## Environment Variables (Production)

Set these environment variables for production:

| Variable | Description | Example |
|----------|-------------|---------|
| NODE_ENV | Environment | `production` |
| PORT | Application port | `3000` |
| MONGODB_URI | MongoDB connection string | `mongodb://user:pass@host:27017/assetmind` |
| JWT_SECRET | JWT signing secret | Generate strong random string |
| ML_SERVICE_URL | ML service endpoint | `http://ml-service:5001` |

---

## Health Checks

Verify deployment:

```bash
# Local
curl http://localhost:3000/health

# AWS ECS
aws ecs describe-services --cluster assetmind-cluster --services assetmind

# GCP Cloud Run
gcloud run services describe assetmind --region us-central1

# Azure
az container show --resource-group assetmind-rg --name assetmind
```

---

## Troubleshooting

### Container won't start
- Check logs: `docker-compose logs -f`
- Verify environment variables are set
- Check port availability

### Database connection issues
- Verify MONGODB_URI format
- Check network connectivity
- Ensure MongoDB is accessible

### Performance issues
- Scale containers: `docker-compose up -d --scale app=3`
- Check resource limits
- Review application logs

---

## Security Best Practices

1. Never commit `.env` files
2. Use secrets management (AWS Secrets Manager, GCP Secret Manager, Azure Key Vault)
3. Enable HTTPS/TLS in production
4. Regular security updates: `docker-compose pull`
5. Use read-only containers where possible

---

## Rollback Procedure

```bash
# Docker Compose rollback
docker-compose down
git checkout <previous-version>
docker-compose up -d

# Kubernetes rollback
kubectl rollout undo deployment/assetmind

# ECS rollback
aws ecs update-service --cluster assetmind-cluster --service assetmind --task-definition assetmind:previous
```