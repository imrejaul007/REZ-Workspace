# ReZ Events Service

A merchant-facing microservice for event organizers including weddings, corporate events, exhibitions, concerts, parties, and conferences. This service manages events, venues, vendors, guest lists, and ticketing.

## Features

- **Event Management**: Create and manage events with timeline, budget, and guest tracking
- **Vendor Management**: Organize vendors by category, track bookings and contracts
- **Guest Management**: Handle guest lists, RSVP tracking, dietary restrictions, and seating
- **Ticketing**: Manage ticket types, pricing, availability, and sales tracking
- **Event Coordinator Service**: Coordinate all aspects of event management
- **RSVP Service**: Handle guest responses and confirmations

## Service Configuration

- **Port**: 4055
- **Base URL**: `http://localhost:4055`
- **Health Check**: `http://localhost:4055/health`

## API Endpoints

### Events
- `POST /api/events` - Create a new event
- `GET /api/events` - List/search events
- `GET /api/events/:id` - Get event by ID
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event
- `PATCH /api/events/:id/status` - Update event status
- `GET /api/events/:id/timeline` - Get event timeline

### Vendors
- `POST /api/vendors` - Create a new vendor
- `GET /api/vendors` - List/search vendors
- `GET /api/vendors/:id` - Get vendor by ID
- `PUT /api/vendors/:id` - Update vendor
- `DELETE /api/vendors/:id` - Delete vendor
- `POST /api/vendors/:id/assign` - Assign vendor to event
- `GET /api/vendors/event/:eventId` - Get vendors for event

### Guests
- `POST /api/guests` - Create a new guest
- `POST /api/guests/bulk` - Bulk import guests
- `GET /api/guests` - List/search guests
- `GET /api/guests/:id` - Get guest by ID
- `PUT /api/guests/:id` - Update guest
- `DELETE /api/guests/:id` - Delete guest
- `POST /api/guests/:id/rsvp` - RSVP for guest
- `GET /api/guests/event/:eventId` - Get guests for event

### Tickets
- `POST /api/tickets` - Create a new ticket type
- `GET /api/tickets` - List ticket types
- `GET /api/tickets/:id` - Get ticket by ID
- `PUT /api/tickets/:id` - Update ticket
- `DELETE /api/tickets/:id` - Delete ticket
- `POST /api/tickets/:id/sell` - Record ticket sale
- `GET /api/tickets/event/:eventId` - Get tickets for event
- `GET /api/tickets/:id/sales` - Get ticket sales report

## Installation

```bash
npm install
```

## Development

```bash
# Run in development mode
npm run dev

# Build for production
npm run build

# Run production server
npm start
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 4055 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/rez-events |
| JWT_SECRET | JWT authentication secret | - |
| NODE_ENV | Environment mode | development |
| CORS_ORIGIN | Allowed CORS origins (comma-separated) | - |

## Authentication

All API endpoints require JWT authentication via the `Authorization: Bearer <token>` header.

JWT Payload structure:
```json
{
  "sub": "user-id",
  "merchantId": "merchant-id",
  "role": "admin|coordinator|staff",
  "email": "user@example.com",
  "exp": 1234567890
}
```

## Data Models

### Event
- Event ID, name, type, description
- Venue, dates, times
- Expected/confirmed guests, status
- Budget, spent, category, tags
- Client contact information

### Vendor
- Vendor ID, name, category
- Contact info, rating, price range
- Status: available/booked/contracted
- Assigned events

### Guest
- Guest ID, name, contact info
- Category (VIP/invitation/confirmed/RSVP pending)
- Plus-ones, dietary restrictions
- Table/seat assignment, status

### Ticket
- Ticket ID, type (general/VIP/early bird)
- Price, quantities (total/sold/available)
- Validity period, benefits

## License

Proprietary - ReZ Platform