import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 4872;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Types
interface WorkoutRecommendation {
  id: string;
  goal: string;
  level: string;
  name: string;
  duration: string;
  exercises: string[];
  benefits: string[];
  tips: string[];
}

interface NutritionTip {
  id: string;
  category: string;
  title: string;
  content: string;
  icon: string;
}

interface Booking {
  id: string;
  type: 'class' | 'trainer' | 'facility';
  className?: string;
  trainer?: string;
  date: string;
  time: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  memberId: string;
}

interface Member {
  id: string;
  name: string;
  phone: string;
  email: string;
  membershipType: string;
  joinDate: string;
  bookings: Booking[];
}

// WhatsApp Session Management
interface WhatsAppSession {
  id: string;
  phone: string;
  state: string;
  data: Record<string, any>;
  createdAt: Date;
  lastActivity: Date;
}

// Data Store
const workoutRecommendations: WorkoutRecommendation[] = [
  {
    id: '1',
    goal: 'weight_loss',
    level: 'beginner',
    name: 'Fat Burn Starter',
    duration: '30 min',
    exercises: ['Warm-up Jogging (5 min)', 'Bodyweight Squats (3x15)', 'Push-ups (3x10)', 'Lunges (3x12)', 'Plank (3x30 sec)', 'Cool-down Stretching'],
    benefits: ['Burns 200-300 calories', 'Builds lean muscle', 'No equipment needed', 'Boosts metabolism'],
    tips: ['Stay hydrated', 'Maintain proper form', 'Rest 30 seconds between sets'],
  },
  {
    id: '2',
    goal: 'weight_loss',
    level: 'intermediate',
    name: 'HIIT Inferno',
    duration: '45 min',
    exercises: ['Warm-up (5 min)', 'Burpees (4x12)', 'Mountain Climbers (4x20)', 'Jump Squats (4x15)', 'High Knees (4x30 sec)', 'Bicycle Crunches (4x20)', 'Cool-down'],
    benefits: ['Burns 400-500 calories', 'Afterburn effect', 'Improves cardiovascular fitness', 'Time efficient'],
    tips: ['Give 100% effort during work intervals', 'Control breathing', 'Listen to your body'],
  },
  {
    id: '3',
    goal: 'muscle_gain',
    level: 'beginner',
    name: 'Muscle Building Basics',
    duration: '40 min',
    exercises: ['Dumbbell Bench Press (3x12)', 'Lat Pulldowns (3x12)', 'Leg Press (3x15)', 'Shoulder Press (3x10)', 'Bicep Curls (3x12)', 'Tricep Dips (3x10)'],
    benefits: ['Builds foundational strength', 'Correct form development', 'Progressive overload setup', 'Muscle memory'],
    tips: ['Focus on form over weight', 'Eat protein within 30 min post-workout', 'Get 7-8 hours of sleep'],
  },
  {
    id: '4',
    goal: 'muscle_gain',
    level: 'advanced',
    name: 'Power Hypertrophy',
    duration: '60 min',
    exercises: ['Compound Lifts (4x8)', 'Isolation Movements (4x12)', 'Drop Sets (3)', 'Supersets (4)', 'Core Finisher (5 min)'],
    benefits: ['Maximum muscle growth', 'Strength gains', 'Visual results', 'Performance improvement'],
    tips: ['Track your weights', 'Eat in a slight surplus', 'Consider creatine supplementation'],
  },
  {
    id: '5',
    goal: 'flexibility',
    level: 'beginner',
    name: 'Morning Flexibility Flow',
    duration: '20 min',
    exercises: ['Neck Rolls', 'Shoulder Stretches', 'Forward Folds', 'Hip Circles', 'Cat-Cow Stretches', 'Child\'s Pose'],
    benefits: ['Reduces morning stiffness', 'Improves range of motion', 'Prevents injuries', 'Sets positive tone'],
    tips: ['Breathe deeply', 'Never force a stretch', 'Consistency is key'],
  },
  {
    id: '6',
    goal: 'cardio',
    level: 'intermediate',
    name: 'Cardio Endurance Builder',
    duration: '35 min',
    exercises: ['Jump Rope (5 min)', 'Box Jumps (4x10)', 'Rowing Machine (4 min)', 'Bike Sprints (4x30 sec)', 'Stair Climbs (3 min)', 'Cool-down'],
    benefits: ['Heart health improvement', 'Endurance boost', 'Calorie burning', 'Mental resilience'],
    tips: ['Gradually increase intensity', 'Mix up cardio types', 'Fuel properly before cardio'],
  },
];

