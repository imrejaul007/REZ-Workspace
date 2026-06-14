# CorpID v2.0 - MemoryOS Integration

**Version:** 2.0 | **Date:** June 10, 2026 | **Status:** Ready for Integration

---

## Overview

MemoryOS is the event store that powers CorpID's evidence chain. Events in MemoryOS become evidence that strengthens assertions.

```
┌─────────────────────────────────────────────────────────────┐
│                         MemoryOS                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Event: "GitHub PR #123 merged"                            │
│  Entities: [Rejaul]                                         │
│  Context: { repo: "HOJAI", language: "Python" }            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Event processed
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    CorpID Assertion Service                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Assertion: skill:python                                    │
│  Evidence: [MemoryEvent-#123]                               │
│  Confidence: 0.4 → 0.72 (boosted by evidence)               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Integration Flow

### 1. Event Sources → MemoryOS

| Source | Event Types | Becomes Evidence For |
|--------|-------------|---------------------|
| GitHub | PR merged, code review, commit | Skill assertions |
| Jira | Task completed, story closed | Capability assertions |
| Slack | Message sent, channel joined | Relationship assertions |
| Calendar | Meeting attended | Collaboration assertions |
| HRIS | Review completed, promotion | Performance assertions |
| LMS | Course completed, certification earned | Certification assertions |
| Sutar | Task completed | Execution assertions |

### 2. MemoryOS → Assertion Service

```typescript
// MemoryOS event structure
interface MemoryEvent {
  id: string;
  eventType: string;
  entities: string[];              // CorpIDs involved
  timestamp: Date;
  source: string;                  // "github", "jira", etc.
  context: Record<string, unknown>;

  // For CorpID integration
  evidenceFor?: string[];          // Specific CorpIDs this evidences
  predicate?: string;             // "skill:python", "capability:analysis"
  weight?: number;                 // Evidence weight (0-1)
}

// Example: GitHub PR merged
{
  id: "evt-123",
  eventType: "github.pr.merged",
  entities: ["CI-IND-ABC12"],
  source: "github",
  context: {
    repo: "HOJAI",
    language: "Python",
    linesChanged: 500,
    prNumber: 456,
  },
  evidenceFor: ["CI-IND-ABC12"],
  predicate: "skill:python",
  weight: 0.8
}
```

### 3. Assertion Service Processing

```typescript
// When MemoryOS receives an event, it notifies CorpID
// POST /corpId-integration/events (webhook or direct call)

async function processMemoryEvent(event: MemoryEvent) {
  if (!event.predicate || !event.evidenceFor) {
    return; // Not relevant for CorpID
  }

  for (const corpId of event.evidenceFor) {
    // Find or create the assertion
    let assertion = await Assertion.findOne({
      corpId,
      predicate: event.predicate,
      isActive: true,
    });

    if (!assertion) {
      // Auto-create assertion from evidence
      assertion = await Assertion.create({
        assertionId: generateId('AST'),
        corpId,
        predicate: event.predicate,
        predicateCategory: inferCategory(event.predicate),
        value: true,
        source: 'SYSTEM_OBSERVED',
        confidence: 0.5, // Base confidence
        createdBy: 'memory-os',
      });
    }

    // Add evidence
    assertion.evidence.push({
      memoryEventId: event.id,
      weight: event.weight || 0.5,
      source: inferSource(event.source),
      addedAt: new Date(),
    });

    // Recalculate confidence
    await updateAssertionConfidence(assertion);
    await assertion.save();

    // Notify SADA of confidence change
    await notifySADA(assertion);
  }
}
```

---

## MemoryOS Event Types → Assertion Mapping

### GitHub Integration

| MemoryOS Event | Predicate | Evidence For |
|----------------|-----------|--------------|
| `github.pr.merged` | `skill:{language}` | Author |
| `github.pr.reviewed` | `skill:code-review` | Reviewer |
| `github.issue.closed` | `capability:{type}` | Assignee |
| `github.commit` | `skill:{language}` | Author |

### Jira Integration

| MemoryOS Event | Predicate | Evidence For |
|----------------|-----------|--------------|
| `jira.task.completed` | `capability:{project_type}` | Assignee |
| `jira.story.completed` | `capability:story_delivery` | Assignee |
| `jira.bug.fixed` | `skill:debugging` | Assignee |

### LMS Integration

| MemoryOS Event | Predicate | Evidence For |
|----------------|-----------|--------------|
| `lms.course.completed` | `cert:{course_name}` | Learner |
| `lms.certification.earned` | `cert:{cert_name}` | Learner |
| `lms.quiz.passed` | `skill:{topic}` | Learner |

### Calendar Integration

| MemoryOS Event | Predicate | Evidence For |
|----------------|-----------|--------------|
| `calendar.meeting.attended` | `experience:{meeting_type}` | Attendee |
| `calendar.presentation.given` | `capability:presentation` | Presenter |

### Sutar Integration (Execution)

| MemoryOS Event | Predicate | Evidence For |
|----------------|-----------|--------------|
| `sutar.task.completed` | `execution:task_completion` | Executor |
| `sutar.task.approved` | `execution:quality` | Executor |
| `sutar.goal.achieved` | `capability:goal_achievement` | Team |

---

## Confidence Computation

### Base Confidence by Source

| Source | Base Confidence |
|--------|----------------|
| CREDENTIAL | 0.95 |
| MANUAL_REVIEW | 0.85 |
| PEER_VERIFIED | 0.75 |
| SYSTEM_OBSERVED | 0.70 |
| AGENT_COMPUTED | 0.60 |
| SELF_DECLARED | 0.40 |

### Evidence Boost Calculation

```typescript
function computeConfidenceBoost(evidence: Evidence[]): number {
  let boost = 0;

  for (const e of evidence) {
    // Source multiplier
    const sourceMultiplier = {
      'CREDENTIAL': 0.15,
      'MANUAL_REVIEW': 0.12,
      'PEER_VERIFIED': 0.10,
      'SYSTEM_OBSERVED': 0.08,
      'AGENT_COMPUTED': 0.06,
    }[e.source] || 0.05;

    boost += e.weight * sourceMultiplier;
  }

  // Diversity bonus (different evidence types)
  const types = new Set(evidence.map(e => e.source));
  boost += Math.min(types.size * 0.02, 0.10);

  // Volume bonus (more evidence = more confidence)
  boost += Math.min(evidence.length * 0.01, 0.05);

  return boost;
}

