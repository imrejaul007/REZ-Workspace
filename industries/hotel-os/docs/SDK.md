# Hotel OS JavaScript SDK

## Installation
```bash
npm install @rtnm/hotel-os-sdk
```

## Quick Start
```javascript
import { HotelOS } from '@rtnm/hotel-os-sdk';

const hotelOS = new HotelOS({
  baseUrl: 'https://hotel-twins.staging.rez.io',
  apiKey: 'your-api-key'
});

// Create a guest
const guest = await hotelOS.guests.create({
  profile: { name: 'John', email: 'john@example.com' },
  loyalty: { tier: 'gold' }
});

// Check-in guest to room
await hotelOS.guests.checkin(guest.twinId, { roomId: 'room_101' });
```

## API Reference

### Guests

```javascript
// Create guest twin
const guest = await hotelOS.guests.create(data);

// Get guest twin
const guest = await hotelOS.guests.get(twinId);

// Update preferences
await hotelOS.guests.updatePreferences(twinId, preferences);

// Process check-in
await hotelOS.guests.checkin(twinId, { roomId, propertyId });

// Process check-out
await hotelOS.guests.checkout(twinId);

// Get guest stats
const stats = await hotelOS.guests.getStats();
```

### Rooms

```javascript
// Create room twin
const room = await hotelOS.rooms.create(data);

// Get room twin
const room = await hotelOS.rooms.get(twinId);

// Get room status
const status = await hotelOS.rooms.getStatus(twinId);

// Update IoT state
await hotelOS.rooms.updateIoT(twinId, { temperature: 22, acOn: true });

// Assign guest
await hotelOS.rooms.assignGuest(twinId, guestId);

// Clear room
await hotelOS.rooms.clear(twinId);
```

### Properties

```javascript
// Create property twin
const property = await hotelOS.properties.create(data);

// Get property twin
const property = await hotelOS.properties.get(twinId);

// Update revenue
await hotelOS.properties.updateRevenue(twinId, revenueData);

// Add venue
await hotelOS.properties.addVenue(twinId, venueData);
```

### Webhooks

```javascript
// Subscribe to events
await hotelOS.webhooks.subscribe({
  url: 'https://your-server.com/webhooks',
  events: ['guest.checkin', 'guest.checkout', 'room.status_change']
});

// Unsubscribe
await hotelOS.webhooks.unsubscribe(webhookId);
```

---

# Hotel OS Python SDK

## Installation
```bash
pip install hotel-os-sdk
```

## Quick Start
```python
from hotel_os import HotelOS

hotel_os = HotelOS(
    base_url="https://hotel-twins.staging.rez.io",
    api_key="your-api-key"
)

# Create a guest
guest = hotel_os.guests.create({
    "profile": {"name": "John", "email": "john@example.com"},
    "loyalty": {"tier": "gold"}
})

# Check-in guest to room
hotel_os.guests.checkin(guest["twinId"], {"roomId": "room_101"})
```

## API Reference

### Guests

```python
# Create guest twin
guest = hotel_os.guests.create(data)

# Get guest twin
guest = hotel_os.guests.get(twin_id)

# Update preferences
hotel_os.guests.update_preferences(twin_id, preferences)

# Process check-in
hotel_os.guests.checkin(twin_id, {"roomId": "room_101"})

# Process check-out
hotel_os.guests.checkout(twin_id)
```

### Rooms

```python
# Create room twin
room = hotel_os.rooms.create(data)

# Get room status
status = hotel_os.rooms.get_status(twin_id)

# Update IoT state
hotel_os.rooms.update_iot(twin_id, {"temperature": 22, "acOn": True})
```

### Properties

```python
# Create property twin
property = hotel_os.properties.create(data)

# Update revenue
hotel_os.properties.update_revenue(twin_id, revenue_data)
```
