# 🏛️ RestoPapa Community Module - Complete Implementation Plan

## Overview
Complete implementation plan for the Community Module with all 10 feature sets, focusing on vendor/product suggestions and community engagement.

## 🗓️ Implementation Phases

### Phase 1: Database Schema Foundation (Days 1-3)
**Required Prisma Schema Additions:**

```prisma
// 1. Core Forum Models
model ForumSubscription {
  id        String   @id @default(cuid())
  userId    String
  forumId   String
  role      ForumRole @default(MEMBER)
  joinedAt  DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
  forum     Forum    @relation(fields: [forumId], references: [id])
  
  @@unique([userId, forumId])
}

enum ForumRole {
  MEMBER
  MODERATOR
  ADMIN
}

// 2. Vendor/Product Suggestion System
model VendorSuggestion {
  id            String   @id @default(cuid())
  postId        String
  vendorId      String?
  suggestedBy   String
  rating        Int?     // 1-5 stars
  helpfulness   HelpfulnessVote[]
  isBestAnswer  Boolean  @default(false)
  description   String
  createdAt     DateTime @default(now())
  
  post          ForumPost @relation(fields: [postId], references: [id])
  vendor        Vendor?   @relation(fields: [vendorId], references: [id])
  suggestedUser User      @relation(fields: [suggestedBy], references: [id])
}

model HelpfulnessVote {
  id           String   @id @default(cuid())
  suggestionId String
  userId       String
  isHelpful    Boolean
  createdAt    DateTime @default(now())
  
  suggestion   VendorSuggestion @relation(fields: [suggestionId], references: [id])
  user         User @relation(fields: [userId], references: [id])
  
  @@unique([suggestionId, userId])
}

// 3. Reputation & Gamification
model UserReputation {
  id              String   @id @default(cuid())
  userId          String   @unique
  totalPoints     Int      @default(0)
  level           Int      @default(1)
  badges          Badge[]
  monthlyPoints   Int      @default(0)
  weeklyRank      Int?
  cityRank        Int?
  categoryExpertise Json?  // { "bakery": 500, "equipment": 300 }
  updatedAt       DateTime @updatedAt
  
  user            User     @relation(fields: [userId], references: [id])
}

model Badge {
  id          String   @id @default(cuid())
  name        String
  description String
  icon        String
  type        BadgeType
  criteria    Json     // Achievement criteria
  awardedAt   DateTime @default(now())
  reputationId String
  
  reputation  UserReputation @relation(fields: [reputationId], references: [id])
}

enum BadgeType {
  TOP_HELPER
  VENDOR_CONNECTOR
  COMMUNITY_BUILDER
  EXPERT_ADVISOR
  TRUSTED_REVIEWER
}

// 4. Content Reporting & Moderation
model PostReport {
  id          String       @id @default(cuid())
  postId      String
  reporterId  String
  reason      String
  description String?
  status      ReportStatus @default(PENDING)
  priority    Priority     @default(MEDIUM)
  reviewedBy  String?
  reviewedAt  DateTime?
  createdAt   DateTime     @default(now())
  
  post        ForumPost    @relation(fields: [postId], references: [id])
  reporter    User         @relation(fields: [reporterId], references: [id])
  reviewer    User?        @relation("ReviewedReports", fields: [reviewedBy], references: [id])
}

model CommentReport {
  id          String       @id @default(cuid())
  commentId   String
  reporterId  String
  reason      String
  description String?
  status      ReportStatus @default(PENDING)
  reviewedBy  String?
  reviewedAt  DateTime?
  createdAt   DateTime     @default(now())
  
  comment     PostComment  @relation(fields: [commentId], references: [id])
  reporter    User         @relation(fields: [reporterId], references: [id])
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

// 5. Engagement Tracking
model PostLike {
  id        String   @id @default(cuid())
  postId    String
  userId    String
  createdAt DateTime @default(now())
  
  post      ForumPost @relation(fields: [postId], references: [id])
  user      User      @relation(fields: [userId], references: [id])
  
  @@unique([postId, userId])
}

model PostShare {
  id        String   @id @default(cuid())
  postId    String
  userId    String
  platform  String?  // "internal", "facebook", "whatsapp", etc.
  createdAt DateTime @default(now())
  
  post      ForumPost @relation(fields: [postId], references: [id])
  user      User      @relation(fields: [userId], references: [id])
}

// 6. Trending & Analytics
model TrendingTag {
  id        String   @id @default(cuid())
  tag       String
  score     Float
  postCount Int
  period    String   // "day", "week", "month"
  date      DateTime
  category  String?
  
  @@unique([tag, period, date])
}

// 7. Groups/Sub-communities
model CommunityGroup {
  id          String    @id @default(cuid())
  name        String
  slug        String    @unique
  description String
  type        GroupType
  category    String?
  city        String?
  isActive    Boolean   @default(true)
  memberCount Int       @default(0)
  rules       String?
  createdBy   String
  createdAt   DateTime  @default(now())
  
  creator     User      @relation(fields: [createdBy], references: [id])
  members     GroupMembership[]
  posts       ForumPost[]
}

model GroupMembership {
  id        String   @id @default(cuid())
  groupId   String
  userId    String
  role      GroupRole @default(MEMBER)
  joinedAt  DateTime @default(now())
  
  group     CommunityGroup @relation(fields: [groupId], references: [id])
  user      User @relation(fields: [userId], references: [id])
  
  @@unique([groupId, userId])
}

enum GroupRole {
  MEMBER
  MODERATOR
  ADMIN
}

// 8. Update Forum Model
model Forum {
  // ... existing fields ...
  displayOrder Int      @default(0)
  postCount    Int      @default(0)
  isActive     Boolean  @default(true)
  category     String?
  icon         String?
  color        String?
}

// 9. Update ForumPost Model  
model ForumPost {
  // ... existing fields ...
  visibility   PostVisibility @default(PUBLIC)
  viewCount    Int           @default(0)
  tags         String[]
  isDeleted    Boolean       @default(false)
  groupId      String?
  
  // Relations
  likes        PostLike[]
  shares       PostShare[]
  reports      PostReport[]
  suggestions  VendorSuggestion[]
  group        CommunityGroup? @relation(fields: [groupId], references: [id])
}

enum PostVisibility {
  PUBLIC
  MEMBERS_ONLY
  GROUP_ONLY
  PRIVATE
}

// 10. Update User Model
model User {
  // ... existing fields ...
  isVerified   Boolean   @default(false)
  isActive     Boolean   @default(true)
  city         String?
  
  // Community Relations
  reputation   UserReputation?
  forumSubscriptions ForumSubscription[]
  vendorSuggestions VendorSuggestion[]
  helpfulnessVotes HelpfulnessVote[]
  postLikes    PostLike[]
  postShares   PostShare[]
  postReports  PostReport[]
  commentReports CommentReport[]
  reviewedReports PostReport[] @relation("ReviewedReports")
  groupMemberships GroupMembership[]
  createdGroups CommunityGroup[]
}
```

