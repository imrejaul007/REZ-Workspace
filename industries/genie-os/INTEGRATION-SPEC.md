# Genie OS Integration Specification

**Version:** 1.0.0
**Last Updated:** 2026-06-12
**Industry:** Personal AI / Personal Intelligence Layer

---

## 1. Executive Summary - Genie as Personal Intelligence Layer

### Overview

Genie is the Personal Intelligence Layer of the RTMN ecosystem, providing each user with a private AI companion that learns their preferences, manages their memory, and orchestrates their digital life across all 26 industry verticals. Genie acts as the user's Personal AI Twin, connecting their personal context to business systems through the Business Copilot Bridge.

**Core Value Proposition**: Transform the fragmented digital experience into a unified personal AI layer where one intelligent assistant understands your life context, preferences, and relationships - and uses that knowledge to deliver hyper-personalized experiences across every industry touchpoint.

### Key Integration Points

| Integration Layer | Purpose | Primary Protocol |
|------------------|---------|------------------|
| Genie ↔ TwinOS | Personal Twin orchestration | REST + WebSocket |
| Genie ↔ Industry OS | Industry context access | REST + Pub/Sub |
| Genie ↔ Business Copilot | Personal context injection | REST + Streaming |
| Genie ↔ External Services | Data aggregation | Service-specific APIs |

### Genie Services Portfolio

Genie comprises 26 services organized into 6 functional categories:

| Category | Services | Purpose |
|----------|----------|---------|
| **Memory Core** | Memory, Relationship, Personal OS Gateway | Persistent personal knowledge |
| **Communication** | Voice, Email, Calendar, Meeting, Briefing | Digital communication management |
| **Integration** | Sync, Browser History, Drive Connector | External data aggregation |
| **Notetaking** | Notion, Obsidian | Knowledge management |
| **Messaging** | Slack, Telegram, WhatsApp, Discord | Team communication |
| **Intelligence** | Privacy, Memory Review, Household, Wake Word | AI orchestration & privacy |

---

## 2. Genie Architecture - 26 Services for Personal AI

### 2.1 Service Registry

| Service | Port | Category | Description |
|---------|------|----------|-------------|
| `genie-memory-service` | 4703 | Memory Core | Long-term memory storage and retrieval |
| `genie-relationship-service` | 4704 | Memory Core | Relationship graph and social context |
| `genie-briefing-service` | 4706 | Communication | Daily briefings and summaries |
| `genie-sync-service` | 4707 | Integration | Cross-service data synchronization |
| `genie-voice-service` | 4712 | Communication | Voice interaction and speech synthesis |
| `genie-calendar-service` | 4709 | Communication | Calendar aggregation and scheduling |
| `genie-email-service` | 4710 | Communication | Email management and analysis |
| `genie-meeting-service` | 4713 | Communication | Meeting coordination and notes |
| `genie-browser-history-service` | TBD | Integration | Browser history context |
| `genie-discord-service` | TBD | Messaging | Discord integration |
| `genie-drive-connector` | TBD | Integration | Google Drive/OneDrive connector |
| `genie-household-service` | TBD | Intelligence | Household/family context |
| `genie-memory-review-service` | TBD | Intelligence | Memory consolidation and review |
| `genie-notion-service` | 4709 | Notetaking | Notion integration |
| `genie-obsidian-service` | 4708 | Notetaking | Obsidian vault sync |
| `genie-personal-os-gateway` | TBD | Memory Core | Central gateway service |
| `genie-privacy-service` | TBD | Intelligence | Privacy controls and consent |
| `genie-project-service` | TBD | Intelligence | Project management context |
| `genie-slack-service` | 4710 | Messaging | Slack workspace integration |
| `genie-telegram-service` | 4711 | Messaging | Telegram bot integration |
| `genie-whatsapp-service` | TBD | Messaging | WhatsApp integration |
| `genie-wake-word-service` | TBD | Intelligence | Wake word detection |
| Industry AI Connectors | Variable | Integration | Industry-specific context feeds |
| Personal Twin Service | 4860 | Memory Core | TwinOS personal identity layer |
| Privacy Consent Service | TBD | Intelligence | Granular consent management |

