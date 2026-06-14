# REZ Schedule Python SDK
# Universal Scheduling Platform

import hashlib
import hmac
import json
import time
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Union
from urllib.parse import urlencode

import requests


class ReZScheduleError(Exception):
    """Base exception for REZ Schedule errors."""
    pass


class ValidationError(ReZScheduleError):
    """Validation error."""
    pass


class RateLimitError(ReZScheduleError):
    """Rate limit exceeded."""
    def __init__(self, message: str, retry_after: int = 60):
        super().__init__(message)
        self.retry_after = retry_after


class AuthenticationError(ReZScheduleError):
    """Authentication error."""
    pass


class Config:
    """SDK Configuration."""
    def __init__(
        self,
        api_key: str,
        base_url: str = "https://api.rez.money/schedule",
        timeout: int = 30,
        max_retries: int = 3
    ):
        self.api_key = api_key
        self.base_url = base_url.rstrip('/')
        self.timeout = timeout
        self.max_retries = max_retries


class EventTypesAPI:
    """Event Types API."""

    def __init__(self, config: Config):
        self.config = config

    def list(self) -> List[Dict]:
        """List all event types."""
        return self._request('GET', '/api/event-types')

    def get(self, event_type_id: str) -> Dict:
        """Get event type by ID."""
        return self._request('GET', f'/api/event-types/{event_type_id}')

    def get_public(self, username: str, slug: str) -> Dict:
        """Get public event type."""
        return self._request('GET', f'/api/event-types/public/{username}/{slug}')

    def create(self, **kwargs) -> Dict:
        """Create event type."""
        return self._request('POST', '/api/event-types', kwargs)

    def update(self, event_type_id: str, **kwargs) -> Dict:
        """Update event type."""
        return self._request('PUT', f'/api/event-types/{event_type_id}', kwargs)

    def delete(self, event_type_id: str) -> None:
        """Delete event type."""
        self._request('DELETE', f'/api/event-types/{event_type_id}')

    def _request(self, method: str, endpoint: str, data: Dict = None) -> Union[List, Dict, None]:
        """Make HTTP request."""
        url = f"{self.config.base_url}{endpoint}"
        headers = {
            'Authorization': f'Bearer {self.config.api_key}',
            'X-API-Key': self.config.api_key,
            'Content-Type': 'application/json'
        }

        response = requests.request(
            method, url, json=data, headers=headers, timeout=self.config.timeout
        )

        if response.status_code == 401:
            raise AuthenticationError('Invalid API key')
        elif response.status_code == 429:
            retry_after = int(response.headers.get('Retry-After', 60))
            raise RateLimitError('Rate limit exceeded', retry_after)
        elif response.status_code >= 400:
            raise ReZScheduleError(response.json().get('error', 'Request failed'))

        return response.json().get('data') or response.json()


class AvailabilityAPI:
    """Availability API."""

    def __init__(self, config: Config):
        self.config = config

    def get(
        self,
        username: str,
        slug: str,
        start_date: str,
        end_date: str,
        guest_timezone: str = None
    ) -> Dict:
        """Get available slots."""
        params = {'startDate': start_date, 'endDate': end_date}
        if guest_timezone:
            params['guestTimezone'] = guest_timezone

        query = urlencode(params)
        return self._request('GET', f'/api/availability/{username}/{slug}?{query}')

    def check(
        self,
        event_type_id: str,
        start_time: str,
        end_time: str,
        timezone: str = 'Asia/Kolkata'
    ) -> Dict:
        """Check slot availability."""
        return self._request('POST', '/api/availability/check', {
            'eventTypeId': event_type_id,
            'startTime': start_time,
            'endTime': end_time,
            'timezone': timezone
        })

    def _request(self, method: str, endpoint: str, data: Dict = None) -> Dict:
        """Make HTTP request."""
        url = f"{self.config.base_url}{endpoint}"
        headers = {
            'Authorization': f'Bearer {self.config.api_key}',
            'X-API-Key': self.config.api_key,
            'Content-Type': 'application/json'
        }

        response = requests.request(
            method, url, json=data, headers=headers, timeout=self.config.timeout
        )

        if response.status_code >= 400:
            raise ReZScheduleError(response.json().get('error', 'Request failed'))

        return response.json().get('data', {})


