export default function IntegrationsPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8">Integrations</h1>

      <div className="grid grid-cols-2 gap-6">
        {/* HOJAI Core */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">HOJAI Core</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span>Memory (4520)</span>
              <span className="text-green-600">Connected</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span>Agents (4550)</span>
              <span className="text-green-600">Connected</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span>Workflows (4560)</span>
              <span className="text-green-600">Connected</span>
            </div>
          </div>
        </div>

        {/* WhatsApp */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">WhatsApp Business</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span>WhatsApp Business API</span>
              <button className="bg-green-600 text-white px-4 py-2 rounded">Connect</button>
            </div>
          </div>
        </div>

        {/* Google Workspace */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Workspace</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span>Google Workspace</span>
              <button className="bg-blue-600 text-white px-4 py-2 rounded">Connect</button>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span>Microsoft 365</span>
              <button className="bg-blue-600 text-white px-4 py-2 rounded">Connect</button>
            </div>
          </div>
        </div>

        {/* HR Tools */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">HR Tools</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span>Tally/Zoho Books</span>
              <button className="bg-blue-600 text-white px-4 py-2 rounded">Connect</button>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span>Campusth</span>
              <button className="bg-blue-600 text-white px-4 py-2 rounded">Connect</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}