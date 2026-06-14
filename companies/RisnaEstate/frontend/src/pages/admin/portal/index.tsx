/**
 * Admin Portal - Dashboard
 */
import PortalLayout from '@/layouts/PortalLayout'
import Link from 'next/link'

export default function AdminPortal() {
  return (
    <PortalLayout portal="admin">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <p className="text-gray-500 text-sm">Total Users</p>
          <p className="text-3xl font-bold text-gray-900">1,234</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <p className="text-gray-500 text-sm">Active Brokers</p>
          <p className="text-3xl font-bold text-purple-600">89</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <p className="text-gray-500 text-sm">Properties</p>
          <p className="text-3xl font-bold text-blue-600">567</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <p className="text-gray-500 text-sm">Revenue</p>
          <p className="text-3xl font-bold text-green-600">AED 2.5M</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <Link href="/admin/portal/users" className="bg-purple-600 text-white p-4 rounded-xl text-center hover:bg-purple-700">
          <span className="font-medium">Manage Users</span>
        </Link>
        <Link href="/admin/portal/brokers" className="bg-blue-600 text-white p-4 rounded-xl text-center hover:bg-blue-700">
          <span className="font-medium">Verify Brokers</span>
        </Link>
        <Link href="/admin/portal/analytics" className="bg-green-600 text-white p-4 rounded-xl text-center hover:bg-green-700">
          <span className="font-medium">Analytics</span>
        </Link>
        <Link href="/admin/portal/settings" className="bg-gray-600 text-white p-4 rounded-xl text-center hover:bg-gray-700">
          <span className="font-medium">Settings</span>
        </Link>
      </div>

      {/* Pending Approvals */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h3 className="font-semibold text-lg mb-4">Pending Broker Verifications</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-500 text-sm">
                <th className="pb-3">Broker</th>
                <th className="pb-3">License</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Date</th>
                <th className="pb-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'John Properties LLC', license: 'RERA-12345', date: 'Mar 20, 2026' },
                { name: 'Prime Homes', license: 'RERA-67890', date: 'Mar 19, 2026' },
                { name: 'Elite Realty', license: 'DLD-11111', date: 'Mar 18, 2026' },
              ].map((broker, i) => (
                <tr key={i} className="border-t">
                  <td className="py-4 font-medium">{broker.name}</td>
                  <td className="py-4 text-gray-500">{broker.license}</td>
                  <td className="py-4"><span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs">Pending</span></td>
                  <td className="py-4 text-gray-500">{broker.date}</td>
                  <td className="py-4">
                    <button className="text-green-600 hover:underline text-sm mr-3">Approve</button>
                    <button className="text-red-600 hover:underline text-sm">Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-lg mb-4">System Health</h3>
          <div className="space-y-3">
            {[
              { service: 'Property Service', status: 'Operational', uptime: '99.9%' },
              { service: 'Lead Service', status: 'Operational', uptime: '99.8%' },
              { service: 'Visa Service', status: 'Operational', uptime: '99.9%' },
              { service: 'Gateway', status: 'Operational', uptime: '99.7%' },
            ].map((svc, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-medium">{svc.service}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-green-600">{svc.uptime}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-lg mb-4">Quick Stats</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">New Users Today</span>
              <span className="font-bold">45</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Properties Listed</span>
              <span className="font-bold">12</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Visa Checks</span>
              <span className="font-bold">28</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Referrals Created</span>
              <span className="font-bold">15</span>
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  )
}
