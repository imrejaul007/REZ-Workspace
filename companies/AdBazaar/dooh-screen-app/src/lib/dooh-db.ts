/**
 * DOOH Screen Database Service
 * Supabase integration for screen registry
 *
 * SECURITY: This file uses ANON key for client-side operations.
 * Admin operations (insert, update, delete) must go through API routes.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Use ANON key for client-side - this is safe to expose
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Create client with ANON key (safe for browser)
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)

// Types
export interface DOOHScreen {
  id: string
  name: string
  type: ScreenType
  location: ScreenLocation
  owner_id: string
  owner_email: string
  owner_phone?: string
  status: 'active' | 'inactive' | 'offline' | 'maintenance'
  registered_at: string
  last_heartbeat?: string
  playlist_version: number
  total_impressions: number
  total_scans: number
  earnings_balance: number
  earnings_paid: number
}

export type ScreenType =
  | 'cab_tablet' | 'bus_shelter' | 'bus_interior' | 'train_display' | 'metro_screen'
  | 'flight_seatback' | 'flight_overhead' | 'flight_entrance' | 'flight_lavatory'
  | 'airport_display' | 'airport_kiosk' | 'airport_gate' | 'airport_lounge' | 'airport_billboard'
  | 'restaurant_tv' | 'hotel_lobby' | 'hotel_room'
  | 'mall_kiosk' | 'mall_directory' | 'gym_screen' | 'salon_display'
  | 'office_lobby' | 'office_elevator'
  | 'generic_display'

export interface ScreenLocation {
  city: string
  area?: string
  lat?: number
  lng?: number
  address?: string
}

/**
 * Get screen by ID (read-only, safe for client)
 */
export async function getScreen(id: string): Promise<DOOHScreen | null> {
  const { data } = await supabase
    .from('dooh_screens')
    .select('*')
    .eq('id', id)
    .single()

  return data
}

/**
 * Get all screens for an owner (read-only, safe for client)
 */
export async function getOwnerScreens(ownerId: string): Promise<DOOHScreen[]> {
  const { data } = await supabase
    .from('dooh_screens')
    .select('*')
    .eq('owner_id', ownerId)
    .order('registered_at', { ascending: false })

  return data || []
}

/**
 * Get screen stats (read-only, safe for client)
 */
export async function getScreenStats(screenId: string): Promise<{
  total_impressions: number
  total_scans: number
  earnings_balance: number
} | null> {
  const { data } = await supabase
    .from('dooh_screens')
    .select('total_impressions, total_scans, earnings_balance')
    .eq('id', screenId)
    .single()

  return data
}

/**
 * Get available screens for ad targeting (read-only, safe for client)
 */
export async function getAvailableScreens(filters?: {
  city?: string
  type?: ScreenType
  status?: 'active' | 'offline'
}): Promise<DOOHScreen[]> {
  let query = supabase
    .from('dooh_screens')
    .select('*')
    .eq('status', filters?.status || 'active')

  if (filters?.city) {
    query = query.eq('location->>city', filters.city)
  }
  if (filters?.type) {
    query = query.eq('type', filters.type)
  }

  const { data } = await query
  return data || []
}
