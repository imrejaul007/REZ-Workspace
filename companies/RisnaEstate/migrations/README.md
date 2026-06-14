# RisnaEstate MongoDB Migrations

MongoDB migration system for the RisnaEstate Real Estate platform.

## Overview

This migration system manages database schema changes for the RisnaEstate platform. It supports:
- Sequential migration execution
- Rollback capability
- Migration status tracking
- Idempotent operations

## Prerequisites

- Node.js >= 18.0.0
- MongoDB >= 6.0
- TypeScript (installed via devDependencies)

## Installation

```bash
cd migrations
npm install
```

## Configuration

Set the MongoDB connection URI:

```bash
# Environment variable
export MONGODB_URI=mongodb://localhost:27017/risna

# Or use .env file in parent directory
```

## Usage

### Run All Pending Migrations

```bash
npm run migrate
```

### Check Migration Status

```bash
npm run migrate:status
```

### Rollback Last Migration

```bash
npm run migrate:rollback
```

### Rollback Specific Migration

```bash
npm run migrate:rollback 001
```

## Migration Files

| File | Description |
|------|-------------|
| `001_create_deals_collection.ts` | Creates deals collection with pipeline stages |
| `002_create_agreements_collection.ts` | Creates agreements collection for contracts |
| `003_create_handovers_collection.ts` | Creates handovers collection for possession |
| `004_create_indexes.ts` | Creates performance indexes |

## Collections Created

### Deals Collection
Tracks property deals through the sales pipeline with stages:
- inquiry
- site_visit
- offer_made
- negotiation
- agreement
- registry
- closed_won
- closed_lost

### Agreements Collection
Stores legal agreements and contracts:
- sale_agreement
- registry
- lease_agreement
- moa
- noc
- loan_agreement
- builder_agreement

### Handovers Collection
Tracks property possession and handover process:
- initial_inspection
- keys_handover
- possession
- registration_complete
- rental_handover
- maintenance_handover

## Migration Record

Migrations are tracked in the `migrations` collection with the structure:

```json
{
  "id": "001",
  "name": "001_create_deals_collection",
  "description": "Creates the deals collection with pipeline stages",
  "appliedAt": "2026-06-06T00:00:00.000Z"
}
```

## Programmatic Usage

```typescript
import { runMigrations, rollbackMigration } from './migrate';

// Run all pending migrations
await runMigrations();

// Rollback last migration
await rollbackMigration();

// Rollback specific migration
await rollbackMigration('001');
```

## Creating New Migrations

1. Create a new file with the naming convention: `{NNN}_{description}.ts`
2. Export a default object with `id`, `name`, `description`, `up`, and `down` functions

```typescript
export default {
  id: '005',
  name: '005_create_new_collection',
  description: 'Description of what this migration does',
  
  up: async () => {
    // Create collection, indexes, etc.
  },
  
  down: async () => {
    // Reverse the changes
  }
};
```

## Notes

- Migrations are executed in filename order (numeric prefix)
- Each migration can only be applied once
- Rollback removes the migration record but does not reverse data changes for data migrations
- Use `down` migrations only for schema changes (indexes, collections)