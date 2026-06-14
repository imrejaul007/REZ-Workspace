# REZ Forms - AI-Powered Form Builder (Tally Competitor)

**Build forms with natural language. Auto-create leads. Trigger Genie AI agents. QR-powered offline forms.**

---

## Features

### 🎯 Core Features

| Feature | Description |
|---------|-------------|
| **AI Form Builder** | Type "Create a contact form for my salon" → Form created |
| **Document Editor** | Tally-like block-based editor |
| **20+ Field Types** | Text, email, phone, rating, signature, payment, file upload |
| **Conditional Logic** | Show/hide fields based on answers (visual builder) |
| **Calculations** | Math expressions, totals, scores |
| **QR Codes** | Offline form access via QR |
| **Workflow Automation** | Auto-create leads, send emails, trigger AI agents |
| **CorpID Integration** | Auto-fill with logged-in user data |
| **Genie AI Triggers** | Fire AI agents on submission |
| **SafeQR Mode** | Emergency/verification forms |
| **Embeddable** | 1-line code, WordPress, React SDK |

### 📊 Analytics

| Metric | Description |
|--------|-------------|
| **Response Count** | Total submissions tracking |
| **Completion Rate** | Form completion percentage |
| **Avg. Time** | Average completion time |
| **Submissions Chart** | Daily submissions over time |
| **Device Breakdown** | Desktop/Mobile/Tablet stats |
| **Field Performance** | Per-field completion rates |
| **CSV Export** | Download all responses |

### 📋 Response Manager

| Feature | Description |
|---------|-------------|
| **Response List** | Table view with search |
| **Detail View** | Modal with all answers |
| **Pagination** | Navigate through responses |
| **CSV Export** | Download submissions |
| **Device Info** | Track submission device |

### 🔀 Conditional Logic

| Feature | Description |
|---------|-------------|
| **Visual Builder** | No-code condition creator |
| **8 Operators** | equals, contains, greater than, etc. |
| **AND/OR Logic** | Complex condition combinations |
| **3 Actions** | Show, Hide, Require fields |
| **Live Preview** | Test conditions in editor |

### 📁 Template Library

| Template | Fields | Category |
|---------|--------|----------|
| Basic Contact | 4 | Contact |
| Detailed Contact | 7 | Contact |
| Quick Feedback | 3 | Feedback |
| NPS Survey | 6 | Feedback |
| Event RSVP | 5 | Registration |
| Job Application | 8 | Lead |
| Appointment Booking | 6 | Appointment |
| Salon Booking | 7 | Appointment |
| Product Order | 8 | Order |
| Newsletter Signup | 2 | Lead |

### 🧮 Calculated Fields

| Feature | Description |
|---------|-------------|
| **Math Expressions** | +, -, *, /, % operators |
| **Functions** | SUM, AVG, MIN, MAX, ROUND, IF |
| **Field References** | Use other field values in calculations |
| **Live Preview** | See calculated results in real-time |

### 🔀 Skip Logic

| Feature | Description |
|---------|-------------|
| **Visual Flow** | See question flow at a glance |
| **Smart Navigation** | Jump to specific questions |
| **Condition Types** | equals, contains, greater than, etc. |
| **Forward Only** | Can only skip forward (no going back) |

### 🎨 Form Themes

| Theme | Style |
|-------|-------|
| Minimal | Clean and simple |
| Soft | Friendly and approachable |
| Bold | Strong visual impact |
| Nature | Organic and calming |
| Ocean | Professional and trustworthy |
| Sunset | Warm and inviting |
| Midnight | Dark and elegant |
| Luxury | Premium and sophisticated |
| Playful | Fun and energetic |
| Corporate | Professional and clean |

### 📧 Email Templates

| Feature | Description |
|---------|-------------|
| **Confirmation** | Auto-send to submitter |
| **Notification** | Alert admin on new submission |
| **Custom Templates** | Fully customizable |
| **Variables** | {{form_title}}, {{respondent_name}}, etc. |

### 🛡️ Spam Protection

| Feature | Description |
|---------|-------------|
| **CAPTCHA** | Simple math or reCAPTCHA |
| **Honeypot** | Hidden spam trap field |
| **Rate Limiting** | Max submissions per IP |
| **Disposable Blocker** | Block temp email domains |
| **Consent Checkbox** | GDPR compliance |

---

## Quick Start

### 1. Start API Server

```bash
cd RABTUL-Technologies/REZ-forms-service
npm install
npm run dev
```

**Server runs at:** `http://localhost:4092`

### 2. Start UI

```bash
cd apps/ui
npm install
npm run dev
```

**UI runs at:** `http://localhost:3005`

### 3. Start Public Form Filler

```bash
# Access at: http://localhost:3005/f/{formId}
```

---

## API Endpoints

### Forms

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/forms` | Create form |
| GET | `/api/forms` | List forms |
| GET | `/api/forms/:id` | Get form |
| PATCH | `/api/forms/:id` | Update form |
| DELETE | `/api/forms/:id` | Delete form |
| POST | `/api/forms/:id/publish` | Publish form |
| POST | `/api/forms/:id/unpublish` | Unpublish form |
| POST | `/api/forms/:id/qr` | Enable QR |
| POST | `/api/forms/:id/fields` | Add field |
| POST | `/api/forms/:id/workflows` | Add workflow |
| GET | `/api/forms/:id/analytics` | Get analytics |
| GET | `/api/forms/:id/share` | Get share URLs |

### AI

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/generate` | Generate form structure |
| POST | `/api/ai/generate/save` | Generate and save |
| POST | `/api/ai/enhance` | Suggest field enhancements |
| POST | `/api/ai/detect-type` | Detect form type |
| POST | `/api/ai/analyze` | Analyze form quality |
| POST | `/api/ai/conditional-logic` | Suggest logic rules |

