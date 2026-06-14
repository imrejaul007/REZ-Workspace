# BIZORA - Business Operating System

**BIZORA** is the business operations layer of CorpPerks that bridges to industry-specific solutions from **REZ Merchant**.

---

## 🏗️ Architecture

```
CorpPerks
└── BIZORA (Business OS)
    └── Bridges to REZ Merchant services
        ├── hotel-os         → REZ-Merchant/hotel-ecosystem
        ├── restaurant-os    → REZ-Merchant/restauranthub
        ├── salon-os         → REZ-Merchant/REZ-salon-ecosystem
        └── ... (all industries)
```

### Why Bridges?

| Approach | Pros | Cons |
|----------|------|------|
| **Bridges (Current)** | Single source of truth, DRY | Needs coordination |
| Duplicates | Independent | Hard to sync, inconsistent |

**BIZORA bridges to REZ Merchant** - this way:
- REZ Merchant owns the actual implementation
- BIZORA provides unified access point
- Changes propagate automatically

---

## 🌐 Industry Bridges

| Industry | BIZORA Bridge | REZ Merchant Implementation |
|----------|--------------|------------------------------|
| 🏨 Hotel | `hotel-os` | `REZ-Merchant/hotel-ecosystem/` |
| 🍽️ Restaurant | `restaurant-os` | `REZ-Merchant/restauranthub/` |
| 💇 Salon | `salon-os` | `REZ-Merchant/REZ-salon-ecosystem/` |
| 🛒 Retail | `retail-os` | `REZ-Merchant/REZ-retail-app/` |
| 💪 Fitness | `fitness-os` | `REZ-Merchant/REZ-fitness-app/` |
| 🏥 Healthcare | `healthcare-os` | `REZ-Merchant/REZ-healthcare-app/` |
| 🚗 Fleet | `fleet-os` | `REZ-Merchant/REZ-fleet-app/` |
| ✈️ Travel | `travel-os` | `REZ-Merchant/REZ-travel-app/` |
| 📚 Education | `education-os` | `REZ-Merchant/REZ-education-app/` |
| 🏠 Real Estate | `realestate-os` | `REZ-Merchant/REZ-real-estate-app/` |
| 🧺 Laundry | `laundry-os` | `REZ-Merchant/REZ-laundry-app/` |
| 🏭 Manufacturing | `manufacturing-os` | `REZ-Merchant/REZ-manufacturing-app/` |
| 💊 Pharmacy | `pharmacy-os` | `REZ-Merchant/REZ-pharmacy/` |

---

## ⚙️ Business Services Bridges

| Service | Description | Connects To |
|---------|-------------|-------------|
| `finance` | Financial operations | REZ Merchant finance services |
| `invoiceflow` | Invoice management | REZ Merchant invoice services |
| `payment-service` | Payment processing | RABTUL Payment |
| `trust-score` | Business trust/reputation | REZ Merchant trust engine |
| `trust-escrow` | Escrow services | REZ Merchant escrow |
| `contract-management` | Contract lifecycle | REZ Merchant contracts |
| `procurement-os` | Procurement | REZ Merchant procurement |
| `embedded-finance` | Embedded finance | RABTUL services |

---

## 🔗 Integration Points

### CorpPerks HRMS → BIZORA
- Employee benefits bridge to industry services
- Payroll integration with GST
- CorpID identity across all industries

### RABTUL → BIZORA
- Payment processing
- Wallet management
- Notifications

### HOJAI AI → BIZORA
- Industry-specific AI agents
- Cross-industry intelligence
- Automation workflows

---

## 📁 Directory Structure

```
BIZORA/
├── services/              # All industry bridges
│   ├── hotel-os/         # Bridge to hotel-ecosystem
│   ├── restaurant-os/     # Bridge to restauranthub
│   ├── salon-os/         # Bridge to salon-ecosystem
│   ├── finance/          # Finance bridge
│   ├── invoiceflow/      # Invoice bridge
│   └── ... (50+ bridges)
├── apps/                 # BIZORA frontend apps
├── packages/             # Shared packages
└── README.md             # This file
```

---

## 🚀 Usage

### For Development
```bash
# Start BIZORA bridges
cd BIZORA/services/hotel-os
npm run dev

# Or start all bridges
docker-compose up bizora-bridges
```

### For Production
```bash
# Deploy with REZ Merchant connections
./deploy.sh prod
```

---

## 📊 Environment Variables

```bash
# REZ Merchant Service URLs
REZ_HOTEL_SERVICE_URL=http://localhost:4300
REZ_RESTAURANT_SERVICE_URL=http://localhost:4100
REZ_SALON_SERVICE_URL=http://localhost:4200

# Other industry services...
```

---

## 🔐 Security

- All bridges use internal service tokens
- CORS configured for specific origins
- Rate limiting on all endpoints
- PII redaction in logs

---

## 📞 Support

- REZ Merchant: `/RTNM/companies/REZ-Merchant/`
- Industry OS: `/RTNM/companies/REZ-Merchant/industry-os/`

---

*Last updated: June 2026*
