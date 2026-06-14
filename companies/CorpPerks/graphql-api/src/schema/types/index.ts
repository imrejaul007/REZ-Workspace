export const typeDefs = `#graphql
  scalar DateTime
  scalar JSON

  # Enums
  enum AttendanceType {
    check_in
    check_out
    break_start
    break_end
  }

  enum LeaveStatus {
    pending
    approved
    rejected
    cancelled
  }

  enum LeaveType {
    sick
    casual
    earned
    unpaid
    maternity
    paternity
    bereavement
  }

  enum ObjectiveStatus {
    draft
    active
    completed
    cancelled
  }

  enum ProjectStatus {
    planning
    active
    on_hold
    completed
    cancelled
  }

  enum TaskStatus {
    todo
    in_progress
    review
    done
    blocked
  }

  enum TaskPriority {
    low
    medium
    high
    critical
  }

  enum NotificationType {
    info
    success
    warning
    error
  }

  enum NotificationCategory {
    attendance
    leave
    project
    task
    announcement
    system
  }

  # Core Types
  type Department {
    id: ID!
    name: String!
    code: String!
    description: String
    manager: Employee
    employees: [Employee!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Employee {
    id: ID!
    employeeId: String!
    name: String!
    email: String!
    phone: String
    department: Department!
    role: String!
    position: String!
    joiningDate: DateTime!
    status: String!
    avatar: String
    attendance: [Attendance!]!
    leaves: [Leave!]!
    okrs: [Objective!]!
    projects: [Project!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Attendance {
    id: ID!
    employee: Employee!
    type: AttendanceType!
    timestamp: DateTime!
    location: JSON
    deviceInfo: String
    createdAt: DateTime!
  }

  type Leave {
    id: ID!
    employee: Employee!
    type: LeaveType!
    startDate: DateTime!
    endDate: DateTime!
    reason: String
    status: LeaveStatus!
    approvedBy: Employee
    approvedAt: DateTime
    rejectionReason: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Objective {
    id: ID!
    title: String!
    description: String
    employee: Employee!
    project: Project
    quarter: String!
    year: Int!
    progress: Int!
    status: ObjectiveStatus!
    dueDate: DateTime!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Project {
    id: ID!
    name: String!
    description: String
    department: Department!
    manager: Employee!
    status: ProjectStatus!
    startDate: DateTime!
    endDate: DateTime
    budget: Float
    teamMembers: [Employee!]!
    tasks: [Task!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Task {
    id: ID!
    title: String!
    description: String
    project: Project!
    assignee: Employee
    status: TaskStatus!
    priority: TaskPriority!
    dueDate: DateTime
    estimatedHours: Float
    actualHours: Float
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Announcement {
    id: ID!
    title: String!
    content: String!
    author: Employee!
    priority: String!
    category: String!
    isActive: Boolean!
    expiresAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Notification {
    id: ID!
    user: Employee!
    title: String!
    message: String!
    type: NotificationType!
    category: NotificationCategory!
    isRead: Boolean!
    actionUrl: String
    createdAt: DateTime!
  }

  # Auth Types
  type AuthPayload {
    token: String!
    employee: Employee!
  }

  # Pagination
  type PaginatedEmployees {
    items: [Employee!]!
    total: Int!
    page: Int!
    limit: Int!
    hasMore: Boolean!
  }

  type PaginatedTasks {
    items: [Task!]!
    total: Int!
    page: Int!
    limit: Int!
    hasMore: Boolean!
  }

  # Input Types
  input EmployeeFilter {
    departmentId: ID
    role: String
    status: String
    search: String
  }

  input LeaveInput {
    type: LeaveType!
    startDate: DateTime!
    endDate: DateTime!
    reason: String
  }

  input TaskFilter {
    projectId: ID
    assigneeId: ID
    status: TaskStatus
    priority: TaskPriority
  }

  # Query
  type Query {
    # Employee queries
    employee(id: ID!): Employee
    employeeByEmployeeId(employeeId: String!): Employee
    employees(filter: EmployeeFilter, page: Int, limit: Int): PaginatedEmployees!
    me: Employee!

    # Department queries
    department(id: ID!): Department
    departments: [Department!]!

    # Project queries
    project(id: ID!): Project
    projects(status: ProjectStatus, departmentId: ID): [Project!]!
    projectTasks(projectId: ID!): [Task!]!

    # Task queries
    task(id: ID!): Task
    tasks(filter: TaskFilter, page: Int, limit: Int): PaginatedTasks!

    # Leave queries
    leave(id: ID!): Leave
    myLeaves(status: LeaveStatus): [Leave!]!

    # OKR queries
    objective(id: ID!): Objective
    myObjectives(quarter: String, year: Int): [Objective!]!

    # Announcement queries
    announcement(id: ID!): Announcement
    announcements(category: String, activeOnly: Boolean): [Announcement!]!

    # Notification queries
    notification(id: ID!): Notification
    myNotifications(unreadOnly: Boolean, page: Int, limit: Int): [Notification!]!
    unreadNotificationCount: Int!

    # Stats
    attendanceStats(date: DateTime!): JSON
    leaveBalance: JSON
  }

  # Mutations
  type Mutation {
    # Auth
    login(email: String!, password: String!): AuthPayload!
    register(input: RegisterInput!): AuthPayload!

    # Attendance
    checkIn(type: AttendanceType!): Attendance!
    checkOut(type: AttendanceType!): Attendance!

    # Leave
    applyLeave(input: LeaveInput!): Leave!
    cancelLeave(id: ID!): Leave!
    approveLeave(id: ID!, approved: Boolean!, reason: String): Leave!

    # Task
    updateTaskStatus(taskId: ID!, status: TaskStatus!): Task!
    createTask(input: TaskInput!): Task!
    updateTask(taskId: ID!, input: TaskUpdateInput!): Task!

    # Objective
    createObjective(input: ObjectiveInput!): Objective!
    updateObjectiveProgress(id: ID!, progress: Int!): Objective!

    # Notification
    markNotificationRead(id: ID!): Notification!
    markAllNotificationsRead: Boolean!

    # Department
    createDepartment(input: DepartmentInput!): Department!
    updateDepartment(id: ID!, input: DepartmentInput!): Department!

    # Project
    createProject(input: ProjectInput!): Project!
    updateProject(id: ID!, input: ProjectUpdateInput!): Project!
    addTeamMember(projectId: ID!, employeeId: ID!): Project!
    removeTeamMember(projectId: ID!, employeeId: ID!): Project!
  }

  # Subscriptions
  type Subscription {
    notificationAdded(userId: ID!): Notification!
    taskUpdated(projectId: ID!): Task!
    announcementPosted: Announcement!
    leaveStatusChanged(employeeId: ID!): Leave!
    attendanceRecorded(employeeId: ID!): Attendance!
  }

  # Input definitions for mutations
  input RegisterInput {
    name: String!
    email: String!
    password: String!
    phone: String
    departmentId: ID!
    position: String!
  }

  input TaskInput {
    title: String!
    description: String
    projectId: ID!
    assigneeId: ID
    priority: TaskPriority
    dueDate: DateTime
    estimatedHours: Float
  }

  input TaskUpdateInput {
    title: String
    description: String
    assigneeId: ID
    status: TaskStatus
    priority: TaskPriority
    dueDate: DateTime
    estimatedHours: Float
    actualHours: Float
  }

  input ObjectiveInput {
    title: String!
    description: String
    quarter: String!
    year: Int!
    dueDate: DateTime!
    projectId: ID
  }

  input DepartmentInput {
    name: String!
    code: String!
    description: String
    managerId: ID
  }

  input ProjectInput {
    name: String!
    description: String
    departmentId: ID!
    startDate: DateTime!
    endDate: DateTime
    budget: Float
  }

  input ProjectUpdateInput {
    name: String
    description: String
    status: ProjectStatus
    endDate: DateTime
    budget: Float
  }
`;
