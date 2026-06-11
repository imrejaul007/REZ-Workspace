import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 4881;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory data store for team management
interface Task {
  id: string;
  title: string;
  status: 'pending' | 'in-progress' | 'completed';
  assignee: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

interface Meeting {
  id: string;
  title: string;
  participants: string[];
  scheduledAt: string;
  duration: number;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  status: 'available' | 'busy' | 'offline';
}

const tasks: Map<string, Task> = new Map();
const meetings: Map<string, Meeting> = new Map();
const teamMembers: Map<string, TeamMember> = new Map();

// Initialize with sample data
const initializeSampleData = () => {
  const member1: TeamMember = {
    id: uuidv4(),
    name: 'Alice Johnson',
    role: 'Project Manager',
    email: 'alice@teammind.com',
    status: 'available'
  };
  const member2: TeamMember = {
    id: uuidv4(),
    name: 'Bob Smith',
    role: 'Developer',
    email: 'bob@teammind.com',
    status: 'busy'
  };
  teamMembers.set(member1.id, member1);
  teamMembers.set(member2.id, member2);

  const task1: Task = {
    id: uuidv4(),
    title: 'Complete API documentation',
    status: 'in-progress',
    assignee: member1.id,
    priority: 'high',
    createdAt: new Date().toISOString()
  };
  tasks.set(task1.id, task1);

  const meeting1: Meeting = {
    id: uuidv4(),
    title: 'Sprint Planning',
    participants: [member1.id, member2.id],
    scheduledAt: new Date(Date.now() + 3600000).toISOString(),
    duration: 60,
    status: 'scheduled'
  };
  meetings.set(meeting1.id, meeting1);
};

initializeSampleData();

// IVR Menu handling
interface IVRSession {
  id: string;
  currentMenu: string;
  selectedOption?: string;
  data: Record<string, any>;
}

const ivrSessions: Map<string, IVRSession> = new Map();

// IVR Menu responses
const IVR_MENU_MAIN = `
Welcome to TeamMind Voice Agent.
Your intelligent team management assistant.

Press 1 for Task Status and Updates
Press 2 for Meeting Information
Press 3 for Team Updates and Availability
Press 4 for Performance Reports
Press 0 to speak with a human representative

Or state your request clearly.
`;

const IVR_MENU_TASKS = `
Task Menu:
Press 1 to hear your assigned tasks
Press 2 to update task status
Press 3 to create a new task
Press 4 to get task deadline reminders
Press 9 to return to main menu
Press 0 to speak with a human representative
`;

const IVR_MENU_MEETINGS = `
Meeting Menu:
Press 1 to hear upcoming meetings
Press 2 to join a meeting
Press 3 to schedule a new meeting
Press 4 to cancel or reschedule
Press 9 to return to main menu
Press 0 to speak with a human representative
`;

const IVR_MENU_TEAM = `
Team Menu:
Press 1 to check team member availability
Press 2 to send a team update
Press 3 to view team performance
Press 9 to return to main menu
Press 0 to speak with a human representative
`;

// Webhook endpoint for Twilio/Voice integration
app.post('/webhook/voice', (req: Request, res: Response) => {
  const { From, Digits, SpeechResult, CallSid } = req.body;
  let session = ivrSessions.get(CallSid);

  if (!session) {
    session = {
      id: CallSid,
      currentMenu: 'main',
      data: { caller: From }
    };
    ivrSessions.set(CallSid, session);
  }

  // Handle DTMF input or speech
  const input = Digits || SpeechResult;
  let response = '<?xml version="1.0" encoding="UTF-8"?>';
  response += '<Response>';

  if (!input) {
    // Initial greeting
    response += `<Say voice="alice">${IVR_MENU_MAIN}</Say>`;
    response += '<Gather numDigits="1" timeout="5" speechTimeout="3">';
    response += `<Say voice="alice">Please press a number or speak your request.</Say>`;
    response += '</Gather>';
  } else {
    switch (input) {
      case '1':
        session.currentMenu = 'tasks';
        response += `<Say voice="alice">${IVR_MENU_TASKS}</Say>`;
        response += '<Gather numDigits="1" timeout="5">';
        response += `<Say voice="alice">Please press a number.</Say>`;
        response += '</Gather>';
        break;
      case '2':
        session.currentMenu = 'meetings';
        response += `<Say voice="alice">${IVR_MENU_MEETINGS}</Say>`;
        response += '<Gather numDigits="1" timeout="5">';
        response += `<Say voice="alice">Please press a number.</Say>`;
        response += '</Gather>';
        break;
      case '3':
        session.currentMenu = 'team';
        response += `<Say voice="alice">${IVR_MENU_TEAM}</Say>`;
        response += '<Gather numDigits="1" timeout="5">';
        response += `<Say voice="alice">Please press a number.</Say>`;
        response += '</Gather>';
        break;
      case '4':
        // Performance reports
        const totalTasks = tasks.size;
        const completedTasks = Array.from(tasks.values()).filter(t => t.status === 'completed').length;
        response += `<Say voice="alice">Here is your team performance summary.</Say>`;
        response += `<Say voice="alice">Total tasks: ${totalTasks}. Completed tasks: ${completedTasks}.</Say>`;
        response += `<Say voice="alice">Team members online: ${Array.from(teamMembers.values()).filter(m => m.status !== 'offline').length} of ${teamMembers.size}.</Say>`;
        response += `<Say voice="alice">Thank you for using TeamMind. Goodbye!</Say>`;
        break;
      case '9':
        session.currentMenu = 'main';
        response += `<Say voice="alice">Returning to main menu.</Say>`;
        response += `<Redirect>/webhook/voice</Redirect>`;
        break;
      case '0':
        response += `<Say voice="alice">Connecting you to a human representative. Please hold.</Say>`;
        response += `<Dial record="true">+1234567890</Dial>`;
        break;
      default:
        response += `<Say voice="alice">Invalid option. Please try again.</Say>`;
        response += `<Redirect>/webhook/voice</Redirect>`;
    }
  }

  response += '</Response>';
  res.type('text/xml').send(response);
});

// REST API Endpoints

// Task endpoints
app.get('/api/tasks', (req: Request, res: Response) => {
  const taskList = Array.from(tasks.values());
  res.json({ success: true, data: taskList, count: taskList.length });
});

app.get('/api/tasks/:id', (req: Request, res: Response) => {
  const task = tasks.get(req.params.id);
  if (!task) {
    return res.status(404).json({ success: false, error: 'Task not found' });
  }
  res.json({ success: true, data: task });
});

app.post('/api/tasks', (req: Request, res: Response) => {
  const { title, assignee, priority = 'medium' } = req.body;
  if (!title || !assignee) {
    return res.status(400).json({ success: false, error: 'Title and assignee are required' });
  }
  const task: Task = {
    id: uuidv4(),
    title,
    status: 'pending',
    assignee,
    priority,
    createdAt: new Date().toISOString()
  };
  tasks.set(task.id, task);
  res.status(201).json({ success: true, data: task });
});

app.patch('/api/tasks/:id', (req: Request, res: Response) => {
  const task = tasks.get(req.params.id);
  if (!task) {
    return res.status(404).json({ success: false, error: 'Task not found' });
  }
  const { status, title, priority } = req.body;
  if (status) task.status = status;
  if (title) task.title = title;
  if (priority) task.priority = priority;
  tasks.set(task.id, task);
  res.json({ success: true, data: task });
});

app.delete('/api/tasks/:id', (req: Request, res: Response) => {
  if (!tasks.has(req.params.id)) {
    return res.status(404).json({ success: false, error: 'Task not found' });
  }
  tasks.delete(req.params.id);
  res.json({ success: true, message: 'Task deleted' });
});

// Meeting endpoints
app.get('/api/meetings', (req: Request, res: Response) => {
  const meetingList = Array.from(meetings.values());
  res.json({ success: true, data: meetingList, count: meetingList.length });
});

app.get('/api/meetings/:id', (req: Request, res: Response) => {
  const meeting = meetings.get(req.params.id);
  if (!meeting) {
    return res.status(404).json({ success: false, error: 'Meeting not found' });
  }
  res.json({ success: true, data: meeting });
});

app.post('/api/meetings', (req: Request, res: Response) => {
  const { title, participants, scheduledAt, duration = 30 } = req.body;
  if (!title || !participants || !scheduledAt) {
    return res.status(400).json({ success: false, error: 'Title, participants, and scheduledAt are required' });
  }
  const meeting: Meeting = {
    id: uuidv4(),
    title,
    participants,
    scheduledAt,
    duration,
    status: 'scheduled'
  };
  meetings.set(meeting.id, meeting);
  res.status(201).json({ success: true, data: meeting });
});

app.patch('/api/meetings/:id', (req: Request, res: Response) => {
  const meeting = meetings.get(req.params.id);
  if (!meeting) {
    return res.status(404).json({ success: false, error: 'Meeting not found' });
  }
  const { status, scheduledAt, duration } = req.body;
  if (status) meeting.status = status;
  if (scheduledAt) meeting.scheduledAt = scheduledAt;
  if (duration) meeting.duration = duration;
  meetings.set(meeting.id, meeting);
  res.json({ success: true, data: meeting });
});

// Team member endpoints
app.get('/api/team', (req: Request, res: Response) => {
  const teamList = Array.from(teamMembers.values());
  res.json({ success: true, data: teamList, count: teamList.length });
});

app.get('/api/team/:id', (req: Request, res: Response) => {
  const member = teamMembers.get(req.params.id);
  if (!member) {
    return res.status(404).json({ success: false, error: 'Team member not found' });
  }
  res.json({ success: true, data: member });
});

app.post('/api/team', (req: Request, res: Response) => {
  const { name, role, email } = req.body;
  if (!name || !role || !email) {
    return res.status(400).json({ success: false, error: 'Name, role, and email are required' });
  }
  const member: TeamMember = {
    id: uuidv4(),
    name,
    role,
    email,
    status: 'available'
  };
  teamMembers.set(member.id, member);
  res.status(201).json({ success: true, data: member });
});

app.patch('/api/team/:id', (req: Request, res: Response) => {
  const member = teamMembers.get(req.params.id);
  if (!member) {
    return res.status(404).json({ success: false, error: 'Team member not found' });
  }
  const { name, role, status } = req.body;
  if (name) member.name = name;
  if (role) member.role = role;
  if (status) member.status = status;
  teamMembers.set(member.id, member);
  res.json({ success: true, data: member });
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'teammind-phone-receptionist',
    port: PORT,
    stats: {
      tasks: tasks.size,
      meetings: meetings.size,
      teamMembers: teamMembers.size
    }
  });
});

app.listen(PORT, () => {
  console.log(`TeamMind Phone Receptionist running on port ${PORT}`);
  console.log(`IVR endpoints available at /webhook/voice`);
  console.log(`REST API available at /api/*`);
});

export { app };
