/**
 * Broker Portal - Lead Detail Page
 */
import { useState } from 'react'
import { useRouter } from 'next/router'
import PortalLayout from '@/layouts/PortalLayout'

export default function LeadDetail() {
  const router = useRouter()
  const { id } = router.query
  const [activeTab, setActiveTab] = useState('overview')
  const [note, setNote] = useState('')

  // Mock lead data
  const lead = {
    id,
    name: 'Rajesh Sharma',
    phone: '+91 98765 43210',
    email: 'rajesh@example.com',
    source: 'Website',
    segment: 'HNI',
    score: 92,
    budget: '₹2Cr - ₹5Cr',
    purchaseTimeline: 'Immediate',
    purpose: 'Investment',
    brokerAssigned: 'Ahmed Properties',
    createdAt: 'Mar 15, 2026',
    lastContact: 'Mar 20, 2026',
    notes: 'Serious investor, prefers luxury properties',
    timeline: [
      { date: 'Mar 20, 2026 3:00 PM', type: 'call', text: 'Called - interested in Dubai Marina properties' },
      { date: 'Mar 18, 2026 10:00 AM', type: 'whatsapp', text: 'Sent property brochure' },
      { date: 'Mar 15, 2026 9:00 AM', type: 'created', text: 'Lead created from website' }
    ]
  }

  const handleAddNote = () => {
    if (!note.trim()) return
    alert('Note added: ' + note)
    setNote('')
  }

  return (
    <PortalLayout portal="broker">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => router.push('/broker/leads')} className="flex items-center text-gray-600 hover:text-gray-900 mb-6">
          ← Back to Leads
        </button>

        {/* Header Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-green-600">{lead.name.charAt(0)}</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold">{lead.name}</h1>
                <p className="text-gray-500">{lead.phone}</p>
                <p className="text-sm text-gray-400">{lead.email}</p>
              </div>
            </div>
            <div className="text-right">
              <div className={`inline-block px-4 py-2 rounded-full font-semibold ${
                lead.score >= 80 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                Score: {lead.score}/100
              </div>
              <p className="text-sm text-gray-500 mt-2">{lead.segment}</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-3 mt-6 pt-6 border-t">
            <button className="flex-1 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600">
              📞 Call
            </button>
            <button className="flex-1 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600">
              💬 WhatsApp
            </button>
            <button className="flex-1 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50">
              📧 Email
            </button>
            <button className="flex-1 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50">
              📅 Schedule Visit
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {['overview', 'timeline', 'notes', 'documents'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg capitalize ${
                activeTab === tab ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold mb-4">Lead Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Segment</span>
                  <span className="font-medium">{lead.segment}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Source</span>
                  <span className="font-medium">{lead.source}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Budget</span>
                  <span className="font-medium">{lead.budget}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Timeline</span>
                  <span className="font-medium">{lead.purchaseTimeline}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Purpose</span>
                  <span className="font-medium">{lead.purpose}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold mb-4">Property Interest</h3>
              <p className="text-gray-500 mb-4">{lead.notes}</p>
              <div className="border-t pt-4">
                <p className="text-sm text-gray-500 mb-2">Interested Properties</p>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-gray-100 rounded-lg text-sm">Marina Heights 2BHK</span>
                  <span className="px-3 py-1 bg-gray-100 rounded-lg text-sm">Palm Jumeirah Villa</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold mb-4">Activity Timeline</h3>
            <div className="space-y-4">
              {lead.timeline.map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    {item.type === 'call' ? '📞' : item.type === 'whatsapp' ? '💬' : '📝'}
                  </div>
                  <div className="flex-1 pb-4 border-b last:border-0">
                    <div className="flex justify-between">
                      <p className="font-medium">{item.text}</p>
                      <span className="text-sm text-gray-400">{item.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t">
              <h4 className="font-medium mb-3">Add Note</h4>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Add a note..."
                  className="flex-1 border rounded-lg px-4 py-2"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                <button onClick={handleAddNote} className="px-6 py-2 bg-green-600 text-white rounded-lg">
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold mb-4">Notes</h3>
            <textarea
              className="w-full border rounded-lg p-4 h-32"
              placeholder="Add notes about this lead..."
            />
            <button className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg">
              Save Notes
            </button>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <span className="text-4xl mb-4 block">📄</span>
            <p className="text-gray-500">No documents uploaded yet</p>
            <button className="mt-4 px-6 py-2 border border-gray-300 rounded-lg">
              Upload Document
            </button>
          </div>
        )}
      </div>
    </PortalLayout>
  )
}
