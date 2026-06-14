# RestoPapa Load Testing Quick Start Guide

## Overview

This guide provides step-by-step instructions for running comprehensive scalability and load tests on RestoPapa to simulate 10,000+ concurrent users and identify performance bottlenecks.

## Prerequisites

### Required Tools
```bash
# Install K6 (macOS)
brew install k6

# Install K6 (Linux)
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6

# Install Docker & Docker Compose
# Follow official Docker installation guide for your platform

# Install Python dependencies for analysis
pip install pandas matplotlib seaborn numpy
```

### System Requirements
- **Minimum**: 8GB RAM, 4 CPU cores
- **Recommended**: 16GB RAM, 8 CPU cores
- **Storage**: 10GB free space for results and monitoring data

## Quick Start (5 Minutes)

### 1. Start RestoPapa API
```bash
cd /Users/rejaulkarim/Documents/Resturistan\ App/restopapa

# Start the API server
npm run dev

# Verify API is running
curl http://localhost:3000/api/v1/auth/health
```

### 2. Run Basic Load Test
```bash
# Run a simple 5-minute load test with 100 users
./scripts/run-scalability-tests.sh \
  --base-url http://localhost:3000 \
  --max-vus 100 \
  --duration 5m \
  --skip-monitoring
```

### 3. View Results
```bash
# Check results directory
ls -la results/

# Open performance report (if generated)
open results/reports/*/dashboard.html
```

## Comprehensive Testing (1-3 Hours)

### 1. Start Monitoring Infrastructure
```bash
# Start comprehensive monitoring stack
docker-compose -f monitoring/performance-monitoring.yml up -d

# Wait for services to be ready (2-3 minutes)
docker-compose -f monitoring/performance-monitoring.yml ps

# Access monitoring dashboards
open http://localhost:3004  # Grafana (admin/PerformanceMonitoring123)
open http://localhost:9091  # Prometheus
```

### 2. Run Full Test Suite
```bash
# Execute comprehensive scalability tests
./scripts/run-scalability-tests.sh \
  --base-url http://localhost:3000 \
  --email admin@restopapa.com \
  --password Password123 \
  --duration 3h \
  --max-vus 2000
```

### 3. Analyze Results
```bash
# Run automated bottleneck analysis
python scripts/analyze-performance-bottlenecks.py results/

# View generated reports
open results/performance-analysis-*.md
open results/visualizations/*.png
```

## Test Scenarios Explained

### Baseline Test (10 minutes, 50 users)
- Establishes performance baseline
- Measures normal operating conditions
- Identifies basic performance characteristics

### Load Test (15 minutes, 100-200 users)
- Simulates typical user load
- Tests sustained performance
- Validates normal operating capacity

### Stress Test (20 minutes, 500-1000 users)
- Pushes system beyond normal capacity
- Identifies breaking points
- Tests error handling under pressure

### Spike Test (5 minutes, sudden surge to 2000 users)
- Simulates traffic spikes (viral content, promotions)
- Tests auto-scaling capabilities
- Validates system recovery

### Endurance Test (30 minutes, 300 users sustained)
- Tests system stability over time
- Identifies memory leaks
- Validates long-running performance

## Key Metrics to Monitor

### Performance Metrics
- **Response Time**: P95 should be < 2 seconds
- **Throughput**: Target > 100 requests/second
- **Error Rate**: Should stay < 5%
- **Concurrent Users**: Maximum supported before degradation

### System Metrics
- **CPU Usage**: Should stay < 80%
- **Memory Usage**: Watch for memory leaks
- **Database Connections**: Monitor pool utilization
- **Cache Hit Rate**: Should be > 80%

## Interpreting Results

### Good Performance Indicators
```
✅ P95 response time < 2 seconds
✅ Error rate < 1%
✅ Throughput > 100 req/s
✅ CPU usage < 70%
✅ Memory usage stable
```

### Warning Signs
```
⚠️  P95 response time 2-5 seconds
⚠️  Error rate 1-5%
⚠️  Throughput declining under load
⚠️  CPU usage > 80%
⚠️  Memory usage increasing over time
```

### Critical Issues
```
❌ P95 response time > 5 seconds
❌ Error rate > 10%
❌ Throughput < 50 req/s
❌ CPU usage > 90%
❌ Memory exhaustion
❌ Database connection pool exhausted
```

## Troubleshooting Common Issues

### "API Not Accessible" Error
```bash
# Check if API is running
curl -f http://localhost:3000/api/v1/auth/health

# Check logs
npm run dev  # Look for startup errors

# Verify database connection
# Check .env file for correct DATABASE_URL
```

### "High Error Rate" During Tests
```bash
# Check API logs for specific errors
docker logs <api-container-name>

# Common causes:
# - Database connection pool exhausted
# - Memory exhaustion
# - Rate limiting triggered
# - Authentication failures
```

