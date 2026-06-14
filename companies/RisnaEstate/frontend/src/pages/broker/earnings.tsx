/**
 * Broker Portal - Earnings & Commissions
 */
import PortalLayout from '@/layouts/PortalLayout'

export default function BrokerEarnings() {
  const summary = {
    total: 125000,
    pending: 35000,
    paid: 90000,
    thisMonth: 45000
  }

  const transactions = [
    { id: '1', type: 'Commission', property: 'Marina Heights 2BHK', client: 'Rajesh Sharma', amount: 45000, status: 'paid', date: 'Mar 20, 2026' },
    { id: '2', type: 'Commission', property: 'Palm Villa', client: 'Sarah Johnson', amount: 50000, status: 'pending', date: 'Mar 22, 2026' },
    { id: '3', type: 'Referral Bonus', property: '-', client: 'Priya Patel', amount: 5000, status: 'paid', date: 'Mar 15, 2026' },
    { id: '4', type: 'Commission', property: 'Downtown Penthouse', client: 'Amit Kumar', amount: 25000, status: 'pending', date: 'Mar 25, 2026' },
  ]

  return (
    <PortalLayout portal="broker">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Earnings</h1>
        <p className="text-gray-500">Track your commissions and payouts</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-500 mb-1">Total Earnings</p>
          <p className="text-3xl font-bold text-green-600">AED {summary.total.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-500 mb-1">Paid</p>
          <p className="text-3xl font-bold text-gray-900">AED {summary.paid.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-500 mb-1">Pending</p>
          <p className="text-3xl font-bold text-yellow-600">AED {summary.pending.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-500 mb-1">This Month</p>
          <p className="text-3xl font-bold text-blue-600">AED {summary.thisMonth.toLocaleString()}</p>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Transaction History</h2>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr className="text-left text-sm text-gray-500">
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3">Property</th>
              <th className="px-6 py-3">Client</th>
              <th className="px-6 py-3">Amount</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm">{tx.type}</td>
                <td className="px-6 py-4 text-sm">{tx.property}</td>
                <td className="px-6 py-4 text-sm">{tx.client}</td>
                <td className="px-6 py-4 font-semibold text-green-600">AED {tx.amount.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    tx.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {tx.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{tx.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Payout Info */}
      <div className="mt-8 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold mb-1">Next Payout</h3>
            <p className="text-green-100">AED 35,000 will be credited</p>
            <p className="text-sm text-green-100 mt-1">Expected: March 30, 2026</p>
          </div>
          <button className="px-6 py-2 bg-white text-green-600 rounded-lg font-medium hover:bg-gray-100">
            View Bank Details
          </button>
        </div>
      </div>
    </PortalLayout>
  )
}
