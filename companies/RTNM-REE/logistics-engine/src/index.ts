/**
 * REE - Logistics Engine (Port 3003)
 *
 * Route optimization, delivery prediction, and fleet management
 * for the RTNM Digital ecosystem.
 *
 * Features:
 * - Route optimization and planning
 * - Delivery time prediction
 * - Fleet management and tracking
 * - Supply chain visibility
 * - Driver assignment
 * - Real-time tracking
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());

const PORT = parseInt(process.env.PORT || '3003', 10);

// ============================================
// IN-MEMORY DATA STORES
// ============================================

interface Location {
  lat: number;
  lng: number;
  address?: string;
  city?: string;
  pincode?: string;
}

interface Route {
  id: string;
  name: string;
  stops: {
    id: string;
    sequence: number;
    location: Location;
    type: 'pickup' | 'delivery' | 'depot';
    estimatedArrival?: Date;
    actualArrival?: Date;
    timeWindow?: { start: string; end: string };
    duration: number; // minutes
    status: 'pending' | 'arrived' | 'completed' | 'skipped';
  }[];
  distance: number; // km
  estimatedDuration: number; // minutes
  actualDuration?: number;
  waypoints: Location[];
  polyline?: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  vehicleId?: string;
  driverId?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  metadata: Record<string, any>;
}

interface Delivery {
  id: string;
  orderId: string;
  customerId: string;
  pickup: {
    location: Location;
    address: string;
    contact: string;
    instructions?: string;
  };
  dropoff: {
    location: Location;
    address: string;
    contact: string;
    instructions?: string;
  };
  status: 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed' | 'returned';
  priority: 'standard' | 'express' | 'priority' | 'critical';
  timeWindows?: { pickup: { start: string; end: string }; dropoff: { start: string; end: string } };
  estimatedPickup?: Date;
  estimatedDelivery?: Date;
  actualPickup?: Date;
  actualDelivery?: Date;
  routeId?: string;
  vehicleId?: string;
  driverId?: string;
  package: {
    weight: number;
    dimensions?: { length: number; width: number; height: number };
    fragile?: boolean;
    value?: number;
  };
  proofOfDelivery?: {
    signature?: string;
    photo?: string;
    otp?: string;
    timestamp?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface Vehicle {
  id: string;
  type: 'bike' | 'scooter' | 'car' | 'van' | 'truck';
  licensePlate: string;
  model: string;
  capacity: {
    weight: number; // kg
    volume: number; // cubic meters
  };
  status: 'available' | 'in_use' | 'maintenance' | 'retired';
  currentLocation?: Location;
  currentRouteId?: string;
  driverId?: string;
  fuelType: 'petrol' | 'diesel' | 'electric' | 'hybrid';
  fuelLevel?: number;
  lastMaintenance?: Date;
  nextMaintenance?: Date;
  odometer: number;
  metadata: Record<string, any>;
}

interface Driver {
  id: string;
  name: string;
  phone: string;
  email?: string;
  status: 'available' | 'on_duty' | 'on_break' | 'off_duty';
  vehicleId?: string;
  currentLocation?: Location;
  currentRouteId?: string;
  shift: {
    start: string;
    end: string;
    days: string[];
  };
  performance: {
    totalDeliveries: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    avgDeliveryTime: number;
    rating: number;
  };
  zones: string[];
  license: {
    number: string;
    expiry: Date;
    type: string;
  };
  createdAt: Date;
}

interface FleetZone {
  id: string;
  name: string;
  polygon: { lat: number; lng: number }[];
  coverage: {
    pickup: boolean;
    dropoff: boolean;
  };
  vehicleTypes: Vehicle['type'][];
  restrictions?: string[];
  avgDeliveryTime: number; // minutes
  activeVehicles: number;
  createdAt: Date;
}

interface SupplyChainEvent {
  id: string;
  type: 'order_placed' | 'processing' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'returned' | 'exception';
  deliveryId: string;
  timestamp: Date;
  location?: Location;
  actor: string;
  notes?: string;
  metadata: Record<string, any>;
}

// In-memory stores
const routes: Map<string, Route> = new Map();
const deliveries: Map<string, Delivery> = new Map();
const vehicles: Map<string, Vehicle> = new Map();
const drivers: Map<string, Driver> = new Map();
const zones: Map<string, FleetZone> = new Map();
const supplyChainEvents: Map<string, SupplyChainEvent> = new Map();

// Initialize sample data
initializeSampleData();

// ============================================
// HELPER FUNCTIONS
// ============================================

function initializeSampleData() {
  // Sample vehicles
  const sampleVehicles: Vehicle[] = [
    {
      id: 'vehicle-001',
      type: 'bike',
      licensePlate: 'DL-01-AB-1234',
      model: 'Honda Activa',
      capacity: { weight: 50, volume: 0.5 },
      status: 'available',
      currentLocation: { lat: 28.6139, lng: 77.2090, city: 'Delhi' },
      fuelType: 'petrol',
      fuelLevel: 85,
      lastMaintenance: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      nextMaintenance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      odometer: 15420,
      metadata: { owner: 'company', insurance: 'valid' }
    },
    {
      id: 'vehicle-002',
      type: 'van',
      licensePlate: 'DL-01-CD-5678',
      model: 'Tata Ace',
      capacity: { weight: 750, volume: 8 },
      status: 'in_use',
      currentLocation: { lat: 28.5355, lng: 77.3910, city: 'Noida' },
      driverId: 'driver-001',
      fuelType: 'diesel',
      fuelLevel: 60,
      lastMaintenance: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      nextMaintenance: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      odometer: 45230,
      metadata: { owner: 'company', insurance: 'valid' }
    },
    {
      id: 'vehicle-003',
      type: 'car',
      licensePlate: 'DL-01-EF-9012',
      model: 'Maruti Suzuki Swift',
      capacity: { weight: 150, volume: 2 },
      status: 'available',
      currentLocation: { lat: 28.4595, lng: 77.0266, city: 'Gurgaon' },
      fuelType: 'petrol',
      fuelLevel: 90,
      lastMaintenance: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      nextMaintenance: new Date(Date.now() + 55 * 24 * 60 * 60 * 1000),
      odometer: 32100,
      metadata: { owner: 'company', insurance: 'valid' }
    },
    {
      id: 'vehicle-004',
      type: 'truck',
      licensePlate: 'DL-01-GH-3456',
      model: 'Mahindra Bolero',
      capacity: { weight: 2000, volume: 20 },
      status: 'maintenance',
      currentLocation: { lat: 28.6139, lng: 77.2090, city: 'Delhi' },
      fuelType: 'diesel',
      fuelLevel: 30,
      lastMaintenance: new Date(),
      nextMaintenance: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      odometer: 125000,
      metadata: { owner: 'company', insurance: 'valid' }
    }
  ];

  sampleVehicles.forEach(v => vehicles.set(v.id, v));

  // Sample drivers
  const sampleDrivers: Driver[] = [
    {
      id: 'driver-001',
      name: 'Rajesh Kumar',
      phone: '+91-9876543210',
      email: 'rajesh@rtnm.digital',
      status: 'on_duty',
      vehicleId: 'vehicle-002',
      currentLocation: { lat: 28.5355, lng: 77.3910, city: 'Noida' },
      shift: {
        start: '09:00',
        end: '21:00',
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      },
      performance: {
        totalDeliveries: 1520,
        successfulDeliveries: 1480,
        failedDeliveries: 25,
        avgDeliveryTime: 28,
        rating: 4.7
      },
      zones: ['noida', 'delhi-central', 'delhi-east'],
      license: {
        number: 'DL-2024-001234',
        expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        type: 'commercial'
      },
      createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'driver-002',
      name: 'Amit Singh',
      phone: '+91-9876543211',
      email: 'amit@rtnm.digital',
      status: 'available',
      shift: {
        start: '08:00',
        end: '20:00',
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
      },
      performance: {
        totalDeliveries: 890,
        successfulDeliveries: 875,
        failedDeliveries: 12,
        avgDeliveryTime: 32,
        rating: 4.5
      },
      zones: ['gurgaon', 'delhi-south'],
      license: {
        number: 'DL-2024-005678',
        expiry: new Date(Date.now() + 450 * 24 * 60 * 60 * 1000),
        type: 'commercial'
      },
      createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'driver-003',
      name: 'Priya Sharma',
      phone: '+91-9876543212',
      status: 'on_break',
      shift: {
        start: '10:00',
        end: '22:00',
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      },
      performance: {
        totalDeliveries: 2100,
        successfulDeliveries: 2055,
        failedDeliveries: 30,
        avgDeliveryTime: 25,
        rating: 4.8
      },
      zones: ['delhi-west', 'delhi-north'],
      license: {
        number: 'DL-2023-009012',
        expiry: new Date(Date.now() + 200 * 24 * 60 * 60 * 1000),
        type: 'commercial'
      },
      createdAt: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000)
    }
  ];

  sampleDrivers.forEach(d => drivers.set(d.id, d));

  // Sample deliveries
  const sampleDeliveries: Delivery[] = [
    {
      id: 'del-001',
      orderId: 'order-abc123',
      customerId: 'cust-001',
      pickup: {
        location: { lat: 28.5355, lng: 77.3910, city: 'Noida' },
        address: 'Shop 12, Sector 18, Noida',
        contact: '+91-9999999991'
      },
      dropoff: {
        location: { lat: 28.6139, lng: 77.2090, city: 'Delhi' },
        address: '42, Connaught Place, New Delhi',
        contact: '+91-9999999992'
      },
      status: 'in_transit',
      priority: 'express',
      estimatedPickup: new Date(Date.now() - 30 * 60 * 1000),
      estimatedDelivery: new Date(Date.now() + 45 * 60 * 1000),
      routeId: 'route-001',
      vehicleId: 'vehicle-002',
      driverId: 'driver-001',
      package: {
        weight: 2.5,
        dimensions: { length: 30, width: 20, height: 15 },
        fragile: true,
        value: 2500
      },
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 30 * 60 * 1000)
    },
    {
      id: 'del-002',
      orderId: 'order-def456',
      customerId: 'cust-002',
      pickup: {
        location: { lat: 28.4595, lng: 77.0266, city: 'Gurgaon' },
        address: 'Mall of India, Sector 18, Gurgaon',
        contact: '+91-9999999993'
      },
      dropoff: {
        location: { lat: 28.4745, lng: 77.1077, city: 'Gurgaon' },
        address: '15, Cyber Hub, DLF Phase 2, Gurgaon',
        contact: '+91-9999999994',
        instructions: 'Ask for reception'
      },
      status: 'assigned',
      priority: 'standard',
      estimatedPickup: new Date(Date.now() + 15 * 60 * 1000),
      estimatedDelivery: new Date(Date.now() + 75 * 60 * 1000),
      package: {
        weight: 0.5
      },
      createdAt: new Date(Date.now() - 30 * 60 * 1000),
      updatedAt: new Date()
    },
    {
      id: 'del-003',
      orderId: 'order-ghi789',
      customerId: 'cust-003',
      pickup: {
        location: { lat: 28.6280, lng: 77.2197, city: 'Delhi' },
        address: 'Chandni Chowk, Old Delhi',
        contact: '+91-9999999995'
      },
      dropoff: {
        location: { lat: 28.5494, lng: 77.2001, city: 'Delhi' },
        address: '88, Karol Bagh, New Delhi',
        contact: '+91-9999999996'
      },
      status: 'pending',
      priority: 'priority',
      package: {
        weight: 5,
        dimensions: { length: 40, width: 30, height: 25 },
        fragile: false,
        value: 5000
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  sampleDeliveries.forEach(d => deliveries.set(d.id, d));

  // Sample zones
  const sampleZones: FleetZone[] = [
    {
      id: 'zone-delhi-central',
      name: 'Delhi Central',
      polygon: [
        { lat: 28.65, lng: 77.15 },
        { lat: 28.65, lng: 77.30 },
        { lat: 28.55, lng: 77.30 },
        { lat: 28.55, lng: 77.15 }
      ],
      coverage: { pickup: true, dropoff: true },
      vehicleTypes: ['bike', 'scooter', 'car', 'van'],
      avgDeliveryTime: 25,
      activeVehicles: 15,
      createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'zone-noida',
      name: 'Noida',
      polygon: [
        { lat: 28.57, lng: 77.32 },
        { lat: 28.57, lng: 77.45 },
        { lat: 28.50, lng: 77.45 },
        { lat: 28.50, lng: 77.32 }
      ],
      coverage: { pickup: true, dropoff: true },
      vehicleTypes: ['bike', 'scooter', 'car', 'van', 'truck'],
      avgDeliveryTime: 35,
      activeVehicles: 22,
      createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'zone-gurgaon',
      name: 'Gurgaon',
      polygon: [
        { lat: 28.48, lng: 76.95 },
        { lat: 28.48, lng: 77.10 },
        { lat: 28.40, lng: 77.10 },
        { lat: 28.40, lng: 76.95 }
      ],
      coverage: { pickup: true, dropoff: true },
      vehicleTypes: ['bike', 'scooter', 'car', 'van'],
      avgDeliveryTime: 30,
      activeVehicles: 18,
      createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
    }
  ];

  sampleZones.forEach(z => zones.set(z.id, z));
}

function calculateDistance(loc1: Location, loc2: Location): number {
  // Haversine formula
  const R = 6371; // Earth's radius in km
  const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
  const dLng = (loc2.lng - loc1.lng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function estimateDeliveryTime(distance: number, vehicleType: Vehicle['type']): number {
  // Base speeds in km/h
  const speeds: Record<string, number> = {
    bike: 25,
    scooter: 20,
    car: 35,
    van: 30,
    truck: 25
  };
  const speed = speeds[vehicleType] || 30;
  // Add 10 minutes per stop
  return (distance / speed * 60) + 10;
}

function findBestDriver(location: Location, vehicleType?: Vehicle['type']): Driver | undefined {
  const availableDrivers = Array.from(drivers.values())
    .filter(d => d.status === 'available' || d.status === 'on_duty')
    .filter(d => {
      if (!vehicleType) return true;
      const vehicle = vehicles.get(d.vehicleId || '');
      return vehicle?.type === vehicleType;
    })
    .sort((a, b) => {
      const distA = a.currentLocation ? calculateDistance(location, a.currentLocation) : Infinity;
      const distB = b.currentLocation ? calculateDistance(location, b.currentLocation) : Infinity;
      return distA - distB;
    });

  return availableDrivers[0];
}

function findBestVehicle(location: Location, requirements: { weight: number; volume: number }): Vehicle | undefined {
  return Array.from(vehicles.values())
    .filter(v => v.status === 'available')
    .filter(v => v.capacity.weight >= requirements.weight && v.capacity.volume >= requirements.volume)
    .sort((a, b) => {
      const distA = a.currentLocation ? calculateDistance(location, a.currentLocation) : Infinity;
      const distB = b.currentLocation ? calculateDistance(location, b.currentLocation) : Infinity;
      return distA - distB;
    })[0];
}

// ============================================
// HEALTH ENDPOINT
// ============================================

app.get('/health', (req: Request, res: Response) => {
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  let deliveriesLast24h = 0;
  let inTransit = 0;

  deliveries.forEach(delivery => {
    if (delivery.createdAt >= last24h) deliveriesLast24h++;
    if (delivery.status === 'in_transit' || delivery.status === 'assigned') inTransit++;
  });

  res.json({
    status: 'healthy',
    service: 'logistics-engine',
    version: '1.0.0',
    port: PORT,
    timestamp: now.toISOString(),
    metrics: {
      totalDeliveries: deliveries.size,
      deliveriesLast24h,
      inTransit,
      pending: Array.from(deliveries.values()).filter(d => d.status === 'pending').length,
      vehicles: {
        total: vehicles.size,
        available: Array.from(vehicles.values()).filter(v => v.status === 'available').length,
        inUse: Array.from(vehicles.values()).filter(v => v.status === 'in_use').length
      },
      drivers: {
        total: drivers.size,
        available: Array.from(drivers.values()).filter(d => d.status === 'available').length,
        onDuty: Array.from(drivers.values()).filter(d => d.status === 'on_duty').length
      }
    }
  });
});

// ============================================
// DELIVERY MANAGEMENT
// ============================================

// Create delivery
app.post('/api/deliveries', (req: Request, res: Response) => {
  const {
    orderId,
    customerId,
    pickup,
    dropoff,
    priority = 'standard',
    timeWindows,
    package: pkg
  } = req.body;

  if (!orderId || !customerId || !pickup || !dropoff) {
    res.status(400).json({ error: 'orderId, customerId, pickup, and dropoff are required' });
    return;
  }

  const id = `del-${uuidv4().slice(0, 8)}`;
  const now = new Date();

  const delivery: Delivery = {
    id,
    orderId,
    customerId,
    pickup,
    dropoff,
    status: 'pending',
    priority,
    timeWindows,
    package: pkg || { weight: 1 },
    createdAt: now,
    updatedAt: now
  };

  // Estimate delivery time
  const distance = calculateDistance(pickup.location, dropoff.location);
  const estimatedMinutes = estimateDeliveryTime(distance, 'car');
  delivery.estimatedPickup = new Date(now.getTime() + 15 * 60 * 1000);
  delivery.estimatedDelivery = new Date(now.getTime() + estimatedMinutes * 60 * 1000);

  deliveries.set(id, delivery);

  // Record supply chain event
  const event: SupplyChainEvent = {
    id: `event-${uuidv4().slice(0, 8)}`,
    type: 'order_placed',
    deliveryId: id,
    timestamp: now,
    actor: 'system',
    metadata: { orderId }
  };
  supplyChainEvents.set(event.id, event);

  res.status(201).json({ success: true, delivery });
});

// List deliveries
app.get('/api/deliveries', (req: Request, res: Response) => {
  const { status, priority, driverId, customerId, limit = '50', offset = '0' } = req.query;

  let filtered = Array.from(deliveries.values());

  if (status) {
    filtered = filtered.filter(d => d.status === status);
  }
  if (priority) {
    filtered = filtered.filter(d => d.priority === priority);
  }
  if (driverId) {
    filtered = filtered.filter(d => d.driverId === driverId);
  }
  if (customerId) {
    filtered = filtered.filter(d => d.customerId === customerId);
  }

  // Sort by priority then by created date
  const priorityOrder = { critical: 0, priority: 1, express: 2, standard: 3 };
  filtered.sort((a, b) => {
    const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (pDiff !== 0) return pDiff;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const limitNum = parseInt(String(limit), 10);
  const offsetNum = parseInt(String(offset), 10);

  const paginated = filtered.slice(offsetNum, offsetNum + limitNum);

  res.json({
    total: filtered.length,
    limit: limitNum,
    offset: offsetNum,
    deliveries: paginated
  });
});

// Get delivery
app.get('/api/deliveries/:id', (req: Request, res: Response) => {
  const delivery = deliveries.get(req.params.id);

  if (!delivery) {
    res.status(404).json({ error: 'Delivery not found' });
    return;
  }

  // Get route if exists
  let route: Route | undefined;
  if (delivery.routeId) {
    route = routes.get(delivery.routeId);
  }

  // Get events
  const events = Array.from(supplyChainEvents.values())
    .filter(e => e.deliveryId === delivery.id)
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  res.json({ delivery, route, events });
});

// Update delivery status
app.patch('/api/deliveries/:id/status', (req: Request, res: Response) => {
  const delivery = deliveries.get(req.params.id);

  if (!delivery) {
    res.status(404).json({ error: 'Delivery not found' });
    return;
  }

  const { status, proofOfDelivery, notes } = req.body;

  if (!status) {
    res.status(400).json({ error: 'Status is required' });
    return;
  }

  const validStatuses = ['pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'failed', 'returned'];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    return;
  }

  const now = new Date();
  const oldStatus = delivery.status;
  delivery.status = status;
  delivery.updatedAt = now;

  // Update timestamps based on status
  if (status === 'picked_up') {
    delivery.actualPickup = now;
  } else if (status === 'delivered') {
    delivery.actualDelivery = now;
    if (proofOfDelivery) {
      delivery.proofOfDelivery = {
        ...proofOfDelivery,
        timestamp: now
      };
    }
  }

  // Record supply chain event
  const eventTypeMap: Record<string, SupplyChainEvent['type']> = {
    assigned: 'out_for_delivery',
    picked_up: 'picked_up',
    in_transit: 'in_transit',
    delivered: 'delivered',
    returned: 'returned',
    failed: 'exception'
  };

  const event: SupplyChainEvent = {
    id: `event-${uuidv4().slice(0, 8)}`,
    type: eventTypeMap[status] || 'exception',
    deliveryId: delivery.id,
    timestamp: now,
    actor: delivery.driverId || 'system',
    notes,
    metadata: { previousStatus: oldStatus, newStatus: status }
  };
  supplyChainEvents.set(event.id, event);

  // Update driver performance
  if (delivery.driverId) {
    const driver = drivers.get(delivery.driverId);
    if (driver) {
      if (status === 'delivered') {
        driver.performance.successfulDeliveries++;
      } else if (status === 'failed') {
        driver.performance.failedDeliveries++;
      }
    }
  }

  res.json({ success: true, delivery });
});

// Assign delivery
app.post('/api/deliveries/:id/assign', (req: Request, res: Response) => {
  const delivery = deliveries.get(req.params.id);

  if (!delivery) {
    res.status(404).json({ error: 'Delivery not found' });
    return;
  }

  if (delivery.status !== 'pending') {
    res.status(400).json({ error: 'Delivery is not in pending status' });
    return;
  }

  const { driverId, vehicleId } = req.body;

  // Find best driver if not specified
  let assignedDriver = driverId ? drivers.get(driverId) : findBestDriver(delivery.pickup.location);
  let assignedVehicle = vehicleId ? vehicles.get(vehicleId) : assignedDriver?.vehicleId ? vehicles.get(assignedDriver.vehicleId) : findBestVehicle(delivery.pickup.location, delivery.package);

  if (!assignedDriver) {
    res.status(400).json({ error: 'No available drivers found' });
    return;
  }

  if (!assignedVehicle) {
    res.status(400).json({ error: 'No suitable vehicle found' });
    return;
  }

  delivery.driverId = assignedDriver.id;
  delivery.vehicleId = assignedVehicle.id;
  delivery.status = 'assigned';
  delivery.updatedAt = new Date();

  // Update driver and vehicle status
  assignedDriver.status = 'on_duty';
  assignedDriver.currentRouteId = undefined;
  assignedVehicle.status = 'in_use';

  // Record event
  const event: SupplyChainEvent = {
    id: `event-${uuidv4().slice(0, 8)}`,
    type: 'out_for_delivery',
    deliveryId: delivery.id,
    timestamp: new Date(),
    actor: assignedDriver.id,
    metadata: { driverId: assignedDriver.id, vehicleId: assignedVehicle.id }
  };
  supplyChainEvents.set(event.id, event);

  res.json({
    success: true,
    delivery,
    assigned: {
      driver: { id: assignedDriver.id, name: assignedDriver.name },
      vehicle: { id: assignedVehicle.id, plate: assignedVehicle.licensePlate }
    }
  });
});

// ============================================
// ROUTE MANAGEMENT
// ============================================

// Create route
app.post('/api/routes', (req: Request, res: Response) => {
  const { name, stops = [], vehicleId, driverId, metadata = {} } = req.body;

  if (!name || stops.length === 0) {
    res.status(400).json({ error: 'name and stops are required' });
    return;
  }

  const id = `route-${uuidv4().slice(0, 8)}`;
  const now = new Date();

  // Build stops with sequence
  const routeStops = stops.map((stop: any, index: number) => ({
    id: `stop-${uuidv4().slice(0, 6)}`,
    sequence: index + 1,
    location: stop.location,
    type: stop.type || 'delivery',
    estimatedArrival: new Date(now.getTime() + (index + 1) * 15 * 60 * 1000),
    timeWindow: stop.timeWindow,
    duration: stop.duration || 10,
    status: 'pending'
  }));

  // Calculate total distance and duration
  let totalDistance = 0;
  const waypoints: Location[] = [];

  for (let i = 0; i < routeStops.length - 1; i++) {
    const dist = calculateDistance(routeStops[i].location, routeStops[i + 1].location);
    totalDistance += dist;
    waypoints.push(routeStops[i].location);
  }
  waypoints.push(routeStops[routeStops.length - 1].location);

  const route: Route = {
    id,
    name,
    stops: routeStops,
    distance: Number(totalDistance.toFixed(2)),
    estimatedDuration: estimateDeliveryTime(totalDistance, 'car'),
    waypoints,
    status: 'planned',
    vehicleId,
    driverId,
    createdAt: now,
    metadata
  };

  routes.set(id, route);

  res.status(201).json({ success: true, route });
});

// List routes
app.get('/api/routes', (req: Request, res: Response) => {
  const { status, vehicleId, driverId } = req.query;

  let filtered = Array.from(routes.values());

  if (status) {
    filtered = filtered.filter(r => r.status === status);
  }
  if (vehicleId) {
    filtered = filtered.filter(r => r.vehicleId === vehicleId);
  }
  if (driverId) {
    filtered = filtered.filter(r => r.driverId === driverId);
  }

  filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  res.json({ routes: filtered });
});

// Get route
app.get('/api/routes/:id', (req: Request, res: Response) => {
  const route = routes.get(req.params.id);

  if (!route) {
    res.status(404).json({ error: 'Route not found' });
    return;
  }

  // Get deliveries on this route
  const routeDeliveries = Array.from(deliveries.values())
    .filter(d => d.routeId === route.id);

  res.json({ route, deliveries: routeDeliveries });
});

// Start route
app.post('/api/routes/:id/start', (req: Request, res: Response) => {
  const route = routes.get(req.params.id);

  if (!route) {
    res.status(404).json({ error: 'Route not found' });
    return;
  }

  if (route.status !== 'planned') {
    res.status(400).json({ error: 'Route is not in planned status' });
    return;
  }

  route.status = 'in_progress';
  route.startedAt = new Date();

  // Update first stop
  if (route.stops.length > 0) {
    route.stops[0].status = 'arrived';
  }

  res.json({ success: true, route });
});

// Update route stop
app.patch('/api/routes/:id/stops/:stopId', (req: Request, res: Response) => {
  const route = routes.get(req.params.id);

  if (!route) {
    res.status(404).json({ error: 'Route not found' });
    return;
  }

  const stop = route.stops.find(s => s.id === req.params.stopId);

  if (!stop) {
    res.status(404).json({ error: 'Stop not found' });
    return;
  }

  const { status, actualArrival } = req.body;

  if (status) {
    stop.status = status;
    if (status === 'arrived') {
      stop.actualArrival = actualArrival ? new Date(actualArrival) : new Date();
    }
    if (status === 'completed') {
      // Move to next stop
      const nextIndex = route.stops.indexOf(stop) + 1;
      if (nextIndex < route.stops.length) {
        route.stops[nextIndex].status = 'arrived';
      } else {
        // All stops completed
        route.status = 'completed';
        route.completedAt = new Date();
      }
    }
  }

  res.json({ success: true, stop });
});

// ============================================
// VEHICLE MANAGEMENT
// ============================================

// List vehicles
app.get('/api/vehicles', (req: Request, res: Response) => {
  const { status, type } = req.query;

  let filtered = Array.from(vehicles.values());

  if (status) {
    filtered = filtered.filter(v => v.status === status);
  }
  if (type) {
    filtered = filtered.filter(v => v.type === type);
  }

  res.json({ vehicles: filtered });
});

// Get vehicle
app.get('/api/vehicles/:id', (req: Request, res: Response) => {
  const vehicle = vehicles.get(req.params.id);

  if (!vehicle) {
    res.status(404).json({ error: 'Vehicle not found' });
    return;
  }

  // Get current driver
  let driver: Driver | undefined;
  if (vehicle.driverId) {
    driver = drivers.get(vehicle.driverId);
  }

  // Get current route
  let route: Route | undefined;
  if (vehicle.currentRouteId) {
    route = routes.get(vehicle.currentRouteId);
  }

  res.json({ vehicle, driver, route });
});

// Update vehicle status
app.patch('/api/vehicles/:id/status', (req: Request, res: Response) => {
  const vehicle = vehicles.get(req.params.id);

  if (!vehicle) {
    res.status(404).json({ error: 'Vehicle not found' });
    return;
  }

  const { status, location, fuelLevel } = req.body;

  if (status) {
    vehicle.status = status;
  }
  if (location) {
    vehicle.currentLocation = location;
  }
  if (fuelLevel !== undefined) {
    vehicle.fuelLevel = fuelLevel;
  }

  res.json({ success: true, vehicle });
});

// Update vehicle location
app.post('/api/vehicles/:id/location', (req: Request, res: Response) => {
  const vehicle = vehicles.get(req.params.id);

  if (!vehicle) {
    res.status(404).json({ error: 'Vehicle not found' });
    return;
  }

  const { lat, lng } = req.body;

  if (lat === undefined || lng === undefined) {
    res.status(400).json({ error: 'lat and lng are required' });
    return;
  }

  vehicle.currentLocation = { lat, lng };

  // Also update driver location if linked
  if (vehicle.driverId) {
    const driver = drivers.get(vehicle.driverId);
    if (driver) {
      driver.currentLocation = { lat, lng };
    }
  }

  res.json({ success: true, location: vehicle.currentLocation });
});

// ============================================
// DRIVER MANAGEMENT
// ============================================

// List drivers
app.get('/api/drivers', (req: Request, res: Response) => {
  const { status, zone } = req.query;

  let filtered = Array.from(drivers.values());

  if (status) {
    filtered = filtered.filter(d => d.status === status);
  }
  if (zone) {
    filtered = filtered.filter(d => d.zones.includes(String(zone)));
  }

  res.json({ drivers: filtered });
});

// Get driver
app.get('/api/drivers/:id', (req: Request, res: Response) => {
  const driver = drivers.get(req.params.id);

  if (!driver) {
    res.status(404).json({ error: 'Driver not found' });
    return;
  }

  // Get assigned vehicle
  let vehicle: Vehicle | undefined;
  if (driver.vehicleId) {
    vehicle = vehicles.get(driver.vehicleId);
  }

  // Get active deliveries
  const activeDeliveries = Array.from(deliveries.values())
    .filter(d => d.driverId === driver.id && ['assigned', 'picked_up', 'in_transit'].includes(d.status));

  res.json({ driver, vehicle, activeDeliveries });
});

// Update driver status
app.patch('/api/drivers/:id/status', (req: Request, res: Response) => {
  const driver = drivers.get(req.params.id);

  if (!driver) {
    res.status(404).json({ error: 'Driver not found' });
    return;
  }

  const { status } = req.body;

  if (!status) {
    res.status(400).json({ error: 'Status is required' });
    return;
  }

  driver.status = status;

  // If going off duty, release vehicle
  if (status === 'off_duty' && driver.vehicleId) {
    const vehicle = vehicles.get(driver.vehicleId);
    if (vehicle) {
      vehicle.status = 'available';
      vehicle.driverId = undefined;
    }
  }

  res.json({ success: true, driver });
});

// Update driver location
app.post('/api/drivers/:id/location', (req: Request, res: Response) => {
  const driver = drivers.get(req.params.id);

  if (!driver) {
    res.status(404).json({ error: 'Driver not found' });
    return;
  }

  const { lat, lng } = req.body;

  if (lat === undefined || lng === undefined) {
    res.status(400).json({ error: 'lat and lng are required' });
    return;
  }

  driver.currentLocation = { lat, lng };

  // Also update linked vehicle
  if (driver.vehicleId) {
    const vehicle = vehicles.get(driver.vehicleId);
    if (vehicle) {
      vehicle.currentLocation = { lat, lng };
    }
  }

  res.json({ success: true, location: driver.currentLocation });
});

// ============================================
// ZONE MANAGEMENT
// ============================================

// List zones
app.get('/api/zones', (req: Request, res: Response) => {
  res.json({ zones: Array.from(zones.values()) });
});

// Get zone
app.get('/api/zones/:id', (req: Request, res: Response) => {
  const zone = zones.get(req.params.id);

  if (!zone) {
    res.status(404).json({ error: 'Zone not found' });
    return;
  }

  // Get drivers in this zone
  const zoneDrivers = Array.from(drivers.values())
    .filter(d => d.zones.includes(zone.name.toLowerCase()));

  // Get vehicles in this zone
  const zoneVehicles = Array.from(vehicles.values())
    .filter(v => v.status !== 'retired' && v.status !== 'maintenance');

  res.json({
    zone,
    drivers: zoneDrivers,
    vehicles: zoneVehicles
  });
});

// Check zone coverage
app.get('/api/zones/check', (req: Request, res: Response) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    res.status(400).json({ error: 'lat and lng are required' });
    return;
  }

  const point = { lat: parseFloat(String(lat)), lng: parseFloat(String(lng)) };

  // Simple bounding box check
  const coveringZones = Array.from(zones.values()).filter(zone => {
    const lats = zone.polygon.map(p => p.lat);
    const lngs = zone.polygon.map(p => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    return point.lat >= minLat && point.lat <= maxLat &&
      point.lng >= minLng && point.lng <= maxLng;
  });

  res.json({
    location: point,
    covered: coveringZones.length > 0,
    zones: coveringZones
  });
});

// ============================================
// ROUTE OPTIMIZATION
// ============================================

app.post('/api/optimize', (req: Request, res: Response) => {
  const { locations, vehicleType = 'car', startLocation, endLocation } = req.body;

  if (!locations || locations.length < 2) {
    res.status(400).json({ error: 'At least 2 locations are required' });
    return;
  }

  // Simple nearest neighbor algorithm for route optimization
  const optimizedOrder: number[] = [0]; // Start with first location
  const remaining = locations.slice(1).map((_: any, i: number) => i + 1);

  while (remaining.length > 0) {
    const currentIdx = optimizedOrder[optimizedOrder.length - 1];
    const currentLoc = locations[currentIdx];

    let nearestIdx = remaining[0];
    let nearestDist = calculateDistance(currentLoc, locations[nearestIdx]);

    for (const idx of remaining) {
      const dist = calculateDistance(currentLoc, locations[idx]);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIdx = idx;
      }
    }

    optimizedOrder.push(nearestIdx);
    remaining.splice(remaining.indexOf(nearestIdx), 1);
  }

  // Calculate total distance
  let totalDistance = 0;
  for (let i = 0; i < optimizedOrder.length - 1; i++) {
    totalDistance += calculateDistance(
      locations[optimizedOrder[i]],
      locations[optimizedOrder[i + 1]]
    );
  }

  const estimatedTime = estimateDeliveryTime(totalDistance, vehicleType);

  res.json({
    optimizedOrder,
    totalDistance: Number(totalDistance.toFixed(2)),
    estimatedDurationMinutes: estimatedTime,
    waypoints: optimizedOrder.map((idx: number) => locations[idx])
  });
});

// ============================================
// SUPPLY CHAIN TRACKING
// ============================================

// Get supply chain events
app.get('/api/supply-chain/:deliveryId', (req: Request, res: Response) => {
  const events = Array.from(supplyChainEvents.values())
    .filter(e => e.deliveryId === req.params.deliveryId)
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  if (events.length === 0) {
    res.status(404).json({ error: 'No events found for this delivery' });
    return;
  }

  res.json({ events });
});

// ============================================
// DASHBOARD METRICS
// ============================================

app.get('/api/dashboard/metrics', (req: Request, res: Response) => {
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Delivery metrics
  let deliveredLast24h = 0;
  let deliveredLast7d = 0;
  let failedLast24h = 0;

  const statusBreakdown: Record<string, number> = {
    pending: 0,
    assigned: 0,
    picked_up: 0,
    in_transit: 0,
    delivered: 0,
    failed: 0,
    returned: 0
  };

  deliveries.forEach(d => {
    statusBreakdown[d.status] = (statusBreakdown[d.status] || 0) + 1;

    if (d.actualDelivery) {
      if (d.actualDelivery >= last24h) deliveredLast24h++;
      if (d.actualDelivery >= last7d) deliveredLast7d++;
    }
    if (d.status === 'failed' && d.updatedAt >= last24h) failedLast24h++;
  });

  // Fleet metrics
  const fleetMetrics = {
    total: vehicles.size,
    available: 0,
    inUse: 0,
    maintenance: 0
  };

  vehicles.forEach(v => {
    switch (v.status) {
      case 'available': fleetMetrics.available++; break;
      case 'in_use': fleetMetrics.inUse++; break;
      case 'maintenance': fleetMetrics.maintenance++; break;
    }
  });

  // Driver metrics
  const driverMetrics = {
    total: drivers.size,
    available: 0,
    onDuty: 0,
    onBreak: 0
  };

  drivers.forEach(d => {
    switch (d.status) {
      case 'available': driverMetrics.available++; break;
      case 'on_duty': driverMetrics.onDuty++; break;
      case 'on_break': driverMetrics.onBreak++; break;
    }
  });

  // Average delivery time
  const completedDeliveries = Array.from(deliveries.values())
    .filter(d => d.actualPickup && d.actualDelivery);
  const avgDeliveryTime = completedDeliveries.length > 0
    ? completedDeliveries.reduce((sum, d) => {
      const time = (d.actualDelivery!.getTime() - d.actualPickup!.getTime()) / 60000;
      return sum + time;
    }, 0) / completedDeliveries.length
    : 0;

  // Success rate
  const successRate = completedDeliveries.length > 0
    ? ((completedDeliveries.length - failedLast24h) / completedDeliveries.length * 100).toFixed(2)
    : 100;

  res.json({
    timestamp: now.toISOString(),
    deliveries: {
      total: deliveries.size,
      ...statusBreakdown,
      deliveredLast24h,
      deliveredLast7d,
      failedLast24h,
      successRate
    },
    fleet: fleetMetrics,
    drivers: driverMetrics,
    performance: {
      avgDeliveryTimeMinutes: Math.round(avgDeliveryTime),
      totalRoutes: routes.size,
      completedRoutes: Array.from(routes.values()).filter(r => r.status === 'completed').length
    }
  });
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Logistics Engine Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`[logistics-engine] Logistics Engine running on port ${PORT}`);
  console.log(`[logistics-engine] Health check: http://localhost:${PORT}/health`);
  console.log(`[logistics-engine] Deliveries: ${deliveries.size}`);
  console.log(`[logistics-engine] Vehicles: ${vehicles.size}`);
  console.log(`[logistics-engine] Drivers: ${drivers.size}`);
});

export default app;