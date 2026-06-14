// ============================================================================
// Role AI Agents - Seed Script
// ============================================================================

import { connectDatabase, RoleAgent } from '../models';
import { ROLE_INFO, ROLE_PROMPTS, LEVEL_CONFIG } from '../services/roleDefinitions';
import type { JobRole, AgentLevel } from '../types';
import logger from '../utils/logger';

// ============================================================================
// Role Capabilities by Role and Level
// ============================================================================

const ROLE_CAPABILITIES: Record<JobRole, Record<AgentLevel, { category: string; skills: string[]; description: string }[]>> = {
  'software-engineer': {
    L1: [
      { category: 'Code Basics', skills: ['Variables', 'Functions', 'Loops', 'Conditionals'], description: 'Fundamental programming concepts' },
      { category: 'Debugging', skills: ['Console logs', 'Error reading', 'Stack traces'], description: 'Basic debugging techniques' },
      { category: 'Version Control', skills: ['Git basics', 'Add/Commit/Push'], description: 'Version control fundamentals' },
      { category: 'Development Tools', skills: ['IDE usage', 'Terminal basics', 'Browser DevTools'], description: 'Development environment setup' },
    ],
    L2: [
      { category: 'Architecture Patterns', skills: ['MVC', 'Repository', 'Factory'], description: 'Common software patterns' },
      { category: 'Testing', skills: ['Unit tests', 'Integration tests', 'Mocking'], description: 'Testing strategies' },
      { category: 'Git Workflows', skills: ['Branching', 'Merging', 'Pull requests'], description: 'Advanced Git operations' },
      { category: 'API Design', skills: ['REST basics', 'Request/Response', 'Error handling'], description: 'API development basics' },
    ],
    L3: [
      { category: 'System Design', skills: ['Microservices', 'Event-driven', 'CQRS'], description: 'Advanced architecture patterns' },
      { category: 'Performance', skills: ['Profiling', 'Caching', 'Optimization'], description: 'Performance tuning' },
      { category: 'Security', skills: ['OWASP', 'Authentication', 'Authorization'], description: 'Security best practices' },
      { category: 'Mentoring', skills: ['Code reviews', 'Pair programming', 'Technical guidance'], description: 'Team leadership' },
    ],
    L4: [
      { category: 'Tech Strategy', skills: ['Roadmapping', 'Architecture governance', 'Standards'], description: 'Technical leadership' },
      { category: 'Hiring', skills: ['Interviewing', 'Onboarding', 'Career development'], description: 'Talent management' },
      { category: 'Org Impact', skills: ['Tech debt strategy', 'Platform thinking', 'Innovation'], description: 'Organizational influence' },
      { category: 'Industry Trends', skills: ['Emerging tech', 'Best practices', 'Research'], description: 'Technology awareness' },
    ],
  },

  sales: {
    L1: [
      { category: 'Product Knowledge', skills: ['Features', 'Benefits', 'Value proposition'], description: 'Product understanding' },
      { category: 'Objection Handling', skills: ['Basic objections', 'Listening', 'Patience'], description: 'Handling pushback' },
      { category: 'Discovery', skills: ['Open questions', 'Needs identification', 'Rapport building'], description: 'Understanding customer needs' },
      { category: 'CRM', skills: ['Data entry', 'Activity logging', 'Lead tracking'], description: 'CRM basics' },
    ],
    L2: [
      { category: 'Pipeline Management', skills: ['Deal stages', 'Forecasting', 'Prioritization'], description: 'Pipeline oversight' },
      { category: 'Negotiation', skills: ['Value negotiation', 'Objection resolution', 'Closing tactics'], description: 'Deal negotiation' },
      { category: 'Presentations', skills: ['Demo delivery', 'Slide creation', 'Storytelling'], description: 'Sales presentations' },
      { category: 'Competitor Analysis', skills: ['Positioning', 'Differentiation', 'Battle cards'], description: 'Competitive intelligence' },
    ],
    L3: [
      { category: 'Account Strategy', skills: ['Account planning', 'Stakeholder mapping', 'Expansion'], description: 'Strategic account management' },
      { category: 'Team Leadership', skills: ['Mentoring', 'Deal support', 'Forecasting'], description: 'Team development' },
      { category: 'Enterprise Sales', skills: ['Complex deals', 'Executive selling', 'Multi-year contracts'], description: 'Enterprise deals' },
      { category: 'Revenue Operations', skills: ['Process improvement', 'Tools', 'Metrics'], description: 'Sales operations' },
    ],
    L4: [
      { category: 'Revenue Strategy', skills: ['Territory planning', 'Quota setting', 'Comp design'], description: 'Revenue leadership' },
      { category: 'Enterprise Deals', skills: ['Strategic partnerships', 'Board presentations', 'M&A integration'], description: 'Enterprise leadership' },
      { category: 'Team Building', skills: ['Hiring', 'Training', 'Culture'], description: 'Organization building' },
      { category: 'Market Expansion', skills: ['New markets', 'Channels', 'Partnerships'], description: 'Growth strategies' },
    ],
  },

  marketing: {
    L1: [
      { category: 'Content Creation', skills: ['Copywriting', 'Blog posts', 'Social media'], description: 'Content basics' },
      { category: 'Social Media', skills: ['Posting', 'Scheduling', 'Engagement'], description: 'Social basics' },
      { category: 'Campaign Support', skills: ['Asset preparation', 'Scheduling', 'Reporting'], description: 'Campaign assistance' },
      { category: 'Analytics Basics', skills: ['Google Analytics', 'Metrics', 'Reports'], description: 'Data fundamentals' },
    ],
    L2: [
      { category: 'Campaign Management', skills: ['Planning', 'Execution', 'Optimization'], description: 'Full campaign ownership' },
      { category: 'Channel Optimization', skills: ['A/B testing', 'Budget allocation', 'ROI analysis'], description: 'Channel management' },
      { category: 'SEO/SEM', skills: ['Keywords', 'On-page', 'Paid search'], description: 'Search optimization' },
      { category: 'Email Marketing', skills: ['Segmentation', 'Automation', 'A/B testing'], description: 'Email campaigns' },
    ],
    L3: [
      { category: 'Brand Strategy', skills: ['Positioning', 'Messaging', 'Guidelines'], description: 'Brand leadership' },
      { category: 'Budget Management', skills: ['Planning', 'Allocation', 'Forecasting'], description: 'Budget oversight' },
      { category: 'Team Leadership', skills: ['Mentoring', 'Workflows', 'Reviews'], description: 'Team management' },
      { category: 'Market Research', skills: ['Competitor analysis', 'Trends', 'Customer insights'], description: 'Market intelligence' },
    ],
    L4: [
      { category: 'Market Positioning', skills: ['Category creation', 'Thought leadership', 'PR'], description: 'Market leadership' },
      { category: 'CMO Advisory', skills: ['Board presentation', 'Investor relations', 'Acquisitions'], description: 'Executive partnership' },
      { category: 'Team Building', skills: ['Hiring', 'Culture', 'Development'], description: 'Organization building' },
      { category: 'Growth Strategy', skills: ['Market expansion', 'Channels', 'Partnerships'], description: 'Growth leadership' },
    ],
  },

  finance: {
    L1: [
      { category: 'Data Entry', skills: ['Accurate input', 'Validation', 'Formatting'], description: 'Data management' },
      { category: 'Basic Reporting', skills: ['Excel/Sheets', 'Templates', 'Charts'], description: 'Report generation' },
      { category: 'Invoice Processing', skills: ['Verification', 'Coding', 'Entry'], description: 'Accounts payable' },
      { category: 'Reconciliation', skills: ['Statement matching', 'Variance spotting'], description: 'Account reconciliation' },
    ],
    L2: [
      { category: 'Financial Modeling', skills: ['Budget models', 'Forecasting', 'Scenario analysis'], description: 'Modeling skills' },
      { category: 'Variance Analysis', skills: ['Budget vs actual', 'Root cause', 'Recommendations'], description: 'Analysis' },
      { category: 'P&L Management', skills: ['Understanding', 'Tracking', 'Explanation'], description: 'Profit & Loss' },
      { category: 'Dashboard Creation', skills: ['Visualization', 'KPIs', 'Automation'], description: 'Dashboards' },
    ],
    L3: [
      { category: 'Financial Planning', skills: ['Annual planning', 'Long-range', 'Strategic'], description: 'FP&A leadership' },
      { category: 'Forecasting', skills: ['Statistical', 'Driver-based', 'Scenario'], description: 'Future planning' },
      { category: 'Process Leadership', skills: ['Optimization', 'Automation', 'Controls'], description: 'Process improvement' },
      { category: 'Stakeholder Management', skills: ['Presentation', 'Translation', 'Partnership'], description: 'Business partnership' },
    ],
    L4: [
      { category: 'Capital Strategy', skills: ['Allocation', 'ROI', 'Risk'], description: 'Capital management' },
      { category: 'Investor Relations', skills: ['Board prep', 'Presentations', 'Narrative'], description: 'Investor partnership' },
      { category: 'M&A Guidance', skills: ['Due diligence', 'Valuation', 'Integration'], description: 'Deal support' },
      { category: 'Risk Management', skills: ['Assessment', 'Mitigation', 'Governance'], description: 'Risk oversight' },
    ],
  },

  hr: {
    L1: [
      { category: 'Onboarding', skills: ['Documentation', 'IT setup', 'Orientation'], description: 'New hire onboarding' },
      { category: 'Employee Queries', skills: ['Policies', 'Benefits', 'Procedures'], description: 'HR support' },
      { category: 'Record Keeping', skills: ['Documentation', 'Compliance', 'Filing'], description: 'HRIS management' },
      { category: 'Interview Scheduling', skills: ['Calendar', 'Logistics', 'Communication'], description: 'Recruiting support' },
    ],
    L2: [
      { category: 'Talent Acquisition', skills: ['Sourcing', 'Screening', 'Interviewing'], description: 'Full-cycle recruiting' },
      { category: 'Employee Relations', skills: ['Coaching', 'Conflict', 'Performance'], description: 'ER support' },
      { category: 'Engagement Programs', skills: ['Surveys', 'Initiatives', 'Recognition'], description: 'Engagement' },
      { category: 'Training Coordination', skills: ['Planning', 'Scheduling', 'Tracking'], description: 'L&D support' },
    ],
    L3: [
      { category: 'Performance Management', skills: ['Systems', 'Reviews', 'Development'], description: 'Performance programs' },
      { category: 'Learning & Development', skills: ['Programs', 'Budgets', 'Evaluation'], description: 'L&D leadership' },
      { category: 'Org Design', skills: ['Structures', 'Roles', 'Reporting'], description: 'Organization design' },
      { category: 'Compensation', skills: ['Benchmarking', 'Ranges', 'Reviews'], description: 'Compensation management' },
    ],
    L4: [
      { category: 'Culture Strategy', skills: ['Vision', 'Values', 'Embedding'], description: 'Culture leadership' },
      { category: 'Org Design', skills: ['Transformation', 'Change', 'Leadership'], description: 'Strategic org design' },
      { category: 'Executive Partnership', skills: ['Board', 'C-suite', 'Strategy'], description: 'Executive partnership' },
      { category: 'DEI Strategy', skills: ['Programs', 'Metrics', 'Accountability'], description: 'Diversity & inclusion' },
    ],
  },

  operations: {
    L1: [
      { category: 'Documentation', skills: ['Process docs', 'SOPs', 'Manuals'], description: 'Documentation' },
      { category: 'Task Tracking', skills: ['Ticketing', 'Prioritization', 'Follow-up'], description: 'Task management' },
      { category: 'Basic Reporting', skills: ['Metrics', 'Status updates', 'Charts'], description: 'Reporting' },
      { category: 'Vendor Communication', skills: ['Email', 'Scheduling', 'Follow-up'], description: 'Vendor coordination' },
    ],
    L2: [
      { category: 'Workflow Optimization', skills: ['Mapping', 'Analysis', 'Improvement'], description: 'Process improvement' },
      { category: 'Tool Evaluation', skills: ['Comparison', 'Testing', 'Recommendation'], description: 'Tool selection' },
      { category: 'KPI Development', skills: ['Metrics', 'Dashboards', 'Alerts'], description: 'Performance measurement' },
      { category: 'Project Coordination', skills: ['Planning', 'Tracking', 'Reporting'], description: 'Project support' },
    ],
    L3: [
      { category: 'Process Design', skills: ['Architecture', 'Automation', 'Governance'], description: 'Process leadership' },
      { category: 'Vendor Management', skills: ['Contracts', 'Relationships', 'Performance'], description: 'Vendor oversight' },
      { category: 'Capacity Planning', skills: ['Forecasting', 'Resource allocation', 'Scheduling'], description: 'Capacity management' },
      { category: 'Quality Management', skills: ['Standards', 'Audits', 'Improvement'], description: 'Quality control' },
    ],
    L4: [
      { category: 'Ops Strategy', skills: ['Vision', 'Roadmap', 'Investment'], description: 'Strategic leadership' },
      { category: 'Scaling', skills: ['Growth', 'Automation', 'Templates'], description: 'Scale frameworks' },
      { category: 'Technology Selection', skills: ['Platforms', 'Integration', 'Migration'], description: 'Tech decisions' },
      { category: 'Risk Management', skills: ['Assessment', 'Mitigation', 'Business continuity'], description: 'Risk oversight' },
    ],
  },

  product: {
    L1: [
      { category: 'Feature Writing', skills: ['User stories', 'Requirements', 'Specs'], description: 'Spec writing' },
      { category: 'User Feedback', skills: ['Collection', 'Synthesis', 'Prioritization'], description: 'Feedback management' },
      { category: 'Documentation', skills: ['Product docs', 'FAQs', 'Release notes'], description: 'Documentation' },
      { category: 'Sprint Support', skills: ['Backlog', 'Planning', 'Reviews'], description: 'Agile support' },
    ],
    L2: [
      { category: 'Roadmap Management', skills: ['Planning', 'Prioritization', 'Communication'], description: 'Roadmap ownership' },
      { category: 'Prioritization', skills: ['Frameworks', 'Trade-offs', 'Data-driven'], description: 'Prioritization' },
      { category: 'User Research', skills: ['Interviews', 'Surveys', 'Analysis'], description: 'Research skills' },
      { category: 'Data Analysis', skills: ['Metrics', 'Funnels', 'A/B testing'], description: 'Analytics' },
    ],
    L3: [
      { category: 'Product Strategy', skills: ['Vision', 'Positioning', 'Go-to-market'], description: 'Strategic planning' },
      { category: 'Experiment Design', skills: ['Hypothesis', 'Methodology', 'Analysis'], description: 'Experimentation' },
      { category: 'Stakeholder Management', skills: ['Executive presence', 'Alignment', 'Communication'], description: 'Stakeholder management' },
      { category: 'Team Leadership', skills: ['Mentoring', 'Hiring', 'Workflows'], description: 'Team leadership' },
    ],
    L4: [
      { category: 'Product Vision', skills: ['Long-term', 'Market trends', 'Innovation'], description: 'Visionary leadership' },
      { category: 'Market Fit', skills: ['Positioning', 'Timing', 'Business models'], description: 'Market strategy' },
      { category: 'Portfolio Management', skills: ['Prioritization', 'Resource allocation', 'Metrics'], description: 'Multi-product' },
      { category: 'Executive Partnership', skills: ['Board', 'Investors', 'Strategy'], description: 'Executive collaboration' },
    ],
  },

  design: {
    L1: [
      { category: 'Design Fundamentals', skills: ['Color', 'Typography', 'Layout', 'Spacing'], description: 'Core principles' },
      { category: 'Tool Proficiency', skills: ['Figma', 'Sketch', 'Adobe XD'], description: 'Tool skills' },
      { category: 'Component Creation', skills: ['Buttons', 'Forms', 'Cards'], description: 'Component design' },
      { category: 'Basic Layouts', skills: ['Wireframing', 'Grid systems', 'Responsive'], description: 'Layout basics' },
    ],
    L2: [
      { category: 'UI Design', skills: ['Visual design', 'Interactions', 'Animation'], description: 'Interface design' },
      { category: 'Prototyping', skills: ['Interactions', 'Transitions', 'Testing'], description: 'Prototype creation' },
      { category: 'Design Systems', skills: ['Tokens', 'Components', 'Documentation'], description: 'System thinking' },
      { category: 'User Research Basics', skills: ['Interviews', 'Testing', 'Synthesis'], description: 'Research support' },
    ],
    L3: [
      { category: 'Design Systems Architecture', skills: ['Foundation', 'Components', 'Patterns'], description: 'System leadership' },
      { category: 'User Research Leadership', skills: ['Planning', 'Analysis', 'Insights'], description: 'Research leadership' },
      { category: 'Cross-platform Design', skills: ['Web', 'Mobile', 'Tablet'], description: 'Multi-platform' },
      { category: 'Design Strategy', skills: ['Vision', 'Roadmap', 'Standards'], description: 'Strategic design' },
    ],
    L4: [
      { category: 'Brand Strategy', skills: ['Architecture', 'Guidelines', 'Evolution'], description: 'Brand leadership' },
      { category: 'Design Leadership', skills: ['Team', 'Culture', 'Process'], description: 'Design management' },
      { category: 'Executive Presence', skills: ['Presentations', 'Influence', 'Storytelling'], description: 'Executive partnership' },
      { category: 'Industry Impact', skills: ['Awards', 'Speaking', 'Mentoring'], description: 'External influence' },
    ],
  },

  support: {
    L1: [
      { category: 'Ticket Handling', skills: ['Classification', 'Prioritization', 'Resolution'], description: 'Ticket management' },
      { category: 'Basic Troubleshooting', skills: ['FAQ', 'Guides', 'Common issues'], description: 'Problem solving' },
      { category: 'Knowledge Base', skills: ['Search', 'Reading', 'Information finding'], description: 'KB usage' },
      { category: 'Communication', skills: ['Email', 'Chat', 'Phone'], description: 'Customer communication' },
    ],
    L2: [
      { category: 'Complex Troubleshooting', skills: ['Escalation', 'Investigation', 'Resolution'], description: 'Advanced support' },
      { category: 'Knowledge Creation', skills: ['Articles', 'Guides', 'Updates'], description: 'KB authoring' },
      { category: 'Training', skills: ['New agents', 'Processes', 'Tools'], description: 'Team training' },
      { category: 'Process Improvement', skills: ['Suggestions', 'Documentation', 'Testing'], description: 'Improvement' },
    ],
    L3: [
      { category: 'Team Training', skills: ['Mentoring', 'Coaching', 'Development'], description: 'Team leadership' },
      { category: 'Quality Management', skills: ['Audits', 'Calibration', 'Feedback'], description: 'Quality control' },
      { category: 'Process Design', skills: ['Workflows', 'Playbooks', 'Automation'], description: 'Process creation' },
      { category: 'Customer Success', skills: ['Retention', 'NPS', 'Health scores'], description: 'Success programs' },
    ],
    L4: [
      { category: 'Support Strategy', skills: ['Vision', 'Roadmap', 'Investments'], description: 'Strategic leadership' },
      { category: 'Customer Experience', skills: ['Journey mapping', 'Voice of customer', 'Programs'], description: 'CX leadership' },
      { category: 'Team Building', skills: ['Hiring', 'Culture', 'Development'], description: 'Organization building' },
      { category: 'Executive Partnership', skills: ['Board', 'Investors', 'Strategy'], description: 'Executive collaboration' },
    ],
  },

  admin: {
    L1: [
      { category: 'System Access', skills: ['User creation', 'Permissions', 'Groups'], description: 'Access management' },
      { category: 'User Management', skills: ['Accounts', 'Profiles', 'Settings'], description: 'User admin' },
      { category: 'Basic Troubleshooting', skills: ['Password resets', 'Access issues', 'FAQ'], description: 'Basic support' },
      { category: 'Documentation', skills: ['Procedures', 'Guides', 'Runbooks'], description: 'Documentation' },
    ],
    L2: [
      { category: 'User & Access Management', skills: ['Lifecycle', 'Provisioning', 'Deprovisioning'], description: 'User lifecycle' },
      { category: 'Security Basics', skills: ['Policies', 'Auditing', 'Compliance'], description: 'Security fundamentals' },
      { category: 'System Maintenance', skills: ['Updates', 'Backups', 'Monitoring'], description: 'Maintenance' },
      { category: 'Automation', skills: ['Scripts', 'Workflows', 'Templates'], description: 'Task automation' },
    ],
    L3: [
      { category: 'Access Control', skills: ['RBAC', 'Policies', 'Auditing'], description: 'Access governance' },
      { category: 'Compliance', skills: ['Frameworks', 'Audits', 'Reporting'], description: 'Compliance management' },
      { category: 'Security Hardening', skills: ['Configurations', 'Monitoring', 'Incident response'], description: 'Security practices' },
      { category: 'Team Leadership', skills: ['Mentoring', 'Workflows', 'Quality'], description: 'Team management' },
    ],
    L4: [
      { category: 'Security Strategy', skills: ['Vision', 'Roadmap', 'Investment'], description: 'Security leadership' },
      { category: 'Governance', skills: ['Frameworks', 'Risk', 'Policies'], description: 'Governance programs' },
      { category: 'Executive Partnership', skills: ['Board', 'Compliance', 'Risk'], description: 'Executive collaboration' },
      { category: 'Incident Response', skills: ['Planning', 'Execution', 'Post-mortems'], description: 'Incident management' },
    ],
  },
};

