/**
 * Calendar, Scheduling, Time Off
 */

export default function CalendarPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Calendar</h1>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-500">Today</div>
          <div className="text-2xl font-bold">3</div>
          <div className="text-sm text-gray-500">meetings</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-500">This Week</div>
          <div className="text-2xl font-bold">12</div>
          <div className="text-sm text-gray-500">events</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-500">Available</div>
          <div className="text-2xl font-bold text-green-600">4h</div>
          <div className="text-sm text-gray-500">today</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-500">Upcoming</div>
          <div className="text-2xl font-bold">Jan 2</div>
          <div className="text-sm text-gray-500">team sync</div>
        </div>
      </div>

      {/* Weekly View */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h3 className="font-bold mb-4">This Week</h3>
        <div className="grid grid-cols-5 gap-4">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, i) => (
            <div key={day} className="text-center">
              <div className="font-bold mb-2">{day}</div>
              <div className="space-y-2">
                <div className={`p-2 rounded text-sm ${i === 1 ? 'bg-blue-100' : i === 3 ? 'bg-green-100' : 'bg-gray-100'}`}>
                  {i === 1 ? '10:00 Sprint' : i === 3 ? '2:00 Review' : '9:00 Standup'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Time Off */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold">Time Off</h3>
          <button className="bg-blue-600 text-white px-4 py-2 rounded">Request Leave</button>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="border p-4 rounded-lg text-center">
            <div className="text-3xl font-bold text-blue-600">12</div>
            <div className="text-sm text-gray-500">Casual Leave</div>
          </div>
          <div className="border p-4 rounded-lg text-center">
            <div className="text-3xl font-bold text-green-600">6</div>
            <div className="text-sm text-gray-500">Sick Leave</div>
          </div>
          <div className="border p-4 rounded-lg text-center">
            <div className="text-3xl font-bold text-purple-600">0</div>
            <div className="text-sm text-gray-500">Earned Leave</div>
          </div>
        </div>

        {/* Pending Requests */}
        <div className="border-t pt-4">
          <div className="text-sm text-gray-500 mb-2">Pending Requests</div>
          <div className="flex justify-between items-center p-3 bg-yellow-50 rounded">
            <div>
              <div className="font-medium">Jan 20-22</div>
              <div className="text-sm text-gray-500">Personal leave</div>
            </div>
            <span className="text-yellow-600">Pending Approval</span>
          </div>
        </div>
      </div>

      {/* Team Calendar */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="font-bold mb-4">Team Availability</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full"></div>
              <span>Rahul Kumar</span>
            </div>
            <span className="text-green-600 text-sm">Available</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500 rounded-full"></div>
              <span>Priya Sharma</span>
            </div>
            <span className="text-green-600 text-sm">Available</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-500 rounded-full"></div>
              <span>Amit Patel</span>
            </div>
            <span className="text-orange-600 text-sm">OOO - Tomorrow</span>
          </div>
        </div>
      </div>
    </div>
  );
}
