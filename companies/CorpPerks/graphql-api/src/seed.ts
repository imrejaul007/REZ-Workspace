import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from './config/index.js';
import {
  Department,
  Employee,
  Project,
  Task,
  Announcement,
} from './models/index.js';

const departments = [
  { name: 'Engineering', code: 'ENG', description: 'Software development and technology' },
  { name: 'Human Resources', code: 'HR', description: 'People and culture' },
  { name: 'Marketing', code: 'MKT', description: 'Brand and communications' },
  { name: 'Finance', code: 'FIN', description: 'Financial planning and accounting' },
  { name: 'Operations', code: 'OPS', description: 'Business operations' },
];

const employees = [
  { name: 'John Smith', email: 'john.smith@corpperks.com', position: 'Software Engineer', role: 'employee' as const, departmentIndex: 0 },
  { name: 'Sarah Johnson', email: 'sarah.johnson@corpperks.com', position: 'Senior Engineer', role: 'employee' as const, departmentIndex: 0 },
  { name: 'Mike Chen', email: 'mike.chen@corpperks.com', position: 'Engineering Manager', role: 'manager' as const, departmentIndex: 0 },
  { name: 'Emily Davis', email: 'emily.davis@corpperks.com', position: 'HR Manager', role: 'manager' as const, departmentIndex: 1 },
  { name: 'Alex Wilson', email: 'alex.wilson@corpperks.com', position: 'Marketing Lead', role: 'manager' as const, departmentIndex: 2 },
  { name: 'Rachel Brown', email: 'rachel.brown@corpperks.com', position: 'CEO', role: 'admin' as const, departmentIndex: 3 },
  { name: 'David Lee', email: 'david.lee@corpperks.com', position: 'DevOps Engineer', role: 'employee' as const, departmentIndex: 0 },
  { name: 'Lisa Wang', email: 'lisa.wang@corpperks.com', position: 'Product Manager', role: 'employee' as const, departmentIndex: 0 },
];

const projects = [
  { name: 'Mobile App v2', description: 'Next generation mobile application', departmentIndex: 0, status: 'active' as const },
  { name: 'Employee Portal', description: 'Internal HR and employee self-service portal', departmentIndex: 1, status: 'active' as const },
  { name: 'Brand Refresh', description: 'Company branding and visual identity update', departmentIndex: 2, status: 'planning' as const },
];

async function seed(): Promise<void> {
  try {
    await mongoose.connect(config.database.mongoUri);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      Department.deleteMany({}),
      Employee.deleteMany({}),
      Project.deleteMany({}),
      Task.deleteMany({}),
      Announcement.deleteMany({}),
    ]);
    console.log('Cleared existing data');

    // Create departments
    const createdDepartments = await Department.insertMany(departments);
    console.log(`Created ${createdDepartments.length} departments`);

    // Create employees with hashed passwords
    const employeeDocs = await Promise.all(
      employees.map(async (emp, index) => {
        const count = await Employee.countDocuments();
        const employeeId = `EMP${String(count + index + 1).padStart(4, '0')}`;
        return {
          employeeId,
          name: emp.name,
          email: emp.email,
          password: await bcrypt.hash('password123', 10),
          phone: `+1-555-${String(1000 + index).padStart(4, '0')}`,
          departmentId: createdDepartments[emp.departmentIndex]._id,
          role: emp.role,
          position: emp.position,
          joiningDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
          status: 'active' as const,
        };
      })
    );

    const createdEmployees = await Employee.insertMany(employeeDocs);
    console.log(`Created ${createdEmployees.length} employees`);

    // Create projects
    const projectDocs = projects.map((proj) => ({
      ...proj,
      departmentId: createdDepartments[proj.departmentIndex]._id,
      managerId: createdEmployees.find((e) => e.role === 'manager')?._id || createdEmployees[0]._id,
      startDate: new Date(),
      teamMembers: [createdEmployees[0]._id, createdEmployees[1]._id],
    }));

    const createdProjects = await Project.insertMany(projectDocs);
    console.log(`Created ${createdProjects.length} projects`);

    // Create sample tasks
    const taskDocs = [
      {
        title: 'Setup CI/CD Pipeline',
        description: 'Configure GitHub Actions for automated testing and deployment',
        projectId: createdProjects[0]._id,
        assigneeId: createdEmployees[0]._id,
        status: 'in_progress' as const,
        priority: 'high' as const,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        estimatedHours: 16,
      },
      {
        title: 'Design Login Screen',
        description: 'Create UI mockups for the login screen',
        projectId: createdProjects[0]._id,
        assigneeId: createdEmployees[1]._id,
        status: 'done' as const,
        priority: 'medium' as const,
        dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        estimatedHours: 8,
        actualHours: 6,
      },
      {
        title: 'API Integration',
        description: 'Integrate with backend API endpoints',
        projectId: createdProjects[0]._id,
        status: 'todo' as const,
        priority: 'high' as const,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        estimatedHours: 24,
      },
    ];

    await Task.insertMany(taskDocs);
    console.log(`Created ${taskDocs.length} tasks`);

    // Create announcements
    const announcementDocs = [
      {
        title: 'Welcome to CorpPerks!',
        content: 'We are excited to launch our new HR platform. Please explore all the features and let us know your feedback.',
        authorId: createdEmployees[5]._id, // CEO
        priority: 'high' as const,
        category: 'general' as const,
        isActive: true,
      },
      {
        title: 'Team Lunch - Friday',
        content: 'Join us for team lunch this Friday at 12:30 PM in the main conference room.',
        authorId: createdEmployees[3]._id, // HR Manager
        priority: 'normal' as const,
        category: 'events' as const,
        isActive: true,
      },
    ];

    await Announcement.insertMany(announcementDocs);
    console.log(`Created ${announcementDocs.length} announcements`);

    console.log('\nSeed completed successfully!');
    console.log('\nDemo credentials:');
    console.log('  Email: john.smith@corpperks.com');
    console.log('  Password: password123');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
