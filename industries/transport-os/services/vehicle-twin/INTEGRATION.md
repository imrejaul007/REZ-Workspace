# Vehicle Twin Service - Integration with TwinOS

**Document Version:** 1.0.0
**Last Updated:** 2026-06-12

## Overview

This document describes how the Vehicle Twin Service integrates with the TwinOS platform and other Transport OS services.

## TwinOS Integration

### Entity Definition

**TwinOS Entity ID:** `twin.transport.vehicle.{vehicle_id}`

The Vehicle Twin Service maintains the canonical state for all vehicle digital twins in the TwinOS platform.

### Relationships

| Relationship | Target Twin | Cardinality | Description |
|--------------|-------------|-------------|-------------|
| `ASSIGNED_TO` | FleetTwin | 1:1 | Vehicle belongs to a fleet |
| `DRIVEN_BY` | DriverTwin | 1:1 | Vehicle currently assigned to a driver |
| `SERVICES` | OrderTwin | 1:many | Vehicle has completed service orders |
| `LOCATED_IN` | AreaTwin | 1:1 | Vehicle is currently in an area |

### Managing Agent

**Agent ID:** `agent.vehicle_management`

The vehicle management agent is responsible for:
- Vehicle tracking and monitoring
- Maintenance scheduling
- Diagnostic analysis
- Status orchestration

## Integration with KHAIRMOVE Fleet

The Vehicle Twin Service integrates with KHAIRMOVE Fleet as the primary data producer:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   KHAIRMOVE      │────▶│   Vehicle       │────▶│    TwinOS        │
│   Fleet          │     │   Twin Service  │     │    Hub           │
│                  │     │                 │     │                 │
│ - Vehicle Reg    │     │ - Twin State    │     │ - Entity Mgmt   │
│ - Status Updates │     │ - Telemetry     │     │ - Relationships │
│ - Telemetry Data │     │ - Maintenance   │     │ - Query API     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### API Integration

| KHAIRMOVE Fleet Endpoint | Vehicle Twin Endpoint | Direction |
|------------------------|----------------------|-----------|
| Vehicle Registration | POST /api/vehicles | Fleet -> Twin |
| Status Update | PATCH /api/vehicles/:id/status | Fleet -> Twin |
| Telemetry Push | POST /api/telemetry/:id | Fleet -> Twin |
| Fleet Vehicles Query | GET /api/vehicles?fleetId=X | Fleet -> Twin |
| Nearby Vehicles | GET /api/vehicles/nearby | Fleet -> Twin |

## Message Broker Events

### Published Events

The service publishes events to the `transport.events` exchange:

```typescript
interface VehicleEvent {
  eventType: 'created' | 'updated' | 'status_changed' | 'telemetry_updated' | 'maintenance_due' | 'deleted';
  vehicleId: string;
  timestamp: Date;
  data: Record<string, unknown>;
  location?: {
    lat: number;
    lng: number;
  };
}
```

### Event Routing Keys

| Event Type | Routing Key | Subscribers |
|------------|-------------|------------|
| Vehicle Created | `vehicle.created` | TwinOS Hub, Dispatch |
| Vehicle Updated | `vehicle.updated` | TwinOS Hub |
| Status Changed | `vehicle.status_changed` | Dispatch, KHAIRMOVE Driver |
| Telemetry Updated | `vehicle.telemetry_updated` | Analytics, TwinOS Hub |
| Maintenance Due | `vehicle.maintenance_due` | Fleet Management |
| Vehicle Deleted | `vehicle.deleted` | TwinOS Hub |

### Telemetry Events

Telemetry events are published to the `vehicle.telemetry` exchange:

```typescript
interface TelemetryEvent {
  vehicleId: string;
  timestamp: Date;
  telemetry: {
    fuelLevel: number | null;
    batteryLevel: number | null;
    odometer: number;
    engineHours: number;
    diagnostics: VehicleDiagnostics;
  };
  location: {
    lat: number;
    lng: number;
  };
}
```

## Business Copilot Queries

The Vehicle Twin Service supports the following Business Copilot queries:

### Operations Queries

