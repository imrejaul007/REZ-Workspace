import { Router, Request, Response } from 'express';
import { calendarService } from '../services/calendar.service';
import { Conflict } from '../types';
import { apiLogger as logger, conflictLogger } from '../utils/logger';

const router = Router();

/**
 * GET /api/conflicts
 * Get all conflicts with optional filtering
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const includeResolved = req.query.includeResolved === 'true';
    const conflicts = await calendarService.getConflicts(includeResolved);

    // Group conflicts by severity
    const grouped = {
      high: conflicts.filter(c => c.severity === 'high'),
      medium: conflicts.filter(c => c.severity === 'medium'),
      low: conflicts.filter(c => c.severity === 'low'),
      resolved: conflicts.filter(c => c.resolved),
    };

    res.json({
      success: true,
      data: {
        conflicts,
        summary: {
          total: conflicts.length,
          bySeverity: {
            high: grouped.high.length,
            medium: grouped.medium.length,
            low: grouped.low.length,
          },
          resolved: grouped.resolved.length,
          active: conflicts.filter(c => !c.resolved).length,
        },
      },
      timestamp: new Date(),
    });
  } catch (error) {
    conflictLogger.error('Failed to get conflicts', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get conflicts',
      timestamp: new Date(),
    });
  }
});

/**
 * GET /api/conflicts/:id
 * Get a specific conflict by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const conflicts = await calendarService.getConflicts(true);
    const conflict = conflicts.find(c => c.id === id);

    if (!conflict) {
      res.status(404).json({
        success: false,
        error: 'Conflict not found',
        timestamp: new Date(),
      });
      return;
    }

    res.json({
      success: true,
      data: conflict,
      timestamp: new Date(),
    });
  } catch (error) {
    conflictLogger.error('Failed to get conflict', { conflictId: req.params.id, error });
    res.status(500).json({
      success: false,
      error: 'Failed to get conflict',
      timestamp: new Date(),
    });
  }
});

/**
 * POST /api/conflicts/detect
 * Manually trigger conflict detection
 */
router.post('/detect', async (req: Request, res: Response) => {
  try {
    conflictLogger.info('Manual conflict detection triggered');
    const conflicts = await calendarService.detectAllConflicts();

    res.json({
      success: true,
      data: {
        conflicts,
        count: conflicts.length,
      },
      message: `Detected ${conflicts.length} conflicts`,
      timestamp: new Date(),
    });
  } catch (error) {
    conflictLogger.error('Failed to detect conflicts', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to detect conflicts',
      timestamp: new Date(),
    });
  }
});

/**
 * POST /api/conflicts/:id/resolve
 * Resolve a conflict with a chosen strategy
 */
router.post('/:id/resolve', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { action, affectedPosts, newTimeSlot } = req.body;

    if (!action || !['reschedule', 'publish_now', 'merge', 'cancel'].includes(action)) {
      res.status(400).json({
        success: false,
        error: 'Invalid action. Must be one of: reschedule, publish_now, merge, cancel',
        timestamp: new Date(),
      });
      return;
    }

    const conflicts = await calendarService.getConflicts(true);
    const conflict = conflicts.find(c => c.id === id);

    if (!conflict) {
      res.status(404).json({
        success: false,
        error: 'Conflict not found',
        timestamp: new Date(),
      });
      return;
    }

    if (conflict.resolved) {
      res.status(400).json({
        success: false,
        error: 'Conflict already resolved',
        timestamp: new Date(),
      });
      return;
    }

    conflictLogger.info('Resolving conflict', { conflictId: id, action });

    // Execute the resolution action
    const resolution = await executeResolutionAction(conflict, action, affectedPosts, newTimeSlot, calendarService);

    res.json({
      success: true,
      data: resolution,
      message: `Conflict resolved using ${action}`,
      timestamp: new Date(),
    });
  } catch (error) {
    conflictLogger.error('Failed to resolve conflict', { conflictId: req.params.id, error });
    res.status(500).json({
      success: false,
      error: 'Failed to resolve conflict',
      timestamp: new Date(),
    });
  }
});

