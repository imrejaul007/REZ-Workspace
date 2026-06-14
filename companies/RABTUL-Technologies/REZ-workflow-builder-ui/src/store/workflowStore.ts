import { create } from 'zustand';
import { Workflow, WorkflowNode, WorkflowEdge, WorkflowTemplate, WorkflowExecution } from '../types';
import { v4 as uuid } from 'uuid';

interface WorkflowStore {
  workflows: Workflow[];
  currentWorkflow: Workflow | null;
  templates: WorkflowTemplate[];
  executions: WorkflowExecution[];
  selectedNode: WorkflowNode | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setWorkflows: (workflows: Workflow[]) => void;
  setCurrentWorkflow: (workflow: Workflow | null) => void;
  addNode: (node: WorkflowNode) => void;
  updateNode: (nodeId: string, updates: Partial<WorkflowNode>) => void;
  removeNode: (nodeId: string) => void;
  addEdge: (edge: WorkflowEdge) => void;
  removeEdge: (edgeId: string) => void;
  setSelectedNode: (node: WorkflowNode | null) => void;
  setTemplates: (templates: WorkflowTemplate[]) => void;
  createWorkflowFromTemplate: (template: WorkflowTemplate) => void;
  saveWorkflow: () => Promise<void>;
  executeWorkflow: (workflowId: string) => Promise<void>;
  loadWorkflows: () => Promise<void>;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4045';

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  workflows: [],
  currentWorkflow: null,
  templates: [],
  executions: [],
  selectedNode: null,
  isLoading: false,
  error: null,

  setWorkflows: (workflows) => set({ workflows }),

  setCurrentWorkflow: (workflow) => set({ currentWorkflow: workflow }),

  addNode: (node) => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return;
    set({
      currentWorkflow: {
        ...currentWorkflow,
        nodes: [...currentWorkflow.nodes, node],
      },
    });
  },

  updateNode: (nodeId, updates) => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return;
    set({
      currentWorkflow: {
        ...currentWorkflow,
        nodes: currentWorkflow.nodes.map((n) =>
          n.id === nodeId ? { ...n, ...updates } : n
        ),
      },
    });
  },

  removeNode: (nodeId) => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return;
    set({
      currentWorkflow: {
        ...currentWorkflow,
        nodes: currentWorkflow.nodes.filter((n) => n.id !== nodeId),
        edges: currentWorkflow.edges.filter(
          (e) => e.source !== nodeId && e.target !== nodeId
        ),
      },
    });
  },

  addEdge: (edge) => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return;
    set({
      currentWorkflow: {
        ...currentWorkflow,
        edges: [...currentWorkflow.edges, edge],
      },
    });
  },

  removeEdge: (edgeId) => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return;
    set({
      currentWorkflow: {
        ...currentWorkflow,
        edges: currentWorkflow.edges.filter((e) => e.id !== edgeId),
      },
    });
  },

  setSelectedNode: (node) => set({ selectedNode: node }),

  setTemplates: (templates) => set({ templates }),

  createWorkflowFromTemplate: (template) => {
    const newWorkflow: Workflow = {
      id: uuid(),
      name: `${template.name} (Copy)`,
      description: template.description,
      nodes: template.nodes.map(n => ({ ...n, id: uuid() })),
      edges: template.edges.map(e => ({ ...e, id: uuid() })),
      trigger: template.trigger,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set({ currentWorkflow: newWorkflow });
  },

  saveWorkflow: async () => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return;

    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/api/workflows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentWorkflow),
      });
      if (!response.ok) throw new Error('Failed to save workflow');
      const saved = await response.json();
      set({ currentWorkflow: saved });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Save failed' });
    } finally {
      set({ isLoading: false });
    }
  },

  executeWorkflow: async (workflowId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/api/workflows/${workflowId}/execute`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Execution failed');
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Execution failed' });
    } finally {
      set({ isLoading: false });
    }
  },

  loadWorkflows: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/api/workflows`);
      if (!response.ok) throw new Error('Failed to load workflows');
      const workflows = await response.json();
      set({ workflows });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Load failed' });
    } finally {
      set({ isLoading: false });
    }
  },
}));
