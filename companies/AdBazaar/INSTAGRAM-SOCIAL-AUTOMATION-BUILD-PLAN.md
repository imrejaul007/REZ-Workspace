# Instagram & Social Automation - 20 Services Build Plan

**Date:** June 8, 2026
**Status:** PLANNED
**Estimated Time:** 12 weeks (full stack)

---

## Executive Summary

Build 20 missing social media automation services for AdBazaar:
- **P0 (4):** Instagram Shop, Publishing, Insights, Unified Publisher
- **P1 (6):** Hashtag Research, Caption AI, Content Calendar, Growth Tracker, YouTube, Pinterest
- **P2 (6):** Content Repurposing, UGC Management, Unified Inbox, Crisis Alerts, Snapchat, Competitor Tracker
- **P3 (4):** Reddit, Influencer Authenticity, Brand Portal, Compliance AI

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ADBAZAAR SOCIAL LAYER                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐      │
│  │  Unified     │     │   Content    │     │   Social     │      │
│  │  Social      │────▶│  Calendar    │────▶│   CRM        │      │
│  │  Publisher   │     │  Service     │     │  Service     │      │
│  │  (5083)      │     │  (5092)      │     │  (5102)      │      │
│  └──────────────┘     └──────────────┘     └──────────────┘      │
│         │                    │                     │                │
│         ▼                    ▼                     ▼                │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐      │
│  │ Instagram    │     │  Caption    │     │  Crisis     │      │
│  │ Publishing   │     │  Generator  │     │  Alert      │      │
│  │ Service      │     │  AI (5091)  │     │  Service    │      │
│  │ (5081)       │     │             │     │  (5103)      │      │
│  └──────────────┘     └──────────────┘     └──────────────┘      │
│         │                    │                     │                │
│         ▼                    ▼                     ▼                │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐      │
│  │ Instagram    │     │  Hashtag    │     │  Social     │      │
│  │ Shop         │     │  Research   │     │  Competitor │      │
│  │ Integration  │     │  Engine     │     │  Tracker    │      │
│  │ (5080)       │     │  (5090)     │     │  (5105)      │      │
│  └──────────────┘     └──────────────┘     └──────────────┘      │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                    PLATFORM INTEGRATIONS                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │Instagram │  │ YouTube  │  │Pinterest │  │ Snapchat │         │
│  │  (5080) │  │  (5094)  │  │  (5095)  │  │  (5104)  │         │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘         │
│                                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                         │
│  │  Reddit  │  │  TikTok  │  │ Twitter  │  (Existing)            │
│  │  (5110)  │  │  (Built) │  │ (Built)  │                         │
│  └──────────┘  └──────────┘  └──────────┘                         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## P0 - CRITICAL SERVICES (Ports 5080-5083)

### 1. instagram-shop-integration (Port 5080)

**Purpose:** Connect Instagram Shop for product tagging and in-app checkout

**API Integration:** Instagram Graph API - Commerce Manager

**Features:**
- Product catalog sync (Facebook Catalog API)
- Product tagging in posts/stories
- In-app checkout via Instagram
- Inventory sync
- Price/promotion updates
- Order management
- Shipping integration

**Data Models:**
```typescript
// Product
{
  id: string;
  catalogId: string;
  instagramProductId?: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  availability: 'in_stock' | 'out_of_stock' | 'preorder';
  category: string;
}

// ShopOrder
{
  id: string;
  instagramOrderId: string;
  productId: string;
  userId: string;
  quantity: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: Address;
}
```

**API Endpoints:**
```
POST   /api/products/sync           # Sync product to Instagram
DELETE /api/products/:id           # Remove from Instagram
GET    /api/products/:id/tags      # Get tagging suggestions
POST   /api/orders                 # Create order
GET    /api/orders                 # List orders
PATCH  /api/orders/:id/status      # Update order status
GET    /api/analytics              # Shop performance
```

