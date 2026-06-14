/**
 * AdBazaar - Creator Sync from Creator QR
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

// Type for creators table insert
interface CreatorInsert {
  source: string;
  source_id?: string;
  username: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  niche?: string;
  socials: unknown[];
  followers: number;
  engagement_rate: number;
  verified: boolean;
  status: string;
  updated_at: string;
}

export async function POST(request: NextRequest) {
  if (!verifyInternal(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const { source, sourceId, display_name, username, bio, avatar_url, niche, socials, followers, engagement_rate } = body;
    const supabase = getSupabase();
    const creatorData: CreatorInsert = {
      source: source || 'creator_qr',
      source_id: sourceId,
      username: username || '',
      display_name,
      bio,
      avatar_url,
      niche,
      socials: socials || [],
      followers: followers || 0,
      engagement_rate: engagement_rate || 0,
      verified: false,
      status: 'active',
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase.from('creators').upsert(creatorData as never, { onConflict: 'source,source_id' }).select().single();
    if (error) return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    return NextResponse.json({ success: true, id: data?.id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '20');
  const supabase = getSupabase();
  const { data, error } = await supabase.from('creators').select('*').eq('status', 'active').order('followers', { ascending: false }).limit(limit);
  if (error) return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  return NextResponse.json({ creators: data || [] });
}
