# RisaCare White-Label Tenant Configuration Templates

This directory contains ready-to-use configuration templates for deploying white-label instances.

---

## Quick Start

1. Copy the template that matches your client type
2. Update the values
3. Deploy via API or admin panel

---

## Tenant Types

| Template | Use Case |
|----------|----------|
| `hospital-multi-specialty.json` | Large hospitals (200+ beds) |
| `hospital-specialty.json` | Specialty hospitals |
| `clinic-chain.json` | Multi-location clinics |
| `clinic-single.json` | Single clinic |
| `lab-network.json` | Diagnostic labs |
| `pharmacy-chain.json` | Pharmacy chains |

---

## Template: Hospital Multi-Specialty

```json
{
  "tenant": {
    "id": "tenant_sunrise_001",
    "name": "Sunrise Hospital",
    "slug": "sunrise",
    "type": "hospital",
    "subtype": "multi-specialty",
    "status": "active",
    "createdAt": "2026-06-01T00:00:00Z",
    "expiresAt": "2027-06-01T00:00:00Z"
  },
  "branding": {
    "displayName": "Sunrise Hospital",
    "tagline": "Caring for Life",
    "logo": {
      "primary": "https://cdn.risacare.com/tenants/sunrise/logo-primary.svg",
      "secondary": "https://cdn.risacare.com/tenants/sunrise/logo-secondary.svg",
      "favicon": "https://cdn.risacare.com/tenants/sunrise/favicon.ico",
      "appIcon": "https://cdn.risacare.com/tenants/sunrise/app-icon.png"
    },
    "colors": {
      "primary": "#1E88E5",
      "primaryDark": "#1565C0",
      "secondary": "#26A69A",
      "accent": "#FF7043",
      "background": "#FAFAFA",
      "surface": "#FFFFFF",
      "error": "#E53935",
      "success": "#43A047",
      "warning": "#FFA000",
      "textPrimary": "#212121",
      "textSecondary": "#757575"
    },
    "fonts": {
      "primary": "Poppins",
      "secondary": "Inter"
    }
  },
  "domain": {
    "type": "custom",
    "primary": "sunrisehospital.com",
    "admin": "admin.sunrisehospital.com",
    "api": "api.sunrisehospital.com",
    "app": "app.sunrisehospital.com"
  },
  "modules": {
    "enabled": [
      "hospital-management",
      "emr-ehr",
      "billing",
      "inventory",
      "pharmacy",
      "lab",
      "radiology",
      "teleconsult",
      "patient-portal",
      "staff-app",
      "analytics",
      "ai-scribe",
      "predictive"
    ],
    "disabled": []
  },
  "features": {
    "maxDoctors": -1,
    "maxStaff": -1,
    "maxPatients": -1,
    "maxAppointments": -1,
    "storageGB": 1000,
    "apiCallsPerMonth": -1,
    "teleconsultMinutesPerMonth": -1
  },
  "integrations": {
    "enabled": [
      "abha",
      "fhir-r4",
      "insurer-tpas",
      "lab-interfaces"
    ],
    "abha": {
      "enabled": true,
      "providerId": "SUNRISE-HOSP-001"
    },
    "tpas": [
      { "name": "Max Bupa", "enabled": true },
      { "name": "HDFC Ergo", "enabled": true },
      { "name": "Star Health", "enabled": true },
      { "name": "ICICI Lombard", "enabled": true }
    ],
    "labs": [
      { "name": "SRL", "enabled": true },
      { "name": "PathLabs", "enabled": true },
      { "name": "Metropolis", "enabled": true }
    ]
  },
  "billing": {
    "model": "subscription",
    "plan": "hospital-pro",
    "priceINR": 150000,
    "billingCycle": "monthly",
    "nextBillingDate": "2026-07-01T00:00:00Z",
    "paymentMethod": "bank-transfer",
    "gstNumber": "27AAACH1234C1ZX"
  },
  "support": {
    "level": "priority",
    "sla": {
      "uptime": 99.9,
      "responseTime": "1h",
      "resolutionTime": "4h"
    },
    "dedicatedManager": true,
    "managerName": "Amit Kumar",
    "managerEmail": "amit@risacare.com",
    "managerPhone": "+91-9876543210"
  },
  "security": {
    "encryption": "AES-256",
    "backupFrequency": "daily",
    "retentionDays": 90,
    "compliance": ["HIPAA", "DPDP", "ISO27001"],
    "auditLogging": true,
    "twoFactorRequired": true
  },
  "notifications": {
    "email": {
      "domain": "sunrisehospital.com",
      "fromName": "Sunrise Hospital",
      "fromEmail": "noreply@sunrisehospital.com"
    },
    "sms": {
      "senderId": "SUNHSP",
      "enabled": true
    },
    "whatsapp": {
      "enabled": true,
      "businessAccount": "SunriseHospital"
    }
  }
}
```

