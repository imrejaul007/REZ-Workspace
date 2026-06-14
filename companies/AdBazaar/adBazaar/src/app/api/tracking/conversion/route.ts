/**
 * AdBazaar - Conversion Tracking from Creator QR
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy initialization to avoid build-time errors
let _supabase: SupabaseClient | null = null;
function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
  }
  return _supabase;
}

const ADBAZAAR_INTERNAL_KEY = process.env.ADBAZAAR_INTERNAL_KEY;

function verifyInternal(request: NextRequest): boolean {
  return request.headers.get('x-internal-key') === ADBAZAAR_INTERNAL_KEY;
}

// Type for conversions table insert
interface ConversionInsert {
  source: string;
  creator_id?: string;
  booking_id?: string;
  amount: number;
  attribution_source: string;
  created_at: string;
}

export async function POST(request: NextRequest) {
  if (!verifyInternal(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const { source, creatorId, bookingId, amount, attributionSource } = body;
    const supabase = getSupabase();
    const conversionData: ConversionInsert = {
      source: source || 'creator_qr',
      creator_id: creatorId,
      booking_id: bookingId,
      amount: Number(amount) || 0,
      attribution_source: attributionSource || 'qr',
      created_at: new Date().toISOString(),
    };
    await supabase.from('conversions').insert(conversionData as never);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) });
  }
}
