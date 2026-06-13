# Home Services OS Integration Specification

**Version:** 1.0.0
**Last Updated:** 2026-06-12
**Owner:** Home Services OS Team

---

## Executive Summary

The Home Services OS Integration Specification defines the comprehensive architecture for connecting four core products—REZ POS, REZ Staff, REZ QR Cloud, and REZ Business Copilot—with four digital twin types—Home Twin, Service Provider Twin, Job Twin, and Customer Twin—through four intelligent agents. The system enables end-to-end job management, service provider matching, quote generation, and quality assurance across the home services ecosystem.

**Key Integration Focus:** REZ Staff ↔ Service Provider Twin represents the primary workforce intelligence pipeline, enabling service businesses to access real-time availability, skill matching, location optimization, and performance metrics to optimize job assignments and improve service delivery.

**Business Outcomes:**
- 45% improvement in service provider matching accuracy
- 35% reduction in travel time through intelligent routing
- 30% increase in first-time fix rate through skill-based matching
- 40% improvement in quote accuracy through twin-based pricing
- 25% increase in customer satisfaction through quality matching

**Technical Foundation:**
- Event-driven architecture with Apache Kafka as the backbone
- GraphQL federation for unified twin queries
- REST API with OpenAPI 3.0 specifications
- gRPC for high-throughput agent communications
- WebSocket subscriptions for real-time dashboards
- Geospatial indexing for routing optimization

---

## Product Capability Matrix

### 3.1 Product Overview

| Product | Core Function | Primary Port | Protocol | Data Format | Latency Target |
|---------|--------------|---------------|----------|-------------|----------------|
| REZ POS | Point of sale & payment processing | 7601 | REST | JSON | < 50ms |
| REZ Staff | Workforce management & scheduling | 7602 | REST/GraphQL | JSON | < 100ms |
| REZ QR Cloud | QR code generation & customer engagement | 7603 | REST | JSON | < 50ms |
| REZ Business Copilot | AI-powered business intelligence | 7604 | REST/GraphQL | JSON | < 200ms |
| REZ CRM | Customer relationship management | TBD | REST | JSON | < 100ms |

### 3.2 Product-to-Twin Port Mappings

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        HOME SERVICES OS PRODUCTS                           │
├─────────────────────────────────────────────────────────────────────────────┤
│  REZ POS:7601 ─────────────┬──→ Job Twin (:8103)                            │
│                             │     Customer Twin (:8103)                      │
│                             │     Service Provider Twin (:8103)              │
│                             ├──→ REZ Staff:7602                             │
│                             └──→ REZ QR Cloud:7603                           │
├─────────────────────────────────────────────────────────────────────────────┤
│  REZ Staff:7602 ────────────┬──→ Service Provider Twin (:8103)             │
│                             │     Job Twin (:8103)                            │
│                             │     Home Twin (:8103)                           │
│                             ├──→ REZ POS:7601                                │
│                             └──→ REZ Business Copilot:7604                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  REZ QR Cloud:7603 ─────────┼──→ Job Twin (:8103)                          │
│                              │     Customer Twin (:8103)                      │
│                              │     Home Twin (:8103)                          │
│                              └──→ REZ POS:7601                               │
├─────────────────────────────────────────────────────────────────────────────┤
│  REZ Business Copilot:7604 ─┼──→ All Twins (:8103)                          │
│                              │     (Read access for AI queries)                │
│                              └──→ REZ Staff:7602                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Port Specifications

| Port | Service | Inbound | Outbound | Authentication | Rate Limit |
|------|---------|---------|----------|----------------|------------|
| 7601 | REZ POS API | All products | REZ Staff, QR Cloud | API Key + JWT | 20,000 req/min |
| 7602 | REZ Staff API | All products | All products | OAuth 2.0 | 10,000 req/min |
| 7603 | REZ QR Cloud API | REZ POS, Staff | All products | API Key | 20,000 req/min |
| 7604 | REZ Business Copilot API | Staff | All twins | OAuth 2.0 / JWT | 5,000 req/min |
| 8103 | Twin GraphQL Gateway | All products | All products | OAuth 2.0 / JWT | 20,000 req/min |

---

## Twin JSON Schemas

