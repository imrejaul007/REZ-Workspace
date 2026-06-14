# REZ-content-syndication

Real RSS/Atom feed syndication service for AdBazaar. Automatically fetches content from blogs and syndicates to social platforms.

## Features

- **Real RSS/Atom Feed Parsing** - Parse any RSS or Atom feed using the rss-parser library
- **Multi-Platform Support** - Twitter/X, LinkedIn, Mastodon, Bluesky, custom webhooks
- **Content Transformation** - Templates with variables like `{{title}}`, `{{excerpt}}`, `{{link}}`
- **Auto-Posting** - Automatic posting with configurable schedules
- **Feed Monitoring** - Periodic checking with cron scheduling
- **Character Limits** - Platform-specific character limits (280 for Twitter, etc.)
- **Retry Logic** - Automatic retry for failed posts
- **Analytics** - Track posted/pending/failed items

## Installation

```bash
cd services/REZ-content-syndication
npm install
cp .env.example .env
# Edit .env with your settings
```

## Configuration

Edit `.env`:

```env
PORT=4760
NODE_ENV=development
CORS_ORIGIN=*

# Feed check interval (cron expression)
FEED_CHECK_INTERVAL=*/15 * * * *

# Platform API keys (optional)
TWITTER_API_KEY=
TWITTER_API_SECRET=
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
MASTODON_INSTANCE=mastodon.social
MASTODON_ACCESS_TOKEN=
BLUESKY_IDENTIFIER=
BLUESKY_PASSWORD=
```

## Running

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## API Endpoints

### Feeds

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/feeds` | List all feeds |
| GET | `/api/v1/feeds/:id` | Get feed details |
| POST | `/api/v1/feeds` | Create new feed |
| PATCH | `/api/v1/feeds/:id` | Update feed |
| DELETE | `/api/v1/feeds/:id` | Delete feed |
| POST | `/api/v1/feeds/:id/fetch` | Fetch feed now |
| POST | `/api/v1/feeds/:id/post` | Post all unposted items |
| POST | `/api/v1/feeds/:id/retry` | Retry failed posts |

### Content

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/content` | List all content items |
| GET | `/api/v1/content/:id` | Get single item |
| POST | `/api/v1/content/:id/preview` | Preview transformed content |
| GET | `/api/v1/content/stats/overview` | Get statistics |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/system/feeds/check` | Trigger feed check |
| POST | `/api/v1/system/feeds/syndicate` | Trigger syndication |
| GET | `/api/v1/system/scheduler/status` | Get scheduler status |

## Create a Feed

```bash
curl -X POST http://localhost:4760/api/v1/feeds \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/feed.xml",
    "name": "My Blog",
    "platform": "twitter",
    "template": "{{title}}\n\nRead more: {{link}}",
    "tags": ["tech", "news"]
  }'
```

## Template Variables

- `{{title}}` - Post title
- `{{excerpt}}` - Post excerpt/summary
- `{{content}}` - Full content
- `{{link}}` - Post URL
- `{{author}}` - Author name
- `{{categories}}` - Categories
- `{{pubDate}}` - Publication date

## Supported Platforms

- **Twitter/X** - 280 character limit, character counting
- **LinkedIn** - Long-form posts, images supported
- **Mastodon** - Fediverse, customizable instance
- **Bluesky** - AT Protocol, rich embeds
- **Custom Webhook** - Send to any URL

## License

MIT
