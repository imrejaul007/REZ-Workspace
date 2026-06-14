# Caption Generator AI Service

**Port:** 5091  
**Company:** AdBazaar  
**Purpose:** AI-powered caption and content generation

## Features

- **Multiple Caption Styles:** Casual, Professional, Witty, Inspirational, Educational
- **Emoji Optimization:** Smart emoji placement based on content
- **Call-to-Action Generation:** Compelling CTAs for various purposes
- **Story Hooks:** Engaging opening hooks for content
- **Caption Templates:** Reusable templates with variable support
- **Brand Voice Adaptation:** Learn and adapt to brand-specific styles
- **A/B Variations:** Generate multiple variations for testing
- **Hashtag Integration:** AI-powered hashtag suggestions
- **Character Count Optimization:** Platform-specific optimization
- **Translation:** Multi-language caption translation (20+ languages)

## Quick Start

```bash
# Install dependencies
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/AdBazaar/caption-generator-ai
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env with your API keys

# Start service
npm run dev
```

## API Endpoints

### Health & Metrics
- `GET /health` - Health check
- `GET /ready` - Readiness check
- `GET /metrics` - Prometheus metrics

### Caption Generation
- `POST /api/captions/generate` - Generate captions with AI
- `POST /api/captions/variations` - Generate A/B variations
- `POST /api/captions/translate` - Translate captions
- `POST /api/captions/hooks` - Generate story hooks
- `POST /api/captions/hashtags` - Generate hashtags
- `POST /api/captions/cta` - Generate CTAs

### Templates
- `GET /api/captions/templates` - List templates
- `POST /api/captions/templates` - Create template

### Brand Voice
- `GET /api/captions/brand-voice/:brandId` - Get brand voice
- `POST /api/captions/brand-voice` - Set brand voice

### Styles
- `GET /api/captions/styles` - Available styles

## Example Usage

### Generate Caption
```bash
curl -X POST http://localhost:5091/api/captions/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "content": "Introducing our new summer collection",
    "style": "casual",
    "tone": "friendly",
    "length": "medium",
    "includeHashtags": true,
    "includeCTA": true,
    "platforms": ["instagram", "twitter"]
  }'
```

### Generate Variations
```bash
curl -X POST http://localhost:5091/api/captions/variations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "content": "Our products are handmade with love",
    "count": 3
  }'
```

### Translate Caption
```bash
curl -X POST http://localhost:5091/api/captions/translate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "caption": "Check out our new arrivals!",
    "targetLanguage": "hi",
    "preserveEmojis": true
  }'
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Service port | 5091 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/caption-generator |
| OPENAI_API_KEY | OpenAI API key | - |
| ANTHROPIC_API_KEY | Anthropic API key | - |
| OPENAI_MODEL | OpenAI model to use | gpt-4 |
| AUTH_SERVICE_URL | RABTUL Auth service URL | http://localhost:4002 |
| INTERNAL_SERVICE_TOKEN | Internal service token | - |

## Supported Languages

English, Hindi, Spanish, French, German, Portuguese, Italian, Japanese, Korean, Chinese, Arabic, Russian, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Punjabi

## Platform Limits

| Platform | Max Characters | Max Hashtags |
|----------|---------------|--------------|
| Instagram | 2200 | 30 |
| Twitter | 280 | 5 |
| Facebook | 63206 | 10 |
| LinkedIn | 3000 | 5 |
| TikTok | 2200 | 10 |
| Pinterest | 500 | 20 |
| YouTube | 5000 | 15 |
| Snapchat | 250 | 5 |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    caption-generator-ai                       │
├─────────────────────────────────────────────────────────────┤
│  Express Server (Port 5091)                                 │
│  ├── Health & Metrics Endpoints                            │
│  ├── Auth Middleware (RABTUL Integration)                   │
│  ├── Rate Limiting                                          │
│  └── Security (CORS, Helmet)                               │
├─────────────────────────────────────────────────────────────┤
│  Services                                                   │
│  └── CaptionService (OpenAI Integration)                    │
├─────────────────────────────────────────────────────────────┤
│  Models                                                     │
│  ├── GenerationRequest                                     │
│  ├── CaptionTemplate                                       │
│  ├── BrandVoice                                            │
│  ├── CaptionHistory                                        │
│  └── TranslationCache                                      │
└─────────────────────────────────────────────────────────────┘
```

## Dependencies

- **express** - Web framework
- **mongoose** - MongoDB ODM
- **openai** - OpenAI API client
- **zod** - Schema validation
- **prom-client** - Prometheus metrics
- **winston** - Logging
- **axios** - HTTP client
- **cors** - CORS handling
- **helmet** - Security headers
- **dotenv** - Environment variables