### 2.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              GENIE PERSONAL AI LAYER                                │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ┌───────────────────────────────────────────────────────────────────────────────┐ │
│  │                         PERSONAL TWIN (Port 4860)                             │ │
│  │    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │ │
│  │    │  Identity   │  │ Preferences │  │  Memory     │  │ Relationships│          │ │
│  │    │   Twin      │  │    Twin     │  │   Twin      │  │   Twin       │          │ │
│  │    └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘          │ │
│  └───────────────────────────────────────────────────────────────────────────────┘ │
│                                      │                                             │
│  ┌───────────────────────────────────┼───────────────────────────────────────────┐ │
│  │                         GENIE SERVICES (26 services)                          │ │
│  │                                                                           │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐               │ │
│  │  │   MEMORY CORE   │  │  COMMUNICATION  │  │   INTEGRATION   │               │ │
│  │  │  Memory (4703)  │  │ Voice (4712)    │  │ Sync (4707)     │               │ │
│  │  │  Relation (4704)│  │ Calendar (4709) │  │ Browser History │               │ │
│  │  │  Personal OS GW │  │ Email (4710)    │  │ Drive Connector │               │ │
│  │  └─────────────────┘  │ Meeting (4713) │  └─────────────────┘               │ │
│  │                       │ Briefing (4706) │                                   │   │
│  │                       └─────────────────┘  ┌─────────────────┐               │ │
│  │  ┌─────────────────┐                        │   NOTETAKING    │               │ │
│  │  │    MESSAGING    │                        │ Notion (4709)   │               │ │
│  │  │ Slack (4710)    │                        │ Obsidian (4708) │               │ │
│  │  │ Telegram (4711)  │  ┌─────────────────┐  └─────────────────┘               │ │
│  │  │ WhatsApp        │  │   INTELLIGENCE  │                                    │   │
│  │  │ Discord         │  │ Privacy         │  ┌─────────────────┐               │ │
│  │  └─────────────────┘  │ Memory Review   │  │  INDUSTRY AI   │               │ │
│  │                       │ Household       │  │ CONNECTORS     │               │ │
│  │                       │ Wake Word       │  │ Fitness-Connector│              │ │
│  │                       │ Project         │  │ Healthcare-Conn │               │ │
│  │                       └─────────────────┘  │ Hotel-Connector │               │ │
│  │                                             └─────────────────┘               │ │
│  └───────────────────────────────────────────────────────────────────────────────┘ │
│                                      │                                             │
├──────────────────────────────────────┼───────────────────────────────────────────┤
│                         INDUSTRY OS LAYER                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │  Fitness OS  │  │ Healthcare OS│  │  Hotel OS    │  │ Restaurant  │           │
│  │   (4300)     │  │   (8643)     │  │              │  │     OS      │           │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │  Retail OS   │  │   Legal OS   │  │  Travel OS   │  │    ...       │           │
│  │              │  │              │  │              │  │  (26 total) │           │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘           │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                           BUSINESS COPILOT BRIDGE                                   │
│  ┌───────────────────────────────────────────────────────────────────────────────┐ │
│  │                    Personal Context Injection Layer                            │ │
│  │   • Personal preferences → Industry recommendations                           │ │
│  │   • Relationship context → Personalized outreach                              │ │
│  │   • Memory → Continuity of experience                                          │ │
│  └───────────────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                              TWINOS CORE (Port 4142)                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │   Fitness   │  │  Healthcare │  │    Hotel    │  │  Restaurant │                 │
│  │    Twin     │  │    Twin     │  │    Twin     │  │    Twin     │                 │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘                 │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Docker Compose Reference

```yaml
# docker/docker-compose.genie.yml
services:
  # Memory Core Services
  genie-memory:
    image: genie-memory:latest
    ports: ["4703:4703"]
    environment:
      - PORT=4703
      - SERVICE_NAME=genie-memory
      - TWINOS_URL=http://twinos:4142
    volumes:
      - genie-memory-data:/app/data
    networks: [rtnm-network]

  genie-relationship:
    image: genie-relationship:latest
    ports: ["4704:4704"]
    environment:
      - PORT=4704
      - TWINOS_URL=http://twinos:4142
    networks: [rtnm-network]

  genie-briefing:
    image: genie-briefing:latest
    ports: ["4706:4706"]
    environment:
      - PORT=4706
    networks: [rtnm-network]

  genie-sync-service:
    image: genie-sync:latest
    ports: ["4707:4707"]
    networks: [rtnm-network]

  # Communication Services
  genie-voice-service:
    image: genie-voice:latest
    ports: ["4712:4712"]
    networks: [rtnm-network]

  genie-calendar-service:
    image: genie-calendar:latest
    ports: ["4709:4709"]
    networks: [rtnm-network]

  genie-email-service:
    image: genie-email:latest
    ports: ["4710:4710"]
    networks: [rtnm-network]

  genie-meeting-service:
    image: genie-meeting:latest
    ports: ["4713:4713"]
    networks: [rtnm-network]

  # Notetaking Services
  obsidian-service:
    image: genie-obsidian:latest
    ports: ["4708:4708"]
    networks: [rtnm-network]

  notion-service:
    image: genie-notion:latest
    ports: ["4709:4709"]
    networks: [rtnm-network]

  # Messaging Services
  slack-service:
    image: genie-slack:latest
    ports: ["4710:4710"]
    networks: [rtnm-network]

  telegram-service:
    image: genie-telegram:latest
    ports: ["4711:4711"]
    networks: [rtnm-network]
```

---

## 3. Personal Twin - User Identity, Preferences, Memory

### 3.1 Personal Twin Schema

