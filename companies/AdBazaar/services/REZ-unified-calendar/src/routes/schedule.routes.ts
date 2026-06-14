import { Router, Request, Response } from 'express';
import { calendarService } from '../services/calendar.service';
import { RescheduleSchema } from '../types';
import { ZodError } from 'zod';
import { apiLogger as logger, scheduleLogger } from '../utils/logger';

const router = Router();

/**
 * POST /api/schedule/reschedule
 * Reschedule a post to a new time (drag-drop support)
 */
router.post('/reschedule', async (req: Request, res: Response) => {
  try {
    const validatedData = RescheduleSchema.parse(req.body);
    const { postId, newScheduledTime, reason } = validatedData;

    scheduleLogger.info('Reschedule request received', { postId, newScheduledTime, reason });

    // Check for conflicts before rescheduling
    const post = await calendarService.getPost(postId);
    if (!post.success || !post.data) {
      res.status(404).json({
        success: false,
        error: 'Post not found',
        timestamp: new Date(),
      });
      return;
    }

    // Get existing conflicts
    const conflicts = await calendarService.getConflicts(false);
    const relevantConflicts = conflicts.filter(c =>
      c.posts.some(p => p.id === postId)
    );

    const result = await calendarService.reschedulePost(
      postId,
      new Date(newScheduledTime),
      reason
    );

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    // Check if new conflict was created
    const newConflicts = await calendarService.getConflicts(false);
    const newConflict = newConflicts.find(c =>
      c.posts.some(p => p.id === postId) &&
      !relevantConflicts.some(rc => rc.id === c.id)
    );

    res.json({
      success: true,
      data: {
        post: result.data,
        conflictCreated: !!newConflict,
        newConflict: newConflict || undefined,
      },
      message: `Post rescheduled to ${newScheduledTime}`,
      timestamp: new Date(),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
        timestamp: new Date(),
      });
      return;
    }
    scheduleLogger.error('Failed to reschedule post', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to reschedule post',
      timestamp: new Date(),
    });
  }
});

/**
 * POST /api/schedule/bulk-reschedule
 * Bulk reschedule multiple posts
 */
router.post('/bulk-reschedule', async (req: Request, res: Response) => {
  try {
    const { items, offsetMinutes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Items array is required',
        timestamp: new Date(),
      });
      return;
    }

    if (!offsetMinutes || typeof offsetMinutes !== 'number') {
      res.status(400).json({
        success: false,
        error: 'offsetMinutes (number) is required',
        timestamp: new Date(),
      });
      return;
    }

    const results = [];
    for (const item of items) {
      const { postId, newScheduledTime } = item;
      const result = await calendarService.reschedulePost(
        postId,
        new Date(newScheduledTime),
        `Bulk reschedule: offset by ${offsetMinutes} minutes`
      );
      results.push({
        postId,
        success: result.success,
        error: result.error,
      });
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    scheduleLogger.info('Bulk reschedule completed', { successful, failed, total: items.length });

    res.json({
      success: true,
      data: {
        total: items.length,
        successful,
        failed,
        results,
      },
      message: `Rescheduled ${successful} posts, ${failed} failed`,
      timestamp: new Date(),
    });
  } catch (error) {
    scheduleLogger.error('Bulk reschedule failed', { error });
    res.status(500).json({
      success: false,
      error: 'Bulk reschedule failed',
      timestamp: new Date(),
    });
  }
});

/**
 * GET /api/schedule/suggestions/:postId
 * Get suggested times for rescheduling a post
 */
router.get('/suggestions/:postId', async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const { duration, platform } = req.query;

    const post = await calendarService.getPost(postId);
    if (!post.success || !post.data) {
      res.status(404).json({
        success: false,
        error: 'Post not found',
        timestamp: new Date(),
      });
      return;
    }

    // Get all posts to find available slots
    const allPostsResult = await calendarService.getAllPosts(1, 1000);
    const allPosts = allPostsResult.data;

    // Calculate available slots (simple algorithm)
    const suggestions = generateTimeSuggestions(
      new Date(post.data.scheduledTime),
      allPosts.map(p => new Date(p.scheduledTime)),
      duration ? parseInt(duration as string) : 30,
      platform as string
    );

    res.json({
      success: true,
      data: {
        postId,
        currentTime: post.data.scheduledTime,
        suggestions,
      },
      timestamp: new Date(),
    });
  } catch (error) {
    scheduleLogger.error('Failed to get suggestions', { postId: req.params.postId, error });
    res.status(500).json({
      success: false,
      error: 'Failed to get suggestions',
      timestamp: new Date(),
    });
  }
});

/**
 * POST /api/schedule/validate
 * Validate if a scheduled time is available (conflict-free)
 */
