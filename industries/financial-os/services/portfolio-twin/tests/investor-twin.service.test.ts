import { InvestorTwinService } from '../src/services/investor-twin.service.js';
import { InvestorTwinModel, PortfolioTwinModel } from '../src/models/index.js';
import { resetEventEmitter } from '../src/events/index.js';

describe('InvestorTwinService', () => {
  let service: InvestorTwinService;

  beforeEach(() => {
    service = new InvestorTwinService();
    resetEventEmitter();
  });

  afterEach(async () => {
    await InvestorTwinModel.deleteMany({});
    await PortfolioTwinModel.deleteMany({});
  });

  describe('create', () => {
    it('should create a new investor twin', async () => {
      const data = {
        investor_id: 'INV-001',
        profile: {
          name: {
            first: 'John',
            last: 'Doe',
          },
          email: 'john.doe@example.com',
          phone: '+1234567890',
          investor_type: 'individual',
          accredited: true,
        },
      };

      const result = await service.create(data);

      expect(result).toBeDefined();
      expect(result.investor_id).toBe('INV-001');
      expect(result.twin_id).toBe('twin.finance.investor.INV-001');
      expect(result.profile.name.first).toBe('John');
      expect(result.profile.email).toBe('john.doe@example.com');
      expect(result.kyc.status).toBe('pending');
    });

    it('should throw error if investor already exists', async () => {
      const data = {
        investor_id: 'INV-002',
        profile: {
          name: { first: 'Jane', last: 'Doe' },
          email: 'jane.doe@example.com',
        },
      };

      await service.create(data);

      await expect(service.create(data)).rejects.toThrow('already exists');
    });

    it('should create with full data', async () => {
      const data = {
        investor_id: 'INV-003',
        profile: {
          name: { first: 'Bob', last: 'Smith', middle: 'James' },
          email: 'bob.smith@example.com',
          investor_type: 'institutional',
          accredited: true,
        },
        kyc: {
          status: 'verified',
          risk_rating: 'aggressive',
          aml_check: 'passed',
        },
        preferences: {
          investment_goals: ['retirement', 'wealth_growth'],
          risk_tolerance: 'aggressive',
          time_horizon: 'long_term',
          liquidity_needs: 'low',
          preferred_asset_classes: ['equity', 'alternatives'],
        },
        financial_profile: {
          net_worth: 5000000,
          liquid_net_worth: 2000000,
          annual_income: 500000,
          investment_capacity: 1000000,
        },
      };

      const result = await service.create(data);

      expect(result.profile.investor_type).toBe('institutional');
      expect(result.kyc.status).toBe('verified');
      expect(result.preferences.risk_tolerance).toBe('aggressive');
      expect(result.financial_profile.net_worth).toBe(5000000);
    });
  });

  describe('getById', () => {
    it('should get investor twin by investor_id', async () => {
      await service.create({
        investor_id: 'INV-GET-001',
        profile: {
          name: { first: 'Test', last: 'User' },
          email: 'test@example.com',
        },
      });

      const result = await service.getById('INV-GET-001');

      expect(result).toBeDefined();
      expect(result?.investor_id).toBe('INV-GET-001');
    });

    it('should get investor twin by twin_id', async () => {
      await service.create({
        investor_id: 'INV-GET-002',
        profile: {
          name: { first: 'Test', last: 'User' },
          email: 'test2@example.com',
        },
      });

      const result = await service.getById('twin.finance.investor.INV-GET-002');

      expect(result).toBeDefined();
      expect(result?.twin_id).toBe('twin.finance.investor.INV-GET-002');
    });

    it('should return null for non-existent investor', async () => {
      const result = await service.getById('NON-EXISTENT');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update investor twin', async () => {
      await service.create({
        investor_id: 'INV-UPD-001',
        profile: {
          name: { first: 'Original', last: 'Name' },
          email: 'original@example.com',
        },
      });

      const result = await service.update('INV-UPD-001', {
        profile: {
          name: { first: 'Updated', last: 'Name' },
          email: 'updated@example.com',
        },
      });

      expect(result).toBeDefined();
      expect(result?.profile.name.first).toBe('Updated');
      expect(result?.profile.email).toBe('updated@example.com');
    });

    it('should update preferences', async () => {
      await service.create({
        investor_id: 'INV-UPD-002',
        profile: {
          name: { first: 'Pref', last: 'Test' },
          email: 'pref@example.com',
        },
      });

      const result = await service.update('INV-UPD-002', {
        preferences: {
          risk_tolerance: 'conservative',
          time_horizon: 'short_term',
        },
      });

      expect(result?.preferences.risk_tolerance).toBe('conservative');
      expect(result?.preferences.time_horizon).toBe('short_term');
    });
  });

  describe('linkAccount', () => {
    it('should link an account to investor', async () => {
      await service.create({
        investor_id: 'INV-LINK-001',
        profile: {
          name: { first: 'Link', last: 'Test' },
          email: 'link@example.com',
        },
      });

      const result = await service.linkAccount('INV-LINK-001', {
        account_id: 'ACC-001',
        institution: 'Bank of America',
        account_type: 'brokerage',
      });

      expect(result).toBeDefined();
      expect(result?.connected_accounts).toHaveLength(1);
      expect(result?.connected_accounts[0].account_id).toBe('ACC-001');
    });

    it('should throw error if account already linked', async () => {
      await service.create({
        investor_id: 'INV-LINK-002',
        profile: {
          name: { first: 'Link', last: 'Error' },
          email: 'link2@example.com',
        },
      });

      await service.linkAccount('INV-LINK-002', {
        account_id: 'ACC-002',
        institution: 'Fidelity',
        account_type: 'brokerage',
      });

      await expect(
        service.linkAccount('INV-LINK-002', {
          account_id: 'ACC-002',
          institution: 'Fidelity',
          account_type: 'brokerage',
        })
      ).rejects.toThrow('already linked');
    });
  });

  describe('unlinkAccount', () => {
    it('should unlink an account', async () => {
      await service.create({
        investor_id: 'INV-UNLINK-001',
        profile: {
          name: { first: 'Unlink', last: 'Test' },
          email: 'unlink@example.com',
        },
      });

      await service.linkAccount('INV-UNLINK-001', {
        account_id: 'ACC-UNLINK-001',
        institution: 'Charles Schwab',
        account_type: 'brokerage',
      });

      const result = await service.unlinkAccount('INV-UNLINK-001', 'ACC-UNLINK-001');

      expect(result).toBeDefined();
      expect(result?.connected_accounts).toHaveLength(0);
    });
  });

  describe('addPortfolio', () => {
    it('should add portfolio to investor', async () => {
      await service.create({
        investor_id: 'INV-PORT-001',
        profile: {
          name: { first: 'Portfolio', last: 'Test' },
          email: 'portfolio@example.com',
        },
      });

      const result = await service.addPortfolio('INV-PORT-001', 'PORT-001');

      expect(result).toBeDefined();
      expect(result?.portfolios).toContain('PORT-001');
    });

    it('should not add duplicate portfolio', async () => {
      await service.create({
        investor_id: 'INV-PORT-002',
        profile: {
          name: { first: 'Portfolio', last: 'Dup' },
          email: 'portfolio2@example.com',
        },
      });

      await service.addPortfolio('INV-PORT-002', 'PORT-002');
      await service.addPortfolio('INV-PORT-002', 'PORT-002');

      const result = await service.getById('INV-PORT-002');
      expect(result?.portfolios).toHaveLength(1);
    });
  });

  describe('removePortfolio', () => {
    it('should remove portfolio from investor', async () => {
      await service.create({
        investor_id: 'INV-RMP-001',
        profile: {
          name: { first: 'Remove', last: 'Test' },
          email: 'remove@example.com',
        },
        portfolios: ['PORT-RM-001', 'PORT-RM-002'],
      });

      const result = await service.removePortfolio('INV-RMP-001', 'PORT-RM-001');

      expect(result).toBeDefined();
      expect(result?.portfolios).not.toContain('PORT-RM-001');
      expect(result?.portfolios).toContain('PORT-RM-002');
    });
  });

  describe('updateKYC', () => {
    it('should update KYC status', async () => {
      await service.create({
        investor_id: 'INV-KYC-001',
        profile: {
          name: { first: 'KYC', last: 'Test' },
          email: 'kyc@example.com',
        },
      });

      const result = await service.updateKYC('INV-KYC-001', {
        status: 'verified',
        risk_rating: 'moderate',
        aml_check: 'passed',
      });

      expect(result).toBeDefined();
      expect(result?.kyc.status).toBe('verified');
      expect(result?.kyc.risk_rating).toBe('moderate');
      expect(result?.kyc.aml_check).toBe('passed');
      expect(result?.kyc.verification_date).toBeDefined();
    });
  });

  describe('delete', () => {
    it('should delete investor twin', async () => {
      await service.create({
        investor_id: 'INV-DEL-001',
        profile: {
          name: { first: 'Delete', last: 'Test' },
          email: 'delete@example.com',
        },
      });

      const deleted = await service.delete('INV-DEL-001');

      expect(deleted).toBe(true);

      const result = await service.getById('INV-DEL-001');
      expect(result).toBeNull();
    });

    it('should return false for non-existent investor', async () => {
      const deleted = await service.delete('NON-EXISTENT');

      expect(deleted).toBe(false);
    });
  });
});