### 4.1 Home Twin Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://rtmn.io/schemas/home-twin/v1",
  "title": "Home Twin",
  "description": "Digital representation of customer homes with property details, service history, and needs prediction",
  "type": "object",
  "properties": {
    "homeId": {
      "type": "string",
      "format": "uuid",
      "description": "Unique identifier for the home"
    },
    "name": {
      "type": "string",
      "description": "Home or household name (e.g., Smith Family Home)"
    },
    "homeType": {
      "type": "string",
      "enum": ["single_family", "townhouse", "condo", "apartment", "multi_family", "commercial"],
      "description": "Property classification"
    },
    "attributes": {
      "type": "object",
      "properties": {
        "address": {
          "type": "object",
          "properties": {
            "street": { "type": "string" },
            "unit": { "type": "string" },
            "city": { "type": "string" },
            "state": { "type": "string" },
            "zip": { "type": "string" },
            "country": { "type": "string" },
            "coordinates": {
              "type": "object",
              "properties": {
                "latitude": { "type": "number" },
                "longitude": { "type": "number" }
              }
            }
          },
          "required": ["street", "city", "state", "zip"]
        },
        "propertyDetails": {
          "type": "object",
          "properties": {
            "yearBuilt": { "type": "integer" },
            "squareFootage": { "type": "integer" },
            "lotSize": { "type": "number" },
            "bedrooms": { "type": "integer" },
            "bathrooms": { "type": "number" },
            "floors": { "type": "integer" },
            "garage": { "type": "string", "enum": ["none", "attached", "detached", "carport"] },
            "parkingSpaces": { "type": "integer" },
            "roofType": { "type": "string" },
            "roofAge": { "type": "integer" },
            "hvacAge": { "type": "integer" },
            "pool": { "type": "boolean" },
            "sprinklers": { "type": "boolean" },
            "securitySystem": { "type": "boolean" },
            "smartHome": { "type": "boolean" }
          }
        },
        "utilities": {
          "type": "object",
          "properties": {
            "heatingType": { "type": "string" },
            "coolingType": { "type": "string" },
            "waterHeater": { "type": "string" },
            "waterHeaterAge": { "type": "integer" },
            "electricalAmps": { "type": "integer" },
            "gasAvailable": { "type": "boolean" }
          }
        },
        "access": {
          "type": "object",
          "properties": {
            "gateCode": { "type": "string" },
            "lockboxCode": { "type": "string" },
            "petPolicy": { "type": "string" },
            "specialInstructions": { "type": "string" },
            "parkingInstructions": { "type": "string" }
          }
        }
      }
    },
    "ownership": {
      "type": "object",
      "properties": {
        "ownerId": { "type": "string" },
        "ownerName": { "type": "string" },
        "ownerSince": { "type": "string", "format": "date" },
        "propertyValue": { "type": "number" },
        "zoning": { "type": "string" }
      }
    },
    "serviceHistory": {
      "type": "object",
      "properties": {
        "totalJobs": { "type": "integer" },
        "totalSpend": { "type": "number" },
        "lastServiceDate": { "type": "string", "format": "date" },
        "lastServiceType": { "type": "string" },
        "preferredProviderId": { "type": "string" },
        "jobsByCategory": {
          "type": "object",
          "properties": {
            "hvac": { "type": "integer" },
            "plumbing": { "type": "integer" },
            "electrical": { "type": "integer" },
            "cleaning": { "type": "integer" },
            "landscaping": { "type": "integer" },
            "pest_control": { "type": "integer" }
          }
        }
      }
    },
    "predictiveNeeds": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "serviceType": { "type": "string" },
          "predictedNeed": { "type": "string" },
          "confidence": { "type": "number" },
          "estimatedCost": { "type": "number" },
          "recommendedTiming": { "type": "string", "format": "date" },
          "urgency": { "type": "string", "enum": ["low", "medium", "high"] }
        }
      }
    },
    "customerProfile": {
      "type": "object",
      "properties": {
        "customerId": { "type": "string" },
        "preferences": {
          "type": "object",
          "properties": {
            "preferredVisitDays": { "type": "array", "items": { "type": "string" } },
            "preferredTimeSlots": { "type": "array", "items": { "type": "string" } },
            "communicationPreference": { "type": "string", "enum": ["email", "phone", "text", "app"] },
            "allowPetsPresent": { "type": "boolean" },
            "requireProofOfCompletion": { "type": "boolean" }
          }
        },
        "sensitivity": {
          "type": "object",
          "properties": {
            "priceSensitivity": { "type": "number", "minimum": 0, "maximum": 100 },
            "qualitySensitivity": { "type": "number", "minimum": 0, "maximum": 100 },
            "punctualityImportance": { "type": "number", "minimum": 0, "maximum": 100 }
          }
        }
      }
    },
    "relationships": {
      "type": "object",
      "properties": {
        "customers": {
          "type": "array",
          "items": { "$ref": "#/definitions/customerReference" }
        },
        "jobs": {
          "type": "array",
          "items": { "$ref": "#/definitions/jobReference" }
        },
        "serviceProviders": {
          "type": "array",
          "items": { "$ref": "#/definitions/providerReference" }
        }
      }
    },
    "metadata": {
      "type": "object",
      "properties": {
        "createdAt": { "type": "string", "format": "date-time" },
        "updatedAt": { "type": "string", "format": "date-time" },
        "version": { "type": "integer" },
        "lastServiceVisit": { "type": "string", "format": "date-time" },
        "managingAgent": { "type": "string" }
      }
    }
  },
  "definitions": {
    "customerReference": {
      "type": "object",
      "properties": {
        "customerId": { "type": "string" },
        "relationship": { "type": "string" },
        "primaryContact": { "type": "boolean" }
      }
    },
    "jobReference": {
      "type": "object",
      "properties": {
        "jobId": { "type": "string" },
        "serviceType": { "type": "string" },
        "date": { "type": "string", "format": "date" }
      }
    },
    "providerReference": {
      "type": "object",
      "properties": {
        "providerId": { "type": "string" },
        "visitCount": { "type": "integer" },
        "lastVisit": { "type": "string", "format": "date" }
      }
    }
  },
  "required": ["homeId", "name", "homeType", "attributes", "metadata"],
  "managingAgent": "Job Match Agent",
  "updateFrequency": "on-change",
  "indexes": ["homeId", "attributes.address.zip", "relationships.customers", "relationships.jobs"]
}
```

### 4.2 Service Provider Twin Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://rtmn.io/schemas/service-provider-twin/v1",
  "title": "Service Provider Twin",
  "description": "Digital representation of service providers with skills, availability, location, and performance metrics",
  "type": "object",
  "properties": {
    "providerId": {
      "type": "string",
      "format": "uuid",
      "description": "Unique identifier for the service provider"
    },
    "name": {
      "type": "object",
      "properties": {
        "first": { "type": "string" },
        "last": { "type": "string" },
        "display": { "type": "string" }
      }
    },
    "providerType": {
      "type": "string",
      "enum": ["individual", "technician", "contractor", "crew", "company"],
      "description": "Provider classification"
    },
    "attributes": {
      "type": "object",
      "properties": {
        "email": { "type": "string", "format": "email" },
        "phone": { "type": "string" },
        "company": { "type": "string" },
        "licenseNumber": { "type": "string" },
        "licenseTypes": { "type": "array", "items": { "type": "string" } },
        "insurancePolicy": { "type": "string" },
        "insuranceExpiry": { "type": "string", "format": "date" },
        "backgroundCheckDate": { "type": "string", "format": "date" },
        "backgroundCheckStatus": { "type": "string" },
        "hiredDate": { "type": "string", "format": "date" },
        " employmentType": {
          "type": "string",
          "enum": ["full_time", "part_time", "contractor", "seasonal"]
        }
      },
      "required": ["email", "phone"]
    },
    "location": {
      "type": "object",
      "properties": {
        "currentLatitude": { "type": "number" },
        "currentLongitude": { "type": "number" },
        "homeBase": {
          "type": "object",
          "properties": {
            "latitude": { "type": "number" },
            "longitude": { "type": "number" },
            "address": { "type": "string" }
          }
        },
        "homeZip": { "type": "string" },
        "serviceRadius": { "type": "number" },
        "lastLocationUpdate": { "type": "string", "format": "date-time" }
      }
    },
    "skills": {
      "type": "object",
      "properties": {
        "primaryTrade": { "type": "string" },
        "specializations": {
          "type": "array",
          "items": { "type": "string" }
        },
        "certifications": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "name": { "type": "string" },
              "issuer": { "type": "string" },
              "issueDate": { "type": "string", "format": "date" },
              "expiryDate": { "type": "string", "format": "date" }
            }
          }
        },
        "skillLevel": {
          "type": "object",
          "properties": {
            "hvac": { "type": "string", "enum": ["apprentice", "journeyman", "master", "expert"] },
            "plumbing": { "type": "string" },
            "electrical": { "type": "string" },
            "general": { "type": "string" }
          }
        },
        "equipment": {
          "type": "array",
          "items": { "type": "string" }
        }
      }
    },
    "availability": {
      "type": "object",
      "properties": {
        "status": {
          "type": "string",
          "enum": ["available", "on_job", "en_route", "off_duty", "unavailable"]
        },
        "currentJobId": { "type": "string" },
        "scheduledHours": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "dayOfWeek": { "type": "integer" },
              "startTime": { "type": "string" },
              "endTime": { "type": "string" },
              "breaks": { "type": "integer" }
            }
          }
        },
        "ptoBalance": { "type": "integer" },
        "maxJobsPerDay": { "type": "integer" },
        "maxTravelTime": { "type": "integer" }
      }
    },
    "performanceMetrics": {
      "type": "object",
      "properties": {
        "jobsCompleted": { "type": "integer" },
        "avgJobRating": { "type": "number" },
        "firstTimeFixRate": { "type": "number" },
        "onTimeArrivalRate": { "type": "number" },
        "customerRepeatRequestRate": { "type": "number" },
        "avgJobDuration": { "type": "number" },
        "quoteAccuracy": { "type": "number" },
        "upsellRate": { "type": "number" },
        "safetyIncidents": { "type": "integer" }
      }
    },
    "productivity": {
      "type": "object",
      "properties": {
        "dailyCapacity": { "type": "number" },
        "utilizationRate": { "type": "number" },
        "avgTravelTime": { "type": "number" },
        "jobsToday": { "type": "integer" },
        "jobsThisWeek": { "type": "integer" },
        "earningsThisMonth": { "type": "number" }
      }
    },
    "earnings": {
      "type": "object",
      "properties": {
        "payStructure": {
          "type": "string",
          "enum": ["hourly", "salary", "commission", "hybrid"]
        },
        "hourlyRate": { "type": "number" },
        "commissionPercent": { "type": "number" },
        "avgWeeklyEarnings": { "type": "number" },
        "ytdEarnings": { "type": "number" }
      }
    },
    "relationships": {
      "type": "object",
      "properties": {
        "jobs": {
          "type": "array",
          "items": { "$ref": "#/definitions/jobReference" }
        },
        "homes": {
          "type": "array",
          "items": { "$ref": "#/definitions/homeReference" }
        },
        "customers": {
          "type": "array",
          "items": { "$ref": "#/definitions/customerReference" }
        }
      }
    },
    "metadata": {
      "type": "object",
      "properties": {
        "createdAt": { "type": "string", "format": "date-time" },
        "updatedAt": { "type": "string", "format": "date-time" },
        "version": { "type": "integer" },
        "lastJobCompleted": { "type": "string", "format": "date-time" },
        "managingAgent": { "type": "string" }
      }
    }
  },
  "definitions": {
    "jobReference": {
      "type": "object",
      "properties": {
        "jobId": { "type": "string" },
        "serviceType": { "type": "string" },
        "date": { "type": "string", "format": "date" },
        "rating": { "type": "number" }
      }
    },
    "homeReference": {
      "type": "object",
      "properties": {
        "homeId": { "type": "string" },
        "visitCount": { "type": "integer" },
        "avgRating": { "type": "number" }
      }
    },
    "customerReference": {
      "type": "object",
      "properties": {
        "customerId": { "type": "string" },
        "preferredStatus": { "type": "string" },
        "totalJobs": { "type": "integer" }
      }
    }
  },
  "required": ["providerId", "name", "providerType", "attributes", "metadata"],
  "managingAgent": "Routing Agent",
  "updateFrequency": "real-time",
  "indexes": ["providerId", "attributes.primaryTrade", "location.homeZip", "availability.status", "performanceMetrics.avgJobRating"]
}
```

