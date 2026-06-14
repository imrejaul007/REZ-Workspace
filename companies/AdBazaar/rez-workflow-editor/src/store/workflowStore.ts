import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  Workflow,
  WorkflowNode,
  WorkflowEdge,
  WorkflowMetadata,
  WorkflowNodeType,
  NodeData,
  WorkflowTemplate,
  WorkflowVersion,
  DEFAULT_NODE_DATA,
} from '@/types/workflow';

interface WorkflowState {
  // Current workflow
  currentWorkflow: Workflow | null;
  workflows: Workflow[];
  versions: WorkflowVersion[];

  // UI State
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  isDragging: boolean;
  isConnecting: boolean;
  zoom: number;
  pan: { x: number; y: number };

  // Mode
  isReadOnly: boolean;
  isDirty: boolean;

  // Actions - Workflow
  createNewWorkflow: (name: string, description?: string) => void;
  loadWorkflow: (workflow: Workflow) => void;
  saveWorkflow: () => Workflow | null;
  updateWorkflowMetadata: (metadata: Partial<WorkflowMetadata>) => void;
  deleteWorkflow: (id: string) => void;

  // Actions - Nodes
  addNode: (type: WorkflowNodeType, position: { x: number; y: number }) => string;
  removeNode: (id: string) => void;
  updateNode: (id: string, data: Partial<NodeData>) => void;
  updateNodePosition: (id: string, position: { x: number; y: number }) => void;
  duplicateNode: (id: string) => string | null;

  // Actions - Edges
  addEdge: (source: string, target: string, sourceHandle?: string, targetHandle?: string) => void;
  removeEdge: (id: string) => void;
  updateEdge: (id: string, updates: Partial<WorkflowEdge>) => void;

  // Actions - Selection
  selectNode: (id: string | null) => void;
  selectEdge: (id: string | null) => void;
  clearSelection: () => void;

  // Actions - UI
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  setIsDragging: (isDragging: boolean) => void;
  setIsConnecting: (isConnecting: boolean) => void;

  // Actions - Templates
  loadTemplate: (template: WorkflowTemplate) => void;

  // Actions - Versions
  saveVersion: (changelog?: string) => void;
  loadVersion: (versionId: string) => void;
  getVersions: () => WorkflowVersion[];

  // Actions - Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Actions - Deploy
  deployWorkflow: () => Promise<{ success: boolean; message: string }>;

  // Reset
  reset: () => void;
}

// History for undo/redo
interface HistoryState {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

const MAX_HISTORY_SIZE = 50;

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  // Initial state
  currentWorkflow: null,
  workflows: [],
  versions: [],
  selectedNodeId: null,
  selectedEdgeId: null,
  isDragging: false,
  isConnecting: false,
  zoom: 1,
  pan: { x: 0, y: 0 },
  isReadOnly: false,
  isDirty: false,

  // History for undo/redo
  _history: [] as HistoryState[],
  _historyIndex: -1,

  // Workflow Actions
  createNewWorkflow: (name: string, description?: string) => {
    const workflow: Workflow = {
      id: uuidv4(),
      metadata: {
        name,
        description,
        status: 'draft',
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      nodes: [],
      edges: [],
      settings: {
        timeout: 300,
        retryCount: 3,
        retryDelay: 1000,
        errorHandling: 'retry',
      },
    };
    set({
      currentWorkflow: workflow,
      selectedNodeId: null,
      selectedEdgeId: null,
      isDirty: false,
      _history: [],
      _historyIndex: -1,
    });
  },

  loadWorkflow: (workflow: Workflow) => {
    set({
      currentWorkflow: workflow,
      selectedNodeId: null,
      selectedEdgeId: null,
      isDirty: false,
      _history: [],
      _historyIndex: -1,
    });
  },

  saveWorkflow: () => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return null;

    const updatedWorkflow: Workflow = {
      ...currentWorkflow,
      metadata: {
        ...currentWorkflow.metadata,
        updatedAt: new Date().toISOString(),
        version: (currentWorkflow.metadata.version || 1) + 1,
      },
    };

    set({
      currentWorkflow: updatedWorkflow,
      workflows: get().workflows.map((w) =>
        w.id === updatedWorkflow.id ? updatedWorkflow : w
      ),
      isDirty: false,
    });

    return updatedWorkflow;
  },

