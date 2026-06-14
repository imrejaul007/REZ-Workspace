import { v4 as uuidv4 } from 'uuid';

export type TreatmentCategory = 'massage' | 'facial' | 'body_treatment' | 'aromatherapy' | 'reflexology' | 'couple' | 'meditation';
export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
export type TherapistGender = 'male' | 'female' | 'any';

export interface Treatment {
  treatmentId: string;
  hotelId: string;
  name: string;
  description: string;
  category: TreatmentCategory;
  duration: number; // minutes
  price: number;
  currency: string;
  image?: string;
  benefits: string[];
  contraindications?: string[];
  requiredEquipment?: string[];
  available: boolean;
  peakHoursPricing?: {
    morning: number; // 6am-12pm
    afternoon: number; // 12pm-5pm
    evening: number; // 5pm-9pm
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Therapist {
  therapistId: string;
  hotelId: string;
  name: string;
  photo?: string;
  gender: 'male' | 'female';
  specialties: TreatmentCategory[];
  experience: number; // years
  rating: number;
  availability: {
    dayOfWeek: number; // 0-6
    startHour: number;
    endHour: number;
  }[];
  schedule: {
    date: string; // YYYY-MM-DD
    bookedSlots: { startTime: string; endTime: string; treatmentId: string }[];
  }[];
  createdAt: Date;
}

export interface SpaBooking {
  bookingId: string;
  hotelId: string;
  guestId?: string;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  treatmentId: string;
  treatmentName: string;
  therapistId?: string;
  therapistName?: string;
  preferredGender: TherapistGender;
  date: Date;
  startTime: string;
  endTime: string;
  duration: number;
  status: BookingStatus;
  price: number;
  taxes: number;
  total: number;
  paymentStatus: 'pending' | 'deposit_paid' | 'fully_paid' | 'refunded';
  paymentMethod?: 'room_charge' | 'card' | 'cash';
  depositAmount?: number;
  roomNumber?: string;
  specialRequests?: string;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Package {
  packageId: string;
  hotelId: string;
  name: string;
  description: string;
  treatments: {
    treatmentId: string;
    name: string;
    duration: number;
    sequence: number;
  }[];
  totalDuration: number;
  totalPrice: number;
  discountPercentage: number;
  finalPrice: number;
  validDays: number; // How many days valid after purchase
  image?: string;
  available: boolean;
  createdAt: Date;
}

export class SpaService {
  private treatments: Map<string, Treatment> = new Map();
  private therapists: Map<string, Therapist> = new Map();
  private bookings: Map<string, SpaBooking> = new Map();
  private packages: Map<string, Package> = new Map();

  constructor() {
    this.initializeDefaultTreatments();
  }

  private initializeDefaultTreatments() {
    const defaults: Omit<Treatment, 'treatmentId' | 'hotelId' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'Swedish Massage',
        description: 'Classic relaxation massage with long strokes and kneading',
        category: 'massage',
        duration: 60,
        price: 2500,
        currency: 'INR',
        benefits: ['Stress relief', 'Improved circulation', 'Muscle relaxation'],
        available: true,
        peakHoursPricing: { morning: 2000, afternoon: 2500, evening: 3000 },
      },
      {
        name: 'Deep Tissue Massage',
        description: 'Intense massage targeting deep muscle layers',
        category: 'massage',
        duration: 90,
        price: 3500,
        currency: 'INR',
        benefits: ['Chronic pain relief', 'Muscle tension release', 'Post-workout recovery'],
        available: true,
        peakHoursPricing: { morning: 3000, afternoon: 3500, evening: 4000 },
      },
      {
        name: 'Aromatherapy Facial',
        description: 'Rejuvenating facial with essential oils',
        category: 'facial',
        duration: 60,
        price: 2000,
        currency: 'INR',
        benefits: ['Skin hydration', 'Relaxation', 'Glow enhancement'],
        available: true,
      },
      {
        name: 'Hot Stone Therapy',
        description: 'Heated basalt stones for deep relaxation',
        category: 'massage',
        duration: 75,
        price: 4000,
        currency: 'INR',
        benefits: ['Muscle relaxation', 'Improved sleep', 'Stress relief'],
        available: true,
      },
      {
        name: 'Couple Retreat',
        description: 'Side-by-side massage experience for couples',
        category: 'couple',
        duration: 90,
        price: 6000,
        currency: 'INR',
        benefits: ['Romantic experience', 'Shared relaxation', 'Quality time'],
        available: true,
      },
    ];

    defaults.forEach(t => {
      const treatment: Treatment = {
        ...t,
        treatmentId: `TRT-${uuidv4().substring(0, 8).toUpperCase()}`,
        hotelId: 'default',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.treatments.set(treatment.treatmentId, treatment);
    });
  }

  // ============ TREATMENTS ============
  async createTreatment(hotelId: string, data: Omit<Treatment, 'treatmentId' | 'hotelId' | 'createdAt' | 'updatedAt'>): Promise<Treatment> {
    const treatment: Treatment = {
      ...data,
      treatmentId: `TRT-${uuidv4().substring(0, 8).toUpperCase()}`,
      hotelId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.treatments.set(treatment.treatmentId, treatment);
    return treatment;
  }

  async getTreatments(hotelId: string, category?: TreatmentCategory): Promise<Treatment[]> {
    let treatments = Array.from(this.treatments.values())
      .filter(t => t.hotelId === hotelId && t.available);

    if (category) {
      treatments = treatments.filter(t => t.category === category);
    }
    return treatments;
  }

  async getTreatment(treatmentId: string): Promise<Treatment | null> {
    return this.treatments.get(treatmentId) || null;
  }

  async updateTreatment(treatmentId: string, updates: Partial<Treatment>): Promise<Treatment | null> {
    const treatment = this.treatments.get(treatmentId);
    if (!treatment) return null;

    const updated = { ...treatment, ...updates, treatmentId, updatedAt: new Date() };
    this.treatments.set(treatmentId, updated);
    return updated;
  }

  // ============ THERAPISTS ============
  async addTherapist(hotelId: string, data: Omit<Therapist, 'therapistId' | 'hotelId' | 'createdAt'>): Promise<Therapist> {
    const therapist: Therapist = {
      ...data,
      therapistId: `THR-${uuidv4().substring(0, 8).toUpperCase()}`,
      hotelId,
      createdAt: new Date(),
    };
    this.therapists.set(therapist.therapistId, therapist);
    return therapist;
  }

  async getTherapists(hotelId: string, specialty?: TreatmentCategory): Promise<Therapist[]> {
    let therapists = Array.from(this.therapists.values())
      .filter(t => t.hotelId === hotelId);

    if (specialty) {
      therapists = therapists.filter(t => t.specialties.includes(specialty));
    }
    return therapists;
  }

  async getTherapist(therapistId: string): Promise<Therapist | null> {
    return this.therapists.get(therapistId) || null;
  }

  async getAvailableTherapists(hotelId: string, date: Date, duration: number, gender?: TherapistGender): Promise<Therapist[]> {
    const therapists = await this.getTherapists(hotelId);

    return therapists.filter(therapist => {
      // Filter by gender preference
      if (gender && gender !== 'any' && therapist.gender !== gender) {
        return false;
      }

      // Check day availability
      const dayOfWeek = date.getDay();
      const dayAvailability = therapist.availability.find(a => a.dayOfWeek === dayOfWeek);
      if (!dayAvailability) return false;

      // Check time slot
      const bookingTime = date.getHours();
      const endTime = bookingTime + duration / 60;

      return bookingTime >= dayAvailability.startHour && endTime <= dayAvailability.endHour;
    });
  }

  // ============ BOOKINGS ============
  async createBooking(
    hotelId: string,
    guestName: string,
    guestPhone: string,
    treatmentId: string,
    date: Date,
    startTime: string,
    preferredGender: TherapistGender,
    guestId?: string,
    guestEmail?: string,
    roomNumber?: string,
    therapistId?: string,
    specialRequests?: string
  ): Promise<SpaBooking> {
    const treatment = await this.getTreatment(treatmentId);
    if (!treatment) throw new Error('Treatment not found');

    // Find available therapist
    let assignedTherapist: Therapist | null = null;
    if (therapistId) {
      assignedTherapist = await this.getTherapist(therapistId);
    } else {
      const available = await this.getAvailableTherapists(hotelId, date, treatment.duration, preferredGender);
      assignedTherapist = available[0] || null;
    }

    // Calculate time
    const endTime = this.calculateEndTime(startTime, treatment.duration);

    // Calculate price based on time of day
    let price = treatment.price;
    if (treatment.peakHoursPricing) {
      const hour = parseInt(startTime.split(':')[0]);
      if (hour >= 6 && hour < 12) price = treatment.peakHoursPricing.morning;
      else if (hour >= 12 && hour < 17) price = treatment.peakHoursPricing.afternoon;
      else price = treatment.peakHoursPricing.evening;
    }

    const taxes = price * 0.18;
    const total = price + taxes;

    const booking: SpaBooking = {
      bookingId: `SPAB-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      hotelId,
      guestId,
      guestName,
      guestPhone,
      guestEmail,
      treatmentId,
      treatmentName: treatment.name,
      therapistId: assignedTherapist?.therapistId,
      therapistName: assignedTherapist?.name,
      preferredGender,
      date,
      startTime,
      endTime,
      duration: treatment.duration,
      status: 'pending',
      price,
      taxes,
      total,
      paymentStatus: 'pending',
      roomNumber,
      specialRequests,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.bookings.set(booking.bookingId, booking);
    return booking;
  }

  async confirmBooking(bookingId: string, depositAmount?: number): Promise<SpaBooking> {
    const booking = this.bookings.get(bookingId);
    if (!booking) throw new Error('Booking not found');

    booking.status = 'confirmed';
    if (depositAmount) {
      booking.depositAmount = depositAmount;
      booking.paymentStatus = 'deposit_paid';
    }
    booking.updatedAt = new Date();

    this.bookings.set(bookingId, booking);
    return booking;
  }

  async cancelBooking(bookingId: string, reason?: string): Promise<SpaBooking> {
    const booking = this.bookings.get(bookingId);
    if (!booking) throw new Error('Booking not found');

    if (['completed', 'cancelled'].includes(booking.status)) {
      throw new Error('Cannot cancel this booking');
    }

    booking.status = 'cancelled';
    booking.cancellationReason = reason;
    booking.updatedAt = new Date();

    this.bookings.set(bookingId, booking);
    return booking;
  }

  async markComplete(bookingId: string): Promise<SpaBooking> {
    const booking = this.bookings.get(bookingId);
    if (!booking) throw new Error('Booking not found');

    booking.status = 'completed';
    booking.paymentStatus = 'fully_paid';
    booking.updatedAt = new Date();

    this.bookings.set(bookingId, booking);
    return booking;
  }

  async processPayment(bookingId: string, method: SpaBooking['paymentMethod'], amount: number): Promise<SpaBooking> {
    const booking = this.bookings.get(bookingId);
    if (!booking) throw new Error('Booking not found');

    booking.paymentMethod = method;
    const totalPaid = (booking.depositAmount || 0) + amount;
    booking.paymentStatus = totalPaid >= booking.total ? 'fully_paid' : 'deposit_paid';
    booking.updatedAt = new Date();

    this.bookings.set(bookingId, booking);
    return booking;
  }

  async getBooking(bookingId: string): Promise<SpaBooking | null> {
    return this.bookings.get(bookingId) || null;
  }

  async getBookings(hotelId: string, date?: Date, status?: BookingStatus): Promise<SpaBooking[]> {
    let bookings = Array.from(this.bookings.values())
      .filter(b => b.hotelId === hotelId);

    if (date) {
      const dateStr = date.toISOString().split('T')[0];
      bookings = bookings.filter(b => b.date.toISOString().split('T')[0] === dateStr);
    }

    if (status) {
      bookings = bookings.filter(b => b.status === status);
    }

    return bookings.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  async getGuestBookings(guestId: string): Promise<SpaBooking[]> {
    return Array.from(this.bookings.values())
      .filter(b => b.guestId === guestId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async getAvailableSlots(hotelId: string, treatmentId: string, date: Date, therapistId?: string): Promise<string[]> {
    const treatment = await this.getTreatment(treatmentId);
    if (!treatment) return [];

    const therapists = therapistId
      ? [await this.getTherapist(therapistId)].filter(Boolean) as Therapist[]
      : await this.getAvailableTherapists(hotelId, date, treatment.duration);

    if (therapists.length === 0) return [];

    // Generate time slots (every 30 minutes)
    const slots: string[] = [];
    for (let hour = 9; hour <= 20; hour++) {
      for (let min = 0; min < 60; min += 30) {
        if (hour === 20 && min > 0) break;
        const slot = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;

        // Check if slot is available for any therapist
        const available = therapists.some(t => {
          // Check if therapist is available at this time
          const dayAvailability = t.availability.find(a => a.dayOfWeek === date.getDay());
          if (!dayAvailability) return false;

          const slotHour = hour;
          const slotEnd = hour + treatment.duration / 60;

          return slotHour >= dayAvailability.startHour && slotEnd <= dayAvailability.endHour;
        });

        if (available) slots.push(slot);
      }
    }

    return slots;
  }

  // ============ PACKAGES ============
  async createPackage(hotelId: string, data: Omit<Package, 'packageId' | 'hotelId' | 'createdAt'>): Promise<Package> {
    const pkg: Package = {
      ...data,
      packageId: `PKG-${uuidv4().substring(0, 8).toUpperCase()}`,
      hotelId,
      createdAt: new Date(),
    };
    this.packages.set(pkg.packageId, pkg);
    return pkg;
  }

  async getPackages(hotelId: string): Promise<Package[]> {
    return Array.from(this.packages.values())
      .filter(p => p.hotelId === hotelId && p.available);
  }

  async getPackage(packageId: string): Promise<Package | null> {
    return this.packages.get(packageId) || null;
  }

  // ============ ANALYTICS ============
  async getDailyStats(hotelId: string, date: Date = new Date()): Promise<{
    totalBookings: number;
    completedBookings: number;
    revenue: number;
    byTreatment: { name: string; count: number; revenue: number }[];
    popularTimes: { hour: number; count: number }[];
    therapistUtilization: { therapistId: string; name: string; bookings: number; utilization: number }[];
  }> {
    const bookings = await this.getBookings(hotelId, date);
    const completed = bookings.filter(b => b.status === 'completed');
    const revenue = completed.reduce((sum, b) => sum + b.total, 0);

    // By treatment
    const byTreatmentMap = new Map<string, { name: string; count: number; revenue: number }>();
    completed.forEach(b => {
      const existing = byTreatmentMap.get(b.treatmentId) || { name: b.treatmentName, count: 0, revenue: 0 };
      existing.count++;
      existing.revenue += b.total;
      byTreatmentMap.set(b.treatmentId, existing);
    });
    const byTreatment = Array.from(byTreatmentMap.values());

    // Popular times
    const popularTimesMap = new Map<number, number>();
    bookings.forEach(b => {
      const hour = parseInt(b.startTime.split(':')[0]);
      popularTimesMap.set(hour, (popularTimesMap.get(hour) || 0) + 1);
    });
    const popularTimes = Array.from(popularTimesMap.entries())
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => b.count - a.count);

    // Therapist utilization
    const therapists = await this.getTherapists(hotelId);
    const therapistUtilization = therapists.map(t => {
      const tBookings = completed.filter(b => b.therapistId === t.therapistId);
      const workHours = 8; // Assume 8 hour shift
      const availableSlots = workHours * 2; // 30 min slots
      return {
        therapistId: t.therapistId,
        name: t.name,
        bookings: tBookings.length,
        utilization: Math.round((tBookings.length / availableSlots) * 100),
      };
    });

    return {
      totalBookings: bookings.length,
      completedBookings: completed.length,
      revenue,
      byTreatment,
      popularTimes,
      therapistUtilization,
    };
  }

  private calculateEndTime(startTime: string, durationMinutes: number): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  }
}
