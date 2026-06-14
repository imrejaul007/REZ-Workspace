/**
 * AdBazaar - Push Campaign from Creator QR
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
  const key = request.headers.get('x-internal-key');
  return key === ADBAZAAR_INTERNAL_KEY;
}

// Type for campaigns table insert
interface CampaignInsert {
  source: string;
  source_id?: string;
  creator_id?: string;
  title: string;
  description?: string;
  type: string;
  platform: string;
  budget: number;
  requirements?: unknown[];
  status: string;
  budget_spent: number;
}

export async function POST(request: NextRequest) {
  if (!verifyInternal(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { source, sourcePromotionId, creatorSourceId, title, description, type, platform, budget, requirements } = body;

    const supabase = getSupabase();
    const campaignData: CampaignInsert = {
      source: source || 'creator_qr',
      source_id: sourcePromotionId,
      creator_id: creatorSourceId,
      title,
      description,
      type: type || 'influencer',
      platform: platform || 'instagram',
      budget: Number(budget) || 0,
      requirements: requirements || [],
      status: 'open',
      budget_spent: 0,
    };

    const { data, error } = await supabase
      .from('campaigns')
      .insert(campaignData as never)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }

    return NextResponse.json({ success: true, campaignId: data?.id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