### Submissions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/submissions/:formId` | Submit form |
| GET | `/api/submissions/:id` | Get submission |
| GET | `/api/submissions/form/:formId` | List submissions |
| GET | `/api/submissions/form/:formId/export` | Export CSV |
| GET | `/api/submissions/form/:formId/analytics` | Get analytics |

### Workflows

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/workflows` | Create workflow |
| GET | `/api/workflows/templates` | Get templates |
| GET | `/api/workflows/integrations` | Get integrations |
| POST | `/api/workflows/test` | Test workflow |

### Webhooks

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/webhooks` | Create webhook |
| GET | `/api/webhooks` | List webhooks |
| PATCH | `/api/webhooks/:id` | Update webhook |
| DELETE | `/api/webhooks/:id` | Delete webhook |
| POST | `/api/webhooks/:id/test` | Test webhook |

---

## Field Types

| Type | Description |
|------|-------------|
| `short_text` | Single line text |
| `long_text` | Multi-line text |
| `email` | Email validation |
| `phone` | Phone number |
| `number` | Numeric input |
| `date` | Date picker |
| `time` | Time picker |
| `datetime` | Date and time |
| `url` | Website URL |
| `file_upload` | File attachments |
| `multiple_choice` | Radio options |
| `dropdown` | Select menu |
| `checkbox` | Multi-select |
| `yes_no` | Yes/No toggle |
| `rating` | Star rating (1-5) |
| `scale` | 1-10 scale |
| `signature` | Digital signature |
| `payment` | Payment field |
| `calculation` | Computed value |
| `hidden` | Hidden field |

---

## Workflow Actions

| Action | Description |
|--------|-------------|
| `create_lead` | Create lead in REZ Merchant |
| `add_to_list` | Add to email/SMS list |
| `send_email` | Send confirmation email |
| `send_sms` | Send SMS notification |
| `send_webhook` | POST to external URL |
| `trigger_genie` | Fire Genie AI agent |
| `create_safe_qr` | Generate SafeQR |
| `add_to_crm` | Add to CorpID CRM |

---

## Embed Forms

### HTML

```html
<iframe src="https://forms.rez.money/embed/{formId}" width="100%" height="600"></iframe>
```

### React

```bash
npm install @rez/forms-sdk
```

```tsx
import { FormEmbed, FormWidget } from '@rez/forms-sdk/react';

// Embed form
<FormEmbed formId="xxx" />

// Interactive widget
<FormWidget username="salon" slug="booking" />
```

### WordPress

```
[rez_form id="xxx"]
```

---

## Project Structure

```
REZ-forms-service/
├── src/                          # API Server (Express)
│   ├── index.ts                  # Main server
│   ├── types/index.ts            # Type definitions
│   ├── services/
│   │   ├── formService.ts        # Form CRUD operations
│   │   ├── aiFormService.ts      # AI form generation
│   │   └── submissionService.ts  # Submissions + workflows
│   └── routes/
│       ├── forms.ts              # Form endpoints
│       ├── submissions.ts        # Submission endpoints
│       ├── ai.ts                 # AI endpoints
│       ├── workflows.ts          # Workflow endpoints
│       └── webhooks.ts           # Webhook endpoints
├── apps/ui/                      # Next.js UI
│   ├── src/app/
│   │   ├── page.tsx              # Dashboard
│   │   ├── layout.tsx            # Root layout
│   │   ├── globals.css           # Global styles
│   │   └── f/[formId]/page.tsx  # Public form filler
│   └── src/components/
│       ├── FormList.tsx          # Form cards grid
│       ├── FormEditor.tsx       # Tally-like editor
│       ├── FormPreview.tsx      # Live preview
│       ├── SettingsPanel.tsx     # Form settings
│       ├── AIAssistant.tsx      # AI generation modal
│       ├── AnalyticsDashboard.tsx # Stats + charts
│       ├── ResponseManager.tsx   # Response table
│       ├── ConditionalLogicEditor.tsx # Logic builder
│       └── TemplateLibrary.tsx  # Template gallery
└── sdk/                          # JavaScript SDK
    └── README.md
```

---

## Competitive Advantage vs Tally

| Feature | Tally | REZ Forms |
|---------|-------|-----------|
| AI Form Generation | ❌ | ✅ Natural language |
| REZ Ecosystem | ❌ | ✅ Native integration |
| QR-Powered Forms | ❌ | ✅ Offline capable |
| Genie AI Agents | ❌ | ✅ Trigger on submit |
| SafeQR Mode | ❌ | ✅ Emergency forms |
| CorpID Identity | ❌ | ✅ Auto-fill |
| Lead Auto-Capture | ❌ | ✅ REZ Merchant |
| Analytics Dashboard | ❌ | ✅ Built-in |
| Conditional Logic | ✅ | ✅ Visual builder |
| Template Library | ❌ | ✅ 12+ templates |
| **Free Plan** | ✅ Unlimited | ✅ Unlimited |

---

## Environment Variables

```bash
# Server
PORT=4092
NODE_ENV=development

# Database (PostgreSQL)
DATABASE_URL=postgresql://postgres:password@localhost:5432/rez_forms

# REZ Ecosystem
REZ_MERCHANT_URL=http://localhost:4000
REZ_NOTIFICATION_URL=http://localhost:4011
HOJAI_URL=http://localhost:4800

# Internal Auth
INTERNAL_SERVICE_TOKEN=your-token
```

---

## Documentation

- [API Docs](http://localhost:4092/api/docs)
- [Type Definitions](src/types/index.ts)
- [Form Service](src/services/formService.ts)
- [AI Service](src/services/aiFormService.ts)
- [Submission Service](src/services/submissionService.ts)

---

## License

MIT - Part of the REZ ecosystem