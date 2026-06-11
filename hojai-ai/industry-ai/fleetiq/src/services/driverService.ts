/**
 * FLEETIQ - Driver Agent Service
 * AI-powered driver coaching and assistance
 */

import { Driver, Trip, Vehicle } from '../models';
import { logger } from '../utils/logger';

// ============================================
// TYPES
// ============================================

export interface CoachingRequest {
  driverId: string;
  situation: 'route_planning' | 'fuel_management' | 'break_reminder' | 'safety_tip' | 'performance_review';
  context?: Record<string, any>;
}

export interface CoachingResponse {
  success: boolean;
  situation: string;
  message: string;
  guidance: string[];
  tips?: string[];
  resources?: Array<{ name: string; description: string; action: string }>;
}

export interface DriverPerformance {
  driverId: string;
  name: string;
  rating: number;
  tripsCompleted: number;
  totalDistance: number;
  averageTripDistance: number;
  efficiency: number;
  safetyScore: number;
  fuelEfficiency: number;
  trends: {
    ratingTrend: 'improving' | 'stable' | 'declining';
    performanceTrend: 'improving' | 'stable' | 'declining';
  };
  recommendations: string[];
}

export interface DriverCoachResult {
  success: boolean;
  response: CoachingResponse;
  driver?: any;
}

// ============================================
// FUEL STATION DATA (Mock data for demo)
// ============================================

const NEARBY_FUEL_STATIONS = [
  { name: 'HP Petrol Pump', brand: 'Hindustan Petroleum', distance: 2.5, pricePerLiter: 105 },
  { name: 'IOCL Fuel Station', brand: 'Indian Oil', distance: 4.2, pricePerLiter: 103 },
  { name: 'Bharat Petroleum', brand: 'BPCL', distance: 5.8, pricePerLiter: 104 },
  { name: 'Reliance Fuel Station', brand: 'Reliance', distance: 7.1, pricePerLiter: 102 }
];

const REST_STOPS = [
  { name: 'Highway Dhaba', facilities: ['Food', 'Restrooms', 'Parking'], distance: 15 },
  { name: 'Sahara Rest Area', facilities: ['Food', 'Restrooms', 'Fuel', 'Parking'], distance: 45 },
  { name: 'Express Motels', facilities: ['Hotel', 'Restaurant', 'Parking'], distance: 75 }
];

// ============================================
// COACH DRIVER
// ============================================

export const coachDriver = async (request: CoachingRequest): Promise<DriverCoachResult> => {
  try {
    logger.info('Coaching driver', { driverId: request.driverId, situation: request.situation });

    const driver = await Driver.findById(request.driverId);
    if (!driver) {
      return {
        success: false,
        response: {
          success: false,
          situation: request.situation,
          message: 'Driver not found',
          guidance: []
        }
      };
    }

    let response: CoachingResponse;

    switch (request.situation) {
      case 'route_planning':
        response = await handleRoutePlanning(driver, request.context);
        break;
      case 'fuel_management':
        response = await handleFuelManagement(driver, request.context);
        break;
      case 'break_reminder':
        response = await handleBreakReminder(driver, request.context);
        break;
      case 'safety_tip':
        response = await handleSafetyTip(driver, request.context);
        break;
      case 'performance_review':
        response = await handlePerformanceReview(driver);
        break;
      default:
        response = {
          success: true,
          situation: request.situation,
          message: 'How can I assist you?',
          guidance: ['Ask about route planning', 'Request fuel station information', 'Request a break reminder']
        };
    }

    return {
      success: true,
      response,
      driver: {
        id: driver._id,
        name: driver.name,
        rating: driver.rating,
        status: driver.status
      }
    };

  } catch (error) {
    logger.error('Driver coaching failed', { error });
    throw error;
  }
};

// ============================================
// ROUTE PLANNING HANDLER
// ============================================

const handleRoutePlanning = async (driver: any, context?: Record<string, any>): Promise<CoachingResponse> => {
  const destination = context?.destination;

  return {
    success: true,
    situation: 'route_planning',
    message: destination
      ? `Optimizing route to ${destination.address || 'destination'}`
      : 'Route planning assistance ready',
    guidance: [
      'Use the optimized route for fastest delivery',
      'Check traffic updates before starting',
      'Plan for potential delays',
      'Keep alternative routes in mind'
    ],
    tips: [
      'Use real-time GPS for live traffic updates',
      'Pre-plan rest stops for long journeys',
      'Consider weather conditions on route'
    ],
    resources: [
      {
        name: 'Traffic Updates',
        description: 'Real-time traffic information',
        action: 'Enable push notifications'
      },
      {
        name: 'Weather Alerts',
        description: 'Weather conditions on your route',
        action: 'Check before departure'
      }
    ]
  };
};