**Environment Variables:**
```
INSTAGRAM_BUSINESS_ACCOUNT_ID=
INSTAGRAM_CATALOG_ID=
FACEBOOK_ACCESS_TOKEN=
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
```

---

### 2. instagram-publishing-service (Port 5081)

**Purpose:** Publish feed posts, Reels, and Stories to Instagram

**API Integration:** Instagram Graph API - Content Publishing

**Features:**
- Feed post publishing (single image, album, video)
- Reels publishing with music, effects, captions
- Story publishing (image, video, polls, questions, links)
- Caption + hashtag optimization
- Location tagging
- Tag other accounts (product tags, user tags)
- First comment scheduling
- Scheduled publishing
- Draft saving
- Multiple account support

**Data Models:**
```typescript
// PublishRequest
{
  accountId: string;
  contentType: 'feed_image' | 'feed_album' | 'feed_video' | 'reel' | 'story';
  mediaUrl?: string;
  mediaUrls?: string[]; // For albums
  caption?: string;
  hashtags?: string[];
  location?: { id: string; name: string };
  userTags?: string[];
  productTags?: { productId: string; x: number; y: number }[];
  storyConfig?: {
    type: 'image' | 'video' | 'poll' | 'question' | 'link';
    pollQuestion?: string;
    question?: string;
    linkUrl?: string;
    stickerElements?: StoryElement[];
  };
  scheduledTime?: Date;
  firstComment?: string;
}

// PublishedContent
{
  id: string;
  instagramMediaId: string;
  instagramPermalink: string;
  accountId: string;
  contentType: string;
  status: 'published' | 'scheduled' | 'failed';
  publishedAt?: Date;
  metrics?: {
    likes: number;
    comments: number;
    saves: number;
    reach: number;
  };
}
```

**API Endpoints:**
```
POST   /api/publish                # Publish content
POST   /api/publish/schedule      # Schedule content
POST   /api/publish/draft          # Save as draft
GET    /api/publish/drafts         # List drafts
GET    /api/content/:id            # Get content details
DELETE /api/content/:id            # Delete content
GET    /api/accounts/:id/content  # Account content
POST   /api/accounts/:id/connect  # Connect Instagram account
GET    /api/accounts              # List connected accounts
```

**Environment Variables:**
```
INSTAGRAM_APP_ID=
INSTAGRAM_APP_SECRET=
INSTAGRAM_ACCESS_TOKEN=
INSTAGRAM_BUSINESS_ACCOUNT_ID=
```

---

### 3. instagram-insights-service (Port 5082)

**Purpose:** Deep analytics from Instagram Insights API

**API Integration:** Instagram Graph API - Insights

**Features:**
- Account metrics (followers, reach, impressions)
- Content performance analytics
- Audience demographics (age, gender, location, active times)
- Story analytics (views, replies, exits, taps)
- Reels performance tracking
- Engagement rate analysis
- Hashtag performance
- Best posting time analysis
- Competitor benchmarking
- Export reports (PDF, CSV)

**Data Models:**
```typescript
// AccountInsights
{
  accountId: string;
  date: Date;
  followers: {
    total: number;
    change: number;
    byGender: { male: number; female: number };
    byAge: { '13-17': number; '18-24': number; ... };
    byLocation: { [city: string]: number };
  };
  reach: number;
  impressions: number;
  profileViews: number;
  websiteClicks: number;
  emailContacts: number;
  engagement: number;
}

// ContentInsights
{
  contentId: string;
  date: Date;
  likes: number;
  comments: number;
  saves: number;
  shares: number;
  reach: number;
  impressions: number;
  engagementRate: number;
  watchTime?: number; // For videos/reels
  interactions?: number;
}

// AudienceInsights
{
  accountId: string;
  topLocations: { city: string; percentage: number }[];
  ageRanges: { range: string; male: number; female: number }[];
  genderSplit: { male: number; female: number };
  activeHours: number[]; // 24-hour array
  activeDays: string[]; // Day of week
  followerGrowth: { date: Date; count: number }[];
}
```

