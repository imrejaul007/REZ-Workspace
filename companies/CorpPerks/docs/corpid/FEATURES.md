# CorpID - Universal Identity Features

**Product:** CorpID
**Version:** 2.0.0
**URL:** https://corpid.io
**Last Updated:** June 12, 2026

---

## Overview

CorpID is the universal employee identity system for the RTNM ecosystem. It provides a single identity that works across all RTNM products and services, enabling seamless authentication and data synchronization.

---

## Core Features

### Identity Management
| Feature | Description | Status |
|---------|-------------|--------|
| Universal ID | Single ID across all products | ✅ |
| Profile Management | Complete identity profile | ✅ |
| Identity Verification | KYC and verification | ✅ |
| Document Storage | Identity documents | ✅ |
| Biometric Linking | Face ID, fingerprint | ✅ |
| QR Code Identity | Digital ID cards | ✅ |
| Access Control | Role-based permissions | ✅ |

### Authentication
| Feature | Description | Status |
|---------|-------------|--------|
| Single Sign-On (SSO) | One login for all apps | ✅ |
| OAuth 2.0 | Standard OAuth flow | ✅ |
| JWT Tokens | Secure token issuance | ✅ |
| MFA Support | Multi-factor authentication | ✅ |
| Biometric Auth | Face/fingerprint login | ✅ |
| OTP Auth | One-time passwords | ✅ |
| Session Management | Secure sessions | ✅ |
| Token Refresh | Auto token refresh | ✅ |

### User Management
| Feature | Description | Status |
|---------|-------------|--------|
| User Registration | Create identity | ✅ |
| User Lookup | Search users | ✅ |
| Profile Sync | Sync across products | ✅ |
| Deactivation | Disable accounts | ✅ |
| Audit Logging | Track all changes | ✅ |
| Bulk Operations | Bulk sync | ✅ |

### Profile Data
| Feature | Description | Status |
|---------|-------------|--------|
| Personal Info | Name, DOB, gender | ✅ |
| Contact Info | Email, phone, address | ✅ |
| Employment Info | Company, department, role | ✅ |
| Emergency Contacts | Emergency details | ✅ |
| Documents | ID proofs, certificates | ✅ |
| Preferences | App preferences | ✅ |
| Activity History | Login history | ✅ |

### Integration Features
| Feature | Description | Status |
|---------|-------------|--------|
| API Access | REST API for products | ✅ |
| Webhook Sync | Real-time sync | ✅ |
| SDK Support | JavaScript SDK | ✅ |
| Mobile SDK | React Native SDK | ✅ |
| Admin Portal | CorpID admin | ✅ |
| Partner Dashboard | Partner management | ✅ |

---

## Screens & Pages

### User Portal
- `/dashboard` - Identity dashboard
- `/profile` - View profile
- `/profile/edit` - Edit profile
- `/documents` - Document management
- `/security` - Security settings
- `/preferences` - App preferences
- `/activity` - Activity history
- `/connected-apps` - Connected applications

### Admin Portal
- `/admin` - Admin dashboard
- `/admin/users` - User management
- `/admin/users/[id]` - User detail
- `/admin/organizations` - Organization management
- `/admin/integrations` - Integration settings
- `/admin/audit` - Audit logs
- `/admin/settings` - System settings

### Partner Portal
- `/partner` - Partner dashboard
- `/partner/apps` - Connected apps
- `/partner/api` - API configuration
- `/partner/webhooks` - Webhook setup
- `/partner/reports` - Usage reports

---

## Integrations

### CorpPerks Integration
| Service | Integration | Status |
|---------|-------------|--------|
| peopleos | Employee identity | ✅ |
| talentai | Career profile | ✅ |
| insight-campus | Student identity | ✅ |
| people (mobile) | Mobile auth | ✅ |
| manager-app | Manager auth | ✅ |
| api-gateway | Central auth | ✅ |

### Other RTNM Products
| Product | Integration | Status |
|---------|-------------|--------|
| REZ Merchant | Merchant identity | ✅ |
| REZ Stayown | Tenant identity | ✅ |
| REZ Care | User identity | ✅ |
| HOJAI AI | AI user identity | ✅ |
| RABTUL | Payment identity | ✅ |

---

## API Endpoints

### Authentication
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v2/auth/login` | POST | User login |
| `/api/v2/auth/verify` | POST | Verify token |
| `/api/v2/auth/refresh` | POST | Refresh token |
| `/api/v2/auth/logout` | POST | Logout |
| `/api/v2/auth/mfa/setup` | POST | Setup MFA |
| `/api/v2/auth/mfa/verify` | POST | Verify MFA |

### Users
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v2/users` | GET/POST | List/Create users |
| `/api/v2/users/:id` | GET/PUT/DELETE | User CRUD |
| `/api/v2/users/:id/profile` | GET/PUT | Profile |
| `/api/v2/users/:id/documents` | GET/POST | Documents |
| `/api/v2/users/:id/activity` | GET | Activity history |

### Search
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v2/users/search` | GET | Search users |
| `/api/v2/users/lookup` | GET | Lookup by ID |

### Organizations
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v2/orgs` | GET/POST | Organizations |
| `/api/v2/orgs/:id` | GET/PUT | Org detail |
| `/api/v2/orgs/:id/users` | GET | Org users |

### Webhooks
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v2/webhooks` | GET/POST | Manage webhooks |
| `/api/v2/webhooks/:id` | PUT/DELETE | Webhook CRUD |

---

## Technology Stack

### Core
- **Runtime:** Node.js 20
- **Framework:** Express.js
- **Database:** MongoDB
- **Cache:** Redis
- **Auth:** JWT, OAuth 2.0

### SDKs
- **JavaScript SDK:** Browser SDK
- **React Native SDK:** Mobile SDK
- **REST API:** Full API access

### Security
- **Encryption:** AES-256
- **TLS:** All communications
- **Rate Limiting:** Per-endpoint limits
- **Audit:** Complete logging

---

## Related Documentation

- [CorpPerks README](/README.md) - Main documentation
- [CorpID v2.0 Migration](/docs/CORPID-MIGRATION.md) - Migration guide
- [RTNM Companies Audit](/RTNM-COMPANIES-AUDIT.md) - RTNM ecosystem

---

*Last Updated: June 12, 2026*
*CorpID - Universal Identity*