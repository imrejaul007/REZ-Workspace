/**
 * seedDay1Revenue.ts — Day 1 revenue bootstrapping for newly approved merchants.
 *
 * Called by the monolith (rezbackend) after a merchant's KYC is approved and their
 * account transitions to "approved" status. Creates three growth primitives so the
 * merchant has live campaigns to show customers on day 1:
 *
 * 1. Welcome Offer   — 20% off, 7-day validity, single-use
 * 2. Punch Card     — 5-visit stamp card with a free item reward
 * 3. WhatsApp Template — Post-approval broadcast (pending WhatsApp Business API review)
 *
 * Each step is idempotent: if the merchant already has a welcome-offer discount
 * (checked by name prefix) or a 5-stamp card, that step is skipped silently.
 */

import { Discount } from '../models/Discount';
import { StampCard } from '../models/StampCard';
import { Broadcast } from '../models/Broadcast';
import { Store } from '../models/Store';
import mongoose from 'mongoose';
import { logger } from '../config/logger';

interface LeanDiscount { _id: mongoose.Types.ObjectId; name?: string; }
interface LeanStampCard { _id: mongoose.Types.ObjectId; name?: string; }
interface LeanBroadcast { _id: mongoose.Types.ObjectId; title?: string; }

export interface SeedDay1Result {
  merchantId: string;
  storeId: string;
  welcomeDiscount?: { id: string; name: string };
  punchCard?: { id: string; name: string };
  broadcastTemplate?: { id: string; name: string };
  errors: string[];
}

/**
 * Create day-1 growth primitives for a newly approved merchant.
 * Uses the merchant's first store as the target.
 *
 * @param merchantId — MongoDB ObjectId string of the approved merchant
 */
export async function seedDay1Revenue(merchantId: string): Promise<SeedDay1Result> {
  const errors: string[] = [];
  const result: SeedDay1Result = {
    merchantId,
    storeId: '',
    errors,
  };

  const merchantOid = new mongoose.Types.ObjectId(merchantId);

  // Resolve the merchant's primary store
  const store = await Store.findOne({ merchantId: merchantOid }).lean() as (mongoose.HydratedDocument<unknown> & { _id: mongoose.Types.ObjectId; name?: string }) | null;
  if (!store) {
    errors.push('No store found for merchant — skipping all seeding.');
    logger.warn('[seedDay1Revenue] No store found', { merchantId });
    return result;
  }

  result.storeId = store._id.toString();
  const storeOid = store._id;

  // ── 1. Welcome Offer ─────────────────────────────────────────────────────────
  try {
    const existingDiscount = await Discount.findOne({
      merchantId: merchantOid,
      storeId: storeOid,
      name: { $regex: /^welcome\s?offer/i },
    }).lean() as LeanDiscount | null;

    if (existingDiscount) {
      result.welcomeDiscount = { id: existingDiscount._id.toString(), name: existingDiscount.name ?? 'Welcome Offer' };
      logger.info('[seedDay1Revenue] Welcome discount already exists, skipping', { merchantId });
    } else {
      const now = new Date();
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + 7);

      const discount = await Discount.create({
        merchantId: merchantOid,
        storeId: storeOid,
        name: 'Welcome Offer',
        description: 'New customer exclusive: 20% off your first order!',
        type: 'percentage',
        value: 20,
        code: `WELCOME${merchantId.slice(-6).toUpperCase()}`,
        minOrderAmount: 100,
        maxDiscount: 200,
        startDate: now,
        endDate,
        usageLimit: 1,
        perUserLimit: 1,
        applicableTo: 'all_products',
        status: 'active',
        isActive: true,
        metadata: { source: 'seedDay1Revenue', seededAt: now.toISOString() },
      });

      result.welcomeDiscount = { id: discount._id.toString(), name: discount.name ?? 'Welcome Offer' };
      logger.info('[seedDay1Revenue] Welcome discount created', { merchantId, discountId: discount._id });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`Welcome discount: ${msg}`);
    logger.error('[seedDay1Revenue] Welcome discount failed', { merchantId, error: msg });
  }

  // ── 2. Punch Card (5-visit stamp card) ──────────────────────────────────────
  try {
    const existingCard = await StampCard.findOne({
      merchantId: merchantOid,
      storeId: storeOid,
      requiredStamps: 5,
    }).lean() as LeanStampCard | null;

    if (existingCard) {
      result.punchCard = { id: existingCard._id.toString(), name: existingCard.name ?? '5-Visit Punch Card' };
      logger.info('[seedDay1Revenue] Punch card already exists, skipping', { merchantId });
    } else {
      const stampCard = await StampCard.create({
        merchantId: merchantOid,
        storeId: storeOid,
        name: '5-Visit Punch Card',
        description: 'Collect 5 stamps on your visits and get a free item!',
        requiredStamps: 5,
        reward: 'Free item of your choice (up to ₹150)',
        isActive: true,
        termsAndConditions: 'Stamps valid for 90 days from first visit. Non-transferable.',
        metadata: { source: 'seedDay1Revenue', seededAt: new Date().toISOString() },
      });

      result.punchCard = { id: stampCard._id.toString(), name: stampCard.name ?? '5-Visit Punch Card' };
      logger.info('[seedDay1Revenue] Punch card created', { merchantId, stampCardId: stampCard._id });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`Punch card: ${msg}`);
    logger.error('[seedDay1Revenue] Punch card failed', { merchantId, error: msg });
  }

  // ── 3. WhatsApp Broadcast Template ───────────────────────────────────────────
  try {
    const existingBroadcast = await Broadcast.findOne({
      merchantId: merchantOid,
      storeId: storeOid,
      title: { $regex: /^welcome\s?message/i },
    }).lean() as LeanBroadcast | null;

    if (existingBroadcast) {
      result.broadcastTemplate = {
        id: existingBroadcast._id.toString(),
        name: existingBroadcast.title ?? 'Welcome Message',
      };
      logger.info('[seedDay1Revenue] Broadcast template already exists, skipping', { merchantId });
    } else {
      const broadcast = await Broadcast.create({
        merchantId: merchantOid,
        storeId: storeOid,
        title: 'Welcome Message',
        message:
          `Hi {customer_name}, welcome to ${store.name ?? 'our store'}! 🎉\n\n` +
          `Use code WELCOME20 for 20% off your first order. Valid 7 days.\n\n` +
          `Earn 1 coin per ₹1 spent — redeem against your next bill.\n\n` +
          `Team ${store.name ?? 'Us'}`,
        type: 'welcome',
        channel: 'whatsapp',
        status: 'draft',
        targetAudience: 'new_customers',
        template: 'welcome_offer',
        metadata: {
          source: 'seedDay1Revenue',
          seededAt: new Date().toISOString(),
          note: 'Requires WhatsApp Business API template approval before sending',
        },
      });

      result.broadcastTemplate = { id: broadcast._id.toString(), name: broadcast.title ?? 'Welcome Message' };
      logger.info('[seedDay1Revenue] Broadcast template created', { merchantId, broadcastId: broadcast._id });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`Broadcast template: ${msg}`);
    logger.error('[seedDay1Revenue] Broadcast template failed', { merchantId, error: msg });
  }

  return result;
}
