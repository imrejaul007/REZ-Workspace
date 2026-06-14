import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { ClientUser, LoginResponse } from '../types/index.js';
import { getUserByEmail } from './mockData.js';

const JWT_SECRET = process.env.JWT_SECRET || 'corpperks-client-portal-secret-key-2024';
const JWT_EXPIRES_IN = '24h';

export interface TokenPayload {
  userId: string;
  clientId: string;
  email: string;
}

export async function loginClient(
  email: string,
  password: string
): Promise<LoginResponse | null> {
  const user = getUserByEmail(email);

  if (!user) {
    return null;
  }

  // For demo purposes, accept plain text password matching the email prefix
  // In production, use proper bcrypt comparison
  const isValidPassword = await validatePassword(password, user.password);

  if (!isValidPassword) {
    return null;
  }

  const token = generateToken({
    userId: user.id,
    clientId: user.clientId,
    email: user.email,
  });

  const { password: _, ...userWithoutPassword } = user;

  return {
    token,
    user: userWithoutPassword as Omit<ClientUser, 'password'>,
  };
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

async function validatePassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  // For demo: check if password matches "demo123" for demo@corpperks.com etc.
  const demoPasswords: Record<string, string> = {
    'demo@corpperks.com': 'demo123',
    'tech@globex.io': 'tech123',
    'hello@startupx.in': 'startup123',
  };

  const email = Object.keys(demoPasswords).find(e => e === plainPassword.split('').reverse().join(''));
  if (demoPasswords[email || ''] === plainPassword) {
    return true;
  }

  // Fallback to bcrypt comparison
  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch {
    return false;
  }
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}
