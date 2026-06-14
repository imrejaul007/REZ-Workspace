'use client';

import React from 'react';
import {
  UtensilsCrossed,
  ShoppingCart,
  Hotel,
  Users,
  Star,
  MessageSquare,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { WorkflowTemplate, WorkflowNodeType } from '@/types/workflow';
import { useWorkflowStore } from '@/store/workflowStore';
import { cn } from '@/lib/utils';

interface TemplatesProps {
  onClose?: () => void;
}

// Pre-built workflow templates
const TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'review-response',
    name: 'Review Response',
    description: 'Automatically respond to customer reviews with personalized messages',
    category: 'Restaurant',
    icon: 'utensils',
    tags: ['reviews', 'customer engagement', 'automation'],
    popularity: 95,
    workflow: {
      nodes: [
        {
          id: 'trigger-1',
          type: 'trigger' as WorkflowNodeType,
          position: { x: 250, y: 50 },
          data: {
            label: 'Review Received',
            type: 'trigger',
            triggerType: 'review_received',
            config: {},
          },
          handles: { bottom: true },
        },
        {
          id: 'ai-1',
          type: 'ai_agent' as WorkflowNodeType,
          position: { x: 250, y: 180 },
          data: {
            label: 'Generate Response',
            type: 'ai_agent',
            agentTask: 'Generate a personalized response to the customer review',
            agentModel: 'gpt-4',
            config: {},
          },
          handles: { top: true, bottom: true },
        },
        {
          id: 'action-1',
          type: 'action' as WorkflowNodeType,
          position: { x: 250, y: 310 },
          data: {
            label: 'Send Response',
            type: 'action',
            actionType: 'send_whatsapp',
            config: {},
          },
          handles: { top: true },
        },
      ],
      edges: [
        {
          id: 'e1-2',
          source: 'trigger-1',
          target: 'ai-1',
        },
        {
          id: 'e2-3',
          source: 'ai-1',
          target: 'action-1',
        },
      ],
    },
  },
  {
    id: 'abandoned-cart',
    name: 'Abandoned Cart Recovery',
    description: 'Re-engage customers who left items in their cart without purchasing',
    category: 'Retail',
    icon: 'cart',
    tags: ['recovery', 'cart abandonment', 'sales'],
    popularity: 92,
    workflow: {
      nodes: [
        {
          id: 'trigger-1',
          type: 'trigger' as WorkflowNodeType,
          position: { x: 250, y: 50 },
          data: {
            label: 'Cart Abandoned',
            type: 'trigger',
            triggerType: 'cart_abandoned',
            config: {},
          },
          handles: { bottom: true },
        },
        {
          id: 'delay-1',
          type: 'delay' as WorkflowNodeType,
          position: { x: 250, y: 180 },
          data: {
            label: 'Wait 1 Hour',
            type: 'delay',
            delayDuration: 1,
            delayUnit: 'hours',
            config: {},
          },
          handles: { top: true, bottom: true },
        },
        {
          id: 'action-1',
          type: 'action' as WorkflowNodeType,
          position: { x: 250, y: 310 },
          data: {
            label: 'Send Reminder',
            type: 'action',
            actionType: 'send_email',
            config: { template: 'cart_reminder' },
          },
          handles: { top: true, bottom: true },
        },
        {
          id: 'delay-2',
          type: 'delay' as WorkflowNodeType,
          position: { x: 250, y: 440 },
          data: {
            label: 'Wait 24 Hours',
            type: 'delay',
            delayDuration: 24,
            delayUnit: 'hours',
            config: {},
          },
          handles: { top: true, bottom: true },
        },
        {
          id: 'condition-1',
          type: 'condition' as WorkflowNodeType,
          position: { x: 250, y: 570 },
          data: {
            label: 'Cart Recovered?',
            type: 'condition',
            conditions: [{ field: 'purchase_completed', operator: 'equals', value: 'true' }],
            logic: 'and',
            config: {},
          },
          handles: { top: true },
        },
      ],
      edges: [
        { id: 'e1-2', source: 'trigger-1', target: 'delay-1' },
        { id: 'e2-3', source: 'delay-1', target: 'action-1' },
        { id: 'e3-4', source: 'action-1', target: 'delay-2' },
        { id: 'e4-5', source: 'delay-2', target: 'condition-1' },
      ],
    },
  },
  {
    id: 'guest-engagement',
    name: 'Guest Engagement Flow',
    description: 'Engage hotel guests throughout their stay for better experience',
    category: 'Hotel',
    icon: 'hotel',
    tags: ['hospitality', 'guest experience', 'engagement'],
    popularity: 88,
    workflow: {
      nodes: [
        {
          id: 'trigger-1',
          type: 'trigger' as WorkflowNodeType,
          position: { x: 250, y: 50 },
          data: {
            label: 'Check-in',
            type: 'trigger',
            triggerType: 'customer_checkin',
            config: {},
          },
          handles: { bottom: true },
        },
        {
          id: 'action-1',
          type: 'action' as WorkflowNodeType,
          position: { x: 250, y: 180 },
          data: {
            label: 'Welcome Message',
            type: 'action',
            actionType: 'send_whatsapp',
            config: { template: 'welcome' },
          },
          handles: { top: true, bottom: true },
        },
        {
          id: 'delay-1',
          type: 'delay' as WorkflowNodeType,
          position: { x: 250, y: 310 },
          data: {
            label: 'Day 2',
            type: 'delay',
            delayDuration: 24,
            delayUnit: 'hours',
            config: {},
          },
          handles: { top: true, bottom: true },
        },
        {
          id: 'action-2',
          type: 'action' as WorkflowNodeType,
          position: { x: 250, y: 440 },
          data: {
            label: 'Amenities Offer',
            type: 'action',
            actionType: 'send_push_notification',
            config: { template: 'amenities' },
          },
          handles: { top: true },
        },
      ],
      edges: [
        { id: 'e1-2', source: 'trigger-1', target: 'action-1' },
        { id: 'e2-3', source: 'action-1', target: 'delay-1' },
        { id: 'e3-4', source: 'delay-1', target: 'action-2' },
      ],
    },
  },
  {
    id: 'birthday-campaign',
    name: 'Birthday Campaign',
    description: 'Send personalized birthday wishes to customers with special offers',
    category: 'Loyalty',
    icon: 'cake',
    tags: ['birthday', 'loyalty', 'personalization'],
    popularity: 85,
    workflow: {
      nodes: [
        {
          id: 'trigger-1',
          type: 'trigger' as WorkflowNodeType,
          position: { x: 250, y: 50 },
          data: {
            label: 'Birthday Trigger',
            type: 'trigger',
            triggerType: 'birthday_anniversary',
            config: {},
          },
          handles: { bottom: true },
        },
        {
          id: 'action-1',
          type: 'action' as WorkflowNodeType,
          position: { x: 250, y: 180 },
          data: {
            label: 'Send Birthday Message',
            type: 'action',
            actionType: 'send_whatsapp',
            config: { template: 'birthday', includeOffer: true },
          },
          handles: { top: true, bottom: true },
        },
        {
          id: 'action-2',
          type: 'action' as WorkflowNodeType,
          position: { x: 250, y: 310 },
          data: {
            label: 'Add to VIP Segment',
            type: 'action',
            actionType: 'add_to_segment',
            config: { segment: 'vip_birthday' },
          },
          handles: { top: true },
        },
      ],
      edges: [
        { id: 'e1-2', source: 'trigger-1', target: 'action-1' },
        { id: 'e2-3', source: 'action-1', target: 'action-2' },
      ],
    },
  },
  {
    id: 'purchase-followup',
    name: 'Purchase Follow-up',
    description: 'Follow up with customers after purchase to gather reviews and encourage repeat business',
    category: 'Retail',
    icon: 'shopping',
    tags: ['post-purchase', 'reviews', 'upsell'],
    popularity: 90,
    workflow: {
      nodes: [
        {
          id: 'trigger-1',
          type: 'trigger' as WorkflowNodeType,
          position: { x: 250, y: 50 },
          data: {
            label: 'Purchase Completed',
            type: 'trigger',
            triggerType: 'purchase_completed',
            config: {},
          },
          handles: { bottom: true },
        },
        {
          id: 'delay-1',
          type: 'delay' as WorkflowNodeType,
          position: { x: 250, y: 180 },
          data: {
            label: 'Wait 3 Days',
            type: 'delay',
            delayDuration: 72,
            delayUnit: 'hours',
            config: {},
          },
          handles: { top: true, bottom: true },
        },
        {
          id: 'action-1',
          type: 'action' as WorkflowNodeType,
          position: { x: 250, y: 310 },
          data: {
            label: 'Request Review',
            type: 'action',
            actionType: 'send_email',
            config: { template: 'review_request' },
          },
          handles: { top: true, bottom: true },
        },
        {
          id: 'action-2',
          type: 'action' as WorkflowNodeType,
          position: { x: 250, y: 440 },
          data: {
            label: 'Cross-sell Offer',
            type: 'action',
            actionType: 'create_campaign',
            config: { template: 'cross_sell' },
          },
          handles: { top: true },
        },
      ],
      edges: [
        { id: 'e1-2', source: 'trigger-1', target: 'delay-1' },
        { id: 'e2-3', source: 'delay-1', target: 'action-1' },
        { id: 'e3-4', source: 'action-1', target: 'action-2' },
      ],
    },
  },
];

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  utensils: UtensilsCrossed,
  cart: ShoppingCart,
  hotel: Hotel,
  users: Users,
  star: Star,
  message: MessageSquare,
  clock: Clock,
};

