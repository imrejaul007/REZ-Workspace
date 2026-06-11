import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 4882;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory data store
interface Task {
  id: string;
  title: string;
  status: 'pending' | 'in-progress' | 'completed';
  assignee: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  createdAt: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  status: 'available' | 'busy' | 'offline';
}

interface Notification {
  id: string;
  recipientId: string;
  type: 'task' | 'meeting' | 'reminder' | 'update';
  message: string;
  read: boolean;
  createdAt: string;
}

interface ChatMessage {
  id: string;
  senderId: string;
  recipientId?: string;
  message: string;
  timestamp: string;
}

const tasks: Map<string, Task> = new Map();
const teamMembers: Map<string, TeamMember> = new Map();
const notifications: Map<string, Notification> = new Map();
const chatMessages: Map<string, ChatMessage[]> = new Map();

// Initialize sample data
const initializeSampleData = () => {
  const member1: TeamMember = {
    id: 'user-001',
    name: 'Alice Johnson',
    role: 'Project Manager',
    email: 'alice@teammind.com',
    status: 'available'
  };
  const member2: TeamMember = {
    id: 'user-002',
    name: 'Bob Smith',
    role: 'Developer',
    email: 'bob@teammind.com',
    status: 'busy'
  };
  const member3: TeamMember = {
    id: 'user-003',
    name: 'Carol Davis',
    role: 'Designer',
    email: 'carol@teammind.com',
    status: 'available'
  };
  teamMembers.set(member1.id, member1);
  teamMembers.set(member2.id, member2);
  teamMembers.set(member3.id, member3);

  const task1: Task = {
    id: uuidv4(),
    title: 'Complete API documentation',
    status: 'in-progress',
    assignee: 'user-002',
    priority: 'high',
    dueDate: new Date(Date.now() + 86400000).toISOString(),
    createdAt: new Date().toISOString()
  };
  const task2: Task = {
    id: uuidv4(),
    title: 'Design new dashboard',
    status: 'pending',
    assignee: 'user-003',
    priority: 'medium',
    createdAt: new Date().toISOString()
  };
  tasks.set(task1.id, task1);
  tasks.set(task2.id, task2);
};

initializeSampleData();

// Conversation flow states
type ConversationState = 'main' | 'tasks' | 'meetings' | 'team' | 'chat' | 'notifications';

interface UserConversation {
  userId: string;
  state: ConversationState;
  context: Record<string, any>;
  lastActivity: string;
}

const userConversations: Map<string, UserConversation> = new Map();

// Generate response based on message intent
interface ParsedIntent {
  intent: string;
  entities: Record<string, any>;
  confidence: number;
}

const parseMessage = (message: string): ParsedIntent => {
  const lowerMsg = message.toLowerCase();

  // Task intents
  if (lowerMsg.includes('task') || lowerMsg.includes('todo') || lowerMsg.includes('work')) {
    if (lowerMsg.includes('create') || lowerMsg.includes('add') || lowerMsg.includes('new')) {
      return { intent: 'create_task', entities: { title: extractTitle(message) }, confidence: 0.9 };
    }
    if (lowerMsg.includes('update') || lowerMsg.includes('status') || lowerMsg.includes('change')) {
      return { intent: 'update_task', entities: { status: extractStatus(lowerMsg) }, confidence: 0.8 };
    }
    if (lowerMsg.includes('list') || lowerMsg.includes('show') || lowerMsg.includes('my tasks')) {
      return { intent: 'list_tasks', entities: {}, confidence: 0.9 };
    }
    return { intent: 'task_help', entities: {}, confidence: 0.7 };
  }

  // Meeting intents
  if (lowerMsg.includes('meeting') || lowerMsg.includes('schedule') || lowerMsg.includes('calendar')) {
    if (lowerMsg.includes('schedule') || lowerMsg.includes('book') || lowerMsg.includes('create')) {
      return { intent: 'schedule_meeting', entities: {}, confidence: 0.9 };
    }
    return { intent: 'list_meetings', entities: {}, confidence: 0.8 };
  }

  // Team intents
  if (lowerMsg.includes('team') || lowerMsg.includes('member') || lowerMsg.includes('colleague')) {
    if (lowerMsg.includes('status') || lowerMsg.includes('available') || lowerMsg.includes('online')) {
      return { intent: 'team_status', entities: {}, confidence: 0.9 };
    }
    return { intent: 'team_help', entities: {}, confidence: 0.7 };
  }

  // Notification intents
  if (lowerMsg.includes('notification') || lowerMsg.includes('alert') || lowerMsg.includes('reminder')) {
    return { intent: 'show_notifications', entities: {}, confidence: 0.9 };
  }

  // Chat intents
  if (lowerMsg.includes('message') || lowerMsg.includes('tell') || lowerMsg.includes('ask')) {
    return { intent: 'send_message', entities: { text: message }, confidence: 0.8 };
  }

  // Help
  if (lowerMsg.includes('help') || lowerMsg.includes('what can')) {
    return { intent: 'help', entities: {}, confidence: 1.0 };
  }

  return { intent: 'unknown', entities: {}, confidence: 0.3 };
};

