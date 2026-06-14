/**
 * Support Agent API - Tickets, Knowledge Base, Satisfaction
 */

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { action, ...data } = await request.json();

  switch (action) {
    case 'ticket':
      return NextResponse.json({ id: Date.now(), ...data, status: 'open' });
    case 'knowledge_base':
      return NextResponse.json({ articles: [{ id: 1, title: 'Leave Policy' }] });
    case 'csat':
      return NextResponse.json({ score: 4.5, responses: 150 });
    case 'escalation':
      return NextResponse.json({ level: 'manager', notified: true });
    default:
      return NextResponse.json({ error: 'Unknown' }, { status: 400 });
  }
}
