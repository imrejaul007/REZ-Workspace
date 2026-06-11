/**
 * @module fleetiq-whatsapp-ai
 * @description FleetIQ WhatsApp AI - Voice agent for fleet management
 * @author HOJAI AI Team
 * @version 1.0.0
 *
 * Port: 4902
 *
 * WhatsApp integration for fleet management operations including
 * vehicle tracking, driver communication, route management, and
 * maintenance alerts.
 */

import express, { Express, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger, maskPhone } from './logger';

// ============================================
// TYPES
// ============================================

/**
 * Vehicle status in the fleet
 */
type VehicleStatus = 'active' | 'idle' | 'maintenance' | 'offline';

/**
 * Driver status
 */
type DriverStatus = 'available' | 'on-trip' | 'break' | 'offline';

/**
 * Maintenance alert status
 */
type MaintenanceStatus = 'pending' | 'completed' | 'overdue';

/**
 * Route status
 */
type RouteStatus = 'in-progress' | 'completed' | 'delayed';

/**
 * Message type for WhatsApp
 */
type MessageType = 'text' | 'location' | 'image' | 'document';

/**
 * Vehicle in the fleet
 */
interface Vehicle {
  id: string;
  plateNumber: string;
  status: VehicleStatus;
  driverId: string;
  location: string;
  fuelLevel: number;
  lastUpdated: string;
}

/**
 * Driver in the fleet
 */
interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicleId: string;
  status: DriverStatus;
  lastCheckIn?: string;
}

/**
 * Maintenance alert for vehicles
 */
interface MaintenanceAlert {
  id: string;
  vehicleId: string;
  type: 'scheduled' | 'urgent' | 'routine';
  description: string;
  dueDate: string;
  status: MaintenanceStatus;
}

/**
 * Route information
 */
interface RouteInfo {
  id: string;
  vehicleId: string;
  origin: string;
  destination: string;
  estimatedTime: string;
  distance: number;
  stops: string[];
  status: RouteStatus;
}

/**
 * WhatsApp message structure
 */
interface WhatsAppMessage {
  from: string;
  to: string;
  messageId: string;
  timestamp: string;
  type: MessageType;
  content: string;
}

/**
 * Fleet response structure
 */
interface FleetResponse {
  message: string;
  replyOptions?: string[];
}

/**
 * Intent types for message handling
 */
type IntentType =
  | 'vehicle_status'
  | 'route_info'
  | 'maintenance'
  | 'driver_communication'
  | 'fleet_notification'
  | 'fuel_status'
  | 'general_inquiry';

// ============================================
// EXPRESS APP
// ============================================

const app: Express = express();
const PORT = 4902;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// IN-MEMORY STORAGE (replace with database in production)
// ============================================

const vehicles: Map<string, Vehicle> = new Map();
const drivers: Map<string, Driver> = new Map();
const maintenanceAlerts: Map<string, MaintenanceAlert> = new Map();
const routes: Map<string, RouteInfo> = new Map();

// ============================================
// SAMPLE DATA INITIALIZATION
// ============================================

/**
 * Initializes sample data for demonstration
 * @returns void
 */
function initializeSampleData(): void {
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

  const sampleMaintenance: MaintenanceAlert[] = [
    { id: 'm1', vehicleId: 'v2', type: 'scheduled', description: 'Oil change due', dueDate: '2026-06-10', status: 'pending' },
    { id: 'm2', vehicleId: 'v1', type: 'urgent', description: 'Brake inspection required', dueDate: '2026-06-05', status: 'pending' },
  ];

  const sampleRoutes: RouteInfo[] = [
    { id: 'r1', vehicleId: 'v1', origin: 'Depot Central', destination: 'Distribution Hub', estimatedTime: '45 mins', distance: 25.5, stops: ['Zone 1', 'Zone 2', 'Zone 3'], status: 'in-progress' },
  ];

  sampleVehicles.forEach(v => vehicles.set(v.id, v));
  sampleDrivers.forEach(d => drivers.set(d.id, d));
  sampleMaintenance.forEach(m => maintenanceAlerts.set(m.id, m));
  sampleRoutes.forEach(r => routes.set(r.id, r));

  logger.info('Sample data initialized', { vehicles: vehicles.size, drivers: drivers.size });
}

initializeSampleData();

// ============================================
// INTENT DETECTION
// ============================================

/**
 * Detects the intent of a user message
 * @param message - The user's message
 * @returns The detected intent type
 */
