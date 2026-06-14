'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Send, 
  Phone, 
  Video, 
  MoreVertical, 
  Paperclip,
  Smile,
  Image as ImageIcon,
  Check,
  CheckCheck
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  read: boolean;
  type: 'text' | 'image' | 'file';
}

interface Conversation {
  id: string;
  participant: {
    id: string;
    name: string;
    avatar?: string;
    online: boolean;
    lastSeen: string;
  };
  messages: Message[];
}

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationId = params.id as string;
  const currentUserId = 'current-user';

  const [conversation] = useState<Conversation>({
    id: conversationId,
    participant: {
      id: 'user-2',
      name: 'Sarah Johnson',
      avatar: '',
      online: true,
      lastSeen: '2024-01-20T14:30:00Z'
    },
    messages: [
      {
        id: '1',
        senderId: 'user-2',
        content: 'Hi! I saw your job posting for the Head Chef position. I\'m very interested and would love to discuss it further.',
        timestamp: '2024-01-20T10:00:00Z',
        read: true,
        type: 'text'
      },
      {
        id: '2',
        senderId: currentUserId,
        content: 'Hello Sarah! Thank you for your interest. I\'d be happy to discuss the position with you. What\'s your experience in fine dining?',
        timestamp: '2024-01-20T10:15:00Z',
        read: true,
        type: 'text'
      },
      {
        id: '3',
        senderId: 'user-2',
        content: 'I have over 8 years of experience in fine dining restaurants. I\'ve worked at several high-end establishments in the city.',
        timestamp: '2024-01-20T10:30:00Z',
        read: true,
        type: 'text'
      },
      {
        id: '4',
        senderId: currentUserId,
        content: 'That sounds impressive! Would you be available for an interview this week?',
        timestamp: '2024-01-20T10:45:00Z',
        read: true,
        type: 'text'
      },
      {
        id: '5',
        senderId: 'user-2',
        content: 'Yes, I\'m available. What days work best for you?',
        timestamp: '2024-01-20T14:20:00Z',
        read: false,
        type: 'text'
      }
    ]
  });

  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState(conversation.messages);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      senderId: currentUserId,
      content: newMessage,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'text'
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp: string) => {
    const messageDate = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString();
    }
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    
    messages.forEach(message => {
      const date = formatDate(message.timestamp);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });

    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Avatar className="h-10 w-10">
              <AvatarImage src={conversation.participant.avatar} />
              <AvatarFallback>
                {conversation.participant.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold">{conversation.participant.name}</h2>
              <p className="text-sm text-green-600">
                {conversation.participant.online ? 'Online' : 
                 `Last seen ${new Date(conversation.participant.lastSeen).toLocaleDateString()}`}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" >
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" >
              <Video className="h-4 w-4" />
            </Button>
            <Button variant="ghost" >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Object.entries(messageGroups).map(([date, dayMessages]) => (
          <div key={date}>
            <div className="flex justify-center mb-4">
              <span className="bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-sm">
                {date}
              </span>
            </div>
            {dayMessages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.senderId === currentUserId ? 'justify-end' : 'justify-start'} mb-2`}
              >
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.senderId === currentUserId
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-900 border border-gray-200'
                }`}>
                  <p className="text-sm">{message.content}</p>
                  <div className={`flex items-center justify-end mt-1 space-x-1 ${
                    message.senderId === currentUserId ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    <span className="text-xs">{formatTime(message.timestamp)}</span>
                    {message.senderId === currentUserId && (
                      message.read ? 
                        <CheckCheck className="h-3 w-3" /> : 
                        <Check className="h-3 w-3" />
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button variant="ghost" >
            <ImageIcon className="h-4 w-4" />
          </Button>
          <div className="flex-1 relative">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="pr-10"
            />
            <Button 
              variant="ghost" 
               
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
            >
              <Smile className="h-4 w-4" />
            </Button>
          </div>
          <Button 
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}