### 4.3 Job Twin Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://rtmn.io/schemas/job-twin/v1",
  "title": "Job Twin",
  "description": "Digital representation of service jobs with scheduling, pricing, and quality tracking",
  "type": "object",
  "properties": {
    "jobId": {
      "type": "string",
      "format": "uuid",
      "description": "Unique identifier for the job"
    },
    "jobType": {
      "type": "string",
      "enum": ["service", "installation", "repair", "maintenance", "inspection", "emergency"],
      "description": "Job classification"
    },
    "trade": {
      "type": "string",
      "enum": ["hvac", "plumbing", "electrical", "appliance", "cleaning", "landscaping", "pest_control", "general"],
      "description": "Primary trade category"
    },
    "status": {
      "type": "string",
      "enum": ["quote_requested", "quote_sent", "quote_accepted", "scheduled", "en_route", "in_progress", "completed", "invoiced", "paid", "cancelled"],
      "description": "Current job status"
    },
    "attributes": {
      "type": "object",
      "properties": {
        "description": { "type": "string" },
        "urgency": {
          "type": "string",
          "enum": ["low", "normal", "high", "emergency"]
        },
        "estimatedDuration": { "type": "integer" },
        "requiredSkills": { "type": "array", "items": { "type": "string" } },
        "requiredEquipment": { "type": "array", "items": { "type": "string" } },
        "permitsRequired": { "type": "boolean" },
        "isInsuranceJob": { "type": "boolean" },
        "insuranceClaimNumber": { "type": "string" }
      }
    },
    "home": {
      "type": "object",
      "properties": {
        "homeId": { "type": "string" },
        "address": { "type": "string" },
        "coordinates": {
          "type": "object",
          "properties": {
            "latitude": { "type": "number" },
            "longitude": { "type": "number" }
          }
        },
        "accessInstructions": { "type": "string" }
      },
      "required": ["homeId"]
    },
    "customer": {
      "type": "object",
      "properties": {
        "customerId": { "type": "string" },
        "name": { "type": "string" },
        "phone": { "type": "string" },
        "email": { "type": "string" }
      }
    },
    "quote": {
      "type": "object",
      "properties": {
        "estimatedCost": { "type": "number" },
        "costRange": {
          "type": "object",
          "properties": {
            "min": { "type": "number" },
            "max": { "type": "number" }
          }
        },
        "lineItems": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "description": { "type": "string" },
              "quantity": { "type": "number" },
              "unitPrice": { "type": "number" },
              "totalPrice": { "type": "number" }
            }
          }
        },
        "laborCost": { "type": "number" },
        "partsCost": { "type": "number" },
        "discount": { "type": "number" },
        "tax": { "type": "number" },
        "totalPrice": { "type": "number" },
        "quoteDate": { "type": "string", "format": "date" },
        "quoteExpiry": { "type": "string", "format": "date" },
        "validUntil": { "type": "string", "format": "date" }
      }
    },
    "schedule": {
      "type": "object",
      "properties": {
        "requestedDate": { "type": "string", "format": "date" },
        "requestedTimeSlot": { "type": "string" },
        "scheduledDate": { "type": "string", "format": "date" },
        "scheduledTimeSlot": { "type": "string" },
        "windowStart": { "type": "string", "format": "time" },
        "windowEnd": { "type": "string", "format": "time" },
        "arrivalTime": { "type": "string", "format": "date-time" },
        "completionTime": { "type": "string", "format": "date-time" },
        "travelTimeMinutes": { "type": "integer" }
      }
    },
    "assignedProvider": {
      "type": "object",
      "properties": {
        "providerId": { "type": "string" },
        "providerName": { "type": "string" },
        "assignedAt": { "type": "string", "format": "date-time" },
        "assignmentReason": { "type": "string" }
      }
    },
    "workPerformed": {
      "type": "object",
      "properties": {
        "actualDuration": { "type": "integer" },
        "workDetails": { "type": "string" },
        "partsUsed": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "partNumber": { "type": "string" },
              "description": { "type": "string" },
              "quantity": { "type": "number" },
              "cost": { "type": "number" }
            }
          }
        },
        "photos": {
          "type": "array",
          "items": { "type": "string", "format": "uri" }
        },
        "diagnosticFindings": { "type": "string" },
        "recommendations": {
          "type": "array",
          "items": { "type": "string" }
        }
      }
    },
    "invoicing": {
      "type": "object",
      "properties": {
        "invoiceNumber": { "type": "string" },
        "invoiceDate": { "type": "string", "format": "date" },
        "dueDate": { "type": "string", "format": "date" },
        "laborCost": { "type": "number" },
        "partsCost": { "type": "number" },
        "tripCharge": { "type": "number" },
        "discount": { "type": "number" },
        "tax": { "type": "number" },
        "totalAmount": { "type": "number" },
        "amountPaid": { "type": "number" },
        "paymentMethod": { "type": "string" },
        "paymentDate": { "type": "string", "format": "date" }
      }
    },
    "qualityMetrics": {
      "type": "object",
      "properties": {
        "customerRating": { "type": "number" },
        "customerFeedback": { "type": "string" },
        "firstTimeFix": { "type": "boolean" },
        "callbackRequired": { "type": "boolean" },
        "warrantyClaim": { "type": "boolean" }
      }
    },
    "relationships": {
      "type": "object",
      "properties": {
        "home": {
          "type": "object",
          "properties": {
            "homeId": { "type": "string" }
          }
        },
        "customer": {
          "type": "object",
          "properties": {
            "customerId": { "type": "string" }
          }
        },
        "provider": {
          "type": "object",
          "properties": {
            "providerId": { "type": "string" }
          }
        }
      }
    },
    "metadata": {
      "type": "object",
      "properties": {
        "createdAt": { "type": "string", "format": "date-time" },
        "updatedAt": { "type": "string", "format": "date-time" },
        "version": { "type": "integer" },
        "managingAgent": { "type": "string" }
      }
    }
  },
  "required": ["jobId", "jobType", "trade", "status", "home", "customer", "metadata"],
  "managingAgent": "Quote Agent",
  "updateFrequency": "real-time",
  "indexes": ["jobId", "trade", "status", "schedule.scheduledDate", "assignedProvider.providerId", "home.homeId"]
}
```

### 4.4 Customer Twin Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://rtmn.io/schemas/customer-twin/v1",
  "title": "Customer Twin",
  "description": "Digital representation of customers with preferences, payment history, and lifetime value metrics",
  "type": "object",
  "properties": {
    "customerId": {
      "type": "string",
      "format": "uuid",
      "description": "Unique identifier for the customer"
    },
    "name": {
      "type": "object",
      "properties": {
        "first": { "type": "string" },
        "middle": { "type": "string" },
        "last": { "type": "string" },
        "prefix": { "type": "string" },
        "suffix": { "type": "string" }
      }
    },
    "customerType": {
      "type": "string",
      "enum": ["residential", "commercial", "government", "multi_family", "property_management"],
      "description": "Customer classification"
    },
    "attributes": {
      "type": "object",
      "properties": {
        "email": { "type": "string", "format": "email" },
        "phone": { "type": "string" },
        "phoneAlt": { "type": "string" },
        "preferredContact": {
          "type": "string",
          "enum": ["email", "phone", "text", "app"]
        },
        "marketingOptIn": { "type": "boolean" },
        "emailOptIn": { "type": "boolean" },
        "smsOptIn": { "type": "boolean" },
        "preferredLanguage": { "type": "string" },
        "notes": { "type": "string" },
        "tags": { "type": "array", "items": { "type": "string" } }
      },
      "required": ["email", "phone"]
    },
    "addresses": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "addressType": {
            "type": "string",
            "enum": ["service", "billing", "mailing"]
          },
          "isPrimary": { "type": "boolean" },
          "homeId": { "type": "string" },
          "street": { "type": "string" },
          "unit": { "type": "string" },
          "city": { "type": "string" },
          "state": { "type": "string" },
          "zip": { "type": "string" },
          "coordinates": {
            "type": "object",
            "properties": {
              "latitude": { "type": "number" },
              "longitude": { "type": "number" }
            }
          }
        }
      }
    },
    "paymentInfo": {
      "type": "object",
      "properties": {
        "defaultPaymentMethod": {
          "type": "string",
          "enum": ["card", "ach", "check", "cash", "invoice"]
        },
        "cardLast4": { "type": "string" },
        "cardBrand": { "type": "string" },
        "achAccountLast4": { "type": "string" },
        "creditLimit": { "type": "number" },
        "currentBalance": { "type": "number" },
        "netTerms": { "type": "string" }
      }
    },
    "servicePreferences": {
      "type": "object",
      "properties": {
        "preferredDays": { "type": "array", "items": { "type": "string" } },
        "preferredTimeSlots": {
          "type": "array",
          "items": { "type": "string" }
        },
        "preferredProviders": {
          "type": "array",
          "items": { "type": "string" }
        },
        "blockedProviders": {
          "type": "array",
          "items": { "type": "string" }
        },
        "allowPets": { "type": "boolean" },
        "requireProofOfCompletion": { "type": "boolean" },
        "photoDocumentationRequired": { "type": "boolean" }
      }
    },
    "engagementHistory": {
      "type": "object",
      "properties": {
        "customerSince": { "type": "string", "format": "date" },
        "totalJobs": { "type": "integer" },
        "jobsThisYear": { "type": "integer" },
        "lastJobDate": { "type": "string", "format": "date" },
        "lastJobType": { "type": "string" },
        "totalSpend": { "type": "number" },
        "spendThisYear": { "type": "number" },
        "avgJobValue": { "type": "number" }
      }
    },
    "lifetimeValue": {
      "type": "object",
      "properties": {
        "ltv": { "type": "number" },
        "ltvPrediction": { "type": "number" },
        "ltvConfidence": { "type": "number" },
        "churnRisk": {
          "type": "string",
          "enum": ["low", "medium", "high"]
        },
        "npsScore": { "type": "number" }
      }
    },
    "communicationHistory": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "date": { "type": "string", "format": "date-time" },
          "type": { "type": "string" },
          "channel": { "type": "string" },
          "subject": { "type": "string" },
          "outcome": { "type": "string" }
        }
      }
    },
    "reviews": {
      "type": "object",
      "properties": {
        "avgRating": { "type": "number" },
        "totalReviews": { "type": "integer" },
        "recentRatings": {
          "type": "array",
          "items": { "type": "number" }
        },
        "feedbackThemes": {
          "type": "array",
          "items": { "type": "string" }
        }
      }
    },
    "relationships": {
      "type": "object",
      "properties": {
        "homes": {
          "type": "array",
          "items": { "$ref": "#/definitions/homeReference" }
        },
        "jobs": {
          "type": "array",
          "items": { "$ref": "#/definitions/jobReference" }
        },
        "serviceProviders": {
          "type": "array",
          "items": { "$ref": "#/definitions/providerReference" }
        }
      }
    },
    "metadata": {
      "type": "object",
      "properties": {
        "createdAt": { "type": "string", "format": "date-time" },
        "updatedAt": { "type": "string", "format": "date-time" },
        "version": { "type": "integer" },
        "lastInteraction": { "type": "string", "format": "date-time" },
        "managingAgent": { "type": "string" }
      }
    }
  },
  "definitions": {
    "homeReference": {
      "type": "object",
      "properties": {
        "homeId": { "type": "string" },
        "isPrimary": { "type": "boolean" },
        "relationship": { "type": "string" }
      }
    },
    "jobReference": {
      "type": "object",
      "properties": {
        "jobId": { "type": "string" },
        "trade": { "type": "string" },
        "date": { "type": "string", "format": "date" },
        "amount": { "type": "number" },
        "rating": { "type": "number" }
      }
    },
    "providerReference": {
      "type": "object",
      "properties": {
        "providerId": { "type": "string" },
        "preferredStatus": { "type": "string" },
        "visitCount": { "type": "integer" }
      }
    }
  },
  "required": ["customerId", "name", "customerType", "attributes", "metadata"],
  "managingAgent": "Quality Agent",
  "updateFrequency": "real-time",
  "indexes": ["customerId", "attributes.email", "relationships.homes", "lifetimeValue.ltv"]
}
```

