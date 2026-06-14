/**
 * REZ Merchant - QR Integration Module
 *
 * Connects POS and KDS to QR verification services
 *
 * Features:
 * - Product verification at POS
 * - Warranty activation at sale
 * - Loyalty point scanning
 * - QR code generation for products
 */

import axios from 'axios';

const VERIFY_QR_URL = process.env.VERIFY_QR_URL || 'https://verify-qr.onrender.com';
const SAFE_QR_URL = process.env.SAFE_QR_URL || 'https://safe-qr.onrender.com';
const INTERNAL_KEY = process.env.INTERNAL_SERVICE_TOKEN || 'your-internal-token';

// ============================================
// PRODUCT VERIFICATION
// ============================================

/**
 * Verify product at POS
 * - Check authenticity
 * - Check warranty status
 * - Get product info
 */
export async function verifyProductAtPOS(params: {
  serial_number: string;
  merchant_id: string;
  store_id: string;
  cashier_id: string;
  location?: { lat: number; lng: number };
}): Promise<{
  authentic: boolean;
  product;
  warranty;
  cashback_available: number;
}> {
  try {
    const response = await axios.post(`${VERIFY_QR_URL}/api/verify`, {
      serial_number: params.serial_number,
      source: 'merchant_pos',
      merchant_id: params.merchant_id,
      store_id: params.store_id
    }, {
      headers: {
        'X-Internal-Token': INTERNAL_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    const result = response.data;

    // Track verification
    await trackVerification({
      serial_number: params.serial_number,
      merchant_id: params.merchant_id,
      store_id: params.store_id,
      result: result.status
    });

    return {
      authentic: result.status === 'AUTHENTIC',
      product: result.product,
      warranty: result.warranty,
      cashback_available: result.cashback_earned || 0
    };
  } catch (error) {
    console.error('Product verification failed:', error);
    return {
      authentic: false,
      product: null,
      warranty: null,
      cashback_available: 0
    };
  }
}

/**
 * Activate warranty at point of sale
 */
export async function activateWarrantyAtSale(params: {
  serial_number: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  merchant_id: string;
  store_id: string;
  sale_amount: number;
  sale_date: string;
}): Promise<{
  success: boolean;
  warranty_id?: string;
  cashback_earned: number;
  message: string;
}> {
  try {
    const response = await axios.post(`${VERIFY_QR_URL}/api/activate-warranty`, {
      serial_number: params.serial_number,
      user_id: params.customer_id,
      customer_name: params.customer_name,
      customer_phone: params.customer_phone,
      merchant_id: params.merchant_id,
      store_id: params.store_id,
      purchase_price: params.sale_amount,
      purchase_date: params.sale_date,
      source: 'merchant_pos'
    }, {
      headers: {
        'X-Internal-Token': INTERNAL_KEY,
        'Content-Type': 'application/json'
      }
    });

    const result = response.data;

    return {
      success: true,
      warranty_id: result.warranty_id,
      cashback_earned: result.cashback_earned || Math.floor(params.sale_amount * 0.01),
      message: `Warranty activated! Earned ${result.cashback_earned || 0} cashback points.`
    };
  } catch (error) {
    console.error('Warranty activation failed:', error);
    return {
      success: false,
      cashback_earned: 0,
      message: 'Failed to activate warranty. Please try again.'
    };
  }
}

// ============================================
// QR CODE GENERATION
// ============================================

/**
 * Generate QR code for product
 */
export async function generateProductQR(params: {
  product_id: string;
  serial_number: string;
  merchant_id: string;
  qr_type: 'verify' | 'safe' | 'warranty';
}): Promise<{
  success: boolean;
  qr_url?: string;
  shortcode?: string;
  qr_image_url?: string;
}> {
  try {
    const response = await axios.post(`${VERIFY_QR_URL}/api/qr/generate`, {
      product_id: params.product_id,
      serial_number: params.serial_number,
      merchant_id: params.merchant_id,
      qr_type: params.qr_type
    }, {
      headers: {
        'X-Internal-Token': INTERNAL_KEY,
        'Content-Type': 'application/json'
      }
    });

    return {
      success: true,
      qr_url: response.data.qr_url,
      shortcode: response.data.shortcode,
      qr_image_url: response.data.qr_image_url
    };
  } catch (error) {
    console.error('QR generation failed:', error);
    return {
      success: false
    };
  }
}

// ============================================
// LOYALTY SCANNING
// ============================================

/**
 * Scan customer loyalty QR
 */
export async function scanLoyaltyQR(params: {
  qr_code: string;
  merchant_id: string;
  store_id: string;
  cashier_id: string;
  transaction_amount?: number;
}): Promise<{
  success: boolean;
  customer_id?: string;
  points_available?: number;
  tier?: string;
  message: string;
}> {
  try {
    // Try Verify QR first
    const verifyRes = await axios.post(`${VERIFY_QR_URL}/api/loyalty/scan`, {
      qr_code: params.qr_code,
      merchant_id: params.merchant_id,
      store_id: params.store_id
    }, {
      headers: {
        'X-Internal-Token': INTERNAL_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (verifyRes.data.found) {
      return {
        success: true,
        customer_id: verifyRes.data.customer_id,
        points_available: verifyRes.data.points,
        tier: verifyRes.data.tier,
        message: `Welcome ${verifyRes.data.tier} member!`
      };
    }

    // Try Safe QR
    const safeRes = await axios.post(`${SAFE_QR_URL}/api/loyalty/scan`, {
      qr_code: params.qr_code,
      merchant_id: params.merchant_id
    }, {
      headers: {
        'X-Internal-Token': INTERNAL_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (safeRes.data.found) {
      return {
        success: true,
        customer_id: safeRes.data.customer_id,
        points_available: safeRes.data.points,
        tier: safeRes.data.tier,
        message: 'Welcome back!'
      };
    }

    return {
      success: false,
      message: 'Loyalty QR not found. Please check the code.'
    };
  } catch (error) {
    console.error('Loyalty scan failed:', error);
    return {
      success: false,
      message: 'Failed to scan loyalty QR.'
    };
  }
}

/**
 * Award points at sale
 */
export async function awardLoyaltyPoints(params: {
  customer_id: string;
  merchant_id: string;
  transaction_amount: number;
  transaction_id: string;
}): Promise<{
  success: boolean;
  points_awarded: number;
  total_points: number;
}> {
  try {
    const response = await axios.post(`${VERIFY_QR_URL}/api/loyalty/award`, {
      customer_id: params.customer_id,
      merchant_id: params.merchant_id,
      amount: params.transaction_amount,
      transaction_id: params.transaction_id
    }, {
      headers: {
        'X-Internal-Token': INTERNAL_KEY,
        'Content-Type': 'application/json'
      }
    });

    return {
      success: true,
      points_awarded: response.data.points_awarded,
      total_points: response.data.total_points
    };
  } catch (error) {
    console.error('Point award failed:', error);
    return {
      success: false,
      points_awarded: 0,
      total_points: 0
    };
  }
}

// ============================================
// ANALYTICS
// ============================================

/**
 * Get merchant QR analytics
 */
export async function getMerchantQRAnalytics(merchantId: string): Promise<unknown> {
  try {
    const response = await axios.get(`${VERIFY_QR_URL}/api/analytics/merchant/${merchantId}`, {
      headers: {
        'X-Internal-Token': INTERNAL_KEY
      }
    });

    return response.data;
  } catch (error) {
    console.error('Analytics fetch failed:', error);
    return null;
  }
}

// ============================================
// HELPERS
// ============================================

async function trackVerification(params: {
  serial_number: string;
  merchant_id: string;
  store_id: string;
  result: string;
}): Promise<void> {
  try {
    await axios.post(`${VERIFY_QR_URL}/api/track/verification`, params, {
      headers: {
        'X-Internal-Token': INTERNAL_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
  } catch (error) {
    // Don't fail main operation
  }
}

// ============================================
// POS INTEGRATION EXAMPLE
// ============================================

/**
 * Example: Complete POS sale with QR integration
 */
export async function processPOSSaleWithQR(sale: {
  merchant_id: string;
  store_id: string;
  cashier_id: string;
  customer_id?: string;
  items: Array<{
    product_id: string;
    serial_number?: string;
    quantity: number;
    price: number;
  }>;
  payment_method: string;
}) {
  const results: unknown = {
    sale_id: `SALE_${Date.now()}`,
    items_processed: [],
    qr_verifications: [],
    warranty_activations: [],
    loyalty: null
  };

  // Process each item
  for (const item of sale.items) {
    const itemResult: unknown = {
      product_id: item.product_id,
      success: true
    };

    // Verify product if has serial number
    if (item.serial_number) {
      const verification = await verifyProductAtPOS({
        serial_number: item.serial_number,
        merchant_id: sale.merchant_id,
        store_id: sale.store_id,
        cashier_id: sale.cashier_id
      });

      results.qr_verifications.push(verification);
      itemResult.verification = verification;

      // If warranty eligible, prompt for activation
      if (verification.warranty && !verification.warranty.activated) {
        // In real POS, show prompt to customer
        const activation = await activateWarrantyAtSale({
          serial_number: item.serial_number,
          customer_id: sale.customer_id || 'guest',
          customer_name: 'Customer',
          customer_phone: '',
          merchant_id: sale.merchant_id,
          store_id: sale.store_id,
          sale_amount: item.price * item.quantity,
          sale_date: new Date().toISOString()
        });

        if (activation.success) {
          results.warranty_activations.push(activation);
          itemResult.warranty = activation;
        }
      }
    }

    results.items_processed.push(itemResult);
  }

  // Process loyalty if customer
  if (sale.customer_id) {
    results.loyalty = await awardLoyaltyPoints({
      customer_id: sale.customer_id,
      merchant_id: sale.merchant_id,
      transaction_amount: sale.items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      transaction_id: results.sale_id
    });
  }

  return results;
}

export default {
  verifyProductAtPOS,
  activateWarrantyAtSale,
  generateProductQR,
  scanLoyaltyQR,
  awardLoyaltyPoints,
  getMerchantQRAnalytics,
  processPOSSaleWithQR
};
