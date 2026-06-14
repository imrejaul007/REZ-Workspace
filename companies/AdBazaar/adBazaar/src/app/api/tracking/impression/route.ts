/**
 * AdBazaar - QR Tracking from Creator QR
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

// Type for qr_impressions table insert
interface ImpressionInsert {
  source: string;
  creator_id?: string;
  type: string;
  user_id?: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export async function POST(request: NextRequest) {
  if (!verifyInternal(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const { source, creatorId, type, userId, metadata } = body;
    const supabase = getSupabase();
    const impressionData: ImpressionInsert = {
      source: source || 'creator_qr',
      creator_id: creatorId,
      type: type || 'qr_scan',
      user_id: userId,
      metadata: metadata || {},
      created_at: new Date().toISOString(),
    };
    await supabase.from('qr_impressions').insert(impressionData as never);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) });
  }
}
