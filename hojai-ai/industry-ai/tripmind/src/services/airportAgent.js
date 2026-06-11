const logger = require('../utils/logger');
const { Booking } = require('../models');
const { v4: uuidv4 } = require('uuid');

class AirportAgent {
  constructor() {
    this.name = 'Airport Agent';
    this.version = '1.0.0';
    this.enabled = process.env.AI_AIRPORT_AGENT_ENABLED === 'true';

    // Airport database
    this.airports = {
      'JFK': { name: 'John F. Kennedy International', city: 'New York', country: 'USA', terminals: 6 },
      'LAX': { name: 'Los Angeles International', city: 'Los Angeles', country: 'USA', terminals: 9 },
      'ORD': { name: "O'Hare International", city: 'Chicago', country: 'USA', terminals: 4 },
      'DXB': { name: 'Dubai International', city: 'Dubai', country: 'UAE', terminals: 3 },
      'LHR': { name: 'Heathrow', city: 'London', country: 'UK', terminals: 5 },
      'CDG': { name: 'Charles de Gaulle', city: 'Paris', country: 'France', terminals: 3 },
      'NRT': { name: 'Narita International', city: 'Tokyo', country: 'Japan', terminals: 2 },
      'SIN': { name: 'Changi', city: 'Singapore', country: 'Singapore', terminals: 4 },
      'HND': { name: 'Haneda', city: 'Tokyo', country: 'Japan', terminals: 3 },
      'FRA': { name: 'Frankfurt', city: 'Frankfurt', country: 'Germany', terminals: 2 }
    };

    this.airportServices = [
      { name: 'Priority Pass Lounge', type: 'lounge', cost: 45, duration: '3 hours' },
      { name: 'Fast Track Security', type: 'service', cost: 25, duration: 'One-time' },
      { name: 'Meet and Greet', type: 'service', cost: 150, duration: 'Per service' },
      { name: 'Luggage Wrapping', type: 'service', cost: 20, duration: 'Per suitcase' },
      { name: 'Currency Exchange', type: 'service', cost: 0, duration: 'Varies' },
      { name: 'Prayer Room', type: 'facility', cost: 0, duration: 'Open hours' },
      { name: 'Smoking Lounge', type: 'facility', cost: 0, duration: 'Open hours' },
      { name: 'Shower Facilities', type: 'facility', cost: 30, duration: 'Per use' },
      { name: 'Pet Relief Area', type: 'facility', cost: 0, duration: 'Open hours' },
      { name: 'Spa Services', type: 'lounge', cost: 80, duration: 'Per session' }
    ];
  }

  async getStatus() {
    return {
      name: this.name,
      version: this.version,
      status: this.enabled ? 'active' : 'disabled',
      capabilities: [
        'flight_tracking',
        'terminal_guidance',
        'check_in_assistance',
        'baggage_info',
        'facility_locations',
        'layover_suggestions',
        'security_wait_times'
      ],
      supportedAirports: Object.keys(this.airports).length
    };
  }

  async assist(customerId, assistanceData) {
    try {
      logger.info(`AirportAgent: Assisting customer ${customerId}`, { assistanceData });

      const {
        flightNumber,
        departureDate,
        airportCode,
        assistanceType,
        bookingId
      } = assistanceData;

      const result = {
        success: true,
        customerId,
        assistanceId: uuidv4(),
        requestedAt: new Date().toISOString()
      };

      if (assistanceType === 'flight_status') {
        Object.assign(result, await this.getFlightStatus(flightNumber, departureDate));
      } else if (assistanceType === 'terminal_info') {
        Object.assign(result, await this.getTerminalInfo(airportCode));
      } else if (assistanceType === 'check_in') {
        Object.assign(result, await this.getCheckInInfo(flightNumber, bookingId));
      } else if (assistanceType === 'baggage') {
        Object.assign(result, await this.getBaggageInfo(airportCode, flightNumber));
      } else if (assistanceType === 'facilities') {
        Object.assign(result, await this.getFacilities(airportCode));
      } else if (assistanceType === 'layover') {
        Object.assign(result, await this.getLayoverSuggestions(airportCode));
      } else if (assistanceType === 'complete') {
        Object.assign(result, await this.getCompleteAssistance(flightNumber, airportCode, departureDate));
      } else {
        Object.assign(result, await this.getCompleteAssistance(flightNumber, airportCode, departureDate));
      }

      return result;
    } catch (error) {
      logger.error('AirportAgent: Error providing assistance', { error: error.message });
      throw error;
    }
  }