const extractTitle = (message: string): string => {
  const patterns = [
    /(?:create|add|new)\s+(?:a\s+)?(?:task\s+)?["']?(.+?)["']?\s*$/i,
    /(?:task\s+(?:to\s+)?)?["']?(.+?)["']?\s*(?:task)?\s*$/i
  ];
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) return match[1].trim();
  }
  return message;
};

const extractStatus = (message: string): string => {
  if (message.includes('complete') || message.includes('done')) return 'completed';
  if (message.includes('progress') || message.includes('working')) return 'in-progress';
  if (message.includes('start') || message.includes('begin')) return 'pending';
  return 'pending';
};

// Generate WhatsApp-formatted response
const generateResponse = (intent: ParsedIntent, userId: string): string => {
  switch (intent.intent) {
    case 'create_task':
      return `📝 *Create New Task*

Great! I can help you create a task.
\nTask title: "${intent.entities.title || 'Untitled Task'}"
\nPlease reply with the task details in this format:
*Title:* [task name]
*Assignee:* [team member name or ID]
*Priority:* [low/medium/high]
*Due date:* [optional - date]`;

    case 'list_tasks':
      const userTasks = Array.from(tasks.values()).filter(t => t.assignee === userId || t.assignee === 'all');
      if (userTasks.length === 0) {
        return `📋 *Your Tasks*

You have no assigned tasks at the moment. ✅`;
      }
      let taskList = `📋 *Your Tasks (${userTasks.length})*\n\n`;
      userTasks.forEach((task, i) => {
        const statusEmoji = task.status === 'completed' ? '✅' : task.status === 'in-progress' ? '🔄' : '⏳';
        const priorityEmoji = task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢';
        taskList += `${i + 1}. ${statusEmoji} ${priorityEmoji} *${task.title}*\n`;
        taskList += `   Status: ${task.status}\n\n`;
      });
      taskList += `\nReply with "update task [number] to [status]" to update.`;
      return taskList;

    case 'update_task':
      return `🔄 *Update Task Status*

Which task would you like to update?
\nPlease reply with the task number and new status:
*Task:* [task number]
*Status:* [pending/in-progress/completed]`;

    case 'task_help':
      return `📋 *Task Commands*

• "my tasks" - List your assigned tasks
• "create task [title]" - Create a new task
• "update task [number] to [status]" - Change task status
• "high priority tasks" - Show urgent tasks`;

    case 'schedule_meeting':
      return `📅 *Schedule a Meeting*

I can help you schedule a meeting!
\nPlease provide:
• *Title:* [meeting name]
• *Participants:* [names or @mentions]
• *Date & Time:* [when]
• *Duration:* [how long in minutes]`;

    case 'list_meetings':
      return `📅 *Upcoming Meetings*

You have *2* upcoming meetings:
\n1. *Sprint Planning*
   📆 Today at 2:00 PM
   👥 Alice, Bob, Carol
   ⏱️ 60 minutes
\n2. *Design Review*
   📆 Tomorrow at 10:00 AM
   👥 Carol
   ⏱️ 30 minutes

Reply "join [number]" to join a meeting.`;

    case 'team_status':
      const available = Array.from(teamMembers.values()).filter(m => m.status === 'available');
      const busy = Array.from(teamMembers.values()).filter(m => m.status === 'busy');
      let statusMsg = `👥 *Team Status*\n\n`;
      statusMsg += `🟢 *Available (${available.length})*\n`;
      available.forEach(m => { statusMsg += `   • ${m.name} - ${m.role}\n`; });
      statusMsg += `\n🔴 *Busy (${busy.length})*\n`;
      busy.forEach(m => { statusMsg += `   • ${m.name} - ${m.role}\n`; });
      return statusMsg;

    case 'team_help':
      return `👥 *Team Commands*

• "team status" - See who is available
• "message [name]" - Send a message
• "team performance" - View team metrics
• "find [skill]" - Find team members by skill`;

    case 'show_notifications':
      const userNotifs = Array.from(notifications.values()).filter(n => n.recipientId === userId && !n.read);
      if (userNotifs.length === 0) {
        return `🔔 *Notifications*

No new notifications. You're all caught up! 🎉`;
      }
      let notifMsg = `🔔 *Notifications (${userNotifs.length} new)*\n\n`;
      userNotifs.forEach(n => { notifMsg += `• ${n.message}\n`; });
      return notifMsg;

    case 'send_message':
      return `💬 *Send a Message*

Who would you like to message?
\nReply with the team member's name or ID, or select from:
${Array.from(teamMembers.values()).map(m => `• ${m.name}`).join('\n')}`;

    case 'help':
      return `🤖 *TeamMind WhatsApp Assistant*

Welcome! Here's what I can help you with:

📋 *Tasks*
• "my tasks" - View your tasks
• "create task" - Add new task
• "update task" - Change status

📅 *Meetings*
• "upcoming meetings" - See schedule
• "schedule meeting" - Book new meeting

👥 *Team*
• "team status" - Check availability
• "message [name]" - Chat with colleagues

🔔 *Other*
• "notifications" - View alerts
• "performance" - Team metrics

What would you like to do?`;

    default:
      return `🤖 I'm not sure I understood that.

Try saying:
• "my tasks"
• "team status"
• "schedule a meeting"
• "help" for all commands`;
  }
};

