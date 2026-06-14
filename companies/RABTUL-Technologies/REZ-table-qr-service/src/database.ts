/**
 * MongoDB Connection for REZ Table QR Service
 * Production-ready database connection
 */

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-table-qr';

let isConnected = false;

export async function connectDatabase(): Promise<void> {
  if (isConnected) {
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    console.log('[MongoDB] Connected to', MONGODB_URI);
  } catch (error) {
    console.error('[MongoDB] Connection failed:', error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (!isConnected) {
    return;
  }

  await mongoose.disconnect();
  isConnected = false;
  console.log('[MongoDB] Disconnected');
}

export function getConnectionStatus(): boolean {
  return mongoose.connection.readyState === 1;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════

export const tableQRSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  restaurantId: { type: String, required: true, index: true },
  restaurantSlug: { type: String, required: true },
  tableNumber: { type: String, required: true },
  tableName: { type: String },
  capacity: { type: Number },
  menuUrl: { type: String, required: true },
  qrCodeDataUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Compound index for restaurant + table uniqueness
tableQRSchema.index({ restaurantId: 1, tableNumber: 1 }, { unique: true });

export const TableQRModel = mongoose.model('TableQR', tableQRSchema, 'table_qrs');
