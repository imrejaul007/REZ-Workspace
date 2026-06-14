/**
 * Analytics, Bi
 */

export default function AnalyticsPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Analytics</h1>

      {/* Headcount */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-500 mb-1">Headcount</div>
          <div className="text-2xl font-bold">45</div>
          <div className="text-sm text-green-600">+5 this month</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-500 mb-1">Revenue/Employee</div>
          <div className="text-2xl font-bold">₹12L</div>
          <div className="text-sm text-green-600">+18% QoQ</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-500 mb-1">Retention</div>
          <div className="text-2xl font-bold">94%</div>
          <div className="text-sm text-green-600">Above benchmark</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-500 mb-1">Productivity</div>
          <div className="text-2xl font-bold">87</div>
          <div className="text-sm text-yellow-500">AI Score</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-bold mb-4">Headcount Trend</h3>
          <div className="h-64 bg-gray-100 rounded flex items-end justify-around p-4">
            <div className="bg-blue-500 w-8" style={{ height: '40%' }}></div>
            <div className="bg-blue-500 w-8" style={{ height: '50%' }}></div>
            <div className="bg-blue-500 w-8" style={{ height: '60%' }}></div>
            <div className="bg-blue-500 w-8" style={{ height: '75%' }}></div>
            <div className="bg-blue-500 w-8" style={{ height: '90%' }}></div>
          </div>
          <div className="text-center text-sm text-gray-500 mt-2">Jan Feb Mar Apr May Jun</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-bold mb-4">Department Split</h3>
          <div className="space-y-3">
            {[
              { name: 'Engineering', val: 60, num: 27, color: 'bg-blue-500' },
              { name: 'Sales', val: 70, num: 32, color: 'bg-green-500' },
              { name: 'Marketing', val: 40, num: 18, color: 'bg-purple-500' },
              { name: 'Operations', val: 35, num: 15, color: 'bg-orange-500' },
              { name: 'Finance', val: 25, num: 12, color: 'bg-yellow-500' },
              { name: 'HR', val: 15, num: 7, color: 'bg-pink-500' },
            ].map((d) => (
              <div key={d.name} className="flex justify-between items-center">
                <span>{d.name}</span>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-32 bg-gray-200 rounded">
                    <div className={`h-3 ${d.color} rounded`} style={{ width: `${d.val}%` }}></div>
                  </div>
                  <span>{d.num}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-purple-50 p-6 rounded-lg mt-6">
        <h3 className="font-bold mb-2">AI Insights</h3>
        <p className="text-gray-600 mb-4">Real-time workforce intelligence</p>
        <div className="flex gap-3">
          <div className="bg-white p-4 rounded-lg">
            <div className="font-bold">🧠 Predict retention</div>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <div className="font-bold">📊 Forecast trends</div>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <div className="font-bold">🎯 Recommend actions</div>
          </div>
        </div>
      </div>
    </div>
  );
}
