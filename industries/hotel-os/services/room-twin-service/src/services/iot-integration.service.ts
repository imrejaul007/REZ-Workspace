import mqtt, { MqttClient, IClientOptions } from 'mqtt';
import { EventEmitter } from 'events';
import { logger } from '../utils/logger';
import { IoTEventSchema, IoTEventInput, IoTCommandInput } from '../schemas';
import { RoomTwin, IIoTState } from '../models/types';

export class IoTIntegrationService extends EventEmitter {
  private client: MqttClient | null = null;
  private readonly brokerUrl: string;
  private readonly options: IClientOptions;
  private reconnectAttempts: number = 0;
  private readonly maxReconnectAttempts: number = 10;
  private isConnected: boolean = false;

  constructor() {
    super();
    this.brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
    this.options = {
      username: process.env.MQTT_USERNAME || undefined,
      password: process.env.MQTT_PASSWORD || undefined,
      clientId: `room-twin-service-${process.pid}`,
      reconnectPeriod: 5000,
      keepalive: 60,
      clean: true
    };
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        logger.info('Connecting to MQTT broker...', { broker: this.brokerUrl });

        this.client = mqtt.connect(this.brokerUrl, this.options);

        this.client.on('connect', () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          logger.info('Connected to MQTT broker successfully');

          // Subscribe to room-related topics
          this.subscribeToTopics();

          resolve();
        });

        this.client.on('message', (topic, message) => {
          this.handleMessage(topic, message);
        });

        this.client.on('error', (error) => {
          logger.error('MQTT connection error', { error: error.message });
          if (!this.isConnected) {
            reject(error);
          }
        });

        this.client.on('close', () => {
          this.isConnected = false;
          logger.warn('MQTT connection closed');
        });

