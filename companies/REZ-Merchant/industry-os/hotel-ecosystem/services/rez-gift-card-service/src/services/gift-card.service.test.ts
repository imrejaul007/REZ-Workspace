import { describe, it, expect, beforeEach } from 'vitest';
import { GiftCardService } from './gift-card.service';

describe('GiftCardService', () => {
  let service: GiftCardService;

  beforeEach(() => {
    service = new GiftCardService();
  });

  describe('createCard', () => {
    it('should create a gift card with correct values', async () => {
      const card = await service.createCard('hotel-1', 'fixed', 5000);

      expect(card.cardId).toBeDefined();
      expect(card.cardNumber).toHaveLength(16);
      expect(card.pin).toHaveLength(4);
      expect(card.hotelId).toBe('hotel-1');
      expect(card.initialValue).toBe(5000);
      expect(card.currentBalance).toBe(5000);
      expect(card.status).toBe('active');
    });

    it('should set correct expiry date', async () => {
      const card = await service.createCard('hotel-1', 'fixed', 5000);

      expect(card.validUntil).toBeDefined();
      expect(new Date(card.validUntil).getFullYear()).toBe(new Date().getFullYear() + 1);
    });
  });

  describe('getCard', () => {
    it('should retrieve card by ID', async () => {
      const created = await service.createCard('hotel-1', 'fixed', 5000);
      const retrieved = await service.getCard(created.cardId);

      expect(retrieved?.cardId).toBe(created.cardId);
      expect(retrieved?.currentBalance).toBe(5000);
    });

    it('should retrieve card by card number', async () => {
      const created = await service.createCard('hotel-1', 'fixed', 5000);
      const retrieved = await service.getCard(created.cardNumber);

      expect(retrieved?.cardId).toBe(created.cardId);
    });

    it('should return null for non-existent card', async () => {
      const card = await service.getCard('non-existent-id');
      expect(card).toBeNull();
    });

    it('should validate PIN when provided', async () => {
      const created = await service.createCard('hotel-1', 'fixed', 5000);
      const valid = await service.getCard(created.cardNumber, created.pin);
      const invalid = await service.getCard(created.cardNumber, '0000');

      expect(valid?.cardId).toBe(created.cardId);
      expect(invalid).toBeNull();
    });
  });

  describe('loadCard', () => {
    it('should load additional value to card', async () => {
      const card = await service.createCard('hotel-1', 'variable', 0);
      const loaded = await service.loadCard(card.cardId, 2000);

      expect(loaded.currentBalance).toBe(2000);
      expect(loaded.transactionHistory).toHaveLength(1);
      expect(loaded.transactionHistory[0].type).toBe('load');
      expect(loaded.transactionHistory[0].amount).toBe(2000);
    });

    it('should throw error for inactive card', async () => {
      const card = await service.createCard('hotel-1', 'fixed', 5000);
      card.status = 'expired';

      await expect(service.loadCard(card.cardId, 1000)).rejects.toThrow('Card is not active');
    });
  });

  describe('redeemCard', () => {
    it('should redeem from card balance', async () => {
      const card = await service.createCard('hotel-1', 'fixed', 5000);
      const result = await service.redeemCard(card.cardId, 2000, 'booking', 'BK-123');

      expect(result.success).toBe(true);
      expect(result.card.currentBalance).toBe(3000);
      expect(result.transaction.type).toBe('redeem');
      expect(result.transaction.amount).toBe(2000);
    });

    it('should throw error for insufficient balance', async () => {
      const card = await service.createCard('hotel-1', 'fixed', 1000);

      await expect(service.redeemCard(card.cardId, 2000, 'booking')).rejects.toThrow('Insufficient balance');
    });

    it('should mark fixed card as redeemed when balance is zero', async () => {
      const card = await service.createCard('hotel-1', 'fixed', 1000);
      const result = await service.redeemCard(card.cardId, 1000, 'booking');

      expect(result.card.status).toBe('redeemed');
    });
  });

  describe('validateCard', () => {
    it('should validate active card with correct PIN', async () => {
      const card = await service.createCard('hotel-1', 'fixed', 5000);
      const result = await service.validateCard(card.cardNumber, card.pin);

      expect(result.valid).toBe(true);
      expect(result.card).toBeDefined();
    });

    it('should reject invalid PIN', async () => {
      const card = await service.createCard('hotel-1', 'fixed', 5000);
      const result = await service.validateCard(card.cardNumber, '0000');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid PIN');
    });

    it('should reject expired card', async () => {
      const card = await service.createCard('hotel-1', 'fixed', 5000);
      card.validUntil = new Date('2020-01-01');
      const result = await service.validateCard(card.cardNumber, card.pin);

      expect(result.valid).toBe(false);
    });
  });

  describe('cancelCard', () => {
    it('should cancel an active card', async () => {
      const card = await service.createCard('hotel-1', 'fixed', 5000);
      const cancelled = await service.cancelCard(card.cardId);

      expect(cancelled.status).toBe('cancelled');
    });
  });

  describe('sellCard', () => {
    it('should create and sell a fixed-value card', async () => {
      const result = await service.sellCard(
        'hotel-1',
        5000,
        'fixed',
        'John Doe',
        'john@example.com',
        'card',
        'Jane Doe',
        'jane@example.com',
        'Happy Birthday!'
      );

      expect(result.sale.saleId).toBeDefined();
      expect(result.sale.status).toBe('completed');
      expect(result.sale.amount).toBe(5000);
      expect(result.card.status).toBe('sold');
      expect(result.card.recipientName).toBe('Jane Doe');
    });

    it('should create and sell a variable card with loaded amount', async () => {
      const result = await service.sellCard(
        'hotel-1',
        3000,
        'variable',
        'John Doe',
        'john@example.com',
        'upi'
      );

      expect(result.card.currentBalance).toBe(3000);
      expect(result.card.type).toBe('variable');
    });
  });
});
