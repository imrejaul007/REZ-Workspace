/**
 * Integrations - Connect Apps
 */

export default function IntegrationsPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Integrations</h1>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-500">Connected</div>
          <div className="text-2xl font-bold text-green-600">8</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-500">Available</div>
          <div className="text-2xl font-bold">25+</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-500">Webhooks</div>
          <div className="text-2xl font-bold">3</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-500">Sync Status</div>
          <div className="text-2xl font-bold text-green-600">Live</div>
        </div>
      </div>

      {/* Connected Apps */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h3 className="font-bold mb-4">Connected Apps</h3>
        <div className="grid grid-cols-4 gap-4">
          {[
            { name: 'Google Workspace', icon: '📧', status: 'Connected' },
            { name: 'Slack', icon: '💬', status: 'Connected' },
            { name: 'Zoom', icon: '📹', status: 'Connected' },
            { name: 'GitHub', icon: '💻', status: 'Connected' },
            { name: 'Jira', icon: '📋', status: 'Connected' },
            { name: 'Salesforce', icon: '📊', status: 'Connected' },
            { name: 'QuickBooks', icon: '💰', status: 'Connected' },
            { name: 'Zoho', icon: '☁️', status: 'Connected' },
          ].map((app) => (
            <div key={app.name} className="border p-4 rounded-lg">
              <div className="text-3xl mb-2">{app.icon}</div>
              <div className="font-medium text-sm mb-1">{app.name}</div>
              <span className="text-xs text-green-600">{app.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Popular */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h3 className="font-bold mb-4">Popular Integrations</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { name: 'Microsoft 365', icon: '🪟', desc: 'Calendar, Email, Teams' },
            { name: 'LinkedIn', icon: '💼', desc: 'Recruiting, Profile sync' },
            { name: 'Stripe', icon: '💳', desc: 'Payroll, Invoicing' },
            { name: 'Razorpay', icon: '🇮🇳', desc: 'India payments' },
            { name: 'Docusign', icon: '✍️', desc: 'E-signatures' },
            { name: 'Zendesk', icon: '🎧', desc: 'Support integration' },
          ].map((app) => (
            <div key={app.name} className="border p-4 rounded-lg flex items-center gap-3">
              <div className="text-3xl">{app.icon}</div>
              <div>
                <div className="font-medium">{app.name}</div>
                <div className="text-sm text-gray-500">{app.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Webhooks */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold">Webhooks</h3>
          <button className="bg-blue-600 text-white px-4 py-2 rounded">+ Add Webhook</button>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <div>
              <div className="font-medium">employee.created</div>
              <div className="text-sm text-gray-500">https://api.acme.com/hooks/hr</div>
            </div>
            <span className="text-green-600 text-sm">Active</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <div>
              <div className="font-medium">leave.requested</div>
              <div className="text-sm text-gray-500">https://api.acme.com/hooks/leave</div>
            </div>
            <span className="text-green-600 text-sm">Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
