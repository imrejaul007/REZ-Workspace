import { NextPage } from 'next';

const IntegrationsPage: NextPage = () => {
  const integrations = [
    { id: 1, name: 'Slack', category: 'Communication', status: 'connected', icon: '💬' },
    { id: 2, name: 'Google Workspace', category: 'Productivity', status: 'connected', icon: '📧' },
    { id: 3, name: 'Zoom', category: 'Video', status: 'connected', icon: '📹' },
    { id: 4, name: 'Jira', category: 'Project Management', status: 'connected', icon: '📋' },
    { id: 5, name: 'GitHub', category: 'Development', status: 'available', icon: '💻' },
    { id: 6, name: 'Stripe', category: 'Payments', status: 'available', icon: '💳' },
    { id: 7, name: 'Zendesk', category: 'Support', status: 'available', icon: '🎧' },
    { id: 8, name: 'Salesforce', category: 'CRM', status: 'available', icon: '☁️' },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Integrations</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map(integration => (
          <div key={integration.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-3 text-2xl">
                  {integration.icon}
                </div>
                <div>
                  <h3 className="font-semibold">{integration.name}</h3>
                  <p className="text-sm text-gray-500">{integration.category}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-sm ${integration.status === 'connected' ? 'text-green-600' : 'text-gray-500'}`}>
                {integration.status === 'connected' ? '✓ Connected' : 'Available'}
              </span>
              <button className={integration.status === 'connected'
                ? 'text-red-600 hover:text-red-800 text-sm'
                : 'bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700'
              }>
                {integration.status === 'connected' ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">API Access</h2>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-medium">API Key</p>
              <p className="text-sm text-gray-500">Use this key to access TalentOS API</p>
            </div>
            <button className="text-blue-600 hover:text-blue-800">Regenerate</button>
          </div>
          <div className="flex items-center">
            <input type="text" readOnly value="sk_live_xxxxxxxxxxxxx" className="flex-1 border rounded-l-md px-3 py-2 bg-gray-50" />
            <button className="bg-gray-800 text-white px-4 py-2 rounded-r-md hover:bg-gray-900">Copy</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrationsPage;
