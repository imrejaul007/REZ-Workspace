# Customer 360 Service - Statement of Truth

## Service Overview
- **Name**: Customer 360 Service
- **Port**: 3002
- **Type**: CRM Micro-service
- **Version**: 1.0.0

## Core Functionality
Provides a unified view of customers across all 15 Industry AI products, consolidating customer data from multiple sources into a single 360-degree profile.

## Key Features
1. **Unified Customer Profiles**: Creates consolidated customer records with data from all industries
2. **Multi-Industry Tracking**: Tracks customer engagement across multiple industries
3. **Communication History**: Maintains complete communication history across all channels
4. **Customer Preferences**: Manages contact preferences and notification settings
5. **Cross-Industry Analytics**: Provides statistics on multi-industry customer behavior

## API Endpoints

### Customers
- `POST /api/customers` - Create new customer
- `GET /api/customers` - Get all customers with filtering
- `GET /api/customers/:id` - Get customer by ID
- `GET /api/customers/email/:email` - Get customer by email
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Industry Profiles
- `POST /api/customers/:id/industries` - Add industry profile

### Communications
- `POST /api/customers/:id/communications` - Add communication entry
- `GET /api/customers/:id/timeline` - Get customer timeline

### Search & Analytics
- `GET /api/customers/search/:query` - Search customers
- `GET /api/customers/high-value/:minLTV` - Get high value customers
- `GET /api/stats/cross-industry` - Get cross-industry statistics

## Health Check
- `GET /health` - Service health status

## Dependencies
- express
- cors
- uuid
- winston

## Data Models
- Customer360
- IndustryProfile
- CommunicationEntry
- CustomerPreferences

## Status
**READY FOR PRODUCTION**