---

## Template: Clinic Chain

```json
{
  "tenant": {
    "id": "tenant_cityclinic_001",
    "name": "City Clinic Chain",
    "slug": "cityclinic",
    "type": "clinic",
    "subtype": "chain",
    "status": "active",
    "locations": [
      { "id": "loc_001", "name": "City Clinic - Koramangala", "beds": 5 },
      { "id": "loc_002", "name": "City Clinic - Indiranagar", "beds": 3 },
      { "id": "loc_003", "name": "City Clinic - HSR Layout", "beds": 5 }
    ],
    "createdAt": "2026-06-01T00:00:00Z"
  },
  "branding": {
    "displayName": "City Clinic",
    "tagline": "Your Neighborhood Health Partner",
    "logo": {
      "primary": "https://cdn.risacare.com/tenants/cityclinic/logo.svg"
    },
    "colors": {
      "primary": "#4CAF50",
      "primaryDark": "#388E3C",
      "secondary": "#FFC107",
      "background": "#FFFFFF",
      "textPrimary": "#212121"
    }
  },
  "domain": {
    "type": "subdomain",
    "primary": "cityclinic.risacare.com",
    "admin": "admin.cityclinic.risacare.com"
  },
  "modules": {
    "enabled": [
      "emr-ehr",
      "teleconsult",
      "billing",
      "patient-portal",
      "staff-app"
    ],
    "disabled": [
      "pharmacy",
      "inventory",
      "lab",
      "radiology",
      "predictive"
    ]
  },
  "features": {
    "maxDoctors": 50,
    "maxLocations": -1,
    "storageGB": 100,
    "teleconsultMinutesPerMonth": 10000
  },
  "billing": {
    "model": "subscription",
    "plan": "clinic-express",
    "priceINR": 25000,
    "billingCycle": "monthly",
    "perDoctorFee": 500
  },
  "support": {
    "level": "standard",
    "sla": {
      "uptime": 99.5,
      "responseTime": "4h"
    }
  }
}
```

---

## Template: Diagnostic Lab

```json
{
  "tenant": {
    "id": "tenant_healthdiag_001",
    "name": "Health Diagnostics",
    "slug": "healthdiag",
    "type": "lab",
    "status": "active",
    "collectionCenters": 15,
    "processingLabs": 2,
    "createdAt": "2026-06-01T00:00:00Z"
  },
  "branding": {
    "displayName": "Health Diagnostics",
    "tagline": "Accurate Results, Faster",
    "colors": {
      "primary": "#7B1FA2",
      "secondary": "#E91E63"
    }
  },
  "modules": {
    "enabled": [
      "lab-management",
      "sample-tracking",
      "reporting",
      "quality-control",
      "inventory",
      "portal",
      "report-delivery"
    ]
  },
  "integrations": {
    "enabled": ["lab-equipment", "referrer-portals"],
    "equipmentInterfaces": [
      { "name": "Beckman Coulter", "enabled": true },
      { "name": "Roche", "enabled": true },
      { "name": "Siemens", "enabled": true }
    ]
  },
  "billing": {
    "model": "subscription",
    "plan": "lab-network",
    "priceINR": 50000,
    "billingCycle": "monthly"
  }
}
```

---

## API: Create Tenant

```bash
# Create new white-label tenant
curl -X POST https://api.risacare.com/admin/tenants \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d @hospital-template.json
```

---

## API: Update Branding

```bash
# Update tenant branding
curl -X PATCH https://api.risacare.com/admin/tenants/{tenant_id}/branding \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "colors": {
      "primary": "#2196F3"
    }
  }'
```

---

## Environment Variables

```bash
# For on-premise deployment
TENANT_ID=sunrise_001
TENANT_DB_PREFIX=sunrise_
TENANT_LOGO_URL=https://cdn.example.com/tenants/sunrise/
TENANT_DOMAIN=sunrisehospital.com
```

---

## Deployment Checklist

- [ ] Copy template
- [ ] Update tenant ID and name
- [ ] Configure branding (logo, colors)
- [ ] Set domain/subdomain
- [ ] Enable required modules
- [ ] Configure integrations
- [ ] Set billing plan
- [ ] Configure support level
- [ ] Test branding appearance
- [ ] Verify all links work
- [ ] Send credentials to client

---

## Support

For questions: white-label@risacare.com
