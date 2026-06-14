/**
 * Broker Portal - Landing/Dashboard Page
 */
import PortalLayout from '@/layouts/PortalLayout'
import Link from 'next/link'

export default function BrokerPortal() {
  return (
    <PortalLayout portal="broker">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <p className="text-gray-500 text-sm">Total Leads</p>
          <p className="text-3xl font-bold text-gray-900">24</p>
          <p className="text-sm text-green-600">+5 this week</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <p className="text-gray-500 text-sm">Hot Leads</p>
          <p className="text-3xl font-bold text-red-600">8</p>
          <p className="text-sm text-gray-500">High priority</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <p className="text-gray-500 text-sm">Site Visits</p>
          <p className="text-3xl font-bold text-green-600">12</p>
          <p className="text-sm text-gray-500">This month</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <p className="text-gray-500 text-sm">Earnings</p>
          <p className="text-3xl font-bold text-green-600">AED 45,000</p>
          <p className="text-sm text-green-600">+AED 5,000</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Link href="/broker/leads/new" className="bg-green-600 text-white p-6 rounded-xl text-center hover:bg-green-700">
          <span className="text-2xl mb-2 block">+</span>
          <span className="font-medium">Add New Lead</span>
        </Link>
        <Link href="/broker/visits/schedule" className="bg-blue-600 text-white p-6 rounded-xl text-center hover:bg-blue-700">
          <span className="text-2xl mb-2 block">📅</span>
          <span className="font-medium">Schedule Visit</span>
        </Link>
        <Link href="/broker/referrals" className="bg-yellow-500 text-white p-6 rounded-xl text-center hover:bg-yellow-600">
          <span className="text-2xl mb-2 block">💰</span>
          <span className="font-medium">Refer & Earn</span>
        </Link>
      </div>

      {/* Main Content */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Recent Leads */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg">Recent Leads</h3>
            <Link href="/broker/leads" className="text-green-600 text-sm hover:underline">View All</Link>
          </div>
          <div className="space-y-4">
            {[
              { name: 'Rajesh Sharma', segment: 'HNI', score: 92, time: '5 min ago' },
              { name: 'Priya Patel', segment: 'NRI', score: 88, time: '1 hour ago' },
              { name: 'Amit Kumar', segment: 'Investor', score: 75, time: '3 hours ago' },
            ].map((lead, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{lead.name}</p>
                  <p className="text-sm text-gray-500">{lead.segment} • {lead.time}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    lead.score >= 80 ? 'bg-red-100 text-red-700' :
                    lead.score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    Score: {lead.score}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Visits */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg">Upcoming Visits</h3>
            <Link href="/broker/visits" className="text-green-600 text-sm hover:underline">View All</Link>
          </div>
          <div className="space-y-4">
            {[
              { property: 'Marina Heights 2BHK', client: 'Rajesh S.', date: 'Today, 3:00 PM' },
              { property: 'Palm Jumeirah Villa', client: 'Sarah J.', date: 'Tomorrow, 11:00 AM' },
              { property: 'Downtown Penthouse', client: 'Priya P.', date: 'Mar 25, 2:00 PM' },
            ].map((visit, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{visit.property}</p>
                  <p className="text-sm text-gray-500">{visit.client}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{visit.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Performance */}
      <div className="bg-white rounded-xl shadow-sm p-6 mt-8">
        <h3 className="font-semibold text-lg mb-4">Team Performance</h3>
        <div className="grid grid-cols-4 gap-4">
          {[
            { name: 'Ahmed Al Maktoum', role: 'Team Lead', leads: 45, deals: 12 },
            { name: 'Priya Sharma', role: 'Senior Agent', leads: 38, deals: 8 },
            { name: 'Vikram Singh', role: 'Agent', leads: 22, deals: 5 },
            { name: 'Neha Gupta', role: 'Agent', leads: 18, deals: 3 },
          ].map((member, i) => (
            <div key={i} className="p-4 bg-gray-50 rounded-lg text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                <span className="font-bold text-green-700">{member.name.charAt(0)}</span>
              </div>
              <p className="font-medium text-sm">{member.name}</p>
              <p className="text-xs text-gray-500 mb-2">{member.role}</p>
              <div className="flex justify-center gap-4 text-xs">
                <span>{member.leads} leads</span>
                <span>{member.deals} deals</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PortalLayout>
  )
}