router.post('/validate', async (req: Request, res: Response) => {
  try {
    const { postId, scheduledTime, excludePostIds } = req.body;

    if (!scheduledTime) {
      res.status(400).json({
        success: false,
        error: 'scheduledTime is required',
        timestamp: new Date(),
      });
      return;
    }

    const targetTime = new Date(scheduledTime);
    const conflictWindow = 15 * 60 * 1000; // 15 minutes

    // Get all posts
    const allPostsResult = await calendarService.getAllPosts(1, 1000);
    const posts = allPostsResult.data;

    // Filter out excluded posts
    const filteredPosts = posts.filter(p =>
      !excludePostIds?.includes(p.id) &&
      p.id !== postId
    );

    // Find conflicts
    const conflicts = filteredPosts.filter(p => {
      const postTime = new Date(p.scheduledTime).getTime();
      const targetTimestamp = targetTime.getTime();
      return Math.abs(postTime - targetTimestamp) < conflictWindow;
    });

    // Check working hours
    const workingHours = { start: '09:00', end: '17:00' };
    const hour = targetTime.getHours();
    const [startHour] = workingHours.start.split(':').map(Number);
    const [endHour] = workingHours.end.split(':').map(Number);

    const withinWorkingHours = hour >= startHour && hour < endHour;

    res.json({
      success: true,
      data: {
        isValid: conflicts.length === 0 && withinWorkingHours,
        conflicts: conflicts.map(c => ({
          id: c.id,
          platform: c.platform,
          scheduledTime: c.scheduledTime,
          reason: 'Within 15-minute conflict window',
        })),
        warnings: withinWorkingHours ? [] : ['Outside working hours'],
        suggestedAlternative: conflicts.length > 0
          ? findNextAvailableSlot(targetTime, conflictWindow)
          : undefined,
      },
      timestamp: new Date(),
    });
  } catch (error) {
    scheduleLogger.error('Failed to validate schedule', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to validate schedule',
      timestamp: new Date(),
    });
  }
});

/**
 * GET /api/schedule/upcoming
 * Get upcoming scheduled posts
 */
router.get('/upcoming', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const platform = req.query.platform as string;

    const filters = {
      statuses: ['scheduled'] as const,
      dateRange: {
        start: new Date(),
        end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Next 30 days
      },
      ...(platform && { platforms: [platform as Platform] }),
    };

    const result = await calendarService.getAllPosts(1, limit, filters);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      timestamp: new Date(),
    });
  } catch (error) {
    scheduleLogger.error('Failed to get upcoming posts', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get upcoming posts',
      timestamp: new Date(),
    });
  }
});

// Helper function to generate time suggestions
function generateTimeSuggestions(
  currentTime: Date,
  existingTimes: Date[],
  duration: number,
  platform?: string
): Array<{ time: string; score: number; reason: string }> {
  const suggestions: Array<{ time: Date; score: number; reason: string }> = [];
  const conflictWindow = 15 * 60 * 1000;

  // Check times on the same day, different hours
  const currentHour = currentTime.getHours();
  const preferredHours = [9, 10, 11, 14, 15, 16, 17]; // Business hours

  for (const hour of preferredHours) {
    if (hour === currentHour) continue;

    const suggestionTime = new Date(currentTime);
    suggestionTime.setHours(hour, 0, 0, 0);

    // Check for conflicts
    const hasConflict = existingTimes.some(existingTime => {
      const existingTimestamp = existingTime.getTime();
      const suggestionTimestamp = suggestionTime.getTime();
      return Math.abs(existingTimestamp - suggestionTimestamp) < conflictWindow;
    });

    const score = hasConflict ? 0 : 100 - Math.abs(hour - 12); // Prefer midday
    const reason = hasConflict ? 'Time slot has potential conflict' : 'Available time slot';

    suggestions.push({
      time: suggestionTime,
      score,
      reason,
    });
  }

  // Sort by score descending
  suggestions.sort((a, b) => b.score - a.score);

  // Convert to string format
  return suggestions.slice(0, 5).map(s => ({
    time: s.time.toISOString(),
    score: s.score,
    reason: s.reason,
  }));
}

// Helper function to find next available slot
function findNextAvailableSlot(currentTime: Date, conflictWindow: number, maxAttempts: number = 24): string {
  const slot = new Date(currentTime);
  let attempts = 0;

  while (attempts < maxAttempts) {
    slot.setMinutes(slot.getMinutes() + 15); // Try every 15 minutes
    attempts++;

    // Check if within working hours
    const hour = slot.getHours();
    if (hour < 9 || hour >= 17) {
      // Skip to next day at 9 AM
      slot.setDate(slot.getDate() + 1);
      slot.setHours(9, 0, 0, 0);
    }

    // Simple check - in real implementation, would check against all posts
    if (attempts >= 4) {
      return slot.toISOString();
    }
  }

  // Return a safe default (next day 9 AM)
  const nextDay = new Date(currentTime);
  nextDay.setDate(nextDay.getDate() + 1);
  nextDay.setHours(9, 0, 0, 0);
  return nextDay.toISOString();
}

import { Platform } from '../types';

export default router;