const Templates: React.FC<TemplatesProps> = ({ onClose }) => {
  const { loadTemplate } = useWorkflowStore();

  const handleSelectTemplate = (template: WorkflowTemplate) => {
    loadTemplate(template);
    onClose?.();
  };

  const categories = [...new Set(TEMPLATES.map((t) => t.category))];

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white mb-1">Templates</h2>
        <p className="text-xs text-gray-500">
          Start with a pre-built workflow template
        </p>
      </div>

      {/* Popular templates first */}
      <div className="mb-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-yellow-400 mb-3 flex items-center gap-2">
          <Star className="w-3 h-3" />
          Popular Templates
        </h3>
        <div className="space-y-3">
          {TEMPLATES.filter((t) => t.popularity && t.popularity >= 90)
            .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
            .map((template) => {
              const Icon = iconMap[template.icon || 'star'] || Star;
              return (
                <button
                  key={template.id}
                  onClick={() => handleSelectTemplate(template)}
                  className={cn(
                    'w-full text-left p-3 rounded-lg',
                    'bg-gray-800/50 border border-gray-700',
                    'hover:bg-gray-800 hover:border-indigo-500/50',
                    'transition-all duration-200 group'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">
                          {template.name}
                        </span>
                        <ArrowRight className="w-3 h-3 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="text-xs text-gray-500 line-clamp-1 mt-1">
                        {template.description}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-400">
                          {template.category}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
        </div>
      </div>

      {/* All templates by category */}
      {categories.map((category) => (
        <div key={category} className="mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
            {category}
          </h3>
          <div className="space-y-2">
            {TEMPLATES.filter((t) => t.category === category).map((template) => {
              const Icon = iconMap[template.icon || 'star'] || Star;
              return (
                <button
                  key={template.id}
                  onClick={() => handleSelectTemplate(template)}
                  className={cn(
                    'w-full text-left p-3 rounded-lg',
                    'bg-gray-800/30 border border-gray-700/50',
                    'hover:bg-gray-800 hover:border-gray-600',
                    'transition-all duration-200'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gray-700/50">
                      <Icon className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-200">
                        {template.name}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {template.description}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Tags */}
      <div className="mt-6 pt-6 border-t border-gray-700">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
          Browse by Tag
        </h3>
        <div className="flex flex-wrap gap-2">
          {[...new Set(TEMPLATES.flatMap((t) => t.tags || []))].map((tag) => (
            <button
              key={tag}
              className={cn(
                'px-2 py-1 rounded text-xs',
                'bg-gray-800 text-gray-400',
                'hover:bg-gray-700 hover:text-gray-300',
                'transition-colors'
              )}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Templates;