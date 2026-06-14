export default function DashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Employees', value: '45', icon: '👥' },
          { label: 'Leave Requests', value: '3', icon: '📋' },
          { label: 'Payroll', value: '₹15L', icon: '💰' },
          { label: 'Announcements', value: '2', icon: '📢' }
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl mb-2">{stat.icon}</div>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: '➕ Add Employee', href: '/recruiter' },
          { label: '📋 Leave Request', href: '/leave' },
          { label: '📊 Performance', href: '/performance' }
        ].map((action) => (
          <a key={action.label} href={action.href} className="bg-blue-600 text-white p-4 rounded-lg text-center">
            {action.label}
          </a>
        ))}
      </div>
    </div>
  );
}
