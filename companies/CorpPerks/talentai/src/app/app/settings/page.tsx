import { NextPage } from 'next';

const SettingsPage: NextPage = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-4">
            <nav className="space-y-1">
              {['Profile', 'Notifications', 'Security', 'Preferences', 'API Keys', 'Billing'].map((item, idx) => (
                <a
                  key={item}
                  href="#"
                  className={`block px-3 py-2 rounded-md ${idx === 0 ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  {item}
                </a>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Profile Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Profile Settings</h2>
            <div className="flex items-center mb-6">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center text-2xl font-bold text-gray-600">RS</div>
              <button className="ml-4 text-blue-600 hover:text-blue-800">Change Photo</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input type="text" defaultValue="Rahul Sharma" className="w-full border rounded-md px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" defaultValue="rahul@acme.com" className="w-full border rounded-md px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input type="text" defaultValue="Engineering" className="w-full border rounded-md px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <input type="text" defaultValue="HR Manager" className="w-full border rounded-md px-3 py-2" />
              </div>
            </div>
            <button className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">Save Changes</button>
          </div>

          {/* Notification Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Notification Preferences</h2>
            <div className="space-y-4">
              {[
                { label: 'Email notifications', desc: 'Receive updates via email', enabled: true },
                { label: 'Push notifications', desc: 'Browser push notifications', enabled: true },
                { label: 'SMS alerts', desc: 'Important alerts via SMS', enabled: false },
                { label: 'Weekly digest', desc: 'Summary of weekly activity', enabled: true },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                  <button className={`w-12 h-6 rounded-full ${item.enabled ? 'bg-blue-600' : 'bg-gray-300'} relative`}>
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 ${item.enabled ? 'right-0.5' : 'left-0.5'}`}></div>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Security */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Security</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Change Password</p>
                  <p className="text-sm text-gray-500">Last changed 30 days ago</p>
                </div>
                <button className="text-blue-600 hover:text-blue-800">Change</button>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-gray-500">Add an extra layer of security</p>
                </div>
                <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Enabled</span>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Active Sessions</p>
                  <p className="text-sm text-gray-500">2 devices currently logged in</p>
                </div>
                <button className="text-blue-600 hover:text-blue-800">Manage</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
