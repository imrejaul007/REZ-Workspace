'use client'

export default function AdOSDashboard() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">AdOS Dashboard</h1>
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 rounded-xl" style={{ backgroundColor: '#1a1a1a' }}>
          <p className="text-sm text-white/50 mb-1">Active Screens</p>
          <p className="text-2xl font-bold" style={{ color: '#f59e0b' }}>1,247</p>
        </div>
        <div className="p-4 rounded-xl" style={{ backgroundColor: '#1a1a1a' }}>
          <p className="text-sm text-white/50 mb-1">Active Campaigns</p>
          <p className="text-2xl font-bold" style={{ color: '#f59e0b' }}>89</p>
        </div>
        <div className="p-4 rounded-xl" style={{ backgroundColor: '#1a1a1a' }}>
          <p className="text-sm text-white/50 mb-1">Impressions Today</p>
          <p className="text-2xl font-bold">45.2K</p>
        </div>
        <div className="p-4 rounded-xl" style={{ backgroundColor: '#1a1a1a' }}>
          <p className="text-sm text-white/50 mb-1">Revenue</p>
          <p className="text-2xl font-bold" style={{ color: '#22c55e' }}>2.4L</p>
        </div>
      </div>
    </div>
  )
}