**API Endpoints:**
```
GET    /api/insights/account           # Account-level insights
GET    /api/insights/content/:id      # Single content insights
GET    /api/insights/content           # All content insights
GET    /api/insights/audience         # Audience demographics
GET    /api/insights/audience/active  # Active times
GET    /api/insights/stories          # Story insights
GET    /api/insights/reels             # Reels performance
GET    /api/insights/hashtags         # Hashtag performance
GET    /api/insights/best-times       # Optimal posting times
POST   /api/insights/export           # Export report
GET    /api/insights/dashboard        # Dashboard summary
```

**Environment Variables:**
```
INSTAGRAM_BUSINESS_ACCOUNT_ID=
INSTAGRAM_ACCESS_TOKEN=
```

---

### 4. social-content-publisher (Port 5083)

**Purpose:** Unified publishing engine for all social platforms

**API Integration:** Aggregates all platform-specific publishers

**Features:**
- Multi-platform publishing (IG, FB, Twitter, LinkedIn, TikTok, YouTube, Pinterest)
- Single compose for all platforms
- Platform-specific auto-formatting
- Bulk scheduling
- Content queue management
- Approval workflows (draft → review → approve → publish)
- Team collaboration
- Version history
- Content recycling (repost evergreen content)
- Blackout calendar (no-publish dates)
- Conflict detection

**Data Models:**
```typescript
// UnifiedPost
{
  id: string;
  userId: string;
  companyId: string;
  title: string;
  content: {
    text: string;
    media: { url: string; type: 'image' | 'video' | 'gif'; alt?: string }[];
  };
  platforms: PlatformConfig[];
  scheduledTime?: Date;
  status: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed';
  workflow: {
    status: 'pending' | 'review' | 'approved' | 'rejected';
    reviewedBy?: string;
    reviewedAt?: Date;
  };
  analytics?: {
    [platform: string]: PlatformAnalytics;
  };
}

interface PlatformConfig {
  platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'tiktok' | 'youtube' | 'pinterest';
  accountId: string;
  adaptedContent?: string; // Platform-specific adaptation
  enabled: boolean;
}
```

**API Endpoints:**
```
POST   /api/posts                    # Create unified post
GET    /api/posts                    # List all posts
GET    /api/posts/:id                # Get post details
PATCH  /api/posts/:id                # Update post
DELETE /api/posts/:id                # Delete post
POST   /api/posts/:id/publish        # Publish now
POST   /api/posts/:id/schedule       # Schedule post
POST   /api/posts/:id/submit-review  # Submit for review
POST   /api/posts/:id/approve         # Approve post
POST   /api/posts/:id/reject          # Reject post
GET    /api/queue                    # Content queue
POST   /api/queue/reorder            # Reorder queue
GET    /api/calendar                 # Visual calendar
GET    /api/platforms                # Connected platforms
POST   /api/platforms/connect         # Connect new platform
DELETE /api/platforms/:id            # Disconnect platform
```

**Environment Variables:**
```
REDIS_URL=redis://localhost:6379
POSTGRES_URL=postgresql://localhost:5432/publisher
```

---

## P1 - HIGH PRIORITY SERVICES (Ports 5090-5095)

### 5. hashtag-research-engine (Port 5090)

**Purpose:** Discover trending hashtags with analytics

**Features:**
- Trending hashtag discovery
- Hashtag suggestions based on content
- Hashtag performance tracking
- Competitor hashtag analysis
- Hashtag mixing recommendations (high, medium, niche)
- Hashtag banned check
- Auto-hashtag generation from image/description
- Hashtag set templates (save favorite combos)
- Reach estimation per hashtag
- Related hashtag discovery

