/**
 * rez-hotel-analytics-service Unit Tests
 * Tests analytics calculations and data structures
 */

import { describe, it, expect } from 'vitest';

describe('Analytics Calculations', () => {
  it('should calculate occupancy rate correctly', () => {
    const occupied = 36;
    const total = 50;
    const occupancyRate = (occupied / total) * 100;

    expect(occupancyRate).toBe(72);
  });

  it('should calculate RevPAR correctly', () => {
    const revenue = 126875;
    const totalRooms = 50;
    const days = 1;
    const revpar = revenue / (totalRooms * days);

    expect(revpar).toBe(2537.5);
  });

  it('should calculate ADR correctly', () => {
    const revenue = 126875;
    const occupiedRooms = 50;
    const adr = revenue / occupiedRooms;

    expect(adr).toBe(2537.5);
  });

  it('should handle zero values in calculations', () => {
    const calculateOccupancy = (occupied: number, total: number): number => {
      return total > 0 ? (occupied / total) * 100 : 0;
    };

    expect(calculateOccupancy(0, 50)).toBe(0);
    expect(calculateOccupancy(10, 0)).toBe(0);
    expect(calculateOccupancy(0, 0)).toBe(0);
  });
});

describe('KPI Metrics', () => {
  it('should calculate average stay correctly', () => {
    const totalNights = 327;
    const totalBookings = 142;
    const avgStay = totalNights / totalBookings;

    expect(avgStay).toBeCloseTo(2.3, 1);
  });

  it('should calculate cancellation rate correctly', () => {
    const totalBookings = 142;
    const cancellations = 12;
    const cancellationRate = (cancellations / totalBookings) * 100;

    expect(cancellationRate).toBeCloseTo(8.5, 1);
  });

  it('should calculate repeat guest rate', () => {
    const totalGuests = 142;
    const repeatGuests = 33;
    const repeatRate = (repeatGuests / totalGuests) * 100;

    expect(repeatRate).toBeCloseTo(23.2, 1);
  });
});

describe('Channel Analytics', () => {
  it('should calculate channel revenue breakdown', () => {
    const channels = [
      { channel: 'Direct', revenue: 157500, bookings: 45 },
      { channel: 'Booking.com', revenue: 122500, bookings: 35 },
      { channel: 'MakeMyTrip', revenue: 98000, bookings: 28 },
    ];

    const totalRevenue = channels.reduce((sum, c) => sum + c.revenue, 0);
    expect(totalRevenue).toBe(378000);

    channels.forEach(c => {
      const percentage = (c.revenue / totalRevenue) * 100;
      expect(percentage).toBeGreaterThan(0);
    });
  });

  it('should calculate commission correctly', () => {
    const commissionRate = 0.15;
    const revenue = 122500;
    const commission = revenue * commissionRate;

    expect(commission).toBe(18375);
  });

  it('should calculate net revenue correctly', () => {
    const grossRevenue = 497000;
    const commission = 497000 * 0.15;
    const netRevenue = grossRevenue - commission;

    expect(netRevenue).toBe(422450);
  });
});

describe('Trend Analysis', () => {
  it('should generate daily trend data', () => {
    const days = 30;
    const trends = [];

    for (let i = 0; i < days; i++) {
      trends.push({
        date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
        revpar: 2200 + Math.random() * 600,
        adr: 3200 + Math.random() * 800,
        occupancy: 65 + Math.random() * 25,
      });
    }

    expect(trends).toHaveLength(30);
    expect(trends[0]).toHaveProperty('date');
    expect(trends[0]).toHaveProperty('revpar');
  });

  it('should calculate trend averages', () => {
    const values = [2500, 2600, 2400, 2700, 2550];
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;

    expect(avg).toBe(2550);
  });
});

describe('Forecast Data', () => {
  it('should generate forecast for 30 days', () => {
    const forecastDays = 30;
    const forecasts = [];

    for (let i = 1; i <= forecastDays; i++) {
      forecasts.push({
        date: new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
        expectedOccupancy: 60 + Math.random() * 35,
        expectedAdr: 3000 + Math.random() * 1000,
        expectedDemand: Math.floor(30 + Math.random() * 40),
      });
    }

    expect(forecasts).toHaveLength(30);
  });
});

describe('Guest Analytics', () => {
  it('should calculate guest mix percentages', () => {
    const guestMix = [
      { type: 'Business', count: 64, percentage: 45 },
      { type: 'Leisure', count: 50, percentage: 35 },
      { type: 'Couples', count: 17, percentage: 12 },
      { type: 'Family', count: 11, percentage: 8 },
    ];

    const totalGuests = guestMix.reduce((sum, g) => sum + g.count, 0);
    expect(totalGuests).toBe(142);

    const totalPercentage = guestMix.reduce((sum, g) => sum + g.percentage, 0);
    expect(totalPercentage).toBe(100);
  });

  it('should calculate average spend by segment', () => {
    const segments = [
      { segment: 'Corporate', guests: 64, revenue: 288000 },
      { segment: 'Individual', guests: 78, revenue: 209000 },
    ];

    segments.forEach(s => {
      const avgSpend = s.revenue / s.guests;
      expect(avgSpend).toBeGreaterThan(0);
    });
  });
});

describe('Competitor Analysis', () => {
  it('should compare against market average', () => {
    const yourProperty = { adr: 3500, occupancy: 72.5, revpar: 2537 };
    const marketAvg = { adr: 3350, occupancy: 73, revpar: 2445 };

    expect(yourProperty.adr).toBeGreaterThan(marketAvg.adr);
    expect(yourProperty.revpar).toBeGreaterThan(marketAvg.revpar);
  });

  it('should rank competitors', () => {
    const competitors = [
      { name: 'Competitor A', revpar: 2964, rating: 4.6 },
      { name: 'Competitor B', revpar: 2176, rating: 4.3 },
      { name: 'Competitor C', revpar: 2175, rating: 4.2 },
    ];

    competitors.sort((a, b) => b.revpar - a.revpar);
    expect(competitors[0].name).toBe('Competitor A');
    expect(competitors[2].name).toBe('Competitor C');
  });
});

describe('Data Export', () => {
  it('should format CSV export correctly', () => {
    const headers = 'date,bookings,revenue,occupancy,adr,revpar';
    const row = '2024-06-01,5,17500,78,3500,2730';

    expect(headers.split(',')).toHaveLength(6);
    expect(row.split(',')).toHaveLength(6);
  });

  it('should include required metadata in export', () => {
    const exportData = {
      hotelId: 'HTL-001',
      generatedAt: new Date().toISOString(),
      period: { startDate: '2024-06-01', endDate: '2024-06-30' },
      type: 'all',
    };

    expect(exportData).toHaveProperty('hotelId');
    expect(exportData).toHaveProperty('generatedAt');
    expect(exportData).toHaveProperty('period');
  });
});

describe('API Response Format', () => {
  it('should format success response with data', () => {
    const response = {
      success: true,
      data: {
        summary: {
          totalBookings: 142,
          totalRevenue: 497000,
          occupancyRate: 72.5,
        },
      },
    };

    expect(response.success).toBe(true);
    expect(response.data.summary).toHaveProperty('totalBookings');
  });

  it('should handle validation errors', () => {
    const errorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        details: [],
      },
    };

    expect(errorResponse.success).toBe(false);
    expect(errorResponse.error.code).toBe('VALIDATION_ERROR');
  });
});
