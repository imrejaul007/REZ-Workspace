import {
  Employee,
  Ticket,
  TicketMessage,
  ChatSession,
  KnowledgeArticle,
  CannedResponse,
  SupportStats,
  ReportData,
} from '@/types';

// Support agents
export const supportAgents: Employee[] = [
  {
    id: 'agent-1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@corpperks.com',
    department: 'HR Support',
    role: 'Senior Support Agent',
    chatStatus: 'online',
  },
  {
    id: 'agent-2',
    name: 'Mike Chen',
    email: 'mike.chen@corpperks.com',
    department: 'HR Support',
    role: 'Support Agent',
    chatStatus: 'online',
  },
  {
    id: 'agent-3',
    name: 'Emily Davis',
    email: 'emily.davis@corpperks.com',
    department: 'HR Support',
    role: 'Support Agent',
    chatStatus: 'busy',
  },
];

// Employees seeking support
export const employees: Employee[] = [
  {
    id: 'emp-1',
    name: 'John Smith',
    email: 'john.smith@corpperks.com',
    department: 'Engineering',
    role: 'Software Engineer',
    chatStatus: 'online',
  },
  {
    id: 'emp-2',
    name: 'Lisa Wang',
    email: 'lisa.wang@corpperks.com',
    department: 'Marketing',
    role: 'Marketing Manager',
    chatStatus: 'online',
  },
  {
    id: 'emp-3',
    name: 'David Brown',
    email: 'david.brown@corpperks.com',
    department: 'Sales',
    role: 'Sales Representative',
    chatStatus: 'offline',
  },
  {
    id: 'emp-4',
    name: 'Amanda Miller',
    email: 'amanda.miller@corpperks.com',
    department: 'Finance',
    role: 'Financial Analyst',
    chatStatus: 'online',
  },
  {
    id: 'emp-5',
    name: 'Robert Taylor',
    email: 'robert.taylor@corpperks.com',
    department: 'Engineering',
    role: 'Tech Lead',
    chatStatus: 'busy',
  },
];

// Generate realistic dates
const now = new Date();
const hoursAgo = (hours: number) => new Date(now.getTime() - hours * 60 * 60 * 1000);
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

