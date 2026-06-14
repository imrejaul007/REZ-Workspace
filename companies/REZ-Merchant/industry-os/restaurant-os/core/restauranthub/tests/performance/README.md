# Performance Testing Suite

This directory contains comprehensive performance testing tools and configurations for RestoPapa.

## Overview

Our performance testing strategy uses multiple tools to ensure the API can handle production load:

- **k6** - Primary load testing tool with detailed metrics
- **Artillery.js** - Alternative load testing with scenario-based testing
- **GitHub Actions** - Automated performance testing in CI/CD

## Test Types

### 1. Load Testing
Tests normal expected load to verify performance under typical usage.
- **Duration**: 10-15 minutes
- **Virtual Users**: 10-100
- **Purpose**: Baseline performance measurement

### 2. Spike Testing
Tests system response to sudden traffic spikes.
- **Duration**: 2-5 minutes
- **Virtual Users**: 10-500 (sudden jump)
- **Purpose**: Verify graceful handling of traffic spikes

### 3. Stress Testing
Tests system limits to find breaking points.
- **Duration**: 15-20 minutes
- **Virtual Users**: 100-600+
- **Purpose**: Identify maximum capacity and failure modes

### 4. Volume Testing
Tests with large amounts of data over extended periods.
- **Duration**: 30-60 minutes
- **Virtual Users**: 50-200
- **Purpose**: Verify stability over time

## Quick Start

### Prerequisites
```bash
# Install k6 (macOS)
brew install k6

# Install k6 (Linux)
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Install Artillery (npm)
npm install -g artillery@latest
```

### Start Testing Environment
```bash
# From project root
npm run redis:up          # Start Redis
npm run dev               # Start API in development mode

# Or use the setup script
npm run perf:setup
```

### Run Tests

#### k6 Tests
```bash
# Load test
npm run perf:k6:load

# Spike test
npm run perf:k6:spike

# Stress test
npm run perf:k6:stress

# All k6 tests
npm run perf:all
```

#### Artillery Tests
```bash
npm run perf:artillery
```

#### Manual k6 Test
```bash
cd tests/performance
k6 run --vus 50 --duration 5m k6-load-test.js
```

## Configuration

### Environment Variables
Set these in your `.env` file or environment:

```bash
# Test target
BASE_URL=http://localhost:3000

# Test credentials
ADMIN_EMAIL=admin@restopapa.com
ADMIN_PASSWORD=Password123

# Optional: Datadog integration
DATADOG_API_KEY=your_datadog_api_key
```

### Performance Thresholds

Our tests enforce these performance standards:

| Metric | Threshold | Description |
|--------|-----------|-------------|
| P95 Response Time | < 2000ms | 95% of requests under 2 seconds |
| P99 Response Time | < 3000ms | 99% of requests under 3 seconds |
| Failure Rate | < 5% | Less than 5% of requests should fail |
| Requests/sec | > 100 | Minimum throughput requirement |

### Test Scenarios

#### Authentication Flow (30% of traffic)
- Sign in with credentials
- Verify token with /auth/me
- Tests JWT validation performance

#### Restaurant Operations (25% of traffic)
- List restaurants
- Get specific restaurant details
- Tests database query performance

#### Job Portal (20% of traffic)
- List jobs with pagination
- Search jobs by criteria
- Tests search and filtering performance

#### Health Monitoring (15% of traffic)
- API health checks
- Redis health checks
- Tests monitoring overhead

#### Search Operations (10% of traffic)
- Job search with filters
- Restaurant search with location
- Tests search algorithm performance

## Interpreting Results

### k6 Output
```
✓ http_req_duration.......avg=245ms  min=98ms   med=215ms  max=1.2s   p(90)=395ms  p(95)=498ms
✓ http_req_failed.........0.12%   ✓ 234      ✗ 1
✓ http_reqs...............1567 req (261.16/s)
✓ vus.....................50     min=1       max=50
```

**Key Metrics:**
- `http_req_duration` - Response time distribution
- `http_req_failed` - Failure rate (should be < 5%)
- `http_reqs` - Total requests and rate
- `vus` - Virtual users over time

### Artillery Output
```
Summary report @ 14:32:15(+0000) 2023-12-07
  Scenarios launched:  1200
  Scenarios completed: 1195
  Requests completed:  3585
  Mean response/sec:   119.5
  Response time (msec):
    min: 45
    max: 2314
    median: 198
    p95: 589
    p99: 1247
  Scenario duration (msec):
    min: 1023
    max: 8245
    median: 2891
    p95: 6234
    p99: 7589
  Codes:
    200: 3540
    401: 35
    429: 10
```

## Continuous Integration

### GitHub Actions
Performance tests automatically run on:
- **Pull Requests** - Basic load tests to catch regressions
- **Main Branch** - Full test suite on merges
- **Scheduled** - Nightly comprehensive testing
- **Manual** - On-demand testing with custom parameters

### Performance Regression Detection
Tests will fail CI if:
- P95 response time > 2000ms
- P99 response time > 3000ms
- Failure rate > 5%
- Requests/sec < 100

## Monitoring Integration

### Datadog (Optional)
Configure Datadog API key to send metrics:
```yaml
# In artillery-config.yml
plugins:
  publish-metrics:
    - type: datadog
      apiKey: "${DATADOG_API_KEY}"
```

### Custom Metrics
Track business-specific metrics:
- Authentication success rate
- Database query performance
- Redis cache hit rate
- API endpoint response times

## Troubleshooting

### Common Issues

#### High Response Times
1. Check database connection pool
2. Verify Redis is running and connected
3. Monitor CPU/memory usage
4. Check for N+1 queries

#### High Failure Rate
1. Verify test credentials are correct
2. Check rate limiting configuration
3. Ensure database has sufficient connections
4. Monitor error logs

#### Test Setup Failures
```bash
# Verify API is running
curl http://localhost:3000/api/v1/auth/health

# Check Redis connection
curl http://localhost:3000/api/v1/auth/redis-health

# Restart services
npm run redis:down && npm run redis:up
```

## Best Practices

### Test Design
- Start with realistic user scenarios
- Use appropriate think times (1-5 seconds)
- Test with production-like data volumes
- Include error scenarios (invalid credentials, missing data)

### Data Management
- Use separate test database
- Reset data between test runs
- Mock external services when possible
- Clean up test data after runs

### Performance Optimization
Based on test results, common optimizations:
- Database indexing
- Query optimization
- Caching strategies
- Connection pooling
- API response compression

## Advanced Usage

### Custom Test Scripts
Create custom k6 scripts for specific scenarios:

```javascript
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
};

export default function () {
  const response = http.get('http://localhost:3000/api/v1/custom-endpoint');
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

### Load Testing Environments

#### Staging Environment
```bash
BASE_URL=https://api-staging.restopapa.com npm run perf:k6:load
```

#### Production Environment
```bash
# Only run with approval and monitoring
BASE_URL=https://api.restopapa.com npm run perf:k6:load
```

## Resources

- [k6 Documentation](https://k6.io/docs/)
- [Artillery.js Documentation](https://artillery.io/docs/)
- [Performance Testing Best Practices](https://k6.io/docs/testing-guides/performance-testing/)
- [RestoPapa API Documentation](../docs/api.md)