class BookingsAPI:
    """Bookings API."""

    def __init__(self, config: Config):
        self.config = config

    def list(
        self,
        status: str = None,
        start_date: str = None,
        end_date: str = None,
        page: int = 1,
        limit: int = 20
    ) -> Dict:
        """List bookings."""
        params = {'page': page, 'limit': limit}
        if status:
            params['status'] = status
        if start_date:
            params['startDate'] = start_date
        if end_date:
            params['endDate'] = end_date

        query = urlencode(params)
        return self._request('GET', f'/api/bookings?{query}')

    def get(self, uid: str) -> Dict:
        """Get booking by UID."""
        return self._request('GET', f'/api/bookings/{uid}')

    def create(
        self,
        event_type_id: str,
        start_time: str,
        end_time: str,
        attendee_name: str,
        attendee_email: str,
        attendee_phone: str = None,
        timezone: str = 'Asia/Kolkata',
        responses: Dict = None,
        idempotency_key: str = None
    ) -> Dict:
        """Create booking."""
        data = {
            'eventTypeId': event_type_id,
            'startTime': start_time,
            'endTime': end_time,
            'attendeeName': attendee_name,
            'attendeeEmail': attendee_email,
            'timezone': timezone
        }
        if attendee_phone:
            data['attendeePhone'] = attendee_phone
        if responses:
            data['responses'] = responses
        if idempotency_key:
            data['idempotencyKey'] = idempotency_key

        return self._request('POST', '/api/bookings', data)

    def cancel(self, uid: str, reason: str = None) -> Dict:
        """Cancel booking."""
        data = {'reason': reason} if reason else {}
        return self._request('PATCH', f'/api/bookings/{uid}/cancel', data)

    def reschedule(self, uid: str, new_start_time: str, new_end_time: str) -> Dict:
        """Reschedule booking."""
        return self._request('PATCH', f'/api/bookings/{uid}/reschedule', {
            'newStartTime': new_start_time,
            'newEndTime': new_end_time
        })

    def confirm(self, uid: str) -> Dict:
        """Confirm booking."""
        return self._request('PATCH', f'/api/bookings/{uid}/confirm')

    def _request(self, method: str, endpoint: str, data: Dict = None) -> Dict:
        """Make HTTP request."""
        url = f"{self.config.base_url}{endpoint}"
        headers = {
            'Authorization': f'Bearer {self.config.api_key}',
            'X-API-Key': self.config.api_key,
            'Content-Type': 'application/json'
        }

        response = requests.request(
            method, url, json=data, headers=headers, timeout=self.config.timeout
        )

        if response.status_code >= 400:
            raise ReZScheduleError(response.json().get('error', 'Request failed'))

        return response.json().get('data', {})


class UsersAPI:
    """Users API."""

    def __init__(self, config: Config):
        self.config = config

    def me(self) -> Dict:
        """Get current user."""
        return self._request('GET', '/api/users/me')

    def update(self, **kwargs) -> Dict:
        """Update current user."""
        return self._request('PATCH', '/api/users/me', kwargs)

    def get_public(self, username: str) -> Dict:
        """Get public user profile."""
        return self._request('GET', f'/api/users/{username}')

    def _request(self, method: str, endpoint: str, data: Dict = None) -> Dict:
        """Make HTTP request."""
        url = f"{self.config.base_url}{endpoint}"
        headers = {
            'Authorization': f'Bearer {self.config.api_key}',
            'X-API-Key': self.config.api_key,
            'Content-Type': 'application/json'
        }

        response = requests.request(
            method, url, json=data, headers=headers, timeout=self.config.timeout
        )

        if response.status_code >= 400:
            raise ReZScheduleError(response.json().get('error', 'Request failed'))

        return response.json().get('data', {})


class WebhooksAPI:
    """Webhooks API."""

    def __init__(self, config: Config):
        self.config = config

    def list(self) -> List[Dict]:
        """List webhooks."""
        return self._request('GET', '/api/webhooks')

    def create(self, url: str, triggers: List[str]) -> Dict:
        """Create webhook."""
        return self._request('POST', '/api/webhooks', {
            'url': url,
            'triggers': triggers
        })

    def delete(self, webhook_id: str) -> None:
        """Delete webhook."""
        self._request('DELETE', f'/api/webhooks/{webhook_id}')

    def _request(self, method: str, endpoint: str, data: Dict = None) -> Union[List, Dict, None]:
        """Make HTTP request."""
        url = f"{self.config.base_url}{endpoint}"
        headers = {
            'Authorization': f'Bearer {self.config.api_key}',
            'X-API-Key': self.config.api_key,
            'Content-Type': 'application/json'
        }

        response = requests.request(
            method, url, json=data, headers=headers, timeout=self.config.timeout
        )

        if response.status_code >= 400:
            raise ReZScheduleError(response.json().get('error', 'Request failed'))

        return response.json().get('data') or response.json()


