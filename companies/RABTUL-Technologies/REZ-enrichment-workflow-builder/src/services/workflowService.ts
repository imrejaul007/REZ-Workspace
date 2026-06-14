/**
 * Enrichment Workflow Service
 * Visual workflow builder for data enrichment sequences
 */

import {
  Workflow,
  WorkflowNode,
  WorkflowEdge,
  WorkflowRun,
  WorkflowExecution,
  WorkflowTemplate,
  WorkflowStepType,
} from '../types';

// In-memory storage (use database in production)
const workflows: Map<string, Workflow> = new Map();
const workflowRuns: Map<string, WorkflowRun[]> = new Map();

// Pre-built templates
const TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'template-contact-enrich',
    name: 'Contact Enrichment Pipeline',
    description: 'Find and enrich contact information using multiple providers',
    category: 'Enrichment',
    nodes: [
      { id: 'n1', type: 'input', label: 'Input', position: { x: 0, y: 100 }, config: { fields: ['firstName', 'lastName', 'company'] } },
      { id: 'n2', type: 'find_email', label: 'Find Email', position: { x: 200, y: 100 }, config: { providers: ['apollo', 'hunter'] } },
      { id: 'n3', type: 'enrich_contact', label: 'Enrich Contact', position: { x: 400, y: 100 }, config: { providers: ['clearbit', 'apollo'] } },
      { id: 'n4', type: 'verify_email', label: 'Verify Email', position: { x: 600, y: 100 }, config: {} },
      { id: 'n5', type: 'filter', label: 'Filter Valid', position: { x: 800, y: 100 }, config: { conditions: [{ field: 'verified', operator: 'equals', value: true }] } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
      { id: 'e3', source: 'n3', target: 'n4' },
      { id: 'e4', source: 'n4', target: 'n5' },
    ]
  },
  {
    id: 'template-company-enrich',
    name: 'Company Intelligence Pipeline',
    description: 'Enrich company data with firmographics and technographics',
    category: 'Enrichment',
    nodes: [
      { id: 'n1', type: 'input', label: 'Input', position: { x: 0, y: 100 }, config: { fields: ['domain', 'companyName'] } },
      { id: 'n2', type: 'enrich_company', label: 'Enrich Company', position: { x: 200, y: 100 }, config: { providers: ['clearbit', 'apollo', 'crunchbase'] } },
      { id: 'n3', type: 'enrich_technographics', label: 'Technographics', position: { x: 400, y: 100 }, config: { providers: ['builtwith', 'wappalyzer'] } },
      { id: 'n4', type: 'export', label: 'Export', position: { x: 600, y: 100 }, config: { format: 'json' } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
      { id: 'e3', source: 'n3', target: 'n4' },
    ]
  },
  {
    id: 'template-lead-enrichment',
    name: 'Full Lead Enrichment',
    description: 'Complete lead enrichment with contact, company, and CRM sync',
    category: 'Complete',
    nodes: [
      { id: 'n1', type: 'input', label: 'Lead Input', position: { x: 0, y: 100 }, config: { fields: ['email', 'company'] } },
      { id: 'n2', type: 'enrich_contact', label: 'Enrich Contact', position: { x: 200, y: 100 }, config: {} },
      { id: 'n3', type: 'enrich_company', label: 'Enrich Company', position: { x: 200, y: 200 }, config: {} },
      { id: 'n4', type: 'merge', label: 'Merge Data', position: { x: 400, y: 150 }, config: { strategy: 'combine' } },
      { id: 'n5', type: 'filter', label: 'Quality Check', position: { x: 600, y: 150 }, config: { conditions: [{ field: 'confidence', operator: 'greater_than', value: 70 }] } },
      { id: 'n6', type: 'crm_sync', label: 'CRM Sync', position: { x: 800, y: 150 }, config: { crm: 'hubspot', object: 'contact' } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n1', target: 'n3' },
      { id: 'e3', source: 'n2', target: 'n4' },
      { id: 'e4', source: 'n3', target: 'n4' },
      { id: 'e5', source: 'n4', target: 'n5' },
      { id: 'e6', source: 'n5', target: 'n6' },
    ]
  }
];

export class WorkflowService {
  /**
   * Create a new workflow
   */
  createWorkflow(params: {
    name: string;
    description?: string;
    nodes?: WorkflowNode[];
    edges?: WorkflowEdge[];
    inputFields?: string[];
    outputFields?: string[];
  }): Workflow {
    const workflow: Workflow = {
      id: `wf-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      name: params.name,
      description: params.description,
      nodes: params.nodes || [],
      edges: params.edges || [],
      inputFields: params.inputFields || [],
      outputFields: params.outputFields || [],
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      runCount: 0,
    };

    workflows.set(workflow.id, workflow);
    return workflow;
  }

  /**
   * Get workflow by ID
   */
  getWorkflow(id: string): Workflow | null {
    return workflows.get(id) || null;
  }

  /**
   * List all workflows
   */
  listWorkflows(filters?: { status?: Workflow['status'] }): Workflow[] {
    let result = Array.from(workflows.values());
    if (filters?.status) {
      result = result.filter(w => w.status === filters.status);
    }
    return result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  /**
   * Update workflow
   */
  updateWorkflow(id: string, updates: Partial<Workflow>): Workflow | null {
    const workflow = workflows.get(id);
    if (!workflow) return null;

    const updated = {
      ...workflow,
      ...updates,
      id: workflow.id, // prevent ID change
      createdAt: workflow.createdAt, // prevent creation date change
      updatedAt: new Date().toISOString(),
    };

    workflows.set(id, updated);
    return updated;
  }

  /**
   * Delete workflow
   */
  deleteWorkflow(id: string): boolean {
    return workflows.delete(id);
  }

  /**
   * Run workflow
   */
  async runWorkflow(workflowId: string, input: Record<string, any>): Promise<WorkflowRun> {
    const workflow = workflows.get(workflowId);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    const run: WorkflowRun = {
      id: `run-${Date.now()}`,
      workflowId,
      status: 'running',
      input,
      startedAt: new Date().toISOString(),
      stepsCompleted: 0,
      totalSteps: workflow.nodes.length,
    };

    // Store run
    if (!workflowRuns.has(workflowId)) {
      workflowRuns.set(workflowId, []);
    }
    workflowRuns.get(workflowId)!.push(run);

    // Update workflow stats
    workflow.runCount++;
    workflow.lastRunAt = new Date().toISOString();
    workflows.set(workflowId, workflow);

    // Execute workflow (simulated)
    try {
      const result = await this.executeWorkflow(workflow, input);
      run.status = 'completed';
      run.output = result;
      run.completedAt = new Date().toISOString();
      run.durationMs = new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime();
    } catch (error) {
      run.status = 'failed';
      run.errors = [error instanceof Error ? error.message : 'Unknown error'];
      run.completedAt = new Date().toISOString();
      run.durationMs = new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime();
    }

    // Update run in storage
    const runs = workflowRuns.get(workflowId)!;
    const runIndex = runs.findIndex(r => r.id === run.id);
    if (runIndex >= 0) {
      runs[runIndex] = run;
    }

    return run;
  }

  /**
   * Get workflow runs
   */
  getWorkflowRuns(workflowId: string, limit: number = 10): WorkflowRun[] {
    const runs = workflowRuns.get(workflowId) || [];
    return runs.slice(-limit).reverse();
  }

  /**
   * Get templates
   */
  getTemplates(): WorkflowTemplate[] {
    return TEMPLATES;
  }

  /**
   * Create workflow from template
   */
  createFromTemplate(templateId: string, name: string): Workflow | null {
    const template = TEMPLATES.find(t => t.id === templateId);
    if (!template) return null;

    return this.createWorkflow({
      name,
      description: template.description,
      nodes: template.nodes.map(n => ({ ...n, id: `n-${Date.now()}-${Math.random().toString(36).substring(2, 6)}` })),
      edges: template.edges.map(e => ({ ...e, id: `e-${Date.now()}-${Math.random().toString(36).substring(2, 6)}` })),
      inputFields: ['email', 'company', 'firstName', 'lastName'],
      outputFields: ['enrichedContact', 'enrichedCompany', 'verified'],
    });
  }

  /**
   * Execute workflow steps
   */
  private async executeWorkflow(workflow: Workflow, input: Record<string, any>): Promise<Record<string, any>> {
    const context: Record<string, any> = { ...input };
    const executions: WorkflowExecution[] = [];

    // Build execution order from edges
    const executionOrder = this.getExecutionOrder(workflow.nodes, workflow.edges);

    for (const nodeId of executionOrder) {
      const node = workflow.nodes.find(n => n.id === nodeId);
      if (!node) continue;

      const execution: WorkflowExecution = {
        stepId: node.id,
        stepType: node.type,
        status: 'running',
        input: { ...context },
        startedAt: new Date().toISOString(),
      };

      try {
        const output = await this.executeStep(node, context);
        execution.status = 'completed';
        execution.output = output;
        execution.completedAt = new Date().toISOString();
        execution.durationMs = new Date(execution.completedAt).getTime() - new Date(execution.startedAt).getTime();

        // Merge output into context
        Object.assign(context, output);
      } catch (error) {
        execution.status = 'failed';
        execution.error = error instanceof Error ? error.message : 'Unknown error';
        execution.completedAt = new Date().toISOString();
        execution.durationMs = new Date(execution.completedAt).getTime() - new Date(execution.startedAt).getTime();
        throw error;
      }

      executions.push(execution);
    }

    return context;
  }

  /**
   * Get execution order based on graph topology
   */
  private getExecutionOrder(nodes: WorkflowNode[], edges: WorkflowEdge[]): string[] {
    const order: string[] = [];
    const visited = new Set<string>();
    const inDegree = new Map<string, number>();

    // Initialize in-degrees
    nodes.forEach(n => inDegree.set(n.id, 0));
    edges.forEach(e => {
      inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
    });

    // Start with nodes that have no incoming edges
    const queue = nodes.filter(n => inDegree.get(n.id) === 0).map(n => n.id);

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      if (visited.has(nodeId)) continue;

      visited.add(nodeId);
      order.push(nodeId);

      // Reduce in-degree of neighbors
      edges
        .filter(e => e.source === nodeId)
        .forEach(e => {
          const newDegree = (inDegree.get(e.target) || 1) - 1;
          inDegree.set(e.target, newDegree);
          if (newDegree === 0) {
            queue.push(e.target);
          }
        });
    }

    return order;
  }

  /**
   * Execute a single workflow step
   */
  private async executeStep(node: WorkflowNode, context: Record<string, any>): Promise<Record<string, any>> {
    switch (node.type) {
      case 'input':
        return { ...context };

      case 'enrich_contact':
        // Call enrichment service (mock)
        return {
          enrichedContact: {
            email: context.email || 'found@email.com',
            name: context.firstName + ' ' + context.lastName,
            confidence: 85,
          }
        };

      case 'enrich_company':
        return {
          enrichedCompany: {
            name: context.company || 'Acme Corp',
            domain: context.domain || 'acme.com',
            industry: 'Technology',
            confidence: 90,
          }
        };

      case 'find_email':
        return {
          email: `${(context.firstName || 'john').toLowerCase()}.${(context.lastName || 'doe').toLowerCase()}@${(context.company || 'company').toLowerCase().replace(/\s+/g, '')}.com`,
        };

      case 'verify_email':
        return {
          verified: Math.random() > 0.2,
          verificationScore: Math.floor(Math.random() * 30 + 70),
        };

      case 'enrich_technographics':
        return {
          technologies: ['React', 'Node.js', 'PostgreSQL', 'AWS'],
        };

      case 'filter':
        return context; // Pass through with conditions checked

      case 'transform':
        return context;

      case 'merge':
        return context;

      case 'export':
        return { exported: true, format: node.config.format || 'json' };

      case 'webhook':
        return { webhookCalled: true };

      case 'crm_sync':
        return { crmSynced: true, crm: node.config.crm };

      default:
        return context;
    }
  }
}

export const workflowService = new WorkflowService();
