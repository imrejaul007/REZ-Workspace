import { NextPage } from 'next';

const HelpdeskPage: NextPage = () => {
  const tickets = [
    { id: 'TK001', subject: 'Laptop not starting', category: 'IT', priority: 'high', status: 'open', requester: 'Priya Sharma' },
    { id: 'TK002', subject: 'VPN access issue', category: 'IT', priority: 'medium', status: 'in_progress', requester: 'Rahul Verma' },
    { id: 'TK003', subject: 'Leave approval', category: 'HR', priority: 'low', status: 'resolved', requester: 'Anita Patel' },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Helpdesk</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">Open Tickets</p>
          <p className="text-2xl font-bold text-orange-600">12</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">Avg Response Time</p>
          <p className="text-2xl font-bold">2.5 hrs</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">Resolved Today</p>
          <p className="text-2xl font-bold text-green-600">8</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">Satisfaction</p>
          <p className="text-2xl font-bold text-blue-600">4.6/5</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tickets List */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h2 className="font-semibold">Recent Tickets</h2>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm">+ New Ticket</button>
          </div>
          <div className="divide-y">
            {tickets.map(ticket => (
              <div key={ticket.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{ticket.subject}</p>
                    <p className="text-sm text-gray-500">{ticket.id} • {ticket.requester}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    ticket.status === 'open' ? 'bg-red-100 text-red-800' :
                    ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center mt-2 space-x-2">
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{ticket.category}</span>
                  <span className={`text-xs ${
                    ticket.priority === 'high' ? 'text-red-600' :
                    ticket.priority === 'medium' ? 'text-yellow-600' :
                    'text-gray-600'
                  }`}>
                    {ticket.priority} priority
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Assistant */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="font-semibold">AI Helpdesk</h2>
          </div>
          <div className="p-4">
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <p className="text-sm">Hi! I'm your AI helpdesk assistant. I can help with:</p>
              <ul className="mt-2 text-sm text-gray-600 space-y-1">
                <li>• IT issues & troubleshooting</li>
                <li>• HR policy questions</li>
                <li>• Leave & attendance</li>
                <li>• General inquiries</li>
              </ul>
            </div>
            <input type="text" placeholder="Ask me anything..." className="w-full border rounded-lg px-3 py-2 mb-3" />
            <button className="w-full bg-blue-600 text-white py-2 rounded-lg">Send</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpdeskPage;
