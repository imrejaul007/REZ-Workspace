/**
 * Onboarding Flow - Complete Journey
 */

export default function OnboardingPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Onboarding</h1>

      {/* Progress */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-green-600 font-bold">1. Docs</span>
          <span>2. Welcome</span>
          <span>3. Tools</span>
          <span>4. Training</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full">
          <div className="h-2 bg-green-500 rounded-full w-1/4"></div>
        </div>
      </div>

      {/* Checklist */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow">
          <div className="flex justify-between mb-2">
            <span>Documents</span>
            <span className="text-green-600">3/5</span>
          </div>
          <div className="text-gray-500 text-sm">Pending: Photo ID, Address Proof</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="flex justify-between mb-2">
            <span>Setup</span>
            <span className="text-yellow-500">2/8</span>
          </div>
          <div className="text-gray-500 text-sm">Pending: Laptop, Email</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="flex justify-between mb-2">
            <span>Training</span>
            <span className="text-gray-400">0/12</span>
          </div>
          <div className="text-gray-500 text-sm">Start learning path</div>
        </div>
      </div>

      {/* Documents */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h3 className="font-bold mb-4">Documents</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📄</span>
              <div>
                <div className="font-medium">Offer Letter</div>
                <div className="text-sm text-gray-500">HR Admin</div>
              </div>
            </div>
            <span className="text-green-600">✓ Uploaded</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🪪</span>
              <div>
                <div className="font-medium">Aadhaar Card</div>
                <div className="text-sm text-gray-500">Verify via Digilocker</div>
              </div>
            </div>
            <span className="text-yellow-500">Pending</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏦</span>
              <div>
                <div className="font-medium">PAN Card</div>
                <div className="text-sm text-gray-500">Tax purposes</div>
              </div>
            </div>
            <span className="text-yellow-500">Pending</span>
          </div>
        </div>
      </div>

      {/* Welcome Kit */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h3 className="font-bold mb-4">Welcome Kit</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="border p-4 rounded-lg text-center">
            <div className="text-3xl mb-2">📧</div>
            <div>Email Setup</div>
            <div className="text-sm text-gray-500">company@domain</div>
          </div>
          <div className="border p-4 rounded-lg text-center">
            <div className="text-3xl mb-2">💼</div>
            <div>Documents</div>
            <div className="text-sm text-gray-500">HR policies</div>
          </div>
          <div className="border p-4 rounded-lg text-center">
            <div className="text-3xl mb-2">👥</div>
            <div>Team Intro</div>
            <div className="text-sm text-gray-500">Meet your team</div>
          </div>
          <div className="border p-4 rounded-lg text-center">
            <div className="text-3xl mb-2">📱</div>
            <div>App Access</div>
            <div className="text-sm text-gray-500">Download app</div>
          </div>
        </div>
      </div>

      {/* Tools Setup */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h3 className="font-bold mb-4">Tools Access</h3>
        <div className="flex gap-3">
          <div className="flex-1 border p-3 rounded">Google Workspace</div>
          <div className="flex-1 border p-3 rounded">Slack</div>
          <div className="flex-1 border p-3 rounded">HR Portal</div>
          <div className="flex-1 border p-3 rounded">Payroll</div>
        </div>
      </div>

      {/* AI Onboarding */}
      <div className="bg-purple-50 p-6 rounded-lg">
        <h3 className="font-bold mb-2">AI Onboarding Buddy</h3>
        <p className="text-gray-600 mb-4">Your personal AI assistant for onboarding</p>
        <button className="bg-purple-600 text-white px-4 py-2 rounded">Chat with AI →</button>
      </div>
    </div>
  );
}
