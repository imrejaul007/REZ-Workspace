# REZ Media & CorpPerks Integration Report for REZ-App

**Date:** May 19, 2026
**Status:** Audit Complete

---

## Executive Summary

This report audits REZ Media and CorpPerks services for integration opportunities with REZ-App. The audit identifies existing integrations, gaps, and provides code examples for new integration points.

**Key Findings:**
- REZ-App already has foundational integrations with corporate, journey, karma, and attribution services
- DOOH integration is the biggest gap - no SDK or proximity tracking in REZ-App
- Email service, communications platform, and DOOH attribution services need client wrappers
- Corporate travel and GST invoicing can expand REZ-App's B2B capabilities

---

## Part 1: REZ Media Services

### 1.1 Service Inventory

| Service | Port | Purpose | REZ-App Status |
|---------|------|---------|-----------------|
| `rez-dooh-service` | 4018 | DOOH screen management | **NOT INTEGRATED** |
| `REZ-dooh-attribution-service` | 4056 | DOOH impression/conversion tracking | **NOT INTEGRATED** |
| `REZ-journey-service` | 4019 | Lifecycle automation | INTEGRATED (journeyService.ts) |
| `REZ-attribution-platform` | 4023 | Multi-touch attribution | INTEGRATED (attributionApi.ts) |
| `karma-service` | 3009 | Impact economy/gamification | INTEGRATED (karmaService.ts) |
| `REZ-engagement-platform` | 4017 | Loyalty, offers, referrals | **NOT INTEGRATED** |
| `REZ-communications-platform` | 4022 | Email, SMS, WhatsApp | **NOT INTEGRATED** |
| `REZ-marketing-service` | 4025 | Campaign management | **NOT INTEGRATED** |
| `adsqr` | 4068 | QR ad campaigns | **NOT INTEGRATED** |

### 1.2 DOOH Services (Highest Priority)

#### Service: `rez-dooh-service` (Port 4018)

**Location:** `REZ-Media/rez-dooh-service/`

**Key Endpoints:**
```
GET    /screens                    # List all screens
GET    /screens/:id                # Get screen details
POST   /screens/register           # Register screen
PATCH  /screens/:id                # Update screen
POST   /screens/:id/heartbeat      # Screen heartbeat
GET    /screens/:id/health         # Screen health
GET    /screens/stats/network      # Network statistics

GET    /ads                        # Get ads for screen
POST   /ads/:id/impression         # Track impression
POST   /ads/:id/completion         # Track completion

GET    /analytics/performance       # Performance analytics
GET    /analytics/audience         # Audience analytics
```

**Screen Types Supported:**
- `cab_tablet` - Taxi/Travel screen (CPM: 15-25)
- `retail_kiosk` - Retail store display (CPM: 10-20)
- `elevator_screen` - Building elevator (CPM: 8-15)
- `billboard_led` - LED billboards (CPM: 50-150)
- `restaurant_order` - Restaurant menu board (CPM: 12-18)

#### Service: `REZ-dooh-attribution-service` (Port 4056)

**Location:** `REZ-Media/REZ-dooh-attribution-service/`

**Key Endpoints:**
```
POST   /api/impression             # Track ad impression
POST   /api/conversion             # Track conversion
POST   /api/proximity              # Track proximity to screen
GET    /api/reports/:campaignId    # Get attribution report
GET    /api/dashboard/:campaignId  # Real-time dashboard
```

---

### 1.3 How REZ-App Can Better Connect with DOOH Screens

#### Gap Analysis

| Feature | Current State | Needed |
|---------|--------------|--------|
| Screen Discovery | None | Nearby screen API |
| Proximity Detection | None | Location-based proximity tracking |
| Impression Tracking | None | Automatic on-screen detection |
| DOOH Rewards | None | Karma/coins for viewing ads |
| Campaign Interaction | None | Deep links to campaigns |
| Attribution | None | Cross-channel attribution |

#### Integration Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        REZ-App                                   │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐    ┌──────────────────┐                  │
│  │  DOOH SDK        │    │  Proximity       │                  │
│  │  (Screen APIs)   │    │  Tracker         │                  │
│  └────────┬─────────┘    └────────┬─────────┘                  │
│           │                        │                             │
│           │   ┌────────────────────┴────────────────────┐     │
│           │   │         Attribution Bridge               │     │
│           │   │  (Impression + Conversion + Proximity) │     │
│           │   └──────────────────────────────────────────┘     │
│           │                        │                             │
│           └────────────────────────┼─────────────────────────┐  │
│                                    │                         │  │
│  ┌────────────────────────────────▼─────────────────────────▼┐ │
│  │                    DOOH Services                         │ │
│  │  rez-dooh-service (4018) │ dooh-attribution (4056)      │ │
│  └──────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Part 2: CorpPerks Services

### 2.1 Service Inventory

| Service | Port | Purpose | REZ-App Status |
|---------|------|---------|-----------------|
| `rez-corporate-service` | 4030 | HRIS, Cards, GST, Travel | INTEGRATED (corporateService.ts) |
| `rez-corpperks-service` | 4031 | Corporate benefits | **NOT INTEGRATED** |
| `REZ-merchant-corpperks-bridge` | - | Merchant-CorpPerks bridge | **NOT INTEGRATED** |
| `rez-corp-integration-service` | - | Integration hub | **NOT INTEGRATED** |
| PeopleOS | - | Workforce OS | External (peopleos.vercel.app) |
| TalentAI | - | Career platform | External (talentai.vercel.app) |

### 2.2 Current CorpPerks Integration

**File:** `REZ-Consumer/rez-app/services/corporateService.ts`

**Already Implemented:**
- Employee profile & benefits
- Corporate card management
- GST invoice generation
- Travel policy & booking eligibility
- Expense claims

**Missing:**
- HRIS connection management
- Bulk employee sync
- Travel booking execution (not just eligibility)

### 2.3 How REZ-App Can Connect with Corporate Users

#### Gap Analysis