  async getFlightStatus(flightNumber, departureDate) {
    // Simulated flight status
    const statuses = ['On Time', 'Delayed', 'Boarding', 'Departed', 'In Flight', 'Landed'];
    const randomStatus = statuses[Math.floor(Math.random() * 4)]; // Bias toward good status

    const departureHour = 6 + Math.floor(Math.random() * 14);
    const departureMinute = Math.random() > 0.5 ? '00' : '30';
    const scheduledDeparture = `${departureHour}:${departureMinute}`;

    const arrivalHour = (departureHour + 2 + Math.floor(Math.random() * 10)) % 24;
    const arrivalMinute = Math.random() > 0.5 ? '00' : '30';
    const scheduledArrival = `${arrivalHour}:${arrivalMinute}`;

    return {
      flightNumber: flightNumber || 'SW1234',
      status: randomStatus,
      airline: this.getAirlineFromFlight(flightNumber),
      scheduledDeparture,
      estimatedDeparture: randomStatus === 'Delayed'
        ? `${departureHour + Math.floor(Math.random() * 2)}:${departureMinute}`
        : scheduledDeparture,
      scheduledArrival,
      gate: `G${Math.floor(Math.random() * 50) + 1}`,
      terminal: `${Math.floor(Math.random() * 6) + 1}`,
      aircraft: ['Boeing 737', 'Airbus A320', 'Boeing 777', 'Airbus A350'][Math.floor(Math.random() * 4)],
      delay: randomStatus === 'Delayed' ? `${10 + Math.floor(Math.random() * 120)} minutes` : '0 minutes',
      onTimePerformance: randomStatus === 'Delayed' ? `${60 + Math.floor(Math.random() * 30)}%` : '95%+',
      updates: {
        lastUpdated: new Date().toISOString(),
        source: 'Airport Operations'
      }
    };
  }

  async getTerminalInfo(airportCode) {
    const airport = this.airports[airportCode?.toUpperCase()] || {
      name: `${airportCode} International Airport`,
      city: 'Unknown City',
      country: 'Unknown',
      terminals: 3
    };

    const terminals = [];
    for (let i = 1; i <= airport.terminals; i++) {
      terminals.push({
        name: `Terminal ${i}`,
        airlines: this.getAirlinesForTerminal(i),
        facilities: ['Restrooms', 'Food Court', 'Shops', 'Lounges', 'Information'],
        services: ['Check-in counters', 'Security', 'Gates', 'Baggage claim'],
        transport: i % 2 === 0
          ? ['Train to city center', 'Taxi stand', 'Rental cars', 'Hotel shuttles']
          : ['Bus to city center', 'Taxi stand', 'Metro connection']
      });
    }

    return {
      airportCode: airportCode?.toUpperCase() || 'UNKNOWN',
      airportName: airport.name,
      city: airport.city,
      country: airport.country,
      terminals,
      timezone: 'Local time',
      website: `https://www.${airportCode?.toLowerCase() || 'airport'}.airport.com`,
      tips: [
        'Arrive at least 2 hours before domestic flights',
        'Arrive at least 3 hours before international flights',
        'Check terminal map online before arrival',
        'Use airport apps for real-time updates'
      ]
    };
  }

  async getCheckInInfo(flightNumber, bookingId) {
    const flight = await this.getFlightStatus(flightNumber);

    // Find booking if provided
    let booking = null;
    if (bookingId) {
      booking = await Booking.findById(bookingId);
    }

    return {
      flightNumber: flight.flightNumber,
      airline: flight.airline,
      terminal: flight.terminal,
      checkInInfo: {
        onlineCheckIn: {
          available: true,
          opens: '24 hours before departure',
          closes: '1 hour before departure (domestic), 3 hours (international)'
        },
        counterCheckIn: {
          opens: '3 hours before departure',
          closes: '45 minutes before departure (domestic), 1 hour (international)'
        },
        kioskCheckIn: {
          available: true,
          locations: ['Main hall', 'Near gates'],
          closes: '30 minutes before departure'
        }
      },
      baggageDrop: {
        opens: '3 hours before departure',
        closes: '45 minutes before departure'
      },
      security: {
        estimatedWaitTime: `${5 + Math.floor(Math.random() * 20)} minutes`,
        tips: [
          'Have boarding pass ready',
          'Remove liquids over 100ml',
          'Laptops in separate tray',
          'Remove metal items'
        ]
      },
      passportControl: {
        estimatedWaitTime: `${10 + Math.floor(Math.random() * 30)} minutes`,
        documents: ['Valid passport', 'Visa (if required)', 'Boarding pass']
      },
      passengerDetails: booking ? {
        bookingReference: booking.metadata?.bookingId || 'N/A',
        passengers: booking.passengers,
        class: booking.details?.class || 'Economy'
      } : null
    };
  }

