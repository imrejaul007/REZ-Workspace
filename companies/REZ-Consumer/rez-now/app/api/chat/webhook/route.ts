import { NextRequest, NextResponse } from 'next/server';
import { processQuery } from '@/lib/ai/ragService';
import { detectIntent, extractEntities } from '@/lib/ai/intentDetector';

export async function POST(request: NextRequest) {
  const { query, context, userId } = await request.json();

  const { intent } = detectIntent(query);
  const entities = extractEntities(query);

  const response = await processQuery({
    userId,
    query,
    context,
  });

  return NextResponse.json({
    intent,
    entities,
    response,
  });
}
