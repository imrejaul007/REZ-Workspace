import mongoose from 'mongoose';
import { NotificationTemplate } from './models';
import { v4 as uuidv4 } from 'uuid';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/corpperks_push';

// ==================== DEFAULT TEMPLATES ====================

const defaultTemplates = [
  {
    name: 'Task Reminder',
    description: 'Remind employee about pending tasks',
    type: 'task_reminder',
    channels: ['push', 'in_app'],
    titleTemplate: 'Task Reminder: {{taskTitle}}',
    bodyTemplate: 'You have a task "{{taskTitle}}" due {{dueDate}}. Click to view details.',
    variables: [
      { name: 'taskTitle', type: 'string', required: true, description: 'Name of the task' },
      { name: 'dueDate', type: 'string', required: true, description: 'Due date of the task' },
    ],
    priority: 'high',
    isActive: true,
    isDefault: true,
    tags: ['task', 'reminder'],
    createdBy: 'system',
  },
  {
    name: 'Leave Request Received',
    description: 'Notify manager about leave request',
    type: 'leave_request',
    channels: ['push', 'in_app', 'email'],
    titleTemplate: 'Leave Request from {{employeeName}}',
    bodyTemplate: '{{employeeName}} has requested {{leaveType}} leave from {{startDate}} to {{endDate}}.',
    variables: [
      { name: 'employeeName', type: 'string', required: true },
      { name: 'leaveType', type: 'string', required: true },
      { name: 'startDate', type: 'date', required: true },
      { name: 'endDate', type: 'date', required: true },
    ],
    priority: 'normal',
    isActive: true,
    isDefault: true,
    tags: ['leave', 'request'],
    createdBy: 'system',
  },
  {
    name: 'Leave Approved',
    description: 'Confirm leave approval to employee',
    type: 'leave_approved',
    channels: ['push', 'in_app', 'email'],
    titleTemplate: 'Your Leave Has Been Approved!',
    bodyTemplate: 'Great news! Your {{leaveType}} leave from {{startDate}} to {{endDate}} has been approved.',
    variables: [
      { name: 'leaveType', type: 'string', required: true },
      { name: 'startDate', type: 'date', required: true },
      { name: 'endDate', type: 'date', required: true },
    ],
    priority: 'normal',
    isActive: true,
    isDefault: true,
    tags: ['leave', 'approval'],
    createdBy: 'system',
  },
  {
    name: 'Leave Rejected',
    description: 'Notify employee about rejected leave',
    type: 'leave_rejected',
    channels: ['push', 'in_app', 'email'],
    titleTemplate: 'Leave Request Update',
    bodyTemplate: 'Your {{leaveType}} leave from {{startDate}} to {{endDate}} has been rejected. Reason: {{reason}}',
    variables: [
      { name: 'leaveType', type: 'string', required: true },
      { name: 'startDate', type: 'date', required: true },
      { name: 'endDate', type: 'date', required: true },
      { name: 'reason', type: 'string', required: false },
    ],
    priority: 'normal',
    isActive: true,
    isDefault: true,
    tags: ['leave', 'rejection'],
    createdBy: 'system',
  },
  {
    name: 'Meeting Reminder',
    description: 'Remind about upcoming meetings',
    type: 'meeting_reminder',
    channels: ['push', 'in_app', 'email'],
    titleTemplate: 'Meeting: {{meetingTitle}}',
    bodyTemplate: 'You have a meeting "{{meetingTitle}}" starting in {{minutes}} minutes at {{location}}.',
    variables: [
      { name: 'meetingTitle', type: 'string', required: true },
      { name: 'minutes', type: 'number', required: true },
      { name: 'location', type: 'string', required: false },
    ],
    priority: 'high',
    isActive: true,
    isDefault: true,
    tags: ['meeting', 'reminder'],
    createdBy: 'system',
  },
  {
    name: 'Payroll Available',
    description: 'Notify about salary credit',
    type: 'payroll',
    channels: ['push', 'in_app', 'email'],
    titleTemplate: 'Your Salary Has Been Credited',
    bodyTemplate: 'Your salary of {{amount}} for {{month}} has been credited. View details in the payroll section.',
    variables: [
      { name: 'amount', type: 'string', required: true },
      { name: 'month', type: 'string', required: true },
    ],
    priority: 'high',
    isActive: true,
    isDefault: true,
    tags: ['payroll', 'salary'],
    createdBy: 'system',
  },
  {
    name: 'Document Ready',
    description: 'Notify about new documents',
    type: 'document',
    channels: ['push', 'in_app'],
    titleTemplate: 'New Document: {{documentName}}',
    bodyTemplate: 'A new document "{{documentName}}" has been shared with you by {{senderName}}.',
    variables: [
      { name: 'documentName', type: 'string', required: true },
      { name: 'senderName', type: 'string', required: true },
    ],
    priority: 'normal',
    isActive: true,
    isDefault: true,
    tags: ['document', 'shared'],
    createdBy: 'system',
  },
  {
    name: 'Performance Review',
    description: 'Performance review notifications',
    type: 'performance_review',
    channels: ['push', 'in_app', 'email'],
    titleTemplate: 'Performance Review: {{reviewPeriod}}',
    bodyTemplate: 'Your performance review for {{reviewPeriod}} is ready. Schedule your meeting with your manager.',
    variables: [
      { name: 'reviewPeriod', type: 'string', required: true },
    ],
    priority: 'high',
    isActive: true,
    isDefault: true,
    tags: ['performance', 'review'],
    createdBy: 'system',
  },
  {
    name: 'Policy Update',
    description: 'Company policy update notification',
    type: 'policy_update',
    channels: ['push', 'in_app', 'email'],
    titleTemplate: 'Company Policy Update',
    bodyTemplate: 'A new policy "{{policyName}}" has been added. Please review it by {{deadline}}.',
    variables: [
      { name: 'policyName', type: 'string', required: true },
      { name: 'deadline', type: 'date', required: true },
    ],
    priority: 'normal',
    isActive: true,
    isDefault: true,
    tags: ['policy', 'update'],
    createdBy: 'system',
  },
  {
    name: 'Shift Change',
    description: 'Notify about shift schedule changes',
    type: 'shift_change',
    channels: ['push', 'in_app'],
    titleTemplate: 'Shift Schedule Updated',
    bodyTemplate: 'Your shift on {{date}} has been changed to {{newShift}}. Please review your updated schedule.',
    variables: [
      { name: 'date', type: 'date', required: true },
      { name: 'newShift', type: 'string', required: true },
    ],
    priority: 'high',
    isActive: true,
    isDefault: true,
    tags: ['shift', 'schedule'],
    createdBy: 'system',
  },
  {
    name: 'Onboarding Welcome',
    description: 'Welcome new employees',
    type: 'onboarding',
    channels: ['push', 'in_app', 'email'],
    titleTemplate: 'Welcome to {{companyName}}!',
    bodyTemplate: 'Hi {{employeeName}}, welcome aboard! Your onboarding journey starts {{startDate}}. Check your tasks to get started.',
    variables: [
      { name: 'companyName', type: 'string', required: true },
      { name: 'employeeName', type: 'string', required: true },
      { name: 'startDate', type: 'date', required: true },
    ],
    priority: 'high',
    isActive: true,
    isDefault: true,
    tags: ['onboarding', 'welcome'],
    createdBy: 'system',
  },
  {
    name: 'Company Announcement',
    description: 'General company announcements',
    type: 'announcement',
    channels: ['push', 'in_app', 'email'],
    titleTemplate: '{{announcementTitle}}',
    bodyTemplate: '{{announcementBody}}',
    variables: [
      { name: 'announcementTitle', type: 'string', required: true },
      { name: 'announcementBody', type: 'string', required: true },
    ],
    priority: 'normal',
    isActive: true,
    isDefault: true,
    tags: ['announcement', 'company'],
    createdBy: 'system',
  },
];

// ==================== SEED FUNCTION ====================

async function seed(): Promise<void> {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing templates (optional - comment out to preserve existing)
    // await NotificationTemplate.deleteMany({});
    // console.log('Cleared existing templates');

    // Insert templates
    let inserted = 0;
    for (const template of defaultTemplates) {
      const exists = await NotificationTemplate.findOne({ name: template.name });
      if (!exists) {
        await NotificationTemplate.create({
          templateId: `tmpl_${uuidv4()}`,
          ...template,
        });
        inserted++;
        console.log(`Created template: ${template.name}`);
      } else {
        console.log(`Template already exists: ${template.name}`);
      }
    }

    console.log(`\nSeeding complete! Created ${inserted} new templates.`);
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

// Run seed
seed();
