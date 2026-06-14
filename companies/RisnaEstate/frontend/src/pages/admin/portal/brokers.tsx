/**
 * Admin Portal - Broker Verification
 */
import { useState } from 'react'
import PortalLayout from '@/layouts/PortalLayout'

const BROKERS = [
  { id: '1', name: 'Elite Realty', email: 'elite@realty.com', license: 'RERA-12345', status: 'pending', submitted: 'Mar 20, 2026', documents: 5 },
  { id: '2', name: 'Prime Homes', email: 'prime@homes.com', license: 'DLD-67890', status: 'pending', submitted: 'Mar 19, 2026', documents: 3 },
  { id: '3', name: 'Ahmed Properties', email: 'ahmed@props.ae', license: 'BRN-11111', status: 'approved', submitted: 'Mar 15, 2026', documents: 5 },
  { id: '4', name: 'Bangalore Realty', email: 'info@blr-realty.in', license: 'RERA-KA-5678', status: 'approved', submitted: 'Mar 10, 2026', documents: 5 },
]

export default function AdminBrokers() {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending')

  const filtered = BROKERS.filter(b => b.status === activeTab)

  return (
    <PortalLayout portal="admin">
      <h1 className="text-2xl font-bold mb-6">Broker Verification</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['pending', 'approved', 'rejected'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg capitalize ${
              activeTab === tab ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab} ({BROKERS.filter(b => b.status === tab).length})
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-2xl font-bold text-yellow-500">{BROKERS.filter(b => b.status === 'pending').length}</p>
          <p className="text-sm text-gray-500">Pending</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-2xl font-bold text-green-600">{BROKERS.filter(b => b.status === 'approved').length}</p>
          <p className="text-sm text-gray-500">Approved</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-2xl font-bold text-gray-400">{BROKERS.filter(b => b.status === 'rejected').length}</p>
          <p className="text-sm text-gray-500">Rejected</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-2xl font-bold text-purple-600">{BROKERS.length}</p>
          <p className="text-sm text-gray-500">Total Brokers</p>
        </div>
      </div>

      {/* Broker List */}
      <div className="space-y-4">
        {filtered.map((broker) => (
          <div key={broker.id} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">🏢</span>
                </div>
                <div>
                  <h3 className="font-semibold">{broker.name}</h3>
                  <p className="text-sm text-gray-500">{broker.email}</p>
                  <p className="text-sm text-gray-500">License: {broker.license}</p>
                </div>
              </div>
              {activeTab === 'pending' && (
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                    ✓ Approve
                  </button>
                  <button className="px-4 py-2 border border-red-300 text-red-500 rounded-lg hover:bg-red-50">
                    ✗ Reject
                  </button>
                  <button className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                    View Docs
                  </button>
                </div>
              )}
              {activeTab === 'approved' && (
                <div className="flex gap-2">
                  <button className="px-4 py-2 border border-red-300 text-red-500 rounded-lg hover:bg-red-50">
                    Revoke
                  </button>
                </div>
              )}
            </div>
            <div className="mt-4 flex gap-4 text-sm text-gray-500">
              <span>📄 {broker.documents} documents</span>
              <span>📅 Submitted: {broker.submitted}</span>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-500">
          No {activeTab} brokers
        </div>
      )}
    </PortalLayout>
  )
}