  updateWorkflowMetadata: (metadata: Partial<WorkflowMetadata>) => {
    const { currentWorkflow, _saveHistory } = get();
    if (!currentWorkflow) return;

    _saveHistory();
    set({
      currentWorkflow: {
        ...currentWorkflow,
        metadata: { ...currentWorkflow.metadata, ...metadata },
      },
      isDirty: true,
    });
  },

  deleteWorkflow: (id: string) => {
    set({
      workflows: get().workflows.filter((w) => w.id !== id),
      currentWorkflow:
        get().currentWorkflow?.id === id ? null : get().currentWorkflow,
    });
  },

  // Node Actions
  addNode: (type: WorkflowNodeType, position: { x: number; y: number }) => {
    const { currentWorkflow, _saveHistory } = get();
    if (!currentWorkflow) return '';

    _saveHistory();

    const nodeId = uuidv4();
    const defaultData = DEFAULT_NODE_DATA[type];

    const newNode: WorkflowNode = {
      id: nodeId,
      type,
      position,
      data: {
        label: defaultData.label || type,
        type,
        config: {},
        ...defaultData,
      } as NodeData,
      handles: getNodeHandles(type),
    };

    set({
      currentWorkflow: {
        ...currentWorkflow,
        nodes: [...currentWorkflow.nodes, newNode],
      },
      selectedNodeId: nodeId,
      isDirty: true,
    });

    return nodeId;
  },

  removeNode: (id: string) => {
    const { currentWorkflow, _saveHistory, selectedNodeId } = get();
    if (!currentWorkflow) return;

    _saveHistory();

    const updatedNodes = currentWorkflow.nodes.filter((n) => n.id !== id);
    const updatedEdges = currentWorkflow.edges.filter(
      (e) => e.source !== id && e.target !== id
    );

    set({
      currentWorkflow: {
        ...currentWorkflow,
        nodes: updatedNodes,
        edges: updatedEdges,
      },
      selectedNodeId: selectedNodeId === id ? null : selectedNodeId,
      isDirty: true,
    });
  },

  updateNode: (id: string, data: Partial<NodeData>) => {
    const { currentWorkflow, _saveHistory } = get();
    if (!currentWorkflow) return;

    _saveHistory();

    set({
      currentWorkflow: {
        ...currentWorkflow,
        nodes: currentWorkflow.nodes.map((node) =>
          node.id === id
            ? { ...node, data: { ...node.data, ...data } }
            : node
        ),
      },
      isDirty: true,
    });
  },

  updateNodePosition: (id: string, position: { x: number; y: number }) => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return;

