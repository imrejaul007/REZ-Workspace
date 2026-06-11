import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 4871;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory data store for gym
interface Trainer {
  id: string;
  name: string;
  specialty: string;
  available: boolean;
  schedule: string[];
}

interface GymClass {
  id: string;
  name: string;
  trainer: string;
  time: string;
  duration: string;
  capacity: number;
  enrolled: number;
  day: string;
}

interface Membership {
  id: string;
  type: string;
  price: number;
  duration: string;
  features: string[];
}

// Gym data
const trainers: Trainer[] = [
  { id: '1', name: 'Mike Johnson', specialty: 'CrossFit', available: true, schedule: ['Mon 6AM', 'Wed 6AM', 'Fri 6AM'] },
  { id: '2', name: 'Sarah Chen', specialty: 'Yoga & Pilates', available: true, schedule: ['Tue 7AM', 'Thu 7AM', 'Sat 9AM'] },
  { id: '3', name: 'David Park', specialty: 'HIIT & Cardio', available: false, schedule: ['Mon 5PM', 'Tue 5PM', 'Thu 5PM'] },
  { id: '4', name: 'Emma Wilson', specialty: 'Weight Training', available: true, schedule: ['Mon 8AM', 'Wed 8AM', 'Fri 8AM'] },
];

const classSchedule: GymClass[] = [
  { id: '1', name: 'Morning HIIT', trainer: 'Mike Johnson', time: '6:00 AM', duration: '45 min', capacity: 20, enrolled: 15, day: 'Monday' },
  { id: '2', name: 'Power Yoga', trainer: 'Sarah Chen', time: '7:00 AM', duration: '60 min', capacity: 15, enrolled: 12, day: 'Tuesday' },
  { id: '3', name: 'Strength Training', trainer: 'Emma Wilson', time: '8:00 AM', duration: '50 min', capacity: 12, enrolled: 8, day: 'Monday' },
  { id: '4', name: 'Evening HIIT', trainer: 'David Park', time: '5:00 PM', duration: '45 min', capacity: 20, enrolled: 18, day: 'Monday' },
  { id: '5', name: 'Pilates Flow', trainer: 'Sarah Chen', time: '7:00 AM', duration: '55 min', capacity: 15, enrolled: 10, day: 'Thursday' },
  { id: '6', name: 'CrossFit Basics', trainer: 'Mike Johnson', time: '6:00 AM', duration: '60 min', capacity: 16, enrolled: 14, day: 'Wednesday' },
];

const memberships: Membership[] = [
  { id: '1', type: 'Basic', price: 29.99, duration: 'monthly', features: ['Gym access', 'Locker room', 'Basic equipment'] },
  { id: '2', type: 'Premium', price: 49.99, duration: 'monthly', features: ['24/7 access', 'All classes', 'Personal trainer session', 'Sauna access', 'Nutrition plan'] },
  { id: '3', type: 'Elite', price: 89.99, duration: 'monthly', features: ['Everything in Premium', 'Unlimited PT sessions', 'Recovery zone', 'Priority booking', 'Guest passes'] },
];

// Session management for IVR
interface IVRSession {
  id: string;
  phone: string;
  state: string;
  data: Record<string, any>;
  createdAt: Date;
}

const sessions: Map<string, IVRSession> = new Map();

// Utility functions
function createSession(phone: string): IVRSession {
  const session: IVRSession = {
    id: uuidv4(),
    phone,
    state: 'main_menu',
    data: {},
    createdAt: new Date(),
  };
  sessions.set(session.id, session);
  return session;
}

function getSession(id: string): IVRSession | undefined {
  return sessions.get(id);
}

function cleanupSessions(): void {
  const now = new Date();
  for (const [id, session] of sessions) {
    if (now.getTime() - session.createdAt.getTime() > 1800000) {
      sessions.delete(id);
    }
  }
}

setInterval(cleanupSessions, 300000);

// IVR Voice Menu System
interface IVRResponse {
  responseId: string;
  sessionId: string;
  message: string;
  options?: IVRMenuOption[];
  action?: string;
  data?: any;
}

interface IVRMenuOption {
  digit: string;
  label: string;
  nextState: string;
}

// Main menu structure
const mainMenu: IVRMenuOption[] = [
  { digit: '1', label: 'Membership Inquiries', nextState: 'membership_menu' },
  { digit: '2', label: 'Book a Class', nextState: 'class_booking' },
  { digit: '3', label: 'Trainer Availability', nextState: 'trainer_availability' },
  { digit: '4', label: 'Gym Hours & Location', nextState: 'gym_info' },
  { digit: '0', label: 'Speak to Staff', nextState: 'speak_to_staff' },
];

