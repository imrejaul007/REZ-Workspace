/**
 * REZ Google Hotel Ads Service
 * In-memory data store for hotel data feeds and campaigns
 */

import { v4 as uuidv4 } from 'uuid';

// Types
export enum FeedStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  ERROR = 'error',
}

export enum CampaignStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  ENDED = 'ended',
}

export enum BidStrategy {
  PER_CLICK = 'PER_CLICK',
  PER_STAY = 'PER_STAY',
  PER_BOOKING = 'PER_BOOKING',
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface HotelFeedData {
  name: string;
  address: string;
  city: string;
  country: string;
  coordinates: Coordinates;
  images: string[];
  rating?: number;
  amenities: string[];
  description?: string;
  checkInTime?: string;
  checkOutTime?: string;
}

export interface HotelListing {
  hotelId: string;
  propertyId: string;
  destinationId: string;
  feedData: HotelFeedData;
  feedStatus: FeedStatus;
  lastFeedUpdate: Date | null;
  lastError: string | null;
  verified: boolean;
  verifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PriceUpdate {
  hotelId: string;
  roomId: string;
  date: string;
  price: number;
  currency: string;
  availability: number;
  bookingUrl: string;
  synced: boolean;
  syncedAt: Date | null;
}

export interface CampaignTargeting {
  locations: string[];
  startDate?: string;
  endDate?: string;
}

export interface CampaignStats {
  impressions: number;
  clicks: number;
  bookings: number;
  spend: number;
  revenue: number;
}

export interface Campaign {
  campaignId: string;
  hotelId: string;
  campaignName: string;
  googleCampaignId: string | null;
  dailyBudget: number;
  bidStrategy: BidStrategy;
  status: CampaignStatus;
  targeting: CampaignTargeting;
  stats: CampaignStats;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory data stores
const hotelListings = new Map<string, HotelListing>();
const priceHistory = new Map<string, PriceUpdate[]>();
const campaigns = new Map<string, Campaign>();

// Helper functions
function generateId(): string {
  return uuidv4().slice(0, 8).toUpperCase();
}

// Hotel Feed Functions
export function registerHotel(
  hotelId: string,
  propertyId: string,
  destinationId: string,
  feedData: HotelFeedData
): HotelListing {
  const now = new Date();

  const listing: HotelListing = {
    hotelId,
    propertyId,
    destinationId,
    feedData,
    feedStatus: FeedStatus.PENDING,
    lastFeedUpdate: null,
    lastError: null,
    verified: false,
    verifiedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  hotelListings.set(hotelId, listing);
  return listing;
}

export function getHotelListing(hotelId: string): HotelListing | undefined {
  return hotelListings.get(hotelId);
}

export function getAllHotelListings(): HotelListing[] {
  return Array.from(hotelListings.values());
}

export function updateHotelFeedStatus(hotelId: string, status: FeedStatus, error?: string): HotelListing | undefined {
  const listing = hotelListings.get(hotelId);
  if (!listing) return undefined;

  listing.feedStatus = status;
  listing.lastFeedUpdate = new Date();
  listing.lastError = error || null;
  listing.updatedAt = new Date();

  hotelListings.set(hotelId, listing);
  return listing;
}

export function verifyHotel(hotelId: string): HotelListing | undefined {
  const listing = hotelListings.get(hotelId);
  if (!listing) return undefined;

  listing.verified = true;
  listing.verifiedAt = new Date();
  listing.feedStatus = FeedStatus.ACTIVE;
  listing.updatedAt = new Date();

  hotelListings.set(hotelId, listing);
  return listing;
}

// Price Update Functions
export function updatePrices(updates: PriceUpdate[]): { hotelId: string; count: number }[] {
  const results: { hotelId: string; count: number }[] = [];
  const byHotel = new Map<string, PriceUpdate[]>();

  for (const update of updates) {
    const existing = byHotel.get(update.hotelId) || [];
    existing.push({ ...update, synced: true, syncedAt: new Date() });
    byHotel.set(update.hotelId, existing);
  }

  for (const [hotelId, hotelUpdates] of byHotel) {
    priceHistory.set(hotelId, hotelUpdates);
    results.push({ hotelId, count: hotelUpdates.length });
  }

  return results;
}

export function getPriceHistory(hotelId: string, roomId?: string, startDate?: string, endDate?: string): PriceUpdate[] {
  const history = priceHistory.get(hotelId) || [];

  return history.filter(p => {
    if (roomId && p.roomId !== roomId) return false;
    if (startDate && p.date < startDate) return false;
    if (endDate && p.date > endDate) return false;
    return true;
  }).sort((a, b) => a.date.localeCompare(b.date));
}

// Campaign Functions
export function createCampaign(
  hotelId: string,
  campaignName: string,
  dailyBudget: number,
  bidStrategy: BidStrategy,
  targeting?: CampaignTargeting
): Campaign {
  const campaignId = `CMP-${generateId()}`;
  const now = new Date();

  const campaign: Campaign = {
    campaignId,
    hotelId,
    campaignName,
    googleCampaignId: null,
    dailyBudget,
    bidStrategy,
    status: CampaignStatus.ACTIVE,
    targeting: targeting || { locations: [] },
    stats: {
      impressions: 0,
      clicks: 0,
      bookings: 0,
      spend: 0,
      revenue: 0,
    },
    createdAt: now,
    updatedAt: now,
  };

  campaigns.set(campaignId, campaign);
  return campaign;
}

export function getCampaign(campaignId: string): Campaign | undefined {
  return campaigns.get(campaignId);
}

export function getCampaignsByHotel(hotelId: string): Campaign[] {
  const result: Campaign[] = [];
  for (const campaign of campaigns.values()) {
    if (campaign.hotelId === hotelId) {
      result.push(campaign);
    }
  }
  return result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function updateCampaign(
  campaignId: string,
  updates: Partial<Pick<Campaign, 'campaignName' | 'dailyBudget' | 'bidStrategy' | 'status' | 'targeting'>>
): Campaign | undefined {
  const campaign = campaigns.get(campaignId);
  if (!campaign) return undefined;

  Object.assign(campaign, updates, { updatedAt: new Date() });
  campaigns.set(campaignId, campaign);
  return campaign;
}

export function updateCampaignStats(
  campaignId: string,
  stats: Partial<CampaignStats>
): Campaign | undefined {
  const campaign = campaigns.get(campaignId);
  if (!campaign) return undefined;

  Object.assign(campaign.stats, stats);
  campaign.updatedAt = new Date();
  campaigns.set(campaignId, campaign);
  return campaign;
}

export function pauseCampaign(campaignId: string): Campaign | undefined {
  return updateCampaign(campaignId, { status: CampaignStatus.PAUSED });
}

export function resumeCampaign(campaignId: string): Campaign | undefined {
  return updateCampaign(campaignId, { status: CampaignStatus.ACTIVE });
}

export function endCampaign(campaignId: string): Campaign | undefined {
  return updateCampaign(campaignId, { status: CampaignStatus.ENDED });
}

// Analytics Functions
export function getCampaignStats(hotelId: string): {
  totalCampaigns: number;
  activeCampaigns: number;
  totalImpressions: number;
  totalClicks: number;
  totalBookings: number;
  totalSpend: number;
  totalRevenue: number;
  avgCTR: number;
  avgConversionRate: number;
  roas: number;
} {
  const hotelCampaigns = getCampaignsByHotel(hotelId);

  const totals = hotelCampaigns.reduce(
    (acc, c) => ({
      impressions: acc.impressions + c.stats.impressions,
      clicks: acc.clicks + c.stats.clicks,
      bookings: acc.bookings + c.stats.bookings,
      spend: acc.spend + c.stats.spend,
      revenue: acc.revenue + c.stats.revenue,
    }),
    { impressions: 0, clicks: 0, bookings: 0, spend: 0, revenue: 0 }
  );

  const activeCampaigns = hotelCampaigns.filter(c => c.status === CampaignStatus.ACTIVE);

  return {
    totalCampaigns: hotelCampaigns.length,
    activeCampaigns: activeCampaigns.length,
    totalImpressions: totals.impressions,
    totalClicks: totals.clicks,
    totalBookings: totals.bookings,
    totalSpend: totals.spend,
    totalRevenue: totals.revenue,
    avgCTR: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
    avgConversionRate: totals.clicks > 0 ? (totals.bookings / totals.clicks) * 100 : 0,
    roas: totals.spend > 0 ? totals.revenue / totals.spend : 0,
  };
}

// Reset function for testing
export function resetStore(): void {
  hotelListings.clear();
  priceHistory.clear();
  campaigns.clear();
}
