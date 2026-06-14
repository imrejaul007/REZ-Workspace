import { v4 as uuidv4 } from 'uuid';
import { CheckoutSession, ICheckoutSession, ICheckoutItem } from '../models/CheckoutSession';

const SESSION_EXPIRY_MINUTES = parseInt(process.env.SESSION_EXPIRY_MINUTES || '30', 10);
const MAX_ITEMS_PER_SESSION = parseInt(process.env.MAX_ITEMS_PER_SESSION || '100', 10);

export interface CreateSessionParams {
  storeId: string;
  deviceId: string;
  customerId?: string;
}

export interface AddItemParams {
  sessionId: string;
  productId: string;
  sku: string;
  name: string;
  barcode: string;
  quantity: number;
  unitPrice: number;
}

export interface UpdateQuantityParams {
  sessionId: string;
  productId: string;
  quantity: number;
}

export interface RemoveItemParams {
  sessionId: string;
  productId: string;
}

export class SessionService {
  /**
   * Create a new checkout session
   */
  async createSession(params: CreateSessionParams): Promise<ICheckoutSession> {
    const { storeId, deviceId, customerId } = params;
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + SESSION_EXPIRY_MINUTES * 60 * 1000);

    const session = new CheckoutSession({
      storeId,
      deviceId,
      sessionId,
      customerId,
      status: 'active',
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0,
      paymentStatus: 'pending',
      startedAt: new Date(),
      expiresAt,
    });

    await session.save();
    return session;
  }

  /**
   * Add an item to the session
   */
  async addItem(params: AddItemParams): Promise<ICheckoutSession> {
    const { sessionId, productId, sku, name, barcode, quantity, unitPrice } = params;

    const session = await CheckoutSession.findOne({ sessionId, status: 'active' });

    if (!session) {
      throw new Error('Active session not found');
    }

    if (session.expiresAt < new Date()) {
      throw new Error('Session has expired');
    }

    if (session.items.length >= MAX_ITEMS_PER_SESSION) {
      throw new Error(`Maximum ${MAX_ITEMS_PER_SESSION} items per session exceeded`);
    }

    // Check if item already exists in the session
    const existingItemIndex = session.items.findIndex(
      (item) => item.productId === productId || item.barcode === barcode
    );

    if (existingItemIndex !== -1) {
      // Update quantity of existing item
      session.items[existingItemIndex].quantity += quantity;
      session.items[existingItemIndex].total =
        session.items[existingItemIndex].quantity * session.items[existingItemIndex].unitPrice;
    } else {
      // Add new item
      const newItem: ICheckoutItem = {
        productId,
        sku,
        name,
        barcode,
        quantity,
        unitPrice,
        total: quantity * unitPrice,
        scannedAt: new Date(),
      };
      session.items.push(newItem);
    }

    // Recalculate totals
    this.recalculateTotals(session);

    await session.save();
    return session;
  }

  /**
   * Remove an item from the session
   */
  async removeItem(params: RemoveItemParams): Promise<ICheckoutSession> {
    const { sessionId, productId } = params;

    const session = await CheckoutSession.findOne({ sessionId, status: 'active' });

    if (!session) {
      throw new Error('Active session not found');
    }

    const itemIndex = session.items.findIndex((item) => item.productId === productId);

    if (itemIndex === -1) {
      throw new Error('Item not found in session');
    }

    session.items.splice(itemIndex, 1);

    // Recalculate totals
    this.recalculateTotals(session);

    await session.save();
    return session;
  }

  /**
   * Update the quantity of an item in the session
   */
  async updateQuantity(params: UpdateQuantityParams): Promise<ICheckoutSession> {
    const { sessionId, productId, quantity } = params;

    if (quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    const session = await CheckoutSession.findOne({ sessionId, status: 'active' });

    if (!session) {
      throw new Error('Active session not found');
    }

    const itemIndex = session.items.findIndex((item) => item.productId === productId);

    if (itemIndex === -1) {
      throw new Error('Item not found in session');
    }

    session.items[itemIndex].quantity = quantity;
    session.items[itemIndex].total = quantity * session.items[itemIndex].unitPrice;

    // Recalculate totals
    this.recalculateTotals(session);

    await session.save();
    return session;
  }

  /**
   * Get a session by ID
   */
  async getSession(sessionId: string): Promise<ICheckoutSession | null> {
    return CheckoutSession.findOne({ sessionId });
  }

  /**
   * Get a session by ID, throwing if not found or expired
   */
  async getActiveSession(sessionId: string): Promise<ICheckoutSession> {
    const session = await CheckoutSession.findOne({ sessionId, status: 'active' });

    if (!session) {
      throw new Error('Active session not found');
    }

    if (session.expiresAt < new Date()) {
      session.status = 'expired';
      await session.save();
      throw new Error('Session has expired');
    }

    return session;
  }

  /**
   * Complete a session (after successful payment)
   */
  async completeSession(
    sessionId: string,
    paymentDetails: { paymentMethod: string; transactionId: string }
  ): Promise<ICheckoutSession> {
    const session = await this.getActiveSession(sessionId);

    if (session.items.length === 0) {
      throw new Error('Cannot complete empty session');
    }

    session.status = 'completed';
    session.paymentStatus = 'paid';
    session.paymentMethod = paymentDetails.paymentMethod;
    session.transactionId = paymentDetails.transactionId;
    session.completedAt = new Date();

    await session.save();
    return session;
  }

  /**
   * Cancel a session
   */
  async cancelSession(sessionId: string): Promise<ICheckoutSession> {
    const session = await CheckoutSession.findOne({ sessionId });

    if (!session) {
      throw new Error('Session not found');
    }

    if (session.status !== 'active') {
      throw new Error(`Cannot cancel session with status: ${session.status}`);
    }

    session.status = 'cancelled';
    await session.save();

    return session;
  }

  /**
   * Expire old active sessions (called periodically)
   */
  async expireSessions(): Promise<number> {
    const result = await CheckoutSession.updateMany(
      {
        status: 'active',
        expiresAt: { $lt: new Date() },
      },
      {
        $set: { status: 'expired' },
      }
    );

    return result.modifiedCount;
  }

  /**
   * Recalculate subtotal, tax, and total for a session
   * Assumes a tax rate of 18% (GST)
   */
  private recalculateTotals(session: ICheckoutSession): void {
    const TAX_RATE = 0.18;

    session.subtotal = session.items.reduce((sum, item) => sum + item.total, 0);
    session.tax = Math.round(session.subtotal * TAX_RATE * 100) / 100;
    session.total = session.subtotal + session.tax;
  }

  /**
   * Get active sessions for a device
   */
  async getActiveSessionsForDevice(storeId: string, deviceId: string): Promise<ICheckoutSession[]> {
    return CheckoutSession.find({
      storeId,
      deviceId,
      status: 'active',
      expiresAt: { $gt: new Date() },
    }).sort({ startedAt: -1 });
  }

  /**
   * Get session by exit code
   */
  async getSessionByExitCode(exitCode: string): Promise<ICheckoutSession | null> {
    return CheckoutSession.findOne({
      exitCode,
      status: 'completed',
    });
  }
}

export const sessionService = new SessionService();
