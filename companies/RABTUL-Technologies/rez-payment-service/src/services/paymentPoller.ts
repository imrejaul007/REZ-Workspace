import axios, { AxiosError } from 'axios';
import { EventEmitter } from 'events';
import { IWalletService } from './walletService';
import { PaymentStatus, PaymentRecord } from '../types/payment';
import { logger } from '@rez/shared';

const RAZORPAY_API = 'https://api.razorpay.com/v1';
const POLL_INTERVAL = 30000; // 30 seconds
const MAX_POLLS = 10;
const POLL_JITTER_MS = 5000; // Add randomness to prevent thundering herd

export interface PollerConfig {
  pollInterval?: number;
  maxPolls?: number;
  pollJitter?: number;
}

export interface PollingResult {
  success: boolean;
  finalStatus: PaymentStatus | null;
  pollCount: number;
  error?: string;
}

export interface PaymentPollerEvents {
  'payment:success': (paymentId: string, data: { orderId: string; amount: number }) => void;
  'payment:failed': (paymentId: string, data: { orderId: string; reason?: string }) => void;
  'payment:timeout': (paymentId: string, data: { orderId: string; pollCount: number }) => void;
  'poll:attempt': (paymentId: string, data: { attempt: number; status: PaymentStatus }) => void;
  'poll:error': (paymentId: string, data: { attempt: number; error: string }) => void;
}

export class PaymentPoller extends EventEmitter {
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private pollCounts: Map<string, number> = new Map();
  private pollTimestamps: Map<string, number[]> = new Map();
  private isShuttingDown = false;

  private readonly pollInterval: number;
  private readonly maxPolls: number;
  private readonly pollJitter: number;
  private readonly walletService: IWalletService;
  private readonly axiosInstance;

  constructor(walletService: IWalletService, config: PollerConfig = {}) {
    super();
    this.pollInterval = config.pollInterval ?? POLL_INTERVAL;
    this.maxPolls = config.maxPolls ?? MAX_POLLS;
    this.pollJitter = config.pollJitter ?? POLL_JITTER_MS;
    this.walletService = walletService;

    this.axiosInstance = axios.create({
      baseURL: RAZORPAY_API,
      timeout: 10000,
      retries: 2,
    });
  }

  async startPolling(
    paymentId: string,
    razorpayOrderId: string,
    amount: number,
    userId: string
  ): Promise<void> {
    if (this.intervals.has(paymentId)) {
      logger.warn(`Polling already active for payment ${paymentId}, skipping duplicate start`);
      return;
    }

    if (this.isShuttingDown) {
      throw new Error('PaymentPoller is shutting down, cannot start new polling');
    }

    logger.info(`Starting payment polling for ${paymentId} (order: ${razorpayOrderId})`);

    this.pollCounts.set(paymentId, 0);
    this.pollTimestamps.set(paymentId, []);
    const initialDelay = this.calculateJitter();

    const timeout = setTimeout(() => {
      this.pollLoop(paymentId, razorpayOrderId, amount, userId);
    }, initialDelay);

    this.intervals.set(paymentId, timeout);
  }

