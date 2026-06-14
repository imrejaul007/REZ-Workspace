# MongoDB Atlas Setup Guide

## Quick Setup (5 minutes)

### 1. Create Account

1. Go to https://www.mongodb.com/cloud/atlas
2. Click "Try Free" or "Sign Up"
3. Use Google/GitHub or email

### 2. Create Cluster

1. Click "Build a Database"
2. Select **FREE** tier (M0 Sandbox)
3. Choose region: **Mumbai** (closest to India users)
4. Click "Create"

### 3. Create Database User

1. Go to Security > Database Access
2. Click "Add New Database User"
3. Fill:
   - **Username:** qrcloud
   - **Password:** (generate secure password)
   - **Database Privileges:** "Read and write to any database"
4. Click "Add User"

### 4. Configure Network Access

1. Go to Security > Network Access
2. Click "Add IP Address"
3. Click "Allow Access from Everywhere" (0.0.0.0/0)
4. Click "Confirm"

### 5. Get Connection String

1. Go to Deployment > Database
2. Click "Connect" on your cluster
3. Select "Connect your application"
4. Copy the connection string

### 6. Update .env.production

Use your copied connection string as the value for MONGODB_URI

---

## Connection String Format

Your connection string will be in this format when copied from Atlas:

```
mongodb+srv://[COPY FROM ATLAS]
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Connection timeout | Check network access whitelist |
| Authentication failed | Verify username/password |
| Database not found | Create database first |
| IP blocked | Add 0.0.0.0/0 to network access |

---

## Free Tier Limits

| Resource | Limit |
|----------|-------|
| Storage | 512 MB |
| RAM | Shared |
| Connections | 100 |
| Data transfer | 10 GB/month |

For production: Upgrade to M10+ cluster.
