# CorpID v2.0 - Employee Integration Guide

**Version:** 2.0 | **Date:** June 10, 2026 | **Status:** Ready for Integration

---

## Overview

This guide explains how to integrate CorpPerks Employee system with CorpID v2.0.

### What Changed

**Before:**
```
Employee Model          CorpID Identity
     │                       │
     └── Separate ──────────┘
```

**After:**
```
Employee Model
     │
     └── corpId field (CI-IND-XXXXX)
            │
            └── Linked to CorpID Identity
                    │
                    ├── Employee metadata
                    ├── Assertions
                    ├── Relationships
                    └── Trust Score
```

---

## Changes Made

### 1. Employee Model (CorpPerks Backend)

**New Fields:**
```typescript
interface IEmployee {
  // ... existing fields ...

  // CorpID v2.0: Link to CorpID
  corpId?: string;                    // CI-IND-XXXXX
  corpIdManager?: string;             // Manager's CorpID

  // Sync tracking
  corpIdSyncStatus?: 'synced' | 'pending' | 'error';
  lastSyncedAt?: Date;
}
```

### 2. CorpID Identity Service

**New Endpoints:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/identities/link/employee` | Link employee to CorpID |
| GET | `/identities/employee/:employeeId` | Get CorpID from employee ID |
| GET | `/identities/:corpId/graph` | Get entity's relationship graph |
| POST | `/identities/agent` | Create AI agent identity |
| GET | `/agents/find` | Find agents by capability |
| GET | `/agents/:corpId/metrics` | Get agent performance metrics |
| PATCH | `/agents/:corpId` | Update agent configuration |

### 3. Trust Graph Service

**New Relationship Types:**
```
Human → Human:     REPORTS_TO, MANAGES, WORKS_WITH, COLLABORATES_WITH, MENTORS, PEER_OF
Human → Agent:     CREATED_BY, SUPERVISES, USES
Agent → Agent:     CALLS, DELEGATES_TO, COORDINATES_WITH
```

---

## Integration Flows

### Flow 1: New Employee Onboarding

```typescript
// 1. Create employee in CorpPerks
const employee = await Employee.create({
  tenantId: 'tenant-123',
  employeeId: 'EMP-001',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@company.com',
  department: 'Engineering',
  designation: 'Software Engineer',
  managerId: 'EMP-000',  // Manager's employee ID
  joiningDate: new Date(),
});

// 2. Link to CorpID
const corpidResponse = await fetch('http://localhost:4702/identities/link/employee', {
  method: 'POST',
  headers: { 'x-internal-token': 'corpid-internal-token' },
  body: JSON.stringify({
    employeeId: employee.employeeId,
    email: employee.email,
    firstName: employee.firstName,
    lastName: employee.lastName,
    department: employee.department,
    designation: employee.designation,
    managerCorpId: managerCorpId,  // Get from manager's employee record
  }),
});

// Response: { corpId: "CI-IND-ABC12", linked: true }

// 3. Update employee with CorpID
employee.corpId = corpidResponse.data.corpId;
employee.corpIdManager = managerCorpId;
employee.corpIdSyncStatus = 'synced';
employee.lastSyncedAt = new Date();
await employee.save();
```

### Flow 2: Manager Hierarchy Sync

```typescript
// When manager changes for an employee
async function updateManager(employeeId: string, newManagerId: string) {
  // Get CorpIDs
  const employee = await Employee.findOne({ employeeId });
  const newManager = await Employee.findOne({ employeeId: newManagerId });

  if (!employee.corpId || !newManager.corpId) {
    throw new Error('Both employees must have CorpID');
  }

  // Update relationship in Trust Graph
  await fetch('http://localhost:4706/relationships', {
    method: 'POST',
    headers: { 'x-internal-token': 'corpid-internal-token' },
    body: JSON.stringify({
      fromCorpId: employee.corpId,
      toCorpId: newManager.corpId,
      type: 'REPORTS_TO',
      metadata: { since: new Date().toISOString() },
    }),
  });

  // Update employee
  employee.managerId = newManagerId;
  employee.corpIdManager = newManager.corpId;
  await employee.save();
}
```

### Flow 3: Department Transfer

```typescript
async function transferEmployee(employeeId: string, newDepartment: string) {
  const employee = await Employee.findOne({ employeeId });

  // Update CorpPerks
  employee.department = newDepartment;
  await employee.save();

  // Update CorpID metadata
  await fetch(`http://localhost:4702/identities/${employee.corpId}`, {
    method: 'PATCH',
    headers: { 'x-internal-token': 'corpid-internal-token' },
    body: JSON.stringify({
      metadata: { department: newDepartment },
    }),
  });

  // Log event to MemoryOS (future integration)
  // await memoryOS.log('employee.department_changed', { ... });
}
```

### Flow 4: Create AI Agent

```typescript
async function registerAgent(agentData: AgentConfig) {
  const response = await fetch('http://localhost:4702/identities/agent', {
    method: 'POST',
    headers: { 'x-internal-token': 'corpid-internal-token' },
    body: JSON.stringify({
      name: 'Finance Analyst Agent',
      description: 'Analyzes financial data and generates reports',
      version: '1.0.0',
      agentType: 'SPECIALIZED',
      capabilities: [
        { name: 'Financial Analysis', inputTypes: ['CSV', 'JSON'], outputTypes: ['Report', 'Dashboard'] },
        { name: 'Data Visualization', inputTypes: ['Data'], outputTypes: ['Chart', 'Graph'] },
      ],
      tools: [
        { name: 'Calculator', enabled: true },
        { name: 'Spreadsheet API', enabled: true },
      ],
      permissions: {
        dataAccess: ['read:financial_data'],
        actionAccess: ['execute:report_generation'],
      },
      costProfile: {
        perInvocation: 0.01,
        perTokenInput: 0.0001,
        perTokenOutput: 0.0002,
      },
      ownerId: 'CI-IND-ABC12',  // Owner's CorpID
    }),
  });

  return response.data;  // { corpId: "CI-AGT-XYZ99", entityType: 'AGENT' }
}
```

### Flow 5: Find Agents by Capability

```typescript
async function findAgentsForTask(task: string) {
  const response = await fetch(
    `http://localhost:4702/agents/find?capability=${encodeURIComponent(task)}`,
    { headers: { 'x-internal-token': 'corpid-internal-token' } }
  );

  return response.data.items;  // List of matching agents
}

