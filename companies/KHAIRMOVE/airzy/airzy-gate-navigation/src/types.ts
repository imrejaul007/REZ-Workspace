/**
 * Gate Navigation Types
 * Airport wayfinding and navigation service types
 */

export interface Airport {
  code: string;           // IATA code: "BLR", "DEL", "BOM"
  name: string;          // "Kempegowda International Airport"
  city: string;           // "Bangalore"
  country: string;        // "India"
  terminals: Terminal[];
  gates: Gate[];
  amenities: Amenity[];
}

export interface Terminal {
  id: string;
  name: string;          // "Terminal 1", "Terminal 2"
  gates: string[];       // Gate IDs in this terminal
  facilities: Facility[];
}

export interface Gate {
  id: string;
  number: string;        // "A1", "B12", "C5"
  terminal: string;      // Terminal ID
  type: 'departure' | 'arrival' | 'both';
  position: Coordinate;
  nearbyAmenities: string[];  // Amenity IDs
  walkingTimeToNearestLounge?: number;  // minutes
  walkingTimeToNearestRestaurant?: number;
}

export interface Coordinate {
  lat: number;
  lng: number;
  level?: number;        // Floor number
  building?: string;      // "Main", "Satellite"
}

export interface Facility {
  id: string;
  type: 'lounge' | 'restaurant' | 'shop' | ' restroom' | 'information' | 'atmmachine' | 'charging';
  name: string;
  position: Coordinate;
  gateIds: string[];      // Nearby gates
  walkingTime: number;    // minutes from gate
}

export interface Amenity {
  id: string;
  type: 'lounge' | 'restaurant' | 'shop' | 'restroom' | 'medical' | 'prayer' | 'childcare';
  name: string;
  location: string;       // "Near Gate A12"
  services: string[];
  accessible: boolean;
  openingHours?: string;
}

export interface NavigationRoute {
  from: Coordinate | string;  // Gate ID or coordinate
  to: Coordinate | string;    // Gate ID or coordinate
  path: Coordinate[];
  distance: number;           // meters
  estimatedTime: number;      // minutes
  steps: NavigationStep[];
  alternatives?: AlternativeRoute[];
}

export interface NavigationStep {
  instruction: string;    // "Walk straight for 200m"
  distance: number;      // meters
  landmark?: string;      // "Pass the coffee shop on your right"
  floor?: number;
  duration: number;       // seconds
}

export interface AlternativeRoute {
  path: Coordinate[];
  distance: number;
  estimatedTime: number;
  avoid?: string[];      // Types to avoid: ['stairs', 'crowded']
}

export interface GateStatus {
  gateId: string;
  status: 'on-time' | 'delayed' | 'boarding' | 'departed' | 'arrived';
  currentTime: string;
  destination?: string;
  airline?: string;
  scheduledTime?: string;
  actualTime?: string;
  terminal?: string;
  concourse?: string;
}

export interface WalkingTimeEstimate {
  from: string;          // Gate ID
  to: string;             // Gate ID or facility type
  walkingTime: number;   // minutes
  fastestRoute: NavigationRoute;
  alternatives: AlternativeRoute[];
}

export interface NearestFacility {
  type: 'lounge' | 'restaurant' | 'restroom' | 'shop' | 'atmmachine' | 'charging';
  facility: Amenity;
  walkingTime: number;
  direction: string;     // "Left", "Right", "Straight ahead"
}

// API Request/Response types
export interface NavigateRequest {
  gateId: string;
  targetType?: 'gate' | 'lounge' | 'restaurant' | 'exit' | 'baggage' | 'transport';
  targetId?: string;
  accessibility?: boolean;
}

export interface NavigateResponse {
  route: NavigationRoute;
  gateInfo?: GateStatus;
  nearestFacilities: NearestFacility[];
  lastUpdated: string;
}

export interface GateSearchRequest {
  flightNumber?: string;
  terminal?: string;
  destination?: string;
}

export interface GateSearchResponse {
  gates: GateStatus[];
  terminal?: string;
  boardingTime?: string;
  gate?: string;
}
