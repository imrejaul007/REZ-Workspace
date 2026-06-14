import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  const { email, password } = body;

  // Demo authentication - in production, verify against database
  if (email && password) {
    return NextResponse.json({
      success: true,
      data: {
        token: 'demo-token-' + Date.now(),
        user: {
          id: '1',
          name: 'Demo User',
          email,
          role: 'candidate',
        },
      },
    });
  }

  return NextResponse.json({
    success: false,
    error: 'Invalid credentials',
  }, { status: 401 });
}
