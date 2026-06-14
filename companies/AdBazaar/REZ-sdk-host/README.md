# REZ SDK Host

Central SDK hosting and npm package management service.

## Service Purpose

Hosts and manages all REZ SDK npm packages. Provides package registry, version management, SDK documentation, and distribution endpoints for client-side and server-side libraries.

## Port

```
3013
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sdks` | List available SDKs |
| GET | `/api/sdks/:name` | Get SDK details |
| GET | `/api/sdks/:name/versions` | List SDK versions |
| GET | `/api/sdks/:name/:version` | Get specific version |
| GET | `/api/sdks/:name/download` | Download SDK package |
| GET | `/api/sdks/:name/docs` | SDK documentation |
| POST | `/api/sdks` | Register new SDK |
| PUT | `/api/sdks/:name` | Update SDK metadata |
| GET | `/api/health` | Service health |

## Configuration

Environment variables:

```env
PORT=3013
NODE_ENV=development
NPM_REGISTRY_URL=https://registry.npmjs.org
STORAGE_BUCKET=rez-sdk-host
```

## Setup Instructions

```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Build for production
npm run build
npm start
```

## Available SDKs

| SDK | Description | npm Package |
|-----|-------------|-------------|
| Attribution | Event tracking | @rez/attribution-sdk |
| DOOH | Digital signage | @rez/dooh-sdk |
| Partner | Affiliate tracking | @rez/partner-sdk |
| Server | Server-side tracking | @rez/server-sdk |
| Google Enhanced | Google conversions | @rez/google-enhanced |

## Tech Stack

- Express.js
- TypeScript
- Zod (validation)
- CORS
- Helmet (security headers)
