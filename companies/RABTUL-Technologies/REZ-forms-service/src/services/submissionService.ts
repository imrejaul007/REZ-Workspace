/**
 * REZ Forms - Submission Service
 * Handle form submissions and workflow triggers
 */

import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import {
  Submission,
  Answer,
  Form,
  WorkflowTrigger,
  WorkflowResult,
  WorkflowAction,
  FileUpload
} from '../types';
import { getForm, incrementSubmissionCount } from './formService';

// In-memory storage
const submissions: Map<string, Submission> = new Map();
const formSubmissions: Map<string, string[]> = new Map(); // formId -> submissionIds

/**
 * Submit a form response
 */
export async function submitForm(
  formId: string,
  data: {
    userId?: string;
    answers: Answer[];
    ipAddress?: string;
    userAgent?: string;
    deviceInfo?: { browser?: string; os?: string; device?: string };
  }
): Promise<Submission> {
  const form = await getForm(formId);
  if (!form) {
    throw new Error('Form not found');
  }

  // Check if form is published
  if (!form.published) {
    throw new Error('Form is not accepting submissions');
  }

  // Check submission limits
  if (form.settings.maxSubmissions && form.submissionCount >= form.settings.maxSubmissions) {
    throw new Error('Form has reached maximum submissions');
  }

  // Check one submission per user
  if (form.settings.oneSubmissionPerUser && data.userId) {
    const existingSubmission = await getUserSubmission(formId, data.userId);
    if (existingSubmission) {
      throw new Error('You have already submitted this form');
    }
  }

  // Calculate completion time (placeholder)
  const startTime = Date.now();

  // Create submission
  const submission: Submission = {
    id: uuidv4(),
    formId,
    userId: data.userId,
    answers: data.answers,
    submittedAt: new Date(),
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
    deviceInfo: data.deviceInfo as any,
    calculatedValues: {},
    workflowTriggered: false,
    workflowResults: [],
 completionTime: Math.round((Date.now() - startTime) / 1000),
  };

  // Calculate field values
  for (const field of form.fields) {
    if (field.calculationExpression) {
      const answer = data.answers.find(a => a.fieldId === field.id);
      const values = data.answers.reduce((acc, a) => {
        acc[a.fieldId] = a.value;
        return acc;
      }, {} as Record<string, any>);

      // Simple calculation (use mathjs in production)
      try {
        const expr = field.calculationExpression;
        let formula = expr;
        for (const [k, v] of Object.entries(values)) {
          if (typeof v === 'number') {
            formula = formula.replace(new RegExp(k, 'g'), v.toString());
          }
        }
        submission.calculatedValues![field.id] = Function('"use strict"; return (' + formula + ')')();
      } catch {
        // Calculation failed
      }
    }
  }

  // Store submission
  submissions.set(submission.id, submission);
  const formSubIds = formSubmissions.get(formId) || [];
  formSubIds.push(submission.id);
  formSubmissions.set(formId, formSubIds);

  // Increment count
  await incrementSubmissionCount(formId);

  // Trigger workflows
  submission.workflowResults = await triggerWorkflows(form, submission);
  submission.workflowTriggered = true;

  return submission;
}

/**
 * Get submission by ID
 */
export async function getSubmission(submissionId: string): Promise<Submission | null> {
  return submissions.get(submissionId) || null;
}

/**
 * Get all submissions for a form
 */
export async function getFormSubmissions(
  formId: string,
  options: { page?: number; pageSize?: number } = {}
): Promise<{ submissions: Submission[]; total: number }> {
  const { page = 1, pageSize = 50 } = options;
  const formSubIds = formSubmissions.get(formId) || [];

  const formSubmissionsList = formSubIds
    .map(id => submissions.get(id))
    .filter((s): s is Submission => s !== undefined)
    .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());

  const total = formSubmissionsList.length;
  const start = (page - 1) * pageSize;
  const paginated = formSubmissionsList.slice(start, start + pageSize);

  return { submissions: paginated, total };
}

/**
 * Get user's submission for a form
 */
export async function getUserSubmission(
  formId: string,
  userId: string
): Promise<Submission | null> {
  const formSubIds = formSubmissions.get(formId) || [];

  for (const id of formSubIds) {
    const submission = submissions.get(id);
    if (submission && submission.userId === userId) {
      return submission;
    }
  }

  return null;
}

