import { NextPage } from 'next';
import { useParams } from 'next/navigation';

const JobDetailPage: NextPage = () => {
  const params = useParams();
  const jobId = params?.id as string;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <a href="/app/jobs" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">← Back to Jobs</a>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">Senior Software Engineer</h1>
            <p className="text-gray-600">Acme Corporation • Bangalore, Karnataka</p>
          </div>
          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">Active</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm text-gray-500">Experience</p>
            <p className="font-medium">5-8 years</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Salary</p>
            <p className="font-medium">₹25-35 LPA</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Job Type</p>
            <p className="font-medium">Full-time</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Posted</p>
            <p className="font-medium">2 days ago</p>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="font-semibold mb-3">Description</h2>
          <p className="text-gray-700 mb-4">
            We are looking for a Senior Software Engineer to join our growing team. You will be responsible for designing and implementing scalable solutions.
          </p>
        </div>

        <div className="mb-6">
          <h2 className="font-semibold mb-3">Requirements</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>5+ years of experience in software development</li>
            <li>Strong proficiency in TypeScript, React, Node.js</li>
            <li>Experience with cloud platforms (AWS/GCP)</li>
            <li>Bachelor's degree in Computer Science or equivalent</li>
          </ul>
        </div>

        <div className="flex space-x-4">
          <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">Edit Job</button>
          <button className="border border-gray-300 px-6 py-2 rounded-md hover:bg-gray-50">View Applicants (12)</button>
        </div>
      </div>
    </div>
  );
};

export default JobDetailPage;
