/**
 * Driver Assistant AI - Driver Support & Navigation
 * Part of FLEETIQ - Fleet Management AI
 */

export interface FuelStation {
  name: string;
  distance: number;
  price: number;
  rating: number;
}

export interface RestStop {
  name: string;
  distance: number;
  facilities: string[];
  rating: number;
}

export interface NavigationResponse {
  type: 'navigation' | 'fuel' | 'rest' | 'traffic' | 'emergency';
  message: string;
  data?: {
    eta?: string;
    fuelStation?: FuelStation;
    restStop?: RestStop;
    alternativeRoute?: { distance: number; time: number };
    instructions?: string[];
  };
}

export class DriverAssistantAI {
  async processQuery(query: string, driverId: string): Promise<NavigationResponse> {
    const lowerQuery = query.toLowerCase();

    if (this.containsAny(lowerQuery, ['route', 'navigation', 'directions', 'navigate'])) {
      return this.handleRouteQuery();
    }

    if (this.containsAny(lowerQuery, ['fuel', 'petrol', 'diesel', 'gas', 'refuel'])) {
      return this.handleFuelQuery();
    }

    if (this.containsAny(lowerQuery, ['break', 'rest', 'stop', 'food', 'bathroom', 'toilet'])) {
      return this.handleRestQuery();
    }

    if (this.containsAny(lowerQuery, ['traffic', 'delay', 'congestion', 'block'])) {
      return this.handleTrafficQuery();
    }

    if (this.containsAny(lowerQuery, ['emergency', 'accident', 'breakdown', 'help'])) {
      return this.handleEmergencyQuery();
    }

    if (this.containsAny(lowerQuery, ['weather', 'rain', 'storm'])) {
      return this.handleWeatherQuery();
    }

    return this.handleDefault();
  }

  private handleRouteQuery(): NavigationResponse {
    return {
      type: 'navigation',
      message: 'Showing optimized route to your destination. Follow the highlighted path.',
      data: {
        eta: `${Math.floor(Math.random() * 60 + 30)} minutes`,
        instructions: [
          'Turn right at the next signal',
          'Continue straight for 5 km',
          'Take left exit towards Highway',
          'Destination will be on your right'
        ]
      }
    };
  }

  private handleFuelQuery(): NavigationResponse {
    const stations: FuelStation[] = [
      { name: 'HP Petrol Pump', distance: 2.5, price: 105, rating: 4.2 },
      { name: 'Bharat Petroleum', distance: 5.0, price: 103, rating: 4.0 },
      { name: 'Indian Oil', distance: 1.8, price: 106, rating: 4.5 },
    ];

    const nearest = stations.sort((a, b) => a.distance - b.distance)[0];

    return {
      type: 'fuel',
      message: `Nearest fuel station is ${nearest.name}, ${nearest.distance} km away. Current diesel price: ₹${nearest.price}/liter`,
      data: { fuelStation: nearest }
    };
  }

  private handleRestQuery(): NavigationResponse {
    const stops: RestStop[] = [
      { name: 'Highway Dhaba', distance: 15, facilities: ['Food', 'Restrooms', 'Parking', 'Tea'], rating: 4.3 },
      { name: 'Family Restaurant', distance: 22, facilities: ['Food', 'Restrooms', 'Parking', 'Game Zone'], rating: 4.5 },
      { name: 'Truck Stop', distance: 8, facilities: ['Food', 'Restrooms', 'Parking', 'Sleeping rooms'], rating: 4.0 },
    ];

    const recommended = stops[Math.floor(Math.random() * stops.length)];

    return {
      type: 'rest',
      message: `Recommended rest stop: ${recommended.name}, ${recommended.distance} km ahead. Facilities: ${recommended.facilities.join(', ')}`,
      data: { restStop: recommended }
    };
  }

  private handleTrafficQuery(): NavigationResponse {
    const conditions = ['light', 'moderate', 'heavy'];
    const condition = conditions[Math.floor(Math.random() * conditions.length)];

    return {
      type: 'traffic',
      message: condition === 'light'
        ? 'Light traffic ahead. No significant delays expected.'
        : condition === 'moderate'
          ? 'Moderate traffic congestion ahead. Expected delay: 15-20 minutes. Alternative route available.'
          : 'Heavy traffic ahead. Consider taking NH-48 via alternate route to save 30 minutes.',
      data: {
        alternativeRoute: condition === 'heavy'
          ? { distance: 5, time: 25 }
          : undefined
      }
    };
  }

  private handleEmergencyQuery(): NavigationResponse {
    return {
      type: 'emergency',
      message: 'Emergency services activated. Stay calm and stay safe.',
      data: {
        instructions: [
          'Move to safety if possible',
          'Turn on hazard lights',
          'Call our support line: 1800-XXX-XXXX',
          'Support team dispatched to your location'
        ]
      }
    };
  }

  private handleWeatherQuery(): NavigationResponse {
    return {
      type: 'navigation',
      message: 'Current weather: Clear skies, 28°C. No rain expected for next 2 hours.',
      data: {
        instructions: [
          'Drive safely in current conditions',
          'No weather-related warnings in effect'
        ]
      }
    };
  }

  private handleDefault(): NavigationResponse {
    return {
      type: 'navigation',
      message: 'How can I help you? Ask about route, fuel stations, rest stops, traffic, or weather.',
      data: {
        instructions: [
          'Say "fuel" to find nearest petrol pump',
          'Say "break" for recommended rest stops',
          'Say "traffic" for current traffic conditions'
        ]
      }
    };
  }

  async getTripSummary(driverId: string, tripId: string): Promise<{
    completedTrips: number;
    totalDistance: number;
    totalEarnings: number;
    rating: number;
  }> {
    return {
      completedTrips: Math.floor(Math.random() * 10) + 5,
      totalDistance: Math.floor(Math.random() * 500) + 200,
      totalEarnings: Math.floor(Math.random() * 50000) + 20000,
      rating: 4.0 + Math.random() * 1
    };
  }

  private containsAny(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword));
  }
}

export default DriverAssistantAI;