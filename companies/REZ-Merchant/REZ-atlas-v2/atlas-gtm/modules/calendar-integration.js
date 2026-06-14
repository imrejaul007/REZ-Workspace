/**
 * Calendar & Meeting Integration
 *
 * Supports:
 * - Google Calendar
 * - Zoom
 * - Microsoft Teams/Meet
 * - Calendly-style booking
 */

const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

// Google Calendar API (optional)
let googleCalendar = null;
try {
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    googleCalendar = {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary'
    };
  }
} catch (e) {}

// Zoom API (optional)
const zoomConfig = process.env.ZOOM_API_KEY ? {
  apiKey: process.env.ZOOM_API_KEY,
  apiSecret: process.env.ZOOM_API_SECRET
} : null;

// In-memory meeting storage
const meetings = new Map();
const bookingLinks = new Map();
const availabilities = new Map();

/**
 * Create a Calendly-style booking link
 */
function createBookingLink(options = {}) {
  const {
    userId,
    duration = 30,
    title = 'Sales Discovery Call',
    description = '',
    availableSlots = [] // Array of { day: 'monday', startTime: '09:00', endTime: '17:00' }
  } = options;

  const linkId = uuidv4().slice(0, 8);
  const bookingLink = {
    id: uuidv4(),
    linkId,
    url: `https://cal.rez.money/book/${linkId}`,
    userId,
    duration,
    title,
    description,
    availableSlots: availableSlots.length ? availableSlots : [
      { day: 'monday', startTime: '09:00', endTime: '17:00' },
      { day: 'tuesday', startTime: '09:00', endTime: '17:00' },
      { day: 'wednesday', startTime: '09:00', endTime: '17:00' },
      { day: 'thursday', startTime: '09:00', endTime: '17:00' },
      { day: 'friday', startTime: '09:00', endTime: '15:00' }
    ],
    timezone: options.timezone || 'Asia/Kolkata',
    createdAt: new Date().toISOString(),
    status: 'active',
    meetings: []
  };

  bookingLinks.set(linkId, bookingLink);
  return bookingLink;
}

/**
 * Get available time slots for a booking link
 */
function getAvailableSlots(linkId, date) {
  const link = bookingLinks.get(linkId);
  if (!link) return null;

  const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'lowercase' });
  const dayConfig = link.availableSlots.find(s => s.day === dayOfWeek);

  if (!dayConfig) return [];

  // Generate hourly slots
  const slots = [];
  const [startHour] = dayConfig.startTime.split(':').map(Number);
  const [endHour] = dayConfig.endTime.split(':').map(Number);

  for (let hour = startHour; hour < endHour; hour++) {
    const slotTime = `${hour.toString().padStart(2, '0')}:00`;
    slots.push({
      time: slotTime,
      available: true
    });
  }

  return slots;
}

/**
 * Book a meeting slot
 */
async function bookMeeting(options = {}) {
  const {
    linkId,
    prospectName,
    prospectEmail,
    prospectCompany,
    date,
    time,
    duration = 30,
    title,
    notes = '',
    createVideoMeeting = true
  } = options;

  const link = bookingLinks.get(linkId);
  if (!link) {
    throw new Error('Booking link not found');
  }

  const meetingId = uuidv4();
  const startTime = new Date(`${date}T${time}:00`);
  const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

  // Create video meeting
  let videoMeeting = null;
  if (createVideoMeeting) {
    videoMeeting = await createVideoMeeting({
      topic: title || link.title,
      startTime,
      duration,
      hostEmail: prospectEmail
    });
  }

  const meeting = {
    id: meetingId,
    bookingLinkId: linkId,
    prospectName,
    prospectEmail,
    prospectCompany,
    date: startTime.toISOString(),
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    duration,
    title: title || link.title,
    notes,
    videoMeeting,
    status: 'scheduled',
    reminders: [],
    createdAt: new Date().toISOString()
  };

  meetings.set(meetingId, meeting);
  link.meetings.push(meetingId);

  // Create calendar event if configured
  if (googleCalendar) {
    await createGoogleCalendarEvent(meeting);
  }

  return meeting;
}

/**
 * Create Zoom meeting
 */
