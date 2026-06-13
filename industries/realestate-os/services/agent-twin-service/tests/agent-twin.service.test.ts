import { AgentTwinService } from '../src/services/agent-twin.service.js';
import { AgentTwinModel } from '../src/models/index.js';
import { resetEventEmitter } from '../src/events/index.js';

describe('AgentTwinService', () => {
  let service: AgentTwinService;

  beforeEach(() => {
    service = new AgentTwinService();
    resetEventEmitter();
  });

  afterEach(async () => {
    await AgentTwinModel.deleteMany({});
  });

  describe('create', () => {
    it('should create a new agent twin', async () => {
      const data = {
        agent_id: 'AGT-001',
        profile: {
          name: {
            first: 'John',
            last: 'Smith',
            prefix: 'Mr.',
          },
          photo_url: 'https://example.com/photo.jpg',
          bio: 'Experienced real estate agent',
          languages: ['English', 'Spanish'],
          specialties: ['residential', 'luxury'],
          license_number: 'LIC-12345',
          license_state: 'TX',
          license_expiration: '2027-12-31T23:59:59.000Z',
        },
        contact: {
          phone: '+1234567890',
          email: 'john.smith@example.com',
          website: 'https://johnsmithrealty.com',
          social: {
            linkedin: 'https://linkedin.com/in/johnsmith',
          },
        },
        brokerage: {
          brokerage_id: 'BROK-001',
          brokerage_name: 'Premier Realty',
          brokerage_address: '123 Main St, Austin, TX',
          team_name: 'Smith Team',
        },
      };

      const result = await service.create(data);

      expect(result).toBeDefined();
      expect(result.agent_id).toBe('AGT-001');
      expect(result.twin_id).toBe('twin.realestate.agent.AGT-001');
      expect(result.profile.name.first).toBe('John');
      expect(result.profile.name.last).toBe('Smith');
      expect(result.brokerage.brokerage_name).toBe('Premier Realty');
      expect(result.availability.status).toBe('available');
      expect(result.performance.transactions_ytd).toBe(0);
    });

    it('should throw error if agent already exists', async () => {
      const data = {
        agent_id: 'AGT-002',
        profile: {
          name: { first: 'Jane', last: 'Doe' },
          license_number: 'LIC-67890',
          license_state: 'TX',
          license_expiration: '2027-12-31T23:59:59.000Z',
        },
        contact: {
          phone: '+1234567891',
          email: 'jane.doe@example.com',
        },
        brokerage: {
          brokerage_id: 'BROK-001',
          brokerage_name: 'Premier Realty',
        },
      };

      await service.create(data);

      await expect(service.create(data)).rejects.toThrow('already exists');
    });

    it('should create with custom performance data', async () => {
      const data = {
        agent_id: 'AGT-003',
        profile: {
          name: { first: 'Mike', last: 'Johnson' },
          license_number: 'LIC-11111',
          license_state: 'TX',
          license_expiration: '2027-12-31T23:59:59.000Z',
        },
        contact: {
          phone: '+1234567892',
          email: 'mike.johnson@example.com',
        },
        brokerage: {
          brokerage_id: 'BROK-001',
          brokerage_name: 'Premier Realty',
        },
        performance: {
          transactions_ytd: 15,
          volume_ytd: 5000000,
          client_rating: 4.8,
          review_count: 45,
        },
      };

      const result = await service.create(data);

      expect(result.performance.transactions_ytd).toBe(15);
      expect(result.performance.volume_ytd).toBe(5000000);
      expect(result.performance.client_rating).toBe(4.8);
    });

    it('should create with expertise and lead preferences', async () => {
      const data = {
        agent_id: 'AGT-004',
        profile: {
          name: { first: 'Sarah', last: 'Williams' },
          license_number: 'LIC-22222',
          license_state: 'TX',
          license_expiration: '2027-12-31T23:59:59.000Z',
        },
        contact: {
          phone: '+1234567893',
          email: 'sarah.williams@example.com',
        },
        brokerage: {
          brokerage_id: 'BROK-001',
          brokerage_name: 'Premier Realty',
        },
        expertise: {
          areas: ['Downtown', 'West Austin', 'Lakeway'],
          property_types: ['single_family', 'condo', 'townhouse'],
          price_ranges: { min: 300000, max: 2000000 },
          years_experience: 10,
        },
        lead_preferences: {
          min_budget: 300000,
          max_budget: 2000000,
          property_types: ['single_family', 'condo'],
          areas: ['Downtown', 'West Austin'],
          lead_routing_enabled: true,
        },
      };

      const result = await service.create(data);

      expect(result.expertise.areas).toContain('Downtown');
      expect(result.expertise.property_types).toContain('single_family');
      expect(result.lead_preferences.min_budget).toBe(300000);
      expect(result.lead_preferences.lead_routing_enabled).toBe(true);
    });
  });

  describe('getById', () => {
    it('should return agent twin by agent_id', async () => {
      const data = {
        agent_id: 'AGT-005',
        profile: {
          name: { first: 'Tom', last: 'Brown' },
          license_number: 'LIC-33333',
          license_state: 'TX',
          license_expiration: '2027-12-31T23:59:59.000Z',
        },
        contact: {
          phone: '+1234567894',
          email: 'tom.brown@example.com',
        },
        brokerage: {
          brokerage_id: 'BROK-001',
          brokerage_name: 'Premier Realty',
        },
      };

      await service.create(data);
      const result = await service.getById('AGT-005');

      expect(result).toBeDefined();
      expect(result?.agent_id).toBe('AGT-005');
    });

    it('should return null for non-existent agent', async () => {
      const result = await service.getById('NON-EXISTENT');
      expect(result).toBeNull();
    });
  });

  describe('getByTwinId', () => {
    it('should return agent twin by twin_id', async () => {
      const data = {
        agent_id: 'AGT-006',
        profile: {
          name: { first: 'Lisa', last: 'Garcia' },
          license_number: 'LIC-44444',
          license_state: 'TX',
          license_expiration: '2027-12-31T23:59:59.000Z',
        },
        contact: {
          phone: '+1234567895',
          email: 'lisa.garcia@example.com',
        },
        brokerage: {
          brokerage_id: 'BROK-001',
          brokerage_name: 'Premier Realty',
        },
      };

      await service.create(data);
      const result = await service.getByTwinId('twin.realestate.agent.AGT-006');

      expect(result).toBeDefined();
      expect(result?.agent_id).toBe('AGT-006');
    });
  });

  describe('update', () => {
    it('should update agent twin', async () => {
      const data = {
        agent_id: 'AGT-007',
        profile: {
          name: { first: 'Original', last: 'Name' },
          license_number: 'LIC-55555',
          license_state: 'TX',
          license_expiration: '2027-12-31T23:59:59.000Z',
        },
        contact: {
          phone: '+1234567896',
          email: 'original@example.com',
        },
        brokerage: {
          brokerage_id: 'BROK-001',
          brokerage_name: 'Premier Realty',
        },
      };

      await service.create(data);

      const result = await service.update('AGT-007', {
        profile: {
          name: { first: 'Updated', last: 'Name' },
          bio: 'Updated bio',
          languages: ['English'],
          specialties: ['commercial'],
          license_number: 'LIC-55555',
          license_state: 'TX',
          license_expiration: '2027-12-31T23:59:59.000Z',
        },
      });

      expect(result).toBeDefined();
      expect(result?.profile.name.first).toBe('Updated');
      expect(result?.profile.bio).toBe('Updated bio');
    });
  });

  describe('updatePerformance', () => {
    it('should update performance metrics', async () => {
      const data = {
        agent_id: 'AGT-008',
        profile: {
          name: { first: 'Performance', last: 'Test' },
          license_number: 'LIC-66666',
          license_state: 'TX',
          license_expiration: '2027-12-31T23:59:59.000Z',
        },
        contact: {
          phone: '+1234567897',
          email: 'performance@example.com',
        },
        brokerage: {
          brokerage_id: 'BROK-001',
          brokerage_name: 'Premier Realty',
        },
      };

      await service.create(data);

      const result = await service.updatePerformance('AGT-008', {
        transactions_ytd: 20,
        volume_ytd: 7500000,
        client_rating: 4.9,
        review_count: 75,
      });

      expect(result?.performance.transactions_ytd).toBe(20);
      expect(result?.performance.volume_ytd).toBe(7500000);
      expect(result?.performance.client_rating).toBe(4.9);
    });
  });

  describe('updateAvailability', () => {
    it('should update availability status', async () => {
      const data = {
        agent_id: 'AGT-009',
        profile: {
          name: { first: 'Availability', last: 'Test' },
          license_number: 'LIC-77777',
          license_state: 'TX',
          license_expiration: '2027-12-31T23:59:59.000Z',
        },
        contact: {
          phone: '+1234567898',
          email: 'availability@example.com',
        },
        brokerage: {
          brokerage_id: 'BROK-001',
          brokerage_name: 'Premier Realty',
        },
      };

      await service.create(data);

      const result = await service.updateAvailability('AGT-009', {
        status: 'busy',
      });

      expect(result?.availability.status).toBe('busy');
    });

    it('should update working hours', async () => {
      const data = {
        agent_id: 'AGT-010',
        profile: {
          name: { first: 'Hours', last: 'Test' },
          license_number: 'LIC-88888',
          license_state: 'TX',
          license_expiration: '2027-12-31T23:59:59.000Z',
        },
        contact: {
          phone: '+1234567899',
          email: 'hours@example.com',
        },
        brokerage: {
          brokerage_id: 'BROK-001',
          brokerage_name: 'Premier Realty',
        },
      };

      await service.create(data);

      const result = await service.updateAvailability('AGT-010', {
        working_hours: {
          monday: { start: '09:00', end: '18:00' },
          tuesday: { start: '09:00', end: '18:00' },
          wednesday: { start: '09:00', end: '18:00' },
          thursday: { start: '09:00', end: '18:00' },
          friday: { start: '09:00', end: '17:00' },
          saturday: null,
          sunday: null,
        },
      });

      expect(result?.availability.working_hours.monday?.start).toBe('09:00');
      expect(result?.availability.working_hours.saturday).toBeNull();
    });
  });

  describe('updateLeadPreferences', () => {
    it('should update lead preferences', async () => {
      const data = {
        agent_id: 'AGT-011',
        profile: {
          name: { first: 'Lead', last: 'Test' },
          license_number: 'LIC-99999',
          license_state: 'TX',
          license_expiration: '2027-12-31T23:59:59.000Z',
        },
        contact: {
          phone: '+1234567800',
          email: 'lead@example.com',
        },
        brokerage: {
          brokerage_id: 'BROK-001',
          brokerage_name: 'Premier Realty',
        },
      };

      await service.create(data);

      const result = await service.updateLeadPreferences('AGT-011', {
        min_budget: 500000,
        max_budget: 3000000,
        property_types: ['single_family', 'luxury'],
        areas: ['Highland Park', 'Tarrytown'],
        lead_routing_enabled: true,
      });

      expect(result?.lead_preferences.min_budget).toBe(500000);
      expect(result?.lead_preferences.max_budget).toBe(3000000);
    });
  });

  describe('addListing', () => {
    it('should add listing to agent', async () => {
      const data = {
        agent_id: 'AGT-012',
        profile: {
          name: { first: 'Listing', last: 'Test' },
          license_number: 'LIC-10101',
          license_state: 'TX',
          license_expiration: '2027-12-31T23:59:59.000Z',
        },
        contact: {
          phone: '+1234567801',
          email: 'listing@example.com',
        },
        brokerage: {
          brokerage_id: 'BROK-001',
          brokerage_name: 'Premier Realty',
        },
      };

      await service.create(data);

      const result = await service.addListing('AGT-012', 'LIST-001');

      expect(result?.active_listings).toContain('LIST-001');
    });

    it('should not duplicate listing', async () => {
      const data = {
        agent_id: 'AGT-013',
        profile: {
          name: { first: 'Duplicate', last: 'Test' },
          license_number: 'LIC-12121',
          license_state: 'TX',
          license_expiration: '2027-12-31T23:59:59.000Z',
        },
        contact: {
          phone: '+1234567802',
          email: 'duplicate@example.com',
        },
        brokerage: {
          brokerage_id: 'BROK-001',
          brokerage_name: 'Premier Realty',
        },
      };

      await service.create(data);
      await service.addListing('AGT-013', 'LIST-002');
      const result = await service.addListing('AGT-013', 'LIST-002');

      expect(result?.active_listings.filter(l => l === 'LIST-002')).toHaveLength(1);
    });
  });

  describe('removeListing', () => {
    it('should remove listing from agent', async () => {
      const data = {
        agent_id: 'AGT-014',
        profile: {
          name: { first: 'Remove', last: 'Listing' },
          license_number: 'LIC-13131',
          license_state: 'TX',
          license_expiration: '2027-12-31T23:59:59.000Z',
        },
        contact: {
          phone: '+1234567803',
          email: 'removelisting@example.com',
        },
        brokerage: {
          brokerage_id: 'BROK-001',
          brokerage_name: 'Premier Realty',
        },
      };

      await service.create(data);
      await service.addListing('AGT-014', 'LIST-003');

      const result = await service.removeListing('AGT-014', 'LIST-003');

      expect(result?.active_listings).not.toContain('LIST-003');
    });
  });

  describe('addDeal', () => {
    it('should add deal to agent', async () => {
      const data = {
        agent_id: 'AGT-015',
        profile: {
          name: { first: 'Deal', last: 'Test' },
          license_number: 'LIC-14141',
          license_state: 'TX',
          license_expiration: '2027-12-31T23:59:59.000Z',
        },
        contact: {
          phone: '+1234567804',
          email: 'deal@example.com',
        },
        brokerage: {
          brokerage_id: 'BROK-001',
          brokerage_name: 'Premier Realty',
        },
      };

      await service.create(data);

      const result = await service.addDeal('AGT-015', 'DEAL-001');

      expect(result?.active_deals).toContain('DEAL-001');
    });
  });

  describe('removeDeal', () => {
    it('should remove deal from agent', async () => {
      const data = {
        agent_id: 'AGT-016',
        profile: {
          name: { first: 'Remove', last: 'Deal' },
          license_number: 'LIC-15151',
          license_state: 'TX',
          license_expiration: '2027-12-31T23:59:59.000Z',
        },
        contact: {
          phone: '+1234567805',
          email: 'removedeal@example.com',
        },
        brokerage: {
          brokerage_id: 'BROK-001',
          brokerage_name: 'Premier Realty',
        },
      };

      await service.create(data);
      await service.addDeal('AGT-016', 'DEAL-002');

      const result = await service.removeDeal('AGT-016', 'DEAL-002');

      expect(result?.active_deals).not.toContain('DEAL-002');
    });
  });

  describe('list', () => {
    beforeEach(async () => {
      // Create multiple agents
      const agents = [
        {
          agent_id: 'AGT-017',
          profile: { name: { first: 'Agent', last: '1' }, license_number: 'LIC-17171', license_state: 'TX', license_expiration: '2027-12-31T23:59:59.000Z' },
          contact: { phone: '+1234567806', email: 'agent1@example.com' },
          brokerage: { brokerage_id: 'BROK-001', brokerage_name: 'Premier Realty' },
        },
        {
          agent_id: 'AGT-018',
          profile: { name: { first: 'Agent', last: '2' }, license_number: 'LIC-18181', license_state: 'TX', license_expiration: '2027-12-31T23:59:59.000Z' },
          contact: { phone: '+1234567807', email: 'agent2@example.com' },
          brokerage: { brokerage_id: 'BROK-001', brokerage_name: 'Premier Realty' },
        },
        {
          agent_id: 'AGT-019',
          profile: { name: { first: 'Agent', last: '3' }, license_number: 'LIC-19191', license_state: 'TX', license_expiration: '2027-12-31T23:59:59.000Z' },
          contact: { phone: '+1234567808', email: 'agent3@example.com' },
          brokerage: { brokerage_id: 'BROK-002', brokerage_name: 'Another Realty' },
        },
      ];

      for (const agent of agents) {
        await service.create(agent);
      }
    });

    it('should list all agents with pagination', async () => {
      const result = await service.list({ page: 1, limit: 10 });

      expect(result.total).toBe(3);
      expect(result.twins).toHaveLength(3);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should filter by brokerage_id', async () => {
      const result = await service.list({ brokerage_id: 'BROK-001' });

      expect(result.total).toBe(2);
      expect(result.twins.every(t => t.brokerage.brokerage_id === 'BROK-001')).toBe(true);
    });

    it('should paginate correctly', async () => {
      const result = await service.list({ page: 1, limit: 2 });

      expect(result.total).toBe(3);
      expect(result.twins).toHaveLength(2);
    });
  });

  describe('findMatchingAgents', () => {
    beforeEach(async () => {
      const agents = [
        {
          agent_id: 'AGT-020',
          profile: { name: { first: 'Match', last: '1' }, license_number: 'LIC-20202', license_state: 'TX', license_expiration: '2027-12-31T23:59:59.000Z' },
          contact: { phone: '+1234567809', email: 'match1@example.com' },
          brokerage: { brokerage_id: 'BROK-001', brokerage_name: 'Premier Realty' },
          expertise: { property_types: ['single_family', 'condo'] },
          lead_preferences: { min_budget: 200000, max_budget: 1000000, lead_routing_enabled: true },
        },
        {
          agent_id: 'AGT-021',
          profile: { name: { first: 'Match', last: '2' }, license_number: 'LIC-21212', license_state: 'TX', license_expiration: '2027-12-31T23:59:59.000Z' },
          contact: { phone: '+1234567810', email: 'match2@example.com' },
          brokerage: { brokerage_id: 'BROK-001', brokerage_name: 'Premier Realty' },
          expertise: { property_types: ['luxury'] },
          lead_preferences: { min_budget: 1000000, max_budget: 5000000, lead_routing_enabled: true },
        },
      ];

      for (const agent of agents) {
        await service.create(agent);
      }

      // Set first agent to available
      await service.updateAvailability('AGT-020', { status: 'available' });
      // Set second agent to unavailable
      await service.updateAvailability('AGT-021', { status: 'unavailable' });
    });

    it('should find matching available agents', async () => {
      const result = await service.findMatchingAgents({
        budget: { min: 300000, max: 800000 },
        property_types: ['single_family'],
      });

      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result.every(a => a.availability.status === 'available')).toBe(true);
    });
  });

  describe('getStats', () => {
    beforeEach(async () => {
      const agents = [
        {
          agent_id: 'AGT-022',
          profile: { name: { first: 'Stats', last: '1' }, license_number: 'LIC-22222', license_state: 'TX', license_expiration: '2027-12-31T23:59:59.000Z' },
          contact: { phone: '+1234567811', email: 'stats1@example.com' },
          brokerage: { brokerage_id: 'BROK-001', brokerage_name: 'Premier Realty' },
          performance: { transactions_ytd: 10, volume_ytd: 3000000, client_rating: 4.5 },
        },
        {
          agent_id: 'AGT-023',
          profile: { name: { first: 'Stats', last: '2' }, license_number: 'LIC-23232', license_state: 'TX', license_expiration: '2027-12-31T23:59:59.000Z' },
          contact: { phone: '+1234567812', email: 'stats2@example.com' },
          brokerage: { brokerage_id: 'BROK-001', brokerage_name: 'Premier Realty' },
          performance: { transactions_ytd: 20, volume_ytd: 7000000, client_rating: 4.8 },
        },
      ];

      for (const agent of agents) {
        await service.create(agent);
      }
    });

    it('should return agent statistics', async () => {
      const stats = await service.getStats();

      expect(stats.total_agents).toBe(2);
      expect(stats.total_volume_ytd).toBe(10000000);
      expect(stats.avg_transactions_ytd).toBe(15);
    });
  });

  describe('delete', () => {
    it('should delete agent twin', async () => {
      const data = {
        agent_id: 'AGT-024',
        profile: {
          name: { first: 'Delete', last: 'Test' },
          license_number: 'LIC-24242',
          license_state: 'TX',
          license_expiration: '2027-12-31T23:59:59.000Z',
        },
        contact: {
          phone: '+1234567813',
          email: 'delete@example.com',
        },
        brokerage: {
          brokerage_id: 'BROK-001',
          brokerage_name: 'Premier Realty',
        },
      };

      await service.create(data);

      const deleted = await service.delete('AGT-024');
      expect(deleted).toBe(true);

      const result = await service.getById('AGT-024');
      expect(result).toBeNull();
    });

    it('should return false for non-existent agent', async () => {
      const deleted = await service.delete('NON-EXISTENT');
      expect(deleted).toBe(false);
    });
  });
});