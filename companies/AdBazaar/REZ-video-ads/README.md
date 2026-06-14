# REZ Video Ads

Video ad serving with VAST/VPAID support.

## Service Purpose

Handles video ad serving with support for VAST 4.x and VPAID 2.0 specifications. Manages pre-roll, mid-roll, and post-roll video ads with rewarded playback options.

## Port

```
3014
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/vast/:campaignId` | Get VAST XML for campaign |
| POST | `/api/vpaid/events` | VPAID event tracking |
| POST | `/api/impression` | Track video impression |
| POST | `/api/view` | Track video view completion |
| POST | `/api/click` | Track video click |
| GET | `/api/campaigns` | List video campaigns |
| POST | `/api/campaigns` | Create video campaign |
| GET | `/api/campaigns/:id` | Get campaign details |
| PUT | `/api/campaigns/:id` | Update campaign |
| GET | `/api/creatives` | List video creatives |
| POST | `/api/creatives` | Upload video creative |
| GET | `/api/stats` | Video ad statistics |

## Configuration

Environment variables:

```env
PORT=3014
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/rez-video-ads
VIDEO_CDN_URL=https://cdn.example.com/videos
```

## Setup Instructions

```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Build for production
npm run build
npm start

# Run tests
npm test
npm run test:run
```

## VAST 4.x Support

Returns compliant VAST XML:

```xml
<VAST version="4.2">
  <Ad id="12345">
    <InLine>
      <AdTitle>Video Ad</AdTitle>
      <Creatives>
        <Creative>
          <Linear>
            <Duration>00:00:30</Duration>
            <VideoClicks>
              <ClickThrough>https://advertiser.com</ClickThrough>
            </VideoClicks>
            <MediaFiles>
              <MediaFile type="video/mp4">...</MediaFile>
            </MediaFiles>
          </Linear>
        </Creative>
      </Creatives>
    </InLine>
  </Ad>
</VAST>
```

## Tech Stack

- Express.js
- TypeScript
- Mongoose (MongoDB)
- Zod (validation)
- UUID (ID generation)
- Axios (HTTP client)
- CORS
- Helmet (security headers)
- Vitest (testing)
