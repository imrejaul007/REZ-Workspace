// API Service for Hotel Mobile App

const API_BASE = 'http://localhost'

interface Booking {
  id: string
  roomId: string
  checkIn: string
  checkOut: string
  status: string
}

interface RoomState {
  roomId: string
  devices: {
    ac: { power: string; temp: number }
    lights: { power: string; brightness: number }
    curtains: { position: string }
    tv: { power: string }
  }
}

interface Charge {
  type: string
  description: string
  amount: number
  currency: string
}

// Booking Service
export const bookingService = {
  getGuestBookings: async (guestId: string): Promise<Booking[]> => {
    const res = await fetch(`${API_BASE}:4042/guests/${guestId}/bookings`)
    const data = await res.json()
    return data.bookings || []
  },

  createBooking: async (data: any): Promise<Booking> => {
    const res = await fetch(`${API_BASE}:4042/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return res.json()
  }
}

// Room Control Service
export const roomService = {
  getState: async (roomId: string): Promise<RoomState> => {
    const res = await fetch(`${API_BASE}:3814/rooms/${roomId}/state`)
    return res.json()
  },

  setAC: async (roomId: string, settings: any): Promise<any> => {
    const res = await fetch(`${API_BASE}:3814/rooms/${roomId}/ac`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    })
    return res.json()
  },

  setLights: async (roomId: string, settings: any): Promise<any> => {
    const res = await fetch(`${API_BASE}:3814/rooms/${roomId}/lights`, {
      method: 'POST',
      headers: { 'Content-Type': application/json },
      body: JSON.stringify(settings)
    })
    return res.json()
  },

  setCurtains: async (roomId: string, position: string): Promise<any> => {
    const res = await fetch(`${API_BASE}:3814/rooms/${roomId}/curtains`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ position })
    })
    return res.json()
  },

  applyScene: async (roomId: string, sceneId: string): Promise<any> => {
    const res = await fetch(`${API_BASE}:3814/rooms/${roomId}/scenes/${sceneId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })
    return res.json()
  },

  getScenes: async (): Promise<any[]> => {
    const res = await fetch(`${API_BASE}:3814/scenes`)
    const data = await res.json()
    return data.scenes || []
  }
}

// Minibar Service
export const minibarService = {
  getMenu: async (guestId: string): Promise<any[]> => {
    const res = await fetch(`${API_BASE}:3810/guests/${guestId}/menu`)
    const data = await res.json()
    return data.items || []
  },

  order: async (guestId: string, itemId: string, quantity: number): Promise<any> => {
    const res = await fetch(`${API_BASE}:3810/guests/${guestId}/consume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hotelId: 'hotel-1',
        roomId: '101',
        itemId,
        quantity
      })
    })
    return res.json()
  },

  getCharges: async (guestId: string): Promise<{ charges: Charge[]; total: number }> => {
    const res = await fetch(`${API_BASE}:3810/guests/${guestId}/charges`)
    return res.json()
  }
}

// AI Concierge Service
export const conciergeService = {
  chat: async (message: string, guestId: string, sessionId: string): Promise<any> => {
    const res = await fetch(`${API_BASE}:4840/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, guestId, sessionId })
    })
    return res.json()
  },

  getBriefing: async (guestId: string): Promise<any> => {
    const res = await fetch(`${API_BASE}:4703/api/genie/${guestId}/briefing`)
    return res.json()
  }
}

// Payment Service
export const paymentService = {
  charge: async (amount: number, guestId: string, description: string): Promise<any> => {
    const res = await fetch(`${API_BASE}:4001/payments/charge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, currency: 'INR', guestId, description })
    })
    return res.json()
  },

  getWallet: async (guestId: string): Promise<any> => {
    const res = await fetch(`${API_BASE}:4004/wallets/${guestId}`)
    return res.json()
  },

  creditWallet: async (guestId: string, amount: number): Promise<any> => {
    const res = await fetch(`${API_BASE}:4004/wallets/${guestId}/credit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, description: 'Added funds' })
    })
    return res.json()
  }
}

// Loyalty Service
export const loyaltyService = {
  getMember: async (guestId: string): Promise<any> => {
    const res = await fetch(`${API_BASE}:3818/members/${guestId}`)
    return res.json()
  },

  earnPoints: async (guestId: string, points: number, description: string): Promise<any> => {
    const res = await fetch(`${API_BASE}:3818/members/${guestId}/earn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ points, description })
    })
    return res.json()
  }
}