const logger = require('../utils/logger');
const { Booking, Destination } = require('../models');
const { v4: uuidv4 } = require('uuid');

class BookingAgent {
  constructor() {
    this.name = 'Booking Agent';
    this.version = '1.0.0';
    this.enabled = process.env.AI_BOOKING_AGENT_ENABLED === 'true';
  }

  async getStatus() {
    return {
      name: this.name,
      version: this.version,
      status: this.enabled ? 'active' : 'disabled',
      capabilities: [
        'search_availability',
        'price_comparison',
        'booking_creation',
        'booking_modification',
        'cancellation_processing',
        'special_requests'
      ],
      supportedTypes: ['flight', 'hotel', 'car', 'package', 'activity'],
      maxPassengers: 20
    };
  }

  async searchAvailability(customerId, searchCriteria) {
    try {
      logger.info(`BookingAgent: Searching availability for customer ${customerId}`, { searchCriteria });

      const {
        type,
        destination,
        date,
        returnDate,
        passengers = 1,
        priceRange,
        preferences = {}
      } = searchCriteria;

      // Search existing bookings for similar criteria
      const existingBookings = await Booking.find({
        destination: { $regex: new RegExp(destination, 'i') },
        date: { $gte: new Date(date), $lte: new Date(date) }
      }).limit(10);

      // Search destinations for additional options
      const destinations = await Destination.find({
        $or: [
          { name: { $regex: new RegExp(destination, 'i') } },
          { country: { $regex: new RegExp(destination, 'i') } }
        ],
        isActive: true
      }).limit(5);

      const options = this.generateSearchResults(type, destination, date, returnDate, passengers, priceRange);

      return {
        success: true,
        searchId: uuidv4(),
        criteria: searchCriteria,
        results: options,
        alternatives: destinations.map(d => ({
          id: d._id,
          name: d.name,
          country: d.country,
          rating: d.rating,
          priceRange: d.priceRange,
          estimatedDailyCost: d.estimatedDailyCost,
          image: d.image
        })),
        recommendations: this.generateRecommendations(type, options, preferences),
        searchMetadata: {
          searchedAt: new Date().toISOString(),
          totalResults: options.length,
          priceRange: {
            min: Math.min(...options.map(o => o.price)),
            max: Math.max(...options.map(o => o.price))
          }
        }
      };
    } catch (error) {
      logger.error('BookingAgent: Error searching availability', { error: error.message });
      throw error;
    }
  }

