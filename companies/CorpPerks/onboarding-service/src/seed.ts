import mongoose from 'mongoose';
import { OnboardingTemplate } from './models';
import { generateId } from './utils/helpers';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/corpperks_onboarding';

// Standard onboarding template
const standardTemplate = {
  templateId: generateId('TPL'),
  name: 'Standard Employee Onboarding',
  description: 'Complete onboarding process for all new employees',
  steps: [
    {
      stepId: generateId('STP'),
      name: 'Pre-Arrival Preparation',
      description: 'HR and IT preparation before employee joins',
      order: 0,
      tasks: [
        'Create employee profile in HR system',
        'Set up email and system accounts',
        'Prepare workstation and equipment',
        'Schedule orientation sessions'
      ],
      estimatedDuration: 3
    },
    {
      stepId: generateId('STP'),
      name: 'Day 1: Welcome & Setup',
      description: 'First day orientation and system access',
      order: 1,
      tasks: [
        'Welcome meeting with HR',
        'Complete joining formalities',
        'Office tour and introductions',
        'System login setup'
      ],
      estimatedDuration: 1
    },
    {
      stepId: generateId('STP'),
      name: 'Week 1: Team Integration',
      description: 'Meet team members and understand team structure',
      order: 2,
      tasks: [
        'Meet with manager',
        'Team lunch introduction',
        '1:1 with team members',
        'Review team processes'
      ],
      estimatedDuration: 5
    },
    {
      stepId: generateId('STP'),
      name: 'Month 1: Role Orientation',
      description: 'Deep dive into role and responsibilities',
      order: 3,
      tasks: [
        'Role training sessions',
        'Shadow senior team member',
        'Complete compliance training',
        'Set 30-day goals'
      ],
      estimatedDuration: 20
    }
  ],
  tasks: [
    // Pre-Arrival tasks
    {
      taskId: generateId('TSK'),
      title: 'Create employee profile in HR system',
      description: 'Add employee details to the HR management system',
      assigneeType: 'hr' as const,
      category: 'documentation' as const,
      estimatedDuration: 1,
      isRequired: true,
      order: 0
    },
    {
      taskId: generateId('TSK'),
      title: 'Set up email and system accounts',
      description: 'Create email, Slack, and other necessary accounts',
      assigneeType: 'it' as const,
      category: 'equipment' as const,
      estimatedDuration: 2,
      isRequired: true,
      order: 1
    },
    {
      taskId: generateId('TSK'),
      title: 'Prepare workstation and equipment',
      description: 'Laptop, desk, access cards, etc.',
      assigneeType: 'it' as const,
      category: 'equipment' as const,
      estimatedDuration: 1,
      isRequired: true,
      order: 2
    },
    {
      taskId: generateId('TSK'),
      title: 'Schedule orientation sessions',
      description: 'Book calendar for orientation week',
      assigneeType: 'hr' as const,
      category: 'training' as const,
      estimatedDuration: 1,
      isRequired: true,
      order: 3
    },
    // Day 1 tasks
    {
      taskId: generateId('TSK'),
      title: 'Complete joining formalities',
      description: 'Sign employment contract, provide documents',
      assigneeType: 'employee' as const,
      category: 'documentation' as const,
      estimatedDuration: 1,
      isRequired: true,
      order: 4
    },
    {
      taskId: generateId('TSK'),
      title: 'Office tour and introductions',
      description: 'Walk through office, meet key people',
      assigneeType: 'hr' as const,
      category: 'introduction' as const,
      estimatedDuration: 1,
      isRequired: true,
      order: 5
    },
    {
      taskId: generateId('TSK'),
      title: 'System login setup',
      description: 'Configure workstation, VPN, and tools',
      assigneeType: 'employee' as const,
      category: 'equipment' as const,
      estimatedDuration: 1,
      isRequired: true,
      order: 6
    },
    // Week 1 tasks
    {
      taskId: generateId('TSK'),
      title: 'Meet with manager',
      description: 'Initial 1:1 to discuss role and expectations',
      assigneeType: 'manager' as const,
      category: 'introduction' as const,
      estimatedDuration: 1,
      isRequired: true,
      order: 7
    },
    {
      taskId: generateId('TSK'),
      title: 'Team lunch introduction',
      description: 'Social lunch with team members',
      assigneeType: 'manager' as const,
      category: 'introduction' as const,
      estimatedDuration: 1,
      isRequired: false,
      order: 8
    },
    {
      taskId: generateId('TSK'),
      title: 'Review team processes',
      description: 'Understand team workflows and tools',
      assigneeType: 'employee' as const,
      category: 'training' as const,
      estimatedDuration: 5,
      isRequired: true,
      order: 9
    },
    // Month 1 tasks
    {
      taskId: generateId('TSK'),
      title: 'Complete compliance training',
      description: 'Security, privacy, and company policies',
      assigneeType: 'employee' as const,
      category: 'compliance' as const,
      estimatedDuration: 5,
      isRequired: true,
      order: 10
    },
    {
      taskId: generateId('TSK'),
      title: 'Set 30-day goals',
      description: 'Document goals with manager agreement',
      assigneeType: 'employee' as const,
      category: 'other' as const,
      estimatedDuration: 1,
      isRequired: true,
      order: 11
    },
    {
      taskId: generateId('TSK'),
      title: 'Shadow senior team member',
      description: 'Learn from experienced colleague',
      assigneeType: 'employee' as const,
      category: 'training' as const,
      estimatedDuration: 5,
      isRequired: false,
      order: 12
    }
  ],
  defaultDuration: 30,
  createdBy: 'system',
  isActive: true,
  version: 1
};