// Tickets
export const tickets: Ticket[] = [
  {
    id: 'TKT-001',
    title: 'Issue with monthly salary calculation',
    description: 'My salary for this month shows an incorrect amount. The deductions for health insurance seem higher than usual.',
    status: 'open',
    priority: 'high',
    category: 'payroll',
    employee: employees[0],
    assignedTo: supportAgents[0],
    createdAt: hoursAgo(2),
    updatedAt: hoursAgo(1),
    slaDeadline: hoursAgo(-4), // 4 hours from now
    tags: ['payroll', 'salary', 'deductions'],
    messages: [
      {
        id: 'msg-1',
        ticketId: 'TKT-001',
        sender: employees[0],
        content: 'Hi, I noticed my salary this month is different. Can you help me understand the calculation?',
        type: 'text',
        createdAt: hoursAgo(2),
        isInternal: false,
        attachments: [],
      },
      {
        id: 'msg-2',
        ticketId: 'TKT-001',
        sender: supportAgents[0],
        content: 'Hi John, I would be happy to help you with this. Let me look into your salary details.',
        type: 'text',
        createdAt: hoursAgo(1.5),
        isInternal: false,
        attachments: [],
      },
    ],
    attachments: [],
  },
  {
    id: 'TKT-002',
    title: 'Request for leave balance clarification',
    description: 'I need to understand my remaining leave balance. The system shows different numbers than what I expected.',
    status: 'in_progress',
    priority: 'medium',
    category: 'leave',
    employee: employees[1],
    assignedTo: supportAgents[1],
    createdAt: hoursAgo(8),
    updatedAt: hoursAgo(3),
    slaDeadline: hoursAgo(-20),
    tags: ['leave', 'balance', 'pto'],
    messages: [
      {
        id: 'msg-3',
        ticketId: 'TKT-002',
        sender: employees[1],
        content: 'Hello, I am trying to plan a vacation but my leave balance seems incorrect.',
        type: 'text',
        createdAt: hoursAgo(8),
        isInternal: false,
        attachments: [],
      },
      {
        id: 'msg-4',
        ticketId: 'TKT-002',
        sender: supportAgents[1],
        content: 'Hi Lisa, I am checking your leave records now. Can you tell me what balance you expected?',
        type: 'text',
        createdAt: hoursAgo(7),
        isInternal: false,
        attachments: [],
      },
      {
        id: 'msg-5',
        ticketId: 'TKT-002',
        sender: employees[1],
        content: 'I should have 15 days remaining but the system shows only 12.',
        type: 'text',
        createdAt: hoursAgo(6),
        isInternal: false,
        attachments: [],
      },
      {
        id: 'msg-6',
        ticketId: 'TKT-002',
        sender: supportAgents[1],
        content: 'Internal note: Checking with payroll for leave carryover adjustments.',
        type: 'text',
        createdAt: hoursAgo(3),
        isInternal: true,
        attachments: [],
      },
    ],
    attachments: [],
  },
  {
    id: 'TKT-003',
    title: 'Cannot access onboarding portal',
    description: 'New employee cannot log into the onboarding portal. Getting "Invalid credentials" error.',
    status: 'pending',
    priority: 'urgent',
    category: 'onboarding',
    employee: employees[2],
    createdAt: daysAgo(1),
    updatedAt: hoursAgo(12),
    slaDeadline: hoursAgo(-12),
    tags: ['onboarding', 'access', 'login'],
    messages: [
      {
        id: 'msg-7',
        ticketId: 'TKT-003',
        sender: employees[2],
        content: 'I am a new hire and cannot access the onboarding portal. My start date is tomorrow!',
        type: 'text',
        createdAt: daysAgo(1),
        isInternal: false,
        attachments: [],
      },
    ],
    attachments: [],
  },
  {
    id: 'TKT-004',
    title: 'Benefits enrollment deadline extension',
    description: 'The open enrollment period ends tomorrow and I have not been able to complete my selections.',
    status: 'open',
    priority: 'high',
    category: 'benefits',
    employee: employees[3],
    createdAt: hoursAgo(4),
    updatedAt: hoursAgo(4),
    slaDeadline: hoursAgo(-20),
    tags: ['benefits', 'enrollment', 'deadline'],
    messages: [
      {
        id: 'msg-8',
        ticketId: 'TKT-004',
        sender: employees[3],
        content: 'I need more time to complete my benefits enrollment. Can the deadline be extended?',
        type: 'text',
        createdAt: hoursAgo(4),
        isInternal: false,
        attachments: [],
      },
    ],
    attachments: [],
  },
  {
    id: 'TKT-005',
    title: 'Performance review timeline question',
    description: 'When will the Q2 performance reviews be scheduled? Need to prepare my self-assessment.',
    status: 'resolved',
    priority: 'low',
    category: 'performance',
    employee: employees[4],
    assignedTo: supportAgents[0],
    createdAt: daysAgo(3),
    updatedAt: daysAgo(1),
    resolvedAt: daysAgo(1),
    tags: ['performance', 'review', 'timeline'],
    messages: [
      {
        id: 'msg-9',
        ticketId: 'TKT-005',
        sender: employees[4],
        content: 'Hi, I wanted to know when Q2 reviews will be scheduled.',
        type: 'text',
        createdAt: daysAgo(3),
        isInternal: false,
        attachments: [],
      },
      {
        id: 'msg-10',
        ticketId: 'TKT-005',
        sender: supportAgents[0],
        content: 'Hi Robert, Q2 reviews are scheduled for the last two weeks of June. Your manager will reach out soon.',
        type: 'text',
        createdAt: daysAgo(2),
        isInternal: false,
        attachments: [],
      },
    ],
    attachments: [],
    satisfactionRating: 5,
  },
  {
    id: 'TKT-006',
    title: 'HR Policy clarification - Remote work',
    description: 'What is the current policy on remote work days per week? Conflicting information from different sources.',
    status: 'in_progress',
    priority: 'medium',
    category: 'hr_policy',
    employee: employees[0],
    assignedTo: supportAgents[2],
    createdAt: daysAgo(2),
    updatedAt: hoursAgo(5),
    tags: ['remote-work', 'policy', 'wfh'],
    messages: [
      {
        id: 'msg-11',
        ticketId: 'TKT-006',
        sender: employees[0],
        content: 'I heard different things about remote work policy. Can you clarify?',
        type: 'text',
        createdAt: daysAgo(2),
        isInternal: false,
        attachments: [],
      },
    ],
    attachments: [],
  },
  {
    id: 'TKT-007',
    title: 'Tax document not received',
    description: 'I have not received my Form 16 for the previous financial year.',
    status: 'open',
    priority: 'medium',
    category: 'payroll',
    employee: employees[1],
    createdAt: daysAgo(5),
    updatedAt: daysAgo(3),
    tags: ['tax', 'document', 'form16'],
    messages: [
      {
        id: 'msg-12',
        ticketId: 'TKT-007',
        sender: employees[1],
        content: 'I need my Form 16 for tax filing. Where can I find it?',
        type: 'text',
        createdAt: daysAgo(5),
        isInternal: false,
        attachments: [],
      },
    ],
    attachments: [],
  },
  {
    id: 'TKT-008',
    title: 'Manager change request',
    description: 'Due to organizational changes, I need to update my reporting manager in the system.',
    status: 'pending',
    priority: 'low',
    category: 'hr_policy',
    employee: employees[2],
    assignedTo: supportAgents[1],
    createdAt: daysAgo(4),
    updatedAt: daysAgo(2),
    tags: ['manager', 'reporting', 'org-change'],
    messages: [
      {
        id: 'msg-13',
        ticketId: 'TKT-008',
        sender: employees[2],
        content: 'Please update my reporting manager from Jane Doe to John Smith.',
        type: 'text',
        createdAt: daysAgo(4),
        isInternal: false,
        attachments: [],
      },
    ],
    attachments: [],
  },
];

