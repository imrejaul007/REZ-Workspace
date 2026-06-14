import { Router, Request, Response } from 'express';
import { projectService } from '../services/project.service';
import { ApiResponse, Project } from '../types';

const router = Router();

const getTenantId = (req: Request): string => {
  const tenantId = req.headers['x-tenant-id'] as string;
  if (!tenantId) {
    throw new Error('Tenant ID is required');
  }
  return tenantId;
};

// Create project
router.post('/', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const project = await projectService.create(tenantId, req.body);
    const response: ApiResponse<Project> = {
      success: true,
      data: project,
      message: 'Project created successfully',
    };
    res.status(201).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create project',
    };
    res.status(400).json(response);
  }
});

// Get all projects
router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const activeOnly = req.query.activeOnly === 'true';
    const projects = await projectService.findAll(tenantId, { activeOnly });
    const response: ApiResponse<Project[]> = {
      success: true,
      data: projects,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch projects',
    };
    res.status(500).json(response);
  }
});

// Get project by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const project = await projectService.findById(tenantId, req.params.id);
    if (!project) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Project not found',
      };
      return res.status(404).json(response);
    }
    const response: ApiResponse<Project> = {
      success: true,
      data: project,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch project',
    };
    res.status(500).json(response);
  }
});

// Update project
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const project = await projectService.update(tenantId, req.params.id, req.body);
    if (!project) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Project not found',
      };
      return res.status(404).json(response);
    }
    const response: ApiResponse<Project> = {
      success: true,
      data: project,
      message: 'Project updated successfully',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update project',
    };
    res.status(400).json(response);
  }
});

// Toggle project active status
router.patch('/:id/toggle', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const { isActive } = req.body;
    const project = await projectService.toggleActive(tenantId, req.params.id, isActive);
    if (!project) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Project not found',
      };
      return res.status(404).json(response);
    }
    const response: ApiResponse<Project> = {
      success: true,
      data: project,
      message: `Project ${isActive ? 'activated' : 'deactivated'}`,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to toggle project',
    };
    res.status(400).json(response);
  }
});

// Delete project
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const deleted = await projectService.delete(tenantId, req.params.id);
    if (!deleted) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Project not found',
      };
      return res.status(404).json(response);
    }
    const response: ApiResponse<null> = {
      success: true,
      message: 'Project deleted successfully',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete project',
    };
    res.status(500).json(response);
  }
});

export default router;
