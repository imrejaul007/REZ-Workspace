/**
 * COD Intelligence - Analytics API
 * GET /api/analytics - Get RTO analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { CODOrder, CustomerRTO, PincodeRTO, MerchantRTO } from '../../models';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cod-intelligence';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN;

function verifyInternal(request: NextRequest): boolean {
  const token = request.headers.get('x-internal-token');
  return token === INTERNAL_TOKEN;
}

// GET /api/analytics - Get analytics
export async function GET(request: NextRequest) {
  if (!verifyInternal(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await mongoose.connect(MONGODB_URI);

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overview';
    const merchantId = searchParams.get('merchantId');
    const period = searchParams.get('period') || '30days';

    // Calculate date range
    const days = period === '7days' ? 7 : period === '30days' ? 30 : period === '90days' ? 90 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    switch (type) {
      case 'overview': {
        // Overall stats
        const [total, delivered, rto, refunded] = await Promise.all([
          CODOrder.countDocuments({ orderDate: { $gte: startDate } }),
          CODOrder.countDocuments({ orderDate: { $gte: startDate }, outcome: 'delivered' }),
          CODOrder.countDocuments({ orderDate: { $gte: startDate }, outcome: 'rto' }),
          CODOrder.countDocuments({ orderDate: { $gte: startDate }, outcome: 'refunded' }),
        ]);

        const rtoRate = total > 0 ? (rto / total * 100).toFixed(1) : '0';
        const refundRate = total > 0 ? (refunded / total * 100).toFixed(1) : '0';

        // Cost of RTO (estimated)
        const rtoOrders = await CODOrder.find({
          orderDate: { $gte: startDate },
          outcome: 'rto'
        }).select('amount').lean();

        const rtoCost = rtoOrders.reduce((sum, o) => sum + (o.amount || 0), 0);

        return NextResponse.json({
          success: true,
          data: {
            period,
            overview: {
              totalOrders: total,
              deliveredOrders: delivered,
              rtoOrders: rto,
              refundedOrders: refunded,
              rtoRate,
              refundRate,
              rtoCost,
              potentialSavings: Math.round(rtoCost * 0.5), // 50% potential savings
            },
            trends: {
              weekly: await getWeeklyTrends(startDate),
            },
          },
        });
      }

      case 'merchant': {
        if (!merchantId) {
          return NextResponse.json({ error: 'merchantId required' }, { status: 400 });
        }

        const merchantOrders = await CODOrder.find({
          merchantId,
          orderDate: { $gte: startDate },
        }).lean();

        const total = merchantOrders.length;
        const delivered = merchantOrders.filter(o => o.outcome === 'delivered').length;
        const rto = merchantOrders.filter(o => o.outcome === 'rto').length;
        const refunded = merchantOrders.filter(o => o.outcome === 'refunded').length;

        // Pincode breakdown
        const pincodeMap = new Map<string, { total: number; rto: number }>();
        merchantOrders.forEach(order => {
          const pin = order.customerAddress?.pincode || 'unknown';
          const existing = pincodeMap.get(pin) || { total: 0, rto: 0 };
          existing.total++;
          if (order.outcome === 'rto') existing.rto++;
          pincodeMap.set(pin, existing);
        });

        const highRiskPincodes = Array.from(pincodes.entries())
          .filter(([_, data]) => data.rto / data.total > 0.3)
          .map(([pincode, data]) => ({
            pincode,
            rtoRate: (data.rto / data.total * 100).toFixed(1),
            orders: data.total,
          }));

        return NextResponse.json({
          success: true,
          data: {
            merchantId,
            period,
            stats: {
              totalOrders: total,
              deliveredOrders: delivered,
              rtoOrders: rto,
              refundedOrders: refunded,
              rtoRate: total > 0 ? (rto / total * 100).toFixed(1) : '0',
              refundRate: total > 0 ? (refunded / total * 100).toFixed(1) : '0',
            },
            highRiskPincodes,
            courierPerformance: await getCourierPerformance(merchantId, startDate),
          },
        });
      }

      case 'customer': {
        const customerId = searchParams.get('customerId');
        if (!customerId) {
          return NextResponse.json({ error: 'customerId required' }, { status: 400 });
        }

        const customer = await CustomerRTO.findOne({ customerId });
        if (!customer) {
          return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }

        return NextResponse.json({
          success: true,
          data: {
            customerId,
            totalOrders: customer.totalOrders,
            rtoRate: (customer.rtoRate * 100).toFixed(1),
            refundRate: (customer.refundRate * 100).toFixed(1),
            riskLevel: customer.riskLevel,
            riskScore: customer.riskScore,
            lastOrderDate: customer.lastOrderDate,
            lastRTODate: customer.lastRTODate,
          },
        });
      }

      case 'pincode': {
        const pincode = searchParams.get('pincode');
        if (!pincode) {
          return NextResponse.json({ error: 'pincode required' }, { status: 400 });
        }

        const pincodeData = await PincodeRTO.findOne({ pincode });
        if (!pincodeData) {
          return NextResponse.json({ error: 'Pincode not found' }, { status: 404 });
        }

        return NextResponse.json({
          success: true,
          data: {
            pincode,
            city: pincodeData.city,
            state: pincodeData.state,
            totalOrders: pincodeData.totalOrders,
            rtoRate: (pincodeData.rtoRate * 100).toFixed(1),
            refundRate: (pincodeData.refundRate * 100).toFixed(1),
            riskLevel: pincodeData.riskLevel,
            courierPerformance: pincodeData.courierPerformance,
          },
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }
  } catch (error) {
    logger.error('Analytics error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function getWeeklyTrends(startDate: Date) {
  const weeks = [];
  const now = new Date();

  for (let i = 0; i < 4; i++) {
    const weekStart = new Date(startDate);
    weekStart.setDate(weekStart.getDate() + (i * 7));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const [total, rto] = await Promise.all([
      CODOrder.countDocuments({ orderDate: { $gte: weekStart, $lt: weekEnd } }),
      CODOrder.countDocuments({ orderDate: { $gte: weekStart, $lt: weekEnd }, outcome: 'rto' }),
    ]);

    weeks.push({
      week: weekStart.toISOString().split('T')[0],
      total,
      rto,
      rtoRate: total > 0 ? (rto / total * 100).toFixed(1) : '0',
    });
  }

  return weeks;
}

async function getCourierPerformance(merchantId: string, startDate: Date) {
  const orders = await CODOrder.find({
    merchantId,
    orderDate: { $gte: startDate },
    courier: { $exists: true },
  }).select('courier outcome').lean();

  const courierMap = new Map<string, { total: number; rto: number; delivered: number }>();

  orders.forEach(order => {
    const courier = order.courier || 'unknown';
    const existing = courierMap.get(courier) || { total: 0, rto: 0, delivered: 0 };
    existing.total++;
    if (order.outcome === 'rto') existing.rto++;
    if (order.outcome === 'delivered') existing.delivered++;
    courierMap.set(courier, existing);
  });

  return Array.from(courierMap.entries())
    .map(([courier, data]) => ({
      courier,
      orders: data.total,
      rtoRate: (data.rto / data.total * 100).toFixed(1),
      deliveryRate: (data.delivered / data.total * 100).toFixed(1),
    }))
    .sort((a, b) => parseFloat(b.deliveryRate) - parseFloat(a.deliveryRate));
}