const membershipMenu: IVRMenuOption[] = [
  { digit: '1', label: 'Basic Plan - $29.99/month', nextState: 'membership_basic' },
  { digit: '2', label: 'Premium Plan - $49.99/month', nextState: 'membership_premium' },
  { digit: '3', label: 'Elite Plan - $89.99/month', nextState: 'membership_elite' },
  { digit: '0', label: 'Return to Main Menu', nextState: 'main_menu' },
];

// Root endpoint - health check
app.get('/', (req: Request, res: Response) => {
  res.json({
    service: 'FITMIND Phone Receptionist',
    status: 'running',
    port: PORT,
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      call: 'POST /api/ivr/call',
      ivr: 'POST /api/ivr/respond',
      membership: 'GET /api/membership',
      classes: 'GET /api/classes',
      trainers: 'GET /api/trainers',
    },
  });
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'fitmind-phone-receptionist',
    activeSessions: sessions.size,
  });
});

// Initiate a call (simulated)
app.post('/api/ivr/call', (req: Request, res: Response) => {
  const { phone, intent } = req.body;

  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  const session = createSession(phone);

  const welcomeMessage = intent === 'trainer'
    ? `Welcome to FITMIND Fitness. How can I help you today? For trainer availability, please press 3.`
    : `Welcome to FITMIND Fitness. For membership inquiries, press 1. To book a class, press 2. To check trainer availability, press 3. For gym hours, press 4. To speak to staff, press 0.`;

  const response: IVRResponse = {
    responseId: uuidv4(),
    sessionId: session.id,
    message: welcomeMessage,
    options: mainMenu,
    action: 'greeting',
  };

  res.json(response);
});

// Handle IVR responses
app.post('/api/ivr/respond', (req: Request, res: Response) => {
  const { sessionId, digit, userInput } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID is required' });
  }

  const session = getSession(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found or expired' });
  }

  let response: IVRResponse = {
    responseId: uuidv4(),
    sessionId,
    message: '',
  };

  // Route based on current state and input
  switch (session.state) {
    case 'main_menu':
      response = handleMainMenu(session, digit);
      break;
    case 'membership_menu':
      response = handleMembershipMenu(session, digit);
      break;
    case 'class_booking':
      response = handleClassBooking(session, digit);
      break;
    case 'trainer_availability':
      response = handleTrainerAvailability(session, digit);
      break;
    case 'gym_info':
      response = handleGymInfo(session);
      break;
    case 'speak_to_staff':
      response = handleSpeakToStaff(session);
      break;
    case 'membership_basic':
    case 'membership_premium':
    case 'membership_elite':
      response = handleMembershipDetail(session);
      break;
    default:
      response = {
        responseId: uuidv4(),
        sessionId,
        message: 'Invalid option. Please try again.',
        options: mainMenu,
        action: 'return_main',
      };
      session.state = 'main_menu';
  }

  sessions.set(sessionId, session);
  res.json(response);
});

function handleMainMenu(session: IVRSession, digit: string): IVRResponse {
  switch (digit) {
    case '1':
      session.state = 'membership_menu';
      return {
        responseId: uuidv4(),
        sessionId: session.id,
        message: 'Our membership plans are:',
        options: membershipMenu,
        action: 'membership_menu',
      };
    case '2':
      session.state = 'class_booking';
      return {
        responseId: uuidv4(),
        sessionId: session.id,
        message: 'Which class would you like to book? Press 1 for Morning HIIT, 2 for Power Yoga, 3 for Strength Training, 4 for Evening HIIT. Press 0 for the full schedule.',
        options: [
          { digit: '1', label: 'Morning HIIT', nextState: 'book_hiit' },
          { digit: '2', label: 'Power Yoga', nextState: 'book_yoga' },
          { digit: '3', label: 'Strength Training', nextState: 'book_strength' },
          { digit: '4', label: 'Evening HIIT', nextState: 'book_evening' },
          { digit: '0', label: 'Full Schedule', nextState: 'full_schedule' },
        ],
        action: 'class_selection',
      };
    case '3':
      session.state = 'trainer_availability';
      return {
        responseId: uuidv4(),
        sessionId: session.id,
        message: 'Our trainers are: Mike Johnson - CrossFit specialist, available Mon, Wed, Fri at 6AM. Sarah Chen - Yoga & Pilates, available Tue, Thu, Sat. Emma Wilson - Weight Training, available Mon, Wed, Fri at 8AM. Press 1 to hear details, 2 to book a session.',
        options: [
          { digit: '1', label: 'Trainer Details', nextState: 'trainer_details' },
          { digit: '2', label: 'Book Trainer Session', nextState: 'book_trainer' },
          { digit: '0', label: 'Main Menu', nextState: 'main_menu' },
        ],
        action: 'trainer_info',
      };
    case '4':
      return handleGymInfo(session);
    case '0':
      return handleSpeakToStaff(session);
    default:
      return {
        responseId: uuidv4(),
        sessionId: session.id,
        message: 'Invalid selection. Press 1 for membership, 2 for classes, 3 for trainers, 4 for gym info, 0 for staff.',
        options: mainMenu,
        action: 'retry',
      };
  }
}

