# @hojai/graph

**HOJAI Unified Graph - Single API for All Entities**

---

## Overview

Single API for all entity relationships. Connects humans, AI employees, customers, merchants, and more.

## Features

- 15 entity types
- 14 relationship types
- Graph traversal
- Ego network
- AI employee tracking

## Quick Start

```bash
npm install @hojai/graph
npm run dev
```

```typescript
import { HojaiGraph } from '@hojai/graph';

const graph = new HojaiGraph({
  port: 4810,
  mongodb: 'mongodb://localhost:27017/hojai-graph'
});

await graph.start();
```

## Entity Types

| Type | Description |
|------|-------------|
| human | Human employees |
| ai_employee | AI workers |
| customer | Customers |
| merchant | Merchants |
| organization | Companies |
| department | Departments |
| team | Teams |
| product | Products |
| workflow | Workflows |

## Relationship Types

| Type | Description |
|------|-------------|
| works_with | Collaboration |
| reports_to | Hierarchy |
| manages | Management |
| created | Creation |
| owns | Ownership |
| member_of | Membership |

## API Examples

### Create Entity

```typescript
await graph.nodes.create({
  entityId: 'ai_sdr_001',
  entityType: 'ai_employee',
  name: 'AI Sales Rep',
  properties: { role: 'SDR', department: 'Sales' }
});
```

### Create Relationship

```typescript
await graph.relationships.create({
  sourceId: 'ai_sdr_001',
  sourceType: 'ai_employee',
  targetId: 'ai_ae_001',
  targetType: 'ai_employee',
  relationship: 'works_with'
});
```

### Traverse Graph

```typescript
const network = await graph.traverse({
  sourceId: 'employee_123',
  sourceType: 'human',
  depth: 3
});
```

---

**Port:** 4810
**Status:** Production Ready