### Phase 2: Core Services Implementation (Days 4-7)

#### 2.1 Vendor Suggestion Service
```typescript
// vendor-suggestion.service.ts
- createSuggestion(postId, vendorId, userId, description)
- rateSuggestion(suggestionId, rating, userId)
- voteHelpfulness(suggestionId, isHelpful, userId)
- markBestAnswer(suggestionId, postOwnerId)
- getTopSuggestions(filters)
- calculateVendorExposure(vendorId)
```

#### 2.2 Reputation Service
```typescript
// reputation.service.ts
- awardPoints(userId, action, points)
- calculateLevel(totalPoints)
- awardBadge(userId, badgeType)
- updateLeaderboards(timeframe)
- getCityLeaderboard(city)
- getCategoryExperts(category)
```

#### 2.3 Moderation Service
```typescript
// moderation.service.ts
- autoModerateContent(content) // AI-assisted
- flagSelfPromotion(vendorId, postId)
- reviewReport(reportId, action, reviewerId)
- bulkModerate(reportIds, action)
- getModeratorQueue(moderatorId)
```

### Phase 3: API Endpoints (Days 8-10)

#### 3.1 Vendor Suggestion Endpoints
```typescript
POST   /api/v1/community/posts/:postId/suggestions
PUT    /api/v1/community/suggestions/:id/rate
POST   /api/v1/community/suggestions/:id/vote
PUT    /api/v1/community/suggestions/:id/best-answer
GET    /api/v1/community/vendor-suggestions/:vendorId
```