function handleMembershipMenu(session: IVRSession, digit: string): IVRResponse {
  switch (digit) {
    case '1':
      session.state = 'membership_basic';
      session.data.selectedMembership = 'Basic';
      break;
    case '2':
      session.state = 'membership_premium';
      session.data.selectedMembership = 'Premium';
      break;
    case '3':
      session.state = 'membership_elite';
      session.data.selectedMembership = 'Elite';
      break;
    case '0':
      session.state = 'main_menu';
      return {
        responseId: uuidv4(),
        sessionId: session.id,
        message: 'Returning to main menu.',
        options: mainMenu,
        action: 'return_main',
      };
    default:
      return {
        responseId: uuidv4(),
        sessionId: session.id,
        message: 'Invalid selection. Press 1 for Basic, 2 for Premium, 3 for Elite.',
        options: membershipMenu,
        action: 'retry',
      };
  }
  return handleMembershipDetail(session);
}

function handleMembershipDetail(session: IVRSession): IVRResponse {
  const memType = session.state.replace('membership_', '');
  const membership = memberships.find(m => m.type.toLowerCase() === memType);

  if (!membership) {
    return {
      responseId: uuidv4(),
      sessionId: session.id,
      message: 'Membership not found. Returning to main menu.',
      options: mainMenu,
      action: 'return_main',
    };
  }

  return {
    responseId: uuidv4(),
    sessionId: session.id,
    message: `${membership.type} Plan: $${membership.price} per ${membership.duration}. Includes: ${membership.features.join(', ')}. To sign up, press 1. For other plans, press 2. For main menu, press 0.`,
    options: [
      { digit: '1', label: 'Sign Up', nextState: 'signup' },
      { digit: '2', label: 'Other Plans', nextState: 'membership_menu' },
      { digit: '0', label: 'Main Menu', nextState: 'main_menu' },
    ],
    action: 'membership_detail',
    data: membership,
  };
}

