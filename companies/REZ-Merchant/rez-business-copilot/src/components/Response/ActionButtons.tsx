'use client';

import React from 'react';
import type { Action } from '@/types/copilot';
import {
  BarChart3,
  Play,
  Bookmark,
  Download,
  Calendar,
  List,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

// Icon mapping
const iconMap: Record<string, React.ReactNode> = {
  BarChart3: <BarChart3 className="w-4 h-4" />,
  Play: <Play className="w-4 h-4" />,
  Bookmark: <Bookmark className="w-4 h-4" />,
  Download: <Download className="w-4 h-4" />,
  Calendar: <Calendar className="w-4 h-4" />,
  List: <List className="w-4 h-4" />,
  ExternalLink: <ExternalLink className="w-4 h-4" />,
};

interface ActionButtonsProps {
  actions: Action[];
  onAction?: (action: Action) => void;
  className?: string;
}

export function ActionButtons({ actions, onAction, className = '' }: ActionButtonsProps) {
  const handleAction = (action: Action) => {
    if (onAction) {
      onAction(action);
    } else {
      // Default action handling
      switch (action.type) {
        case 'navigation':
          if (action.payload?.url) {
            window.open(action.payload.url as string, '_blank');
          }
          break;
        case 'execution':
          console.log('Executing action:', action);
          break;
        case 'export':
          console.log('Exporting data:', action);
          break;
        case 'filter':
          console.log('Applying filter:', action);
          break;
      }
    }
  };

  const getActionStyles = (type: Action['type']) => {
    switch (type) {
      case 'execution':
        return 'bg-primary-600 text-white hover:bg-primary-700';
      case 'navigation':
        return 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-primary-300';
      case 'export':
        return 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200';
      case 'filter':
        return 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200';
      default:
        return 'bg-gray-50 text-gray-700 hover:bg-gray-100';
    }
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={() => handleAction(action)}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${getActionStyles(action.type)}`}
        >
          {action.icon && iconMap[action.icon]}
          <span>{action.label}</span>
          {action.type === 'execution' && <ChevronRight className="w-4 h-4" />}
        </button>
      ))}
    </div>
  );
}

interface ActionCardProps {
  action: Action;
  onClick?: () => void;
  className?: string;
}

export function ActionCard({ action, onClick, className = '' }: ActionCardProps) {
  const getTypeBadge = (type: Action['type']) => {
    switch (type) {
      case 'execution':
        return { bg: 'bg-primary-100', text: 'text-primary-700', label: 'Action' };
      case 'navigation':
        return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Link' };
      case 'export':
        return { bg: 'bg-green-100', text: 'text-green-700', label: 'Export' };
      case 'filter':
        return { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Filter' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', label: type };
    }
  };

  const badge = getTypeBadge(action.type);

  return (
    <div
      onClick={onClick}
      className={`bg-white border border-gray-200 rounded-xl p-4 hover:border-primary-300 hover:shadow-md transition-all cursor-pointer ${className}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {action.icon && (
            <div className="p-2 bg-gray-50 rounded-lg">
              {iconMap[action.icon]}
            </div>
          )}
          <h4 className="font-medium text-gray-900">{action.label}</h4>
        </div>
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${badge.bg} ${badge.text}`}>
          {badge.label}
        </span>
      </div>
      <p className="text-sm text-gray-500">{action.description}</p>
    </div>
  );
}

interface ActionGridProps {
  actions: Action[];
  onAction?: (action: Action) => void;
  className?: string;
}

export function ActionGrid({ actions, onAction, className = '' }: ActionGridProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 ${className}`}>
      {actions.map((action) => (
        <ActionCard
          key={action.id}
          action={action}
          onClick={() => onAction?.(action)}
        />
      ))}
    </div>
  );
}