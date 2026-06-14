import { EventEmitter } from 'events';
import { PlaceEvent } from '../types/index.js';

export class EventBusService extends EventEmitter {
  private static instance: EventBusService;

  private constructor() {
    super();
    this.setMaxListeners(100);
  }

  public static getInstance(): EventBusService {
    if (!EventBusService.instance) {
      EventBusService.instance = new EventBusService();
    }
    return EventBusService.instance;
  }

  /**
   * Publish an event
   */
  publish(eventType: string, data: Record<string, unknown>): void {
    const event: PlaceEvent = {
      type: eventType as PlaceEvent['type'],
      placeId: data.placeId as string,
      data: data.data as Partial<PlaceEvent['data']>,
      timestamp: new Date(),
    };

    this.emit(eventType, event);
    this.emit('*', event);

    // Log event for debugging
    if (process.env.NODE_ENV !== 'production') {
      logger.info(`[EventBus] Published: ${eventType}`, {
        placeId: event.placeId,
        timestamp: event.timestamp,
      });
    }
  }

  /**
   * Subscribe to an event
   */
  subscribe(eventType: string, handler: (event: PlaceEvent) => void): void {
    this.on(eventType, handler);
  }

  /**
   * Unsubscribe from an event
   */
  unsubscribe(eventType: string, handler: (event: PlaceEvent) => void): void {
    this.off(eventType, handler);
  }

  /**
   * Subscribe once
   */
  once(eventType: string, handler: (event: PlaceEvent) => void): void {
    this.once(eventType, handler);
  }

  /**
   * Get all event types
   */
  getEventTypes(): string[] {
    return ['place_created', 'place_updated', 'place_deleted'];
  }
}

export const eventBus = EventBusService.getInstance();
export default eventBus;
