import { Router, Request, Response } from 'express';
import { versionService } from '../services/version.service';
import { contentService } from '../services/content.service';
import { auditService } from '../services/audit.service';
import { ApiResponse, ContentVersion, VersionDiff } from '../types';

const router = Router();

const getTenantId = (req: Request): string => {
  const tenantId = req.headers['x-tenant-id'] as string;
  if (!tenantId) {
    throw new Error('Tenant ID is required');
  }
  return tenantId;
};

const getUserId = (req: Request): string => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    throw new Error('User ID is required');
  }
  return userId;
};

// Create a new version
router.post('/:contentId/versions', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);
    const contentItemId = req.params.contentId;

    // Verify content exists
    const content = await contentService.findById(tenantId, contentItemId);
    if (!content) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Content not found',
      };
      return res.status(404).json(response);
    }

    const version = await versionService.createVersion(tenantId, contentItemId, userId, req.body);

    // Update content with new version
    await contentService.updateContent(tenantId, contentItemId, version.content, version.title);

    // Log audit
    auditService.log(contentItemId, tenantId, userId, 'version_created', {
      versionId: version.id,
      details: { versionNumber: version.versionNumber, changeType: version.changeType },
    });

    const response: ApiResponse<ContentVersion> = {
      success: true,
      data: version,
      message: 'Version created successfully',
    };
    res.status(201).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create version',
    };
    res.status(400).json(response);
  }
});

// Get all versions for content
router.get('/:contentId/versions', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const versions = await versionService.findByContentItem(tenantId, req.params.contentId);
    const response: ApiResponse<ContentVersion[]> = {
      success: true,
      data: versions,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch versions',
    };
    res.status(500).json(response);
  }
});

// Get version count
router.get('/:contentId/versions/count', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const count = await versionService.getVersionCount(tenantId, req.params.contentId);
    const response: ApiResponse<{ count: number }> = {
      success: true,
      data: { count },
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get version count',
    };
    res.status(500).json(response);
  }
});

// Get latest version
router.get('/:contentId/versions/latest', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const version = await versionService.getLatestVersion(tenantId, req.params.contentId);

    if (!version) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'No versions found',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<ContentVersion> = {
      success: true,
      data: version,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch latest version',
    };
    res.status(500).json(response);
  }
});

// Get specific version
router.get('/:contentId/versions/:versionNumber', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const versionNumber = parseInt(req.params.versionNumber, 10);
    const version = await versionService.findByVersionNumber(tenantId, req.params.contentId, versionNumber);

    if (!version) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Version not found',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<ContentVersion> = {
      success: true,
      data: version,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch version',
    };
    res.status(500).json(response);
  }
});

// Compare two versions
router.get('/:contentId/versions/compare', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);
    const { from, to } = req.query;

    if (!from || !to) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'from and to query parameters are required',
      };
      return res.status(400).json(response);
    }

    const diff = await versionService.compareVersions(
      tenantId,
      req.params.contentId,
      parseInt(from as string, 10),
      parseInt(to as string, 10)
    );

    if (!diff) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'One or both versions not found',
      };
      return res.status(404).json(response);
    }

    // Log audit
    auditService.log(req.params.contentId, tenantId, userId, 'version_compared', {
      details: { fromVersion: diff.fromVersion, toVersion: diff.toVersion },
    });

    const response: ApiResponse<VersionDiff> = {
      success: true,
      data: diff,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to compare versions',
    };
    res.status(500).json(response);
  }
});

// Restore a version
router.post('/:contentId/versions/:versionNumber/restore', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);
    const contentItemId = req.params.contentId;
    const versionNumber = parseInt(req.params.versionNumber, 10);

    const version = await versionService.restoreVersion(tenantId, contentItemId, versionNumber, userId);

    if (!version) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Version not found',
      };
      return res.status(404).json(response);
    }

    // Update content with restored version
    await contentService.updateContent(tenantId, contentItemId, version.content, version.title);

    // Log audit
    auditService.log(contentItemId, tenantId, userId, 'version_restored', {
      versionId: version.id,
      details: { restoredFrom: versionNumber },
    });

    const response: ApiResponse<ContentVersion> = {
      success: true,
      data: version,
      message: 'Version restored successfully',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to restore version',
    };
    res.status(400).json(response);
  }
});

// Delete old versions
router.delete('/:contentId/versions/before/:versionNumber', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const versionNumber = parseInt(req.params.versionNumber, 10);
    const deletedCount = await versionService.deleteVersionsBefore(
      tenantId,
      req.params.contentId,
      versionNumber
    );

    const response: ApiResponse<{ deletedCount: number }> = {
      success: true,
      data: { deletedCount },
      message: `${deletedCount} versions deleted`,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete versions',
    };
    res.status(500).json(response);
  }
});

export default router;
