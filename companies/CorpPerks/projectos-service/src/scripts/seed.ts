import mongoose from 'mongoose';
import { Project, Task, Sprint, Milestone, TimeEntry, WorkLog } from '../models/index.js';
import { createLogger } from '../utils/logger.js';
import {
  generateProjectId,
  generateTaskId,
  generateSprintId,
  generateMilestoneId
} from '../utils/idGenerator.js';

const logger = createLogger('seed');

// Demo data
const employees = [
  { id: 'EMP001', name: 'Rahul Sharma', role: 'Project Manager' },
  { id: 'EMP002', name: 'Priya Patel', role: 'Senior Developer' },
  { id: 'EMP003', name: 'Amit Kumar', role: 'UI/UX Designer' },
  { id: 'EMP004', name: 'Sneha Reddy', role: 'Backend Developer' },
  { id: 'EMP005', name: 'Vikram Singh', role: 'QA Engineer' },
  { id: 'EMP006', name: 'Ananya Gupta', role: 'DevOps Engineer' },
  { id: 'EMP007', name: 'Rajesh Verma', role: 'Tech Lead' },
  { id: 'EMP008', name: 'Kavita Nair', role: 'Business Analyst' }
];

interface TaskTemplate {
  title: string;
  status: 'todo' | 'in_progress' | 'done' | 'blocked';
  hours: number;
}

const taskTemplates: TaskTemplate[] = [
  { title: 'Setup project repository', status: 'done', hours: 4 },
  { title: 'Configure CI/CD pipeline', status: 'done', hours: 8 },
  { title: 'Design database schema', status: 'done', hours: 6 },
  { title: 'Implement authentication', status: 'done', hours: 16 },
  { title: 'Create API endpoints', status: 'in_progress', hours: 12 },
  { title: 'Build user dashboard', status: 'in_progress', hours: 20 },
  { title: 'Implement search functionality', status: 'todo', hours: 8 },
  { title: 'Add notification system', status: 'todo', hours: 12 },
  { title: 'Write unit tests', status: 'todo', hours: 16 },
  { title: 'Performance optimization', status: 'blocked', hours: 8 },
  { title: 'Documentation', status: 'todo', hours: 4 },
  { title: 'Security audit fixes', status: 'todo', hours: 12 }
];

