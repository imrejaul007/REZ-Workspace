import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const storeId = searchParams.get('storeId') || 'default-store'
  const period = searchParams.get('period') || '30d'

  try {
    let days = 30
    if (period === '7d') days = 7
    if (period === '90d') days = 90

    // Generate deterministic revenue data based on storeId
    const seed = storeId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const data = []
    const now = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const daySeed = seed + i

      const dayOfWeek = date.getDay()
      const weekendMultiplier = dayOfWeek === 0 || dayOfWeek === 6 ? 1.3 : 1

      const baseRevenue = Math.floor((Math.sin(daySeed) * 10000) % 1 * 30000 + 20000) * weekendMultiplier
      const orders = Math.floor((Math.sin(daySeed + 1) * 10000) % 1 * 150 + 100)

      data.push({
        date: date.toISOString().split('T')[0],
        revenue: baseRevenue,
        orders,
        target: baseRevenue * 1.1
      })
    }

    const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0)
    const totalOrders = data.reduce((sum, d) => sum + d.orders, 0)

    return NextResponse.json({
      success: true,
      data: {
        history: data,
        summary: {
          totalRevenue,
          totalOrders,
          avgOrderValue: Math.round(totalRevenue / totalOrders),
          totalTarget: data.reduce((sum, d) => sum + d.target, 0),
          targetAchievement: ((totalRevenue / data.reduce((sum, d) => sum + d.target, 0)) * 100).toFixed(1)
        }
      }
    })
  } catch (error) {
    console.error('Revenue API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch revenue data' },
      { status: 500 }
    )
  }
}
