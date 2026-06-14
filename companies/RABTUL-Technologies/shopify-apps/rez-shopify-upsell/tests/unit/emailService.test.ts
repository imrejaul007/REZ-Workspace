/**
 * ReZ Upsell - Email Service Tests
 */

import { describe, it, expect } from '@jest/globals';
import { EMAIL_TEMPLATES, EMAIL_SEQUENCES, EmailSequenceService } from '../src/server/services/emailService';

describe('Email Templates', () => {
  describe('Cart Recovery Templates', () => {
    it('should have first reminder template', () => {
      const template = EMAIL_TEMPLATES.cart_recovery_1;
      expect(template).toBeDefined();
      expect(template.id).toBe('cart_recovery_1');
      expect(template.name).toBe('Cart Recovery - First Reminder');
    });

    it('should have urgency in subject', () => {
      const template = EMAIL_TEMPLATES.cart_recovery_1;
      expect(template.subject).toContain('left something behind');
    });

    it('should have personalization variables', () => {
      const template = EMAIL_TEMPLATES.cart_recovery_1;
      expect(template.body).toContain('{{customer_name}}');
      expect(template.body).toContain('{{cart_items}}');
      expect(template.body).toContain('{{checkout_link}}');
    });
  });

  describe('Second Reminder Template', () => {
    it('should include discount incentive', () => {
      const template = EMAIL_TEMPLATES.cart_recovery_2;
      expect(template.subject).toContain('thinking');
      expect(template.body).toContain('{{discount_code}}');
      expect(template.body).toContain('24 hours');
    });
  });

  describe('Final Notice Template', () => {
    it('should have urgent language', () => {
      const template = EMAIL_TEMPLATES.cart_recovery_3;
      expect(template.subject).toContain('Last chance');
      expect(template.subject).toContain('tomorrow');
    });
  });

  describe('Thank You Template', () => {
    it('should include order details', () => {
      const template = EMAIL_TEMPLATES.order_thank_you;
      expect(template.body).toContain('{{order_number}}');
      expect(template.body).toContain('{{order_items}}');
    });
  });

  describe('Upsell Template', () => {
    it('should suggest related products', () => {
      const template = EMAIL_TEMPLATES.upsell_followup;
      expect(template.body).toContain('{{upsell_products}}');
      expect(template.body).toContain('Complete your look');
    });
  });

  describe('Win-back Template', () => {
    it('should offer discount to inactive customers', () => {
      const template = EMAIL_TEMPLATES.winback_30;
      expect(template.subject).toContain('miss you');
      expect(template.body).toContain('15%');
    });
  });
});

describe('Email Sequences', () => {
  describe('Cart Recovery Sequence', () => {
    it('should have 3 emails', () => {
      const sequence = EMAIL_SEQUENCES.cart_recovery;
      expect(sequence.emails.length).toBe(3);
    });

    it('should trigger on cart abandonment', () => {
      const sequence = EMAIL_SEQUENCES.cart_recovery;
      expect(sequence.trigger).toBe('cart_abandoned');
    });

    it('should have increasing delays', () => {
      const emails = EMAIL_SEQUENCES.cart_recovery.emails;
      expect(emails[0].delay).toBeLessThan(emails[1].delay);
      expect(emails[1].delay).toBeLessThan(emails[2].delay);
    });

    it('should have all emails active', () => {
      const sequence = EMAIL_SEQUENCES.cart_recovery;
      expect(sequence.emails.every(e => e.active)).toBe(true);
    });
  });

  describe('Post Purchase Sequence', () => {
    it('should trigger on order placement', () => {
      const sequence = EMAIL_SEQUENCES.post_purchase_upsell;
      expect(sequence.trigger).toBe('order_placed');
    });

    it('should have 24 hour delay', () => {
      const email = EMAIL_SEQUENCES.post_purchase_upsell.emails[0];
      expect(email.delay).toBe(1440); // 24 hours
    });
  });

  describe('Win-back Sequence', () => {
    it('should trigger on inactivity', () => {
      const sequence = EMAIL_SEQUENCES.winback;
      expect(sequence.trigger).toBe('inactive');
    });

    it('should wait 30 days', () => {
      const email = EMAIL_SEQUENCES.winback.emails[0];
      expect(email.delay).toBe(43200); // 30 days in minutes
    });
  });
});

describe('EmailSequenceService', () => {
  it('should be instantiable', () => {
    const service = new EmailSequenceService();
    expect(service).toBeDefined();
  });

  it('should return all templates', () => {
    const service = new EmailSequenceService();
    const templates = service.getTemplates();
    expect(templates.length).toBeGreaterThan(0);
  });

  it('should return active sequences', () => {
    const service = new EmailSequenceService();
    const sequences = service.getSequences();
    expect(sequences.length).toBeGreaterThan(0);
    expect(sequences.every(s => s.active)).toBe(true);
  });
});

describe('Personalization Variables', () => {
  const requiredVariables = [
    'customer_name',
    'cart_items',
    'cart_total',
    'checkout_link',
    'shop_name',
  ];

  it('should include required variables in cart recovery', () => {
    const template = EMAIL_TEMPLATES.cart_recovery_1;
    for (const variable of requiredVariables) {
      expect(template.body).toContain(`{{${variable}}}`);
    }
  });
});
