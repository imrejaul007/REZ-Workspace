# risacare-health-graph

**Health Knowledge Graph** - Relationships and intelligence layer for MyRisa

Following RTNM Doctrine: `Memory → Knowledge Graph → Twin → Intelligence`

---

## Overview

`risacare-health-graph` builds the knowledge layer on top of Health Memory. It creates relationships between health entities that enable:

- Symptom-to-condition correlations
- Medication interaction detection
- Personalized health insights
- AI-powered health analysis

---

## Why This Layer Matters

Without Knowledge Graph:
```
Symptom = Fatigue
```

With Knowledge Graph:
```
Fatigue
 ├── Sleep Pattern Changes
 ├── Iron Deficiency
 ├── Pregnancy
 ├── Medication Side Effect
 ├── Stress
 └── Thyroid Issues
```

This is where real intelligence comes from.

---

## Node Types

| Type | Description |
|------|-------------|
| PERSON | Core identity |
| CONDITION | Diagnoses, diseases |
| SYMPTOM | Health symptoms |
| MEDICATION | Drugs, supplements |
| DOCTOR | Healthcare providers |
| FACILITY | Hospitals, clinics |
| ALLERGY | Allergic reactions |
| VACCINATION | Vaccine records |
| PROCEDURE | Medical procedures |
| LIFE_EVENT | Health-affecting events |
| FAMILY_MEMBER | Family health context |

---

## Relationship Types

### Person Relationships
- `HAS_CONDITION` - Person has a diagnosis
- `EXPERIENCES_SYMPTOM` - Person has a symptom
- `TAKES_MEDICATION` - Person takes a drug
- `VISITS_DOCTOR` - Person sees a provider
- `ALLERGIC_TO` - Allergy relationship
- `HAS_FAMILY_MEMBER` - Family connection

### Condition Relationships
- `CAUSES_SYMPTOM` - Condition causes symptom
- `TREATED_BY_MEDICATION` - Condition treated by drug
- `RELATED_TO_CONDITION` - Conditions linked

### Medication Relationships
- `TREATS_CONDITION` - Drug treats condition
- `CAUSES_SIDE_EFFECT` - Drug causes symptom
- `INTERACTS_WITH` - Drug interactions
- `PRESCRIBED_BY_DOCTOR` - Provider link

---

## API Endpoints

### Graph Management
- `GET /api/graph` - Get health graph
- `GET /api/graph/export` - Export graph data

### Node Management
- `POST /api/graph/nodes` - Add node
- `GET /api/graph/nodes` - Get all nodes

### Relationships
- `POST /api/graph/relationships` - Create relationship
- `GET /api/graph/relationships/:nodeId` - Get node relationships

### Analysis
- `POST /api/graph/extract` - Extract knowledge from text
- `POST /api/graph/analyze/symptom` - Analyze symptom
- `POST /api/graph/analyze/condition` - Analyze condition

### Insights
- `GET /api/graph/insights` - Generate insights
- `GET /api/graph/correlations` - Find correlations
- `GET /api/graph/neighborhood/:nodeId` - Get connected nodes

---

## Architecture

```
risacare-health-memory (Port 4801)
         ↓
risacare-health-graph (Port 4802)
         ↓
risacare-health-twin (Port 4803) [Next]
         ↓
Health Intelligence
         ↓
Health Agents
```

---

## What's Next?

```
Phase 0: Health Memory ← ✅ Built
Phase 0.5: Health Knowledge Graph ← ✅ Built
Phase 1: Health Twin ← Next
Phase 2: Women's Health Intelligence
Phase 3: Family Health Graph
Phase 4: Health Genie
Phase 5: Health Agents
```

---

**License:** Proprietary - RTNM Digital