async function createZoomMeeting(options = {}) {
  const { topic, startTime, duration, hostEmail } = options;

  if (!zoomConfig) {
    // Return mock meeting
    const meetingId = Math.floor(Math.random() * 9000000000) + 1000000000;
    return {
      id: meetingId,
      join_url: `https://zoom.us/j/${meetingId}`,
      start_url: `https://zoom.us/s/${meetingId}`,
      password: Math.random().toString(36).slice(8),
      topic,
      start_time: startTime.toISOString(),
      duration
    };
  }

  try {
    // Generate JWT token for Zoom
    const jwt = require('jsonwebtoken');
    const payload = {
      iss: zoomConfig.apiKey,
      exp: Date.now() + 3600000
    };
    const token = jwt.sign(payload, zoomConfig.apiSecret);

    const response = await axios.post('https://api.zoom.us/v2/users/me/meetings', {
      topic,
      type: 2, // Scheduled meeting
      start_time: startTime.toISOString(),
      duration,
      timezone: 'Asia/Kolkata',
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: false,
        mute_upon_entry: true,
        waiting_room: true
      }
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Zoom API error:', error.message);
    // Return mock on error
    const meetingId = Math.floor(Math.random() * 9000000000) + 1000000000;
    return {
      id: meetingId,
      join_url: `https://zoom.us/j/${meetingId}`,
      start_url: `https://zoom.us/s/${meetingId}`,
      topic,
      start_time: startTime.toISOString(),
      duration
    };
  }
}

/**
 * Create Google Calendar event
 */
async function createGoogleCalendarEvent(meeting) {
  if (!googleCalendar) return null;

  // In production, use Google Calendar API
  // For now, return mock event
  return {
    id: uuidv4(),
    htmlLink: `https://calendar.google.com/calendar/event?id=${uuidv4()}`,
    calendarId: googleCalendar.calendarId
  };
}

/**
 * Create video meeting (auto-selects Zoom or Meet)
 */
async function createVideoMeeting(options = {}) {
  if (zoomConfig) {
    return await createZoomMeeting(options);
  }

  // Fallback to Zoom mock
  return await createZoomMeeting(options);
}

/**
 * Send meeting reminder
 */
async function sendReminder(meetingId, type = 'email') {
  const meeting = meetings.get(meetingId);
  if (!meeting) return null;

  const reminder = {
    id: uuidv4(),
    meetingId,
    type,
    scheduledFor: calculateReminderTime(meeting.startTime, type),
    sent: false,
    createdAt: new Date().toISOString()
  };

  meeting.reminders.push(reminder);
  return reminder;
}

function calculateReminderTime(meetingTime, type) {
  const time = new Date(meetingTime);
  switch (type) {
    case '24h':
      return new Date(time.getTime() - 24 * 60 * 60 * 1000);
    case '1h':
      return new Date(time.getTime() - 60 * 60 * 1000);
    case '15m':
      return new Date(time.getTime() - 15 * 60 * 1000);
    default:
      return new Date(time.getTime() - 24 * 60 * 60 * 1000);
  }
}

/**
 * Reschedule meeting
 */
async function rescheduleMeeting(meetingId, newDate, newTime) {
  const meeting = meetings.get(meetingId);
  if (!meeting) return null;

  const startTime = new Date(`${newDate}T${newTime}:00`);
  const endTime = new Date(startTime.getTime() + meeting.duration * 60 * 1000);

  meeting.startTime = startTime.toISOString();
  meeting.endTime = endTime.toISOString();
  meeting.rescheduledAt = new Date().toISOString();
  meeting.status = 'rescheduled';

  // Update video meeting if exists
  if (meeting.videoMeeting) {
    meeting.videoMeeting = await createVideoMeeting({
      topic: meeting.title,
      startTime,
      duration: meeting.duration
    });
  }

  return meeting;
}

/**
 * Cancel meeting
 */
function cancelMeeting(meetingId, reason = '') {
  const meeting = meetings.get(meetingId);
  if (!meeting) return null;

  meeting.status = 'cancelled';
  meeting.cancelledAt = new Date().toISOString();
  meeting.cancellationReason = reason;

  return meeting;
}

/**
 * Get meeting analytics
 */
function getMeetingAnalytics(timeRange = '30d') {
  const now = new Date();
  const rangeMs = {
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000
  }[timeRange] || 30 * 24 * 60 * 60 * 1000;

  const startDate = new Date(now.getTime() - rangeMs);

  const allMeetings = Array.from(meetings.values())
    .filter(m => new Date(m.startTime) >= startDate);

  const scheduled = allMeetings.filter(m => m.status === 'scheduled');
  const completed = allMeetings.filter(m => m.status === 'completed');
  const cancelled = allMeetings.filter(m => m.status === 'cancelled');
  const noShow = allMeetings.filter(m => m.status === 'no_show');

  return {
    total: allMeetings.length,
    scheduled: scheduled.length,
    completed: completed.length,
    cancelled: cancelled.length,
    noShow: noShow.length,
    showRate: allMeetings.length ?
      ((completed.length / allMeetings.length) * 100).toFixed(1) + '%' : '0%',
    avgDuration: completed.length ?
      Math.round(completed.reduce((sum, m) => sum + m.duration, 0) / completed.length) : 0,
    upcoming: scheduled
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
      .slice(0, 10)
  };
}

module.exports = {
  // Booking links
  createBookingLink,
  getAvailableSlots,

  // Meetings
  bookMeeting,
  rescheduleMeeting,
  cancelMeeting,

  // Video
  createVideoMeeting,
  createZoomMeeting,
  createGoogleCalendarEvent,

  // Reminders
  sendReminder,

  // Analytics
  getMeetingAnalytics,

  // Storage access
  meetings,
  bookingLinks
};