| Feature | Current State | Needed |
|---------|--------------|--------|
| Employee Authentication | Via REZ Auth | CorpPerks SSO/B2B login |
| Benefits Dashboard | Partial | Full allowance tracking |
| Meal Vouchers | None | QR-based meal redemption |
| Travel Booking | Eligibility only | Full booking flow |
| GST Invoicing | Available | Enhanced B2B checkout |
| Corporate Wallet | None | Prepaid corporate wallet |
| Expense Reports | Basic claims | Receipt scanning + auto-categorization |

---

## Part 3: Integration Code Examples

### 3.1 DOOH SDK for REZ-App

Create a new service file: `REZ-Consumer/rez-app/services/doohService.ts`

```typescript
/**
 * DOOH SERVICE
 * Integration with rez-dooh-service (REZ-Media)
 *
 * Service: rez-dooh-service
 * Port: 4018
 * URL: https://rez-dooh-service.onrender.com
 */

import { logger } from '@/utils/logger';
import apiClient, { ApiResponse } from './apiClient';

// ============================================================================
// TYPES
// ============================================================================

export interface Screen {
  id: string;
  name: string;
  type: 'cab_tablet' | 'retail_kiosk' | 'elevator_screen' | 'billboard_led' | 'restaurant_order';
  network_type: 'captive' | 'context' | 'public';
  status: 'active' | 'inactive' | 'offline' | 'maintenance';
  location: {
    address: string;
    city: string;
    area?: string;
    coordinates?: { lat: number; lng: number };
  };
  cpm: number;
  total_impressions: number;
  total_scans: number;
  last_seen: string;
}

export interface ScreenAd {
  adId: string;
  campaignId: string;
  content: {
    type: 'image' | 'video' | 'interactive';
    url: string;
    duration?: number;
  };
  cta?: {
    label: string;
    url: string;
    deepLink?: string;
  };
  tracking: {
    impressionUrl: string;
    clickUrl: string;
  };
}

export interface ScreenFilter {
  type?: Screen['type'];
  network_type?: Screen['network_type'];
  city?: string;
  area?: string;
  status?: Screen['status'];
  lat?: number;
  lng?: number;
  radius?: number; // km
}

export interface ProximityEvent {
  userId: string;
  screenId: string;
  location: { lat: number; lng: number };
  timestamp: string;
  duration?: number; // seconds near screen
}

// ============================================================================
// SERVICE CONFIGURATION
// ============================================================================

const DOOH_SERVICE_URL = process.env.EXPO_PUBLIC_DOOH_SERVICE_URL || 'https://rez-dooh-service.onrender.com';
const DOOH_API_VERSION = 'v1';
const DOOH_BASE_URL = `${DOOH_SERVICE_URL}/api/${DOOH_API_VERSION}`;

// ============================================================================
// API METHODS - SCREENS
// ============================================================================

/**
 * Get nearby DOOH screens
 */
export async function getNearbyScreens(
  lat: number,
  lng: number,
  radiusKm: number = 5,
  options?: { type?: Screen['type']; status?: Screen['status'] }
): Promise<ApiResponse<Screen[]>> {
  try {
    const params = new URLSearchParams({
      lat: String(lat),
      lng: String(lng),
      radius: String(radiusKm),
    });
    if (options?.type) params.append('type', options.type);
    if (options?.status) params.append('status', options.status);

    const response = await apiClient.get(`${DOOH_BASE_URL}/screens/nearby?${params}`);
    return response as ApiResponse<Screen[]>;
  } catch (error) {
    logger.error('[DOOHService] Failed to get nearby screens:', error);
    return { success: false, error: 'Failed to load screens' };
  }
}

/**
 * Get screen details
 */
export async function getScreenDetails(
  screenId: string
): Promise<ApiResponse<Screen & { ads: ScreenAd[] }>> {
  try {
    const response = await apiClient.get(`${DOOH_BASE_URL}/screens/${screenId}`);
    return response as ApiResponse<Screen & { ads: ScreenAd[] }>;
  } catch (error) {
    logger.error('[DOOHService] Failed to get screen details:', error);
    return { success: false, error: 'Failed to load screen' };
  }
}

/**
 * Get ad playlist for a screen
 */
export async function getScreenPlaylist(
  screenId: string
): Promise<ApiResponse<ScreenAd[]>> {
  try {
    const response = await apiClient.get(`${DOOH_BASE_URL}/screens/${screenId}/playlist`);
    return response as ApiResponse<ScreenAd[]>;
  } catch (error) {
    logger.error('[DOOHService] Failed to get playlist:', error);
    return { success: false, error: 'Failed to load playlist' };
  }
}

/**
 * Track ad impression
 */
export async function trackAdImpression(
  screenId: string,
  adId: string,
  userId: string
): Promise<ApiResponse<{ success: boolean }>> {
  try {
    const response = await apiClient.post(`${DOOH_BASE_URL}/ads/${adId}/impression`, {
      screenId,
      userId,
      timestamp: new Date().toISOString(),
    });
    return response as ApiResponse<{ success: boolean }>;
  } catch (error) {
    logger.error('[DOOHService] Failed to track impression:', error);
    return { success: false, error: 'Failed to track impression' };
  }
}

/**
 * Track ad completion (viewed full ad)
 */
export async function trackAdCompletion(
  screenId: string,
  adId: string,
  userId: string,
  duration: number
): Promise<ApiResponse<{ success: boolean; reward?: { type: string; amount: number } }>> {
  try {
    const response = await apiClient.post(`${DOOH_BASE_URL}/ads/${adId}/completion`, {
      screenId,
      userId,
      duration,
      timestamp: new Date().toISOString(),
    });
    return response as ApiResponse<{ success: boolean; reward?: { type: string; amount: number } }>;
  } catch (error) {
    logger.error('[DOOHService] Failed to track completion:', error);
    return { success: false, error: 'Failed to track completion' };
  }
}

/**
 * Track ad click/conversion
 */
export async function trackAdClick(
  adId: string,
  userId: string,
  destination?: string
): Promise<ApiResponse<{ success: boolean; deepLink?: string }>> {
  try {
    const response = await apiClient.post(`${DOOH_BASE_URL}/ads/${adId}/click`, {
      userId,
      destination,
      timestamp: new Date().toISOString(),
    });
    return response as ApiResponse<{ success: boolean; deepLink?: string }>;
  } catch (error) {
    logger.error('[DOOHService] Failed to track click:', error);
    return { success: false, error: 'Failed to track click' };
  }
}

// ============================================================================
// PROXIMITY TRACKING
// ============================================================================

/**
 * Report user proximity to DOOH screens
 * Should be called periodically when user is near known screen locations
 */
export async function reportProximity(
  event: ProximityEvent
): Promise<ApiResponse<{ proximityId: string; eligible: boolean; reward?: unknown }>> {
  try {
    const response = await apiClient.post(`${DOOH_BASE_URL}/proximity`, event);
    return response as ApiResponse<{ proximityId: string; eligible: boolean; reward?: unknown }>;
  } catch (error) {
    logger.error('[DOOHService] Failed to report proximity:', error);
    return { success: false, error: 'Failed to report proximity' };
  }
}

/**
 * Get available DOOH rewards for user
 */
export async function getDOOHRewards(
  userId: string
): Promise<ApiResponse<{ pending: number; available: number; history: RewardHistory[] }>> {
  try {
    const response = await apiClient.get(`${DOOH_BASE_URL}/rewards/user/${userId}`);
    return response as ApiResponse<{ pending: number; available: number; history: RewardHistory[] }>;
  } catch (error) {
    logger.error('[DOOHService] Failed to get rewards:', error);
    return { success: false, error: 'Failed to load rewards' };
  }
}

interface RewardHistory {
  id: string;
  screenId: string;
  screenName: string;
  type: 'impression' | 'completion' | 'conversion';
  reward: { type: string; amount: number };
  timestamp: string;
}

// ============================================================================
// ANALYTICS
// ============================================================================

/**
 * Get screen performance analytics
 */
export async function getScreenAnalytics(
  screenId: string,
  period?: { start: string; end: string }
): Promise<ApiResponse<{
  impressions: number;
  uniqueUsers: number;
  completionRate: number;
  clickRate: number;
  revenue: number;
}>> {
  try {
    const params = new URLSearchParams();
    if (period?.start) params.append('start', period.start);
    if (period?.end) params.append('end', period.end);

    const response = await apiClient.get(
      `${DOOH_BASE_URL}/analytics/screen/${screenId}${params.toString() ? `?${params}` : ''}`
    );
    return response as ApiResponse<{
      impressions: number;
      uniqueUsers: number;
      completionRate: number;
      clickRate: number;
      revenue: number;
    }>;
  } catch (error) {
    logger.error('[DOOHService] Failed to get analytics:', error);
    return { success: false, error: 'Failed to load analytics' };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const doohService = {
  // Screens
  getNearbyScreens,
  getScreenDetails,
  getScreenPlaylist,

  // Tracking
  trackAdImpression,
  trackAdCompletion,
  trackAdClick,

  // Proximity
  reportProximity,
  getDOOHRewards,

  // Analytics
  getScreenAnalytics,
};

export default doohService;
```