---

## Integration Flows

### 5.1 REZ Staff ↔ Service Provider Twin Integration Flow

**Flow ID:** HOME-FLOW-001
**Priority:** Critical
**Description:** Real-time workforce availability, location tracking, and skill-based job matching

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              REZ Staff ↔ Service Provider Twin Flow                        │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────┐     ┌─────────────┐     ┌─────────────┐
    │  REZ Staff      │     │    Kafka    │     │  Service    │
    │  API :7602      │     │   Broker    │     │  Provider   │
    └────────┬────────┘     └──────┬──────┘     │    Twin     │
             │                      │             └──────┬──────┘
             │                      │                      │
             │ 1. Provider Check-in│                      │
             │    (Location Update) │                      │
             │─────────────────────>│                      │
             │                      │                      │
             │                      │ 2. Publish Event     │
             │                      │───────────────────────>│
             │                      │                      │
             │                      │                      │ 3. Update Twin
             │                      │                      │    (Routing Agent)
             │                      │                      │◄────
             │                      │                      │
             │ 3. Query Available    │                      │
             │    Providers          │                      │
             │──────────────────────────────────────────────>│
             │                      │                      │
             │ 4. Matching Results   │                      │
             │<──────────────────────────────────────────────│
             │                      │                      │
             │ 5. Assign Job         │                      │
             │───────────────────────>│                      │
             │                      │                      │
             │                      │ 6. Update Provider    │
             │                      │    Availability       │
             │                      │───────────────────────>│
             │                      │                      │
             │                      │                      │ 7. Update Twin
             │                      │                      │    (Job Match Agent)
             │                      │                      │◄────
             │                      │                      │