function detectIntent(message: string): IntentType {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('status') || lowerMessage.includes('where') || lowerMessage.includes('location')) {
    return 'vehicle_status';
  }
  if (lowerMessage.includes('route') || lowerMessage.includes('navigation') || lowerMessage.includes('directions')) {
    return 'route_info';
  }
  if (lowerMessage.includes('maintenance') || lowerMessage.includes('service') || lowerMessage.includes('repair')) {
    return 'maintenance';
  }
  if (lowerMessage.includes('driver') || lowerMessage.includes('driver')) {
    return 'driver_communication';
  }
  if (lowerMessage.includes('alert') || lowerMessage.includes('notification') || lowerMessage.includes('update')) {
    return 'fleet_notification';
  }
  if (lowerMessage.includes('fuel') || lowerMessage.includes('gas')) {
    return 'fuel_status';
  }

  return 'general_inquiry';
}

// ============================================
// RESPONSE GENERATION
// ============================================

/**
 * Generates a response based on detected intent
 * @param intent - The detected intent
 * @param params - Additional parameters including masked phone
 * @returns Fleet response with message and reply options
 */
function generateFleetResponse(intent: IntentType, params: Record<string, string>): FleetResponse {
  switch (intent) {
    case 'vehicle_status': {
      const vehicle = vehicles.get(params.vehicleId || 'v1');
      if (vehicle) {
        return {
          message: `Vehicle ${vehicle.plateNumber} Status:\n\nLocation: ${vehicle.location}\nFuel: ${vehicle.fuelLevel}%\nStatus: ${vehicle.status.toUpperCase()}\nLast Update: ${new Date(vehicle.lastUpdated).toLocaleTimeString()}`,
          replyOptions: ['View Route', 'Contact Driver', 'Request Maintenance'],
        };
      }
      return { message: 'Vehicle not found. Please provide a valid vehicle ID.' };
    }

    case 'route_info': {
      const activeRoutes = Array.from(routes.values()).filter(r => r.status === 'in-progress');
      if (activeRoutes.length > 0) {
        const route = activeRoutes[0];
        return {
          message: `Active Route:\n\nFrom: ${route.origin}\nTo: ${route.destination}\nETA: ${route.estimatedTime}\nDistance: ${route.distance} km\n\nStops: ${route.stops.join(' -> ')}`,
          replyOptions: ['Update ETA', 'Change Route', 'Contact Driver'],
        };
      }
      return { message: 'No active routes at the moment.' };
    }

    case 'maintenance': {
      const alerts = Array.from(maintenanceAlerts.values());
      const pendingAlerts = alerts.filter(a => a.status === 'pending');
      if (pendingAlerts.length > 0) {
        const alertList = pendingAlerts.map(a => {
          const v = vehicles.get(a.vehicleId);
          return `${v?.plateNumber || 'Unknown'}: ${a.description} (Due: ${a.dueDate})`;
        }).join('\n');
        return {
          message: `Maintenance Alerts:\n\n${alertList}`,
          replyOptions: ['Schedule Service', 'View Details', 'Dismiss Alert'],
        };
      }
      return { message: 'No pending maintenance alerts.' };
    }

    case 'driver_communication': {
      const driver = drivers.get(params.driverId || 'd1');
      if (driver) {
        return {
          message: `Driver Info:\n\nName: ${driver.name}\nPhone: ${maskPhone(driver.phone)}\nVehicle: ${vehicles.get(driver.vehicleId)?.plateNumber || 'N/A'}\nStatus: ${driver.status.toUpperCase()}`,
          replyOptions: ['Send Message', 'View Location', 'Request Check-in'],
        };
      }
      return { message: 'Driver not found.' };
    }

    case 'fleet_notification': {
      const fleetSummary = {
        active: Array.from(vehicles.values()).filter(v => v.status === 'active').length,
        idle: Array.from(vehicles.values()).filter(v => v.status === 'idle').length,
        maintenance: Array.from(vehicles.values()).filter(v => v.status === 'maintenance').length,
      };
      return {
        message: `Fleet Update:\n\nActive: ${fleetSummary.active} vehicles\nIdle: ${fleetSummary.idle} vehicles\nMaintenance: ${fleetSummary.maintenance} vehicles\n\nAll systems operational.`,
        replyOptions: ['Full Report', 'Alert Details', 'Contact Operations'],
      };
    }

    case 'fuel_status': {
      const lowFuelVehicles = Array.from(vehicles.values()).filter(v => v.fuelLevel < 50);
      if (lowFuelVehicles.length > 0) {
        const list = lowFuelVehicles.map(v => `${v.plateNumber}: ${v.fuelLevel}%`).join('\n');
        return {
          message: `Low Fuel Alert:\n\n${list}\n\nPlease coordinate refueling.`,
          replyOptions: ['Find Nearest Station', 'Reassign Vehicle', 'View All Vehicles'],
        };
      }
      return { message: 'All vehicles have adequate fuel levels (>50%).' };
    }

    default:
      return {
        message: 'Welcome to FLEETIQ! How can I help you today?\n\nI can assist with:\nVehicle Status\nRoute Information\nMaintenance Alerts\nDriver Communication\nFleet Notifications\nFuel Status',
        replyOptions: ['Vehicle Status', 'Route Info', 'Maintenance', 'Driver Contact', 'Fleet Report'],
      };
  }
}

