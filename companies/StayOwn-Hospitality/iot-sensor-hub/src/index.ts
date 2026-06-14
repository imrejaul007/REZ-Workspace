/**
 * IoT Sensor Hub - Real-time Equipment Monitoring
 *
 * Simulates IoT sensors for hotel equipment:
 * - AC units (temperature, vibration, pressure)
 * - Elevators (speed, door sensors, weight)
 * - Plumbing (pressure, flow, leak detection)
 * - Electrical (current, voltage, heat)
 * - Kitchen equipment (temperature, timer, smoke)
 *
 * Integrates with:
 * - Maintenance Agent (Port 4849) - Predictive maintenance
 * - Room Controls (Port 3814) - Real-time room adjustments
 *
 * Chapter 14: "Room 1521 AC shows unusual vibration"
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const app: Express = express();
const PORT = parseInt(process.env.PORT || '4903', 10);

// Service URLs
const SERVICES = {
  maintenanceAgent: process.env.MAINTENANCE_AGENT_URL || 'http://localhost:4849',
  roomControls: process.env.ROOM_CONTROLS_URL || 'http://localhost:3814',
  roomTwin: process.env.ROOM_TWIN_URL || 'http://localhost:8447',
  housekeeping: process.env.HOUSEKEEPING_URL || 'http://localhost:3826',
};

// Equipment registry
interface Equipment {
  id: string;
  type: 'ac' | 'elevator' | 'plumbing' | 'electrical' | 'kitchen';
  roomId?: string;
  location: string;
  status: 'operational' | 'warning' | 'critical' | 'maintenance';
  lastReading: SensorReading;
  readings: SensorReading[];
  healthScore: number;
  failureProbability: number;
  installedDate: string;
}

interface SensorReading {
  timestamp: string;
  temperature?: number;
  vibration?: number;
  pressure?: number;
  current?: number;
  voltage?: number;
  flow?: number;
  humidity?: number;
  smoke?: boolean;
  noise?: number;
}

// In-memory stores
const equipment: Map<string, Equipment> = new Map();
const sensorData: Map<string, SensorReading[]> = new Map();
const alerts: Map<string, any[]> = new Map();

// Base sensor values per equipment type
const sensorConfig: Record<string, any> = {
  ac: {
    baseTemp: 22,
    baseVibration: 0.5,
    basePressure: 101.325,
    warningThreshold: { vibration: 2.0, temp: 28 },
    criticalThreshold: { vibration: 3.5, temp: 32 }
  },
  elevator: {
    baseSpeed: 1.5,
    baseWeight: 500,
    warningThreshold: { speedVariation: 0.3 },
    criticalThreshold: { speedVariation: 0.5 }
  },
  plumbing: {
    basePressure: 3.5,
    baseFlow: 15,
    warningThreshold: { pressureDrop: 0.5 },
    criticalThreshold: { leak: true }
  },
  electrical: {
    baseCurrent: 10,
    baseVoltage: 220,
    warningThreshold: { heat: 45, flicker: 3 },
    criticalThreshold: { heat: 60, spike: 250 }
  },
  kitchen: {
    baseTemp: 180,
    warningThreshold: { tempVariance: 15 },
    criticalThreshold: { smoke: true, tempVariance: 30 }
  }
};

// HTTP client
const http = axios.create({ timeout: 10000 });

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = uuidv4();
  res.setHeader('X-Request-ID', requestId);
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${requestId}`);
  next();
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'iot-sensor-hub',
    port: PORT,
    version: '1.0.0',
    equipmentCount: equipment.size,
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// EQUIPMENT MANAGEMENT
// ============================================================================

/**
 * POST /api/equipment
 * Register new equipment
 */
app.post('/api/equipment', (req: Request, res: Response) => {
  const { id, type, roomId, location } = req.body;

  if (!id || !type) {
    return res.status(400).json({
      success: false,
      error: 'id and type are required'
    });
  }

  const newEquipment: Equipment = {
    id,
    type,
    roomId,
    location: location || `Room ${roomId || 'Common'}`,
    status: 'operational',
    lastReading: { timestamp: new Date().toISOString() },
    readings: [],
    healthScore: 100,
    failureProbability: 0.01,
    installedDate: new Date().toISOString()
  };

  equipment.set(id, newEquipment);
  sensorData.set(id, []);

  console.log(`[IOT] Registered equipment: ${id} (${type}) in ${newEquipment.location}`);

  res.json({
    success: true,
    data: newEquipment
  });
});

/**
 * GET /api/equipment
 * List all equipment
 */
app.get('/api/equipment', (req: Request, res: Response) => {
  const { type, status } = req.query;

  let filtered = Array.from(equipment.values());

  if (type) {
    filtered = filtered.filter(e => e.type === type);
  }
  if (status) {
    filtered = filtered.filter(e => e.status === status);
  }

  res.json({
    success: true,
    count: filtered.length,
    data: filtered
  });
});

