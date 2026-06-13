// Mock Buyer model for service testing
const mockBuyer = {
  buyerId: 'BUYER-001',
  tenantId: 'TENANT-001',
  profile: {
    name: { first: 'John', last: 'Doe' },
    email: 'john@example.com',
    phone: '1234567890'
  },
  status: {
    current: 'active',
    stage: 'searching',
    lastActivity: new Date(),
    viewingCount: 0
  }
};

const mockBuyerModel = {
  findOne: jest.fn(),
  find: jest.fn(),
  findOneAndUpdate: jest.fn(),
  create: jest.fn(),
  countDocuments: jest.fn(),
  aggregate: jest.fn()
};

// Mock the models module with correct path
jest.mock('../src/models/index', () => ({
  Buyer: mockBuyerModel
}));

// Now import the service (after mocking)
import { buyerService } from '../src/services/buyer.service';

describe('BuyerService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createBuyer', () => {
    it('should create a new buyer successfully', async () => {
      mockBuyerModel.findOne.mockResolvedValue(null);
      mockBuyerModel.create.mockResolvedValue(mockBuyer);

      const result = await buyerService.createBuyer({
        buyerId: 'BUYER-001',
        tenantId: 'TENANT-001',
        profile: {
          name: { first: 'John', last: 'Doe' },
          email: 'john@example.com',
          phone: '1234567890'
        }
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockBuyer);
    });

    it('should return error if buyer already exists', async () => {
      mockBuyerModel.findOne.mockResolvedValue({ buyerId: 'BUYER-001' });

      const result = await buyerService.createBuyer({
        buyerId: 'BUYER-001',
        tenantId: 'TENANT-001',
        profile: {
          name: { first: 'John', last: 'Doe' },
          email: 'john@example.com',
          phone: '1234567890'
        }
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Buyer already exists');
    });

    it('should handle database errors', async () => {
      mockBuyerModel.findOne.mockRejectedValue(new Error('Database error'));

      const result = await buyerService.createBuyer({
        buyerId: 'BUYER-001',
        tenantId: 'TENANT-001',
        profile: {
          name: { first: 'John', last: 'Doe' },
          email: 'john@example.com',
          phone: '1234567890'
        }
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });

  describe('getBuyer', () => {
    it('should return buyer when found', async () => {
      mockBuyerModel.findOne.mockResolvedValue(mockBuyer);

      const result = await buyerService.getBuyer('BUYER-001', 'TENANT-001');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockBuyer);
    });

    it('should return error when buyer not found', async () => {
      mockBuyerModel.findOne.mockResolvedValue(null);

      const result = await buyerService.getBuyer('BUYER-999', 'TENANT-001');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Buyer not found');
    });
  });

  describe('listBuyers', () => {
    it('should return paginated list of buyers', async () => {
      const mockBuyers = [
        { buyerId: 'BUYER-001', profile: { name: { first: 'John' } } },
        { buyerId: 'BUYER-002', profile: { name: { first: 'Jane' } } }
      ];

      mockBuyerModel.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockBuyers)
      });
      mockBuyerModel.countDocuments.mockResolvedValue(2);

      const result = await buyerService.listBuyers('TENANT-001', {
        page: 1,
        limit: 20
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockBuyers);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        pages: 1
      });
    });

    it('should filter by status when provided', async () => {
      mockBuyerModel.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([])
      });
      mockBuyerModel.countDocuments.mockResolvedValue(0);

      await buyerService.listBuyers('TENANT-001', {
        status: 'active',
        page: 1,
        limit: 20
      });

      expect(mockBuyerModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'TENANT-001',
          'status.current': 'active'
        })
      );
    });
  });

  describe('updateBuyer', () => {
    it('should update buyer successfully', async () => {
      const updatedBuyer = { ...mockBuyer, profile: { name: { first: 'Jane' } } };
      mockBuyerModel.findOneAndUpdate.mockResolvedValue(updatedBuyer);

      const result = await buyerService.updateBuyer(
        'BUYER-001',
        { profile: { name: { first: 'Jane' } } },
        'TENANT-001'
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(updatedBuyer);
    });

    it('should return error when buyer not found', async () => {
      mockBuyerModel.findOneAndUpdate.mockResolvedValue(null);

      const result = await buyerService.updateBuyer(
        'BUYER-999',
        { profile: { name: { first: 'Jane' } } },
        'TENANT-001'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Buyer not found');
    });
  });

  describe('deleteBuyer', () => {
    it('should soft delete buyer by setting status to inactive', async () => {
      const deletedBuyer = { ...mockBuyer, status: { current: 'inactive' } };
      mockBuyerModel.findOneAndUpdate.mockResolvedValue(deletedBuyer);

      const result = await buyerService.deleteBuyer('BUYER-001', 'TENANT-001');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Buyer deactivated');
    });
  });

  describe('assignAgent', () => {
    it('should assign agent to buyer', async () => {
      const buyerWithAgent = { ...mockBuyer, assignedAgentId: 'AGENT-001' };
      mockBuyerModel.findOneAndUpdate.mockResolvedValue(buyerWithAgent);

      const result = await buyerService.assignAgent('BUYER-001', 'AGENT-001', 'TENANT-001');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(buyerWithAgent);
    });
  });

  describe('recordPropertyInteraction', () => {
    it('should record view interaction', async () => {
      const buyerAfterView = {
        ...mockBuyer,
        history: { propertiesViewed: ['PROP-001'] },
        status: { ...mockBuyer.status, viewingCount: 1 }
      };
      mockBuyerModel.findOneAndUpdate.mockResolvedValue(buyerAfterView);

      const result = await buyerService.recordPropertyInteraction(
        'BUYER-001',
        { propertyId: 'PROP-001', action: 'view' },
        'TENANT-001'
      );

      expect(result.success).toBe(true);
    });

    it('should record save interaction', async () => {
      const buyerAfterSave = {
        ...mockBuyer,
        history: { propertiesSaved: ['PROP-001'] }
      };
      mockBuyerModel.findOneAndUpdate.mockResolvedValue(buyerAfterSave);

      const result = await buyerService.recordPropertyInteraction(
        'BUYER-001',
        { propertyId: 'PROP-001', action: 'save' },
        'TENANT-001'
      );

      expect(result.success).toBe(true);
    });
  });

  describe('findMatchingBuyers', () => {
    it('should find buyers matching property criteria', async () => {
      const mockBuyers = [
        { buyerId: 'BUYER-001', searchCriteria: { areas: ['AREA-001'] } }
      ];

      mockBuyerModel.find.mockReturnValue({
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockBuyers)
      });
      mockBuyerModel.countDocuments.mockResolvedValue(1);

      const result = await buyerService.findMatchingBuyers({
        areas: ['AREA-001'],
        minPrice: 300000,
        maxPrice: 500000
      });

      expect(result.success).toBe(true);
      expect(result.data?.buyers).toEqual(mockBuyers);
      expect(result.data?.total).toBe(1);
    });
  });

  describe('getBuyerStats', () => {
    it('should return buyer statistics', async () => {
      const mockStats = [{
        _id: null,
        totalBuyers: 10,
        activeBuyers: 8,
        pausedBuyers: 2,
        searchingStage: 5,
        viewingStage: 2,
        negotiatingStage: 1,
        underContractStage: 1,
        closedStage: 1,
        preApproved: 6,
        goldenVisaInterested: 2,
        totalViewings: 25
      }];

      mockBuyerModel.aggregate.mockResolvedValue(mockStats);

      const result = await buyerService.getBuyerStats('TENANT-001');

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        totalBuyers: 10,
        activeBuyers: 8,
        pausedBuyers: 2,
        byStage: {
          searching: 5,
          viewing: 2,
          negotiating: 1,
          under_contract: 1,
          closed: 1
        },
        preApproved: 6,
        goldenVisaInterested: 2,
        avgViewingCount: 2.5
      });
    });

    it('should return zero stats when no buyers exist', async () => {
      mockBuyerModel.aggregate.mockResolvedValue([]);

      const result = await buyerService.getBuyerStats('TENANT-001');

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        totalBuyers: 0,
        activeBuyers: 0,
        pausedBuyers: 0,
        byStage: {
          searching: 0,
          viewing: 0,
          negotiating: 0,
          under_contract: 0,
          closed: 0
        },
        preApproved: 0,
        goldenVisaInterested: 0,
        avgViewingCount: 0
      });
    });
  });
});
