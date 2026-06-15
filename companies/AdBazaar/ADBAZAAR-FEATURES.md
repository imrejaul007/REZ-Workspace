# AdBazaar - Complete Features List

**Company:** AdBazaar (REZ Media)
**Tagline:** "AI-Powered Commerce, Intent & Retail Media Intelligence Network"
**Last Updated:** June 14, 2026
**Version:** 14.0
**Total Services:** 270+

---

## Table of Contents

1. [Core Products](#core-products)
2. [DSP Services (Demand-Side Platform)](#dsp-services-demand-side-platform)
3. [SSP Services (Supply-Side Platform)](#ssp-services-supply-side-platform)
4. [Intent Exchange](#intent-exchange)
5. [Platform Moats](#platform-moats)
6. [DOOH Services](#dooh-services)
7. [Social Automation](#social-automation)
8. [Marketing Automation](#marketing-automation)
9. [Analytics & Insights](#analytics--insights)
10. [Audience & Targeting](#audience--targeting)
11. [Creative & Content](#creative--content)
12. [Commerce & Checkout](#commerce--checkout)
13. [Testing & Quality](#testing--quality)
14. [Referral & Loyalty](#referral--loyalty)
15. [Customer Success](#customer-success)
16. [Governance & Compliance](#governance--compliance)

---

## Core Products

### adBazaar (Port 4085)

**Main ad marketplace** - Multi-channel advertising platform with AI-powered targeting

| Feature | Description | Status |
|---------|-------------|--------|
| Campaign Management | Create, manage, and optimize ad campaigns | ✅ |
| Multi-Channel Support | Web, Mobile, DOOH, CTV | ✅ |
| Real-Time Bidding | RTB with sub-100ms latency | ✅ |
| Audience Targeting | Apartment-level geo targeting | ✅ |
| AI Optimization | ML-powered campaign optimization | ✅ |
| Analytics Dashboard | Real-time performance metrics | ✅ |
| Creative Management | Upload, preview, A/B test creatives | ✅ |
| Budget Controls | Daily/total caps, pacing | ✅ |
| Attribution | Multi-touch conversion tracking | ✅ |
| API Access | REST API for integrations | ✅ |

### adsqr

**QR code advertising** - Offline-to-online attribution

| Feature | Description | Status |
|---------|-------------|--------|
| QR Generation | Dynamic & static QR codes | ✅ |
| Scan Tracking | Real-time scan attribution | ✅ |
| Campaign Linking | Connect scans to campaigns | ✅ |
| Analytics | Scan demographics, locations | ✅ |
| Custom Branding | White-label QR codes | ✅ |
| Multi-Format | Print, digital, product | ✅ |

### dooh (Port 4018)

**Digital Out-of-Home** - Screen network management

| Feature | Description | Status |
|---------|-------------|--------|
| Screen Network | 14+ screen types | ✅ |
| Scheduling | Daypart, flight, recurring | ✅ |
| Targeting | Time, location, weather | ✅ |
| Pricing Engine | Dynamic CPM based on metrics | ✅ |
| Billing | Per-impression, flat-rate | ✅ |
| Health Monitoring | Real-time screen status | ✅ |

### dooh-screen-app (Port 5400)

**Screen management app** - Hardware control for screens

| Feature | Description | Status |
|---------|-------------|--------|
| Screen Registration | Add screens to network | ✅ |
| Health Monitoring | Uptime, content status | ✅ |
| Content Sync | Automatic content updates | ✅ |
| Offline Detection | Alert on connectivity loss | ✅ |
| Maintenance Alerts | Schedule maintenance | ✅ |
| Remote Control | Power, volume, reboot | ✅ |

### dooh-mobile

**Mobile companion** - Campaign management on-the-go

| Feature | Description | Status |
|---------|-------------|--------|
| Campaign Dashboard | View performance | ✅ |
| Budget Controls | Adjust spend | ✅ |
| Real-Time Alerts | Notifications | ✅ |
| Performance Reports | Export metrics | ✅ |
| Approval Workflow | Approve creatives | ✅ |

### creators

**Influencer platform** - Brand-creator partnerships

| Feature | Description | Status |
|---------|-------------|--------|
| Creator Discovery | Search by niche, followers | ✅ |
| Campaign Invitations | Invite creators | ✅ |
| Content Approval | Review submissions | ✅ |
| Payment Escrow | Secure transactions | ✅ |
| Performance Tracking | Engagement metrics | ✅ |
| Payout Management | Automated payments | ✅ |

### marketing-os

**Business Growth OS** - Full marketing automation

| Feature | Description | Status |
|---------|-------------|--------|
| Multi-Channel Campaigns | Email, SMS, Push, Social | ✅ |
| Journey Builder | Visual campaign flows | ✅ |
| Lead Management | Capture, score, nurture | ✅ |
| A/B Testing | Optimize campaigns | ✅ |
| Analytics | Performance dashboards | ✅ |

---

## DSP Services (Demand-Side Platform)

### rez-dsp-bidder (Port 4061)

**Real-time bidding engine** for programmatic advertising

#### Campaign Management
| Feature | Description |
|---------|-------------|
| Create Campaign | New campaign with targeting |
| List Campaigns | Filter by status, exchange |
| Get Campaign | Single campaign details |
| Update Campaign | Modify budget, targeting |
| Delete Campaign | Remove inactive campaigns |
| Pause Campaign | Temporarily stop |
| Resume Campaign | Reactivate paused |
| Campaign Stats | Impressions, clicks, spend |
| Budget Tracking | Daily/total limits |

#### Bidding Engine
| Feature | Description |
|---------|-------------|
| Multi-Exchange | Google ADX, Amazon TAM |
| Bid Strategies | Fixed, dynamic, optimized |
| Targeting | Geo, screen type, location |
| Batch Bids | Process multiple bids |
| Floor Price | Minimum bid enforcement |
| Budget Pacing | Smooth daily spend |

#### Data Models
```
Campaign {
  campaignId: string
  advertiserId: string
  name: string
  status: 'active' | 'paused' | 'ended'
  budget: number
  dailyLimit?: number
  bidStrategy: 'fixed' | 'dynamic' | 'optimized'
  maxBidPrice?: number
  targeting: {
    geo?: string[]
    screenTypes?: string[]
    locations?: string[]
  }
  startDate: Date
  endDate?: Date
  metrics: {
    impressions: number
    clicks: number
    spend: number
    cpm: number
    ctr: number
  }
}
```

### REZ-dsp-portal (Port 4064)

**Self-serve advertiser portal** for DOOH advertising

#### Advertiser Management
| Feature | Description |
|---------|-------------|
| Register | Create advertiser account |
| Get Profile | View advertiser details |
| Update Profile | Modify company info |
| Add Funds | Top up advertising balance |
| Billing Summary | View invoices, spend |
| Balance Management | Track remaining |

#### Campaign Lifecycle
| Feature | Description |
|---------|-------------|
| Create Campaign | Draft → launch flow |
| Launch Campaign | Activate campaign |
| Pause Campaign | Temporary stop |
| Resume Campaign | Reactivate |
| Complete Campaign | Mark as finished |
| Delete Campaign | Remove draft/paused |
| Add Creative | Upload ad creatives |
| Pricing Estimates | CPM estimates |

#### DOOH Intelligence
| Feature | Description |
|---------|-------------|
| Reach Estimation | Projected impressions |
| DOOH Pricing | Dynamic CPM calculation |
| Screen Types | 14+ screen options |
| City Targeting | Metro, tier 1/2/3 |
| Time Slot Pricing | Peak, normal rates |

---

## SSP Services (Supply-Side Platform)

### ssp-gateway (Port 4520)

**API Gateway** for SSP services

| Feature | Description |
|---------|-------------|
| Rate Limiting | Per-client limits |
| Authentication | JWT validation |
| Request Validation | Schema validation |
| Response Transform | Format standardization |
| Health Checks | Service monitoring |

### ssp-screen-service (Port 4521)

**Screen management** for publishers

| Feature | Description |
|---------|-------------|
| Screen Registration | Add new screens |
| Location Tracking | Geo coordinates |
| Status Updates | Online/offline/maint |
| Maintenance Mode | Schedule downtime |
| Health Monitoring | Uptime tracking |
| Screen Types | 14+ categories |

### ssp-inventory-service (Port 4522)

**Ad slot inventory** management

| Feature | Description |
|---------|-------------|
| Slot Tracking | Manage ad slots |
| Availability Calendar | Book slots |
| Pricing Management | Set CPM rates |
| Blackout Periods | Exclude times |
| Inventory Forecast | Predict availability |
| Bulk Operations | Update multiple |

### ssp-bidding-service (Port 4523)

**Real-time bidding** for publishers

| Feature | Description |
|---------|-------------|
| Auction Engine | Second-price auctions |
| Floor Management | Min bid enforcement |
| Bid Optimization | Maximize revenue |
| Win Notifications | Real-time alerts |
| Deal Support | Preferred deals |
| Programmatic Guaranteed | Fixed-price deals |

### ssp-revenue-service (Port 4524)

**Revenue tracking** and payouts

| Feature | Description |
|---------|-------------|
| P&L Reports | Profit/loss per screen |
| Revenue Forecasting | Predict earnings |
| Payment Processing | Auto payouts |
| Invoice Generation | Monthly invoices |
| Revenue Split | Share with partners |
| Reconciliation | Match payments |

### ssp-analytics-service (Port 4525)

**Performance analytics** for SSP

| Feature | Description |
|---------|-------------|
| Real-Time Dashboard | Live metrics |
| Audience Insights | Viewer demographics |
| Campaign Analytics | Per-campaign reports |
| Trend Analysis | Historical patterns |
| Export Reports | CSV, PDF |
| Custom Metrics | Build your own |

---

## Intent Exchange

**AdBazaar 2.0 Moat** - Unique competitive advantage

### intent-signal-aggregator (Port 4800)

**Collect signals** from multiple apps

| Feature | Description |
|---------|-------------|
| Multi-App Collection | 6+ app sources |
| Real-Time Processing | <100ms latency |
| Signal Normalization | Standardize formats |
| Quality Scoring | Signal reliability |
| Privacy Compliance | GDPR, CCPA |
| Consent Management | User permissions |

**Signal Types:**
- Search queries
- Page views
- Content interactions
- Purchase history
- Location data
- Social signals

### intent-prediction-engine (Port 4801)

**ML-powered intent scoring**

| Feature | Description |
|---------|-------------|
| Intent Classification | Categorize intent |
| Propensity Scoring | Likelihood to convert |
| Audience Segmentation | Group by intent |
| Real-Time Inference | <50ms scoring |
| Model Training | Continuous learning |
| Feature Engineering | 100+ signals |

**Use Cases:**
- High-intent product search
- Purchase likelihood
- Churn prediction
- Upsell propensity
- Engagement scoring

### intent-marketplace (Port 4802)

**Buy/sell audience segments**

| Feature | Description |
|---------|-------------|
| Segment Marketplace | Browse audiences |
| Pricing Engine | Dynamic segment pricing |
| Audience Matching | Brand ↔ Consumers |
| Deal Management | Negotiate & close |
| Privacy-Safe | No PII shared |
| Attribution | Conversion tracking |

**Segment Types:**
- In-market buyers
- Research mode
- Price conscious
- Brand loyal
- Deal seekers

### intent-attribution (Port 4803)

**Multi-touch conversion tracking**

| Feature | Description |
|---------|-------------|
| Attribution Models | First, last, linear |
| Touchpoint Tracking | Full journey |
| Conversion Windows | 7/14/30 days |
| Cross-Device | Device graph |
| Incrementality | Lift measurement |
| Reporting | ROI dashboards |

---

## Platform Moats

**42 Services** (Ports 4880-5020) providing sustainable competitive advantages

### data-clean-room-service (Port 4950)

**Privacy-preserving data matching**

| Feature | Description |
|---------|-------------|
| Secure Matching | No data sharing |
| Aggregate Analytics | Group statistics |
| Brand ↔ Publisher | Clean room collaboration |
| Consent Management | Privacy-first |
| Audit Trails | Full visibility |
| Compliance | GDPR, CCPA ready |

### openrtb-exchange-service (Port 4960)

**OpenRTB 2.6 protocol** implementation

| Feature | Description |
|---------|-------------|
| OpenRTB 2.6 | Full compliance |
| Bid Requests | Standardized format |
| Seat Management | Buyer seats |
| Deal Negotiation | Programmatic deals |
| Protocol Validation | Strict checking |
| Bid Caching | Performance optimization |

### measurement-cloud-service (Port 4970)

**Incrementality and attribution studies**

| Feature | Description |
|---------|-------------|
| A/B Testing | Holdout groups |
| Incrementality | Lift measurement |
| Brand Lift | Awareness studies |
| View-Through | MTA support |
| MTA Modeling | Multi-touch attribution |
| Reporting | Statistical significance |

### event-graph-service (Port 4880)

**Event intelligence** and relationships

| Feature | Description |
|---------|-------------|
| Event Clustering | Group related events |
| Pattern Detection | Behavioral patterns |
| Sequence Analysis | Journey mapping |
| Anomaly Detection | Odd patterns |
| Trend Identification | Emerging trends |
| Graph Database | Neo4j integration |

### yield-optimization-brain (Port 4890)

**AI-powered yield optimization**

| Feature | Description |
|---------|-------------|
| Dynamic Floors | AI-set CPM floors |
| Predict炉 CPM | ML forecasting |
| Inventory Allocation | Optimal distribution |
| Pace Management | Smooth revenue |
| Revenue Forecasting | Predict earnings |
| A/B Testing | Test strategies |

### merchant-insights-os (Port 4870)

**Business intelligence** for merchants

| Feature | Description |
|---------|-------------|
| Performance Dashboards | Real-time metrics |
| Competitive Analysis | Benchmark vs peers |
| Audience Insights | Who engages |
| Campaign Optimization | AI recommendations |
| ROI Tracking | Return on ad spend |
| Export | CSV, API |

### retail-media-os-service (Port 4990)

**Amazon Ads alternative** - Retail media OS

| Feature | Description |
|---------|-------------|
| Retail Media Network | Shopper targeting |
| In-Store + Online | Omnichannel |
| Transaction Attribution | Sales lift |
| Category Insights | Vertical data |
| Sponsored Products | Retail media ads |
| Display Ads | On-site placements |

### identity-cloud-service (Port 4996)

**UID2 competitor** - Cross-device identity

| Feature | Description |
|---------|-------------|
| Deterministic ID | Email, phone match |
| Probabilistic | Statistical augmentation |
| Privacy-First | No PII storage |
| Cross-Device Graph | Multi-device users |
| GDPR Compliance | Right to be forgotten |
| Consent Management | User control |

### publisher-os-service (Port 5000)

**Publisher monetization** tools

| Feature | Description |
|---------|-------------|
| Header Bidding | Prebid integration |
| Direct Deals | Guaranteed fixed-price |
| Programmatic Guaranteed | Auto-fulfillment |
| Floor Management | Min price controls |
| Reporting | Revenue dashboards |
| Waterfall | Priority-based fills |

### agency-workspace-service (Port 5010)

**Agency tools** and collaboration

| Feature | Description |
|---------|-------------|
| Multi-Client | Manage 100s of brands |
| Campaign Bundling | Group campaigns |
| Performance Reports | Auto-generated |
| Budget Optimization | AI allocation |
| Team Collaboration | Role-based access |
| White-Label | Custom branding |

---

## DOOH Services

### dooh (Port 4018)

**Main DOOH service**

| Feature | Description |
|---------|-------------|
| Screen Network | 14+ screen types |
| Campaign Scheduling | Dayparting |
| Audience Targeting | Time, location |
| Real-Time Bidding | Live auctions |
| Measurement | Impressions, reach |
| Revenue Tracking | P&L per screen |

### dooh-screen-app (Port 5400)

**Screen hardware app**

| Feature | Description |
|---------|-------------|
| Registration | Setup new screens |
| Content Sync | Push updates |
| Health Monitor | Uptime alerts |
| Offline Mode | Local caching |
| Maintenance | Schedule downtime |
| Remote Control | Restart, etc. |

### dooh-mobile

**Mobile companion app**

| Feature | Description |
|---------|-------------|
| Dashboard | At-a-glance metrics |
| Budget Controls | Adjust spend |
| Real-Time Alerts | Push notifications |
| Reports | Performance PDFs |
| Approval Queue | Review creatives |
| Quick Actions | Pause, resume |

---

## Social Automation

### instagram-automation (Port 5080)

| Feature | Description |
|---------|-------------|
| Auto-Posting | Schedule posts |
| Hashtag Research | Top hashtags |
| Engagement | Auto-like, follow |
| Story Scheduling | Queue stories |
| DM Automation | Auto-responses |
| Analytics | Engagement metrics |

### instagram-sales-agent (Port 5081)

| Feature | Description |
|---------|-------------|
| AI DMs | Natural language |
| Product Recommend | Based on interest |
| Order Processing | In-chat checkout |
| Cart Recovery | Abandon cart alerts |
| FAQ Response | Instant answers |
| Human Handoff | Escalate to agent |

### instagram-bridge (Port 5082)

| Feature | Description |
|---------|-------------|
| API Integration | Meta Graph API |
| Content Sync | Cross-post |
| Analytics | Aggregated stats |
| Influencer Track | @mentions |

### social-content-publisher (Port 5090)

| Feature | Description |
|---------|-------------|
| Multi-Platform | IG, FB, LinkedIn, Twitter |
| Content Calendar | Visual scheduler |
| Asset Library | Media management |
| A/B Testing | Test captions |
| Performance | Cross-platform stats |

### social-listener (Port 5095)

| Feature | Description |
|---------|-------------|
| Brand Monitoring | @mentions, tags |
| Sentiment Analysis | Positive/negative |
| Competitor Track | Spy on rivals |
| Trend Detection | Viral topics |
| Crisis Alerts | Negative spikes |

### youtube-automation (Port 5100)

| Feature | Description |
|---------|-------------|
| Auto-Uploads | Scheduled publishing |
| Thumbnail Gen | AI-generated |
| SEO Optimization | Title, description |
| End Screens | Auto-add |
| Playlist Manager | Organize content |

### pinterest-integration (Port 5105)

| Feature | Description |
|---------|-------------|
| Pin Scheduling | Queue pins |
| Board Optimization | Organize boards |
| Rich Pins | Auto-sync |
| Buyable Pins | Shoppable |
| Analytics | Pin performance |

### linkedin-automation (Port 5110)

| Feature | Description |
|---------|-------------|
| B2B Outreach | Auto-connection |
| Content Schedule | Post timing |
| InMail Templates | Personalized at scale |
| Lead Tracking | CRM integration |
| Engagement | Auto-react, comment |

---

## Marketing Automation

### nl-campaign-builder-v2 (Port 4822)

**NLP-powered campaign creation**

| Feature | Description |
|---------|-------------|
| Natural Language | Type campaigns |
| Multi-Channel | Email, SMS, Push |
| A/B Testing | Auto-optimize |
| Scheduling | Optimal send times |
| Personalization | Dynamic content |
| Analytics | Campaign reports |

### ai-marketing-manager (Port 4860)

**AI-powered campaign management**

| Feature | Description |
|---------|-------------|
| Budget Allocation | AI distribution |
| Audience Expansion | Find similar |
| Creative Suggestions | AI-generated copy |
| Performance Predict | ROAS forecasting |
| Anomaly Detection | Alert issues |
| Auto-Optimization | Self-improving |

### ab-testing-service (Port 4835)

| Feature | Description |
|---------|-------------|
| A/B Tests | Create experiments |
| Statistical Significance | 95% confidence |
| Multi-Armed Bandits | Auto-allocate traffic |
| Feature Flags | Gradual rollouts |
| Personalization | User segments |

### coupon-management-service (Port 4840)

| Feature | Description |
|---------|-------------|
| Coupon Generation | Bulk create |
| Redemption Track | Usage monitoring |
| Usage Limits | Per-user caps |
| Expiration | Auto-expire |
| Fraud Detection | Anomaly alerts |

### sequence-automation (Port 4845)

| Feature | Description |
|---------|-------------|
| Drip Campaigns | Multi-step flows |
| Behavioral Triggers | Action-based |
| Multi-Step | 10+ step sequences |
| Delay Management | Time between |
| Analytics | Conversion tracking |

---

## Analytics & Insights

### analytics-dashboard (Port 4930)

| Feature | Description |
|---------|-------------|
| Real-Time | Live metrics |
| Custom Reports | Build dashboards |
| Data Export | CSV, API |
| Alerts | Threshold notifications |
| Team Sharing | Collaborate |
| Embed | Widget embed |

### bi-service (Port 4935)

| Feature | Description |
|---------|-------------|
| Data Warehouse | Centralized data |
| OLAP Queries | Fast aggregations |
| Trend Analysis | Historical patterns |
| Forecasting | Predict future |
| SQL Interface | Query builder |

### reporting-service (Port 4940)

| Feature | Description |
|---------|-------------|
| Automated Reports | Scheduled PDFs |
| Multi-Format | PDF, Excel, CSV |
| Templates | Branded layouts |
| Distribution | Auto-email |
| Custom Metrics | Define your own |

---

## Audience & Targeting

### audience-twin-service (Port 4841)

**Lookalike modeling**

| Feature | Description |
|---------|-------------|
| Lookalike Models | Find similar users |
| Audience Expansion | Grow segments |
| Profile Synthesis | Privacy-safe |
| Segment Overlap | Audience overlap |
| Privacy-Safe | No PII exposed |

### segmentation-engine-service (Port 4842)

**Behavioral segmentation**

| Feature | Description |
|---------|-------------|
| RFM Analysis | Recency, frequency, monetary |
| Behavioral Cohorts | Action groups |
| Lifecycle Stages | New, active, lapsed |
| Propensity Scoring | Conversion likelihood |
| Dynamic Segments | Real-time updates |

### customer-health-score-service (Port 4843)

**Customer health monitoring**

| Feature | Description |
|---------|-------------|
| Engagement Score | Activity level |
| Churn Prediction | At-risk signals |
| LTV Prediction | Lifetime value |
| Health Monitoring | Dashboard alerts |
| Interventions | Trigger actions |

---

## Creative & Content

### creative-studio-service (Port 4980)

**Ad creative generation**

| Feature | Description |
|---------|-------------|
| Creative Gen | AI-powered designs |
| Templates | 100+ layouts |
| A/B Testing | Creative variants |
| Brand Guidelines | Enforce colors |
| Dynamic Creative | Personalized ads |

### dynamic-product-ad-engine (Port 4985)

**Personalized product ads**

| Feature | Description |
|---------|-------------|
| Real-Time Products | Live catalog |
| Personalized | Per-user products |
| Inventory Sync | Stock updates |
| Performance | CTR optimization |
| A/B Creative | Test variants |

### content-repurposing-engine (Port 4986)

**Cross-platform content**

| Feature | Description |
|---------|-------------|
| Format Convert | Resize for platforms |
| Size Optimization | File compression |
| Brand Voice | Tone adaptation |
| Multi-Language | Auto-translate |
| Platform Adapt | Platform-specific |

---

## Commerce & Checkout

### creator-commerce-service (Port 5020)

**Affiliate and creator commerce**

| Feature | Description |
|---------|-------------|
| Affiliate Tracking | Unique links |
| Commission Mgmt | Tiered rates |
| Creator Payouts | Auto-payments |
| Performance | Conversion tracking |
| Dashboard | Earnings view |

### sponsored-products-service (Port 5025)

**Product advertising**

| Feature | Description |
|---------|-------------|
| Product Ads | In-search placements |
| Keyword Bidding | Search terms |
| Campaign Mgmt | Full control |
| Performance Track | CTR, CPC, sales |
| Budget Controls | Daily limits |

### checkout-sdk (Port 5030)

**One-click checkout**

| Feature | Description |
|---------|-------------|
| One-Click | Fast checkout |
| Payment Methods | Cards, wallets |
| Address Book | Saved addresses |
| Order Tracking | Status updates |
| Returns | Self-serve returns |

---

## Testing & Quality

### abandonment-tracker (Port 5060)

**Cart abandonment recovery**

| Feature | Description |
|---------|-------------|
| Abandon Detect | Real-time alerts |
| Recovery Campaigns | Email, SMS, Push |
| Win-Back | Re-engage |
| Analytics | Recovery rates |
| Attribution | Revenue impact |

### lift-study-service (Port 5065)

**Incrementality testing**

| Feature | Description |
|---------|-------------|
| Holdout Groups | Test vs control |
| Statistical Models | Lift calculation |
| ROI Analysis | Campaign impact |
| Recommendations | Actionable insights |
| Reporting | Executive summaries |

---

## Referral & Loyalty

### referral-graph (Port 5070)

**Referral tracking and rewards**

| Feature | Description |
|---------|-------------|
| Referral Links | Unique codes |
| Multi-Level | 3+ tier rewards |
| Fraud Detection | Fake referrals |
| Payout Auto | Scheduled payments |
| Social Share | Viral sharing |

### loyalty-program-service (Port 5075)

**Points and rewards**

| Feature | Description |
|---------|-------------|
| Points System | Earn, redeem |
| Tier Management | Bronze, silver, gold |
| Reward Catalog | Gift cards, discounts |
| Birthday Rewards | Auto-triggered |
| Milestones | Achievement badges |

---

## Customer Success

### customer-support-service (Port 5085)

| Feature | Description |
|---------|-------------|
| Ticket System | Issue tracking |
| Auto-Responses | AI answers |
| Escalation | Route to agents |
| SLA Tracking | Response times |
| CSAT Analytics | Satisfaction scores |

### community-media-service (Port 5090)

| Feature | Description |
|---------|-------------|
| Community Build | User groups |
| UGC Platform | User content |
| Moderation | Auto + manual |
| Gamification | Points, badges |
| Referral Amp | Viral loops |

---

## Governance & Compliance

### governance-service (Port 5105)

| Feature | Description |
|---------|-------------|
| Policy Engine | Rules enforcement |
| Content Moderation | Auto-filter |
| Brand Safety | Ad placement safety |
| Fraud Prevention | Click fraud |
| Audit Trails | Full logging |

### audit-service (Port 5110)

| Feature | Description |
|---------|-------------|
| Activity Log | All actions |
| Compliance Reports | Regulatory |
| Data Retention | Auto-archive |
| Access Controls | RBAC |
| Incident Track | Security events |

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js, TypeScript |
| Database | MongoDB, Redis |
| Cache | Redis |
| Search | MongoDB Atlas Search |
| Auth | JWT, Internal tokens |
| Security | Helmet, CORS, Rate Limiting |
| Monitoring | Health checks, Metrics |
| Deployment | Docker, Kubernetes |

---

## Security Features

- Rate limiting (express-rate-limit)
- Helmet.js security headers
- CORS configuration
- MongoDB sanitization
- JWT authentication
- Internal service tokens
- Production token validation
- Input validation (Zod)
- SQL/NoSQL injection prevention

---

## Build Status

| Service | Status |
|---------|--------|
| rez-dsp-bidder | ✅ Full Pass |
| REZ-dsp-portal | ✅ Full Pass |
| REZ-programmatic-bidding | ✅ Full Pass |
| REZ-video-ads | ✅ Full Pass |
| rez-viral-loop | ✅ Full Pass |
| REZ-decision-service | ⚠️ Partial (runs) |

---

*Generated by Claude Code*
*Last updated: June 14, 2026*
