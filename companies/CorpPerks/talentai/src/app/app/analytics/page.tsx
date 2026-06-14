import { NextPage } from 'next';

const AnalyticsPage: NextPage = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Workforce Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">Total Employees</p>
          <p className="text-2xl font-bold">45</p>
          <p className="text-xs text-green-600">+3 this month</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">Avg Tenure</p>
          <p className="text-2xl font-bold">2.4 yrs</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">Turnover Rate</p>
          <p className="text-2xl font-bold text-green-600">8%</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">Productivity Score</p>
          <p className="text-2xl font-bold text-blue-600">87%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold mb-4">Headcount by Department</h2>
          <div className="space-y-3">
            {[
              { dept: 'Engineering', count: 27, color: 'bg-blue-500' },
              { dept: 'Sales', count: 8, color: 'bg-green-500' },
              { dept: 'Marketing', count: 5, color: 'bg-purple-500' },
              { dept: 'Operations', count: 5, color: 'bg-orange-500' },
            ].map(item => (
              <div key={item.dept} className="flex items-center">
                <span className="w-24 text-sm">{item.dept}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-4 mr-3">
                  <div className={`${item.color} h-4 rounded-full`} style={{ width: `${(item.count / 27) * 100}%` }}></div>
                </div>
                <span className="text-sm font-medium">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Trends */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold mb-4">Performance Trends</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm">Q1 2026</span>
              <div className="flex items-center">
                <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                </div>
                <span className="text-sm font-medium">78%</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm">Q2 2026</span>
              <div className="flex items-center">
                <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '82%' }}></div>
                </div>
                <span className="text-sm font-medium">82%</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-sm font-medium">Current</span>
              <div className="flex items-center">
                <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '87%' }}></div>
                </div>
                <span className="text-sm font-medium text-green-600">87%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Attrition Analysis */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold mb-4">Attrition Analysis</h2>
          <div className="text-center py-6">
            <p className="text-4xl font-bold text-green-600">8%</p>
            <p className="text-gray-500 mt-2">Industry average: 15%</p>
            <p className="text-sm text-green-600 mt-1">✓ Below industry benchmark</p>
          </div>
        </div>

        {/* AI Insights */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold mb-4">AI Insights</h2>
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium">📊 Engagement trending up 5%</p>
              <p className="text-xs text-gray-500 mt-1">Based on recent pulse surveys</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <p className="text-sm font-medium">⚠️ Workload concern in Engineering</p>
              <p className="text-xs text-gray-500 mt-1">Consider adding 2 team members</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm font-medium">🎯 Top performers: 23 employees</p>
              <p className="text-xs text-gray-500 mt-1">Ready for promotion review</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