// WhatsApp webhook (Twilio format)
app.post('/webhook/whatsapp', (req: Request, res: Response) => {
  const { From, Body, MessageSid } = req.body;
  const userId = From.replace('whatsapp:', '');

  // Update or create conversation
  let conversation = userConversations.get(userId);
  if (!conversation) {
    conversation = {
      userId,
      state: 'main',
      context: {},
      lastActivity: new Date().toISOString()
    };
    userConversations.set(userId, conversation);
  }
  conversation.lastActivity = new Date().toISOString();

  // Parse intent and generate response
  const intent = parseMessage(Body);
  const response = generateResponse(intent, userId);

  // Store the message
  const message: ChatMessage = {
    id: MessageSid || uuidv4(),
    senderId: userId,
    message: Body,
    timestamp: new Date().toISOString()
  };
  const userMessages = chatMessages.get(userId) || [];
  userMessages.push(message);
  chatMessages.set(userId, userMessages);

  // Return TwiML response
  res.type('text/xml').send(`
    <Response>
      <Message>${response.replace(/\*/g, '')}</Message>
    </Response>
  `);
});

// REST API Endpoints

// Tasks API
app.get('/api/tasks', (req: Request, res: Response) => {
  const { assignee, status, priority } = req.query;
  let taskList = Array.from(tasks.values());

  if (assignee) taskList = taskList.filter(t => t.assignee === assignee);
  if (status) taskList = taskList.filter(t => t.status === status);
  if (priority) taskList = taskList.filter(t => t.priority === priority);

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
  const { title, assignee, priority = 'medium', dueDate } = req.body;
  if (!title) {
    return res.status(400).json({ success: false, error: 'Title is required' });
  }
  const task: Task = {
    id: uuidv4(),
    title,
    status: 'pending',
    assignee: assignee || 'all',
    priority,
    dueDate,
    createdAt: new Date().toISOString()
  };
  tasks.set(task.id, task);

  // Create notification
  const notification: Notification = {
    id: uuidv4(),
    recipientId: assignee || 'all',
    type: 'task',
    message: `New task created: ${title}`,
    read: false,
    createdAt: new Date().toISOString()
  };
  notifications.set(notification.id, notification);

  res.status(201).json({ success: true, data: task });
});

