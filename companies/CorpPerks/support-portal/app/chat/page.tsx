'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Search,
  Send,
  Paperclip,
  Phone,
  Video,
  MoreHorizontal,
  X,
  Smile,
  Clock,
  CheckCheck,
  Circle,
} from 'lucide-react';
import { Card, Badge, Avatar, Button } from '@/components/ui';
import { chatSessions, cannedResponses } from '@/lib/mock-data';
import { formatRelativeTime, cn } from '@/lib/utils';
import { ChatSession, ChatMessage as ChatMessageType } from '@/types';

export default function ChatPage() {
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(chatSessions[0]);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeSessions = chatSessions.filter((s) => s.status === 'active');
  const endedSessions = chatSessions.filter((s) => s.status === 'ended');

  const filteredActiveSessions = activeSessions.filter((session) =>
    session.employee.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedSession?.messages]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedSession) return;
    logger.info('Sending message:', messageInput);
    setMessageInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      {/* Chat List */}
      <Card padding="none" className="w-80 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Chats</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Active Chats */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-3">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Active ({activeSessions.length})</p>
            <div className="space-y-1">
              {filteredActiveSessions.map((session) => (
                <ChatListItem
                  key={session.id}
                  session={session}
                  isSelected={selectedSession?.id === session.id}
                  onClick={() => setSelectedSession(session)}
                />
              ))}
            </div>
          </div>

          {endedSessions.length > 0 && (
            <div className="p-3 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                Recently Ended ({endedSessions.length})
              </p>
              <div className="space-y-1">
                {endedSessions.map((session) => (
                  <ChatListItem
                    key={session.id}
                    session={session}
                    isSelected={selectedSession?.id === session.id}
                    onClick={() => setSelectedSession(session)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Chat Window */}
      {selectedSession ? (
        <Card padding="none" className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar
                name={selectedSession.employee.name}
                status={selectedSession.employee.chatStatus}
              />
              <div>
                <p className="font-medium text-gray-900">{selectedSession.employee.name}</p>
                <p className="text-sm text-gray-500">
                  {selectedSession.employee.role} - {selectedSession.employee.department}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedSession.status === 'active' && (
                <Badge variant="success">
                  <Circle className="w-2 h-2 mr-1 animate-pulse" />
                  Online
                </Badge>
              )}
              <Button variant="ghost" size="sm">
                <Phone className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Video className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            <div className="text-center">
              <p className="text-sm text-gray-500">
                Chat started {formatRelativeTime(selectedSession.startedAt)}
              </p>
            </div>

            {selectedSession.messages.map((message) => (
              <ChatMessageBubble
                key={message.id}
                message={message}
                isAgent={message.sender === 'agent'}
              />
            ))}

            {selectedSession.isTyping && (
              <div className="flex items-center gap-2 text-gray-500">
                <Avatar name={selectedSession.employee.name} size="sm" />
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm">typing...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          {selectedSession.status === 'active' && (
            <div className="p-4 border-t border-gray-100">
              {/* Canned Responses */}
              <div className="mb-3 flex gap-2 overflow-x-auto pb-2">
                {cannedResponses.slice(0, 4).map((canned) => (
                  <button
                    key={canned.id}
                    onClick={() => setMessageInput(canned.content)}
                    className="flex-shrink-0 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    {canned.title}
                  </button>
                ))}
              </div>

              <div className="flex items-end gap-3">
                <Button variant="ghost" size="sm">
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Smile className="w-4 h-4" />
                </Button>
                <div className="flex-1">
                  <textarea
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    rows={1}
                    className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>
                <Button onClick={handleSendMessage} disabled={!messageInput.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {selectedSession.status === 'ended' && (
            <div className="p-4 border-t border-gray-100 bg-gray-50 text-center">
              <p className="text-sm text-gray-500">
                This chat has ended. {formatRelativeTime(selectedSession.endedAt!)}
              </p>
            </div>
          )}
        </Card>
      ) : (
        <Card className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No chat selected</h3>
            <p className="text-gray-500">Select a conversation from the list to start chatting</p>
          </div>
        </Card>
      )}

      {/* Quick Actions Panel */}
      {selectedSession && (
        <Card padding="none" className="w-72">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-4 space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <Clock className="w-4 h-4 mr-2" />
              View Chat History
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Paperclip className="w-4 h-4 mr-2" />
              Attach Files
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <CheckCheck className="w-4 h-4 mr-2" />
              Create Ticket
            </Button>
          </div>

          <div className="p-4 border-t border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-3">Employee Info</h3>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-gray-500">Email</p>
                <p className="text-gray-900">{selectedSession.employee.email}</p>
              </div>
              <div>
                <p className="text-gray-500">Department</p>
                <p className="text-gray-900">{selectedSession.employee.department}</p>
              </div>
              <div>
                <p className="text-gray-500">Role</p>
                <p className="text-gray-900">{selectedSession.employee.role}</p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function ChatListItem({
  session,
  isSelected,
  onClick,
}: {
  session: ChatSession;
  isSelected: boolean;
  onClick: () => void;
}) {
  const lastMessage = session.messages[session.messages.length - 1];

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors',
        isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
      )}
    >
      <Avatar name={session.employee.name} status={session.status === 'active' ? session.employee.chatStatus : undefined} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className={cn('font-medium truncate', isSelected ? 'text-blue-700' : 'text-gray-900')}>
            {session.employee.name}
          </p>
          <p className="text-xs text-gray-500">{formatRelativeTime(session.startedAt)}</p>
        </div>
        <p className="text-sm text-gray-500 truncate">
          {lastMessage ? lastMessage.content : 'No messages yet'}
        </p>
      </div>
      {session.isTyping && (
        <Badge variant="warning" size="sm">Typing</Badge>
      )}
    </button>
  );
}

function ChatMessageBubble({
  message,
  isAgent,
}: {
  message: ChatMessageType;
  isAgent: boolean;
}) {
  return (
    <div className={cn('flex', isAgent ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-md px-4 py-2 rounded-2xl',
          isAgent
            ? 'bg-blue-600 text-white rounded-br-sm'
            : 'bg-gray-100 text-gray-900 rounded-bl-sm'
        )}
      >
        <p className="text-sm">{message.content}</p>
        <div className={cn('flex items-center gap-1 mt-1', isAgent ? 'justify-end' : 'justify-start')}>
          <span className={cn('text-xs', isAgent ? 'text-blue-200' : 'text-gray-500')}>
            {formatRelativeTime(message.createdAt)}
          </span>
          {isAgent && message.isRead && <CheckCheck className="w-3 h-3 text-blue-200" />}
        </div>
      </div>
    </div>
  );
}