| Query Type | Description | Example |
|------------|-------------|---------|
| `vehicle_location` | Track vehicle location | "Where is vehicle V-123?" |
| `fleet_status` | Get fleet overview | "What's the status of Fleet 5?" |
| `vehicle_availability` | Check availability | "How many vehicles are available in Dubai?" |

### Maintenance Queries

| Query Type | Description | Example |
|------------|-------------|---------|
| `maintenance_due` | Get maintenance alerts | "Which vehicles need service?" |
| `insurance_expiry` | Check insurance | "Which vehicles have expiring insurance?" |

### Telemetry Queries

| Query Type | Description | Example |
|------------|-------------|---------|
| `fuel_level` | Check fuel levels | "Which vehicles have low fuel?" |
| `diagnostic_status` | Check diagnostics | "Any vehicles with engine warnings?" |

## Data Flow Diagrams

### Vehicle Registration Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Driver     │────▶│  KHAIRMOVE   │────▶│   Vehicle    │────▶│   TwinOS     │
│   App        │     │   Fleet      │     │   Twin Svc   │     │   Hub        │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
     │                    │                    │                    │
     │ Register Vehicle  │                    │                    │
     │───────────────────▶│                    │                    │
     │                    │ POST /vehicles      │                    │
     │                    │───────────────────▶│                    │
     │                    │                    │ Create Twin         │
     │                    │                    │───────────────────▶│
     │                    │                    │                    │ Create Entity
     │                    │                    │                    │ Link Relations
     │                    │    201 Created     │                    │
     │                    │◀───────────────────│                    │
     │  Vehicle Created   │                    │                    │
     │◀──────────────────│                    │                    │
```

### Telemetry Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Vehicle    │────▶│   IoT Hub    │────▶│   Vehicle    │────▶│   Analytics  │
│   (OBD)      │     │              │     │   Twin Svc   │     │   Service    │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
     │                    │                    │                    │
     │ Telemetry Data     │                    │                    │
     │───────────────────▶│                    │                    │
     │                    │ POST /telemetry    │                    │
     │                    │───────────────────▶│                    │
     │                    │                    │ Update Twin        │
     │                    │                    │───────────────────▶│
     │                    │                    │    vehicle.telemetry.update
     │                    │                    │───────────────────▶│
     │                    │                    │                    │ Process
     │                    │    200 OK           │                    │
     │                    │◀───────────────────│                    │
```

## API Rate Limits

| Endpoint Category | Limit | Window |
|-------------------|-------|--------|
| Vehicle CRUD | 1000 | per minute |
| Vehicle Telemetry | 50000 | per minute |
| Vehicle Queries | 2000 | per minute |
| Telemetry Processing | 50000 | per minute |

## Security

### Authentication

- API Key authentication for service-to-service calls
- OAuth 2.0 for driver/rider apps

### Data Protection

- GPS data encrypted at rest
- PII encrypted at rest
- TLS 1.3 for all API calls

## Compliance

| Regulation | Requirements |
|------------|--------------|
| Transport Authority | Vehicle licensing, registration tracking |
| Data Protection | GDPR, local data residency |
| Insurance | Vehicle insurance tracking and alerts |

## Monitoring

### Health Checks

- `/health` - Basic health check
- `/health/ready` - Readiness with dependency checks
- `/health/live` - Liveness probe

### Metrics

The service exposes the following metrics (for Prometheus integration):

- `vehicle_twin_total` - Total number of active vehicles
- `vehicle_twin_by_status` - Vehicles by status
- `vehicle_twin_telemetry_updates_total` - Telemetry updates processed
- `vehicle_twin_maintenance_alerts_total` - Maintenance alerts generated

## Error Codes

| Code | Description |
|------|-------------|
| `VEHICLE_NOT_FOUND` | Vehicle does not exist |
| `VEHICLE_ALREADY_EXISTS` | Vehicle with same VIN already exists |
| `INVALID_STATUS_TRANSITION` | Invalid status change requested |
| `TELEMETRY_UPDATE_FAILED` | Failed to process telemetry update |
| `MAINTENANCE_ALERT` | Maintenance is due |

## Support

For integration support, contact:
- **Email:** support@rtmn.io
- **Slack:** #transport-os-support
- **Documentation:** https://docs.rtmn.io/transport-os