/**
 * POST /api/conflicts/:id/auto-resolve
 * Auto-resolve a conflict using default strategy
 */
router.post('/:id/auto-resolve', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { strategy } = req.body; // 'earliest', 'latest', 'stagger', 'cancel_duplicates'

    const conflicts = await calendarService.getConflicts(false);
    const conflict = conflicts.find(c => c.id === id);

    if (!conflict) {
      res.status(404).json({
        success: false,
        error: 'Conflict not found or already resolved',
        timestamp: new Date(),
      });
      return;
    }

    conflictLogger.info('Auto-resolving conflict', { conflictId: id, strategy });

    // Apply auto-resolution strategy
    let resolutionAction: 'reschedule' | 'publish_now' | 'merge' | 'cancel';
    let newTimeSlot: { start: Date; end: Date } | undefined;

    switch (strategy || 'stagger') {
      case 'earliest':
        resolutionAction = 'reschedule';
        const earliest = findEarliestPost(conflict.posts);
        const latest = findLatestPost(conflict.posts);
        newTimeSlot = {
          start: new Date(earliest.scheduledTime),
          end: new Date(latest.scheduledTime.getTime() + 30 * 60 * 1000),
        };
        // Keep earliest, reschedule others
        break;

      case 'latest':
        resolutionAction = 'reschedule';
        const latestTime = findLatestPost(conflict.posts).scheduledTime;
        newTimeSlot = {
          start: new Date(latestTime),
          end: new Date(latestTime.getTime() + 30 * 60 * 1000),
        };
        break;

      case 'stagger':
      default:
        resolutionAction = 'reschedule';
        // Stagger posts by 30 minutes
        const sortedPosts = [...conflict.posts].sort(
          (a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
        );
        const firstTime = new Date(sortedPosts[0].scheduledTime).getTime();
        newTimeSlot = {
          start: new Date(firstTime),
          end: new Date(firstTime + sortedPosts.length * 30 * 60 * 1000),
        };
        break;

      case 'cancel_duplicates':
        resolutionAction = 'cancel';
        break;
    }

    const resolution = await executeResolutionAction(
      conflict,
      resolutionAction,
      conflict.posts.map(p => p.id),
      newTimeSlot,
      calendarService
    );

    res.json({
      success: true,
      data: resolution,
      message: `Conflict auto-resolved using ${strategy || 'stagger'} strategy`,
      timestamp: new Date(),
    });
  } catch (error) {
    conflictLogger.error('Failed to auto-resolve conflict', { conflictId: req.params.id, error });
    res.status(500).json({
      success: false,
      error: 'Failed to auto-resolve conflict',
      timestamp: new Date(),
    });
  }
});

/**
 * GET /api/conflicts/check/:postId
 * Check if a specific post has conflicts
 */
router.get('/check/:postId', async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const conflicts = await calendarService.getConflicts(false);

    const postConflicts = conflicts.filter(c =>
      c.posts.some(p => p.id === postId)
    );

    if (postConflicts.length === 0) {
      res.json({
        success: true,
        data: {
          hasConflict: false,
          postId,
          conflicts: [],
        },
        timestamp: new Date(),
      });
      return;
    }

    res.json({
      success: true,
      data: {
        hasConflict: true,
        postId,
        conflicts: postConflicts,
        severity: postConflicts[0].severity,
      },
      timestamp: new Date(),
    });
  } catch (error) {
    conflictLogger.error('Failed to check conflict', { postId: req.params.postId, error });
    res.status(500).json({
      success: false,
      error: 'Failed to check conflict',
      timestamp: new Date(),
    });
  }
});

/**
 * POST /api/conflicts/bulk-resolve
 * Resolve multiple conflicts at once
 */
