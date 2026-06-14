/**
 * Settings
 */

export default function SettingsPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <div className="grid grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="bg-white p-4 rounded-lg shadow h-fit">
          <div className="text-sm text-gray-500 mb-2">Account</div>
          <div className="text-gray-500 mb-2">Company</div>
          <div className="text-gray-500 mb-2">Billing</div>
          <div className="text-gray-500">Security</div>
        </div>

        {/* Content */}
        <div className="col-span-3 space-y-6">
          {/* Profile */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-bold mb-4">My Profile</h3>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl">👤</div>
              <div>
                <div className="font-bold">Priya Sharma</div>
                <div className="text-sm text-gray-500">Senior Engineer</div>
                <button className="text-blue-600 text-sm">Change Photo</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Email</label>
                <input className="w-full border p-2 rounded mt-1" defaultValue="priya.sharma@acme.com" />
              </div>
              <div>
                <label className="text-sm text-gray-500">Phone</label>
                <input className="w-full border p-2 rounded mt-1" defaultValue="+91 98765 43210" />
              </div>
              <div>
                <label className="text-sm text-gray-500">Department</label>
                <input className="w-full border p-2 rounded mt-1" defaultValue="Engineering" />
              </div>
              <div>
                <label className="text-sm text-gray-500">Designation</label>
                <input className="w-full border p-2 rounded mt-1" defaultValue="Senior Engineer" />
              </div>
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded mt-4">Save Changes</button>
          </div>

          {/* Notifications */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-bold mb-4">Notifications</h3>
            <div className="space-y-4">
              {[
                { label: 'Leave requests', desc: 'When someone requests leave' },
                { label: 'Payroll updates', desc: 'Salary, deductions, payslips' },
                { label: 'Team updates', desc: '@mentions, announcements' },
                { label: 'Calendar events', desc: 'Upcoming meetings, deadlines' },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{item.label}</div>
                    <div className="text-sm text-gray-500">{item.desc}</div>
                  </div>
                  <input type="checkbox" className="w-5 h-5" defaultChecked />
                </div>
              ))}
            </div>
          </div>

          {/* Security */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-bold mb-4">Security</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">Password</div>
                  <div className="text-sm text-gray-500">Last changed 30 days ago</div>
                </div>
                <button className="border px-4 py-2 rounded">Change</button>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">Two-Factor Auth</div>
                  <div className="text-sm text-gray-500">SMS + Authenticator</div>
                </div>
                <span className="text-green-600">Enabled</span>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">Active Sessions</div>
                  <div className="text-sm text-gray-500">2 devices</div>
                </div>
                <button className="text-red-600 text-sm">View & Manage</button>
              </div>
            </div>
          </div>

          {/* Connected Apps */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-bold mb-4">Connected Apps</h3>
            <div className="flex flex-wrap gap-2">
              <span className="bg-blue-100 px-3 py-1 rounded">Google</span>
              <span className="bg-gray-100 px-3 py-1 rounded">Slack</span>
              <span className="bg-green-100 px-3 py-1 rounded text-green-700">WhatsApp</span>
              <span className="bg-purple-100 px-3 py-1 rounded">LinkedIn</span>
              <span className="bg-yellow-100 px-3 py-1 rounded text-yellow-700">Calendar</span>
              <button className="border px-3 py-1 rounded text-blue-600">+ Add</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
