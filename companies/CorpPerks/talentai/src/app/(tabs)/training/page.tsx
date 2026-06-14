/**
 * Training, L&D, Courses
 */

export default function TrainingPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Learning</h1>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-500">Enrolled</div>
          <div className="text-2xl font-bold">8</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-500">Completed</div>
          <div className="text-2xl font-bold text-green-600">45</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-500">Hours</div>
          <div className="text-2xl font-bold">120</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-500">Certifications</div>
          <div className="text-2xl font-bold">5</div>
        </div>
      </div>

      {/* My Learning Path */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h3 className="font-bold mb-4">My Learning Path</h3>
        <div className="flex gap-3 mb-4">
          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">Leadership</span>
          <span className="text-gray-400">Product</span>
          <span className="text-gray-400">AI/ML</span>
        </div>
        <div className="h-2 bg-gray-200 rounded">
          <div className="h-2 bg-blue-500 rounded" style={{ width: '30%' }}></div>
        </div>
      </div>

      {/* Courses */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg mb-3 flex items-center justify-center text-4xl">📚</div>
          <div className="font-bold mb-1">Leadership 101</div>
          <div className="text-sm text-gray-500 mb-2">Manager training</div>
          <div className="text-sm text-green-600">✓ Enrolled</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="h-32 bg-gradient-to-br from-green-100 to-teal-100 rounded-lg mb-3 flex items-center justify-center text-4xl">🎯</div>
          <div className="font-bold mb-1">OKR Framework</div>
          <div className="text-sm text-gray-500 mb-2">Goal setting</div>
          <div className="text-sm text-yellow-500">In Progress</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="h-32 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg mb-3 flex items-center justify-center text-4xl">🤖</div>
          <div className="font-bold mb-1">AI Fundamentals</div>
          <div className="text-sm text-gray-500">Gen AI basics</div>
        </div>
      </div>
      <div className="text-center mt-6">
        <button className="text-blue-600">View All Courses →</button>
      </div>
    </div>
  );
}
