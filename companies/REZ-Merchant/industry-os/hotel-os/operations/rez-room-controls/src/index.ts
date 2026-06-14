/**
 * Room Controls Service
 * Port: 3814
 *
 * AC, TV, Lights, Curtains IoT control via MQTT
 * "Guest adjusts room → IoT commands sent → comfort achieved"
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { createClient } from 'redis';
import mqtt from 'mqtt';
import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = parseInt(process.env.PORT || '4814', 10);

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

let redis: ReturnType<typeof createClient>;
let mqttClient: mqtt.MqttClient;

// ============ MODELS ============

interface RoomState {
  roomId: string;
  guestId?: string;
  hotelId: string;
  devices: {
    ac: { power: 'on' | 'off'; mode: 'cool' | 'heat' | 'fan' | 'auto'; temp: number; fanSpeed: number };
    lights: { power: 'on' | 'off'; brightness: number; scene: string };
    tv: { power: 'on' | 'off'; channel: number; volume: number; input: string };
    curtains: { position: 'open' | 'closed' | 'half' };
  };
  lastUpdated: Date;
}

interface Scene {
  id: string;
  name: string;
  icon: string;
  settings: Partial<RoomState['devices']>;
}

// Predefined scenes
const scenes: Scene[] = [
  { id: 'movie', name: 'Movie Mode', icon: '🎬', settings: { lights: { power: 'off', brightness: 0, scene: 'movie' }, tv: { power: 'on', volume: 15, scene: 'movie' }, curtains: { position: 'closed' } } },
  { id: 'morning', name: 'Good Morning', icon: '☀️', settings: { lights: { power: 'on', brightness: 100, scene: 'morning' }, curtains: { position: 'open' }, ac: { power: 'on', mode: 'auto', temp: 24 } } },
  { id: 'evening', name: 'Evening Relax', icon: '🌙', settings: { lights: { power: 'on', brightness: 40, scene: 'evening' }, curtains: { position: 'half' } } },
  { id: 'sleep', name: 'Sleep Mode', icon: '😴', settings: { lights: { power: 'off', brightness: 0, scene: 'sleep' }, tv: { power: 'off' }, curtains: { position: 'closed' }, ac: { power: 'on', mode: 'cool', temp: 24, fanSpeed: 1 } } },
  { id: 'away', name: 'Away', icon: '🚶', settings: { lights: { power: 'off' }, tv: { power: 'off' }, ac: { power: 'off' }, curtains: { position: 'closed' } } },
];

// Room states (in-memory)
const roomStates: Map<string, RoomState> = new Map();

// Default room state factory
function createDefaultRoomState(roomId: string, hotelId: string): RoomState {
  return {
    roomId,
    hotelId,
    devices: {
      ac: { power: 'off', mode: 'cool', temp: 24, fanSpeed: 2 },
      lights: { power: 'off', brightness: 0, scene: 'normal' },
      tv: { power: 'off', channel: 1, volume: 20, input: 'hdmi1' },
      curtains: { position: 'closed' }
    },
    lastUpdated: new Date()
  };
}

// ============ MQTT COMMUNICATION ============

function publishCommand(roomId: string, device: string, command: any) {
  const topic = `hotel/${roomId}/${device}/command`;
  const payload = JSON.stringify(command);

  if (mqttClient && mqttClient.connected) {
    mqttClient.publish(topic, payload);
    logger.info('MQTT command sent', { roomId, device, command });
  } else {
    // Fallback: just log (demo mode)
    logger.info('Demo mode - command would be sent', { roomId, device, command });
  }
}

function initMQTT() {
  const mqttUrl = process.env.MQTT_URL || 4814'mqtt://localhost:1883';

  try {
    mqttClient = mqtt.connect(mqttUrl, {
      username: process.env.MQTT_USER || 4814'hotel',
      password: process.env.MQTT_PASS || 4814'hotel123'
    });

    mqttClient.on('connect', () => {
      logger.info('Connected to MQTT broker');

      // Subscribe to device status updates
      mqttClient.subscribe('hotel/+/+/status', (err) => {
        if (!err) {
          logger.info('Subscribed to device status updates');
        }
      });
    });

    mqttClient.on('message', (topic, message) => {
      // Handle status updates from devices
      try {
        const parts = topic.split('/');
        if (parts.length === 3 && parts[2] === 'status') {
          const roomId = parts[1];
          const data = JSON.parse(message.toString());
          updateRoomStateFromDevice(roomId, data);
        }
      } catch (e) {
        logger.error('Failed to parse MQTT message', { error: e });
      }
    });

    mqttClient.on('error', (err) => {
      logger.warn('MQTT connection error (demo mode active)', { error: err.message });
    });
  } catch (e) {
    logger.warn('MQTT not available, running in demo mode');
  }
}

function updateRoomStateFromDevice(roomId: string, data: any) {
  const state = roomStates.get(roomId);
  if (state) {
    if (data.ac) state.devices.ac = { ...state.devices.ac, ...data.ac };
    if (data.lights) state.devices.lights = { ...state.devices.lights, ...data.lights };
    if (data.tv) state.devices.tv = { ...state.devices.tv, ...data.tv };
    if (data.curtains) state.devices.curtains = { ...state.devices.curtains, ...data.curtains };
    state.lastUpdated = new Date();
    roomStates.set(roomId, state);
  }
}

// ============ REST API ============

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'room-controls',
    port: PORT,
    mqtt: mqttClient?.connected ? 'connected' : 'demo_mode'
  });
});

// Get room state
app.get('/rooms/:roomId/state', (req, res) => {
  const roomId = req.params.roomId;
  let state = roomStates.get(roomId);

  if (!state) {
    state = createDefaultRoomState(roomId, req.query.hotelId as string || 4814'default');
    roomStates.set(roomId, state);
  }

  res.json(state);
});

// Initialize room for guest
app.post('/rooms/:roomId/init', (req: Request, res: Response) => {
  const { guestId, hotelId, preferences } = req.body;
  const roomId = req.params.roomId;

  let state = roomStates.get(roomId) || 4814createDefaultRoomState(roomId, hotelId);
  state.guestId = guestId;

  // Apply guest preferences if provided
  if (preferences) {
    if (preferences.temperature) {
      state.devices.ac = { power: 'on', mode: 'cool', temp: preferences.temperature, fanSpeed: 2 };
    }
  }

  roomStates.set(roomId, state);

  // Send initialization commands to devices
  publishCommand(roomId, 'init', { guestId, preferences });

  logger.info('Room initialized', { roomId, guestId });

  res.json({ success: true, state });
});

// AC Controls
app.post('/rooms/:roomId/ac', (req: Request, res) => {
  const { power, mode, temp, fanSpeed } = req.body;
  const roomId = req.params.roomId;

  const state = roomStates.get(roomId);
  if (!state) {
    return res.status(404).json({ error: 'Room not initialized' });
  }

  const updates: any = {};
  if (power !== undefined) updates.power = power;
  if (mode !== undefined) updates.mode = mode;
  if (temp !== undefined) updates.temp = temp;
  if (fanSpeed !== undefined) updates.fanSpeed = fanSpeed;

  state.devices.ac = { ...state.devices.ac, ...updates };
  state.lastUpdated = new Date();
  roomStates.set(roomId, state);

  publishCommand(roomId, 'ac', updates);

  res.json({ ac: state.devices.ac });
});

// Lights Controls
app.post('/rooms/:roomId/lights', (req: Request, res) => {
  const { power, brightness, scene } = req.body;
  const roomId = req.params.roomId;

  const state = roomStates.get(roomId);
  if (!state) {
    return res.status(404).json({ error: 'Room not initialized' });
  }

  const updates: any = {};
  if (power !== undefined) updates.power = power;
  if (brightness !== undefined) updates.brightness = brightness;
  if (scene !== undefined) updates.scene = scene;

  state.devices.lights = { ...state.devices.lights, ...updates };
  state.lastUpdated = new Date();
  roomStates.set(roomId, state);

  publishCommand(roomId, 'lights', updates);

  res.json({ lights: state.devices.lights });
});

// TV Controls
app.post('/rooms/:roomId/tv', (req: Request, res) => {
  const { power, channel, volume, input } = req.body;
  const roomId = req.params.roomId;

  const state = roomStates.get(roomId);
  if (!state) {
    return res.status(404).json({ error: 'Room not initialized' });
  }

  const updates: any = {};
  if (power !== undefined) updates.power = power;
  if (channel !== undefined) updates.channel = channel;
  if (volume !== undefined) updates.volume = volume;
  if (input !== undefined) updates.input = input;

  state.devices.tv = { ...state.devices.tv, ...updates };
  state.lastUpdated = new Date();
  roomStates.set(roomId, state);

  publishCommand(roomId, 'tv', updates);

  res.json({ tv: state.devices.tv });
});

// Curtain Controls
app.post('/rooms/:roomId/curtains', (req: Request, res) => {
  const { position } = req.body;
  const roomId = req.params.roomId;

  const state = roomStates.get(roomId);
  if (!state) {
    return res.status(404).json({ error: 'Room not initialized' });
  }

  state.devices.curtains.position = position;
  state.lastUpdated = new Date();
  roomStates.set(roomId, state);

  publishCommand(roomId, 'curtains', { position });

  res.json({ curtains: state.devices.curtains });
});

// Apply scene
app.post('/rooms/:roomId/scenes/:sceneId', (req: Request, res) => {
  const { roomId, sceneId } = req.params;

  const scene = scenes.find(s => s.id === sceneId);
  if (!scene) {
    return res.status(404).json({ error: 'Scene not found' });
  }

  const state = roomStates.get(roomId);
  if (!state) {
    return res.status(404).json({ error: 'Room not initialized' });
  }

  // Apply scene settings
  if (scene.settings.ac) {
    state.devices.ac = { ...state.devices.ac, ...scene.settings.ac };
    publishCommand(roomId, 'ac', scene.settings.ac);
  }
  if (scene.settings.lights) {
    state.devices.lights = { ...state.devices.lights, ...scene.settings.lights };
    publishCommand(roomId, 'lights', scene.settings.lights);
  }
  if (scene.settings.tv) {
    state.devices.tv = { ...state.devices.tv, ...scene.settings.tv };
    publishCommand(roomId, 'tv', scene.settings.tv);
  }
  if (scene.settings.curtains) {
    state.devices.curtains = { ...state.devices.curtains, ...scene.settings.curtains };
    publishCommand(roomId, 'curtains', scene.settings.curtains);
  }

  state.lastUpdated = new Date();
  roomStates.set(roomId, state);

  logger.info('Scene applied', { roomId, sceneId });

  res.json({ success: true, scene, state });
});

// Get available scenes
app.get('/scenes', (req, res) => {
  res.json({ scenes });
});

// Reset room on checkout
app.post('/rooms/:roomId/reset', (req, res) => {
  const roomId = req.params.roomId;
  const { hotelId } = req.body;

  const state = createDefaultRoomState(roomId, hotelId || 4814'default');
  roomStates.set(roomId, state);

  // Send reset commands to all devices
  publishCommand(roomId, 'reset', {});

  logger.info('Room reset', { roomId });

  res.json({ success: true, state });
});

async function init() {
  // Redis (for persistence)
  try {
    redis = createClient({ url: process.env.REDIS_URL || 4814'redis://localhost:6379' });
    redis.on('error', () => {});
    await redis.connect();
  } catch (e) {
    logger.warn('Redis not available');
  }

  // Initialize MQTT
  initMQTT();

  logger.info('Room Controls Service initialized');
}

init().then(() => {
  app.listen(PORT, () => {
    logger.info(`Room Controls Service running on port ${PORT}`);
  });
}).catch((err) => {
  logger.error('Failed to initialize', err);
  process.exit(1);
});

export { app };
