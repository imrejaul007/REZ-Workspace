# Construction OS API Reference

## Base URL
```
Staging: http://localhost:3191
```

## Project Twin Service

### Create Project
```
POST /api/projects
```
```json
{ "name": "Tower Construction", "client": "Acme Corp", "scope": "Commercial building", "budget": 5000000 }
```

### Get Projects
```
GET /api/projects
```

### Get Project by ID
```
GET /api/projects/:id
```

## REZ CRM Integration
Connect with Procore:
```bash
curl -X POST http://localhost:3103/api/crm/sync -d '{"provider": "procore"}'
```
