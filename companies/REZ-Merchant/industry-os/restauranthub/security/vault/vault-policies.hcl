# Vault Policies for RestaurantHub

# Application Policy - Read access to application secrets
path "secret/data/restauranthub/app/*" {
  capabilities = ["read"]
}

path "secret/metadata/restauranthub/app/*" {
  capabilities = ["read"]
}

# Database credentials - short-term leases
path "database/creds/restauranthub-app" {
  capabilities = ["read"]
}

# JWT signing keys
path "secret/data/restauranthub/jwt/*" {
  capabilities = ["read"]
}

# API Keys Policy - For external service integrations
path "secret/data/restauranthub/api-keys/*" {
  capabilities = ["read"]
}

# AWS credentials for S3 access
path "aws/creds/restauranthub-s3" {
  capabilities = ["read"]
}

# Admin Policy - Full access for administrators
path "secret/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "auth/*" {
  capabilities = ["create", "read", "update", "delete", "list", "sudo"]
}

path "sys/*" {
  capabilities = ["create", "read", "update", "delete", "list", "sudo"]
}

# DevOps Policy - Infrastructure management
path "secret/data/restauranthub/infrastructure/*" {
  capabilities = ["read", "update"]
}

path "aws/creds/restauranthub-infrastructure" {
  capabilities = ["read"]
}

path "database/creds/restauranthub-backup" {
  capabilities = ["read"]
}

# Monitoring Policy - For observability stack
path "secret/data/restauranthub/monitoring/*" {
  capabilities = ["read"]
}

# CI/CD Policy - For deployment pipelines
path "secret/data/restauranthub/cicd/*" {
  capabilities = ["read"]
}

path "auth/token/create/cicd" {
  capabilities = ["update"]
}

# Backup Policy - For backup services
path "secret/data/restauranthub/backup/*" {
  capabilities = ["read"]
}

path "aws/creds/restauranthub-backup" {
  capabilities = ["read"]
}