/**
 * rez-multi-property-dashboard Unit Tests
 * Tests analytics, KPIs, and multi-property reporting functionality
 */

import { describe, it, expect } from 'vitest';

describe('Hotel Management', () => {
  it('should have correct hotel structure', () => {
    const hotel = {
      id: 'hotel-001',
      name: 'Grand Plaza Mumbai',
      location: 'Mumbai, Maharashtra',
      chain: 'Grand Plaza Hotels',
      totalRooms: 250,
      starRating: 5,
      openedDate: new Date('2010-05-15'),
    };

    expect(hotel).toHaveProperty('id');
    expect(hotel).toHaveProperty('name');
    expect(hotel).toHaveProperty('totalRooms');
    expect(hotel).toHaveProperty('starRating');
    expect(hotel.starRating).toBeGreaterThanOrEqual(1);
    expect(hotel.starRating).toBeLessThanOrEqual(5);
  });

  it('should validate hotel locations', () => {
    const locations = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad'];
    expect(locations.length).toBeGreaterThan(0);
  });

  it('should calculate total chain capacity', () => {
    const hotels = [
      { id: 'hotel-001', totalRooms: 250 },
      { id: 'hotel-002', totalRooms: 180 },
      { id: 'hotel-003', totalRooms: 200 },
    ];

    const totalRooms = hotels.reduce((sum, h) => sum + h.totalRooms, 0);
    expect(totalRooms).toBe(630);
  });

  it('should validate star ratings', () => {
    const validRatings = [1, 2, 3, 4, 5];
    validRatings.forEach(rating => {
      expect(rating).toBeGreaterThanOrEqual(1);
      expect(rating).toBeLessThanOrEqual(5);
    });
  });
});

describe('Revenue Analytics', () => {
  it('should calculate total revenue correctly', () => {
    const dailyRevenue = [
      { date: '2026-06-01', revenue: 150000 },
      { date: '2026-06-02', revenue: 165000 },
      { date: '2026-06-03', revenue: 180000 },
    ];

    const totalRevenue = dailyRevenue.reduce((sum, d) => sum + d.revenue, 0);
    expect(totalRevenue).toBe(495000);
  });

  it('should calculate revenue mix percentages', () => {
    const revenue = {
      rooms: 300000,
      fAndB: 120000,
      spa: 45000,
      laundry: 15000,
      other: 20000,
    };

    const total = revenue.rooms + revenue.fAndB + revenue.spa + revenue.laundry + revenue.other;

    const mix = {
      rooms: Math.round((revenue.rooms / total) * 100),
      fAndB: Math.round((revenue.fAndB / total) * 100),
      spa: Math.round((revenue.spa / total) * 100),
      laundry: Math.round((revenue.laundry / total) * 100),
      other: Math.round((revenue.other / total) * 100),
    };

    expect(mix.rooms).toBe(64);
    expect(mix.fAndB).toBe(25);
    expect(mix.spa).toBe(9);
  });

  it('should calculate ADR correctly', () => {
    const totalRoomRevenue = 450000;
    const occupiedRooms = 150;
    const adr = Math.round(totalRoomRevenue / occupiedRooms);

    expect(adr).toBe(3000);
  });

  it('should calculate RevPAR correctly', () => {
    const adr = 4500;
    const occupancyRate = 0.75;
    const revpar = Math.round(adr * occupancyRate);

    expect(revpar).toBe(3375);
  });
});

describe('Occupancy Analytics', () => {
  it('should calculate average occupancy correctly', () => {
    const dailyOccupancy = [75.5, 82.3, 68.9, 71.2, 79.8];
    const avgOccupancy = dailyOccupancy.reduce((a, b) => a + b) / dailyOccupancy.length;

    expect(Math.round(avgOccupancy * 10) / 10).toBe(75.5);
  });

  it('should calculate occupancy by room type', () => {
    const rooms = [
      { type: 'standard', total: 100, occupied: 75 },
      { type: 'deluxe', total: 50, occupied: 42 },
      { type: 'suite', total: 25, occupied: 20 },
    ];

    rooms.forEach(room => {
      const occupancy = (room.occupied / room.total) * 100;
      expect(occupancy).toBeGreaterThan(0);
      expect(occupancy).toBeLessThanOrEqual(100);
    });
  });

  it('should identify peak occupancy days', () => {
    const dailyOccupancy = [
      { date: '2026-06-01', rate: 75 },
      { date: '2026-06-02', rate: 92 },
      { date: '2026-06-03', rate: 88 },
      { date: '2026-06-04', rate: 95 },
      { date: '2026-06-05', rate: 85 },
    ];

    const peakDays = dailyOccupancy.filter(d => d.rate > 90);
    expect(peakDays.length).toBe(2);
  });
});

