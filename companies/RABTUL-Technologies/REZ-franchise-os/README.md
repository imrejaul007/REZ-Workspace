# REZ Franchise OS

Multi-location franchise management service for the Nexha Commerce Network.

## Port: 4341

## Features

- Franchise registration and management
- Multi-location support with operating hours
- Performance tracking and reporting
- Royalty payment calculations
- Sales target management
- Brand and type categorization

## API Endpoints

### Health
- `GET /health` - Service health status

### Franchises
- `POST /api/franchises` - Create franchise
- `GET /api/franchises` - List all franchises
- `GET /api/franchises/:id` - Get franchise by ID
- `PUT /api/franchises/:id` - Update franchise
- `DELETE /api/franchises/:id` - Delete franchise

### Locations
- `POST /api/franchises/:id/locations` - Add location to franchise
- `GET /api/franchises/:franchiseId/locations` - Get franchise locations
- `GET /api/locations/:id` - Get location by ID
- `PUT /api/locations/:id` - Update location

### Performance
- `POST /api/performance` - Record performance data
- `GET /api/franchises/:id/performance` - Get franchise performance
- `GET /api/locations/:id/performance` - Get location performance

### Royalties
- `POST /api/royalties` - Create royalty payment
- `GET /api/franchises/:id/royalties` - Get franchise royalties
- `PATCH /api/royalties/:id` - Update royalty status

### Stats
- `GET /api/stats` - Get franchise statistics

## Running

```bash
npm install
npm run build
npm start
```