// Chat sessions
export const chatSessions: ChatSession[] = [
  {
    id: 'chat-1',
    employee: employees[0],
    supportAgent: supportAgents[0],
    startedAt: hoursAgo(0.5),
    status: 'active',
    isTyping: false,
    messages: [
      {
        id: 'chat-msg-1',
        sessionId: 'chat-1',
        sender: employees[0],
        content: 'Hi, I need help with my expense report',
        type: 'text',
        createdAt: hoursAgo(0.5),
        isRead: true,
      },
      {
        id: 'chat-msg-2',
        sessionId: 'chat-1',
        sender: 'agent',
        content: 'Hi John! I am here to help. What seems to be the issue with your expense report?',
        type: 'text',
        createdAt: hoursAgo(0.4),
        isRead: true,
      },
      {
        id: 'chat-msg-3',
        sessionId: 'chat-1',
        sender: employees[0],
        content: 'My travel expenses from last week are showing as rejected',
        type: 'text',
        createdAt: hoursAgo(0.3),
        isRead: true,
      },
      {
        id: 'chat-msg-4',
        sessionId: 'chat-1',
        sender: 'agent',
        content: 'Let me check that for you. Can you provide the expense report ID?',
        type: 'text',
        createdAt: hoursAgo(0.2),
        isRead: true,
      },
    ],
  },
  {
    id: 'chat-2',
    employee: employees[1],
    supportAgent: supportAgents[1],
    startedAt: hoursAgo(1),
    status: 'active',
    isTyping: true,
    messages: [
      {
        id: 'chat-msg-5',
        sessionId: 'chat-2',
        sender: employees[1],
        content: 'Hello',
        type: 'text',
        createdAt: hoursAgo(1),
        isRead: true,
      },
      {
        id: 'chat-msg-6',
        sessionId: 'chat-2',
        sender: 'agent',
        content: 'Hi Lisa! How can I assist you today?',
        type: 'text',
        createdAt: hoursAgo(0.9),
        isRead: true,
      },
    ],
  },
  {
    id: 'chat-3',
    employee: employees[3],
    supportAgent: supportAgents[2],
    startedAt: hoursAgo(3),
    endedAt: hoursAgo(2),
    status: 'ended',
    isTyping: false,
    messages: [
      {
        id: 'chat-msg-7',
        sessionId: 'chat-3',
        sender: employees[3],
        content: 'I need help resetting my password',
        type: 'text',
        createdAt: hoursAgo(3),
        isRead: true,
      },
      {
        id: 'chat-msg-8',
        sessionId: 'chat-3',
        sender: 'agent',
        content: 'I can help you with that. Please use the forgot password link on the login page.',
        type: 'text',
        createdAt: hoursAgo(2.9),
        isRead: true,
      },
      {
        id: 'chat-msg-9',
        sessionId: 'chat-3',
        sender: employees[3],
        content: 'Thank you! It worked.',
        type: 'text',
        createdAt: hoursAgo(2),
        isRead: true,
      },
    ],
  },
];