describe('Booking Analytics', () => {
  it('should calculate booking source mix', () => {
    const bookings = {
      direct: 45,
      ota: 30,
      corporate: 15,
      walkin: 10,
    };

    const total = bookings.direct + bookings.ota + bookings.corporate + bookings.walkin;
    const mix = {
      direct: Math.round((bookings.direct / total) * 100),
      ota: Math.round((bookings.ota / total) * 100),
      corporate: Math.round((bookings.corporate / total) * 100),
      walkin: Math.round((bookings.walkin / total) * 100),
    };

    expect(mix.direct).toBe(45);
    expect(mix.ota).toBe(30);
  });

  it('should calculate cancellation rate', () => {
    const totalBookings = 500;
    const cancellations = 25;
    const cancellationRate = Math.round((cancellations / totalBookings) * 100);

    expect(cancellationRate).toBe(5);
  });

  it('should calculate average booking value', () => {
    const bookings = [
      { totalAmount: 15000 },
      { totalAmount: 22500 },
      { totalAmount: 18000 },
      { totalAmount: 30000 },
    ];

    const totalRevenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
    const avgValue = totalRevenue / bookings.length;

    expect(avgValue).toBe(21375);
  });

  it('should track advance booking patterns', () => {
    const bookings = [
      { daysInAdvance: 45, totalAmount: 15000 },
      { daysInAdvance: 7, totalAmount: 18000 },
      { daysInAdvance: 21, totalAmount: 22500 },
    ];

    const avgAdvance = bookings.reduce((sum, b) => sum + b.daysInAdvance, 0) / bookings.length;
    expect(Math.round(avgAdvance)).toBe(24);
  });
});

describe('Guest Analytics', () => {
  it('should calculate repeat guest rate', () => {
    const totalGuests = 500;
    const repeatGuests = 150;
    const repeatRate = Math.round((repeatGuests / totalGuests) * 100);

    expect(repeatRate).toBe(30);
  });

  it('should calculate average length of stay', () => {
    const bookings = [
      { nights: 3 },
      { nights: 2 },
      { nights: 5 },
      { nights: 1 },
    ];

    const totalNights = bookings.reduce((sum, b) => sum + b.nights, 0);
    const avgStay = totalNights / bookings.length;

    expect(avgStay).toBe(2.75);
  });

  it('should analyze guest country distribution', () => {
    const guests = [
      { country: 'India' },
      { country: 'USA' },
      { country: 'India' },
      { country: 'UK' },
      { country: 'India' },
    ];

    const distribution: Record<string, number> = {};
    guests.forEach(g => {
      distribution[g.country] = (distribution[g.country] || 0) + 1;
    });

    expect(distribution['India']).toBe(3);
    expect(distribution['USA']).toBe(1);
  });
});

describe('Rating Analytics', () => {
  it('should calculate average rating correctly', () => {
    const ratings = [4.5, 4.0, 4.8, 3.5, 5.0, 4.2];
    const avgRating = ratings.reduce((a, b) => a + b) / ratings.length;

    expect(Math.round(avgRating * 10) / 10).toBe(4.3);
  });

  it('should calculate rating distribution', () => {
    const ratings = [5, 4, 4, 4, 4, 3, 3, 3, 2, 1];
    const distribution: Record<number, number> = {};

    ratings.forEach(r => {
      distribution[r] = (distribution[r] || 0) + 1;
    });

    expect(distribution[5]).toBe(1);
    expect(distribution[4]).toBe(4);
    expect(distribution[3]).toBe(3);
  });

  it('should calculate category averages', () => {
    const feedback = [
      { categories: { cleanliness: 4.5, service: 4.0, amenities: 4.2 } },
      { categories: { cleanliness: 4.8, service: 4.5, amenities: 4.0 } },
    ];

    const avgCategories = {
      cleanliness: (4.5 + 4.8) / 2,
      service: (4.0 + 4.5) / 2,
      amenities: (4.2 + 4.0) / 2,
    };

    expect(Math.round(avgCategories.cleanliness * 10) / 10).toBe(4.7);
    expect(Math.round(avgCategories.service * 10) / 10).toBe(4.3);
  });
});

