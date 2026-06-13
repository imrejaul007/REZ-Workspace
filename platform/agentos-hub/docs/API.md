# AgentOS Hub - API Documentation

## Base URL

```
http://localhost:8000/api/v1
```

---

## Authentication

All API endpoints require JWT authentication via the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

---

## Health & Info Endpoints

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-06-12T10:00:00Z",
  "version": "1.0.0",
  "uptime_seconds": 3600.5
}
```

### GET /info

Get platform information.

**Response:**
```json
{
  "name": "AgentOS Hub",
  "version": "1.0.0",
  "description": "Unified Agent Orchestration Platform for 24 Industries",
  "industries": 24,
  "uptime_seconds": 3600.5
}
```

---

## Industry Endpoints

### GET /industries

List all 24 industry verticals.

**Response:**
```json
{
  "total_industries": 24,
  "industries": [
    {
      "name": "agriculture",
      "display_name": "Agriculture",
      "twins": ["crop", "soil", "weather", "equipment", "inventory"],
      "agent_count": 5,
      "registered_agents": ["field_agent", "crop_agent"],
      "ports": [5001, 5012, 5034, 5045, 5056],
      "gateway": "http://localhost:5001"
    }
  ]
}
```

### GET /industries/{industry}

Get details for a specific industry.

**Parameters:**
- `industry` (path) - Industry name (e.g., "hotel", "financial")

**Response:**
```json
{
  "name": "hotel",
  "display_name": "Hotel & Hospitality",
  "ports": [8443, 8444, 8445, 8446, 8447, 8448, 8449, 8450, 8451, 8452],
  "gateway": "http://localhost:8443",
  "twins": ["guest", "room", "property", "staff", "experience"],
  "agents": [
    {
      "id": "agent_001",
      "name": "AI Concierge",
      "status": "healthy",
      "capabilities": ["booking", "recommendation", "concierge"]
    }
  ]
}
```

---

## Agent Endpoints

### POST /agents/register

Register a new agent.

**Request:**
```json
{
  "agent_id": "hotel_concierge_001",
  "name": "AI Concierge",
  "industry": "hotel",
  "agent_type": "concierge",
  "capabilities": ["booking", "recommendation", "concierge"],
  "endpoints": {
    "grpc": "http://localhost:8452",
    "rest": "http://localhost:8452/api"
  },
  "version": "1.0.0",
  "metadata": {
    "description": "AI-powered hotel concierge agent"
  }
}
```

**Response:**
```json
{
  "status": "registered",
  "agent_id": "hotel_concierge_001"
}
```

### DELETE /agents/{agent_id}

Unregister an agent.

**Response:**
```json
{
  "status": "unregistered",
  "agent_id": "hotel_concierge_001"
}
```

### GET /agents

List all registered agents.

**Query Parameters:**
- `industry` (optional) - Filter by industry
- `capability` (optional) - Filter by capability
- `status` (optional) - Filter by status (idle, busy, healthy, error)

**Response:**
```json
{
  "total": 120,
  "agents": [
    {
      "id": "hotel_concierge_001",
      "name": "AI Concierge",
      "industry": "hotel",
      "capabilities": ["booking", "recommendation", "concierge"],
      "status": "healthy",
      "current_tasks": 3,
      "success_count": 1500,
      "error_count": 5,
      "last_heartbeat": "2026-06-12T10:00:00Z"
    }
  ]
}
```

### GET /agents/{agent_id}

Get details for a specific agent.

**Response:**
```json
{
  "id": "hotel_concierge_001",
  "name": "AI Concierge",
  "industry": "hotel",
  "capabilities": ["booking", "recommendation", "concierge"],
  "endpoint": "http://localhost:8452",
  "protocol": "grpc",
  "status": "healthy",
  "max_concurrent_tasks": 10,
  "current_tasks": 3,
  "success_count": 1500,
  "error_count": 5,
  "last_heartbeat": "2026-06-12T10:00:00Z",
  "metadata": {
    "description": "AI-powered hotel concierge agent"
  }
}
```

### PATCH /agents/{agent_id}/status

Update agent status.

**Request:**
```json
{
  "status": "busy"
}
```

**Response:**
```json
{
  "status": "updated",
  "agent_id": "hotel_concierge_001",
  "new_status": "busy"
}
```

---

## Workflow Endpoints

### POST /workflows

Create a new cross-industry workflow.

**Request:**
```json
{
  "name": "Guest Dining Experience",
  "description": "Coordinate hotel guest dining across industries",
  "industries": ["hotel", "restaurant"],
  "steps": [
    {
      "name": "check_preferences",
      "industry": "hotel",
      "action": "get_preferences",
      "params": {"guest_id": "guest_123"}
    },
    {
      "name": "book_restaurant",
      "industry": "restaurant",
      "action": "make_reservation",
      "params": {"guest_id": "guest_123", "cuisine": "italian"}
    }
  ]
}
```

**Response:**
```json
{
  "workflow_id": "wf_abc123",
  "name": "Guest Dining Experience",
  "status": "created",
  "created_at": "2026-06-12T10:00:00Z"
}
```

### GET /workflows

List all workflows.

**Query Parameters:**
- `status` (optional) - Filter by status (pending, running, completed, failed)
- `industry` (optional) - Filter by industry

**Response:**
```json
{
  "total": 50,
  "workflows": [
    {
      "id": "wf_abc123",
      "name": "Guest Dining Experience",
      "status": "completed",
      "industries": ["hotel", "restaurant"],
      "step_count": 2,
      "created_at": "2026-06-12T10:00:00Z",
      "completed_at": "2026-06-12T10:00:05Z"
    }
  ]
}
```

### POST /workflows/{workflow_id}/execute

Execute a workflow.

**Request:**
```json
{
  "initial_context": {
    "guest_id": "guest_123"
  }
}
```

**Response:**
```json
{
  "workflow_id": "wf_abc123",
  "status": "completed",
  "context": {
    "guest_preferences": {"cuisine": "italian", "dietary": "vegetarian"},
    "reservation_id": "res_456",
    "step_0_result": {"status": "completed"},
    "step_1_result": {"status": "completed"}
  }
}
```

### GET /workflows/{workflow_id}

Get workflow details.

**Response:**
```json
{
  "id": "wf_abc123",
  "name": "Guest Dining Experience",
  "description": "Coordinate hotel guest dining across industries",
  "status": "completed",
  "industries": ["hotel", "restaurant"],
  "steps": [
    {"name": "check_preferences", "industry": "hotel", "action": "get_preferences"},
    {"name": "book_restaurant", "industry": "restaurant", "action": "make_reservation"}
  ],
  "context": {
    "guest_preferences": {"cuisine": "italian"},
    "reservation_id": "res_456"
  },
  "created_at": "2026-06-12T10:00:00Z",
  "completed_at": "2026-06-12T10:00:05Z"
}
```

---

## Cross-Industry Endpoints

### POST /cross-industry

Execute a cross-industry operation.

**Request:**
```json
{
  "source_industry": "hotel",
  "target_industry": "restaurant",
  "operation": "dining_referral",
  "payload": {
    "guest_id": "guest_123",
    "preferences": {"cuisine": "italian", "budget": "moderate"},
    "check_in": "2026-06-15",
    "check_out": "2026-06-18"
  }
}
```

**Response:**
```json
{
  "workflow_id": "wf_cross_001",
  "status": "completed",
  "context": {
    "source_result": {"preferences_retrieved": true},
    "target_result": {"reservation_id": "res_789", "restaurant": "Luigi's"},
    "cross_industry_transfer": {"data_shared": true}
  }
}
```

### POST /broadcast

Broadcast a message to all agents in an industry.

**Request:**
```json
{
  "industry": "hotel",
  "message": {
    "type": "promotion",
    "data": {
      "title": "Summer Special",
      "discount": "20%",
      "valid_until": "2026-08-31"
    }
  }
}
```

**Response:**
```json
{
  "broadcast_results": [
    {"agent_id": "concierge_001", "status": "success", "result": {"status": "received"}},
    {"agent_id": "upsell_001", "status": "success", "result": {"status": "received"}}
  ]
}
```

---

## Monitoring Endpoints

### GET /monitoring/health

Get health status of all agents.

**Response:**
```json
{
  "total_agents": 120,
  "healthy_agents": 115,
  "degraded_agents": 3,
  "unhealthy_agents": 2,
  "by_industry": {
    "hotel": [
      {
        "agent_id": "concierge_001",
        "agent_name": "AI Concierge",
        "status": "healthy",
        "last_check": "2026-06-12T10:00:00Z",
        "avg_response_time_ms": 45.2
      }
    ]
  }
}
```

### GET /monitoring/health/{industry}

Get health status for a specific industry.

**Response:**
```json
{
  "industry": "hotel",
  "agents": [...],
  "summary": {
    "total": 10,
    "healthy": 9,
    "degraded": 1,
    "unhealthy": 0,
    "health_score": 90.0
  }
}
```

### GET /monitoring/stats

Get monitoring statistics.

**Response:**
```json
{
  "total_monitored_agents": 120,
  "total_requests": 50000,
  "total_errors": 150,
  "error_rate": 0.003,
  "avg_response_time_ms": 125.5,
  "active_alerts": 3,
  "critical_alerts": 0,
  "error_alerts": 2
}
```

### GET /monitoring/alerts

Get active alerts.

**Query Parameters:**
- `severity` (optional) - Filter by severity (info, warning, error, critical)
- `industry` (optional) - Filter by industry

**Response:**
```json
{
  "total": 3,
  "alerts": [
    {
      "id": "alert_001",
      "severity": "warning",
      "agent_id": "diagnostic_001",
      "agent_name": "Vehicle Diagnostic Agent",
      "industry": "automotive",
      "title": "Slow Response Time",
      "message": "Avg response time 2500ms exceeds threshold 2000ms",
      "timestamp": "2026-06-12T09:55:00Z",
      "acknowledged": false,
      "resolved": false
    }
  ]
}
```

### POST /monitoring/alerts/{alert_id}/acknowledge

Acknowledge an alert.

**Response:**
```json
{
  "status": "acknowledged",
  "alert_id": "alert_001"
}
```

### POST /monitoring/alerts/{alert_id}/resolve

Resolve an alert.

**Response:**
```json
{
  "status": "resolved",
  "alert_id": "alert_001"
}
```

---

## Event Endpoints

### GET /events/history

Get event history.

**Query Parameters:**
- `event_type` (optional) - Filter by event type
- `source` (optional) - Filter by source
- `industry` (optional) - Filter by industry
- `limit` (optional) - Maximum events to return (default: 100)

**Response:**
```json
{
  "total": 50,
  "events": [
    {
      "id": "evt_123",
      "type": "agent.registered",
      "source": "orchestrator",
      "target": null,
      "industry": "hotel",
      "payload": {"agent_id": "concierge_001"},
      "priority": "normal",
      "timestamp": "2026-06-12T10:00:00Z",
      "correlation_id": null
    }
  ]
}
```

### GET /events/stats

Get event bus statistics.

**Response:**
```json
{
  "total_events": 10000,
  "processed_events": 9995,
  "failed_events": 5,
  "subscribers": 50,
  "pending_events": 0,
  "history_size": 5000,
  "dead_letter_size": 5
}
```

---

## Statistics Endpoint

### GET /stats

Get overall platform statistics.

**Response:**
```json
{
  "orchestrator": {
    "total_agents": 120,
    "total_workflows": 50,
    "active_workflows": 2,
    "completed_workflows": 45,
    "failed_workflows": 3
  },
  "registry": {
    "total_agents": 120,
    "total_industries": 24,
    "total_capabilities": 100
  },
  "event_bus": {
    "total_events": 10000,
    "processed_events": 9995
  },
  "monitoring": {
    "total_monitored_agents": 120,
    "active_alerts": 3
  }
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "detail": "Error message describing what went wrong"
}
```

Common HTTP status codes:
- `400` - Bad Request (invalid input)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error
