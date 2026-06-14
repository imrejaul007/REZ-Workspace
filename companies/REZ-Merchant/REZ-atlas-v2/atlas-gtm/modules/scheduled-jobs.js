/**
 * REZ Atlas GTM - Scheduled Jobs Module
 * Cron-based automation for follow-ups, auto-replies, and scheduled tasks
 */

const cron = require('node-cron');
const { v4: uuidv4 } = require('uuid');

// In-memory job storage
const jobs = new Map();
const jobExecutions = new Map();
const taskRegistry = new Map();

// ============================================
// JOB DEFINITIONS
// ============================================

/**
 * Register a scheduled task
 */
function registerTask(name, handler, options = {}) {
  const task = {
    id: name,
    handler,
    description: options.description || '',
    schedule: options.schedule || '*/5 * * * *', // Default every 5 minutes
    enabled: options.enabled !== false,
    timeout: options.timeout || 60000, // 1 minute default
    retries: options.retries || 0,
    lastRun: null,
    nextRun: null,
    runCount: 0,
    errorCount: 0,
    avgDuration: 0
  };

  taskRegistry.set(name, task);
  return task;
}

/**
 * Create a cron job from task
 */
function createCronJob(task) {
  if (!task.schedule || !cron.validate(task.schedule)) {
    console.error(`Invalid cron schedule for task ${task.id}: ${task.schedule}`);
    return null;
  }

  return cron.schedule(task.schedule, async () => {
    const startTime = Date.now();
    const executionId = uuidv4();

    try {
      console.log(`[CRON] Starting task: ${task.id}`);

      // Update task status
      task.lastRun = new Date().toISOString();

      // Execute with timeout
      const result = await Promise.race([
        task.handler(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Task timeout')), task.timeout)
        )
      ]);

      const duration = Date.now() - startTime;

      // Update stats
      task.runCount++;
      task.avgDuration = ((task.avgDuration * (task.runCount - 1)) + duration) / task.runCount;

      // Log execution
      logExecution(executionId, task.id, 'success', duration, result);

      console.log(`[CRON] Task ${task.id} completed in ${duration}ms`);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      task.errorCount++;
      task.lastError = error.message;

      // Log execution
      logExecution(executionId, task.id, 'error', duration, null, error.message);

      console.error(`[CRON] Task ${task.id} failed: ${error.message}`);

      // Retry logic
      if (task.retries > 0) {
        scheduleRetry(task, executionId);
      }

      return null;
    }
  }, {
    scheduled: task.enabled
  });
}

/**
 * Schedule a retry for failed task
 */
function scheduleRetry(task, originalExecutionId) {
  const retryDelay = Math.min(60000, 10000 * Math.pow(2, task.errorCount)); // Exponential backoff
  const retryTime = Date.now() + retryDelay;

  console.log(`[CRON] Scheduling retry for ${task.id} in ${retryDelay}ms`);

  setTimeout(async () => {
    try {
      console.log(`[CRON] Retry attempt for task: ${task.id}`);
      await task.handler();
      task.errorCount = Math.max(0, task.errorCount - 1); // Reset on success
    } catch (error) {
      console.error(`[CRON] Retry failed for ${task.id}: ${error.message}`);
    }
  }, retryDelay);
}

/**
 * Log job execution
 */
function logExecution(executionId, taskId, status, duration, result, error = null) {
  const execution = {
    id: executionId,
    taskId,
    status,
    duration,
    result: status === 'success' ? result : null,
    error: status === 'error' ? error : null,
    executedAt: new Date().toISOString()
  };

  jobExecutions.set(executionId, execution);

  // Keep last 1000 executions
  if (jobExecutions.size > 1000) {
    const oldest = jobExecutions.keys().next().value;
    jobExecutions.delete(oldest);
  }

  return execution;
}

// ============================================
// BUILT-IN TASKS
// ============================================

// Task references (will be set when scheduled)
let emailSender = null;
let sequenceBuilder = null;
let crmIntegration = null;
let whatsappIntegration = null;

