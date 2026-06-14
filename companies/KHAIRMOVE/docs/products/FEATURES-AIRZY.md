# Airzy - Complete Features

**Last Updated:** June 12, 2026

---

## ✈️ Airzy - Premium Airport Ecosystem

> "Smart companion for frequent travelers"

---

## Layer 1 - Travel Utility

### Flight Features
- [x] Flight search (Amadeus)
- [x] Flight booking
- [x] Real-time flight status
- [x] Delay notifications
- [x] Gate change alerts
- [x] Boarding reminders
- [x] Flight check-in
- [x] Boarding pass storage

### Hotel Features
- [x] Airport hotel search
- [x] Hotel booking
- [x] Day-use rooms
- [x] Transit hotel booking
- [x] Price comparison

### Transfer Features
- [x] Airport cab booking (ReZ Ride)
- [x] Shuttle booking
- [x] Rent-a-car integration
- [x] Metro/train schedules
- [x] Auto-generated transfer suggestions

---

## Layer 2 - Airport Experience

### Lounge Features
- [x] Lounge discovery (1000+ DreamFolks)
- [x] Lounge booking
- [x] Priority Pass integration (700+ lounges)
- [x] Lounge availability check
- [x] Access pass generation
- [x] QR code check-in
- [x] Lounge reviews & photos
- [x] Amenities filter (shower, food, WiFi)

### Dining Features
- [x] Airport restaurant search
- [x] Menu browsing
- [x] Table reservation
- [x] Pre-order food
- [x] Digital payments
- [x] Reviews & ratings

### Navigation Features
- [x] Terminal map
- [x] Gate navigation
- [x] Walking time estimates
- [x] Points of interest
- [x] Wheelchair accessibility
- [x] Elevator/escalator info

### Concierge Features
- [x] Porter booking
- [x] Special assistance request
- [x] Priority security booking
- [x] Baggage storage booking
- [x] Airport tours

---

## Layer 3 - Rewards & Wallet

### Airzy Coins
- [x] Earn coins on bookings
- [x] Coin earning multipliers
- [x] Coin redemption
- [x] Coin balance display
- [x] Transaction history

### Membership Tiers

| Tier | Annual Fee | Lounge Visits | Coin Rate | Benefits |
|------|------------|--------------|-----------|----------|
| **Basic** | Free | 0 | 1.0x | Earn 1% coins, offers |
| **Plus** | ₹2,999 | 2 | 1.5x | 2 lounge visits, priority |
| **Elite** | ₹9,999 | 5 | 2.0x | 5 lounge visits, concierge |
| **Royale** | ₹29,999 | Unlimited | 3.0x | All Elite + VIP services |

### Tier Benefits
- [x] Tier badge display
- [x] Priority support
- [x] Exclusive offers
- [x] Early access to sales
- [x] Free upgrades

---

## Layer 4 - AI Traveler Brain

### AI Features
- [x] Travel prediction
- [x] Contextual recommendations
- [x] Proactive reminders
- [x] Smart notifications
- [x] Personal travel assistant
- [x] Natural language queries

### Intelligence Features
- [x] Behavior analysis
- [x] Preference learning
- [x] Trip pattern detection
- [x] Spending insights
- [x] Travel tips

---

## Layer 5 - Premium Services

### VIP Features
- [x] Priority check-in
- [x] Fast-track security
- [x] Lounge upgrades
- [x] Meet & greet
- [x] Airport limousine
- [x] VIP terminal

### Corporate Features
- [x] Corporate account
- [x] Expense management
- [x] Travel policy
- [x] Approval workflows
- [x] Invoice billing

---

## Layer 6 - Documents & Visa

### Document Vault
- [x] Passport storage
- [x] Visa copy storage
- [x] Boarding pass auto-save
- [x] DigiLocker integration
- [x] Travel insurance doc
- [x] Ticket storage

### Visa Services
- [x] Visa requirement checker
- [x] Visa application assistant
- [x] Document checklist
- [x] Appointment booking
- [x] Status tracking
- [x] Visa validity alerts

### Travel Folders
- [x] Create travel folder
- [x] Share with contacts
- [x] Collaborative planning
- [x] Export as PDF

---

## Layer 7 - Travel Finance

### BNPL Features
- [x] Travel BNPL (RidZa)
- [x] EMI options
- [x] Credit limit
- [x] Repayment tracking

### Forex Features
- [x] Live forex rates
- [x] Currency converter
- [x] Travel card order
- [x] Forex booking
- [x] Rate alerts

### Insurance
- [x] Travel insurance comparison
- [x] Policy purchase
- [x] Claim filing
- [x] Coverage details

---

## Layer 8 - Social & Community

### Social Features
- [x] Traveler reviews
- [x] Airport ratings
- [x] Lounge reviews
- [x] Restaurant ratings
- [x] Hotel reviews

### Community
- [x] Itinerary sharing
- [x] Travel tips
- [x] Destination guides
- [x] Photo sharing
- [x] Traveler community

### UGC Features
- [x] Photo uploads
- [x] Review moderation
- [x] Helpful votes
- [x] Creator badges

---

## DOOH (Digital Out-of-Home) Integration

### Advertising Features
- [x] Airport screen network
- [x] Targeted ads
- [x] QR attribution
- [x] Conversion tracking
- [x] Campaign analytics
- [x] Audience measurement

---

## Mobile App Features

### Core App Features
- [x] Phone OTP login
- [x] Biometric auth
- [x] Offline access
- [x] Push notifications
- [x] Deep linking
- [x] Dark mode

### Integration Features
- [x] Wallet integration
- [x] Calendar sync
- [x] Maps integration
- [x] WhatsApp updates
- [x] Email notifications

---

## Technology Stack

| Component | Technology |
|-----------|------------|
| Mobile | React Native / Expo |
| Web | Next.js |
| Backend | Express.js / Node.js |
| Database | MongoDB |
| Cache | Redis |
| Auth | JWT (RABTUL) |
| External APIs | Amadeus, DreamFolks, Priority Pass |

---

## Services (Ports 4500-4517)

| Port | Service | Features |
|------|---------|----------|
| 4500 | airzy-api-gateway | Routing, auth |
| 4501 | airzy-flight-service | Flight search, booking |
| 4502 | airzy-lounge-service | Lounge access |
| 4503 | airzy-itinerary-service | Trip planning |
| 4504 | airzy-wallet-extension | Coins, membership |
| 4505 | airzy-ai-brain | AI recommendations |
| 4506 | airzy-corp-service | Corporate travel |
| 4507 | airzy-hotel-extension | Hotel booking |
| 4508 | airzy-transfer-extension | Transfers |
| 4509 | airzy-dooh-extension | Advertising |
| 4510 | airzy-dining-extension | Dining |
| 4511 | airzy-social-extension | Reviews |
| 4512 | airzy-gate-navigation | Navigation |
| 4513 | airzy-document-vault | Documents |
| 4514 | airzy-visa-service | Visa |
| 4515 | airzy-travel-finance | BNPL, Forex |
| 4516 | airzy-concierge-extension | AI concierge |
| 4517 | airzy-intelligence | AI/ML |