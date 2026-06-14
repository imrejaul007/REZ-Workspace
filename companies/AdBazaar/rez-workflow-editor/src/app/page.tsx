'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Plus, ArrowLeft, Menu, PanelRightClose, LayoutGrid } from 'lucide-react';
import { useWorkflowStore } from '@/store/workflowStore';
import { NodeProperties } from '@/components/Properties';
import { Toolbar } from '@/components/Toolbar';
import { cn } from '@/lib/utils';

// Dynamic imports for client-side only components
const NodePalette = dynamic(
  () => import('@/components/Sidebar/NodePalette').then((mod) => mod.default),
  { ssr: false, loading: () => <SidebarSkeleton /> }
);

const Templates = dynamic(
  () => import('@/components/Sidebar/Templates').then((mod) => mod.default),
  { ssr: false, loading: () => <SidebarSkeleton /> }
);

const Canvas = dynamic(
  () => import('@/components/Canvas/Canvas').then((mod) => mod.default),
  { ssr: false, loading: () => <CanvasSkeleton /> }
);

function SidebarSkeleton() {
  return (
    <div className="h-full p-4 animate-pulse">
      <div className="h-6 w-24 bg-gray-700 rounded mb-4" />
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 bg-gray-800 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

function CanvasSkeleton() {
  return (
    <div className="w-full h-full bg-gray-900 animate-pulse flex items-center justify-center">
      <div className="text-gray-600">Loading canvas...</div>
    </div>
  );
}

type SidebarTab = 'nodes' | 'templates';

export default function WorkflowEditorPage() {
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [leftSidebarTab, setLeftSidebarTab] = useState<SidebarTab>('nodes');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const { currentWorkflow, createNewWorkflow, loadWorkflow } = useWorkflowStore();

  // Initialize with a new workflow if none exists
  useEffect(() => {
    if (!currentWorkflow) {
      createNewWorkflow('Untitled Workflow', 'A new workflow');
    }
  }, [currentWorkflow, createNewWorkflow]);

  const handleNodeSelect = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId);
  }, []);

  const handleSave = useCallback(() => {
    logger.info('Workflow saved');
  }, []);

  const handleDeploy = useCallback(() => {
    logger.info('Workflow deployed');
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-white overflow-hidden">
      {/* Toolbar */}
      <Toolbar
        onSave={handleSave}
        onDeploy={handleDeploy}
      />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div
          className={cn(
            'relative flex-shrink-0 transition-all duration-300 ease-in-out border-r border-gray-800',
            leftSidebarOpen ? 'w-72' : 'w-0'
          )}
        >
          {leftSidebarOpen && (
            <>
              {/* Sidebar tabs */}
              <div className="flex border-b border-gray-800">
                <button
                  onClick={() => setLeftSidebarTab('nodes')}
                  className={cn(
                    'flex-1 px-4 py-3 text-sm font-medium transition-colors',
                    leftSidebarTab === 'nodes'
                      ? 'text-indigo-400 border-b-2 border-indigo-400 bg-gray-900/50'
                      : 'text-gray-500 hover:text-gray-300 hover:bg-gray-900/30'
                  )}
                >
                  <LayoutGrid className="w-4 h-4 mx-auto mb-1" />
                  Nodes
                </button>
                <button
                  onClick={() => setLeftSidebarTab('templates')}
                  className={cn(
                    'flex-1 px-4 py-3 text-sm font-medium transition-colors',
                    leftSidebarTab === 'templates'
                      ? 'text-indigo-400 border-b-2 border-indigo-400 bg-gray-900/50'
                      : 'text-gray-500 hover:text-gray-300 hover:bg-gray-900/30'
                  )}
                >
                  <LayoutGrid className="w-4 h-4 mx-auto mb-1" />
                  Templates
                </button>
              </div>

              {/* Sidebar content */}
              <div className="h-[calc(100%-48px)] overflow-hidden bg-gray-900/30">
                {leftSidebarTab === 'nodes' ? <NodePalette /> : <Templates />}
              </div>
            </>
          )}

          {/* Toggle button */}
          <button
            onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
            className={cn(
              'absolute top-2 -right-3 z-10 w-6 h-6 rounded-full',
              'bg-gray-800 border border-gray-700',
              'flex items-center justify-center',
              'hover:bg-gray-700 transition-colors',
              leftSidebarOpen ? 'right-2' : 'left-2'
            )}
          >
            <Menu className="w-3 h-3 text-gray-400" />
          </button>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <Canvas onNodeSelect={handleNodeSelect} />

          {/* Empty state */}
          {(!currentWorkflow?.nodes || currentWorkflow.nodes.length === 0) && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center p-8 max-w-md">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
                  <Plus className="w-8 h-8 text-gray-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-400 mb-2">
                  Start Building Your Workflow
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Drag nodes from the left sidebar to create your workflow.
                  Connect them by dragging from one node&apos;s output to another&apos;s input.
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
                  <span>Pro tip:</span>
                  <span>Click a node to see its properties in the right panel</span>
                </div>
              </div>
            </div>
          )}

          {/* Zoom controls overlay */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-lg bg-gray-800/80 backdrop-blur-sm border border-gray-700 text-xs text-gray-400">
              {currentWorkflow?.nodes?.length || 0} nodes
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-gray-800/80 backdrop-blur-sm border border-gray-700 text-xs text-gray-400">
              {currentWorkflow?.edges?.length || 0} connections
            </div>
          </div>
        </div>

        {/* Right Sidebar - Properties Panel */}
        <div
          className={cn(
            'relative flex-shrink-0 transition-all duration-300 ease-in-out border-l border-gray-800',
            rightSidebarOpen ? 'w-80' : 'w-0'
          )}
        >
          {rightSidebarOpen && (
            <NodeProperties onClose={() => setRightSidebarOpen(false)} />
          )}

          {/* Toggle button */}
          <button
            onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
            className={cn(
              'absolute top-2 -left-3 z-10 w-6 h-6 rounded-full',
              'bg-gray-800 border border-gray-700',
              'flex items-center justify-center',
              'hover:bg-gray-700 transition-colors',
              rightSidebarOpen ? 'left-2' : 'right-2'
            )}
          >
            <PanelRightClose className="w-3 h-3 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-gray-900 border-t border-gray-800 text-xs text-gray-500">
        <div className="flex items-center gap-4">
          <span>
            {currentWorkflow?.metadata?.version
              ? `v${currentWorkflow.metadata.version}`
              : 'v1'}
          </span>
          <span>
            {currentWorkflow?.metadata?.updatedAt
              ? `Last saved: ${new Date(currentWorkflow.metadata.updatedAt).toLocaleTimeString()}`
              : 'Not saved yet'}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span>Zoom: 100%</span>
          <span>Auto-save: ON</span>
        </div>
      </div>
    </div>
  );
}