import { logger } from '../../shared/logger';
/**
 * RisaCare Emergency Service
 * Port: 4730 - Ambulance dispatch, SOS, and emergency response coordination
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

const PORT = process.env.PORT || 4730;
const app: express();

// Types
type EmergencyType = 'medical' | 'accident' | 'cardiac' | 'respiratory' | 'maternal' | 'trauma' | 'other';
type EmergencyStatus = 'triggered' | 'dispatched' | 'in_progress' | 'resolved' | 'cancelled';
type Priority = 'critical' | 'high' | 'medium' | 'low';
type AmbulanceStatus = 'available' | 'dispatched' | 'en_route' | 'at_location' | 'transporting' | 'offline';

interface EmergencyRequest {
  requestId: string;
  patientId?: string;
  callerName: string;
  callerPhone: string;
  emergencyType: EmergencyType;
  priority: Priority;
  location: {
    address: string;
    latitude: number;
    longitude: number;
    landmark?: string;
  };
  description: string;
  symptoms?: string[];
  status: EmergencyStatus;
  assignedAmbulanceId?: string;
  eta?: number;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

interface Ambulance {
  ambulanceId: string;
  vehicleNumber: string;
  type: 'basic' | 'advanced' | 'cardiac' | 'neonatal';
  status: AmbulanceStatus;
  currentLocation?: { latitude: number; longitude: number };
  hospitalId?: string;
  crew: { name: string; role: string; phone: string }[];
  capabilities: string[];
}

interface DispatchEvent {
  eventId: string;
  requestId: string;
  ambulanceId: string;
  eventType: 'dispatched' | 'en_route' | 'at_location' | 'departed' | 'completed';
  timestamp: Date;
  location?: { latitude: number; longitude: number };
  notes?: string;
}

// In-memory storage
const emergencyRequests: Map<string, EmergencyRequest> = new Map();
const ambulances: Map<string, Ambulance> = new Map();
const dispatchEvents: Map<string, DispatchEvent[]> = new Map();

// Seed sample ambulances
const seedAmbulances = () => {
  const sampleAmbulances: Ambulance[] = [
    {
      ambulanceId: 'AMB-001',
      vehicleNumber: 'MH-01-AB-1234',
      type: 'advanced',
      status: 'available',
      currentLocation: { latitude: 19.076, longitude: 72.877 },
      hospitalId: 'HOSP-001',
      crew: [
        { name: 'Ramesh Kumar', role: 'Paramedic', phone: '+919876543201' },
        { name: 'Sunita Devi', role: 'EMT', phone: '+919876543202' }
      ],
      capabilities: ['cardiac', 'trauma', 'respiratory']
    },
    {
      ambulanceId: 'AMB-002',
      vehicleNumber: 'MH-01-CD-5678',
      type: 'basic',
      status: 'available',
      currentLocation: { latitude: 19.045, longitude: 72.825 },
      hospitalId: 'HOSP-002',
      crew: [
        { name: 'Vijay Singh', role: 'Driver', phone: '+919876543203' },
        { name: 'Meena Shah', role: 'First Responder', phone: '+919876543204' }
      ],
      capabilities: ['basic', 'transport']
    },
    {
      ambulanceId: 'AMB-003',
      vehicleNumber: 'MH-02-EF-9012',
      type: 'cardiac',
      status: 'available',
      currentLocation: { latitude: 19.118, longitude: 72.869 },
      hospitalId: 'HOSP-003',
      crew: [
        { name: 'Dr. Anil Patel', role: 'Cardiac Technician', phone: '+919876543205' },
        { name: 'Priya Gupta', role: 'Paramedic', phone: '+919876543206' }
      ],
      capabilities: ['cardiac', 'ecg', 'defibrillator', 'cardiac_medications']
    },
    {
      ambulanceId: 'AMB-004',
      vehicleNumber: 'MH-03-GH-3456',
      type: 'neonatal',
      status: 'available',
      currentLocation: { latitude: 19.062, longitude: 72.908 },
      hospitalId: 'HOSP-001',
      crew: [
        { name: 'Dr. Sneha Reddy', role: 'Neonatal Nurse', phone: '+919876543207' },
        { name: 'Lakshmi Nair', role: 'EMT', phone: '+919876543208' }
      ],
      capabilities: ['neonatal', 'incubator', 'infant_respirator']
    }
  ];
  sampleAmbulances.forEach(amb => ambulances.set(amb.ambulanceId, amb));
};

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  const stats = getEmergencyStats();
  res.json({
    status: 'healthy',
    service: 'risa-care-emergency',
    version: '1.0.0',
    port: PORT,
    stats,
    timestamp: new Date().toISOString(),
  });
});

// API info
app.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'RisaCare Emergency Service',
    version: '1.0.0',
    port: PORT,
    description: 'Emergency ambulance dispatch, SOS, and response coordination',
    endpoints: {
      health: 'GET /health',
      emergency: {
        trigger: 'POST /api/emergency/trigger',
        get: 'GET /api/emergency/:requestId',
        list: 'GET /api/emergency',
        cancel: 'POST /api/emergency/:requestId/cancel',
        resolve: 'POST /api/emergency/:requestId/resolve',
      },
      ambulances: {
        list: 'GET /api/ambulances',
        get: 'GET /api/ambulances/:id',
        update: 'PUT /api/ambulances/:id',
        nearest: 'GET /api/ambulances/nearest?lat=&lng=',
      },
      dispatch: {
        create: 'POST /api/dispatch',
        events: 'GET /api/dispatch/:requestId/events',
      },
      hospitals: {
        list: 'GET /api/hospitals',
        nearest: 'GET /api/hospitals/nearest?lat=&lng=',
      },
      stats: 'GET /api/stats',
    },
  });
});

// Helper functions
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const findNearestAmbulance = (lat: number, lng: number, type?: string): Ambulance | null => {
  let available = Array.from(ambulances.values())
    .filter(a => a.status === 'available');

  if (type) {
    available = available.filter(a =>
      a.type === type || a.capabilities.includes(type)
    );
  }

  if (available.length === 0) return null;

  return available
    .map(amb => ({
      ambulance: amb,
      distance: amb.currentLocation
        ? calculateDistance(lat, lng, amb.currentLocation.latitude, amb.currentLocation.longitude)
        : Infinity
    }))
    .sort((a, b) => a.distance - b.distance)[0]?.ambulance || null;
};

const calculateETA = (distanceKm: number): number => {
  const avgSpeedKmh = 30; // Traffic-adjusted average
  return Math.ceil((distanceKm / avgSpeedKmh) * 60); // minutes
};

const getEmergencyStats = () => {
  const requests = Array.from(emergencyRequests.values());
  return {
    activeRequests: requests.filter(r => ['triggered', 'dispatched', 'in_progress'].includes(r.status)).length,
    totalRequests: requests.length,
    availableAmbulances: Array.from(ambulances.values()).filter(a => a.status === 'available').length,
    totalAmbulances: ambulances.size,
    criticalActive: requests.filter(r => r.priority === 'critical' && r.status !== 'resolved').length,
  };
};

// ============== EMERGENCY ENDPOINTS ==============

/**
 * POST /api/emergency/trigger - Trigger emergency/SOS
 */