        this.client.on('reconnect', () => {
          this.reconnectAttempts++;
          logger.info('Attempting to reconnect to MQTT broker...', {
            attempt: this.reconnectAttempts,
            maxAttempts: this.maxReconnectAttempts
          });

          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            logger.error('Max reconnection attempts reached for MQTT broker');
            this.client?.end();
          }
        });

        this.client.on('offline', () => {
          logger.warn('MQTT client is offline');
        });
      } catch (error) {
        logger.error('Failed to initialize MQTT connection', { error });
        reject(error);
      }
    });
  }

  private subscribeToTopics(): void {
    if (!this.client) return;

    const topics = [
      'hotel/rooms/+/iot/#',     // All IoT events from all rooms
      'hotel/rooms/+/status',    // Room status changes
      'hotel/rooms/+/alerts',     // Room alerts
      'hotel/devices/+/heartbeat' // Device heartbeats
    ];

    topics.forEach((topic) => {
      this.client?.subscribe(topic, (err) => {
        if (err) {
          logger.error(`Failed to subscribe to topic: ${topic}`, { error: err.message });
        } else {
          logger.info(`Subscribed to topic: ${topic}`);
        }
      });
    });
  }

  private async handleMessage(topic: string, payload: Buffer): Promise<void> {
    try {
      const messageStr = payload.toString();
      const message = JSON.parse(messageStr);
      const topicParts = topic.split('/');

      logger.debug('Received MQTT message', { topic, message });

      // Parse and validate the event
      const eventData = IoTEventSchema.safeParse({
        ...message,
        timestamp: new Date(message.timestamp)
      });

      if (!eventData.success) {
        logger.warn('Invalid IoT event format', { errors: eventData.error.errors });
        return;
      }

      const event = eventData.data;

      // Emit the event for processing
      this.emit('iot-event', event);

      // Handle specific event types
      switch (event.eventType) {
        case 'state_change':
          await this.handleStateChange(event);
          break;
        case 'heartbeat':
          await this.handleHeartbeat(event);
          break;
        case 'alert':
          await this.handleAlert(event);
          break;
        case 'command_ack':
          await this.handleCommandAck(event);
          break;
      }

      // Emit topic-specific events
      if (topicParts.length >= 4 && topicParts[2] === 'rooms') {
        const roomId = topicParts[3];
        this.emit(`room:${roomId}`, event);
      }
    } catch (error) {
      logger.error('Error processing MQTT message', {
        topic,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async handleStateChange(event: IoTEventInput): Promise<void> {
    try {
      const { roomId, payload } = event;

      // Update room IoT state in database
      const updateData: Partial<IIoTState> = {};

      if (payload.temperature !== undefined) updateData.temperature = payload.temperature as number;
      if (payload.humidity !== undefined) updateData.humidity = payload.humidity as number;
      if (payload.lighting !== undefined) updateData.lighting = payload.lighting as IIoTState['lighting'];
      if (payload.climate !== undefined) updateData.climate = payload.climate as IIoTState['climate'];
      if (payload.blinds !== undefined) updateData.blinds = payload.blinds as IIoTState['blinds'];
      if (payload.doorLock !== undefined) updateData.doorLock = payload.doorLock as boolean;
      if (payload.occupancy !== undefined) updateData.occupancy = payload.occupancy as IIoTState['occupancy'];
      if (payload.tv !== undefined) updateData.tv = payload.tv as IIoTState['tv'];
      if (payload.energy !== undefined) updateData.energy = payload.energy as IIoTState['energy'];

      updateData.timestamp = new Date();

      await RoomTwin.findOneAndUpdate(
        { roomId },
        {
          $set: {
            'iot.state': updateData,
            'iot.lastSync': new Date()
          }
        }
      );

      logger.debug('Room IoT state updated', { roomId, updateData });
      this.emit('room-state-update', { roomId, state: updateData });
    } catch (error) {
      logger.error('Error handling state change', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async handleHeartbeat(event: IoTEventInput): Promise<void> {
    try {
      const { payload, roomId } = event;
      const deviceId = payload.deviceId as string;

      await RoomTwin.findOneAndUpdate(
        { roomId, 'iot.devices.deviceId': deviceId },
        {
          $set: {
            'iot.devices.$.lastHeartbeat': new Date(),
            'iot.devices.$.status': 'online'
          }
        }
      );

      logger.debug('Device heartbeat received', { roomId, deviceId });
      this.emit('device-heartbeat', { roomId, deviceId });
    } catch (error) {
      logger.error('Error handling heartbeat', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async handleAlert(event: IoTEventInput): Promise<void> {
    try {
      const { roomId, payload } = event;
      const alertType = payload.type as string;
      const severity = payload.severity as 'low' | 'medium' | 'high' | 'critical';

      // Add maintenance issue for high/critical alerts
      if (severity === 'high' || severity === 'critical') {
        await RoomTwin.findOneAndUpdate(
          { roomId },
          {
            $push: {
              'maintenance.issues': {
                reportedAt: new Date(),
                description: `${alertType}: ${payload.message || 'No description'}`,
                severity,
                resolved: false
              }
            }
          }
        );
      }

      logger.warn('Room alert received', { roomId, alertType, severity });
      this.emit('room-alert', { roomId, alertType, severity, payload });
    } catch (error) {
      logger.error('Error handling alert', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async handleCommandAck(event: IoTEventInput): Promise<void> {
    try {
      const { payload, roomId } = event;
      const commandId = payload.commandId as string;
      const status = payload.status as 'success' | 'failed';

      logger.debug('Command acknowledgment received', { roomId, commandId, status });
      this.emit('command-ack', { roomId, commandId, status, payload });
    } catch (error) {
      logger.error('Error handling command ack', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async sendCommand(command: IoTCommandInput): Promise<string> {
    if (!this.client || !this.isConnected) {
      throw new Error('MQTT client is not connected');
    }

    const commandId = `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const topic = `hotel/rooms/${command.roomId}/commands`;

    const message = {
      commandId,
      command: command.command,
      parameters: command.parameters,
      timestamp: new Date().toISOString()
    };

    this.client.publish(topic, JSON.stringify(message), { qos: 1 });

    logger.info('IoT command sent', { roomId: command.roomId, commandId, command: command.command });

    return commandId;
  }

  async publishRoomStatus(roomId: string, status: Record<string, unknown>): Promise<void> {
    if (!this.client || !this.isConnected) {
      throw new Error('MQTT client is not connected');
    }

    const topic = `hotel/rooms/${roomId}/status`;
    this.client.publish(topic, JSON.stringify(status), { qos: 1 });
    logger.debug('Room status published', { roomId });
  }

  async publishRoomEvent(roomId: string, eventType: string, data: Record<string, unknown>): Promise<void> {
    if (!this.client || !this.isConnected) {
      throw new Error('MQTT client is not connected');
    }

    const topic = `hotel/rooms/${roomId}/events`;
    const message = {
      eventType,
      data,
      timestamp: new Date().toISOString()
    };

    this.client.publish(topic, JSON.stringify(message), { qos: 1 });
    logger.debug('Room event published', { roomId, eventType });
  }

  disconnect(): void {
    if (this.client) {
      this.client.end();
      this.isConnected = false;
      logger.info('MQTT client disconnected');
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

// Singleton instance
export const iotService = new IoTIntegrationService();
