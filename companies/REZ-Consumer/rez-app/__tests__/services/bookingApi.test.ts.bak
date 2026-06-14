import bookingApi from '@/services/bookingApi';

jest.mock('@/services/apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockClient = require('@/services/apiClient').default;

const mockBooking = {
  id: 'book1',
  userId: 'u1',
  serviceId: 'svc1',
  storeId: 'store1',
  bookingDate: '2026-04-10',
  timeSlot: { start: '10:00', end: '11:00' },
  status: 'confirmed' as const,
  createdAt: '2026-04-05T00:00:00Z',
};

describe('bookingApi', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('createBooking', () => {
    it('creates a booking successfully', async () => {
      mockClient.post.mockResolvedValueOnce({ success: true, data: mockBooking });
      const res = await bookingApi.createBooking({
        serviceId: 'svc1',
        storeId: 'store1',
        bookingDate: '2026-04-10',
        timeSlot: { start: '10:00', end: '11:00' },
      });
      expect(res.success).toBe(true);
      expect(res.data?.id).toBe('book1');
    });

    it('handles slot unavailable error', async () => {
      mockClient.post.mockResolvedValueOnce({ success: false, message: 'Slot not available' });
      const res = await bookingApi.createBooking({ serviceId: 'svc1', storeId: 's1', bookingDate: '2026-04-10', timeSlot: { start: '10:00', end: '11:00' } });
      expect(res.success).toBe(false);
    });
  });

  describe('getUserBookings', () => {
    it('returns user bookings', async () => {
      mockClient.get.mockResolvedValueOnce({ success: true, data: { bookings: [mockBooking], pagination: { page: 1, pages: 1, total: 1, limit: 10 } } });
      const res = await bookingApi.getUserBookings({ status: 'upcoming' });
      expect(res.success).toBe(true);
      expect(res.data?.bookings).toHaveLength(1);
    });
  });

  describe('getBookingById', () => {
    it('returns specific booking', async () => {
      mockClient.get.mockResolvedValueOnce({ success: true, data: mockBooking });
      const res = await bookingApi.getBookingById('book1');
      expect(res.success).toBe(true);
      expect(res.data?.id).toBe('book1');
      expect(mockClient.get).toHaveBeenCalledWith('/service-bookings/book1');
    });

    it('handles not found', async () => {
      mockClient.get.mockResolvedValueOnce({ success: false, message: 'Booking not found' });
      const res = await bookingApi.getBookingById('nonexistent');
      expect(res.success).toBe(false);
    });
  });

  describe('cancelBooking', () => {
    it('cancels a booking with reason', async () => {
      mockClient.put.mockResolvedValueOnce({ success: true, data: { ...mockBooking, status: 'cancelled' } });
      const res = await bookingApi.cancelBooking('book1', 'Changed plans');
      expect(res.success).toBe(true);
    });
  });

  describe('rescheduleBooking', () => {
    it('reschedules to new date and slot', async () => {
      mockClient.put.mockResolvedValueOnce({ success: true, data: { ...mockBooking, bookingDate: '2026-04-15', timeSlot: { start: '14:00', end: '15:00' } } });
      const res = await bookingApi.rescheduleBooking('book1', { newDate: '2026-04-15', newTimeSlot: '14:00' });
      expect(res.success).toBe(true);
    });
  });

  describe('getAvailableSlots', () => {
    it('returns available time slots', async () => {
      mockClient.get.mockResolvedValueOnce({ success: true, data: [{ time: '09:00', available: true }, { time: '10:00', available: false }] });
      const res = await bookingApi.getAvailableSlots('svc1', '2026-04-10');
      expect(res.success).toBe(true);
      expect(res.data).toHaveLength(2);
    });
  });

  describe('getUpcomingBookings', () => {
    it('returns upcoming bookings', async () => {
      mockClient.get.mockResolvedValueOnce({ success: true, data: [mockBooking] });
      const res = await bookingApi.getUpcomingBookings(5);
      expect(res.success).toBe(true);
    });
  });

  describe('getBookingStats', () => {
    it('returns booking statistics', async () => {
      mockClient.get.mockResolvedValueOnce({ success: true, data: { totalBookings: 10, upcomingCount: 2, completedCount: 7, cancelledCount: 1 } });
      const res = await bookingApi.getBookingStats();
      expect(res.success).toBe(true);
      expect(res.data?.totalBookings).toBe(10);
    });
  });
});