app.post('/api/emergency/trigger', (req: Request, res: Response) => {
  const {
    patientId,
    callerName,
    callerPhone,
    emergencyType,
    location,
    description,
    symptoms
  } = req.body;

  if (!callerName || !callerPhone || !emergencyType || !location || !description) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' }
    });
  }

  // Determine priority based on emergency type
  const criticalTypes = ['cardiac', 'accident', 'respiratory'];
  const priority: Priority = criticalTypes.includes(emergencyType) ? 'critical' : 'high';

  const request: EmergencyRequest = {
    requestId: `SOS-${uuidv4().substring(0, 8).toUpperCase()}`,
    patientId,
    callerName,
    callerPhone,
    emergencyType: emergencyType as EmergencyType,
    priority,
    location: {
      address: location.address,
      latitude: location.latitude,
      longitude: location.longitude,
      landmark: location.landmark
    },
    description,
    symptoms: symptoms || [],
    status: 'triggered',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  emergencyRequests.set(request.requestId, request);
  dispatchEvents.set(request.requestId, []);

  // Auto-dispatch nearest ambulance
  const ambulance = findNearestAmbulance(location.latitude, location.longitude, emergencyType);
  if (ambulance) {
    const distance = ambulance.currentLocation
      ? calculateDistance(location.latitude, location.longitude, ambulance.currentLocation.latitude, ambulance.currentLocation.longitude)
      : 0;

    request.assignedAmbulanceId = ambulance.ambulanceId;
    request.status = 'dispatched';
    request.eta = calculateETA(distance);

    ambulance.status = 'dispatched';
    ambulances.set(ambulance.ambulanceId, ambulance);

    // Log dispatch event
    const event: DispatchEvent = {
      eventId: uuidv4(),
      requestId: request.requestId,
      ambulanceId: ambulance.ambulanceId,
      eventType: 'dispatched',
      timestamp: new Date(),
    };
    dispatchEvents.get(request.requestId)?.push(event);

    logger.info(`🚑 Auto-dispatched ${ambulance.vehicleNumber} to ${request.requestId} (ETA: ${request.eta} mins)`);
  }

  res.status(201).json({
    success: true,
    data: {
      emergency: request,
      ambulance: ambulance ? {
        ambulanceId: ambulance.ambulanceId,
        vehicleNumber: ambulance.vehicleNumber,
        type: ambulance.type,
        eta: request.eta
      } : null,
      message: ambulance ? `Ambulance dispatched. ETA: ${request.eta} minutes.` : 'Request registered. Dispatching nearest ambulance.'
    }
  });
});

