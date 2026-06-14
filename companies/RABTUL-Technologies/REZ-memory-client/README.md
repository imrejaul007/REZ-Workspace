# REZ Memory Client SDK

TypeScript/JavaScript SDK for integrating with REZ Memory Cloud - AI memory infrastructure with vector search and knowledge graphs.

## Installation

```bash
npm install @rez/memory-client
```

## Quick Start

```typescript
import { REZMemoryClient } from '@rez/memory-client';

const memory = new REZMemoryClient({
  apiUrl: 'http://localhost:4210', // or your production URL
  apiKey: 'your-api-key', // optional
});

// Remember something
const memory = await memory.remember({
  userId: 'user-123',
  content: 'Meeting notes from Q4 planning - focus on mobile app features',
  title: 'Q4 Planning Meeting',
  tags: ['meeting', 'planning', 'q4'],
});

// Search memories
const results = await memory.search({
  query: 'meeting notes',
  userId: 'user-123',
  limit: 10,
});

// Get knowledge graph
const graph = await memory.getGraph('user-123');
```

## Features

- **Remember**: Save any content to memory with auto-tagging and TTL support
- **Recall**: Retrieve specific memories by ID
- **Search**: Hybrid vector + keyword search using RRF fusion
- **Graph**: Knowledge graph with entities and relationships
- **Extract**: Pull content from URLs or plain text
- **Profile**: User preferences and settings

## API Reference

### Memory Operations

```typescript
// Save memory
await memory.remember({ userId, content, title?, tags?, type?, metadata?, ttl? });

// Get memory
await memory.recall(memoryId, userId);

// List memories
await memory.listMemories(userId, { limit, skip, type, tags });

// Update memory
await memory.updateMemory(memoryId, userId, updates);

// Delete memory
await memory.forget(memoryId, userId);
```

### Search

```typescript
// Hybrid search
await memory.search({ query, userId, limit?, type?, tags?, fromDate?, toDate? });

// Find similar content
await memory.findSimilar(userId, content, limit?);
```

### Knowledge Graph

```typescript
// Get user's knowledge graph
await memory.getGraph(userId);

// Get entity
await memory.getEntity(userId, entityId);

// Get memories for entity
await memory.getEntityMemories(userId, entityId);
```

### Content Extraction

```typescript
// Extract from URL
await memory.extractFromUrl('https://example.com/article');

// Extract from text
await memory.extractFromText('Some text to analyze');
```

### Profile

```typescript
// Get profile
await memory.getProfile(userId);

// Save profile
await memory.saveProfile({ userId, name, email, preferences });

// Update preferences
await memory.updatePreferences(userId, { defaultTtl: 30, autoTag: true });
```

### Utilities

```typescript
// Health check
await memory.health();

// Get statistics
await memory.getStats(userId);
```

## TypeScript Support

Fully typed - no `any` usage. All methods have proper return types.

```typescript
import { REZMemoryClient, MemoryResponse, SearchResponse } from '@rez/memory-client';
```

## Browser Support

Works in browsers via fetch API. No Node.js required for client usage.

## License

MIT
