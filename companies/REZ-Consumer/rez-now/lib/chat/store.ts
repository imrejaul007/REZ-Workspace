import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatState {
  messages: Message[];
  isTyping: boolean;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  setTyping: (typing: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [],
      isTyping: false,
      addMessage: (message) =>
        set((state) => ({
          messages: [
            ...state.messages,
            { ...message, id: crypto.randomUUID(), timestamp: new Date() },
          ],
        })),
      setTyping: (typing) => set({ isTyping: typing }),
      clearMessages: () => set({ messages: [] }),
    }),
    { name: 'chat-storage' }
  )
);
