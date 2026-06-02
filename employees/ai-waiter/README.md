# AI Waiter - Restaurant Employee

**Employee Type:** L2 Specialist
**Industry:** Restaurant/Hospitality
**Built for:** HOJAI Restaurant OS

---

## Overview

AI Waiter is an AI employee that handles restaurant customer interactions via WhatsApp and voice. It takes orders, answers menu questions, and manages reservations.

---

## Capabilities

### Order Taking
- [ ] WhatsApp menu browsing
- [ ] Item recommendations
- [ ] Customization handling (no onion, extra cheese, etc.)
- [ ] Special requests
- [ ] Order confirmation
- [ ] Payment link generation

### Reservations
- [ ] Table booking
- [ ] Guest count handling
- [ ] Special occasion notes
- [ ] Time slot management
- [ ] Confirmation messages

### Customer Support
- [ ] Menu questions
- [ ] Dietary restrictions (veg, vegan, Jain)
- [ ] Allergen information
- [ ] Opening hours
- [ ] Location/Directions
- [ ] Parking info

### Upselling
- [ ] Combo suggestions
- [ ] Beverages with meals
- [ ] Desserts after main course
- [ ] Special offers/deals

---

## Integration Points

| Service | Purpose |
|---------|---------|
| REZ-Merchant POS | Order creation |
| REZ-Merchant Menu | Menu data |
| REZ-Merchant QR | Table identification |
| WhatsApp Business | Customer channel |
| RABTUL Payments | Payment collection |
| RABTUL Notifications | Alerts |

---

## User Flow

```
Customer → WhatsApp Message
    ↓
AI Waiter Recognizes Intent
    ↓
[Takes Order] → [Handles Reservation] → [Answers Question]
    ↓
Confirms with Customer
    ↓
Creates Order in POS
    ↓
Sends Payment Link
    ↓
Notifies Kitchen Display
    ↓
Confirmation to Customer
```

---

## Example Conversations

### Order Flow
```
Customer: Hi, I want to order
AI Waiter: Hi! 🍽️ Welcome to Pizza Palace. Would you like to:
1. See our menu
2. Order for delivery
3. Order for dine-in (table QR)

Customer: Order for dine-in, table 5
AI Waiter: Great! You're at Table 5. Here's our menu:
1. Margherita Pizza - ₹299
2. Pepperoni Pizza - ₹399
3. Paneer Tikka - ₹249
What would you like?

Customer: One margherita, medium, extra cheese
AI Waiter: Added: Medium Margherita Pizza with Extra Cheese - ₹349
Anything else? (drinks, sides, desserts?)

Customer: One masala chai too
AI Waiter: Masala Chai - ₹49 added.
Your order:
- Medium Margherita Pizza (Extra Cheese) - ₹349
- Masala Chai - ₹49
Total: ₹398

Shall I confirm this order?

Customer: Yes
AI Waiter: ✅ Order confirmed! 
Payment link: [link]
Kitchen has been notified.
Estimated time: 20-25 minutes.
Enjoy your meal! 🍕
```

### Reservation Flow
```
Customer: I want to book a table for 4 tonight at 8pm
AI Waiter: Table for 4 at 8 PM tonight. 
Any special occasion I should know about?

Customer: It's my wife's birthday
AI Waiter: 🎂 Happy birthday to your wife!
I've noted it. We'll have a small surprise ready.
Name for the reservation?

Customer: Rahul Sharma
AI Waiter: ✅ Confirmed!
Rahul Sharma - Table for 4
Tonight at 8 PM
Birthday celebration noted.

See you soon! 🌟
```

---

## Configuration

```typescript
interface AIWaiterConfig {
  restaurantName: string;
  menuItems: MenuItem[];
  operatingHours: OperatingHours;
  reservationSettings: ReservationSettings;
  upsellRules: UpsellRule[];
  dietaryOptions: DietaryOption[];
}
```

---

## Technical Details

- **Port:** Dynamic (assigned on deploy)
- **Framework:** HOJAI Agent Platform
- **Memory:** Customer session memory
- **Channels:** WhatsApp, Web Chat
- **Languages:** Hindi, English, +8 Indian languages

---

**Last Updated:** June 3, 2026
