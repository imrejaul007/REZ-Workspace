const logger = require('../utils/logger');
const { Destination, Itinerary, Booking } = require('../models');

class TripPlannerAgent {
  constructor() {
    this.name = 'Trip Planner Agent';
    this.version = '1.0.0';
    this.enabled = process.env.AI_TRIP_PLANNER_ENABLED === 'true';
  }

  async getStatus() {
    return {
      name: this.name,
      version: this.version,
      status: this.enabled ? 'active' : 'disabled',
      capabilities: [
        'itinerary_creation',
        'destination_recommendation',
        'activity_suggestion',
        'budget_calculation',
        'travel_style_analysis'
      ],
      maxDays: 30,
      supportedLanguages: ['en', 'es', 'fr', 'de', 'ja', 'zh']
    };
  }

  async planTrip(customerId, preferences) {
    try {
      logger.info(`TripPlanner: Planning trip for customer ${customerId}`, { preferences });

      const {
        destination,
        startDate,
        endDate,
        travelers,
        budget,
        travelStyle = 'moderate',
        interests = [],
        dietaryRestrictions = [],
        pace = 'moderate'
      } = preferences;

      // Find destination
      const dest = await Destination.findOne({
        name: { $regex: new RegExp(destination, 'i') },
        isActive: true
      }) || await Destination.findOne({
        country: { $regex: new RegExp(destination, 'i') },
        isActive: true
      }).sort({ rating: -1 });

      if (!dest) {
        // Create a mock destination for demo
        const mockDest = {
          name: destination,
          country: 'Unknown',
          attractions: [
            { name: 'City Center', description: 'Explore the main square', category: 'sightseeing' },
            { name: 'Local Museum', description: 'Learn about history', category: 'cultural' },
            { name: 'Traditional Restaurant', description: 'Local cuisine', category: 'dining' }
          ],
          estimatedDailyCost: 100,
          priceRange: 'moderate'
        };
        return this.generateItinerary(customerId, mockDest, preferences);
      }

      return this.generateItinerary(customerId, dest.toObject(), preferences);
    } catch (error) {
      logger.error('TripPlanner: Error planning trip', { error: error.message });
      throw error;
    }
  }

  generateItinerary(customerId, destination, preferences) {
    const {
      startDate,
      endDate,
      travelers = 1,
      budget,
      travelStyle = 'moderate',
      interests = [],
      pace = 'moderate'
    } = preferences;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    const days = [];
    const dailyBudget = budget ? budget / totalDays : destination.estimatedDailyCost * travelers;

    const activityTypes = {
      sightseeing: ['Visit historic landmarks', 'City tour', 'Photography walk'],
      dining: ['Try local cuisine', 'Food market tour', 'Cooking class'],
      entertainment: ['Local show', 'Nightlife experience', 'Cultural performance'],
      adventure: ['Outdoor activity', 'Nature hike', 'Water sports'],
      cultural: ['Museum visit', 'Art gallery', 'Historical site'],
      relaxation: ['Spa day', 'Beach time', 'Park walk']
    };

    const styleMultipliers = {
      budget: 0.6,
      moderate: 1.0,
      luxury: 2.0,
      'ultra-luxury': 4.0
    };

    const paceMultiplier = {
      relaxed: 0.6,
      moderate: 1.0,
      packed: 1.5
    };

    for (let i = 0; i < totalDays; i++) {
      const dayDate = new Date(start);
      dayDate.setDate(dayDate.getDate() + i);

      const numActivities = Math.min(Math.ceil(paceMultiplier[pace] * 3), 6);
      const activities = [];

      const usedTypes = new Set();
      for (let j = 0; j < numActivities; j++) {
        const type = interests.length > 0
          ? interests[j % interests.length]
          : ['sightseeing', 'dining', 'entertainment'][j % 3];

        if (usedTypes.has(type)) continue;
        usedTypes.add(type);

        const activityTemplates = activityTypes[type] || activityTypes.sightseeing;
        const activityTemplate = activityTemplates[Math.floor(Math.random() * activityTemplates.length)];

        const costMultiplier = styleMultipliers[travelStyle] || 1;
        const activityCost = Math.round((Math.random() * 50 + 20) * costMultiplier * travelers);

        activities.push({
          time: `${9 + j * 2}:00`,
          title: activityTemplate,
          description: `Experience ${type} at its finest`,
          location: `${destination.name} ${type} district`,
          duration: `${1 + Math.floor(Math.random() * 2)} hours`,
          cost: activityCost,
          category: type,
          bookingRequired: Math.random() > 0.7
        });
      }

      const dayCost = activities.reduce((sum, a) => sum + a.cost, 0);

      days.push({
        dayNumber: i + 1,
        date: dayDate.toISOString(),
        title: `Day ${i + 1} in ${destination.name}`,
        activities,
        meals: {
          breakfast: { type: 'String', description: 'Hotel breakfast included' },
          lunch: { type: 'String', description: 'Local restaurant suggested' },
          dinner: { type: 'String', description: 'Fine dining experience' }
        },
        notes: `Free time in the evening for personal exploration`
      });
    }

    const totalCost = days.reduce((sum, day) =>
      sum + day.activities.reduce((aSum, act) => aSum + act.cost, 0), 0
    );

    return {
      success: true,
      itinerary: {
        customerId,
        destination: destination.name,
        title: `${destination.name} ${totalDays}-Day Adventure`,
        description: `Experience the best of ${destination.name} with this ${totalDays}-day itinerary tailored to your ${travelStyle} travel style.`,
        days,
        totalDays,
        totalCost,
        currency: 'USD',
        status: 'draft',
        preferences: {
          travelStyle,
          interests,
          pace
        },
        metadata: {
          generatedBy: 'TripPlannerAgent',
          generatedAt: new Date().toISOString(),
          confidence: 0.85
        }
      },
      summary: {
        destination: destination.name,
        totalDays,
        totalCost,
        dailyAverage: Math.round(totalCost / totalDays),
        activitiesPerDay: Math.round(days.reduce((s, d) => s + d.activities.length, 0) / totalDays),
        travelStyle,
        pace
      },
      recommendations: {
        bestTimeToVisit: destination.bestTimeToVisit || ['Spring', 'Fall'],
        packingTips: this.generatePackingTips(travelStyle, destination.name),
        localTips: this.generateLocalTips(destination.name)
      }
    };
  }

  generatePackingTips(style, destination) {
    const baseTips = [
      'Comfortable walking shoes',
      'Weather-appropriate clothing',
      'Portable charger'
    ];

    if (style === 'luxury' || style === 'ultra-luxury') {
      baseTips.push('Formal evening wear');
      baseTips.push('Premium toiletries');
    }
    if (style === 'adventure') {
      baseTips.push('Outdoor gear');
      baseTips.push('First aid kit');
      baseTips.push('Waterproof bag');
    }

    return baseTips;
  }

  generateLocalTips(destination) {
    return [
      'Learn basic local phrases',
      'Carry local currency',
      'Keep copies of important documents',
      'Research local customs'
    ];
  }
}

module.exports = new TripPlannerAgent();