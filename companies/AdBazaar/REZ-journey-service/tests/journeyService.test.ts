import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JourneyService, store, eventEmitter } from '../src/services/journeyService';

// Mock logger
vi.mock('../src/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('JourneyService', () => {
  let service: JourneyService;

  beforeEach(() => {
    service = new JourneyService();
    // Clear the store between tests
    vi.restoreAllMocks();
  });

  describe('Journey CRUD', () => {
    it('should create a new journey', async () => {
      const result = await service.createJourney({
        name: 'Test Journey',
        description: 'A test journey',
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.name).toBe('Test Journey');
      expect(result.data?.status).toBe('draft');
    });

    it('should create journey with trigger', async () => {
      const result = await service.createJourney({
        name: 'Onboarding Journey',
        trigger: { type: 'signup' },
      });

      expect(result.success).toBe(true);
      expect(result.data?.trigger.type).toBe('signup');
    });

    it('should get journey by id', async () => {
      const created = await service.createJourney({ name: 'Find Me' });
      const journeyId = created.data!.id;

      const result = await service.getJourney(journeyId);

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Find Me');
    });

    it('should return error for non-existent journey', async () => {
      const result = await service.getJourney('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Journey not found');
    });

    it('should list journeys with pagination', async () => {
      await service.createJourney({ name: 'Journey 1' });
      await service.createJourney({ name: 'Journey 2' });
      await service.createJourney({ name: 'Journey 3' });

      const result = await service.listJourneys({ page: 1, limit: 2 });

      expect(result.success).toBe(true);
      expect(result.data.length).toBeLessThanOrEqual(2);
      expect(result.pagination.total).toBeGreaterThanOrEqual(3);
    });

    it('should filter journeys by status', async () => {
      const created = await service.createJourney({ name: 'Active Journey' });
      await service.activateJourney(created.data!.id);

      const result = await service.listJourneys({ status: 'active' });

      expect(result.success).toBe(true);
      expect(result.data.every(j => j.status === 'active')).toBe(true);
    });

    it('should update journey', async () => {
      const created = await service.createJourney({ name: 'Original Name' });
      const journeyId = created.data!.id;

      const result = await service.updateJourney(journeyId, { name: 'Updated Name' });

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Updated Name');
    });

    it('should not update active journey', async () => {
      const created = await service.createJourney({ name: 'Active Journey' });
      const journeyId = created.data!.id;
      await service.activateJourney(journeyId);

      const result = await service.updateJourney(journeyId, { name: 'New Name' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot update active journey');
    });

    it('should delete draft journey', async () => {
      const created = await service.createJourney({ name: 'To Delete' });
      const journeyId = created.data!.id;

      const result = await service.deleteJourney(journeyId);

      expect(result.success).toBe(true);

      const check = await service.getJourney(journeyId);
      expect(check.success).toBe(false);
    });

    it('should not delete active journey', async () => {
      const created = await service.createJourney({ name: 'Active' });
      const journeyId = created.data!.id;
      await service.activateJourney(journeyId);

      const result = await service.deleteJourney(journeyId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot delete active journey');
    });
  });

  describe('Journey Lifecycle', () => {
    it('should activate journey', async () => {
      const created = await service.createJourney({ name: 'Activate Me' });
      const journeyId = created.data!.id;

      // Add entry step first
      await service.addStep(journeyId, {
        type: 'action',
        name: 'Entry',
        actionType: 'email',
        actionConfig: { template: 'welcome' },
      });

      const result = await service.activateJourney(journeyId);

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('active');
    });

    it('should pause active journey', async () => {
      const created = await service.createJourney({ name: 'Pause Me' });
      const journeyId = created.data!.id;
      await service.addStep(journeyId, {
        type: 'action',
        name: 'Entry',
        actionType: 'email',
        actionConfig: { template: 'welcome' },
      });
      await service.activateJourney(journeyId);

      const result = await service.pauseJourney(journeyId);

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('paused');
    });

    it('should resume paused journey', async () => {
      const created = await service.createJourney({ name: 'Resume Me' });
      const journeyId = created.data!.id;
      await service.addStep(journeyId, {
        type: 'action',
        name: 'Entry',
        actionType: 'email',
        actionConfig: { template: 'welcome' },
      });
      await service.activateJourney(journeyId);
      await service.pauseJourney(journeyId);

      const result = await service.resumeJourney(journeyId);

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('active');
    });

    it('should archive completed journey', async () => {
      const created = await service.createJourney({ name: 'Archive Me' });
      const journeyId = created.data!.id;

      const result = await service.archiveJourney(journeyId);

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('archived');
    });
  });

  describe('Step Management', () => {
    it('should add step to journey', async () => {
      const created = await service.createJourney({ name: 'Steps Journey' });
      const journeyId = created.data!.id;

      const result = await service.addStep(journeyId, {
        type: 'action',
        name: 'Send Welcome Email',
        actionType: 'email',
        actionConfig: { template: 'welcome' },
      });

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Send Welcome Email');
    });

    it('should update step', async () => {
      const created = await service.createJourney({ name: 'Update Step Journey' });
      const journeyId = created.data!.id;
      const stepResult = await service.addStep(journeyId, {
        type: 'action',
        name: 'Original Name',
        actionType: 'email',
        actionConfig: { template: 'welcome' },
      });
      const stepId = stepResult.data!.id;

      const result = await service.updateStep(journeyId, stepId, {
        name: 'Updated Name',
      });

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Updated Name');
    });

    it('should remove step from journey', async () => {
      const created = await service.createJourney({ name: 'Remove Step Journey' });
      const journeyId = created.data!.id;
      const stepResult = await service.addStep(journeyId, {
        type: 'action',
        name: 'To Remove',
        actionType: 'email',
        actionConfig: { template: 'welcome' },
      });
      const stepId = stepResult.data!.id;

      const result = await service.removeStep(journeyId, stepId);

      expect(result.success).toBe(true);
    });

    it('should connect steps', async () => {
      const created = await service.createJourney({ name: 'Connect Steps Journey' });
      const journeyId = created.data!.id;

      const step1 = await service.addStep(journeyId, {
        type: 'action',
        name: 'Step 1',
        actionType: 'email',
        actionConfig: { template: 'welcome' },
      });

      const step2 = await service.addStep(journeyId, {
        type: 'action',
        name: 'Step 2',
        actionType: 'email',
        actionConfig: { template: 'followup' },
      });

      const result = await service.connectSteps(
        journeyId,
        step1.data!.id,
        step2.data!.id,
        'next'
      );

      expect(result.success).toBe(true);
    });
  });

  describe('Journey Entry', () => {
    it('should enter contact into active journey', async () => {
      const created = await service.createJourney({ name: 'Entry Journey' });
      const journeyId = created.data!.id;
      await service.addStep(journeyId, {
        type: 'action',
        name: 'Entry',
        actionType: 'email',
        actionConfig: { template: 'welcome' },
      });
      await service.activateJourney(journeyId);

      const result = await service.enterJourney(journeyId, 'contact-123', {
        email: 'test@example.com',
      });

      expect(result.success).toBe(true);
      expect(result.data?.contactId).toBe('contact-123');
      expect(result.data?.status).toBe('entered');
    });

    it('should not allow entry to inactive journey', async () => {
      const created = await service.createJourney({ name: 'Inactive Journey' });
      const journeyId = created.data!.id;

      const result = await service.enterJourney(journeyId, 'contact-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not active');
    });

    it('should not allow duplicate entries', async () => {
      const created = await service.createJourney({ name: 'Duplicate Journey' });
      const journeyId = created.data!.id;
      await service.addStep(journeyId, {
        type: 'action',
        name: 'Entry',
        actionType: 'email',
        actionConfig: { template: 'welcome' },
      });
      await service.activateJourney(journeyId);

      await service.enterJourney(journeyId, 'contact-123');
      const duplicate = await service.enterJourney(journeyId, 'contact-123');

      expect(duplicate.success).toBe(false);
      expect(duplicate.error).toContain('already has an active entry');
    });

    it('should get journey entries', async () => {
      const created = await service.createJourney({ name: 'Entries Journey' });
      const journeyId = created.data!.id;
      await service.addStep(journeyId, {
        type: 'action',
        name: 'Entry',
        actionType: 'email',
        actionConfig: { template: 'welcome' },
      });
      await service.activateJourney(journeyId);
      await service.enterJourney(journeyId, 'contact-1');
      await service.enterJourney(journeyId, 'contact-2');

      const result = await service.getJourneyEntries(journeyId);

      expect(result.success).toBe(true);
      expect(result.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should exit entry', async () => {
      const created = await service.createJourney({ name: 'Exit Journey' });
      const journeyId = created.data!.id;
      await service.addStep(journeyId, {
        type: 'action',
        name: 'Entry',
        actionType: 'email',
        actionConfig: { template: 'welcome' },
      });
      await service.activateJourney(journeyId);
      const entry = await service.enterJourney(journeyId, 'contact-123');

      const result = await service.exitEntry(entry.data!.id, 'completed');

      expect(result.success).toBe(true);
    });
  });

  describe('Templates', () => {
    it('should list templates', async () => {
      const result = await service.listTemplates();

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should create template from journey', async () => {
      const created = await service.createJourney({ name: 'Template Source' });
      const journeyId = created.data!.id;
      await service.addStep(journeyId, {
        type: 'action',
        name: 'Entry',
        actionType: 'email',
        actionConfig: { template: 'welcome' },
      });

      const result = await service.createTemplate(journeyId, {
        name: 'My Template',
        description: 'A template',
        category: 'onboarding',
        tags: ['email', 'welcome'],
      });

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('My Template');
    });

    it('should create journey from template', async () => {
      // First create a template
      const journey = await service.createJourney({ name: 'Template Source' });
      await service.addStep(journey.data!.id, {
        type: 'action',
        name: 'Entry',
        actionType: 'email',
        actionConfig: { template: 'welcome' },
      });

      const template = await service.createTemplate(journey.data!.id, {
        name: 'Reusable Template',
        description: 'A template',
        category: 'onboarding',
        tags: ['email'],
      });

      const result = await service.createFromTemplate(
        template.data!.id,
        'New Journey from Template'
      );

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('New Journey from Template');
    });
  });

  describe('Trigger Events', () => {
    it('should process trigger for matching journeys', async () => {
      // Create a journey triggered on signup
      const created = await service.createJourney({
        name: 'Signup Journey',
        trigger: { type: 'signup' },
      });
      await service.addStep(created.data!.id, {
        type: 'action',
        name: 'Entry',
        actionType: 'email',
        actionConfig: { template: 'welcome' },
      });
      await service.activateJourney(created.data!.id);

      const result = await service.processTrigger('signup', 'contact-456', {
        email: 'new@example.com',
      });

      expect(result.success).toBe(true);
    });

    it('should process trigger with conditions', async () => {
      const created = await service.createJourney({
        name: 'VIP Journey',
        trigger: {
          type: 'purchase',
          conditions: [
            { field: 'totalSpent', operator: 'greater_than', value: 1000 },
          ],
        },
      });
      await service.addStep(created.data!.id, {
        type: 'action',
        name: 'Entry',
        actionType: 'email',
        actionConfig: { template: 'vip' },
      });
      await service.activateJourney(created.data!.id);

      // Should match condition
      const match = await service.processTrigger('purchase', 'vip-user', {
        totalSpent: 2000,
      });
      expect(match.success).toBe(true);

      // Should not match condition
      const noMatch = await service.processTrigger('purchase', 'regular-user', {
        totalSpent: 500,
      });
      expect(noMatch.success).toBe(true); // Still succeeds, just no journey entered
    });
  });

  describe('Analytics', () => {
    it('should get journey analytics', async () => {
      const created = await service.createJourney({ name: 'Analytics Journey' });
      const journeyId = created.data!.id;
      await service.addStep(journeyId, {
        type: 'action',
        name: 'Entry',
        actionType: 'email',
        actionConfig: { template: 'welcome' },
      });
      await service.activateJourney(journeyId);
      await service.enterJourney(journeyId, 'contact-1');
      await service.enterJourney(journeyId, 'contact-2');

      const result = await service.getJourneyAnalytics(journeyId);

      expect(result.success).toBe(true);
      expect(result.data?.totalEntries).toBeGreaterThanOrEqual(2);
      expect(result.data?.activeEntries).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Visual Builder', () => {
    it('should get journey canvas', async () => {
      const created = await service.createJourney({ name: 'Canvas Journey' });
      const journeyId = created.data!.id;
      await service.addStep(journeyId, {
        type: 'action',
        name: 'Step 1',
        actionType: 'email',
        actionConfig: { template: 'welcome' },
      });

      const result = await service.getJourneyCanvas(journeyId);

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data?.nodes)).toBe(true);
      expect(Array.isArray(result.data?.edges)).toBe(true);
    });

    it('should update canvas position', async () => {
      const created = await service.createJourney({ name: 'Position Journey' });
      const journeyId = created.data!.id;
      const step = await service.addStep(journeyId, {
        type: 'action',
        name: 'Step 1',
        actionType: 'email',
        actionConfig: { template: 'welcome' },
      });

      const result = await service.updateCanvasPosition(
        journeyId,
        step.data!.id,
        { x: 100, y: 200 }
      );

      expect(result.success).toBe(true);
    });
  });
});