```

**API Endpoints:**

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/v1/providers` | Register provider | ProviderCreate | Provider |
| GET | `/api/v1/providers/{providerId}` | Get provider twin | - | ProviderTwin |
| PUT | `/api/v1/providers/{providerId}/location` | Update location | LocationUpdate | Ack |
| PUT | `/api/v1/providers/{providerId}/availability` | Update availability | AvailabilityUpdate | Ack |
| GET | `/api/v1/providers/available` | Find available providers | Filters | Provider[] |
| POST | `/api/v1/providers/match` | Match providers to job | MatchRequest | MatchResult[] |
| WS | `/ws/providers/{providerId}/updates` | Real-time updates | - | Stream<Update> |

**Request/Response Examples:**

```json
// POST /api/v1/providers/match
{
  "jobId": "job-uuid",
  "requiredSkills": ["hvac_repair", "refrigerant_certified"],
  "requiredTrade": "hvac",
  "location": {
    "latitude": 33.9425,
    "longitude": -118.4081
  },
  "scheduledDate": "2026-06-15",
  "timeWindow": {
    "start": "09:00",
    "end": "12:00"
  },
  "maxTravelTime": 30,
  "topMatches": 5
}

// Response
{
  "matches": [
    {
      "providerId": "provider-uuid",
      "providerName": "John Martinez",
      "matchScore": 0.94,
      "factors": {
        "skillMatch": 1.0,
        "locationProximity": 0.87,
        "availabilityFit": 0.95,
        "performanceRating": 0.92,
        "customerAffiinity": 0.88
      },
      "currentLocation": {
        "latitude": 33.9651,
        "longitude": -118.3892,
        "distance": 8.2,
        "estimatedTravelTime": 14
      },
      "currentStatus": "available",
      "nextAvailable": "2026-06-15T10:00:00Z",
      "recommendedTime": "10:30"
    }
  ],
  "optimizationSuggestion": "Assign to John Martinez for 10:30 AM - estimated arrival within window with highest customer satisfaction probability"
}
```

### 5.2 REZ POS ↔ Job/Service Provider Twin Integration Flow

**Flow ID:** HOME-FLOW-002
**Priority:** High
**Description:** Payment processing and job cost tracking synchronization

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/jobs/{jobId}/invoice` | Create and send invoice |
| POST | `/api/v1/jobs/{jobId}/payment` | Process payment |
| GET | `/api/v1/jobs/{jobId}/cost-breakdown` | Get job cost details |
| PUT | `/api/v1/jobs/{jobId}/parts` | Update parts used |
| GET | `/api/v1/providers/{providerId}/earnings` | Get provider earnings |

### 5.3 REZ QR Cloud ↔ Job/Customer Twin Integration Flow

**Flow ID:** HOME-FLOW-003
**Priority:** High
**Description:** Customer engagement, feedback collection, and job completion tracking

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/qr/schedule` | Generate QR code for scheduled job |
| POST | `/api/v1/qr/verify` | Verify customer check-in |
| POST | `/api/v1/jobs/{jobId}/feedback` | Submit customer feedback |
| GET | `/api/v1/customers/{customerId}/qr-history` | Get QR scan history |
| WS | `/ws/jobs/{jobId}/completion` | Real-time completion updates |

### 5.4 REZ Business Copilot ↔ All Twins Integration Flow

