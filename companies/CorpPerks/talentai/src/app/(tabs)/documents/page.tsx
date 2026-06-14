/**
 * Documents, E-Signing, Templates
 */

export default function DocumentsPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Documents</h1>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-bold mb-4">My Documents</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
              <span className="text-2xl">📄</span>
              <div className="flex-1">
                <div className="font-medium">Offer Letter</div>
                <div className="text-sm text-gray-500">HR Admin • Dec 2025</div>
              </div>
              <span className="text-green-600">Signed</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
              <span className="text-2xl">📋</span>
              <div className="flex-1">
                <div className="font-medium">NDA Agreement</div>
                <div className="text-sm text-gray-500">Legal • Jan 2026</div>
              </div>
              <span className="text-yellow-500">Pending Signature</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
              <span className="text-2xl">📱</span>
              <div className="flex-1">
                <div className="font-medium">Device Policy</div>
                <div className="text-sm text-gray-500">IT • Jan 2026</div>
              </div>
              <span className="text-yellow-500">Review</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
              <span className="text-2xl">💰</span>
              <div className="flex-1">
                <div className="font-medium">Pay Slips</div>
                <div className="text-sm text-gray-500">Payroll • Monthly</div>
              </div>
              <span className="text-green-600">✓ Auto-generated</span>
            </div>
          </div>
        </div>

        {/* Templates */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-bold mb-4">Templates</h3>
          <div className="space-y-3">
            <div className="p-3 border rounded hover:bg-gray-50 cursor-pointer">
              <div className="font-medium">Offer Letter</div>
              <div className="text-sm text-gray-500">Standard template</div>
            </div>
            <div className="p-3 border rounded hover:bg-gray-50 cursor-pointer">
              <div className="font-medium">Appointment Letter</div>
              <div className="text-sm text-gray-500">For new hires</div>
            </div>
            <div className="p-3 border rounded hover:bg-gray-50 cursor-pointer">
              <div className="font-medium">NDA Template</div>
              <div className="text-sm text-gray-500">Standard NDA</div>
            </div>
            <div className="p-3 border rounded hover:bg-gray-50 cursor-pointer">
              <div className="font-medium">Experience Letter</div>
              <div className="text-sm text-gray-500">For relocations</div>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Actions */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h3 className="font-bold mb-4">Action Required</h3>
        <div className="bg-yellow-50 p-4 rounded-lg mb-3">
          <div className="flex justify-between items-center">
            <div>
              <div className="font-medium">NDA pending signature</div>
              <div className="text-sm text-gray-500">3 documents pending your signature</div>
            </div>
            <button className="text-blue-600 text-sm">Review</button>
          </div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg mb-3">
          <div className="flex justify-between items-center">
            <div>
              <div className="font-medium">Policy update</div>
              <div className="text-sm text-gray-500">New remote work policy</div>
            </div>
            <button className="text-blue-600 text-sm">View</button>
          </div>
        </div>
      </div>

      {/* Company Docs */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="font-bold mb-4">Company Policies</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between mb-2">
              <span className="font-medium">Employee Handbook</span>
              <span className="text-sm text-gray-500">Updated Jan 2026</span>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between">
              <span className="font-medium">Org Chart</span>
              <span className="text-sm text-gray-500">Updated Dec 2025</span>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between">
              <span className="font-medium">Code of Conduct</span>
              <span className="text-sm text-gray-500">Updated Nov 2025</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Assist */}
      <div className="bg-blue-50 p-4 rounded-lg mt-6">
        <div className="font-bold mb-2">AI Document Assistant</div>
        <div className="text-sm text-gray-600 mb-3">Ask anything about policies</div>
        <input
          className="w-full border p-2 rounded"
          placeholder="Ask about policies, templates..."
        />
      </div>
    </div>
  );
}