// ============================================
// FUEL MANAGEMENT HANDLER
// ============================================

const handleFuelManagement = async (driver: any, context?: Record<string, any>): Promise<CoachingResponse> => {
  const vehicle = await Vehicle.findById(driver.currentVehicleId);
  const fuelLevel = vehicle?.fuelLevel || 0;
  const location = context?.location || { lat: 19.076, lng: 72.877 }; // Default to Mumbai

  // Sort fuel stations by distance
  const nearbyStations = NEARBY_FUEL_STATIONS
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3);

  const urgent = fuelLevel < 20;
  const warning = fuelLevel >= 20 && fuelLevel < 40;

  return {
    success: true,
    situation: 'fuel_management',
    message: urgent
      ? 'Critical fuel level! Nearest fuel station highlighted'
      : warning
        ? 'Low fuel warning - plan to refuel soon'
        : 'Fuel levels are adequate',
    guidance: [
      urgent
        ? 'Proceed to nearest fuel station immediately'
        : warning
          ? 'Plan to refuel at next convenient station'
          : 'Continue with current route',
      'Consider fuel price variations between stations',
      'Fill up during off-peak hours for faster service'
    ],
    tips: [
      'Maintain fuel above 25% for emergencies',
      'Fill up at branded stations for quality assurance',
      'Track fuel expenses for reimbursement'
    ],
    resources: nearbyStations.map(station => ({
      name: station.name,
      description: `${station.brand} - Rs. ${station.pricePerLiter}/liter`,
      action: `Navigate - ${station.distance} km away`
    }))
  };
};

// ============================================
// BREAK REMINDER HANDLER
// ============================================

const handleBreakReminder = async (driver: any, context?: Record<string, any>): Promise<CoachingResponse> => {
  const tripDuration = context?.tripDuration || 120; // Default 2 hours in minutes
  const location = context?.location || { lat: 19.076, lng: 72.877 };

  // Recommend break based on trip duration
  const recommendedBreak = tripDuration >= 240 ? 'Take a 30-minute break' :
                          tripDuration >= 180 ? 'Consider a 15-minute break' :
                          'Break not yet required';

  const nearbyStops = REST_STOPS.slice(0, 2);

  return {
    success: true,
    situation: 'break_reminder',
    message: recommendedBreak,
    guidance: [
      'Regular breaks improve safety and alertness',
      'Stretch and walk to reduce fatigue',
      'Stay hydrated during long trips',
      'Check your phone notifications during breaks'
    ],
    tips: [
      'Take breaks every 3-4 hours of driving',
      'Have a light snack to maintain energy',
      'Use breaks for vehicle inspection',
      'Review route and next steps during breaks'
    ],
    resources: nearbyStops.map(stop => ({
      name: stop.name,
      description: stop.facilities.join(', '),
      action: `Navigate - ${stop.distance} km ahead`
    }))
  };
};

// ============================================
// SAFETY TIP HANDLER
// ============================================

const handleSafetyTip = async (driver: any, context?: Record<string, any>): Promise<CoachingResponse> => {
  const weather = context?.weather || 'clear';
  const roadCondition = context?.roadCondition || 'good';

  const safetyTips = [
    {
      condition: 'rain',
      tips: ['Reduce speed by 20-30%', 'Increase following distance', 'Use headlights in rain']
    },
    {
      condition: 'fog',
      tips: ['Use low beam headlights', 'Reduce speed significantly', 'Use fog lines as guide']
    },
    {
      condition: 'night',
      tips: ['Use high beams on empty roads', 'Reduce speed', 'Take more frequent breaks']
    }
  ];

  const applicableTips = safetyTips.find(t => t.condition === weather)?.tips || [
    'Follow speed limits',
    'Maintain safe distance',
    'Use indicators for lane changes',
    'Avoid distracted driving'
  ];

  return {
    success: true,
    situation: 'safety_tip',
    message: `Safety tips for ${weather} conditions`,
    guidance: [
      ...applicableTips,
      'Conduct pre-trip vehicle inspection',
      'Secure all cargo properly',
      'Keep emergency kit in vehicle'
    ],
    tips: [
      'Report road hazards immediately',
      'Follow company safety protocols',
      'Take responsibility for road safety',
      'Share road conditions with dispatch'
    ],
    resources: [
      {
        name: 'Emergency Contacts',
        description: '24/7 support hotline',
        action: 'Call: 1800-XXX-XXXX'
      },
      {
        name: 'Incident Report',
        description: 'Report safety incidents',
        action: 'Use mobile app to report'
      }
    ]
  };
};