  generateSearchResults(type, destination, date, returnDate, passengers, priceRange) {
    const results = [];
    const numResults = 5 + Math.floor(Math.random() * 5);

    const airlines = ['SkyWings', 'GlobalAir', 'Pacific Express', 'Continental Air', 'Atlas Airlines'];
    const hotelChains = ['Grand Plaza', 'Seaside Resort', 'Urban Retreat', 'Mountain Lodge', 'City Center Hotel'];
    const carCompanies = ['DriveEasy', 'Wheelz', 'AutoFlex', 'RentWheels', 'QuickCar'];

    for (let i = 0; i < numResults; i++) {
      if (type === 'flight') {
        const basePrice = 200 + Math.floor(Math.random() * 800);
        results.push({
          id: uuidv4(),
          type: 'flight',
          provider: airlines[i % airlines.length],
          flightNumber: `${airlines[i % airlines.length].substring(0, 2).toUpperCase()}${100 + Math.floor(Math.random() * 900)}`,
          origin: 'NYC',
          destination: destination,
          departureDate: date,
          returnDate: returnDate,
          departureTime: `${6 + Math.floor(Math.random() * 12)}:${Math.random() > 0.5 ? '00' : '30'}`,
          arrivalTime: `${12 + Math.floor(Math.random() * 8)}:${Math.random() > 0.5 ? '00' : '30'}`,
          duration: `${4 + Math.floor(Math.random() * 8)}h ${Math.floor(Math.random() * 60)}m`,
          stops: Math.random() > 0.6 ? Math.floor(Math.random() * 2) + 1 : 0,
          price: basePrice * passengers,
          perPerson: basePrice,
          currency: 'USD',
          seatsAvailable: 5 + Math.floor(Math.random() * 50),
          class: ['economy', 'premium_economy', 'business', 'first'][Math.floor(Math.random() * 2)],
          amenities: ['wifi', 'meals', 'entertainment'].slice(0, Math.floor(Math.random() * 3) + 1),
          baggage: {
            carryOn: '1 piece (7kg)',
            checked: `${1 + Math.floor(Math.random() * 2)} pieces (23kg each)`
          }
        });
      } else if (type === 'hotel') {
        const nightlyRate = 80 + Math.floor(Math.random() * 400);
        results.push({
          id: uuidv4(),
          type: 'hotel',
          provider: hotelChains[i % hotelChains.length],
          name: `${hotelChains[i % hotelChains.length]} ${destination}`,
          location: `${destination} City Center`,
          checkIn: date,
          checkOut: returnDate || new Date(new Date(date).setDate(new Date(date).getDate() + 3)).toISOString().split('T')[0],
          rating: 3 + Math.round(Math.random() * 2 * 10) / 10,
          reviewCount: 50 + Math.floor(Math.random() * 500),
          price: nightlyRate * (returnDate ? Math.ceil((new Date(returnDate) - new Date(date)) / (1000 * 60 * 60 * 24)) : 3),
          perNight: nightlyRate,
          currency: 'USD',
          roomsAvailable: 3 + Math.floor(Math.random() * 20),
          roomType: ['Standard', 'Deluxe', 'Suite', 'Executive'][Math.floor(Math.random() * 4)],
          amenities: ['wifi', 'pool', 'gym', 'spa', 'restaurant', 'parking'].slice(0, Math.floor(Math.random() * 4) + 2),
          breakfast: Math.random() > 0.5,
          freeCancellation: Math.random() > 0.3,
          breakfastIncluded: Math.random() > 0.5
        });
      } else if (type === 'car') {
        const dailyRate = 30 + Math.floor(Math.random() * 150);
        results.push({
          id: uuidv4(),
          type: 'car',
          provider: carCompanies[i % carCompanies.length],
          vehicle: ['Economy Car', 'Compact SUV', 'Midsize Sedan', 'Luxury Car', 'Minivan'][Math.floor(Math.random() * 5)],
          pickupLocation: `${destination} Airport`,
          dropoffLocation: `${destination} Airport`,
          pickupDate: date,
          dropoffDate: returnDate || new Date(new Date(date).setDate(new Date(date).getDate() + 3)).toISOString().split('T')[0],
          price: dailyRate * (returnDate ? Math.ceil((new Date(returnDate) - new Date(date)) / (1000 * 60 * 60 * 24)) : 3),
          perDay: dailyRate,
          currency: 'USD',
          seats: 2 + Math.floor(Math.random() * 5),
          transmission: Math.random() > 0.3 ? 'automatic' : 'manual',
          fuelPolicy: Math.random() > 0.5 ? 'full-to-full' : 'full-to-empty',
          insurance: Math.random() > 0.4,
          mileageLimit: Math.random() > 0.5 ? 'unlimited' : `${200 + Math.floor(Math.random() * 300)} km/day`
        });
      } else {
        const activityPrice = 20 + Math.floor(Math.random() * 200);
        results.push({
          id: uuidv4(),
          type: 'activity',
          provider: `${destination} Tours Inc.`,
          name: `${destination} ${['Adventure', 'Cultural', 'Relaxation', 'Sightseeing', 'Food'][i % 5]} Tour`,
          location: `${destination}`,
          date: date,
          duration: `${1 + Math.floor(Math.random() * 8)} hours`,
          price: activityPrice * passengers,
          perPerson: activityPrice,
          currency: 'USD',
          spotsAvailable: 5 + Math.floor(Math.random() * 30),
          difficulty: ['easy', 'moderate', 'challenging'][Math.floor(Math.random() * 3)],
          includes: ['guide', 'transport', 'equipment', 'meals'].slice(0, Math.floor(Math.random() * 3) + 1),
          cancellationPolicy: 'Free cancellation up to 24 hours before'
        });
      }
    }

    return results.sort((a, b) => a.price - b.price);
  }

  generateRecommendations(type, options, preferences) {
    const recommendations = [];

    const cheapest = options.find(o => o.price === Math.min(...options.map(opt => opt.price)));
    if (cheapest) {
      recommendations.push({
        type: 'best_value',
        reason: 'Lowest price option',
        option: cheapest
      });
    }

    const highestRated = options.find(o => o.rating === Math.max(...options.filter(opt => opt.rating).map(opt => opt.rating)));
    if (highestRated) {
      recommendations.push({
        type: 'top_rated',
        reason: 'Highest rated by travelers',
        option: highestRated
      });
    }

    recommendations.push({
      type: 'popular_choice',
      reason: 'Most booked by similar travelers',
      option: options[Math.floor(options.length / 2)]
    });

    return recommendations;
  }

  async createBooking(customerId, bookingData) {
    try {
      logger.info(`BookingAgent: Creating booking for customer ${customerId}`, { bookingData });

      const booking = new Booking({
        customerId,
        type: bookingData.type,
        destination: bookingData.destination,
        date: new Date(bookingData.date),
        returnDate: bookingData.returnDate ? new Date(bookingData.returnDate) : null,
        status: 'pending',
        total: bookingData.total,
        currency: bookingData.currency || 'USD',
        passengers: bookingData.passengers || 1,
        details: bookingData.details || {},
        metadata: {
          source: 'ai_agent',
          agent: 'BookingAgent',
          bookingId: `BK-${uuidv4().substring(0, 8).toUpperCase()}`
        }
      });

      await booking.save();

      return {
        success: true,
        booking: booking.toObject(),
        confirmationCode: booking.metadata.bookingId,
        message: 'Booking created successfully. Awaiting confirmation.',
        nextSteps: [
          'Review booking details',
          'Make payment to confirm',
          'Receive e-ticket via email'
        ]
      };
    } catch (error) {
      logger.error('BookingAgent: Error creating booking', { error: error.message });
      throw error;
    }
  }
}

module.exports = new BookingAgent();