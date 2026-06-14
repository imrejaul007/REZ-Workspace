'use client';

import React, { useState, useRef } from 'react';
import {
  Save,
  Upload,
  Download,
  Play,
  Pause,
  History,
  Settings,
  Undo,
  Redo,
  Plus,
  Check,
  AlertCircle,
  ChevronDown,
  Loader2,
  FileJson,
  Trash2,
  Eye,
  GitBranch,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from 'lucide-react';
import { useWorkflowStore } from '@/store/workflowStore';
import { cn } from '@/lib/utils';

interface ToolbarProps {
  onSave?: () => void;
  onDeploy?: () => void;
  onSettings?: () => void;
  onHistory?: () => void;
  onNewWorkflow?: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  onSave,
  onDeploy,
  onSettings,
  onHistory,
  onNewWorkflow,
}) => {
  const {
    currentWorkflow,
    saveWorkflow,
    deployWorkflow,
    undo,
    redo,
    canUndo,
    canRedo,
    isDirty,
    isReadOnly,
    createNewWorkflow,
  } = useWorkflowStore();

  const [isSaving, setIsSaving] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [showDeployMenu, setShowDeployMenu] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const deployMenuRef = useRef<HTMLDivElement>(null);
  const fileMenuRef = useRef<HTMLDivElement>(null);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = saveWorkflow();
      if (result) {
        showNotification('success', 'Workflow saved successfully');
        onSave?.();
      } else {
        showNotification('error', 'Failed to save workflow');
      }
    } catch (error) {
      showNotification('error', 'Error saving workflow');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeploy = async () => {
    setIsDeploying(true);
    setShowDeployMenu(false);
    try {
      const result = await deployWorkflow();
      if (result.success) {
        showNotification('success', result.message);
        onDeploy?.();
      } else {
        showNotification('error', result.message);
      }
    } catch (error) {
      showNotification('error', 'Error deploying workflow');
    } finally {
      setIsDeploying(false);
    }
  };

  const handleExport = () => {
    if (!currentWorkflow) return;

    const json = JSON.stringify(currentWorkflow, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentWorkflow.metadata.name.replace(/\s+/g, '_').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowFileMenu(false);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        // Validate and load workflow
        if (json.metadata && json.nodes && json.edges) {
          useWorkflowStore.getState().loadWorkflow(json);
          showNotification('success', 'Workflow imported successfully');
        } else {
          showNotification('error', 'Invalid workflow file');
        }
      } catch {
        showNotification('error', 'Failed to parse workflow file');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
    setShowFileMenu(false);
  };

  const handleNewWorkflow = () => {
    if (isDirty) {
      if (confirm('You have unsaved changes. Create a new workflow anyway?')) {
        createNewWorkflow('Untitled Workflow', 'A new workflow');
        onNewWorkflow?.();
      }
    } else {
      createNewWorkflow('Untitled Workflow', 'A new workflow');
      onNewWorkflow?.();
    }
    setShowFileMenu(false);
  };

  const status = currentWorkflow?.metadata?.status || 'draft';
  const statusColors = {
    draft: 'bg-gray-500',
    active: 'bg-green-500',
    paused: 'bg-yellow-500',
    archived: 'bg-red-500',
  };

  return (
    <div className="relative">
      {/* Notification Toast */}
      {notification && (
        <div
          className={cn(
            'absolute top-full left-1/2 -translate-x-1/2 mt-2 px-4 py-2 rounded-lg shadow-lg z-50',
            'flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-top-2',
            notification.type === 'success' && 'bg-green-500 text-white',
            notification.type === 'error' && 'bg-red-500 text-white',
            notification.type === 'info' && 'bg-blue-500 text-white'
          )}
        >
          {notification.type === 'success' && <Check className="w-4 h-4" />}
          {notification.type === 'error' && <AlertCircle className="w-4 h-4" />}
          {notification.type === 'info' && <AlertCircle className="w-4 h-4" />}
          {notification.message}
        </div>
      )}

      <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 border-b border-gray-800">
        {/* Left section - Logo and workflow name */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-semibold text-white hidden sm:inline">
              ReZ Workflow Editor
            </span>
          </div>

          {currentWorkflow && (
            <div className="flex items-center gap-2 pl-4 border-l border-gray-700">
              <input
                type="text"
                value={currentWorkflow.metadata.name || 'Untitled Workflow'}
                onChange={(e) =>
                  useWorkflowStore
                    .getState()
                    .updateWorkflowMetadata({ name: e.target.value })
                }
                className={cn(
                  'px-2 py-1 rounded text-sm bg-transparent text-white',
                  'border border-transparent hover:border-gray-600',
                  'focus:outline-none focus:border-indigo-500',
                  'max-w-[200px]'
                )}
                disabled={isReadOnly}
              />
              <div className="flex items-center gap-1">
                <div className={cn('w-2 h-2 rounded-full', statusColors[status as keyof typeof statusColors])} />
                <span className="text-xs text-gray-500 capitalize">{status}</span>
              </div>
              {isDirty && (
                <span className="text-xs text-yellow-500">(unsaved)</span>
              )}
            </div>
          )}
        </div>

        {/* Center section - Undo/Redo and actions */}
        <div className="flex-1 flex items-center justify-center gap-1">
          {/* File menu */}
          <div className="relative" ref={fileMenuRef}>
            <button
              onClick={() => setShowFileMenu(!showFileMenu)}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm',
                'text-gray-300 hover:bg-gray-800 transition-colors'
              )}
            >
              <FileJson className="w-4 h-4" />
              <span className="hidden sm:inline">File</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {showFileMenu && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-gray-800 rounded-lg shadow-xl border border-gray-700 py-1 z-50">
                <button
                  onClick={handleNewWorkflow}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700"
                >
                  <Plus className="w-4 h-4" />
                  New Workflow
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700"
                >
                  <Upload className="w-4 h-4" />
                  Import JSON
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
                <button
                  onClick={handleExport}
                  disabled={!currentWorkflow}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  Export JSON
                </button>
                <div className="border-t border-gray-700 my-1" />
                <button
                  onClick={handleSave}
                  disabled={isSaving || !currentWorkflow}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save
                </button>
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-gray-700 mx-2" />

          {/* Undo/Redo */}
          <button
            onClick={undo}
            disabled={!canUndo()}
            className={cn(
              'p-2 rounded-lg transition-colors',
              canUndo()
                ? 'text-gray-400 hover:bg-gray-800 hover:text-white'
                : 'text-gray-600 cursor-not-allowed'
            )}
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo()}
            className={cn(
              'p-2 rounded-lg transition-colors',
              canRedo()
                ? 'text-gray-400 hover:bg-gray-800 hover:text-white'
                : 'text-gray-600 cursor-not-allowed'
            )}
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-gray-700 mx-2" />

          {/* Deploy button */}
          <div className="relative" ref={deployMenuRef}>
            <button
              onClick={() => setShowDeployMenu(!showDeployMenu)}
              disabled={isDeploying || !currentWorkflow}
              className={cn(
                'flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors',
                isDeploying
                  ? 'bg-indigo-500/50 text-white cursor-wait'
                  : currentWorkflow
                  ? 'bg-indigo-500 text-white hover:bg-indigo-600'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              )}
            >
              {isDeploying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Deploy
              <ChevronDown className="w-3 h-3" />
            </button>

            {showDeployMenu && (
              <div className="absolute top-full right-0 mt-1 w-56 bg-gray-800 rounded-lg shadow-xl border border-gray-700 py-1 z-50">
                <div className="px-3 py-2 border-b border-gray-700">
                  <p className="text-xs text-gray-500">Deploy to</p>
                  <p className="text-sm text-white font-medium">Production</p>
                </div>
                <button
                  onClick={handleDeploy}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-400 hover:bg-gray-700"
                >
                  <Play className="w-4 h-4" />
                  Deploy Now
                </button>
                <button
                  onClick={() => {
                    setShowDeployMenu(false);
                    onHistory?.();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700"
                >
                  <History className="w-4 h-4" />
                  View History
                </button>
                <div className="border-t border-gray-700 my-1 pt-1">
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-yellow-400 hover:bg-gray-700">
                    <Pause className="w-4 h-4" />
                    Save as Draft
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right section - Settings and view */}
        <div className="flex items-center gap-1">
          <button
            onClick={onSettings}
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* View controls */}
          <div className="flex items-center gap-1 ml-2 pl-2 border-l border-gray-700">
            <button
              className="p-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              className="p-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              className="p-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
              title="Fit View"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* View mode toggle */}
          <button
            className={cn(
              'ml-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              'bg-gray-800 text-gray-300 hover:bg-gray-700'
            )}
            title="Preview Mode"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Click outside handler for menus */}
      {(showDeployMenu || showFileMenu) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowDeployMenu(false);
            setShowFileMenu(false);
          }}
        />
      )}
    </div>
  );
};

export default Toolbar;