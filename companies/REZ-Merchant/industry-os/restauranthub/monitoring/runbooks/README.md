# RestoPapa Monitoring Runbooks

This directory contains operational runbooks for responding to monitoring alerts and managing the RestoPapa platform. These runbooks provide step-by-step instructions for diagnosing and resolving common issues.

## 🚨 Emergency Response

For **CRITICAL** alerts, follow this immediate response protocol:

1. **Acknowledge the alert** in Slack/AlertManager
2. **Check the runbook** for the specific alert
3. **Assess impact** using dashboards
4. **Take immediate action** per runbook instructions
5. **Escalate if needed** following the escalation matrix
6. **Document resolution** in the incident log

## 📊 Monitoring Overview

### Key Dashboards
- **System Overview**: http://grafana.restopapa.com/d/system-overview
- **Business Metrics**: http://grafana.restopapa.com/d/business-metrics
- **Database Performance**: http://grafana.restopapa.com/d/database-performance
- **API Performance**: http://grafana.restopapa.com/d/api-performance

### Alert Channels
- **Critical Alerts**: #alerts-critical
- **Warning Alerts**: #alerts-warning
- **Business Alerts**: #alerts-business
- **Security Alerts**: #alerts-security

## 📚 Runbook Index

### System Health
- [API Service Down](./api-service-down.md) - RestoPapa API is unreachable
- [Database Down](./postgres-down.md) - PostgreSQL database is unavailable
- [Redis Down](./redis-down.md) - Redis cache service is unavailable
- [High Memory Usage](./high-memory-usage.md) - System memory usage is critical

### Performance Issues
- [High Response Time](./high-response-time.md) - API response times are elevated
- [High Error Rate](./high-error-rate.md) - Elevated HTTP error rates
- [Slow Database Queries](./slow-db-queries.md) - Database performance degradation
- [High Event Loop Delay](./high-event-loop-delay.md) - Node.js event loop issues

### Business Metrics
- [Low User Registrations](./low-user-registrations.md) - User registration rate is low
- [High Churn Rate](./high-churn-rate.md) - User retention is below threshold
- [Payment Failures](./payment-failures.md) - High payment failure rate
- [No Revenue](./no-revenue.md) - No payment transactions processed

### Security Issues
- [Authentication Failures](./auth-failures.md) - High authentication failure rate
- [Brute Force Attack](./brute-force.md) - Suspicious authentication activity
- [Rate Limit Violations](./rate-limit-hits.md) - High rate limit violations

### Infrastructure
- [Monitoring System Down](./monitoring-down.md) - Monitoring infrastructure issues
- [Log Aggregation Issues](./log-issues.md) - Log collection and aggregation problems
- [Certificate Expiry](./cert-expiry.md) - SSL certificate expiration

## 🔄 Incident Response Process

### 1. Alert Triage (0-5 minutes)
- Check alert severity and affected systems
- Verify alert is not a false positive
- Acknowledge alert to prevent spam
- Assess user impact using business metrics

### 2. Initial Response (5-15 minutes)
- Follow specific runbook procedures
- Apply immediate mitigation if available
- Check for correlated alerts or issues
- Communicate status to stakeholders

### 3. Investigation (15-30 minutes)
- Deep dive into root cause analysis
- Check recent deployments or changes
- Review logs and metrics thoroughly
- Engage additional team members if needed

### 4. Resolution (30+ minutes)
- Implement permanent fix
- Verify resolution with monitoring
- Update documentation if needed
- Schedule post-incident review

### 5. Post-Incident (24-48 hours)
- Conduct blameless post-mortem
- Update runbooks with lessons learned
- Implement preventive measures
- Share findings with team

## 📞 Escalation Matrix

### Level 1 - On-Call Engineer
- **Response Time**: 5 minutes
- **Responsibilities**: Initial triage, basic troubleshooting
- **Escalate When**: Unable to resolve in 15 minutes