**Flow ID:** HOME-FLOW-004
**Priority:** Medium
**Description:** AI-powered analytics, predictions, and recommendations

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/copilot/query` | Natural language query |
| GET | `/api/v1/copilot/recommendations` | Get actionable recommendations |
| POST | `/api/v1/copilot/predict` | Predictive analytics |
| GET | `/api/v1/copilot/opportunities` | Identify business opportunities |

---

## Agent Definitions

### 6.1 Job Match Agent

**Agent ID:** HOME-AGENT-001
**Primary Twin:** Job Twin
**Supporting Twins:** Service Provider Twin, Home Twin, Customer Twin
**Port:** 8209

**Capabilities:**
- Skill-based provider matching
- Customer-provider affinity scoring
- Multi-criteria optimization (distance, skills, ratings, availability)
- Emergency job escalation
- Provider recommendation explanations
- Match quality monitoring and improvement

**Actions:**
```
Job Match Agent Actions:
├── match_providers(jobId, criteria)
├── optimize_assignments(date, constraints)
├── predict_match_success(jobId, providerId)
├── explain_match(jobId, providerId)
├── suggest_reassignments(jobId, reason)
└── generate_match_report(timeRange)
```

**Tool Definitions:**
```json
{
  "name": "job_match_agent",
  "version": "1.0.0",
  "tools": [
    {
      "name": "match_providers",
      "description": "Find optimal service provider matches for a job",
      "parameters": {
        "jobId": { "type": "string", "required": true },
        "requiredSkills": { "type": "array", "items": { "type": "string" } },
        "location": { "type": "object", "required": true },
        "timeWindow": { "type": "object" },
        "maxResults": { "type": "integer", "default": 5 }
      }
    },
    {
      "name": "optimize_assignments",
      "description": "Optimize daily job assignments across all providers",
      "parameters": {
        "date": { "type": "string", "format": "date", "required": true },
        "maximizeUtilization": { "type": "boolean", "default": true },
        "balanceWorkload": { "type": "boolean", "default": true }
      }
    },
    {
      "name": "predict_match_success",
      "description": "Predict probability of successful job completion with provider",
      "parameters": {
        "jobId": { "type": "string", "required": true },
        "providerId": { "type": "string", "required": true }
      }
    }
  ]
}
```

### 6.2 Routing Agent

**Agent ID:** HOME-AGENT-002
**Primary Twin:** Service Provider Twin
**Supporting Twins:** Job Twin, Home Twin
**Port:** 8210

**Capabilities:**
- Real-time location tracking and geofencing
- Route optimization and travel time prediction
- Dynamic re-routing for emergencies
- Travel time estimation with traffic
- Multi-stop optimization
- Provider navigation assistance

**Actions:**
```
Routing Agent Actions:
├── optimize_route(providerId, date)
├── estimate_travel(jobId, providerId)
├── reroute_for_emergency(providerId, emergencyJobId)
├── calculate_eta(jobId, providerId)
├── geo_fence_check(providerId, jobLocation)
└── generate_route_report(providerId, date)
```

### 6.3 Quote Agent

**Agent ID:** HOME-AGENT-003
**Primary Twin:** Job Twin
**Supporting Twins:** Home Twin, Service Provider Twin
**Port:** 8211

**Capabilities:**
- Dynamic pricing based on multiple factors
- Historical data analysis for estimates
- Parts pricing with supplier integration
- Labor time estimation
- Quote comparison and benchmarking
- Upsell identification
- Warranty coverage calculation

**Actions:**
```
Quote Agent Actions:
├── generate_quote(jobId, options)
├── validate_quote(quoteId)
├── compare_quotes(jobId, quoteIds)
├── identify_upsells(homeId, jobType)
├── calculate_parts_cost(jobId, partsList)
├── estimate_labor(jobType, complexity, trade)
└── generate_quote_report(timeRange)
```

### 6.4 Quality Agent

**Agent ID:** HOME-AGENT-004
**Primary Twin:** Customer Twin
**Supporting Twins:** Job Twin, Service Provider Twin, Home Twin
**Port:** 8212

**Capabilities:**
- Customer satisfaction tracking
- Provider performance monitoring
- Quality issue detection
- Warranty claim processing
- Customer retention analysis
- Service quality benchmarking
- Feedback pattern analysis

**Actions:**
```
Quality Agent Actions:
├── track_satisfaction(customerId)
├── detect_quality_issues(jobId)
├── analyze_feedback(feedbackData)
├── predict_retention(customerId)
├── benchmark_provider(providerId)
├── identify_at_risk_customers(criteria)
└── generate_quality_report(period)
```

### 6.5 CRM Agent

**Agent ID:** HOME-AGENT-005
**Primary Twin:** Customer Twin
**Supporting Twins:** Job Twin, Home Twin, Service Provider Twin
**Port:** 8213

**Capabilities:**
- Customer profile management and enrichment
- Engagement campaign execution
- Customer segmentation and targeting
- Retention prediction and intervention
- Loyalty program management
- Service upsell identification
- Communication automation

**Actions:**
```
CRM Agent Actions:
├── manage_customer_profile(customerId)
├── execute_campaign(campaignId, targetSegment)
├── segment_customers(criteria)
├── predict_churn(customerId)
├── manage_loyalty(customerId)
├── identify_upsells(customerId)
├── automate_communications(trigger, customerId)
└── generate_crm_report(period)
```

**Tool Definitions:**
```json
{
  "name": "crm_agent",
  "version": "1.0.0",
  "tools": [
    {
      "name": "execute_campaign",
      "description": "Launch targeted customer engagement campaigns",
      "parameters": {
        "campaignType": { "type": "string", "required": true },
        "targetSegment": { "type": "object", "required": true },
        "channels": { "type": "array", "items": { "type": "string" } }
      }
    },
    {
      "name": "predict_churn",
      "description": "Identify customers at risk of churn",
      "parameters": {
        "customerId": { "type": "string", "required": true },
        "horizonDays": { "type": "integer", "default": 30 }
      }
    }
  ]
}
```

---

## Business Copilot Queries

### 7.1 Workforce Management Queries

```sql
-- Query 1: Daily workforce optimization
RTMN.COPILOT.QUERY {
  question: "Given today's 47 scheduled jobs, which service providers should handle 
             which jobs to maximize efficiency and customer satisfaction?"
  
  context: {
    products: ["REZ Staff", "REZ POS"],
    twins: ["ServiceProviderTwin", "JobTwin", "CustomerTwin"],
    date: "2026-06-12",
    jobCount: 47,
    optimizationGoals: ["efficiency", "satisfaction", "utilization"]
  }
  
  response: {
    optimizedSchedule: {
      totalProviders: 12,
      avgUtilization: 87.5,
      avgTravelTime: 18,
      avgCustomerRating: 4.7,
      estimatedRevenue: 28400
    },
    assignments: [
      {
        providerId: "prov-123",
        providerName: "John Martinez",
        jobsAssigned: 5,
        route: ["job-a", "job-b", "job-c", "job-d", "job-e"],
        totalTravelTime: 42,
        estimatedRevenue: 2450,
        skillMatchScore: 0.96
      }
    ],
    recommendations: [
      "Move job-xyz from 2PM to 10AM slot for better route efficiency",
      "Assign hvac_job_456 to Sarah Chen for highest customer affinity",
      "Consider splitting larger job for dual-technician approach"
    ]
  }
}

