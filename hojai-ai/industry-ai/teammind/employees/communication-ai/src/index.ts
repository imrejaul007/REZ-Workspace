import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 3005;

app.use(express.json());

// In-memory store for communication data
const messages: Map<string, any> = new Map();
const channels: Map<string, any> = new Map();
const reactions: Map<string, any> = new Map();

// Initialize default channels
const defaultChannels = [
  { id: 'general', name: 'General', type: 'public', description: 'General discussions' },
  { id: 'announcements', name: 'Announcements', type: 'broadcast', description: 'Important announcements' },
  { id: 'team-meetings', name: 'Team Meetings', type: 'private', description: 'Meeting coordination' }
];

defaultChannels.forEach(ch => channels.set(ch.id, ch));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'communication-ai', timestamp: new Date().toISOString() });
});

// Get all channels
app.get('/api/channels', (_req: Request, res: Response) => {
  const channelList = Array.from(channels.values());
  res.json({ success: true, count: channelList.length, data: channelList });
});

// Create a channel
app.post('/api/channels', (req: Request, res: Response) => {
  const { name, type, description } = req.body;

  if (!name) {
    res.status(400).json({ success: false, error: 'Channel name is required' });
    return;
  }

  const channel = {
    id: uuidv4(),
    name,
    type: type || 'public',
    description: description || '',
    createdAt: new Date().toISOString()
  };

  channels.set(channel.id, channel);
  res.status(201).json({ success: true, data: channel });
});

// Get messages in a channel
app.get('/api/channels/:channelId/messages', (req: Request, res: Response) => {
  const { channelId } = req.params;
  const channelMessages = Array.from(messages.values()).filter(
    (m: any) => m.channelId === channelId
  );
  res.json({ success: true, channelId, count: channelMessages.length, data: channelMessages });
});

// Send a message
app.post('/api/messages', (req: Request, res: Response) => {
  const { channelId, senderId, content, mentions } = req.body;

  if (!channelId || !senderId || !content) {
    res.status(400).json({ success: false, error: 'channelId, senderId, and content are required' });
    return;
  }

  const message = {
    id: uuidv4(),
    channelId,
    senderId,
    content,
    mentions: mentions || [],
    reactions: [],
    createdAt: new Date().toISOString()
  };

  messages.set(message.id, message);
  res.status(201).json({ success: true, data: message });
});

// Add reaction to a message
app.post('/api/messages/:messageId/reactions', (req: Request, res: Response) => {
  const { messageId } = req.params;
  const { userId, emoji } = req.body;

  if (!userId || !emoji) {
    res.status(400).json({ success: false, error: 'userId and emoji are required' });
    return;
  }

  const message = messages.get(messageId);
  if (!message) {
    res.status(404).json({ success: false, error: 'Message not found' });
    return;
  }

  const reaction = {
    id: uuidv4(),
    messageId,
    userId,
    emoji,
    createdAt: new Date().toISOString()
  };

  reactions.set(reaction.id, reaction);
  message.reactions.push(reaction);
  messages.set(messageId, message);

  res.status(201).json({ success: true, data: reaction });
});

// Get communication stats
app.get('/api/stats', (_req: Request, res: Response) => {
  const allMessages = Array.from(messages.values());
  const allChannels = Array.from(channels.values());

  res.json({
    success: true,
    data: {
      totalChannels: allChannels.length,
      totalMessages: allMessages.length,
      totalReactions: Array.from(reactions.keys()).length,
      mostActiveChannel: allMessages.reduce((acc: any, m: any) => {
        acc[m.channelId] = (acc[m.channelId] || 0) + 1;
        return acc;
      }, {})
    }
  });
});

// Delete message
app.delete('/api/messages/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = messages.delete(id);

  if (deleted) {
    res.json({ success: true, message: 'Message deleted' });
  } else {
    res.status(404).json({ success: false, error: 'Message not found' });
  }
});

app.listen(PORT, () => {
  console.log(`Communication AI service running on port ${PORT}`);
});

export default app;