The Personal Twin is the core identity layer that persists across all industry contexts.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "Personal Twin",
  "description": "Genie Personal AI - User's Personal Digital Twin",
  "twinId": "GENIE-PT1",
  "version": "1.0",
  "attributes": {
    "identity": {
      "type": "object",
      "properties": {
        "userId": { "type": "string", "format": "uuid" },
        "displayName": { "type": "string" },
        "email": { "type": "string", "format": "email" },
        "phone": { "type": "string" },
        "avatar": { "type": "string", "format": "uri" },
        "timezone": { "type": "string" },
        "locale": { "type": "string" },
        "language": { "type": "string" }
      }
    },
    "preferences": {
      "type": "object",
      "properties": {
        "communication": {
          "preferredChannel": { "type": "string", "enum": ["voice", "text", "email"] },
          "notificationLevel": { "type": "string", "enum": ["all", "important", "minimal", "none"] },
          "quietHours": {
            "start": { "type": "string" },
            "end": { "type": "string" }
          }
        },
        "personalization": {
          "learningEnabled": { "type": "boolean" },
          "contextAwareness": { "type": "boolean" },
          "crossIndustryInsights": { "type": "boolean" }
        },
        "privacy": {
          "dataRetention": { "type": "string", "enum": ["minimal", "standard", "extended"] },
          "shareWithBusinesses": { "type": "boolean" },
          "anonymizedAnalytics": { "type": "boolean" }
        }
      }
    },
    "memory": {
      "type": "object",
      "properties": {
        "shortTerm": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "content": { "type": "string" },
              "timestamp": { "type": "string", "format": "date-time" },
              "source": { "type": "string" },
              "importance": { "type": "number", "minimum": 0, "maximum": 100 }
            }
          }
        },
        "longTerm": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": { "type": "string" },
              "content": { "type": "string" },
              "category": { "type": "string" },
              "tags": { "type": "array", "items": { "type": "string" } },
              "createdAt": { "type": "string", "format": "date-time" },
              "lastAccessed": { "type": "string", "format": "date-time" },
              "accessCount": { "type": "integer" }
            }
          }
        },
        "facts": {
          "type": "object",
          "additionalProperties": { "type": "string" }
        }
      }
    },
    "relationships": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "personId": { "type": "string" },
          "name": { "type": "string" },
          "relationship": { "type": "string" },
          "context": { "type": "string" },
          "lastInteraction": { "type": "string", "format": "date-time" },
          "importance": { "type": "number", "minimum": 0, "maximum": 100 }
        }
      }
    },
    "industryContexts": {
      "type": "object",
      "additionalProperties": {
        "type": "object",
        "properties": {
          "industryTwinId": { "type": "string" },
          "preferences": { "type": "object" },
          "history": { "type": "array", "items": { "type": "object" } },
          "lastAccess": { "type": "string", "format": "date-time" }
        }
      }
    },
    "consents": {
      "type": "object",
      "properties": {
        "perIndustry": {
          "type": "object",
          "additionalProperties": { "type": "boolean" }
        },
        "perService": {
          "type": "object",
          "additionalProperties": { "type": "boolean" }
        },
        "perDataType": {
          "type": "object",
          "additionalProperties": { "type": "boolean" }
        }
      }
    },
    "lastUpdated": { "type": "string", "format": "date-time" }
  },
  "relationships": {
    "OWNS": {
      "type": "array",
      "items": { "$ref": "#/definitions/IndustryTwin" }
    },
    "KNOWS": {
      "type": "array",
      "items": { "$ref": "#/definitions/PersonTwin" }
    },
    "USES": {
      "type": "array",
      "items": { "$ref": "#/definitions/ServiceTwin" }
    },
    "SHARES_WITH": {
      "type": "array",
      "items": { "$ref": "#/definitions/BusinessTwin" }
    }
  },
  "managingAgent": "genie-personal-os-gateway",
  "dataSources": ["All Genie Services", "Industry OS", "User Input", "External Services"],
  "updateTriggers": ["User action", "Service event", "Industry interaction", "Scheduled review"]
}
```

### 3.2 Memory Twin Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "Memory Twin",
  "description": "Long-term memory storage for Genie Personal AI",
  "twinId": "GENIE-M1",
  "version": "1.0",
  "attributes": {
    "memoryId": { "type": "string", "format": "uuid" },
    "userId": { "type": "string", "format": "uuid" },
    "category": {
      "type": "enum",
      "enum": ["episodic", "semantic", "procedural", "fact", "preference", "relationship"]
    },
    "content": {
      "type": "object",
      "properties": {
        "text": { "type": "string" },
        "entities": { "type": "array", "items": { "type": "string" } },
        "sentiment": { "type": "number", "minimum": -1, "maximum": 1 },
        "emotional_tags": { "type": "array", "items": { "type": "string" } }
      }
    },
    "metadata": {
      "type": "object",
      "properties": {
        "source": { "type": "string" },
        "sourceService": { "type": "string" },
        "confidence": { "type": "number", "minimum": 0, "maximum": 100 },
        "verifiable": { "type": "boolean" }
      }
    },
    "temporal": {
      "type": "object",
      "properties": {
        "created": { "type": "string", "format": "date-time" },
        "accessed": { "type": "string", "format": "date-time" },
        "modified": { "type": "string", "format": "date-time" },
        "expires": { "type": "string", "format": "date-time" }
      }
    },
    "context": {
      "type": "object",
      "properties": {
        "location": { "type": "string" },
        "activity": { "type": "string" },
        "industry": { "type": "string" },
        "device": { "type": "string" }
      }
    },
    "accessCount": { "type": "integer" },
    "importance": { "type": "number", "minimum": 0, "maximum": 100 },
    "status": {
      "type": "enum",
      "enum": ["active", "archived", "forgotten", "consolidated"]
    }
  },
  "managingAgent": "genie-memory-service",
  "dataSources": ["User conversations", "External services", "Industry interactions", "Sensors"],
  "updateTriggers": ["Memory created", "Memory accessed", "Memory updated", "Scheduled consolidation"]
}
```

