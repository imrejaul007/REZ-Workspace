/**
 * IT Agent API - Software, Hardware, Access
 */

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { action, ...data } = await request.json();

  switch (action) {
    case 'software':
      return NextResponse.json({ licenses: [{ name: 'Microsoft 365', seats: 50, used: 45 }] });
    case 'hardware':
      return NextResponse.json({ devices: [{ type: 'laptop', assigned: 30, available: 5 }]);
    case 'access':
      return NextResponse.json({ granted: true, permissions: ['read', 'write'] });
    case 'security':
      return NextResponse.json({ alerts: 0, last_audit: new Date().toISOString() });
    default:
      return NextResponse.json({ error: 'Unknown' }, { status: 400 });
  }
}
