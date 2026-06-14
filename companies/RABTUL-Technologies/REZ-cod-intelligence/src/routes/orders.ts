/**
 * COD Intelligence - Orders API
 * POST /api/orders - Log new order
 * PUT /api/orders/:id/outcome - Update order outcome
 */

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { CODOrder, CustomerRTO, PincodeRTO } from '../../models';
import { updateCustomerStats, updatePincodeStats } from '../../services/riskScoring';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cod-intelligence';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN;

function verifyInternal(request: NextRequest): boolean {
  const token = request.headers.get('x-internal-token');
  return token === INTERNAL_TOKEN;
}

// POST /api/orders - Log new order
export async function POST(request: NextRequest) {
  if (!verifyInternal(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await mongoose.connect(MONGODB_URI);

    const body = await request.json();
    const {
      orderId,
      customerId,
      customerPhone,
      customerAddress,
      amount,
      items,
      category,
      merchantId,
      storeId,
      courier,
      paymentMethod,
      orderDate,
    } = body;

    if (!orderId || !customerId || !customerPhone || !amount) {
      return NextResponse.json({
        error: 'Missing required: orderId, customerId, customerPhone, amount'
      }, { status: 400 });
    }

    // Create order record
    const order = await CODOrder.create({
      orderId,
      customerId,
      customerPhone,
      customerAddress: customerAddress || {},
      amount,
      items: items || [],
      category,
      merchantId,
      storeId,
      courier,
      paymentMethod: paymentMethod || 'cod',
      orderDate: orderDate ? new Date(orderDate) : new Date(),
      outcome: 'pending',
    });

    // Update customer stats
    await CustomerRTO.findOneAndUpdate(
      { customerId },
      {
        $setOnInsert: { customerPhone },
        $inc: { totalOrders: 1, codOrders: paymentMethod === 'cod' ? 1 : 0 },
        $set: { lastOrderDate: new Date() },
      },
      { upsert: true }
    );

    // Update pincode stats
    if (customerAddress?.pincode) {
      await PincodeRTO.findOneAndUpdate(
        { pincode: customerAddress.pincode },
        {
          $setOnInsert: {
            city: customerAddress.city,
            state: customerAddress.state,
            region: customerAddress.region,
          },
          $inc: { totalOrders: 1 },
        },
        { upsert: true }
      );
    }

    return NextResponse.json({
      success: true,
      data: { orderId: order._id },
    }, { status: 201 });
  } catch (error) {
    logger.error('Order create error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/orders - Get orders
export async function GET(request: NextRequest) {
  if (!verifyInternal(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await mongoose.connect(MONGODB_URI);

    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');
    const customerId = searchParams.get('customerId');
    const outcome = searchParams.get('outcome');
    const limit = parseInt(searchParams.get('limit') || '100');
    const skip = parseInt(searchParams.get('skip') || '0');

    const query: unknown = {};
    if (merchantId) query.merchantId = merchantId;
    if (customerId) query.customerId = customerId;
    if (outcome) query.outcome = outcome;

    const [orders, total] = await Promise.all([
      CODOrder.find(query)
        .sort({ orderDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CODOrder.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: { orders, total, limit, skip },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
