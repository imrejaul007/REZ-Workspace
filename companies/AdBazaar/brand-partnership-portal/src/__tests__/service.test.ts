/** Brand Partnership Portal - Service Tests */
import { BrandService } from '../services/brandService';
import { CampaignService } from '../services/campaignService';
import { ProposalService } from '../services/proposalService';

jest.mock('../models', () => ({
  Brand: { find: jest.fn(), findById: jest.fn(), create: jest.fn(), findByIdAndUpdate: jest.fn() },
  Campaign: { find: jest.fn(), findById: jest.fn(), create: jest.fn(), findByIdAndUpdate: jest.fn() },
  Proposal: { find: jest.fn(), create: jest.fn(), findByIdAndUpdate: jest.fn() },
  Application: { find: jest.fn(), create: jest.fn(), findByIdAndUpdate: jest.fn() },
  Contract: { create: jest.fn(), findById: jest.fn() },
}));

describe('BrandService', () => {
  let service: BrandService;
  beforeEach(() => { jest.clearAllMocks(); service = new BrandService(); });

  describe('registerBrand', () => {
    it('should register new brand', async () => {
      const Brand = require('../models').Brand;
      Brand.create.mockResolvedValue(createMockBrand());
      const result = await service.registerBrand({ name: 'Test Brand', industry: 'fashion', website: 'https://test.com' });
      expect(result.name).toBe('Test Brand');
    });
  });

  describe('getBrands', () => {
    it('should return all brands', async () => {
      const Brand = require('../models').Brand;
      Brand.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([createMockBrand(), createMockBrand({ name: 'Brand 2' })]) });
      const result = await service.getBrands({});
      expect(result).toHaveLength(2);
    });
  });

  describe('updateBrand', () => {
    it('should update brand info', async () => {
      const Brand = require('../models').Brand;
      Brand.findByIdAndUpdate.mockResolvedValue(createMockBrand({ budget: 75000 }));
      const result = await service.updateBrand('brand-123', { budget: 75000 });
      expect(result?.budget).toBe(75000);
    });
  });
});

describe('CampaignService', () => {
  let service: CampaignService;
  beforeEach(() => { jest.clearAllMocks(); service = new CampaignService(); });

  describe('createCampaign', () => {
    it('should create campaign', async () => {
      const Campaign = require('../models').Campaign;
      Campaign.create.mockResolvedValue(createMockCampaign());
      const result = await service.createCampaign({ brandId: 'brand-123', name: 'Test Campaign', budget: 10000 });
      expect(result.name).toBe('Test Campaign');
    });
  });

  describe('getCampaigns', () => {
    it('should return campaigns', async () => {
      const Campaign = require('../models').Campaign;
      Campaign.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([createMockCampaign()]) });
      const result = await service.getCampaigns({ brandId: 'brand-123' });
      expect(result).toHaveLength(1);
    });
  });

  describe('updateCampaignStatus', () => {
    it('should update campaign status', async () => {
      const Campaign = require('../models').Campaign;
      Campaign.findByIdAndUpdate.mockResolvedValue(createMockCampaign({ status: 'active' }));
      const result = await service.updateCampaignStatus('camp-123', 'active');
      expect(result?.status).toBe('active');
    });
  });
});

describe('ProposalService', () => {
  let service: ProposalService;
  beforeEach(() => { jest.clearAllMocks(); service = new ProposalService(); });

  describe('submitProposal', () => {
    it('should submit proposal', async () => {
      const Proposal = require('../models').Proposal;
      Proposal.create.mockResolvedValue(createMockProposal());
      const result = await service.submitProposal({ campaignId: 'camp-123', influencerId: 'inf-123', amount: 5000 });
      expect(result.status).toBe('pending');
    });
  });

  describe('getProposals', () => {
    it('should return proposals', async () => {
      const Proposal = require('../models').Proposal;
      Proposal.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([createMockProposal()]) });
      const result = await service.getProposals({ campaignId: 'camp-123' });
      expect(result).toHaveLength(1);
    });
  });

  describe('acceptProposal', () => {
    it('should accept proposal', async () => {
      const Proposal = require('../models').Proposal;
      Proposal.findByIdAndUpdate.mockResolvedValue(createMockProposal({ status: 'accepted' }));
      const result = await service.updateProposalStatus('prop-123', 'accepted');
      expect(result?.status).toBe('accepted');
    });
  });
});