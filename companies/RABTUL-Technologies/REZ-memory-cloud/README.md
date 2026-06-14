# REZ Memory Cloud

**Unified Memory Infrastructure for AI Agents**

A developer-facing memory API that provides Remember, Recall, Profile, Graph, and Extract capabilities - inspired by Supermemory AI but built for the REZ ecosystem.

## Features

### Memory
- **Remember**: Store memories with automatic TTL/expiry
- **Recall**: Semantic + keyword hybrid search
- **Categories**: Conversation, fact, preference, event, decision, idea, etc.
- **Importance**: Critical, high, medium, low
- **Tags**: Organize memories with custom tags
- **Auto-expiry**: Configurable TTL for automatic forgetting

### Search
- **Hybrid Search**: Combines vector embeddings + keyword search
- **RRF Fusion**: Reciprocal Rank Fusion for optimal results
- **Semantic**: OpenAI embeddings for semantic understanding
- **Keyword**: MongoDB text search fallback

### Profile
- **Preferences**: Key-value preferences with confidence scores
- **Facts**: Key facts about the user
- **Interests**: Interest tracking
- **Behavioral Patterns**: Frequency-based pattern detection
- **Segments**: User segmentation

### Knowledge Graph
- **Entities**: Person, organization, product, location, event, concept
- **Relations**: Knows, works_for, owns, located_in, interested_in, etc.
- **Graph Traversal**: BFS-based depth traversal
- **Bidirectional Relations**: Automatic relation tracking

### Content Extraction
- **URL Extraction**: Extract content from web pages
- **PDF Parsing**: Extract text from PDF documents
- **Text Analysis**: Extract emails, URLs, phone numbers, hashtags

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## API Endpoints

### Memory

```bash
# Create memory
POST /api/memory
{
  "userId": "user_123",
  "content": "User prefers vegetarian food",
  "category": "preference",
  "tags": ["food", "diet"],
  "ttlType": "default"
}

# Recall memories (search)
POST /api/memory/recall
{
  "userId": "user_123",
  "query": "food preferences",
  "limit": 10
}

# Get memories
GET /api/memory?userId=user_123

# Get memory stats
GET /api/memory/stats/:userId
```

### Profile

```bash
# Get profile
GET /api/profile/:userId

# Update profile
PUT /api/profile/:userId
{
  "interests": ["cooking", "travel"],
  "tags": ["foodie", "explorer"]
}

# Set preference
POST /api/profile/:userId/preferences
{
  "key": "notification_frequency",
  "value": "daily",
  "confidence": 0.9
}
```

### Knowledge Graph

```bash
# Create entity
POST /api/graph/entities
{
  "type": "person",
  "name": "John Doe",
  "userId": "user_123",
  "properties": { "role": "engineer" }
}

# Create relation
POST /api/graph/relations
{
  "fromEntityId": "ent_xxx",
  "toEntityId": "ent_yyy",
  "type": "works_for",
  "userId": "user_123"
}

# Query graph
POST /api/graph/query
{
  "userId": "user_123",
  "entityId": "ent_xxx",
  "depth": 2,
  "limit": 50
}
```

### Content Extraction

```bash
# Extract from URL
POST /api/extract/url
{
  "url": "https://example.com/article",
  "userId": "user_123",
  "category": "article"
}

# Extract from PDF
POST /api/extract/pdf
{
  "base64": "...",
  "userId": "user_123"
}
```

## Authentication

Use one of:
- `X-API-Key` header with your API key
- `X-Internal-Token` header for service-to-service calls

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 4210 | Service port |
| `MONGODB_URI` | localhost | MongoDB connection string |
| `REDIS_URL` | localhost | Redis connection string |
| `OPENAI_API_KEY` | - | OpenAI API key for embeddings |
| `DEFAULT_MEMORY_TTL` | 2592000 | Default TTL (30 days) |

## Architecture

```
REZ Memory Cloud (4210)
├── Memory Service     → Store & recall memories
├── Search Service     → Hybrid vector + keyword search
├── Profile Service    → User preference management
├── Graph Service      → Knowledge graph operations
└── Extract Service   → Content extraction
```

## Dependencies

- MongoDB (storage)
- Redis (caching, optional)
- OpenAI (embeddings, optional)
- Express.js (API)
- Mongoose (MongoDB ODM)

## License

MIT