/**
 * Trigger workflows for a submission
 */
async function triggerWorkflows(
  form: Form,
  submission: Submission
): Promise<WorkflowResult[]> {
  const results: WorkflowResult[] = [];

  for (const workflow of form.workflows) {
    if (!workflow.enabled) continue;

    try {
      const result = await executeWorkflow(workflow, form, submission);
      results.push(result);
    } catch (error) {
      results.push({
        triggerId: workflow.id,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        executedAt: new Date(),
      });
    }
  }

  return results;
}

/**
 * Execute a workflow action
 */
async function executeWorkflow(
  workflow: WorkflowTrigger,
  form: Form,
  submission: Submission
): Promise<WorkflowResult> {
  const result: WorkflowResult = {
    triggerId: workflow.id,
    status: 'pending',
    executedAt: new Date(),
  };

  for (const action of workflow.config.actions) {
    try {
      switch (action.type) {
        case 'create_lead':
          await createLead(submission, form);
          break;
        case 'add_to_list':
          await addToList(submission, action.config);
          break;
        case 'send_email':
          await sendEmail(submission, action.config);
          break;
        case 'send_sms':
          await sendSMS(submission, action.config);
          break;
        case 'send_webhook':
          await sendWebhook(submission, action.config);
          break;
        case 'trigger_genie':
          await triggerGenieAgent(submission, action.config);
          break;
        case 'create_safe_qr':
          await createSafeQR(submission, action.config);
          break;
        case 'add_to_crm':
          await addToCRM(submission, action.config);
          break;
      }
    } catch (error) {
      result.status = 'failed';
      result.error = error instanceof Error ? error.message : 'Unknown error';
      return result;
    }
  }

  result.status = 'success';
  return result;
}

/**
 * Create lead in REZ Merchant
 */
async function createLead(submission: Submission, form: Form): Promise<void> {
  // Extract answers
  const name = submission.answers.find(a => a.type === 'short_text')?.value as string || '';
  const email = submission.answers.find(a => a.type === 'email')?.value as string || '';
  const phone = submission.answers.find(a => a.type === 'phone')?.value as string || '';

  // Call REZ Merchant lead service
  try {
    await axios.post(process.env.REZ_MERCHANT_URL + '/api/leads', {
      source: 'REZ Forms',
      sourceFormId: form.id,
      submissionId: submission.id,
      name,
      email,
      phone,
      metadata: {
        formTitle: form.title,
        submittedAt: submission.submittedAt,
      },
    }, {
      headers: { 'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN },
    });
  } catch (error) {
    console.error('Failed to create lead:', error);
    throw error;
  }
}

/**
 * Add to email/SMS list
 */
async function addToList(submission: Submission, config: Record<string, any>): Promise<void> {
  const email = submission.answers.find(a => a.type === 'email')?.value as string;
  const phone = submission.answers.find(a => a.type === 'phone')?.value as string;

  if (config.listType === 'email' && email) {
    // Call REZ notification service
    await axios.post(process.env.REZ_NOTIFICATION_URL + '/api/lists/subscribe', {
      listId: config.listId,
      email,
      metadata: { submissionId: submission.id },
    });
  } else if (config.listType === 'sms' && phone) {
    // Call SMS service
    await axios.post(process.env.REZ_NOTIFICATION_URL + '/api/sms/subscribe', {
      listId: config.listId,
      phone,
      metadata: { submissionId: submission.id },
    });
  }
}

/**
 * Send email notification
 */
async function sendEmail(submission: Submission, config: Record<string, any>): Promise<void> {
  const email = submission.answers.find(a => a.type === 'email')?.value as string;

  if (email) {
    await axios.post(process.env.REZ_NOTIFICATION_URL + '/api/email/send', {
      to: email,
      subject: config.subject || 'Thank you for your submission',
      template: config.template || 'form-confirmation',
      data: {
        submission,
        answers: submission.answers,
      },
    });
  }
}

/**
 * Send SMS notification
 */
async function sendSMS(submission: Submission, config: Record<string, any>): Promise<void> {
  const phone = submission.answers.find(a => a.type === 'phone')?.value as string;

  if (phone) {
    await axios.post(process.env.REZ_NOTIFICATION_URL + '/api/sms/send', {
      to: phone,
      message: config.message || 'Thank you for your submission!',
    });
  }
}

/**
 * Send webhook
 */
async function sendWebhook(submission: Submission, config: Record<string, any>): Promise<void> {
  const webhookUrl = config.url || config.webhookUrl;

  if (webhookUrl) {
    await axios.post(webhookUrl, {
      event: 'form_submission',
      formId: submission.formId,
      submissionId: submission.id,
      submittedAt: submission.submittedAt,
      answers: submission.answers,
      calculatedValues: submission.calculatedValues,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-REZ-Forms-Signature': generateSignature(submission.id, config.secret || ''),
      },
    });
  }
}

