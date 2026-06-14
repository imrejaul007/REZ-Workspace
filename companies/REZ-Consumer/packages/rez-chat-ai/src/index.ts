/**
 * @rez/chat-ai - Stub package
 * Real implementation would connect to REZ Chat AI Service
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
}

export async function sendChatMessage(
  message: string,
  context?: Record<string, unknown>
): Promise<ChatMessage> {
  return {
    id: Date.now().toString(),
    role: 'assistant',
    content: 'AI response (stub)',
    timestamp: new Date(),
  };
}


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-chat-ai',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Liveness probe
app.get('/health/live', (req, res) => {
  res.json({ status: 'alive' });
});

// Readiness probe
app.get('/health/ready', (req, res) => {
  res.json({ status: 'ready' });
});
