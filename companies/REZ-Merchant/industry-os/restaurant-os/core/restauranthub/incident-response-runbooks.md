# RestoPapa Incident Response Runbooks

## Table of Contents

1. [General Incident Response Procedures](#general-incident-response-procedures)
2. [Database Incident Runbooks](#database-incident-runbooks)
3. [Application Service Runbooks](#application-service-runbooks)
4. [Infrastructure Incident Runbooks](#infrastructure-incident-runbooks)
5. [Security Incident Runbooks](#security-incident-runbooks)
6. [Third-Party Service Runbooks](#third-party-service-runbooks)
7. [Performance Issue Runbooks](#performance-issue-runbooks)
8. [Data Recovery Runbooks](#data-recovery-runbooks)

## General Incident Response Procedures

### Incident Classification

**P0 - Critical (Response: Immediate)**
- Complete service outage
- Data breach or security compromise
- Payment system failure
- Significant data loss

**P1 - High (Response: 15 minutes)**
- Major feature unavailable
- Performance severely degraded
- Partial service outage
- Database connectivity issues

**P2 - Medium (Response: 1 hour)**
- Minor feature issues
- Performance degradation
- Non-critical service disruption
- Monitoring alerts

**P3 - Low (Response: Next business day)**
- Cosmetic issues
- Enhancement requests
- Non-urgent maintenance
- Documentation updates

### Initial Response Protocol

#### Step 1: Incident Detection and Triage (0-5 minutes)

1. **Receive Alert**
   ```bash
   # Check alert source and severity
   # Prometheus Alert: Check Grafana dashboard
   # Application Log: Check ELK stack
   # User Report: Verify through monitoring
   ```

2. **Initial Assessment**
   ```bash
   # Quick health check
   curl -f https://api.restopapa.com/api/v1/health

   # Check system status
   kubectl get pods --all-namespaces
   docker ps -a

   # Review recent deployments
   git log --oneline -10
   ```

3. **Classify Incident**
   - Determine severity level (P0-P3)
   - Identify affected systems
   - Estimate impact scope

#### Step 2: Team Mobilization (5-10 minutes)

1. **Notify Response Team**
   ```bash
   # Send alert to incident response channel
   slack-alert "#incident-response" "P1 Incident: Database connectivity issues"

   # Page on-call engineer for P0/P1
   pagerduty-alert "P0: Complete service outage detected"
   ```

2. **Create Incident Room**
   ```bash
   # Create dedicated Slack channel
   slack-create-channel "incident-$(date +%Y%m%d-%H%M)"

   # Start incident bridge
   conference-bridge-start "incident-response"
   ```

3. **Begin Documentation**
   ```bash
   # Create incident ticket
   jira-create-incident "P1: Database connectivity failure"

   # Start incident timeline
   echo "$(date): Incident detected - Database health check failing" >> incident-log.txt
   ```

## Database Incident Runbooks

### Runbook: PostgreSQL Primary Database Down

#### Detection Signals
- Health check endpoint returns database error
- Application logs show connection timeouts
- Prometheus alert: `PostgreSQLDown`

#### Immediate Actions (0-5 minutes)

1. **Verify Database Status**
   ```bash
   # Check database container status
   docker ps | grep postgres
   kubectl get pods -n database

   # Test database connectivity
   pg_isready -h postgres-primary -p 5432 -U restopapa

   # Check database logs
   docker logs restopapa-postgres-prod
   kubectl logs postgres-primary-0 -n database
   ```

2. **Check Resource Availability**
   ```bash
   # Check system resources
   top
   df -h
   free -m

   # Check database-specific metrics
   SELECT version();
   SELECT current_database();
   SELECT count(*) FROM pg_stat_activity;
   ```

#### Recovery Actions (5-15 minutes)

1. **Attempt Service Restart**
   ```bash
   # For Docker deployment
   docker restart restopapa-postgres-prod

   # For Kubernetes deployment
   kubectl rollout restart statefulset/postgres-primary -n database

   # Wait for restart and verify
   sleep 30
   pg_isready -h postgres-primary -p 5432 -U restopapa
   ```

2. **Failover to Standby (if restart fails)**
   ```bash
   # Check standby status
   pg_isready -h postgres-standby -p 5432 -U restopapa

   # Promote standby to primary
   kubectl exec postgres-standby-0 -n database -- pg_promote

   # Update application configuration
   kubectl patch configmap app-config -n app \
     -p '{"data":{"DATABASE_URL":"postgresql://user:pass@postgres-standby:5432/db"}}'

   # Restart application pods
   kubectl rollout restart deployment/api -n app
   ```

3. **Verify Recovery**
   ```bash
   # Test database operations
   psql -h postgres-standby -U restopapa -c "SELECT NOW();"

   # Check application health
   curl -f https://api.restopapa.com/api/v1/health

   # Monitor connection count
   SELECT count(*) FROM pg_stat_activity WHERE state = 'active';
   ```

#### Post-Recovery Actions

1. **Root Cause Analysis**
   ```bash
   # Check PostgreSQL logs
   tail -100 /var/log/postgresql/postgresql.log

   # Review system logs
   journalctl -u postgresql -n 100

   # Analyze metrics
   # Check Grafana dashboard for resource usage patterns
   ```

2. **Prevention Measures**
   - Update monitoring thresholds
   - Review resource allocation
   - Schedule maintenance if needed

---

### Runbook: Database Connection Pool Exhaustion

#### Detection Signals
- `PostgreSQLTooManyConnections` alert
- Application errors: "connection pool exhausted"
- Slow query performance

#### Immediate Actions

1. **Check Connection Status**
   ```sql
   -- Current connections
   SELECT count(*) FROM pg_stat_activity;

   -- Connection by state
   SELECT state, count(*) FROM pg_stat_activity GROUP BY state;

   -- Long-running queries
   SELECT pid, now() - pg_stat_activity.query_start AS duration, query
   FROM pg_stat_activity
   WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';
   ```

2. **Identify Problem Queries**
   ```sql
   -- Kill long-running queries
   SELECT pg_terminate_backend(pid)
   FROM pg_stat_activity
   WHERE (now() - pg_stat_activity.query_start) > interval '10 minutes'
   AND state = 'active';
   ```

3. **Scale Connection Pool**
   ```bash
   # Increase max connections (temporary)
   psql -c "ALTER SYSTEM SET max_connections = 200;"
   psql -c "SELECT pg_reload_conf();"

   # Restart application pools
   kubectl rollout restart deployment/api -n app
   ```

## Application Service Runbooks

### Runbook: API Service High Error Rate

#### Detection Signals
- Prometheus alert: `HighErrorRate`
- Status code 5xx responses > 5%
- Circuit breaker activation

#### Immediate Actions (0-5 minutes)

1. **Check Service Status**
   ```bash
   # Verify pods are running
   kubectl get pods -l app=api -n app

   # Check recent deployments
   kubectl rollout history deployment/api -n app

   # Review error logs
   kubectl logs -l app=api -n app --tail=100 | grep ERROR
   ```

2. **Check Dependencies**
   ```bash
   # Database connectivity
   curl -f https://api.restopapa.com/api/v1/health/database

   # Redis connectivity
   curl -f https://api.restopapa.com/api/v1/health/redis

   # External services
   curl -f https://api.restopapa.com/api/v1/health/external
   ```

#### Recovery Actions (5-30 minutes)

1. **Scale Resources**
   ```bash
   # Increase replica count
   kubectl scale deployment/api --replicas=6 -n app

   # Check resource usage
   kubectl top pods -l app=api -n app

   # Update resource limits if needed
   kubectl patch deployment api -n app -p '{"spec":{"template":{"spec":{"containers":[{"name":"api","resources":{"limits":{"memory":"2Gi","cpu":"1000m"}}}]}}}}'
   ```

2. **Rolling Restart**
   ```bash
   # Perform rolling restart
   kubectl rollout restart deployment/api -n app

   # Monitor rollout status
   kubectl rollout status deployment/api -n app

   # Verify health after restart
   sleep 60
   curl -f https://api.restopapa.com/api/v1/health
   ```

3. **Rollback if Necessary**
   ```bash
   # Check rollout history
   kubectl rollout history deployment/api -n app

   # Rollback to previous version
   kubectl rollout undo deployment/api -n app

   # Verify rollback success
   kubectl rollout status deployment/api -n app
   ```

---

### Runbook: Application Memory Leak

#### Detection Signals
- Pods getting OOMKilled
- Memory usage continuously increasing
- Performance degradation over time

#### Immediate Actions

1. **Identify Affected Pods**
   ```bash
   # Check pod status and restarts
   kubectl get pods -l app=api -n app -o wide

   # Check resource usage
   kubectl top pods -l app=api -n app

   # Review pod events
   kubectl describe pod <pod-name> -n app
   ```

2. **Collect Memory Dumps**
   ```bash
   # For Node.js applications
   kubectl exec <pod-name> -n app -- node --inspect=0.0.0.0:9229 &
   kubectl port-forward <pod-name> 9229:9229 -n app

   # Generate heap dump
   kubectl exec <pod-name> -n app -- kill -USR2 1
   ```

3. **Immediate Mitigation**
   ```bash
   # Increase memory limits temporarily
   kubectl patch deployment api -n app -p '{"spec":{"template":{"spec":{"containers":[{"name":"api","resources":{"limits":{"memory":"4Gi"}}}]}}}}'

   # Restart affected pods
   kubectl delete pod <pod-name> -n app
   ```

## Infrastructure Incident Runbooks

### Runbook: High System Resource Usage

#### Detection Signals
- CPU usage > 80% for 10+ minutes
- Memory usage > 85%
- Disk usage > 90%

#### Immediate Actions

1. **Identify Resource Consumers**
   ```bash
   # Check CPU usage
   top -o %CPU
   ps aux --sort=-%cpu | head -10

   # Check memory usage
   free -m
   ps aux --sort=-%mem | head -10

   # Check disk usage
   df -h
   du -sh /* | sort -hr | head -10
   ```

2. **Quick Wins**
   ```bash
   # Clear temporary files
   find /tmp -type f -atime +7 -delete
   docker system prune -f

   # Restart resource-heavy services
   systemctl restart docker
   kubectl rollout restart deployment/api -n app

   # Clean up logs
   journalctl --vacuum-time=7d
   find /var/log -name "*.log" -type f -mtime +7 -delete
   ```

3. **Scale Resources**
   ```bash
   # Scale out horizontally
   kubectl scale deployment/api --replicas=5 -n app

   # Scale up vertically (if possible)
   kubectl patch deployment api -n app -p '{"spec":{"template":{"spec":{"containers":[{"name":"api","resources":{"limits":{"cpu":"2000m","memory":"4Gi"}}}]}}}}'
   ```

---

### Runbook: Network Connectivity Issues

#### Detection Signals
- High latency between services
- Connection timeouts
- DNS resolution failures

#### Immediate Actions

1. **Basic Connectivity Tests**
   ```bash
   # Test internal connectivity
   ping postgres-primary.database.svc.cluster.local
   ping redis-primary.cache.svc.cluster.local

   # Test external connectivity
   ping 8.8.8.8
   curl -I https://google.com

   # Check DNS resolution
   nslookup api.restopapa.com
   dig @8.8.8.8 api.restopapa.com
   ```

2. **Network Interface Checks**
   ```bash
   # Check interface status
   ip addr show
   ip route show

   # Check network statistics
   netstat -i
   ss -tuln

   # Check for dropped packets
   cat /proc/net/dev
   ```

3. **Service Mesh Debugging**
   ```bash
   # Check Istio/service mesh status
   kubectl get pods -n istio-system

   # Check proxy configuration
   istioctl proxy-config cluster <pod-name>
   istioctl proxy-status

   # Review service mesh logs
   kubectl logs -l app=istio-proxy -n app
   ```

## Security Incident Runbooks

### Runbook: Suspected Data Breach

#### Detection Signals
- Unusual data access patterns
- Failed authentication attempts
- Unauthorized data exports
- Security scanner alerts

#### Immediate Actions (0-15 minutes)

1. **Contain the Breach**
   ```bash
   # Disable suspicious user accounts
   kubectl exec -it api-pod -n app -- \
     psql -c "UPDATE users SET is_active = false WHERE id = '<suspicious-user-id>';"

   # Block suspicious IP addresses
   kubectl apply -f - <<EOF
   apiVersion: networking.k8s.io/v1
   kind: NetworkPolicy
   metadata:
     name: block-suspicious-ips
   spec:
     podSelector:
       matchLabels:
         app: api
     policyTypes:
     - Ingress
     ingress:
     - from:
       - ipBlock:
           cidr: 0.0.0.0/0
           except:
           - <suspicious-ip>/32
   EOF
   ```

2. **Preserve Evidence**
   ```bash
   # Capture current system state
   date > /tmp/incident-$(date +%Y%m%d-%H%M).log
   ps aux >> /tmp/incident-$(date +%Y%m%d-%H%M).log
   netstat -tuln >> /tmp/incident-$(date +%Y%m%d-%H%M).log

   # Backup relevant logs
   kubectl logs -l app=api -n app --since=24h > /tmp/api-logs-$(date +%Y%m%d).log
   cp /var/log/auth.log /tmp/auth-backup-$(date +%Y%m%d).log

   # Create disk image (if possible)
   dd if=/dev/sda of=/tmp/disk-image-$(date +%Y%m%d).img bs=4096
   ```

3. **Assess Scope**
   ```bash
   # Check for data exfiltration
   kubectl exec -it api-pod -n app -- \
     psql -c "SELECT user_id, COUNT(*) FROM audit_logs WHERE action = 'data_export' AND created_at > NOW() - INTERVAL '24 hours' GROUP BY user_id ORDER BY count DESC;"

   # Review authentication logs
   grep "Failed password" /var/log/auth.log | tail -100

   # Check file access patterns
   find /var/data -name "*.sql" -o -name "*.csv" -newermt "24 hours ago"
   ```

#### Investigation Actions (15 minutes - 4 hours)

1. **Forensic Analysis**
   ```bash
   # Analyze web server logs
   awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -nr | head -20

   # Check for SQL injection attempts
   grep -i "union\|select\|drop\|insert" /var/log/nginx/access.log

   # Review application logs
   grep -i "error\|exception\|unauthorized" /var/log/app/application.log | tail -100
   ```

2. **Data Impact Assessment**
   ```bash
   # Check for sensitive data access
   kubectl exec -it api-pod -n app -- \
     psql -c "SELECT table_name, column_name FROM information_schema.columns WHERE column_name LIKE '%password%' OR column_name LIKE '%ssn%' OR column_name LIKE '%credit%';"

   # Review data export activities
   kubectl exec -it api-pod -n app -- \
     psql -c "SELECT user_id, created_at, data_type, record_count FROM data_exports WHERE created_at > NOW() - INTERVAL '7 days';"
   ```

#### Recovery Actions

1. **Patch Security Vulnerabilities**
   ```bash
   # Update application dependencies
   npm audit fix
   pip install --upgrade -r requirements.txt

   # Apply security patches
   kubectl apply -f security-patches/

   # Update WAF rules
   aws wafv2 update-web-acl --scope=CLOUDFRONT --id=<web-acl-id> --default-action=Block
   ```

2. **Strengthen Security Controls**
   ```bash
   # Enable additional logging
   kubectl patch deployment api -n app -p '{"spec":{"template":{"spec":{"containers":[{"name":"api","env":[{"name":"LOG_LEVEL","value":"DEBUG"}]}]}}}}'

   # Implement rate limiting
   kubectl apply -f rate-limiting-policy.yaml

   # Force password resets for affected accounts
   kubectl exec -it api-pod -n app -- \
     psql -c "UPDATE users SET password_reset_required = true WHERE last_login < NOW() - INTERVAL '30 days';"
   ```

## Third-Party Service Runbooks

### Runbook: Payment Gateway Failure

#### Detection Signals
- Payment processing errors
- Circuit breaker activation for payments
- Webhook failures from payment provider

#### Immediate Actions

1. **Check Service Status**
   ```bash
   # Check provider status pages
   curl -s https://status.razorpay.com/api/v2/status.json | jq '.status.description'
   curl -s https://status.stripe.com/api/v2/status.json | jq '.page.status_description'

   # Test API connectivity
   curl -H "Authorization: Bearer $PAYMENT_API_KEY" \
        https://api.razorpay.com/v1/payments
   ```

2. **Activate Fallback Payment Methods**
   ```bash
   # Enable backup payment processor
   kubectl patch configmap payment-config -n app \
     -p '{"data":{"FALLBACK_PAYMENT_ENABLED":"true","PRIMARY_PAYMENT_PROVIDER":"stripe_backup"}}'

   # Restart payment service
   kubectl rollout restart deployment/payment-service -n app
   ```

3. **Enable Manual Payment Processing**
   ```bash
   # Enable cash/manual payment options
   kubectl patch configmap app-config -n app \
     -p '{"data":{"MANUAL_PAYMENT_ENABLED":"true","CASH_PAYMENT_ENABLED":"true"}}'

   # Notify customer support team
   slack-alert "#customer-support" "Payment gateway down - manual processing enabled"
   ```

---

### Runbook: Email Service Disruption

#### Detection Signals
- Email delivery failures
- SMTP connection errors
- High bounce rate alerts

#### Immediate Actions

1. **Check Email Service Status**
   ```bash
   # Test SMTP connectivity
   telnet smtp.gmail.com 587

   # Check service provider status
   curl -s https://status.sendgrid.com/api/v2/status.json

   # Review email logs
   tail -f /var/log/mail.log | grep "$(date +%Y-%m-%d)"
   ```

2. **Switch to Backup Email Provider**
   ```bash
   # Update email configuration
   kubectl patch configmap email-config -n app \
     -p '{"data":{"SMTP_HOST":"backup-smtp.provider.com","SMTP_USER":"backup-user","SMTP_PASS":"backup-pass"}}'

   # Restart email service
   kubectl rollout restart deployment/email-service -n app
   ```

3. **Queue Critical Emails**
   ```bash
   # Check email queue status
   kubectl exec -it redis-primary-0 -n cache -- redis-cli LLEN email_queue

   # Process high-priority emails manually
   kubectl exec -it api-pod -n app -- \
     node scripts/process-critical-emails.js
   ```

## Performance Issue Runbooks

### Runbook: High Response Time

#### Detection Signals
- API response time > 2 seconds
- User complaints about slow loading
- Apdex score degradation

#### Immediate Actions

1. **Identify Bottlenecks**
   ```bash
   # Check application performance
   kubectl top pods -n app

   # Review slow query logs
   kubectl exec -it postgres-primary-0 -n database -- \
     psql -c "SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

   # Check cache hit ratio
   kubectl exec -it redis-primary-0 -n cache -- \
     redis-cli info stats | grep "keyspace_hits\|keyspace_misses"
   ```

2. **Quick Performance Fixes**
   ```bash
   # Scale horizontally
   kubectl scale deployment/api --replicas=8 -n app

   # Enable query caching
   kubectl patch configmap app-config -n app \
     -p '{"data":{"ENABLE_QUERY_CACHE":"true","CACHE_TTL":"300"}}'

   # Restart services to apply caching
   kubectl rollout restart deployment/api -n app
   ```

3. **Database Optimization**
   ```bash
   # Update statistics
   kubectl exec -it postgres-primary-0 -n database -- \
     psql -c "ANALYZE;"

   # Identify missing indexes
   kubectl exec -it postgres-primary-0 -n database -- \
     psql -c "SELECT schemaname, tablename, attname, n_distinct, correlation FROM pg_stats WHERE schemaname = 'public' ORDER BY n_distinct DESC;"
   ```

## Data Recovery Runbooks

### Runbook: Accidental Data Deletion

#### Detection Signals
- User reports of missing data
- Unexpected row count decreases
- Audit log entries showing bulk deletes

#### Immediate Actions

1. **Stop Further Data Loss**
   ```bash
   # Create database snapshot immediately
   kubectl exec -it postgres-primary-0 -n database -- \
     pg_dump restopapa > /tmp/emergency-backup-$(date +%Y%m%d-%H%M).sql

   # Enable read-only mode
   kubectl patch configmap app-config -n app \
     -p '{"data":{"READ_ONLY_MODE":"true"}}'

   # Scale down write operations
   kubectl scale deployment/api --replicas=1 -n app
   ```

2. **Assess Data Loss Scope**
   ```bash
   # Check recent delete operations
   kubectl exec -it postgres-primary-0 -n database -- \
     psql -c "SELECT * FROM audit_logs WHERE action = 'DELETE' AND created_at > NOW() - INTERVAL '1 hour' ORDER BY created_at DESC;"

   # Identify affected tables
   kubectl exec -it postgres-primary-0 -n database -- \
     psql -c "SELECT table_name, pg_size_pretty(pg_total_relation_size(table_name::regclass)) as size FROM information_schema.tables WHERE table_schema = 'public' ORDER BY pg_total_relation_size(table_name::regclass) DESC;"
   ```

3. **Point-in-Time Recovery**
   ```bash
   # Find appropriate backup
   aws s3 ls s3://restopapa-backups/daily/ | grep $(date +%Y-%m-%d)

   # Download backup
   aws s3 cp s3://restopapa-backups/daily/backup-$(date +%Y%m%d).tar.gz /tmp/

   # Restore to recovery database
   kubectl exec -it postgres-recovery-0 -n database -- \
     pg_restore -d restopapa_recovery /tmp/backup-$(date +%Y%m%d).tar.gz
   ```

4. **Selective Data Recovery**
   ```bash
   # Extract specific data from backup
   kubectl exec -it postgres-recovery-0 -n database -- \
     psql -d restopapa_recovery -c "SELECT * FROM users WHERE deleted_at IS NULL;" > /tmp/users-recovery.sql

   # Import recovered data
   kubectl exec -it postgres-primary-0 -n database -- \
     psql -d restopapa -f /tmp/users-recovery.sql
   ```

---

## Emergency Contacts and Escalation

### On-Call Engineers
- **Primary**: [Contact Info]
- **Secondary**: [Contact Info]
- **Database Expert**: [Contact Info]
- **Security Specialist**: [Contact Info]

### Vendor Support
- **AWS Support**: 1-800-xxx-xxxx (Case ID required)
- **Database Support**: [Contact Info]
- **Monitoring Support**: [Contact Info]

### Escalation Matrix
- **Level 1**: On-call engineer (immediate)
- **Level 2**: Team lead (15 minutes)
- **Level 3**: Engineering manager (30 minutes)
- **Level 4**: CTO/VP Engineering (1 hour)

### Communication Channels
- **Incident Response**: #incident-response
- **Status Updates**: #status-updates
- **Management**: #incident-management
- **External**: status.restopapa.com

---

**Document Information:**
- Version: 1.1
- Last Updated: May 2026
- Next Review: November 2026
- Owner: DevOps Team
- Classification: Internal Use Only

These runbooks should be regularly tested and updated based on actual incident experiences and system changes.