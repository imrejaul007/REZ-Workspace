import { NextPage } from 'next';

const InterviewPage: NextPage = () => {
  const interviews = [
    { id: 1, candidate: 'Priya Nair', role: 'Data Scientist', date: 'May 30', time: '10:00 AM', type: 'Technical', status: 'scheduled' },
    { id: 2, candidate: 'Rajesh Kumar', role: 'Backend Dev', date: 'May 30', time: '2:00 PM', type: 'HR Round', status: 'completed' },
    { id: 3, candidate: 'Anita Desai', role: 'Product Designer', date: 'May 31', time: '11:00 AM', type: 'Design', status: 'scheduled' },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Interviews</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">Scheduled Today</p>
          <p className="text-2xl font-bold text-blue-600">3</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">This Week</p>
          <p className="text-2xl font-bold">12</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">Avg Duration</p>
          <p className="text-2xl font-bold">45 min</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold">Upcoming Interviews</h2>
        </div>
        <div className="divide-y">
          {interviews.map(interview => (
            <div key={interview.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-4">
                  {interview.candidate.charAt(0)}
                </div>
                <div>
                  <p className="font-medium">{interview.candidate}</p>
                  <p className="text-sm text-gray-500">{interview.role} • {interview.type}</p>
                </div>
              </div>
              <div className="text-right mr-4">
                <p className="font-medium">{interview.date}</p>
                <p className="text-sm text-gray-500">{interview.time}</p>
              </div>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm">Join</button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Interview Scorecards</h2>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Priya Nair - Data Scientist</p>
                <p className="text-sm text-gray-500">Interviewed by: Rahul Sharma</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">4.5</p>
                  <p className="text-xs text-gray-500">Technical</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">4.0</p>
                  <p className="text-xs text-gray-500">Communication</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">4.2</p>
                  <p className="text-xs text-gray-500">Overall</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewPage;
