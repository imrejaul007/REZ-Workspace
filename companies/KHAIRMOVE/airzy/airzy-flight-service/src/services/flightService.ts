import { v4 as uuidv4 } from 'uuid';
import { Flight, FlightSearchParams, SearchResult, FlightStatus, Airline, Airport } from '../types';
import { logger } from '../utils/logger';

// Sample airline data
const airlines: Airline[] = [
  { code: 'AI', name: 'Air India', logo: '/airlines/ai.png', alliance: 'Star Alliance' },
  { code: 'UK', name: 'Vistara', logo: '/airlines/uk.png' },
  { code: 'SG', name: 'SpiceJet', logo: '/airlines/sg.png' },
  { code: 'I5', name: 'AirAsia India', logo: '/airlines/i5.png' },
  { code: 'G8', name: 'GoAir', logo: '/airlines/g8.png' },
  { code: '6E', name: 'IndiGo', logo: '/airlines/6e.png' },
  { code: 'BA', name: 'British Airways', logo: '/airlines/ba.png', alliance: 'Oneworld' },
  { code: 'EK', name: 'Emirates', logo: '/airlines/ek.png', alliance: 'Skywards' }
];

// Sample airport data
const airports: Record<string, Airport> = {
  'DEL': { code: 'DEL', name: 'Indira Gandhi International Airport', city: 'New Delhi', country: 'IN', timezone: 'Asia/Kolkata', coordinates: { lat: 28.5665, lng: 77.1031 } },
  'BOM': { code: 'BOM', name: 'Chhatrapati Shivaji Maharaj International Airport', city: 'Mumbai', country: 'IN', timezone: 'Asia/Kolkata', coordinates: { lat: 19.0896, lng: 72.8656 } },
  'BLR': { code: 'BLR', name: 'Kempegowda International Airport', city: 'Bengaluru', country: 'IN', timezone: 'Asia/Kolkata', coordinates: { lat: 13.1979, lng: 77.7063 } },
  'MAA': { code: 'MAA', name: 'Chennai International Airport', city: 'Chennai', country: 'IN', timezone: 'Asia/Kolkata', coordinates: { lat: 12.9941, lng: 80.1709 } },
  'CCU': { code: 'CCU', name: 'Netaji Subhas Chandra Bose International Airport', city: 'Kolkata', country: 'IN', timezone: 'Asia/Kolkata', coordinates: { lat: 22.6547, lng: 88.4465 } },
  'HYD': { code: 'HYD', name: 'Rajiv Gandhi International Airport', city: 'Hyderabad', country: 'IN', timezone: 'Asia/Kolkata', coordinates: { lat: 17.2403, lng: 78.4294 } },
  'AMD': { code: 'AMD', name: 'Sardar Vallabhbhai Patel International Airport', city: 'Ahmedabad', country: 'IN', timezone: 'Asia/Kolkata', coordinates: { lat: 23.0773, lng: 72.6347 } },
  'PNQ': { code: 'PNQ', name: 'Pune Airport', city: 'Pune', country: 'IN', timezone: 'Asia/Kolkata', coordinates: { lat: 18.5821, lng: 73.9197 } }
};