### 3.2 DOOH Attribution Service

Create: `REZ-Consumer/rez-app/services/doohAttributionService.ts`

```typescript
/**
 * DOOH ATTRIBUTION SERVICE
 * Integration with REZ-dooh-attribution-service (REZ-Media)
 *
 * Service: REZ-dooh-attribution-service
 * Port: 4056
 * URL: https://REZ-dooh-attribution-service.onrender.com
 */

import { logger } from '@/utils/logger';
import apiClient, { ApiResponse } from './apiClient';

// ============================================================================
// TYPES
// ============================================================================

export interface ImpressionEvent {
  userId?: string;
  deviceId: string;
  campaignId: string;
  screenId: string;
  location?: {
    address?: string;
    city?: string;
    area?: string;
    coordinates?: { lat: number; lng: number };
  };
  duration?: number; // seconds viewed
  contentId?: string;
}

export interface ConversionEvent {
  userId?: string;
  deviceId: string;
  type: 'purchase' | 'signup' | 'engagement' | 'app_open';
  value?: number;
  orderId?: string;
  location?: {
    address?: string;
    city?: string;
    area?: string;
    coordinates?: { lat: number; lng: number };
  };
}

export interface AttributionReport {
  reportId: string;
  campaignId: string;
  period: { start: string; end: string };
  metrics: {
    totalImpressions: number;
    uniqueUsers: number;
    totalConversions: number;
    attributedConversions: number;
    conversionRate: number;
    roas: number;
    cpm: number;
    cpa: number;
  };
  byLocation: Record<string, {
    impressions: number;
    conversions: number;
    roas: number;
  }>;
  byScreenType: Record<string, {
    impressions: number;
    conversions: number;
    roas: number;
  }>;
}

export interface DashboardData {
  last24h: {
    impressions: number;
    conversions: number;
    conversionRate: number;
  };
  hourly: Array<{ hour: number; impressions: number }>;
}

// ============================================================================
// SERVICE CONFIGURATION
// ============================================================================

const ATTRIBUTION_SERVICE_URL = process.env.EXPO_PUBLIC_DOOH_ATTRIBUTION_URL || 'https://REZ-dooh-attribution-service.onrender.com';
const ATTRIBUTION_BASE_URL = `${ATTRIBUTION_SERVICE_URL}/api`;

// ============================================================================
// API METHODS - TRACKING
// ============================================================================

/**
 * Track DOOH ad impression
 */
export async function trackDOOHImpression(
  event: ImpressionEvent
): Promise<ApiResponse<{ exposureId: string }>> {
  try {
    const response = await apiClient.post(`${ATTRIBUTION_BASE_URL}/impression`, {
      ...event,
      impressionTime: new Date().toISOString(),
    });
    return response as ApiResponse<{ exposureId: string }>;
  } catch (error) {
    logger.error('[DOOHAttribution] Failed to track impression:', error);
    return { success: false, error: 'Failed to track impression' };
  }
}

/**
 * Track conversion with attribution to DOOH
 * Automatically attributes to recent DOOH exposures within 7-day window
 */
export async function trackDOOHConversion(
  event: ConversionEvent
): Promise<ApiResponse<{
  conversionId: string;
  attributedCampaigns: string[];
}>> {
  try {
    const response = await apiClient.post(`${ATTRIBUTION_BASE_URL}/conversion`, {
      ...event,
      conversionTime: new Date().toISOString(),
    });
    return response as ApiResponse<{
      conversionId: string;
      attributedCampaigns: string[];
    }>;
  } catch (error) {
    logger.error('[DOOHAttribution] Failed to track conversion:', error);
    return { success: false, error: 'Failed to track conversion' };
  }
}

/**
 * Track user proximity to DOOH screen
 * Enables future attribution when user converts near a screen
 */
export async function trackDOOHProximity(
  userId: string,
  deviceId: string,
  screenId: string,
  location: { lat: number; lng: number },
  campaignId?: string
): Promise<ApiResponse<{ proximityId: string }>> {
  try {
    const response = await apiClient.post(`${ATTRIBUTION_BASE_URL}/proximity`, {
      userId,
      deviceId,
      screenId,
      campaignId,
      location,
      timestamp: new Date().toISOString(),
    });
    return response as ApiResponse<{ proximityId: string }>;
  } catch (error) {
    logger.error('[DOOHAttribution] Failed to track proximity:', error);
    return { success: false, error: 'Failed to track proximity' };
  }
}

// ============================================================================
// API METHODS - REPORTING
// ============================================================================

/**
 * Get attribution report for a campaign
 */
export async function getAttributionReport(
  campaignId: string,
  period?: { start: string; end: string }
): Promise<ApiResponse<AttributionReport>> {
  try {
    const params = new URLSearchParams();
    if (period?.start) params.append('start', period.start);
    if (period?.end) params.append('end', period.end);

    const response = await apiClient.get(
      `${ATTRIBUTION_BASE_URL}/reports/${campaignId}${params.toString() ? `?${params}` : ''}`
    );
    return response as ApiResponse<AttributionReport>;
  } catch (error) {
    logger.error('[DOOHAttribution] Failed to get report:', error);
    return { success: false, error: 'Failed to load report' };
  }
}

/**
 * Get real-time dashboard data
 */
export async function getCampaignDashboard(
  campaignId: string
): Promise<ApiResponse<DashboardData>> {
  try {
    const response = await apiClient.get(`${ATTRIBUTION_BASE_URL}/dashboard/${campaignId}`);
    return response as ApiResponse<DashboardData>;
  } catch (error) {
    logger.error('[DOOHAttribution] Failed to get dashboard:', error);
    return { success: false, error: 'Failed to load dashboard' };
  }
}

// ============================================================================
// CROSS-CHANNEL ATTRIBUTION
// ============================================================================

/**
 * Get user's DOOH touchpoints leading to conversion
 */
export async function getUserDOOHTouchpoints(
  userId: string,
  lookbackDays: number = 30
): Promise<ApiResponse<Array<{
  screenId: string;
  screenName: string;
  screenType: string;
  location: string;
  exposureTime: string;
  duration: number;
  attributed: boolean;
}>>> {
  try {
    const response = await apiClient.get(
      `${ATTRIBUTION_BASE_URL}/touchpoints/${userId}?days=${lookbackDays}`
    );
    return response as ApiResponse<Array<{
      screenId: string;
      screenName: string;
      screenType: string;
      location: string;
      exposureTime: string;
      duration: number;
      attributed: boolean;
    }>>;
  } catch (error) {
    logger.error('[DOOHAttribution] Failed to get touchpoints:', error);
    return { success: false, error: 'Failed to load touchpoints' };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const doohAttributionService = {
  // Tracking
  trackDOOHImpression,
  trackDOOHConversion,
  trackDOOHProximity,

  // Reporting
  getAttributionReport,
  getCampaignDashboard,

  // Attribution
  getUserDOOHTouchpoints,
};

export default doohAttributionService;
```