### "Monitoring Services Not Starting"
```bash
# Check Docker resources
docker system df
docker system prune  # If needed

# Check port conflicts
netstat -tulpn | grep :3004  # Grafana port
netstat -tulpn | grep :9091  # Prometheus port

# Restart monitoring stack
docker-compose -f monitoring/performance-monitoring.yml down
docker-compose -f monitoring/performance-monitoring.yml up -d
```

### "K6 Test Failures"
```bash
# Check K6 version
k6 version

# Update if needed
brew upgrade k6  # macOS
# or follow Linux update instructions

# Verify test script syntax
k6 run --vus 1 --duration 10s tests/performance/k6-scalability-test.js
```

## Advanced Configuration

### Custom Test Parameters
```bash
# Test specific endpoints only
export TEST_TYPE="auth"  # Focus on authentication
./scripts/run-scalability-tests.sh

# Adjust thresholds
export ERROR_THRESHOLD=0.02  # 2% error threshold
export RESPONSE_THRESHOLD=1500  # 1.5s response threshold
```

### Different Load Patterns
```bash
# Gradual ramp-up test
k6 run --stage 2m:50,5m:100,2m:200,5m:200,2m:0 \
  tests/performance/k6-scalability-test.js

# Constant load test
k6 run --vus 150 --duration 30m \
  tests/performance/k6-scalability-test.js

# Burst test pattern
k6 run --stage 30s:0,30s:500,1m:500,30s:0 \
  tests/performance/k6-scalability-test.js
```

### Database-Specific Testing
```bash
# Focus on database performance
export TEST_TYPE="database"
./scripts/run-scalability-tests.sh --max-vus 200 --duration 20m
```

## Results Analysis

### Automated Analysis
```bash
# Generate comprehensive analysis report
python scripts/analyze-performance-bottlenecks.py results/ \
  --format both \
  --output results/analysis

# View bottleneck analysis
cat results/analysis/performance-analysis-*.md
```

### Manual Analysis
```bash
# Check raw K6 results
jq '.metrics.http_req_duration.values' results/*/summary.json

# Extract specific metrics
jq '.metrics | {
  avg_response: .http_req_duration.values.avg,
  error_rate: .http_req_failed.values.rate,
  throughput: .http_reqs.values.rate
}' results/*/summary.json
```

### Trending Analysis
```bash
# Compare multiple test runs
python -c "
import json
import glob
import pandas as pd

files = glob.glob('results/*/summary.json')
data = []
for f in files:
    with open(f) as file:
        result = json.load(file)
        data.append({
            'test_run': f,
            'avg_response': result['metrics']['http_req_duration']['values']['avg'],
            'error_rate': result['metrics']['http_req_failed']['values']['rate']
        })

df = pd.DataFrame(data)
print(df)
"
```

## Performance Optimization Tips

### Immediate Improvements
1. **Database Connection Pooling**
   - Increase max connections in Prisma configuration
   - Add connection pool monitoring

2. **Response Caching**
   - Cache frequently accessed endpoints
   - Implement cache invalidation strategy

3. **Query Optimization**
   - Add database indexes for search queries
   - Optimize N+1 query patterns

### Medium-term Improvements
1. **Horizontal Scaling**
   - Add load balancer
   - Scale API instances
   - Implement database read replicas

2. **Advanced Caching**
   - Redis cluster setup
   - Multi-layer caching strategy

3. **Resource Optimization**
   - Container resource limits
   - Memory usage optimization

## Getting Help

### Log Locations
- **K6 Results**: `results/*/output.log`
- **API Logs**: Check application logs
- **Docker Logs**: `docker-compose logs -f`
- **Monitoring Logs**: `docker-compose -f monitoring/performance-monitoring.yml logs -f`

### Common Commands
```bash
# View running tests
ps aux | grep k6

# Stop all running tests
pkill k6

# Clean up results
rm -rf results/test-*

# Reset monitoring data
docker-compose -f monitoring/performance-monitoring.yml down -v
```

### Support Resources
- **K6 Documentation**: https://k6.io/docs/
- **Performance Testing Guide**: See `scalability-assessment-report.md`
- **Monitoring Setup**: Check `monitoring/` directory
- **Troubleshooting**: See project documentation

## Next Steps After Testing

1. **Review Results**: Analyze performance reports and visualizations
2. **Identify Bottlenecks**: Focus on highest-impact issues first
3. **Implement Optimizations**: Follow the scalability roadmap
4. **Retest**: Validate improvements with follow-up tests
5. **Monitor Production**: Set up continuous monitoring
6. **Schedule Regular Testing**: Establish performance testing cadence

---

**Happy Load Testing!** 🚀

For comprehensive analysis and recommendations, see the `scalability-assessment-report.md` file.