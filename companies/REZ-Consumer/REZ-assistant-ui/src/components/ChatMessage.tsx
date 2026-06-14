"use client";

import { Message } from "@/types/chat";
import { format } from "date-fns";
import { Heart, Share2, Copy, ThumbsUp } from "lucide-react";

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";

  const formatTime = (date: Date) => {
    return format(date, "h:mm a");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
  };

  return (
    <div
      className={`flex items-start gap-3 message-enter ${
        isUser ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {/* Avatar */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isUser
            ? "bg-brand-500 text-white"
            : isAssistant
            ? "bg-surface-200 text-surface-600"
            : "bg-surface-100 text-surface-500"
        }`}
      >
        {isUser ? (
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        ) : (
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        )}
      </div>

      {/* Message Content */}
      <div
        className={`flex max-w-[75%] flex-col gap-1 ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        <div
          className={`group relative rounded-2xl px-4 py-3 shadow-sm ${
            isUser
              ? "rounded-br-sm bg-brand-500 text-white"
              : isAssistant
              ? "rounded-bl-sm bg-white text-surface-900"
              : "rounded-bl-sm bg-surface-100 text-surface-900"
          }`}
        >
          {/* Image if present */}
          {message.image && (
            <div className="mb-2 overflow-hidden rounded-lg">
              <img
                src={message.image}
                alt=""
                className="max-w-[300px] object-cover"
              />
            </div>
          )}

          {/* Message text */}
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>

          {/* Action buttons for assistant messages */}
          {isAssistant && (
            <div
              className={`absolute -bottom-8 left-0 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 ${
                isUser ? "flex-row-reverse" : ""
              }`}
            >
              <button
                onClick={handleCopy}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white p-1 text-surface-400 shadow-sm transition-colors hover:bg-surface-50 hover:text-surface-600"
                title="Copy"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
              <button
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white p-1 text-surface-400 shadow-sm transition-colors hover:bg-surface-50 hover:text-surface-600"
                title="Share"
              >
                <Share2 className="h-3.5 w-3.5" />
              </button>
              <button
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white p-1 text-surface-400 shadow-sm transition-colors hover:bg-red-50 hover:text-red-500"
                title="Not helpful"
              >
                <ThumbsUp className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Timestamp and reactions */}
        <div
          className={`flex items-center gap-2 text-xs text-surface-400 ${
            isUser ? "flex-row-reverse" : ""
          }`}
        >
          <span>{formatTime(message.timestamp)}</span>
          {isUser && (
            <span className="rounded-full bg-surface-100 px-2 py-0.5 text-xs text-surface-500">
              Sent
            </span>
          )}
        </div>

        {/* Quick reactions */}
        {isAssistant && (
          <div className={`flex items-center gap-1 ${isUser ? "" : ""}`}>
            <button className="flex h-6 w-6 items-center justify-center rounded-full text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600">
              <Heart className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
