# HashiCorp Vault Configuration for RestaurantHub

# Storage backend
storage "postgresql" {
  connection_url = "postgres://vault:vaultpassword@postgres-primary-service:5432/vault?sslmode=require"
  table          = "vault_kv_store"
  max_parallel   = 128
}

# High Availability
ha_storage "postgresql" {
  connection_url   = "postgres://vault:vaultpassword@postgres-primary-service:5432/vault?sslmode=require"
  table            = "vault_ha_locks"
  max_parallel     = 128
  redirect_addr    = "https://vault.restauranthub.com:8200"
  cluster_addr     = "https://vault.restauranthub.com:8201"
}

# Listener configuration
listener "tcp" {
  address       = "0.0.0.0:8200"
  cluster_addr  = "0.0.0.0:8201"
  tls_cert_file = "/vault/tls/tls.crt"
  tls_key_file  = "/vault/tls/tls.key"

  # Security headers
  tls_min_version = "tls12"
  tls_cipher_suites = "TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384"
}

# API configuration
api_addr     = "https://vault.restauranthub.com:8200"
cluster_addr = "https://vault.restauranthub.com:8201"

# UI
ui = true

# Logging
log_level = "INFO"
log_format = "json"

# Telemetry
telemetry {
  prometheus_retention_time = "30s"
  disable_hostname          = true
  unauthenticated_metrics_access = false
}

# Seal configuration (Auto-unseal with AWS KMS)
seal "awskms" {
  region     = "us-east-1"
  kms_key_id = "alias/vault-seal-key"
  endpoint   = "https://kms.us-east-1.amazonaws.com"
}