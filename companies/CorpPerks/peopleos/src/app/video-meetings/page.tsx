'use client';

import { useState } from 'react';

interface Meeting {
  id: string;
  title: string;
  host: { name: string; avatar: string };
  participants: { name: string; avatar: string; status: 'joined' | 'invited' | 'declined' }[];
  date: string;
  time: string;
  duration: number;
  status: 'upcoming' | 'live' | 'completed' | 'cancelled';
  type: '1on1' | 'team' | 'all-hands' | 'interview';
  recording?: boolean;
  recordingUrl?: string;
}

interface Room {
  id: string;
  name: string;
  type: 'personal' | 'conference' | 'training';
  capacity: number;
  isActive: boolean;
  currentParticipants: number;
}

const mockMeetings: Meeting[] = [
  {
    id: '1',
    title: 'Weekly Team Standup',
    host: { name: 'Priya Sharma', avatar: 'PS' },
    participants: [
      { name: 'Rahul Verma', avatar: 'RV', status: 'joined' },
      { name: 'Sneha Patel', avatar: 'SP', status: 'joined' },
      { name: 'Amit Kumar', avatar: 'AK', status: 'invited' },
    ],
    date: '2026-05-30',
    time: '10:00',
    duration: 30,
    status: 'live',
    type: 'team',
    recording: true,
  },
  {
    id: '2',
    title: 'Q2 Performance Review - Rahul',
    host: { name: 'Sneha Patel', avatar: 'SP' },
    participants: [
      { name: 'Rahul Verma', avatar: 'RV', status: 'invited' },
    ],
    date: '2026-05-30',
    time: '14:00',
    duration: 60,
    status: 'upcoming',
    type: '1on1',
  },
  {
    id: '3',
    title: 'Product Demo - New Features',
    host: { name: 'Amit Kumar', avatar: 'AK' },
    participants: [
      { name: 'Priya Sharma', avatar: 'PS', status: 'joined' },
      { name: 'Rahul Verma', avatar: 'RV', status: 'joined' },
      { name: 'Neha Singh', avatar: 'NS', status: 'invited' },
      { name: 'Vikram Rao', avatar: 'VR', status: 'invited' },
    ],
    date: '2026-05-30',
    time: '16:00',
    duration: 45,
    status: 'upcoming',
    type: 'team',
  },
  {
    id: '4',
    title: 'Engineering All Hands',
    host: { name: 'Vikram Rao', avatar: 'VR' },
    participants: [
      { name: 'Priya Sharma', avatar: 'PS', status: 'joined' },
      { name: 'Rahul Verma', avatar: 'RV', status: 'joined' },
    ],
    date: '2026-05-29',
    time: '11:00',
    duration: 60,
    status: 'completed',
    type: 'all-hands',
    recording: true,
    recordingUrl: '#',
  },
  {
    id: '5',
    title: 'Frontend Developer Interview',
    host: { name: 'Priya Sharma', avatar: 'PS' },
    participants: [
      { name: 'John Doe', avatar: 'JD', status: 'invited' },
    ],
    date: '2026-05-31',
    time: '10:30',
    duration: 45,
    status: 'upcoming',
    type: 'interview',
  },
];

const mockRooms: Room[] = [
  { id: '1', name: 'Team Alpha', type: 'conference', capacity: 10, isActive: true, currentParticipants: 4 },
  { id: '2', name: 'Training Room', type: 'training', capacity: 25, isActive: true, currentParticipants: 12 },
  { id: '3', name: 'Priya Personal', type: 'personal', capacity: 5, isActive: false, currentParticipants: 0 },
  { id: '4', name: 'Executive Suite', type: 'conference', capacity: 8, isActive: false, currentParticipants: 0 },
];

const upcomingSlots = [
  { time: '09:00', available: true },
  { time: '09:30', available: false },
  { time: '10:00', available: true },
  { time: '10:30', available: true },
  { time: '11:00', available: false },
  { time: '11:30', available: true },
  { time: '12:00', available: true },
  { time: '12:30', available: false },
  { time: '13:00', available: true },
  { time: '13:30', available: true },
  { time: '14:00', available: false },
  { time: '14:30', available: true },
];

