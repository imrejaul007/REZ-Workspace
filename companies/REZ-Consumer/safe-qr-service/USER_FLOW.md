# ReZ Safe QR - Complete User Flow

## Overview

ReZ Safe QR enables users to create QR codes that allow finders to contact them anonymously without revealing personal information.

---

## User Journey

### PHASE 1: User Sets Up QR

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ STEP 1: Download App │
└──────────────────────────────────────────────────────────────────────────────┘
 │
 ▼
 User downloads "ReZ Safe QR" app from Play Store / App Store
 │
 ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ STEP 2: Sign Up (OTP) │
└──────────────────────────────────────────────────────────────────────────────┘
 │
 ▼
 Enter phone number → Receive OTP → Verify → Account created
 │
 ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ STEP 3: Create Safe QR │
└──────────────────────────────────────────────────────────────────────────────┘
 │
 ▼
 ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
 │ Pet │ Device │ Medical │ Vehicle │ ...
 └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
 │
 Select mode → Enter details → Create QR
 │
 ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ STEP 4: Get QR │
└──────────────────────────────────────────────────────────────────────────────┘
 │
 ▼
 Receive shortcode (e.g., REZP01)
 QR code generated with embedded shortcode
 │
 ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ STEP 5: Print & Attach │
└──────────────────────────────────────────────────────────────────────────────┘
 │
 ▼
 ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
 │ Download QR │ Print Sticker │ Attach to Item │
 └────────────────┘ └────────────────┘ └────────────────┘
 │
 ▼
 QR sticker attached to:
 - Pet collar
 - Laptop back
 - Medical bracelet
 - Vehicle window
 - etc.
```

### PHASE 2: Finder Scans QR

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ FINDER SCANS QR │
└──────────────────────────────────────────────────────────────────────────────┘
 │
 ▼
 ┌─────────────┐ ┌─────────────┐
 │ Camera App │ ReZ App │ Any QR Scanner │
 └─────────────┘ └─────────────┘
 │
 ▼
 Opens scan result page: https://rez.app/s/REZP01
 │
 ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ FINDER SEES: │
└──────────────────────────────────────────────────────────────────────────────┘
 │
 ┌──────────────────────────────────────────────────────────────────────────┐
 │ │
 │ 🐕 BRUNO │
 │ Golden Retriever │
 │ │
 │ [Found Pet] [Contact Owner] [Call Emergency] │
 │ │
 │ ───────────────────────── │
 │ │
 │ Quick Messages: │
 │ [I found your pet!] │
 │ [I see it near...] │
 │ [Contact me when...] │
 │ │
 │ Or send custom message... │
 │ │
 └──────────────────────────────────────────────────────────────────────────┘
 │
 ▼
 Finder selects template OR types custom message
 │
 ▼
 Optional: Share location
 │
 ▼
 Message sent (finder identity masked)
```

### PHASE 3: Owner Receives Message

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ OWNER RECEIVES NOTIFICATION │
└──────────────────────────────────────────────────────────────────────────────┘
 │
 ▼
 ┌─────────────────────────────────────────────────────┐
 │ 📱 NOTIFICATION │
 │ │
 │ 💬 New message for "Bruno" │
 │ "I found your pet near City Park" │
 │ │
 │ [Reply] │
 └─────────────────────────────────────────────────────┘
 │
 ▼
 Notification via:
 ├── Push notification (app)
 ├── SMS
 └── WhatsApp (optional)
 │
 ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ OWNER OPENS APP │
└──────────────────────────────────────────────────────────────────────────────┘
 │
 ▼
 ┌─────────────────────────────────────────────────────┐
 │ 📊 DASHBOARD │
 │ │
 │ My Safe QRs │
 │ ├─ 🐕 Bruno (REZP01) - ACTIVE │
 │ │ └─ 12 scans, 3 messages │
 │ │ │
 │ ├─ 💻 MacBook (REZD01) - ACTIVE │
 │ │ └─ 5 scans, 1 message │
 │ │ │
 │ └─ 🚗 Swift (REZV01) - LOST ⚠️ │
 │ └─ 25 scans, 8 messages │
 │ │
 │ ──────────────────────────── │
 │ │
 │ Recent Activity │
 │ ├─ New message on Bruno │
 │ └─ Scan on MacBook │
 └─────────────────────────────────────────────────────┘
 │
 ▼
 Owner taps conversation
 │
 ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ CONVERSATION VIEW │
