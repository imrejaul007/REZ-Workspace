# Operations Runbook

## Overview
This runbook covers operational procedures for the ReZ Merchant B2B platform (NexTaBizz).

## Monitoring

### Key Metrics to Monitor

| Metric | Alert Threshold | Action |
|--------|-----------------|--------|
| API Latency P95 | > 500ms | Check database, scale service |
| Error Rate | > 1% | Review logs, rollback if needed |
| Reconciliation Queue | > 1000 pending | Scale reconciliation workers |
| WhatsApp Delivery | < 95% | Check WhatsApp API status |
| Tally Sync Failures | > 10% | Check Tally API connectivity |

### Health Checks
```
GET /health
GET /health/ready
GET /health/live
```

### Monitoring Dashboards
- Grafana: `https://grafana.rez.app/d/b2b-overview`
- Datadog: `https://app.datadoghq.com/dashboard/b2b`

## Common Operations

### 1. Restarting Services
```bash
# Restart merchant service
kubectl rollout restart deployment/rez-merchant-service

# Check status
kubectl rollout status deployment/rez-merchant-service
```

### 2. Scaling
```bash
# Scale to 3 replicas
kubectl scale deployment/rez-merchant-service --replicas=3

# Auto-scale based on CPU
kubectl autoscale deployment/rez-merchant-service --cpu-percent=70 --min=2 --max=10
```

### 3. Database Operations

#### MongoDB Backup
```bash
# Daily backup
mongodump --uri="$MONGODB_URI" --archive=/backups/b2b-$(date +%Y%m%d).archive

# Restore
mongorestore --uri="$MONGODB_URI" --archive=/backups/b2b-20240115.archive
```

#### Index Rebuild
```javascript
// Rebuild supplier indexes
db.suppliers.reIndex()

// Check index stats
db.suppliers.indexStats()
```

### 4. Redis Operations

#### Clear Reconciliation Cache
```bash
redis-cli -u $REDIS_URL DEL "reconciliation:*"
```

#### Check Queue Lengths
```bash
redis-cli -u $REDIS_URL LLEN "bullmq:reconciliation"
redis-cli -u $REDIS_URL LLEN "bullmq:dunning"
```

### 5. Manual Reconciliation

#### Trigger Auto-Match
```bash
curl -X POST https://api.rez.app/api/b2b/reconciliation/auto-match \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"batchId": "optional-specific-batch"}'
```

#### Manual Match
```bash
curl -X POST https://api.rez.app/api/b2b/reconciliation/match \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "transactionId": "txn-123",
    "paymentId": "pay-456",
    "confidence": 1.0
  }'
```

### 6. WhatsApp Troubleshooting

#### Check Template Status
```bash
curl https://api.rez.app/api/b2b/whatsapp/templates \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

#### Retry Failed Messages
```javascript
// Mark for retry
db.reminderSequences.updateMany(
  { status: 'failed', createdAt: { $gt: new Date(Date.now() - 86400000) } },
  { $set: { status: 'pending' } }
);
```

### 7. Tally Sync Issues

#### Check Last Sync
```javascript
db.tallySyncHistory.find().sort({ createdAt: -1 }).limit(5)
```

#### Force Re-Sync
```bash
curl -X POST https://api.rez.app/api/b2b/tally-sync/export \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"force": true, "entities": ["purchaseOrders"]}'
```

## Incident Response

### P1 - Service Down
1. Check Kubernetes pods: `kubectl get pods -l app=rez-merchant-service`
2. Get logs: `kubectl logs -l app=rez-merchant-service --tail=100`
3. Check MongoDB connectivity
4. Scale up if needed
5. Page on-call if not resolved in 15 min

### P2 - Degraded Performance
1. Check database slow queries
2. Review recent deployments
3. Scale horizontally
4. Enable query logging for analysis

### P3 - Feature Issues
1. Check error logs
2. Identify affected endpoints
3. Deploy fix or rollback
4. Notify affected users

## Rollback Procedures

### Code Rollback
```bash
# Get previous version
kubectl rollout history deployment/rez-merchant-service

# Rollback to previous
kubectl rollout undo deployment/rez-merchant-service
```

### Database Migration Rollback
```bash
# Check migration status
db.migrations.find().sort({ appliedAt: -1 })

# Rollback specific migration
db.migrations.deleteOne({ version: "002_b2b_features" })
```

## Scheduled Jobs

| Job | Schedule | Description |
|-----|----------|-------------|
| Reconciliation Auto-Match | Every 15 min | Match new bank transactions |
| Dunning Reminder Sender | Every hour | Send pending reminders |
| Tally Sync | Daily at 2 AM | Sync previous day's data |
| Credit Line Interest | Monthly | Calculate interest charges |
| Ledger Statement | Monthly | Generate supplier statements |

## Emergency Contacts

| Role | Contact |
|------|---------|
| On-Call Engineer | PagerDuty |
| DBA | @dba-team |
| Infrastructure | @infra-team |
| WhatsApp Business | business.support@wa.me |
