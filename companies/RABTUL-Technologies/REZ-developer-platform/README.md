# REZ Developer Platform

Partner SDK, API documentation, sandbox environment, and webhook management for the REZ ecosystem.

## Features

- **Partner SDK Generation**: Auto-generate SDKs for multiple languages
- **API Documentation**: Interactive OpenAPI/Swagger documentation
- **Sandbox Environment**: Test API calls in isolated environment
- **Webhook Management**: Configure and test webhooks
- **API Key Management**: Create and manage partner API keys
- **Rate Limit Monitoring**: Track API usage per partner
- **Interactive Explorer**: Try API endpoints directly from docs

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  REZ Developer Platform                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Express    │  │  Swagger UI  │  │    SDK Generator     │  │
│  │   Server     │  │  (Docs)      │  │                      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Sandbox    │  │   Webhook    │  │    API Key Store     │  │
│  │   Engine     │  │   Manager    │  │                      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file:

```env
PORT=3000
NODE_ENV=development

# Redis for rate limiting and caching
REDIS_URL=redis://localhost:6379

# API Documentation
OPENAPI_SPEC_URL=https://api.rez.money/openapi.yaml
```

## Running the Service

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

## API Endpoints

### Documentation

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/docs` | Swagger UI documentation |
| GET | `/openapi.yaml` | OpenAPI specification |

### SDK Generation

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sdks` | List available SDKs |
| POST | `/api/sdks/generate` | Generate SDK for language |
| GET | `/api/sdks/:lang/download` | Download generated SDK |

### Sandbox

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sandbox/test` | Test API call in sandbox |
| GET | `/api/sandbox/history` | Get test history |
| DELETE | `/api/sandbox/history` | Clear test history |

### Webhooks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/webhooks` | List configured webhooks |
| POST | `/api/webhooks` | Create webhook endpoint |
| POST | `/api/webhooks/:id/test` | Send test webhook |
| DELETE | `/api/webhooks/:id` | Remove webhook |

### API Keys

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/keys` | List API keys |
| POST | `/api/keys` | Create new API key |
| DELETE | `/api/keys/:id` | Revoke API key |
| GET | `/api/keys/:id/usage` | Get key usage stats |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |

## SDK Languages Supported

- JavaScript/TypeScript
- Python
- Java
- Go
- Ruby
- PHP
- C#

## Sandbox Features

- Isolated environment for API testing
- Mock responses for external services
- Request/response logging
- Error simulation
- Variable substitution

## Webhook Events

Configure webhooks for these events:

| Event | Description |
|-------|-------------|
| `order.created` | New order placed |
| `order.updated` | Order status changed |
| `payment.success` | Payment completed |
| `payment.failed` | Payment failed |
| `user.registered` | New user signup |

## Testing

```bash
npm test
```

## Scripts

```bash
npm run dev              # Development server
npm run build            # Production build
npm start                # Run production
npm run lint             # Lint code
npm run generate-sdk     # Generate SDKs
npm run docs:serve       # Serve API docs
```

## License

MIT