-- Query 2: Service provider performance coaching needs
RTMN.COPILOT.QUERY {
  question: "Which service providers have shown declining performance metrics 
             over the past 30 days and need coaching attention?"
  
  context: {
    products: ["REZ Staff"],
    twins: ["ServiceProviderTwin", "JobTwin"],
    timeRange: "last_30_days",
    metrics: ["rating", "first_time_fix", "on_time"]
  }
  
  response: {
    providersNeedingAttention: [
      {
        providerId: "prov-456",
        name: "Mike Johnson",
        currentRating: 4.1,
        ratingTrend: -0.4,
        firstTimeFixRate: 0.72,
        fixRateTrend: -8,
        issues: [
          "Complex repairs taking longer than estimated",
          "Communication with customers could improve",
          "Last 3 negative reviews all mention same theme"
        ],
        recommendedAction: "Pair with top performer for shadowing session",
        estimatedImprovement: "+0.3 rating points after coaching"
      }
    ],
    trainingRecommendations: [
      "Schedule Mike Johnson for advanced troubleshooting workshop",
      "Create quick reference guide for complex hvac diagnosis"
    ]
  }
}
```

### 7.2 Quote and Pricing Queries

```sql
-- Query 3: Quote accuracy and optimization
RTMN.COPILOT.QUERY {
  question: "What is our average quote accuracy for HVAC repair jobs, 
             and where are we most frequently over or under pricing?"
  
  context: {
    products: ["REZ POS", "REZ Staff"],
    twins: ["JobTwin", "HomeTwin"],
    timeRange: "last_90_days",
    trade: "hvac"
  }
  
  response: {
    overallAccuracy: {
      avgVariance: 8.5,
      accuracyRate: 91.2,
      overQuote: "42% of jobs",
      underQuote: "18% of jobs",
      exactQuote: "40% of jobs"
    },
    varianceByJobType: [
      {
        jobType: "ac_repair",
        avgVariance: 6.2,
        accuracyRate: 94.5,
        notes: "Pricing is well calibrated"
      },
      {
        jobType: "compressor_replacement",
        avgVariance: 18.5,
        accuracyRate: 78.2,
        notes: "Under-quoting by avg $185 - adjust pricing model"
      }
    ],
    recommendations: [
      "Increase compressor replacement quotes by 15%",
      "Parts cost for capacitor replacements trending up - update base pricing",
      "Consider flat-rate pricing for common repairs to improve customer confidence"
    ],
    estimatedRevenueImprovement: 12500
  }
}
```

### 7.3 Customer Retention Queries

```sql
-- Query 4: Customer lifetime value and retention
RTMN.COPILOT.QUERY {
  question: "Which customers are at high risk of churning based on recent 
             engagement patterns, and what retention actions should we take?"
  
  context: {
    products: ["REZ Staff", "REZ POS", "REZ QR Cloud"],
    twins: ["CustomerTwin", "JobTwin", "HomeTwin"],
    churnCriteria: "no_service_180_days",
    segment: "high_value"
  }
  
  response: {
    atRiskCustomers: [
      {
        customerId: "cust-789",
        name: "Williams Family",
        ltv: 4850,
        lastService: "2025-11-15",
        daysSinceLastService: 210,
        churnRisk: "high",
       流失Reasons: ["Competing quote received", "No recent communication"],
        recommendedActions: [
          "Priority callback within 24 hours",
          "Offer $50 credit on next service",
          "Schedule preventive maintenance reminder"
        ],
        estimatedRetentionValue: 2800
      }
    ],
    totalAtRiskValue: 45600,
    recommendedInvestment: 4500,
    expectedRetentionRate: 0.72,
    expectedROI: 6.2
  }
}
```

---

## Economic Integration

### 8.1 Revenue Model

#### 8.1.1 Platform Revenue Streams

| Revenue Stream | Description | Pricing Model | Target Revenue % |
|---------------|-------------|----------------|-------------------|
| Subscription Fees | REZ Staff platform access | Per provider/month ($75-200) | 40% |
| Transaction Fees | REZ POS payment processing | 0.3% + $0.10 per transaction | 25% |
| QR Engagement | REZ QR Cloud usage | $0.05-0.15 per scan | 15% |
| Business Intelligence | REZ Business Copilot analytics | Per business/month ($100-500) | 10% |
| Premium Matching | AI-powered job matching | Per successful match ($5-25) | 10% |

#### 8.1.2 Twin Economic Value

| Twin Type | Value Driver | Economic Model |
|-----------|--------------|----------------|
| Home Twin | Predictive maintenance | Service revenue from predicted needs |
| Service Provider Twin | Matching efficiency | Labor optimization savings |
| Job Twin | Quote accuracy | Margin improvement on accurate quotes |
| Customer Twin | Retention | LTV preservation from churn prevention |

### 8.2 Cost Structure

| Cost Category | Monthly Baseline | Scaling Factor |
|---------------|------------------|----------------|
| Platform Infrastructure | $25,000 | Per business |
| AI/ML Processing | $20,000 | Per 1000 jobs |
| Geospatial Services | $10,000 | Per 10K location updates |
| Customer Communication | $8,000 | Per 10K messages |
| Support | $30,000 | Flat + per-customer |

### 8.3 Unit Economics

| Metric | Current | Target (6 months) |
|--------|---------|-------------------|
| CAC (Business) | $3,500 | $2,200 |
| CAC (Provider) | $150 | $95 |
| LTV (Business) | $28,000 | $45,000 |
| LTV:CAC Ratio | 8:1 | 20:1 |
| Quote Accuracy | 87% | 95% |
| First-Time Fix Rate | 78% | 90% |
| Provider Retention | 82% | 92% |

### 8.4 Key Performance Indicators

| KPI | Current | Target | Measurement |
|-----|---------|--------|-------------|
| Jobs Completed | 12,000/mo | 35,000/mo | Monthly |
| Match Success Rate | 89% | 97% | Weekly |
| Avg Job Rating | 4.4 | 4.8 | Weekly |
| Quote Acceptance Rate | 72% | 85% | Weekly |
| Provider Utilization | 68% | 82% | Daily |
| Customer Retention | 78% | 90% | Quarterly |
| Revenue per Provider | $8,500/mo | $12,000/mo | Monthly |

---

## 6-Week Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)

#### Week 1: Infrastructure & Core Setup

| Task | Owner | Deliverable | Dependencies |
|------|-------|-------------|--------------|
| Set up Kafka cluster (3-node) | Platform Team | Running Kafka with 50K msg/sec | Cloud infrastructure |
| Deploy Twin GraphQL Gateway | Backend Team | GraphQL endpoint at :8103 | Kafka cluster |
| Create Twin database schemas | Data Team | Postgres schemas for all 4 twins | None |
| Set up geospatial indexing (PostGIS) | Data Team | Geospatial queries | Database schemas |
| Configure API Gateway | Backend Team | OAuth 2.0 / JWT authentication | Identity provider |
| Create dev/staging environments | DevOps | Fully isolated environments | Cloud infrastructure |
| Set up monitoring (Datadog) | DevOps | Dashboard with 40 metrics | Infrastructure |

**Week 1 Milestone:** Core infrastructure operational with geospatial capabilities

#### Week 2: Twin Implementation

| Task | Owner | Deliverable | Dependencies |
|------|-------|-------------|--------------|
| Implement Home Twin | Data Team | Full twin with property data | Week 1 |
| Implement Service Provider Twin | Data Team | Full twin with skills/location | Week 1 |
| Implement Job Twin | Data Team | Full twin with scheduling | Week 1 |
| Implement Customer Twin | Data Team | Full twin with preferences | Week 1 |
| Build twin synchronization | Backend Team | Event-driven sync between twins | Twin implementations |
| Create twin federation layer | Backend Team | Unified GraphQL queries | Twin implementations |
| Implement geospatial queries | Data Team | Distance and routing queries | Twin implementations |

**Week 2 Milestone:** All 4 twins operational and federated with geospatial support

### Phase 2: Product Integration (Weeks 3-4)

#### Week 3: Core Product Connections

| Task | Owner | Deliverable | Dependencies |
|------|-------|-------------|--------------|
| REZ Staff ↔ Service Provider Twin | Integration Team | Provider sync pipeline | Phase 1 |
| REZ Staff ↔ Job Twin | Integration Team | Job scheduling sync | Phase 1 |
| REZ Staff ↔ Home Twin | Integration Team | Property data access | Phase 1 |
| Build webhook system | Backend Team | 50+ webhook endpoints | API Gateway |
| Implement WebSocket connections | Backend Team | Real-time subscriptions | Twin implementations |
| Create sync monitoring | DevOps | Data quality dashboard | All integrations |

**Week 3 Milestone:** Core product-twin connections active

#### Week 4: Advanced Integration

| Task | Owner | Deliverable | Dependencies |
|------|-------|-------------|--------------|
| REZ POS ↔ Job Twin | Integration Team | Invoice/payment sync | Week 3 |
| REZ POS ↔ Service Provider Twin | Integration Team | Earnings tracking | Week 3 |
| REZ QR Cloud ↔ Job Twin | Integration Team | Completion verification | Week 3 |
| REZ QR Cloud ↔ Customer Twin | Integration Team | Feedback collection | Week 3 |
| Build matching algorithm | AI Team | Skill-based provider matching | Twin implementations |
| Create routing optimization | AI Team | Route optimization engine | Twin implementations |

**Week 4 Milestone:** All products connected with matching and routing

### Phase 3: Agent & Copilot (Weeks 5-6)

#### Week 5: Agent Deployment

| Task | Owner | Deliverable | Dependencies |
|------|-------|-------------|--------------|
| Deploy Job Match Agent | AI Team | Agent at :8209 with full capabilities | Phase 2 |
| Deploy Routing Agent | AI Team | Agent at :8210 with full capabilities | Phase 2 |
| Deploy Quote Agent | AI Team | Agent at :8211 with full capabilities | Phase 2 |
| Deploy Quality Agent | AI Team | Agent at :8212 with full capabilities | Phase 2 |
| Build agent orchestration layer | AI Team | Multi-agent coordination system | All agents |
| Implement agent monitoring | DevOps | Agent performance tracking | All agents |
| Build quote generation | AI Team | AI-powered quote engine | Job/Provider Twins |

**Week 5 Milestone:** All 4 agents operational and orchestrated

#### Week 6: Business Copilot & Launch

| Task | Owner | Deliverable | Dependencies |
|------|-------|-------------|--------------|
| Implement Natural Language Interface | AI Team | NL query processing layer | Phase 2 |
| Build query templates library | Analytics Team | 50+ pre-built queries | Phase 2 |
| Create response generation | AI Team | Contextual answer synthesis | NL interface |
| Implement recommendations engine | AI Team | Actionable recommendations | All agents |
| End-to-end integration testing | QA Team | 100% test coverage | Phase 1-3 |
| Performance optimization | Backend Team | P99 latency < 100ms | Load testing |
| Documentation & training | All Teams | Full API docs and runbooks | All components |
| Launch readiness review | Leadership | Go/no-go decision | All deliverables |

**Week 6 Milestone:** Home Services OS ready for production

### Implementation Timeline Summary

```
Week 1: Infrastructure Setup
       ├── Kafka Cluster ✓
       ├── GraphQL Gateway ✓
       ├── PostGIS Setup ✓
       ├── Database Schemas ✓
       └── Monitoring ✓

