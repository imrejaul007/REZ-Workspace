'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

type ViewMode = 'month' | 'week' | 'day';

interface CalendarEvent {
  id: string;
  title: string;
  platform: string;
  type: 'campaign' | 'meeting' | 'deadline' | 'review';
  date: Date;
  duration?: number; // in hours
  status: 'scheduled' | 'active' | 'completed' | 'paused';
  budget?: number;
  color: string;
}

// Platform configurations
const PLATFORMS = [
  { id: 'all', name: 'All Platforms', color: '#6B7280' },
  { id: 'rez-app', name: 'ReZ App', color: '#3B82F6' },
  { id: 'dooh', name: 'DOOH', color: '#8B5CF6' },
  { id: 'qr', name: 'QR Campaigns', color: '#10B981' },
  { id: 'whatsapp', name: 'WhatsApp', color: '#059669' },
  { id: 'instagram', name: 'Instagram', color: '#EC4899' },
];

// Mock events
const generateMockEvents = (): CalendarEvent[] => {
  const today = new Date();
  return [
    {
      id: '1',
      title: 'Summer Sale Launch',
      platform: 'ReZ App',
      type: 'campaign',
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 10, 0),
      duration: 24,
      status: 'scheduled',
      budget: 85000,
      color: '#3B82F6',
    },
    {
      id: '2',
      title: 'Monsoon Deals',
      platform: 'DOOH',
      type: 'campaign',
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5, 0, 0),
      duration: 168,
      status: 'scheduled',
      budget: 62000,
      color: '#8B5CF6',
    },
    {
      id: '3',
      title: 'Campaign Performance Review',
      platform: 'All',
      type: 'review',
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3, 14, 0),
      duration: 1,
      status: 'scheduled',
      color: '#6B7280',
    },
    {
      id: '4',
      title: 'Loyalty Rewards QR',
      platform: 'QR Campaigns',
      type: 'campaign',
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0),
      duration: 72,
      status: 'active',
      budget: 28000,
      color: '#10B981',
    },
    {
      id: '5',
      title: 'Creator Collab Deadline',
      platform: 'Instagram',
      type: 'deadline',
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7, 17, 0),
      duration: 0,
      status: 'scheduled',
      color: '#EC4899',
    },
    {
      id: '6',
      title: 'WhatsApp Broadcast',
      platform: 'WhatsApp',
      type: 'campaign',
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 9, 0),
      duration: 4,
      status: 'scheduled',
      budget: 15000,
      color: '#059669',
    },
    {
      id: '7',
      title: 'Budget Allocation Meeting',
      platform: 'All',
      type: 'meeting',
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 4, 11, 0),
      duration: 1,
      status: 'scheduled',
      color: '#6B7280',
    },
    {
      id: '8',
      title: 'Flash Sale Weekend',
      platform: 'ReZ App',
      type: 'campaign',
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 10, 0, 0),
      duration: 48,
      status: 'scheduled',
      budget: 50000,
      color: '#3B82F6',
    },
  ];
};

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [events] = useState<CalendarEvent[]>(generateMockEvents());

  // Filter events by platform
  const filteredEvents = useMemo(() => {
    if (selectedPlatform === 'all') return events;
    return events.filter(
      (e) => e.platform.toLowerCase().replace(' ', '-').includes(selectedPlatform) ||
              e.platform === 'All'
    );
  }, [events, selectedPlatform]);

  // Get calendar days for month view
  const getCalendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const days: (Date | null)[] = [];

    // Add padding for days before the first of the month
    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  }, [currentDate]);

  // Get week days for week view
  const getWeekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  }, [currentDate]);

  // Get events for a specific day
  const getEventsForDay = (date: Date): CalendarEvent[] => {
    return filteredEvents.filter((event) => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Navigation functions
  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Check if a date is today
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Check if a date is selected
  const isSelected = (date: Date): boolean => {
    if (!selectedDate) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  // Format date for display
  const formatDateHeader = (): string => {
    if (viewMode === 'month') {
      return `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    } else if (viewMode === 'week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    }
  };

  // Get hours for day view
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Get events for day view
  const getEventsForHour = (hour: number): CalendarEvent[] => {
    return filteredEvents.filter((event) => {
      const eventHour = new Date(event.date).getHours();
      return (
        new Date(event.date).toDateString() === currentDate.toDateString() &&
        eventHour === hour
      );
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/unified-dashboard" className="text-2xl font-bold">
              Ad<span className="text-amber-500">Bazaar</span>
            </Link>
            <span className="text-gray-400">Calendar</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-amber-500 text-black px-4 py-2 rounded-lg font-medium hover:bg-amber-400 transition-colors"
            >
              + Create Event
            </button>
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Navigation */}
          <div className="flex items-center gap-4">
            <button
              onClick={navigatePrevious}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              ←
            </button>
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
            >
              Today
            </button>
            <button
              onClick={navigateNext}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              →
            </button>
            <h2 className="text-xl font-semibold ml-4">{formatDateHeader()}</h2>
          </div>

          {/* View Mode & Filters */}
          <div className="flex items-center gap-4">
            {/* Platform Filter */}
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="bg-gray-700 text-white px-3 py-2 rounded-lg text-sm"
            >
              {PLATFORMS.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            {/* View Mode Toggle */}
            <div className="flex bg-gray-700 rounded-lg overflow-hidden">
              {(['month', 'week', 'day'] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-4 py-2 text-sm font-medium transition-colors capitalize ${
                    viewMode === mode
                      ? 'bg-amber-500 text-black'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="p-6">
        {/* Month View */}
        {viewMode === 'month' && (
          <div className="bg-gray-800 rounded-xl overflow-hidden">
            {/* Day Headers */}
            <div className="grid grid-cols-7 bg-gray-700">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day} className="p-3 text-center text-sm font-medium text-gray-400">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
              {getCalendarDays.map((day, index) => {
                const dayEvents = day ? getEventsForDay(day) : [];
                return (
                  <div
                    key={index}
                    onClick={() => day && setSelectedDate(day)}
                    className={`min-h-28 border-t border-r border-gray-700 p-2 cursor-pointer transition-colors ${
                      day ? 'hover:bg-gray-700/50' : 'bg-gray-800/50'
                    } ${day && isSelected(day) ? 'bg-amber-500/10' : ''}`}
                  >
                    {day && (
                      <>
                        <div
                          className={`text-sm font-medium mb-1 ${
                            isToday(day) ? 'text-amber-500' : 'text-gray-400'
                          }`}
                        >
                          {day.getDate()}
                        </div>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 3).map((event) => (
                            <div
                              key={event.id}
                              className="text-xs px-2 py-1 rounded truncate"
                              style={{ backgroundColor: event.color + '33', color: event.color }}
                              title={event.title}
                            >
                              {event.title}
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="text-xs text-gray-500">
                              +{dayEvents.length - 3} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Week View */}
        {viewMode === 'week' && (
          <div className="bg-gray-800 rounded-xl overflow-hidden">
            {/* Day Headers */}
            <div className="grid grid-cols-8 bg-gray-700">
              <div className="p-3 text-center text-sm font-medium text-gray-400">Time</div>
              {getWeekDays.map((day) => (
                <div
                  key={day.toISOString()}
                  className={`p-3 text-center ${
                    isToday(day) ? 'bg-amber-500/10' : ''
                  }`}
                >
                  <div className="text-sm font-medium text-gray-400">{DAYS_OF_WEEK[day.getDay()]}</div>
                  <div className={`text-lg font-bold ${isToday(day) ? 'text-amber-500' : ''}`}>
                    {day.getDate()}
                  </div>
                </div>
              ))}
            </div>

            {/* Time Grid */}
            <div className="max-h-96 overflow-y-auto">
              {hours.slice(6, 22).map((hour) => (
                <div key={hour} className="grid grid-cols-8 border-t border-gray-700">
                  <div className="p-2 text-xs text-gray-500 text-right pr-4">
                    {hour.toString().padStart(2, '0')}:00
                  </div>
                  {getWeekDays.map((day) => {
                    const dayEvents = filteredEvents.filter((event) => {
                      const eventDate = new Date(event.date);
                      return (
                        eventDate.toDateString() === day.toDateString() &&
                        eventDate.getHours() === hour
                      );
                    });
                    return (
                      <div
                        key={day.toISOString()}
                        className="border-l border-gray-700 p-1 min-h-12"
                      >
                        {dayEvents.map((event) => (
                          <div
                            key={event.id}
                            className="text-xs px-2 py-1 rounded mb-1"
                            style={{ backgroundColor: event.color, color: 'white' }}
                          >
                            {event.title}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Day View */}
        {viewMode === 'day' && (
          <div className="bg-gray-800 rounded-xl overflow-hidden">
            {/* Time Grid */}
            <div className="max-h-[500px] overflow-y-auto">
              {hours.map((hour) => {
                const dayEvents = getEventsForHour(hour);
                return (
                  <div key={hour} className="flex border-t border-gray-700">
                    <div className="w-20 p-3 text-sm text-gray-500 text-right border-r border-gray-700">
                      {hour.toString().padStart(2, '0')}:00
                    </div>
                    <div className="flex-1 p-2 min-h-16">
                      {dayEvents.map((event) => (
                        <div
                          key={event.id}
                          className="p-3 rounded-lg mb-2"
                          style={{ backgroundColor: event.color }}
                        >
                          <div className="font-medium">{event.title}</div>
                          <div className="text-sm opacity-80">
                            {event.platform} | {event.type}
                            {event.budget && ` | ₹${(event.budget / 1000).toFixed(0)}K`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Upcoming Events Sidebar */}
        <div className="mt-6 bg-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Upcoming Events</h2>
          <div className="space-y-3">
            {filteredEvents
              .filter((e) => new Date(e.date) >= new Date())
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .slice(0, 5)
              .map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-4 p-3 bg-gray-700 rounded-lg"
                >
                  <div
                    className="w-12 h-12 rounded-lg flex flex-col items-center justify-center"
                    style={{ backgroundColor: event.color + '33' }}
                  >
                    <div className="text-lg font-bold" style={{ color: event.color }}>
                      {new Date(event.date).getDate()}
                    </div>
                    <div className="text-xs text-gray-400">
                      {MONTHS[new Date(event.date).getMonth()].slice(0, 3)}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{event.title}</div>
                    <div className="text-sm text-gray-400">
                      {event.platform} | {event.type}
                      {event.budget && ` | ₹${(event.budget / 1000).toFixed(0)}K budget`}
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      event.status === 'active'
                        ? 'bg-green-500/20 text-green-400'
                        : event.status === 'scheduled'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}
                  >
                    {event.status}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-4">
          <span className="text-sm text-gray-400">Platforms:</span>
          {PLATFORMS.slice(1).map((platform) => (
            <div key={platform.id} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: platform.color }}
              />
              <span className="text-sm text-gray-400">{platform.name}</span>
            </div>
          ))}
        </div>
      </main>

      {/* Quick Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Create Event</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Event Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Summer Sale Launch"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Platform
                </label>
                <select className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500">
                  {PLATFORMS.slice(1).map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Event Type
                </label>
                <select className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500">
                  <option value="campaign">Campaign</option>
                  <option value="meeting">Meeting</option>
                  <option value="deadline">Deadline</option>
                  <option value="review">Review</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Time
                </label>
                <input
                  type="time"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Budget (₹)
                </label>
                <input
                  type="number"
                  placeholder="Optional"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    alert('Event created! (Demo)');
                    setShowCreateModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-amber-500 text-black font-medium hover:bg-amber-400 rounded-lg transition-colors"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
