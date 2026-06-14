import { v4 as uuidv4 } from 'uuid';
import { CheckoutSession } from '../models/CheckoutSession';

const EXIT_CODE_LENGTH = parseInt(process.env.EXIT_CODE_LENGTH || '6', 10);

export interface ExitValidationResult {
  valid: boolean;
  sessionId?: string;
  storeId?: string;
  transactionId?: string;
  amount?: number;
  itemCount?: number;
  message: string;
}

export interface ExitRecord {
  exitCode: string;
  sessionId: string;
  storeId: string;
  deviceId: string;
  transactionId: string;
  validatedAt: Date;
  validatedBy: 'system' | 'guard';
}

// In-memory store for exit records (in production, use Redis or database)
const exitRecords: Map<string, ExitRecord> = new Map();

export class ExitService {
  /**
   * Generate a unique exit code for a completed session
   */
  async generateExitCode(sessionId: string): Promise<string> {
    const session = await CheckoutSession.findOne({ sessionId, status: 'completed' });

    if (!session) {
      throw new Error('Completed session not found');
    }

    if (session.exitCode) {
      // Return existing exit code if already generated
      return session.exitCode;
    }

    // Generate a unique exit code
    const exitCode = this.generateSecureCode();
    session.exitCode = exitCode;
    await session.save();

    return exitCode;
  }

  /**
   * Validate an exit code at the exit gate
   */
  async validateExit(exitCode: string): Promise<ExitValidationResult> {
    if (!exitCode || exitCode.trim().length === 0) {
      return {
        valid: false,
        message: 'Exit code is required',
      };
    }

    const cleanCode = exitCode.trim().toUpperCase();

    if (!this.validateCodeFormat(cleanCode)) {
      return {
        valid: false,
        message: 'Invalid exit code format',
      };
    }

    const session = await CheckoutSession.findOne({
      exitCode: cleanCode,
      status: 'completed',
    });

    if (!session) {
      return {
        valid: false,
        message: 'Invalid or already used exit code',
      };
    }

    if (session.exitValidatedAt) {
      return {
        valid: false,
        sessionId: session.sessionId,
        storeId: session.storeId,
        message: 'Exit code has already been validated',
      };
    }

    return {
      valid: true,
      sessionId: session.sessionId,
      storeId: session.storeId,
      transactionId: session.transactionId,
      amount: session.total,
      itemCount: session.items.length,
      message: 'Exit code validated successfully',
    };
  }

  /**
   * Record an exit validation event
   */
  async recordExit(
    exitCode: string,
    validatedBy: 'system' | 'guard' = 'system'
  ): Promise<ExitRecord | null> {
    const validationResult = await this.validateExit(exitCode);

    if (!validationResult.valid) {
      return null;
    }

    // Update session with validation timestamp
    await CheckoutSession.updateOne(
      { exitCode: exitCode.toUpperCase() },
      { exitValidatedAt: new Date() }
    );

    const session = await CheckoutSession.findOne({ exitCode: exitCode.toUpperCase() });

    if (!session) {
      return null;
    }

    const exitRecord: ExitRecord = {
      exitCode: exitCode.toUpperCase(),
      sessionId: session.sessionId,
      storeId: session.storeId,
      deviceId: session.deviceId,
      transactionId: session.transactionId || uuidv4(),
      validatedAt: new Date(),
      validatedBy,
    };

    // Store in memory (in production, persist to database)
    exitRecords.set(exitCode.toUpperCase(), exitRecord);

    return exitRecord;
  }

  /**
   * Get exit history for a store
   */
  async getExitHistory(
    storeId: string,
    limit: number = 50
  ): Promise<ExitRecord[]> {
    const records: ExitRecord[] = [];

    exitRecords.forEach((record) => {
      if (record.storeId === storeId) {
        records.push(record);
      }
    });

    return records
      .sort((a, b) => b.validatedAt.getTime() - a.validatedAt.getTime())
      .slice(0, limit);
  }

  /**
   * Get exit record by code
   */
  async getExitRecord(exitCode: string): Promise<ExitRecord | null> {
    return exitRecords.get(exitCode.toUpperCase()) || null;
  }

  /**
   * Generate a secure random exit code
   */
  private generateSecureCode(): string {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars (0, O, 1, I)
    let code = '';

    for (let i = 0; i < EXIT_CODE_LENGTH; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      code += characters[randomIndex];
    }

    return code;
  }

  /**
   * Validate exit code format
   */
  private validateCodeFormat(code: string): boolean {
    if (code.length !== EXIT_CODE_LENGTH) {
      return false;
    }

    // Code should only contain alphanumeric characters
    const alphanumericPattern = /^[A-Z0-9]+$/;
    return alphanumericPattern.test(code);
  }

  /**
   * Generate a QR code payload for exit (for future mobile integration)
   */
  generateQRPayload(exitCode: string): string {
    const payload = {
      type: 'SELF_CHECKOUT_EXIT',
      code: exitCode,
      timestamp: Date.now(),
    };

    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  /**
   * Parse QR code payload
   */
  parseQRPayload(payload: string): { code: string; timestamp: number } | null {
    try {
      const decoded = Buffer.from(payload, 'base64').toString('utf-8');
      const data = JSON.parse(decoded);

      if (data.type !== 'SELF_CHECKOUT_EXIT' || !data.code) {
        return null;
      }

      return {
        code: data.code,
        timestamp: data.timestamp,
      };
    } catch {
      return null;
    }
  }

  /**
   * Check if exit code is expired (codes expire after 24 hours)
   */
  async isExitCodeExpired(exitCode: string): Promise<boolean> {
    const session = await CheckoutSession.findOne({
      exitCode: exitCode.toUpperCase(),
      status: 'completed',
    });

    if (!session || !session.completedAt) {
      return true;
    }

    const EXPIRY_HOURS = 24;
    const expiryTime = new Date(session.completedAt.getTime() + EXPIRY_HOURS * 60 * 60 * 1000);
    return new Date() > expiryTime;
  }

  /**
   * Resend exit code (regenerate if expired)
   */
  async resendExitCode(sessionId: string): Promise<string> {
    const session = await CheckoutSession.findOne({ sessionId, status: 'completed' });

    if (!session) {
      throw new Error('Completed session not found');
    }

    if (session.exitValidatedAt) {
      throw new Error('Exit already validated, cannot resend');
    }

    const isExpired = await this.isExitCodeExpired(session.exitCode || '');

    if (isExpired && session.exitCode) {
      // Generate new exit code if expired
      session.exitCode = this.generateSecureCode();
      await session.save();
    }

    return session.exitCode!;
  }
}

export const exitService = new ExitService();
