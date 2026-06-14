'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Settings,
  Zap,
  Play,
  GitBranch,
  Bot,
  Clock,
  Globe,
  Filter,
  Shuffle,
  Trash2,
  Copy,
  Plus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useWorkflowStore, useSelectedNode } from '@/store/workflowStore';
import {
  WorkflowNodeType,
  TriggerType,
  ActionType,
  Condition,
  ConditionOperator,
  TRIGGER_LABELS,
  ACTION_LABELS,
  CONDITION_OPERATORS,
  NODE_COLORS,
} from '@/types/workflow';
import { cn } from '@/lib/utils';

interface NodePropertiesProps {
  onClose?: () => void;
}

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

const NodeProperties: React.FC<NodePropertiesProps> = ({ onClose }) => {
  const selectedNode = useSelectedNode();
  const { updateNode, removeNode, duplicateNode, clearSelection } = useWorkflowStore();

  if (!selectedNode) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4">
          <Settings className="w-8 h-8 text-gray-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-300 mb-2">No Node Selected</h3>
        <p className="text-sm text-gray-500">
          Select a node on the canvas to edit its properties
        </p>
      </div>
    );
  }

  const { id, type, data } = selectedNode;
  const Icon = iconMap[type] || Play;
  const colors = NODE_COLORS[type] || NODE_COLORS.action;

  const handleClose = () => {
    clearSelection();
    onClose?.();
  };

  const handleDelete = () => {
    removeNode(id);
    onClose?.();
  };

  const handleDuplicate = () => {
    const newId = duplicateNode(id);
    if (newId) {
      onClose?.();
    }
  };

  const handleUpdate = (updates: Partial<typeof data>) => {
    updateNode(id, updates as any);
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-lg', colors.bg)}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Node Properties</h2>
            <p className="text-xs text-gray-500 capitalize">{type.replace(/_/g, ' ')}</p>
          </div>
        </div>
        <button
          onClick={handleClose}
          className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Basic Properties */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Node Label
          </label>
          <input
            type="text"
            value={data.label || ''}
            onChange={(e) => handleUpdate({ label: e.target.value })}
            className={cn(
              'w-full px-3 py-2 rounded-lg text-sm',
              'bg-gray-800 border border-gray-700',
              'text-white placeholder-gray-500',
              'focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
            )}
          />
        </div>

        {/* Type-specific properties */}
        {type === 'trigger' && (
          <TriggerProperties data={data} onUpdate={handleUpdate} />
        )}
        {type === 'action' && (
          <ActionProperties data={data} onUpdate={handleUpdate} />
        )}
        {type === 'condition' && (
          <ConditionProperties data={data} onUpdate={handleUpdate} />
        )}
        {type === 'ai_agent' && (
          <AIAgentProperties data={data} onUpdate={handleUpdate} />
        )}
        {type === 'delay' && (
          <DelayProperties data={data} onUpdate={handleUpdate} />
        )}
        {type === 'webhook' && (
          <WebhookProperties data={data} onUpdate={handleUpdate} />
        )}
        {type === 'filter' && (
          <FilterProperties data={data} onUpdate={handleUpdate} />
        )}
        {type === 'transform' && (
          <TransformProperties data={data} onUpdate={handleUpdate} />
        )}

        {/* Description */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Description (Optional)
          </label>
          <textarea
            value={data.description || ''}
            onChange={(e) => handleUpdate({ description: e.target.value })}
            rows={3}
            className={cn(
              'w-full px-3 py-2 rounded-lg text-sm resize-none',
              'bg-gray-800 border border-gray-700',
              'text-white placeholder-gray-500',
              'focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
            )}
            placeholder="Add a description for this node..."
          />
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex gap-3">
          <button
            onClick={handleDuplicate}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
              'bg-gray-800 text-gray-300',
              'hover:bg-gray-700 transition-colors'
            )}
          >
            <Copy className="w-4 h-4" />
            Duplicate
          </button>
          <button
            onClick={handleDelete}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
              'bg-red-500/10 text-red-400',
              'hover:bg-red-500/20 transition-colors'
            )}
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// Trigger Properties
interface PropertiesProps {
  data: any;
  onUpdate: (updates: any) => void;
}