const nutritionTips: NutritionTip[] = [
  { id: '1', category: 'protein', title: 'Protein Timing', content: 'Aim for 1.6-2.2g of protein per kg of body weight daily. Consume protein within 2 hours post-workout for optimal muscle recovery.', icon: '💪' },
  { id: '2', category: 'hydration', title: 'Hydration Matters', content: 'Drink at least 3-4 liters of water daily. Increase intake on workout days. Add electrolytes for sessions over 60 minutes.', icon: '💧' },
  { id: '3', category: 'pre_workout', title: 'Pre-Workout Nutrition', content: 'Eat a balanced meal 2-3 hours before training, or a light snack 30-60 minutes before. Include carbs and some protein.', icon: '🍌' },
  { id: '4', category: 'recovery', title: 'Post-Workout Recovery', content: 'Within 30 minutes of training: 20-30g protein + fast-absorbing carbs. This window is crucial for recovery.', icon: '🥤' },
  { id: '5', category: 'meal_prep', title: 'Meal Prep Sunday', content: 'Prepare your weekly meals in advance. This saves time, money, and ensures you stay on track with your nutrition goals.', icon: '🥗' },
  { id: '6', category: 'supplements', title: 'Essential Supplements', content: 'Consider: Whey Protein, Creatine (5g daily), Vitamin D3, Fish Oil. Consult a professional before starting any supplement regimen.', icon: '💊' },
  { id: '7', category: 'sleep', title: 'Sleep & Recovery', content: 'Aim for 7-9 hours of quality sleep. Sleep is when your muscles actually grow. Create a consistent sleep schedule.', icon: '😴' },
  { id: '8', category: 'macros', title: 'Macro Balance', content: 'For muscle building: 40% protein, 40% carbs, 20% fat. For fat loss: 40% protein, 35% carbs, 25% fat. Adjust based on progress.', icon: '📊' },
];

const memberships: { id: string; type: string; price: number; features: string[] }[] = [
  { id: '1', type: 'Basic', price: 29.99, features: ['Gym access', 'Locker room', 'Basic equipment'] },
  { id: '2', type: 'Premium', price: 49.99, features: ['24/7 access', 'All classes', '1 PT session/month', 'Sauna', 'Nutrition plan'] },
  { id: '3', type: 'Elite', price: 89.99, features: ['Unlimited PT sessions', 'Recovery zone', 'Priority booking', 'Guest passes', 'Personalized meal plans'] },
];

const classSchedule: { id: string; name: string; trainer: string; time: string; spots: number; level: string }[] = [
  { id: '1', name: 'Morning HIIT', trainer: 'Mike J.', time: '6:00 AM', spots: 5, level: 'All Levels' },
  { id: '2', name: 'Power Yoga', trainer: 'Sarah C.', time: '7:00 AM', spots: 3, level: 'Intermediate' },
  { id: '3', name: 'Spin Class', trainer: 'David P.', time: '12:00 PM', spots: 8, level: 'All Levels' },
  { id: '4', name: 'Boxing', trainer: 'Mike J.', time: '6:00 PM', spots: 2, level: 'Beginner' },
  { id: '5', name: 'Pilates', trainer: 'Sarah C.', time: '7:30 PM', spots: 6, level: 'All Levels' },
];

// Session management
const sessions: Map<string, WhatsAppSession> = new Map();

function createSession(phone: string): WhatsAppSession {
  const session: WhatsAppSession = {
    id: uuidv4(),
    phone,
    state: 'welcome',
    data: {},
    createdAt: new Date(),
    lastActivity: new Date(),
  };
  sessions.set(session.id, session);
  return session;
}

function getSession(id: string): WhatsAppSession | undefined {
  const session = sessions.get(id);
  if (session) {
    session.lastActivity = new Date();
    return session;
  }
  return undefined;
}

// WhatsApp Message Templates
function formatMainMenu(): string {
  return `🏋️ *FITMIND FITNESS*

Welcome! How can I help you today?

1️⃣ Book a Class
2️⃣ Workout Recommendations
3️⃣ Nutrition Tips
4️⃣ Membership Info
5️⃣ My Bookings
6️⃣ Contact Trainer

*Reply with a number or type your question!*`;
}

