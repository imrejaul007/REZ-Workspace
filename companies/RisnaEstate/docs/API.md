/**
 * RisnaEstate API Documentation
 * Base URL: http://localhost:3000
 * Full API docs at: /api/docs
 */

## Authentication

All API requests require `Authorization: Bearer {token}` header.

```bash
curl -H "Authorization: Bearer {token}" http://localhost:3000/api/v1/properties
```

---

## Core Endpoints

### Properties (Port 4100)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/properties` | List properties with filters |
| GET | `/api/v1/properties/:id` | Get property details |
| POST | `/api/v1/properties` | Create property |
| PUT | `/api/v1/properties/:id` | Update property |
| DELETE | `/api/v1/properties/:id` | Delete property |
| GET | `/api/v1/properties/featured` | Featured properties |
| GET | `/api/v1/properties/search?q=` | Search properties |
| POST | `/api/v1/properties/:id/view` | Track view |
| POST | `/api/v1/properties/:id/inquire` | Inquiry |

### Leads (Port 4101)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/leads` | List leads |
| GET | `/api/v1/leads/:id` | Get lead details |
| POST | `/api/v1/leads` | Create lead |
| PUT | `/api/v1/leads/:id` | Update lead |
| POST | `/api/v1/leads/:id/score` | AI scoring |
| POST | `/api/v1/leads/:id/assign` | Assign to broker |
| GET | `/api/v1/leads/hot` | Hot leads |

### Visa (Port 4102)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/visa/programs` | Available programs |
| POST | `/api/v1/visa/eligibility` | Check eligibility |
| GET | `/api/v1/visa/stats` | Visa statistics |

### Referrals (Port 4103)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/referrals` | Create referral |
| POST | `/api/v1/referrals/validate` | Validate code |
| GET | `/api/v1/referrals/my` | My referrals |
| GET | `/api/v1/referrals/earnings` | My earnings |
| GET | `/api/v1/referrals/leaderboard` | Top referrers |

### Brokers (Port 4104)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/brokers` | Register broker |
| GET | `/api/v1/brokers/:id` | Get broker |
| PUT | `/api/v1/brokers/:id` | Update broker |
| POST | `/api/v1/brokers/:id/verify` | Verify broker |
| GET | `/api/v1/brokers/:id/stats` | Broker stats |

### CRM (Port 4105)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/crm/follow-ups` | List follow-ups |
| POST | `/api/v1/crm/follow-ups` | Create follow-up |
| POST | `/api/v1/crm/follow-ups/:id/complete` | Complete |
| GET | `/api/v1/crm/site-visits` | List visits |
| POST | `/api/v1/crm/site-visits` | Schedule visit |

---

## Intelligence Endpoints

### Intelligence (Port 4110)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/intelligence/analyze` | Full AI analysis |
| POST | `/api/v1/intelligence/nri-score` | NRI probability |
| POST | `/api/v1/intelligence/hni-score` | HNI detection |
| POST | `/api/v1/intelligence/investor-score` | Investor score |
| POST | `/api/v1/intelligence/visa-score` | Visa probability |

### WhatsApp (Port 4111)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/whatsapp/send` | Send message |
| POST | `/api/v1/whatsapp/brochure` | Send brochure |
| POST | `/api/v1/whatsapp/webhook` | Webhook receiver |
| POST | `/api/v1/whatsapp/visit-confirmation` | Confirm visit |

### Investment (Port 4112)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/investment/roi` | Calculate ROI |
| POST | `/api/v1/investment/emi` | Calculate EMI |
| POST | `/api/v1/investment/yield` | Rental yield |
| POST | `/api/v1/investment/affordability` | Affordability check |
| POST | `/api/v1/investment/visa-eligibility` | Golden Visa check |

### Distribution (Port 4113)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/distribution/assign` | Assign lead |
| GET | `/api/v1/distribution/rules` | Routing rules |
| POST | `/api/v1/distribution/rules` | Create rule |
| GET | `/api/v1/distribution/stats` | Routing stats |

---

## Platform Endpoints

### Bookings (Port 4120)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/bookings` | Create booking |
| GET | `/api/v1/bookings/:id` | Get booking |
| GET | `/api/v1/bookings/user/:userId` | User bookings |
| POST | `/api/v1/bookings/:id/pay-token` | Pay token amount |
| POST | `/api/v1/bookings/:id/pay-full` | Pay full amount |
| POST | `/api/v1/bookings/:id/cancel` | Cancel booking |

### Email (Port 4122)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/email/send` | Send email |
| GET | `/api/v1/email/templates` | List templates |
| POST | `/api/v1/email/campaigns` | Create campaign |
| POST | `/api/v1/email/campaigns/:id/send` | Send campaign |

### Chatbot (Port 4123)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/chatbot/message` | Send message |
| GET | `/api/v1/chatbot/sessions` | List sessions |
| POST | `/api/v1/chatbot/sessions/:id/close` | Close session |

### Notifications (Port 4108)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/notifications` | List notifications |
| POST | `/api/v1/notifications/send` | Send notification |
| POST | `/api/v1/notifications/:id/read` | Mark as read |

---

## Example Requests

### Create Lead

```bash
curl -X POST http://localhost:3000/api/v1/leads \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "phone": "+971501234567",
    "email": "john@example.com",
    "source": "website",
    "interestedCountries": ["AE"],
    "budget": { "min": 1000000, "max": 5000000, "currency": "AED" }
  }'
```

### Check Visa Eligibility

```bash
curl -X POST http://localhost:3000/api/v1/visa/eligibility \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "nationality": "IN",
    "propertyValue": 2750000,
    "currency": "AED",
    "ownershipPercentage": 100
  }'
```

### Calculate EMI

```bash
curl -X POST http://localhost:3000/api/v1/investment/emi \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "principal": 2000000,
    "interestRate": 4.5,
    "tenureMonths": 240
  }'
```

---

## Client SDK

```bash
npm install @risna/client
```

```typescript
import { api } from '@/lib/api-full';

const properties = await api.properties.list({ country: 'AE', city: 'Dubai' });
const leads = await api.leads.hot(50);
const eligibility = await api.visa.eligibility({ nationality: 'IN', propertyValue: 3000000 });
```