**Data Models:**
```typescript
// Hashtag
{
  tag: string;
  usageCount: number;
  trending: boolean;
  trendingDirection: 'up' | 'down' | 'stable';
  category?: string;
  avgEngagement: number;
  topPosts?: string[];
  relatedTags: string[];
  banned: boolean;
  lastUpdated: Date;
}

// SearchResult
{
  hashtags: Hashtag[];
  searchQuery: string;
  analyzedCount: number;
}
```

**API Endpoints:**
```
POST   /api/hashtags/search           # Search hashtags
POST   /api/hashtags/suggest          # Suggest for content
GET    /api/hashtags/:tag              # Hashtag details
POST   /api/hashtags/trending          # Trending now
GET    /api/hashtags/sets              # Saved sets
POST   /api/hashtags/sets              # Create set
POST   /api/hashtags/check             # Check banned
POST   /api/hashtags/analyze           # Analyze content
```

---

### 6. caption-generator-ai (Port 5091)

**Purpose:** AI-powered caption and content generation

**Features:**
- Multiple caption styles (casual, professional, witty, inspirational)
- Emoji optimization
- Call-to-action generation
- Story hooks
- Caption templates
- Brand voice adaptation
- A/B variations
- Hashtag integration
- Character count optimization
- Translation to multiple languages

**Data Models:**
```typescript
// GenerationRequest
{
  content: string;
  brandVoice?: string;
  style?: 'casual' | 'professional' | 'witty' | 'inspirational' | 'educational';
  tone?: 'friendly' | 'bold' | 'luxury' | 'playful' | 'professional';
  length?: 'short' | 'medium' | 'long';
  includeHashtags?: boolean;
  includeCTA?: boolean;
  platforms: string[];
  variations: number; // 1-5 variations
}

// GeneratedCaption
{
  caption: string;
  hashtags: string[];
  suggestedCTA: string;
  tone: string;
  characterCount: number;
  platformOptimized: { [platform: string]: string };
}
```

**API Endpoints:**
```
POST   /api/captions/generate          # Generate captions
POST   /api/captions/variations        # Generate A/B variations
GET    /api/captions/templates          # List templates
POST   /api/captions/templates          # Create template
GET    /api/captions/styles             # Available styles
POST   /api/captions/brand-voice        # Set brand voice
POST   /api/captions/translate          # Translate
```

**Environment Variables:**
```
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
```

---

### 7. content-calendar-service (Port 5092)

**Purpose:** Visual drag-drop content calendar

**Features:**
- Monthly/weekly/daily views
- Drag-drop scheduling
- Color-coded platforms
- Content type filtering
- Quick reschedule
- Bulk operations
- Conflict detection
- Team assignments
- Approval status visibility
- Best time suggestions
- Overdue alerts
- Export calendar (PDF, CSV, iCal)

**Data Models:**
```typescript
// CalendarEvent
{
  id: string;
  postId: string;
  platform: string;
  accountId: string;
  date: Date;
  time: string;
  content: string;
  mediaPreview?: string;
  status: string;
  assignee?: string;
  color: string;
}

// CalendarView
{
  startDate: Date;
  endDate: Date;
  view: 'month' | 'week' | 'day';
  events: CalendarEvent[];
  stats: {
    total: number;
    published: number;
    scheduled: number;
    draft: number;
  };
}
```

**API Endpoints:**
```
GET    /api/calendar                   # Get calendar view
GET    /api/calendar/week             # Week view
GET    /api/calendar/day              # Day view
POST   /api/calendar/events            # Create event
PATCH  /api/calendar/events/:id        # Update event
DELETE /api/calendar/events/:id        # Delete event
POST   /api/calendar/bulk-move        # Bulk reschedule
GET    /api/calendar/conflicts        # Check conflicts
GET    /api/calendar/export            # Export calendar
POST   /api/calendar/import            # Import calendar
```

---

### 8. follower-growth-tracker (Port 5093)