function formatClassList(): string {
  let msg = `📅 *Available Classes Today*\n\n`;
  classSchedule.forEach((c, i) => {
    const spotEmoji = c.spots <= 2 ? '🔴' : c.spots <= 5 ? '🟡' : '🟢';
    msg += `${i + 1}. ${c.name}\n   ⏰ ${c.time} | 👤 ${c.trainer}\n   ${spotEmoji} ${c.spots} spots | 📊 ${c.level}\n\n`;
  });
  msg += `*Reply with the class number to book!*`;
  return msg;
}

function formatWorkoutMenu(): string {
  return `💪 *Workout Recommendations*

What's your fitness goal?

1️⃣ Weight Loss
2️⃣ Muscle Gain
3️⃣ Flexibility
4️⃣ Cardio Endurance

*Or tell me your level:*
A. Beginner
B. Intermediate
C. Advanced`;
}

function formatNutritionMenu(): string {
  let msg = `🥗 *Nutrition Tips*

Choose a category:

1️⃣ Protein & Timing
2️⃣ Hydration
3️⃣ Pre/Post Workout
4️⃣ Meal Prep
5️⃣ Supplements
6️⃣ Sleep & Recovery
7️⃣ Macronutrients
8️⃣ Random Tip

*Reply with a number!*`;
  return msg;
}

function formatMembershipInfo(): string {
  let msg = `💳 *FITMIND Memberships*\n\n`;
  memberships.forEach((m, i) => {
    const features = m.features.slice(0, 3).join(', ');
    msg += `${i + 1}. *${m.type}* - $${m.price}/mo\n   ${features}...\n\n`;
  });
  msg += `*Reply with a number for details or to sign up!*`;
  return msg;
}

function formatWorkoutDetail(workout: WorkoutRecommendation): string {
  let msg = `🏆 *${workout.name}*\n`;
  msg += `📊 Level: ${workout.level} | ⏱ ${workout.duration} | 🎯 ${workout.goal}\n\n`;
  msg += `*Exercises:*\n`;
  workout.exercises.forEach(e => { msg += `  ▸ ${e}\n`; });
  msg += `\n*Benefits:*\n`;
  workout.benefits.forEach(b => { msg += `  ✨ ${b}\n`; });
  msg += `\n*Tips:*\n`;
  workout.tips.forEach(t => { msg += `  💡 ${t}\n`; });
  return msg;
}

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    service: 'FITMIND WhatsApp AI',
    status: 'running',
    port: PORT,
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      webhook: 'POST /webhook/whatsapp',
      session: 'POST /api/session',
      bookings: 'GET/POST /api/bookings',
      workouts: 'GET /api/workouts',
      nutrition: 'GET /api/nutrition',
      membership: 'GET /api/membership',
    },
  });
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'fitmind-whatsapp-ai',
    activeSessions: sessions.size,
  });
});

// Webhook for WhatsApp messages
app.post('/webhook/whatsapp', (req: Request, res: Response) => {
  const { from, message, sessionId, intent } = req.body;

  if (!from) {
    return res.status(400).json({ error: 'Sender phone number is required' });
  }

  let session = sessionId ? getSession(sessionId) : undefined;
  if (!session) {
    session = createSession(from);
  }

  const response = processMessage(session, message, intent);

  res.json({
    success: true,
    sessionId: session.id,
    response,
  });
});

// Create session endpoint
app.post('/api/session', (req: Request, res: Response) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  const session = createSession(phone);

  res.json({
    success: true,
    sessionId: session.id,
    message: formatMainMenu(),
  });
});

function processMessage(session: WhatsAppSession, message: string, intent?: string): string {
  const lowerMsg = message?.toLowerCase().trim() || '';
  let response = '';

  // Intent-based routing
  if (intent) {
    return handleIntent(session, intent);
  }

  switch (session.state) {
    case 'welcome':
      response = handleWelcome(session, lowerMsg, message);
      break;
    case 'booking':
      response = handleBooking(session, lowerMsg, message);
      break;
    case 'workout':
      response = handleWorkout(session, lowerMsg, message);
      break;
    case 'nutrition':
      response = handleNutrition(session, lowerMsg, message);
      break;
    case 'membership':
      response = handleMembership(session, lowerMsg, message);
      break;
    case 'awaiting_confirmation':
      response = handleConfirmation(session, lowerMsg, message);
      break;
    default:
      response = formatMainMenu();
      session.state = 'welcome';
  }

  return response;
}

