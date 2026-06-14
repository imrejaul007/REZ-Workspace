/**
 * Benefits, Insurance, Claims
 */

export default function BenefitsPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Benefits</h1>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-500 mb-1">Health Insurance</div>
          <div className="text-2xl font-bold">₹5L</div>
          <div className="text-sm text-green-600">Covered</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-500 mb-1">Life Insurance</div>
          <div className="text-2xl font-bold">₹10L</div>
          <div className="text-sm text-green-600">Covered</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-500 mb-1">Leave Balance</div>
          <div className="text-2xl font-bold">18</div>
          <div className="text-sm text-gray-500">Days available</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-500 mb-1">Claims</div>
          <div className="text-2xl font-bold text-yellow-500">2</div>
          <div className="text-sm text-gray-500">Pending</div>
        </div>
      </div>

      {/* Health Insurance */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h3 className="font-bold mb-4">Health Insurance</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="border p-4 rounded-lg">
            <div className="text-sm text-gray-500 mb-1">Sum Insured</div>
            <div className="text-xl font-bold">₹5,00,000</div>
          </div>
          <div className="border p-4 rounded-lg">
            <div className="text-sm text-gray-500 mb-1">Premium</div>
            <div className="text-xl font-bold">₹12,000/yr</div>
          </div>
          <div className="border p-4 rounded-lg">
            <div className="text-sm text-gray-500 mb-1">Coverage</div>
            <div className="text-xl font-bold">Self + Family</div>
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <button className="bg-blue-600 text-white px-4 py-2 rounded">File Claim</button>
          <button className="border px-4 py-2 rounded">View Policy</button>
        </div>
      </div>

      {/* Leave Balance */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h3 className="font-bold mb-4">Leave Balance</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">12</div>
            <div className="text-sm text-gray-500">Casual Leave</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">6</div>
            <div className="text-sm text-gray-500">Sick Leave</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">0</div>
            <div className="text-sm text-gray-500">Earned Leave</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">0</div>
            <div className="text-sm text-gray-500">LOP</div>
          </div>
        </div>
      </div>

      {/* Claims */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h3 className="font-bold mb-4">Recent Claims</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏥</span>
              <div>
                <div className="font-medium">Medical Bill</div>
                <div className="text-sm text-gray-500">Submitted: Jan 15</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold">₹15,000</div>
              <span className="text-sm text-yellow-500">Pending</span>
            </div>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💊</span>
              <div>
                <div className="font-medium">Medicine Reimbursement</div>
                <div className="text-sm text-gray-500">Submitted: Jan 10</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold">₹2,500</div>
              <span className="text-sm text-green-600">Approved</span>
            </div>
          </div>
        </div>
      </div>

      {/* Perks */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="font-bold mb-4">Company Perks</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="border p-4 rounded-lg text-center">
            <div className="text-3xl mb-2">🍽️</div>
            <div className="font-medium">Meal Allowance</div>
            <div className="text-sm text-gray-500">₹2,000/mo</div>
          </div>
          <div className="border p-4 rounded-lg text-center">
            <div className="text-3xl mb-2">🏋️</div>
            <div className="font-medium">Gym Subsidy</div>
            <div className="text-sm text-gray-500">₹500/mo</div>
          </div>
          <div className="border p-4 rounded-lg text-center">
            <div className="text-3xl mb-2">📚</div>
            <div className="font-medium">Learning Budget</div>
            <div className="text-sm text-gray-500">₹10,000/yr</div>
          </div>
          <div className="border p-4 rounded-lg text-center">
            <div className="text-3xl mb-2">💻</div>
            <div className="font-medium">Equipment</div>
            <div className="text-sm text-gray-500">One-time ₹50K</div>
          </div>
        </div>
      </div>
    </div>
  );
}
