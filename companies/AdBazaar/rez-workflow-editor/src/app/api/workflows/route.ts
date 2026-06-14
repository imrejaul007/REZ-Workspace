import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { Workflow, ApiResponse, WorkflowListResponse } from '@/types/workflow';

// In-memory storage for demo purposes
// In production, this would connect to REZ-journey-service
const workflows: Map<string, Workflow> = new Map();

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');
  const status = searchParams.get('status');
  const category = searchParams.get('category');

  let workflowList = Array.from(workflows.values());

  // Filter by status if provided
  if (status) {
    workflowList = workflowList.filter((w) => w.metadata?.status === status);
  }

  // Filter by category if provided
  if (category) {
    workflowList = workflowList.filter((w) => w.metadata?.category === category);
  }

  // Sort by updatedAt descending
  workflowList.sort((a, b) => {
    const dateA = new Date(a.metadata?.updatedAt || 0);
    const dateB = new Date(b.metadata?.updatedAt || 0);
    return dateB.getTime() - dateA.getTime();
  });

  // Paginate
  const total = workflowList.length;
  const startIndex = (page - 1) * pageSize;
  const paginatedWorkflows = workflowList.slice(startIndex, startIndex + pageSize);

  const response: WorkflowListResponse = {
    workflows: paginatedWorkflows,
    total,
    page,
    pageSize,
  };

  return NextResponse.json(response);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.metadata?.name) {
      return NextResponse.json(
        {
          success: false,
          error: 'Workflow name is required',
        } as ApiResponse<null>,
        { status: 400 }
      );
    }

    // Create new workflow
    const workflow: Workflow = {
      id: body.id || uuidv4(),
      metadata: {
        name: body.metadata.name,
        description: body.metadata.description,
        status: body.metadata.status || 'draft',
        version: 1,
        tags: body.metadata.tags || [],
        category: body.metadata.category,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: body.metadata.createdBy || 'system',
      },
      nodes: body.nodes || [],
      edges: body.edges || [],
      settings: body.settings || {
        timeout: 300,
        retryCount: 3,
        retryDelay: 1000,
        errorHandling: 'retry',
      },
    };

    // Store workflow
    workflows.set(workflow.id, workflow);

    return NextResponse.json(
      {
        success: true,
        data: workflow,
        message: 'Workflow created successfully',
      } as ApiResponse<Workflow>,
      { status: 201 }
    );
  } catch (error) {
    logger.error('Error creating workflow:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create workflow',
      } as ApiResponse<null>,
      { status: 500 }
    );
  }
}