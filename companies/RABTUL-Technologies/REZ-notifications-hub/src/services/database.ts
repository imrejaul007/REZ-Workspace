import { Pool, PoolClient } from 'pg';
import { config } from '../config';
import logger from '../utils/logger';
import { ServiceUnavailableError } from '../../shared/rez-errors/src/index.js';

class Database {
  private pool: Pool | null = null;
  private isConnected = false;

  async connect(): Promise<void> {
    if (this.isConnected && this.pool) {
      return;
    }

    try {
      this.pool = new Pool({
        connectionString: config.database.url,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      await this.pool.query('SELECT NOW()');
      this.isConnected = true;
      logger.info('Database connected successfully');
    } catch (error) {
      logger.error('Database connection failed', { error });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.isConnected = false;
      logger.info('Database disconnected');
    }
  }

  getPool(): Pool {
    if (!this.pool) {
      throw new ServiceUnavailableError('PostgreSQL', 'Database not connected. Call connect() first.');
    }
    return this.pool;
  }

  async query<T>(
    text: string,
    params?: unknown[]
  ): Promise<{ rows: T[]; rowCount: number }> {
    const pool = this.getPool();
    const start = Date.now();
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    logger.debug('Query executed', {
      text: text.substring(0, 100),
      duration,
      rowCount: result.rowCount,
    });

    return { rows: result.rows as T[], rowCount: result.rowCount ?? 0 };
  }

  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const pool = this.getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async initializeSchema(): Promise<void> {
    const schema = `
      -- Notifications table
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL,
        channel VARCHAR(20) NOT NULL,
        template_id VARCHAR(255) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        priority VARCHAR(20) NOT NULL DEFAULT 'normal',
        variables JSONB NOT NULL DEFAULT '{}',
        rendered_content TEXT,
        metadata JSONB DEFAULT '{}',
        attempts INTEGER DEFAULT 0,
        max_attempts INTEGER DEFAULT 3,
        sent_at TIMESTAMP,
        delivered_at TIMESTAMP,
        read_at TIMESTAMP,
        failed_at TIMESTAMP,
        error_message TEXT,
        idempotency_key VARCHAR(255) UNIQUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Templates table
      CREATE TABLE IF NOT EXISTS templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        channel VARCHAR(20) NOT NULL,
        category VARCHAR(100) NOT NULL,
        content JSONB NOT NULL,
        variables JSONB DEFAULT '[]',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- User preferences table
      CREATE TABLE IF NOT EXISTS user_preferences (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL UNIQUE,
        preferences JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Category preferences table
      CREATE TABLE IF NOT EXISTS category_preferences (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        enabled BOOLEAN DEFAULT true,
        channels JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, category)
      );

      -- Opt-out records table
      CREATE TABLE IF NOT EXISTS opt_outs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL,
        channel VARCHAR(20) NOT NULL,
        reason TEXT,
        opted_out_at TIMESTAMP DEFAULT NOW(),
        source VARCHAR(50) NOT NULL DEFAULT 'user_request'
      );

      -- Global opt-outs table
      CREATE TABLE IF NOT EXISTS global_opt_outs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        opted_out_at TIMESTAMP DEFAULT NOW(),
        reason TEXT
      );

      -- Notification logs for analytics
      CREATE TABLE IF NOT EXISTS notification_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        notification_id UUID REFERENCES notifications(id),
        event VARCHAR(50) NOT NULL,
        channel VARCHAR(20) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Indexes
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
      CREATE INDEX IF NOT EXISTS idx_notifications_channel ON notifications(channel);
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
      CREATE INDEX IF NOT EXISTS idx_templates_channel ON templates(channel);
      CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
      CREATE INDEX IF NOT EXISTS idx_opt_outs_user_channel ON opt_outs(user_id, channel);
      CREATE INDEX IF NOT EXISTS idx_notification_logs_event ON notification_logs(event);
    `;

    await this.query(schema);
    logger.info('Database schema initialized');
  }
}

export const database = new Database();
export default database;