/**
 * GET /api/equipment/:id
 * Get equipment details
 */
app.get('/api/equipment/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const eq = equipment.get(id);

  if (!eq) {
    return res.status(404).json({
      success: false,
      error: 'Equipment not found'
    });
  }

  res.json({
    success: true,
    data: eq
  });
});

// ============================================================================
// SENSOR DATA INGESTION
// ============================================================================

/**
 * POST /api/sensors/:equipmentId/readings
 * Submit sensor readings
 */
app.post('/api/sensors/:equipmentId/readings', (req: Request, res: Response) => {
  const { equipmentId } = req.params;
  const reading: SensorReading = {
    timestamp: new Date().toISOString(),
    ...req.body
  };

  const eq = equipment.get(equipmentId);

  if (!eq) {
    return res.status(404).json({
      success: false,
      error: 'Equipment not found'
    });
  }

  // Store reading
  const readings = sensorData.get(equipmentId) || [];
  readings.push(reading);
  if (readings.length > 1000) readings.shift(); // Keep last 1000 readings
  sensorData.set(equipmentId, readings);

  // Update equipment
  eq.lastReading = reading;
  eq.readings = readings;

  // Analyze and update status
  const analysis = analyzeReading(eq.type, reading);
  eq.status = analysis.status;
  eq.healthScore = analysis.healthScore;
  eq.failureProbability = analysis.failureProbability;

  // Generate alerts if needed
  if (analysis.alerts.length > 0) {
    const equipmentAlerts = alerts.get(equipmentId) || [];
    equipmentAlerts.push(...analysis.alerts);
    alerts.set(equipmentId, equipmentAlerts.slice(-100));

    // Notify maintenance agent if critical
    if (analysis.status === 'critical') {
      notifyMaintenanceAgent(eq, reading, analysis);
    }
  }

  res.json({
    success: true,
    data: {
      equipmentId,
      reading,
      analysis
    }
  });
});

/**
 * Analyze sensor reading
 */
function analyzeReading(type: string, reading: SensorReading): any {
  const config = sensorConfig[type];
  const alerts: any[] = [];
  let healthScore = 100;
  let failureProbability = 0.01;
  let status: 'operational' | 'warning' | 'critical' | 'maintenance' = 'operational';

  switch (type) {
    case 'ac':
      // Check vibration (Chapter 14: "AC shows unusual vibration")
      if (reading.vibration !== undefined) {
        if (reading.vibration > config.criticalThreshold.vibration) {
          alerts.push({
            type: 'critical',
            message: `Critical vibration detected: ${reading.vibration} (threshold: ${config.criticalThreshold.vibration})`,
            code: 'AC_VIBRATION_CRITICAL'
          });
          healthScore -= 40;
          failureProbability = 0.82; // 82% failure risk (as in story)
          status = 'critical';
        } else if (reading.vibration > config.warningThreshold.vibration) {
          alerts.push({
            type: 'warning',
            message: `Vibration above normal: ${reading.vibration}`,
            code: 'AC_VIBRATION_WARNING'
          });
          healthScore -= 15;
          failureProbability += 0.15;
          status = 'warning';
        }
      }

      // Check temperature
      if (reading.temperature !== undefined && reading.temperature > config.warningThreshold.temp) {
        alerts.push({
          type: reading.temperature > config.criticalThreshold.temp ? 'critical' : 'warning',
          message: `Temperature anomaly: ${reading.temperature}°C`,
          code: 'AC_TEMP_ANOMALY'
        });
        healthScore -= 10;
      }
      break;

    case 'plumbing':
      // Leak detection
      if (reading.flow !== undefined) {
        const pressureDrop = Math.abs((reading.pressure || config.basePressure) - config.basePressure);
        if (pressureDrop > config.criticalThreshold.pressureDrop) {
          alerts.push({
            type: 'critical',
            message: 'Possible leak detected',
            code: 'PLUMBING_LEAK'
          });
          status = 'critical';
          healthScore -= 30;
        }
      }
      break;

    case 'electrical':
      // Heat and flicker
      if (reading.noise !== undefined && reading.noise > 50) {
        alerts.push({
          type: 'warning',
          message: 'Electrical noise detected',
          code: 'ELECTRICAL_NOISE'
        });
        healthScore -= 20;
      }
      break;
  }

  return {
    status,
    healthScore: Math.max(0, healthScore),
    failureProbability: Math.min(1, failureProbability),
    alerts
  };
}

/**
 * Notify maintenance agent about critical issues
 */