class SeatsAPI:
    """Seats API."""

    def __init__(self, config: Config):
        self.config = config

    def get_available(self, event_type_id: str, date: str) -> Dict:
        """Get available seats."""
        return self._request('GET', f'/api/seats/{event_type_id}/{date}')

    def hold(
        self,
        event_type_id: str,
        start_time: str,
        end_time: str,
        held_by: str
    ) -> Dict:
        """Hold a seat."""
        return self._request('POST', '/api/seats/hold', {
            'eventTypeId': event_type_id,
            'startTime': start_time,
            'endTime': end_time,
            'heldBy': held_by
        })

    def _request(self, method: str, endpoint: str, data: Dict = None) -> Dict:
        """Make HTTP request."""
        url = f"{self.config.base_url}{endpoint}"
        headers = {
            'Authorization': f'Bearer {self.config.api_key}',
            'X-API-Key': self.config.api_key,
            'Content-Type': 'application/json'
        }

        response = requests.request(
            method, url, json=data, headers=headers, timeout=self.config.timeout
        )

        if response.status_code >= 400:
            raise ReZScheduleError(response.json().get('error', 'Request failed'))

        return response.json().get('data', {})


class WaitingListAPI:
    """Waiting List API."""

    def __init__(self, config: Config):
        self.config = config

    def join(
        self,
        event_type_id: str,
        requested_start: str,
        requested_end: str,
        email: str,
        name: str,
        phone: str = None
    ) -> Dict:
        """Join waiting list."""
        data = {
            'eventTypeId': event_type_id,
            'requestedStart': requested_start,
            'requestedEnd': requested_end,
            'email': email,
            'name': name
        }
        if phone:
            data['phone'] = phone

        return self._request('POST', '/api/waiting-list', data)

    def leave(self, waiting_list_id: str) -> None:
        """Leave waiting list."""
        self._request('DELETE', f'/api/waiting-list/{waiting_list_id}')

    def _request(self, method: str, endpoint: str, data: Dict = None) -> Dict:
        """Make HTTP request."""
        url = f"{self.config.base_url}{endpoint}"
        headers = {
            'Authorization': f'Bearer {self.config.api_key}',
            'X-API-Key': self.config.api_key,
            'Content-Type': 'application/json'
        }

        response = requests.request(
            method, url, json=data, headers=headers, timeout=self.config.timeout
        )

        if response.status_code >= 400:
            raise ReZScheduleError(response.json().get('error', 'Request failed'))

        return response.json().get('data', {})


class PaymentsAPI:
    """Payments API."""

    def __init__(self, config: Config):
        self.config = config

    def create_checkout(self, booking_id: str) -> Dict:
        """Create checkout session."""
        return self._request('POST', '/api/payments/checkout', {
            'bookingId': booking_id
        })

    def get_status(self, booking_id: str) -> Dict:
        """Get payment status."""
        return self._request('GET', f'/api/payments/{booking_id}')

    def create_refund(
        self,
        booking_id: str,
        reason: str = 'requested_by_customer'
    ) -> Dict:
        """Create refund."""
        return self._request('POST', '/api/payments/refund', {
            'bookingId': booking_id,
            'reason': reason
        })

    def _request(self, method: str, endpoint: str, data: Dict = None) -> Dict:
        """Make HTTP request."""
        url = f"{self.config.base_url}{endpoint}"
        headers = {
            'Authorization': f'Bearer {self.config.api_key}',
            'X-API-Key': self.config.api_key,
            'Content-Type': 'application/json'
        }

        response = requests.request(
            method, url, json=data, headers=headers, timeout=self.config.timeout
        )

        if response.status_code >= 400:
            raise ReZScheduleError(response.json().get('error', 'Request failed'))

        return response.json().get('data', {})


class ReZSchedule:
    """REZ Schedule Python SDK."""

    def __init__(self, config: Config):
        self.config = config
        self.event_types = EventTypesAPI(config)
        self.availability = AvailabilityAPI(config)
        self.bookings = BookingsAPI(config)
        self.users = UsersAPI(config)
        self.webhooks = WebhooksAPI(config)
        self.seats = SeatsAPI(config)
        self.waiting_list = WaitingListAPI(config)
        self.payments = PaymentsAPI(config)


# Utility functions
def verify_webhook_signature(
    payload: Union[str, bytes],
    signature: str,
    secret: str
) -> bool:
    """Verify webhook signature."""
    if isinstance(payload, str):
        payload = payload.encode('utf-8')

    expected = hmac.new(
        secret.encode('utf-8'),
        payload,
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(signature, expected)


# Convenience factory function
def create_client(api_key: str, **kwargs) -> ReZSchedule:
    """Create REZ Schedule client."""
    config = Config(api_key, **kwargs)
    return ReZSchedule(config)
