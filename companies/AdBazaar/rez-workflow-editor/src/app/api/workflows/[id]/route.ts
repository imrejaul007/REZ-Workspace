import { NextRequest, NextResponse } from 'next/server';
import { Workflow, ApiResponse } from '@/types/workflow';

// In-memory storage (shared with main route in production)
const workflows: Map<string, Workflow> = new Map();

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
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

  return NextResponse.json({
    success: true,
    data: workflow,
  } as ApiResponse<Workflow>);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existingWorkflow = workflows.get(id);
    if (!existingWorkflow) {
      return NextResponse.json(
        {
          success: false,
          error: 'Workflow not found',
        } as ApiResponse<null>,
        { status: 404 }
      );
    }

    // Update workflow
    const updatedWorkflow: Workflow = {
      ...existingWorkflow,
      metadata: {
        ...existingWorkflow.metadata,
        ...body.metadata,
        updatedAt: new Date().toISOString(),
        version: (existingWorkflow.metadata?.version || 1) + 1,
      },
      nodes: body.nodes ?? existingWorkflow.nodes,
      edges: body.edges ?? existingWorkflow.edges,
      settings: body.settings ?? existingWorkflow.settings,
    };

    workflows.set(id, updatedWorkflow);

    return NextResponse.json({
      success: true,
      data: updatedWorkflow,
      message: 'Workflow updated successfully',
    } as ApiResponse<Workflow>);
  } catch (error) {
    logger.error('Error updating workflow:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update workflow',
      } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

  workflows.delete(id);

  return NextResponse.json({
    success: true,
    data: { deleted: true },
    message: 'Workflow deleted successfully',
  } as ApiResponse<{ deleted: boolean }>);
}