function handleClassBooking(session: IVRSession, digit: string): IVRResponse {
  const classMap: Record<string, string> = {
    '1': 'Morning HIIT',
    '2': 'Power Yoga',
    '3': 'Strength Training',
    '4': 'Evening HIIT',
  };

  if (digit === '0') {
    return {
      responseId: uuidv4(),
      sessionId: session.id,
      message: 'Today\'s classes: Morning HIIT at 6AM with Mike, Power Yoga at 7AM with Sarah, Strength Training at 8AM with Emma, Evening HIIT at 5PM with David. Spots are limited. Press 1 to book Morning HIIT, 2 for Power Yoga, 3 for Strength Training.',
      options: [
        { digit: '1', label: 'Book Morning HIIT', nextState: 'book_hiit' },
        { digit: '2', label: 'Book Power Yoga', nextState: 'book_yoga' },
        { digit: '3', label: 'Book Strength Training', nextState: 'book_strength' },
        { digit: '0', label: 'Main Menu', nextState: 'main_menu' },
      ],
      action: 'full_schedule',
    };
  }

  if (digit in classMap) {
    const className = classMap[digit];
    const gymClass = classSchedule.find(c => c.name === className);

    if (gymClass) {
      const spotsLeft = gymClass.capacity - gymClass.enrolled;
      session.data.bookedClass = gymClass;

      if (spotsLeft <= 0) {
        return {
          responseId: uuidv4(),
          sessionId: session.id,
          message: `Sorry, ${gymClass.name} at ${gymClass.time} is fully booked. There are ${spotsLeft} spots available. Would you like to join the waitlist? Press 1 for waitlist, 0 for main menu.`,
          options: [
            { digit: '1', label: 'Join Waitlist', nextState: 'waitlist' },
            { digit: '0', label: 'Main Menu', nextState: 'main_menu' },
          ],
          action: 'class_full',
        };
      }

      return {
        responseId: uuidv4(),
        sessionId: session.id,
        message: `${gymClass.name} with ${gymClass.trainer} on ${gymClass.day} at ${gymClass.time}. Duration: ${gymClass.duration}. ${spotsLeft} spots left. Press 1 to confirm booking, 2 for different class, 0 for main menu.`,
        options: [
          { digit: '1', label: 'Confirm Booking', nextState: 'booking_confirmed' },
          { digit: '2', label: 'Different Class', nextState: 'class_booking' },
          { digit: '0', label: 'Main Menu', nextState: 'main_menu' },
        ],
        action: 'class_confirmation',
        data: gymClass,
      };
    }
  }

  return {
    responseId: uuidv4(),
    sessionId: session.id,
    message: 'Invalid selection. Press 1 for Morning HIIT, 2 for Power Yoga, 3 for Strength Training, 4 for Evening HIIT.',
    options: [
      { digit: '1', label: 'Morning HIIT', nextState: 'book_hiit' },
      { digit: '2', label: 'Power Yoga', nextState: 'book_yoga' },
      { digit: '3', label: 'Strength Training', nextState: 'book_strength' },
      { digit: '4', label: 'Evening HIIT', nextState: 'book_evening' },
      { digit: '0', label: 'Full Schedule', nextState: 'full_schedule' },
    ],
    action: 'retry',
  };
}

function handleTrainerAvailability(session: IVRSession, digit: string): IVRResponse {
  switch (digit) {
    case '1':
      return {
        responseId: uuidv4(),
        sessionId: session.id,
        message: 'Trainer details: Mike Johnson specializes in CrossFit and is available Monday, Wednesday, Friday at 6AM. Sarah Chen specializes in Yoga and Pilates, available Tuesday, Thursday, and Saturday. Emma Wilson specializes in Weight Training, available Monday, Wednesday, Friday at 8AM. David Park specializes in HIIT and Cardio. Press 1 to book with a trainer, 0 for main menu.',
        options: [
          { digit: '1', label: 'Book Trainer', nextState: 'book_trainer' },
          { digit: '0', label: 'Main Menu', nextState: 'main_menu' },
        ],
        action: 'trainer_details',
      };
    case '2':
      return {
        responseId: uuidv4(),
        sessionId: session.id,
        message: 'To book a trainer session, which specialty do you prefer? Press 1 for CrossFit, 2 for Yoga/Pilates, 3 for HIIT/Cardio, 4 for Weight Training.',
        options: [
          { digit: '1', label: 'CrossFit (Mike)', nextState: 'book_mike' },
          { digit: '2', label: 'Yoga/Pilates (Sarah)', nextState: 'book_sarah' },
          { digit: '3', label: 'HIIT/Cardio (David)', nextState: 'book_david' },
          { digit: '4', label: 'Weight Training (Emma)', nextState: 'book_emma' },
          { digit: '0', label: 'Main Menu', nextState: 'main_menu' },
        ],
        action: 'trainer_selection',
      };
    case '0':
      session.state = 'main_menu';
      return {
        responseId: uuidv4(),
        sessionId: session.id,
        message: 'Returning to main menu.',
        options: mainMenu,
        action: 'return_main',
      };
    default:
      return {
        responseId: uuidv4(),
        sessionId: session.id,
        message: 'Invalid selection. Press 1 for details, 2 to book a trainer.',
        options: [
          { digit: '1', label: 'Trainer Details', nextState: 'trainer_details' },
          { digit: '2', label: 'Book Trainer Session', nextState: 'book_trainer' },
          { digit: '0', label: 'Main Menu', nextState: 'main_menu' },
        ],
        action: 'retry',
      };
  }
}

function handleGymInfo(session: IVRSession): IVRResponse {
  session.state = 'main_menu';
  return {
    responseId: uuidv4(),
    sessionId: session.id,
    message: 'FITMIND Fitness is open Monday to Friday 5AM to 11PM, Saturday 6AM to 10PM, Sunday 7AM to 8PM. We are located at 123 Fitness Avenue. Press 1 to hear class schedule, 2 for membership info, 0 for main menu.',
    options: [
      { digit: '1', label: 'Class Schedule', nextState: 'class_booking' },
      { digit: '2', label: 'Membership Info', nextState: 'membership_menu' },
      { digit: '0', label: 'Main Menu', nextState: 'main_menu' },
    ],
    action: 'gym_info',
  };
}