    set({
      currentWorkflow: {
        ...currentWorkflow,
        nodes: currentWorkflow.nodes.map((node) =>
          node.id === id ? { ...node, position } : node
        ),
      },
    });
  },

  duplicateNode: (id: string) => {
    const { currentWorkflow, addNode } = get();
    if (!currentWorkflow) return null;

    const node = currentWorkflow.nodes.find((n) => n.id === id);
    if (!node) return null;

    return addNode(node.type, {
      x: node.position.x + 50,
      y: node.position.y + 50,
    });
  },

  // Edge Actions
  addEdge: (source: string, target: string, sourceHandle?: string, targetHandle?: string) => {
    const { currentWorkflow, _saveHistory } = get();
    if (!currentWorkflow) return;

    // Prevent duplicate edges
    const exists = currentWorkflow.edges.some(
      (e) =>
        e.source === source &&
        e.target === target &&
        e.sourceHandle === sourceHandle &&
        e.targetHandle === targetHandle
    );
    if (exists) return;

    _saveHistory();

    const edge: WorkflowEdge = {
      id: uuidv4(),
      source,
      target,
      sourceHandle,
      targetHandle,
      type: 'smoothstep',
    };

    set({
      currentWorkflow: {
        ...currentWorkflow,
        edges: [...currentWorkflow.edges, edge],
      },
      isDirty: true,
    });
  },

  removeEdge: (id: string) => {
    const { currentWorkflow, _saveHistory, selectedEdgeId } = get();
    if (!currentWorkflow) return;

    _saveHistory();

    set({
      currentWorkflow: {
        ...currentWorkflow,
        edges: currentWorkflow.edges.filter((e) => e.id !== id),
      },
      selectedEdgeId: selectedEdgeId === id ? null : selectedEdgeId,
      isDirty: true,
    });
  },

  updateEdge: (id: string, updates: Partial<WorkflowEdge>) => {
    const { currentWorkflow, _saveHistory } = get();
    if (!currentWorkflow) return;

    _saveHistory();

    set({
      currentWorkflow: {
        ...currentWorkflow,
        edges: currentWorkflow.edges.map((edge) =>
          edge.id === id ? { ...edge, ...updates } : edge
        ),
      },
      isDirty: true,
    });
  },

  // Selection Actions
  selectNode: (id: string | null) => {
    set({ selectedNodeId: id, selectedEdgeId: null });
  },

  selectEdge: (id: string | null) => {
    set({ selectedEdgeId: id, selectedNodeId: null });
  },

  clearSelection: () => {
    set({ selectedNodeId: null, selectedEdgeId: null });
  },

  // UI Actions
  setZoom: (zoom: number) => {
    set({ zoom: Math.max(0.25, Math.min(2, zoom)) });
  },

  setPan: (pan: { x: number; y: number }) => {
    set({ pan });
  },

  setIsDragging: (isDragging: boolean) => {
    set({ isDragging });
  },

  setIsConnecting: (isConnecting: boolean) => {
    set({ isConnecting });
  },

  // Template Actions
  loadTemplate: (template: WorkflowTemplate) => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return;

    const workflow: Workflow = {
      ...currentWorkflow,
      nodes: template.workflow.nodes.map((node) => ({
        ...node,
        id: uuidv4(),
      })),
      edges: template.workflow.edges.map((edge) => ({
        ...edge,
        id: uuidv4(),
      })),
    };

    set({
      currentWorkflow: workflow,
      selectedNodeId: null,
      selectedEdgeId: null,
      isDirty: true,
    });
  },

  // Version Actions
  saveVersion: (changelog?: string) => {
    const { currentWorkflow, versions } = get();
    if (!currentWorkflow) return;

    const newVersion: WorkflowVersion = {
      id: uuidv4(),
      workflowId: currentWorkflow.id,
      version: versions.length + 1,
      createdAt: new Date().toISOString(),
      createdBy: 'current-user', // Would come from auth
      snapshot: JSON.parse(JSON.stringify(currentWorkflow)),
      changelog,
    };

    set({ versions: [...versions, newVersion] });
  },

  loadVersion: (versionId: string) => {
    const { versions, _saveHistory } = get();
    const version = versions.find((v) => v.id === versionId);
    if (!version) return;

    _saveHistory();

    set({
      currentWorkflow: JSON.parse(JSON.stringify(version.snapshot)),
      isDirty: true,
    });
  },

  getVersions: () => {
    return get().versions;
  },

  // Undo/Redo
  undo: () => {
    const { _history, _historyIndex, currentWorkflow } = get();
    if (_historyIndex <= 0 || !currentWorkflow) return;

    const prevState = _history[_historyIndex - 1];
    set({
      currentWorkflow: {
        ...currentWorkflow,
        nodes: prevState.nodes,
        edges: prevState.edges,
      },
      _historyIndex: _historyIndex - 1,
      isDirty: true,
    });
  },

  redo: () => {
    const { _history, _historyIndex, currentWorkflow } = get();
    if (_historyIndex >= _history.length - 1 || !currentWorkflow) return;

    const nextState = _history[_historyIndex + 1];
    set({
      currentWorkflow: {
        ...currentWorkflow,
        nodes: nextState.nodes,
        edges: nextState.edges,
      },
      _historyIndex: _historyIndex + 1,
      isDirty: true,
    });
  },

  canUndo: () => {
    const { _historyIndex } = get();
    return _historyIndex > 0;
  },

  canRedo: () => {
    const { _history, _historyIndex } = get();
    return _historyIndex < _history.length - 1;
  },

  // Deploy
  deployWorkflow: async () => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) {
      return { success: false, message: 'No workflow to deploy' };
    }

    try {
      const response = await fetch('/api/workflows/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentWorkflow),
      });

      if (!response.ok) {
        throw new Error('Deploy failed');
      }

      const result = await response.json();

      set({
        currentWorkflow: {
          ...currentWorkflow,
          metadata: { ...currentWorkflow.metadata, status: 'active' },
        },
      });

      return { success: true, message: 'Workflow deployed successfully' };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Deploy failed',
      };
    }
  },

  // Reset
  reset: () => {
    set({
      currentWorkflow: null,
      selectedNodeId: null,
      selectedEdgeId: null,
      isDragging: false,
      isConnecting: false,
      zoom: 1,
      pan: { x: 0, y: 0 },
      isDirty: false,
      _history: [],
      _historyIndex: -1,
    });
  },

  // Internal: Save history for undo/redo
  _saveHistory: () => {
    const { currentWorkflow, _history, _historyIndex } = get();
    if (!currentWorkflow) return;

    const newHistory = _history.slice(0, _historyIndex + 1);
    newHistory.push({
      nodes: JSON.parse(JSON.stringify(currentWorkflow.nodes)),
      edges: JSON.parse(JSON.stringify(currentWorkflow.edges)),
    });

    // Limit history size
    if (newHistory.length > MAX_HISTORY_SIZE) {
      newHistory.shift();
    }

    set({
      _history: newHistory,
      _historyIndex: newHistory.length - 1,
    });
  },
}));

