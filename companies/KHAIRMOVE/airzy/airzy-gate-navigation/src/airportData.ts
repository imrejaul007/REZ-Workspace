/**
 * Airport Data
 * Static airport layouts and gate information for major Indian airports
 */

import { Airport, Gate, Amenity, Terminal } from './types';

// Major Indian Airports with gate layouts
export const AIRPORTS: Record<string, Airport> = {
  'BLR': {
    code: 'BLR',
    name: 'Kempegowda International Airport',
    city: 'Bangalore',
    country: 'India',
    terminals: [
      {
        id: 'T1',
        name: 'Terminal 1',
        gates: ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10', 'A11', 'A12'],
        facilities: [
          { id: 'T1-L1', type: 'lounge', name: 'Airzy Lounge', position: { lat: 13.1980, lng: 77.7063, level: 1 }, gateIds: ['A4', 'A5'], walkingTime: 3 },
          { id: 'T1-R1', type: 'restaurant', name: 'Tiffin', position: { lat: 13.1982, lng: 77.7065, level: 1 }, gateIds: ['A7', 'A8'], walkingTime: 4 },
          { id: 'T1-R2', type: 'restaurant', name: 'K一体中国', position: { lat: 13.1979, lng: 77.7061, level: 1 }, gateIds: ['A10', 'A11'], walkingTime: 5 },
        ]
      },
      {
        id: 'T2',
        name: 'Terminal 2',
        gates: ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'B10', 'B11', 'B12'],
        facilities: [
          { id: 'T2-L1', type: 'lounge', name: 'Emirates Lounge', position: { lat: 13.1995, lng: 77.7090, level: 1 }, gateIds: ['B5', 'B6'], walkingTime: 2 },
          { id: 'T2-R1', type: 'restaurant', name: 'Faasos', position: { lat: 13.1997, lng: 77.7092, level: 1 }, gateIds: ['B8', 'B9'], walkingTime: 3 },
        ]
      }
    ],
    gates: [
      // Terminal 1 Gates
      { id: 'BLR-A1', number: 'A1', terminal: 'T1', type: 'departure', position: { lat: 13.1978, lng: 77.7055 }, nearbyAmenities: ['T1-R1'] },
      { id: 'BLR-A2', number: 'A2', terminal: 'T1', type: 'departure', position: { lat: 13.1979, lng: 77.7057 }, nearbyAmenities: [] },
      { id: 'BLR-A3', number: 'A3', terminal: 'T1', type: 'departure', position: { lat: 13.1980, lng: 77.7059 }, nearbyAmenities: [] },
      { id: 'BLR-A4', number: 'A4', terminal: 'T1', type: 'both', position: { lat: 13.1981, lng: 77.7061 }, nearbyAmenities: ['T1-L1'] },
      { id: 'BLR-A5', number: 'A5', terminal: 'T1', type: 'both', position: { lat: 13.1982, lng: 77.7063 }, nearbyAmenities: ['T1-L1'] },
      { id: 'BLR-A6', number: 'A6', terminal: 'T1', type: 'departure', position: { lat: 13.1983, lng: 77.7065 }, nearbyAmenities: [] },
      { id: 'BLR-A7', number: 'A7', terminal: 'T1', type: 'departure', position: { lat: 13.1984, lng: 77.7067 }, nearbyAmenities: ['T1-R1'] },
      { id: 'BLR-A8', number: 'A8', terminal: 'T1', type: 'both', position: { lat: 13.1985, lng: 77.7069 }, nearbyAmenities: ['T1-R1'] },
      { id: 'BLR-A9', number: 'A9', terminal: 'T1', type: 'both', position: { lat: 13.1986, lng: 77.7071 }, nearbyAmenities: [] },
      { id: 'BLR-A10', number: 'A10', terminal: 'T1', type: 'departure', position: { lat: 13.1987, lng: 77.7073 }, nearbyAmenities: ['T1-R2'] },
      { id: 'BLR-A11', number: 'A11', terminal: 'T1', type: 'departure', position: { lat: 13.1988, lng: 77.7075 }, nearbyAmenities: ['T1-R2'] },
      { id: 'BLR-A12', number: 'A12', terminal: 'T1', type: 'arrival', position: { lat: 13.1989, lng: 77.7077 }, nearbyAmenities: [] },
      // Terminal 2 Gates
      { id: 'BLR-B1', number: 'B1', terminal: 'T2', type: 'departure', position: { lat: 13.1992, lng: 77.7082 }, nearbyAmenities: [] },
      { id: 'BLR-B2', number: 'B2', terminal: 'T2', type: 'departure', position: { lat: 13.1993, lng: 77.7084 }, nearbyAmenities: [] },
      { id: 'BLR-B3', number: 'B3', terminal: 'T2', type: 'both', position: { lat: 13.1994, lng: 77.7086 }, nearbyAmenities: [] },
      { id: 'BLR-B4', number: 'B4', terminal: 'T2', type: 'both', position: { lat: 13.1995, lng: 77.7088 }, nearbyAmenities: [] },
      { id: 'BLR-B5', number: 'B5', terminal: 'T2', type: 'both', position: { lat: 13.1996, lng: 77.7090 }, nearbyAmenities: ['T2-L1'] },
      { id: 'BLR-B6', number: 'B6', terminal: 'T2', type: 'both', position: { lat: 13.1997, lng: 77.7092 }, nearbyAmenities: ['T2-L1'] },
      { id: 'BLR-B7', number: 'B7', terminal: 'T2', type: 'departure', position: { lat: 13.1998, lng: 77.7094 }, nearbyAmenities: [] },
      { id: 'BLR-B8', number: 'B8', terminal: 'T2', type: 'both', position: { lat: 13.1999, lng: 77.7096 }, nearbyAmenities: ['T2-R1'] },
      { id: 'BLR-B9', number: 'B9', terminal: 'T2', type: 'both', position: { lat: 13.2000, lng: 77.7098 }, nearbyAmenities: ['T2-R1'] },
      { id: 'BLR-B10', number: 'B10', terminal: 'T2', type: 'departure', position: { lat: 13.2001, lng: 77.7100 }, nearbyAmenities: [] },
      { id: 'BLR-B11', number: 'B11', terminal: 'T2', type: 'departure', position: { lat: 13.2002, lng: 77.7102 }, nearbyAmenities: [] },
      { id: 'BLR-B12', number: 'B12', terminal: 'T2', type: 'arrival', position: { lat: 13.2003, lng: 77.7104 }, nearbyAmenities: [] },
    ],
    amenities: [
      { id: 'BLR-L1', type: 'lounge', name: 'Airzy Lounge', location: 'Near Gate A4-A5', services: ['Free WiFi', 'Food', 'Shower'], accessible: true, openingHours: '24/7' },
      { id: 'BLR-L2', type: 'lounge', name: 'Emirates Lounge', location: 'Near Gate B5-B6', services: ['Free WiFi', 'Premium Food', 'Spa'], accessible: true, openingHours: '05:00-23:00' },
      { id: 'BLR-R1', type: 'restaurant', name: 'Tiffin', location: 'Near Gate A7-A8', services: ['South Indian', 'Coffee'], accessible: true, openingHours: '06:00-22:00' },
      { id: 'BLR-R2', type: 'restaurant', name: 'K一体中国', location: 'Near Gate A10-A11', services: ['Chinese', 'Thai'], accessible: true, openingHours: '07:00-21:00' },
      { id: 'BLR-R3', type: 'restaurant', name: 'Faasos', location: 'Near Gate B8-B9', services: ['Indian Wraps', 'Biryani'], accessible: true, openingHours: '08:00-20:00' },
      { id: 'BLR-S1', type: 'shop', name: 'Heritage Foods', location: 'Near Gate A3', services: ['Dairy', 'Snacks'], accessible: true },
      { id: 'BLR-M1', type: 'medical', name: 'Medical Center', location: 'Near Gate A12', services: ['First Aid', 'Pharmacy'], accessible: true, openingHours: '24/7' },
      { id: 'BLR-P1', type: 'prayer', name: 'Prayer Room', location: 'Near Gate B4', services: ['Namaz', 'Meditation'], accessible: true },
    ]
  },
  'DEL': {
    code: 'DEL',
    name: 'Indira Gandhi International Airport',
    city: 'New Delhi',
    country: 'India',
    terminals: [
      {
        id: 'T3',
        name: 'Terminal 3',
        gates: ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10', 'C11', 'C12', 'C13', 'C14', 'C15', 'C16', 'C17', 'C18', 'C19', 'C20'],
        facilities: [
          { id: 'T3-L1', type: 'lounge', name: 'Airzy Premium Lounge', position: { lat: 28.5562, lng: 77.0870, level: 1 }, gateIds: ['C10', 'C11'], walkingTime: 4 },
          { id: 'T3-R1', type: 'restaurant', name: 'Sagar Ratna', position: { lat: 28.5565, lng: 77.0873, level: 1 }, gateIds: ['C5', 'C6'], walkingTime: 3 },
        ]
      },
      {
        id: 'T1',
        name: 'Terminal 1',
        gates: ['D1', 'D2', 'D3', 'D4', 'D5'],
        facilities: []
      }
    ],
    gates: [
      { id: 'DEL-C1', number: 'C1', terminal: 'T3', type: 'departure', position: { lat: 28.5550, lng: 77.0850 }, nearbyAmenities: [] },
      { id: 'DEL-C5', number: 'C5', terminal: 'T3', type: 'both', position: { lat: 28.5555, lng: 77.0858 }, nearbyAmenities: ['T3-R1'] },
      { id: 'DEL-C10', number: 'C10', terminal: 'T3', type: 'both', position: { lat: 28.5562, lng: 77.0870 }, nearbyAmenities: ['T3-L1'] },
      { id: 'DEL-C11', number: 'C11', terminal: 'T3', type: 'both', position: { lat: 28.5563, lng: 77.0872 }, nearbyAmenities: ['T3-L1'] },
      { id: 'DEL-D1', number: 'D1', terminal: 'T1', type: 'departure', position: { lat: 28.5689, lng: 77.0861 }, nearbyAmenities: [] },
    ],
    amenities: [
      { id: 'DEL-L1', type: 'lounge', name: 'Airzy Premium Lounge', location: 'Near Gate C10-C11', services: ['Free WiFi', 'Premium Food', 'Spa', 'Shower'], accessible: true, openingHours: '24/7' },
      { id: 'DEL-R1', type: 'restaurant', name: 'Sagar Ratna', location: 'Near Gate C5-C6', services: ['South Indian', 'North Indian'], accessible: true, openingHours: '05:00-23:00' },
    ]
  },
  'BOM': {
    code: 'BOM',
    name: 'Chhatrapati Shivaji Maharaj International Airport',
    city: 'Mumbai',
    country: 'India',
    terminals: [
      {
        id: 'T2',
        name: 'Terminal 2',
        gates: ['E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8', 'E9', 'E10'],
        facilities: [
          { id: 'T2-L1', type: 'lounge', name: 'Airzy Mumbai Lounge', position: { lat: 19.0896, lng: 72.8656, level: 1 }, gateIds: ['E5', 'E6'], walkingTime: 3 },
        ]
      }
    ],
    gates: [
      { id: 'BOM-E1', number: 'E1', terminal: 'T2', type: 'departure', position: { lat: 19.0890, lng: 72.8645 }, nearbyAmenities: [] },
      { id: 'BOM-E5', number: 'E5', terminal: 'T2', type: 'both', position: { lat: 19.0896, lng: 72.8656 }, nearbyAmenities: ['T2-L1'] },
      { id: 'BOM-E10', number: 'E10', terminal: 'T2', type: 'arrival', position: { lat: 19.0905, lng: 72.8672 }, nearbyAmenities: [] },
    ],
    amenities: [
      { id: 'BOM-L1', type: 'lounge', name: 'Airzy Mumbai Lounge', location: 'Near Gate E5-E6', services: ['Free WiFi', 'Food', 'Shower'], accessible: true, openingHours: '24/7' },
    ]
  }
};

