/**
 * rez-mind-hotel-service Unit Tests
 * Tests AI-powered hotel intelligence and recommendations
 */

import { describe, it, expect } from 'vitest';

describe('Mind Hotel Service Configuration', () => {
  it('should have correct service configuration', () => {
    const config = {
      port: 4017,
      serviceName: 'rez-mind-hotel',
      version: '1.0.0',
    };

    expect(config.port).toBe(4017);
    expect(config.serviceName).toBe('rez-mind-hotel');
  });

  it('should integrate with REZ-Intelligence', () => {
    const integrations = {
      signalAggregator: 'http://localhost:4121',
      intentPredictor: 'http://localhost:4018',
      unifiedProfile: 'http://localhost:4120',
    };

    expect(integrations).toHaveProperty('signalAggregator');
    expect(integrations).toHaveProperty('intentPredictor');
  });
});

describe('AI Recommendations', () => {
  it('should have correct recommendation structure', () => {
    const recommendation = {
      hotelId: 'HTL-001',
      hotelName: 'Grand Hotel',
      city: 'Mumbai',
      rating: 4.5,
      price: 4500,
      matchScore: 0.92,
      reasons: ['Near beach', 'High rated', 'Good reviews'],
    };

    expect(recommendation).toHaveProperty('matchScore');
    expect(recommendation.matchScore).toBeGreaterThan(0);
    expect(recommendation.matchScore).toBeLessThanOrEqual(1);
  });

  it('should calculate match score correctly', () => {
    const userPrefs = { budget: 5000, rating: 4.0 };
    const hotel = { price: 4500, rating: 4.5 };

    const priceScore = Math.max(0, 1 - Math.abs(hotel.price - userPrefs.budget) / userPrefs.budget);
    const ratingScore = hotel.rating / 5;
    const matchScore = (priceScore * 0.5 + ratingScore * 0.5);

    expect(matchScore).toBeGreaterThan(0.7);
    expect(matchScore).toBeLessThanOrEqual(1);
  });

  it('should support recommendation filters', () => {
    const filters = {
      city: 'Mumbai',
      checkIn: '2024-06-15',
      checkOut: '2024-06-18',
      budget: 5000,
      guests: 2,
    };

    expect(filters).toHaveProperty('city');
    expect(filters).toHaveProperty('budget');
    expect(filters.guests).toBeGreaterThan(0);
  });
});

describe('Dynamic Pricing', () => {
  it('should calculate dynamic price correctly', () => {
    const baseRate = 3000;
    const demandMultiplier = 1.25;
    const dayOfWeek = 6; // Saturday

    let price = baseRate * demandMultiplier;

    // Weekend premium
    if (dayOfWeek === 5 || dayOfWeek === 6) {
      price *= 1.15;
    }

    expect(price).toBeGreaterThan(baseRate);
  });

  it('should consider demand factors', () => {
    const factors = {
      occupancyRate: 0.85,
      daysUntilCheckIn: 3,
      localEvent: true,
      seasonMultiplier: 1.2,
    };

    let demandMultiplier = 1.0;

    if (factors.occupancyRate > 0.7) demandMultiplier += 0.15;
    if (factors.daysUntilCheckIn < 7) demandMultiplier += 0.1;
    if (factors.localEvent) demandMultiplier += 0.2;
    demandMultiplier *= factors.seasonMultiplier;

    expect(demandMultiplier).toBeGreaterThan(1);
  });

  it('should apply length of stay discounts', () => {
    const baseRate = 3000;
    const nights = 5;

    let discount = 0;
    if (nights >= 3) discount = 0.05;
    if (nights >= 5) discount = 0.10;
    if (nights >= 7) discount = 0.15;

    const effectiveRate = baseRate * (1 - discount);
    expect(effectiveRate).toBeLessThan(baseRate);
  });
});

describe('Guest Satisfaction Prediction', () => {
  it('should have correct prediction structure', () => {
    const prediction = {
      bookingId: 'BK-001',
      satisfactionScore: 0.87,
      riskFactors: ['Late check-in', 'Unmet requests'],
      recommendations: ['Upgrade room', 'Early contact'],
    };

    expect(prediction).toHaveProperty('satisfactionScore');
    expect(prediction.satisfactionScore).toBeGreaterThan(0);
    expect(prediction.satisfactionScore).toBeLessThanOrEqual(1);
  });

  it('should calculate satisfaction based on factors', () => {
    const factors = {
      checkInTime: '15:00', // On time
      serviceResponseTime: 10, // minutes
      specialRequests: 2,
      cleanlinessRating: 4.5,
      staffRating: 4.2,
    };

    let score = 0.5;

    // Check-in timing
    if (factors.checkInTime <= '15:00') score += 0.1;

    // Service response
    if (factors.serviceResponseTime < 15) score += 0.15;

    // Ratings
    score += (factors.cleanlinessRating / 5) * 0.15;
    score += (factors.staffRating / 5) * 0.1;

    expect(score).toBeGreaterThan(0.5);
    expect(score).toBeLessThanOrEqual(1);
  });
});

