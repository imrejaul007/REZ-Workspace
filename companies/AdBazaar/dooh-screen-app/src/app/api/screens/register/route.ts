import { NextRequest, NextResponse } from 'next/server'

// In-memory screen registry (use Redis/DB in production)
const screens = new Map<string, unknown>()

// Screen types validation
const VALID_SCREEN_TYPES = [
  'cab_tablet', 'bus_shelter', 'bus_interior', 'train_display', 'metro_screen',
  'flight_seatback', 'flight_overhead', 'flight_entrance', 'flight_lavatory',
  'airport_display', 'airport_kiosk', 'airport_gate', 'airport_lounge', 'airport_billboard',
  'restaurant_tv', 'hotel_lobby', 'hotel_room',
  'mall_kiosk', 'mall_directory', 'gym_screen', 'salon_display',
  'office_lobby', 'office_elevator',
  'generic_display'
] as const

type ScreenType = typeof VALID_SCREEN_TYPES[number]

interface ScreenRegistration {
  id: string
  name: string
  type: ScreenType
  location?: {
    city: string
    area?: string
    lat?: number
    lng?: number
    address?: string
  }
  owner_id?: string
  owner_type?: string
}

/**
 * Validate API key for screen registration
 * Uses X-API-Key header or Authorization: Bearer header
 */
function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key') ||
                 request.headers.get('authorization')?.replace('Bearer ', '')

  // In production, this should be validated against a secure store
  // DOOH_API_KEY should be set in environment variables
  const validApiKey = process.env.DOOH_API_KEY || process.env.INTERNAL_SERVICE_TOKEN

  if (!apiKey || !validApiKey) {
    return false
  }

  // Use timing-safe comparison
  if (apiKey.length !== validApiKey.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < apiKey.length; i++) {
    result |= apiKey.charCodeAt(i) ^ validApiKey.charCodeAt(i)
  }

  return result === 0
}

/**
 * Rate limiter for registration endpoint
 */
const registrationAttempts = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 10 // Max 10 registrations
const RATE_WINDOW_MS = 60 * 1000 // Per minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = registrationAttempts.get(ip)

  if (!record || now > record.resetTime) {
    registrationAttempts.set(ip, { count: 1, resetTime: now + RATE_WINDOW_MS })
    return true
  }

  if (record.count >= RATE_LIMIT) {
    return false
  }

  record.count++
  return true
}

/**
 * POST /api/screens/register
 * Register a new screen in the DOOH network
 *
 * Requires X-API-Key header for authentication
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate
    if (!validateApiKey(req)) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or missing API key' },
        { status: 401 }
      )
    }

    // 2. Rate limit check
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] ||
                     req.headers.get('x-real-ip') ||
                     'unknown'

    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { status: 429 }
      )
    }

    // 3. Parse and validate body
    const body: ScreenRegistration = await req.json()

    if (!body.id || !body.name || !body.type) {
      return NextResponse.json(
        { error: 'Missing required fields: id, name, type' },
        { status: 400 }
      )
    }

    if (!VALID_SCREEN_TYPES.includes(body.type)) {
      return NextResponse.json(
        { error: `Invalid screen type. Valid types: ${VALID_SCREEN_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    // 4. Check for duplicate
    if (screens.has(body.id)) {
      return NextResponse.json(
        { error: 'Screen with this ID already exists' },
        { status: 409 }
      )
    }

    // 5. Create screen record
    const screen = {
      id: body.id,
      name: body.name,
      type: body.type,
      location: body.location || {
        city: 'Unknown',
        area: 'Unknown',
        lat: 0,
        lng: 0
      },
      owner_id: body.owner_id || 'partner',
      owner_type: body.owner_type || 'partner',
      status: 'active',
      registered_at: new Date().toISOString(),
      last_heartbeat: null,
      playlist_version: 0,
    }

    // 6. Store screen
    screens.set(body.id, screen)

    logger.info(`[DOOH] Screen registered: ${body.id} (${body.type})`)

    return NextResponse.json({
      success: true,
      screen_id: body.id,
      message: 'Screen registered successfully',
      screen: {
        id: screen.id,
        name: screen.name,
        type: screen.type,
        status: screen.status,
      }
    })

  } catch (error) {
    logger.error('Screen registration error:', error)
    return NextResponse.json(
      { error: 'Failed to register screen' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/screens/register
 * Health check (no auth required)
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'dooh-screen-registry',
    screens_registered: screens.size,
  })
}