/**
 * Trigger Genie AI agent
 */
async function triggerGenieAgent(submission: Submission, config: Record<string, any>): Promise<void> {
  const agentId = config.agentId;

  if (agentId) {
    await axios.post(process.env.HOJAI_URL + '/api/agents/' + agentId + '/trigger', {
      context: {
        source: 'REZ Forms',
        formId: submission.formId,
        submissionId: submission.id,
        answers: submission.answers,
      },
 });
  }
}

/**
 * Create SafeQR from submission
 */
async function createSafeQR(submission: Submission, config: Record<string, any>): Promise<void> {
  const name = submission.answers.find(a => a.type === 'short_text')?.value as string || 'Anonymous';

  await axios.post(process.env.REZ_SAFEQR_URL + '/api/qr', {
    type: config.qrType || 'emergency',
    ownerName: name,
    metadata: {
      formId: submission.formId,
      submissionId: submission.id,
    },
  });
}

/**
 * Add to CRM
 */
async function addToCRM(submission: Submission, config: Record<string, any>): Promise<void> {
  const email = submission.answers.find(a => a.type === 'email')?.value as string;
  const name = submission.answers.find(a => a.type === 'short_text')?.value as string || '';

  await axios.post(process.env.CORPID_URL + '/api/contacts', {
    name,
    email,
    source: 'REZ Forms',
    tags: config.tags || [],
    metadata: {
      formId: submission.formId,
      submissionId: submission.id,
    },
  });
}

/**
 * Generate HMAC signature for webhooks
 */
function generateSignature(payload: string, secret: string): string {
  const crypto = require('crypto');
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Export submissions to CSV
 */
export async function exportSubmissionsToCSV(formId: string): Promise<string> {
  const { submissions: formSubmissionsList } = await getFormSubmissions(formId, { pageSize: 10000 });
  const form = await getForm(formId);

  if (!form) {
    throw new Error('Form not found');
  }

  // Generate CSV header
  const headers = form.fields.map(f => f.question);
  let csv = headers.join(',') + '\n';

  // Generate rows
  for (const submission of formSubmissionsList) {
    const row = form.fields.map(field => {
      const answer = submission.answers.find(a => a.fieldId === field.id);
      const value = answer?.value;
      if (Array.isArray(value)) {
        return '"' + value.join('; ') + '"';
      }
      return '"' + (value || '') + '"';
    });
    csv += row.join(',') + '\n';
  }

  return csv;
}

/**
 * Get submission analytics
 */
export async function getSubmissionAnalytics(formId: string): Promise<{
  total: number;
  byDate: Record<string, number>;
  byDevice: Record<string, number>;
  averageCompletionTime: number;
  completionRate: number;
}> {
  const { submissions: formSubmissionsList } = await getFormSubmissions(formId, { pageSize: 10000 });

  const byDate: Record<string, number> = {};
  const byDevice: Record<string, number> = { desktop: 0, mobile: 0, tablet: 0 };

  let totalTime = 0;
  let timeCount = 0;

  for (const submission of formSubmissionsList) {
    const date = submission.submittedAt.toISOString().split('T')[0];
    byDate[date] = (byDate[date] || 0) + 1;

    if (submission.deviceInfo?.device) {
      byDevice[submission.deviceInfo.device]++;
    }

    if (submission.completionTime) {
      totalTime += submission.completionTime;
      timeCount++;
    }
  }

  return {
    total: formSubmissionsList.length,
    byDate,
    byDevice,
    averageCompletionTime: timeCount > 0 ? Math.round(totalTime / timeCount) : 0,
    completionRate: 0.85, // Placeholder
  };
}