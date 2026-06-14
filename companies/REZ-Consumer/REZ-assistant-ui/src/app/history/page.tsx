"use client";

import { useState } from "react";
import { Message } from "@/types/chat";
import { Search, Trash2, ChevronLeft, Clock, MessageSquare } from "lucide-react";
import Link from "next/link";

interface Conversation {
  id: string;
  title: string;
  preview: string;
  timestamp: Date;
  messageCount: number;
  messages: Message[];
}

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  // Mock data for conversations
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: "1",
      title: "Product Search: Running Shoes",
      preview: "I found several options for you...",
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      messageCount: 8,
      messages: [
        {
          id: "1-1",
          role: "user",
          content: "I need running shoes for marathon training",
          timestamp: new Date(Date.now() - 1000 * 60 * 30),
        },
        {
          id: "1-2",
          role: "assistant",
          content: "Great choice! Here are some recommendations for marathon training shoes...",
          timestamp: new Date(Date.now() - 1000 * 60 * 29),
        },
      ],
    },
    {
      id: "2",
      title: "Order Tracking #12345",
      preview: "Your order is out for delivery...",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      messageCount: 5,
      messages: [
        {
          id: "2-1",
          role: "user",
          content: "Track my order please",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
        },
      ],
    },
    {
      id: "3",
      title: "Return Request",
      preview: "I'd like to return the jacket I bought...",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
      messageCount: 12,
      messages: [],
    },
    {
      id: "4",
      title: "Gift Recommendations",
      preview: "Looking for birthday gift ideas...",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
      messageCount: 15,
      messages: [],
    },
    {
      id: "5",
      title: "Size Guide Inquiry",
      preview: "What size should I get for...",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72),
      messageCount: 4,
      messages: [],
    },
  ]);

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((conv) => conv.id !== id));
    if (selectedConversation?.id === id) {
      setSelectedConversation(null);
    }
  };

  return (
    <main className="flex h-full flex-col bg-surface-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-surface-200 bg-white px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-surface-600 transition-colors hover:bg-surface-100 hover:text-surface-900"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-surface-900">
                Conversation History
              </h1>
              <p className="text-xs text-surface-500">
                {conversations.length} conversations
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="border-b border-surface-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-4xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-surface-200 bg-surface-50 py-2.5 pl-10 pr-4 text-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-thin">
        <div className="mx-auto flex max-w-4xl flex-col gap-2">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="mb-3 h-12 w-12 text-surface-300" />
              <h3 className="mb-1 text-lg font-medium text-surface-700">
                {searchQuery ? "No conversations found" : "No conversations yet"}
              </h3>
              <p className="text-sm text-surface-500">
                {searchQuery
                  ? "Try a different search term"
                  : "Start a new conversation with REZ Assistant"}
              </p>
              {!searchQuery && (
                <Link
                  href="/"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600"
                >
                  Start Chat
                </Link>
              )}
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className="group relative rounded-xl border border-surface-200 bg-white p-4 transition-all hover:border-surface-300 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <button
                    onClick={() => setSelectedConversation(conversation)}
                    className="flex flex-1 items-start gap-3 text-left"
                  >
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-sm font-medium text-surface-900">
                          {conversation.title}
                        </h3>
                        <span className="shrink-0 rounded-full bg-surface-100 px-2 py-0.5 text-xs text-surface-500">
                          {conversation.messageCount} messages
                        </span>
                      </div>
                      <p className="mt-1 truncate text-sm text-surface-500">
                        {conversation.preview}
                      </p>
                      <div className="mt-2 flex items-center gap-1 text-xs text-surface-400">
                        <Clock className="h-3 w-3" />
                        {formatTimestamp(conversation.timestamp)}
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteConversation(conversation.id);
                    }}
                    className="shrink-0 rounded-lg p-2 text-surface-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Conversation Detail Modal */}
      {selectedConversation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-surface-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-surface-900">
                {selectedConversation.title}
              </h2>
              <button
                onClick={() => setSelectedConversation(null)}
                className="rounded-lg p-2 text-surface-400 hover:bg-surface-100 hover:text-surface-600"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-6 scrollbar-thin">
              <div className="flex flex-col gap-4">
                {selectedConversation.messages.length > 0 ? (
                  selectedConversation.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          message.role === "user"
                            ? "rounded-br-sm bg-brand-500 text-white"
                            : "rounded-bl-sm bg-surface-100 text-surface-900"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p
                          className={`mt-1 text-xs ${
                            message.role === "user"
                              ? "text-brand-100"
                              : "text-surface-400"
                          }`}
                        >
                          {message.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-surface-500">
                    Conversation messages not available
                  </p>
                )}
              </div>
            </div>
            <div className="border-t border-surface-200 px-6 py-4">
              <Link
                href="/"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600"
                onClick={() => setSelectedConversation(null)}
              >
                Continue Conversation
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