// ============================================================================
// Role Agent Names
// ============================================================================

const ROLE_AGENT_NAMES: Record<JobRole, Record<AgentLevel, string>> = {
  'software-engineer': {
    L1: 'CodeBuddy',
    L2: 'DevPro',
    L3: 'TechLead',
    L4: 'CTO Advisor',
  },
  sales: {
    L1: 'SalesBuddy',
    L2: 'SalesPro',
    L3: 'SalesLeader',
    L4: 'Revenue Strategist',
  },
  marketing: {
    L1: 'MarketingBuddy',
    L2: 'MarketingPro',
    L3: 'MarketingManager',
    L4: 'CMO Counselor',
  },
  finance: {
    L1: 'FinanceBuddy',
    L2: 'FinanceAnalyst',
    L3: 'FinanceManager',
    L4: 'CFO Counselor',
  },
  hr: {
    L1: 'HRBuddy',
    L2: 'HRPro',
    L3: 'HRManager',
    L4: 'CHRO Counselor',
  },
  operations: {
    L1: 'OpsBuddy',
    L2: 'OpsAnalyst',
    L3: 'OpsManager',
    L4: 'COO Counselor',
  },
  product: {
    L1: 'PMBuddy',
    L2: 'PMPro',
    L3: 'SeniorPM',
    L4: 'Product Visionary',
  },
  design: {
    L1: 'DesignBuddy',
    L2: 'DesignPro',
    L3: 'SeniorDesigner',
    L4: 'Design Director',
  },
  support: {
    L1: 'SupportBuddy',
    L2: 'SeniorSupport',
    L3: 'SupportLead',
    L4: 'Support Strategist',
  },
  admin: {
    L1: 'AdminBuddy',
    L2: 'AdminPro',
    L3: 'SeniorAdmin',
    L4: 'Security Strategist',
  },
};