**Purpose:** Track and analyze follower growth

**Features:**
- Follower count tracking
- Follower gain/loss daily
- Follower churn rate
- Unfollow tracking
- Follower source breakdown (hashtags, explore, profile, etc.)
- Follower demographics
- Engagement rate correlation
- Growth predictions
- Milestone alerts
- Comparison with competitors

**Data Models:**
```typescript
// FollowerSnapshot
{
  accountId: string;
  date: Date;
  followers: number;
  following: number;
  posts: number;
  change: number;
  changePercentage: number;
  sources: {
    hashtag: number;
    explore: number;
    profile: number;
    suggested: number;
    other: number;
  };
}

// GrowthAnalysis
{
  accountId: string;
  period: 'day' | 'week' | 'month';
  startFollowers: number;
  endFollowers: number;
  netGrowth: number;
  growthRate: number;
  engagementCorrelation: number;
  predictions: {
    nextWeek: number;
    nextMonth: number;
  };
  insights: string[];
}
```

**API Endpoints:**
```
GET    /api/growth/:accountId          # Get growth data
GET    /api/growth/:accountId/daily   # Daily snapshots
GET    /api/growth/:accountId/weekly  # Weekly summary
GET    /api/growth/:accountId/analytics # Deep analysis
GET    /api/growth/:accountId/predictions # Growth predictions
GET    /api/growth/:accountId/compare  # Competitor comparison
POST   /api/growth/:accountId/alerts  # Set milestone alerts
```

---

### 9. youtube-integration (Port 5094)

**Purpose:** YouTube API integration for video publishing

**API Integration:** YouTube Data API v3

**Features:**
- OAuth authentication
- Video upload (shorts, long-form)
- Thumbnail selection
- Title and description optimization
- Tags management
- Playlist management
- Comment moderation
- Live streaming (stream key management)
- Community post publishing
- Analytics and insights
- Caption/subtitle management
- End screen management

**Data Models:**
```typescript
// YouTubeVideo
{
  id: string;
  youtubeVideoId: string;
  youtubeChannelId: string;
  title: string;
  description: string;
  tags: string[];
  categoryId: string;
  privacyStatus: 'public' | 'unlisted' | 'private';
  thumbnailUrl?: string;
  duration?: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  publishedAt?: Date;
}

// LiveStream
{
  id: string;
  streamKey: string;
  title: string;
  scheduledStartTime?: Date;
  status: 'created' | 'live' | 'completed';
  currentViewers?: number;
}
```

**API Endpoints:**
```
POST   /api/auth/oauth                  # OAuth flow
GET    /api/channels                   # List channels
POST   /api/videos                     # Upload video
PATCH  /api/videos/:id                 # Update video
GET    /api/videos                     # List videos
DELETE /api/videos/:id                 # Delete video
GET    /api/videos/:id/analytics       # Video analytics
POST   /api/playlists                  # Create playlist
GET    /api/playlists                  # List playlists
POST   /api/comments/moderate          # Moderate comments
GET    /api/comments                  # Get comments
POST   /api/live/start                # Start live
POST   /api/live/end                  # End live
GET    /api/live/stats                # Live stats
```

**Environment Variables:**
```
YOUTUBE_CLIENT_ID=
YOUTUBE_CLIENT_SECRET=
YOUTUBE_API_KEY=
```

---

### 10. pinterest-integration (Port 5095)

**Purpose:** Pinterest API integration

**API Integration:** Pinterest API v5

**Features:**
- OAuth 2.0 authentication
- Pin creation (image, video)
- Board management
- Pin scheduling
- Rich pin optimization
- Shopping integration
- Idea Pins (story format)
- Comment management
- Pinterest Analytics
- Audience insights
- Shop the Look pins
- Buyable Pins

