'use client';

/**
 * REZ Inbox UI - Smart Inbox
 */

import { useState, useEffect } from 'react';
import { inboxApi, Message } from '../services/api';
import { MessageCard } from '../components/MessageCard';

const categories = [
  { id: 'all', name: 'All', icon: '📬' },
  { id: 'travel', name: 'Travel', icon: '✈️' },
  { id: 'food', name: 'Food', icon: '🍔' },
  { id: 'invoice', name: 'Invoices', icon: '📄' },
  { id: 'subscription', name: 'Subscriptions', icon: '💳' },
  { id: 'banking', name: 'Banking', icon: '🏦' },
];

export default function InboxPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMessages();
  }, [selectedCategory]);

  const loadMessages = async () => {
    setLoading(true);
    const response = await inboxApi.getMessages({
      category: selectedCategory === 'all' ? undefined : selectedCategory,
    });
    if (response.success && response.data) {
      setMessages(response.data.items);
    }
    setLoading(false);
  };

  const handleMarkAsRead = async (id: string) => {
    await inboxApi.markAsRead(id);
    loadMessages();
  };

  const handleToggleStar = async (id: string) => {
    await inboxApi.toggleStar(id);
    loadMessages();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-4 py-3">
        <h1 className="text-xl font-bold text-gray-900">REZ Inbox</h1>
        <p className="text-sm text-gray-500">Smart email receipts & more</p>
      </header>

      {/* Categories */}
      <div className="flex gap-2 p-4 overflow-x-auto">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
              selectedCategory === cat.id
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 border'
            }`}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="px-4 space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-4xl mb-2">📭</p>
            <p>No messages found</p>
          </div>
        ) : (
          messages.map(msg => (
            <MessageCard
              key={msg.id}
              message={msg}
              onClick={() => handleMarkAsRead(msg.id)}
              onStar={() => handleToggleStar(msg.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
