'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Plus, Send, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { apiClient } from '@/lib/api/client';

interface Participant {
  id: string;
  email: string;
  profile?: { firstName: string; lastName: string; avatar?: string };
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  participants: Participant[];
  messages: Message[];
  updatedAt: string;
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function fetchConversations() {
    try {
      const data = await apiClient.get('/messages/conversations');
      setConversations(data || []);
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }

  async function openConversation(conv: Conversation) {
    setSelected(conv);
    try {
      const data = await apiClient.get(`/messages/conversations/${conv.id}/messages`);
      setMessages(data || []);
    } catch {
      setMessages(conv.messages || []);
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !newMessage.trim() || sending) return;
    setSending(true);
    try {
      const msg = await apiClient.post(`/messages/conversations/${selected.id}/messages`, { content: newMessage.trim() });
      setMessages(prev => [...prev, msg]);
      setNewMessage('');
    } catch {
      // silent
    } finally {
      setSending(false);
    }
  }

  function getOtherParticipant(conv: Conversation) {
    const p = conv.participants?.[0];
    if (!p) return 'Unknown';
    return p.profile ? `${p.profile.firstName} ${p.profile.lastName}` : p.email;
  }

  function lastMessage(conv: Conversation) {
    const msgs = conv.messages || [];
    if (!msgs.length) return 'No messages yet';
    return msgs[msgs.length - 1].content;
  }

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-4rem)] flex">
        {/* Sidebar */}
        <div className={`w-full md:w-80 border-r flex flex-col bg-background ${selected ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b flex items-center justify-between">
            <h1 className="text-lg font-semibold">Messages</h1>
            <Button size="sm" variant="outline" disabled title="Start a new conversation (coming soon)">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-muted-foreground text-sm">Loading…</div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center">
                <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-40" />
                <p className="text-sm text-muted-foreground">No conversations yet</p>
              </div>
            ) : (
              conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => openConversation(conv)}
                  className={`w-full text-left p-4 border-b hover:bg-muted/50 transition-colors ${selected?.id === conv.id ? 'bg-muted' : ''}`}
                >
                  <div className="font-medium text-sm truncate">{getOtherParticipant(conv)}</div>
                  <div className="text-xs text-muted-foreground truncate mt-0.5">{lastMessage(conv)}</div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className={`flex-1 flex flex-col ${!selected ? 'hidden md:flex' : 'flex'}`}>
          {selected ? (
            <>
              <div className="p-4 border-b flex items-center space-x-3">
                <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setSelected(null)}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="font-medium">{getOtherParticipant(selected)}</div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map(msg => (
                  <div key={msg.id} className="flex flex-col max-w-xs">
                    <div className="bg-muted rounded-2xl px-4 py-2 text-sm">{msg.content}</div>
                    <span className="text-xs text-muted-foreground mt-1 px-1">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <form onSubmit={sendMessage} className="p-4 border-t flex space-x-2">
                <Input
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Type a message…"
                  className="flex-1 rounded-full"
                  disabled={sending}
                />
                <Button type="submit" size="icon" className="rounded-full" disabled={sending || !newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                <p className="text-muted-foreground">Select a conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
