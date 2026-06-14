import { NextPage } from 'next';

const CalendarPage: NextPage = () => {
  const events = [
    { id: 1, title: 'Team Standup', time: '9:00 AM', type: 'meeting', color: 'blue' },
    { id: 2, title: 'Sprint Review', time: '11:00 AM', type: 'meeting', color: 'purple' },
    { id: 3, title: 'Lunch Break', time: '12:30 PM', type: 'break', color: 'green' },
    { id: 4, title: '1:1 with Manager', time: '2:00 PM', type: 'meeting', color: 'orange' },
    { id: 5, title: 'Training Session', time: '4:00 PM', type: 'training', color: 'indigo' },
  ];

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const currentDay = 2; // Wednesday

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Calendar</h1>
        <div className="flex space-x-3">
          <button className="border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50">Sync Calendar</button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">+ New Event</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <button className="text-gray-600 hover:text-gray-900">←</button>
            <h2 className="text-lg font-semibold">May 2026</h2>
            <button className="text-gray-600 hover:text-gray-900">→</button>
          </div>
          <div className="grid grid-cols-7">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-3 text-center text-sm font-medium text-gray-500 border-b">
                {day}
              </div>
            ))}
            {[...Array(7)].map((_, i) => (
              <div key={`empty-${i}`} className="h-24 border-b border-r p-2"></div>
            ))}
            {[...Array(5)].map((_, dayIndex) => (
              <div key={`week-${dayIndex}`} className="contents">
                {[...Array(7)].map((_, dayOfWeek) => {
                  const dayNum = dayIndex * 7 + dayOfWeek + 8;
                  const isToday = dayNum === 29;
                  return (
                    <div
                      key={`day-${dayNum}`}
                      className={`h-24 border-b border-r p-2 ${isToday ? 'bg-blue-50' : ''}`}
                    >
                      <span className={`text-sm ${isToday ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center' : ''}`}>
                        {dayNum <= 31 ? dayNum : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Today - May 29</h2>
          </div>
          <div className="p-4 space-y-3">
            {events.map(event => (
              <div key={event.id} className={`p-3 rounded-lg border-l-4 ${
                event.color === 'blue' ? 'border-blue-500 bg-blue-50' :
                event.color === 'purple' ? 'border-purple-500 bg-purple-50' :
                event.color === 'green' ? 'border-green-500 bg-green-50' :
                event.color === 'orange' ? 'border-orange-500 bg-orange-50' :
                'border-indigo-500 bg-indigo-50'
              }`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{event.title}</p>
                    <p className="text-sm text-gray-600">{event.time}</p>
                  </div>
                  <span className="text-xs bg-white px-2 py-0.5 rounded text-gray-600">{event.type}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Upcoming Events</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
            <p className="text-sm text-gray-500">June 1, 2026</p>
            <p className="font-medium">Monthly Town Hall</p>
            <p className="text-sm text-gray-600">10:00 AM - 12:00 PM</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
            <p className="text-sm text-gray-500">June 5, 2026</p>
            <p className="font-medium">Sprint Planning</p>
            <p className="text-sm text-gray-600">2:00 PM - 4:00 PM</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
            <p className="text-sm text-gray-500">June 10, 2026</p>
            <p className="font-medium">Team Outing</p>
            <p className="text-sm text-gray-600">All Day</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