**Data Models:**
```typescript
// PinterestPin
{
  id: string;
  pinterestPinId: string;
  boardId: string;
  title: string;
  description: string;
  link?: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  altText?: string;
  keywords: string[];
  ctaLink?: string;
  viewCount: number;
  repinCount: number;
  clickCount: number;
  savedCount: number;
}

// PinterestBoard
{
  id: string;
  pinterestBoardId: string;
  name: string;
  description?: string;
  privacy: 'public' | 'secret';
  pinCount: number;
  followerCount: number;
}
```

**API Endpoints:**
```
POST   /api/auth/oauth
GET    /api/boards
POST   /api/boards
PATCH  /api/boards/:id
DELETE /api/boards/:id
POST   /api/pins
GET    /api/pins
PATCH  /api/pins/:id
DELETE /api/pins/:id
POST   /api/pins/:id/schedule
GET    /api/analytics
GET    /api/analytics/audience
POST   /api/idea-pins
GET    /api/comments
POST   /api/comments/:id/hide
```

**Environment Variables:**
```
PINTEREST_APP_ID=
PINTEREST_APP_SECRET=
PINTEREST_ACCESS_TOKEN=
```

---

## P2 - MEDIUM PRIORITY SERVICES (Ports 5100-5105)

### 11. content-repurposing-engine (Port 5100)

**Purpose:** Automatically adapt content for different platforms

**Features:**
- Video adaptation (long → short)
- Cross-platform formatting
- Aspect ratio conversion
- Caption position adjustment
- Platform-specific trimming
- Music/licensing adaptation
- Quality optimization
- Batch repurposing
- AI-powered highlights extraction
- Template matching

**API Endpoints:**
```
POST   /api/repurpose                  # Repurpose content
POST   /api/repurpose/batch           # Batch repurposing
GET    /api/templates                 # Platform templates
POST   /api/templates                 # Create template
POST   /api/repurpose/highlights      # Extract highlights
GET    /api/repurpose/history         # Repurposing history
```

---

### 12. ugc-management-service (Port 5101)

**Purpose:** User Generated Content collection and management

**Features:**
- Hashtag-based UGC collection
- Instagram mention collection
- Content moderation/approval
- Rights management
- UGC display (walls, tickers)
- Content licensing
- Campaign tracking
- Creator tagging/crediting
- Repost scheduling

**API Endpoints:**
```
GET    /api/ugc/collect              # Collect UGC
POST   /api/ugc/moderate             # Moderate content
POST   /api/ugc/approve              # Approve UGC
POST   /api/ugc/reject               # Reject UGC
GET    /api/ugc/approved             # List approved
POST   /api/ugc/rights               # Manage rights
POST   /api/ugc/display             # Generate display
GET    /api/ugc/campaigns            # List campaigns
POST   /api/ugc/campaigns            # Create campaign
```

---

### 13. unified-social-inbox (Port 5102)

**Purpose:** Single inbox for all social DMs

**Features:**
- Aggregate all platform messages
- Real-time message sync
- Smart routing
- Quick replies
- Team collaboration
- Message templates
- Conversation history
- Unread badges
- Priority sorting
- Snooze messages
- Sentiment tagging

**API Endpoints:**
```
GET    /api/inbox                    # All conversations
GET    /api/inbox/:platform         # Platform-specific
GET    /api/inbox/thread/:id        # Conversation thread
POST   /api/inbox/message           # Send message
POST   /api/inbox/reply/:id         # Reply to thread
POST   /api/inbox/forward           # Forward message
POST   /api/inbox/snooze           # Snooze conversation
GET    /api/templates               # Message templates
POST   /api/templates               # Create template
PATCH  /api/inbox/settings          # Inbox settings
```

---

### 14. crisis-alert-service (Port 5103)

**Purpose:** Real-time crisis detection and alerts

**Features:**
- Negative sentiment monitoring
- Viral negative content detection
- Competitor crisis tracking
- Brand mention spike alerts
- Influencer crisis detection
- Escalation workflows
- Push notifications
- Slack/email integration
- Crisis playbooks
- Post-mortem analysis

