# Social Automation Dashboard

A unified control center for managing all 20 social automation services in the AdBazaar ecosystem.

## Features

- **Service Overview**: Grid view of all 20 services with status indicators
- **Health Monitoring**: Real-time health checks with 30-second auto-refresh
- **Quick Actions**: Start/Stop/Restart buttons for each service
- **Search & Filter**: Find services by name or filter by status
- **Responsive Design**: Works on desktop and mobile devices
- **Dark Theme**: Professional dark mode interface

## Services Managed

| Service | Port | Description |
|---------|------|-------------|
| Instagram Shop Integration | 5080 | Product tagging & checkout |
| Instagram Publishing | 5081 | Feed/Reels/Stories publishing |
| Instagram Insights | 5082 | Analytics & insights |
| Social Content Publisher | 5083 | Unified multi-platform publisher |
| Hashtag Research Engine | 5090 | Hashtag discovery |
| Caption Generator AI | 5091 | AI caption generation |
| Content Calendar | 5092 | Visual calendar |
| Follower Growth Tracker | 5093 | Follower analytics |
| YouTube Integration | 5094 | YouTube API |
| Pinterest Integration | 5095 | Pinterest API |
| Content Repurposing Engine | 5100 | Content adaptation |
| UGC Management Service | 5101 | UGC collection |
| Unified Social Inbox | 5102 | Multi-platform inbox |
| Crisis Alert Service | 5103 | Crisis detection |
| Snapchat Integration | 5104 | Snapchat ads |
| Social Competitor Tracker | 5105 | Competitor monitoring |
| Reddit Integration | 5110 | Reddit API |
| Influencer Authenticity Check | 5111 | Fake follower detection |
| Brand Partnership Portal | 5112 | Brand-influencer matching |
| Content Compliance AI | 5113 | Policy compliance |

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- Axios for API calls
- Lucide React for icons

## Getting Started

1. **Install dependencies**:
   ```bash
   cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/AdBazaar/social-automation-dashboard
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Open the dashboard**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## API Integration

The dashboard checks service health via:
```
GET http://localhost:{port}/health
```

Each service should respond with:
```json
{
  "status": "healthy",
  "timestamp": "2026-06-08T00:00:00.000Z"
}
```

## Pages

- `/` - Dashboard overview with service grid
- `/services` - Detailed list view of all services
- `/settings` - Dashboard configuration

## Configuration

Edit `src/app/page.tsx` to modify:
- Service list (ports, names, descriptions)
- Refresh interval (default: 30 seconds)
- API endpoints

## License

Internal use only - AdBazaar