import { Router, Request, Response } from 'express';
import { policyService } from '../services/policy.service';
import { logger } from '../config/logger';
import {
  ValidationRequest,
  OverrideRequest,
  Policy,
  ApiResponse,
  ValidationResult,
  OverrideResult,
  ComplianceReport,
  PolicyStatus,
  PolicyType,
  OverrideLevel
} from '../types/policy.types';

const router = Router();

/**
 * @route POST /api/policies/validate
 * @desc Validate an action against policies
 * @access Public
 */
router.post('/validate', async (req: Request, res: Response) => {
  try {
    const validationRequest: ValidationRequest = req.body;

    if (!validationRequest.resource || !validationRequest.action || !validationRequest.subject) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Missing required fields: resource, action, and subject are required',
        timestamp: new Date()
      };
      return res.status(400).json(response);
    }

    const result: ValidationResult = await policyService.validatePolicy(validationRequest);

    const response: ApiResponse<ValidationResult> = {
      success: true,
      data: result,
      message: result.allowed ? 'Action allowed' : 'Action denied',
      timestamp: new Date()
    };

    return res.status(200).json(response);
  } catch (error) {
    logger.error('Error validating policy', { error });
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date()
    };
    return res.status(500).json(response);
  }
});

/**
 * @route POST /api/policies/override
 * @desc Create an override for a policy
 * @access Admin
 */
router.post('/override', async (req: Request, res: Response) => {
  try {
    const overrideRequest: OverrideRequest = req.body;

    if (!overrideRequest.policyId || !overrideRequest.level || !overrideRequest.reason || !overrideRequest.userId) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Missing required fields: policyId, level, reason, and userId are required',
        timestamp: new Date()
      };
      return res.status(400).json(response);
    }

    if (!Object.values(OverrideLevel).includes(overrideRequest.level)) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Invalid override level',
        timestamp: new Date()
      };
      return res.status(400).json(response);
    }

    const result: OverrideResult = await policyService.override(overrideRequest);

    const response: ApiResponse<OverrideResult> = {
      success: true,
      data: result,
      message: 'Override created successfully',
      timestamp: new Date()
    };

    return res.status(201).json(response);
  } catch (error) {
    logger.error('Error creating override', { error });
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date()
    };
    return res.status(500).json(response);
  }
});

/**
 * @route DELETE /api/policies/override/:policyId
 * @desc Remove an override from a policy
 * @access Admin
 */
router.delete('/override/:policyId', async (req: Request, res: Response) => {
  try {
    const { policyId } = req.params;

    const removed = await policyService.removeOverride(policyId);

    const response: ApiResponse<{ removed: boolean }> = {
      success: true,
      data: { removed },
      message: removed ? 'Override removed successfully' : 'No override found for this policy',
      timestamp: new Date()
    };

    return res.status(200).json(response);
  } catch (error) {
    logger.error('Error removing override', { error });
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date()
    };
    return res.status(500).json(response);
  }
});

/**
 * @route GET /api/policies/compliance
 * @desc Get compliance report for policies
 * @access Public
 */
router.get('/compliance', async (req: Request, res: Response) => {
  try {
    const policyIds = req.query.policyIds
      ? (req.query.policyIds as string).split(',')
      : undefined;

    const result: ComplianceReport = await policyService.compliance(policyIds);

    const response: ApiResponse<ComplianceReport> = {
      success: true,
      data: result,
      message: 'Compliance report generated',
      timestamp: new Date()
    };

    return res.status(200).json(response);
  } catch (error) {
    logger.error('Error generating compliance report', { error });
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date()
    };
    return res.status(500).json(response);
  }
});

/**
 * @route GET /api/policies/compliance/:policyId
 * @desc Get compliance status for a specific policy
 * @access Public
 */
router.get('/compliance/:policyId', async (req: Request, res: Response) => {
  try {
    const { policyId } = req.params;

    const result: ComplianceReport = await policyService.compliance([policyId]);

    if (result.checks.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Policy not found',
        timestamp: new Date()
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<typeof result.checks[0]> = {
      success: true,
      data: result.checks[0],
      message: 'Policy compliance status retrieved',
      timestamp: new Date()
    };

    return res.status(200).json(response);
  } catch (error) {
    logger.error('Error getting policy compliance', { error });
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date()
    };
    return res.status(500).json(response);
  }
});