function handleIntent(session: WhatsAppSession, intent: string): string {
  switch (intent) {
    case 'book_class':
      session.state = 'booking';
      return formatClassList();
    case 'workout_help':
      session.state = 'workout';
      return formatWorkoutMenu();
    case 'nutrition_help':
      session.state = 'nutrition';
      return formatNutritionMenu();
    case 'membership_info':
      session.state = 'membership';
      return formatMembershipInfo();
    case 'greetings':
      return formatMainMenu();
    default:
      return formatMainMenu();
  }
}

function handleWelcome(session: WhatsAppSession, lowerMsg: string, message: string): string {
  // Handle quick replies
  if (['1', 'book', 'booking'].includes(message)) {
    session.state = 'booking';
    return formatClassList();
  }

  if (['2', 'workout', 'exercise'].includes(message)) {
    session.state = 'workout';
    return formatWorkoutMenu();
  }

  if (['3', 'nutrition', 'diet', 'food'].includes(message)) {
    session.state = 'nutrition';
    return formatNutritionMenu();
  }

  if (['4', 'membership', 'plan', 'price'].includes(message)) {
    session.state = 'membership';
    return formatMembershipInfo();
  }

  if (['5', 'my bookings', 'bookings'].includes(message)) {
    return formatMyBookings();
  }

  if (['6', 'trainer', 'contact'].includes(message)) {
    return `👨‍🏫 *Contact a Trainer*

Our trainers are available for consultation:

📞 Mike J. (CrossFit/Boxing): 555-0101
📞 Sarah C. (Yoga/Pilates): 555-0102
📞 David P. (HIIT/Cardio): 555-0103
📞 Emma W. (Weights): 555-0104

*Or reply "book trainer" to schedule a session!*`;
  }

  // Check for natural language queries
  if (lowerMsg.includes('class') || lowerMsg.includes('book')) {
    session.state = 'booking';
    return formatClassList();
  }

  if (lowerMsg.includes('workout') || lowerMsg.includes('exercise')) {
    session.state = 'workout';
    return formatWorkoutMenu();
  }

  if (lowerMsg.includes('nutrition') || lowerMsg.includes('diet') || lowerMsg.includes('eat')) {
    session.state = 'nutrition';
    return formatNutritionMenu();
  }

  if (lowerMsg.includes('member') || lowerMsg.includes('price') || lowerMsg.includes('plan')) {
    session.state = 'membership';
    return formatMembershipInfo();
  }

  return formatMainMenu();
}

function handleBooking(session: WhatsAppSession, lowerMsg: string, message: string): string {
  const num = parseInt(message);

  if (num >= 1 && num <= classSchedule.length) {
    const selectedClass = classSchedule[num - 1];

    if (selectedClass.spots === 0) {
      return `😔 *${selectedClass.name}* is fully booked!

Would you like to:
1️⃣ Join the waitlist
2️⃣ See other classes
3️⃣ Main menu

*Reply with your choice!*`;
    }

    session.data.selectedClass = selectedClass;
    session.state = 'awaiting_confirmation';

    return `✅ *Confirm Booking*

📅 ${selectedClass.name}
👤 Trainer: ${selectedClass.trainer}
⏰ Time: ${selectedClass.time}
📊 Level: ${selectedClass.level}
🟢 ${selectedClass.spots} spots available

*Reply YES to confirm or NO to cancel*`;
  }

  if (lowerMsg === 'back' || lowerMsg === 'menu') {
    session.state = 'welcome';
    return formatMainMenu();
  }

  return `Please reply with a number (1-${classSchedule.length}) or "back" for menu.`;
}

