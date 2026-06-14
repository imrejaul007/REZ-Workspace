'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Play,
  Pause,
  Edit2,
  Trash2,
  Copy,
  Download,
  Upload,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  LayoutGrid,
  List,
  ChevronDown,
  Calendar,
  Tag,
} from 'lucide-react';
import { useWorkflowStore } from '@/store/workflowStore';
import { Workflow, WorkflowMetadata } from '@/types/workflow';
import { cn, formatRelativeTime, getStatusColor } from '@/lib/utils';

type ViewMode = 'grid' | 'list';
type StatusFilter = 'all' | 'draft' | 'active' | 'paused' | 'archived';

interface WorkflowCardProps {
  workflow: Workflow;
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onDeploy: (id: string) => void;
}

function WorkflowCard({ workflow, onEdit, onDuplicate, onDelete, onDeploy }: WorkflowCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const statusColors = getStatusColor(workflow.metadata?.status || 'draft');

  return (
    <div
      className={cn(
        'group relative bg-gray-800/50 border border-gray-700 rounded-xl',
        'hover:bg-gray-800 hover:border-gray-600',
        'transition-all duration-200'
      )}
    >
      {/* Status indicator */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 h-1 rounded-t-xl',
          workflow.metadata?.status === 'active' && 'bg-green-500',
          workflow.metadata?.status === 'draft' && 'bg-gray-500',
          workflow.metadata?.status === 'paused' && 'bg-yellow-500',
          workflow.metadata?.status === 'archived' && 'bg-red-500'
        )}
      />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-white truncate group-hover:text-indigo-400 transition-colors">
              {workflow.metadata?.name || 'Untitled Workflow'}
            </h3>
            {workflow.metadata?.description && (
              <p className="text-sm text-gray-500 truncate mt-1">
                {workflow.metadata.description}
              </p>
            )}
          </div>

          {/* Menu button */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-lg hover:bg-gray-700 transition-colors opacity-0 group-hover:opacity-100"
            >
              <MoreVertical className="w-4 h-4 text-gray-400" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-48 bg-gray-800 rounded-lg shadow-xl border border-gray-700 py-1 z-50">
                  <button
                    onClick={() => {
                      onEdit(workflow.id);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      onDuplicate(workflow.id);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700"
                  >
                    <Copy className="w-4 h-4" />
                    Duplicate
                  </button>
                  {workflow.metadata?.status !== 'active' && (
                    <button
                      onClick={() => {
                        onDeploy(workflow.id);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-400 hover:bg-gray-700"
                    >
                      <Play className="w-4 h-4" />
                      Deploy
                    </button>
                  )}
                  {workflow.metadata?.status === 'active' && (
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-yellow-400 hover:bg-gray-700"
                    >
                      <Pause className="w-4 h-4" />
                      Pause
                    </button>
                  )}
                  <div className="border-t border-gray-700 my-1" />
                  <button
                    onClick={() => {
                      onDelete(workflow.id);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-gray-700"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
          <div className="flex items-center gap-1">
            <LayoutGrid className="w-3 h-3" />
            <span>{workflow.nodes?.length || 0} nodes</span>
          </div>
          <div className="flex items-center gap-1">
            <ArrowRight className="w-3 h-3" />
            <span>{workflow.edges?.length || 0} connections</span>
          </div>
        </div>

        {/* Tags */}
        {workflow.metadata?.tags && workflow.metadata.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {workflow.metadata.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded text-xs bg-gray-700/50 text-gray-400"
              >
                {tag}
              </span>
            ))}
            {workflow.metadata.tags.length > 3 && (
              <span className="px-2 py-0.5 rounded text-xs bg-gray-700/50 text-gray-400">
                +{workflow.metadata.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-700/50">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'px-2 py-0.5 rounded text-xs font-medium capitalize',
                statusColors.bg,
                statusColors.text
              )}
            >
              {workflow.metadata?.status || 'draft'}
            </span>
            {workflow.metadata?.category && (
              <span className="text-xs text-gray-500">{workflow.metadata.category}</span>
            )}
          </div>

          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>{formatRelativeTime(workflow.metadata?.updatedAt || '')}</span>
          </div>
        </div>
      </div>

      {/* Edit button overlay */}
      <Link
        href={`/editor?id=${workflow.id}`}
        className="absolute inset-0 z-10"
        aria-label={`Edit ${workflow.metadata?.name}`}
      />
    </div>
  );
}

export default function WorkflowsPage() {
  const { workflows, loadWorkflow, createNewWorkflow, deleteWorkflow, saveWorkflow } = useWorkflowStore();

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading workflows
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Load workflows from API (simulated)
  useEffect(() => {
    // In production, this would fetch from /api/workflows
    const sampleWorkflows: Workflow[] = [
      {
        id: 'wf-1',
        metadata: {
          name: 'Review Response Automation',
          description: 'Automatically respond to customer reviews with AI-generated responses',
          status: 'active',
          version: 3,
          tags: ['reviews', 'automation', 'ai'],
          category: 'Restaurant',
          createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
          updatedAt: new Date(Date.now() - 3600000).toISOString(),
        },
        nodes: [
          { id: '1', type: 'trigger', position: { x: 0, y: 0 }, data: { label: 'Trigger' } },
          { id: '2', type: 'ai_agent', position: { x: 0, y: 100 }, data: { label: 'AI Agent' } },
          { id: '3', type: 'action', position: { x: 0, y: 200 }, data: { label: 'Send Message' } },
        ],
        edges: [
          { id: 'e1', source: '1', target: '2' },
          { id: 'e2', source: '2', target: '3' },
        ],
      },
      {
        id: 'wf-2',
        metadata: {
          name: 'Abandoned Cart Recovery',
          description: 'Re-engage customers who left items in their cart',
          status: 'draft',
          version: 1,
          tags: ['recovery', 'cart', 'retail'],
          category: 'Retail',
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          updatedAt: new Date(Date.now() - 7200000).toISOString(),
        },
        nodes: [
          { id: '1', type: 'trigger', position: { x: 0, y: 0 }, data: { label: 'Trigger' } },
          { id: '2', type: 'delay', position: { x: 0, y: 100 }, data: { label: 'Delay' } },
          { id: '3', type: 'action', position: { x: 0, y: 200 }, data: { label: 'Send Email' } },
        ],
        edges: [
          { id: 'e1', source: '1', target: '2' },
          { id: 'e2', source: '2', target: '3' },
        ],
      },
      {
        id: 'wf-3',
        metadata: {
          name: 'Guest Check-in Welcome',
          description: 'Welcome guests with personalized messages on check-in',
          status: 'paused',
          version: 2,
          tags: ['hospitality', 'welcome', 'hotel'],
          category: 'Hotel',
          createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString(),
        },
        nodes: [
          { id: '1', type: 'trigger', position: { x: 0, y: 0 }, data: { label: 'Check-in' } },
          { id: '2', type: 'action', position: { x: 0, y: 100 }, data: { label: 'Send WhatsApp' } },
          { id: '3', type: 'delay', position: { x: 0, y: 200 }, data: { label: 'Wait 24h' } },
          { id: '4', type: 'action', position: { x: 0, y: 300 }, data: { label: 'Offer Amenities' } },
        ],
        edges: [
          { id: 'e1', source: '1', target: '2' },
          { id: 'e2', source: '2', target: '3' },
          { id: 'e3', source: '3', target: '4' },
        ],
      },
    ];

    sampleWorkflows.forEach((wf) => {
      useWorkflowStore.setState((state) => ({
        workflows: [...state.workflows.filter((w) => w.id !== wf.id), wf],
      }));
    });
  }, []);

  const filteredWorkflows = workflows.filter((wf) => {
    const matchesStatus =
      statusFilter === 'all' || wf.metadata?.status === statusFilter;
    const matchesSearch =
      !searchQuery ||
      wf.metadata?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wf.metadata?.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleEdit = (id: string) => {
    const workflow = workflows.find((w) => w.id === id);
    if (workflow) {
      loadWorkflow(workflow);
    }
  };

  const handleDuplicate = (id: string) => {
    const workflow = workflows.find((w) => w.id === id);
    if (workflow) {
      const duplicated: Workflow = {
        ...workflow,
        id: `wf-${Date.now()}`,
        metadata: {
          ...workflow.metadata,
          name: `${workflow.metadata?.name} (Copy)`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'draft',
        },
      };
      useWorkflowStore.setState((state) => ({
        workflows: [...state.workflows, duplicated],
      }));
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this workflow?')) {
      deleteWorkflow(id);
    }
  };

  const handleDeploy = (id: string) => {
    logger.info('Deploying workflow:', id);
  };

  const handleNewWorkflow = () => {
    createNewWorkflow('Untitled Workflow', 'A new workflow');
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Workflows</h1>
              <p className="text-sm text-gray-500 mt-1">
                Create, manage, and monitor your automation workflows
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium',
                  'bg-indigo-500 text-white',
                  'hover:bg-indigo-600 transition-colors'
                )}
              >
                <Upload className="w-4 h-4" />
                Import
              </button>
              <button
                onClick={handleNewWorkflow}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium',
                  'bg-gradient-to-r from-indigo-500 to-purple-600 text-white',
                  'hover:from-indigo-600 hover:to-purple-700 transition-colors'
                )}
              >
                <Plus className="w-4 h-4" />
                New Workflow
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Filters and search */}
        <div className="flex items-center gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search workflows..."
              className={cn(
                'w-full pl-10 pr-4 py-2 rounded-lg text-sm',
                'bg-gray-800 border border-gray-700',
                'text-white placeholder-gray-500',
                'focus:outline-none focus:border-indigo-500'
              )}
            />
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2">
            {(['all', 'draft', 'active', 'paused', 'archived'] as StatusFilter[]).map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize',
                    statusFilter === status
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
                  )}
                >
                  {status}
                </button>
              )
            )}
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 rounded-lg transition-colors',
                viewMode === 'grid'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-500 hover:text-gray-300'
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 rounded-lg transition-colors',
                viewMode === 'list'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-500 hover:text-gray-300'
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Workflows grid/list */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-48 bg-gray-800/30 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : filteredWorkflows.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
              <LayoutGrid className="w-8 h-8 text-gray-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-400 mb-2">
              {searchQuery ? 'No workflows found' : 'No workflows yet'}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {searchQuery
                ? 'Try adjusting your search or filter'
                : 'Create your first workflow to get started'}
            </p>
            <button
              onClick={handleNewWorkflow}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
                'bg-indigo-500 text-white',
                'hover:bg-indigo-600 transition-colors'
              )}
            >
              <Plus className="w-4 h-4" />
              Create Workflow
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWorkflows.map((workflow) => (
              <WorkflowCard
                key={workflow.id}
                workflow={workflow}
                onEdit={handleEdit}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
                onDeploy={handleDeploy}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredWorkflows.map((workflow) => (
              <div
                key={workflow.id}
                className={cn(
                  'flex items-center gap-4 p-4 bg-gray-800/50 border border-gray-700 rounded-lg',
                  'hover:bg-gray-800 hover:border-gray-600 transition-all'
                )}
              >
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-white">
                    {workflow.metadata?.name || 'Untitled Workflow'}
                  </h3>
                  <p className="text-xs text-gray-500 truncate">
                    {workflow.metadata?.description || 'No description'}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <LayoutGrid className="w-3 h-3" />
                    <span>{workflow.nodes?.length || 0}</span>
                  </div>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded capitalize',
                      getStatusColor(workflow.metadata?.status || 'draft').bg,
                      getStatusColor(workflow.metadata?.status || 'draft').text
                    )}
                  >
                    {workflow.metadata?.status || 'draft'}
                  </span>
                  <span>{formatRelativeTime(workflow.metadata?.updatedAt || '')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(workflow.id)}
                    className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}