// Engineering specific template
const engineeringTemplate = {
  templateId: generateId('TPL'),
  name: 'Engineering Onboarding',
  description: 'Specialized onboarding for engineering roles',
  steps: [
    {
      stepId: generateId('STP'),
      name: 'Dev Environment Setup',
      description: 'Set up development environment',
      order: 0,
      tasks: ['Clone repositories', 'Configure IDE', 'Run local services'],
      estimatedDuration: 2
    },
    {
      stepId: generateId('STP'),
      name: 'Codebase Introduction',
      description: 'Understand the codebase architecture',
      order: 1,
      tasks: ['Architecture walkthrough', 'Review documentation', 'First code review'],
      estimatedDuration: 5
    },
    {
      stepId: generateId('STP'),
      name: 'First Sprint',
      description: 'Complete first sprint tasks',
      order: 2,
      tasks: ['Pick up starter ticket', 'Submit first PR', 'Deploy to staging'],
      estimatedDuration: 10
    }
  ],
  tasks: [
    {
      taskId: generateId('TSK'),
      title: 'Clone repositories',
      description: 'Clone all required code repositories',
      assigneeType: 'it' as const,
      category: 'equipment' as const,
      estimatedDuration: 1,
      isRequired: true,
      order: 0
    },
    {
      taskId: generateId('TSK'),
      title: 'Configure IDE',
      description: 'Set up VS Code with team extensions',
      assigneeType: 'employee' as const,
      category: 'equipment' as const,
      estimatedDuration: 1,
      isRequired: true,
      order: 1
    },
    {
      taskId: generateId('TSK'),
      title: 'Architecture walkthrough',
      description: 'Session with tech lead on system design',
      assigneeType: 'manager' as const,
      category: 'training' as const,
      estimatedDuration: 2,
      isRequired: true,
      order: 2
    },
    {
      taskId: generateId('TSK'),
      title: 'Submit first PR',
      description: 'Make and submit first code change',
      assigneeType: 'employee' as const,
      category: 'other' as const,
      estimatedDuration: 5,
      isRequired: true,
      order: 3
    }
  ],
  defaultDuration: 45,
  createdBy: 'system',
  isActive: true,
  version: 1
};

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing templates
    await OnboardingTemplate.deleteMany({});
    console.log('Cleared existing templates');

    // Insert templates
    const templates = await OnboardingTemplate.insertMany([standardTemplate, engineeringTemplate]);
    console.log(`Seeded ${templates.length} templates`);

    console.log('Seed completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
