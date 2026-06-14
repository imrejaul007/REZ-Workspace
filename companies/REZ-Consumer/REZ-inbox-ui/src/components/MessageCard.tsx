'use client';

/**
 * MessageCard Component
 */

import { Message } from '../services/api';

interface Props {
  message: Message;
  onClick?: () => void;
  onStar?: () => void;
}

const categoryIcons: Record<string, string> = {
  travel: '✈️',
  food: '🍔',
  invoice: '📄',
  subscription: '💳',
  banking: '🏦',
  social: '👥',
  promotion: '🎁',
  other: '📬',
};

export function MessageCard({ message, onClick, onStar }: Props) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow ${
        message.status === 'unread' ? 'border-l-4 border-indigo-600' : ''
      }`}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-3">
          <span className="text-2xl">{categoryIcons[message.category] || '📬'}</span>
          <div>
            <p className="font-medium text-gray-900">{message.fromName || message.from}</p>
            <p className="text-sm text-gray-700">{message.subject}</p>
            <p className="text-xs text-gray-400 mt-1">{new Date(message.date).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onStar?.(); }}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            {message.isStarred ? '⭐' : '☆'}
          </button>
        </div>
      </div>
    </div>
  );
}