// ============================================
// API ENDPOINTS
// ============================================

/**
 * Health check endpoint
 * @returns Health status
 */
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'fleetiq-whatsapp-ai',
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

/**
 * WhatsApp webhook verification endpoint
 * @param mode - Subscription mode
 * @param token - Verification token
 * @param challenge - Challenge string for verification
 * @returns Challenge response or 403
 */
app.get('/webhook/whatsapp', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'fleetiq_verify_token';

  if (mode === 'subscribe' && token === verifyToken) {
    logger.info('Webhook verified successfully');
    res.status(200).send(challenge);
  } else {
    logger.warn('Webhook verification failed');
    res.status(403).send('Forbidden');
  }
});

/**
 * Incoming WhatsApp messages handler
 * @returns OK response
 */
app.post('/webhook/whatsapp', (req: Request, res: Response) => {
  const { entry } = req.body;

  if (!entry || !entry[0]?.changes?.[0]?.value?.messages) {
    res.status(200).send('OK');
    return;
  }

  const messages = entry[0].changes[0].value.messages;

  messages.forEach((msg: any) => {
    const waMessage: WhatsAppMessage = {
      from: msg.from,
      to: msg.to,
      messageId: msg.id,
      timestamp: msg.timestamp,
      type: msg.type,
      content: msg.text?.body || '',
    };

    const maskedFrom = maskPhone(waMessage.from);
    logger.info('Incoming WhatsApp message', { from: maskedFrom, type: waMessage.type });

    const intent = detectIntent(waMessage.content);
    const response = generateFleetResponse(intent, { phone: maskedFrom });

    logger.info('Message intent detected', { intent, messageLength: waMessage.content.length });
  });

  res.status(200).send('OK');
});

/**
 * Send message endpoint (for outbound notifications)
 * @param to - Recipient phone number
 * @param message - Message content
 * @param type - Message type
 * @returns Message delivery status
 */