### 3.3 Email Service Integration

Create: `REZ-Consumer/rez-app/services/emailService.ts`

```typescript
/**
 * EMAIL SERVICE
 * Integration with REZ-communications-platform (REZ-Media)
 *
 * Service: REZ-communications-platform
 * Port: 4022
 * URL: https://REZ-communications-platform.onrender.com
 */

import { logger } from '@/utils/logger';
import apiClient, { ApiResponse } from './apiClient';

// ============================================================================
// TYPES
// ============================================================================

export interface EmailRequest {
  to: string | string[];
  subject: string;
  template?: string;
  templateData?: Record<string, unknown>;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>;
}

export interface EmailStatus {
  messageId: string;
  status: 'queued' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed';
  to: string;
  subject: string;
  sentAt: string;
  deliveredAt?: string;
  openedAt?: string;
  clickedAt?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlTemplate: string;
  textTemplate?: string;
  variables: string[];
  category: 'transactional' | 'marketing' | 'notification' | 'digest';
}

// ============================================================================
// SERVICE CONFIGURATION
// ============================================================================

const EMAIL_SERVICE_URL = process.env.EXPO_PUBLIC_EMAIL_SERVICE_URL || 'https://REZ-communications-platform.onrender.com';
const EMAIL_BASE_URL = `${EMAIL_SERVICE_URL}/api`;

// ============================================================================
// API METHODS
// ============================================================================

/**
 * Send email
 */
export async function sendEmail(
  request: EmailRequest
): Promise<ApiResponse<{ messageId: string; success: boolean }>> {
  try {
    const response = await apiClient.post(`${EMAIL_BASE_URL}/email/send`, request);
    return response as ApiResponse<{ messageId: string; success: boolean }>;
  } catch (error) {
    logger.error('[EmailService] Failed to send email:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

/**
 * Get email status
 */
export async function getEmailStatus(
  messageId: string
): Promise<ApiResponse<EmailStatus>> {
  try {
    const response = await apiClient.get(`${EMAIL_BASE_URL}/email/status/${messageId}`);
    return response as ApiResponse<EmailStatus>;
  } catch (error) {
    logger.error('[EmailService] Failed to get status:', error);
    return { success: false, error: 'Failed to get email status' };
  }
}

/**
 * Get available email templates
 */
export async function getEmailTemplates(
  category?: EmailTemplate['category']
): Promise<ApiResponse<EmailTemplate[]>> {
  try {
    const params = category ? `?category=${category}` : '';
    const response = await apiClient.get(`${EMAIL_BASE_URL}/email/templates${params}`);
    return response as ApiResponse<EmailTemplate[]>;
  } catch (error) {
    logger.error('[EmailService] Failed to get templates:', error);
    return { success: false, error: 'Failed to load templates' };
  }
}

/**
 * Preview email template with sample data
 */
export async function previewTemplate(
  templateId: string,
  data: Record<string, unknown>
): Promise<ApiResponse<{ html: string; text: string }>> {
  try {
    const response = await apiClient.post(`${EMAIL_BASE_URL}/email/templates/${templateId}/preview`, data);
    return response as ApiResponse<{ html: string; text: string }>;
  } catch (error) {
    logger.error('[EmailService] Failed to preview template:', error);
    return { success: false, error: 'Failed to preview template' };
  }
}

/**
 * Send transactional email
 */
export async function sendTransactionalEmail(
  to: string,
  templateName: string,
  data: Record<string, unknown>
): Promise<ApiResponse<{ messageId: string }>> {
  try {
    const response = await apiClient.post(`${EMAIL_BASE_URL}/email/transactional`, {
      to,
      templateName,
      data,
    });
    return response as ApiResponse<{ messageId: string }>;
  } catch (error) {
    logger.error('[EmailService] Failed to send transactional email:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

// ============================================================================
// COMMON EMAIL TEMPLATES
// ============================================================================

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmation(
  email: string,
  orderData: {
    orderId: string;
    items: Array<{ name: string; quantity: number; price: number }>;
    total: number;
    storeName: string;
    estimatedDelivery?: string;
  }
): Promise<ApiResponse<{ messageId: string }>> {
  return sendTransactionalEmail(email, 'order_confirmation', orderData);
}

/**
 * Send shipping update email
 */
export async function sendShippingUpdate(
  email: string,
  shippingData: {
    orderId: string;
    status: string;
    trackingUrl?: string;
    estimatedDelivery: string;
  }
): Promise<ApiResponse<{ messageId: string }>> {
  return sendTransactionalEmail(email, 'shipping_update', shippingData);
}

/**
 * Send refund notification email
 */
export async function sendRefundNotification(
  email: string,
  refundData: {
    orderId: string;
    amount: number;
    reason: string;
    refundMethod: string;
    refundId: string;
  }
): Promise<ApiResponse<{ messageId: string }>> {
  return sendTransactionalEmail(email, 'refund_notification', refundData);
}

/**
 * Send welcome email for new users
 */
export async function sendWelcomeEmail(
  email: string,
  userData: {
    name: string;
    referralCode?: string;
    bonusAmount?: number;
  }
): Promise<ApiResponse<{ messageId: string }>> {
  return sendTransactionalEmail(email, 'welcome', userData);
}

// ============================================================================
// EXPORTS
// ============================================================================

export const emailService = {
  // Core
  sendEmail,
  getEmailStatus,
  getEmailTemplates,
  previewTemplate,
  sendTransactionalEmail,

  // Common templates
  sendOrderConfirmation,
  sendShippingUpdate,
  sendRefundNotification,
  sendWelcomeEmail,
};

export default emailService;
```

