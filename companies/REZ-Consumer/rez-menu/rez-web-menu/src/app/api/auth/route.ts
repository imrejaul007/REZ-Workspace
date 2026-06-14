import logger from './utils/logger';

/**
 * Auth API Routes
 * Handles OTP send, verify, and session management
 */

import { NextRequest, NextResponse } from 'next/server'
import { randomInt, randomBytes } from 'crypto'

// In-memory session storage (replace with Redis in production)
const sessions = new Map<string, { userId: string; phone: string; createdAt: string; expiresAt: string }>()
const otpStore = new Map<string, { otp: string; expiresAt: string; attempts: number }>()

const OTP_EXPIRY_MINUTES = 5
const SESSION_EXPIRY_DAYS = 30
const MAX_OTP_ATTEMPTS = 3

function generateOTP(): string {
  // Use crypto.randomInt for secure OTP generation
  return randomInt(1000, 9999).toString()
}

function generateSessionToken(): string {
  // Use crypto.randomBytes for secure session token
  return `sess_${Date.now().toString(36)}_${randomBytes(16).toString('hex')}`
}

// POST - Send OTP
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, action } = body as { phone: string; action: 'send_otp' | 'verify_otp' }

    // Validate phone
    const cleanedPhone = phone?.replace(/\D/g, '') || ''

    if (cleanedPhone.length < 10) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number' },
        { status: 400 }
      )
    }

    // Send OTP action
    if (action === 'send_otp') {
      const otp = generateOTP()
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString()

      // Store OTP (in production, send via SMS/WhatsApp)
      otpStore.set(cleanedPhone, {
        otp,
        expiresAt,
        attempts: 0
      })

      logger.info(`[DEV] OTP for ${cleanedPhone}: ${otp}`)

      // In production: integrate with RABTUL Notification Service
      // await NotificationService.sendSMS({ phone: cleanedPhone, message: `Your ReZ code is ${otp}` })

      return NextResponse.json({
        success: true,
        data: {
          message: 'OTP sent successfully',
          // Remove in production - only for demo
          otp: process.env.NODE_ENV === 'development' ? otp : undefined,
          expiresIn: OTP_EXPIRY_MINUTES * 60
        }
      })
    }

    // Verify OTP action
    const { otp: providedOtp } = body as { otp: string }

    if (!providedOtp) {
      return NextResponse.json(
        { success: false, error: 'OTP required' },
        { status: 400 }
      )
    }

    const stored = otpStore.get(cleanedPhone)

    if (!stored) {
      return NextResponse.json(
        { success: false, error: 'OTP not requested. Please request OTP first.' },
        { status: 400 }
      )
    }

    // Check expiry
    if (new Date() > new Date(stored.expiresAt)) {
      otpStore.delete(cleanedPhone)
      return NextResponse.json(
        { success: false, error: 'OTP expired. Please request a new one.' },
        { status: 400 }
      )
    }

    // Check attempts
    if (stored.attempts >= MAX_OTP_ATTEMPTS) {
      otpStore.delete(cleanedPhone)
      return NextResponse.json(
        { success: false, error: 'Too many attempts. Please request a new OTP.' },
        { status: 429 }
      )
    }

    // Verify OTP
    if (stored.otp !== providedOtp) {
      stored.attempts++
      return NextResponse.json(
        { success: false, error: 'Invalid OTP. Please try again.' },
        { status: 400 }
      )
    }

    // Success - create session
    otpStore.delete(cleanedPhone)

    const userId = `user_${cleanedPhone}_${Date.now()}`
    const sessionToken = generateSessionToken()
    const now = new Date()
    const expiresAt = new Date(now.getTime() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000)

    sessions.set(sessionToken, {
      userId,
      phone: cleanedPhone,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString()
    })

    // In production: create user in RABTUL Auth Service
    // await AuthService.createUser({ phone: cleanedPhone })

    return NextResponse.json({
      success: true,
      data: {
        accessToken: sessionToken,
        user: {
          id: userId,
          phone: cleanedPhone
        },
        expiresAt: expiresAt.toISOString()
      }
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    )
  }
}

// GET - Verify session
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { success: false, error: 'Authorization header required' },
      { status: 401 }
    )
  }

  const token = authHeader.substring(7)
  const session = sessions.get(token)

  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Invalid or expired session' },
      { status: 401 }
    )
  }

  // Check expiry
  if (new Date() > new Date(session.expiresAt)) {
    sessions.delete(token)
    return NextResponse.json(
      { success: false, error: 'Session expired' },
      { status: 401 }
    )
  }

  return NextResponse.json({
    success: true,
    data: {
      user: {
        id: session.userId,
        phone: session.phone
      }
    }
  })
}

// DELETE - Logout
export async function DELETE(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    sessions.delete(token)
  }

  return NextResponse.json({
    success: true,
    data: { message: 'Logged out successfully' }
  })
}