app.patch('/api/tasks/:id', (req: Request, res: Response) => {
  const task = tasks.get(req.params.id);
  if (!task) {
    return res.status(404).json({ success: false, error: 'Task not found' });
  }
  const { status, title, priority, dueDate } = req.body;
  if (status) task.status = status;
  if (title) task.title = title;
  if (priority) task.priority = priority;
  if (dueDate) task.dueDate = dueDate;
  tasks.set(task.id, task);
  res.json({ success: true, data: task });
});

// Notifications API
app.get('/api/notifications', (req: Request, res: Response) => {
  const { recipientId, unreadOnly } = req.query;
  let notifList = Array.from(notifications.values());

  if (recipientId) notifList = notifList.filter(n => n.recipientId === recipientId);
  if (unreadOnly === 'true') notifList = notifList.filter(n => !n.read);

  res.json({ success: true, data: notifList, count: notifList.length });
});

app.patch('/api/notifications/:id/read', (req: Request, res: Response) => {
  const notification = notifications.get(req.params.id);
  if (!notification) {
    return res.status(404).json({ success: false, error: 'Notification not found' });
  }
  notification.read = true;
  notifications.set(notification.id, notification);
  res.json({ success: true, data: notification });
});

// Chat Messages API
app.get('/api/chat/:userId', (req: Request, res: Response) => {
  const messages = chatMessages.get(req.params.userId) || [];
  res.json({ success: true, data: messages, count: messages.length });
});

app.post('/api/chat/send', (req: Request, res: Response) => {
  const { senderId, recipientId, message } = req.body;
  if (!senderId || !message) {
    return res.status(400).json({ success: false, error: 'senderId and message are required' });
  }
  const chatMessage: ChatMessage = {
    id: uuidv4(),
    senderId,
    recipientId,
    message,
    timestamp: new Date().toISOString()
  };
  const messages = chatMessages.get(senderId) || [];
  messages.push(chatMessage);
  chatMessages.set(senderId, messages);

  // Also add to recipient's chat if specified
  if (recipientId) {
    const recipientMessages = chatMessages.get(recipientId) || [];
    recipientMessages.push(chatMessage);
    chatMessages.set(recipientId, recipientMessages);
  }

  res.status(201).json({ success: true, data: chatMessage });
});

// Team API
app.get('/api/team', (req: Request, res: Response) => {
  const { status } = req.query;
  let teamList = Array.from(teamMembers.values());
  if (status) teamList = teamList.filter(m => m.status === status);
  res.json({ success: true, data: teamList, count: teamList.length });
});

app.get('/api/team/:id', (req: Request, res: Response) => {
  const member = teamMembers.get(req.params.id);
  if (!member) {
    return res.status(404).json({ success: false, error: 'Team member not found' });
  }
  res.json({ success: true, data: member });
});

app.patch('/api/team/:id/status', (req: Request, res: Response) => {
  const member = teamMembers.get(req.params.id);
  if (!member) {
    return res.status(404).json({ success: false, error: 'Team member not found' });
  }
  const { status } = req.body;
  if (!['available', 'busy', 'offline'].includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid status' });
  }
  member.status = status;
  teamMembers.set(member.id, member);

  // Create status update notification
  const notification: Notification = {
    id: uuidv4(),
    recipientId: 'all',
    type: 'update',
    message: `${member.name} is now ${status}`,
    read: false,
    createdAt: new Date().toISOString()
  };
  notifications.set(notification.id, notification);

  res.json({ success: true, data: member });
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'teammind-whatsapp-ai',
    port: PORT,
    stats: {
      tasks: tasks.size,
      teamMembers: teamMembers.size,
      notifications: notifications.size,
      activeConversations: userConversations.size
    }
  });
});

app.listen(PORT, () => {
  console.log(`TeamMind WhatsApp AI running on port ${PORT}`);
  console.log(`WhatsApp webhook at /webhook/whatsapp`);
  console.log(`REST API at /api/*`);
});

export { app };
