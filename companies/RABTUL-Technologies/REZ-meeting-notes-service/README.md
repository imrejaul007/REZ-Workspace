# REZ Meeting Notes Service

**Port:** 4133  
**Status:** Complete

## Overview

AI-powered meeting notes service for B2B sales. Captures meeting context, extracts action items, and integrates with deal intelligence for comprehensive meeting intelligence.

## Features

- **Meeting Context Capture** - Title, description, attendees, location, meeting type
- **AI Note-Taking** - Rich note content with AI-generated summaries
- **Action Items** - Track follow-up tasks with ownership and due dates
- **Deal Integration** - Associate notes with deals and track meeting history
- **Automatic Reminders** - Schedule follow-up reminders for action items
- **Smart Search** - Search notes by content, attendees, or deal

## Data Model

### MeetingNote

```typescript
interface MeetingNote {
  _id: ObjectId;
  tenantId: string;

  // Meeting Info
  title: string;
  description?: string;
  date: Date;
  duration?: number; // minutes
  location?: string;
  meetingLink?: string;
  meetingType: 'video' | 'phone' | 'in-person' | 'conference';
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';

  // Attendees
  attendees: {
    userId?: string;
    email: string;
    name: string;
    role?: string;
    isPrimary?: boolean;
  }[];

  // Notes Content
  notes?: string;
  aiSummary?: string;
  keyDecisions?: string[];
  topicsDiscussed?: string[];

  // Action Items
  actionItems: {
    _id: ObjectId;
    title: string;
    description?: string;
    assignedTo?: {
      userId?: string;
      name: string;
      email: string;
    };
    dueDate?: Date;
    status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    completedAt?: Date;
    completedBy?: string;
  }[];

  // Deal Association
  dealId?: string;
  accountId?: string;

  // Attachments
  attachments: {
    url: string;
    filename: string;
    mimeType: string;
    size: number;
  }[];

  // AI Insights
  sentiment?: 'positive' | 'neutral' | 'negative';
  engagement?: number; // 1-10
  followUpRecommended?: boolean;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastEditedBy?: string;
}
```

## API Endpoints

### Notes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/notes` | Create meeting note |
| GET | `/api/v1/notes` | List notes (paginated) |
| GET | `/api/v1/notes/:noteId` | Get note by ID |
| PATCH | `/api/v1/notes/:noteId` | Update note |
| DELETE | `/api/v1/notes/:noteId` | Delete note |

### Action Items

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/notes/:noteId/action-items` | Add action item |
| PATCH | `/api/v1/notes/:noteId/action-items/:actionItemId` | Update action item |
| DELETE | `/api/v1/notes/:noteId/action-items/:actionItemId` | Delete action item |
| GET | `/api/v1/notes/:noteId/action-items` | Get action items |

### Queries

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/notes/deal/:dealId` | Get notes by deal |
| GET | `/api/v1/notes/account/:accountId` | Get notes by account |
| GET | `/api/v1/notes/upcoming/list` | Get upcoming meetings |
| GET | `/api/v1/notes/search` | Search notes |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/notes/analytics/summary` | Get notes summary |
| GET | `/api/v1/notes/analytics/activity` | Get activity analytics |
| GET | `/api/v1/notes/analytics/action-items` | Get action items stats |

## Query Parameters

### List Notes
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `status` - Filter by status
- `meetingType` - Filter by meeting type
- `startDate` - Filter by start date
- `endDate` - Filter by end date
- `dealId` - Filter by deal
- `accountId` - Filter by account
- `hasActionItems` - Filter notes with action items

### Search
- `q` - Search query
- `fields` - Fields to search (default: title,notes,attendees.name)
- `sentiment` - Filter by sentiment

## Dependencies

- MongoDB (mongoose)
- Redis (caching, rate limiting)
- Express.js
- Zod (validation)
- Helmet (security)
- express-rate-limit

## Environment Variables

```
PORT=4133
MONGODB_URI=mongodb://localhost:27017/rez_meeting_notes
REDIS_URL=redis://localhost:6379
CORS_ORIGIN=*
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

## Installation

```bash
cd REZ-meeting-notes-service
npm install
npm run dev  # Development
npm run build && npm start  # Production
```

## Integration Points

- **Deal Intelligence (Port 4131)** - Notes linked to deals
- **Outbound Service (Port 4130)** - Follow-up sequences from action items
- **Signal Service (Port 4129)** - Meeting signals trigger
- **TAM Builder (Port 4128)** - Account meeting history

## Meeting Types

1. **Discovery Call** - Initial contact, qualify prospects
2. **Demo** - Product/service demonstration
3. **Technical Review** - Technical evaluation
4. **Negotiation** - Deal negotiation
5. **Executive Briefing** - C-level presentation
6. **Quarterly Business Review** - QBR
7. **Kickoff** - Deal/project kickoff
8. **Follow-up** - Standard follow-up

## Action Item Status Flow

```
pending → in-progress → completed
         ↘ cancelled
```

## TODO

- [x] Basic CRUD
- [x] Action items management
- [x] Deal association
- [x] Search functionality
- [x] Analytics
- [x] Redis caching
- [ ] AI summarization integration
- [ ] Video transcription integration
- [ ] Calendar sync (Google Meet, Zoom)
