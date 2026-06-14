import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      mongodb: 'configured',
      rezAuth: 'configured',
      rezIntelligence: 'configured',
      rezMedia: 'configured',
    },
    endpoints: [
      '/dashboard',
      '/employees',
      '/attendance',
      '/payroll',
      '/ai-hub',
      '/recognition',
      '/field-workforce',
      '/helpdesk',
      '/api/health',
    ]
  });
}