### Level 2 - Senior Engineer
- **Response Time**: 10 minutes
- **Responsibilities**: Complex troubleshooting, system analysis
- **Escalate When**: System-wide impact or data corruption

### Level 3 - Engineering Manager
- **Response Time**: 15 minutes
- **Responsibilities**: Resource allocation, external communication
- **Escalate When**: Extended outage or business impact

### Level 4 - CTO/VP Engineering
- **Response Time**: 30 minutes
- **Responsibilities**: Executive decisions, customer communication
- **Escalate When**: Major incident with significant business impact

## 🛠 Tools and Resources

### Monitoring Tools
- **Prometheus**: http://prometheus.restopapa.com:9090
- **Grafana**: http://grafana.restopapa.com:3000
- **AlertManager**: http://alertmanager.restopapa.com:9093
- **Jaeger**: http://jaeger.restopapa.com:16686

### Logging Tools
- **Loki**: http://loki.restopapa.com:3100
- **Kibana**: http://kibana.restopapa.com:5601

### Infrastructure Tools
- **AWS Console**: https://console.aws.amazon.com
- **Kubernetes Dashboard**: http://k8s.restopapa.com
- **Docker Swarm**: http://swarm.restopapa.com

### Communication Channels
- **Slack Workspace**: restopapa.slack.com
- **Incident Channel**: #incidents
- **Operations Channel**: #operations
- **Engineering Channel**: #engineering

## 📋 Common Commands

### System Health Checks
```bash
# Check service status
systemctl status restopapa-api
systemctl status postgresql
systemctl status redis

# Check container health
docker ps
docker logs restopapa-api
docker stats

# Check resource usage
htop
df -h
free -m
```

### Database Commands
```bash
# Connect to PostgreSQL
psql -h localhost -U postgres -d restopapa

# Check connections
SELECT count(*) FROM pg_stat_activity;

# Check slow queries
SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;

# Check database size
SELECT pg_size_pretty(pg_database_size('restopapa'));
```

### Application Commands
```bash
# Check API health
curl http://localhost:3000/api/v1/health

# Check metrics
curl http://localhost:3000/api/v1/metrics

# Restart API service
sudo systemctl restart restopapa-api

# View application logs
journalctl -u restopapa-api -f
```

### Monitoring Commands
```bash
# Reload Prometheus config
curl -X POST http://localhost:9090/-/reload

# Check AlertManager status
curl http://localhost:9093/-/healthy

# Test alert
curl -XPOST http://localhost:9093/api/v1/alerts
```

## 🚀 Quick Start Checklist

For new team members responding to alerts:

1. **Access Setup**
   - [ ] Slack access to alert channels
   - [ ] Grafana dashboard access
   - [ ] Server SSH access
   - [ ] AWS console access
   - [ ] PagerDuty access (if applicable)

2. **Knowledge Prerequisites**
   - [ ] System architecture understanding
   - [ ] Alert severity levels
   - [ ] Escalation procedures
   - [ ] Key metrics and thresholds

3. **Essential Bookmarks**
   - [ ] System overview dashboard
   - [ ] This runbook repository
   - [ ] Service documentation
   - [ ] Team contact information

## 📝 Runbook Template

When creating new runbooks, use this template:

```markdown
# Alert Name

## Summary
Brief description of the alert and its impact.

## Severity
Critical/Warning/Info

## Symptoms
- What users might experience
- What metrics show the issue
- Related alerts that might fire

## Investigation
1. Check dashboard X
2. Review logs in Y
3. Verify Z is functioning

## Resolution
1. Step-by-step resolution
2. Verification steps
3. Rollback procedures if needed

## Prevention
- Monitoring improvements
- Code changes
- Process improvements

## Related Runbooks
- Link to related procedures
```

## 📞 Emergency Contacts

- **On-Call Engineer**: Use PagerDuty or check #oncall channel
- **Engineering Manager**: @engineering-manager
- **DevOps Lead**: @devops-lead
- **CTO**: @cto (for critical incidents only)

---

*Last Updated: 2024-01-15*
*Maintained by: DevOps Team*