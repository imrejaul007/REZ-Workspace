# RestoPapa Centralized Logging with ELK Stack

## Overview

The RestoPapa application now includes comprehensive centralized logging using the ELK (Elasticsearch, Logstash, Kibana) stack with additional monitoring and APM capabilities.

## Architecture

### Components

1. **Elasticsearch** - Search and analytics engine for log storage
2. **Logstash** - Log processing pipeline for parsing and enriching logs
3. **Kibana** - Web interface for log visualization and analysis
4. **Filebeat** - Lightweight log shipper
5. **Metricbeat** - System and application metrics collection
6. **APM Server** - Application performance monitoring

### Log Flow

```
Application → Logger → File/Console → Filebeat → Logstash → Elasticsearch → Kibana
                    ↘ Elasticsearch (direct) ↗
```

## Features

### Structured Logging

- **JSON Format**: All logs are structured in JSON for easy parsing
- **Contextual Information**: Request IDs, user IDs, service names
- **Log Levels**: ERROR, WARN, INFO, DEBUG, VERBOSE
- **Log Types**: application, error, access, database, security, performance, business

### Log Categories

1. **Application Logs**
   - General application events
   - Service startup/shutdown
   - Configuration changes

2. **Error Logs**
   - Exceptions and errors
   - Stack traces
   - Error categorization

3. **Access Logs**
   - HTTP requests/responses
   - Response times
   - Status codes
   - User agents and IP addresses

4. **Database Logs**
   - Query execution
   - Slow query detection
   - Connection events

5. **Security Logs**
   - Authentication events
   - Authorization failures
   - Security violations

6. **Performance Logs**
   - Response times
   - Resource usage
   - Performance metrics

7. **Business Logs**
   - User actions
   - Business events
   - Audit trails

### Advanced Features

- **Request Tracing**: Unique request IDs for correlation
- **Sensitive Data Sanitization**: Automatic redaction of passwords, tokens
- **Slow Query Detection**: Automatic flagging of performance issues
- **Security Event Monitoring**: Real-time security event logging
- **Business Intelligence**: Structured business event logging

## Setup Instructions

### Prerequisites

- Docker and Docker Compose
- At least 4GB RAM available for containers
- 10GB+ free disk space

### Quick Start

1. **Start ELK Stack**
   ```bash
   cd /Users/rejaulkarim/Documents/Resturistan\ App/restopapa
   ./scripts/elk-setup.sh setup
   ```

2. **Access Services**
   - Kibana: http://localhost:5601
   - Elasticsearch: http://localhost:9200
   - APM Server: http://localhost:8200

### Manual Setup

1. **Start Services**
   ```bash
   cd docker/logging
   docker-compose up -d
   ```

2. **Wait for Services**
   ```bash
   ./scripts/elk-setup.sh status
   ```

3. **Configure Index Patterns**
   - Open Kibana
   - Go to Stack Management → Data Views
   - Create pattern: `restopapa-*`

## Configuration

### Environment Variables

```bash
# Elasticsearch
ELASTICSEARCH_URL=http://localhost:9200

# Logging Level
LOG_LEVEL=info

# Environment
NODE_ENV=development
ENVIRONMENT=development

# Service Info
APP_VERSION=1.0.0
```

### Application Integration

The logging service is automatically integrated into the NestJS application:

```typescript
// Logger injection
constructor(private readonly logger: LoggerService) {}

// Basic logging
this.logger.log('User created', { userId: user.id });
this.logger.error('Database error', error.stack, { operation: 'createUser' });

// Contextual logging
this.logger.logBusinessEvent('USER_REGISTERED', { userId, email });
this.logger.logPerformanceMetric('db_query', 1200, { table: 'users' });
```

## Index Management

### Index Patterns

- `restopapa-application-*` - Application logs
- `restopapa-error-*` - Error logs
- `restopapa-access-*` - Access logs
- `restopapa-database-*` - Database logs
- `restopapa-security-*` - Security logs
- `restopapa-performance-*` - Performance logs
- `restopapa-business-*` - Business logs

### Retention Policy

- **Daily indices**: Deleted after 90 days
- **Error indices**: Deleted after 30 days
- **Access indices**: Deleted after 60 days
- **Archive**: Closed after 30 days

### Index Lifecycle Management

1. **Hot Phase**: Active writing and searching
2. **Warm Phase**: Reduced replicas after 30 days
3. **Cold Phase**: Read-only after 90 days
4. **Delete Phase**: Removed after retention period

## Kibana Dashboards

### Pre-configured Dashboards

1. **Application Overview**
   - Log volume by service
   - Error rate trends
   - Response time distribution