router.post('/bulk-resolve', async (req: Request, res: Response) => {
  try {
    const { conflictIds, strategy } = req.body;

    if (!conflictIds || !Array.isArray(conflictIds)) {
      res.status(400).json({
        success: false,
        error: 'conflictIds array is required',
        timestamp: new Date(),
      });
      return;
    }

    const results = [];
    const conflicts = await calendarService.getConflicts(false);

    for (const conflictId of conflictIds) {
      const conflict = conflicts.find(c => c.id === conflictId);
      if (!conflict || conflict.resolved) continue;

      try {
        const resolution = await executeResolutionAction(
          conflict,
          'reschedule',
          conflict.posts.map(p => p.id),
          undefined,
          calendarService
        );
        results.push({ conflictId, success: true, resolution });
      } catch (error) {
        results.push({ conflictId, success: false, error: String(error) });
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    conflictLogger.info('Bulk resolve completed', { successful, failed, total: conflictIds.length });

    res.json({
      success: true,
      data: {
        total: conflictIds.length,
        successful,
        failed,
        results,
      },
      message: `Resolved ${successful} conflicts, ${failed} failed`,
      timestamp: new Date(),
    });
  } catch (error) {
    conflictLogger.error('Bulk resolve failed', { error });
    res.status(500).json({
      success: false,
      error: 'Bulk resolve failed',
      timestamp: new Date(),
    });
  }
});

// Helper functions

async function executeResolutionAction(
  conflict: Conflict,
  action: 'reschedule' | 'publish_now' | 'merge' | 'cancel',
  affectedPosts: string[],
  newTimeSlot: { start: Date; end: Date } | undefined,
  service: typeof calendarService
): Promise<Conflict['resolution']> {
  const resolution: Conflict['resolution'] = {
    action,
    affectedPosts: affectedPosts || conflict.posts.map(p => p.id),
    newTimeSlot,
    resolvedAt: new Date(),
    resolvedBy: 'system',
  };

  switch (action) {
    case 'reschedule':
      // Reschedule affected posts to new time slot
      if (newTimeSlot) {
        const posts = conflict.posts.filter(p => affectedPosts.includes(p.id));
        const interval = newTimeSlot.end.getTime() - newTimeSlot.start.getTime();
        const offset = interval / Math.max(posts.length, 1);

        for (let i = 0; i < posts.length; i++) {
          const newTime = new Date(newTimeSlot.start.getTime() + i * offset);
          await service.reschedulePost(posts[i].id, newTime, 'Conflict resolution');
        }
      }
      break;

    case 'publish_now':
      // Publish the first post immediately, reschedule others
      const postsToHandle = conflict.posts.filter(p => affectedPosts.includes(p.id));
      if (postsToHandle.length > 0) {
        await service.publishPost(postsToHandle[0].id);
        for (let i = 1; i < postsToHandle.length; i++) {
          const newTime = new Date(Date.now() + 30 * 60 * 1000 * i); // Stagger by 30 mins
          await service.reschedulePost(postsToHandle[i].id, newTime, 'Conflict resolution - staggered');
        }
      }
      break;

    case 'merge':
      // Merge similar posts - keep one, update others to draft
      const postsToMerge = conflict.posts.filter(p => affectedPosts.includes(p.id));
      if (postsToMerge.length > 0) {
        // Keep the first post, update others to draft
        for (let i = 1; i < postsToMerge.length; i++) {
          await service.performBulkOperation({
            ids: [postsToMerge[i].id],
            action: 'change_status',
            newValues: { status: 'draft' },
          });
        }
      }
      break;

    case 'cancel':
      // Cancel (delete) affected posts
      for (const postId of affectedPosts) {
        await service.deletePost(postId);
      }
      break;
  }

  // Mark conflict as resolved
  await service.resolveConflict(conflict.id, resolution);

  conflictLogger.info('Conflict resolution executed', { action, affectedPosts: resolution.affectedPosts });

  return resolution;
}

function findEarliestPost(posts: Conflict['posts']) {
  return posts.reduce((earliest, post) => {
    const postTime = new Date(post.scheduledTime).getTime();
    const earliestTime = new Date(earliest.scheduledTime).getTime();
    return postTime < earliestTime ? post : earliest;
  });
}

function findLatestPost(posts: Conflict['posts']) {
  return posts.reduce((latest, post) => {
    const postTime = new Date(post.scheduledTime).getTime();
    const latestTime = new Date(latest.scheduledTime).getTime();
    return postTime > latestTime ? post : latest;
  });
}

export default router;