/**
 * Initialize built-in tasks
 */
function initializeTasks(dependencies) {
  emailSender = dependencies.emailSender;
  sequenceBuilder = dependencies.sequenceBuilder;
  crmIntegration = dependencies.crmIntegration;
  whatsappIntegration = dependencies.whatsappIntegration;

  // Task 1: Process sequence enrollments
  registerTask('process-sequences', async () => {
    if (!sequenceBuilder) return { processed: 0 };

    const enrollments = sequenceBuilder.getActiveEnrollments ? sequenceBuilder.getActiveEnrollments() : [];
    let processed = 0;

    for (const enrollment of enrollments) {
      const nextStep = sequenceBuilder.getNextStep ? sequenceBuilder.getNextStep(enrollment.id) : null;

      if (nextStep && nextStep.isDue) {
        try {
          if (nextStep.channel === 'email') {
            await emailSender?.sendEmail(nextStep.emailData);
          } else if (nextStep.channel === 'whatsapp') {
            await whatsappIntegration?.sendMessage(nextStep.whatsappData);
          }
          processed++;
        } catch (error) {
          console.error(`Failed to process enrollment ${enrollment.id}: ${error.message}`);
        }
      }
    }

    return { processed };
  }, {
    description: 'Process sequence enrollments and send pending messages',
    schedule: '*/2 * * * *' // Every 2 minutes
  });

  // Task 2: Check for auto-replies
  registerTask('check-auto-replies', async () => {
    if (!crmIntegration) return { replies: 0 };

    // Get recent email/webhook events
    const recentReplies = crmIntegration.getRecentReplies ? crmIntegration.getRecentReplies() : [];
    let replies = 0;

    for (const reply of recentReplies) {
      // Trigger auto-reply workflow
      if (sequenceBuilder?.handleReply) {
        await sequenceBuilder.handleReply(reply);
        replies++;
      }
    }

    return { replies };
  }, {
    description: 'Check for incoming replies and trigger auto-reply sequences',
    schedule: '*/5 * * * *' // Every 5 minutes
  });

  // Task 3: Send follow-up reminders
  registerTask('send-follow-ups', async () => {
    if (!crmIntegration || !emailSender) return { sent: 0 };

    const pendingFollowUps = crmIntegration.getPendingFollowUps ? crmIntegration.getPendingFollowUps() : [];
    let sent = 0;

    for (const followUp of pendingFollowUps) {
      try {
        await emailSender.sendEmail({
          to: followUp.email,
          subject: followUp.subject || `Following up on our conversation`,
          body: followUp.body || `Hi ${followUp.name},\n\nJust wanted to follow up on our previous conversation...`
        });
        sent++;

        if (crmIntegration.markFollowUpSent) {
          crmIntegration.markFollowUpSent(followUp.id);
        }
      } catch (error) {
        console.error(`Failed to send follow-up: ${error.message}`);
      }
    }

    return { sent };
  }, {
    description: 'Send scheduled follow-up emails',
    schedule: '0 9,12,17 * * 1-5' // 9 AM, 12 PM, 5 PM on weekdays
  });

  // Task 4: CRM sync
  registerTask('crm-sync', async () => {
    if (!crmIntegration) return { synced: 0 };

    const result = await crmIntegration.syncAll ? crmIntegration.syncAll() : { synced: 0 };
    return result;
  }, {
    description: 'Sync GTM data with CRM',
    schedule: '*/15 * * * *' // Every 15 minutes
  });

  // Task 5: Cleanup old data
  registerTask('cleanup', async () => {
    let cleaned = 0;

    // Clean old executions
    const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days
    for (const [id, execution] of jobExecutions.entries()) {
      const executedAt = new Date(execution.executedAt).getTime();
      if (executedAt < cutoff) {
        jobExecutions.delete(id);
        cleaned++;
      }
    }

    return { cleaned };
  }, {
    description: 'Clean up old execution logs and temporary data',
    schedule: '0 3 * * *' // Daily at 3 AM
  });

  // Task 6: Update prospect scores
  registerTask('update-scores', async () => {
    if (!crmIntegration) return { updated: 0 };

    const prospects = crmIntegration.getActiveProspects ? crmIntegration.getActiveProspects() : [];
    let updated = 0;

    for (const prospect of prospects.slice(0, 100)) { // Limit to 100 per run
      try {
        // Recalculate score based on recent activity
        const newScore = calculateProspectScore(prospect);
        if (crmIntegration.updateScore) {
          await crmIntegration.updateScore(prospect.id, newScore);
          updated++;
        }
      } catch (error) {
        console.error(`Failed to update score for ${prospect.id}: ${error.message}`);
      }
    }

    return { updated };
  }, {
    description: 'Update prospect intelligence scores',
    schedule: '0 */2 * * *' // Every 2 hours
  });

  // Task 7: Warm up email accounts
  registerTask('email-warmup', async () => {
    if (!emailSender?.performWarmup) return { warmed: 0 };

    const warmed = await emailSender.performWarmup();
    return { warmed };
  }, {
    description: 'Perform email warming routines',
    schedule: '*/30 * * * *' // Every 30 minutes
  });

  // Task 8: Generate daily reports
  registerTask('daily-report', async () => {
    if (!crmIntegration) return null;

    const report = {
      date: new Date().toISOString().split('T')[0],
      emails: emailSender?.getStats?.() || {},
      sequences: sequenceBuilder?.getStats?.() || {},
      crm: crmIntegration.getDailyStats ? crmIntegration.getDailyStats() : {}
    };

    // Could send this to Slack, email, etc.
    console.log(`[REPORT] Daily stats:`, JSON.stringify(report, null, 2));

    return report;
  }, {
    description: 'Generate and send daily activity reports',
    schedule: '0 18 * * *' // Daily at 6 PM
  });
}

