import { NextPage } from 'next';
import { useParams } from 'next/navigation';

const InterviewDetailPage: NextPage = () => {
  const params = useParams();
  const interviewId = params?.id as string;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <a href="/app/interview" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">← Back to Interviews</a>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">PN</div>
              <div>
                <h1 className="text-xl font-bold">Interview: Priya Nair</h1>
                <p className="text-gray-600">Data Scientist Position</p>
              </div>
            </div>
            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">Scheduled</span>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Date & Time</p>
              <p className="font-medium">May 30, 2026 • 10:00 AM</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Interview Type</p>
              <p className="font-medium">Technical Round</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Duration</p>
              <p className="font-medium">60 minutes</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Interviewer</p>
              <p className="font-medium">Rahul Sharma (Tech Lead)</p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="font-semibold mb-3">Topics to Cover</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Python & Machine Learning fundamentals</li>
              <li>SQL and data manipulation</li>
              <li>Model building and evaluation</li>
              <li>System design for ML systems</li>
            </ul>
          </div>

          <div className="flex space-x-4">
            <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">Join Interview</button>
            <button className="border border-gray-300 px-6 py-2 rounded-md hover:bg-gray-50">Reschedule</button>
            <button className="text-red-600 px-4 py-2 hover:bg-red-50 rounded-md">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewDetailPage;