### 3.3 Relationship Twin Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "Relationship Twin",
  "description": "Social and professional relationship graph",
  "twinId": "GENIE-R1",
  "version": "1.0",
  "attributes": {
    "relationshipId": { "type": "string", "format": "uuid" },
    "userId": { "type": "string", "format": "uuid" },
    "person": {
      "type": "object",
      "properties": {
        "personId": { "type": "string", "format": "uuid" },
        "name": { "type": "string" },
        "email": { "type": "string", "format": "email" },
        "phone": { "type": "string" },
        "avatar": { "type": "string", "format": "uri" },
        "company": { "type": "string" },
        "title": { "type": "string" }
      }
    },
    "relationshipType": {
      "type": "enum",
      "enum": ["family", "friend", "colleague", "client", "vendor", "acquaintance", "other"]
    },
    "contexts": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "context": { "type": "string" },
          "industry": { "type": "string" },
          "firstMet": { "type": "string", "format": "date" },
          "lastInteraction": { "type": "string", "format": "date-time" }
        }
      }
    },
    "interactionHistory": {
      "type": "object",
      "properties": {
        "totalInteractions": { "type": "integer" },
        "channels": { "type": "array", "items": { "type": "string" } },
        "lastChannel": { "type": "string" },
        "avgSentiment": { "type": "number", "minimum": -1, "maximum": 1 }
      }
    },
    "importance": { "type": "number", "minimum": 0, "maximum": 100 },
    "notes": { "type": "string" },
    "sharedContexts": {
      "type": "array",
      "items": { "type": "string" }
    }
  },
  "relationships": {
    "KNOWS": { "$ref": "#/definitions/PersonalTwin" },
    "INTERACTS_WITH": { "$ref": "#/definitions/IndustryTwin" }
  },
  "managingAgent": "genie-relationship-service",
  "dataSources": ["Communication services", "Calendar", "CRM", "User input"],
  "updateTriggers": ["Interaction recorded", "Contact updated", "Context added"]
}
```

---

## 4. Industry Access - How Genie Accesses Industry Data for Personal Context

### 4.1 Industry Access Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PERSONAL TWIN (User)                                  │
│   ┌───────────────────────────────────────────────────────────────────────┐   │
│   │  Genie Personal Context:                                             │   │
│   │  • Preferences → Industry recommendations                            │   │
│   │  • Memory → Continuity of experience                                 │   │
│   │  • Relationships → Personalized outreach                             │   │
│   │  • History → Predictive personalization                              │   │
│   └───────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    GENIE INDUSTRY ACCESS LAYER                               │
│                                                                              │
│  ┌────────────────────┐    ┌────────────────────┐    ┌────────────────────┐ │
│  │ Industry Connectors │    │ Context Transformers│    │ Preference       │ │
│  │                      │    │                      │    │ Synthesizers      │ │
│  │ fitness-connector   │    │ Industry data →     │    │                    │ │
│  │ healthcare-connector│───▶│ Personal context    │───▶│ User preferences   │ │
│  │ hotel-connector     │    │ normalization       │    │ aggregation        │ │
│  │ restaurant-connector│    │                      │    │                    │ │
│  │ retail-connector    │    │                      │    │                    │ │
│  │ salon-connector     │    │                      │    │                    │ │
│  └────────────────────┘    └────────────────────┘    └────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      INDUSTRY OS TWINS (Per Vertical)                        │
│                                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │  Fitness  │  │ Healthcare │  │   Hotel    │  │ Restaurant │           │
│  │    Twin    │  │    Twin    │  │    Twin    │  │    Twin    │           │
│  │ Body, Goal │  │ Patient,   │  │ Guest,     │  │ Customer,  │           │
│  │ Trainer,   │  │ Doctor,    │  │ Booking,   │  │ Table,     │           │
│  │ Gym        │  │ Facility   │  │ Room       │  │ Menu       │           │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Industry Connector Specifications

#### Fitness Connector

| Attribute | Value |
|-----------|-------|
| **Port** | Variable (per deployment) |
| **Capabilities** | Body metrics, workout history, goals, trainer matching |
| **Data Pulled** | Body Twin, Fitness Twin, Goal Twin, Gym Twin |
| **Personal Context Output** | Fitness preferences, workout patterns, health goals |
| **TwinOS Role** | PERSONAL CONTEXT - fitness domain |

#### Healthcare Connector

| Attribute | Value |
|-----------|-------|
| **Port** | 8643 |
| **Capabilities** | Patient records, appointments, prescriptions, AI insights |
| **Data Pulled** | Patient Twin, Doctor Twin, Appointment Twin |
| **Personal Context Output** | Health preferences, provider preferences, medication schedules |
| **TwinOS Role** | PERSONAL CONTEXT - healthcare domain |

#### Hotel Connector

| Attribute | Value |
|-----------|-------|
| **Port** | Variable |
| **Capabilities** | Booking history, preferences, loyalty status |
| **Data Pulled** | Guest Twin, Booking Twin, Room Twin |
| **Personal Context Output** | Travel preferences, accommodation likes, loyalty tier |
| **TwinOS Role** | PERSONAL CONTEXT - hospitality domain |

#### Restaurant Connector

| Attribute | Value |
|-----------|-------|
| **Port** | Variable |
| **Capabilities** | Order history, dietary preferences, reservations |
| **Data Pulled** | Customer Twin, Order Twin, Reservation Twin |
| **Personal Context Output** | Food preferences, dietary restrictions, favorite venues |
| **TwinOS Role** | PERSONAL CONTEXT - dining domain |

#### Retail Connector

| Attribute | Value |
|-----------|-------|
| **Port** | Variable |
| **Capabilities** | Purchase history, wishlists, browsing behavior |
| **Data Pulled** | Customer Twin, Product Twin, Transaction Twin |
| **Personal Context Output** | Shopping preferences, style, price sensitivity |
| **TwinOS Role** | PERSONAL CONTEXT - retail domain |

### 4.3 API Endpoints - Industry Access

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/personal/context/{userId}` | GET | Get full personal context | - | PersonalTwin JSON |
| `/personal/context/{userId}/industry/{industry}` | GET | Get industry-specific context | - | IndustryContext JSON |
| `/personal/preferences` | POST | Update personal preferences | Preferences object | Confirmation |
| `/personal/consent` | GET/PUT | Manage consent settings | Consent object | Consent status |
| `/memory/store` | POST | Store new memory | Memory object | Memory ID |
| `/memory/search` | POST | Search memories | Query object | Memory results |
| `/memory/recall` | GET | Recall specific memory | Memory ID | Memory content |
| `/relationships` | GET/POST | Manage relationships | Relationship object | Relationship list |
| `/industry/connect/{industry}` | POST | Connect industry data | Connection config | Connection status |
| `/industry/sync/{industry}` | POST | Sync industry data | Sync options | Sync status |

---

## 5. Cross-Industry Personalization - One Person, Multiple Industry Contexts

### 5.1 Cross-Industry Context Model