  private async pollLoop(
    paymentId: string,
    razorpayOrderId: string,
    amount: number,
    userId: string
  ): Promise<void> {
    if (this.isShuttingDown || !this.intervals.has(paymentId)) {
      return;
    }

    const currentPoll = (this.pollCounts.get(paymentId) ?? 0) + 1;
    this.pollCounts.set(paymentId, currentPoll);

    const timestamps = this.pollTimestamps.get(paymentId) ?? [];
    timestamps.push(Date.now());
    this.pollTimestamps.set(paymentId, timestamps);

    try {
      logger.debug(`Polling attempt ${currentPoll}/${this.maxPolls} for ${paymentId}`);

      const status = await this.checkPaymentStatus(razorpayOrderId);

      this.emit('poll:attempt', paymentId, { attempt: currentPoll, status });

      const terminalStatus = this.getTerminalStatus(status);

      if (terminalStatus === 'captured') {
        logger.info(`Payment ${paymentId} captured successfully`);
        await this.handleSuccess(paymentId, razorpayOrderId, amount, userId);
        this.cleanup(paymentId);
        this.emit('payment:success', paymentId, { orderId: razorpayOrderId, amount });
        return;
      }

      if (terminalStatus === 'failed') {
        logger.warn(`Payment ${paymentId} failed`);
        await this.handleFailure(paymentId, razorpayOrderId);
        this.cleanup(paymentId);
        this.emit('payment:failed', paymentId, { orderId: razorpayOrderId });
        return;
      }

      if (currentPoll >= this.maxPolls) {
        logger.warn(`Payment ${paymentId} polling timed out after ${this.maxPolls} attempts`);
        await this.handleTimeout(paymentId, razorpayOrderId, currentPoll);
        this.cleanup(paymentId);
        this.emit('payment:timeout', paymentId, { orderId: razorpayOrderId, pollCount: currentPoll });
        return;
      }

      // Schedule next poll
      const interval = setTimeout(
        () => this.pollLoop(paymentId, razorpayOrderId, amount, userId),
        this.pollInterval + this.calculateJitter()
      );
      this.intervals.set(paymentId, interval);

    } catch (error) {
      const errorMessage = this.formatError(error);
      logger.error(`Polling error for ${paymentId}: ${errorMessage}`);

      this.emit('poll:error', paymentId, { attempt: currentPoll, error: errorMessage });

      // Retry on transient errors (network, timeout, 5xx)
      if (this.isTransientError(error) && currentPoll < this.maxPolls) {
        const backoff = this.calculateBackoff(currentPoll);
        logger.info(`Retrying after ${backoff}ms`);

        const interval = setTimeout(
          () => this.pollLoop(paymentId, razorpayOrderId, amount, userId),
          backoff
        );
        this.intervals.set(paymentId, interval);
      } else {
        await this.handlePollingError(paymentId, razorpayOrderId, error);
        this.cleanup(paymentId);
      }
    }
  }

  private async checkPaymentStatus(orderId: string): Promise<string> {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      throw new Error('Razorpay credentials not configured');
    }

