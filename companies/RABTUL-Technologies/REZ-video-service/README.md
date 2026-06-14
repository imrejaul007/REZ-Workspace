# REZ Video - Loom Competitor

**Async video messaging for modern teams.**

---

## Features

| Feature | Description |
|---------|-------------|
| **Screen Recording** | Full screen, window, tab |
| **Camera Recording** | Webcam + screen |
| **Editing** | Trim, crop, merge |
| **Transcription** | Auto captions |
| **GIF Export** | Short clips as GIF |
| **Comments** | Time-stamped feedback |
| **Analytics** | View tracking |
| **Privacy** | Password, expiry |

---

## Quick Start

```bash
cd RABTUL-Technologies/REZ-video-service
npm install
npm run dev
```

**Port:** 4102

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/videos/upload` | Upload video |
| GET | `/api/videos` | List videos |
| GET | `/api/videos/:id` | Get video |
| DELETE | `/api/videos/:id` | Delete video |
| POST | `/api/videos/:id/trim` | Trim video |
| GET | `/api/videos/:id/transcript` | Get transcript |
| POST | `/api/videos/:id/comments` | Add comment |

---

## Video Features

| Feature | Description |
|---------|-------------|
| Max Duration | 60 minutes |
| Max Size | 2GB |
| Formats | MP4, WebM, MOV |
| Quality | Up to 4K |
| Thumbnails | Auto-generated |
| Embed | Iframe code |

---

## Competitive Advantage vs Loom

| Feature | Loom | REZ Video |
|---------|------|-----------|
| Free Plan | 25 videos | 100 videos |
| Duration | 5 min | 60 min |
| Storage | 100MB | 10GB |
| Transcription | ✅ | ✅ |
| Editing | Basic | Advanced |
| GIF Export | ❌ | ✅ |
| Custom Branding | ✅ Pro | ✅ Free |
| API Access | ✅ Pro | ✅ |

---

## Documentation

See `/docs/` for full API documentation.