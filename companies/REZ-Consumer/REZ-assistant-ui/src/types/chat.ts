export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  image?: string;
  attachments?: Attachment[];
  actions?: MessageAction[];
}

export interface Attachment {
  id: string;
  type: "image" | "file" | "product";
  name: string;
  url: string;
  size?: number;
}

export interface MessageAction {
  id: string;
  label: string;
  type: "button" | "link";
  url?: string;
  onClick?: () => void;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviewCount: number;
  badges?: string[];
  link: string;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  description: string;
}

export interface Conversation {
  id: string;
  title: string;
  preview: string;
  timestamp: Date;
  messageCount: number;
  messages: Message[];
}

export interface ChatState {
  messages: Message[];
  isTyping: boolean;
  showRecommendations: boolean;
  conversationId: string | null;
}
