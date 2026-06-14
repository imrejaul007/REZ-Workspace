'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/api';
import { ClientMessage, ClientUser } from '@/types';
import { Loader2, Send, Paperclip, MessageSquare, Search } from 'lucide-react';
import { formatRelativeTime, getInitials, cn } from '@/lib/utils';

export default function MessagesPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<ClientUser | null>(null);
  const [messages, setMessages] = useState<ClientMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (!api.isAuthenticated()) {
        router.push('/');
        return;
      }

      const [profileRes, messagesRes] = await Promise.all([
        api.getProfile(),
        api.getMessages(),
      ]);

      if (!profileRes.success) {
        router.push('/');
        return;
      }

      setUser(profileRes.data as ClientUser);
      setMessages((messagesRes.data as ClientMessage[]) || []);
      setIsLoading(false);
    };

    loadData();
  }, [router]);

  const handleLogout = () => {
    api.logout();
    router.push('/');
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setIsSending(true);
    const response = await api.sendMessage(newMessage);

    if (response.success && response.data) {
      setMessages([...messages, response.data]);
      setNewMessage('');
    }

    setIsSending(false);
  };

  const filteredMessages = messages.filter((msg) =>
    msg.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.senderName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar clientName={user?.companyName} onLogout={handleLogout} />
      <main className="ml-64 p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
          {/* Messages List */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="font-heading text-2xl font-bold text-slate-900">Messages</h1>
                  <p className="text-sm text-slate-500">Communicate with your project team</p>
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all text-sm"
                />
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {filteredMessages.length > 0 ? (
                filteredMessages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex gap-3',
                      message.senderType === 'client' ? 'flex-row-reverse' : 'flex-row'
                    )}
                  >
                    {/* Avatar */}
                    <div className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                      message.senderType === 'client'
                        ? 'bg-primary-100 text-primary-600'
                        : 'bg-slate-100 text-slate-600'
                    )}>
                      {message.senderAvatar ? (
                        <img
                          src={message.senderAvatar}
                          alt={message.senderName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-semibold">
                          {getInitials(message.senderName)}
                        </span>
                      )}
                    </div>

                    {/* Message Content */}
                    <div className={cn(
                      'flex-1 max-w-[70%]',
                      message.senderType === 'client' ? 'text-right' : 'text-left'
                    )}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-slate-700">
                          {message.senderName}
                        </span>
                        <span className="text-xs text-slate-400">
                          {formatRelativeTime(message.createdAt)}
                        </span>
                        {!message.isRead && message.senderType === 'support' && (
                          <span className="w-2 h-2 rounded-full bg-primary-500" />
                        )}
                      </div>
                      <div className={cn(
                        'p-4 rounded-2xl',
                        message.senderType === 'client'
                          ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-tr-sm'
                          : 'bg-slate-100 text-slate-700 rounded-tl-sm'
                      )}>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>

                      {/* Attachments */}
                      {message.attachments.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {message.attachments.map((att) => (
                            <a
                              key={att.id}
                              href={att.url}
                              className={cn(
                                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium',
                                message.senderType === 'client'
                                  ? 'bg-primary-100/50 text-white'
                                  : 'bg-slate-100 text-slate-600'
                              )}
                            >
                              <Paperclip className="w-3 h-3" />
                              {att.name}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageSquare className="w-12 h-12 text-slate-300 mb-4" />
                  <h3 className="font-heading font-semibold text-slate-900 mb-2">No messages</h3>
                  <p className="text-sm text-slate-500">
                    {searchTerm ? 'No messages match your search' : 'Start a conversation with your team'}
                  </p>
                </div>
              )}
            </div>

            {/* Compose */}
            <div className="p-6 border-t border-slate-100">
              <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                <button
                  type="button"
                  className="p-2.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all text-sm"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || isSending}
                  className="p-2.5 rounded-xl bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            {/* Quick Info */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-heading font-semibold text-slate-900 mb-4">Support Team</h3>
              <div className="space-y-4">
                {[
                  { name: 'Priya Sharma', role: 'Project Manager', avatar: 'PS' },
                  { name: 'Amit Kumar', role: 'Lead Developer', avatar: 'AK' },
                  { name: 'Neha Gupta', role: 'UI/UX Designer', avatar: 'NG' },
                ].map((member) => (
                  <div key={member.name} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-sm font-semibold">
                      {member.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{member.name}</p>
                      <p className="text-xs text-slate-500">{member.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-2xl border border-primary-100 p-6">
              <h3 className="font-heading font-semibold text-primary-900 mb-3">Communication Tips</h3>
              <ul className="space-y-2 text-sm text-primary-700">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
                  Response time is typically within 24 hours
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
                  Attach relevant screenshots for faster resolution
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
                  Use project-specific channels for detailed discussions
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