// Knowledge base articles
export const knowledgeArticles: KnowledgeArticle[] = [
  {
    id: 'kb-1',
    title: 'How to Request Time Off',
    content: `## Requesting Time Off

This guide explains how to request time off through the CorpPerks HR system.

### Steps to Request Time Off

1. Log in to the HR portal
2. Navigate to "My Leave" section
3. Click on "Request Leave"
4. Select the type of leave (Annual, Sick, Personal)
5. Choose your dates
6. Add any notes or comments
7. Submit for approval

### Leave Types Available

- **Annual Leave**: 20 days per year (accrued monthly)
- **Sick Leave**: 10 days per year
- **Personal Leave**: 5 days per year
- **Parental Leave**: As per company policy

### Approval Workflow

Your request will be sent to your direct manager for approval. You will receive a notification once a decision is made.

### Important Notes

- Submit requests at least 5 business days in advance for planned leave
- Sick leave should be reported within 24 hours
- Check your leave balance before requesting`,
    category: 'procedures',
    tags: ['leave', 'time-off', 'pto', 'request'],
    views: 1250,
    helpful: 89,
    notHelpful: 3,
    createdAt: daysAgo(90),
    updatedAt: daysAgo(30),
    author: supportAgents[0],
    isPublished: true,
    relatedArticles: ['kb-2', 'kb-5'],
  },
  {
    id: 'kb-2',
    title: 'Understanding Your Leave Balance',
    content: `## Leave Balance Explained

This article explains how leave balances are calculated and displayed in the system.

### How Balances Are Calculated

Your leave balance is updated monthly based on:
- Leave accrual rate
- Leave taken
- Carryover from previous year
- Lapse dates

### Viewing Your Balance

1. Go to the HR portal
2. Click on "My Profile"
3. Select "Leave Summary"
4. View your current balances

### Carryover Rules

- Annual leave: Up to 5 days can be carried over
- Sick leave: Cannot be carried over
- Personal leave: Cannot be carried over

### End of Year Processing

Unused annual leave over 5 days will lapse on December 31st. Plan your leave accordingly!`,
    category: 'policies',
    tags: ['leave', 'balance', 'carryover', 'policy'],
    views: 890,
    helpful: 72,
    notHelpful: 5,
    createdAt: daysAgo(85),
    updatedAt: daysAgo(25),
    author: supportAgents[0],
    isPublished: true,
    relatedArticles: ['kb-1'],
  },
  {
    id: 'kb-3',
    title: 'Expense Reimbursement Process',
    content: `## Expense Reimbursement Guide

Learn how to submit and track expense reimbursements.

### Eligible Expenses

- Travel (flights, hotels, car rental)
- Meals during business travel
- Client entertainment
- Office supplies
- Professional development

### Submission Process

1. Collect all receipts
2. Log in to the expense portal
3. Create new expense report
4. Upload receipts
5. Categorize expenses
6. Submit for approval

### Required Information

- Date of expense
- Merchant name
- Amount
- Business purpose
- Receipt image

### Processing Time

- Standard: 5-7 business days
- Rush: 2-3 business days (requires manager approval)

### Common Rejection Reasons

- Missing receipt
- Incorrect expense category
- Amount mismatch
- Missing business justification`,
    category: 'procedures',
    tags: ['expense', 'reimbursement', 'travel', 'receipts'],
    views: 2100,
    helpful: 156,
    notHelpful: 8,
    createdAt: daysAgo(120),
    updatedAt: daysAgo(15),
    author: supportAgents[1],
    isPublished: true,
    relatedArticles: ['kb-4'],
  },
  {
    id: 'kb-4',
    title: 'Benefits Enrollment Guide',
    content: `## Benefits Enrollment

Complete guide to enrolling in company benefits.

### Open Enrollment Period

Open enrollment typically occurs once per year (November). Changes take effect January 1st.

### Available Benefits

#### Health Insurance
- Individual Plan
- Family Plan
- Premium Plan with dental/vision

#### Life Insurance
- Basic Life (2x salary)
- Supplemental Life (up to 5x salary)

#### Retirement
- 401(k) with company match
- Investment options

### How to Enroll

1. Log in to benefits portal
2. Review current selections
3. Make desired changes
4. Confirm selections
5. Submit enrollment

### Making Changes Mid-Year

You can only make changes if you have a qualifying life event:
- Marriage/Divorce
- Birth/Adoption of child
- Loss of other coverage
- Change in employment status`,
    category: 'guides',
    tags: ['benefits', 'enrollment', 'insurance', 'health'],
    views: 1800,
    helpful: 134,
    notHelpful: 12,
    createdAt: daysAgo(60),
    updatedAt: daysAgo(10),
    author: supportAgents[0],
    isPublished: true,
    relatedArticles: ['kb-5'],
  },
  {
    id: 'kb-5',
    title: 'Remote Work Policy FAQ',
    content: `## Remote Work Policy

Frequently asked questions about working remotely.

### Policy Overview

Employees may work remotely up to 3 days per week with manager approval.

### Requirements

- Maintain regular working hours
- Be available during core hours (10 AM - 4 PM)
- Have reliable internet connection
- Attend virtual meetings with camera on

### Equipment

The company provides:
- Laptop
- Monitor (upon request)
- Keyboard and mouse
- Headset for calls

### How to Request Remote Work

1. Discuss with your manager
2. Submit request through HR portal
3. Wait for approval
4. Update your availability in calendar

### Tips for Success

- Create a dedicated workspace
- Establish a routine
- Take regular breaks
- Stay connected with team`,
    category: 'faq',
    tags: ['remote', 'wfh', 'work-from-home', 'policy'],
    views: 3200,
    helpful: 245,
    notHelpful: 15,
    createdAt: daysAgo(45),
    updatedAt: daysAgo(5),
    author: supportAgents[2],
    isPublished: true,
    relatedArticles: ['kb-1', 'kb-2'],
  },
  {
    id: 'kb-6',
    title: 'Performance Review Process',
    content: `## Performance Reviews

Everything you need to know about performance evaluations.

### Review Cycle

- Q1: Goal setting
- Q2: Mid-year check-in
- Q3: Continued review
- Q4: Annual review

### Self-Assessment

Complete your self-assessment 2 weeks before your review meeting. Include:
- Accomplishments
- Challenges faced
- Goals achieved
- Areas for development

### Manager Evaluation

Your manager will evaluate:
- Goal completion
- Competency demonstration
- Team collaboration
- Initiative and innovation

### Rating Scale

1. Does Not Meet Expectations
2. Needs Improvement
3. Meets Expectations
4. Exceeds Expectations
5. Exceptional Performance

### Career Development

Discuss career goals and development plans during your review. Work with your manager to create an action plan.`,
    category: 'procedures',
    tags: ['performance', 'review', 'goals', 'evaluation'],
    views: 1450,
    helpful: 98,
    notHelpful: 7,
    createdAt: daysAgo(75),
    updatedAt: daysAgo(20),
    author: supportAgents[0],
    isPublished: true,
    relatedArticles: [],
  },
  {
    id: 'kb-7',
    title: 'Payroll and Salary Information',
    content: `## Payroll Information

Understanding your pay and compensation.

### Pay Schedule

- Pay frequency: Bi-monthly (1st and 15th)
- Direct deposit to your bank account
- Payslip available in HR portal

### Salary Components

- Base salary
- Allowances (transport, meals, etc.)
- Overtime (if applicable)
- Bonuses (quarterly/annual)

### Deductions

- Income tax (TDS)
- Provident Fund (PF)
- Health insurance premium
- Other deductions per your election

### How to Update Bank Details

1. Submit request through HR portal
2. Provide new bank account details
3. Attach canceled check
4. Allow 1 pay cycle for changes

### Tax Documents

Form 16 available at year-end (April):
- Log in to HR portal
- Go to Documents section
- Download your Form 16`,
    category: 'policies',
    tags: ['payroll', 'salary', 'tax', 'pay'],
    views: 2800,
    helpful: 198,
    notHelpful: 22,
    createdAt: daysAgo(100),
    updatedAt: daysAgo(8),
    author: supportAgents[1],
    isPublished: true,
    relatedArticles: ['kb-8'],
  },
  {
    id: 'kb-8',
    title: 'IT and System Access',
    content: `## IT and System Access

Managing your accounts and permissions.

### Getting Started

New employees receive:
- Email account
- HR portal access
- Slack workspace
- Project management tools

### Requesting Additional Access

1. Submit IT ticket
2. Specify system and access level needed
3. Get manager approval
4. IT processes within 48 hours

### Password Reset

Use the self-service password reset:
1. Go to login page
2. Click "Forgot Password"
3. Enter your email
4. Check email for reset link

### Security Best Practices

- Use strong passwords (12+ characters)
- Enable two-factor authentication
- Do not share credentials
- Lock your computer when away

### Common Systems

- HR Portal: hr.corpperks.com
- Email: mail.corpperks.com
- Slack: corpperks.slack.com
- VPN: vpn.corpperks.com`,
    category: 'guides',
    tags: ['it', 'access', 'password', 'security'],
    views: 1950,
    helpful: 167,
    notHelpful: 11,
    createdAt: daysAgo(55),
    updatedAt: daysAgo(12),
    author: supportAgents[2],
    isPublished: true,
    relatedArticles: [],
  },
];