/**
 * @route GET /api/policies
 * @desc Get all policies
 * @access Public
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const policies = await policyService.getAllPolicies();

    const response: ApiResponse<Policy[]> = {
      success: true,
      data: policies,
      message: `${policies.length} policies retrieved`,
      timestamp: new Date()
    };

    return res.status(200).json(response);
  } catch (error) {
    logger.error('Error getting policies', { error });
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date()
    };
    return res.status(500).json(response);
  }
});

/**
 * @route GET /api/policies/:id
 * @desc Get a specific policy by ID
 * @access Public
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const policy = await policyService.getPolicy(id);

    if (!policy) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Policy not found',
        timestamp: new Date()
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<Policy> = {
      success: true,
      data: policy,
      timestamp: new Date()
    };

    return res.status(200).json(response);
  } catch (error) {
    logger.error('Error getting policy', { error });
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date()
    };
    return res.status(500).json(response);
  }
});

/**
 * @route POST /api/policies
 * @desc Create a new policy
 * @access Admin
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const policyData = req.body;

    if (!policyData.name || !policyData.type || !policyData.effect) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Missing required fields: name, type, and effect are required',
        timestamp: new Date()
      };
      return res.status(400).json(response);
    }

    if (!Object.values(PolicyType).includes(policyData.type)) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Invalid policy type',
        timestamp: new Date()
      };
      return res.status(400).json(response);
    }

    const policy = await policyService.createPolicy({
      name: policyData.name,
      description: policyData.description || '',
      type: policyData.type,
      status: policyData.status || PolicyStatus.ACTIVE,
      effect: policyData.effect,
      resource: policyData.resource,
      action: policyData.action,
      subject: policyData.subject,
      overrides: policyData.overrides || OverrideLevel.NONE,
      metadata: policyData.metadata,
      createdBy: policyData.createdBy
    });

    const response: ApiResponse<Policy> = {
      success: true,
      data: policy,
      message: 'Policy created successfully',
      timestamp: new Date()
    };

    return res.status(201).json(response);
  } catch (error) {
    logger.error('Error creating policy', { error });
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date()
    };
    return res.status(500).json(response);
  }
});

/**
 * @route PUT /api/policies/:id
 * @desc Update an existing policy
 * @access Admin
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.status && !Object.values(PolicyStatus).includes(updates.status)) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Invalid policy status',
        timestamp: new Date()
      };
      return res.status(400).json(response);
    }

    const policy = await policyService.updatePolicy(id, updates);

    if (!policy) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Policy not found',
        timestamp: new Date()
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<Policy> = {
      success: true,
      data: policy,
      message: 'Policy updated successfully',
      timestamp: new Date()
    };

    return res.status(200).json(response);
  } catch (error) {
    logger.error('Error updating policy', { error });
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date()
    };
    return res.status(500).json(response);
  }
});

/**
 * @route DELETE /api/policies/:id
 * @desc Delete a policy
 * @access Admin
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await policyService.deletePolicy(id);

    if (!deleted) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Policy not found',
        timestamp: new Date()
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<{ deleted: boolean }> = {
      success: true,
      data: { deleted: true },
      message: 'Policy deleted successfully',
      timestamp: new Date()
    };

    return res.status(200).json(response);
  } catch (error) {
    logger.error('Error deleting policy', { error });
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date()
    };
    return res.status(500).json(response);
  }
});

/**
 * @route GET /api/policies/types
 * @desc Get available policy types
 * @access Public
 */
router.get('/meta/types', (_req: Request, res: Response) => {
  const response: ApiResponse<{ types: typeof PolicyType; levels: typeof OverrideLevel; statuses: typeof PolicyStatus }> = {
    success: true,
    data: {
      types: PolicyType,
      levels: OverrideLevel,
      statuses: PolicyStatus
    },
    timestamp: new Date()
  };
  return res.status(200).json(response);
});

export default router;
