'use client';

import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4850';

interface Stats {
  totalConversations: number;
  activeConversations: number;
  resolvedToday: number;
  revenue: number;
  ordersCreated: number;
}

interface Conversation {
  conversationId: string;
  channel: string;
  state: string;
  customer: { name: string; phone?: string };
  lastMessage?: string;
  lastMessageAt?: string;
  priority: string;
}

interface Message {
  id: string;
  content: { text?: string; mediaUrl?: string };
  direction: string;
  timestamp: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'inbox' | 'analytics' | 'campaigns'>('inbox');

  const tenantId = 'demo_tenant';

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchData() {
    try {
      const [statsRes, convRes] = await Promise.all([
        fetch(`${API_URL}/api/analytics?tenantId=${tenantId}`),
        fetch(`${API_URL}/api/conversations?tenantId=${tenantId}`)
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data);
      }

      if (convRes.ok) {
        const convData = await convRes.json();
        setConversations(convData.data?.conversations || []);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function selectConversation(conv: Conversation) {
    setSelectedConversation(conv);
    try {
      const res = await fetch(`${API_URL}/api/conversations/${conv.conversationId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.data || []);
      }
    } catch (error) {
      console.error('Messages fetch error:', error);
    }
  }

  async function sendMessage() {
    if (!selectedConversation || !newMessage.trim()) return;

    try {
      await fetch(`${API_URL}/api/messages/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          channel: selectedConversation.channel,
          to: { id: selectedConversation.customer.phone || '', name: selectedConversation.customer.name },
          type: 'text',
          content: { text: newMessage }
        })
      });

      setNewMessage('');
      selectConversation(selectedConversation);
    } catch (error) {
      console.error('Send error:', error);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar */}
      <aside style={{ width: 260, background: '#1a1a2e', color: 'white', padding: 20 }}>
        <h1 style={{ fontSize: 24, marginBottom: 30 }}>
          <span style={{ color: '#e94560' }}>HOJAI</span> Platform
        </h1>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <NavButton active={activeTab === 'inbox'} onClick={() => setActiveTab('inbox')}>
            💬 Inbox
          </NavButton>
          <NavButton active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')}>
            📊 Analytics
          </NavButton>
          <NavButton active={activeTab === 'campaigns'} onClick={() => setActiveTab('campaigns')}>
            📣 Campaigns
          </NavButton>
        </nav>

        <div style={{ marginTop: 40 }}>
          <h3 style={{ fontSize: 14, color: '#888' }}>CHANNELS</h3>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <ChannelBadge active>💬 WhatsApp</ChannelBadge>
            <ChannelBadge>📸 IG</ChannelBadge>
            <ChannelBadge>📧 Email</ChannelBadge>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <header style={{ padding: '15px 30px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>Dashboard</h2>
          <div style={{ display: 'flex', gap: 20 }}>
            <Stat label="Active" value={stats?.activeConversations || 0} color="#e94560" />
            <Stat label="Today" value={stats?.resolvedToday || 0} color="#16c79a" />
            <Stat label="Revenue" value={`₹${(stats?.revenue || 0).toLocaleString()}`} color="#f9ed69" />
          </div>
        </header>

        {/* Content Area */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {activeTab === 'inbox' && (
            <>
              {/* Conversation List */}
              <div style={{ width: 350, borderRight: '1px solid #eee', overflow: 'auto' }}>
                <div style={{ padding: 15 }}>
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ddd' }}
                  />
                </div>

                {conversations.map((conv) => (
                  <ConversationItem
                    key={conv.conversationId}
                    conversation={conv}
                    selected={selectedConversation?.conversationId === conv.conversationId}
                    onClick={() => selectConversation(conv)}
                  />
                ))}

                {conversations.length === 0 && (
                  <div style={{ padding: 20, textAlign: 'center', color: '#888' }}>
                    No conversations yet
                  </div>
                )}
              </div>

              {/* Chat Area */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {selectedConversation ? (
                  <>
                    {/* Chat Header */}
                    <div style={{ padding: 15, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <strong>{selectedConversation.customer.name}</strong>
                        <span style={{ color: '#888', marginLeft: 8 }}>
                          {selectedConversation.customer.phone}
                        </span>
                      </div>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: 20,
                        background: selectedConversation.state === 'active' ? '#e3f2fd' : '#f3e5f5',
                        color: selectedConversation.state === 'active' ? '#1976d2' : '#7b1fa2',
                        fontSize: 12
                      }}>
                        {selectedConversation.state}
                      </span>
                    </div>

                    {/* Messages */}
                    <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          style={{
                            display: 'flex',
                            justifyContent: msg.direction === 'outbound' ? 'flex-end' : 'flex-start',
                            marginBottom: 12
                          }}
                        >
                          <div style={{
                            maxWidth: '70%',
                            padding: '10px 15px',
                            borderRadius: 15,
                            background: msg.direction === 'outbound' ? '#e94560' : '#f5f5f5',
                            color: msg.direction === 'outbound' ? 'white' : 'black'
                          }}>
                            {msg.content.text || '[Media]'}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Input */}
                    <div style={{ padding: 15, borderTop: '1px solid #eee', display: 'flex', gap: 10 }}>
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Type a message..."
                        style={{ flex: 1, padding: 12, borderRadius: 25, border: '1px solid #ddd' }}
                      />
                      <button
                        onClick={sendMessage}
                        style={{ padding: '10px 25px', borderRadius: 25, background: '#e94560', color: 'white', border: 'none', cursor: 'pointer' }}
                      >
                        Send
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
                    Select a conversation to start chatting
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'analytics' && (
            <div style={{ flex: 1, padding: 30 }}>
              <h2>📊 Analytics Dashboard</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginTop: 20 }}>
                <MetricCard title="Total Conversations" value={stats?.totalConversations || 0} icon="💬" />
                <MetricCard title="Active Now" value={stats?.activeConversations || 0} icon="🟢" color="#16c79a" />
                <MetricCard title="Resolved Today" value={stats?.resolvedToday || 0} icon="✅" color="#1976d2" />
                <MetricCard title="Revenue" value={`₹${(stats?.revenue || 0).toLocaleString()}`} icon="💰" color="#f9ed69" />
              </div>
            </div>
          )}

          {activeTab === 'campaigns' && (
            <div style={{ flex: 1, padding: 30 }}>
              <h2>📣 Campaigns</h2>
              <button style={{
                padding: '12px 24px',
                background: '#e94560',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 16
              }}>
                + Create Campaign
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function NavButton({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '12px 15px',
        borderRadius: 8,
        border: 'none',
        background: active ? '#e94560' : 'transparent',
        color: 'white',
        cursor: 'pointer',
        textAlign: 'left',
        fontSize: 14
      }}
    >
      {children}
    </button>
  );
}

function ChannelBadge({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <span style={{
      padding: '4px 8px',
      borderRadius: 4,
      background: active ? '#e94560' : '#333',
      fontSize: 11
    }}>
      {children}
    </span>
  );
}

function Stat({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 20, fontWeight: 'bold', color }}>{value}</div>
      <div style={{ fontSize: 12, color: '#888' }}>{label}</div>
    </div>
  );
}

function ConversationItem({ conversation, selected, onClick }: { conversation: Conversation; selected: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '12px 15px',
        borderBottom: '1px solid #eee',
        background: selected ? '#f5f5f5' : 'white',
        cursor: 'pointer'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <strong>{conversation.customer.name}</strong>
        <span style={{ fontSize: 11, color: '#888' }}>
          {conversation.lastMessageAt ? new Date(conversation.lastMessageAt).toLocaleTimeString() : ''}
        </span>
      </div>
      <div style={{ fontSize: 13, color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {conversation.lastMessage || 'No messages'}
      </div>
      <div style={{ marginTop: 4 }}>
        <span style={{
          fontSize: 10,
          padding: '2px 6px',
          borderRadius: 4,
          background: conversation.channel === 'whatsapp' ? '#25d366' : '#888',
          color: 'white'
        }}>
          {conversation.channel}
        </span>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, color }: { title: string; value: string | number; icon: string; color?: string }) {
  return (
    <div style={{
      padding: 20,
      background: 'white',
      borderRadius: 12,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 'bold', color: color || '#333' }}>{value}</div>
      <div style={{ fontSize: 14, color: '#888' }}>{title}</div>
    </div>
  );
}
