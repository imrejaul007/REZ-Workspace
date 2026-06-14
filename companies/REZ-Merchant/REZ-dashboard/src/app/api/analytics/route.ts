import logger from './utils/logger';

import { NextResponse } from 'next/server'

const MERCHANT_INTELLIGENCE_URL = process.env.MERCHANT_INTELLIGENCE_URL || 'http://localhost:4122'
const ANALYTICS_SERVICE_URL = process.env.REZ_ANALYTICS_SERVICE_URL || 'https://REZ-analytics-orchestrator.rezapp.com'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const storeId = searchParams.get('storeId') || 'default-store'
  const period = searchParams.get('period') || '7d'

  try {
    // Try to connect to REZ Intelligence services
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')

    // Attempt real API calls with fallback to mock data
    try {
      const response = await fetch(
        `${MERCHANT_INTELLIGENCE_URL}/api/analytics/overview?storeId=${storeId}&period=${period}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: AbortSignal.timeout(3000)
        }
      )

      if (response.ok) {
        const data = await response.json()
        return NextResponse.json({
          success: true,
          data,
          source: 'live'
        })
      }
    } catch {
      logger.info('Merchant Intelligence unavailable, using mock analytics')
    }

    // Fallback to deterministic mock data
    const seed = storeId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const random = (min: number, max: number) => {
      const x = Math.sin(seed) * 10000
      return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min
    }

    const days = period === '30d' ? 30 : period === '90d' ? 90 : 7
    const totalRevenue = random(50000, 200000) * days
    const totalOrders = random(200, 800) * days

    const data = {
      metrics: {
        totalRevenue,
        totalOrders,
        avgOrderValue: Math.round(totalRevenue / totalOrders),
        conversionRate: random(2, 8),
        returningCustomers: random(100, 400),
        newCustomers: random(50, 200),
        periodOverPeriod: {
          revenueChange: random(-15, 25),
          ordersChange: random(-10, 20),
          avgOrderValueChange: random(-5, 15)
        }
      },
      funnel: {
        visitors: totalOrders * random(10, 30),
        views: totalOrders * random(5, 15),
        orders: totalOrders,
        completed: Math.round(totalOrders * 0.85)
      },
      topItems: [
        { name: 'Butter Chicken', quantity: random(100, 300), revenue: random(30000, 80000) },
        { name: 'Biryani', quantity: random(80, 250), revenue: random(25000, 70000) },
        { name: 'Naan', quantity: random(200, 500), revenue: random(15000, 40000) }
      ]
    }

    return NextResponse.json({
      success: true,
      data,
      source: 'mock'
    })
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