2. **Error Analysis**
   - Error frequency
   - Error categories
   - Stack trace analysis

3. **Performance Monitoring**
   - Response time trends
   - Slow query detection
   - Resource utilization

4. **Security Dashboard**
   - Authentication events
   - Failed login attempts
   - Security violations

5. **Business Intelligence**
   - User activity patterns
   - Feature usage metrics
   - Business event trends

### Creating Custom Visualizations

1. **Open Kibana** → http://localhost:5601
2. **Go to Visualize** → Create new visualization
3. **Select index pattern**: `restopapa-*`
4. **Choose visualization type**: Bar chart, Line chart, etc.
5. **Configure metrics and buckets**
6. **Save and add to dashboard**

## Monitoring and Alerting

### Health Monitoring

- Service health checks
- Index health monitoring
- Disk space monitoring
- Memory usage tracking

### Alert Configuration

Alerts can be configured in Kibana for:

- High error rates
- Performance degradation
- Security events
- Service availability

### Metrics Collection

Metricbeat collects:

- System metrics (CPU, memory, disk)
- Docker container metrics
- Application metrics
- Database performance metrics

## Troubleshooting

### Common Issues

1. **Elasticsearch won't start**
   - Check `vm.max_map_count` setting
   - Ensure sufficient memory (4GB+)
   - Check disk space

2. **Logs not appearing**
   - Verify Filebeat configuration
   - Check Logstash parsing rules
   - Confirm index patterns in Kibana

3. **Performance issues**
   - Adjust JVM heap size
   - Optimize index settings
   - Configure shard allocation

### Debugging Commands

```bash
# Check service status
./scripts/elk-setup.sh status

# View logs
docker-compose logs elasticsearch
docker-compose logs logstash
docker-compose logs kibana

# Test log ingestion
./scripts/elk-setup.sh test

# Restart services
./scripts/elk-setup.sh restart
```

### Log Locations

- **Application logs**: `./logs/api/`
- **Container logs**: Docker volumes
- **ELK service logs**: Docker container logs

## Best Practices

### Logging Guidelines

1. **Use appropriate log levels**
   - ERROR: System errors, exceptions
   - WARN: Degraded functionality, issues
   - INFO: Important business events
   - DEBUG: Detailed troubleshooting info

2. **Include context**
   - Request IDs for correlation
   - User IDs for user-specific events
   - Service names and versions

3. **Structure your logs**
   - Use consistent field names
   - Include timestamps
   - Add metadata for filtering

4. **Avoid logging sensitive data**
   - Passwords, tokens, secrets
   - Personal information (unless required)
   - Credit card numbers, SSNs

### Performance Optimization

1. **Use async logging**
2. **Batch log shipment**
3. **Configure appropriate retention**
4. **Monitor index sizes**
5. **Use index lifecycle management**

## Security Considerations

1. **Network Security**
   - Use HTTPS/TLS for production
   - Restrict network access
   - Configure authentication

2. **Data Protection**
   - Encrypt logs at rest
   - Sanitize sensitive data
   - Control access permissions

3. **Audit Logging**
   - Log access to logs
   - Monitor configuration changes
   - Track user activities

## Production Deployment

### Scaling Considerations

- Multiple Elasticsearch nodes
- Load balancing for Kibana
- Dedicated Logstash nodes
- Separate hot/warm/cold nodes

### High Availability

- Elasticsearch cluster setup
- Replica configuration
- Cross-zone deployment
- Backup and recovery

### Security Hardening

- Enable X-Pack security
- Configure SSL/TLS
- Set up RBAC
- Enable audit logging

## Maintenance

### Daily Tasks

- Monitor cluster health
- Check disk usage
- Review error logs
- Update retention policies

### Weekly Tasks

- Clean up old indices
- Review performance metrics
- Update dashboards
- Check security events

### Monthly Tasks

- Update ELK stack versions
- Review and optimize configurations
- Archive old data
- Security audit

## Integration Examples

### Custom Logger Usage

```typescript
// Business event logging
this.logger.logJobEvent('JOB_CREATED', jobId, {
  title: job.title,
  restaurantId: job.restaurantId,
  salary: job.salary
});

// Security event logging
this.logger.logSecurityEvent('UNAUTHORIZED_ACCESS', {
  endpoint: '/admin/users',
  ip: req.ip,
  userId: req.user?.id
});

// Performance monitoring
const startTime = Date.now();
// ... operation ...
this.logger.logPerformanceMetric('user_search', Date.now() - startTime, {
  query: searchQuery,
  resultsCount: results.length
});
```

This comprehensive logging system provides visibility into all aspects of the RestoPapa application, enabling proactive monitoring, troubleshooting, and optimization.