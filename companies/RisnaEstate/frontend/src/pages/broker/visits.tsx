/*** Broker Portal - Site Visits Management ***/

import { useState } from 'react'
import PortalLayout from '@/layouts/PortalLayout'

interface Visit {
  id: string;
  property: string;
  client: string;
  date: string;
  time: string;
  status?: string;
  feedback?: string;
  reason?: string;
}

export default function BrokerVisits() {
  const [tab, setTab] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming')

  const visits: Record<string, Visit[]> = {
    upcoming: [
      { id: '1', property: 'Marina Heights 2BHK', client: 'Rajesh Sharma', date: 'Today', time: '3:00 PM', status: 'confirmed' },
      { id: '2', property: 'Palm Jumeirah Villa', client: 'Sarah Johnson', date: 'Tomorrow', time: '11:00 AM', status: 'pending' },
      { id: '3', property: 'Downtown Penthouse', client: 'Priya Patel', date: 'Mar 25', time: '2:00 PM', status: 'confirmed' },
    ],
    completed: [
      { id: '4', property: 'Business Bay 1BHK', client: 'Amit Kumar', date: 'Mar 20', time: '10:00 AM', feedback: 'Interested' },
      { id: '5', property: 'JVC Studio', client: 'Neha Gupta', date: 'Mar 18', time: '4:00 PM', feedback: 'Not interested' },
    ],
    cancelled: [
      { id: '6', property: 'Creek Harbour 3BHK', client: 'Vikram Singh', date: 'Mar 15', time: '11:00 AM', reason: 'Client unavailable' },
    ]
  }

  const currentVisits = visits[tab]

  return (
    <PortalLayout portal="broker">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Site Visits</h1>
          <p className="text-gray-500">{visits.upcoming.length} upcoming</p>
        </div>
        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
          + Schedule Visit
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['upcoming', 'completed', 'cancelled'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg capitalize ${
              tab === t ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Visit List */}
      <div className="space-y-4">
        {currentVisits.map((visit) => (
          <div key={visit.id} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">{visit.property}</h3>
                <p className="text-gray-500">{visit.client}</p>
                <p className="text-sm text-gray-400 mt-1">
                  📅 {visit.date} at {visit.time}
                </p>
              </div>
              <div className="text-right">
                {tab === 'upcoming' && visit.status && (
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    visit.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {visit.status}
                  </span>
                )}
                {tab === 'completed' && visit.feedback && (
                  <span className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700">
                    {visit.feedback}
                  </span>
                )}
                {tab === 'cancelled' && visit.reason && (
                  <span className="px-3 py-1 rounded-full text-sm bg-red-100 text-red-700">
                    {visit.reason}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </PortalLayout>
  )
}