// Canned responses
export const cannedResponses: CannedResponse[] = [
  {
    id: 'canned-1',
    title: 'Greeting',
    content: 'Hello! Thank you for contacting CorpPerks HR Support. How can I assist you today?',
    shortcut: '/greet',
    category: 'general',
  },
  {
    id: 'canned-2',
    title: 'Investigating',
    content: 'Thank you for your patience. I am looking into this issue and will get back to you shortly with an update.',
    shortcut: '/investigate',
    category: 'general',
  },
  {
    id: 'canned-3',
    title: 'Need More Info',
    content: 'To better assist you, could you please provide the following information:\n- Your employee ID\n- The specific details of your concern\n- Any relevant dates or reference numbers',
    shortcut: '/moreinfo',
    category: 'general',
  },
  {
    id: 'canned-4',
    title: 'Ticket Escalated',
    content: 'I have escalated your ticket to the appropriate team. You should receive a response within 24-48 hours. Your ticket reference is: ',
    shortcut: '/escalate',
    category: 'escalation',
  },
  {
    id: 'canned-5',
    title: 'Issue Resolved',
    content: 'I am happy to inform you that your issue has been resolved. Please let me know if you have any other questions or concerns.',
    shortcut: '/resolved',
    category: 'resolution',
  },
  {
    id: 'canned-6',
    title: 'Policy Reference',
    content: 'According to our company policy, please refer to the following documentation for more information: [Link to policy]',
    shortcut: '/policy',
    category: 'policy',
  },
  {
    id: 'canned-7',
    title: 'Leave Balance Info',
    content: 'Your current leave balances are:\n- Annual Leave: X days\n- Sick Leave: X days\n- Personal Leave: X days\n\nYou can view detailed information in the HR portal under "My Leave".',
    shortcut: '/leavebalance',
    category: 'leave',
  },
  {
    id: 'canned-8',
    title: 'Closing Ticket',
    content: 'I hope we have resolved your concern. This ticket will now be closed. If you need further assistance, please feel free to reach out again. Have a great day!',
    shortcut: '/close',
    category: 'resolution',
  },
];

