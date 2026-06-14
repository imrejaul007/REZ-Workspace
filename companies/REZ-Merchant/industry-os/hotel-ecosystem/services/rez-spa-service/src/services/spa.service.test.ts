import { describe, it, expect, beforeEach } from 'vitest';
import { SpaService } from './spa.service';

describe('SpaService', () => {
  let service: SpaService;

  beforeEach(() => {
    service = new SpaService();
  });

  describe('treatments', () => {
    it('should have default treatments', async () => {
      const treatments = await service.getTreatments('default');
      expect(treatments.length).toBeGreaterThan(0);
    });

    it('should create a new treatment', async () => {
      const treatment = await service.createTreatment('hotel-1', {
        name: 'Test Massage',
        description: 'A test massage treatment',
        category: 'massage',
        duration: 60,
        price: 3000,
        currency: 'INR',
        benefits: ['Relaxation'],
        available: true,
      });

      expect(treatment.treatmentId).toBeDefined();
      expect(treatment.name).toBe('Test Massage');
      expect(treatment.price).toBe(3000);
    });

    it('should filter treatments by category', async () => {
      await service.createTreatment('hotel-1', {
        name: 'Test Facial',
        description: 'Test',
        category: 'facial',
        duration: 60,
        price: 2000,
        currency: 'INR',
        benefits: [],
        available: true,
      });

      const facials = await service.getTreatments('hotel-1', 'facial');
      expect(facials.every(t => t.category === 'facial')).toBe(true);
    });
  });

  describe('therapists', () => {
    it('should add a therapist', async () => {
      const therapist = await service.addTherapist('hotel-1', {
        name: 'Dr. Smith',
        gender: 'female',
        specialties: ['massage', 'facial'],
        experience: 5,
        rating: 4.8,
        availability: [
          { dayOfWeek: 1, startHour: 9, endHour: 17 },
          { dayOfWeek: 2, startHour: 9, endHour: 17 },
        ],
        schedule: [],
      });

      expect(therapist.therapistId).toBeDefined();
      expect(therapist.name).toBe('Dr. Smith');
      expect(therapist.specialties).toContain('massage');
    });

    it('should get available therapists', async () => {
      const therapist = await service.addTherapist('hotel-1', {
        name: 'Dr. Smith',
        gender: 'female',
        specialties: ['massage'],
        experience: 5,
        rating: 4.8,
        availability: [
          { dayOfWeek: 1, startHour: 9, endHour: 17 },
        ],
        schedule: [],
      });

      const therapists = await service.getTherapists('hotel-1');
      expect(therapists.length).toBeGreaterThan(0);
    });
  });

  describe('bookings', () => {
    it('should create a booking', async () => {
      // First add a therapist
      await service.addTherapist('hotel-1', {
        name: 'Dr. Smith',
        gender: 'female',
        specialties: ['massage'],
        experience: 5,
        rating: 4.8,
        availability: [
          { dayOfWeek: 1, startHour: 9, endHour: 20 },
        ],
        schedule: [],
      });

      const treatments = await service.getTreatments('default');
      const massage = treatments.find(t => t.category === 'massage');
      expect(massage).toBeDefined();

      const booking = await service.createBooking(
        'hotel-1',
        'John Doe',
        '9876543210',
        massage!.treatmentId,
        new Date('2026-06-15'),
        '10:00',
        'any',
        undefined,
        undefined,
        '101'
      );

      expect(booking.bookingId).toBeDefined();
      expect(booking.guestName).toBe('John Doe');
      expect(booking.treatmentName).toBe(massage!.name);
      expect(booking.total).toBeGreaterThan(0);
    });

    it('should confirm a booking', async () => {
      const treatments = await service.getTreatments('default');
      const booking = await service.createBooking(
        'hotel-1',
        'John Doe',
        '9876543210',
        treatments[0].treatmentId,
        new Date('2026-06-15'),
        '10:00',
        'any'
      );

      const confirmed = await service.confirmBooking(booking.bookingId, 500);
      expect(confirmed.status).toBe('confirmed');
      expect(confirmed.depositAmount).toBe(500);
    });

    it('should cancel a booking', async () => {
      const treatments = await service.getTreatments('default');
      const booking = await service.createBooking(
        'hotel-1',
        'John Doe',
        '9876543210',
        treatments[0].treatmentId,
        new Date('2026-06-15'),
        '10:00',
        'any'
      );

      const cancelled = await service.cancelBooking(booking.bookingId, 'Changed plans');
      expect(cancelled.status).toBe('cancelled');
      expect(cancelled.cancellationReason).toBe('Changed plans');
    });

    it('should not allow cancellation of completed bookings', async () => {
      const treatments = await service.getTreatments('default');
      const booking = await service.createBooking(
        'hotel-1',
        'John Doe',
        '9876543210',
        treatments[0].treatmentId,
        new Date('2026-06-15'),
        '10:00',
        'any'
      );

      await service.markComplete(booking.bookingId);
      await expect(service.cancelBooking(booking.bookingId)).rejects.toThrow('Cannot cancel this booking');
    });
  });

  describe('getAvailableSlots', () => {
    it('should return slots or empty array based on availability', async () => {
      const treatments = await service.getTreatments('default');
      const slots = await service.getAvailableSlots('hotel-1', treatments[0].treatmentId, new Date('2026-06-15'));

      // Slots depend on therapist availability
      expect(Array.isArray(slots)).toBe(true);
    });
  });

  describe('analytics', () => {
    it('should return daily statistics', async () => {
      const treatments = await service.getTreatments('default');

      // Create a booking
      const booking = await service.createBooking(
        'hotel-1',
        'John Doe',
        '9876543210',
        treatments[0].treatmentId,
        new Date(),
        '10:00',
        'any'
      );
      await service.confirmBooking(booking.bookingId);
      await service.markComplete(booking.bookingId);

      const stats = await service.getDailyStats('hotel-1', new Date());
      expect(stats.totalBookings).toBeGreaterThanOrEqual(1);
      expect(stats.revenue).toBeGreaterThan(0);
    });
  });
});
