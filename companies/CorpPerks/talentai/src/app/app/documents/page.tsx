import { NextPage } from 'next';

const DocumentsPage: NextPage = () => {
  const documents = [
    { id: 1, name: 'Offer Letter', type: 'template', category: 'onboarding', updated: '2026-01-15' },
    { id: 2, name: 'NDA Agreement', type: 'template', category: 'legal', updated: '2026-01-10' },
    { id: 3, name: 'Employment Contract', type: 'template', category: 'legal', updated: '2026-02-01' },
    { id: 4, name: 'Performance Review Form', type: 'template', category: 'performance', updated: '2026-01-20' },
    { id: 5, name: 'Leave Policy', type: 'policy', category: 'hr', updated: '2026-01-05' },
    { id: 6, name: 'Code of Conduct', type: 'policy', category: 'hr', updated: '2026-01-12' },
    { id: 7, name: 'Expense Policy', type: 'policy', category: 'finance', updated: '2026-01-08' },
    { id: 8, name: 'IT Security Policy', type: 'policy', category: 'it', updated: '2026-02-10' },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Documents</h1>
        <div className="flex space-x-3">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Upload Document</button>
          <button className="border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50">Create Template</button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex space-x-4 mb-6">
        <select className="border border-gray-300 rounded-md px-3 py-2">
          <option>All Categories</option>
          <option>Onboarding</option>
          <option>Legal</option>
          <option>Performance</option>
          <option>HR</option>
          <option>Finance</option>
          <option>IT</option>
        </select>
        <select className="border border-gray-300 rounded-md px-3 py-2">
          <option>All Types</option>
          <option>Templates</option>
          <option>Policies</option>
          <option>Contracts</option>
        </select>
        <input type="search" placeholder="Search documents..." className="border border-gray-300 rounded-md px-3 py-2 flex-1" />
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map(doc => (
          <div key={doc.id} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">{doc.type === 'template' ? '📄' : '📋'}</span>
              </div>
              <div className="flex space-x-2">
                <button className="text-gray-400 hover:text-blue-600">Edit</button>
                <button className="text-gray-400 hover:text-gray-600">...</button>
              </div>
            </div>
            <h3 className="font-semibold mb-1">{doc.name}</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">{doc.category}</span>
              <span>Updated: {doc.updated}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Uploads */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Recent Uploads</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Document</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-red-100 rounded flex items-center justify-center mr-3">PDF</div>
                    <span>Signed Offer Letter</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">Priya Sharma</td>
                <td className="px-6 py-4 whitespace-nowrap">Onboarding</td>
                <td className="px-6 py-4 whitespace-nowrap">2026-05-28</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Completed</span>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-red-100 rounded flex items-center justify-center mr-3">PDF</div>
                    <span>NDA Signed</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">Rahul Verma</td>
                <td className="px-6 py-4 whitespace-nowrap">Legal</td>
                <td className="px-6 py-4 whitespace-nowrap">2026-05-27</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Pending Signature</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DocumentsPage;