```json
{
  "userId": "user-uuid",
  "crossIndustryProfiles": {
    "fitness": {
      "twinId": "4142-B1-xxx",
      "preferences": {
        "workoutTimes": ["06:00", "18:00"],
        "preferredActivities": ["Strength", "HIIT"],
        "fitnessGoals": ["Weight Loss", "Muscle Gain"],
        "dietaryRestrictions": ["gluten-free"],
        "trainerPreference": "motivational"
      },
      "lastAccess": "2026-06-12T10:30:00Z"
    },
    "healthcare": {
      "twinId": "healthcare-patient-xxx",
      "preferences": {
        "preferredDoctor": "Dr. Smith",
        "preferredFacility": "Downtown Clinic",
        "appointmentTimes": ["morning"],
        "communicationPreference": "email",
        "medicationReminderEnabled": true
      },
      "lastAccess": "2026-06-11T14:00:00Z"
    },
    "restaurant": {
      "twinId": "restaurant-customer-xxx",
      "preferences": {
        "cuisines": ["Italian", "Japanese"],
        "dietaryRestrictions": ["vegetarian-options"],
        "priceRange": "$$",
        "preferredSeating": "outdoor",
        "favoriteRestaurants": ["restaurant-1", "restaurant-2"]
      },
      "lastAccess": "2026-06-10T19:00:00Z"
    },
    "hotel": {
      "twinId": "hotel-guest-xxx",
      "preferences": {
        "roomType": "king-bed",
        "floorPreference": "high",
        "amenities": ["gym", "pool"],
        "checkInTime": "15:00",
        "loyaltyTier": "gold"
      },
      "lastAccess": "2026-06-08T12:00:00Z"
    },
    "retail": {
      "twinId": "retail-customer-xxx",
      "preferences": {
        "categories": ["electronics", "fashion"],
        "brands": ["Apple", "Nike"],
        "priceSensitivity": "moderate",
        "shoppingTimes": ["weekends"],
        "stylePreferences": ["minimalist", "casual"]
      },
      "lastAccess": "2026-06-09T16:00:00Z"
    }
  },
  "crossIndustryInsights": {
    "lifeStage": "active-professional",
    "incomeBracket": "upper-middle",
    "interests": ["health", "travel", "technology"],
    "behavioralPatterns": {
      "morningPerson": true,
      "weekendActivity": "social",
      "travelFrequency": "monthly"
    }
  },
  "unifiedPreferences": {
    "communicationChannel": "app",
    "privacyLevel": "standard",
    "notificationPreferences": {
      "frequency": "daily-summary",
      "quietHours": { "start": "22:00", "end": "07:00" }
    }
  }
}
```

### 5.2 Cross-Industry Personalization Flows

#### Flow 1: Unified Customer Profile

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Fitness OS │     │ Healthcare OS│     │ Restaurant  │     │   Retail    │
│             │     │             │     │    OS       │     │     OS      │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PERSONAL TWIN AGGREGATION LAYER                            │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐     │
│   │                    UNIFIED PERSONAL PROFILE                         │     │
│   │                                                                      │     │
│   │   Cross-Industry Insights:                                          │     │
│   │   • "Health-conscious professional, travels frequently"           │     │
│   │   • "Prefers premium experiences with convenience focus"          │     │
│   │   • "Engages with wellness across multiple contexts"              │     │
│   │                                                                      │     │
│   │   Shared Preferences:                                               │     │
│   │   • Premium service expectations                                    │     │
│   │   • Technology-forward (uses wearables, apps)                      │     │
│   │   • Values time efficiency                                          │     │
│   └─────────────────────────────────────────────────────────────────────┘     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Flow 2: Proactive Personalization

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      CROSS-INDUSTRY RECOMMENDATION ENGINE                    │
│                                                                              │
│  INPUT: User's cross-industry profile                                       │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐     │
│  │  CONTEXT SYNTHESIS                                                   │     │
│  │                                                                      │     │
│  │  Fitness: "Completed marathon training, seeking recovery"         │     │
│  │  Healthcare: "Annual checkup due, mild back pain reported"         │     │
│  │  Hotel: "Business trip to NYC next week"                           │     │
│  │  Restaurant: "Celebrating promotion with dinner reservation"       │     │
│  │                                                                      │     │
│  │  CROSS-INDUSTRY INSIGHT: "Recovery-focused professional             │     │
│  │  with wellness routine, traveling for work"                        │     │
│  └─────────────────────────────────────────────────────────────────────┘     │
│                                    │                                          │
│                                    ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐     │
│  │  RECOMMENDATIONS ACROSS INDUSTRIES                                 │     │
│  │                                                                      │     │
│  │  Fitness: "Book deep tissue massage, try recovery yoga class"     │     │
│  │  Healthcare: "Schedule sports massage therapy for back"          │     │
│  │  Hotel: "Suggest hotel with spa and pool"                         │     │
│  │  Restaurant: "Recommend healthy celebratory dinner option"       │     │
│  └─────────────────────────────────────────────────────────────────────┘     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Privacy-Preserving Cross-Industry Analysis

| Analysis Type | Data Required | Privacy Mechanism |
|--------------|---------------|------------------|
| Preference aggregation | Industry preferences | User consent + anonymization |
| Behavioral patterns | Transaction patterns | Differential privacy |
| Recommendation correlation | Cross-industry history | Federated learning |
| Life stage inference | Aggregate health/fitness | On-device processing |

---

## 6. Genie-to-Business Copilot Bridge

### 6.1 Bridge Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      GENIE PERSONAL AI LAYER                                 │
│                                                                              │
│   ┌───────────────────────────────────────────────────────────────────────┐   │
│   │  Personal Twin                                                         │   │
│   │  • User identity & preferences                                       │   │
│   │  • Memory & relationship graph                                       │   │
│   │  • Industry context history                                          │   │
│   │  • Communication patterns                                           │   │
│   └───────────────────────────────────────────────────────────────────────┘   │
│                                    │                                          │
│                                    ▼                                          │
│   ┌───────────────────────────────────────────────────────────────────────┐   │
│   │  Personal Context Injection Service                                   │   │
│   │                                                                        │   │
│   │  Functions:                                                           │   │
│   │  • Extract relevant personal context for query                       │   │
│   │  • Anonymize as needed for privacy                                    │   │
│   │  • Format for business copilot consumption                           │   │
│   │  • Respect consent boundaries                                       │   │
│   └───────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Personal Context (REST/WebSocket)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      BUSINESS COPILOT BRIDGE                                 │
│                                                                              │
│   ┌───────────────────────────────────────────────────────────────────────┐   │
│   │  Bridge Service (Port TBD)                                            │   │
│   │                                                                        │   │
│   │  API Endpoints:                                                        │   │
│   │  • POST /context/inject - Inject context into query                  │   │
│   │  • GET /context/available - Get available context for user            │   │
│   │  • PUT /context/consent - Update consent settings                    │   │
│   │  • POST /context/query - Direct context query                        │   │
│   └───────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Context-enriched query
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      BUSINESS COPILOT LAYER                                   │
│                                                                              │
│   ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│   │  Fitness  │  │ Healthcare │  │   Hotel    │  │ Restaurant │            │
│   │  Copilot  │  │  Copilot   │  │  Copilot   │  │  Copilot   │            │
│   └────────────┘  └────────────┘  └────────────┘  └────────────┘            │
│                                                                              │
│   Now with Personal Context:                                                │
│   • "Show me gyms near downtown with equipment for my workout style"       │
│   • "Any healthcare providers who accept my insurance and speak Hindi"     │
│   • "Book a hotel with gym access for my business trip"                    │
│   • "Reserve a table at an Italian restaurant for 2, 7pm, outdoor seating"│   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Context Injection API

