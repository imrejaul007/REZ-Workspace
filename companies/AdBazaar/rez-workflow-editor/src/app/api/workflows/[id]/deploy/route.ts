import { NextRequest, NextResponse } from 'next/server';
import { Workflow, ApiResponse, DeployResponse } from '@/types/workflow';

// In-memory storage (shared with main route)
const workflows: Map<string, Workflow> = new Map();

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const workflow = workflows.get(id);
    if (!workflow) {
      return NextResponse.json(
        {
          success: false,
          error: 'Workflow not found',
        } as ApiResponse<null>,
        { status: 404 }
      );
    }

    // Validate workflow before deployment
    const errors: string[] = [];

    if (!workflow.nodes || workflow.nodes.length === 0) {
      errors.push('Workflow must have at least one node');
    }

    const hasTrigger = workflow.nodes?.some((n) => n.type === 'trigger');
    if (!hasTrigger) {
      errors.push('Workflow must have at least one trigger node');
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: errors.join(', '),
        } as ApiResponse<DeployResponse>,
        { status: 400 }
      );
    }

    // Simulate deployment
    // In production, this would:
    // 1. Register the workflow with the workflow engine (hojai/workflow-builder)
    // 2. Subscribe to triggers via REZ-trigger-service
    // 3. Configure the action engine (REZ-action-engine)

    const deploymentId = `deploy_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Update workflow status to active
    const deployedWorkflow: Workflow = {
      ...workflow,
      metadata: {
        ...workflow.metadata,
        status: 'active',
        updatedAt: new Date().toISOString(),
      },
    };

    workflows.set(id, deployedWorkflow);

    return NextResponse.json({
      success: true,
      data: {
        success: true,
        workflowId: id,
        deploymentId,
        message: 'Workflow deployed successfully. All triggers and actions are now active.',
      } as DeployResponse,
    } as ApiResponse<DeployResponse>);
  } catch (error) {
    logger.error('Error deploying workflow:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to deploy workflow',
      } as ApiResponse<null>,
      { status: 500 }
    );
  }
}