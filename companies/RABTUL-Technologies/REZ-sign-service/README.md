# REZ Sign - DocuSign Competitor

**Electronic signatures for everyone.**

---

## Features

| Feature | Description |
|---------|-------------|
| **E-Signatures** | Sign documents online |
| **Templates** | Reusable document templates |
| **Bulk Send** | Send to multiple signers |
| **Fields** | Text, checkbox, date, signature |
| **Audit Trail** | Complete signing history |
| **Reminders** | Auto-reminders |
| **Webhooks** | Real-time notifications |
| **Integrations** | Google Drive, Dropbox, Box |

---

## Quick Start

```bash
cd RABTUL-Technologies/REZ-sign-service
npm install
npm run dev
```

**Port:** 4104

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/documents` | Create document |
| GET | `/api/documents` | List documents |
| GET | `/api/documents/:id` | Get document |
| DELETE | `/api/documents/:id` | Delete document |
| POST | `/api/documents/:id/send` | Send for signature |
| POST | `/api/documents/:id/remind` | Remind signer |
| GET | `/api/documents/:id/status` | Get status |

---

## Document Types

| Type | Description |
|------|-------------|
| PDF | Upload PDF or we convert |
| Word | DOC, DOCX supported |
| Contract | Pre-built templates |
| Agreement | Standard contracts |
| Form | Fillable forms |

---

## Signature Fields

| Field | Type |
|-------|------|
| Signature | Draw or type |
| Initials | Initials only |
| Date | Auto-filled date |
| Text | Text input |
| Checkbox | Agreement checkbox |
| Dropdown | Select option |
| Radio | Multiple choice |
| Attachment | Upload files |

---

## Workflows

| Step | Description |
|------|-------------|
| Sequential | Sign one by one |
| Parallel | Sign simultaneously |
| Witness | Third-party witness |
| Notarize | Notary required |

---

## Competitive Advantage vs DocuSign

| Feature | DocuSign | REZ Sign |
|---------|----------|----------|
| Free Plan | 3 docs/mo | 10 docs/mo |
| Templates | ✅ Pro | ✅ |
| Bulk Send | ✅ Pro | ✅ |
| API Access | ✅ | ✅ |
| Integrations | 300+ | 50+ |
| Audit Trail | ✅ | ✅ |
| Auto Reminders | ✅ | ✅ |

---

## Documentation

See `/docs/` for full API documentation.