// Final confidence
finalConfidence = Math.min(
  baseConfidence + computeConfidenceBoost(evidence),
  0.99 // Cap at 99%
);
```

---

## MemoryOS Event Schema for CorpID

```typescript
// What CorpID expects from MemoryOS
interface CorpIdEvidenceEvent {
  eventId: string;
  timestamp: Date;

  // Entities involved (CorpIDs)
  entityCorpIds: string[];

  // Evidence metadata
  evidence: {
    predicate: string;           // "skill:python", "capability:analysis"
    weight: number;              // 0-1
    source: string;              // "github", "jira", etc.
    description?: string;        // Human-readable description
    url?: string;                // Link to source
  }[];

  // Context
  source: string;
  sourceId?: string;             // External reference ID
  context?: Record<string, unknown>;
}
```

---

## API Integration

### MemoryOS → CorpID Push

```
POST /corpId/evidence/webhook
```

**Request:**
```json
{
  "eventId": "evt-abc123",
  "timestamp": "2026-06-10T12:00:00Z",
  "entityCorpIds": ["CI-IND-ABC12", "CI-IND-DEF34"],
  "evidence": [
    {
      "predicate": "skill:python",
      "weight": 0.8,
      "source": "github",
      "description": "Merged PR #456 to HOJAI",
      "url": "https://github.com/..."
    }
  ],
  "source": "github",
  "sourceId": "pr-456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "processed": 1,
    "assertionsUpdated": [
      {
        "corpId": "CI-IND-ABC12",
        "assertionId": "AST-123",
        "newConfidence": 0.72,
        "evidenceCount": 5
      }
    ]
  }
}
```

### CorpID → MemoryOS Pull (Optional)

```
GET /memory/events?entity=CI-IND-ABC12&type=github&from=2026-01-01
```

---

## Configuration

```bash
# .env for CorpID services
MEMORYOS_SERVICE_URL=http://localhost:4201
MEMORYOS_API_KEY=memory-os-secret
CORPID_EVIDENCE_WEBHOOK_SECRET=evidence-webhook-secret
```

---

## Implementation Checklist

- [ ] Add `/corpId/evidence/webhook` endpoint to CorpID gateway
- [ ] Configure MemoryOS to push events to CorpID
- [ ] Implement confidence computation in Assertion Service
- [ ] Add SADA notification on confidence change
- [ ] Set up monitoring for evidence flow

---

**Related Documents:**
- [CORPID-V2-ARCHITECTURE.md](./CORPID-V2-ARCHITECTURE.md)
- [CORPID-V2-EMPLOYEE-INTEGRATION.md](./CORPID-V2-EMPLOYEE-INTEGRATION.md)
