import { NextPage } from 'next';

const OnboardingPage: NextPage = () => {
  const newHires = [
    { id: 1, name: 'Neha Kapoor', role: 'Frontend Dev', startDate: 'Jun 1, 2026', progress: 60 },
    { id: 2, name: 'Arjun Reddy', role: 'DevOps Engineer', startDate: 'Jun 5, 2026', progress: 30 },
    { id: 3, name: 'Meera Joshi', role: 'QA Engineer', startDate: 'Jun 10, 2026', progress: 0 },
  ];

  const checklist = [
    { task: 'Document Submission', completed: true },
    { task: 'IT Setup', completed: true },
    { task: 'Team Introduction', completed: false },
    { task: 'Training Session', completed: false },
    { task: 'Project Assignment', completed: false },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Onboarding</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* New Hires */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="font-semibold">Upcoming Joiners</h2>
          </div>
          <div className="divide-y">
            {newHires.map(hire => (
              <div key={hire.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      {hire.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{hire.name}</p>
                      <p className="text-sm text-gray-500">{hire.role}</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">{hire.startDate}</span>
                </div>
                <div className="flex items-center">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${hire.progress}%` }}></div>
                  </div>
                  <span className="text-sm text-gray-600">{hire.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Checklist Template */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h2 className="font-semibold">Onboarding Checklist</h2>
            <button className="text-blue-600 hover:text-blue-800 text-sm">Edit Template</button>
          </div>
          <div className="p-4">
            {checklist.map((item, idx) => (
              <div key={idx} className="flex items-center py-2">
                <div className={`w-5 h-5 rounded border mr-3 flex items-center justify-center ${item.completed ? 'bg-green-100 border-green-500 text-green-500' : 'border-gray-300'}`}>
                  {item.completed && '✓'}
                </div>
                <span className={item.completed ? 'text-gray-500 line-through' : ''}>{item.task}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">AI Onboarding Assistant</h2>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4 text-xl">🤖</div>
            <div>
              <p className="font-medium mb-2">AI Onboarding Coach</p>
              <p className="text-gray-600 mb-4">
                Hi! I'm your AI onboarding assistant. I can help you:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Guide you through your first week tasks</li>
                <li>Answer company policy questions</li>
                <li>Schedule meet & greets with team members</li>
                <li>Track your onboarding progress</li>
              </ul>
              <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md">Start Chat</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
