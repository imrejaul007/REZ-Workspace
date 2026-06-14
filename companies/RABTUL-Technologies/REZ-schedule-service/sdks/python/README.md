# REZ Schedule Python SDK

The official Python SDK for REZ Schedule - Universal Scheduling Platform.

## Installation

```bash
pip install rez-schedule
# or
poetry add rez-schedule
```

## Quick Start

```python
from rez_schedule import ReZSchedule

# Initialize client
client = ReZSchedule(api_key="your-api-key")

# Get event types
event_types = client.event_types.list()

# Get availability
slots = client.availability.get(
    username="drsharma",
    slug="consultation",
    start_date="2026-05-27",
    end_date="2026-05-29"
)

# Create booking
booking = client.bookings.create(
    event_type_id="evt_xxx",
    start_time="2026-05-27T10:00:00Z",
    end_time="2026-05-27T10:30:00Z",
    attendee_name="John Doe",
    attendee_email="john@example.com"
)
```

## Configuration

```python
from rez_schedule import ReZSchedule, Config

config = Config(
    api_key="your-api-key",
    base_url="https://api.rez.money/schedule",  # optional
    timeout=30,  # seconds
    max_retries=3
)

client = ReZSchedule(config)
```

## Event Types

```python
# List event types
event_types = client.event_types.list()

# Get public event type
event_type = client.event_types.get_public("drsharma", "consultation")

# Create event type
event_type = client.event_types.create(
    slug="consultation",
    title="30-min Consultation",
    duration=30,
    location_type="VIDEO_CALL",
    price=500,
    currency="INR"
)

# Update event type
client.event_types.update("evt_xxx", title="45-min Consultation", duration=45)

# Delete event type
client.event_types.delete("evt_xxx")
```

## Availability

```python
# Get available slots
slots = client.availability.get(
    username="drsharma",
    slug="consultation",
    start_date="2026-05-27",
    end_date="2026-05-29",
    guest_timezone="America/New_York"
)

# Check specific slot
result = client.availability.check(
    event_type_id="evt_xxx",
    start_time="2026-05-27T10:00:00Z",
    end_time="2026-05-27T10:30:00Z"
)
print(f"Available: {result['available']}")
```

## Bookings

```python
# Create booking
booking = client.bookings.create(
    event_type_id="evt_xxx",
    start_time="2026-05-27T10:00:00Z",
    end_time="2026-05-27T10:30:00Z",
    attendee_name="John Doe",
    attendee_email="john@example.com",
    attendee_phone="+919876543210",
    timezone="Asia/Kolkata",
    responses={"Reason": "Annual checkup"}
)

print(f"Booking ID: {booking['uid']}")
print(f"Status: {booking['status']}")

# List bookings
bookings = client.bookings.list(status="CONFIRMED", limit=20)

# Cancel booking
client.bookings.cancel("bk_xxx", reason="Schedule conflict")

# Reschedule booking
client.bookings.reschedule(
    "bk_xxx",
    new_start_time="2026-05-28T14:00:00Z",
    new_end_time="2026-05-28T14:30:00Z"
)

# Confirm booking
client.bookings.confirm("bk_xxx")
```

## Webhooks

```python
# Create webhook
webhook = client.webhooks.create(
    url="https://your-app.com/webhooks",
    triggers=["booking.created", "booking.cancelled"]
)
print(f"Secret: {webhook['secret']}")

# Verify webhook signature
from rez_schedule.utils import verify_webhook_signature

is_valid = verify_webhook_signature(
    payload=request_body,
    signature=headers["x-rez-signature"],
    secret=webhook_secret
)

if not is_valid:
    return "Invalid signature", 401

# List webhooks
webhooks = client.webhooks.list()

# Delete webhook
client.webhooks.delete("wh_xxx")
```

## Seats & Waiting List

```python
# Get available seats
seats = client.seats.get_available("evt_xxx", "2026-05-27")
print(f"Available: {seats['available']}")

# Hold a seat
hold = client.seats.hold(
    event_type_id="evt_xxx",
    start_time="2026-05-27T10:00:00Z",
    end_time="2026-05-27T11:00:00Z",
    held_by="customer@example.com"
)

# Join waiting list
result = client.waiting_list.join(
    event_type_id="evt_xxx",
    requested_start="2026-05-27T10:00:00Z",
    requested_end="2026-05-27T10:30:00Z",
    email="customer@example.com",
    name="Jane Doe"
)
print(f"Position: {result['position']}")
```

## Payments

```python
# Create checkout session
checkout = client.payments.create_checkout("bk_xxx")
print(f"Checkout URL: {checkout['url']}")

# Get payment status
status = client.payments.get_status("bk_xxx")
print(f"Status: {status['payment_status']}")

# Create refund
refund = client.payments.create_refund(
    "bk_xxx",
    reason="requested_by_customer"
)
```

## Error Handling

```python
from rez_schedule.exceptions import (
    ReZScheduleError,
    ValidationError,
    RateLimitError,
    AuthenticationError
)

try:
    booking = client.bookings.create(...)
except ValidationError as e:
    print(f"Validation failed: {e.fields}")
except RateLimitError as e:
    print(f"Rate limited. Retry after: {e.retry_after}s")
except AuthenticationError:
    print("Invalid API key")
except ReZScheduleError as e:
    print(f"API Error: {e.message}")
```

## FastAPI Integration

```python
from fastapi import FastAPI, Request
from rez_schedule import ReZSchedule
from rez_schedule.webhooks import verify_signature

app = FastAPI()
client = ReZSchedule(api_key="your-api-key")

@app.post("/webhooks")
async def handle_webhook(request: Request):
    body = await request.body()
    signature = request.headers["x-rez-signature"]

    if not verify_signature(body, signature, "your-webhook-secret"):
        return {"error": "Invalid signature"}, 401

    data = await request.json()
    event = data.get("event")

    if event == "booking.created":
        booking = data.get("data")
        print(f"New booking: {booking['uid']}")

    return {"success": True}
```

## Django Integration

```python
# views.py
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rez_schedule import ReZSchedule
import json

client = ReZSchedule(api_key="your-api-key")

@csrf_exempt
def webhook_view(request):
    if request.method == "POST":
        body = json.loads(request.body)
        signature = request.META.get("HTTP_X_REZ_SIGNATURE")

        # Verify signature
        # ...

        event = body.get("event")
        if event == "booking.created":
            booking = body.get("data")
            # Process booking

        return JsonResponse({"success": True})

    return JsonResponse({"error": "Method not allowed"}, status=405)
```

## Async Support

```python
import asyncio
from rez_schedule.async_client import AsyncReZSchedule

async def main():
    client = AsyncReZSchedule(api_key="your-api-key")

    # Concurrent requests
    event_types, slots = await asyncio.gather(
        client.event_types.list(),
        client.availability.get("drsharma", "consultation", "2026-05-27", "2026-05-29")
    )

    print(f"Found {len(event_types)} event types")
    print(f"Found {len(slots['slots'])} slots")

asyncio.run(main())
```

## License

MIT
