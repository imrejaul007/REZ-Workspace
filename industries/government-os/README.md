# Government OS

A comprehensive digital government services platform providing citizen-centric services, permit management, and compliance tracking.

## Architecture Overview

Government OS is built on a microservices architecture with four core Twin services and four agent services:

### Services Layer

| Service | Port | Description |
|---------|------|-------------|
| Citizen Twin Service | 3001 | Resident profiles, demographics, needs tracking |
| Service Twin Service | 3002 | Government services catalog with eligibility rules |
| Permit Twin Service | 3003 | Licenses, permits, and application management |
| Compliance Twin Service | 3004 | Regulations, compliance requirements, enforcement |

### Agents Layer

| Agent | Port | Description |
|-------|------|-------------|
| Service Navigator | 4001 | Guides citizens to appropriate services |
| Application Processor | 4002 | Processes permit applications |
| Compliance Checker | 4003 | Verifies regulatory compliance |
| Notification Agent | 4004 | Manages citizen notifications |

## Quick Start

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- Azure subscription (Cosmos DB, Service Bus, Storage)
- Salesforce Government Cloud account (for REZ CRM integration)

### Environment Variables

Create a `.env` file in the project root:

```bash
# Azure Configuration
COSMOS_DB_ENDPOINT=https://your-cosmos.documents.azure.com
COSMOS_DB_KEY=your-cosmos-key
SERVICE_BUS_CONNECTION=Endpoint=sb://your-namespace.servicebus.windows.net/
STORAGE_CONNECTION=DefaultEndpointsProtocol=https;AccountName=youraccount;AccountKey=yourkey
TABLE_STORAGE_CONNECTION=DefaultEndpointsProtocol=https;AccountName=youraccount;AccountKey=yourkey

# Salesforce Configuration
SF_INSTANCE_URL=https://yourorg.salesforce.com
SF_CLIENT_ID=your-client-id
SF_CLIENT_SECRET=your-client-secret
SF_USERNAME=your-username@domain.com
SF_PASSWORD=your-password
SF_SECURITY_TOKEN=your-security-token

# Notification Services
AWS_REGION=us-east-1
EMAIL_FROM_ADDRESS=noreply@government-os.example.com
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
SMS_FROM_NUMBER=+1234567890
FCM_SERVER_KEY=your-fcm-server-key

# Monitoring
GRAFANA_PASSWORD=your-grafana-password
```

### Running with Docker Compose

```bash
# Build and start all services
docker-compose -f deployment/docker-compose.staging.yml up -d

# View logs
docker-compose -f deployment/docker-compose.staging.yml logs -f

# Stop all services
docker-compose -f deployment/docker-compose.staging.yml down
```

### Running Locally

```bash
# Install dependencies
npm install

# Start individual services
cd services/citizen-twin-service && npm start
cd services/service-twin-service && npm start
cd services/permit-twin-service && npm start
cd services/compliance-twin-service && npm start

# Start agents
cd agents/service-navigator && npm start
cd agents/application-processor && npm start
cd agents/compliance-checker && npm start
cd agents/notification-agent && npm start
```

### Kubernetes Deployment

```bash
# Create namespace
kubectl create namespace government-os

# Apply secrets
kubectl create secret generic government-os-secrets \
  --from-literal=cosmos-db-endpoint=$COSMOS_DB_ENDPOINT \
  --from-literal=cosmos-db-key=$COSMOS_DB_KEY \
  --from-literal=service-bus-connection=$SERVICE_BUS_CONNECTION \
  --namespace=government-os

# Deploy all resources
kubectl apply -f deployment/kubernetes/ -n government-os

# Check deployment status
kubectl get pods -n government-os
```

## Project Structure

```
government-os/
├── services/
│   ├── citizen-twin-service/      # Resident profile management
│   │   ├── index.js
│   │   └── integrations/
│   │       └── salesforce-client.js  # REZ CRM integration
│   ├── service-twin-service/       # Services catalog
│   │   └── index.js
│   ├── permit-twin-service/        # Permits and applications
│   │   └── index.js
│   └── compliance-twin-service/   # Regulations and compliance
│       └── index.js
├── agents/
│   ├── service-navigator/          # Service discovery and guidance
│   │   └── index.js
│   ├── application-processor/     # Application processing
│   │   └── index.js
│   ├── compliance-checker/        # Compliance verification
│   │   └── index.js
│   └── notification-agent/        # Citizen notifications
│       └── index.js
├── deployment/
│   ├── docker-compose.staging.yml  # Docker Compose config
│   ├── nginx.conf                  # Nginx reverse proxy
│   └── kubernetes/
│       ├── deployment.yaml         # K8s deployments
│       ├── service.yaml           # K8s services
│       └── ingress.yaml           # K8s ingress
├── docs/
│   ├── API-REFERENCE.md            # API documentation
│   ├── SDK.md                      # SDK documentation
│   └── TWIN-SCHEMA.md             # Data schemas
├── package.json
└── README.md
```

## Key Features

### Citizen Twin Service
- Resident profile management with demographics
- Needs tracking and service history
- Journey tracking and engagement scoring
- REZ CRM integration for Salesforce Government Cloud

### Service Twin Service
- Government services catalog
- Eligibility rules and matching
- Document requirements
- Process definitions

### Permit Twin Service
- Permit type definitions
- Application submission and tracking
- Review workflow management
- Decision and issuance processing

### Compliance Twin Service
- Regulation management
- Compliance assessment
- Violation tracking
- Remediation management

### Service Navigator Agent
- Natural language service discovery
- Personalized recommendations
- Application assistance
- Renewal reminders

### Application Processor Agent
- Automated application validation
- Document verification
- Compliance checking
- Auto-approval workflow

### Compliance Checker Agent
- Multi-regulation compliance checks
- Document verification
- Business compliance verification
- Permit prerequisite validation

### Notification Agent
- Multi-channel notifications (email, SMS, push, in-app)
- Scheduled notifications
- Notification preferences
- Bulk notification support

## REZ CRM Integration

The Citizen Twin Service integrates with Salesforce Government Cloud via the REZ CRM integration:

```javascript
// Example: Syncing citizen data to Salesforce
const citizenTwin = await citizenTwinService.upsertCitizenTwin({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  citizenType: 'standard'
});

// Automatically syncs to Salesforce Contact
// with Government_Resident_ID__c as external ID
```

## API Documentation

See [API-REFERENCE.md](docs/API-REFERENCE.md) for complete API documentation.

## SDK Documentation

See [SDK.md](docs/SDK.md) for SDK usage examples.

## Monitoring

- **Prometheus**: Metrics collection at port 9090
- **Grafana**: Dashboards at port 3000
- **Health Checks**: Available at `/health` endpoint for each service

## Security

- All API endpoints require authentication
- Rate limiting enabled
- Sensitive data encrypted at rest
- Audit logging for all operations
- TLS/SSL for all connections

## License

MIT