export default function VideoMeetingsPage() {
  const [activeTab, setActiveTab] = useState<'meetings' | 'rooms' | 'schedule' | 'recordings'>('meetings');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [meetings, setMeetings] = useState<Meeting[]>(mockMeetings);
  const [selectedDate, setSelectedDate] = useState('2026-05-30');
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    type: 'team' as Meeting['type'],
    date: selectedDate,
    time: '10:00',
    duration: 30,
  });

  const stats = {
    todayMeetings: meetings.filter((m) => m.date === '2026-05-30').length,
    liveNow: meetings.filter((m) => m.status === 'live').length,
    upcomingToday: meetings.filter((m) => m.status === 'upcoming' && m.date === '2026-05-30').length,
    totalHours: meetings.reduce((acc, m) => acc + m.duration, 0),
  };

  const filteredMeetings = meetings.filter((m) => {
    if (activeTab === 'meetings') return m.date === '2026-05-30';
    if (activeTab === 'recordings') return m.status === 'completed' && m.recording;
    return true;
  });

  const getStatusBadge = (status: Meeting['status']) => {
    const styles: Record<string, { bg: string; color: string; label: string; dot?: string }> = {
      upcoming: { bg: '#e0e7ff', color: '#4338ca', label: 'Upcoming', dot: '#4338ca' },
      live: { bg: '#fee2e2', color: '#dc2626', label: 'Live Now', dot: '#dc2626' },
      completed: { bg: '#dcfce7', color: '#15803d', label: 'Completed', dot: '#15803d' },
      cancelled: { bg: '#f3f4f6', color: '#6b7280', label: 'Cancelled' },
    };
    const s = styles[status] || styles.upcoming;
    return (
      <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: s.bg, color: s.color, display: 'flex', alignItems: 'center', gap: 6 }}>
        {s.dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot }} />}
        {s.label}
      </span>
    );
  };

  const getMeetingTypeBadge = (type: Meeting['type']) => {
    const badges: Record<string, { bg: string; color: string; icon: string }> = {
      '1on1': { bg: '#fce7f3', color: '#be185d', icon: '👥' },
      team: { bg: '#dbeafe', color: '#1d4ed8', icon: '👥' },
      'all-hands': { bg: '#fef3c7', color: '#b45309', icon: '🎙️' },
      interview: { bg: '#d1fae5', color: '#047857', icon: '💼' },
    };
    const b = badges[type] || badges.team;
    return (
      <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 500, background: b.bg, color: b.color }}>
        {b.icon} {type}
      </span>
    );
  };

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span>Video Meetings</span>
            <span style={{ fontSize: 14, padding: '4px 12px', background: '#3b82f6', color: 'white', borderRadius: 20, fontWeight: 500 }}>HD Quality</span>
          </h1>
          <p style={{ color: '#6b7280', margin: '8px 0 0' }}>Schedule, join, and manage video conferences</p>
        </div>
        <button
          onClick={() => setShowScheduleModal(true)}
          style={{ padding: '12px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <span>+</span> Schedule Meeting
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ background: 'white', padding: 20, borderRadius: 12, textAlign: 'center', borderLeft: '4px solid #3b82f6' }}>
          <p style={{ fontSize: 32, fontWeight: 700, color: '#3b82f6', margin: 0 }}>{stats.todayMeetings}</p>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '8px 0 0' }}>Today's Meetings</p>
        </div>
        <div style={{ background: 'white', padding: 20, borderRadius: 12, textAlign: 'center', borderLeft: '4px solid #dc2626' }}>
          <p style={{ fontSize: 32, fontWeight: 700, color: '#dc2626', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc2626', animation: 'pulse 2s infinite' }} />
            {stats.liveNow}
          </p>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '8px 0 0' }}>Live Now</p>
        </div>
        <div style={{ background: 'white', padding: 20, borderRadius: 12, textAlign: 'center', borderLeft: '4px solid #f59e0b' }}>
          <p style={{ fontSize: 32, fontWeight: 700, color: '#f59e0b', margin: 0 }}>{stats.upcomingToday}</p>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '8px 0 0' }}>Upcoming Today</p>
        </div>
        <div style={{ background: 'white', padding: 20, borderRadius: 12, textAlign: 'center', borderLeft: '4px solid #10b981' }}>
          <p style={{ fontSize: 32, fontWeight: 700, color: '#10b981', margin: 0 }}>{stats.totalHours}h</p>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '8px 0 0' }}>Meeting Hours</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[
          { key: 'meetings', label: 'Today', icon: '📅' },
          { key: 'rooms', label: 'Rooms', icon: '🏢' },
          { key: 'schedule', label: 'Schedule', icon: '📆' },
          { key: 'recordings', label: 'Recordings', icon: '🎬' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 500,
              background: activeTab === tab.key ? '#3b82f6' : '#e5e7eb',
              color: activeTab === tab.key ? 'white' : '#6b7280',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Meetings Tab */}
      {activeTab === 'meetings' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Today's Meetings</h3>
              <span style={{ fontSize: 13, color: '#6b7280' }}>May 30, 2026</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredMeetings.map((meeting) => (
                <div
                  key={meeting.id}
                  style={{
                    background: 'white',
                    padding: 20,
                    borderRadius: 12,
                    border: meeting.status === 'live' ? '2px solid #dc2626' : '1px solid #e5e7eb',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{meeting.title}</h4>
                        {getMeetingTypeBadge(meeting.type)}
                      </div>
                      <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
                        Hosted by {meeting.host.name}
                      </p>
                    </div>
                    {getStatusBadge(meeting.status)}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 14 }}>🕐</span>
                      <span style={{ fontWeight: 500 }}>{meeting.time}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 14 }}>⏱️</span>
                      <span style={{ color: '#6b7280' }}>{meeting.duration} min</span>
                    </div>
                    {meeting.recording && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 14 }}>🎬</span>
                        <span style={{ color: '#6b7280' }}>Recording</span>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: -8 }}>
                      {meeting.participants.slice(0, 4).map((p, i) => (
                        <div
                          key={p.name}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: p.status === 'joined' ? '#10b981' : p.status === 'invited' ? '#3b82f6' : '#6b7280',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 10,
                            fontWeight: 600,
                            border: '2px solid white',
                            marginLeft: i > 0 ? -8 : 0,
                          }}
                          title={`${p.name} - ${p.status}`}
                        >
                          {p.avatar}
                        </div>
                      ))}
                      {meeting.participants.length > 4 && (
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: '#e5e7eb',
                            color: '#6b7280',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 10,
                            fontWeight: 600,
                            border: '2px solid white',
                            marginLeft: -8,
                          }}
                        >
                          +{meeting.participants.length - 4}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {meeting.status === 'live' && (
                        <button style={{ padding: '8px 16px', background: '#dc2626', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
                          Join Now
                        </button>
                      )}
                      {meeting.status === 'upcoming' && (
                        <button style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 500 }}>
                          Join at {meeting.time}
                        </button>
                      )}
                      {meeting.status === 'completed' && meeting.recordingUrl && (
                        <button style={{ padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 500 }}>
                          Watch Recording
                        </button>
                      )}
                      <button style={{ padding: '8px 16px', background: '#e5e7eb', color: '#6b7280', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 500 }}>
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions Sidebar */}
          <div>
            <h3 style={{ margin: '0 0 16px' }}>Quick Actions</h3>
            <div style={{ background: 'white', borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <button style={{ width: '100%', padding: 12, background: '#dc2626', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, marginBottom: 8 }}>
                Start Instant Meeting
              </button>
              <button style={{ width: '100%', padding: 12, background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 500 }}>
                Share Screen
              </button>
            </div>

            <h3 style={{ margin: '0 0 16px' }}>Recent Participants</h3>
            <div style={{ background: 'white', borderRadius: 12, padding: 16 }}>
              {[
                { name: 'Priya Sharma', status: 'Available', color: '#10b981' },
                { name: 'Rahul Verma', status: 'In Meeting', color: '#f59e0b' },
                { name: 'Sneha Patel', status: 'Available', color: '#10b981' },
                { name: 'Amit Kumar', status: 'Away', color: '#6b7280' },
              ].map((person) => (
                <div key={person.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: person.color }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 500, fontSize: 14 }}>{person.name}</p>
                    <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>{person.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Rooms Tab */}
      {activeTab === 'rooms' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {mockRooms.map((room) => (
              <div
                key={room.id}
                style={{
                  background: 'white',
                  padding: 24,
                  borderRadius: 12,
                  border: room.isActive ? '2px solid #10b981' : '1px solid #e5e7eb',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{room.name}</h4>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>{room.type} Room</span>
                  </div>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 500,
                    background: room.isActive ? '#dcfce7' : '#f3f4f6',
                    color: room.isActive ? '#15803d' : '#6b7280',
                  }}>
                    {room.isActive ? 'Active' : 'Available'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 16 }}>
                  <div>
                    <p style={{ fontSize: 24, fontWeight: 700, color: '#3b82f6', margin: 0 }}>{room.currentParticipants}</p>
                    <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>Participants</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 24, fontWeight: 700, color: '#6b7280', margin: 0 }}>{room.capacity}</p>
                    <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>Capacity</p>
                  </div>
                </div>

                {room.isActive && (
                  <div style={{ padding: 12, background: '#f0fdf4', borderRadius: 8, marginBottom: 16 }}>
                    <p style={{ fontSize: 13, color: '#166534', margin: 0 }}>
                      {room.currentParticipants} people in this room
                    </p>
                  </div>
                )}

                <button style={{
                  width: '100%',
                  padding: 12,
                  background: room.isActive ? '#dc2626' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 600,
                }}>
                  {room.isActive ? 'Join Room' : 'Start Meeting'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schedule Tab */}
      {activeTab === 'schedule' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 24 }}>
            <h3 style={{ margin: '0 0 16px' }}>Schedule New Meeting</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Meeting Title</label>
              <input
                type="text"
                placeholder="Enter meeting title..."
                style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                onChange={(e) => setNewMeeting((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Time</label>
                <input
                  type="time"
                  value={newMeeting.time}
                  style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                  onChange={(e) => setNewMeeting((prev) => ({ ...prev, time: e.target.value }))}
                />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Duration</label>
              <select
                style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                onChange={(e) => setNewMeeting((prev) => ({ ...prev, duration: Number(e.target.value) }))}
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Meeting Type</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['1on1', 'team', 'all-hands', 'interview'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setNewMeeting((prev) => ({ ...prev, type }))}
                    style={{
                      flex: 1,
                      padding: 10,
                      border: 'none',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontWeight: 500,
                      fontSize: 12,
                      background: newMeeting.type === type ? '#3b82f6' : '#e5e7eb',
                      color: newMeeting.type === type ? 'white' : '#6b7280',
                    }}
                  >
                    {type === '1on1' ? '1:1' : type === 'all-hands' ? 'All Hands' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <button style={{ width: '100%', padding: 12, background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
              Schedule Meeting
            </button>
          </div>

          <div style={{ background: 'white', borderRadius: 12, padding: 24 }}>
            <h3 style={{ margin: '0 0 16px' }}>Available Slots - {selectedDate}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {upcomingSlots.map((slot) => (
                <button
                  key={slot.time}
                  disabled={!slot.available}
                  style={{
                    padding: 12,
                    border: 'none',
                    borderRadius: 8,
                    cursor: slot.available ? 'pointer' : 'not-allowed',
                    fontWeight: 500,
                    background: slot.available ? '#dcfce7' : '#f3f4f6',
                    color: slot.available ? '#15803d' : '#9ca3af',
                    opacity: slot.available ? 1 : 0.5,
                  }}
                >
                  {slot.time}
                </button>
              ))}
            </div>
            <div style={{ marginTop: 24, padding: 16, background: '#eff6ff', borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 16 }}>📅</span>
                <span style={{ fontWeight: 600, color: '#1d4ed8' }}>Weekly Overview</span>
              </div>
              <p style={{ fontSize: 13, color: '#1e40af', margin: 0 }}>
                You have 3 meetings scheduled this week. 2 time slots are available tomorrow.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recordings Tab */}
      {activeTab === 'recordings' && (
        <div>
          <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', textAlign: 'left', fontSize: 13, color: '#6b7280' }}>
                  <th style={{ padding: '12px 16px' }}>Recording</th>
                  <th style={{ padding: '12px 16px' }}>Date</th>
                  <th style={{ padding: '12px 16px' }}>Duration</th>
                  <th style={{ padding: '12px 16px' }}>Host</th>
                  <th style={{ padding: '12px 16px' }}>Participants</th>
                  <th style={{ padding: '12px 16px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {meetings.filter((m) => m.recording).map((meeting) => (
                  <tr key={meeting.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{ padding: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 8, background: '#3b82f620', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: 24 }}>🎬</span>
                        </div>
                        <div>
                          <p style={{ fontWeight: 500, margin: 0 }}>{meeting.title}</p>
                          <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>{meeting.duration} min recording</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: 16, color: '#6b7280' }}>{meeting.date}</td>
                    <td style={{ padding: 16, fontWeight: 500 }}>{meeting.duration} min</td>
                    <td style={{ padding: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600 }}>
                          {meeting.host.avatar}
                        </div>
                        <span>{meeting.host.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: 16 }}>{meeting.participants.length}</td>
                    <td style={{ padding: 16 }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button style={{ padding: '6px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                          Play
                        </button>
                        <button style={{ padding: '6px 12px', background: '#e5e7eb', color: '#6b7280', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                          Download
                        </button>
                        <button style={{ padding: '6px 12px', background: '#e5e7eb', color: '#6b7280', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                          Share
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: 32, borderRadius: 16, width: 500 }}>
            <h2 style={{ marginTop: 0 }}>Schedule Meeting</h2>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Meeting Title</label>
              <input
                type="text"
                placeholder="Weekly Standup"
                style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Date</label>
                <input type="date" style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Time</label>
                <input type="time" style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Add Participants</label>
              <input
                type="text"
                placeholder="Search employees..."
                style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowScheduleModal(false)}
                style={{ flex: 1, padding: 12, background: '#e5e7eb', border: 'none', borderRadius: 8, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={() => setShowScheduleModal(false)}
                style={{ flex: 1, padding: 12, background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
              >
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
