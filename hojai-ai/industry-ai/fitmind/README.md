# HOJAI Gym & Fitness OS

AI-powered fitness management for gyms and fitness studios.

## Quick Start

```bash
# Install dependencies
npm install

# Run member service
cd services/member-service && npm run dev

# Run class scheduler
cd services/class-scheduler && npm run dev

# Run attendance service
cd services/attendance-service && npm run dev
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| Member Service | 4801 | Member management |
| Class Scheduler | 4802 | Class booking |
| Attendance | 4803 | Check-in tracking |
| Membership Plans | 4804 | Plan management |

## AI Employees

- **fitness-coach**: Workout plans
- **nutrition-advisor**: Diet plans
- **retention-manager**: Churn prediction
- **membership-advisor**: Plan recommendations

## API Examples

### Create Member
```bash
curl -X POST http://localhost:4801/members \
  -H "Content-Type: application/json" \
  -d '{"name": "John", "phone": "+919876543210", "membershipPlan": "Premium"}'
```

### Book Class
```bash
curl -X POST http://localhost:4802/classes/:id/book \
  -H "Content-Type: application/json" \
  -d '{"memberId": "...", "memberName": "John"}'
```

### Voice Check-in
```bash
curl -X POST http://localhost:4801/voice/checkin \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210"}'
```

## Voice Agents

### Phone Receptionist
- Port: 4871
- Features: IVR, service inquiries, booking

### WhatsApp AI
- Port: 4872
- Features: messaging, booking, inquiries
