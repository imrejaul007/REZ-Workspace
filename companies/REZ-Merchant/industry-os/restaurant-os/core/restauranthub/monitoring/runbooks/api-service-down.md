# API Service Down

## Summary
The RestoPapa API service is unreachable or not responding to health checks. This is a **CRITICAL** alert that affects all platform functionality.

## Severity
🔴 **CRITICAL**

## Symptoms
- Health check endpoint returns non-2xx status or timeouts
- Users cannot access any API functionality
- Frontend applications show connection errors
- No API request metrics in monitoring

## Dashboard Links
- [System Overview](http://grafana.restopapa.com/d/system-overview)
- [API Performance](http://grafana.restopapa.com/d/api-performance)

## Investigation

### 1. Verify the Issue (2 minutes)
```bash
# Test API health endpoint directly
curl -v http://localhost:3000/api/v1/health
curl -v https://api.restopapa.com/api/v1/health

# Check if process is running
ps aux | grep node | grep restopapa-api
systemctl status restopapa-api

# Check Docker container status (if containerized)
docker ps | grep restopapa-api
docker logs restopapa-api --tail 50
```

### 2. Check System Resources (2 minutes)
```bash
# Check available memory
free -m

# Check CPU usage
top -n 1

# Check disk space
df -h

# Check for OOM kills
dmesg | grep -i "killed process"
```

### 3. Check Network Connectivity (1 minute)
```bash
# Test port binding
netstat -tlnp | grep :3000
ss -tlnp | grep :3000

# Check firewall rules
iptables -L INPUT | grep 3000
```

### 4. Review Recent Logs (3 minutes)
```bash
# Check application logs
journalctl -u restopapa-api -n 100 --no-pager
tail -f /var/log/restopapa/api/error.log

# Check system logs for crashes
journalctl -p err -n 50 --no-pager
```

## Resolution

### Scenario 1: Service Stopped/Crashed

1. **Restart the service**
   ```bash
   # Systemd service
   sudo systemctl restart restopapa-api
   sudo systemctl status restopapa-api

   # Docker container
   docker restart restopapa-api
   docker logs restopapa-api --tail 20
   ```

2. **Verify restart**
   ```bash
   curl http://localhost:3000/api/v1/health
   ```

3. **Monitor for stability**
   - Watch logs for 5 minutes
   - Check memory usage doesn't grow rapidly
   - Verify metrics are flowing

### Scenario 2: Resource Exhaustion

1. **Memory exhaustion**
   ```bash
   # Free up memory
   sudo systemctl restart restopapa-api

   # If severe, restart other non-critical services
   sudo systemctl restart nginx
   ```

2. **Disk space full**
   ```bash
   # Clean up logs
   sudo journalctl --vacuum-time=7d
   sudo find /var/log -name "*.log" -mtime +7 -delete

   # Clean up temp files
   sudo rm -rf /tmp/*
   ```

3. **Too many open files**
   ```bash
   # Check limits
   ulimit -n

   # Increase limits (requires restart)
   echo "fs.file-max = 65536" >> /etc/sysctl.conf
   sysctl -p
   ```

### Scenario 3: Database Connection Issues

1. **Check database connectivity**
   ```bash
   # Test database connection
   psql -h localhost -U postgres -d restopapa -c "SELECT 1;"

   # Check connection count
   psql -h localhost -U postgres -d restopapa -c "SELECT count(*) FROM pg_stat_activity;"
   ```

2. **Restart database if needed**
   ```bash
   sudo systemctl restart postgresql
   sudo systemctl status postgresql
   ```

### Scenario 4: Configuration Issues

1. **Check configuration files**
   ```bash
   # Verify environment variables
   sudo systemctl show restopapa-api --property=Environment

   # Check config file syntax
   node -c /app/dist/main.js
   ```

2. **Restore from backup if corrupted**
   ```bash
   sudo cp /backup/config/.env /app/.env
   sudo systemctl restart restopapa-api
   ```

## Verification

After resolution, verify the fix:

1. **Health check passes**
   ```bash
   curl http://localhost:3000/api/v1/health
   # Should return 200 OK with health status
   ```

2. **Metrics flowing**
   - Check Grafana dashboard shows new data
   - Verify Prometheus is scraping metrics

3. **Frontend connectivity**
   - Test a few API endpoints manually
   - Check frontend applications can connect

4. **Performance acceptable**
   - Response times under 500ms
   - Memory usage stable
   - No error logs

## Prevention

### Short-term
1. **Enable auto-restart**
   ```bash
   # Add to systemd service file
   Restart=always
   RestartSec=5
   ```

2. **Increase monitoring frequency**
   - Health check every 15 seconds
   - Memory usage alerts at 80%

### Long-term
1. **Implement graceful shutdown**
   - Handle SIGTERM properly
   - Close database connections cleanly
   - Drain in-flight requests

2. **Add circuit breakers**
   - Database connection timeout
   - External API timeouts
   - Retry with backoff

3. **Resource optimization**
   - Profile memory usage
   - Optimize database queries
   - Implement connection pooling

4. **High availability setup**
   - Load balancer with health checks
   - Multiple API instances
   - Auto-scaling based on load

## Related Runbooks
- [High Memory Usage](./high-memory-usage.md)
- [Database Down](./postgres-down.md)
- [High Response Time](./high-response-time.md)

## Post-Incident Actions

1. **Root cause analysis**
   - Review logs from before the incident
   - Check for code deployments or config changes
   - Identify contributing factors

2. **Documentation updates**
   - Update this runbook with new findings
   - Document any new resolution steps
   - Share lessons learned with team

3. **Preventive measures**
   - Implement monitoring improvements
   - Add automated recovery scripts
   - Schedule infrastructure upgrades

## Emergency Contacts
- **On-call Engineer**: Check #oncall channel
- **Backend Team Lead**: @backend-lead
- **DevOps Engineer**: @devops-oncall
- **Engineering Manager**: @eng-manager (for extended outages)

---

**Response Time Target**: 5 minutes to initial response, 15 minutes to resolution
**Last Updated**: 2024-01-15
**Runbook Owner**: DevOps Team