/**
 * GET /api/emergency/:requestId - Get emergency request details
 */
app.get('/api/emergency/:requestId', (req: Request, res: Response) => {
  const { requestId } = req.params;
  const request = emergencyRequests.get(requestId);

  if (!request) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Emergency request not found' }
    });
  }

  // Get dispatch events
  const events = dispatchEvents.get(requestId) || [];

  // Get ambulance details if assigned
  let ambulance = null;
  if (request.assignedAmbulanceId) {
    ambulance = ambulances.get(request.assignedAmbulanceId);
  }

  res.json({
    success: true,
    data: { request, events, ambulance }
  });
});

/**
 * GET /api/emergency - List emergency requests
 */
app.get('/api/emergency', (req: Request, res: Response) => {
  const { status, priority, date } = req.query;
  let requests = Array.from(emergencyRequests.values());

  if (status) {
    requests = requests.filter(r => r.status === status);
  }
  if (priority) {
    requests = requests.filter(r => r.priority === priority);
  }
  if (date) {
    const targetDate = new Date(date as string);
    requests = requests.filter(r =>
      new Date(r.createdAt).toDateString() === targetDate.toDateString()
    );
  }

  requests.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  res.json({
    success: true,
    data: { requests, count: requests.length }
  });
});

/**
 * POST /api/emergency/:requestId/cancel - Cancel emergency
 */
app.post('/api/emergency/:requestId/cancel', (req: Request, res: Response) => {
  const { requestId } = req.params;
  const request = emergencyRequests.get(requestId);

  if (!request) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Emergency request not found' }
    });
  }

  if (request.status === 'resolved') {
    return res.status(400).json({
      success: false,
      error: { code: 'ALREADY_RESOLVED', message: 'Cannot cancel resolved emergency' }
    });
  }

  // Free up ambulance if assigned
  if (request.assignedAmbulanceId) {
    const ambulance = ambulances.get(request.assignedAmbulanceId);
    if (ambulance) {
      ambulance.status = 'available';
      ambulances.set(ambulance.ambulanceId, ambulance);
    }
  }

  request.status = 'cancelled';
  request.updatedAt = new Date();
  emergencyRequests.set(requestId, request);

  res.json({
    success: true,
    message: 'Emergency request cancelled'
  });
});

