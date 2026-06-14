'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import {
  Zap,
  Play,
  GitBranch,
  Bot,
  Clock,
  Globe,
  Filter,
  Shuffle,
} from 'lucide-react';
import { WorkflowNodeType, NODE_COLORS } from '@/types/workflow';
import { cn } from '@/lib/utils';

const iconMap: Record<WorkflowNodeType, React.ComponentType<{ className?: string }>> = {
  trigger: Zap,
  action: Play,
  condition: GitBranch,
  ai_agent: Bot,
  delay: Clock,
  webhook: Globe,
  filter: Filter,
  transform: Shuffle,
};

interface WorkflowNodeData {
  label: string;
  type: WorkflowNodeType;
  description?: string;
  triggerType?: string;
  actionType?: string;
  selected?: boolean;
  [key: string]: unknown;
}

const WorkflowNodeComponent: React.FC<NodeProps<WorkflowNodeData>> = ({
  data,
  selected,
}) => {
  const { label, type, description, triggerType, actionType } = data;
  const Icon = iconMap[type] || Play;
  const colors = NODE_COLORS[type] || NODE_COLORS.action;

  const getSubLabel = () => {
    if (type === 'trigger' && triggerType) {
      return triggerType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    }
    if (type === 'action' && actionType) {
      return actionType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    }
    return description || '';
  };

  const subLabel = getSubLabel();

  // Determine handle positions based on node type
  const hasTopHandle = ['action', 'ai_agent', 'delay', 'webhook', 'filter', 'transform', 'condition'].includes(type);
  const hasBottomHandle = ['trigger', 'action', 'ai_agent', 'delay', 'webhook', 'filter', 'transform'].includes(type);
  const hasLeftHandle = type === 'condition';

  return (
    <div
      className={cn(
        'relative min-w-[180px] max-w-[220px] bg-gray-800 rounded-lg border-2 transition-all duration-200 shadow-lg',
        selected
          ? 'border-indigo-500 shadow-indigo-500/25 scale-105'
          : 'border-gray-600 hover:border-gray-500'
      )}
    >
      {/* Top Handle - Input */}
      {hasTopHandle && (
        <Handle
          type="target"
          position={Position.Top}
          className="!w-3 !h-3 !bg-gray-400 border-2 border-gray-600 hover:!bg-indigo-400 hover:!border-indigo-500 transition-colors"
        />
      )}

      {/* Left Handle - False branch for condition */}
      {hasLeftHandle && (
        <Handle
          type="source"
          position={Position.Left}
          id="false"
          className="!w-3 !h-3 !bg-red-400 border-2 border-red-600 hover:!bg-red-300 transition-colors"
          style={{ top: '50%' }}
        />
      )}

      {/* Node Content */}
      <div className="p-3">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <div
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-md',
              colors.bg
            )}
          >
            <Icon className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">
              {label}
            </div>
            <div className={cn('text-xs', colors.text)}>
              {type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </div>
          </div>
        </div>

        {/* Sub label */}
        {subLabel && (
          <div className="text-xs text-gray-400 truncate pl-10">
            {subLabel}
          </div>
        )}

        {/* Condition branches indicator */}
        {type === 'condition' && (
          <div className="flex gap-2 mt-2 text-xs">
            <div className="flex items-center gap-1 text-green-400">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span>True</span>
            </div>
            <div className="flex items-center gap-1 text-red-400">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <span>False</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Handle - Output */}
      {hasBottomHandle && (
        <Handle
          type="source"
          position={Position.Bottom}
          id="true"
          className={cn(
            '!w-3 !h-3 border-2 hover:!bg-indigo-400 hover:!border-indigo-500 transition-colors',
            type === 'condition' ? '!bg-green-400 !border-green-600' : '!bg-gray-400 !border-gray-600'
          )}
        />
      )}

      {/* Selection indicator */}
      {selected && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full animate-pulse" />
      )}
    </div>
  );
};

export default memo(WorkflowNodeComponent);