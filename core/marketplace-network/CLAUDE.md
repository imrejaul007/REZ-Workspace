# Marketplace Network

## Overview
Unified marketplace across all 24 RTMN industries.

## Port: 3031

## Features
- **Multi-Industry Listings**: Products, services, subscriptions, consulting
- **Provider Management**: Provider registration and verification
- **Unified Search**: Federated search across all industries
- **Order Management**: Complete marketplace order flow

## Listing Types
- product, service, subscription, consulting

## Listing Status
- active, inactive, sold, expired

## Routes
- `listings.js` - Listing management
- `orders.js` - Order management
- `providers.js` - Provider management
- `search.js` - Unified search

## API Endpoints
- `GET /api/listings` - List listings
- `POST /api/listings` - Create listing
- `GET /api/orders` - List orders
- `POST /api/orders` - Create order
- `GET /api/providers` - List providers
- `POST /api/providers` - Register provider
- `GET /api/search` - Unified search
- `GET /api/search/suggestions` - Search suggestions

## Search Features
- Full-text search in title and description
- Filter by industry, type, price range
- Sort by relevance, price, popularity, recent

## Industry Coverage
All 24 RTMN industries supported.

## Dependencies
- express, cors, helmet, redis, uuid, winston
