import { NextPage } from 'next';

const TrainingPage: NextPage = () => {
  const courses = [
    { id: 1, name: 'React Fundamentals', category: 'Development', enrolled: 28, completion: 75, duration: '8 hours' },
    { id: 2, name: 'Leadership Essentials', category: 'Management', enrolled: 15, completion: 45, duration: '6 hours' },
    { id: 3, name: 'Data Security', category: 'Compliance', enrolled: 45, completion: 90, duration: '2 hours' },
    { id: 4, name: 'Project Management', category: 'Management', enrolled: 20, completion: 30, duration: '10 hours' },
  ];

  const recommendations = [
    { title: 'TypeScript Advanced', reason: 'Based on your role as Senior Engineer', match: 95 },
    { title: 'System Design', reason: 'Trending in Engineering team', match: 88 },
    { title: 'Agile Methodology', reason: 'Required for upcoming project', match: 82 },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Training & Learning</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">Total Courses</p>
          <p className="text-2xl font-bold">24</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">Enrollments</p>
          <p className="text-2xl font-bold">156</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">Completion Rate</p>
          <p className="text-2xl font-bold text-green-600">72%</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">Learning Hours</p>
          <p className="text-2xl font-bold">1,234</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Courses */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="font-semibold">Active Courses</h2>
          </div>
          <div className="divide-y">
            {courses.map(course => (
              <div key={course.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-medium">{course.name}</h3>
                    <p className="text-sm text-gray-500">{course.category} • {course.duration}</p>
                  </div>
                  <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">{course.enrolled} enrolled</span>
                </div>
                <div className="flex items-center">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${course.completion}%` }}></div>
                  </div>
                  <span className="text-sm text-gray-600">{course.completion}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="font-semibold">AI Recommendations</h2>
          </div>
          <div className="p-4 space-y-3">
            {recommendations.map((rec, idx) => (
              <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium">{rec.title}</p>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">{rec.match}% match</span>
                </div>
                <p className="text-sm text-gray-500">{rec.reason}</p>
                <button className="mt-2 text-blue-600 text-sm hover:text-blue-800">Enroll →</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <button className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700">
          + Create New Course
        </button>
        <button className="border border-gray-300 px-4 py-3 rounded-lg hover:bg-gray-50">
          Import from Library
        </button>
        <button className="border border-gray-300 px-4 py-3 rounded-lg hover:bg-gray-50">
          View Reports
        </button>
      </div>
    </div>
  );
};

export default TrainingPage;
