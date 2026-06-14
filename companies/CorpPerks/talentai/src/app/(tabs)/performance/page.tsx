/**
 * Performance Reviews, OKRs, Feedback
 */

export default function PerformancePage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Performance</h1>

      {/* Cycle Status */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-500 mb-1">Current Cycle</div>
          <div className="text-2xl font-bold">Q1 2026</div>
          <div className="text-sm text-green-600">Active</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-500 mb-1">Completion</div>
          <div className="text-2xl font-bold">67%</div>
          <div className="text-sm text-gray-500">28/45 reviews done</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-500 mb-1">Avg Rating</div>
          <div className="text-2xl font-bold">3.8</div>
          <div className="text-sm text-yellow-500">Pending: 3.9 target</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-500 mb-1">Top Performers</div>
          <div className="text-2xl font-bold text-green-600">12</div>
          <div className="text-sm text-gray-500">Eligible for bonus</div>
        </div>
      </div>

      {/* Reviews */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-bold mb-4">My Reviews</h3>
          <div className="space-y-3">
            <div className="border-b pb-3">
              <div className="flex justify-between">
                <span>Q4 2025 Review</span>
                <span className="text-green-600">★★★★★ 4.2</span>
              </div>
              <div className="text-sm text-gray-500">Dec 2025 • Manager: Priya</div>
            </div>
            <div className="border-b pb-3">
              <div className="flex justify-between">
                <span>Self Review</span>
                <span className="text-yellow-500">In Progress</span>
              </div>
              <div className="text-sm text-gray-500">Due: Jan 15</div>
            </div>
            <div>
              <div className="flex justify-between">
                <span>Q1 2026 Mid-Year</span>
                <span className="text-gray-400">Pending</span>
              </div>
              <div className="text-sm text-gray-500">Mar 2026</div>
            </div>
          </div>
        </div>

        {/* OKRs */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-bold mb-4">My OKRs</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span>Launch Feature X</span>
                <span className="text-green-600">75%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded">
                <div className="h-2 bg-green-500 rounded" style={{ width: '75%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span>Reduce Churn</span>
                <span className="text-yellow-500">45%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded">
                <div className="h-2 bg-yellow-400 rounded" style={{ width: '45%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span>User Interviews</span>
                <span className="text-gray-400">20/30</span>
              </div>
              <div className="h-2 bg-gray-200 rounded">
                <div className="h-2 bg-gray-400 rounded" style={{ width: '65%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Performance */}
      <div className="bg-white p-6 rounded-lg shadow mt-6">
        <h3 className="font-bold mb-4">Team Overview</h3>
        <table className="w-full">
          <thead>
            <tr className="text-left text-gray-500 text-sm">
              <th className="pb-2">Employee</th>
              <th className="pb-2">Role</th>
              <th className="pb-2">Last Review</th>
              <th className="pb-2">Rating</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            <tr className="border-t">
              <td className="py-3">Rahul Kumar</td>
              <td>Senior Dev</td>
              <td>Dec 15</td>
              <td className="text-green-600">★★★★★ 4.5</td>
            </tr>
            <tr className="border-t">
              <td className="py-3">Priya Sharma</td>
              <td>Tech Lead</td>
              <td>Dec 20</td>
              <td className="text-green-600">★★★★½ 4.2</td>
            </tr>
            <tr className="border-t">
              <td className="py-3">Amit Patel</td>
              <td>Product Mgr</td>
              <td>Jan 5</td>
              <td className="text-yellow-500">★★★½ 3.5</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* AI Insights */}
      <div className="bg-purple-50 p-6 rounded-lg mt-6">
        <h3 className="font-bold mb-2">AI Insights</h3>
        <p className="text-gray-600 mb-4">Performance trends, predictions, recommendations</p>
        <button className="bg-purple-600 text-white px-4 py-2 rounded">Talk to Performance AI →</button>
      </div>
    </div>
  );
}
