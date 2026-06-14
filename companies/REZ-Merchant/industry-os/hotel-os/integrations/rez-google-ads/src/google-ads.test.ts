/**
 * REZ Google Hotel Ads Service Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  FeedStatus,
  CampaignStatus,
  BidStrategy,
  resetStore,
  registerHotel,
  getHotelListing,
  getAllHotelListings,
  updateHotelFeedStatus,
  verifyHotel,
  updatePrices,
  getPriceHistory,
  createCampaign,
  getCampaign,
  getCampaignsByHotel,
  updateCampaign,
  updateCampaignStats,
  pauseCampaign,
  resumeCampaign,
  endCampaign,
  getCampaignStats,
} from './services/google-ads.service.js';

describe('Google Hotel Ads Service', () => {
  beforeEach(() => {
    resetStore();
  });

  // ========================
  // HOTEL FEED TESTS
  // ========================

  describe('Hotel Feed Management', () => {
    const validFeedData = {
      name: 'Grand Hotel',
      address: '123 Main St',
      city: 'Mumbai',
      country: 'India',
      coordinates: { lat: 19.076, lng: 72.8777 },
      images: ['https://example.com/hotel.jpg'],
      rating: 4.5,
      amenities: ['WiFi', 'Pool', 'Gym'],
      description: 'Luxury hotel in the heart of Mumbai',
      checkInTime: '14:00',
      checkOutTime: '11:00',
    };

    it('should register a hotel', () => {
      const listing = registerHotel('hotel-1', 'prop-123', 'dest-456', validFeedData);

      expect(listing).toBeDefined();
      expect(listing.hotelId).toBe('hotel-1');
      expect(listing.propertyId).toBe('prop-123');
      expect(listing.destinationId).toBe('dest-456');
      expect(listing.feedData.name).toBe('Grand Hotel');
      expect(listing.feedStatus).toBe(FeedStatus.PENDING);
      expect(listing.verified).toBe(false);
    });

    it('should get hotel by ID', () => {
      registerHotel('hotel-2', 'prop-456', 'dest-789', validFeedData);
      const listing = getHotelListing('hotel-2');

      expect(listing?.propertyId).toBe('prop-456');
    });

    it('should get all hotels', () => {
      registerHotel('hotel-a', 'p1', 'd1', validFeedData);
      registerHotel('hotel-b', 'p2', 'd2', validFeedData);
      registerHotel('hotel-c', 'p3', 'd3', validFeedData);

      const hotels = getAllHotelListings();
      expect(hotels).toHaveLength(3);
    });

    it('should update feed status', () => {
      registerHotel('hotel-1', 'prop-1', 'dest-1', validFeedData);
      const updated = updateHotelFeedStatus('hotel-1', FeedStatus.ACTIVE);

      expect(updated?.feedStatus).toBe(FeedStatus.ACTIVE);
      expect(updated?.lastFeedUpdate).toBeInstanceOf(Date);
    });

    it('should update feed status with error', () => {
      registerHotel('hotel-2', 'prop-2', 'dest-2', validFeedData);
      const updated = updateHotelFeedStatus('hotel-2', FeedStatus.ERROR, 'Invalid property data');

      expect(updated?.feedStatus).toBe(FeedStatus.ERROR);
      expect(updated?.lastError).toBe('Invalid property data');
    });

    it('should verify hotel', () => {
      registerHotel('hotel-3', 'prop-3', 'dest-3', validFeedData);
      const verified = verifyHotel('hotel-3');

      expect(verified?.verified).toBe(true);
      expect(verified?.verifiedAt).toBeInstanceOf(Date);
      expect(verified?.feedStatus).toBe(FeedStatus.ACTIVE);
    });

    it('should return undefined for non-existent hotel', () => {
      const listing = getHotelListing('non-existent');
      expect(listing).toBeUndefined();
    });
  });

  // ========================
  // PRICE UPDATE TESTS
  // ========================

  describe('Price Updates', () => {
    it('should update prices for multiple hotels', () => {
      const updates = [
        {
          hotelId: 'hotel-1',
          roomId: 'room-101',
          date: '2026-06-15',
          price: 5000,
          currency: 'INR',
          availability: 5,
          bookingUrl: 'https://stayown.com/book/101',
        },
        {
          hotelId: 'hotel-1',
          roomId: 'room-102',
          date: '2026-06-15',
          price: 7500,
          currency: 'INR',
          availability: 3,
          bookingUrl: 'https://stayown.com/book/102',
        },
        {
          hotelId: 'hotel-2',
          roomId: 'room-201',
          date: '2026-06-15',
          price: 4500,
          currency: 'INR',
          availability: 8,
          bookingUrl: 'https://stayown.com/book/201',
        },
      ];

      const results = updatePrices(updates);

      expect(results).toHaveLength(2); // 2 hotels
      expect(results.find(r => r.hotelId === 'hotel-1')?.count).toBe(2);
      expect(results.find(r => r.hotelId === 'hotel-2')?.count).toBe(1);
    });

    it('should get price history', () => {
      updatePrices([
        { hotelId: 'hotel-1', roomId: 'room-101', date: '2026-06-10', price: 4000, currency: 'INR', availability: 5, bookingUrl: 'https://x.com/b' },
        { hotelId: 'hotel-1', roomId: 'room-101', date: '2026-06-15', price: 5000, currency: 'INR', availability: 3, bookingUrl: 'https://x.com/b' },
        { hotelId: 'hotel-1', roomId: 'room-101', date: '2026-06-20', price: 4500, currency: 'INR', availability: 4, bookingUrl: 'https://x.com/b' },
      ]);

      const history = getPriceHistory('hotel-1');
      expect(history).toHaveLength(3);
      expect(history[0].date).toBe('2026-06-10');
    });

    it('should filter price history by room', () => {
      updatePrices([
        { hotelId: 'hotel-1', roomId: 'room-101', date: '2026-06-15', price: 5000, currency: 'INR', availability: 3, bookingUrl: 'https://x.com/b' },
        { hotelId: 'hotel-1', roomId: 'room-102', date: '2026-06-15', price: 6000, currency: 'INR', availability: 2, bookingUrl: 'https://x.com/b' },
      ]);

      const history = getPriceHistory('hotel-1', 'room-101');
      expect(history).toHaveLength(1);
      expect(history[0].roomId).toBe('room-101');
    });

    it('should filter price history by date range', () => {
      updatePrices([
        { hotelId: 'hotel-1', roomId: 'room-101', date: '2026-06-10', price: 4000, currency: 'INR', availability: 5, bookingUrl: 'https://x.com/b' },
        { hotelId: 'hotel-1', roomId: 'room-101', date: '2026-06-15', price: 5000, currency: 'INR', availability: 3, bookingUrl: 'https://x.com/b' },
        { hotelId: 'hotel-1', roomId: 'room-101', date: '2026-06-25', price: 4500, currency: 'INR', availability: 4, bookingUrl: 'https://x.com/b' },
      ]);

      const history = getPriceHistory('hotel-1', undefined, '2026-06-12', '2026-06-20');
      expect(history).toHaveLength(1);
      expect(history[0].date).toBe('2026-06-15');
    });
  });

  // ========================
  // CAMPAIGN TESTS
  // ========================

  describe('Campaign Management', () => {
    it('should create a campaign', () => {
      const campaign = createCampaign(
        'hotel-1',
        'Summer Sale 2026',
        50000,
        BidStrategy.PER_STAY,
        { locations: ['IN', 'US', 'UK'] }
      );

      expect(campaign).toBeDefined();
      expect(campaign.campaignId).toMatch(/^CMP-[A-Z0-9]+$/);
      expect(campaign.hotelId).toBe('hotel-1');
      expect(campaign.campaignName).toBe('Summer Sale 2026');
      expect(campaign.dailyBudget).toBe(50000);
      expect(campaign.bidStrategy).toBe(BidStrategy.PER_STAY);
      expect(campaign.status).toBe(CampaignStatus.ACTIVE);
      expect(campaign.stats.impressions).toBe(0);
    });

    it('should get campaign by ID', () => {
      const created = createCampaign('hotel-1', 'Test Campaign', 10000, BidStrategy.PER_CLICK);
      const found = getCampaign(created.campaignId);

      expect(found?.campaignId).toBe(created.campaignId);
    });

    it('should get campaigns by hotel', () => {
      createCampaign('hotel-1', 'Campaign 1', 10000, BidStrategy.PER_CLICK);
      createCampaign('hotel-1', 'Campaign 2', 20000, BidStrategy.PER_STAY);
      createCampaign('hotel-2', 'Campaign 3', 15000, BidStrategy.PER_BOOKING);

      const hotel1Campaigns = getCampaignsByHotel('hotel-1');
      expect(hotel1Campaigns).toHaveLength(2);
    });

    it('should update campaign', () => {
      const campaign = createCampaign('hotel-1', 'Old Name', 10000, BidStrategy.PER_CLICK);
      const updated = updateCampaign(campaign.campaignId, {
        campaignName: 'New Name',
        dailyBudget: 20000,
      });

      expect(updated?.campaignName).toBe('New Name');
      expect(updated?.dailyBudget).toBe(20000);
    });

    it('should pause campaign', () => {
      const campaign = createCampaign('hotel-1', 'Test', 10000, BidStrategy.PER_CLICK);
      const paused = pauseCampaign(campaign.campaignId);

      expect(paused?.status).toBe(CampaignStatus.PAUSED);
    });

    it('should resume campaign', () => {
      const campaign = createCampaign('hotel-1', 'Test', 10000, BidStrategy.PER_CLICK);
      pauseCampaign(campaign.campaignId);
      const resumed = resumeCampaign(campaign.campaignId);

      expect(resumed?.status).toBe(CampaignStatus.ACTIVE);
    });

    it('should end campaign', () => {
      const campaign = createCampaign('hotel-1', 'Test', 10000, BidStrategy.PER_CLICK);
      const ended = endCampaign(campaign.campaignId);

      expect(ended?.status).toBe(CampaignStatus.ENDED);
    });

    it('should update campaign stats', () => {
      const campaign = createCampaign('hotel-1', 'Test', 10000, BidStrategy.PER_CLICK);
      const updated = updateCampaignStats(campaign.campaignId, {
        impressions: 10000,
        clicks: 500,
        bookings: 50,
        spend: 5000,
        revenue: 25000,
      });

      expect(updated?.stats.impressions).toBe(10000);
      expect(updated?.stats.clicks).toBe(500);
      expect(updated?.stats.bookings).toBe(50);
    });

    it('should return undefined for non-existent campaign', () => {
      const found = getCampaign('non-existent');
      expect(found).toBeUndefined();
    });
  });

  // ========================
  // ANALYTICS TESTS
  // ========================

  describe('Analytics', () => {
    it('should calculate campaign stats', () => {
      createCampaign('hotel-1', 'Campaign 1', 10000, BidStrategy.PER_CLICK);
      const campaign2 = createCampaign('hotel-1', 'Campaign 2', 15000, BidStrategy.PER_STAY);

      updateCampaignStats(campaign2.campaignId, {
        impressions: 50000,
        clicks: 2000,
        bookings: 100,
        spend: 10000,
        revenue: 50000,
      });

      const stats = getCampaignStats('hotel-1');

      expect(stats.totalCampaigns).toBe(2);
      expect(stats.totalImpressions).toBe(50000);
      expect(stats.totalClicks).toBe(2000);
      expect(stats.totalBookings).toBe(100);
      expect(stats.totalSpend).toBe(10000);
      expect(stats.totalRevenue).toBe(50000);
      expect(stats.roas).toBe(5);
    });

    it('should calculate CTR correctly', () => {
      const campaign = createCampaign('hotel-1', 'Test', 10000, BidStrategy.PER_CLICK);
      updateCampaignStats(campaign.campaignId, {
        impressions: 100000,
        clicks: 2500,
      });

      const stats = getCampaignStats('hotel-1');
      expect(stats.avgCTR).toBe(2.5);
    });

    it('should handle zero values gracefully', () => {
      const stats = getCampaignStats('empty-hotel');

      expect(stats.totalCampaigns).toBe(0);
      expect(stats.roas).toBe(0);
      expect(stats.avgCTR).toBe(0);
    });

    it('should count active campaigns', () => {
      createCampaign('hotel-1', 'Active 1', 10000, BidStrategy.PER_CLICK);
      createCampaign('hotel-1', 'Active 2', 10000, BidStrategy.PER_CLICK);
      const paused = createCampaign('hotel-1', 'Paused', 10000, BidStrategy.PER_CLICK);
      pauseCampaign(paused.campaignId);

      const stats = getCampaignStats('hotel-1');
      expect(stats.totalCampaigns).toBe(3);
      expect(stats.activeCampaigns).toBe(2);
    });
  });

  // ========================
  // EDGE CASES
  // ========================

  describe('Edge Cases', () => {
    it('should handle all bid strategies', () => {
      const strategies = Object.values(BidStrategy);

      for (const strategy of strategies) {
        const campaign = createCampaign('hotel-1', `Campaign ${strategy}`, 10000, strategy);
        expect(campaign.bidStrategy).toBe(strategy);
      }
    });

    it('should handle all campaign statuses', () => {
      const statuses = Object.values(CampaignStatus);

      for (const status of statuses) {
        const campaign = createCampaign('hotel-1', `Campaign ${status}`, 10000, BidStrategy.PER_CLICK);
        updateCampaign(campaign.campaignId, { status });
        const found = getCampaign(campaign.campaignId);
        expect(found?.status).toBe(status);
      }
    });

    it('should handle empty targeting', () => {
      const campaign = createCampaign('hotel-1', 'No Targeting', 10000, BidStrategy.PER_CLICK);

      expect(campaign.targeting).toBeDefined();
      expect(campaign.targeting.locations).toEqual([]);
    });

    it('should handle partial price history', () => {
      const history = getPriceHistory('non-existent-hotel');
      expect(history).toHaveLength(0);
    });

    it('should update only specified fields', () => {
      const campaign = createCampaign('hotel-1', 'Original', 10000, BidStrategy.PER_CLICK);
      updateCampaign(campaign.campaignId, { dailyBudget: 20000 });

      const found = getCampaign(campaign.campaignId);
      expect(found?.campaignName).toBe('Original');
      expect(found?.dailyBudget).toBe(20000);
      expect(found?.bidStrategy).toBe(BidStrategy.PER_CLICK);
    });
  });
});
