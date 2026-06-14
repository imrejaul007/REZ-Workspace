# RestoPapa Circuit Breaker Implementation

## Overview

The RestoPapa application implements comprehensive circuit breaker patterns to ensure system resilience and prevent cascading failures. The circuit breaker implementation provides automatic failure detection, fallback mechanisms, and self-healing capabilities for all external dependencies and critical services.

## Architecture

### Core Components

1. **CircuitBreakerService** - Central service managing all circuit breakers
2. **Circuit Breaker Decorators** - Method-level circuit breaker annotations
3. **Circuit Breaker Interceptor** - Automatic circuit breaking for decorated methods
4. **Resilient HTTP Service** - HTTP client with built-in circuit breaker protection
5. **Resilient Database Service** - Database operations with circuit breaker protection
6. **Health Monitoring** - Real-time circuit breaker status and metrics

### Circuit States

```
CLOSED → OPEN → HALF_OPEN → CLOSED
   ↑                           ↓
   └───── (if recovery) ───────┘
```

- **CLOSED**: Normal operation, requests pass through
- **OPEN**: Circuit is open, requests fail fast
- **HALF_OPEN**: Testing recovery, limited requests allowed

## Implementation Details

### Core Circuit Breaker Service

The `CircuitBreakerService` provides:

- **Failure Threshold Management**: Configurable failure limits
- **Reset Timeout**: Automatic recovery attempts
- **Half-Open Testing**: Limited request testing during recovery
- **Expected Error Filtering**: Ignore certain errors (4xx, validation errors)
- **Real-time Monitoring**: Continuous health monitoring and logging

### Specialized Circuit Breakers

#### Database Circuit Breaker
```typescript
@DatabaseCircuitBreaker({ fallback: 'getFromCache' })
async getUser(id: string): Promise<User> {
  return this.userRepository.findById(id);
}
```

**Configuration**:
- Failure Threshold: 3
- Reset Timeout: 30 seconds
- Expected Errors: Validation, not found errors

#### External API Circuit Breaker
```typescript
@ExternalApiCircuitBreaker('payment-service')
async processPayment(data: PaymentData): Promise<PaymentResult> {
  return this.paymentClient.process(data);
}
```

**Configuration**:
- Failure Threshold: 3
- Reset Timeout: 60 seconds
- Half-Open Max Calls: 2

#### Redis Circuit Breaker
```typescript
@RedisCircuitBreaker({ fallback: 'skipCaching' })
async cacheUser(user: User): Promise<void> {
  return this.redis.set(`user:${user.id}`, user);
}
```

**Configuration**:
- Failure Threshold: 2 (fail fast)
- Reset Timeout: 15 seconds
- Expected Errors: None (all Redis errors are significant)

### Resilient HTTP Service

The `ResilientHttpService` provides:

```typescript
// GET with caching and circuit breaker
const response = await this.resilientHttp.get('/api/users', {
  circuitBreakerName: 'user-service',
  cacheKey: 'users-list',
  cacheTtl: 300000,
  retryAttempts: 3,
  timeoutMs: 10000,
  fallbackResponse: [],
});

// Bulk requests with circuit breaker protection
const results = await this.resilientHttp.executeBulkRequests([
  { method: 'GET', url: '/api/users/1' },
  { method: 'GET', url: '/api/users/2' },
], { concurrency: 5, failFast: false });
```

**Features**:
- Automatic retries with exponential backoff
- Request/response caching
- Timeout handling
- Bulk request processing
- Fallback responses
- Circuit breaker integration

### Resilient Database Service

The `ResilientDatabaseService` provides:

```typescript
// Read operation with caching
const user = await this.resilientDb.executeReadOperation(
  () => this.prisma.user.findUnique({ where: { id } }),
  {
    cacheKey: `user:${id}`,
    cacheTtl: 300000,
    circuitBreakerName: 'database-read',
  }
);

// Transaction with circuit breaker
const result = await this.resilientDb.executeTransaction(async (tx) => {
  const user = await tx.user.create({ data: userData });
  await tx.profile.create({ data: { ...profileData, userId: user.id } });
  return user;
});
```

**Features**:
- Separate circuits for read/write/transaction operations
- Query result caching
- Slow query detection
- Bulk operation support
- Retry with exponential backoff
- Prisma error handling