/**
 * Calculate prospect score based on activity
 */
function calculateProspectScore(prospect) {
  let score = 50; // Base score

  // Engagement scoring
  if (prospect.emailOpens > 5) score += 10;
  if (prospect.linkClicks > 3) score += 10;
  if (prospect.replies > 0) score += 20;
  if (prospect.meetingsBooked > 0) score += 15;

  // Recency scoring
  const lastActivity = prospect.lastActivityAt ? new Date(prospect.lastActivityAt).getTime() : 0;
  const daysSinceActivity = (Date.now() - lastActivity) / (1000 * 60 * 60 * 24);

  if (daysSinceActivity < 7) score += 10;
  else if (daysSinceActivity < 14) score += 5;
  else if (daysSinceActivity > 30) score -= 20;

  // Cap score
  return Math.min(100, Math.max(0, score));
}

// ============================================
// JOB MANAGEMENT
// ============================================

/**
 * Start a registered task
 */
function startTask(taskId) {
  const task = taskRegistry.get(taskId);
  if (!task) return null;

  if (task.cronJob) {
    task.cronJob.stop();
  }

  task.enabled = true;
  task.cronJob = createCronJob(task);
  task.nextRun = calculateNextRun(task.schedule);

  return task;
}

/**
 * Stop a registered task
 */
function stopTask(taskId) {
  const task = taskRegistry.get(taskId);
  if (!task) return null;

  if (task.cronJob) {
    task.cronJob.stop();
  }

  task.enabled = false;
  return task;
}

/**
 * Calculate next run time from cron expression
 */
function calculateNextRun(cronExpression) {
  // Simple implementation - returns approximate next run
  const parts = cronExpression.split(' ');
  if (parts.length < 5) return null;

  const now = new Date();
  const next = new Date(now.getTime() + 5 * 60 * 1000); // Approximate 5 minutes
  return next.toISOString();
}

/**
 * Start all enabled tasks
 */
function startAllTasks() {
  const started = [];

  for (const [id, task] of taskRegistry.entries()) {
    if (task.enabled) {
      task.cronJob = createCronJob(task);
      task.nextRun = calculateNextRun(task.schedule);
      started.push(id);
    }
  }

  console.log(`[CRON] Started ${started.length} tasks`);
  return started;
}

