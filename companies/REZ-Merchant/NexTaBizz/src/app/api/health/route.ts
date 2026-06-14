import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'NexTaBizz Frontend',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
}