function handleSpeakToStaff(session: IVRSession): IVRResponse {
  session.state = 'main_menu';
  return {
    responseId: uuidv4(),
    sessionId: session.id,
    message: 'Please hold. Connecting you to our staff member. If this is urgent, call us at 555-FIT-MIND. Thank you for choosing FITMIND Fitness.',
    options: mainMenu,
    action: 'transfer',
  };
}

// REST API Endpoints

// Get all memberships
app.get('/api/membership', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: memberships,
    count: memberships.length,
  });
});

// Get membership by type
app.get('/api/membership/:type', (req: Request, res: Response) => {
  const { type } = req.params;
  const membership = memberships.find(m => m.type.toLowerCase() === type.toLowerCase());

  if (!membership) {
    return res.status(404).json({
      success: false,
      error: 'Membership not found',
      availableTypes: memberships.map(m => m.type),
    });
  }

  res.json({
    success: true,
    data: membership,
  });
});

// Get class schedule
app.get('/api/classes', (req: Request, res: Response) => {
  const { day, trainer } = req.query;

  let filtered = [...classSchedule];

  if (day) {
    filtered = filtered.filter(c => c.day.toLowerCase() === (day as string).toLowerCase());
  }

  if (trainer) {
    filtered = filtered.filter(c => c.trainer.toLowerCase().includes((trainer as string).toLowerCase()));
  }

  res.json({
    success: true,
    data: filtered,
    count: filtered.length,
  });
});

// Get class by ID
app.get('/api/classes/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const gymClass = classSchedule.find(c => c.id === id);

  if (!gymClass) {
    return res.status(404).json({
      success: false,
      error: 'Class not found',
    });
  }

  res.json({
    success: true,
    data: {
      ...gymClass,
      spotsAvailable: gymClass.capacity - gymClass.enrolled,
    },
  });
});

// Get trainers
app.get('/api/trainers', (req: Request, res: Response) => {
  const { specialty, available } = req.query;

  let filtered = [...trainers];

  if (specialty) {
    filtered = filtered.filter(t => t.specialty.toLowerCase().includes((specialty as string).toLowerCase()));
  }

  if (available !== undefined) {
    filtered = filtered.filter(t => t.available === (available === 'true'));
  }

  res.json({
    success: true,
    data: filtered,
    count: filtered.length,
  });
});

// Get trainer by ID
app.get('/api/trainers/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const trainer = trainers.find(t => t.id === id);

  if (!trainer) {
    return res.status(404).json({
      success: false,
      error: 'Trainer not found',
    });
  }

  res.json({
    success: true,
    data: trainer,
  });
});

// Book a class
app.post('/api/bookings', (req: Request, res: Response) => {
  const { classId, memberName, phone, email } = req.body;

  if (!classId || !memberName) {
    return res.status(400).json({
      success: false,
      error: 'Class ID and member name are required',
    });
  }

  const gymClass = classSchedule.find(c => c.id === classId);

  if (!gymClass) {
    return res.status(404).json({
      success: false,
      error: 'Class not found',
    });
  }

  if (gymClass.enrolled >= gymClass.capacity) {
    return res.status(400).json({
      success: false,
      error: 'Class is fully booked',
      waitlistAvailable: true,
    });
  }

  // Simulate booking
  const bookingId = uuidv4();
  gymClass.enrolled += 1;

  res.json({
    success: true,
    booking: {
      id: bookingId,
      classId,
      className: gymClass.name,
      trainer: gymClass.trainer,
      day: gymClass.day,
      time: gymClass.time,
      memberName,
      confirmationCode: bookingId.substring(0, 8).toUpperCase(),
    },
    message: 'Booking confirmed! Please arrive 10 minutes early.',
  });
});

// Cancel booking
app.delete('/api/bookings/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  res.json({
    success: true,
    message: `Booking ${id} has been cancelled. We hope to see you soon!`,
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('Error:', err.message);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`FITMIND Phone Receptionist running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`IVR Call endpoint: POST http://localhost:${PORT}/api/ivr/call`);
  console.log(`Membership info: GET http://localhost:${PORT}/api/membership`);
  console.log(`Class schedule: GET http://localhost:${PORT}/api/classes`);
});

export default app;
