import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const storeId = searchParams.get('storeId') || 'default-store'

  try {
    // Generate real-time metrics for the store
    const baseSeed = storeId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const now = Date.now()

    const random = (seed: number, min: number, max: number) => {
      return Math.floor((Math.sin(seed + now / 10000) * 10000) % 1 * (max - min + 1) + min)
    }

    const activeOrders = random(baseSeed, 5, 25)
    const pendingOrders = random(baseSeed + 1, 2, 10)
    const completedToday = random(baseSeed + 2, 50, 150)
    const revenueToday = random(baseSeed + 3, 10000, 40000)
    const avgWaitTime = random(baseSeed + 4, 5, 25)
    const kitchenLoad = random(baseSeed + 5, 40, 95)

    const metrics = {
      activeOrders,
      pendingOrders,
      completedToday,
      revenueToday,
      avgWaitTime,
      kitchenLoad,
      trends: {
        activeOrders: random(baseSeed + 10, -10, 10),
        pendingOrders: random(baseSeed + 11, -10, 10),
        revenueToday: random(baseSeed + 12, -15, 15),
        avgWaitTime: random(baseSeed + 13, -20, 20),
      },
      kitchenStations: [
        { name: 'Grill', active: random(baseSeed + 20, 1, 8), capacity: 8 },
        { name: 'Fry', active: random(baseSeed + 21, 1, 6), capacity: 6 },
        { name: 'Tandoor', active: random(baseSeed + 22, 0, 4), capacity: 4 },
        { name: 'Cold', active: random(baseSeed + 23, 0, 3), capacity: 3 },
      ],
      recentOrders: [
        { id: 'ORD001', table: 'T5', items: 3, time: '2 min ago', status: 'preparing' },
        { id: 'ORD002', table: 'T12', items: 5, time: '4 min ago', status: 'preparing' },
        { id: 'ORD003', table: 'T3', items: 2, time: '5 min ago', status: 'ready' },
        { id: 'ORD004', table: 'T8', items: 4, time: '7 min ago', status: 'ready' },
        { id: 'ORD005', table: 'T1', items: 6, time: '8 min ago', status: 'ready' },
      ],
      alerts: [] as string[],
      timestamp: new Date().toISOString()
    }

    // Add alerts
    if (kitchenLoad > 80) metrics.alerts.push('Kitchen at high capacity')
    if (avgWaitTime > 20) metrics.alerts.push('High wait time - consider rush pricing')
    if (pendingOrders > 10) metrics.alerts.push('Multiple orders pending')

    return NextResponse.json({
      success: true,
      data: metrics
    })
  } catch (error) {
    console.error('Realtime API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch realtime data' },
      { status: 500 }
    )
  }
}