**API Endpoints:**
```
GET    /api/alerts                   # Active alerts
GET    /api/alerts/:id              # Alert details
POST   /api/alerts/:id/acknowledge  # Acknowledge
POST   /api/alerts/:id/escalate     # Escalate
POST   /api/alerts/:id/resolve     # Resolve
GET    /api/monitoring               # Monitoring config
POST   /api/monitoring              # Add keyword/mention
DELETE /api/monitoring/:id          # Remove monitoring
GET    /api/digest                  # Daily digest
POST   /api/playbooks               # Crisis playbooks
GET    /api/post-mortem             # Post-mortem reports
```

---

### 15. snapchat-integration (Port 5104)

**Purpose:** Snapchat Marketing API integration

**API Integration:** Snapchat Marketing API

**Features:**
- OAuth 2.0
- Ad account management
- Campaign creation
- Audience targeting
- Creative management
- Story Ads
- Collection Ads
- Filters/Lenses (via Snap Kit)
- Pixel integration
- Analytics

**API Endpoints:**
```
POST   /api/auth/oauth
GET    /api/ad-accounts
POST   /api/campaigns
GET    /api/campaigns
GET    /api/campaigns/:id/analytics
POST   /api/ads
GET    /api/ads
GET    /api/audiences
POST   /api/audiences
POST   /api/pixel
GET    /api/pixel/events
```

---

### 16. social-competitor-tracker (Port 5105)

**Purpose:** Track competitor social media activity

**Features:**
- Add competitors
- Track follower changes
- Monitor posting frequency
- Content analysis
- Engagement comparison
- Trend tracking
- Alert on competitor activity
- Benchmarking dashboard
- Best content identification
- Strategy insights

**API Endpoints:**
```
GET    /api/competitors             # List competitors
POST   /api/competitors             # Add competitor
DELETE /api/competitors/:id
GET    /api/competitors/:id/overview
GET    /api/competitors/:id/content
GET    /api/competitors/:id/engagement
GET    /api/competitors/compare     # Compare with self
GET    /api/competitors/benchmarks  # Industry benchmarks
GET    /api/competitors/alerts      # Competitor alerts
```

---

## P3 - LOWER PRIORITY SERVICES (Ports 5110-5113)

### 17. reddit-integration (Port 5110)

**Purpose:** Reddit API integration

**Features:**
- OAuth 2.0
- Post to subreddits
- Comment management
- Karma tracking
- Subreddit analytics
- Moderation tools
- Scheduled posting
- Multi-account support

**API Endpoints:**
```
POST   /api/auth/oauth
GET    /api/subreddits
POST   /api/posts
GET    /api/posts
POST   /api/comments
GET    /api/comments
POST   /api/vote
GET    /api/analytics
```

---

### 18. influencer-authenticity-check (Port 5111)

**Purpose:** Detect fake followers and inauthentic activity

**Features:**
- Follower quality analysis
- Engagement rate analysis
- Historical pattern detection
- Audience authenticity score
- Bot detection
- Purchased followers detection
- Suspicious activity flags
- Recommendations for vetting

**API Endpoints:**
```
POST   /api/check/profile           # Check influencer profile
GET    /api/check/:id               # Get check results
POST   /api/check/batch             # Batch check
GET    /api/report/:id             # Detailed report
POST   /api/report/:id/export      # Export report
```

---

### 19. brand-partnership-portal (Port 5112)

**Purpose:** Self-service portal for brands to connect with influencers

**Features:**
- Brand registration
- Campaign briefs
- Influencer discovery
- Outreach management
- Contract workflow
- Payment tracking
- Performance reporting
- Collaboration tools
- Messaging
- Review system

