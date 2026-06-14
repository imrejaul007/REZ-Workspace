# @axom/axomi-help

Axomi Help / Support platform microservice — part of the Axom platform.

## Overview

The Help service provides a help-desk and self-service knowledge base for end users. Key capabilities:

- **Tickets** — Users open support tickets with category and priority. Agents claim, respond to, resolve, and close tickets.
- **Messaging** — Threads of messages attached to each ticket for back-and-forth communication.
- **FAQ** — A searchable knowledge base of frequently-asked questions organized by category and tagged for search.

## Quick start

```bash
# Install dependencies
npm install

# Start in development mode
npm run dev

# Run tests
npm test
```

## Configuration

Copy `.env.example` to `.env` and adjust values:

| Variable               | Default                                 | Description                    |
|------------------------|-----------------------------------------|--------------------------------|
| `PORT`                 | `4081`                                  | HTTP port the service listens on |
| `NODE_ENV`             | `development`                           | `development` \| `production` \| `test` |
| `MONGODB_URI`          | `mongodb://localhost:27017/axomi-help` | MongoDB connection string (currently unused — in-memory store) |
| `REDIS_HOST`           | `localhost`                             | Redis host (currently unused)  |
| `REDIS_PORT`           | `6379`                                  | Redis port                     |
| `INTERNAL_SERVICE_TOKEN` | _(optional)_                          | Bearer token for inter-service calls |

## API

Base URL: `http://localhost:4081/api/help`

### Tickets

| Method | Endpoint                         | Description                        |
|--------|----------------------------------|------------------------------------|
| POST   | `/tickets`                       | Create a new ticket                |
| GET    | `/tickets/:id`                   | Get ticket by ID                   |
| GET    | `/tickets/user/:userId`          | List all tickets for a user        |
| GET    | `/tickets/open`                  | List all open tickets              |
| POST   | `/tickets/:id/assign`            | Assign ticket to an agent          |
| POST   | `/tickets/:id/messages`          | Add a message to the ticket thread |
| POST   | `/tickets/:id/resolve`           | Mark a ticket as resolved          |
| POST   | `/tickets/:id/close`             | Close a resolved ticket            |
| POST   | `/tickets/:id/rate`              | Record helpfulness feedback        |

### FAQ

| Method | Endpoint                         | Description                        |
|--------|----------------------------------|------------------------------------|
| GET    | `/faq/search?q=<query>`         | Search FAQ by free-text query      |
| GET    | `/faq/category/:category`       | List FAQ entries by category       |
| POST   | `/faq`                           | Create a new FAQ entry (admin)     |
| POST   | `/faq/:id/views`                 | Record a view for an FAQ entry     |

### Health

| Method | Endpoint | Description          |
|--------|----------|----------------------|
| GET    | `/health`| Service health check |

## Architecture

- **HelpService** — business logic layer; pure in-memory store for easy testing.
- **Middleware** — error handler, request logger, Zod request validation.
- **Routes** — Express router with typed, validated endpoints.

## Production

Build and run with Docker:

```bash
docker build -t axom/axomi-help .
docker run -p 4081:4081 axom/axomi-help
```