└──────────────────────────────────────────────────────────────────────────────┘
 │
 ┌─────────────────────────────────────────────────────┐
 │ 🐕 Bruno - REZP01 │
 │ │
 │ ───────────────────────────────────────── │
 │ Finder: Hi! I found your pet near City Park │
 │ 10:30 AM │
 │ │
 │ Finder: It's safe and waiting │
 │ 10:31 AM │
 │ │
 │ Owner: Thank you! I'm on my way │
 │ 10:35 AM │
 │ │
 │ [Type message...] [Send] │
 │ │
 │ ───────────────────────────────────────── │
 │ [Mark as Found] [Share Location] │
 └─────────────────────────────────────────────────────┘
 │
 ▼
 Owner can:
 ├── Reply to message
 ├── Share contact info (optional)
 ├── Mark item as found
 └── Award karma points to helpful finder
```

---

## Message Flow

```
FINDER ──────── Anonymous Relay ──────── OWNER
 │ Service │
 │ │
 │ (Finder's phone hidden) │
 │ │
 │ (Only RelaySession ID) │
 │ │
 │ (Owner sees: "Finder") │
 │ │
 ▼
 finder scans QR
 │
 ▼
 sends message
 │
 ▼
 message stored
 in relay service
 │
 ▼
 owner notified
 │
 ▼
 owner opens
 conversation
 │
 ▼
 owner reads
 message
 │
 ▼
 owner replies
 (optional)
```

---

## Notification Channels

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ NOTIFICATIONS │
└─────────────────────────────────────────────────────────────────────────────┘

OWNER receives notifications via:
 │
 ├── 📱 Push Notification (Primary)
 │ └─ When app is installed
 │
 ├── 💬 WhatsApp (Optional)
 │ └─ If user enables WhatsApp notifications
 │ └─ Via ReZ WhatsApp Commerce
 │
 ├── 📧 Email (Optional)
 │ └─ Daily digest option
 │
 └── 🔔 In-App Notifications
 └─ Always active
```

---

## Web Access (Print/Download)

```
Owner can also access QR via web:
 │
 ▼
 https://rez.app/s/REZP01/print
 │
 ▼
 ┌─────────────────────────────────────────────────────┐
 │ PRINTABLE QR PAGE │
 │ │
 │ ┌─────────────────┐ │
 │ │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │ │
 │ │ ▓ QR CODE ▓ │ │
 │ │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │ │
 │ └─────────────────┘ │
 │ │
 │ REZP01 │
 │ Bruno │
 │ │
 │ [Print] [Download PNG] [Download PDF] │
 │ │
 │ How it works: │
 │ 1. Print this QR │
 │ 2. Attach to your pet │
 │ 3. Get notified when found │
 └─────────────────────────────────────────────────────┘
```

---

## API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/qr` | POST | Create QR |
| `/api/qr/my` | GET | List user's QRs |
| `/api/scan/:shortcode` | GET | Scan QR (public) |
| `/api/scan/:shortcode/message` | POST | Send message (public) |
| `/api/sessions` | GET | List conversations |
| `/api/sessions/:id/messages` | GET | Get messages |
| `/api/dashboard` | GET | Dashboard data |
| `/print/:shortcode` | GET | Printable page |

---

## Data Flow

```
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ User App │ │ Safe QR │ │ Relay │
│ │ Service │ │ Service │
└──────┬──────┘ └──────┬──────┘ └──────┬──────┘
 │ │ │
 │ ▼ │
 │ ┌─────────────┐ │
 │ │ MongoDB │ │
 │ └─────────────┘ │
 │ │ │
 └─────────────┘ │
 │
 ▼
┌─────────────────────────────────────────────────────┐
│ NOTIFICATIONS │
├─────────────┬─────────────┬─────────────┬─────────────┤
│ Push │ WhatsApp │ SMS │ Email │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

---

## Privacy Model

```
WHAT FINDER SEES:
 ├── Public profile (name, photo, description)
 ├── Quick message templates
 ├── Custom message option
 └── Contact request button

WHAT FINDER DOESN'T SEE:
 ├── Owner's phone number
 ├── Owner's email
 ├── Owner's address
 └── Owner's identity

WHAT OWNER SEES:
 ├── Finder's message
 ├── Finder's general location (city)
 └── Finder's karma level
```

---

## Summary

1. **User creates QR** → Download app → Select mode → Add details → Get QR
2. **User prints QR** → Print page → Attach to item
3. **Finder scans** → Sees public profile → Sends message
4. **Owner receives** → Push/WhatsApp notification → Opens app → Reads message → Replies
5. **Item found** → Owner marks as found → Karma awarded to helpful finder
