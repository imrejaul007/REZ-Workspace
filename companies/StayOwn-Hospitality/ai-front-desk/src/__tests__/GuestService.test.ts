/**
 * GuestService Tests
 */

import { GuestService } from '../services/GuestService';

// Mock mongoose
jest.mock('mongoose', () => ({
  models: {},
  model: jest.fn().mockReturnValue({
    create: jest.fn(),
    findById: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn(),
  }),
  Schema: jest.fn(),
  connect: jest.fn(),
}));

describe('GuestService', () => {
  let guestService: GuestService;

  beforeEach(() => {
    guestService = new GuestService();
  });

  describe('createGuest', () => {
    it('should be defined', () => {
      expect(guestService.createGuest).toBeDefined();
    });

    it('should be a function', () => {
      expect(typeof guestService.createGuest).toBe('function');
    });
  });

  describe('getGuestById', () => {
    it('should be defined', () => {
      expect(guestService.getGuestById).toBeDefined();
    });

    it('should be a function', () => {
      expect(typeof guestService.getGuestById).toBe('function');
    });
  });

  describe('getGuestsByRoom', () => {
    it('should be defined', () => {
      expect(guestService.getGuestsByRoom).toBeDefined();
    });

    it('should be a function', () => {
      expect(typeof guestService.getGuestsByRoom).toBe('function');
    });
  });

  describe('getCurrentGuestForRoom', () => {
    it('should be defined', () => {
      expect(guestService.getCurrentGuestForRoom).toBeDefined();
    });

    it('should be a function', () => {
      expect(typeof guestService.getCurrentGuestForRoom).toBe('function');
    });
  });

  describe('addRequest', () => {
    it('should be defined', () => {
      expect(guestService.addRequest).toBeDefined();
    });

    it('should be a function', () => {
      expect(typeof guestService.addRequest).toBe('function');
    });
  });

  describe('getActiveGuestsCount', () => {
    it('should be defined', () => {
      expect(guestService.getActiveGuestsCount).toBeDefined();
    });

    it('should be a function', () => {
      expect(typeof guestService.getActiveGuestsCount).toBe('function');
    });
  });

  describe('getTodayCheckOuts', () => {
    it('should be defined', () => {
      expect(guestService.getTodayCheckOuts).toBeDefined();
    });

    it('should be a function', () => {
      expect(typeof guestService.getTodayCheckOuts).toBe('function');
    });
  });

  describe('updateGuest', () => {
    it('should be defined', () => {
      expect(guestService.updateGuest).toBeDefined();
    });

    it('should be a function', () => {
      expect(typeof guestService.updateGuest).toBe('function');
    });
  });

  describe('deleteGuest', () => {
    it('should be defined', () => {
      expect(guestService.deleteGuest).toBeDefined();
    });

    it('should be a function', () => {
      expect(typeof guestService.deleteGuest).toBe('function');
    });
  });
});