# AdBazaar Canned Response Service

Support response template management for AdBazaar support operations.

## Features

- Create and manage canned responses
- Shortcut commands for quick access
- Category-based organization
- Tag support for easy searching
- Variable substitution (e.g., {{customer_name}})
- Usage tracking and analytics
- Search with filters
- Popular responses ranking

## API Endpoints

### Responses

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/responses` | Create a new canned response |
| GET | `/api/responses` | List responses with filters |
| GET | `/api/responses/search` | Search responses |
| GET | `/api/responses/popular` | Get popular responses |
| GET | `/api/responses/:id` | Get response by ID |
| GET | `/api/responses/shortcut/:shortcut` | Get response by shortcut |
| GET | `/api/responses/prefix/:prefix` | Get responses by shortcut prefix |
| PUT | `/api/responses/:id` | Update canned response |
| DELETE | `/api/responses/:id` | Archive canned response |
| POST | `/api/responses/:id/use` | Record response usage |
| POST | `/api/responses/:id/render` | Render response with variables |
| GET | `/api/responses/category/:categoryId` | Get responses by category |

### Categories

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/categories` | Create a new category |
| GET | `/api/categories` | List all categories |
| GET | `/api/categories/:id` | Get category by ID |
| GET | `/api/categories/slug/:slug` | Get category by slug |
| PUT | `/api/categories/:id` | Update category |
| DELETE | `/api/categories/:id` | Delete category |
| POST | `/api/categories/:id/toggle` | Toggle category active status |
| POST | `/api/categories/reorder` | Reorder categories |

## Variables

Canned responses support variable substitution using `{{variable_name}}` syntax:

```
Hello {{customer_name}},

Your ticket #{{ticket_id}} has been {{ticket_status}}.

Best regards,
{{agent_name}}
```

## Shortcuts

Quick access shortcuts for common responses:

- `/greeting` - Welcome message
- `/thanks` - Thank you response
- `/apology` - Apology template
- `/refund` - Refund policy response

## Configuration

Environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Service port | 5086 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/canned-responses |
| LOG_LEVEL | Logging level | info |
| SERVICE_API_KEY | API key for authentication | adbazaar-service-key |
| INTERNAL_SERVICE_TOKEN | Internal service token | - |

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Health Check

```bash
curl http://localhost:5086/health
```

## Metrics

Prometheus metrics available at `/metrics`.

## License

Proprietary - AdBazaar