function handleWorkout(session: WhatsAppSession, lowerMsg: string, message: string): string {
  // Goal selection
  if (['1', 'weight loss', 'lose weight', 'fat burn', 'burn fat'].includes(lowerMsg) || lowerMsg.includes('weight loss')) {
    session.data.goal = 'weight_loss';
    const workouts = workoutRecommendations.filter(w => w.goal === 'weight_loss');
    let msg = `🔥 *Weight Loss Workouts*\n\n`;
    workouts.forEach((w, i) => {
      msg += `${i + 1}. ${w.name} (${w.level}) - ${w.duration}\n`;
    });
    msg += `\n*Reply with a number for details!*`;
    return msg;
  }

  if (['2', 'muscle', 'gain', 'build'].includes(lowerMsg) || lowerMsg.includes('muscle')) {
    session.data.goal = 'muscle_gain';
    const workouts = workoutRecommendations.filter(w => w.goal === 'muscle_gain');
    let msg = `💪 *Muscle Gain Workouts*\n\n`;
    workouts.forEach((w, i) => {
      msg += `${i + 1}. ${w.name} (${w.level}) - ${w.duration}\n`;
    });
    msg += `\n*Reply with a number for details!*`;
    return msg;
  }

  if (['3', 'flexibility', 'stretch', 'stretching'].includes(lowerMsg) || lowerMsg.includes('flexibility')) {
    const workouts = workoutRecommendations.filter(w => w.goal === 'flexibility');
    return formatWorkoutDetail(workouts[0]);
  }

  if (['4', 'cardio', 'endurance', 'running'].includes(lowerMsg) || lowerMsg.includes('cardio')) {
    const workouts = workoutRecommendations.filter(w => w.goal === 'cardio');
    return formatWorkoutDetail(workouts[0]);
  }

  // Check if it's a workout selection
  const num = parseInt(message);
  if (num >= 1 && num <= workoutRecommendations.length) {
    return formatWorkoutDetail(workoutRecommendations[num - 1]);
  }

  // Level selection
  if (['a', 'beginner', 'start', 'new'].includes(lowerMsg)) {
    const workouts = workoutRecommendations.filter(w => w.level === 'beginner');
    let msg = `🌱 *Beginner Workouts*\n\n`;
    workouts.forEach((w, i) => {
      msg += `${i + 1}. ${w.name} - ${w.duration} - ${w.goal}\n`;
    });
    msg += `\n*Reply with a number for details!*`;
    return msg;
  }

  if (['b', 'intermediate'].includes(lowerMsg)) {
    const workouts = workoutRecommendations.filter(w => w.level === 'intermediate');
    let msg = `⭐ *Intermediate Workouts*\n\n`;
    workouts.forEach((w, i) => {
      msg += `${i + 1}. ${w.name} - ${w.duration} - ${w.goal}\n`;
    });
    msg += `\n*Reply with a number for details!*`;
    return msg;
  }

  if (['c', 'advanced'].includes(lowerMsg)) {
    const workouts = workoutRecommendations.filter(w => w.level === 'advanced');
    let msg = `🏆 *Advanced Workouts*\n\n`;
    workouts.forEach((w, i) => {
      msg += `${i + 1}. ${w.name} - ${w.duration} - ${w.goal}\n`;
    });
    msg += `\n*Reply with a number for details!*`;
    return msg;
  }

  if (lowerMsg === 'back' || lowerMsg === 'menu') {
    session.state = 'welcome';
    return formatMainMenu();
  }

  return formatWorkoutMenu();
}

function handleNutrition(session: WhatsAppSession, lowerMsg: string, message: string): string {
  const num = parseInt(message);

  const categoryMap: Record<number, string> = {
    1: 'protein',
    2: 'hydration',
    3: 'pre_workout',
    4: 'meal_prep',
    5: 'supplements',
    6: 'sleep',
    7: 'macros',
    8: 'random',
  };

  if (num >= 1 && num <= 7) {
    const category = categoryMap[num];
    const tip = nutritionTips.find(t => t.category === category);
    if (tip) {
      return `${tip.icon} *${tip.title}*\n\n${tip.content}\n\n*Reply "more" for another tip or "back" for menu*`;
    }
  }

  if (num === 8 || lowerMsg === 'random' || lowerMsg === 'surprise') {
    const randomTip = nutritionTips[Math.floor(Math.random() * nutritionTips.length)];
    return `${randomTip.icon} *${randomTip.title}*\n\n${randomTip.content}\n\n*Reply "more" for another tip or "back" for menu*`;
  }

  if (lowerMsg === 'more') {
    const randomTip = nutritionTips[Math.floor(Math.random() * nutritionTips.length)];
    return `${randomTip.icon} *${randomTip.title}*\n\n${randomTip.content}\n\n*Reply "more" for another tip or "back" for menu*`;
  }

  if (lowerMsg === 'back' || lowerMsg === 'menu') {
    session.state = 'welcome';
    return formatMainMenu();
  }

  return formatNutritionMenu();
}

