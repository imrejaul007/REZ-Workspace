'use client';

import React from 'react';
import {
  Zap,
  Play,
  GitBranch,
  Bot,
  Clock,
  Globe,
  Filter,
  Shuffle,
  GripVertical,
} from 'lucide-react';
import { WorkflowNodeType, NODE_COLORS } from '@/types/workflow';
import { cn } from '@/lib/utils';

interface NodePaletteProps {
  onDragStart?: (event: React.DragEvent, nodeType: WorkflowNodeType) => void;
}

interface PaletteItem {
  type: WorkflowNodeType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'triggers' | 'actions' | 'logic' | 'integration';
}

const triggerNodes: PaletteItem[] = [
  {
    type: 'trigger',
    label: 'Trigger',
    description: 'Start workflow on event',
    icon: Zap,
    category: 'triggers',
  },
];

const actionNodes: PaletteItem[] = [
  {
    type: 'action',
    label: 'Action',
    description: 'Execute an action',
    icon: Play,
    category: 'actions',
  },
  {
    type: 'ai_agent',
    label: 'AI Agent',
    description: 'Run AI task',
    icon: Bot,
    category: 'actions',
  },
  {
    type: 'delay',
    label: 'Delay',
    description: 'Wait before continuing',
    icon: Clock,
    category: 'actions',
  },
];

const logicNodes: PaletteItem[] = [
  {
    type: 'condition',
    label: 'Condition',
    description: 'Branch based on logic',
    icon: GitBranch,
    category: 'logic',
  },
  {
    type: 'filter',
    label: 'Filter',
    description: 'Filter data',
    icon: Filter,
    category: 'logic',
  },
  {
    type: 'transform',
    label: 'Transform',
    description: 'Transform data',
    icon: Shuffle,
    category: 'logic',
  },
];

const integrationNodes: PaletteItem[] = [
  {
    type: 'webhook',
    label: 'Webhook',
    description: 'Call external API',
    icon: Globe,
    category: 'integration',
  },
];

const allNodes = [...triggerNodes, ...actionNodes, ...logicNodes, ...integrationNodes];

const NodePalette: React.FC<NodePaletteProps> = ({ onDragStart }) => {
  const handleDragStart = (event: React.DragEvent, nodeType: WorkflowNodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
    onDragStart?.(event, nodeType);
  };

  const renderCategory = (
    title: string,
    items: PaletteItem[],
    categoryColor: string
  ) => (
    <div className="mb-6">
      <h3 className={cn('text-xs font-semibold uppercase tracking-wider mb-3', categoryColor)}>
        {title}
      </h3>
      <div className="space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          const colors = NODE_COLORS[item.type];

          return (
            <div
              key={item.type}
              draggable
              onDragStart={(e) => handleDragStart(e, item.type)}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg cursor-grab',
                'bg-gray-800/50 border border-gray-700',
                'hover:bg-gray-800 hover:border-gray-600',
                'active:cursor-grabbing active:scale-95',
                'transition-all duration-200'
              )}
            >
              <div
                className={cn(
                  'flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0',
                  colors.bg
                )}
              >
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-200">{item.label}</div>
                <div className="text-xs text-gray-500 truncate">{item.description}</div>
              </div>
              <GripVertical className="w-4 h-4 text-gray-600 flex-shrink-0" />
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white mb-1">Node Palette</h2>
        <p className="text-xs text-gray-500">
          Drag nodes onto the canvas to build your workflow
        </p>
      </div>

      {renderCategory('Triggers', triggerNodes, 'text-green-400')}
      {renderCategory('Actions', actionNodes, 'text-blue-400')}
      {renderCategory('Logic', logicNodes, 'text-purple-400')}
      {renderCategory('Integration', integrationNodes, 'text-orange-400')}

      {/* Search (future enhancement) */}
      <div className="mt-6 pt-6 border-t border-gray-700">
        <div className="relative">
          <input
            type="text"
            placeholder="Search nodes..."
            className={cn(
              'w-full px-3 py-2 pl-9 rounded-lg text-sm',
              'bg-gray-800/50 border border-gray-700',
              'text-gray-300 placeholder-gray-500',
              'focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500',
              'transition-colors'
            )}
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default NodePalette;