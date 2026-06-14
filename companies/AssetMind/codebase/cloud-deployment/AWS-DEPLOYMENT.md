# AssetMind AWS Deployment Guide

**Platform:** Amazon Web Services  
**Date:** June 12, 2026

---

## Overview

This guide covers deploying AssetMind on AWS using:
- **ECS/Fargate** for container orchestration
- **RDS** for PostgreSQL
- **ElastiCache** for Redis
- **Neptune** for Neo4j-compatible graph database
- **ALB** for load balancing
- **CloudWatch** for monitoring

## Prerequisites

- AWS CLI configured (`aws configure`)
- ECS CLI (optional)
- Docker
- Domain name configured in Route 53

## Architecture

```
Internet → ALB → ECS Fargate (API Gateway)
                    ↓
              ECS Fargate (Services)
                    ↓
        ┌──────────┼──────────┐
        ↓          ↓          ↓
     RDS         Redis     Neptune
   PostgreSQL    ElastiCache  Graph
```

## Step 1: Create VPC

```bash
# Create VPC
aws ec2 create-vpc --cidr-block 10.0.0.0/16 --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=assetmind-vpc}]'

VPC_ID=$(aws ec2 describe-vpcs --filters "Name=tag:Name,Values=assetmind-vpc" --query 'Vpcs[0].VpcId' --output text)

# Create subnets
aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.1.0/24 --availability-zone us-east-1a --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=assetmind-subnet-1}]'

aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.2.0/24 --availability-zone us-east-1b --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=assetmind-subnet-2}]'

aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.3.0/24 --availability-zone us-east-1c --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=assetmind-subnet-3}]'
```

## Step 2: Create RDS PostgreSQL

```bash
# Create DB subnet group
aws rds create-db-subnet-group \
  --db-subnet-group-name assetmind-db-subnet \
  --db-subnet-group-description "AssetMind DB Subnet Group" \
  --subnet-ids subnet-xxxxx subnet-xxxxx

# Create DB instance
aws rds create-db-instance \
  --db-instance-identifier assetmind-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 15.3 \
  --allocated-storage 100 \
  --master-username assetmind \
  --master-user-password 'YourSecurePassword123!' \
  --db-subnet-group-name assetmind-db-subnet \
  --vpc-security-group-ids sg-xxxxx \
  --backup-retention-period 7 \
  --storage-encrypted
```

## Step 3: Create ElastiCache Redis

```bash
# Create subnet group
aws elasticache create-cache-subnet-group \
  --cache-subnet-group-name assetmind-redis \
  --cache-subnet-group-description "AssetMind Redis Subnet Group" \
  --subnet-ids subnet-xxxxx

# Create Redis cluster
aws elasticache create-cache-cluster \
  --cluster-id assetmind-redis \
  --cache-node-type cache.t3.medium \
  --engine redis \
  --engine-version 7.0 \
  --num-cache-nodes 2 \
  --cache-subnet-group-name assetmind-redis \
  --security-group-ids sg-xxxxx
```

## Step 4: Create ECS Cluster

```bash
# Create cluster
aws ecs create-cluster \
  --cluster-name assetmind-cluster \
  --capacity-providers FARGATE \
  --settings Name=containerInsights,Value=enabled

# Register task definition
aws ecs register-task-definition \
  --cli-input-json file://ecs/task-definition.json

# Create service
aws ecs create-service \
  --cluster assetmind-cluster \
  --service-name assetmind-api-gateway \
  --task-definition assetmind-api-gateway:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxx,subnet-xxxxx],securityGroups=[sg-xxxxx],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:us-east-1:123456789:targetgroup/assetmind-tg/xxxxx,containerName=api-gateway,containerPort=5260"
```

## Step 5: Application Load Balancer

```bash
# Create ALB
aws elbv2 create-load-balancer \
  --name assetmind-alb \
  --subnets subnet-xxxxx subnet-xxxxx \
  --security-groups sg-xxxxx \
  --scheme internet-facing \
  --type application

# Create target group
aws elbv2 create-target-group \
  --name assetmind-tg \
  --protocol HTTP \
  --port 5260 \
  --vpc-id vpc-xxxxx \
  --health-check-path /health

# Create listener
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:us-east-1:123456789:loadbalancer/app/assetmind-alb/xxxxx \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:us-east-1:123456789:targetgroup/assetmind-tg/xxxxx
```

## Step 6: ECS Task Definition

Create `ecs/task-definition.json`:

```json
{
  "family": "assetmind-api-gateway",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "api-gateway",
      "image": "assetmind/api-gateway:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 5260,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789:secret:assetmind/DATABASE_URL:DATABASE_URL::"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/assetmind",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

## Step 7: AWS Secrets Manager

```bash
# Create secrets
aws secretsmanager create-secret \
  --name assetmind/DATABASE_URL \
  --secret-string 'postgresql://assetmind:password@host:5432/assetmind'

aws secretsmanager create-secret \
  --name assetmind/REDIS_URL \
  --secret-string 'redis://:password@host:6379'

aws secretsmanager create-secret \
  --name assetmind/SECRET_KEY \
  --secret-string 'your-secret-key-here'
```

## Step 8: CloudWatch Dashboard

```bash
# Create dashboard
aws cloudwatch put-dashboard \
  --dashboard-name AssetMind \
  --dashboard-body file://cloudwatch/dashboard.json
```

## Step 9: SSL Certificate

```bash
# Request certificate
aws acm request-certificate \
  --domain-name api.assetmind.ai \
  --subject-alternative-names "*.assetmind.ai" \
  --validation-method DNS

# Add Route 53 records for validation
```

## Cost Estimate (Monthly)

| Service | Configuration | Est. Cost |
|---------|--------------|-----------|
| ECS Fargate | 4 tasks × 1 vCPU | ~$50 |
| RDS PostgreSQL | db.t3.medium | ~$100 |
| ElastiCache Redis | 2 nodes | ~$60 |
| ALB | Basic | ~$25 |
| Data Transfer | - | ~$20 |
| **Total** | | **~$255/month** |

## Useful Commands

```bash
# View logs
aws logs tail /ecs/assetmind --follow

# Scale service
aws ecs update-service --cluster assetmind-cluster --service-name assetmind-api-gateway --desired-count 4

# Get service status
aws ecs describe-services --cluster assetmind-cluster --services assetmind-api-gateway
```

---

*Generated by Claude Code*  
*Last updated: June 12, 2026*