Week 2: Twin Implementation
       ├── Home Twin ✓
       ├── Service Provider Twin ✓
       ├── Job Twin ✓
       └── Customer Twin ✓

Week 3: Core Product Integration
       ├── REZ Staff ↔ Service Provider Twin ✓
       ├── REZ Staff ↔ Job Twin ✓
       ├── REZ Staff ↔ Home Twin ✓
       └── Real-time Subscriptions ✓

Week 4: Advanced Integration
       ├── REZ POS ↔ Job/Provider Twins ✓
       ├── REZ QR Cloud ↔ Twins ✓
       ├── Matching Algorithm ✓
       └── Routing Optimization ✓

Week 5: Agent Deployment
       ├── Job Match Agent ✓
       ├── Routing Agent ✓
       ├── Quote Agent ✓
       └── Quality Agent ✓

Week 6: Business Copilot & Launch
       ├── NL Interface ✓
       ├── Query Library ✓
       ├── Recommendations Engine ✓
       └── Production Launch ✓
```

### Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Geospatial query performance | High | Medium | Pre-computed distance caches |
| Provider location accuracy | Medium | High | Multi-source location verification |
| Matching algorithm bias | Low | High | Regular fairness audits |
| Customer data quality | High | Medium | Progressive data enrichment |
| Seasonal demand spikes | Medium | Medium | Auto-scaling infrastructure |

---

## Appendix

### A. API Rate Limits

| Endpoint Pattern | Rate Limit | Burst |
|------------------|-------------|-------|
| `/api/v1/providers/*` | 5,000/min | 10,000 |
| `/api/v1/jobs/*` | 5,000/min | 10,000 |
| `/api/v1/customers/*` | 3,000/min | 6,000 |
| `/api/v1/homes/*` | 2,000/min | 4,000 |
| `/graphql` | 10,000/min | 15,000 |
| `/ws/*` | 20,000/min | 40,000 |

### B. Geospatial Specifications

| Metric | Specification |
|--------|---------------|
| Location Update Frequency | 30 seconds |
| Distance Calculation | Haversine formula |
| Geofence Radius | Configurable per job |
| Service Radius | Provider-specific (5-50 miles) |
| Location Retention | 90 days |

### C. Authentication

- OAuth 2.0 with JWT tokens
- Token expiration: 1 hour (access), 7 days (refresh)
- Required scopes: `read`, `write`, `admin`
- Provider app uses device-based authentication

### D. Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| 400 | Invalid request data | Validate request body |
| 401 | Unauthorized | Refresh token |
| 403 | Insufficient permissions | Check scope |
| 404 | Resource not found | Verify ID |
| 429 | Rate limited | Back off and retry |
| 503 | Service temporarily unavailable | Retry with exponential backoff |

### E. Glossary

| Term | Definition |
|------|------------|
| Twin | Digital representation of real-world entity |
| Agent | AI system that manages and optimizes twin data |
| First-Time Fix | Successful repair on first visit |
| LTV | Customer Lifetime Value |
| NPS | Net Promoter Score |
| Route Optimization | Finding most efficient path between stops |

---

**Document End**
