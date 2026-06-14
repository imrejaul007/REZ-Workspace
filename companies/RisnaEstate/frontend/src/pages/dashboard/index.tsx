import { logger } from '../../logger';
import { useState, useEffect } from 'react'
import auth from '@/lib/auth'
import { crmApi, leadApi, referralApi, brokerApi } from '@/lib/api'

interface Stats {
  upcomingVisits: number
  pendingFollowUps: number
  overdueFollowUps: number
  completedThisWeek: number
  totalLeads: number
  hotLeads: number
  pendingEarnings: number
  paidEarnings: number
}

export default function DashboardPage() {
  const user = auth.getUser()
  const [stats, setStats] = useState<Stats>({
    upcomingVisits: 0,
    pendingFollowUps: 0,
    overdueFollowUps: 0,
    completedThisWeek: 0,
    totalLeads: 0,
    hotLeads: 0,
    pendingEarnings: 0,
    paidEarnings: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetchDashboard()
  }, [user])

  const fetchDashboard = async () => {
    try {
      const [crm, leads, referrals] = await Promise.all([
        crmApi.getDashboard(user?.id || ''),
        leadApi.getDashboard(user?.id),
        referralApi.getEarnings(user?.id || '')
      ])

      setStats({
        upcomingVisits: crm.data.upcomingVisits || 0,
        pendingFollowUps: crm.data.pendingFollowUps || 0,
        overdueFollowUps: crm.data.overdueFollowUps || 0,
        completedThisWeek: crm.data.completedThisWeek || 0,
        totalLeads: leads.data.total || 0,
        hotLeads: leads.data.hot || 0,
        pendingEarnings: referrals.data.pending || 0,
        paidEarnings: referrals.data.paid || 0
      })
    } catch (err) {
      logger.error('Failed to fetch dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please <a href="/auth/login" className="text-primary-600">login</a> to view dashboard</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">R</span>
            </div>
            <span className="text-xl font-bold">Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Welcome, {user.name}</span>
            <button onClick={() => auth.logout()} className="text-gray-600 hover:text-red-600">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <p className="text-gray-500 text-sm">Total Leads</p>
            <p className="text-3xl font-bold text-gray-900">{loading ? '-' : stats.totalLeads}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <p className="text-gray-500 text-sm">Hot Leads</p>
            <p className="text-3xl font-bold text-red-600">{loading ? '-' : stats.hotLeads}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <p className="text-gray-500 text-sm">Upcoming Visits</p>
            <p className="text-3xl font-bold text-primary-600">{loading ? '-' : stats.upcomingVisits}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <p className="text-gray-500 text-sm">Pending Follow-ups</p>
            <p className="text-3xl font-bold text-orange-600">{loading ? '-' : stats.pendingFollowUps}</p>
          </div>
        </div>

        {/* Earnings */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl">
            <p className="text-green-100 text-sm">Total Earnings</p>
            <p className="text-3xl font-bold">{formatCurrency(stats.paidEarnings + stats.pendingEarnings)}</p>
            <div className="flex gap-4 mt-2">
              <span className="text-sm">Pending: {formatCurrency(stats.pendingEarnings)}</span>
              <span className="text-sm">Paid: {formatCurrency(stats.paidEarnings)}</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <p className="text-gray-500 text-sm">This Week</p>
            <p className="text-3xl font-bold text-gray-900">{loading ? '-' : stats.completedThisWeek}</p>
            <p className="text-sm text-gray-500">Site visits completed</p>
          </div>
        </div>

        {/* Overdue Alert */}
        {stats.overdueFollowUps > 0 && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-8">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              <span className="font-medium">You have {stats.overdueFollowUps} overdue follow-ups</span>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4">
          <a href="/dashboard/leads" className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
            <h3 className="font-semibold mb-2">Manage Leads</h3>
            <p className="text-gray-500 text-sm">View and qualify leads</p>
          </a>
          <a href="/dashboard/visits" className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
            <h3 className="font-semibold mb-2">Schedule Visits</h3>
            <p className="text-gray-500 text-sm">Plan site visits</p>
          </a>
          <a href="/dashboard/referrals" className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
            <h3 className="font-semibold mb-2">Referrals</h3>
            <p className="text-gray-500 text-sm">Track your referrals</p>
          </a>
        </div>
      </div>
    </div>
  )
}