### 3.4 Engagement Platform Service

Create: `REZ-Consumer/rez-app/services/engagementService.ts`

```typescript
/**
 * ENGAGEMENT SERVICE
 * Integration with REZ-engagement-platform (REZ-Media)
 *
 * Service: REZ-engagement-platform
 * Port: 4017
 * URL: https://REZ-engagement-platform.onrender.com
 */

import { logger } from '@/utils/logger';
import apiClient, { ApiResponse } from './apiClient';

// ============================================================================
// TYPES
// ============================================================================

// Loyalty
export interface LoyaltyProfile {
  userId: string;
  points: number;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  lifetimePoints: number;
  pointsToNextTier: number;
  benefits: string[];
}

export interface LoyaltyTransaction {
  id: string;
  type: 'credit' | 'debit';
  points: number;
  reason: string;
  orderId?: string;
  timestamp: string;
  balance: number;
}

// Offers
export interface Offer {
  id: string;
  title: string;
  description: string;
  type: 'discount' | 'cashback' | 'bogo' | 'free_shipping';
  value: number;
  minOrderValue?: number;
  maxDiscount?: number;
  validUntil: string;
  applicableStores?: string[];
  applicableCategories?: string[];
  code?: string;
  badge?: string;
}

// Gamification
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface Streak {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  streakMilestone: number | null; // null if no milestone reached
  gracePeriodActive: boolean;
}

// Referral
export interface ReferralCode {
  code: string;
  url: string;
  reward: {
    referrer: { points: number; description: string };
    referee: { points: number; description: string };
  };
  usageCount: number;
  maxUsage: number;
}

// ============================================================================
// SERVICE CONFIGURATION
// ============================================================================

const ENGAGEMENT_SERVICE_URL = process.env.EXPO_PUBLIC_ENGAGEMENT_SERVICE_URL || 'https://REZ-engagement-platform.onrender.com';
const ENGAGEMENT_BASE_URL = `${ENGAGEMENT_SERVICE_URL}/api`;

// ============================================================================
// LOYALTY METHODS
// ============================================================================

/**
 * Get user loyalty profile
 */
export async function getLoyaltyProfile(
  userId: string
): Promise<ApiResponse<LoyaltyProfile>> {
  try {
    const response = await apiClient.get(`${ENGAGEMENT_BASE_URL}/loyalty/${userId}`);
    return response as ApiResponse<LoyaltyProfile>;
  } catch (error) {
    logger.error('[EngagementService] Failed to get loyalty profile:', error);
    return { success: false, error: 'Failed to load profile' };
  }
}

/**
 * Credit loyalty points
 */
export async function creditLoyaltyPoints(
  userId: string,
  points: number,
  reason: string,
  orderId?: string
): Promise<ApiResponse<{ newBalance: number; transactionId: string }>> {
  try {
    const response = await apiClient.post(`${ENGAGEMENT_BASE_URL}/loyalty/${userId}/points`, {
      points,
      reason,
      orderId,
    });
    return response as ApiResponse<{ newBalance: number; transactionId: string }>;
  } catch (error) {
    logger.error('[EngagementService] Failed to credit points:', error);
    return { success: false, error: 'Failed to credit points' };
  }
}

/**
 * Redeem loyalty points
 */
export async function redeemLoyaltyPoints(
  userId: string,
  points: number,
  rewardId: string
): Promise<ApiResponse<{ success: boolean; remainingPoints: number; reward: unknown }>> {
  try {
    const response = await apiClient.post(`${ENGAGEMENT_BASE_URL}/loyalty/${userId}/redeem`, {
      points,
      rewardId,
    });
    return response as ApiResponse<{ success: boolean; remainingPoints: number; reward: unknown }>;
  } catch (error) {
    logger.error('[EngagementService] Failed to redeem points:', error);
    return { success: false, error: 'Failed to redeem points' };
  }
}

/**
 * Get loyalty transaction history
 */
export async function getLoyaltyHistory(
  userId: string,
  limit: number = 20
): Promise<ApiResponse<LoyaltyTransaction[]>> {
  try {
    const response = await apiClient.get(`${ENGAGEMENT_BASE_URL}/loyalty/${userId}/history?limit=${limit}`);
    return response as ApiResponse<LoyaltyTransaction[]>;
  } catch (error) {
    logger.error('[EngagementService] Failed to get history:', error);
    return { success: false, error: 'Failed to load history' };
  }
}

// ============================================================================
// OFFERS METHODS
// ============================================================================

/**
 * Get active offers
 */
export async function getActiveOffers(
  options?: {
    type?: Offer['type'];
    storeId?: string;
    categoryId?: string;
    userId?: string;
  }
): Promise<ApiResponse<Offer[]>> {
  try {
    const params = new URLSearchParams();
    if (options?.type) params.append('type', options.type);
    if (options?.storeId) params.append('storeId', options.storeId);
    if (options?.categoryId) params.append('categoryId', options.categoryId);
    if (options?.userId) params.append('userId', options.userId);

    const response = await apiClient.get(`${ENGAGEMENT_BASE_URL}/offers?${params}`);
    return response as ApiResponse<Offer[]>;
  } catch (error) {
    logger.error('[EngagementService] Failed to get offers:', error);
    return { success: false, error: 'Failed to load offers' };
  }
}

/**
 * Redeem an offer
 */
export async function redeemOffer(
  offerId: string,
  userId: string,
  orderId?: string
): Promise<ApiResponse<{ success: boolean; code?: string; discount: number }>> {
  try {
    const response = await apiClient.post(`${ENGAGEMENT_BASE_URL}/offers/${offerId}/redeem`, {
      userId,
      orderId,
    });
    return response as ApiResponse<{ success: boolean; code?: string; discount: number }>;
  } catch (error) {
    logger.error('[EngagementService] Failed to redeem offer:', error);
    return { success: false, error: 'Failed to redeem offer' };
  }
}

// ============================================================================
// GAMIFICATION METHODS
// ============================================================================

/**
 * Get user badges
 */
export async function getUserBadges(
  userId: string
): Promise<ApiResponse<Badge[]>> {
  try {
    const response = await apiClient.get(`${ENGAGEMENT_BASE_URL}/gamification/${userId}/badges`);
    return response as ApiResponse<Badge[]>;
  } catch (error) {
    logger.error('[EngagementService] Failed to get badges:', error);
    return { success: false, error: 'Failed to load badges' };
  }
}

/**
 * Get user streak info
 */
export async function getUserStreak(
  userId: string
): Promise<ApiResponse<Streak>> {
  try {
    const response = await apiClient.get(`${ENGAGEMENT_BASE_URL}/gamification/${userId}/streak`);
    return response as ApiResponse<Streak>;
  } catch (error) {
    logger.error('[EngagementService] Failed to get streak:', error);
    return { success: false, error: 'Failed to load streak' };
  }
}

/**
 * Update streak activity
 */
export async function updateStreakActivity(
  userId: string,
  activityType: string
): Promise<ApiResponse<Streak>> {
  try {
    const response = await apiClient.post(`${ENGAGEMENT_BASE_URL}/gamification/${userId}/streak`, {
      activityType,
    });
    return response as ApiResponse<Streak>;
  } catch (error) {
    logger.error('[EngagementService] Failed to update streak:', error);
    return { success: false, error: 'Failed to update streak' };
  }
}

// ============================================================================
// REFERRAL METHODS
// ============================================================================

/**
 * Generate referral code for user
 */
export async function generateReferralCode(
  userId: string
): Promise<ApiResponse<ReferralCode>> {
  try {
    const response = await apiClient.post(`${ENGAGEMENT_BASE_URL}/referrals/generate`, { userId });
    return response as ApiResponse<ReferralCode>;
  } catch (error) {
    logger.error('[EngagementService] Failed to generate referral code:', error);
    return { success: false, error: 'Failed to generate referral code' };
  }
}

/**
 * Track referral signup
 */
export async function trackReferralSignup(
  referralCode: string,
  newUserId: string
): Promise<ApiResponse<{
  success: boolean;
  referrerReward?: { points: number };
  refereeReward?: { points: number };
}>> {
  try {
    const response = await apiClient.post(`${ENGAGEMENT_BASE_URL}/referrals/track`, {
      referralCode,
      newUserId,
    });
    return response as ApiResponse<{
      success: boolean;
      referrerReward?: { points: number };
      refereeReward?: { points: number };
    }>;
  } catch (error) {
    logger.error('[EngagementService] Failed to track referral:', error);
    return { success: false, error: 'Failed to track referral' };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const engagementService = {
  // Loyalty
  getLoyaltyProfile,
  creditLoyaltyPoints,
  redeemLoyaltyPoints,
  getLoyaltyHistory,

  // Offers
  getActiveOffers,
  redeemOffer,

  // Gamification
  getUserBadges,
  getUserStreak,
  updateStreakActivity,

  // Referrals
  generateReferralCode,
  trackReferralSignup,
};

export default engagementService;
```

