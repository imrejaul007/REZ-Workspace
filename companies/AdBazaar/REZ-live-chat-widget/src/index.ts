// Index file - Clean exports for the SDK

export { createWidget, initFromDOM, default } from './widget';
export type { ReZLiveChatWidget } from './widget';

// Re-export types
export type {
  ChatMessage,
  Attachment,
  QuickReplyOption,
  Agent,
  ChatSession,
  ChatConfig,
  WidgetState,
  FileUpload,
  SendMessagePayload,
  WebSocketMessage,
  APIResponse,
  StartSessionResponse,
  UploadResponse,
  WidgetEvent,
  WidgetEventType,
  WidgetEventHandler,
} from './types';

// Re-export config defaults
export { DEFAULT_CONFIG } from './types';


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-live-chat-widget',
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
