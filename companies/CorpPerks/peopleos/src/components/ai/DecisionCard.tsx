'use client';

import React, { useState, useEffect } from 'react';
import { DecisionCard as DecisionCardType, DecisionAction } from '@/lib/ai/client';

interface DecisionCardProps {
  card: DecisionCardType;
  onDismiss?: () => void;
  onSnooze?: () => void;
  compact?: boolean;
  onAction?: (action: DecisionAction) => void;
}

export default function DecisionCard({
  card,
  onDismiss,
  onSnooze,
  compact = false,
  onAction
}: DecisionCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in on mount
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const severityConfig = {
    critical: {
      bg: 'bg-gradient-to-br from-red-50 to-red-100',
      border: 'border-red-300',
      icon: '🚨',
      iconBg: 'bg-red-100',
      text: 'text-red-900',
      badge: 'bg-red-100 text-red-700 border border-red-200',
      progress: 'bg-red-500',
    },
    high: {
      bg: 'bg-gradient-to-br from-orange-50 to-orange-100',
      border: 'border-orange-300',
      icon: '⚠️',
      iconBg: 'bg-orange-100',
      text: 'text-orange-900',
      badge: 'bg-orange-100 text-orange-700 border border-orange-200',
      progress: 'bg-orange-500',
    },
    medium: {
      bg: 'bg-gradient-to-br from-yellow-50 to-yellow-100',
      border: 'border-yellow-300',
      icon: '📊',
      iconBg: 'bg-yellow-100',
      text: 'text-yellow-900',
      badge: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
      progress: 'bg-yellow-500',
    },
    low: {
      bg: 'bg-gradient-to-br from-blue-50 to-blue-100',
      border: 'border-blue-300',
      icon: '💡',
      iconBg: 'bg-blue-100',
      text: 'text-blue-900',
      badge: 'bg-blue-100 text-blue-700 border border-blue-200',
      progress: 'bg-blue-500',
    },
  };

  const style = severityConfig[card.severity] || severityConfig.medium;
  const confidencePercent = Math.round(card.confidence * 100);

  const showNotification = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleDismiss = async () => {
    setIsLoading(true);
    try {
      // API call would go here
      onDismiss?.();
      showNotification('Card dismissed');
    } catch (error) {
      showNotification('Failed to dismiss');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSnooze = async () => {
    setIsLoading(true);
    try {
      // API call would go here
      onSnooze?.();
      showNotification('Card snoozed for 24 hours');
    } catch (error) {
      showNotification('Failed to snooze');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = (action: DecisionAction) => {
    onAction?.(action);
    if (action.action === 'navigate' && action.params?.page) {
      window.location.href = action.params.page;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return '📈';
      case 'decreasing': return '📉';
      default: return '➡️';
    }
  };

  return (
    <>
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
          <div className="bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <span className="text-sm">{toastMessage}</span>
          </div>
        </div>
      )}

      <div
        className={`
          ${style.bg} ${style.border} border rounded-xl p-4
          transition-all duration-500 ease-out
          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          ${compact ? '' : 'shadow-sm hover:shadow-md'}
        `}
      >
        <div className="flex items-start gap-3">
          {/* Animated Icon */}
          <div className={`${style.iconBg} rounded-xl p-2.5 text-xl relative`}>
            <span className={card.severity === 'critical' ? 'animate-pulse' : ''}>
              {style.icon}
            </span>
            {card.severity === 'critical' && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h3 className={`font-semibold ${style.text} ${compact ? 'text-sm' : 'text-base'}`}>
                  {card.title}
                </h3>
                {!compact && (
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                    {card.description}
                  </p>
                )}
              </div>

              {/* Confidence Badge with Progress */}
              <div className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${style.badge} flex flex-col items-center`}>
                <span>{confidencePercent}%</span>
                <span className="text-[10px] opacity-70">conf</span>
              </div>
            </div>

            {/* Confidence Bar */}
            {!compact && (
              <div className="mt-3">
                <div className="h-1.5 bg-gray-200/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${style.progress}`}
                    style={{ width: `${confidencePercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Data Preview with Badges */}
            {!compact && card.data && Object.keys(card.data).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {card.data.employees && Array.isArray(card.data.employees) && (
                  <span className="px-2.5 py-1 bg-white/70 backdrop-blur-sm rounded-lg text-xs font-medium text-gray-700 border border-gray-200">
                    👥 {card.data.employees.length} employees
                  </span>
                )}
                {card.data.department && (
                  <span className="px-2.5 py-1 bg-white/70 backdrop-blur-sm rounded-lg text-xs font-medium text-gray-700 border border-gray-200">
                    🏢 {card.data.department}
                  </span>
                )}
                {card.data.trend && (
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${
                    card.data.trend === 'increasing'
                      ? 'bg-red-100 text-red-700 border-red-200'
                      : card.data.trend === 'decreasing'
                      ? 'bg-green-100 text-green-700 border-green-200'
                      : 'bg-gray-100 text-gray-700 border-gray-200'
                  }`}>
                    {getTrendIcon(card.data.trend)} {card.data.trend}
                  </span>
                )}
                {card.data.increasePercentage && (
                  <span className="px-2.5 py-1 bg-white/70 backdrop-blur-sm rounded-lg text-xs font-medium text-red-700 border border-red-200">
                    📊 +{card.data.increasePercentage.toFixed(1)}%
                  </span>
                )}
              </div>
            )}

            {/* Actions */}
            {!compact && card.actions.length > 0 && (
              <div className="mt-4 flex items-center gap-2 flex-wrap">
                {card.actions.slice(0, 3).map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAction(action)}
                    disabled={isLoading}
                    className={`
                      px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all
                      ${idx === 0
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-sm'
                        : 'bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white border border-gray-200 active:scale-95'
                      }
                      ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    {action.label}
                  </button>
                ))}

                {/* More Actions Dropdown */}
                {card.actions.length > 3 && (
                  <div className="relative group">
                    <button className="px-3.5 py-1.5 rounded-lg text-sm font-medium bg-white/80 backdrop-blur-sm text-gray-500 hover:bg-white border border-gray-200">
                      +{card.actions.length - 3} more
                    </button>
                    <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[140px] hidden group-hover:block z-20">
                      {card.actions.slice(3).map((action, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleAction(action)}
                          className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dismiss & Snooze */}
                <div className="ml-auto flex items-center gap-1 bg-white/50 backdrop-blur-sm rounded-lg px-1 py-0.5">
                  <button
                    onClick={handleSnooze}
                    disabled={isLoading}
                    className="px-2 py-1 text-xs text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                  >
                    💤 Snooze
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    onClick={handleDismiss}
                    disabled={isLoading}
                    className="px-2 py-1 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    ✕ Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* Category Badge & Timestamp */}
            {!compact && (
              <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                <span className={`px-2 py-0.5 rounded-full ${style.badge}`}>
                  {card.category}
                </span>
                <span>
                  {new Date(card.createdAt).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
