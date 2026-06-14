# Privacy-Preserving Compute Service

AdBazaar's Privacy-Preserving Computation Service for secure federated learning, multi-party computation, and differential privacy analysis.

## Overview

This service provides enterprise-grade privacy-preserving computation capabilities:

- **Federated Learning**: Distributed model training without sharing raw data
- **Multi-Party Computation (MPC)**: Secure computation across multiple parties using secret sharing
- **Differential Privacy**: Mathematical guarantees of privacy for data analysis
- **Secure Aggregation**: Privacy-preserving aggregation of participant values

## Port

**Port: 4951**

## Features

### Federated Learning
- FedAvg, FedMed, FedOpt aggregation strategies
- Differential privacy noise addition
- Gradient clipping for security
- Configurable rounds and participant requirements

### Multi-Party Computation
- Shamir's Secret Sharing implementation
- Secure addition, multiplication, comparison, dot product
- Threshold-based reconstruction
- Lagrange interpolation for secret recovery

### Differential Privacy
- Laplace, Gaussian, and Exponential mechanisms
- Privacy budget tracking and composition
- Query types: count, sum, mean, variance, histogram
- Configurable epsilon, delta, and sensitivity

### Secure Aggregation
- Secure sum and mean calculations
- Value clipping for outlier protection
- Participant dropout handling
- Verification of aggregation results

## Quick Start

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

## API Endpoints

### Health Check
```
GET /health
```

### Federated Learning
```
POST /api/compute/federated              - Execute federated learning
GET  /api/compute/federated/:id          - Get federated learning status
POST /api/compute/federated/:id/cancel   - Cancel computation
```

### Multi-Party Computation
```
POST /api/compute/mpc                    - Execute MPC
GET  /api/compute/mpc/:id                - Get MPC status
POST /api/compute/mpc/:id/reconstruct    - Reconstruct secret
```

### Differential Privacy
```
POST /api/compute/differential-privacy                    - Execute DP query
GET  /api/compute/differential-privacy/:id               - Get status
POST /api/compute/differential-privacy/budget-check       - Check privacy budget
POST /api/compute/differential-privacy/compose            - Compose queries
```

### Secure Aggregation
```
POST /api/compute/secure-aggregation          - Execute secure aggregation
GET  /api/compute/secure-aggregation/:id     - Get status
POST /api/compute/secure-aggregation/:id/verify - Verify result
POST /api/compute/secure-aggregation/median    - Secure median
POST /api/compute/secure-aggregation/percentile - Secure percentile
```

### Validation & Audit
```
POST /api/compute/validate      - Validate privacy guarantees
GET  /api/compute/validate/:id  - Get validation results
GET  /api/compute/audit/:id     - Get audit trail
```

### Metrics
```
GET /metrics  - Prometheus metrics
```

## API Examples

### Federated Learning

```bash
curl -X POST http://localhost:4951/api/compute/federated \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-token" \
  -d '{
    "modelId": "ad-model-v1",
    "participants": ["party-a", "party-b", "party-c"],
    "config": {
      "rounds": 10,
      "minParticipants": 2,
      "aggregationStrategy": "fedavg",
      "privacyBudget": 1.0,
      "clipNorm": 1.0
    }
  }'
```

### Multi-Party Computation

```bash
curl -X POST http://localhost:4951/api/compute/mpc \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-token" \
  -d '{
    "operation": "addition",
    "parties": ["party-a", "party-b"],
    "inputs": {
      "party-a": "123456789",
      "party-b": "987654321"
    },
    "config": {
      "threshold": 2,
      "modulus": "prime"
    }
  }'
```

### Differential Privacy

```bash
curl -X POST http://localhost:4951/api/compute/differential-privacy \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-token" \
  -d '{
    "query": {
      "type": "count"
    },
    "privacyParams": {
      "epsilon": 1.0,
      "delta": 1e-5,
      "sensitivity": 1.0,
      "mechanism": "laplace"
    },
    "datasetSize": 10000
  }'
```

### Secure Aggregation

```bash
curl -X POST http://localhost:4951/api/compute/secure-aggregation \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-token" \
  -d '{
    "participants": ["user-1", "user-2", "user-3"],
    "values": {
      "user-1": 100,
      "user-2": 200,
      "user-3": 150
    },
    "config": {
      "secureSum": true,
      "clippingRange": 10.0
    }
  }'
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Service port | 4951 |
| NODE_ENV | Environment | development |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/privacy-preserving-compute |
| REDIS_URL | Redis connection string | redis://localhost:6379 |
| INTERNAL_SERVICE_TOKEN | Internal auth token | internal-service-token |
| LOG_LEVEL | Logging level | info |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Privacy-Preserving Compute                    │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Express   │  │  MongoDB    │  │         Redis          │  │
│  │   Server    │  │  Storage    │  │       Cache/Queue      │  │
│  └──────┬──────┘  └──────┬──────┘  └────────────┬────────��─┘  │
│         │                │                      │              │
│  ┌──────┴────────────────┴──────────────────────┴──────────┐  │
│  │                    Service Layer                         │  │
│  ├─────────────┬─────────────┬─────────────┬───────────────┤  │
│  │  Federated  │     MPC     │   Diff     │   Secure     │  │
│  │   Service   │   Service   │  Privacy   │  Aggregation │  │
│  │             │             │  Service   │   Service    │  │
│  └─────────────┴─────────────┴─────────────┴───────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              Audit Service (Compliance)                  │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │           Prometheus Metrics + Winston Logging          │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Models

### Computation
Stores metadata about all computations including status, privacy parameters, and results.

### FederatedResult
Stores federated learning rounds, gradients, and aggregated models.

### MPCResult
Stores MPC shares and reconstructed values.

### AuditLog
Complete audit trail for compliance and debugging.

## Metrics

| Metric | Description |
|--------|-------------|
| http_requests_total | Total HTTP requests |
| http_request_duration_seconds | Request latency |
| privacy_computations_total | Total computations by type/status |
| federated_rounds_total | Federated learning rounds |
| mpc_operations_total | MPC operations |
| differential_privacy_queries_total | DP queries |
| secure_aggregations_total | Secure aggregations |
| audit_logs_total | Audit log entries |
| active_computations | Currently running computations |

## Security

- Internal service authentication via X-Internal-Token header
- API key authentication support
- Rate limiting for internal services
- Audit logging for compliance
- Privacy validation before computation

## Testing

```bash
npm test
```

## License

Proprietary - AdBazaar Inc.