// Helper functions
function generateFlightId(): string {
  return `FL${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
}

function generateSegmentId(): string {
  return `SEG${uuidv4().split('-')[0].toUpperCase()}`;
}

function generatePrice(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function generateDuration(minHours: number, maxHours: number): string {
  const hours = Math.floor(Math.random() * (maxHours - minHours) + minHours);
  const minutes = Math.floor(Math.random() * 60);
  return `${hours}h ${minutes}m`;
}

function generateTime(baseHour: number, maxOffset: number): string {
  const hour = (baseHour + Math.floor(Math.random() * maxOffset)) % 24;
  const minutes = Math.floor(Math.random() * 60);
  return `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function getAircraftType(): string {
  const aircraft = ['Boeing 737', 'Boeing 777', 'Boeing 787', 'Airbus A320', 'Airbus A321', 'Airbus A350', 'ATR 72'];
  return aircraft[Math.floor(Math.random() * aircraft.length)];
}

export class FlightService {
  private cachedAirports: Map<string, Airport> = new Map(Object.entries(airports));

  async searchFlights(params: FlightSearchParams): Promise<SearchResult> {
    logger.info('Searching flights', params);

    const searchId = `SRCH${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const flights: Flight[] = [];

    // Generate sample flights (in production, this would call external APIs)
    const numFlights = Math.floor(Math.random() * 15) + 5;
    const cabinClasses: Array<'economy' | 'premium_economy' | 'business' | 'first'> = params.cabinClass
      ? [params.cabinClass]
      : ['economy', 'premium_economy', 'business', 'first'];

    for (let i = 0; i < numFlights; i++) {
      const cabinClass = cabinClasses[Math.floor(Math.random() * cabinClasses.length)];
      const stops = params.directOnly ? 0 : Math.floor(Math.random() * 3);
      const airline = airlines[Math.floor(Math.random() * airlines.length)];

      // Base price varies by class
      const basePriceRange = {
        economy: { min: 2500, max: 8000 },
        premium_economy: { min: 5000, max: 15000 },
        business: { min: 15000, max: 45000 },
        first: { min: 30000, max: 80000 }
      };

      const priceRange = basePriceRange[cabinClass];
      const baseAmount = generatePrice(priceRange.min * (params.passengers?.adults || 1), priceRange.max * (params.passengers?.adults || 1));
      const taxes = Math.round(baseAmount * 0.18);
      const fees = Math.round(baseAmount * 0.05);

      const segments = [];
      const baseDepartureHour = 6;
      const duration = generateDuration(1, 4);

      // Generate segments based on stops
      if (stops === 0) {
        segments.push({
          segmentId: generateSegmentId(),
          flightNumber: `${airline.code}${Math.floor(Math.random() * 9000) + 1000}`,
          airline,
          aircraft: getAircraftType(),
          departure: {
            airport: params.origin,
            terminal: `T${Math.floor(Math.random() * 4) + 1}`,
            time: generateTime(baseDepartureHour, 12),
            gate: `${String.fromCharCode(65 + Math.floor(Math.random() * 8))}${Math.floor(Math.random() * 50) + 1}`
          },
          arrival: {
            airport: params.destination,
            terminal: `T${Math.floor(Math.random() * 4) + 1}`,
            time: '', // Would be calculated based on departure + duration
            gate: `${String.fromCharCode(65 + Math.floor(Math.random() * 8))}${Math.floor(Math.random() * 50) + 1}`
          },
          duration,
          stops: 0,
          baggage: {
            cabin: '7kg',
            checked: cabinClass === 'economy' ? '15kg' : '23kg'
          }
        });
      } else {
        // Multi-stop flight
        const connectingAirports = Object.keys(airports).filter(a => a !== params.origin && a !== params.destination);
        const connections = connectingAirports.slice(0, stops);

        let prevAirport = params.origin;
        let cumulativeHour = baseDepartureHour;

        for (let j = 0; j <= stops; j++) {
          const currentAirport = j === stops ? params.destination : connections[j];
          const segAirline = j === 0 ? airline : airlines[Math.floor(Math.random() * airlines.length)];

          segments.push({
            segmentId: generateSegmentId(),
            flightNumber: `${segAirline.code}${Math.floor(Math.random() * 9000) + 1000}`,
            airline: segAirline,
            aircraft: getAircraftType(),
            departure: {
              airport: prevAirport,
              terminal: `T${Math.floor(Math.random() * 4) + 1}`,
              time: generateTime(cumulativeHour, 0),
              gate: `${String.fromCharCode(65 + Math.floor(Math.random() * 8))}${Math.floor(Math.random() * 50) + 1}`
            },
            arrival: {
              airport: currentAirport,
              terminal: `T${Math.floor(Math.random() * 4) + 1}`,
              time: '',
              gate: `${String.fromCharCode(65 + Math.floor(Math.random() * 8))}${Math.floor(Math.random() * 50) + 1}`
            },
            duration: generateDuration(1, 3),
            stops: j === 0 ? stops : 0,
            baggage: {
              cabin: '7kg',
              checked: cabinClass === 'economy' ? '15kg' : '23kg'
            }
          });

          if (j < stops) {
            cumulativeHour += Math.floor(Math.random() * 4) + 2; // Layover time
          }

          prevAirport = currentAirport;
        }
      }

      flights.push({
        id: generateFlightId(),
        price: {
          amount: baseAmount + taxes + fees,
          currency: 'INR',
          baseAmount,
          taxes,
          fees
        },
        segments,
        totalDuration: generateDuration(2, 12),
        stops,
        refundable: cabinClass !== 'economy',
        exchangeable: true,
        seatsAvailable: Math.floor(Math.random() * 20) + 1,
        cabinClass
      });
    }

    // Sort by price by default
    flights.sort((a, b) => a.price.amount - b.price.amount);

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    return {
      flights,
      searchId,
      expiresAt,
      filters: {},
      sorting: 'price',
      pagination: {
        page: 1,
        pageSize: 20,
        total: flights.length,
        totalPages: Math.ceil(flights.length / 20)
      }
    };
  }

  async getFlightById(flightId: string): Promise<Flight | null> {
    logger.info('Getting flight by ID', { flightId });

    // In production, this would fetch from cache or database
    // For now, return a mock flight
    return {
      id: flightId,
      price: {
        amount: 4500,
        currency: 'INR',
        baseAmount: 3813,
        taxes: 687,
        fees: 0
      },
      segments: [{
        segmentId: 'SEG001',
        flightNumber: 'AI101',
        airline: airlines[0],
        aircraft: 'Boeing 787',
        departure: {
          airport: 'DEL',
          terminal: 'T3',
          time: '06:00',
          gate: 'A12'
        },
        arrival: {
          airport: 'BOM',
          terminal: 'T2',
          time: '08:15',
          gate: 'B5'
        },
        duration: '2h 15m',
        stops: 0,
        baggage: {
          cabin: '7kg',
          checked: '15kg'
        }
      }],
      totalDuration: '2h 15m',
      stops: 0,
      refundable: false,
      exchangeable: true,
      seatsAvailable: 15,
      cabinClass: 'economy'
    };
  }

  async getFlightStatus(flightNumber: string): Promise<FlightStatus> {
    logger.info('Getting flight status', { flightNumber });

    const statuses: Array<'scheduled' | 'on_time' | 'delayed' | 'cancelled' | 'diverted' | 'landed' | 'boarding' | 'unknown'> =
      ['scheduled', 'on_time', 'delayed', 'on_time', 'on_time', 'boarding'];

    const status = statuses[Math.floor(Math.random() * statuses.length)];

    return {
      flightNumber,
      airline: 'Air India',
      status,
      departure: {
        airport: 'DEL',
        scheduled: '2026-06-15T06:00:00Z',
        estimated: status === 'delayed' ? '2026-06-15T07:00:00Z' : undefined,
        terminal: 'T3',
        gate: 'A12'
      },
      arrival: {
        airport: 'BOM',
        scheduled: '2026-06-15T08:15:00Z',
        terminal: 'T2',
        gate: 'B5'
      },
      delay: status === 'delayed' ? { minutes: 60, reason: 'Weather conditions' } : undefined
    };
  }

  async getAirports(): Promise<Airport[]> {
    return Array.from(this.cachedAirports.values());
  }

  async getAirport(code: string): Promise<Airport | null> {
    return this.cachedAirports.get(code.toUpperCase()) || null;
  }

  async getAirlines(): Promise<Airline[]> {
    return airlines;
  }

  async getAirline(code: string): Promise<Airline | null> {
    return airlines.find(a => a.code === code) || null;
  }
}

export const flightService = new FlightService();
export default flightService;