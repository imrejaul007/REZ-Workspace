export default function RecruiterPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Recruiter AI</h1>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">AI Agents</h2>
          <div className="space-y-3">
            {[
              'Source Candidates',
              'Screen Resumes',
              'Schedule Interviews',
              'Send Offers'
            ].map((agent) => (
              <div key={agent} className="flex items-center justify-between p-4 bg-gray-50 rounded">
                <span>{agent}</span>
                <span className="text-green-600">● Active</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Pipeline</h2>
          {['Applied', 'Screening', 'Interview', 'Offer', 'Hired'].map((stage) => (
            <div key={stage} className="flex justify-between p-3 border-b">
              <span>{stage}</span>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                {Math.floor(Math.random() * 20}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
