# Sports OS API Reference

## Base URL
```
Staging: http://localhost:3171
```

## Athlete Twin Service

### Create Athlete
```
POST /api/athletes
```
```json
{
  "name": "LeBron James",
  "sport": "Basketball",
  "team": "Los Angeles Lakers",
  "position": "SF",
  "stats": { "gamesPlayed": 1400, "points": 38600, "assists": 10500 }
}
```

### Get Athletes
```
GET /api/athletes?sport=Basketball
```

### Get Athlete by ID
```
GET /api/athletes/:id
```

## REZ CRM Integration
Connect with Ticketmaster/StubHub:
```bash
curl -X POST http://localhost:3098/api/crm/sync -d '{"provider": "ticketmaster"}'
```