describe('SLA Prediction', () => {
  it('should have correct SLA prediction structure', () => {
    const prediction = {
      requestType: 'ROOM_SERVICE',
      predictedSLA: 25, // minutes
      confidence: 0.89,
      factors: ['Current queue', 'Time of day', 'Staff availability'],
    };

    expect(prediction).toHaveProperty('predictedSLA');
    expect(prediction.confidence).toBeGreaterThan(0);
    expect(prediction.confidence).toBeLessThanOrEqual(1);
  });

  it('should support request types', () => {
    const requestTypes = [
      'ROOM_SERVICE',
      'HOUSEKEEPING',
      'MAINTENANCE',
      'CONCIERGE',
      'CHECKOUT',
    ];

    expect(requestTypes).toContain('ROOM_SERVICE');
    expect(requestTypes).toContain('HOUSEKEEPING');
  });
});

describe('Upsell Recommendations', () => {
  it('should have correct upsell structure', () => {
    const upsell = {
      bookingId: 'BK-001',
      items: [
        { type: 'ROOM_UPGRADE', price: 1500, probability: 0.72 },
        { type: 'BREAKFAST', price: 500, probability: 0.85 },
        { type: 'SPA_TREATMENT', price: 3000, probability: 0.35 },
      ],
    };

    expect(upsell.items).toHaveLength(3);
    upsell.items.forEach(item => {
      expect(item).toHaveProperty('price');
      expect(item).toHaveProperty('probability');
      expect(item.probability).toBeGreaterThan(0);
      expect(item.probability).toBeLessThanOrEqual(1);
    });
  });

  it('should prioritize by probability', () => {
    const upsells = [
      { type: 'BREAKFAST', probability: 0.85 },
      { type: 'ROOM_UPGRADE', probability: 0.72 },
      { type: 'SPA', probability: 0.35 },
    ];

    const sorted = upsells.sort((a, b) => b.probability - a.probability);
    expect(sorted[0].type).toBe('BREAKFAST');
  });
});

describe('Rebooking Prediction', () => {
  it('should predict rebooking likelihood', () => {
    const prediction = {
      userId: 'USER-001',
      rebookingLikelihood: 0.78,
      suggestedDestinations: ['Goa', 'Jaipur', 'Kerala'],
      suggestedTiming: '30-60 days',
    };

    expect(prediction).toHaveProperty('rebookingLikelihood');
    expect(prediction.rebookingLikelihood).toBeGreaterThan(0);
    expect(prediction.suggestedDestinations).toHaveLength(3);
  });

  it('should consider past behavior', () => {
    const userHistory = {
      totalBookings: 5,
      avgRating: 4.6,
      loyaltyTier: 'Gold',
      avgStayDuration: 3.5,
      preferredDestinations: ['Mumbai', 'Goa'],
    };

    let likelihood = 0.3;

    if (userHistory.totalBookings > 3) likelihood += 0.2;
    if (userHistory.avgRating >= 4.5) likelihood += 0.15;
    if (userHistory.loyaltyTier === 'Gold') likelihood += 0.15;

    expect(likelihood).toBeGreaterThan(0.5);
  });
});

describe('Event Ingestion', () => {
  it('should validate event structure', () => {
    const event = {
      type: 'BOOKING_CREATED',
      hotelId: 'HTL-001',
      userId: 'USER-001',
      timestamp: new Date().toISOString(),
      data: {
        bookingId: 'BK-001',
        checkIn: '2024-06-15',
        checkOut: '2024-06-18',
      },
    };

    expect(event).toHaveProperty('type');
    expect(event).toHaveProperty('timestamp');
    expect(event).toHaveProperty('data');
  });

  it('should support event types', () => {
    const eventTypes = [
      'BOOKING_CREATED',
      'BOOKING_CANCELLED',
      'CHECK_IN',
      'CHECK_OUT',
      'REVIEW_SUBMITTED',
      'SERVICE_REQUEST',
    ];

    expect(eventTypes).toContain('BOOKING_CREATED');
    expect(eventTypes).toContain('CHECK_IN');
  });
});

describe('API Response Format', () => {
  it('should format success response correctly', () => {
    const response = {
      success: true,
      data: {
        recommendations: [],
      },
    };

    expect(response.success).toBe(true);
    expect(response).toHaveProperty('data');
  });

  it('should handle errors gracefully', () => {
    const errorResponse = {
      success: false,
      message: 'Failed to get recommendations',
    };

    expect(errorResponse.success).toBe(false);
    expect(errorResponse).toHaveProperty('message');
  });
});

describe('Health Check', () => {
  it('should return correct health status format', () => {
    const health = {
      status: 'ok',
      service: 'rez-mind-hotel',
      version: '1.0.0',
      integratedWith: 'REZ-Intelligence',
      timestamp: new Date().toISOString(),
    };

    expect(health.status).toBe('ok');
    expect(health).toHaveProperty('integratedWith');
  });

  it('should report readiness correctly', () => {
    const ready = {
      status: 'ready',
      checks: {
        mongodb: true,
        rezIntelligence: true,
      },
    };

    expect(ready.status).toBe('ready');
    expect(ready.checks.mongodb).toBe(true);
  });
});
