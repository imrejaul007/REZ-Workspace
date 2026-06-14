/**
 * REZ Table QR Service - Production Version with MongoDB
 */

import QRCode from 'qrcode';
import { randomUUID } from 'crypto';
import { TableQRModel, connectDatabase } from './database.js';
import {
  CreateTableQR,
  TableQR,
  QRVerificationResult,
  TableQRListItem,
} from './types.js';

const MENU_BASE_URL = process.env.MENU_BASE_URL || 'https://menu.rez.money';

export class TableQRService {
  private dbReady = false;

  async ensureDb(): Promise<void> {
    if (!this.dbReady) {
      await connectDatabase();
      this.dbReady = true;
    }
  }

  /**
   * Generate a unique QR code for a table
   */
  async generateTableQR(data: CreateTableQR): Promise<TableQR> {
    await this.ensureDb();

    const { restaurantId, restaurantSlug, tableNumber, tableName, capacity } = data;

    // Check if QR already exists
    const existing = await TableQRModel.findOne({ restaurantId, tableNumber });
    if (existing) {
      return this.docToTableQR(existing);
    }

    // Generate unique QR ID
    const qrId = randomUUID();

    // Create menu URL
    const menuUrl = `${MENU_BASE_URL}/${restaurantSlug}?table=${tableNumber}`;

    // QR payload
    const qrPayload = JSON.stringify({
      v: 1,
      id: qrId,
      r: restaurantId,
      s: restaurantSlug,
      t: tableNumber,
    });

    // Generate QR code
    const qrCodeDataUrl = await QRCode.toDataURL(qrPayload, {
      width: 400,
      margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' },
      errorCorrectionLevel: 'H',
    });

    // Save to MongoDB
    const doc = await TableQRModel.create({
      id: qrId,
      restaurantId,
      restaurantSlug,
      tableNumber,
      tableName,
      capacity,
      menuUrl,
      qrCodeDataUrl,
    });

    return this.docToTableQR(doc);
  }

  /**
   * Generate QR codes for all tables of a restaurant
   */
  async generateRestaurantQRCodes(
    restaurantId: string,
    restaurantSlug: string,
    tables: Array<{ tableNumber: string; tableName?: string; capacity?: number }>
  ): Promise<TableQR[]> {
    const results: TableQR[] = [];

    for (const table of tables) {
      const qr = await this.generateTableQR({
        restaurantId,
        restaurantSlug,
        tableNumber: table.tableNumber,
        tableName: table.tableName,
        capacity: table.capacity,
      });
      results.push(qr);
    }

    return results;
  }

  /**
   * Verify and decode a scanned QR code
   */
  async verifyQR(qrData: string): Promise<QRVerificationResult> {
    await this.ensureDb();

    try {
      const payload = JSON.parse(qrData);

      if (!payload.v || payload.v !== 1) {
        return { valid: false, error: 'Invalid QR format' };
      }

      if (!payload.id || !payload.r || !payload.s || !payload.t) {
        return { valid: false, error: 'Missing required QR fields' };
      }

      const tableQR = await TableQRModel.findOne({ id: payload.id });
      if (!tableQR) {
        return { valid: false, error: 'QR code not found' };
      }

      return {
        valid: true,
        tableId: tableQR.id,
        restaurantId: tableQR.restaurantId,
        restaurantSlug: tableQR.restaurantSlug,
        tableNumber: tableQR.tableNumber,
      };
    } catch {
      return { valid: false, error: 'Invalid QR data format' };
    }
  }

  /**
   * Get table info from QR data
   */
  async getTableByQR(qrData: string): Promise<TableQR | null> {
    await this.ensureDb();

    const verification = await this.verifyQR(qrData);
    if (!verification.valid || !verification.tableId) {
      return null;
    }

    const doc = await TableQRModel.findOne({ id: verification.tableId });
    return doc ? this.docToTableQR(doc) : null;
  }

  /**
   * Get all QR codes for a restaurant
   */
  async getRestaurantQRCodes(restaurantId: string): Promise<TableQRListItem[]> {
    await this.ensureDb();

    const docs = await TableQRModel.find({ restaurantId }).lean();

    return docs.map((doc) => ({
      id: doc.id,
      tableNumber: doc.tableNumber,
      tableName: doc.tableName,
      capacity: doc.capacity,
      menuUrl: doc.menuUrl,
      hasQrCode: true,
    }));
  }

  /**
   * Delete a table QR code
   */
  async deleteTableQR(restaurantId: string, tableNumber: string): Promise<boolean> {
    await this.ensureDb();

    const result = await TableQRModel.deleteOne({ restaurantId, tableNumber });
    return result.deletedCount > 0;
  }

  /**
   * Get QR code as base64 image
   */
  async getQRCodeImage(qrId: string): Promise<string | null> {
    await this.ensureDb();

    const doc = await TableQRModel.findOne({ id: qrId }).select('qrCodeDataUrl');
    return doc?.qrCodeDataUrl || null;
  }

  /**
   * Get table details by restaurant and table number
   */
  async getTable(restaurantId: string, tableNumber: string): Promise<TableQR | null> {
    await this.ensureDb();

    const doc = await TableQRModel.findOne({ restaurantId, tableNumber });
    return doc ? this.docToTableQR(doc) : null;
  }

  /**
   * Update table info
   */
  async updateTable(
    restaurantId: string,
    tableNumber: string,
    updates: Partial<{ tableName: string; capacity: number }>
  ): Promise<TableQR | null> {
    await this.ensureDb();

    const doc = await TableQRModel.findOneAndUpdate(
      { restaurantId, tableNumber },
      { $set: { ...updates, updatedAt: new Date() } },
      { new: true }
    );

    return doc ? this.docToTableQR(doc) : null;
  }

  private docToTableQR(doc: any): TableQR {
    return {
      id: doc.id,
      restaurantId: doc.restaurantId,
      restaurantSlug: doc.restaurantSlug,
      tableNumber: doc.tableNumber,
      tableName: doc.tableName,
      capacity: doc.capacity,
      menuUrl: doc.menuUrl,
      qrCodeDataUrl: doc.qrCodeDataUrl,
      createdAt: doc.createdAt,
    };
  }
}

export const tableQRService = new TableQRService();
