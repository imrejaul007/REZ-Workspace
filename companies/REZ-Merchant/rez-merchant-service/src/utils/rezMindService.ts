/**
 * REZ Mind Integration - Merchant Service
 * Sends merchant events to Event Platform
 */

import axios from 'axios';
import { logger } from '../config/logger';

const REZ_MIND_URL = process.env.REZ_MIND_URL || process.env.INTENT_CAPTURE_URL || 'http://localhost:4008';

interface MerchantSignupEvent {
  merchant_id: string;
  business_name: string;
  email: string;
  phone?: string;
}

interface MerchantProfileUpdateEvent {
  merchant_id: string;
  field: string;
}

export async function sendMerchantSignupToRezMind(event: MerchantSignupEvent): Promise<void> {
  try {
    await axios.post(`${REZ_MIND_URL}/webhook/merchant/signup`, {
      merchant_id: event.merchant_id,
      business_name: event.business_name,
      email: event.email,
      phone: event.phone,
      source: 'merchant_service',
    });
    logger.info('[REZ Mind] Merchant signup event sent', { merchant_id: event.merchant_id });
  } catch (error) {
    const err = error as { message?: string };
    logger.warn('[REZ Mind] Failed to send merchant signup', {
      merchant_id: event.merchant_id,
      error: err.message,
    });
  }
}

export async function sendMerchantProfileUpdateToRezMind(event: MerchantProfileUpdateEvent): Promise<void> {
  try {
    await axios.post(`${REZ_MIND_URL}/webhook/merchant/profile`, {
      merchant_id: event.merchant_id,
      field: event.field,
      source: 'merchant_service',
    });
    logger.info('[REZ Mind] Merchant profile update event sent', { merchant_id: event.merchant_id });
  } catch (error) {
    const err = error as { message?: string };
    logger.warn('[REZ Mind] Failed to send merchant profile update', {
      merchant_id: event.merchant_id,
      error: err.message,
    });
  }
}