## Configuration

### Default Circuit Breaker Settings

```typescript
const defaultOptions = {
  failureThreshold: 5,        // Open after 5 failures
  resetTimeout: 60000,        // Try recovery after 1 minute
  halfOpenMaxCalls: 3,        // Allow 3 test calls in half-open
  monitoringPeriod: 10000,    // Health check every 10 seconds
};
```

### Specialized Configurations

| Service Type | Failure Threshold | Reset Timeout | Half-Open Calls |
|-------------|------------------|---------------|-----------------|
| Database Read | 5 | 30s | 3 |
| Database Write | 3 | 30s | 3 |
| External API | 3 | 60s | 2 |
| Payment Gateway | 2 | 120s | 1 |
| Redis | 2 | 15s | 1 |
| Email Service | 3 | 60s | 2 |

### Environment Variables

```bash
# Circuit breaker global settings
CIRCUIT_BREAKER_ENABLED=true
CIRCUIT_BREAKER_MONITORING_INTERVAL=10000

# Service-specific settings
DATABASE_CIRCUIT_FAILURE_THRESHOLD=3
API_CIRCUIT_RESET_TIMEOUT=60000
REDIS_CIRCUIT_FAILURE_THRESHOLD=2
```

## Usage Examples

### Method Decoration

```typescript
@Injectable()
export class UserService {
  @DatabaseCircuitBreaker({
    name: 'user-database',
    fallback: 'getUserFromCache'
  })
  async getUser(id: string): Promise<User> {
    return this.userRepository.findById(id);
  }

  async getUserFromCache(id: string): Promise<User> {
    return this.cache.get(`user:${id}`);
  }

  @ExternalApiCircuitBreaker('notification-service')
  async sendNotification(userId: string, message: string): Promise<void> {
    return this.notificationClient.send(userId, message);
  }
}
```

### Manual Circuit Breaker Usage

```typescript
@Injectable()
export class PaymentService {
  constructor(
    private readonly circuitBreaker: CircuitBreakerService,
  ) {}

  async processPayment(data: PaymentData): Promise<PaymentResult> {
    const circuit = this.circuitBreaker.createCircuitBreaker('payment-gateway', {
      failureThreshold: 2,
      resetTimeout: 120000,
    });

    return circuit.execute(async () => {
      return this.paymentGateway.charge(data);
    });
  }
}
```

### Resilient Service Usage

```typescript
@Injectable()
export class OrderService {
  constructor(
    private readonly resilientHttp: ResilientHttpService,
    private readonly resilientDb: ResilientDatabaseService,
  ) {}

  async createOrder(orderData: CreateOrderData): Promise<Order> {
    // Create order with database circuit breaker
    const order = await this.resilientDb.executeWriteOperation(
      () => this.prisma.order.create({ data: orderData }),
      { circuitBreakerName: 'order-creation' }
    );

    // Send order confirmation with HTTP circuit breaker
    await this.resilientHttp.post('/api/notifications/order-confirmation', {
      orderId: order.id,
      userEmail: order.customerEmail,
    }, {
      circuitBreakerName: 'notification-service',
      retryAttempts: 2,
      fallbackResponse: { sent: false },
    });

    return order;
  }
}
```

## Monitoring and Observability

### Health Check Endpoints

- `GET /api/v1/health/circuit-breakers` - Overall circuit breaker health
- `GET /api/v1/health/circuit-breakers/summary` - Circuit breaker summary
- `GET /api/v1/health/circuit-breakers/{name}` - Specific circuit details

### Sample Health Response

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "circuits": {
    "total": 5,
    "closed": 4,
    "open": 1,
    "halfOpen": 0
  },
  "details": [
    {
      "name": "database-read",
      "state": "CLOSED",
      "failureCount": 0,
      "successCount": 150,
      "totalCalls": 150,
      "failureRate": 0,
      "successRate": 100,
      "uptime": 3600000
    }
  ]
}
```

### Metrics Collection

Circuit breakers automatically collect:

- **Call Counts**: Total, success, failure counts
- **Response Times**: Average, percentiles
- **State Transitions**: Open/close events
- **Failure Rates**: Real-time failure percentages
- **Recovery Times**: Time to recovery after failures

### Logging Integration

All circuit breaker events are logged with structured data:

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "warn",
  "message": "Circuit breaker opened due to failure threshold",
  "operation": "CIRCUIT_BREAKER_OPENED",
  "circuitName": "payment-gateway",
  "failureCount": 3,
  "threshold": 3,
  "error": "Connection timeout"
}
```