// ============================================================================
// Main Seed Function
// ============================================================================

async function seed(): Promise<void> {
  try {
    console.log('Starting seed process...');

    // Connect to database
    await connectDatabase();

    // Clear existing data
    console.log('Clearing existing role agents...');
    await RoleAgent.deleteMany({});

    // Create agents for each role and level
    const agents = [];
    const roles = Object.keys(ROLE_INFO) as JobRole[];
    const levels: AgentLevel[] = ['L1', 'L2', 'L3', 'L4'];

    for (const role of roles) {
      const roleInfo = ROLE_INFO[role];

      for (const level of levels) {
        const levelConfig = LEVEL_CONFIG[level];
        const capabilities = ROLE_CAPABILITIES[role]?.[level] || [];
        const systemPrompt = ROLE_PROMPTS[role]?.[level] || '';
        const agentName = ROLE_AGENT_NAMES[role]?.[level] || `${role}-${level}`;

        const agent = {
          role,
          level,
          name: agentName,
          title: `${levelConfig.name} ${roleInfo.name}`,
          experience: levelConfig.experience,
          capabilities,
          systemPrompt,
          tools: getDefaultTools(role, level),
          traits: getDefaultTraits(role, level),
          goals: getDefaultGoals(role, level),
          constraints: getDefaultConstraints(role, level),
          usageStats: {
            totalChats: 0,
            totalSessions: 0,
            averageRating: 0,
            lastUsed: null,
          },
        };

        agents.push(agent);
        logger.info(Created agent: ${agentName} (${role}/${level})`);
      }
    }

    // Insert all agents
    logger.info(Inserting ${agents.length} role agents...`);
    await RoleAgent.insertMany(agents);

    console.log('Seed completed successfully!');
    logger.info(Created ${agents.length} role agents (${roles.length} roles x ${levels.length} levels)`);

    // Print summary
    console.log('\n--- Summary ---');
    for (const role of roles) {
      const count = agents.filter((a) => a.role === role).length;
      logger.info(${role}: ${count} agents`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function getDefaultTools(role: JobRole, level: AgentLevel): string[] {
  const baseTools = ['chat', 'documentation'];

  const roleSpecificTools: Record<JobRole, string[]> = {
    'software-engineer': ['code-editor', 'git', 'debugger', 'testing'],
    sales: ['crm', 'email', 'calendar', 'analytics'],
    marketing: ['analytics', 'social-media', 'email', 'seo'],
    finance: ['spreadsheet', 'reporting', 'dashboard'],
    hr: ['hris', 'email', 'calendar', 'surveys'],
    operations: ['workflow', 'project-management', 'analytics'],
    product: ['analytics', 'research', 'roadmap'],
    design: ['figma', 'prototyping', 'design-systems'],
    support: ['ticketing', 'knowledge-base', 'chat'],
    admin: ['admin-panel', 'user-management', 'security'],
  };

  const levelSpecificTools: Record<AgentLevel, string[]> = {
    L1: [],
    L2: ['advanced-analytics'],
    L3: ['team-management', 'reporting'],
    L4: ['executive-dashboard', 'strategic-planning'],
  };

  return [...baseTools, ...(roleSpecificTools[role] || []), ...levelSpecificTools[level]];
}

function getDefaultTraits(role: JobRole, level: AgentLevel): string[] {
  const baseTraits = ['helpful', 'professional', 'knowledgeable'];

  const levelTraits: Record<AgentLevel, string[]> = {
    L1: ['patient', 'encouraging', 'learning-focused'],
    L2: ['efficient', 'practical', 'results-oriented'],
    L3: ['strategic', 'mentoring', 'experienced'],
    L4: ['visionary', 'leadership', 'strategic-thinking'],
  };

  return [...baseTraits, ...levelTraits[level]];
}

function getDefaultGoals(role: JobRole, level: AgentLevel): string[] {
  const goalsByLevel: Record<AgentLevel, string[]> = {
    L1: ['Help with basics', 'Provide learning resources', 'Build confidence'],
    L2: ['Enable execution', 'Solve complex problems', 'Share best practices'],
    L3: ['Enable team success', 'Drive strategic initiatives', 'Mentor others'],
    L4: ['Shape strategy', 'Enable organizational impact', 'Drive innovation'],
  };

  return goalsByLevel[level];
}

function getDefaultConstraints(role: JobRole, level: AgentLevel): string[] {
  const constraintsByLevel: Record<AgentLevel, string[]> = {
    L1: ['Basic guidance only', 'Escalate complex issues', 'No production access'],
    L2: ['Mid-level guidance', 'Review before major changes', 'Document decisions'],
    L3: ['Strategic guidance', 'Team coordination required', 'Executive alignment'],
    L4: ['Board-level decisions', 'Org-wide impact', 'External partnerships'],
  };

  return constraintsByLevel[level];
}

// Run seed
seed();