// Walking speed: average 1 meter per second, ~5 km/h
const WALKING_SPEED_MPS = 1.0;
const AVERAGE_STEP_DISTANCE = 0.8; // meters

/**
 * Calculate walking time between two coordinates
 */
export function calculateWalkingTime(from: { lat: number; lng: number }, to: { lat: number; lng: number }): number {
  const distance = calculateDistance(from, to);
  return Math.ceil(distance / WALKING_SPEED_MPS / 60); // minutes
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export function calculateDistance(from: { lat: number; lng: number }, to: { lat: number; lng: number }): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Get gate by ID
 */
export function getGate(airportCode: string, gateId: string): Gate | undefined {
  const airport = AIRPORTS[airportCode];
  return airport?.gates.find(g => g.id === gateId);
}

/**
 * Get airport by code
 */
export function getAirport(airportCode: string): Airport | undefined {
  return AIRPORTS[airportCode.toUpperCase()];
}

/**
 * Get amenities near a gate
 */
export function getAmenitiesNearGate(airportCode: string, gateId: string): Amenity[] {
  const airport = AIRPORTS[airportCode];
  if (!airport) return [];

  const gate = airport.gates.find(g => g.id === gateId);
  if (!gate) return [];

  return airport.amenities.filter(a => gate.nearbyAmenities.includes(a.id));
}

/**
 * Find nearest facility of a type
 */
export function findNearestFacility(
  airportCode: string,
  gateId: string,
  type: Amenity['type']
): { amenity: Amenity; walkingTime: number } | undefined {
  const airport = AIRPORTS[airportCode];
  if (!airport) return undefined;

  const gate = airport.gates.find(g => g.id === gateId);
  if (!gate) return undefined;

  const facilities = airport.amenities.filter(a => a.type === type && a.accessible);
  if (facilities.length === 0) return undefined;

  let nearest: Amenity | undefined;
  let minTime = Infinity;

  for (const facility of facilities) {
    const time = calculateWalkingTime(gate.position, facility.position);
    if (time < minTime) {
      minTime = time;
      nearest = facility;
    }
  }

  return nearest ? { amenity: nearest, walkingTime: minTime } : undefined;
}

/**
 * Get all airports
 */
export function getAllAirports(): Airport[] {
  return Object.values(AIRPORTS);
}

/**
 * Search gates by flight number (mock - would integrate with flight service)
 */
export function searchGatesByFlight(flightNumber: string): { airportCode: string; gateId: string; status: string } | undefined {
  // Mock flight-to-gate mapping
  const flightGateMap: Record<string, { airportCode: string; gateId: string; status: string }> = {
    'AI101': { airportCode: 'BLR', gateId: 'BLR-A5', status: 'on-time' },
    'AI102': { airportCode: 'BLR', gateId: 'BLR-A8', status: 'boarding' },
    'AI201': { airportCode: 'DEL', gateId: 'DEL-C10', status: 'on-time' },
    '6E301': { airportCode: 'BOM', gateId: 'BOM-E5', status: 'delayed' },
  };

  return flightGateMap[flightNumber.toUpperCase()];
}
