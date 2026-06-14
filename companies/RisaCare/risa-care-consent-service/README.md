# RisaCare Consent Service

**Healthcare Consent Management**

Service for managing patient consents, data sharing permissions, and HIPAA/DPDP Act compliance.

## Overview

RisaCare Consent Service handles:
- Patient consent management
- Data sharing permissions
- Treatment consents
- Privacy preferences
- Audit trail
- Consent revocations

## Features

### Consent Types
- Treatment consent
- Data sharing consent
- Research participation
- Marketing communications
- Third-party access
- Teleconsultation consent

### Consent Management
- Granular consent options
- Versioned consent forms
- Time-limited consents
- Automatic expiration
- Renewal reminders

### Privacy Controls
- Data visibility settings
- Provider access control
- Family data sharing
- Export preferences
- Deletion requests

### Compliance
- HIPAA compliance tracking
- DPDP Act compliance
- Audit logging
- Consent history
- Regulatory reporting

## Quick Start

```bash
cd risa-care-consent-service
npm install
npm run dev
```

Service runs on **port 4705**.

## API Endpoints

### Consents
```
POST /api/consents                           - Create consent
GET  /api/consents/:userId                 - Get user's consents
GET  /api/consents/:consentId              - Get consent details
PUT  /api/consents/:consentId               - Update consent
DELETE /api/consents/:consentId            - Revoke consent
```

### Consent Templates
```
GET  /api/consents/templates                - List templates
GET  /api/consents/templates/:templateId   - Get template
POST /api/consents/templates               - Create template
```

### Privacy Settings
```
GET  /api/privacy/:userId                 - Get privacy settings
PUT  /api/privacy/:userId                 - Update settings
GET  /api/privacy/:userId/sharing         - Get sharing preferences
PUT  /api/privacy/:userId/sharing         - Update sharing
```

### Audit Trail
```
GET  /api/consents/audit/:userId           - Get consent audit trail
GET  /api/consents/audit/:consentId        - Get consent history
```

## Usage Examples

### Grant Treatment Consent
```bash
curl -X POST http://localhost:4705/api/consents \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "type": "treatment",
    "providerId": "doc-456",
    "providerName": "City Hospital",
    "description": "General treatment and diagnostic procedures",
    "expiresAt": "2025-12-31T23:59:59Z",
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0..."
  }'
```

### Update Privacy Settings
```bash
curl -X PUT http://localhost:4705/api/privacy/user-123 \
  -H "Content-Type: application/json" \
  -d '{
    "shareWithProviders": true,
    "shareWithFamily": false,
    "allowResearch": false,
    "allowMarketing": false,
    "dataExportEnabled": true,
    "dataDeletionEnabled": true
  }'
```

### Get Consent Audit Trail
```bash
curl "http://localhost:4705/api/consents/audit/user-123?from=2024-01-01&to=2024-12-31"
```

## Consent Types

| Type | Description |
|------|-------------|
| treatment | General medical treatment |
| procedure | Specific medical procedure |
| teleconsult | Video consultation |
| data_sharing | Data sharing with providers |
| research | Research participation |
| marketing | Marketing communications |
| third_party | Third-party app access |

## Privacy Settings

| Setting | Default | Description |
|---------|---------|-------------|
| shareWithProviders | true | Share data with healthcare providers |
| shareWithFamily | false | Share data with family members |
| allowResearch | false | Allow anonymized research use |
| allowMarketing | false | Allow promotional communications |
| dataExportEnabled | true | Allow data export |
| dataDeletionEnabled | true | Allow account deletion |

## Compliance Features

### HIPAA Compliance
- Consent documentation
- Minimum necessary data
- Access controls
- Audit logging
- Breach notification

### DPDP Act Compliance
- Consent as contract
- Purpose limitation
- Data minimization
- Right to erasure
- Grievance redressal

## Integration

Integrates with:
- RisaCare API Gateway (4700)
- RisaCare Profile Service (4701)
- RABTUL Auth (4002) for verification
- HOJAI Governance (4501) for audit logging

## Port Configuration

| Service | Port |
|---------|------|
| Consent Service | 4705 |

## License

Proprietary - RTNM Group
