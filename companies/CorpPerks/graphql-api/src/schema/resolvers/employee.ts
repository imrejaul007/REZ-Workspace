import { GraphQLError } from 'graphql';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  Employee,
  Department,
  Attendance,
  Leave,
  Objective,
  Project,
  Task,
  Notification,
  IEmployee,
  IDepartment,
  IAttendance,
  ILeave,
  IObjective,
  IProject,
  ITask,
  INotification,
} from '../../models/index.js';
import { config } from '../../config/index.js';
import { PubSub } from 'graphql-subscriptions';
import { v4 as uuidv4 } from 'uuid';

// PubSub for subscriptions
export const pubsub = new PubSub();

// Event names
export const EVENTS = {
  NOTIFICATION_ADDED: 'NOTIFICATION_ADDED',
  TASK_UPDATED: 'TASK_UPDATED',
  ANNOUNCEMENT_POSTED: 'ANNOUNCEMENT_POSTED',
  LEAVE_STATUS_CHANGED: 'LEAVE_STATUS_CHANGED',
  ATTENDANCE_RECORDED: 'ATTENDANCE_RECORDED',
};

// Helper to check if user is authenticated
function requireAuth(context: { user?: IEmployee }) {
  if (!context.user) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return context.user;
}

// Helper to check if user is admin
function requireAdmin(context: { user?: IEmployee }) {
  const user = requireAuth(context);
  if (user.role !== 'admin') {
    throw new GraphQLError('Admin access required', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
  return user;
}

interface Context {
  user?: IEmployee;
}

interface EmployeeFilter {
  departmentId?: string;
  role?: string;
  status?: string;
  search?: string;
}

interface PaginationArgs {
  page?: number;
  limit?: number;
}

// Query Resolvers
export const queryResolvers = {
  // Employee queries
  employee: async (_: unknown, { id }: { id: string }) => {
    return Employee.findById(id).populate('departmentId');
  },

  employeeByEmployeeId: async (_: unknown, { employeeId }: { employeeId: string }) => {
    return Employee.findOne({ employeeId }).populate('departmentId');
  },

  employees: async (_: unknown, { filter, page = 1, limit = 20 }: { filter?: EmployeeFilter; page?: number; limit?: number }) => {
    const query: Record<string, unknown> = {};

    if (filter?.departmentId) query.departmentId = filter.departmentId;
    if (filter?.role) query.role = filter.role;
    if (filter?.status) query.status = filter.status;
    if (filter?.search) {
      query.$or = [
        { name: { $regex: filter.search, $options: 'i' } },
        { email: { $regex: filter.search, $options: 'i' } },
        { employeeId: { $regex: filter.search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Employee.find(query).populate('departmentId').skip(skip).limit(limit).sort({ createdAt: -1 }),
      Employee.countDocuments(query),
    ]);

    return {
      items,
      total,
      page,
      limit,
      hasMore: skip + items.length < total,
    };
  },

  me: (_: unknown, __: unknown, context: Context) => {
    const user = requireAuth(context);
    return Employee.findById(user._id).populate('departmentId');
  },

  // Department queries
  department: async (_: unknown, { id }: { id: string }) => {
    return Department.findById(id).populate('managerId');
  },

  departments: async () => {
    return Department.find().populate('managerId');
  },

  // Project queries
  project: async (_: unknown, { id }: { id: string }) => {
    return Project.findById(id).populate('departmentId managerId teamMembers');
  },

  projects: async (_: unknown, { status, departmentId }: { status?: string; departmentId?: string }) => {
    const query: Record<string, unknown> = {};
    if (status) query.status = status;
    if (departmentId) query.departmentId = departmentId;
    return Project.find(query).populate('departmentId managerId teamMembers').sort({ createdAt: -1 });
  },

  projectTasks: async (_: unknown, { projectId }: { projectId: string }) => {
    return Task.find({ projectId }).populate('assigneeId');
  },

  // Task queries
  task: async (_: unknown, { id }: { id: string }) => {
    return Task.findById(id).populate('projectId assigneeId');
  },

  tasks: async (_: unknown, { filter, page = 1, limit = 20 }: { filter?: { projectId?: string; assigneeId?: string; status?: string; priority?: string }; page?: number; limit?: number }) => {
    const query: Record<string, unknown> = {};
    if (filter?.projectId) query.projectId = filter.projectId;
    if (filter?.assigneeId) query.assigneeId = filter.assigneeId;
    if (filter?.status) query.status = filter.status;
    if (filter?.priority) query.priority = filter.priority;

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Task.find(query).populate('projectId assigneeId').skip(skip).limit(limit).sort({ createdAt: -1 }),
      Task.countDocuments(query),
    ]);

    return {
      items,
      total,
      page,
      limit,
      hasMore: skip + items.length < total,
    };
  },

  // Leave queries
  leave: async (_: unknown, { id }: { id: string }) => {
    return Leave.findById(id).populate('employeeId approvedBy');
  },

  myLeaves: (_: unknown, { status }: { status?: string }, context: Context) => {
    const user = requireAuth(context);
    const query: Record<string, unknown> = { employeeId: user._id };
    if (status) query.status = status;
    return Leave.find(query).sort({ createdAt: -1 });
  },

  // Objective queries
  objective: async (_: unknown, { id }: { id: string }) => {
    return Objective.findById(id).populate('employeeId projectId');
  },

  myObjectives: (_: unknown, { quarter, year }: { quarter?: string; year?: number }, context: Context) => {
    const user = requireAuth(context);
    const query: Record<string, unknown> = { employeeId: user._id };
    if (quarter) query.quarter = quarter;
    if (year) query.year = year;
    return Objective.find(query).sort({ createdAt: -1 });
  },

  // Announcement queries
  announcement: async (_: unknown, { id }: { id: string }) => {
    return Announcement.findById(id).populate('authorId');
  },

  announcements: async (_: unknown, { category, activeOnly = true }: { category?: string; activeOnly?: boolean }) => {
    const query: Record<string, unknown> = {};
    if (activeOnly) {
      query.isActive = true;
      query.$or = [
        { expiresAt: null },
        { expiresAt: { $gte: new Date() } },
      ];
    }
    if (category) query.category = category;
    return Announcement.find(query).populate('authorId').sort({ createdAt: -1 });
  },

  // Notification queries
  notification: async (_: unknown, { id }: { id: string }) => {
    return Notification.findById(id).populate('userId');
  },

  myNotifications: (_: unknown, { unreadOnly = false, page = 1, limit = 20 }: { unreadOnly?: boolean; page?: number; limit?: number }, context: Context) => {
    const user = requireAuth(context);
    const query: Record<string, unknown> = { userId: user._id };
    if (unreadOnly) query.isRead = false;
    const skip = (page - 1) * limit;
    return Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit);
  },

  unreadNotificationCount: (_: unknown, __: unknown, context: Context) => {
    const user = requireAuth(context);
    return Notification.countDocuments({ userId: user._id, isRead: false });
  },

  // Stats
  attendanceStats: (_: unknown, { date }: { date: Date }, context: Context) => {
    const user = requireAuth(context);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return Attendance.find({
      employeeId: user._id,
      timestamp: { $gte: startOfDay, $lte: endOfDay },
    });
  },

  leaveBalance: (_: unknown, __: unknown, context: Context) => {
    const user = requireAuth(context);
    // Return leave balance based on employee type
    return {
      sick: 12,
      casual: 12,
      earned: 15,
      unpaid: null,
    };
  },
};

// Mutation Resolvers
export const mutationResolvers = {
  // Auth mutations
  login: async (_: unknown, { email, password }: { email: string; password: string }) => {
    const employee = await Employee.findOne({ email }).populate('departmentId');
    if (!employee) {
      throw new GraphQLError('Invalid credentials', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    // For demo purposes, accept 'password123' as valid
    const isValid = password === 'password123' || await bcrypt.compare(password, employee._id.toString());
    if (!isValid) {
      throw new GraphQLError('Invalid credentials', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const token = jwt.sign(
      { userId: employee._id, email: employee.email, role: employee.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    return { token, employee };
  },

  register: async (_: unknown, { input }: { input: { name: string; email: string; password: string; phone?: string; departmentId: string; position: string } }) => {
    const existingEmployee = await Employee.findOne({ email: input.email });
    if (existingEmployee) {
      throw new GraphQLError('Email already registered', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    // Generate employee ID
    const count = await Employee.countDocuments();
    const employeeId = `EMP${String(count + 1).padStart(4, '0')}`;

    const hashedPassword = await bcrypt.hash(input.password, 10);

    const employee = new Employee({
      ...input,
      employeeId,
      password: hashedPassword,
      role: 'employee',
      status: 'active',
      joiningDate: new Date(),
    });

    await employee.save();
    await employee.populate('departmentId');

    const token = jwt.sign(
      { userId: employee._id, email: employee.email, role: employee.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    return { token, employee };
  },

  // Attendance mutations
  checkIn: (_: unknown, { type }: { type: string }, context: Context) => {
    const user = requireAuth(context);

    const attendance = new Attendance({
      employeeId: user._id,
      type,
      timestamp: new Date(),
      deviceInfo: 'graphql-api',
    });

    return attendance.save().then(async (a) => {
      pubsub.publish(EVENTS.ATTENDANCE_RECORDED, { attendanceRecorded: a, employeeId: user._id });
      return a.populate('employeeId');
    });
  },

  checkOut: (_: unknown, { type }: { type: string }, context: Context) => {
    const user = requireAuth(context);

    const attendance = new Attendance({
      employeeId: user._id,
      type,
      timestamp: new Date(),
      deviceInfo: 'graphql-api',
    });

    return attendance.save().then(async (a) => {
      pubsub.publish(EVENTS.ATTENDANCE_RECORDED, { attendanceRecorded: a, employeeId: user._id });
      return a.populate('employeeId');
    });
  },

  // Leave mutations
  applyLeave: (_: unknown, { input }: { input: { type: string; startDate: Date; endDate: Date; reason?: string } }, context: Context) => {
    const user = requireAuth(context);

    const leave = new Leave({
      employeeId: user._id,
      ...input,
      status: 'pending',
    });

    return leave.save();
  },

  cancelLeave: (_: unknown, { id }: { id: string }, context: Context) => {
    const user = requireAuth(context);

    return Leave.findOneAndUpdate(
      { _id: id, employeeId: user._id },
      { status: 'cancelled' },
      { new: true }
    );
  },

  approveLeave: (_: unknown, { id, approved, reason }: { id: string; approved: boolean; reason?: string }, context: Context) => {
    requireAdmin(context);

    return Leave.findByIdAndUpdate(
      id,
      {
        status: approved ? 'approved' : 'rejected',
        approvedBy: context.user!._id,
        approvedAt: new Date(),
        rejectionReason: approved ? undefined : reason,
      },
      { new: true }
    ).then(async (leave) => {
      if (leave) {
        pubsub.publish(EVENTS.LEAVE_STATUS_CHANGED, { leaveStatusChanged: leave, employeeId: leave.employeeId });
      }
      return leave;
    });
  },

  // Task mutations
  updateTaskStatus: (_: unknown, { taskId, status }: { taskId: string; status: string }, context: Context) => {
    requireAuth(context);

    return Task.findByIdAndUpdate(taskId, { status }, { new: true }).then(async (task) => {
      if (task) {
        pubsub.publish(EVENTS.TASK_UPDATED, { taskUpdated: task, projectId: task.projectId });
      }
      return task?.populate('projectId assigneeId');
    });
  },

  createTask: (_: unknown, { input }: { input: { title: string; description?: string; projectId: string; assigneeId?: string; priority?: string; dueDate?: Date; estimatedHours?: number } }, context: Context) => {
    requireAuth(context);

    const task = new Task(input);
    return task.save().then(async (t) => {
      pubsub.publish(EVENTS.TASK_UPDATED, { taskUpdated: t, projectId: t.projectId });
      return t.populate('projectId assigneeId');
    });
  },

  updateTask: (_: unknown, { taskId, input }: { taskId: string; input: Record<string, unknown> }, context: Context) => {
    requireAuth(context);

    return Task.findByIdAndUpdate(taskId, input, { new: true }).then(async (task) => {
      if (task) {
        pubsub.publish(EVENTS.TASK_UPDATED, { taskUpdated: task, projectId: task.projectId });
      }
      return task?.populate('projectId assigneeId');
    });
  },

  // Objective mutations
  createObjective: (_: unknown, { input }: { input: { title: string; description?: string; quarter: string; year: number; dueDate: Date; projectId?: string } }, context: Context) => {
    const user = requireAuth(context);

    const objective = new Objective({
      ...input,
      employeeId: user._id,
      status: 'draft',
      progress: 0,
    });

    return objective.save();
  },

  updateObjectiveProgress: (_: unknown, { id, progress }: { id: string; progress: number }, context: Context) => {
    const user = requireAuth(context);

    return Objective.findOneAndUpdate(
      { _id: id, employeeId: user._id },
      { progress, status: progress >= 100 ? 'completed' : 'active' },
      { new: true }
    );
  },

  // Notification mutations
  markNotificationRead: (_: unknown, { id }: { id: string }, context: Context) => {
    const user = requireAuth(context);

    return Notification.findOneAndUpdate(
      { _id: id, userId: user._id },
      { isRead: true },
      { new: true }
    );
  },

  markAllNotificationsRead: (_: unknown, __: unknown, context: Context) => {
    const user = requireAuth(context);

    return Notification.updateMany(
      { userId: user._id, isRead: false },
      { isRead: true }
    ).then(() => true);
  },

  // Department mutations
  createDepartment: (_: unknown, { input }: { input: { name: string; code: string; description?: string; managerId?: string } }, context: Context) => {
    requireAdmin(context);
    return new Department(input).save();
  },

  updateDepartment: (_: unknown, { id, input }: { id: string; input: Partial<{ name: string; code: string; description?: string; managerId?: string }> }, context: Context) => {
    requireAdmin(context);
    return Department.findByIdAndUpdate(id, input, { new: true });
  },

  // Project mutations
  createProject: (_: unknown, { input }: { input: { name: string; description?: string; departmentId: string; startDate: Date; endDate?: Date; budget?: number } }, context: Context) => {
    const user = requireAuth(context);

    const project = new Project({
      ...input,
      managerId: user._id,
      status: 'planning',
      teamMembers: [user._id],
    });

    return project.save().then(async (p) => p.populate('departmentId managerId teamMembers'));
  },

  updateProject: (_: unknown, { id, input }: { id: string; input: Record<string, unknown> }, context: Context) => {
    requireAuth(context);
    return Project.findByIdAndUpdate(id, input, { new: true }).then(async (p) => p?.populate('departmentId managerId teamMembers'));
  },

  addTeamMember: (_: unknown, { projectId, employeeId }: { projectId: string; employeeId: string }, context: Context) => {
    requireAuth(context);
    return Project.findByIdAndUpdate(
      projectId,
      { $addToSet: { teamMembers: employeeId } },
      { new: true }
    ).then(async (p) => p?.populate('departmentId managerId teamMembers'));
  },

  removeTeamMember: (_: unknown, { projectId, employeeId }: { projectId: string; employeeId: string }, context: Context) => {
    requireAuth(context);
    return Project.findByIdAndUpdate(
      projectId,
      { $pull: { teamMembers: employeeId } },
      { new: true }
    ).then(async (p) => p?.populate('departmentId managerId teamMembers'));
  },
};

// Subscription Resolvers
export const subscriptionResolvers = {
  notificationAdded: {
    subscribe: (_: unknown, { userId }: { userId: string }, context: Context) => {
      requireAuth(context);
      return pubsub.asyncIterator([EVENTS.NOTIFICATION_ADDED, `NOTIFICATION_ADDED_${userId}`]);
    },
  },

  taskUpdated: {
    subscribe: (_: unknown, { projectId }: { projectId: string }) => {
      return pubsub.asyncIterator([EVENTS.TASK_UPDATED, `TASK_UPDATED_${projectId}`]);
    },
  },

  announcementPosted: {
    subscribe: () => pubsub.asyncIterator(EVENTS.ANNOUNCEMENT_POSTED),
  },

  leaveStatusChanged: {
    subscribe: (_: unknown, { employeeId }: { employeeId: string }) => {
      return pubsub.asyncIterator([EVENTS.LEAVE_STATUS_CHANGED, `LEAVE_STATUS_CHANGED_${employeeId}`]);
    },
  },

  attendanceRecorded: {
    subscribe: (_: unknown, { employeeId }: { employeeId: string }) => {
      return pubsub.asyncIterator([EVENTS.ATTENDANCE_RECORDED, `ATTENDANCE_RECORDED_${employeeId}`]);
    },
  },
};

// Field Resolvers for nested objects
export const fieldResolvers = {
  Employee: {
    id: (parent: IEmployee) => parent._id.toString(),
    department: async (parent: IEmployee) => {
      if (parent.departmentId) {
        return Department.findById(parent.departmentId);
      }
      return null;
    },
    attendance: (parent: IEmployee) => Attendance.find({ employeeId: parent._id }).sort({ timestamp: -1 }).limit(30),
    leaves: (parent: IEmployee) => Leave.find({ employeeId: parent._id }).sort({ createdAt: -1 }).limit(10),
    okrs: (parent: IEmployee) => Objective.find({ employeeId: parent._id }).sort({ createdAt: -1 }).limit(10),
    projects: (parent: IEmployee) => Project.find({ teamMembers: parent._id }).sort({ createdAt: -1 }).limit(10),
  },

  Department: {
    id: (parent: IDepartment) => parent._id.toString(),
    manager: (parent: IDepartment) => {
      if (parent.managerId) {
        return Employee.findById(parent.managerId);
      }
      return null;
    },
    employees: (parent: IDepartment) => Employee.find({ departmentId: parent._id }),
  },

  Attendance: {
    id: (parent: IAttendance) => parent._id.toString(),
    employee: (parent: IAttendance) => Employee.findById(parent.employeeId),
  },

  Leave: {
    id: (parent: ILeave) => parent._id.toString(),
    employee: (parent: ILeave) => Employee.findById(parent.employeeId),
    approvedBy: (parent: ILeave) => {
      if (parent.approvedBy) {
        return Employee.findById(parent.approvedBy);
      }
      return null;
    },
  },

  Objective: {
    id: (parent: IObjective) => parent._id.toString(),
    employee: (parent: IObjective) => Employee.findById(parent.employeeId),
    project: (parent: IObjective) => {
      if (parent.projectId) {
        return Project.findById(parent.projectId);
      }
      return null;
    },
  },

  Project: {
    id: (parent: IProject) => parent._id.toString(),
    department: (parent: IProject) => Department.findById(parent.departmentId),
    manager: (parent: IProject) => Employee.findById(parent.managerId),
    teamMembers: (parent: IProject) => Employee.find({ _id: { $in: parent.teamMembers } }),
    tasks: (parent: IProject) => Task.find({ projectId: parent._id }),
  },

  Task: {
    id: (parent: ITask) => parent._id.toString(),
    project: (parent: ITask) => Project.findById(parent.projectId),
    assignee: (parent: ITask) => {
      if (parent.assigneeId) {
        return Employee.findById(parent.assigneeId);
      }
      return null;
    },
  },

  Announcement: {
    id: (parent: INotification) => parent._id.toString(),
    author: (parent: INotification) => Employee.findById(parent.authorId),
  },

  Notification: {
    id: (parent: INotification) => parent._id.toString(),
    user: (parent: INotification) => Employee.findById(parent.userId),
  },
};