app.post('/api/messages/send', (req: Request, res: Response) => {
  const { to, message, type } = req.body;

  if (!to || !message) {
    res.status(400).json({ success: false, error: 'to and message are required' });
    return;
  }

  const messageId = uuidv4();
  const maskedTo = maskPhone(to);

  logger.info('Sending outbound message', { to: maskedTo, messageLength: message.length });

  res.json({
    success: true,
    messageId,
    data: {
      messageId,
      to,
      message,
      type: type || 'text',
      status: 'sent',
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * Get vehicle updates
 * @param id - Vehicle ID
 * @returns Vehicle data with driver info
 */
app.get('/api/vehicles/:id/updates', (req: Request, res: Response) => {
  const { id } = req.params;
  const vehicle = vehicles.get(id);

  if (!vehicle) {
    res.status(404).json({ success: false, error: 'Vehicle not found' });
    return;
  }

  // Mask phone number in driver info
  const driver = drivers.get(vehicle.driverId);
  const maskedDriver = driver ? { ...driver, phone: maskPhone(driver.phone) } : undefined;

  res.json({
    success: true,
    data: {
      id: vehicle.id,
      plateNumber: vehicle.plateNumber,
      status: vehicle.status,
      location: vehicle.location,
      fuelLevel: vehicle.fuelLevel,
      lastUpdated: vehicle.lastUpdated,
      driver: maskedDriver,
    },
    timestamp: new Date().toISOString(),
  });
});

/**
 * Get all routes with optional filtering
 * @param status - Route status filter
 * @param vehicleId - Vehicle ID filter
 * @returns List of routes
 */
app.get('/api/routes', (req: Request, res: Response) => {
  const { status, vehicleId } = req.query;

  let routeList = Array.from(routes.values());

  if (status) {
    routeList = routeList.filter(r => r.status === status);
  }
  if (vehicleId) {
    routeList = routeList.filter(r => r.vehicleId === vehicleId);
  }

  res.json({
    success: true,
    data: routeList,
    count: routeList.length,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Get specific route
 * @param id - Route ID
 * @returns Route data or 404
 */
app.get('/api/routes/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const route = routes.get(id);

  if (!route) {
    res.status(404).json({ success: false, error: 'Route not found' });
    return;
  }

  res.json({
    success: true,
    data: route,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Get maintenance alerts with filtering
 * @param status - Alert status filter
 * @param vehicleId - Vehicle ID filter
 * @returns List of maintenance alerts
 */
app.get('/api/maintenance/alerts', (req: Request, res: Response) => {
  const { status, vehicleId } = req.query;

  let alerts = Array.from(maintenanceAlerts.values());

  if (status) {
    alerts = alerts.filter(a => a.status === status);
  }
  if (vehicleId) {
    alerts = alerts.filter(a => a.vehicleId === vehicleId);
  }

  res.json({
    success: true,
    data: alerts,
    count: alerts.length,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Create a maintenance alert
 * @param vehicleId - Target vehicle ID
 * @param type - Alert type
 * @param description - Alert description
 * @param dueDate - Due date
 * @returns Created alert
 */
app.post('/api/maintenance/alerts', (req: Request, res: Response) => {
  const { vehicleId, type, description, dueDate } = req.body;

  const vehicle = vehicles.get(vehicleId);
  if (!vehicle) {
    res.status(404).json({ success: false, error: 'Vehicle not found' });
    return;
  }

  const alertId = `MAL-${uuidv4().substring(0, 8).toUpperCase()}`;

  const alert: MaintenanceAlert = {
    id: alertId,
    vehicleId,
    type: type || 'routine',
    description: description || '',
    dueDate: dueDate || new Date().toISOString(),
    status: 'pending',
  };

  maintenanceAlerts.set(alertId, alert);

  logger.info('Maintenance alert created', { alertId, vehicleId: vehicle.plateNumber });

  res.json({
    success: true,
    alertId,
    data: alert,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Communicate with a driver
 * @param driverId - Driver ID
 * @param message - Message to send
 * @param type - Message type
 * @returns Delivery status with masked phone
 */
app.post('/api/driver/communicate', (req: Request, res: Response) => {
  const { driverId, message, type } = req.body;

  const driver = drivers.get(driverId);
  if (!driver) {
    res.status(404).json({ success: false, error: 'Driver not found' });
    return;
  }

  logger.info('Driver communication sent', { driverId, driverName: driver.name });

  res.json({
    success: true,
    data: {
      messageId: uuidv4(),
      driverId,
      driverName: driver.name,
      phone: maskPhone(driver.phone),
      message,
      type: type || 'text',
      status: 'delivered',
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * Send fleet-wide notifications
 * @param title - Notification title
 * @param message - Notification message
 * @param vehicles - Target vehicle IDs (optional, all if not specified)
 * @param priority - Notification priority
 * @returns Notification status
 */
app.post('/api/notifications/fleet', (req: Request, res: Response) => {
  const { title, message, vehicles: targetVehicles, priority } = req.body;

  const notificationId = uuidv4();
  const targets = targetVehicles || Array.from(vehicles.keys());

  logger.info('Fleet notification sent', { notificationId, title, targetCount: targets.length });

  res.json({
    success: true,
    notificationId,
    data: {
      notificationId,
      title,
      message,
      priority: priority || 'normal',
      targets,
      delivered: targets.length,
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * Get all vehicles
 * @returns Array of all vehicles
 */
app.get('/api/vehicles', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: Array.from(vehicles.values()),
    timestamp: new Date().toISOString(),
  });
});

/**
 * Get all drivers
 * @returns Array of all drivers (phones masked)
 */
app.get('/api/drivers', (_req: Request, res: Response) => {
  // Return drivers with masked phone numbers
  const maskedDrivers = Array.from(drivers.values()).map(d => ({
    ...d,
    phone: maskPhone(d.phone),
  }));

  res.json({
    success: true,
    data: maskedDrivers,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Update vehicle location
 * @param id - Vehicle ID
 * @param location - New location string
 * @param latitude - GPS latitude
 * @param longitude - GPS longitude
 * @returns Updated vehicle
 */
app.put('/api/vehicles/:id/location', (req: Request, res: Response) => {
  const { id } = req.params;
  const { location, latitude, longitude } = req.body;

  const vehicle = vehicles.get(id);
  if (!vehicle) {
    res.status(404).json({ success: false, error: 'Vehicle not found' });
    return;
  }

  vehicle.location = location || `${latitude}, ${longitude}`;
  vehicle.lastUpdated = new Date().toISOString();

  logger.info('Vehicle location updated', { vehicleId: vehicle.plateNumber, location: vehicle.location });

  res.json({
    success: true,
    data: vehicle,
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// ============================================
// SERVER STARTUP
// ============================================

app.listen(PORT, () => {
  logger.info('FLEETIQ WhatsApp AI started', { port: PORT, service: 'fleet-management' });
  logger.info('Available endpoints', {
    endpoints: [
      'GET  /health',
      'GET  /webhook/whatsapp',
      'POST /webhook/whatsapp',
      'POST /api/messages/send',
      'GET  /api/vehicles',
      'GET  /api/vehicles/:id/updates',
      'PUT  /api/vehicles/:id/location',
      'GET  /api/routes',
      'GET  /api/routes/:id',
      'GET  /api/maintenance/alerts',
      'POST /api/maintenance/alerts',
      'POST /api/driver/communicate',
      'POST /api/notifications/fleet',
      'GET  /api/drivers',
    ]
  });
});

export default app;