// Helper function to determine node handles based on type
function getNodeHandles(type: WorkflowNodeType) {
  const handles: WorkflowNode['handles'] = {};

  switch (type) {
    case 'trigger':
      // Trigger: only output (bottom)
      handles.bottom = true;
      break;
    case 'action':
    case 'ai_agent':
    case 'delay':
    case 'webhook':
    case 'filter':
    case 'transform':
      // Single input/output: input at top, output at bottom
      handles.top = true;
      handles.bottom = true;
      break;
    case 'condition':
      // Condition: input at top, outputs at bottom (yes/no)
      handles.top = true;
      handles.bottom = true; // This will be the "true" branch
      handles.left = true;   // "false" branch
      break;
  }

  return handles;
}

// Selector hooks for optimized re-renders
export const useCurrentWorkflow = () => useWorkflowStore((state) => state.currentWorkflow);
export const useSelectedNode = () => {
  const workflow = useWorkflowStore((state) => state.currentWorkflow);
  const selectedId = useWorkflowStore((state) => state.selectedNodeId);
  return workflow?.nodes.find((n) => n.id === selectedId) || null;
};
export const useSelectedEdge = () => {
  const workflow = useWorkflowStore((state) => state.currentWorkflow);
  const selectedId = useWorkflowStore((state) => state.selectedEdgeId);
  return workflow?.edges.find((e) => e.id === selectedId) || null;
};
export const useWorkflows = () => useWorkflowStore((state) => state.workflows);
export const useIsDirty = () => useWorkflowStore((state) => state.isDirty);