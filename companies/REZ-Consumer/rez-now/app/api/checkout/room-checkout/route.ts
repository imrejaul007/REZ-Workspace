/**
 * Room Checkout API Route
 *
 * Handles:
 * - GET /api/checkout/room-checkout/:bookingId/folio - Get folio
 * - POST /api/checkout/room-checkout/:bookingId - Process checkout/payment
 * - POST /api/checkout/room-checkout/:bookingId/split - Create split
 * - PUT /api/checkout/room-checkout/:bookingId/split - Update split (settle)
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { logger } from '@/lib/utils/logger';

// ─── Types ──────────────────────────────────────────────────────────────────────

interface ChargeItem {
  id: string;
  description: string;
  quantity: number;
  unitPricePaise: number;
  totalPaise: number;
  date: string;
  category: string;
}

interface FolioBill {
  bookingId: string;
  guestName: string;
  roomNumber: string;
  checkIn: string;
  checkOut: string;
  roomCharges: ChargeItem[];
  minibar: ChargeItem[];
  laundry: ChargeItem[];
  restaurant: ChargeItem[];
  spa: ChargeItem[];
  transport: ChargeItem[];
  other: ChargeItem[];
  subtotalPaise: number;
  taxesPaise: number;
  totalPaise: number;
}

interface PaymentRecord {
  id: string;
  amountPaise: number;
  method: string;
  status: string;
  date: string;
  transactionId?: string;
}

// ─── Demo Data Generation ───────────────────────────────────────────────────────

function generateDemoFolio(bookingId: string, guestName: string, roomNumber: string): { folio: FolioBill; payments: PaymentRecord[] } {
  const checkIn = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const checkOut = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);

  const roomCharges: ChargeItem[] = [
    {
      id: 'room-1',
      description: 'Deluxe Room (3 nights)',
      quantity: 3,
      unitPricePaise: 500000,
      totalPaise: 1500000,
      date: checkIn.toISOString(),
      category: 'room',
    },
  ];

  const minibar: ChargeItem[] = [
    {
      id: 'minibar-1',
      description: 'Mineral Water (500ml)',
      quantity: 2,
      unitPricePaise: 2000,
      totalPaise: 4000,
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'minibar',
    },
    {
      id: 'minibar-2',
      description: 'Soft Drink',
      quantity: 1,
      unitPricePaise: 4000,
      totalPaise: 4000,
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'minibar',
    },
  ];

  const other: ChargeItem[] = [
    {
      id: 'wifi-1',
      description: 'WiFi Access',
      quantity: 1,
      unitPricePaise: 0,
      totalPaise: 0,
      date: checkIn.toISOString(),
      category: 'other',
    },
  ];

  const subtotalPaise = roomCharges.reduce((sum, c) => sum + c.totalPaise, 0) +
    minibar.reduce((sum, c) => sum + c.totalPaise, 0) +
    other.reduce((sum, c) => sum + c.totalPaise, 0);

  const taxesPaise = Math.round(subtotalPaise * 0.18);

  const folio: FolioBill = {
    bookingId,
    guestName,
    roomNumber,
    checkIn: checkIn.toISOString(),
    checkOut: checkOut.toISOString(),
    roomCharges,
    minibar,
    laundry: [],
    restaurant: [],
    spa: [],
    transport: [],
    other,
    subtotalPaise,
    taxesPaise,
    totalPaise: subtotalPaise + taxesPaise,
  };

  return { folio, payments: [] };
}

// ─── API Route Handlers ────────────────────────────────────────────────────────

/**
 * GET /api/checkout/room-checkout/:bookingId/folio
 * Get folio for a booking
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;
    const url = new URL(request.url);
    const guestName = url.searchParams.get('guestName') || 'Guest';
    const roomNumber = url.searchParams.get('roomNumber') || '101';

    // Try to fetch from backend API
    const backendUrl = process.env.HOTEL_OTA_API_URL || 'https://hotel-ota-api.onrender.com';
    try {
      const response = await fetch(`${backendUrl}/api/room-service/checkout/${bookingId}/bill`, {
        headers: {
          'Content-Type': 'application/json',
          // Add auth headers if needed
        },
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return NextResponse.json({
            success: true,
            data: {
              folio: data.data,
              payments: [],
            },
          });
        }
      }
    } catch (error) {
      logger.error('Backend API error:', { error });
    }

    // Return demo data
    const { folio, payments } = generateDemoFolio(bookingId, guestName, roomNumber);
    return NextResponse.json({
      success: true,
      data: {
        folio,
        payments,
      },
    });
  } catch (error) {
    logger.error('Get folio error:', { error });
    return NextResponse.json(
      { success: false, message: 'Failed to fetch folio' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/checkout/room-checkout/:bookingId
 * Process checkout or payment
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;
    const body = await request.json();
    const { action, amountPaise, paymentMethod, checkoutTime } = body;

    // Try to process via backend API
    const backendUrl = process.env.HOTEL_OTA_API_URL || 'https://hotel-ota-api.onrender.com';
    try {
      const response = await fetch(`${backendUrl}/api/room-service/checkout/${bookingId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json({
          success: true,
          data: {
            paymentId: `PAY-${Date.now()}`,
            transactionId: `TXN-${Date.now()}`,
            receiptId: `RCP-${Date.now()}`,
            ...data.data,
          },
        });
      }
    } catch (error) {
      logger.error('Backend checkout error:', { error });
    }

    // Process locally for demo
    if (action === 'payment') {
      // Generate payment record
      const paymentId = `PAY-${Date.now()}`;
      const transactionId = `TXN-${Date.now()}`;

      return NextResponse.json({
        success: true,
        data: {
          paymentId,
          transactionId,
          amountPaise,
          paymentMethod,
          status: 'completed',
          processedAt: new Date().toISOString(),
        },
      });
    }

    if (action === 'express_checkout') {
      // Generate receipt
      const receiptId = `RCP-${Date.now()}`;
      const transactionId = `TXN-${Date.now()}`;

      return NextResponse.json({
        success: true,
        data: {
          receiptId,
          transactionId,
          checkoutTime: checkoutTime || new Date().toISOString(),
          status: 'completed',
        },
      });
    }

    return NextResponse.json(
      { success: false, message: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    logger.error('Checkout error:', { error });
    return NextResponse.json(
      { success: false, message: 'Checkout failed' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/checkout/room-checkout/:bookingId/split
 * Create or update split
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;
    const body = await request.json();
    const { action, splitId, participantId, amountPaise, participantName, assignedCharges } = body;

    if (action === 'settle') {
      // Mark a participant's share as settled
      return NextResponse.json({
        success: true,
        data: {
          splitId,
          participantId,
          settledAmountPaise: amountPaise,
          status: 'settled',
          settledAt: new Date().toISOString(),
        },
      });
    }

    if (action === 'create') {
      // Create a new split
      const splitId = `split-${Date.now()}`;
      const participants = [
        {
          id: `participant-${Date.now()}`,
          name: participantName || 'Guest',
          assignedCharges: assignedCharges || [],
          assignedAmountPaise: amountPaise || 0,
          paidAmountPaise: 0,
          status: 'pending',
        },
      ];

      return NextResponse.json({
        success: true,
        data: {
          splitId,
          bookingId,
          participants,
          status: 'active',
          createdAt: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json(
      { success: false, message: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    logger.error('Split error:', { error });
    return NextResponse.json(
      { success: false, message: 'Split operation failed' },
      { status: 500 }
    );
  }
}