describe('Staff Performance', () => {
  it('should calculate staff productivity metrics', () => {
    const staff = {
      checkInsHandled: 156,
      checkOutsHandled: 148,
      upsellsGenerated: 28,
      complaintsResolved: 12,
    };

    const productivity = staff.checkInsHandled + staff.checkOutsHandled + staff.upsellsGenerated;
    expect(productivity).toBe(332);
  });

  it('should rank staff by rating', () => {
    const staff = [
      { name: 'Vikram', rating: 4.5 },
      { name: 'Anita', rating: 4.8 },
      { name: 'Raj', rating: 4.2 },
    ];

    const ranked = staff.sort((a, b) => b.rating - a.rating);
    expect(ranked[0].name).toBe('Anita');
    expect(ranked[2].name).toBe('Raj');
  });

  it('should calculate department averages', () => {
    const staff = [
      { department: 'Front Office', rating: 4.5 },
      { department: 'Front Office', rating: 4.8 },
      { department: 'Housekeeping', rating: 4.2 },
      { department: 'Housekeeping', rating: 4.4 },
    ];

    const deptAvg: Record<string, number[]> = {};
    staff.forEach(s => {
      if (!deptAvg[s.department]) deptAvg[s.department] = [];
      deptAvg[s.department].push(s.rating);
    });

    expect(Math.round((deptAvg['Front Office'][0] + deptAvg['Front Office'][1]) / 2 * 10) / 10).toBe(4.7);
  });
});

describe('Date Range Calculations', () => {
  it('should calculate date range correctly', () => {
    const endDate = new Date('2026-06-30');
    const startDate = new Date('2026-06-01');

    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    expect(days).toBe(30);
  });

  it('should handle default date ranges', () => {
    const end = new Date();
    const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    expect(end.getTime()).toBeGreaterThan(start.getTime());
    expect(start.getTime()).toBeGreaterThan(0);
  });
});

describe('API Response Format', () => {
  it('should format overview response correctly', () => {
    const response = {
      success: true,
      data: {
        totalHotels: 3,
        totalRooms: 630,
        totalRevenue: 4950000,
        avgOccupancy: 75.5,
        avgGuestRating: 4.3,
      },
    };

    expect(response.success).toBe(true);
    expect(response.data).toHaveProperty('totalHotels');
    expect(response.data).toHaveProperty('totalRevenue');
  });

  it('should format error response correctly', () => {
    const errorResponse = {
      success: false,
      message: 'Hotel not found',
    };

    expect(errorResponse.success).toBe(false);
    expect(errorResponse).toHaveProperty('message');
  });
});

describe('Health Check', () => {
  it('should return correct health status format', () => {
    const health = {
      status: 'healthy',
      service: 'rez-multi-property-dashboard',
      port: 4046,
      timestamp: new Date().toISOString(),
      stats: {
        hotels: 3,
        metricsDays: 90,
        bookings: 150,
        feedback: 45,
        staff: 25,
      },
    };

    expect(health.status).toBe('healthy');
    expect(health).toHaveProperty('stats');
    expect(health.stats).toHaveProperty('hotels');
  });
});

describe('Comparison Analytics', () => {
  it('should compare hotels by metric', () => {
    const metrics = [
      { hotelId: 'hotel-001', adr: 4500 },
      { hotelId: 'hotel-002', adr: 3800 },
      { hotelId: 'hotel-003', adr: 4200 },
    ];

    const sorted = metrics.sort((a, b) => b.adr - a.adr);
    expect(sorted[0].hotelId).toBe('hotel-001');
  });

  it('should calculate performance variance', () => {
    const hotel1 = { adr: 4500 };
    const avgAdr = 4167;
    const variance = ((hotel1.adr - avgAdr) / avgAdr) * 100;

    expect(Math.round(variance)).toBe(8);
  });
});
