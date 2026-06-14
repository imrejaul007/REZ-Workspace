/**
 * TalentOS Auth - JWT, Sessions, Permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const SECRET = process.env.JWT_SECRET || 'talent-secret-key-2026';

// Types
interface User {
  id: string;
  email: string;
  role: 'admin' | 'employer' | 'employee' | 'candidate';
  company?: string;
}

// JWT helpers
async function createToken(user: User): Promise<string> {
  return Buffer.from(JSON.stringify({ ...user, exp: Date.now() + 86400000 })).toString('base64');
}

async function verifyToken(token: string): Promise<User | null> {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    return decoded.exp > Date.now() ? decoded : null;
  } catch { return null; }
}

// Login
export async function POST(request: NextRequest) {
  const { email, password, role } = await request.json();

  // Mock validation
  if (!email || !password) {
    return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
  }

  const user: User = {
    id: `usr_${Date.now()}`,
    email,
    role: role || 'employee'
  };

  const token = await createToken(user);

  const response = NextResponse.json({ user, token });
  response.cookies.set('talent_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 86400
  });

  return response;
}

// Logout
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('talent_token');
  return response;
}

// Get current user
export async function GET() {
  const token = cookies().get('talent_token')?.value;
  if (!token) return NextResponse.json({ user: null });

  const user = await verifyToken(token);
  return NextResponse.json({ user });
}

// Permission check
export async function permission(request: NextRequest) {
  const { action } = await request.json();
  const token = cookies().get('talent_token')?.value;
  const user = await verifyToken(token || '');

  const permissions = {
    admin: ['read', 'write', 'delete', 'manage'],
    employer: ['read', 'write', 'invite'],
    employee: ['read', 'update_profile'],
    candidate: ['read', 'apply']
  };

  return NextResponse.json({
    allowed: permissions[user?.role || 'candidate']?.includes(action) || false
  });
}
