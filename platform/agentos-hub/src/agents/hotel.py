"""
AgentOS Hub - Hotel Industry Adapter

Adapter for Hotel/Hospitality industry vertical.
Supports guest management, room operations, property management, and concierge services.
"""

from typing import Dict, List, Optional, Any
from ..base import BaseIndustryAdapter, TwinType, TwinReference, IndustryCapability
import asyncio
import logging

logger = logging.getLogger(__name__)


class HotelAdapter(BaseIndustryAdapter):
    """
    Hotel Industry Adapter.

    Twins: Guest, Room, Property, Staff, Experience
    Agents: Reservation, Housekeeping, Concierge, Revenue
    """

    industry_name = "hotel"
    industry_display_name = "Hotel & Hospitality"
    port_range = (8443, 8452)

    async def initialize(self) -> bool:
        """Initialize hotel agents and twins."""
        logger.info("Initializing Hotel adapter...")

        # Initialize twins
        twin_configs = [
            ("guest", TwinType.USER, "Guest profiles, preferences, loyalty, sentiment"),
            ("room", TwinType.ASSET, "Room management with IoT integration"),
            ("property", TwinType.LOCATION, "Property operations and venues"),
            ("staff", TwinType.USER, "Staff management"),
            ("experience", TwinType.PRODUCT, "Guest experience tracking"),
        ]

        for twin_name, twin_type, description in twin_configs:
            twin = TwinReference(
                twin_id=f"twin.hotel.{twin_name}",
                twin_type=twin_type,
                industry=self.industry_name,
                entity_id=f"{twin_name}_001",
                endpoint=f"http://localhost:84{tand(43, 52)}",
                metadata={"description": description}
            )
            await self.register_twin(twin)

        self._running = True
        logger.info("Hotel adapter initialized")
        return True

    async def shutdown(self) -> bool:
        """Shutdown hotel adapter."""
        self._running = False
        self.agents.clear()
        self.twins.clear()
        logger.info("Hotel adapter shutdown")
        return True

    def get_capabilities(self) -> List[IndustryCapability]:
        """Get hotel-specific capabilities."""
        return [
            IndustryCapability(
                name="guest_management",
                description="Guest profile and preference management",
                endpoints=["/api/guests", "/api/guests/{id}/preferences"],
                required_twins=["guest"]
            ),
            IndustryCapability(
                name="room_management",
                description="Room status, IoT state, and occupancy",
                endpoints=["/api/rooms", "/api/rooms/{id}/status"],
                required_twins=["room"]
            ),
            IndustryCapability(
                name="reservation_booking",
                description="Reservation and booking management",
                endpoints=["/api/reservations", "/api/reservations/{id}"],
                required_twins=["guest", "room"]
            ),
            IndustryCapability(
                name="housekeeping_scheduling",
                description="Predictive housekeeping scheduling",
                endpoints=["/api/housekeeping", "/api/housekeeping/schedule"],
                required_twins=["room", "staff"]
            ),
            IndustryCapability(
                name="concierge_services",
                description="AI-powered concierge and recommendations",
                endpoints=["/api/concierge", "/api/concierge/recommend"],
                required_twins=["guest", "property"]
            ),
            IndustryCapability(
                name="revenue_optimization",
                description="Dynamic pricing and upsell optimization",
                endpoints=["/api/revenue", "/api/revenue/pricing"],
                required_twins=["room", "guest"]
            ),
            IndustryCapability(
                name="loyalty_management",
                description="Points and tier management",
                endpoints=["/api/loyalty", "/api/loyalty/{id}/balance"],
                required_twins=["guest"]
            ),
        ]

    async def execute_operation(
        self,
        operation: str,
        payload: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute hotel-specific operation."""
        operations = {
            "check_in": self._check_in,
            "check_out": self._check_out,
            "book_room": self._book_room,
            "update_preferences": self._update_preferences,
            "schedule_housekeeping": self._schedule_housekeeping,
            "get_recommendation": self._get_recommendation,
            "calculate_upsell": self._calculate_upsell,
        }

        handler = operations.get(operation)
        if handler:
            return await handler(payload)
        else:
            return {"error": f"Unknown operation: {operation}"}

    async def _check_in(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Process guest check-in."""
        return {
            "operation": "check_in",
            "status": "completed",
            "guest_id": payload.get("guest_id"),
            "room_number": payload.get("room_number", "101"),
            "check_in_time": "2026-06-12T14:00:00Z",
            "keys_issued": 2
        }

    async def _check_out(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Process guest check-out."""
        return {
            "operation": "check_out",
            "status": "completed",
            "guest_id": payload.get("guest_id"),
            "check_out_time": "2026-06-12T11:00:00Z",
            "balance_due": 0.00,
            "feedback_requested": True
        }

    async def _book_room(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Book a room for a guest."""
        return {
            "operation": "book_room",
            "status": "confirmed",
            "reservation_id": f"RES{hash(payload.get('guest_id', ''))}",
            "room_type": payload.get("room_type", "standard"),
            "check_in": payload.get("check_in"),
            "check_out": payload.get("check_out"),
            "total_price": payload.get("nights", 1) * 150.00
        }

    async def _update_preferences(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Update guest preferences."""
        return {
            "operation": "update_preferences",
            "status": "updated",
            "guest_id": payload.get("guest_id"),
            "preferences": payload.get("preferences", {})
        }

    async def _schedule_housekeeping(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Schedule housekeeping for a room."""
        return {
            "operation": "schedule_housekeeping",
            "status": "scheduled",
            "room_number": payload.get("room_number"),
            "cleaning_type": payload.get("cleaning_type", "standard"),
            "scheduled_time": payload.get("scheduled_time"),
            "staff_assigned": "Maria G."
        }

    async def _get_recommendation(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Get AI concierge recommendations."""
        return {
            "operation": "get_recommendation",
            "status": "completed",
            "guest_id": payload.get("guest_id"),
            "recommendations": [
                {"type": "dining", "name": "The Restaurant", "distance": "0.1 km"},
                {"type": "spa", "name": "Wellness Center", "booking_url": "/spa/book"},
                {"type": "activity", "name": "City Tour", "price": 50.00}
            ]
        }

    async def _calculate_upsell(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate upsell opportunity."""
        return {
            "operation": "calculate_upsell",
            "status": "completed",
            "guest_id": payload.get("guest_id"),
            "current_room": "standard",
            "available_upgrades": [
                {"room": "deluxe", "price_diff": 50.00, "conversion_probability": 0.35},
                {"room": "suite", "price_diff": 150.00, "conversion_probability": 0.15}
            ],
            "recommended": "deluxe"
        }


def tand(start: int, end: int) -> int:
    """Helper to generate port numbers."""
    import random
    return random.randint(start, end)