// Support statistics
export const supportStats: SupportStats = {
  totalTickets: 156,
  openTickets: 23,
  inProgressTickets: 18,
  resolvedToday: 12,
  avgResolutionTime: 4.5, // hours
  slaCompliance: 94.2, // percentage
  avgCsat: 4.6, // out of 5
};

// Report data
export const reportData: ReportData = {
  ticketsByStatus: {
    open: 23,
    in_progress: 18,
    pending: 12,
    resolved: 89,
    closed: 14,
  },
  ticketsByPriority: {
    low: 34,
    medium: 67,
    high: 38,
    urgent: 17,
  },
  ticketsByCategory: {
    hr_policy: 42,
    payroll: 38,
    benefits: 29,
    leave: 25,
    onboarding: 12,
    performance: 10,
    other: 10,
  },
  resolutionTimeTrend: [
    { date: '2026-05-24', avgTime: 5.2 },
    { date: '2026-05-25', avgTime: 4.8 },
    { date: '2026-05-26', avgTime: 4.5 },
    { date: '2026-05-27', avgTime: 4.9 },
    { date: '2026-05-28', avgTime: 4.2 },
    { date: '2026-05-29', avgTime: 4.5 },
  ],
  volumeTrend: [
    { date: '2026-05-24', count: 28 },
    { date: '2026-05-25', count: 32 },
    { date: '2026-05-26', count: 25 },
    { date: '2026-05-27', count: 30 },
    { date: '2026-05-28', count: 22 },
    { date: '2026-05-29', count: 19 },
  ],
  agentPerformance: supportAgents.map((agent, i) => ({
    agent,
    ticketsResolved: [45, 38, 42][i],
    avgResponseTime: [2.3, 2.8, 2.5][i], // minutes
    avgResolutionTime: [4.2, 5.1, 4.5][i], // hours
  })),
  categoryBreakdown: [
    { category: 'hr_policy', count: 42, avgTime: 3.8 },
    { category: 'payroll', count: 38, avgTime: 5.2 },
    { category: 'benefits', count: 29, avgTime: 4.5 },
    { category: 'leave', count: 25, avgTime: 2.8 },
    { category: 'onboarding', count: 12, avgTime: 6.1 },
    { category: 'performance', count: 10, avgTime: 4.0 },
  ],
};
