// In-memory conversation model (MongoDB optional for basic version)

export interface IMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

export interface IConversation {
  id: string;
  userId: string;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// In-memory storage for conversations
const conversations = new Map<string, IConversation>();

export function createConversation(userId: string): IConversation {
  const conversation: IConversation = {
    id: `conv-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    userId,
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };
  conversations.set(conversation.id, conversation);
  return conversation;
}

export function getConversation(id: string): IConversation | undefined {
  return conversations.get(id);
}

export function getConversationsByUser(userId: string): IConversation[] {
  return Array.from(conversations.values())
    .filter(c => c.userId === userId)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

export function addMessage(conversationId: string, message: IMessage): IConversation | undefined {
  const conversation = conversations.get(conversationId);
  if (conversation) {
    conversation.messages.push(message);
    conversation.updatedAt = new Date();
    return conversation;
  }
  return undefined;
}

export const Conversation = {
  createConversation,
  getConversation,
  getConversationsByUser,
  addMessage
};