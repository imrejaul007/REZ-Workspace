'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'

const categoryData = [
  { name: 'Groceries', value: 450, color: '#10B981', icon: '🛒' },
  { name: 'Dining', value: 180, color: '#F59E0B', icon: '🍽️' },
  { name: 'Transportation', value: 220, color: '#3B82F6', icon: '🚗' },
  { name: 'Shopping', value: 320, color: '#EC4899', icon: '🛍️' },
  { name: 'Entertainment', value: 95, color: '#8B5CF6', icon: '🎬' },
  { name: 'Utilities', value: 145, color: '#EAB308', icon: '💡' },
]

const monthlyTrend = [
  { month: 'Jan', amount: 1650 },
  { month: 'Feb', amount: 1480 },
  { month: 'Mar', amount: 1720 },
  { month: 'Apr', amount: 1590 },
  { month: 'May', amount: 1847 },
]

const weeklyData = [
  { day: 'Mon', amount: 45 },
  { day: 'Tue', amount: 78 },
  { day: 'Wed', amount: 120 },
  { day: 'Thu', amount: 56 },
  { day: 'Fri', amount: 189 },
  { day: 'Sat', amount: 234 },
  { day: 'Sun', amount: 67 },
]

export default function CategoryBreakdown() {
  const total = categoryData.reduce((sum, cat) => sum + cat.value, 0)

  const sortedCategories = [...categoryData].sort((a, b) => b.value - a.value)

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; value: number } }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-100">
          <p className="font-medium text-gray-900">{data.name}</p>
          <p className="text-indigo-600 font-semibold">${data.value.toFixed(2)}</p>
          <p className="text-gray-500 text-sm">{((data.value / total) * 100).toFixed(1)}%</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Pie Chart */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">Spending by Category</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center -mt-2">
          <div className="text-center">
            <p className="text-gray-500 text-sm">Total</p>
            <p className="text-2xl font-bold text-gray-900">${total.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Category List */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">Top Categories</h3>
        <div className="space-y-3">
          {sortedCategories.map((category, index) => {
            const percentage = (category.value / total) * 100
            return (
              <div key={category.name} className="flex items-center gap-3">
                <span className="text-xl">{category.icon}</span>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{category.name}</span>
                    <span className="text-sm font-medium text-gray-900">${category.value}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: category.color
                      }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Weekly Spending */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">This Week</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData}>
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Spent']}
              />
              <Bar
                dataKey="amount"
                fill="#6366F1"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">5-Month Trend</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyTrend}>
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                tickFormatter={(value) => `$${value / 1000}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Total']}
              />
              <Bar
                dataKey="amount"
                fill="#8B5CF6"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Merchant Insights */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">Merchant Insights</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-lg">🛒</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Whole Foods</p>
                <p className="text-sm text-gray-500">Most visited this month</p>
              </div>
            </div>
            <span className="text-green-600 font-medium">8 visits</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-lg">☕</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Starbucks</p>
                <p className="text-sm text-gray-500">Daily morning routine</p>
              </div>
            </div>
            <span className="text-yellow-600 font-medium">21 visits</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-lg">🚗</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Shell Gas</p>
                <p className="text-sm text-gray-500">Top transportation expense</p>
              </div>
            </div>
            <span className="text-blue-600 font-medium">4 visits</span>
          </div>
        </div>
      </div>
    </div>
  )
}
