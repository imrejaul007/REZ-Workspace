# Rez Staff App Offline Service

Offline-First Architecture for Hotel Staff Mobile Applications

**Port:** 4038

## Features

- **Offline Queue Management**: Queue operations when device is offline for later sync
- **Conflict Resolution**: Multiple strategies (SERVER_WINS, CLIENT_WINS, LAST_WRITE_WINS, MERGE, MANUAL)
- **Data Versioning**: Optimistic locking with version tracking for concurrent edits
- **Delta Sync**: Only sync changed data to minimize bandwidth usage
- **Batch Sync Operations**: Efficient bulk data synchronization
- **Network Status Tracking**: Monitor connectivity state changes
- **Device Registration**: Register and manage staff devices
- **Sync Analytics**: Track sync performance and conflict statistics
- **Supported Operations**: Room status, housekeeping, maintenance, guest, service requests, inventory, tasks

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /api/info | Service information and capabilities |
| POST | /api/devices/register | Register device for offline sync |
| POST | /api/devices/heartbeat | Device heartbeat and pending count |
| POST | /api/sync/push | Push operations from device to server |
| POST | /api/sync/pull | Pull data changes to device |
| POST | /api/sync/full | Full bidirectional sync |
| GET | /api/queue/:staffId | Get pending operations queue |
| DELETE | /api/queue/:operationId | Cancel pending operation |
| POST | /api/queue/retry/:operationId | Retry failed operation |
| GET | /api/conflicts/:staffId | Get pending conflicts |
| POST | /api/conflicts/:conflictId/resolve | Resolve conflict manually |
| POST | /api/snapshots/bulk | Create/update data snapshots |
| GET | /api/snapshots/:staffId | Get all snapshots for staff |
| GET | /api/analytics/:staffId | Get sync analytics |
| POST | /api/admin/force-sync/:staffId | Force sync all operations |
| DELETE | /api/admin/clear-queue/:staffId | Clear pending queue (admin) |

## Quick Start

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run in production mode
npm start

# Run tests
npm test
```

## Configuration

Configure via environment variables or `.env` file:
- `PORT`: Server port (default: 4038)
- `MONGO_URL`: MongoDB connection string
- `INTERNAL_SERVICE_TOKEN`: Admin authentication token

## Conflict Resolution Strategies

| Strategy | Description |
|----------|-------------|
| SERVER_WINS | Server data always takes precedence (default) |
| CLIENT_WINS | Client changes always take precedence |
| LAST_WRITE_WINS | Most recent timestamp wins |
| MERGE | Attempt automatic merge for compatible changes |
| MANUAL | Queue for manual conflict resolution |

## Supported Entity Types

- Room status updates
- Housekeeping task updates
- Maintenance issue creation/updates
- Guest check-in/check-out
- Service request updates
- Message sending
- Inventory updates
- Task completion
- Notes