  async getBaggageInfo(airportCode, flightNumber) {
    const belts = ['Belt 1', 'Belt 2', 'Belt 3', 'Belt 4', 'Belt 5'];
    const selectedBelt = belts[Math.floor(Math.random() * belts.length)];

    return {
      airportCode: airportCode?.toUpperCase(),
      flightNumber: flightNumber || 'SW1234',
      arrivalBelt: selectedBelt,
      baggageInfo: {
        allowance: {
          carryOn: '1 piece (7-10kg depending on airline)',
          checked: '1-2 pieces (23kg each)',
          excess: 'Available for purchase'
        },
        size: {
          carryOn: '55cm x 40cm x 23cm',
          checked: '158cm (length + width + height)'
        },
        restricted: [
          'Liquids over 100ml',
          'Sharp objects',
          'Flammable items',
          'Lithium batteries (spare)',
          'Sporting equipment (special)'
        ]
      },
      services: {
        baggageWrapping: { available: true, cost: 20 },
        baggageStorage: { available: true, cost: '5-15 per day' },
        baggageTracking: { available: true },
        lostBaggage: { contact: 'Lost and Found counter' }
      },
      tips: [
        'Tag bags with contact information',
        'Keep valuables in carry-on',
        'Take photo of checked bags',
        'Arrive early for baggage claim'
      ]
    };
  }

  async getFacilities(airportCode) {
    const airport = this.airports[airportCode?.toUpperCase()];

    return {
      airportCode: airportCode?.toUpperCase() || 'UNKNOWN',
      airportName: airport?.name || 'Airport',
      facilities: {
        lounges: [
          {
            name: 'Premium Lounge',
            location: 'Terminal 1, near Gate 15',
            access: ['Business class', 'Priority Pass', 'Day pass'],
            cost: 45,
            amenities: ['WiFi', 'Food', 'Drinks', 'Shower', 'Quiet zone']
          },
          {
            name: 'First Class Lounge',
            location: 'Terminal 2, Level 3',
            access: ['First class passengers', 'Invitations'],
            cost: 0,
            amenities: ['WiFi', 'Premium food', 'Spa', 'Sleep pods', 'Bar']
          }
        ],
        dining: [
          { name: 'Food Court A', location: 'Terminal 1', cuisines: ['American', 'Asian', 'Fast food'], priceRange: '$' },
          { name: 'Gourmet Bistro', location: 'Terminal 2', cuisines: ['International', 'Fine dining'], priceRange: '$$$' },
          { name: 'Coffee & Snacks', location: 'All terminals', cuisines: ['Coffee', 'Bakery', 'Quick bites'], priceRange: '$' }
        ],
        shopping: [
          { name: 'Duty Free', location: 'After security', category: 'Tax-free goods' },
          { name: 'Travel Essentials', location: 'Near gates', category: 'Toiletries, electronics' },
          { name: 'Souvenirs', location: 'Terminal 3', category: 'Local crafts' }
        ],
        services: this.airportServices
      },
      accessibility: {
        wheelchairAssistance: { available: true, requestAt: 'Check-in or gate' },
        specialAssistance: { available: true, contact: 'Airport assistance desk' },
        prmRooms: { available: true, locations: ['Terminal 1', 'Terminal 2', 'Terminal 3'] }
      }
    };
  }