/**
 * POST /api/emergency/:requestId/resolve - Mark emergency resolved
 */
app.post('/api/emergency/:requestId/resolve', (req: Request, res: Response) => {
  const { requestId } = req.params;
  const { outcome, notes } = req.body;
  const request = emergencyRequests.get(requestId);

  if (!request) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Emergency request not found' }
    });
  }

  // Free up ambulance if assigned
  if (request.assignedAmbulanceId) {
    const ambulance = ambulances.get(request.assignedAmbulanceId);
    if (ambulance) {
      ambulance.status = 'available';
      ambulances.set(ambulance.ambulanceId, ambulance);
    }
  }

  request.status = 'resolved';
  request.resolvedAt = new Date();
  request.updatedAt = new Date();
  emergencyRequests.set(requestId, request);

  res.json({
    success: true,
    message: 'Emergency resolved',
    data: { request }
  });
});

// ============== AMBULANCE ENDPOINTS ==============

/**
 * GET /api/ambulances - List ambulances
 */
app.get('/api/ambulances', (req: Request, res: Response) => {
  const { status, type } = req.query;
  let allAmbulances = Array.from(ambulances.values());

  if (status) {
    allAmbulances = allAmbulances.filter(a => a.status === status);
  }
  if (type) {
    allAmbulances = allAmbulances.filter(a => a.type === type);
  }

  res.json({
    success: true,
    data: { ambulances: allAmbulances, count: allAmbulances.length }
  });
});

/**
 * GET /api/ambulances/nearest - Find nearest ambulance
 */
app.get('/api/ambulances/nearest', (req: Request, res: Response) => {
  const { lat, lng, type } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'lat and lng are required' }
    });
  }

  const latitude = parseFloat(lat as string);
  const longitude = parseFloat(lng as string);

  const ambulance = findNearestAmbulance(latitude, longitude, type as string);

  if (!ambulance) {
    return res.status(404).json({
      success: false,
      error: { code: 'NO_AMBULANCE', message: 'No available ambulance found' }
    });
  }

  const distance = ambulance.currentLocation
    ? calculateDistance(latitude, longitude, ambulance.currentLocation.latitude, ambulance.currentLocation.longitude)
    : 0;

  res.json({
    success: true,
    data: {
      ambulance,
      distanceKm: Math.round(distance * 100) / 100,
      etaMinutes: calculateETA(distance)
    }
  });
});

/**
 * GET /api/ambulances/:id - Get ambulance details
 */
app.get('/api/ambulances/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const ambulance = ambulances.get(id);

  if (!ambulance) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Ambulance not found' }
    });
  }

  res.json({ success: true, data: ambulance });
});

/**
 * PUT /api/ambulances/:id - Update ambulance status/location
 */
app.put('/api/ambulances/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const ambulance = ambulances.get(id);

  if (!ambulance) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Ambulance not found' }
    });
  }

  const { status, currentLocation } = req.body;

  if (status) ambulance.status = status as AmbulanceStatus;
  if (currentLocation) ambulance.currentLocation = currentLocation;

  ambulances.set(id, ambulance);

  res.json({ success: true, data: ambulance });
});

// ============== DISPATCH ENDPOINTS ==============

/**
 * POST /api/dispatch - Manual dispatch
 */