### 3.5 QR Ad Campaigns Service

Create: `REZ-Consumer/rez-app/services/adsQrService.ts`

```typescript
/**
 * ADS QR SERVICE
 * Integration with adsqr (REZ-Media)
 *
 * Service: adsqr
 * Port: 4068
 * URL: https://adsqr.onrender.com
 */

import { logger } from '@/utils/logger';
import apiClient, { ApiResponse } from './apiClient';

// ============================================================================
// TYPES
// ============================================================================

export interface QRCampaign {
  id: string;
  name: string;
  description: string;
  brand: {
    id: string;
    name: string;
    logo?: string;
  };
  qrConfig: {
    size: 'small' | 'medium' | 'large';
    color?: string;
    logoUrl?: string;
  };
  reward: {
    type: 'coins' | 'cashback' | 'voucher' | 'discount';
    amount: number;
    maxClaims?: number;
    claimsCount: number;
  };
  target: {
    demographics?: {
      ageRange?: [number, number];
      gender?: ('male' | 'female' | 'other')[];
    };
    locations?: string[];
    interests?: string[];
  };
  content: {
    title: string;
    description: string;
    imageUrl?: string;
    videoUrl?: string;
    cta?: { label: string; url: string };
  };
  analytics: {
    scans: number;
    claims: number;
    conversionRate: number;
  };
  status: 'active' | 'paused' | 'ended';
  validFrom: string;
  validUntil: string;
}

export interface QRScanResult {
  campaignId: string;
  reward: {
    type: 'coins' | 'cashback' | 'voucher' | 'discount';
    amount: number;
    code?: string;
    expiresAt?: string;
  };
  nextSteps?: {
    title: string;
    actionUrl?: string;
  }[];
}

export interface QRAnalytics {
  campaignId: string;
  period: { start: string; end: string };
  metrics: {
    totalScans: number;
    uniqueUsers: number;
    totalClaims: number;
    claimRate: number;
    averageScanValue: number;
    totalRewardValue: number;
  };
  byLocation: Record<string, {
    scans: number;
    claims: number;
  }>;
  byDemographic: Record<string, {
    scans: number;
    claims: number;
  }>;
}

// ============================================================================
// SERVICE CONFIGURATION
// ============================================================================

const ADS_QR_SERVICE_URL = process.env.EXPO_PUBLIC_ADS_QR_URL || 'https://adsqr.onrender.com';
const ADS_QR_BASE_URL = `${ADS_QR_SERVICE_URL}/api`;

// ============================================================================
// API METHODS
// ============================================================================

/**
 * Get available QR campaigns
 */
export async function getAvailableCampaigns(
  options?: {
    lat?: number;
    lng?: number;
    radius?: number;
    category?: string;
    brandId?: string;
  }
): Promise<ApiResponse<QRCampaign[]>> {
  try {
    const params = new URLSearchParams();
    if (options?.lat) params.append('lat', String(options.lat));
    if (options?.lng) params.append('lng', String(options.lng));
    if (options?.radius) params.append('radius', String(options.radius));
    if (options?.category) params.append('category', options.category);
    if (options?.brandId) params.append('brandId', options.brandId);

    const response = await apiClient.get(`${ADS_QR_BASE_URL}/campaigns?${params}`);
    return response as ApiResponse<QRCampaign[]>;
  } catch (error) {
    logger.error('[AdsQrService] Failed to get campaigns:', error);
    return { success: false, error: 'Failed to load campaigns' };
  }
}

/**
 * Scan QR code and claim reward
 */
export async function scanQRCode(
  qrData: string,
  userId: string,
  location?: { lat: number; lng: number }
): Promise<ApiResponse<QRScanResult>> {
  try {
    const response = await apiClient.post(`${ADS_QR_BASE_URL}/scan`, {
      qrData,
      userId,
      location,
      timestamp: new Date().toISOString(),
    });
    return response as ApiResponse<QRScanResult>;
  } catch (error) {
    logger.error('[AdsQrService] Failed to scan QR:', error);
    return { success: false, error: 'Failed to scan QR code' };
  }
}

/**
 * Get QR campaign details
 */
export async function getCampaignDetails(
  campaignId: string
): Promise<ApiResponse<QRCampaign>> {
  try {
    const response = await apiClient.get(`${ADS_QR_BASE_URL}/campaigns/${campaignId}`);
    return response as ApiResponse<QRCampaign>;
  } catch (error) {
    logger.error('[AdsQrService] Failed to get campaign:', error);
    return { success: false, error: 'Failed to load campaign' };
  }
}

/**
 * Get user's QR campaign history
 */
export async function getUserQRCampaignHistory(
  userId: string,
  limit: number = 20
): Promise<ApiResponse<Array<{
  campaign: QRCampaign;
  scannedAt: string;
  claimed: boolean;
  reward?: { type: string; amount: number };
}>>> {
  try {
    const response = await apiClient.get(`${ADS_QR_BASE_URL}/user/${userId}/history?limit=${limit}`);
    return response as ApiResponse<Array<{
      campaign: QRCampaign;
      scannedAt: string;
      claimed: boolean;
      reward?: { type: string; amount: number };
    }>>;
  } catch (error) {
    logger.error('[AdsQrService] Failed to get history:', error);
    return { success: false, error: 'Failed to load history' };
  }
}

/**
 * Get campaign analytics
 */
export async function getCampaignAnalytics(
  campaignId: string,
  period?: { start: string; end: string }
): Promise<ApiResponse<QRAnalytics>> {
  try {
    const params = new URLSearchParams();
    if (period?.start) params.append('start', period.start);
    if (period?.end) params.append('end', period.end);

    const response = await apiClient.get(
      `${ADS_QR_BASE_URL}/campaigns/${campaignId}/analytics${params.toString() ? `?${params}` : ''}`
    );
    return response as ApiResponse<QRAnalytics>;
  } catch (error) {
    logger.error('[AdsQrService] Failed to get analytics:', error);
    return { success: false, error: 'Failed to load analytics' };
  }
}

/**
 * Get nearby QR campaigns based on location
 */
export async function getNearbyQRCampaigns(
  lat: number,
  lng: number,
  radiusKm: number = 5
): Promise<ApiResponse<QRCampaign[]>> {
  try {
    const response = await apiClient.get(
      `${ADS_QR_BASE_URL}/campaigns/nearby?lat=${lat}&lng=${lng}&radius=${radiusKm}`
    );
    return response as ApiResponse<QRCampaign[]>;
  } catch (error) {
    logger.error('[AdsQrService] Failed to get nearby campaigns:', error);
    return { success: false, error: 'Failed to load nearby campaigns' };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const adsQrService = {
  getAvailableCampaigns,
  scanQRCode,
  getCampaignDetails,
  getUserQRCampaignHistory,
  getCampaignAnalytics,
  getNearbyQRCampaigns,
};

export default adsQrService;
```

