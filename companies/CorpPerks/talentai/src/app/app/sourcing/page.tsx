import { NextPage } from 'next';

const SourcingPage: NextPage = () => {
  const candidates = [
    { id: 1, name: 'Amit Patel', role: 'Senior Developer', source: 'LinkedIn', status: 'sourced', match: 92 },
    { id: 2, name: 'Sneha Gupta', role: 'Product Manager', source: 'Referral', status: 'sourced', match: 88 },
    { id: 3, name: 'Vikram Singh', role: 'UX Designer', source: 'Naukri', status: 'contacted', match: 85 },
    { id: 4, name: 'Priya Nair', role: 'Data Scientist', source: 'LinkedIn', status: 'interviewing', match: 90 },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Candidate Sourcing</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">Total Sourced</p>
          <p className="text-2xl font-bold">127</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">This Week</p>
          <p className="text-2xl font-bold">23</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">Conversion Rate</p>
          <p className="text-2xl font-bold text-green-600">34%</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">Avg Response Rate</p>
          <p className="text-2xl font-bold text-blue-600">68%</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="font-semibold">Sourced Candidates</h2>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md">+ Add Candidate</button>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Candidate</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Match</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {candidates.map(candidate => (
              <tr key={candidate.id}>
                <td className="px-6 py-4 whitespace-nowrap">{candidate.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{candidate.role}</td>
                <td className="px-6 py-4 whitespace-nowrap">{candidate.source}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${candidate.match}%` }}></div>
                    </div>
                    <span className="text-sm">{candidate.match}%</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    candidate.status === 'sourced' ? 'bg-blue-100 text-blue-800' :
                    candidate.status === 'contacted' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {candidate.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SourcingPage;
