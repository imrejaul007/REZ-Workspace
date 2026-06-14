import { authClient } from '@/lib/api/client';

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'order' | 'recommendation' | 'reservation' | 'handoff';
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface ChatResponse {
  type: 'text' | 'order' | 'recommendation' | 'reservation' | 'handoff';
  content: string;
  items?: Array<{ name: string; qty: number; unitPrice: number; total: number }>;
  reservationParams?: {
    date: string;
    time: string;
    guests: number;
    name?: string;
    phone?: string;
  };
}

interface ChatErrorResponse {
  success: false;
  error: string;
  code?: string;
}

/**
 * Send a message to the AI chat backend and return the assistant's response.
 */
export async function sendChatMessage(
  storeSlug: string,
  message: string,
  conversationId: string,
  customerId?: string
): Promise<ChatResponse> {
  const res = await authClient.post<ChatResponse | ChatErrorResponse>('/api/ai/chat', {
    storeSlug,
    message,
    conversationId,
    customerId,
  });

  if ('success' in res.data && !res.data.success && 'error' in res.data) {
    const err = res.data as ChatErrorResponse;
    const error = new Error(err.error || 'AI chat failed');
    (error as NodeJS.ErrnoException).code = err.code ?? 'CHAT_ERROR';
    throw error;
  }

  return res.data as ChatResponse;
}

/**
 * Retrieve the full conversation history for the given conversationId.
 */
export async function getChatHistory(conversationId: string): Promise<AIMessage[]> {
  const res = await authClient.get<{ messages: AIMessage[] }>('/api/ai/chat/history', {
    params: { conversationId },
  });
  return res.data.messages ?? [];
}

/**
 * Clear all messages for the given conversationId.
 */
export async function clearChatHistory(conversationId: string): Promise<void> {
  await authClient.delete('/api/ai/chat/history', {
    params: { conversationId },
  });
}