**API Endpoints:**
```
POST   /api/brands/register
GET    /api/brands/:id
PATCH  /api/brands/:id
POST   /api/campaigns
GET    /api/campaigns
POST   /api/campaigns/:id/match     # Match influencers
POST   /api/proposals
GET    /api/proposals
POST   /api/contracts
GET    /api/contracts/:id
POST   /api/contracts/:id/sign
GET    /api/brand/dashboard
```

---

### 20. content-compliance-ai (Port 5113)

**Purpose:** AI-powered content policy compliance checking

**Features:**
- Brand safety checks
- Platform policy compliance
- Copyright detection
- Trademark detection
- #Ad disclosure checking
- Inappropriate content detection
- Competitor mention detection
- Pre-publish validation
- Compliance scoring
- Auto-fix suggestions

**API Endpoints:**
```
POST   /api/compliance/check        # Check content
POST   /api/compliance/batch        # Batch check
GET    /api/compliance/report/:id   # Compliance report
POST   /api/compliance/rules        # Add rules
GET    /api/compliance/rules        # List rules
PATCH  /api/compliance/rules/:id    # Update rule
POST   /api/compliance/pre-publish  # Pre-publish check
GET    /api/compliance/history      # Check history
```

---

## PORT ASSIGNMENTS

| Port | Service | Priority |
|------|---------|----------|
| 5080 | instagram-shop-integration | P0 |
| 5081 | instagram-publishing-service | P0 |
| 5082 | instagram-insights-service | P0 |
| 5083 | social-content-publisher | P0 |
| 5090 | hashtag-research-engine | P1 |
| 5091 | caption-generator-ai | P1 |
| 5092 | content-calendar-service | P1 |
| 5093 | follower-growth-tracker | P1 |
| 5094 | youtube-integration | P1 |
| 5095 | pinterest-integration | P1 |
| 5100 | content-repurposing-engine | P2 |
| 5101 | ugc-management-service | P2 |
| 5102 | unified-social-inbox | P2 |
| 5103 | crisis-alert-service | P2 |
| 5104 | snapchat-integration | P2 |
| 5105 | social-competitor-tracker | P2 |
| 5110 | reddit-integration | P3 |
| 5111 | influencer-authenticity-check | P3 |
| 5112 | brand-partnership-portal | P3 |
| 5113 | content-compliance-ai | P3 |

---

## DEPENDENCIES

### Shared Dependencies
- MongoDB (shared database)
- Redis (caching, pub/sub)
- HOJAI AI (for Caption AI, Compliance AI)
- REZ Auth (authentication)
- REZ Notifications (alerts)

### External APIs Required
- Instagram Graph API (v18.0+)
- YouTube Data API (v3)
- Pinterest API (v5)
- Snapchat Marketing API
- Reddit API
- Twitter API v2 (if not using existing)
- LinkedIn API (if not using existing)

---

## IMPLEMENTATION APPROACH

### Phase 1: Foundation (P0 - Weeks 1-2)
1. instagram-shop-integration
2. instagram-publishing-service
3. instagram-insights-service
4. social-content-publisher

### Phase 2: Enrichment (P1 - Weeks 3-4)
5. hashtag-research-engine
6. caption-generator-ai
7. content-calendar-service
8. follower-growth-tracker
9. youtube-integration
10. pinterest-integration

### Phase 3: Expansion (P2 - Weeks 5-8)
11. content-repurposing-engine
12. ugc-management-service
13. unified-social-inbox
14. crisis-alert-service
15. snapchat-integration
16. social-competitor-tracker

### Phase 4: Advanced (P3 - Weeks 9-12)
17. reddit-integration
18. influencer-authenticity-check
19. brand-partnership-portal
20. content-compliance-ai

---

## SUCCESS METRICS

- All 20 services running on designated ports
- Health checks passing for all services
- Unit tests for core functionality
- API documentation via Swagger/OpenAPI
- Integration tests with external APIs
- Performance benchmarks within SLA