function handleMembership(session: WhatsAppSession, lowerMsg: string, message: string): string {
  const num = parseInt(message);

  if (num >= 1 && num <= memberships.length) {
    const plan = memberships[num - 1];
    let msg = `💳 *${plan.type} Plan*\n`;
    msg += `💰 $${plan.price}/month\n\n`;
    msg += `*Includes:*\n`;
    plan.features.forEach(f => { msg += `  ✅ ${f}\n`; });
    msg += `\n*Reply "sign up" to get started or "compare" to see other plans!*`;
    session.data.selectedPlan = plan;
    return msg;
  }

  if (lowerMsg === 'sign up' || lowerMsg === 'join') {
    return `🎉 *Welcome to FITMIND!*\n\nTo complete your signup:\n\n1️⃣ Visit our app or website\n2️⃣ Choose your plan\n3️⃣ Complete payment\n\n*Or reply with your preferred plan (1, 2, or 3) and we'll help you get started!*`;
  }

  if (lowerMsg === 'compare') {
    return formatMembershipInfo();
  }

  if (lowerMsg === 'back' || lowerMsg === 'menu') {
    session.state = 'welcome';
    return formatMainMenu();
  }

  return formatMembershipInfo();
}

function handleConfirmation(session: WhatsAppSession, lowerMsg: string, message: string): string {
  if (lowerMsg === 'yes' || lowerMsg === 'confirm' || lowerMsg === 'y') {
    const selectedClass = session.data.selectedClass;
    if (selectedClass) {
      const bookingId = uuidv4();
      selectedClass.spots -= 1;

      return `✅ *Booking Confirmed!*\n\n📅 ${selectedClass.name}\n👤 ${selectedClass.trainer}\n⏰ ${selectedClass.time}\n🔖 Confirmation: ${bookingId.substring(0, 8).toUpperCase()}\n\n*See you there! Reply "book" for more or "menu" for main menu.*`;
    }
  }

  if (lowerMsg === 'no' || lowerMsg === 'cancel' || lowerMsg === 'n') {
    session.state = 'welcome';
    return `❌ Booking cancelled.\n\n${formatMainMenu()}`;
  }

  return `Please reply YES to confirm or NO to cancel.`;
}

function formatMyBookings(): string {
  // Simulated bookings
  return `📋 *Your Bookings*

No upcoming bookings.

*Ready to book a class?*
Reply "book" or "1" to see available classes!`;
}

// REST API Endpoints

// Get all workouts
app.get('/api/workouts', (req: Request, res: Response) => {
  const { goal, level } = req.query;

  let filtered = [...workoutRecommendations];

  if (goal) {
    filtered = filtered.filter(w => w.goal === goal);
  }

  if (level) {
    filtered = filtered.filter(w => w.level === level);
  }

  res.json({
    success: true,
    data: filtered,
    count: filtered.length,
  });
});

// Get workout by ID
app.get('/api/workouts/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const workout = workoutRecommendations.find(w => w.id === id);

  if (!workout) {
    return res.status(404).json({
      success: false,
      error: 'Workout not found',
    });
  }

  res.json({
    success: true,
    data: workout,
  });
});

// Get nutrition tips
app.get('/api/nutrition', (req: Request, res: Response) => {
  const { category } = req.query;

  let filtered = [...nutritionTips];

  if (category) {
    filtered = filtered.filter(t => t.category === category);
  }

  res.json({
    success: true,
    data: filtered,
    count: filtered.length,
  });
});

// Get memberships
app.get('/api/membership', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: memberships,
  });
});

// Get class schedule
app.get('/api/classes', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: classSchedule,
  });
});

// Create booking
app.post('/api/bookings', (req: Request, res: Response) => {
  const { classId, memberName, phone } = req.body;

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

  if (gymClass.spots <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Class is fully booked',
    });
  }

  const bookingId = uuidv4();
  gymClass.spots -= 1;

  res.json({
    success: true,
    booking: {
      id: bookingId,
      classId,
      className: gymClass.name,
      trainer: gymClass.trainer,
      time: gymClass.time,
      memberName,
      confirmationCode: bookingId.substring(0, 8).toUpperCase(),
    },
  });
});

// Get bookings
app.get('/api/bookings', (req: Request, res: Response) => {
  const { phone } = req.query;

  res.json({
    success: true,
    data: [],
    message: phone ? `Bookings for ${phone}` : 'All bookings',
  });
});

// Cancel booking
app.delete('/api/bookings/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  res.json({
    success: true,
    message: `Booking ${id} cancelled`,
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('Error:', err.message);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`FITMIND WhatsApp AI running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Webhook endpoint: POST http://localhost:${PORT}/webhook/whatsapp`);
  console.log(`Workouts API: GET http://localhost:${PORT}/api/workouts`);
  console.log(`Nutrition API: GET http://localhost:${PORT}/api/nutrition`);
});

export default app;
