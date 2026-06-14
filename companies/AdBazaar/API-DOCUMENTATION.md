# AdBazaar API Documentation

**Version:** 2.0  
**Date:** June 20, 2026  
**Base URL:** `http://localhost:{port}`

---

## Table of Contents

1. [Marketing OS (4960)](#marketing-os-4960)
2. [CDP (4961)](#cdp-4961)
3. [Universal Pixel (4962)](#universal-pixel-4962)
4. [Verification (4963)](#verification-4963)
5. [Clean Room (4964)](#clean-room-4964)
6. [Marketing Agent (4965)](#marketing-agent-4965)
7. [Event Stream (4966)](#event-stream-4966)
8. [Intelligence Graph (4967)](#intelligence-graph-4967)
9. [Data Marketplace (4968)](#data-marketplace-4968)
10. [Revenue Intelligence (4969)](#revenue-intelligence-4969)
11. [Creator Wallet (4970)](#creator-wallet-4970)
12. [Personalization (4971)](#personalization-4971)
13. [Agency OS (4972)](#agency-os-4972)
14. [Competitive Intel (4973)](#competitive-intel-4973)
15. [Community Media (4974)](#community-media-4974)
16. [HOJAI Gateway (4870)](#hojai-gateway-4870)

---

## Marketing OS (4960)

Unified Command Center for cross-channel marketing

### Set Goal
```http
POST /api/goals
```
```json
{
  "merchantId": "merchant_123",
  "description": "Get me 1000 restaurant customers this month under ₹50,000",
  "timeframe": {
    "start": "2026-06-01",
    "end": "2026-06-30"
  },
  "budget": 50000
}
```

### Get Goal Status
```http
GET /api/goals/:goalId
```

### Get Dashboard
```http
GET /api/dashboard/:merchantId
```

### Optimize Campaign
```http
POST /api/optimize/:goalId
```
```json
{
  "autoApply": true
}
```

### Update Channel
```http
PATCH /api/goals/:goalId/channels/:channel
```
```json
{
  "action": "pause"
}
```

---

## CDP (4961)

Customer Data Platform - Unified profile management

### Track Event
```http
POST /api/track
```
```json
{
  "event": {
    "name": "purchase",
    "properties": {
      "value": 500,
      "currency": "INR",
      "product": "Pizza"
    }
  },
  "context": {
    "channel": "web",
    "source": "instagram"
  },
  "profileId": "user_123",
  "merchantId": "merchant_123"
}
```

### Identify User
```http
POST /api/identify
```
```json
{
  "merchantId": "merchant_123",
  "anonymousId": "anon_123",
  "traits": {
    "email": "user@example.com",
    "phone": "9876543210",
    "demographics": {
      "age": 30,
      "city": "Mumbai"
    }
  }
}
```

### Get Profile
```http
GET /api/profiles/:profileId
```

### Create Segment
```http
POST /api/segments
```
```json
{
  "merchantId": "merchant_123",
  "name": "High Value Customers",
  "description": "Customers with >₹5000 lifetime value",
  "criteria": {
    "lifecycleStatus": "active",
    "minSpent": 5000
  }
}
```

### Get Segments
```http
GET /api/segments/:merchantId
```

### Search Profiles
```http
POST /api/profiles/search
```
```json
{
  "merchantId": "merchant_123",
  "query": {},
  "limit": 100
}
```

---

## Universal Pixel (4962)

Website, Server-side, and Mobile tracking

### Track Web Event
```http
POST /track
```
```json
{
  "pixel_id": "pix_abc123",
  "event_name": "Purchase",
  "event_data": {
    "value": 1500,
    "currency": "INR",
    "content_ids": ["prod_1", "prod_2"]
  },
  "user_data": {
    "email": "user@example.com",
    "externalId": "user_123"
  }
}
```

### Server-side Tracking
```http
POST /server/track
```
```json
{
  "pixel_id": "pix_abc123",
  "merchant_id": "merchant_123",
  "event_name": "Purchase",
  "event_data": {
    "value": 2000,
    "currency": "INR"
  },
  "user_data": {
    "email": "user@example.com",
    "phone": "9876543210",
    "fbp": "fb.1.1234567890.abcdef"
  },
  "test_event_code": "TEST123"
}
```

### Create Pixel
```http
POST /api/pixels
```
```json
{
  "merchantId": "merchant_123",
  "name": "My Website Pixel",
  "type": "web",
  "domain": "mysite.com"
}
```

### Get Pixel Events
```http
GET /api/pixels/:pixelId/events
```

---

## Verification (4963)

Fraud detection and brand safety

### Verify Impression
```http
POST /api/verify/impression
```
```json
{
  "adId": "ad_123",
  "campaignId": "camp_456",
  "context": {
    "url": "https://example.com",
    "adSize": "300x250"
  },
  "device": {
    "ip": "192.168.1.1",
    "userAgent": "Mozilla/5.0..."
  }
}
```

### Verify Click
```http
POST /api/verify/click
```
```json
{
  "clickId": "click_123",
  "campaignId": "camp_456",
  "device": {
    "ip": "192.168.1.1",
    "userAgent": "Mozilla/5.0..."
  }
}
```

### Brand Safety Check
```http
POST /api/brand-safety/check
```
```json
{
  "url": "https://example.com/article",
  "content": "Article content to check",
  "merchantId": "merchant_123"
}
```

### Get Fraud Stats
```http
GET /api/fraud/stats?campaignId=camp_456
```

---

## Clean Room (4964)

Privacy-safe data collaboration

### Register Partner
```http
POST /api/partners
```
```json
{
  "name": "Brand XYZ",
  "type": "brand",
  "industry": "retail",
  "contacts": [{
    "name": "John Doe",
    "email": "john@brandxyz.com",
    "role": "Marketing Head"
  }]
}
```

### Create Partnership
```http
POST /api/partnerships
```
```json
{
  "partnerA": "partner_abc",
  "partnerB": "partner_xyz",
  "type": "measurement"
}
```

### Initiate Match
```http
POST /api/matches
```
```json
{
  "partnershipId": "partnership_123",
  "partnerA": "partner_abc",
  "partnerB": "partner_xyz",
  "config": {
    "matchKey": "email",
    "matchType": "deterministic",
    "audienceSizeA": 50000,
    "audienceSizeB": 75000
  }
}
```

### Get Match Results
```http
GET /api/matches/:matchId/results
```

### Run Lift Study
```http
POST /api/measurements/lift
```
```json
{
  "partnershipId": "partnership_123",
  "testGroup": { "size": 10000 },
  "controlGroup": { "size": 10000 },
  "metric": "conversion_rate"
}
```

---

## Marketing Agent (4965)

Autonomous AI marketing agent

### Send Command
```http
POST /api/command
```
```json
{
  "merchantId": "merchant_123",
  "command": "Grow revenue by ₹5 lakh this month"
}
```

### Get Task Status
```http
GET /api/tasks/:taskId
```

### Cancel Task
```http
POST /api/tasks/:taskId/cancel
```

### Chat with Agent
```http
POST /api/chat
```
```json
{
  "merchantId": "merchant_123",
  "message": "How are my campaigns performing?",
  "context": {}
}
```

### Get Dashboard
```http
GET /api/dashboard/:merchantId
```

### Start Autopilot
```http
POST /api/autopilot/start
```
```json
{
  "merchantId": "merchant_123",
  "goals": {
    "maximizeROAS": true,
    "maintainCPA": 100
  }
}
```

---

## Event Stream (4966)

Real-time event streaming

### Create Topic
```http
POST /api/topics
```
```json
{
  "name": "user_events",
  "partitions": 3,
  "retention": 168
}
```

### Publish Event
```http
POST /api/publish
```
```json
{
  "topic": "user_events",
  "key": "user_123",
  "value": {
    "event": "page_view",
    "url": "/products"
  },
  "headers": {
    "source": "web"
  }
}
```

### Batch Publish
```http
POST /api/publish/batch
```
```json
{
  "topic": "user_events",
  "events": [
    { "key": "user_1", "value": { "event": "click" } },
    { "key": "user_2", "value": { "event": "view" } }
  ]
}
```

### Create Consumer
```http
POST /api/consumers
```
```json
{
  "groupId": "analytics_group",
  "topics": ["user_events"]
}
```

### Poll Events
```http
POST /api/consume
```
```json
{
  "consumerId": "consumer_abc",
  "topic": "user_events",
  "maxEvents": 100
}
```

### Get Stats
```http
GET /api/stats
```

---

## Intelligence Graph (4967)

Unified knowledge graph

### Create Entity
```http
POST /api/entities
```
```json
{
  "type": "user",
  "name": "John Doe",
  "attributes": {
    "age": 30,
    "city": "Mumbai"
  }
}
```

### Get Entity
```http
GET /api/entities/:entityId
```

### Create Relationship
```http
POST /api/relationships
```
```json
{
  "sourceId": "user_123",
  "targetId": "product_456",
  "type": "purchased",
  "weight": 1.0
}
```

### Get Neighbors
```http
GET /api/entities/:entityId/neighbors?type=purchased
```

### Traverse Graph
```http
POST /api/graph/traverse
```
```json
{
  "startId": "user_123",
  "relationshipTypes": ["purchased", "viewed"],
  "maxDepth": 3,
  "limit": 100
}
```

### Get Recommendations
```http
GET /api/graph/recommendations/:entityId?limit=20
```

---

## Data Marketplace (4968)

First-party data exchange

### Create Listing
```http
POST /api/listings
```
```json
{
  "sellerId": "merchant_123",
  "name": "Frequent Travelers",
  "description": "Users who travel monthly",
  "category": "travel",
  "size": 50000,
  "demographics": {
    "ageRange": "25-45",
    "locations": ["Mumbai", "Delhi"]
  },
  "price": {
    "amount": 50000,
    "currency": "INR"
  }
}
```

### Get Listings
```http
GET /api/listings?category=travel&minSize=10000
```

### Get Listing Details
```http
GET /api/listings/:listingId
```

### Purchase Listing
```http
POST /api/purchases
```
```json
{
  "listingId": "list_abc123",
  "buyerId": "brand_456"
}
```

### Get Categories
```http
GET /api/categories
```

---

## Revenue Intelligence (4969)

Campaign profitability tracking

### Track Revenue
```http
POST /api/track
```
```json
{
  "campaignId": "camp_123",
  "merchantId": "merchant_456",
  "channel": "instagram",
  "touchpoints": [
    { "channel": "instagram", "cost": 100 },
    { "channel": "whatsapp", "cost": 50 }
  ],
  "revenue": 5000,
  "conversions": 10
}
```

### Get Campaign Revenue
```http
GET /api/campaign/:campaignId
```

### Get Merchant Insights
```http
GET /api/merchant/:merchantId
```

### Get Top Campaigns
```http
GET /api/top-campaigns/:merchantId
```

---

## Creator Wallet (4970)

Creator banking powered by RABTUL

### Register Creator
```http
POST /api/creators
```
```json
{
  "creatorId": "creator_123",
  "bankDetails": {
    "account": "1234567890",
    "ifsc": "HDFC0001234",
    "upi": "creator@upi"
  }
}
```

### Get Wallet
```http
GET /api/wallet/:creatorId
```

### Add Earning
```http
POST /api/earnings
```
```json
{
  "creatorId": "creator_123",
  "campaignId": "camp_456",
  "amount": 5000
}
```

### Request Payout
```http
POST /api/payout
```
```json
{
  "creatorId": "creator_123",
  "amount": 10000,
  "method": "bank_transfer"
}
```

### Create Escrow
```http
POST /api/escrow
```
```json
{
  "campaignId": "camp_456",
  "creatorId": "creator_123",
  "brandId": "brand_789",
  "amount": 25000
}
```

### Release Escrow
```http
POST /api/escrow/:escrowId/release
```

### Get Tax Report
```http
GET /api/tax-report/:creatorId?year=2026
```

---

## Personalization (4971)

Real-time content personalization

### Create Personalization
```http
POST /api/personalizations
```
```json
{
  "merchantId": "merchant_123",
  "name": "Homepage Hero",
  "type": "homepage",
  "trigger": "page_view",
  "content": {
    "headline": "Welcome to our store!",
    "cta": "Shop Now"
  },
  "rules": {
    "location": "Mumbai"
  },
  "priority": 1
}
```

### Get Personalization
```http
POST /api/personalize
```
```json
{
  "merchantId": "merchant_123",
  "userId": "user_456",
  "context": {
    "location": "Mumbai",
    "device": "mobile"
  },
  "type": "homepage"
}
```

### Create A/B Experiment
```http
POST /api/experiments
```
```json
{
  "merchantId": "merchant_123",
  "name": "Hero Image Test",
  "variants": [
    { "name": "A", "image": "hero-a.jpg" },
    { "name": "B", "image": "hero-b.jpg" }
  ],
  "traffic": { "A": 50, "B": 50 }
}
```

### Track Event
```http
POST /api/track
```
```json
{
  "personalizationId": "pers_123",
  "userId": "user_456",
  "event": "click"
}
```

---

## Agency OS (4972)

Agency management platform

### Add Client
```http
POST /api/clients
```
```json
{
  "agencyId": "agency_123",
  "name": "Client XYZ",
  "industry": "retail",
  "contacts": [{
    "name": "Jane Smith",
    "email": "jane@clientxyz.com",
    "role": "Marketing Manager"
  }]
}
```

### Get Clients
```http
GET /api/clients/:agencyId
```

### Create Invoice
```http
POST /api/invoices
```
```json
{
  "agencyId": "agency_123",
  "clientId": "client_456",
  "amount": 50000,
  "items": [
    { "description": "Campaign Management", "amount": 30000 },
    { "description": "Creative Services", "amount": 20000 }
  ],
  "dueDate": "2026-07-15"
}
```

### Get Invoices
```http
GET /api/invoices/:agencyId
```

### Create Proposal
```http
POST /api/proposals
```
```json
{
  "agencyId": "agency_123",
  "clientId": "client_456",
  "services": ["Social Media", "PPC"],
  "amount": 100000
}
```

### Get Client Report
```http
GET /api/reports/:clientId
```

### Get White Label Config
```http
GET /api/white-label/:agencyId
```

---

## Competitive Intel (4973)

Competitor tracking and analysis

### Add Competitor
```http
POST /api/competitors
```
```json
{
  "merchantId": "merchant_123",
  "name": "Competitor ABC",
  "industry": "restaurant"
}
```

### Get Competitors
```http
GET /api/competitors/:merchantId
```

### Update Social Stats
```http
POST /api/competitors/:competitorId/social
```
```json
{
  "followers": 50000,
  "posts": 150,
  "engagement": 4.5
}
```

### Track Ad Activity
```http
POST /api/competitors/:competitorId/ads
```
```json
{
  "platform": "Instagram",
  "adContent": "Summer Sale!",
  "startDate": "2026-06-01",
  "budget": 50000
}
```

### Get Ad Intelligence
```http
GET /api/intel/:merchantId/ads
```

### Update Pricing
```http
POST /api/competitors/:competitorId/pricing
```
```json
{
  "products": [
    { "name": "Burger Combo", "price": 299 },
    { "name": "Family Pack", "price": 799 }
  ]
}
```

### Get Comparison
```http
GET /api/compare/:merchantId
```

---

## Community Media (4974)

Hyperlocal ad inventory network

### Add Location
```http
POST /api/locations
```
```json
{
  "type": "apartment",
  "name": "Sunrise Apartments",
  "address": "123 Main Road",
  "pincode": "400001",
  "city": "Mumbai",
  "screens": 5,
  "demographics": {
    "ageGroup": "25-40",
    "income": "middle-class"
  }
}
```

### Get Inventory
```http
GET /api/inventory/apartment?city=Mumbai
```

### Create Ad Slot
```http
POST /api/slots
```
```json
{
  "locationId": "loc_123",
  "type": "lobby",
  "size": "55 inch",
  "format": "video",
  "price": 5000
}
```

### Book Slot
```http
POST /api/slots/:slotId/book
```
```json
{
  "dates": ["2026-06-15", "2026-06-16", "2026-06-17"],
  "campaignId": "camp_456"
}
```

### Get Availability
```http
GET /api/availability/:locationId?startDate=2026-06-01&endDate=2026-06-30
```

### Hyperlocal Targeting
```http
POST /api/target
```
```json
{
  "pincode": "400001",
  "type": "apartment",
  "demographics": {
    "income": "upper-middle"
  }
}
```

---

## HOJAI Gateway (4870)

Central AI routing for all AdBazaar AI services

### Generate Caption
```http
POST /api/ai/caption/generate
```
```json
{
  "content": "Delicious pizza with fresh toppings",
  "platform": "instagram",
  "hashtags": true
}
```

### Check Compliance
```http
POST /api/ai/compliance/check
```
```json
{
  "content": "Check this out!",
  "platform": "instagram"
}
```

### Suggest Hashtags
```http
POST /api/ai/hashtags/suggest
```
```json
{
  "content": "Pizza lovers unite! 🍕",
  "count": 10
}
```

### Analyze Image
```http
POST /api/ai/image/analyze
```
```json
{
  "imageUrl": "https://example.com/pizza.jpg"
}
```

### Analyze Sentiment
```http
POST /api/ai/sentiment/analyze
```
```json
{
  "text": "Great experience at the restaurant!"
}
```

### Get Trends
```http
POST /api/ai/trends/analyze
```
```json
{
  "industry": "restaurant",
  "location": "Mumbai"
}
```

### Optimize Campaign
```http
POST /api/ai/campaign/optimize
```
```json
{
  "campaignId": "camp_123",
  "goal": "conversions"
}
```

### Get Audience Insights
```http
POST /api/ai/audience/insights
```
```json
{
  "merchantId": "merchant_123"
}
```

### Detect Crisis
```http
POST /api/ai/crisis/detect
```
```json
{
  "content": "Your brand is trending!",
  "platform": "twitter"
}
```

---

## Common Response Format

### Success
```json
{
  "success": true,
  "data": { ... }
}
```

### Error
```json
{
  "success": false,
  "error": "Error message"
}
```

## Authentication

All API requests require `X-API-Key` header:
```
X-API-Key: your-api-key
```

For internal services, use:
```
X-Internal-Token: dev-token
```

---

**Documentation Version:** 2.0  
**Last Updated:** June 20, 2026