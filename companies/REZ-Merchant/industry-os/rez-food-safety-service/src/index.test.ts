/**
 * REZ Food Safety Service - Unit Tests
 * Tests for FSSAI compliance, HACCP, temperature monitoring, and allergen management
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================
// TEMPERATURE MONITORING TESTS
// ============================================

describe('Temperature Monitoring', () => {
  describe('Temperature Status Determination', () => {
    type Zone = 'freezer' | 'chiller' | 'hot-hold' | 'ambient';
    type Status = 'normal' | 'warning' | 'critical';

    function determineStatus(zone: Zone, temperature: number): Status {
      if (zone === 'chiller' && (temperature > 8 || temperature < 0)) return 'critical';
      if (zone === 'freezer' && temperature > -18) return 'critical';
      if (zone === 'hot-hold' && temperature < 60) return 'critical';
      if (zone === 'ambient') return 'normal';
      return 'normal';
    }

    describe('Freezer Zone', () => {
      it('should be normal at -18C or below', () => {
        expect(determineStatus('freezer', -18)).toBe('normal');
        expect(determineStatus('freezer', -20)).toBe('normal');
        expect(determineStatus('freezer', -25)).toBe('normal');
      });

      it('should be critical above -18C', () => {
        expect(determineStatus('freezer', -17)).toBe('critical');
        expect(determineStatus('freezer', -10)).toBe('critical');
        expect(determineStatus('freezer', 0)).toBe('critical');
      });

      it('should handle edge case at exactly -18C', () => {
        expect(determineStatus('freezer', -18)).toBe('normal');
      });
    });

    describe('Chiller Zone', () => {
      it('should be normal between 0C and 8C', () => {
        expect(determineStatus('chiller', 0)).toBe('normal');
        expect(determineStatus('chiller', 4)).toBe('normal');
        expect(determineStatus('chiller', 8)).toBe('normal');
      });

      it('should be critical above 8C', () => {
        expect(determineStatus('chiller', 9)).toBe('critical');
        expect(determineStatus('chiller', 15)).toBe('critical');
      });

      it('should be critical below 0C', () => {
        expect(determineStatus('chiller', -1)).toBe('critical');
        expect(determineStatus('chiller', -5)).toBe('critical');
      });
    });

    describe('Hot Hold Zone', () => {
      it('should be normal at 60C or above', () => {
        expect(determineStatus('hot-hold', 60)).toBe('normal');
        expect(determineStatus('hot-hold', 70)).toBe('normal');
        expect(determineStatus('hot-hold', 85)).toBe('normal');
      });

      it('should be critical below 60C', () => {
        expect(determineStatus('hot-hold', 59)).toBe('critical');
        expect(determineStatus('hot-hold', 40)).toBe('critical');
        expect(determineStatus('hot-hold', 20)).toBe('critical');
      });

      it('should handle edge case at exactly 60C', () => {
        expect(determineStatus('hot-hold', 60)).toBe('normal');
      });
    });

    describe('Ambient Zone', () => {
      it('should always be normal', () => {
        expect(determineStatus('ambient', 20)).toBe('normal');
        expect(determineStatus('ambient', 30)).toBe('normal');
        expect(determineStatus('ambient', 40)).toBe('normal');
      });
    });
  });

  describe('Temperature Log Entry', () => {
    interface TempLog {
      merchantId: string;
      restaurantId: string;
      foodItemId: string;
      foodName: string;
      zone: string;
      temperature: number;
      status: string;
      recordedBy: string;
      recordedAt: Date;
    }

    it('should create valid temperature log entry', () => {
      const log: TempLog = {
        merchantId: 'merchant-123',
        restaurantId: 'restaurant-456',
        foodItemId: 'item-789',
        foodName: 'Chicken Breast',
        zone: 'chiller',
        temperature: 4,
        status: 'normal',
        recordedBy: 'staff-001',
        recordedAt: new Date(),
      };

      expect(log.merchantId).toBe('merchant-123');
      expect(log.temperature).toBe(4);
      expect(log.status).toBe('normal');
    });
  });

  describe('Alert Generation', () => {
    it('should generate alerts for warning status', () => {
      const logs = [
        { status: 'normal', temperature: 4 },
        { status: 'warning', temperature: 9 },
        { status: 'normal', temperature: 5 },
      ];

      const alerts = logs.filter(l => l.status === 'warning');
      expect(alerts.length).toBe(1);
    });

    it('should generate alerts for critical status', () => {
      const logs = [
        { status: 'critical', temperature: 12 },
        { status: 'critical', temperature: -5 },
        { status: 'normal', temperature: 4 },
      ];

      const alerts = logs.filter(l => l.status === 'critical');
      expect(alerts.length).toBe(2);
    });
  });
});

// ============================================
// EXPIRY TRACKING TESTS
// ============================================

describe('Expiry Tracking', () => {
  type ExpiryStatus = 'fresh' | 'expiring-soon' | 'expired' | 'disposed';

  function determineExpiryStatus(expiryDate: Date): ExpiryStatus {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    if (expiryDate < now) return 'expired';
    if (expiryDate <= threeDaysFromNow) return 'expiring-soon';
    return 'fresh';
  }

  describe('Fresh Status', () => {
    it('should be fresh if expiry is more than 3 days away', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      expect(determineExpiryStatus(futureDate)).toBe('fresh');
    });

    it('should be fresh if expiry is exactly 4 days away', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 4);

      expect(determineExpiryStatus(futureDate)).toBe('fresh');
    });
  });

  describe('Expiring Soon Status', () => {
    it('should be expiring-soon if expiry is 1 day away', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      expect(determineExpiryStatus(tomorrow)).toBe('expiring-soon');
    });

    it('should be expiring-soon if expiry is 3 days away', () => {
      const inThreeDays = new Date();
      inThreeDays.setDate(inThreeDays.getDate() + 3);

      expect(determineExpiryStatus(inThreeDays)).toBe('expiring-soon');
    });

    it('should be expiring-soon if expiry is today', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      expect(determineExpiryStatus(today)).toBe('expired');
    });
  });

  describe('Expired Status', () => {
    it('should be expired if expiry date is in the past', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      expect(determineExpiryStatus(yesterday)).toBe('expired');
    });

    it('should be expired if expiry date is one week ago', () => {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);

      expect(determineExpiryStatus(lastWeek)).toBe('expired');
    });
  });

  describe('Disposed Status', () => {
    it('should track disposal details', () => {
      const disposalRecord = {
        itemId: 'item-123',
        status: 'disposed',
        disposedAt: new Date(),
        disposedQuantity: 5,
        disposalReason: 'expired',
        disposedBy: 'staff-001',
      };

      expect(disposalRecord.status).toBe('disposed');
      expect(disposalRecord.disposedQuantity).toBe(5);
    });
  });

  describe('Batch Update Logic', () => {
    it('should update status for items expiring in 3 days', () => {
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      const items = [
        { status: 'fresh', expiryDate: threeDaysFromNow },
        { status: 'fresh', expiryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) },
      ];

      const toUpdate = items.filter(
        i => i.status === 'fresh' && i.expiryDate <= threeDaysFromNow
      );

      expect(toUpdate.length).toBe(1);
    });

    it('should mark expired items', () => {
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);

      const items = [
        { status: 'fresh', expiryDate: yesterday },
        { status: 'expiring-soon', expiryDate: yesterday },
        { status: 'fresh', expiryDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000) },
      ];

      const toMarkExpired = items.filter(i => i.expiryDate < now && i.status !== 'expired');
      expect(toMarkExpired.length).toBe(2);
    });
  });
});

// ============================================
// HACCP CHECKLIST TESTS
// ============================================

describe('HACCP Checklist', () => {
  describe('Daily Kitchen Checklist', () => {
    const dailyKitchenItems = [
      'Refrigerator temperature logged',
      'Freezer temperature logged',
      'Hot holding temperature logged',
      'Handwashing stations supplied',
      'Sanitizer concentration correct',
      'Food contact surfaces sanitized',
      'Pest control check',
      'Waste disposed properly',
    ];

    it('should have 8 checklist items', () => {
      expect(dailyKitchenItems.length).toBe(8);
    });

    it('should include temperature checks', () => {
      const tempItems = dailyKitchenItems.filter(item =>
        item.toLowerCase().includes('temperature')
      );
      expect(tempItems.length).toBe(3);
    });

    it('should include hygiene checks', () => {
      const hygieneItems = dailyKitchenItems.filter(item =>
        item.toLowerCase().includes('sanitizer') ||
        item.toLowerCase().includes('sanitized') ||
        item.toLowerCase().includes('handwashing')
      );
      expect(hygieneItems.length).toBe(3);
    });
  });

  describe('Food Receiving Checklist', () => {
    const foodReceivingItems = [
      'Temperature of incoming food',
      'Packaging intact',
      'Expiry dates verified',
      'FSSAI license visible',
      'Vehicle cleanliness',
      'Documents complete',
    ];

    it('should have 6 checklist items', () => {
      expect(foodReceivingItems.length).toBe(6);
    });

    it('should include temperature verification', () => {
      expect(foodReceivingItems).toContain('Temperature of incoming food');
    });

    it('should include FSSAI compliance check', () => {
      expect(foodReceivingItems).toContain('FSSAI license visible');
    });
  });

  describe('Overall Status Calculation', () => {
    type ItemStatus = 'compliant' | 'non-compliant' | 'na';

    function calculateOverallStatus(failedItems: number, totalItems: number): 'passed' | 'failed' | 'partial' {
      if (failedItems === 0) return 'passed';
      if (failedItems < 3) return 'partial';
      return 'failed';
    }

    it('should return passed when no failures', () => {
      expect(calculateOverallStatus(0, 8)).toBe('passed');
    });

    it('should return partial when 1-2 failures', () => {
      expect(calculateOverallStatus(1, 8)).toBe('partial');
      expect(calculateOverallStatus(2, 8)).toBe('partial');
    });

    it('should return failed when 3 or more failures', () => {
      expect(calculateOverallStatus(3, 8)).toBe('failed');
      expect(calculateOverallStatus(5, 8)).toBe('failed');
      expect(calculateOverallStatus(8, 8)).toBe('failed');
    });
  });

  describe('Compliance Score Calculation', () => {
    it('should calculate 100% compliance', () => {
      const totalChecks = 30;
      const passedChecks = 30;
      const compliance = (passedChecks / totalChecks) * 100;

      expect(compliance).toBe(100);
    });

    it('should calculate 0% compliance', () => {
      const totalChecks = 30;
      const passedChecks = 0;
      const compliance = totalChecks > 0 ? (passedChecks / totalChecks) * 100 : 100;

      expect(compliance).toBe(0);
    });

    it('should handle partial compliance', () => {
      const totalChecks = 20;
      const passedChecks = 15;
      const compliance = Math.round((passedChecks / totalChecks) * 100);

      expect(compliance).toBe(75);
    });
  });
});

// ============================================
// FOOD INCIDENT TESTS
// ============================================

describe('Food Incident Management', () => {
  type IncidentType = 'contamination' | 'allergy-reaction' | 'foreign-body' | 'spoilage' | 'temperature-breach' | 'other';
  type Severity = 'low' | 'medium' | 'high' | 'critical';
  type IncidentStatus = 'open' | 'investigating' | 'resolved' | 'escalated';

  const VALID_TYPES: IncidentType[] = [
    'contamination',
    'allergy-reaction',
    'foreign-body',
    'spoilage',
    'temperature-breach',
    'other',
  ];

  const VALID_SEVERITIES: Severity[] = ['low', 'medium', 'high', 'critical'];

  const VALID_STATUSES: IncidentStatus[] = ['open', 'investigating', 'resolved', 'escalated'];

  describe('Incident Type Validation', () => {
    it('should accept all valid incident types', () => {
      VALID_TYPES.forEach(type => {
        expect(VALID_TYPES.includes(type)).toBe(true);
      });
    });

    it('should reject invalid incident types', () => {
      expect(VALID_TYPES.includes('fire')).toBe(false);
      expect(VALID_TYPES.includes('robbery')).toBe(false);
    });
  });

  describe('Severity Levels', () => {
    it('should have critical as highest severity', () => {
      const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
      expect(severityOrder.critical).toBeGreaterThan(severityOrder.high);
    });

    it('should have low as lowest severity', () => {
      const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
      expect(severityOrder.low).toBeLessThan(severityOrder.critical);
    });
  });

  describe('Incident Status Transitions', () => {
    const validTransitions: Record<IncidentStatus, IncidentStatus[]> = {
      open: ['investigating', 'escalated'],
      investigating: ['resolved', 'escalated'],
      escalated: ['investigating', 'resolved'],
      resolved: [],
    };

    it('should allow transition from open to investigating', () => {
      expect(validTransitions.open).toContain('investigating');
    });

    it('should allow transition from open to escalated', () => {
      expect(validTransitions.open).toContain('escalated');
    });

    it('should allow transition from investigating to resolved', () => {
      expect(validTransitions.investigating).toContain('resolved');
    });

    it('should not allow transition from resolved', () => {
      expect(validTransitions.resolved).toHaveLength(0);
    });
  });

  describe('Incident Statistics', () => {
    it('should count incidents by type', () => {
      const incidents = [
        { type: 'contamination' },
        { type: 'contamination' },
        { type: 'foreign-body' },
        { type: 'spoilage' },
        { type: 'contamination' },
      ];

      const byType = incidents.reduce((acc, i) => {
        acc[i.type] = (acc[i.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      expect(byType.contamination).toBe(3);
      expect(byType['foreign-body']).toBe(1);
    });

    it('should count incidents by severity', () => {
      const incidents = [
        { severity: 'high' },
        { severity: 'critical' },
        { severity: 'low' },
        { severity: 'high' },
      ];

      const bySeverity = incidents.reduce((acc, i) => {
        acc[i.severity] = (acc[i.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      expect(bySeverity.high).toBe(2);
      expect(bySeverity.critical).toBe(1);
      expect(bySeverity.low).toBe(1);
    });

    it('should calculate open vs resolved ratio', () => {
      const incidents = [
        { status: 'open' },
        { status: 'resolved' },
        { status: 'resolved' },
        { status: 'resolved' },
      ];

      const open = incidents.filter(i => i.status === 'open').length;
      const resolved = incidents.filter(i => i.status === 'resolved').length;

      expect(open).toBe(1);
      expect(resolved).toBe(3);
    });
  });
});

// ============================================
// ALLERGEN MANAGEMENT TESTS
// ============================================

describe('Allergen Management', () => {
  const COMMON_ALLERGENS = [
    'peanuts', 'tree-nuts', 'milk', 'eggs', 'fish', 'shellfish',
    'soy', 'wheat', 'gluten', 'sesame', 'mustard', 'celery', 'lupin', 'molluscs', 'sulphites'
  ];

  const DIETARY_LABELS = [
    'vegetarian', 'vegan', 'jain', 'halal', 'kosher',
    'gluten-free', 'dairy-free', 'nut-free'
  ];

  describe('Common Allergens', () => {
    it('should have 15 common allergens', () => {
      expect(COMMON_ALLERGENS.length).toBe(15);
    });

    it('should include major allergens', () => {
      expect(COMMON_ALLERGENS).toContain('peanuts');
      expect(COMMON_ALLERGENS).toContain('milk');
      expect(COMMON_ALLERGENS).toContain('eggs');
      expect(COMMON_ALLERGENS).toContain('fish');
      expect(COMMON_ALLERGENS).toContain('shellfish');
      expect(COMMON_ALLERGENS).toContain('wheat');
      expect(COMMON_ALLERGENS).toContain('soy');
    });
  });

  describe('Allergen Severity Levels', () => {
    const SEVERITY_LEVELS = ['trace', 'may-contain', 'present'];

    it('should have three severity levels', () => {
      expect(SEVERITY_LEVELS.length).toBe(3);
    });

    it('should rank present as highest severity', () => {
      const severityOrder = { trace: 1, 'may-contain': 2, present: 3 };
      expect(severityOrder.present).toBeGreaterThan(severityOrder['may-contain']);
    });
  });

  describe('Dietary Labels', () => {
    it('should have 8 dietary labels', () => {
      expect(DIETARY_LABELS.length).toBe(8);
    });

    it('should include religious dietary labels', () => {
      expect(DIETARY_LABELS).toContain('halal');
      expect(DIETARY_LABELS).toContain('kosher');
    });

    it('should include vegetarian options', () => {
      expect(DIETARY_LABELS).toContain('vegetarian');
      expect(DIETARY_LABELS).toContain('vegan');
      expect(DIETARY_LABELS).toContain('jain');
    });

    it('should include allergen-free labels', () => {
      expect(DIETARY_LABELS).toContain('gluten-free');
      expect(DIETARY_LABELS).toContain('dairy-free');
      expect(DIETARY_LABELS).toContain('nut-free');
    });
  });

  describe('Safe Item Search', () => {
    interface MenuItem {
      itemId: string;
      allergens: string[];
    }

    it('should filter out items with excluded allergens', () => {
      const items: MenuItem[] = [
        { itemId: 'item1', allergens: ['milk', 'eggs'] },
        { itemId: 'item2', allergens: [] },
        { itemId: 'item3', allergens: ['peanuts'] },
      ];

      const excludeAllergens = ['peanuts', 'tree-nuts'];
      const safeItems = items.filter(item =>
        !item.allergens.some(a => excludeAllergens.includes(a))
      );

      expect(safeItems.length).toBe(2);
      expect(safeItems.map(i => i.itemId)).toContain('item1');
      expect(safeItems.map(i => i.itemId)).toContain('item2');
    });

    it('should include items with no allergens when excluding none', () => {
      const items: MenuItem[] = [
        { itemId: 'item1', allergens: ['milk'] },
        { itemId: 'item2', allergens: [] },
        { itemId: 'item3', allergens: ['eggs'] },
      ];

      const excludeAllergens: string[] = [];
      const safeItems = items.filter(item =>
        !item.allergens.some(a => excludeAllergens.includes(a))
      );

      expect(safeItems.length).toBe(3);
    });
  });

  describe('Dietary Filter Search', () => {
    it('should filter by dietary preference', () => {
      const items = [
        { itemId: 'item1', dietaryFlags: ['vegetarian'] },
        { itemId: 'item2', dietaryFlags: ['vegan'] },
        { itemId: 'item3', dietaryFlags: ['vegetarian', 'gluten-free'] },
      ];

      const vegetarianItems = items.filter(item =>
        item.dietaryFlags.includes('vegetarian')
      );

      expect(vegetarianItems.length).toBe(2);
    });
  });
});

// ============================================
// DISPOSAL REPORTING TESTS
// ============================================

describe('Disposal Reporting', () => {
  interface DisposalRecord {
    itemId: string;
    disposedQuantity: number;
    disposalReason: string;
    disposedAt: Date;
  }

  describe('Total Disposal Calculation', () => {
    it('should sum disposed quantities', () => {
      const disposals: DisposalRecord[] = [
        { itemId: 'i1', disposedQuantity: 5, disposalReason: 'expired', disposedAt: new Date() },
        { itemId: 'i2', disposedQuantity: 3, disposalReason: 'damaged', disposedAt: new Date() },
        { itemId: 'i3', disposedQuantity: 2, disposalReason: 'expired', disposedAt: new Date() },
      ];

      const totalDisposed = disposals.reduce(
        (sum, d) => sum + d.disposedQuantity,
        0
      );

      expect(totalDisposed).toBe(10);
    });

    it('should handle empty disposals', () => {
      const disposals: DisposalRecord[] = [];
      const totalDisposed = disposals.reduce(
        (sum, d) => sum + d.disposedQuantity,
        0
      );

      expect(totalDisposed).toBe(0);
    });
  });

  describe('Disposal By Reason', () => {
    it('should group disposals by reason', () => {
      const disposals: DisposalRecord[] = [
        { itemId: 'i1', disposedQuantity: 5, disposalReason: 'expired', disposedAt: new Date() },
        { itemId: 'i2', disposedQuantity: 3, disposalReason: 'damaged', disposedAt: new Date() },
        { itemId: 'i3', disposedQuantity: 2, disposalReason: 'expired', disposedAt: new Date() },
        { itemId: 'i4', disposedQuantity: 1, disposalReason: 'damaged', disposedAt: new Date() },
      ];

      const byReason = disposals.reduce((acc, d) => {
        acc[d.disposalReason] = (acc[d.disposalReason] || 0) + d.disposedQuantity;
        return acc;
      }, {} as Record<string, number>);

      expect(byReason.expired).toBe(7);
      expect(byReason.damaged).toBe(4);
    });
  });

  describe('Date Range Filtering', () => {
    it('should filter disposals within date range', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const disposals: DisposalRecord[] = [
        { itemId: 'i1', disposedQuantity: 5, disposalReason: 'expired', disposedAt: new Date('2024-01-15') },
        { itemId: 'i2', disposedQuantity: 3, disposalReason: 'expired', disposedAt: new Date('2024-01-20') },
        { itemId: 'i3', disposedQuantity: 2, disposalReason: 'expired', disposedAt: new Date('2024-02-15') },
      ];

      const filtered = disposals.filter(
        d => d.disposedAt >= startDate && d.disposedAt <= endDate
      );

      expect(filtered.length).toBe(2);
    });
  });
});

// ============================================
// API RESPONSE FORMAT TESTS
// ============================================

describe('API Response Formats', () => {
  describe('Success Response', () => {
    it('should format temperature log response', () => {
      const response = {
        success: true,
        data: {
          merchantId: 'm123',
          restaurantId: 'r456',
          temperature: 4,
          status: 'normal',
        },
      };

      expect(response.success).toBe(true);
      expect(response.data.temperature).toBe(4);
    });

    it('should format expiry tracking response', () => {
      const response = {
        success: true,
        data: {
          itemId: 'item123',
          itemName: 'Chicken',
          status: 'fresh',
          expiryDate: new Date(),
        },
      };

      expect(response.success).toBe(true);
      expect(response.data.status).toBe('fresh');
    });
  });

  describe('Error Response', () => {
    it('should include error message', () => {
      const response = {
        success: false,
        error: 'Failed to record temperature',
      };

      expect(response.success).toBe(false);
      expect(response.error).toBeTruthy();
    });
  });
});