```json
// POST /bridge/v1/context/inject
{
  "request": {
    "userId": "user-uuid",
    "query": "Find me a personal trainer who specializes in marathon training",
    "industry": "fitness",
    "timestamp": "2026-06-12T10:30:00Z"
  },
  "personalContext": {
    "fitness": {
      "recentMarathon": {
        "event": "NYC Marathon",
        "date": "2026-05-15",
        "time": "4:15:00",
        "confidence": 0.95
      },
      "currentGoals": ["Recovery", "Maintain fitness", "Next marathon prep"],
      "workoutHistory": {
        "avgWeeklyMileage": 45,
        "preferredTimes": ["early-morning"],
        "trainingStyle": "structured"
      },
      "trainerPreferences": {
        "certifications": ["NASM", "Road Runners Club"],
        "style": "data-driven",
        "availability": "weekday-mornings"
      }
    },
    "healthcare": {
      "relevantConditions": ["mild-achilles-tendinitis"],
      "injuryHistory": ["ankle-sprain-2025"],
      "recoveryStatus": "active"
    }
  },
  "injectedQuery": "Find me a personal trainer who specializes in marathon training. User completed NYC Marathon on 2026-05-15 in 4:15:00. Current goals: recovery, maintain fitness, next marathon prep. Has mild achilles tendinitis. Prefers weekday-morning sessions. Data-driven coaching style preferred."
}
```

### 6.3 Bridge API Endpoints

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/bridge/v1/context/inject` | POST | Inject personal context into query | Query + user ID | Enriched query |
| `/bridge/v1/context/available` | GET | Get available context categories | User ID | Context inventory |
| `/bridge/v1/context/consent` | GET/PUT | Manage consent for bridge access | Consent settings | Confirmation |
| `/bridge/v1/query/fitness` | POST | Fitness-specific context query | Query object | Fitness context |
| `/bridge/v1/query/healthcare` | POST | Healthcare-specific context query | Query object | Healthcare context |
| `/bridge/v1/query/hotel` | POST | Hotel-specific context query | Query object | Hotel context |
| `/bridge/v1/query/restaurant` | POST | Restaurant-specific context query | Query object | Restaurant context |
| `/bridge/v1/preferences/export` | POST | Export preferences for business | Industry filter | Preference bundle |

---

## 7. Privacy & Data Sharing Controls

### 7.1 Privacy Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PRIVACY CONTROL LAYER                                │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                   GENIE PRIVACY SERVICE                                 │  │
│  │                                                                        │  │
│  │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │  │
│  │   │  Consent    │  │   Data      │  │  Access     │  │   Audit     │   │  │
│  │   │  Manager    │  │   Minimizer │  │   Control   │  │   Logger    │   │  │
│  │   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │  │
│  │                                                                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
└────────────────────────────────────┼────────────────────────────────────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         │                           │                           │
         ▼                           ▼                           ▼
┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐
│   USER DATA     │        │  INDUSTRY DATA  │        │   BUSINESS      │
│   (Personal)    │        │   (Industry)   │        │   COPILOT       │
│                 │        │                 │        │                 │
│ • Memory        │        │ • Fitness Twin  │        │ • Query Context │
│ • Relationships │        │ • Patient Twin  │        │ • Recommendations│
│ • Preferences   │        │ • Guest Twin    │        │ • Analytics     │
└─────────────────┘        └─────────────────┘        └─────────────────┘
```

### 7.2 Consent Management Schema

```json
{
  "consentId": "consent-uuid",
  "userId": "user-uuid",
  "version": "2026-06-12",
  "granularity": "per-industry + per-data-type",
  "consents": {
    "industryLevel": {
      "fitness": {
        "enabled": true,
        "scope": "preferences + history",
        "expires": "2027-06-12"
      },
      "healthcare": {
        "enabled": true,
        "scope": "appointments + preferences",
        "expires": "2027-06-12"
      },
      "restaurant": {
        "enabled": true,
        "scope": "preferences + favorites",
        "expires": "2027-06-12"
      },
      "hotel": {
        "enabled": true,
        "scope": "preferences + booking-history",
        "expires": "2027-06-12"
      },
      "retail": {
        "enabled": false,
        "scope": null,
        "expires": null
      }
    },
    "dataTypeLevel": {
      "personal_identity": {
        "share_with_industry": false,
        "share_with_copilot": false
      },
      "preferences": {
        "share_with_industry": true,
        "share_with_copilot": true
      },
      "behavioral_history": {
        "share_with_industry": "anonymized",
        "share_with_copilot": "aggregated"
      },
      "health_data": {
        "share_with_industry": "minimal",
        "share_with_copilot": false
      },
      "location_data": {
        "share_with_industry": "approximate",
        "share_with_copilot": false
      },
      "financial_data": {
        "share_with_industry": false,
        "share_with_copilot": false
      }
    },
    "thirdPartySharing": {
      "marketing_partners": false,
      "analytics_providers": "anonymized-only",
      "data_brokers": false
    }
  },
  "rights": {
    "access": true,
    "correction": true,
    "deletion": true,
    "portability": true,
    "objection": true
  },
  "auditLog": {
    "lastConsentChange": "2026-06-01T10:00:00Z",
    "consentHistory": [
      {
        "date": "2026-06-01T10:00:00Z",
        "change": "Disabled retail industry sharing",
        "reason": "User preference"
      }
    ]
  }
}
```

