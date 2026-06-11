# CARECODE IVR System

**Interactive Voice Response for Healthcare**

Multi-language IVR system with DTMF navigation, call transfers, voicemail, and healthcare-specific workflows.

## Features

- **Multi-language Support**: English, Hindi, Tamil, Telugu, Bengali, Marathi
- **DTMF Navigation**: Touch-tone menu system
- **Smart Routing**: Transfer to appropriate department
- **Voicemail**: Record and transcribe messages
- **Appointment Booking**: Integration with booking system
- **Emergency Handling**: Escalation to emergency services
- **Callback Requests**: Queue-based callback system
- **Twilio Integration**: Production-ready webhook handlers

## Quick Start

```bash
npm install
npm run dev
```

## Environment Variables

```env
PORT=4857
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
RECEPTION_NUMBER=+919876543210
NURSE_LINE_NUMBER=+919876543211
EMERGENCY_NUMBER=108
DOCTOR_ON_CALL_NUMBER=+919876543212
BILLING_NUMBER=+919876543213
LAB_RESULTS_NUMBER=+919876543214
```

## API Endpoints

### Calls
- `POST /api/calls` - Create new call
- `GET /api/calls` - List all calls
- `GET /api/calls/:id` - Get call by ID

### Sessions
- `GET /api/sessions` - Get active sessions
- `GET /api/sessions/:id` - Get session details
- `POST /api/sessions/:id/update` - Update session (DTMF)

### Voicemails
- `GET /api/voicemails` - List voicemails
- `PUT /api/voicemails/:id/review` - Mark as reviewed

### Callbacks
- `GET /api/callbacks` - List callback requests
- `POST /api/callbacks` - Create callback request
- `PUT /api/callbacks/:id` - Update callback

### Statistics
- `GET /api/stats` - Get IVR statistics
- `GET /api/menus` - List IVR menus
- `POST /api/menus` - Create/update menu

## Webhook Endpoints

### Twilio Webhooks
- `POST /webhook/twilio/voice` - Incoming call handler
- `POST /webhook/twilio/gather` - DTMF input handler
- `POST /webhook/twilio/status` - Call status callback
- `POST /webhook/twilio/voicemail` - Voicemail recording

## IVR Menu Structure

```
main_en (Language Selection)
├── main_en_healthcare (Healthcare Menu)
│   ├── appointment_en (Appointments)
│   │   ├── Book Appointment
│   │   ├── Reschedule
│   │   └── Cancel
│   ├── location_en (Location Info)
│   │   ├── Hospital Address
│   │   ├── Clinic Locations
│   │   └── Emergency Room
│   ├── health_info_en (Health Information)
│   ├── voicemail_en (Leave Message)
│   └── emergency_en (Emergency)
├── main_hi (Hindi)
└── main_ta (Tamil)
```

## Transfer Targets

| Target | Description |
|--------|-------------|
| reception | Main reception |
| nurse_line | Nurse triage line |
| emergency | Emergency services (108) |
| doctor_on_call | On-call doctor |
| billing_department | Billing inquiries |
| lab_results | Lab results line |

## License

Proprietary - RTNM Group