---

## Part 4: Environment Variables

Add these to `REZ-Consumer/rez-app/.env`:

```bash
# DOOH Services
EXPO_PUBLIC_DOOH_SERVICE_URL=https://rez-dooh-service.onrender.com
EXPO_PUBLIC_DOOH_ATTRIBUTION_URL=https://REZ-dooh-attribution-service.onrender.com

# Engagement Platform
EXPO_PUBLIC_ENGAGEMENT_SERVICE_URL=https://REZ-engagement-platform.onrender.com

# Email Service
EXPO_PUBLIC_EMAIL_SERVICE_URL=https://REZ-communications-platform.onrender.com

# Ads QR Campaigns
EXPO_PUBLIC_ADS_QR_URL=https://adsqr.onrender.com

# Corporate Service (already exists)
EXPO_PUBLIC_CORPORATE_SERVICE_URL=https://rez-corporate-service.onrender.com

# Journey Service (already exists)
EXPO_PUBLIC_JOURNEY_SERVICE_URL=https://REZ-journey-service.onrender.com
```

---

## Part 5: Integration Priorities

### High Priority (Implement in Sprint 1)

| Integration | File to Create | Benefit |
|------------|----------------|---------|
| DOOH Screens | `doohService.ts` | Discover nearby screens, track impressions |
| DOOH Attribution | `doohAttributionService.ts` | Cross-channel attribution |
| QR Campaigns | `adsQrService.ts` | Earn rewards scanning QR codes |