async function seed() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/projectos';
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Clear existing data
    logger.info('Clearing existing data...');
    await Promise.all([
      Project.deleteMany({}),
      Task.deleteMany({}),
      Sprint.deleteMany({}),
      Milestone.deleteMany({}),
      TimeEntry.deleteMany({}),
      WorkLog.deleteMany({})
    ]);

    // Create Projects
    logger.info('Creating projects...');
    const now = new Date();
    const projects = await Project.insertMany([
      {
        projectId: generateProjectId(),
        name: 'CorpHR Platform Upgrade',
        description: 'Major upgrade of the HR platform with new performance management features.',
        departmentId: 'DEPT001',
        managerId: 'EMP001',
        teamMembers: ['EMP001', 'EMP002', 'EMP003', 'EMP004', 'EMP005'],
        status: 'active',
        priority: 'high',
        startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
        budget: 2500000,
        spentAmount: 875000,
        clientName: 'Internal',
        health: 72,
        completionPercentage: 35,
        aiRisks: [],
        tags: ['hr', 'platform', 'upgrade']
      },
      {
        projectId: generateProjectId(),
        name: 'Mobile App v2.0',
        description: 'Complete redesign and rebuild of the mobile application.',
        departmentId: 'DEPT001',
        managerId: 'EMP007',
        teamMembers: ['EMP002', 'EMP003', 'EMP004', 'EMP006'],
        status: 'active',
        priority: 'critical',
        startDate: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        budget: 5000000,
        spentAmount: 3200000,
        clientName: 'Internal',
        health: 58,
        completionPercentage: 64,
        aiRisks: [],
        tags: ['mobile', 'react-native', 'redesign']
      },
      {
        projectId: generateProjectId(),
        name: 'Data Analytics Dashboard',
        description: 'Real-time analytics dashboard for business intelligence.',
        departmentId: 'DEPT001',
        managerId: 'EMP008',
        teamMembers: ['EMP002', 'EMP004', 'EMP005'],
        status: 'active',
        priority: 'medium',
        startDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000),
        budget: 1800000,
        spentAmount: 950000,
        clientName: 'Internal',
        health: 85,
        completionPercentage: 52,
        aiRisks: [],
        tags: ['analytics', 'dashboard', 'bi']
      },
      {
        projectId: generateProjectId(),
        name: 'Security Audit & Compliance',
        description: 'Comprehensive security audit and SOC2 compliance preparation.',
        departmentId: 'DEPT004',
        managerId: 'EMP001',
        teamMembers: ['EMP006', 'EMP007', 'EMP005'],
        status: 'planning',
        priority: 'high',
        startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
        budget: 1200000,
        spentAmount: 0,
        clientName: 'Internal',
        health: 100,
        completionPercentage: 0,
        aiRisks: [],
        tags: ['security', 'compliance', 'audit']
      },
      {
        projectId: generateProjectId(),
        name: 'Customer Portal Redesign',
        description: 'Modern redesign of customer-facing portal.',
        departmentId: 'DEPT002',
        managerId: 'EMP003',
        teamMembers: ['EMP003', 'EMP002', 'EMP004'],
        status: 'active',
        priority: 'medium',
        startDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 40 * 24 * 60 * 60 * 1000),
        budget: 1500000,
        spentAmount: 450000,
        clientName: 'Acme Corp',
        health: 68,
        completionPercentage: 30,
        aiRisks: [],
        tags: ['portal', 'redesign', 'ux']
      }
    ]);

    logger.info(`Created ${projects.length} projects`);

    // Create Milestones
    logger.info('Creating milestones...');
    const milestones = await Milestone.insertMany([
      {
        milestoneId: generateMilestoneId(),
        projectId: projects[0].projectId,
        name: 'Phase 1: Core Infrastructure',
        description: 'Setup core infrastructure and authentication',
        dueDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        status: 'completed',
        completionPercentage: 100,
        deliverables: ['Auth system', 'Database setup', 'API gateway']
      },
      {
        milestoneId: generateMilestoneId(),
        projectId: projects[0].projectId,
        name: 'Phase 2: Employee Management',
        description: 'Employee management module development',
        dueDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
        status: 'in_progress',
        completionPercentage: 60,
        deliverables: ['CRUD operations', 'Bulk import', 'Reporting']
      },
      {
        milestoneId: generateMilestoneId(),
        projectId: projects[0].projectId,
        name: 'Phase 3: Performance Reviews',
        description: 'Performance review system implementation',
        dueDate: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000),
        status: 'pending',
        completionPercentage: 0,
        deliverables: ['Goal setting', '360 feedback', 'Analytics']
      }
    ]);

    logger.info(`Created ${milestones.length} milestones`);

    // Create Sprints
    logger.info('Creating sprints...');
    const sprints = await Sprint.insertMany([
      {
        sprintId: generateSprintId(),
        projectId: projects[0].projectId,
        name: 'Sprint 1 - Foundation',
        goal: 'Set up core infrastructure',
        startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() - 16 * 24 * 60 * 60 * 1000),
        status: 'completed',
        plannedPoints: 21,
        completedPoints: 21,
        velocity: 21
      },
      {
        sprintId: generateSprintId(),
        projectId: projects[0].projectId,
        name: 'Sprint 2 - Core Features',
        goal: 'Implement core employee features',
        startDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        status: 'completed',
        plannedPoints: 34,
        completedPoints: 29,
        velocity: 29
      },
      {
        sprintId: generateSprintId(),
        projectId: projects[0].projectId,
        name: 'Sprint 3 - Integration',
        goal: 'API integration and testing',
        startDate: now,
        endDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
        status: 'active',
        plannedPoints: 28,
        completedPoints: 8,
        velocity: 0
      }
    ]);

    logger.info(`Created ${sprints.length} sprints`);

    // Create Tasks
    logger.info('Creating tasks...');
    const allTasks: any[] = [];
    let lastTaskId: string | undefined;

    for (const project of projects) {
      for (let i = 0; i < taskTemplates.length; i++) {
        const template = taskTemplates[i];
        const dueDate = new Date(now.getTime() + (Math.random() * 60 - 10) * 24 * 60 * 60 * 1000);
        const taskId = generateTaskId();

        const task = {
          taskId,
          projectId: project.projectId,
          milestoneId: milestones.find(m => m.projectId === project.projectId && m.status === 'in_progress')?.milestoneId,
          sprintId: sprints.find(s => s.projectId === project.projectId && s.status === 'active')?.sprintId,
          title: `${template.title} - ${project.name.split(' ')[0]}`,
          description: `Task for ${project.name}: ${template.title}`,
          assigneeId: project.teamMembers[Math.floor(Math.random() * project.teamMembers.length)],
          assigneeName: employees.find(e => e.id === project.teamMembers[Math.floor(Math.random() * project.teamMembers.length)])?.name || 'Unknown',
          status: template.status,
          priority: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
          estimatedHours: template.hours,
          actualHours: template.status === 'done' ? template.hours + Math.floor(Math.random() * 4) : 0,
          dueDate,
          dependencies: lastTaskId ? [lastTaskId] : [],
          subtasks: [
            { _id: `ST-${i}001`, title: 'Subtask 1', completed: template.status === 'done' },
            { _id: `ST-${i}002`, title: 'Subtask 2', completed: template.status === 'done' }
          ],
          attachments: [],
          comments: template.status !== 'todo' ? [
            {
              _id: `CMT-${i}001`,
              authorId: 'EMP001',
              authorName: 'Rahul Sharma',
              content: 'Starting work on this task.',
              createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
            }
          ] : [],
          storyPoints: [1, 2, 3, 5, 8, 13][Math.floor(Math.random() * 6)],
          tags: project.tags,
          completionDate: template.status === 'done' ? new Date(now.getTime() - Math.random() * 10 * 24 * 60 * 60 * 1000) : undefined
        };

        allTasks.push(task);
        lastTaskId = taskId;
      }
    }

    await Task.insertMany(allTasks);
    logger.info(`Created ${allTasks.length} tasks`);

    // Create Time Entries
    logger.info('Creating time entries...');
    const timeEntries: any[] = [];
    for (const project of projects) {
      for (const memberId of project.teamMembers) {
        const emp = employees.find(e => e.id === memberId);
        if (!emp) continue;

        for (let d = 14; d >= 0; d--) {
          const date = new Date(now);
          date.setDate(date.getDate() - d);

          const entryCount = Math.floor(Math.random() * 3) + 1;
          for (let e = 0; e < entryCount; e++) {
            const hours = Math.random() * 6 + 2;
            const isOvertime = Math.random() < 0.1;

            timeEntries.push({
              employeeId: memberId,
              employeeName: emp.name,
              projectId: project.projectId,
              projectName: project.name,
              date,
              hours: Math.round(hours * 2) / 2,
              description: `Work on ${project.name}`,
              type: isOvertime ? 'overtime' : 'project'
            });
          }
        }
      }
    }

    await TimeEntry.insertMany(timeEntries);
    logger.info(`Created ${timeEntries.length} time entries`);

    // Create Work Logs
    logger.info('Creating work logs...');
    const workLogs: any[] = [];
    for (const emp of employees) {
      for (let d = 7; d >= 0; d--) {
        const date = new Date(now);
        date.setDate(date.getDate() - d);
        date.setHours(0, 0, 0, 0);

        const tasksWorked = allTasks
          .filter((t: any) => t.assigneeId === emp.id && t.status !== 'todo')
          .slice(0, 3)
          .map((t: any) => ({
            taskId: t.taskId,
            taskTitle: t.title,
            status: t.status
          }));

        workLogs.push({
          employeeId: emp.id,
          employeeName: emp.name,
          date,
          completed: `Completed ${tasksWorked.length} tasks today. Progress on ongoing items.`,
          blockers: d % 5 === 0 ? 'Waiting for design specs from client' : '',
          tomorrowPlan: 'Continue with current sprint tasks and attend standup meeting.',
          tasksWorkedOn: tasksWorked,
          submittedAt: new Date(date.getTime() + 17 * 60 * 60 * 1000)
        });
      }
    }

    await WorkLog.insertMany(workLogs);
    logger.info(`Created ${workLogs.length} work logs`);

    logger.info('Seed completed successfully!');
    logger.info(`Summary:
      - ${projects.length} projects
      - ${milestones.length} milestones
      - ${sprints.length} sprints
      - ${allTasks.length} tasks
      - ${timeEntries.length} time entries
      - ${workLogs.length} work logs`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error('Seed failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seed();
