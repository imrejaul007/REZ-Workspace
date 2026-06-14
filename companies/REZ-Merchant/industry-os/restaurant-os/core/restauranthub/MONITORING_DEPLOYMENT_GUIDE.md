# 🚀 RestoPapa Monitoring Stack Deployment Guide
## AI Sentry - Complete Monitoring & Observability Solution

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Detailed Setup](#detailed-setup)
4. [Configuration](#configuration)
5. [Verification](#verification)
6. [Troubleshooting](#troubleshooting)
7. [Maintenance](#maintenance)

---

## 🛠️ Prerequisites

### System Requirements
- **Docker:** 20.10+ with Docker Compose v2+
- **Memory:** Minimum 8GB RAM (16GB recommended)
- **Storage:** 100GB+ available disk space
- **Network:** Ports 3000, 3100, 9090-9999 available
- **OS:** Ubuntu 20.04+, CentOS 8+, or Docker Desktop

### Required Environment Variables
```bash
# Create .env file in root directory
cp .env.example .env
```

Required variables:
```env
# Grafana
GRAFANA_PASSWORD=your-secure-password
GRAFANA_USER=admin

# SMTP for alerts
SMTP_HOST=smtp.gmail.com
SMTP_USER=alerts@restopapa.com
SMTP_PASSWORD=your-app-password

# Webhook notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR/DISCORD/WEBHOOK
TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/YOUR/TEAMS/WEBHOOK
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_CHAT_ID=your-telegram-chat-id

# Database
POSTGRES_PASSWORD=your-db-password
REDIS_PASSWORD=your-redis-password
```

---

## 🚀 Quick Start

### 1. Clone and Setup
```bash
cd /Users/rejaulkarim/Documents/Resturistan\ App/restopapa

# Make scripts executable
chmod +x scripts/self-healing/*.sh
chmod +x scripts/health-reporting/*.py

# Install Python dependencies for health reporting
pip3 install asyncio aiohttp pandas matplotlib jinja2
```

### 2. Start Core Services
```bash
# Start main application services first
docker-compose up -d postgres redis api web

# Wait for services to be ready
sleep 30
```

### 3. Start Monitoring Stack
```bash
# Start monitoring services
docker-compose -f docker-compose.monitoring.yml up -d

# Check status
docker-compose -f docker-compose.monitoring.yml ps
```

### 4. Verify Deployment
```bash
# Check all services are running
curl http://localhost:9090  # Prometheus
curl http://localhost:3000  # Grafana
curl http://localhost:3100/ready  # Loki
curl http://localhost:16686  # Jaeger
```

---

## 🔧 Detailed Setup

### Step 1: Infrastructure Preparation

#### Create Required Directories
```bash
sudo mkdir -p /var/log/restopapa/{api,web,security,audit,performance,errors,business,self-healing}
sudo mkdir -p /var/lib/prometheus
sudo mkdir -p /var/lib/grafana
sudo mkdir -p /var/lib/loki
sudo chown -R $(id -u):$(id -g) /var/log/restopapa /var/lib/prometheus /var/lib/grafana /var/lib/loki
```

#### Network Setup
```bash
# Create monitoring network
docker network create monitoring-network --subnet=172.21.0.0/16
docker network create restopapa-network --subnet=172.20.0.0/16
```

### Step 2: Service Deployment

#### Deploy Monitoring Services
```bash
# Start monitoring stack in correct order
docker-compose -f docker-compose.monitoring.yml up -d prometheus
sleep 10

docker-compose -f docker-compose.monitoring.yml up -d alertmanager
sleep 10

docker-compose -f docker-compose.monitoring.yml up -d grafana
sleep 10

docker-compose -f docker-compose.monitoring.yml up -d loki promtail
sleep 10

docker-compose -f docker-compose.monitoring.yml up -d jaeger
sleep 10

# Start exporters
docker-compose -f docker-compose.monitoring.yml up -d node-exporter cadvisor postgres-exporter redis-exporter blackbox-exporter
sleep 10

# Start webhook service
docker-compose -f docker-compose.monitoring.yml up -d webhook-notifications
```

#### Verify Service Health
```bash
# Check service health
./scripts/check-monitoring-health.sh
```

### Step 3: Configuration Setup

#### Prometheus Configuration
The Prometheus configuration is automatically loaded from:
- `/Users/rejaulkarim/Documents/Resturistan App/restopapa/monitoring/prometheus/prometheus.yml`
- Alert rules from: `/Users/rejaulkarim/Documents/Resturistan App/restopapa/monitoring/prometheus/alerts/`

#### Grafana Setup
1. **Access Grafana:** http://localhost:3000
2. **Login:** admin / your-grafana-password
3. **Import Dashboards:**
   - Executive Overview: Import from `monitoring/grafana/dashboards/executive-overview.json`
   - Security Overview: Import from `monitoring/grafana/dashboards/security/security-overview.json`

#### AlertManager Configuration
AlertManager is pre-configured with multiple notification channels. Update webhook URLs in:
- `/Users/rejaulkarim/Documents/Resturistan App/restopapa/monitoring/alertmanager/alertmanager.yml`

---

## ⚙️ Configuration

### Customizing Alert Rules

#### Add Custom Alert
Create new alert file in `monitoring/prometheus/alerts/custom.yml`:
```yaml
groups:
- name: custom.rules
  rules:
  - alert: CustomAlert
    expr: your_metric > threshold
    for: 5m
    labels:
      severity: warning
      team: your-team
    annotations:
      summary: "Custom alert triggered"
      description: "Your custom alert description"
```

#### Reload Configuration
```bash
# Reload Prometheus configuration
curl -X POST http://localhost:9090/-/reload

# Reload AlertManager configuration
curl -X POST http://localhost:9093/-/reload
```

### Self-Healing Configuration

#### Configure Auto-Recovery
Edit `scripts/self-healing/auto-recovery.sh` to customize:
- Recovery thresholds
- Cooldown periods
- Notification settings

#### Setup Cron Job
```bash
# Add to crontab for automated self-healing
crontab -e

# Run every 5 minutes
*/5 * * * * /path/to/restopapa/scripts/self-healing/auto-recovery.sh
```

### Health Reporting Setup

#### Configure Automated Reports
```bash
# Setup daily health reports
crontab -e

# Daily executive report at 8 AM
0 8 * * * cd /path/to/restopapa && python3 scripts/health-reporting/health-reporter.py --report-type executive --send-email

# Weekly technical report on Mondays at 9 AM
0 9 * * 1 cd /path/to/restopapa && python3 scripts/health-reporting/health-reporter.py --report-type technical --send-email
```

---

## ✅ Verification

### Service Health Checks
```bash
# Run comprehensive health check
curl -s http://localhost:9999/health | jq .

# Check Prometheus targets
curl -s http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | select(.health != "up")'

# Check AlertManager alerts
curl -s http://localhost:9093/api/v1/alerts | jq '.data[] | select(.state == "firing")'

# Test webhook notifications
curl -X POST http://localhost:9999/webhook \
  -H "Content-Type: application/json" \
  -d '{"receiver":"test","status":"firing","alerts":[{"status":"firing","labels":{"alertname":"TestAlert","severity":"info"},"annotations":{"summary":"Test notification"}}]}'
```

### Monitoring Validation
```bash
# Validate metrics collection
curl -s http://localhost:9090/api/v1/query?query=up | jq '.data.result[] | select(.value[1] != "1")'

# Check log ingestion
curl -s "http://localhost:3100/loki/api/v1/query?query={job=\"restopapa-api\"}&limit=10" | jq .

# Verify tracing
curl -s http://localhost:16686/api/services | jq .
```

### Dashboard Access
- **Grafana:** http://localhost:3000 (admin/your-password)
- **Prometheus:** http://localhost:9090
- **AlertManager:** http://localhost:9093
- **Jaeger:** http://localhost:16686
- **Webhook Service:** http://localhost:9999/health

---

## 🔧 Troubleshooting

### Common Issues

#### Services Not Starting
```bash
# Check Docker logs
docker-compose -f docker-compose.monitoring.yml logs prometheus
docker-compose -f docker-compose.monitoring.yml logs grafana
docker-compose -f docker-compose.monitoring.yml logs alertmanager

# Check disk space
df -h

# Check memory usage
free -h
```

#### Metrics Not Appearing
```bash
# Check Prometheus configuration
curl http://localhost:9090/api/v1/status/config

# Validate targets
curl http://localhost:9090/api/v1/targets

# Check service discovery
docker-compose -f docker-compose.monitoring.yml logs prometheus | grep -i error
```

#### Alerts Not Firing
```bash
# Check alert rules
curl http://localhost:9090/api/v1/rules

# Test AlertManager
curl -H "Content-Type: application/json" -d '{"receiver":"test","status":"firing","alerts":[{"labels":{"alertname":"TestAlert"}}]}' http://localhost:9093/api/v1/alerts

# Check webhook service
docker-compose -f docker-compose.monitoring.yml logs webhook-notifications
```

#### Grafana Dashboard Issues
```bash
# Reset Grafana admin password
docker exec -it restopapa-grafana grafana-cli admin reset-admin-password newpassword

# Check datasource connection
curl -u admin:password http://localhost:3000/api/datasources
```

### Performance Optimization

#### Prometheus Optimization
```yaml
# Add to prometheus.yml for high-traffic environments
global:
  scrape_interval: 30s  # Increase from 15s
  evaluation_interval: 30s

# Increase retention
storage:
  tsdb:
    retention.time: 15d  # Reduce from 30d if needed
    retention.size: 5GB  # Reduce from 10GB if needed
```

#### Grafana Optimization
```bash
# Increase Grafana memory limit
docker-compose -f docker-compose.monitoring.yml up -d --force-recreate grafana
```

---

## 🔄 Maintenance

### Daily Tasks
```bash
# Check monitoring health
./scripts/check-monitoring-health.sh

# Review alerts
curl -s http://localhost:9093/api/v1/alerts | jq '.data[] | select(.state == "firing")'

# Check disk usage
df -h /var/lib/prometheus /var/lib/grafana /var/log/restopapa
```

### Weekly Tasks
```bash
# Cleanup old metrics
docker exec restopapa-prometheus promtool tsdb cleanup /prometheus

# Update dashboards
# Import latest dashboard configs from monitoring/grafana/dashboards/

# Review and update alert rules
# Check monitoring/prometheus/alerts/ for any needed updates
```

### Monthly Tasks
```bash
# Backup configurations
tar -czf monitoring-backup-$(date +%Y%m%d).tar.gz monitoring/

# Review performance metrics
python3 scripts/health-reporting/health-reporter.py --report-type both

# Update monitoring stack
docker-compose -f docker-compose.monitoring.yml pull
docker-compose -f docker-compose.monitoring.yml up -d
```

### Security Updates
```bash
# Check for security updates
docker scout cves --only-fixed

# Update base images
docker-compose -f docker-compose.monitoring.yml build --pull

# Review access logs
grep -i "failed\|error\|unauthorized" /var/log/restopapa/security/*.log
```

---

## 📞 Support

### Documentation
- **Runbooks:** `/Users/rejaulkarim/Documents/Resturistan App/restopapa/docs/runbooks/`
- **API Documentation:** http://localhost:3000/api/docs
- **Monitoring Guides:** `/Users/rejaulkarim/Documents/Resturistan App/restopapa/docs/monitoring/`

### Contact Information
- **Technical Support:** tech-support@restopapa.com
- **Emergency Escalation:** critical@restopapa.com
- **Documentation Issues:** docs@restopapa.com

### Monitoring Slack Channels
- **#monitoring-alerts** - Real-time alert notifications
- **#monitoring-health** - Daily health reports
- **#infrastructure** - Infrastructure discussions
- **#security-alerts** - Security incident notifications

---

## 🎯 Success Metrics

After successful deployment, you should see:

- ✅ 99.9%+ service uptime in Grafana dashboards
- ✅ <500ms average response time
- ✅ <1% error rate
- ✅ All Prometheus targets healthy
- ✅ Real-time alerts functioning
- ✅ Automated health reports being generated
- ✅ Self-healing actions logged and working
- ✅ Security monitoring active with no critical alerts

---

**🎉 Congratulations! Your RestoPapa monitoring stack is now fully operational with enterprise-grade observability, security monitoring, and self-healing capabilities.**

---

*This deployment guide is part of the RestoPapa AI Sentry monitoring solution. For updates and additional documentation, visit the project repository.*