    try {
      const response = await this.axiosInstance.get(`/orders/${orderId}`, {
        auth: {
          username: keyId,
          password: keySecret,
        },
        validateStatus: (status) => status < 500,
      });

      if (response.status === 404) {
        throw new Error(`Order ${orderId} not found`);
      }

      if (response.status === 401) {
        throw new Error('Invalid Razorpay credentials');
      }

      if (response.status !== 200) {
        throw new Error(`Razorpay API returned status ${response.status}`);
      }

      const data = response.data;

      if (!data || typeof data.status !== 'string') {
        throw new Error('Invalid response format from Razorpay');
      }

      return data.status;

    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new Error('Razorpay API timeout');
        }
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
          throw new Error('Razorpay API unreachable');
        }
      }
      throw error;
    }
  }

  private getTerminalStatus(status: string): PaymentStatus | 'pending' {
    switch (status) {
      case 'captured':
      case 'paid':
        return 'captured';
      case 'failed':
      case 'expired':
        return 'failed';
      case 'refunded':
      case 'partially_refunded':
        return 'failed';
      default:
        return 'pending';
    }
  }

  private async handleSuccess(
    paymentId: string,
    razorpayOrderId: string,
    amount: number,
    userId: string
  ): Promise<void> {
    try {
      await this.creditWallet(paymentId, razorpayOrderId, amount, userId);
      logger.info(`Wallet credited for payment ${paymentId}, amount: ${amount}`);
    } catch (error) {
      logger.error(`Failed to credit wallet for ${paymentId}: ${this.formatError(error)}`);
      throw error;
    }
  }

  private async creditWallet(
    paymentId: string,
    razorpayOrderId: string,
    amount: number,
    userId: string
  ): Promise<void> {
    const coins = this.calculateCoins(amount);

    await this.walletService.creditCoins({
      userId,
      amount: coins,
      paymentId,
      razorpayOrderId,
      source: 'payment',
      description: `Payment for order ${razorpayOrderId}`,
    });
  }

  private calculateCoins(amountPaise: number): number {
    // 100 paise = 1 INR, 1 INR = 1 coin (adjust conversion rate as needed)
    const amountInr = amountPaise / 100;
    const coinConversionRate = parseFloat(process.env.COIN_CONVERSION_RATE ?? '1');
    return Math.floor(amountInr * coinConversionRate);
  }

  private async handleFailure(paymentId: string, razorpayOrderId: string): Promise<void> {
    logger.warn(`Marking payment ${paymentId} as failed`);
    // Update payment status in database
    await this.updatePaymentStatus(paymentId, 'failed', razorpayOrderId);
  }

  private async handleTimeout(
    paymentId: string,
    razorpayOrderId: string,
    pollCount: number
  ): Promise<void> {
    logger.warn(`Payment ${paymentId} timed out after ${pollCount} polls`);
    await this.updatePaymentStatus(paymentId, 'timeout', razorpayOrderId);
  }

  private async handlePollingError(
    paymentId: string,
    razorpayOrderId: string,
    error: unknown
  ): Promise<void> {
    const errorMessage = this.formatError(error);
    logger.error(`Critical polling error for ${paymentId}: ${errorMessage}`);
    await this.updatePaymentStatus(paymentId, 'error', razorpayOrderId, errorMessage);
  }

  private async updatePaymentStatus(
    paymentId: string,
    status: PaymentStatus,
    razorpayOrderId: string,
    errorMessage?: string
  ): Promise<void> {
    // This should be implemented to update the payment record in the database
    // The actual implementation depends on your data access layer
    logger.info(`Updating payment ${paymentId} status to ${status}`);
  }

  private stopPolling(paymentId: string): void {
    const interval = this.intervals.get(paymentId);
    if (interval) {
      clearTimeout(interval);
      this.intervals.delete(paymentId);
    }
  }

  private cleanup(paymentId: string): void {
    this.stopPolling(paymentId);
    this.pollCounts.delete(paymentId);
    this.pollTimestamps.delete(paymentId);
  }

  private calculateJitter(): number {
    // STATISTICAL: network jitter for polling, not security critical
    return Math.floor(Math.random() * this.pollJitter);
  }

  private calculateBackoff(attempt: number): number {
    // Exponential backoff with jitter - STATISTICAL: network retry timing, not security critical
    const baseDelay = 1000;
    const maxDelay = this.pollInterval;
    const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
    return exponentialDelay + Math.floor(Math.random() * 1000);
  }

  private isTransientError(error: unknown): boolean {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      // Network errors
      if (
        axiosError.code === 'ECONNABORTED' ||
        axiosError.code === 'ENOTFOUND' ||
        axiosError.code === 'ECONNREFUSED' ||
        axiosError.code === 'ETIMEDOUT'
      ) {
        return true;
      }
      // Server errors (5xx)
      if (axiosError.response?.status && axiosError.response.status >= 500) {
        return true;
      }
    }
    return false;
  }

  private formatError(error: unknown): string {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.data) {
        return JSON.stringify(axiosError.response.data);
      }
      return axiosError.message;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }

  async stopAll(): Promise<void> {
    this.isShuttingDown = true;
    logger.info('Stopping all payment polling');

    const paymentIds = Array.from(this.intervals.keys());
    for (const paymentId of paymentIds) {
      this.cleanup(paymentId);
    }

    logger.info(`Stopped ${paymentIds.length} active polling sessions`);
  }

  getActivePollingCount(): number {
    return this.intervals.size;
  }

  isPolling(paymentId: string): boolean {
    return this.intervals.has(paymentId);
  }

  getPollingStats(paymentId: string): { pollCount: number; timestamps: number[] } | null {
    if (!this.pollCounts.has(paymentId)) {
      return null;
    }
    return {
      pollCount: this.pollCounts.get(paymentId)!,
      timestamps: this.pollTimestamps.get(paymentId) ?? [],
    };
  }

  async pollOnce(paymentId: string, razorpayOrderId: string): Promise<PollingResult> {
    try {
      const status = await this.checkPaymentStatus(razorpayOrderId);
      const pollCount = (this.pollCounts.get(paymentId) ?? 0) + 1;
      const terminalStatus = this.getTerminalStatus(status);

      return {
        success: terminalStatus !== 'pending',
        finalStatus: terminalStatus === 'pending' ? null : terminalStatus,
        pollCount,
      };
    } catch (error) {
      return {
        success: false,
        finalStatus: null,
        pollCount: this.pollCounts.get(paymentId) ?? 0,
        error: this.formatError(error),
      };
    }
  }
}

// Singleton instance for easy access
let pollerInstance: PaymentPoller | null = null;

export function getPaymentPoller(walletService: IWalletService): PaymentPoller {
  if (!pollerInstance) {
    pollerInstance = new PaymentPoller(walletService);
  }
  return pollerInstance;
}

export function resetPaymentPoller(): void {
  if (pollerInstance) {
    pollerInstance.stopAll();
    pollerInstance.removeAllListeners();
    pollerInstance = null;
  }
}

export { PaymentStatus };