#### 3.2 Reputation Endpoints
```typescript
GET    /api/v1/community/reputation/leaderboard
GET    /api/v1/community/reputation/user/:userId
GET    /api/v1/community/reputation/badges/:userId
GET    /api/v1/community/reputation/experts/:category
```

#### 3.3 Group Management
```typescript
POST   /api/v1/community/groups
GET    /api/v1/community/groups/search
POST   /api/v1/community/groups/:id/join
DELETE /api/v1/community/groups/:id/leave
GET    /api/v1/community/groups/:id/members
```

### Phase 4: Integration Points (Days 11-12)

#### 4.1 Cross-Module Linking
```typescript
// marketplace-integration.service.ts
- linkVendorSuggestionToProfile(suggestionId, vendorId)
- createJobPostFromDiscussion(postId)
- linkEventDiscussion(eventId, postId)
- trackVendorEngagement(vendorId)
```

#### 4.2 Notification Triggers
```typescript
// community-notifications.service.ts
- notifyOnSuggestionReceived(postOwnerId, suggestion)
- notifyOnBestAnswer(suggestorId, postId)
- notifyOnBadgeEarned(userId, badge)
- notifyOnMention(userId, postId)
```

### Phase 5: Analytics & Insights (Days 13-14)

#### 5.1 Community Analytics
```typescript
// community-analytics.service.ts
- getEngagementMetrics(timeframe)
- getTrendingTopics(category, location)
- getVendorSuggestionStats(vendorId)
- getUserContributionScore(userId)
- getCommunityHealth(groupId)
```

### Phase 6: Frontend Integration (Days 15-18)

#### 6.1 Component Structure
```
/components/community/
  ├── PostCreator/
  │   ├── VendorRequestPost.tsx
  │   ├── DiscussionPost.tsx
  │   └── PollPost.tsx
  ├── VendorSuggestions/
  │   ├── SuggestionCard.tsx
  │   ├── RatingWidget.tsx
  │   └── BestAnswerBadge.tsx
  ├── Reputation/
  │   ├── UserBadges.tsx
  │   ├── Leaderboard.tsx
  │   └── ExpertiseDisplay.tsx
  ├── Groups/
  │   ├── GroupList.tsx
  │   ├── GroupDetail.tsx
  │   └── MemberList.tsx
  └── Moderation/
      ├── ReportButton.tsx
      └── ModerationQueue.tsx
```

### Phase 7: Testing & Optimization (Days 19-20)

#### 7.1 Test Coverage
- Unit tests for all services
- Integration tests for vendor suggestion flow
- E2E tests for complete user journeys
- Performance tests for leaderboard queries

#### 7.2 Optimization
- Index optimization for trending queries
- Caching strategy for leaderboards
- Rate limiting for suggestion submissions
- Bulk operations for moderation

## 📊 Success Metrics

1. **Engagement Metrics**
   - Daily Active Users in Community
   - Posts per User per Month
   - Average Comments per Post
   - Vendor Suggestion Conversion Rate

2. **Quality Metrics**
   - Best Answer Selection Rate
   - Helpful Vote Ratio
   - Report Resolution Time
   - Self-Promotion Detection Rate

3. **Growth Metrics**
   - New Community Members/Month
   - Group Creation Rate
   - Badge Awards/Week
   - Cross-Module Conversions

## 🚀 Deployment Strategy

1. **Soft Launch** (Week 1)
   - Enable for 10% of users
   - Monitor performance and errors
   - Collect initial feedback

2. **Beta Release** (Week 2-3)
   - Expand to 50% of users
   - A/B test vendor suggestion features
   - Refine gamification points

3. **Full Release** (Week 4)
   - Enable for all users
   - Launch marketing campaign
   - Activate all badges and rewards

## 🔄 Maintenance Plan

- Weekly leaderboard updates
- Monthly badge criteria review
- Quarterly feature additions
- Continuous moderation improvements

This comprehensive plan transforms the Community Module into a transaction-linked engagement platform that drives real business value through vendor suggestions, job connections, and marketplace integration.