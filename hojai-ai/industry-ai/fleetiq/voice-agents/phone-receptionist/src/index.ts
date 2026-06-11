import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 4901;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory storage for demo (replace with actual database in production)
interface Vehicle {
  id: string;
  plateNumber: string;
  status: 'active' | 'idle' | 'maintenance' | 'offline';
  driverId: string;
  location: string;
  fuelLevel: number;
  lastUpdated: string;
}

interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicleId: string;
  status: 'available' | 'on-trip' | 'break' | 'offline';
  checkInTime?: string;
}

const vehicles: Map<string, Vehicle> = new Map();
const drivers: Map<string, Driver> = new Map();

// Initialize with sample data
const sampleVehicles: Vehicle[] = [
  { id: 'v1', plateNumber: 'FLT-001', status: 'active', driverId: 'd1', location: 'Route A - Zone 2', fuelLevel: 78, lastUpdated: new Date().toISOString() },
  { id: 'v2', plateNumber: 'FLT-002', status: 'idle', driverId: 'd2', location: 'Depot Central', fuelLevel: 95, lastUpdated: new Date().toISOString() },
  { id: 'v3', plateNumber: 'FLT-003', status: 'maintenance', driverId: 'd3', location: 'Service Center', fuelLevel: 45, lastUpdated: new Date().toISOString() },
];

const sampleDrivers: Driver[] = [
  { id: 'd1', name: 'John Smith', phone: '+1234567890', vehicleId: 'v1', status: 'on-trip' },
  { id: 'd2', name: 'Sarah Johnson', phone: '+1234567891', vehicleId: 'v2', status: 'available' },
  { id: 'd3', name: 'Mike Wilson', phone: '+1234567892', vehicleId: 'v3', status: 'offline' },
];

sampleVehicles.forEach(v => vehicles.set(v.id, v));
sampleDrivers.forEach(d => drivers.set(d.id, d));

// IVR Menu State Management
interface CallState {
  callId: string;
  state: 'main' | 'vehicle-status' | 'driver-checkin' | 'dispatch' | 'transfer';
  data: Record<string, string>;
}

const activeCalls: Map<string, CallState> = new Map();

// IVR Response Generator
function generateIVRResponse(message: string, menuOptions?: { digit: string; label: string }[]): object {
  const response: any = {
    message,
    callId: uuidv4(),
    timestamp: new Date().toISOString(),
  };
  if (menuOptions) {
    response.menuOptions = menuOptions;
    response.prompt = `${message}. Press 1 for Vehicle Status, 2 for Driver Check-in, 3 for Dispatch, 0 for Operator`;
  }
  return response;
}

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'fleetiq-phone-receptionist',
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

// IVR Entry Point - Handle incoming calls
app.post('/ivr/call', (req: Request, res: Response) => {
  const { from, to, duration } = req.body;
  const callId = uuidv4();

  activeCalls.set(callId, {
    callId,
    state: 'main',
    data: { from: from || 'unknown', to: to || 'unknown', duration: duration || '0' },
  });

  console.log(`[FLEETIQ-IVR] Incoming call from ${from} to ${to}`);

  res.json({
    ...generateIVRResponse(
      'Welcome to FleetIQ. Your fleet management assistant.',
      [
        { digit: '1', label: 'Vehicle Status' },
        { digit: '2', label: 'Driver Check-in' },
        { digit: '3', label: 'Dispatch Inquiry' },
        { digit: '0', label: 'Speak with Operator' },
      ]
    ),
    callId,
  });
});

// Handle IVR menu selections
app.post('/ivr/menu', (req: Request, res: Response) => {
  const { callId, selection } = req.body;

  if (!callId) {
    res.status(400).json({ error: 'callId required' });
    return;
  }

  const callState = activeCalls.get(callId) || { callId, state: 'main', data: {} };

  switch (selection) {
    case '1':
      callState.state = 'vehicle-status';
      break;
    case '2':
      callState.state = 'driver-checkin';
      break;
    case '3':
      callState.state = 'dispatch';
      break;
    case '0':
      callState.state = 'transfer';
      res.json({
        message: 'Transferring you to an operator. Please hold.',
        transferTo: 'fleet-operations',
        callId,
      });
      activeCalls.delete(callId);
      return;
    default:
      res.json({
        message: 'Invalid selection. Please try again.',
        callId,
      });
      return;
  }

  activeCalls.set(callId, callState);
  res.json({
    state: callState.state,
    callId,
    message: `Selected: ${callState.state.replace('-', ' ')}`,
  });
});

// Fleet Status Endpoint
app.get('/api/fleet/status', (req: Request, res: Response) => {
  const { status } = req.query;

  let fleetStatus = Array.from(vehicles.values());

  if (status) {
    fleetStatus = fleetStatus.filter(v => v.status === status);
  }

  const summary = {
    totalVehicles: vehicles.size,
    active: fleetStatus.filter(v => v.status === 'active').length,
    idle: fleetStatus.filter(v => v.status === 'idle').length,
    maintenance: fleetStatus.filter(v => v.status === 'maintenance').length,
    offline: fleetStatus.filter(v => v.status === 'offline').length,
    vehicles: fleetStatus,
  };

  console.log(`[FLEETIQ] Fleet status requested. Total: ${vehicles.size} vehicles`);

  res.json({
    success: true,
    data: summary,
    timestamp: new Date().toISOString(),
  });
});

