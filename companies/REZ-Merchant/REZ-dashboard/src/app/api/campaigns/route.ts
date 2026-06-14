import { NextResponse } from 'next/server'

const campaigns = [
  {
    id: 'camp-1',
    name: 'Weekend Special',
    type: 'promotion',
    status: 'active',
    startDate: '2026-05-01',
    endDate: '2026-05-31',
    budget: 50000,
    spent: 23450,
    impressions: 125000,
    clicks: 3750,
    conversions: 125,
    revenue: 45680
  },
  {
    id: 'camp-2',
    name: 'New Customer Acquisition',
    type: 'acquisition',
    status: 'active',
    startDate: '2026-05-15',
    endDate: '2026-06-15',
    budget: 75000,
    spent: 12300,
    impressions: 89000,
    clicks: 2670,
    conversions: 89,
    revenue: 28450
  },
  {
    id: 'camp-3',
    name: 'Loyalty Rewards Push',
    type: 'retention',
    status: 'active',
    startDate: '2026-05-10',
    endDate: '2026-05-25',
    budget: 25000,
    spent: 18500,
    impressions: 67000,
    clicks: 2010,
    conversions: 312,
    revenue: 52340
  },
  {
    id: 'camp-4',
    name: 'Summer Combo Deal',
    type: 'promotion',
    status: 'scheduled',
    startDate: '2026-06-01',
    endDate: '2026-08-31',
    budget: 100000,
    spent: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    revenue: 0
  },
  {
    id: 'camp-5',
    name: 'Happy Hours',
    type: 'promotion',
    status: 'paused',
    startDate: '2026-04-01',
    endDate: '2026-04-30',
    budget: 30000,
    spent: 28750,
    impressions: 98000,
    clicks: 2940,
    conversions: 178,
    revenue: 42300
  }
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  try {
    let filteredCampaigns = campaigns

    if (status && status !== 'all') {
      filteredCampaigns = campaigns.filter(c => c.status === status)
    }

    const campaignsWithMetrics = filteredCampaigns.map(campaign => ({
      ...campaign,
      ctr: ((campaign.clicks / campaign.impressions) * 100).toFixed(2),
      conversionRate: ((campaign.conversions / campaign.clicks) * 100).toFixed(2),
      roi: campaign.spent > 0 ? (((campaign.revenue - campaign.spent) / campaign.spent) * 100).toFixed(0) : '0',
      cpa: campaign.conversions > 0 ? (campaign.spent / campaign.conversions).toFixed(2) : '0',
      cpm: campaign.impressions > 0 ? ((campaign.spent / campaign.impressions) * 1000).toFixed(2) : '0'
    }))

    const summary = {
      totalCampaigns: campaigns.length,
      active: campaigns.filter(c => c.status === 'active').length,
      scheduled: campaigns.filter(c => c.status === 'scheduled').length,
      paused: campaigns.filter(c => c.status === 'paused').length,
      totalSpend: campaigns.reduce((sum, c) => sum + c.spent, 0),
      totalRevenue: campaigns.reduce((sum, c) => sum + c.revenue, 0),
      overallROI: (() => {
        const totalSpent = campaigns.reduce((sum, c) => sum + c.spent, 0)
        const totalRevenue = campaigns.reduce((sum, c) => sum + c.revenue, 0)
        return totalSpent > 0 ? (((totalRevenue - totalSpent) / totalSpent) * 100).toFixed(1) : '0'
      })()
    }

    return NextResponse.json({
      success: true,
      data: {
        campaigns: campaignsWithMetrics,
        summary
      }
    })
  } catch (error) {
    console.error('Campaigns API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch campaigns' },
      { status: 500 }
    )
  }
}
