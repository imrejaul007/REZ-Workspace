"""
AssetMind Kronos - Time Management Service
Port: 5006
Provides time tracking, scheduling, and calendar integration.
"""

import uuid
from datetime import datetime, timedelta
from typing import Optional, List
from enum import Enum

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from loguru import logger

app = FastAPI(title="AssetMind Kronos", description="Time Management Service", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class EventType(str, Enum):
    MEETING = "meeting"
    DEADLINE = "deadline"
    REMINDER = "reminder"
    REVIEW = "review"
    REBALANCING = "rebalancing"
    REPORT = "report"

class EventStatus(str, Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class RecurrenceType(str, Enum):
    NONE = "none"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"

class TimeEntryStatus(str, Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"

# ============================================================================
# Pydantic Models
# ============================================================================

class RecurrenceRule(BaseModel):
    frequency: RecurrenceType = RecurrenceType.NONE
    interval: int = 1
    end_date: Optional[datetime] = None

class Reminder(BaseModel):
    type: str = "push"
    minutes_before: int = 15

class Attendee(BaseModel):
    user_id: str
    email: str
    name: str
    response: str = "pending"

class CalendarEventBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    event_type: EventType
    start_time: datetime
    end_time: datetime
    timezone: str = "UTC"
    location: Optional[str] = None
    recurrence: RecurrenceRule = RecurrenceRule()

class CalendarEventCreate(CalendarEventBase):
    user_id: str
    attendees: List[Attendee] = []
    reminders: List[Reminder] = [Reminder()]

class CalendarEvent(CalendarEventBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    status: EventStatus = EventStatus.SCHEDULED
    attendees: List[Attendee] = []
    reminders: List[Reminder] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class TimeEntryCreate(BaseModel):
    user_id: str
    description: str = Field(..., min_length=1, max_length=500)
    task_type: str
    start_time: Optional[datetime] = None

class TimeEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    description: str
    task_type: str
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_minutes: int = 0
    status: TimeEntryStatus = TimeEntryStatus.ACTIVE
    tags: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ScheduleWindow(BaseModel):
    day_of_week: int
    start_hour: int
    end_hour: int

class WorkSchedule(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str = "Default Schedule"
    timezone: str = "UTC"
    windows: List[ScheduleWindow] = []
    holidays: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

class WorkflowTrigger(BaseModel):
    trigger_type: str
    cron_expression: Optional[str] = None

class ScheduledWorkflow(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    description: Optional[str] = None
    trigger: WorkflowTrigger
    actions: List[dict] = []
    is_enabled: bool = True
    last_run: Optional[datetime] = None
    next_run: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class TimeStats(BaseModel):
    user_id: str
    period: str
    total_hours: float = 0.0
    by_category: dict = {}
    productivity_score: float = 0.0

class CalendarStats(BaseModel):
    user_id: str
    period: str
    total_events: int = 0
    by_type: dict = {}
    average_duration_minutes: float = 0.0

# ============================================================================
# In-Memory Storage
# ============================================================================

events_db: dict[str, CalendarEvent] = {}
time_entries_db: dict[str, TimeEntry] = {}
work_schedules_db: dict[str, WorkSchedule] = {}
workflows_db: dict[str, ScheduledWorkflow] = {}

# Initialize sample data
work_schedules_db["schedule-001"] = WorkSchedule(
    id="schedule-001", user_id="user-001", name="Trading Hours",
    windows=[ScheduleWindow(day_of_week=i, start_hour=9, end_hour=17) for i in range(5)]
)
now = datetime.utcnow()
events_db["event-001"] = CalendarEvent(
    id="event-001", user_id="user-001", title="Portfolio Review",
    description="Weekly portfolio performance review", event_type=EventType.REVIEW,
    start_time=now + timedelta(hours=2), end_time=now + timedelta(hours=3),
    status=EventStatus.SCHEDULED
)

# ============================================================================
# Health Check
# ============================================================================

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "assetmind-kronos",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "stats": {"events": len(events_db), "time_entries": len(time_entries_db), "schedules": len(work_schedules_db)}
    }

# ============================================================================
# Calendar Events Endpoints
# ============================================================================

@app.post("/events", response_model=CalendarEvent, status_code=201)
async def create_event(event: CalendarEventCreate):
    new_event = CalendarEvent(**event.model_dump())
    events_db[new_event.id] = new_event
    logger.info(f"Created event: {new_event.title}")
    return new_event

@app.get("/events", response_model=List[CalendarEvent])
async def list_events(user_id: str, skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=100), event_type: Optional[EventType] = None, status: Optional[EventStatus] = None):
    events = [e for e in events_db.values() if e.user_id == user_id]
    if event_type:
        events = [e for e in events if e.event_type == event_type]
    if status:
        events = [e for e in events if e.status == status]
    events.sort(key=lambda x: x.start_time)
    return events[skip:skip+limit]

@app.get("/events/{event_id}", response_model=CalendarEvent)
async def get_event(event_id: str):
    if event_id not in events_db:
        raise HTTPException(status_code=404, detail="Event not found")
    return events_db[event_id]

@app.put("/events/{event_id}", response_model=CalendarEvent)
async def update_event(event_id: str, update: dict):
    if event_id not in events_db:
        raise HTTPException(status_code=404, detail="Event not found")
    event = events_db[event_id]
    for field, value in update.items():
        if hasattr(event, field):
            setattr(event, field, value)
    event.updated_at = datetime.utcnow()
    return event

@app.delete("/events/{event_id}", status_code=204)
async def delete_event(event_id: str):
    if event_id not in events_db:
        raise HTTPException(status_code=404, detail="Event not found")
    del events_db[event_id]

@app.post("/events/{event_id}/complete", response_model=CalendarEvent)
async def complete_event(event_id: str):
    if event_id not in events_db:
        raise HTTPException(status_code=404, detail="Event not found")
    event = events_db[event_id]
    event.status = EventStatus.COMPLETED
    event.updated_at = datetime.utcnow()
    return event

# ============================================================================
# Time Tracking Endpoints
# ============================================================================

@app.post("/time-entries", response_model=TimeEntry, status_code=201)
async def create_time_entry(entry: TimeEntryCreate):
    start = entry.start_time or datetime.utcnow()
    new_entry = TimeEntry(**entry.model_dump(), start_time=start)
    time_entries_db[new_entry.id] = new_entry
    return new_entry

@app.get("/time-entries", response_model=List[TimeEntry])
async def list_time_entries(user_id: str, skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=100), status: Optional[TimeEntryStatus] = None):
    entries = [e for e in time_entries_db.values() if e.user_id == user_id]
    if status:
        entries = [e for e in entries if e.status == status]
    entries.sort(key=lambda x: x.start_time, reverse=True)
    return entries[skip:skip+limit]

@app.post("/time-entries/{entry_id}/stop", response_model=TimeEntry)
async def stop_time_entry(entry_id: str):
    if entry_id not in time_entries_db:
        raise HTTPException(status_code=404, detail="Time entry not found")
    entry = time_entries_db[entry_id]
    if entry.status != TimeEntryStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Time entry is not active")
    entry.end_time = datetime.utcnow()
    entry.duration_minutes = int((entry.end_time - entry.start_time).total_seconds() / 60)
    entry.status = TimeEntryStatus.COMPLETED
    return entry

@app.post("/time-entries/{entry_id}/pause", response_model=TimeEntry)
async def pause_time_entry(entry_id: str):
    if entry_id not in time_entries_db:
        raise HTTPException(status_code=404, detail="Time entry not found")
    entry = time_entries_db[entry_id]
    entry.status = TimeEntryStatus.PAUSED
    return entry

# ============================================================================
# Work Schedule Endpoints
# ============================================================================

@app.post("/schedules", response_model=WorkSchedule, status_code=201)
async def create_schedule(schedule: WorkSchedule):
    work_schedules_db[schedule.id] = schedule
    return schedule

@app.get("/schedules", response_model=List[WorkSchedule])
async def list_schedules(user_id: str):
    return [s for s in work_schedules_db.values() if s.user_id == user_id]

@app.get("/schedules/{schedule_id}", response_model=WorkSchedule)
async def get_schedule(schedule_id: str):
    if schedule_id not in work_schedules_db:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return work_schedules_db[schedule_id]

# ============================================================================
# Workflow Endpoints
# ============================================================================

@app.post("/workflows", response_model=ScheduledWorkflow, status_code=201)
async def create_workflow(workflow: ScheduledWorkflow):
    workflows_db[workflow.id] = workflow
    return workflow

@app.get("/workflows", response_model=List[ScheduledWorkflow])
async def list_workflows(user_id: str):
    return [w for w in workflows_db.values() if w.user_id == user_id]

@app.post("/workflows/{workflow_id}/toggle", response_model=ScheduledWorkflow)
async def toggle_workflow(workflow_id: str):
    if workflow_id not in workflows_db:
        raise HTTPException(status_code=404, detail="Workflow not found")
    workflow = workflows_db[workflow_id]
    workflow.is_enabled = not workflow.is_enabled
    return workflow

# ============================================================================
# Analytics Endpoints
# ============================================================================

@app.get("/analytics/time", response_model=TimeStats)
async def get_time_stats(user_id: str, period: str = "weekly"):
    entries = [e for e in time_entries_db.values() if e.user_id == user_id and e.status == TimeEntryStatus.COMPLETED]
    total_minutes = sum(e.duration_minutes for e in entries)
    by_category = {}
    for entry in entries:
        by_category[entry.task_type] = by_category.get(entry.task_type, 0) + entry.duration_minutes
    return TimeStats(user_id=user_id, period=period, total_hours=round(total_minutes / 60, 2), by_category={k: round(v / 60, 2) for k, v in by_category.items()}, productivity_score=85.0)

@app.get("/analytics/calendar", response_model=CalendarStats)
async def get_calendar_stats(user_id: str, period: str = "weekly"):
    events = [e for e in events_db.values() if e.user_id == user_id]
    by_type = {}
    total_duration = 0
    for event in events:
        event_type = event.event_type.value
        by_type[event_type] = by_type.get(event_type, 0) + 1
        total_duration += (event.end_time - event.start_time).total_seconds() / 60
    return CalendarStats(user_id=user_id, period=period, total_events=len(events), by_type=by_type, average_duration_minutes=round(total_duration / max(len(events), 1), 2))

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting AssetMind Kronos on port 5006")
    uvicorn.run(app, host="0.0.0.0", port=5006)