// ============================================
// PERFORMANCE REVIEW HANDLER
// ============================================

const handlePerformanceReview = async (driver: any): Promise<CoachingResponse> => {
  const performance = await getDriverPerformance(driver._id.toString());

  let status: string;
  let statusEmoji: string;

  if (performance.rating >= 4.5) {
    status = 'Excellent';
    statusEmoji = '⭐';
  } else if (performance.rating >= 4.0) {
    status = 'Good';
    statusEmoji = '👍';
  } else if (performance.rating >= 3.0) {
    status = 'Needs Improvement';
    statusEmoji = '📈';
  } else {
    status = 'Coaching Required';
    statusEmoji = '🎯';
  }

  return {
    success: true,
    situation: 'performance_review',
    message: `${statusEmoji} ${status} - Rating: ${performance.rating.toFixed(1)}/5.0`,
    guidance: [
      `Total trips completed: ${performance.tripsCompleted}`,
      `Total distance covered: ${performance.totalDistance.toLocaleString()} km`,
      `Average trip distance: ${performance.averageTripDistance.toFixed(0)} km`,
      `Efficiency score: ${performance.efficiency}%`,
      `Rating trend: ${performance.trends.ratingTrend}`
    ],
    tips: performance.recommendations,
    resources: [
      {
        name: 'Training Materials',
        description: 'Access driver training resources',
        action: 'Open training portal'
      },
      {
        name: 'Performance Dashboard',
        description: 'View detailed performance metrics',
        action: 'Check mobile app'
      }
    ]
  };
};

// ============================================
// GET DRIVER PERFORMANCE
// ============================================

export const getDriverPerformance = async (driverId: string): Promise<DriverPerformance> => {
  const driver = await Driver.findById(driverId);
  if (!driver) {
    throw new Error('Driver not found');
  }

  // Get recent trips for trend analysis
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentTrips = await Trip.find({
    driverId,
    status: 'completed',
    createdAt: { $gte: thirtyDaysAgo }
  });

  // Calculate metrics
  const totalDistance = recentTrips.reduce((sum, trip) => sum + trip.distance, 0);
  const totalFuelUsed = recentTrips.reduce((sum, trip) => sum + (trip.fuelUsed || 0), 0);
  const averageTripDistance = recentTrips.length > 0 ? totalDistance / recentTrips.length : 0;
  const fuelEfficiency = totalDistance > 0 && totalFuelUsed > 0 ? (totalDistance / totalFuelUsed) : 0;

  // Calculate efficiency (trips per week)
  const weeksInPeriod = 4;
  const tripsPerWeek = recentTrips.length / weeksInPeriod;
  const efficiency = Math.min((tripsPerWeek / 15) * 100, 100); // Target: 15 trips/week

  // Determine trends (mock for now - would need historical data)
  const ratingTrend = driver.rating >= 4.5 ? 'improving' :
                      driver.rating >= 4.0 ? 'stable' : 'declining';

  // Generate recommendations
  const recommendations: string[] = [];

  if (driver.rating < 4.0) {
    recommendations.push('Focus on customer service and communication');
  }

  if (fuelEfficiency < 8) { // km per liter
    recommendations.push('Improve fuel efficiency through smoother driving');
  }

  if (efficiency < 50) {
    recommendations.push('Increase trip frequency with better scheduling');
  }

  if (recentTrips.length < 10) {
    recommendations.push('Build experience with more trips');
  }

  if (recommendations.length === 0) {
    recommendations.push('Maintain your excellent performance!');
    recommendations.push('Consider mentoring newer drivers');
  }

  return {
    driverId: driver._id.toString(),
    name: driver.name,
    rating: driver.rating,
    tripsCompleted: driver.tripsCompleted,
    totalDistance: driver.totalDistance || totalDistance,
    averageTripDistance: Math.round(averageTripDistance),
    efficiency: Math.round(efficiency),
    safetyScore: Math.round((driver.rating * 20) + (efficiency / 5)), // Composite score
    fuelEfficiency: Math.round(fuelEfficiency * 10) / 10,
    trends: {
      ratingTrend,
      performanceTrend: efficiency > 70 ? 'improving' : efficiency > 40 ? 'stable' : 'declining'
    },
    recommendations
  };
};

export default {
  coachDriver,
  getDriverPerformance
};