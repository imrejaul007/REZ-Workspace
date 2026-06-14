import { logger } from '../../logger';
import { useState, useEffect } from 'react'
import auth from '@/lib/auth'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

interface ServiceHealth {
  name: string
  status: string
}

interface SystemStats {
  totalProperties: number
  totalLeads: number
  totalBrokers: number
  totalReferrals: number
}

export default function AdminPage() {
  const user = auth.getUser()
  const [services, setServices] = useState<ServiceHealth[]>([])
  const [stats, setStats] = useState<SystemStats>({ totalProperties: 0, totalLeads: 0, totalBrokers: 0, totalReferrals: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || user.role !== 'admin') return
    fetchData()
  }, [user])

  const fetchData = async () => {
    try {
      // Check service health
      const healthRes = await axios.get(`${API_URL}/health`)
      setServices(healthRes.data.services || [])

      // Fetch stats from all services
      const [properties, leads, brokers, referrals] = await Promise.all([
        axios.get(`${API_URL}/api/v1/properties?limit=1`),
        axios.get(`${API_URL}/api/v1/leads?limit=1`),
        axios.get(`${API_URL}/api/v1/brokers?limit=1`),
        axios.get(`${API_URL}/api/v1/referrals?limit=1`)
      ])

      setStats({
        totalProperties: properties.data.meta?.pagination?.total || 0,
        totalLeads: leads.data.meta?.pagination?.total || 0,
        totalBrokers: brokers.data.meta?.pagination?.total || 0,
        totalReferrals: referrals.data.meta?.pagination?.total || 0
      })
    } catch (err) {
      logger.error('Failed to fetch admin data:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Admin access required</p>
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
            <span className="text-xl font-bold">Admin Panel</span>
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
        {/* Service Status */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Service Health</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {loading ? (
              <p>Loading...</p>
            ) : (
              services.map((service) => (
                <div key={service.name} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    service.status === 'ok' ? 'bg-green-500' :
                    service.status === 'reachable' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`} />
                  <span className="text-sm">{service.name}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* System Stats */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">System Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-primary-600">{loading ? '-' : stats.totalProperties}</p>
              <p className="text-gray-500 text-sm">Properties</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-primary-600">{loading ? '-' : stats.totalLeads}</p>
              <p className="text-gray-500 text-sm">Leads</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-primary-600">{loading ? '-' : stats.totalBrokers}</p>
              <p className="text-gray-500 text-sm">Brokers</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-primary-600">{loading ? '-' : stats.totalReferrals}</p>
              <p className="text-gray-500 text-sm">Referrals</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4">
          <a href="/admin/properties" className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
            <h3 className="font-semibold mb-2">Manage Properties</h3>
            <p className="text-gray-500 text-sm">Add, edit, remove listings</p>
          </a>
          <a href="/admin/brokers" className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
            <h3 className="font-semibold mb-2">Manage Brokers</h3>
            <p className="text-gray-500 text-sm">Verify and manage brokers</p>
          </a>
          <a href="/admin/users" className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
            <h3 className="font-semibold mb-2">Manage Users</h3>
            <p className="text-gray-500 text-sm">User accounts and roles</p>
          </a>
        </div>
      </div>
    </div>
  )
}