app.post('/api/dispatch', (req: Request, res: Response) => {
  const { requestId, ambulanceId } = req.body;

  const request = emergencyRequests.get(requestId);
  if (!request) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Emergency request not found' }
    });
  }

  const ambulance = ambulances.get(ambulanceId);
  if (!ambulance) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Ambulance not found' }
    });
  }

  if (ambulance.status !== 'available') {
    return res.status(400).json({
      success: false,
      error: { code: 'AMBULANCE_UNAVAILABLE', message: 'Ambulance is not available' }
    });
  }

  // Dispatch ambulance
  request.assignedAmbulanceId = ambulanceId;
  request.status = 'dispatched';
  request.updatedAt = new Date();

  ambulance.status = 'dispatched';
  ambulances.set(ambulanceId, ambulance);

  // Log event
  const event: DispatchEvent = {
    eventId: uuidv4(),
    requestId,
    ambulanceId,
    eventType: 'dispatched',
    timestamp: new Date(),
  };
  dispatchEvents.get(requestId)?.push(event);

  res.json({
    success: true,
    message: 'Ambulance dispatched',
    data: { request, ambulance }
  });
});

/**
 * GET /api/dispatch/:requestId/events - Get dispatch events
 */
app.get('/api/dispatch/:requestId/events', (req: Request, res: Response) => {
  const { requestId } = req.params;
  const events = dispatchEvents.get(requestId) || [];

  res.json({
    success: true,
    data: { events, count: events.length }
  });
});

// ============== HOSPITAL ENDPOINTS ==============

// Sample hospitals data
const hospitals = [
  { hospitalId: 'HOSP-001', name: 'City General Hospital', latitude: 19.076, longitude: 72.877, emergency: true, beds: 500 },
  { hospitalId: 'HOSP-002', name: 'Metro Heart Institute', latitude: 19.045, longitude: 72.825, emergency: true, beds: 200 },
  { hospitalId: 'HOSP-003', name: 'Lifeline Medical Center', latitude: 19.118, longitude: 72.869, emergency: true, beds: 350 },
  { hospitalId: 'HOSP-004', name: 'Children\'s Hospital', latitude: 19.062, longitude: 72.908, emergency: false, beds: 150 },
];

/**
 * GET /api/hospitals - List hospitals
 */
app.get('/api/hospitals', (req: Request, res: Response) => {
  const { emergency } = req.query;
  let result = hospitals;

  if (emergency === 'true') {
    result = result.filter(h => h.emergency);
  }

  res.json({
    success: true,
    data: { hospitals: result, count: result.length }
  });
});

/**
 * GET /api/hospitals/nearest - Find nearest hospitals
 */
app.get('/api/hospitals/nearest', (req: Request, res: Response) => {
  const { lat, lng, emergency } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'lat and lng are required' }
    });
  }

  const latitude = parseFloat(lat as string);
  const longitude = parseFloat(lng as string);

  let result = hospitals;
  if (emergency === 'true') {
    result = result.filter(h => h.emergency);
  }

  const withDistance = result.map(h => ({
    ...h,
    distanceKm: Math.round(calculateDistance(latitude, longitude, h.latitude, h.longitude) * 100) / 100
  }))
    .sort((a, b) => a.distanceKm - b.distanceKm);

  res.json({
    success: true,
    data: { hospitals: withDistance }
  });
});

// ============== STATS ENDPOINT ==============

/**
 * GET /api/stats - Get emergency statistics
 */
app.get('/api/stats', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: getEmergencyStats()
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(`[ERROR] ${err.message}`);
  res.status(500).json({ success: false, error: err.message });
});

// Initialize
seedAmbulances();

// Start server
app.listen(PORT, () => {
  logger.info(`
╔═══════════════════════════════════════════════════════════╗
║       RisaCare Emergency Service                  ║
╠═══════════════════════════════════════════════════════════╣
║  Status:     RUNNING                                ║
║  Port:       ${PORT.toString().padEnd(43)}║
║  Version:    1.0.0                               ║
╠═══════════════════════════════════════════════════════════╣
║  Features:                                        ║
║    - SOS/Emergency trigger                       ║
║    - Auto ambulance dispatch                    ║
║    - Real-time tracking                         ║
║    - Hospital coordination                      ║
║    - Dispatch event logging                     ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

export { app };