/**
 * Stop all tasks
 */
function stopAllTasks() {
  const stopped = [];

  for (const [id, task] of taskRegistry.entries()) {
    if (task.cronJob) {
      task.cronJob.stop();
      stopped.push(id);
    }
  }

  console.log(`[CRON] Stopped ${stopped.length} tasks`);
  return stopped;
}

// ============================================
// JOB CRUD
// ============================================

/**
 * Create custom job
 */
function createJob(data) {
  const job = {
    id: uuidv4(),
    name: data.name,
    description: data.description || '',
    schedule: data.schedule,
    enabled: data.enabled || false,
    handler: data.handler || (() => {}),
    timeout: data.timeout || 60000,
    retries: data.retries || 0,
    createdAt: new Date().toISOString(),
    createdBy: data.userId || 'system'
  };

  jobs.set(job.id, job);

  if (job.enabled) {
    startTask(job.name);
  }

  return job;
}

/**
 * Get job by ID
 */
function getJob(jobId) {
  return jobs.get(jobId);
}

/**
 * Update job
 */
function updateJob(jobId, updates) {
  const job = jobs.get(jobId);
  if (!job) return null;

  // Update fields
  if (updates.schedule !== undefined) job.schedule = updates.schedule;
  if (updates.description !== undefined) job.description = updates.description;
  if (updates.timeout !== undefined) job.timeout = updates.timeout;
  if (updates.retries !== undefined) job.retries = updates.retries;

  if (updates.enabled !== undefined) {
    if (updates.enabled && !job.enabled) {
      startTask(job.name);
    } else if (!updates.enabled && job.enabled) {
      stopTask(job.name);
    }
    job.enabled = updates.enabled;
  }

  return job;
}

/**
 * Delete job
 */
function deleteJob(jobId) {
  const job = jobs.get(jobId);
  if (!job) return false;

  stopTask(job.name);
  return jobs.delete(jobId);
}

/**
 * Get all jobs
 */
function getAllJobs() {
  return Array.from(taskRegistry.values()).map(task => ({
    id: task.id,
    description: task.description,
    schedule: task.schedule,
    enabled: task.enabled,
    lastRun: task.lastRun,
    nextRun: task.nextRun,
    runCount: task.runCount,
    errorCount: task.errorCount,
    avgDuration: Math.round(task.avgDuration),
    lastError: task.lastError
  }));
}

/**
 * Get all custom jobs
 */
function getCustomJobs() {
  return Array.from(jobs.values());
}

// ============================================
// EXECUTION HISTORY
// ============================================

/**
 * Get execution history
 */
function getExecutionHistory(filters = {}) {
  let executions = Array.from(jobExecutions.values());

  if (filters.taskId) {
    executions = executions.filter(e => e.taskId === filters.taskId);
  }

  if (filters.status) {
    executions = executions.filter(e => e.status === filters.status);
  }

  if (filters.from) {
    const fromTime = new Date(filters.from).getTime();
    executions = executions.filter(e => new Date(e.executedAt).getTime() >= fromTime);
  }

  if (filters.to) {
    const toTime = new Date(filters.to).getTime();
    executions = executions.filter(e => new Date(e.executedAt).getTime() <= toTime);
  }

  // Sort by most recent first
  executions.sort((a, b) => new Date(b.executedAt) - new Date(a.executedAt));

  // Apply limit
  if (filters.limit) {
    executions = executions.slice(0, filters.limit);
  }

  return executions;
}

/**
 * Get execution by ID
 */
function getExecution(executionId) {
  return jobExecutions.get(executionId);
}

// ============================================
// MANUAL TRIGGERS
// ============================================

/**
 * Manually trigger a task
 */
async function triggerTask(taskId) {
  const task = taskRegistry.get(taskId);
  if (!task) return null;

  console.log(`[CRON] Manually triggering task: ${taskId}`);

  try {
    const result = await task.handler();
    task.runCount++;
    return { success: true, result };
  } catch (error) {
    task.errorCount++;
    task.lastError = error.message;
    return { success: false, error: error.message };
  }
}