## Testing

### Automated Testing

The circuit breaker implementation includes comprehensive automated tests:

```bash
# Run circuit breaker tests
./scripts/circuit-breaker-test.sh

# Test specific scenarios
API_URL=http://localhost:3008/api/v1 ./scripts/circuit-breaker-test.sh
```

**Test Coverage**:
- Basic circuit status and configuration
- Failure threshold triggering
- State transitions (closed → open → half-open → closed)
- Recovery mechanisms
- Performance impact measurement
- Bulk operation protection
- Error rate calculations
- Fallback execution

### Manual Testing

```bash
# Check circuit breaker health
curl http://localhost:3008/api/v1/health/circuit-breakers

# Get specific circuit details
curl http://localhost:3008/api/v1/health/circuit-breakers/database-read

# Monitor circuit breaker metrics
curl http://localhost:3008/api/v1/health/circuit-breakers/summary
```

## Best Practices

### Circuit Breaker Design

1. **Appropriate Thresholds**: Set failure thresholds based on service criticality
2. **Quick Recovery**: Use shorter reset timeouts for non-critical services
3. **Expected Errors**: Don't count client errors (4xx) as circuit failures
4. **Fallback Strategies**: Always provide meaningful fallbacks when possible
5. **Monitoring**: Continuously monitor circuit health and adjust thresholds

### Service Integration

1. **Layered Protection**: Use circuit breakers at multiple layers
2. **Graceful Degradation**: Ensure application remains functional when circuits open
3. **Clear Error Messages**: Provide helpful error messages when circuits are open
4. **Performance Consideration**: Circuit breakers add minimal overhead
5. **Testing**: Regularly test circuit breaker functionality

### Operational Considerations

1. **Alerting**: Set up alerts for open circuits
2. **Dashboards**: Create visualizations for circuit health
3. **Capacity Planning**: Consider circuit breaker impact on capacity
4. **Documentation**: Document fallback behaviors and expected degradation
5. **Training**: Ensure team understands circuit breaker concepts

## Troubleshooting

### Common Issues

**Circuit Opens Too Frequently**:
- Increase failure threshold
- Review expected errors configuration
- Check service stability

**Circuit Doesn't Open**:
- Verify failure threshold configuration
- Check error classification
- Review monitoring logs

**Slow Recovery**:
- Reduce reset timeout
- Increase half-open max calls
- Check service health

**Performance Impact**:
- Review timeout settings
- Optimize retry strategies
- Monitor resource usage

### Debugging

```typescript
// Enable debug logging
process.env.LOG_LEVEL = 'debug';

// Check circuit status programmatically
const stats = this.circuitBreakerService.getCircuitStats('my-circuit');
console.log('Circuit State:', stats.state);
console.log('Failure Rate:', stats.totalFailures / stats.totalCalls * 100);

// Manual circuit reset
this.circuitBreakerService.resetCircuitBreaker('my-circuit');
```

## Integration with Other Systems

### Prometheus Metrics

Circuit breaker metrics are exposed for Prometheus collection:

```
# HELP restopapa_circuit_breaker_calls_total Total calls through circuit breaker
# TYPE restopapa_circuit_breaker_calls_total counter
restopapa_circuit_breaker_calls_total{circuit="database-read",result="success"} 150

# HELP restopapa_circuit_breaker_state Current circuit breaker state
# TYPE restopapa_circuit_breaker_state gauge
restopapa_circuit_breaker_state{circuit="database-read",state="closed"} 1
```

### ELK Stack Integration

All circuit breaker events are automatically logged to the ELK stack:

- **Application Logs**: Circuit state changes, failures, recoveries
- **Performance Logs**: Response times, slow operations
- **Security Logs**: Potential attacks via repeated failures

### Grafana Dashboards

Pre-configured Grafana dashboards include:

- Circuit breaker health overview
- Failure rate trends
- Service dependency maps
- Performance impact analysis

This comprehensive circuit breaker implementation ensures RestoPapa maintains high availability and resilience under various failure conditions while providing excellent observability and operational control.