async function notifyMaintenanceAgent(
  equipment: Equipment,
  reading: SensorReading,
  analysis: any
): Promise<void> {
  console.log(`[IOT] 🚨 ALERT: Critical issue with ${equipment.id} - Notifying maintenance agent`);

  try {
    // Update equipment health in maintenance agent
    await http.post(`${SERVICES.maintenanceAgent}/api/equipment/${equipment.id}/health`, {
      type: equipment.type,
      roomId: equipment.roomId,
      warningSigns: analysis.alerts.map(a => a.code.toLowerCase().replace(/_/g, '_')),
      reading,
      healthScore: analysis.healthScore,
      failureProbability: analysis.failureProbability,
      timestamp: new Date().toISOString()
    });

    // Create work order if critical
    if (analysis.failureProbability > 0.5) {
      await http.post(`${SERVICES.maintenanceAgent}/api/work-order`, {
        hotelId: 'pentouz-indiranagar',
        category: equipment.type,
        priority: analysis.failureProbability > 0.7 ? 'emergency' : 'high',
        title: `${equipment.type.toUpperCase()} issue in ${equipment.location}`,
        description: `AI detected ${analysis.failureProbability * 100}% failure probability. ` +
                     `Alerts: ${analysis.alerts.map(a => a.message).join(', ')}`,
        reportedBy: 'iot-sensor-hub',
        roomId: equipment.roomId,
        equipmentId: equipment.id,
        guestImpact: true
      });
    }

    console.log(`[IOT] ✅ Maintenance agent notified for ${equipment.id}`);
  } catch (error) {
    console.log(`[IOT] Maintenance notification (demo mode):`, error instanceof Error ? error.message : 'Error');
  }
}

// ============================================================================
// ALERTS
// ============================================================================

/**
 * GET /api/alerts
 * Get all active alerts
 */
app.get('/api/alerts', (req: Request, res: Response) => {
  const { severity, equipmentId } = req.query;

  let allAlerts: any[] = [];

  if (equipmentId) {
    allAlerts = alerts.get(equipmentId as string) || [];
  } else {
    for (const [eqId, eqAlerts] of alerts.entries()) {
      allAlerts.push(...eqAlerts.map(a => ({ ...a, equipmentId: eqId })));
    }
  }

  if (severity) {
    allAlerts = allAlerts.filter(a => a.type === severity);
  }

  // Sort by timestamp descending
  allAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  res.json({
    success: true,
    count: allAlerts.length,
    data: allAlerts
  });
});

/**
 * GET /api/alerts/critical
 * Get critical alerts only
 */
app.get('/api/alerts/critical', (req: Request, res: Response) => {
  const criticalAlerts: any[] = [];

  for (const [eqId, eqAlerts] of alerts.entries()) {
    const critical = eqAlerts.filter(a => a.type === 'critical');
    criticalAlerts.push(...critical.map(a => ({ ...a, equipmentId: eqId })));
  }

  res.json({
    success: true,
    count: criticalAlerts.length,
    data: criticalAlerts
  });
});

// ============================================================================
// PREDICTIVE ANALYTICS
// ============================================================================

/**
 * GET /api/analytics/predict/:equipmentId
 * Get failure prediction for equipment
 */
app.get('/api/analytics/predict/:equipmentId', (req: Request, res: Response) => {
  const { equipmentId } = req.params;
  const eq = equipment.get(equipmentId);

  if (!eq) {
    return res.status(404).json({
      success: false,
      error: 'Equipment not found'
    });
  }

  // Calculate prediction based on readings
  const readings = sensorData.get(equipmentId) || [];
  const trends = calculateTrends(readings);

  res.json({
    success: true,
    data: {
      equipmentId,
      currentHealthScore: eq.healthScore,
      currentFailureProbability: eq.failureProbability,
      estimatedDaysUntilFailure: Math.round(1 / eq.failureProbability * 30),
      trends,
      recommendation: eq.failureProbability > 0.5
        ? 'Schedule immediate maintenance'
        : eq.failureProbability > 0.2
          ? 'Schedule maintenance within 7 days'
          : 'Continue monitoring'
    }
  });
});

/**
 * Calculate trends from readings
 */
function calculateTrends(readings: SensorReading[]): any {
  if (readings.length < 2) {
    return { trend: 'stable', change: 0 };
  }

  const recent = readings.slice(-10);
  const older = readings.slice(-20, -10);

  const recentAvg = recent.reduce((sum, r) => sum + (r.vibration || r.temperature || 0), 0) / recent.length;
  const olderAvg = older.length > 0
    ? older.reduce((sum, r) => sum + (r.vibration || r.temperature || 0), 0) / older.length
    : recentAvg;

  const change = ((recentAvg - olderAvg) / olderAvg) * 100;

  return {
    trend: change > 10 ? 'increasing' : change < -10 ? 'decreasing' : 'stable',
    changePercent: change.toFixed(2)
  };
}

/**
 * GET /api/analytics/high-risk
 * Get all high-risk equipment
 */
