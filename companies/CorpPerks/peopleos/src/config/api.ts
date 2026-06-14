# =============================================================================
# PeopleOS Environment Variables Template
# =============================================================================
# Copy this file to .env.local and .env.production
# NEVER commit actual secrets to version control
# =============================================================================

# -----------------------------------------------------------------------------
# API Configuration
# -----------------------------------------------------------------------------

# Development
NEXT_PUBLIC_API_URL=http://localhost:4006/api/v1
NEXT_PUBLIC_CORPINTEL_URL=http://localhost:4135/api
NEXT_PUBLIC_PROJECTOS_URL=http://localhost:4715/api
NEXT_PUBLIC_CORPID_URL=http://localhost:4700/api

# Production (uncomment and update)
# NEXT_PUBLIC_API_URL=https://corpperks-api.onrender.com/api/v1
# NEXT_PUBLIC_CORPINTEL_URL=https://corpperks-intelligence.onrender.com/api
# NEXT_PUBLIC_PROJECTOS_URL=https://projectos-service.onrender.com/api
# NEXT_PUBLIC_CORPID_URL=https://corpid-api.onrender.com/api

# -----------------------------------------------------------------------------
# Feature Flags
# -----------------------------------------------------------------------------
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_ERROR_REPORTING=false

# -----------------------------------------------------------------------------
# App Configuration
# -----------------------------------------------------------------------------
NEXT_PUBLIC_APP_NAME=PeopleOS
NEXT_PUBLIC_APP_URL=http://localhost:3000