// Usage
const agents = await findAgentsForTask('Financial Analysis');
// Returns: [{ corpId: 'CI-AGT-XYZ99', name: 'Finance Analyst Agent', ... }]
```

---

## API Reference

### Link Employee to CorpID

```
POST /identities/link/employee
```

**Request:**
```json
{
  "employeeId": "EMP-001",
  "email": "john.doe@company.com",
  "firstName": "John",
  "lastName": "Doe",
  "department": "Engineering",
  "designation": "Software Engineer",
  "managerCorpId": "CI-IND-MGR01",
  "metadata": {}
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "corpId": "CI-IND-ABC12",
    "employeeId": "EMP-001",
    "linked": true,
    "preExisting": false
  }
}
```

### Get CorpID from Employee ID

```
GET /identities/employee/:employeeId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "corpId": "CI-IND-ABC12",
    "employeeId": "EMP-001",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@company.com",
    "managerCorpId": "CI-IND-MGR01"
  }
}
```

### Get Entity Graph

```
GET /identities/:corpId/graph?depth=2
```

**Response:**
```json
{
  "success": true,
  "data": {
    "root": {
      "corpId": "CI-IND-ABC12",
      "entityType": "INDIVIDUAL",
      "name": "John Doe",
      "managerCorpId": "CI-IND-MGR01"
    },
    "relationships": [
      { "type": "REPORTS_TO", "targetCorpId": "CI-IND-MGR01" }
    ],
    "depth": 1
  }
}
```

### Create Agent Identity

```
POST /identities/agent
```

**Request:**
```json
{
  "name": "Sales Analyzer Agent",
  "description": "Analyzes sales data and provides insights",
  "agentType": "SPECIALIZED",
  "capabilities": [
    {
      "name": "Sales Analytics",
      "inputTypes": ["CRM Data", "CSV"],
      "outputTypes": ["Report", "Chart"]
    }
  ],
  "tools": [
    { "name": "CRM API", "enabled": true }
  ],
  "costProfile": {
    "perInvocation": 0.02
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "corpId": "CI-AGT-SAL01",
    "entityType": "AGENT",
    "status": "ACTIVE",
    "agentType": "SPECIALIZED",
    "name": "Sales Analyzer Agent"
  }
}
```

### Find Agents

```
GET /agents/find?capability=Sales&agentType=SPECIALIZED
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "corpId": "CI-AGT-SAL01",
        "name": "Sales Analyzer Agent",
        "agentType": "SPECIALIZED",
        "capabilities": [...],
        "trustScore": 85
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 20
  }
}
```

### Create Relationship

```
POST /relationships
```

**Request:**
```json
{
  "fromCorpId": "CI-IND-ABC12",
  "toCorpId": "CI-AGT-SAL01",
  "type": "USES",
  "metadata": { "since": "2026-06-10T00:00:00Z" },
  "verified": true
}
```

---

## Database Changes

### MongoDB Indexes Added

```javascript
// Employee model
employeeSchema.index({ corpId: 1 });
employeeSchema.index({ corpIdManager: 1 });

// Identity model
identitySchema.index({ employeeId: 1 }, { sparse: true });
```

### Migration Script

```javascript
// Run once to link existing employees
db.employees.find({ corpId: { $exists: false } }).forEach(async (employee) => {
  const corpidResponse = await fetch('http://localhost:4702/identities/link/employee', {
    method: 'POST',
    headers: { 'x-internal-token': 'corpid-internal-token' },
    body: JSON.stringify({
      employeeId: employee.employeeId,
      email: employee.email,
      firstName: employee.firstName,
      lastName: employee.lastName,
      department: employee.department,
      designation: employee.designation,
    }),
  });

  if (corpidResponse.success) {
    db.employees.updateOne(
      { _id: employee._id },
      { $set: { corpId: corpidResponse.data.corpId } }
    );
  }
});
```

---

## Environment Variables

```bash
# CorpID Identity Service
CORPID_PORT=4702
MONGODB_URI=mongodb://localhost:27017/corpid
INTERNAL_SERVICE_TOKEN=corpid-internal-token

# CorpPerks Backend (for internal service calls)
CORPID_SERVICE_URL=http://localhost:4702
CORPID_INTERNAL_TOKEN=corpid-internal-token
```

---

## Next Steps

1. **Test the integration** - Use the API endpoints above
2. **Run migration** - Link existing employees to CorpID
3. **Set up sync job** - Keep CorpID in sync with employee changes
4. **Add MemoryOS integration** - Send events when employee data changes
5. **Add SADA integration** - Compute trust scores based on assertions

---

**Related Documents:**
- [CORPID-V2-ARCHITECTURE.md](./CORPID-V2-ARCHITECTURE.md)
- [RTMN-ARCHITECTURE.md](./RTMN-ARCHITECTURE.md)
