/**
 * Booking service unit tests
 */

import { BookingService } from '../src/services/booking.service';
import { AdBookingModel } from '../src/models';

// Mock the model
jest.mock('../src/models', () => ({
  AdBookingModel: {
    findOne: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
    findOneAndUpdate: jest.fn(),
    aggregate: jest.fn(),
  },
}));

// Mock mongoose document
const mockSave = jest.fn();
const mockBooking = {
  bookingId: 'bk-test123',
  adId: 'ad-123',
  advertiserId: 'adv-123',
  userId: 'user-123',
  businessId: 'biz-123',
  type: 'restaurant',
  details: {
    date: new Date(),
    time: '19:00',
    guests: 2,
 service: undefined,
    notes: 'Test booking',
  },
  status: 'pending',
  payment: {
    required: true,
    amount: 500,
    status: 'pending',
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  save: mockSave,
};

describe('BookingService', () => {
  let service: BookingService;

  beforeEach(() => {
    service = new BookingService();
    jest.clearAllMocks();
  });

  describe('createBooking', () => {
    it('should create a new booking successfully', async () => {
      mockSave.mockResolvedValue(mockBooking);

      const result = await service.createBooking({
        adId: 'ad-123',
        advertiserId: 'adv-123',
        userId: 'user-123',
        businessId: 'biz-123',
        type: 'restaurant',
        details: {
          date: new Date(),
          time: '19:00',
          guests: 2,
          notes: 'Test booking',
        },
        paymentRequired: true,
        paymentAmount: 500,
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.adId).toBe('ad-123');
      expect(result.data?.status).toBe('pending');
    });

    it('should create booking without payment', async () => {
      mockSave.mockResolvedValue({ ...mockBooking, payment: undefined });

      const result = await service.createBooking({
        adId: 'ad-123',
        advertiserId: 'adv-123',
        userId: 'user-123',
        businessId: 'biz-123',
        type: 'salon',
        details: {
          service: 'Haircut',
        },
      });

      expect(result.success).toBe(true);
      expect(result.data?.payment).toBeUndefined();
    });
  });

  describe('getBooking', () => {
    it('should return booking when found', async () => {
      (AdBookingModel.findOne as jest.Mock).mockResolvedValue(mockBooking);

      const result = await service.getBooking('bk-test123');

      expect(result.success).toBe(true);
      expect(result.data?.bookingId).toBe('bk-test123');
    });

    it('should return error when booking not found', async () => {
      (AdBookingModel.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.getBooking('bk-nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Booking not found');
    });
  });

  describe('cancelBooking', () => {
    it('should cancel booking successfully', async () => {
      const cancelledBooking = { ...mockBooking, status: 'cancelled' };
      (AdBookingModel.findOne as jest.Mock).mockResolvedValue(mockBooking);
      mockSave.mockResolvedValue(cancelledBooking);

      const result = await service.cancelBooking('bk-test123', 'user-123');

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('cancelled');
    });

    it('should return error when booking not found', async () => {
      (AdBookingModel.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.cancelBooking('bk-nonexistent', 'user-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Booking not found');
    });

    it('should return error when user not authorized', async () => {
      (AdBookingModel.findOne as jest.Mock).mockResolvedValue(mockBooking);

      const result = await service.cancelBooking('bk-test123', 'wrong-user');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not authorized to cancel this booking');
    });

    it('should return error when booking already cancelled', async () => {
      (AdBookingModel.findOne as jest.Mock).mockResolvedValue({ ...mockBooking, status: 'cancelled' });

      const result = await service.cancelBooking('bk-test123', 'user-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Booking is already cancelled');
    });
  });

  describe('confirmBooking', () => {
    it('should confirm booking successfully', async () => {
      const confirmedBooking = { ...mockBooking, status: 'confirmed' };
      (AdBookingModel.findOne as jest.Mock).mockResolvedValue(mockBooking);
      mockSave.mockResolvedValue(confirmedBooking);

      const result = await service.confirmBooking('bk-test123', 'adv-123');

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('confirmed');
    });

    it('should return error when not authorized', async () => {
      (AdBookingModel.findOne as jest.Mock).mockResolvedValue(mockBooking);

      const result = await service.confirmBooking('bk-test123', 'wrong-adv');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not authorized to confirm this booking');
    });

    it('should return error when booking not pending', async () => {
      (AdBookingModel.findOne as jest.Mock).mockResolvedValue({ ...mockBooking, status: 'confirmed' });

      const result = await service.confirmBooking('bk-test123', 'adv-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Only pending bookings can be confirmed');
    });
  });

  describe('getUserBookings', () => {
    it('should return paginated user bookings', async () => {
      const bookings = [mockBooking];
      (AdBookingModel.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(bookings),
      });
      (AdBookingModel.countDocuments as jest.Mock).mockResolvedValue(1);

      const result = await service.getUserBookings('user-123', 1, 20);

      expect(result.success).toBe(true);
      expect(result.pagination).toBeDefined();
      expect(result.pagination?.total).toBe(1);
    });
  });

  describe('getAdBookings', () => {
    it('should return paginated ad bookings', async () => {
      const bookings = [mockBooking];
      (AdBookingModel.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(bookings),
      });
      (AdBookingModel.countDocuments as jest.Mock).mockResolvedValue(1);

      const result = await service.getAdBookings('ad-123', 1, 20);

      expect(result.success).toBe(true);
      expect(result.pagination).toBeDefined();
      expect(result.pagination?.total).toBe(1);
    });
  });

  describe('getUserBookingStats', () => {
    it('should return user booking statistics', async () => {
      (AdBookingModel.aggregate as jest.Mock).mockResolvedValue([
        { _id: 'pending', count: 2 },
        { _id: 'confirmed', count: 3 },
        { _id: 'completed', count: 5 },
        { _id: 'cancelled', count: 1 },
      ]);

      const result = await service.getUserBookingStats('user-123');

      expect(result.success).toBe(true);
      expect(result.data?.total).toBe(11);
      expect(result.data?.pending).toBe(2);
      expect(result.data?.confirmed).toBe(3);
      expect(result.data?.completed).toBe(5);
      expect(result.data?.cancelled).toBe(1);
    });
  });

  describe('updatePaymentStatus', () => {
    it('should update payment status successfully', async () => {
      const updatedBooking = { ...mockBooking, payment: { ...mockBooking.payment, status: 'paid' } };
      (AdBookingModel.findOneAndUpdate as jest.Mock).mockResolvedValue(updatedBooking);

      const result = await service.updatePaymentStatus('bk-test123', 'paid', 'tx-123');

      expect(result.success).toBe(true);
      expect(result.data?.payment?.status).toBe('paid');
    });

    it('should return error when booking not found', async () => {
      (AdBookingModel.findOneAndUpdate as jest.Mock).mockResolvedValue(null);

      const result = await service.updatePaymentStatus('bk-nonexistent', 'paid');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Booking not found');
    });
  });

  describe('completeBooking', () => {
    it('should complete confirmed booking', async () => {
      const completedBooking = { ...mockBooking, status: 'completed' };
      (AdBookingModel.findOneAndUpdate as jest.Mock).mockResolvedValue(completedBooking);

      const result = await service.completeBooking('bk-test123');

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('completed');
    });

    it('should return error when booking not confirmed', async () => {
      (AdBookingModel.findOneAndUpdate as jest.Mock).mockResolvedValue(null);

      const result = await service.completeBooking('bk-test123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Booking not found or not in confirmed status');
    });
  });
});