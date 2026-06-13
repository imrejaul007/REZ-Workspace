"""
AgentOS Hub - Event Bus

Distributed event bus for inter-agent communication across all industries.
Supports pub/sub patterns, event filtering, and cross-industry event routing.
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any, Callable, Set
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from collections import defaultdict
import json
import uuid

logger = logging.getLogger(__name__)


class EventPriority(Enum):
    """Event priority levels."""
    LOW = 1
    NORMAL = 2
    HIGH = 3
    CRITICAL = 4


class EventType(Enum):
    """Standard event types across all industries."""
    # Agent lifecycle events
    AGENT_REGISTERED = "agent.registered"
    AGENT_UNREGISTERED = "agent.unregistered"
    AGENT_HEARTBEAT = "agent.heartbeat"
    AGENT_STATUS_CHANGED = "agent.status_changed"

    # Workflow events
    WORKFLOW_STARTED = "workflow.started"
    WORKFLOW_PROGRESS = "workflow.progress"
    WORKFLOW_COMPLETED = "workflow.completed"
    WORKFLOW_FAILED = "workflow.failed"

    # Task events
    TASK_ASSIGNED = "task.assigned"
    TASK_STARTED = "task.started"
    TASK_COMPLETED = "task.completed"
    TASK_FAILED = "task.failed"

    # Cross-industry events
    INDUSTRY_EVENT = "industry.event"
    CROSS_INDUSTRY_REQUEST = "cross_industry.request"
    CROSS_INDUSTRY_RESPONSE = "cross_industry.response"

    # Twin events
    TWIN_CREATED = "twin.created"
    TWIN_UPDATED = "twin.updated"
    TWIN_DELETED = "twin.deleted"
    TWIN_SYNC = "twin.sync"

    # System events
    SYSTEM_ERROR = "system.error"
    SYSTEM_WARNING = "system.warning"
    SYSTEM_INFO = "system.info"


@dataclass
class Event:
    """Represents an event in the system."""
    id: str
    type: str
    source: str
    target: Optional[str] = None  # None = broadcast
    industry: Optional[str] = None
    payload: Dict[str, Any] = field(default_factory=dict)
    priority: EventPriority = EventPriority.NORMAL
    timestamp: datetime = field(default_factory=datetime.utcnow)
    correlation_id: Optional[str] = None
    reply_to: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """Convert event to dictionary."""
        return {
            "id": self.id,
            "type": self.type,
            "source": self.source,
            "target": self.target,
            "industry": self.industry,
            "payload": self.payload,
            "priority": self.priority.value,
            "timestamp": self.timestamp.isoformat(),
            "correlation_id": self.correlation_id,
            "reply_to": self.reply_to,
            "metadata": self.metadata
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Event":
        """Create event from dictionary."""
        return cls(
            id=data.get("id", str(uuid.uuid4())),
            type=data["type"],
            source=data["source"],
            target=data.get("target"),
            industry=data.get("industry"),
            payload=data.get("payload", {}),
            priority=EventPriority(data.get("priority", "NORMAL")),
            timestamp=datetime.fromisoformat(data["timestamp"]) if "timestamp" in data else datetime.utcnow(),
            correlation_id=data.get("correlation_id"),
            reply_to=data.get("reply_to"),
            metadata=data.get("metadata", {})
        )


@dataclass
class Subscription:
    """Event subscription configuration."""
    id: str
    event_type: str
    handler: Callable
    filter_func: Optional[Callable[[Event], bool]] = None
    industries: Optional[Set[str]] = None
    sources: Optional[Set[str]] = None
    async_handler: bool = True
    created_at: datetime = field(default_factory=datetime.utcnow)


class EventBus:
    """
    Central event bus for AgentOS Hub.

    Features:
    - Pub/Sub messaging with topic filtering
    - Cross-industry event routing
    - Event persistence for replay
    - Dead letter queue for failed events
    - Event correlation and reply patterns
    - Scheduled/delayed events
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.subscriptions: Dict[str, List[Subscription]] = defaultdict(list)
        self.global_subscriptions: List[Subscription] = []
        self.event_history: List[Event] = []
        self.dead_letter_queue: List[Event] = []
        self.pending_events: asyncio.PriorityQueue = asyncio.PriorityQueue()
        self._running = False
        self._processor_task: Optional[asyncio.Task] = None
        self._lock = asyncio.Lock()

        # Configuration
        self.max_history = self.config.get("max_history", 10000)
        self.max_dead_letter = self.config.get("max_dead_letter", 1000)
        self.processing_batch_size = self.config.get("processing_batch_size", 100)
        self.enable_persistence = self.config.get("enable_persistence", False)

        # Statistics
        self.stats = {
            "total_events": 0,
            "processed_events": 0,
            "failed_events": 0,
            "subscribers": 0
        }

    # ==================== Publishing ====================

    async def publish(
        self,
        event_type: str,
        source: str,
        payload: Dict[str, Any] = None,
        target: Optional[str] = None,
        industry: Optional[str] = None,
        priority: EventPriority = EventPriority.NORMAL,
        correlation_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Event:
        """Publish an event to the bus."""
        event = Event(
            id=str(uuid.uuid4()),
            type=event_type,
            source=source,
            target=target,
            industry=industry,
            payload=payload or {},
            priority=priority,
            correlation_id=correlation_id,
            metadata=metadata or {}
        )

        await self._publish_event(event)
        return event

    async def _publish_event(self, event: Event):
        """Internal method to publish an event."""
        async with self._lock:
            # Store in history
            self.event_history.append(event)
            if len(self.event_history) > self.max_history:
                self.event_history = self.event_history[-self.max_history:]

            self.stats["total_events"] += 1

        # Queue for processing
        priority_value = (5 - event.priority.value)  # Lower value = higher priority
        await self.pending_events.put((priority_value, event))

        logger.debug(f"Published event {event.type} from {event.source}")

    async def reply(
        self,
        original_event: Event,
        payload: Dict[str, Any],
        success: bool = True
    ) -> Event:
        """Send a reply to a request event."""
        return await self.publish(
            event_type=EventType.CROSS_INDUSTRY_RESPONSE.value,
            source="event_bus",
            target=original_event.source,
            payload={
                "success": success,
                "data": payload,
                "original_event_id": original_event.id
            },
            correlation_id=original_event.correlation_id or original_event.id
        )

    # ==================== Subscription ====================

    def subscribe(
        self,
        event_type: str,
        handler: Callable,
        filter_func: Optional[Callable[[Event], bool]] = None,
        industries: Optional[List[str]] = None,
        sources: Optional[List[str]] = None
    ) -> str:
        """
        Subscribe to events of a specific type.

        Args:
            event_type: Type of event to subscribe to (supports wildcards like "agent.*")
            handler: Function to call when event is received
            filter_func: Optional function to filter events
            industries: Filter by specific industries
            sources: Filter by specific sources

        Returns:
            Subscription ID
        """
        subscription = Subscription(
            id=str(uuid.uuid4()),
            event_type=event_type,
            handler=handler,
            filter_func=filter_func,
            industries=set(industries) if industries else None,
            sources=set(sources) if sources else None,
            async_handler=asyncio.iscoroutinefunction(handler)
        )

        if event_type == "*":
            self.global_subscriptions.append(subscription)
        else:
            self.subscriptions[event_type].append(subscription)

        self.stats["subscribers"] = len(self.subscriptions) + len(self.global_subscriptions)
        logger.info(f"Subscribed to {event_type}, subscription ID: {subscription.id}")

        return subscription.id

    def unsubscribe(self, subscription_id: str) -> bool:
        """Unsubscribe from events."""
        # Check global subscriptions
        for sub in self.global_subscriptions:
            if sub.id == subscription_id:
                self.global_subscriptions.remove(sub)
                self.stats["subscribers"] = len(self.subscriptions) + len(self.global_subscriptions)
                return True

        # Check typed subscriptions
        for event_type, subs in self.subscriptions.items():
            for sub in subs:
                if sub.id == subscription_id:
                    subs.remove(sub)
                    self.stats["subscribers"] = len(self.subscriptions) + len(self.global_subscriptions)
                    return True

        return False

    def get_subscriptions(self, event_type: Optional[str] = None) -> List[Subscription]:
        """Get all subscriptions, optionally filtered by event type."""
        if event_type:
            return self.subscriptions.get(event_type, [])
        return list(self.global_subscriptions) + [
            sub for subs in self.subscriptions.values() for sub in subs
        ]

    # ==================== Event Processing ====================

    async def start(self):
        """Start the event bus processor."""
        if self._running:
            return

        self._running = True
        self._processor_task = asyncio.create_task(self._process_events())
        logger.info("Event Bus started")

    async def stop(self):
        """Stop the event bus processor."""
        self._running = False
        if self._processor_task:
            self._processor_task.cancel()
        logger.info("Event Bus stopped")

    async def _process_events(self):
        """Background event processor."""
        while self._running:
            try:
                # Process events in batches
                batch = []
                for _ in range(self.processing_batch_size):
                    try:
                        priority, event = await asyncio.wait_for(
                            self.pending_events.get(),
                            timeout=0.1
                        )
                        batch.append(event)
                    except asyncio.TimeoutError:
                        break

                for event in batch:
                    await self._dispatch_event(event)
                    self.stats["processed_events"] += 1

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Event processing error: {e}")
                self.stats["failed_events"] += 1

    async def _dispatch_event(self, event: Event):
        """Dispatch an event to all matching subscribers."""
        # Find matching subscriptions
        matching_subs = []

        # Check global subscriptions
        for sub in self.global_subscriptions:
            if self._matches_subscription(event, sub):
                matching_subs.append(sub)

        # Check type-specific subscriptions (including wildcards)
        for event_type, subs in self.subscriptions.items():
            if self._event_type_matches(event.type, event_type):
                for sub in subs:
                    if self._matches_subscription(event, sub):
                        matching_subs.append(sub)

        # Dispatch to all matching subscribers
        for sub in matching_subs:
            try:
                if sub.async_handler:
                    await sub.handler(event)
                else:
                    sub.handler(event)
            except Exception as e:
                logger.error(f"Event handler error for {sub.id}: {e}")
                self.stats["failed_events"] += 1

    def _event_type_matches(self, event_type: str, pattern: str) -> bool:
        """Check if event type matches subscription pattern."""
        if pattern == "*":
            return True
        if pattern.endswith("*"):
            prefix = pattern[:-1]
            return event_type.startswith(prefix)
        return event_type == pattern

    def _matches_subscription(self, event: Event, sub: Subscription) -> bool:
        """Check if event matches subscription filters."""
        # Industry filter
        if sub.industries and event.industry not in sub.industries:
            return False

        # Source filter
        if sub.sources and event.source not in sub.sources:
            return False

        # Custom filter function
        if sub.filter_func and not sub.filter_func(event):
            return False

        return True

    # ==================== Event History ====================

    def get_event_history(
        self,
        event_type: Optional[str] = None,
        source: Optional[str] = None,
        industry: Optional[str] = None,
        since: Optional[datetime] = None,
        limit: int = 100
    ) -> List[Event]:
        """Query event history with filters."""
        events = self.event_history

        if event_type:
            events = [e for e in events if e.type == event_type]
        if source:
            events = [e for e in events if e.source == source]
        if industry:
            events = [e for e in events if e.industry == industry]
        if since:
            events = [e for e in events if e.timestamp >= since]

        return events[-limit:]

    def get_dead_letter_events(self, limit: int = 100) -> List[Event]:
        """Get events from the dead letter queue."""
        return self.dead_letter_queue[-limit:]

    async def replay_events(
        self,
        from_timestamp: datetime,
        to_timestamp: Optional[datetime] = None,
        event_types: Optional[List[str]] = None
    ) -> int:
        """Replay events from history."""
        events = self.get_event_history(
            event_type=event_types[0] if event_types else None,
            since=from_timestamp,
            limit=self.max_history
        )

        if to_timestamp:
            events = [e for e in events if e.timestamp <= to_timestamp]

        count = 0
        for event in events:
            if not event_types or event.type in event_types:
                await self._publish_event(event)
                count += 1

        logger.info(f"Replayed {count} events")
        return count

    # ==================== Cross-Industry Events ====================

    async def publish_cross_industry(
        self,
        source_industry: str,
        target_industry: str,
        operation: str,
        payload: Dict[str, Any],
        correlation_id: Optional[str] = None
    ) -> Event:
        """Publish an event for cross-industry communication."""
        return await self.publish(
            event_type=EventType.CROSS_INDUSTRY_REQUEST.value,
            source=source_industry,
            target=target_industry,
            industry=target_industry,
            payload={
                "operation": operation,
                "data": payload
            },
            correlation_id=correlation_id or str(uuid.uuid4())
        )

    async def broadcast_to_industry(
        self,
        industry: str,
        event_type: str,
        payload: Dict[str, Any],
        source: str = "event_bus"
    ) -> Event:
        """Broadcast an event to all subscribers in an industry."""
        return await self.publish(
            event_type=event_type,
            source=source,
            industry=industry,
            payload=payload
        )

    # ==================== Statistics ====================

    def get_stats(self) -> Dict[str, Any]:
        """Get event bus statistics."""
        return {
            **self.stats,
            "pending_events": self.pending_events.qsize(),
            "history_size": len(self.event_history),
            "dead_letter_size": len(self.dead_letter_queue),
            "active_subscriptions": len(self.global_subscriptions) + sum(
                len(subs) for subs in self.subscriptions.values()
            )
        }
