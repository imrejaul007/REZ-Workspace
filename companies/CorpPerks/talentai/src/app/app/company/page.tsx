import { NextPage } from 'next';

const CompanyPage: NextPage = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Company Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Company Name</label>
              <input type="text" defaultValue="Acme Corp" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Industry</label>
              <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2">
                <option>Technology</option>
                <option>Finance</option>
                <option>Healthcare</option>
                <option>Retail</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Company Size</label>
              <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2">
                <option>1-10</option>
                <option>11-50</option>
                <option>51-200</option>
                <option>201-500</option>
                <option>500+</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Founded Year</label>
              <input type="number" defaultValue="2020" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2" />
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Save Changes</button>
          </div>
        </div>

        {/* Branding */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Branding</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Company Logo</label>
              <div className="mt-1 flex items-center">
                <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">Logo</div>
                <button className="ml-4 text-blue-600 hover:text-blue-800">Upload New</button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Primary Color</label>
              <div className="flex items-center mt-1">
                <input type="color" defaultValue="#3B82F6" className="w-12 h-10 rounded border" />
                <span className="ml-3 text-gray-600">#3B82F6</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Website URL</label>
              <input type="url" placeholder="https://example.com" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2" />
            </div>
          </div>
        </div>

        {/* Locations */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Office Locations</h2>
            <button className="text-blue-600 hover:text-blue-800">+ Add Location</button>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Bangalore HQ</p>
                <p className="text-sm text-gray-500">MG Road, Bangalore, Karnataka</p>
              </div>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Primary</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Mumbai Office</p>
                <p className="text-sm text-gray-500">Bandra Kurla Complex, Mumbai</p>
              </div>
              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">Secondary</span>
            </div>
          </div>
        </div>

        {/* Departments */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Departments</h2>
            <button className="text-blue-600 hover:text-blue-800">+ Add</button>
          </div>
          <div className="space-y-2">
            {['Engineering', 'Sales', 'Marketing', 'Operations', 'Finance', 'HR'].map(dept => (
              <div key={dept} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span>{dept}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">{Math.floor(Math.random() * 15) + 1} employees</span>
                  <button className="text-gray-400 hover:text-gray-600">Edit</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Policies */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Company Policies</h2>
            <button className="text-blue-600 hover:text-blue-800">+ Add Policy</button>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-blue-600">⏰</span>
                </div>
                <div>
                  <p className="font-medium">Work Hours</p>
                  <p className="text-sm text-gray-500">9:00 AM - 6:00 PM</p>
                </div>
              </div>
              <button className="text-gray-400 hover:text-gray-600">Edit</button>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-green-600">🏠</span>
                </div>
                <div>
                  <p className="font-medium">WFH Policy</p>
                  <p className="text-sm text-gray-500">2 days/week allowed</p>
                </div>
              </div>
              <button className="text-gray-400 hover:text-gray-600">Edit</button>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-purple-600">🎓</span>
                </div>
                <div>
                  <p className="font-medium">Learning Budget</p>
                  <p className="text-sm text-gray-500">₹10,000/year per employee</p>
                </div>
              </div>
              <button className="text-gray-400 hover:text-gray-600">Edit</button>
            </div>
          </div>
        </div>

        {/* Integrations */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Integrations</h2>
            <button className="text-blue-600 hover:text-blue-800">+ Add</button>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3 text-xl">📊</div>
                <div>
                  <p className="font-medium">Analytics Dashboard</p>
                  <p className="text-sm text-gray-500">Connected</p>
                </div>
              </div>
              <span className="text-green-600">✓</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3 text-xl">💬</div>
                <div>
                  <p className="font-medium">Slack</p>
                  <p className="text-sm text-gray-500">Not connected</p>
                </div>
              </div>
              <button className="text-blue-600 hover:text-blue-800">Connect</button>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3 text-xl">📅</div>
                <div>
                  <p className="font-medium">Google Calendar</p>
                  <p className="text-sm text-gray-500">Connected</p>
                </div>
              </div>
              <span className="text-green-600">✓</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyPage;
