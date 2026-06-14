/**
 * Broker Portal - Leads Management
 */
import { useState } from 'react'
import PortalLayout from '@/layouts/PortalLayout'
import auth from '@/lib/auth'

export default function BrokerLeads() {
  const user = auth.getUser()
  const [filter, setFilter] = useState('all')
  const [showNewLead, setShowNewLead] = useState(false)
  const [newLead, setNewLead] = useState({ name: '', phone: '', email: '', source: 'website', budget: '' })

  const leads = [
    { id: '1', name: 'Rajesh Sharma', phone: '+91 98765 43210', source: 'Website', budget: '₹50L - 1Cr', score: 92, status: 'hot', lastContact: '2 hours ago' },
    { id: '2', name: 'Priya Patel', phone: '+91 98765 43211', source: 'Referral', budget: '₹1Cr+', score: 88, status: 'qualified', lastContact: '1 day ago' },
    { id: '3', name: 'Amit Kumar', phone: '+91 98765 43212', source: 'WhatsApp', budget: '₹30L - 50L', score: 65, status: 'warm', lastContact: '3 days ago' },
    { id: '4', name: 'Sarah Johnson', phone: '+971 50 123 4567', source: 'NRI', budget: 'AED 5M+', score: 78, status: 'warm', lastContact: '5 days ago' },
  ]

  const filteredLeads = filter === 'all' ? leads : leads.filter(l => l.status === filter)

  const handleCreateLead = () => {
    // API call to create lead
    setShowNewLead(false)
    setNewLead({ name: '', phone: '', email: '', source: 'website', budget: '' })
  }

  return (
    <PortalLayout portal="broker">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-gray-500">{filteredLeads.length} leads</p>
        </div>
        <button
          onClick={() => setShowNewLead(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          + Add Lead
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {['all', 'hot', 'qualified', 'warm', 'cold'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg capitalize ${
              filter === f ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* New Lead Modal */}
      {showNewLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Add New Lead</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  className="w-full border rounded-lg px-4 py-2"
                  value={newLead.name}
                  onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  className="w-full border rounded-lg px-4 py-2"
                  value={newLead.phone}
                  onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                <select
                  className="w-full border rounded-lg px-4 py-2"
                  value={newLead.source}
                  onChange={(e) => setNewLead({ ...newLead, source: e.target.value })}
                >
                  <option value="website">Website</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="referral">Referral</option>
                  <option value="ad">Advertisement</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowNewLead(false)}
                  className="flex-1 border py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateLead}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                >
                  Add Lead
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leads Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr className="text-left text-sm text-gray-500">
              <th className="px-6 py-3">Lead</th>
              <th className="px-6 py-3">Source</th>
              <th className="px-6 py-3">Budget</th>
              <th className="px-6 py-3">Score</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Last Contact</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredLeads.map((lead) => (
              <tr key={lead.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <p className="font-medium">{lead.name}</p>
                  <p className="text-sm text-gray-500">{lead.phone}</p>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{lead.source}</td>
                <td className="px-6 py-4 text-sm">{lead.budget}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    lead.score >= 80 ? 'bg-red-100 text-red-700' :
                    lead.score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {lead.score}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs capitalize ${
                    lead.status === 'hot' ? 'bg-red-100 text-red-700' :
                    lead.status === 'qualified' ? 'bg-green-100 text-green-700' :
                    lead.status === 'warm' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {lead.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{lead.lastContact}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button className="text-green-600 hover:underline text-sm">Call</button>
                    <button className="text-blue-600 hover:underline text-sm">WhatsApp</button>
                    <button className="text-gray-600 hover:underline text-sm">Details</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PortalLayout>
  )
}