### 7.3 Privacy Controls by Industry

| Industry | Personal Data Shared | Industry Context | Copilot Access |
|----------|---------------------|------------------|----------------|
| Fitness | Preferences + Goals | Workout history, body metrics | Recommendations only |
| Healthcare | Provider preferences | Appointment history | Scheduling only |
| Hotel | Room preferences | Booking history | Booking assistance |
| Restaurant | Dietary preferences | Order history | Reservation help |
| Retail | Style preferences | Purchase history | Shopping assistance |
| Legal | Matter context | Case references | Research only |
| Financial | Investment goals | Transaction patterns | Advisory only |

### 7.4 Privacy API Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/privacy/v1/consent` | GET | Get current consent status | Yes (user) |
| `/privacy/v1/consent` | PUT | Update consent settings | Yes (user) |
| `/privacy/v1/consent/export` | POST | Export consent record | Yes (user) |
| `/privacy/v1/data/access` | POST | Request data access | Yes (user) |
| `/privacy/v1/data/delete` | POST | Request data deletion | Yes (user) |
| `/privacy/v1/data/port` | POST | Export personal data | Yes (user) |
| `/privacy/v1/audit` | GET | View data access audit | Yes (user) |
| `/privacy/v1/sharing/approve` | POST | Approve specific sharing | Yes (user) |
| `/privacy/v1/sharing/revoke` | POST | Revoke specific sharing | Yes (user) |

---

## 8. Use Cases Per Industry

### 8.1 Fitness Industry

| Use Case | Description | Personal Context Used |
|----------|-------------|----------------------|
| **Smart Trainer Matching** | Match users with trainers based on personality, training style, and goals | Communication preferences, learning style, schedule |
| **Personalized Workout Plans** | Generate workouts based on fitness history, recovery status, and goals | Previous workouts, injury history, progress trajectory |
| **Nutrition Synergy** | Coordinate nutrition recommendations with workout intensity | Training schedule, calorie burn, dietary preferences |
| **Recovery Optimization** | Suggest recovery activities based on training load and life stress | Sleep data, stress levels, schedule |
| **Equipment Recommendations** | Recommend gym equipment based on home setup and goals | Space constraints, budget, current equipment |

### 8.2 Healthcare Industry

| Use Case | Description | Personal Context Used |
|----------|-------------|----------------------|
| **Provider Matching** | Match patients with providers based on preferences and needs | Language preference, location, communication style, insurance |
| **Appointment Orchestration** | Schedule appointments considering personal schedule and preferences | Calendar availability, transportation preferences |
| **Medication Adherence** | Personalized reminders based on daily routine | Sleep schedule, meal times, routine patterns |
| **Care Continuity** | Ensure smooth transitions between providers and specialties | Medical history, previous providers, test results |
| **Preventive Care nudges** | Prompt for preventive care based on health profile | Age, gender, family history, risk factors |

### 8.3 Hotel/Hospitality Industry

| Use Case | Description | Personal Context Used |
|----------|-------------|----------------------|
| **Anticipatory Service** | Prepare room and amenities based on guest preferences before arrival | Room preferences, dietary restrictions, loyalty history |
| **Personalized Welcome** | Customize welcome experience based on trip purpose and history | Previous visits, trip purpose, special occasions |
| **Activity Recommendations** | Suggest local activities aligned with guest interests | Stated interests, past activities, weather sensitivity |
| **Frictionless Checkout** | Streamline checkout based on preferences and billing history | Payment preferences, loyalty program, feedback history |
| **Loyalty Intelligence** | Identify opportunities for recognition and upselling | Spending patterns, preferences, milestone dates |

### 8.4 Restaurant Industry

| Use Case | Description | Personal Context Used |
|----------|-------------|----------------------|
| **Smart Reservations** | Book tables based on cuisine preferences, dietary needs, and occasion | Favorite cuisines, dietary restrictions, celebration history |
| **Menu Personalization** | Highlight menu items based on preferences and past orders | Order history, dietary restrictions, flavor preferences |
| **Wait Time Optimization** | Suggest optimal visit times based on crowd patterns | Schedule preferences, location, wait time sensitivity |
| **Chef's Table Matching** | Match diners with chef experiences based on culinary interests | Cuisine adventurousness, dietary flexibility, past experiences |
| **Loyalty Rewards** | Personalize rewards based on dining patterns and preferences | Visit frequency, average spend, favorite dishes |

### 8.5 Retail Industry

| Use Case | Description | Personal Context Used |
|----------|-------------|----------------------|
| **Style Matching** | Recommend products based on style profile and occasion | Style preferences, wardrobe gaps, upcoming events |
| **Size Intelligence** | Pre-populate size information across brands | Size history, brand variations, fit preferences |
| **Occasion gifting** | Suggest gifts based on relationship data and occasions | Gift recipient history, relationship context, budget |
| **Inventory Alerts** | Notify when preferred items are in stock or on sale | Wishlist, price sensitivity, availability preferences |
| **Cross-Category Insights** | Identify cross-category opportunities based on lifestyle | Life stage, interests, purchase patterns |

### 8.6 Travel Industry

| Use Case | Description | Personal Context Used |
|----------|-------------|----------------------|
| **Trip Planning Orchestration** | Coordinate flights, hotels, and activities based on preferences | Travel style, budget, schedule constraints |
| **Loyalty Maximization** | Suggest options that maximize loyalty program value | Program memberships, points balance, redemption preferences |
| **Personalized Destination Matching** | Recommend destinations based on travel history and interests | Past destinations, activity preferences, travel frequency |
| **Itinerary Continuity** | Maintain context across multi-leg journeys | Connection preferences, accessibility needs, time zone sensitivity |
| **Travel Document Intelligence** | Proactively alert on document requirements | Passport expiry, visa requirements, vaccination records |

