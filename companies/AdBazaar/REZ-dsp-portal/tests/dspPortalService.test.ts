/**
 * DSP Portal - Service Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DSPPortalService } from '../src/services/DSPPortalService.js';

describe('DSPPortalService', () => {
  let service: DSPPortalService;

  beforeEach(() => {
    service = new DSPPortalService();
  });

  describe('registerAdvertiser', () => {
    it('should create advertiser with correct data', async () => {
      const result = await service.registerAdvertiser({
        name: 'Test User',
        email: 'test@example.com',
        company: 'Test Corp',
        website: 'https://test.com',
      });

      expect(result.name).toBe('Test User');
      expect(result.email).toBe('test@example.com');
      expect(result.company).toBe('Test Corp');
      expect(result.website).toBe('https://test.com');
      expect(result.status).toBe('pending');
      expect(result.balance).toBe(0);
      expect(result.id).toMatch(/^adv-/);
    });
  });

  describe('getAdvertiser', () => {
    it('should return advertiser when exists', async () => {
      const created = await service.registerAdvertiser({
        name: 'Test',
        email: 'test@test.com',
        company: 'TestCo',
      });

      const result = await service.getAdvertiser(created.id);
      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
    });

    it('should return null for non-existent', async () => {
      const result = await service.getAdvertiser('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('createCampaign', () => {
    it('should create campaign linked to advertiser', async () => {
      const advertiser = await service.registerAdvertiser({
        name: 'Test',
        email: 'test@test.com',
        company: 'TestCo',
      });

      const campaign = await service.createCampaign(advertiser.id, {
        name: 'Test Campaign',
        objective: 'awareness',
        budget: { total: 5000 },
        bidding: { type: 'cpm', maxBid: 10 },
        targeting: { locations: ['Mumbai'] },
      });

      expect(campaign.name).toBe('Test Campaign');
      expect(campaign.advertiserId).toBe(advertiser.id);
      expect(campaign.status).toBe('draft');
      expect(campaign.budget.total).toBe(5000);
      expect(campaign.id).toMatch(/^camp-/);
    });

    it('should throw when advertiser not found', async () => {
      await expect(
        service.createCampaign('non-existent', {
          name: 'Test',
          objective: 'awareness',
          budget: { total: 1000 },
          bidding: { type: 'cpm', maxBid: 5 },
          targeting: {},
        })
      ).rejects.toThrow('Advertiser not found');
    });
  });

  describe('launchCampaign', () => {
    it('should change status to active', async () => {
      const advertiser = await service.registerAdvertiser({
        name: 'Test',
        email: 'test@test.com',
        company: 'TestCo',
      });

      const campaign = await service.createCampaign(advertiser.id, {
        name: 'Test Campaign',
        objective: 'awareness',
        budget: { total: 5000 },
        bidding: { type: 'cpm', maxBid: 10 },
        targeting: {},
      });

      await service.launchCampaign(campaign.id);
      
      const updated = await service.getCampaign(campaign.id);
      expect(updated?.status).toBe('active');
    });

    it('should throw for non-existent campaign', async () => {
      await expect(service.launchCampaign('non-existent')).rejects.toThrow(
        'Campaign not found'
      );
    });
  });

  describe('pauseCampaign', () => {
    it('should change status to paused', async () => {
      const advertiser = await service.registerAdvertiser({
        name: 'Test',
        email: 'test@test.com',
        company: 'TestCo',
      });

      const campaign = await service.createCampaign(advertiser.id, {
        name: 'Test Campaign',
        objective: 'awareness',
        budget: { total: 5000 },
        bidding: { type: 'cpm', maxBid: 10 },
        targeting: {},
      });

      await service.launchCampaign(campaign.id);
      await service.pauseCampaign(campaign.id);
      
      const updated = await service.getCampaign(campaign.id);
      expect(updated?.status).toBe('paused');
    });
  });

  describe('completeCampaign', () => {
    it('should change status to completed', async () => {
      const advertiser = await service.registerAdvertiser({
        name: 'Test',
        email: 'test@test.com',
        company: 'TestCo',
      });

      const campaign = await service.createCampaign(advertiser.id, {
        name: 'Test Campaign',
        objective: 'awareness',
        budget: { total: 5000 },
        bidding: { type: 'cpm', maxBid: 10 },
        targeting: {},
      });

      await service.completeCampaign(campaign.id);
      
      const updated = await service.getCampaign(campaign.id);
      expect(updated?.status).toBe('completed');
    });
  });

  describe('deleteCampaign', () => {
    it('should delete draft campaign', async () => {
      const advertiser = await service.registerAdvertiser({
        name: 'Test',
        email: 'test@test.com',
        company: 'TestCo',
      });

      const campaign = await service.createCampaign(advertiser.id, {
        name: 'Test Campaign',
        objective: 'awareness',
        budget: { total: 5000 },
        bidding: { type: 'cpm', maxBid: 10 },
        targeting: {},
      });

      const result = await service.deleteCampaign(campaign.id);
      expect(result).toBe(true);
      expect(await service.getCampaign(campaign.id)).toBeNull();
    });

    it('should throw for active campaign', async () => {
      const advertiser = await service.registerAdvertiser({
        name: 'Test',
        email: 'test@test.com',
        company: 'TestCo',
      });

      const campaign = await service.createCampaign(advertiser.id, {
        name: 'Test Campaign',
        objective: 'awareness',
        budget: { total: 5000 },
        bidding: { type: 'cpm', maxBid: 10 },
        targeting: {},
      });

      await service.launchCampaign(campaign.id);
      await expect(service.deleteCampaign(campaign.id)).rejects.toThrow(
        'Cannot delete active campaign'
      );
    });
  });

  describe('estimateReach', () => {
    it('should calculate impressions based on budget', async () => {
      const result = await service.estimateReach({}, 4000);

      expect(result.impressions).toBe(1000000); // 4000 / 4 * 1000
      expect(result.reach).toBeGreaterThan(0);
      expect(result.frequency).toBeGreaterThan(0);
    });

    it('should handle zero budget', async () => {
      const result = await service.estimateReach({}, 0);
      expect(result.impressions).toBe(0);
    });
  });

  describe('addFunds', () => {
    it('should add funds to advertiser balance', async () => {
      const advertiser = await service.registerAdvertiser({
        name: 'Test',
        email: 'test@test.com',
        company: 'TestCo',
      });

      const result = await service.addFunds(advertiser.id, 1000);

      expect(result.newBalance).toBe(1000);
      expect(result.transactionId).toMatch(/^txn-/);
    });

    it('should return null for non-existent advertiser', async () => {
      const result = await service.addFunds('non-existent', 1000);
      expect(result).toBeNull();
    });
  });

  describe('getBillingSummary', () => {
    it('should return billing info for advertiser', async () => {
      const advertiser = await service.registerAdvertiser({
        name: 'Test',
        email: 'test@test.com',
        company: 'TestCo',
      });

      const result = await service.getBillingSummary(advertiser.id);

      expect(result).not.toBeNull();
      expect(result!.balance).toBe(0);
      expect(result!.invoices).toBeDefined();
      expect(Array.isArray(result!.invoices)).toBe(true);
    });

    it('should return null for non-existent', async () => {
      const result = await service.getBillingSummary('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('getCampaignMetrics', () => {
    it('should return metrics for campaign', async () => {
      const advertiser = await service.registerAdvertiser({
        name: 'Test',
        email: 'test@test.com',
        company: 'TestCo',
      });

      const campaign = await service.createCampaign(advertiser.id, {
        name: 'Test Campaign',
        objective: 'awareness',
        budget: { total: 5000 },
        bidding: { type: 'cpm', maxBid: 10 },
        targeting: {},
      });

      const metrics = await service.getCampaignMetrics(campaign.id);
      expect(metrics).not.toBeNull();
      expect(metrics!.impressions).toBe(0); // New campaign
    });

    it('should return null for non-existent', async () => {
      const result = await service.getCampaignMetrics('non-existent');
      expect(result).toBeNull();
    });
  });
});