// Get specific vehicle status
app.get('/api/fleet/vehicle/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const vehicle = vehicles.get(id);

  if (!vehicle) {
    res.status(404).json({ success: false, error: 'Vehicle not found' });
    return;
  }

  const driver = drivers.get(vehicle.driverId);

  res.json({
    success: true,
    data: {
      vehicle,
      driver,
    },
    timestamp: new Date().toISOString(),
  });
});

// Driver Info Endpoint
app.get('/api/driver/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const driver = drivers.get(id);

  if (!driver) {
    res.status(404).json({ success: false, error: 'Driver not found' });
    return;
  }

  const vehicle = vehicles.get(driver.vehicleId);

  res.json({
    success: true,
    data: {
      driver,
      vehicle,
    },
    timestamp: new Date().toISOString(),
  });
});

// Driver check-in endpoint
app.post('/api/driver/checkin', (req: Request, res: Response) => {
  const { driverId, status, location, notes } = req.body;

  const driver = drivers.get(driverId);
  if (!driver) {
    res.status(404).json({ success: false, error: 'Driver not found' });
    return;
  }

  driver.status = status || driver.status;
  driver.checkInTime = new Date().toISOString();

  if (location) {
    const vehicle = vehicles.get(driver.vehicleId);
    if (vehicle) {
      vehicle.location = location;
      vehicle.lastUpdated = new Date().toISOString();
    }
  }

  console.log(`[FLEETIQ] Driver ${driver.name} checked in. Status: ${driver.status}`);

  res.json({
    success: true,
    message: `Check-in recorded for ${driver.name}`,
    data: driver,
    timestamp: new Date().toISOString(),
  });
});

// Vehicle status update endpoint
app.put('/api/fleet/vehicle/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  const vehicle = vehicles.get(id);
  if (!vehicle) {
    res.status(404).json({ success: false, error: 'Vehicle not found' });
    return;
  }

  Object.assign(vehicle, updates, { lastUpdated: new Date().toISOString() });

  console.log(`[FLEETIQ] Vehicle ${vehicle.plateNumber} updated. Status: ${vehicle.status}`);

  res.json({
    success: true,
    data: vehicle,
    timestamp: new Date().toISOString(),
  });
});

// Dispatch request endpoint
app.post('/api/dispatch/request', (req: Request, res: Response) => {
  const { vehicleId, destination, priority, notes } = req.body;

  const vehicle = vehicles.get(vehicleId);
  if (!vehicle) {
    res.status(404).json({ success: false, error: 'Vehicle not found' });
    return;
  }

  const dispatchId = `DSP-${uuidv4().substring(0, 8).toUpperCase()}`;

  console.log(`[FLEETIQ] Dispatch created: ${dispatchId} for ${vehicle.plateNumber}`);

  res.json({
    success: true,
    dispatchId,
    message: 'Dispatch request submitted',
    data: {
      dispatchId,
      vehicleId,
      vehiclePlate: vehicle.plateNumber,
      destination,
      priority: priority || 'normal',
      status: 'pending',
      createdAt: new Date().toISOString(),
    },
  });
});

// Get all drivers
app.get('/api/drivers', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: Array.from(drivers.values()),
    timestamp: new Date().toISOString(),
  });
});

// Emergency endpoint
app.post('/api/emergency', (req: Request, res: Response) => {
  const { vehicleId, type, location, description } = req.body;

  const emergencyId = `EMG-${uuidv4().substring(0, 8).toUpperCase()}`;

  console.log(`[FLEETIQ] EMERGENCY: ${emergencyId} - Vehicle ${vehicleId} - Type: ${type}`);

  res.json({
    success: true,
    emergencyId,
    message: 'Emergency alert sent to fleet operations',
    data: {
      emergencyId,
      vehicleId,
      type,
      location,
      description,
      status: 'active',
      createdAt: new Date().toISOString(),
    },
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   🚌 FLEETIQ Phone Receptionist                   ║
║   Port: ${PORT}                                     ║
║   Industry: Fleet Management                      ║
║                                                   ║
║   Endpoints:                                      ║
║   • GET  /health                                  ║
║   • POST /ivr/call                                ║
║   • POST /ivr/menu                                ║
║   • GET  /api/fleet/status                        ║
║   • GET  /api/fleet/vehicle/:id                   ║
║   • GET  /api/driver/:id                          ║
║   • POST /api/driver/checkin                      ║
║   • PUT  /api/fleet/vehicle/:id                   ║
║   • POST /api/dispatch/request                    ║
║   • GET  /api/drivers                             ║
║   • POST /api/emergency                           ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
  `);
});

export default app;