---

## 9. Implementation Roadmap

### Week 1-2: Core Genie Services Deployment

| Day | Task | Deliverable | Owner |
|-----|------|------------|-------|
| 1-2 | Deploy Genie core services (Memory, Relationship, Sync) | Services running on ports 4703, 4704, 4707 | DevOps |
| 3-4 | Set up Personal Twin database | TwinOS Personal schema deployed | Data Engineering |
| 5-7 | Implement Personal Twin CRUD API | REST API for Personal Twin operations | Backend Team |
| 8-10 | Deploy Communication services (Voice, Email, Calendar) | Services running on ports 4712, 4710, 4709 | DevOps |
| 11-12 | Implement Memory Service integration | Memory service connected to Personal Twin | Backend Team |
| 13-14 | Basic privacy service deployment | Privacy controls for core data | Security Team |

**Milestone**: Core Genie services operational with Personal Twin basic CRUD.

### Week 3-4: Industry Connectors

| Day | Task | Deliverable | Owner |
|-----|------|------------|-------|
| 15-17 | Implement Fitness Connector | Fitness context flowing to Personal Twin | Industry Team |
| 18-20 | Implement Healthcare Connector | Healthcare context flowing to Personal Twin | Industry Team |
| 21-23 | Implement Hotel Connector | Hotel context flowing to Personal Twin | Industry Team |
| 24-26 | Implement Restaurant Connector | Restaurant context flowing to Personal Twin | Industry Team |
| 27-28 | Implement Retail Connector | Retail context flowing to Personal Twin | Industry Team |

**Milestone**: 5 primary industry connectors integrated with Personal Twin.

### Week 5: Business Copilot Bridge

| Day | Task | Deliverable | Owner |
|-----|------|------------|-------|
| 29-31 | Deploy Bridge Service | Bridge service running with API | Backend Team |
| 32-33 | Implement context injection | Personal context injection into queries | ML Team |
| 34-35 | Privacy enforcement layer | Consent controls in Bridge | Security Team |
| 36-37 | End-to-end testing | Industry OS → Bridge → Copilot flow | QA Team |
| 38 | Staging deployment | Staging environment operational | DevOps |

**Milestone**: Business Copilot Bridge operational with privacy controls.

### Week 6: Remaining Connectors & Go-Live

| Day | Task | Deliverable | Owner |
|-----|------|------------|-------|
| 39-40 | Implement remaining 5 industry connectors | All 10 industry connectors integrated | Industry Team |
| 41-42 | Deploy Messaging integrations (Slack, Telegram) | Team communication connected | Backend Team |
| 43-44 | Comprehensive privacy audit | All data flows verified | Security Team |
| 45 | Performance testing | Load testing complete | QA Team |
| 46 | User acceptance testing | Stakeholder sign-off | Product Team |
| 47-48 | Production deployment & monitoring | Go-live with monitoring | DevOps |

**Milestone**: Genie OS fully operational with all 26 services and 10+ industry connectors.

---

## Appendix A: Service Port Reference

| Service Category | Service | Port | Protocol |
|-----------------|---------|------|----------|
| Memory Core | genie-memory-service | 4703 | HTTP/REST |
| Memory Core | genie-relationship-service | 4704 | HTTP/REST |
| Communication | genie-briefing-service | 4706 | HTTP/REST |
| Integration | genie-sync-service | 4707 | HTTP/REST |
| Notetaking | genie-obsidian-service | 4708 | HTTP/REST |
| Communication | genie-calendar-service | 4709 | HTTP/REST |
| Notetaking | genie-notion-service | 4709 | HTTP/REST |
| Communication | genie-email-service | 4710 | HTTP/REST |
| Messaging | genie-slack-service | 4710 | HTTP/REST |
| Messaging | genie-telegram-service | 4711 | HTTP/REST |
| Communication | genie-voice-service | 4712 | HTTP/REST + WebSocket |
| Communication | genie-meeting-service | 4713 | HTTP/REST |
| Personal Twin | TwinOS | 4142 | HTTP/REST + WebSocket |
| Personal Twin | Personal Twin Service | 4860 | HTTP/REST |

---

## Appendix B: API Rate Limits

| Endpoint Category | Limit | Window | Notes |
|------------------|-------|--------|-------|
| Personal Twin CRUD | 1000 | per minute | Per user |
| Memory operations | 5000 | per minute | Per user |
| Industry context pull | 500 | per minute | Per industry |
| Bridge context injection | 100 | per minute | Per user |
| Privacy API | 100 | per minute | Per user |
| WebSocket connections | 50 | per user | Max concurrent |

---

## Appendix C: Data Retention

| Data Category | Retention Period | User Control |
|--------------|------------------|--------------|
| Personal Twin | Until user deletes | Yes (immediate deletion) |
| Memory - short term | 90 days | Yes (configurable) |
| Memory - long term | 2 years | Yes (configurable) |
| Industry context | Per industry rules | Yes (per industry) |
| Consent records | 3 years | No (audit requirement) |
| Audit logs | 3 years | No (audit requirement) |

---

## Appendix D: Security Requirements

- All API calls over TLS 1.3
- OAuth 2.0 authentication for all services
- Role-based access control (RBAC)
- Personal data encrypted at rest (AES-256)
- Consent-based data sharing with audit trail
- Minimum necessary access principle
- Comprehensive audit logging for all data access
- Annual penetration testing
- GDPR/CCPA compliance mechanisms

---

**Document Control:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-06-12 | RTMN Architecture Team | Initial specification |

---

*Genie OS - The Personal Intelligence Layer of RTMN*