/**
 * Trigger a custom job
 */
async function triggerJob(jobId) {
  const job = jobs.get(jobId);
  if (!job) return null;

  const executionId = uuidv4();
  const startTime = Date.now();

  try {
    const result = await Promise.race([
      job.handler(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Job timeout')), job.timeout)
      )
    ]);

    const duration = Date.now() - startTime;
    logExecution(executionId, job.name, 'success', duration, result);

    return { success: true, executionId, duration, result };
  } catch (error) {
    const duration = Date.now() - startTime;
    logExecution(executionId, job.name, 'error', duration, null, error.message);

    return { success: false, executionId, duration, error: error.message };
  }
}

// ============================================
// ONE-TIME SCHEDULING
// ============================================

const oneTimeJobs = new Map();

/**
 * Schedule a one-time job
 */
function scheduleOneTime(handler, delayMs, options = {}) {
  const id = uuidv4();
  const job = {
    id,
    handler,
    scheduledFor: new Date(Date.now() + delayMs).toISOString(),
    options,
    status: 'scheduled'
  };

  setTimeout(async () => {
    try {
      job.status = 'running';
      job.result = await handler();
      job.status = 'completed';
    } catch (error) {
      job.status = 'failed';
      job.error = error.message;
    }
  }, delayMs);

  oneTimeJobs.set(id, job);
  return job;
}

/**
 * Cancel a one-time job
 */
function cancelOneTimeJob(jobId) {
  // Note: Cannot cancel setTimeout, but we can mark it
  const job = oneTimeJobs.get(jobId);
  if (job && job.status === 'scheduled') {
    job.status = 'cancelled';
    return true;
  }
  return false;
}

/**
 * Get one-time job status
 */
function getOneTimeJob(jobId) {
  return oneTimeJobs.get(jobId);
}

// ============================================
// HEALTH & STATS
// ============================================

/**
 * Get scheduler health
 */
function getHealth() {
  const tasks = Array.from(taskRegistry.values());
  const enabled = tasks.filter(t => t.enabled).length;
  const errors = tasks.filter(t => t.lastError).length;

  return {
    status: errors === 0 ? 'healthy' : 'degraded',
    tasks: {
      total: tasks.length,
      enabled,
      errors
    },
    executions: {
      total: jobExecutions.size,
      recent: jobExecutions.size
    }
  };
}

/**
 * Get scheduler statistics
 */
function getStats() {
  const tasks = Array.from(taskRegistry.values());

  return {
    tasks: tasks.map(t => ({
      id: t.id,
      enabled: t.enabled,
      runCount: t.runCount,
      errorCount: t.errorCount,
      successRate: t.runCount > 0 ? ((t.runCount - t.errorCount) / t.runCount * 100).toFixed(1) + '%' : 'N/A',
      avgDuration: Math.round(t.avgDuration) + 'ms',
      lastRun: t.lastRun,
      nextRun: t.nextRun,
      lastError: t.lastError
    })),
    summary: {
      totalTasks: tasks.length,
      activeTasks: tasks.filter(t => t.enabled).length,
      totalRuns: tasks.reduce((sum, t) => sum + t.runCount, 0),
      totalErrors: tasks.reduce((sum, t) => sum + t.errorCount, 0),
      uptime: process.uptime()
    }
  };
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // Task registration
  registerTask,
  initializeTasks,

  // Management
  startTask,
  stopTask,
  startAllTasks,
  stopAllTasks,

  // CRUD
  createJob,
  getJob,
  updateJob,
  deleteJob,
  getAllJobs,
  getCustomJobs,

  // Execution
  triggerTask,
  triggerJob,
  getExecutionHistory,
  getExecution,

  // One-time
  scheduleOneTime,
  cancelOneTimeJob,
  getOneTimeJob,

  // Health
  getHealth,
  getStats
};
