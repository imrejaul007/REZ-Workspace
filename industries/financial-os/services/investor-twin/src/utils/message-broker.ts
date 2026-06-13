import amqp from 'amqplib';
import { logger } from './logger';

class MessageBroker {
  private connection: any = null;
  private channel: any = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 5000;

  /**
   * Connect to RabbitMQ
   */
  async connect(): Promise<void> {
    const url = process.env.RABBITMQ_URI || 'amqp://localhost:5672';

    try {
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();

      // Set up exchange
      await this.channel.assertExchange('investor.events', 'topic', { durable: true });

      // Declare queues
      await this.channel.assertQueue('investor.twin.events', { durable: true });
      await this.channel.assertQueue('investor.portfolio.events', { durable: true });
      await this.channel.assertQueue('investor.trading.events', { durable: true });
      await this.channel.assertQueue('investor.risk.events', { durable: true });

      // Bind queues to exchange
      await this.channel.bindQueue('investor.twin.events', 'investor.events', 'investor.twin.*');
      await this.channel.bindQueue('investor.portfolio.events', 'investor.events', 'investor.portfolio.*');
      await this.channel.bindQueue('investor.trading.events', 'investor.events', 'investor.trading.*');
      await this.channel.bindQueue('investor.risk.events', 'investor.events', 'investor.risk.*');

      // Set up connection error handlers
      this.connection.on('error', (err: Error) => {
        logger.error('RabbitMQ connection error', { error: err.message });
        this.handleReconnect();
      });

      this.connection.on('close', () => {
        logger.warn('RabbitMQ connection closed');
        this.handleReconnect();
      });

      this.reconnectAttempts = 0;
      logger.info('Connected to RabbitMQ', { url });
    } catch (error) {
      logger.error('Failed to connect to RabbitMQ', { error: (error as Error).message });
      this.handleReconnect();
    }
  }

  /**
   * Handle reconnection with exponential backoff
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    logger.info(`Attempting to reconnect to RabbitMQ in ${delay}ms`, {
      attempt: this.reconnectAttempts
    });

    setTimeout(async () => {
      await this.connect();
    }, delay);
  }

  /**
   * Publish message to exchange
   */
  async publish(routingKey: string, message: object): Promise<boolean> {
    if (!this.channel) {
      logger.warn('RabbitMQ channel not available, message not published', { routingKey });
      return false;
    }

    try {
      const messageBuffer = Buffer.from(JSON.stringify(message));
      const published = this.channel.publish('investor.events', routingKey, messageBuffer, {
        persistent: true,
        contentType: 'application/json',
        timestamp: Date.now()
      });

      if (published) {
        logger.debug('Message published', { routingKey });
      } else {
        logger.warn('Message not published, channel buffer full', { routingKey });
      }

      return published;
    } catch (error) {
      logger.error('Failed to publish message', {
        routingKey,
        error: (error as Error).message
      });
      return false;
    }
  }

  /**
   * Subscribe to a queue
   */
  async subscribe(
    queue: string,
    handler: (message: object) => Promise<void>
  ): Promise<void> {
    if (!this.channel) {
      logger.error('RabbitMQ channel not available');
      return;
    }

    await this.channel.consume(queue, async (msg: any) => {
      if (msg) {
        try {
          const content = JSON.parse(msg.content.toString());
          await handler(content);
          this.channel?.ack(msg);
        } catch (error) {
          logger.error('Failed to process message', {
            queue,
            error: (error as Error).message
          });
          this.channel?.nack(msg, false, true);
        }
      }
    });

    logger.info('Subscribed to queue', { queue });
  }

  /**
   * Close connection
   */
  async close(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      logger.info('RabbitMQ connection closed');
    } catch (error) {
      logger.error('Error closing RabbitMQ connection', { error: (error as Error).message });
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connection !== null && this.channel !== null;
  }
}

export const messageBroker = new MessageBroker();