app.get('/api/analytics/high-risk', (req: Request, res: Response) => {
  const highRisk = Array.from(equipment.values())
    .filter(eq => eq.failureProbability > 0.3)
    .sort((a, b) => b.failureProbability - a.failureProbability)
    .map(eq => ({
      equipmentId: eq.id,
      type: eq.type,
      location: eq.location,
      healthScore: eq.healthScore,
      failureProbability: eq.failureProbability,
      estimatedFailure: Math.round(1 / eq.failureProbability * 30) + ' days',
      status: eq.status
    }));

  res.json({
    success: true,
    count: highRisk.length,
    data: highRisk
  });
});

// ============================================================================
// STORY SIMULATION (Chapter 14)
// ============================================================================

/**
 * POST /api/story/ac-vibration
 * Simulate Chapter 14: Room 1521 AC shows unusual vibration
 */
app.post('/api/story/ac-vibration', async (req: Request, res: Response) => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   📖 STORY: The Hotel That Remembered Everything             ║
║   Chapter 14 - Maintenance                                    ║
║                                                                ║
║   Room 1521 AC shows unusual vibration...                      ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
  `);

  const equipmentId = 'AC-1521-01';
  const roomId = '1521';

  // Ensure AC is registered
  if (!equipment.has(equipmentId)) {
    equipment.set(equipmentId, {
      id: equipmentId,
      type: 'ac',
      roomId,
      location: `Room ${roomId}`,
      status: 'operational',
      lastReading: { timestamp: new Date().toISOString() },
      readings: [],
      healthScore: 100,
      failureProbability: 0.01,
      installedDate: '2024-01-15'
    });
  }

  // Simulate vibration reading (unusual)
  const unusualVibration = 2.8 + Math.random() * 1.0; // 2.8 - 3.8

  const reading: SensorReading = {
    timestamp: new Date().toISOString(),
    vibration: unusualVibration,
    temperature: 24 + Math.random() * 4,
    pressure: 101.3,
    noise: 55 + Math.random() * 20
  };

  // Submit reading
  const eq = equipment.get(equipmentId)!;
  const readings = sensorData.get(equipmentId) || [];
  readings.push(reading);
  sensorData.set(equipmentId, readings);
  eq.lastReading = reading;
  eq.readings = readings;

  // Analyze
  const analysis = analyzeReading('ac', reading);
  eq.status = analysis.status;
  eq.healthScore = analysis.healthScore;
  eq.failureProbability = analysis.failureProbability;

  // Generate alerts
  if (analysis.alerts.length > 0) {
    const equipmentAlerts = alerts.get(equipmentId) || [];
    equipmentAlerts.push(...analysis.alerts);
    alerts.set(equipmentId, equipmentAlerts);
  }

  // Notify maintenance agent
  await notifyMaintenanceAgent(eq, reading, analysis);

  console.log(`
╔════════════════════════════════════════════════════════════════╗
║   🚨 AC VIBRATION DETECTED                                   ║
║                                                                ║
║   Room: 1521                                                  ║
║   Vibration: ${unusualVibration.toFixed(2)} (threshold: 2.0)                   ║
║   Failure Probability: ${(analysis.failureProbability * 100).toFixed(0)}%                                  ║
║   Status: ${analysis.status.toUpperCase()}                                          ║
║                                                                ║
║   ✅ Maintenance Agent notified                                ║
║   ✅ Work order created if probability > 50%                  ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
  `);

  res.json({
    success: true,
    story: {
      chapter: 14,
      title: 'Maintenance',
      event: 'AC vibration detected',
      equipment: {
        id: equipmentId,
        roomId,
        vibration: unusualVibration.toFixed(2),
        failureProbability: `${(analysis.failureProbability * 100).toFixed(0)}%`,
        status: analysis.status,
        message: 'Room 1521 AC shows unusual vibration'
      },
      alerts: analysis.alerts,
      maintenanceNotified: analysis.failureProbability > 0.5
    }
  });
});

// ============================================================================
// ERROR HANDLER
// ============================================================================

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   📡 IoT Sensor Hub                                           ║
║                                                                ║
║   Server running on port ${PORT}                               ║
║                                                                ║
║   Simulates real-time IoT sensors for:                         ║
║   • AC units (vibration, temperature)                          ║
║   • Elevators (speed, weight)                                  ║
║   • Plumbing (pressure, leak)                                  ║
║   • Electrical (current, heat)                                ║
║   • Kitchen (temperature, smoke)                               ║
║                                                                ║
║   Connected to:                                                ║
║   • Maintenance Agent: ${SERVICES.maintenanceAgent}   ║
║   • Room Controls: ${SERVICES.roomControls}            ║
║   • Room Twin: ${SERVICES.roomTwin}                    ║
║                                                                ║
║   Chapter 14: "Room 1521 AC shows unusual vibration"          ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
  `);
});

export default app;
