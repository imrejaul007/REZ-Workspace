# Fitness OS API Reference

## Base URL
```
Staging: http://localhost:3091
```

## Member Twin Service

### Create Member
```
POST /api/members
```
```json
{ "name": "John Member", "email": "john@email.com", "phone": "+1-555-0123", "membershipType": "premium", "goals": ["weight_loss", "muscle_gain"] }
```

### Get Members
```
GET /api/members
```

### Get Member by ID
```
GET /api/members/:id
```

## REZ CRM Integration
Connect with Mindbody/Glofox:
```bash
curl -X POST http://localhost:3104/api/crm/sync -d '{"provider": "mindbody"}'
```