  async getLayoverSuggestions(airportCode, layoverDuration = 4) {
    const airport = this.airports[airportCode?.toUpperCase()];
    const duration = layoverDuration || 4;

    const suggestions = [];

    if (duration >= 6) {
      suggestions.push({
        type: 'city_tour',
        title: 'Quick City Tour',
        duration: '4-5 hours',
        description: 'Explore nearby attractions with a guided tour',
        cost: '$50-100',
        available: airport?.city !== 'Unknown City',
        tips: ['Book through airport tour desk', 'Keep passport handy']
      });
    }

    suggestions.push({
      type: 'lounge',
      title: 'Airport Lounge Experience',
      duration: '1-3 hours',
      description: 'Relax in a premium lounge with food, drinks, and WiFi',
      cost: '$25-80',
      available: true,
      options: ['Priority Pass Lounge', 'Airline Lounges', 'Day Spas']
    });

    suggestions.push({
      type: 'dining',
      title: 'Local Cuisine Experience',
      duration: '1-2 hours',
      description: 'Try authentic local food at airport restaurants',
      cost: '$15-50',
      available: true,
      recommendations: ['Check airport dining options', 'Look for local specialties']
    });

    suggestions.push({
      type: 'exploration',
      title: 'Airport Exploration',
      duration: '1-2 hours',
      description: 'Discover art installations, gardens, and unique features',
      cost: 'Free',
      available: true,
      highlights: airport?.name?.includes('Changi')
        ? ['Jewel Waterfall', 'Butterfly Garden', 'Movie Theater', 'Swimming Pool']
        : ['Art installations', 'Observation deck', 'Local exhibits']
    });

    return {
      airportCode: airportCode?.toUpperCase() || 'UNKNOWN',
      airportName: airport?.name || 'Airport',
      city: airport?.city || 'Local City',
      layoverDuration: `${duration} hours`,
      suggestions,
      tips: [
        'Check gate location before exploring',
        'Set phone alarm for boarding time',
        'Keep boarding pass accessible',
        'Be back at gate 30 minutes before departure'
      ],
      warnings: [
        duration < 2 ? 'Short layover - stay near gate' : null,
        'Always check flight status at gate',
        'Keep luggage with you at all times'
      ].filter(Boolean)
    };
  }

  async getCompleteAssistance(flightNumber, airportCode, departureDate) {
    const [flightStatus, terminalInfo, checkIn, facilities] = await Promise.all([
      this.getFlightStatus(flightNumber, departureDate),
      this.getTerminalInfo(airportCode),
      this.getCheckInInfo(flightNumber),
      this.getFacilities(airportCode)
    ]);

    return {
      flightStatus,
      terminalInfo,
      checkIn,
      facilities,
      summary: {
        flight: `${flightStatus.airline} ${flightNumber || 'SW1234'}`,
        terminal: `Terminal ${flightStatus.terminal}`,
        gate: flightStatus.gate,
        departure: flightStatus.scheduledDeparture,
        status: flightStatus.status
      },
      checklist: this.generateChecklist()
    };
  }

  generateChecklist() {
    return {
      beforeLeaving: [
        { item: 'Check flight status', completed: false },
        { item: 'Confirm terminal and gate', completed: false },
        { item: 'Pack essentials in carry-on', completed: false },
        { item: 'Check baggage allowance', completed: false }
      ],
      atAirport: [
        { item: 'Drop off baggage', completed: false },
        { item: 'Pass security screening', completed: false },
        { item: 'Find gate', completed: false },
        { item: 'Board flight', completed: false }
      ],
      afterLanding: [
        { item: 'Go through customs/immigration', completed: false },
        { item: 'Collect baggage', completed: false },
        { item: 'Clear customs', completed: false },
        { item: 'Exit airport', completed: false }
      ]
    };
  }

  getAirlineFromFlight(flightNumber) {
    const airlines = {
      'SW': 'SkyWings Airlines',
      'GL': 'GlobalAir',
      'PC': 'Pacific Express',
      'CA': 'Continental Air',
      'AT': 'Atlas Airlines'
    };

    const prefix = flightNumber?.substring(0, 2).toUpperCase() || 'SW';
    return airlines[prefix] || 'SkyWings Airlines';
  }

  getAirlinesForTerminal(terminal) {
    const terminalAirlines = {
      1: ['SkyWings Airlines', 'Pacific Express', 'Budget Air'],
      2: ['GlobalAir', 'Continental Air'],
      3: ['Atlas Airlines', 'Luxury Wings', 'SkyWings Airlines'],
      4: ['Regional Express', 'City Hopper'],
      5: ['Premium Air', 'First Class Airlines']
    };

    return terminalAirlines[terminal] || ['Various Airlines'];
  }
}

module.exports = new AirportAgent();