const TriggerProperties: React.FC<PropertiesProps> = ({ data, onUpdate }) => {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-300 mb-3">Trigger Settings</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">
            Trigger Type
          </label>
          <select
            value={data.triggerType || 'manual_trigger'}
            onChange={(e) => onUpdate({ triggerType: e.target.value as TriggerType })}
            className={cn(
              'w-full px-3 py-2 rounded-lg text-sm',
              'bg-gray-800 border border-gray-700',
              'text-white',
              'focus:outline-none focus:border-indigo-500'
            )}
          >
            {Object.entries(TRIGGER_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

// Action Properties
const ActionProperties: React.FC<PropertiesProps> = ({ data, onUpdate }) => {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-300 mb-3">Action Settings</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">
            Action Type
          </label>
          <select
            value={data.actionType || 'send_email'}
            onChange={(e) => onUpdate({ actionType: e.target.value as ActionType })}
            className={cn(
              'w-full px-3 py-2 rounded-lg text-sm',
              'bg-gray-800 border border-gray-700',
              'text-white',
              'focus:outline-none focus:border-indigo-500'
            )}
          >
            {Object.entries(ACTION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        {data.actionType === 'send_email' && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">
              Email Template
            </label>
            <input
              type="text"
              value={data.config?.template || ''}
              onChange={(e) => onUpdate({ config: { ...data.config, template: e.target.value } })}
              placeholder="welcome-email"
              className={cn(
                'w-full px-3 py-2 rounded-lg text-sm',
                'bg-gray-800 border border-gray-700',
                'text-white placeholder-gray-500',
                'focus:outline-none focus:border-indigo-500'
              )}
            />
          </div>
        )}
        {data.actionType === 'send_whatsapp' && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">
              Message Template
            </label>
            <textarea
              value={data.config?.message || ''}
              onChange={(e) => onUpdate({ config: { ...data.config, message: e.target.value } })}
              rows={4}
              placeholder="Enter your WhatsApp message template..."
              className={cn(
                'w-full px-3 py-2 rounded-lg text-sm resize-none',
                'bg-gray-800 border border-gray-700',
                'text-white placeholder-gray-500',
                'focus:outline-none focus:border-indigo-500'
              )}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Condition Properties
const ConditionProperties: React.FC<PropertiesProps> = ({ data, onUpdate }) => {
  const conditions = data.conditions || [];
  const logic = data.logic || 'and';

  const addCondition = () => {
    onUpdate({
      conditions: [
        ...conditions,
        { field: '', operator: 'equals' as ConditionOperator, value: '' },
      ],
    });
  };

  const updateCondition = (index: number, updates: Partial<Condition>) => {
    const newConditions = conditions.map((c: Condition, i: number) =>
      i === index ? { ...c, ...updates } : c
    );
    onUpdate({ conditions: newConditions });
  };

  const removeCondition = (index: number) => {
    onUpdate({ conditions: conditions.filter((_: any, i: number) => i !== index) });
  };

  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-300 mb-3">Condition Settings</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">
            Logic
          </label>
          <div className="flex gap-2">
            {(['and', 'or'] as const).map((l) => (
              <button
                key={l}
                onClick={() => onUpdate({ logic: l })}
                className={cn(
                  'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  logic === l
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                )}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-medium text-gray-500">
            Conditions ({conditions.length})
          </label>
          {conditions.map((condition: Condition, index: number) => (
            <div
              key={index}
              className="p-3 bg-gray-800/50 rounded-lg border border-gray-700"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-gray-500">#{index + 1}</span>
                <button
                  onClick={() => removeCondition(index)}
                  className="ml-auto p-1 hover:bg-gray-700 rounded"
                >
                  <X className="w-3 h-3 text-gray-500" />
                </button>
              </div>
              <div className="space-y-2">
                <input
                  type="text"
                  value={condition.field}
                  onChange={(e) => updateCondition(index, { field: e.target.value })}
                  placeholder="Field name"
                  className={cn(
                    'w-full px-2 py-1.5 rounded text-xs',
                    'bg-gray-700 border border-gray-600',
                    'text-white placeholder-gray-500',
                    'focus:outline-none focus:border-indigo-500'
                  )}
                />
                <select
                  value={condition.operator}
                  onChange={(e) => updateCondition(index, { operator: e.target.value as ConditionOperator })}
                  className={cn(
                    'w-full px-2 py-1.5 rounded text-xs',
                    'bg-gray-700 border border-gray-600',
                    'text-white',
                    'focus:outline-none focus:border-indigo-500'
                  )}
                >
                  {CONDITION_OPERATORS.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={condition.value}
                  onChange={(e) => updateCondition(index, { value: e.target.value })}
                  placeholder="Value"
                  className={cn(
                    'w-full px-2 py-1.5 rounded text-xs',
                    'bg-gray-700 border border-gray-600',
                    'text-white placeholder-gray-500',
                    'focus:outline-none focus:border-indigo-500'
                  )}
                />
              </div>
            </div>
          ))}
          <button
            onClick={addCondition}
            className={cn(
              'w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm',
              'bg-gray-800 border border-dashed border-gray-600',
              'text-gray-400 hover:bg-gray-700 hover:text-gray-300',
              'transition-colors'
            )}
          >
            <Plus className="w-4 h-4" />
            Add Condition
          </button>
        </div>
      </div>
    </div>
  );
};

// AI Agent Properties
const AIAgentProperties: React.FC<PropertiesProps> = ({ data, onUpdate }) => {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-300 mb-3">AI Agent Settings</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">
            Agent Task
          </label>
          <textarea
            value={data.agentTask || ''}
            onChange={(e) => onUpdate({ agentTask: e.target.value })}
            rows={3}
            placeholder="Describe what the AI agent should do..."
            className={cn(
              'w-full px-3 py-2 rounded-lg text-sm resize-none',
              'bg-gray-800 border border-gray-700',
              'text-white placeholder-gray-500',
              'focus:outline-none focus:border-indigo-500'
            )}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">
            AI Model
          </label>
          <select
            value={data.agentModel || 'gpt-4'}
            onChange={(e) => onUpdate({ agentModel: e.target.value })}
            className={cn(
              'w-full px-3 py-2 rounded-lg text-sm',
              'bg-gray-800 border border-gray-700',
              'text-white',
              'focus:outline-none focus:border-indigo-500'
            )}
          >
            <option value="gpt-4">GPT-4</option>
            <option value="gpt-4-turbo">GPT-4 Turbo</option>
            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            <option value="claude-3-opus">Claude 3 Opus</option>
            <option value="claude-3-sonnet">Claude 3 Sonnet</option>
          </select>
        </div>
      </div>
    </div>
  );
};

// Delay Properties
const DelayProperties: React.FC<PropertiesProps> = ({ data, onUpdate }) => {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-300 mb-3">Delay Settings</h3>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-500 mb-2">
            Duration
          </label>
          <input
            type="number"
            min={1}
            value={data.delayDuration || 1}
            onChange={(e) => onUpdate({ delayDuration: parseInt(e.target.value) || 1 })}
            className={cn(
              'w-full px-3 py-2 rounded-lg text-sm',
              'bg-gray-800 border border-gray-700',
              'text-white',
              'focus:outline-none focus:border-indigo-500'
            )}
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-500 mb-2">
            Unit
          </label>
          <select
            value={data.delayUnit || 'hours'}
            onChange={(e) => onUpdate({ delayUnit: e.target.value })}
            className={cn(
              'w-full px-3 py-2 rounded-lg text-sm',
              'bg-gray-800 border border-gray-700',
              'text-white',
              'focus:outline-none focus:border-indigo-500'
            )}
          >
            <option value="minutes">Minutes</option>
            <option value="hours">Hours</option>
            <option value="days">Days</option>
          </select>
        </div>
      </div>
    </div>
  );
};

// Webhook Properties
const WebhookProperties: React.FC<PropertiesProps> = ({ data, onUpdate }) => {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-300 mb-3">Webhook Settings</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">
            URL
          </label>
          <input
            type="url"
            value={data.webhookUrl || ''}
            onChange={(e) => onUpdate({ webhookUrl: e.target.value })}
            placeholder="https://api.example.com/webhook"
            className={cn(
              'w-full px-3 py-2 rounded-lg text-sm',
              'bg-gray-800 border border-gray-700',
              'text-white placeholder-gray-500',
              'focus:outline-none focus:border-indigo-500'
            )}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">
            Method
          </label>
          <select
            value={data.webhookMethod || 'POST'}
            onChange={(e) => onUpdate({ webhookMethod: e.target.value })}
            className={cn(
              'w-full px-3 py-2 rounded-lg text-sm',
              'bg-gray-800 border border-gray-700',
              'text-white',
              'focus:outline-none focus:border-indigo-500'
            )}
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">
            Headers (JSON)
          </label>
          <textarea
            value={JSON.stringify(data.webhookHeaders || {}, null, 2)}
            onChange={(e) => {
              try {
                onUpdate({ webhookHeaders: JSON.parse(e.target.value) });
              } catch {}
            }}
            rows={3}
            placeholder='{"Authorization": "Bearer ..."}'
            className={cn(
              'w-full px-3 py-2 rounded-lg text-sm resize-none font-mono',
              'bg-gray-800 border border-gray-700',
              'text-white placeholder-gray-500',
              'focus:outline-none focus:border-indigo-500'
            )}
          />
        </div>
      </div>
    </div>
  );
};

// Filter Properties
const FilterProperties: React.FC<PropertiesProps> = ({ data, onUpdate }) => {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-300 mb-3">Filter Settings</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">
            Field
          </label>
          <input
            type="text"
            value={data.filterField || ''}
            onChange={(e) => onUpdate({ filterField: e.target.value })}
            placeholder="customer.type"
            className={cn(
              'w-full px-3 py-2 rounded-lg text-sm',
              'bg-gray-800 border border-gray-700',
              'text-white placeholder-gray-500',
              'focus:outline-none focus:border-indigo-500'
            )}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">
            Operator
          </label>
          <select
            value={data.filterOperator || 'equals'}
            onChange={(e) => onUpdate({ filterOperator: e.target.value as ConditionOperator })}
            className={cn(
              'w-full px-3 py-2 rounded-lg text-sm',
              'bg-gray-800 border border-gray-700',
              'text-white',
              'focus:outline-none focus:border-indigo-500'
            )}
          >
            {CONDITION_OPERATORS.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">
            Value
          </label>
          <input
            type="text"
            value={data.filterValue || ''}
            onChange={(e) => onUpdate({ filterValue: e.target.value })}
            placeholder="vip"
            className={cn(
              'w-full px-3 py-2 rounded-lg text-sm',
              'bg-gray-800 border border-gray-700',
              'text-white placeholder-gray-500',
              'focus:outline-none focus:border-indigo-500'
            )}
          />
        </div>
      </div>
    </div>
  );
};

// Transform Properties
const TransformProperties: React.FC<PropertiesProps> = ({ data, onUpdate }) => {
  const operations = data.transformOperations || [];

  const addOperation = () => {
    onUpdate({
      transformOperations: [
        ...operations,
        { field: '', operation: 'uppercase' as const },
      ],
    });
  };

  const updateOperation = (index: number, updates: any) => {
    onUpdate({
      transformOperations: operations.map((op: any, i: number) =>
        i === index ? { ...op, ...updates } : op
      ),
    });
  };

  const removeOperation = (index: number) => {
    onUpdate({
      transformOperations: operations.filter((_: any, i: number) => i !== index),
    });
  };

  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-300 mb-3">Transform Settings</h3>
      <div className="space-y-3">
        <label className="block text-xs font-medium text-gray-500">
          Operations ({operations.length})
        </label>
        {operations.map((op: any, index: number) => (
          <div
            key={index}
            className="p-3 bg-gray-800/50 rounded-lg border border-gray-700"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-gray-500">#{index + 1}</span>
              <button
                onClick={() => removeOperation(index)}
                className="ml-auto p-1 hover:bg-gray-700 rounded"
              >
                <X className="w-3 h-3 text-gray-500" />
              </button>
            </div>
            <div className="space-y-2">
              <input
                type="text"
                value={op.field}
                onChange={(e) => updateOperation(index, { field: e.target.value })}
                placeholder="Field name"
                className={cn(
                  'w-full px-2 py-1.5 rounded text-xs',
                  'bg-gray-700 border border-gray-600',
                  'text-white placeholder-gray-500',
                  'focus:outline-none focus:border-indigo-500'
                )}
              />
              <select
                value={op.operation}
                onChange={(e) => updateOperation(index, { operation: e.target.value })}
                className={cn(
                  'w-full px-2 py-1.5 rounded text-xs',
                  'bg-gray-700 border border-gray-600',
                  'text-white',
                  'focus:outline-none focus:border-indigo-500'
                )}
              >
                <option value="uppercase">Uppercase</option>
                <option value="lowercase">Lowercase</option>
                <option value="trim">Trim</option>
                <option value="replace">Replace</option>
                <option value="concat">Concatenate</option>
                <option value="date_format">Date Format</option>
              </select>
            </div>
          </div>
        ))}
        <button
          onClick={addOperation}
          className={cn(
            'w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm',
            'bg-gray-800 border border-dashed border-gray-600',
            'text-gray-400 hover:bg-gray-700 hover:text-gray-300',
            'transition-colors'
          )}
        >
          <Plus className="w-4 h-4" />
          Add Operation
        </button>
      </div>
    </div>
  );
};

export default NodeProperties;