### Medium Priority (Sprint 2)

| Integration | File to Create | Benefit |
|------------|----------------|---------|
| Engagement Platform | `engagementService.ts` | Loyalty points, offers, badges, streaks |
| Email Service | `emailService.ts` | Transactional emails, order updates |

### Low Priority (Future)

| Integration | Notes |
|-------------|-------|
| WhatsApp Commerce | Requires WhatsApp Business API |
| Video Ads | Requires video player integration |

---

## Part 6: Testing Recommendations

### Unit Tests

```typescript
// Example test structure for doohService.ts
describe('DOOH Service', () => {
  describe('getNearbyScreens', () => {
    it('should return screens within radius', async () => {
      const result = await getNearbyScreens(28.6139, 77.2090, 5);
      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Array);
    });
  });

  describe('trackAdImpression', () => {
    it('should track impression successfully', async () => {
      const result = await trackAdImpression('screen-1', 'ad-1', 'user-1');
      expect(result.success).toBe(true);
    });
  });
});
```

### Integration Tests

```typescript
// Test DOOH attribution flow
describe('DOOH Attribution Flow', () => {
  it('should track impression and attribute conversion', async () => {
    // 1. Track impression
    const impression = await trackDOOHImpression({
      deviceId: 'device-123',
      campaignId: 'campaign-1',
      screenId: 'screen-1',
    });
    expect(impression.success).toBe(true);

    // 2. Make a purchase
    // ... purchase logic ...

    // 3. Track conversion
    const conversion = await trackDOOHConversion({
      deviceId: 'device-123',
      type: 'purchase',
      value: 500,
    });
    expect(conversion.success).toBe(true);
    expect(conversion.data?.attributedCampaigns).toContain('campaign-1');
  });
});
```

---

## Appendix A: Service URLs Reference

| Service | Environment | URL |
|---------|-------------|-----|
| rez-dooh-service | Production | https://rez-dooh-service.onrender.com |
| REZ-dooh-attribution | Production | https://REZ-dooh-attribution-service.onrender.com |
| REZ-journey-service | Production | https://REZ-journey-service.onrender.com |
| REZ-engagement-platform | Production | https://REZ-engagement-platform.onrender.com |
| REZ-communications-platform | Production | https://REZ-communications-platform.onrender.com |
| karma-service | Production | https://rez-karma-service.onrender.com |
| adsqr | Production | https://adsqr.onrender.com |
| rez-corporate-service | Production | https://rez-corporate-service.onrender.com |

---

## Appendix B: DOOH Screen Captivity Levels

| Level | Type | CPM | User Data Available |
|-------|------|-----|---------------------|
| L1 | App Feed, Search | 100-250 | Full profile |
| L2 | Hotel TV, Cab, Flight | 150-400 | Profile + captive context |
| L3 | Mall, Office, Gym | 60-150 | Context + some data |
| L4 | Billboard, Shelter | 10-50 | Context only |

---

**Document Version:** 1.0
**Last Updated:** May 19, 2026
**Author:** Platform Team
