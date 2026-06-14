import { NextPage } from 'next';
import { useParams } from 'next/navigation';

const CandidateDetailPage: NextPage = () => {
  const params = useParams();
  const candidateId = params?.id as string;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <a href="/app/candidates" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">← Back to Candidates</a>

      <div className="bg-white rounded-lg shadow">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl font-bold text-blue-600 mr-4">PS</div>
            <div>
              <h1 className="text-2xl font-bold">Priya Sharma</h1>
              <p className="text-gray-600">Senior Software Engineer</p>
              <p className="text-sm text-gray-500">Bangalore, Karnataka</p>
            </div>
          </div>
          <div className="flex space-x-3 mt-4">
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">90% Match</span>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">Applied</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Contact */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">priya.sharma@email.com</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">+91 98765 43210</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Applied For</p>
              <p className="font-medium">Senior Software Engineer</p>
            </div>
          </div>

          {/* Experience */}
          <div>
            <h2 className="font-semibold mb-3">Experience</h2>
            <div className="space-y-3">
              <div className="border-l-2 border-blue-500 pl-4">
                <p className="font-medium">Senior Engineer at Tech Corp</p>
                <p className="text-sm text-gray-500">2022 - Present</p>
              </div>
              <div className="border-l-2 border-gray-300 pl-4">
                <p className="font-medium">Software Engineer at StartupXYZ</p>
                <p className="text-sm text-gray-500">2019 - 2022</p>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div>
            <h2 className="font-semibold mb-3">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {['React', 'Node.js', 'TypeScript', 'AWS', 'PostgreSQL', 'Docker'].map(skill => (
                <span key={skill} className="bg-gray-100 px-3 py-1 rounded-full text-sm">{skill}</span>
              ))}
            </div>
          </div>

          {/* AI Score */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h2 className="font-semibold mb-3">AI Candidate Score</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">92%</p>
                <p className="text-sm text-gray-600">Technical</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">88%</p>
                <p className="text-sm text-gray-600">Experience</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">90%</p>
                <p className="text-sm text-gray-600">Culture Fit</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">85%</p>
                <p className="text-sm text-gray-600">Communication</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-4 pt-4 border-t">
            <button className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700">Shortlist</button>
            <button className="border border-gray-300 px-6 py-2 rounded-md hover:bg-gray-50">Schedule Interview</button>
            <button className="text-red-600 px-4 py-2 hover:bg-red-50 rounded-md">Reject</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateDetailPage;
