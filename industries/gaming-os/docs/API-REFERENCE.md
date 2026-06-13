# Gaming OS API Reference

## Base URL
```
Staging: http://localhost:3181
```

## Player Twin Service

### Create Player
```
POST /api/players
```
```json
{
  "username": "ProGamer123",
  "email": "progamer@email.com",
  "skillLevel": "competitive",
  "gamingHistory": {
    "gamesPlayed": 500,
    "hoursPlayed": 5000,
    "favoriteGenres": ["FPS", "MOBA"]
  }
}
```

### Get Players
```
GET /api/players
```

### Get Player by ID
```
GET /api/players/:id
```

## REZ CRM Integration
Connect with Steam/Epic Games:
```bash
curl -X POST http://localhost:3099/api/crm/sync -d '{"provider": "steam"}'
```
