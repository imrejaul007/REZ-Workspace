/**
 * COD Intelligence - Score Order API
 * POST /api/score
 * Real-time order risk assessment
 */

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { scoreOrder, ScoreOrderInput } from '../../services/riskScoring';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cod-intelligence';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN;

function verifyInternal(request: NextRequest): boolean {
  const token = request.headers.get('x-internal-token');
  return token === INTERNAL_TOKEN;
}

// POST /api/score - Score an order
export async function POST(request: NextRequest) {
  // Verify internal token
  if (!verifyInternal(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await mongoose.connect(MONGODB_URI);

    const body = await request.json();
    const { orderId, customerId, customerPhone, customerEmail, amount, items, pincode, merchantId, courier } = body;

    // Validate required fields
    if (!orderId || !customerPhone || !amount) {
      return NextResponse.json({
        error: 'Missing required fields: orderId, customerPhone, amount'
      }, { status: 400 });
    }

    const input: ScoreOrderInput = {
      orderId,
      customerId,
      customerPhone,
      customerEmail,
      amount,
      items,
      pincode,
      merchantId,
      courier,
    };

    const result = await scoreOrder(input);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Score error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/score - Get score for existing order
export async function GET(request: NextRequest) {
  if (!verifyInternal(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await mongoose.connect(MONGODB_URI);

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ error: 'orderId required' }, { status: 400 });
    }

    const { OrderRiskScore } = await import('../../models');
    const score = await OrderRiskScore.findOne({ orderId });

    if (!score) {
      return NextResponse.json({ error: 'Score not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: score,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
