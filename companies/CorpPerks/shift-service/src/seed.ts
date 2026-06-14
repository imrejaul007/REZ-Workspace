import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ShiftTemplate, Shift, ShiftSwap, ShiftRequest, ShiftCoverage } from './models';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/corpperks-shifts';

// Demo data
const demoTemplates = [
  { name: 'Morning Shift', startTime: '06:00', endTime: '14:00' },
  { name: 'Afternoon Shift', startTime: '14:00', endTime: '22:00' },
  { name: 'Night Shift', startTime: '22:00', endTime: '06:00' },
  { name: 'Full Day', startTime: '09:00', endTime: '18:00' },
  { name: 'Half Day Morning', startTime: '09:00', endTime: '13:00' },
  { name: 'Half Day Afternoon', startTime: '13:00', endTime: '17:00' },
];

const demoEmployees = [
  { id: 'emp_001', name: 'John Smith' },
  { id: 'emp_002', name: 'Sarah Johnson' },
  { id: 'emp_003', name: 'Michael Chen' },
  { id: 'emp_004', name: 'Emily Davis' },
  { id: 'emp_005', name: 'Robert Wilson' },
];

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Clear existing data
    console.log('Clearing existing data...');
    await Promise.all([
      ShiftTemplate.deleteMany({}),
      Shift.deleteMany({}),
      ShiftSwap.deleteMany({}),
      ShiftRequest.deleteMany({}),
      ShiftCoverage.deleteMany({}),
    ]);
    console.log('Cleared existing data\n');

    // Create templates
    console.log('Creating shift templates...');
    const templates = await ShiftTemplate.insertMany(
      demoTemplates.map((t) => ({
        ...t,
        duration: 0, // Will be calculated by pre-save hook
      }))
    );
    console.log(`Created ${templates.length} templates\n`);

    // Create shifts for the next 7 days
    console.log('Creating shifts for the next 7 days...');
    const shifts = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      // Create 3 shifts per day
      const dayShifts = await Shift.insertMany([
        {
          date: dateStr,
          templateId: templates[0]._id, // Morning
          employees: [demoEmployees[0].id, demoEmployees[1].id],
          status: 'published',
          notes: 'Morning team - Regular operations',
        },
        {
          date: dateStr,
          templateId: templates[1]._id, // Afternoon
          employees: [demoEmployees[2].id, demoEmployees[3].id],
          status: 'published',
          notes: 'Afternoon team - Customer support',
        },
        {
          date: dateStr,
          templateId: templates[2]._id, // Night
          employees: [demoEmployees[4].id],
          status: i === 0 ? 'in_progress' : 'published',
          notes: 'Night team - Security & maintenance',
        },
      ]);
      shifts.push(...dayShifts);
    }
    console.log(`Created ${shifts.length} shifts\n`);

    // Create some coverage requirements
    console.log('Creating coverage requirements...');
    await ShiftCoverage.insertMany(
      shifts.map((shift) => ({
        shiftId: shift._id,
        date: shift.date,
        required: shift.templateId.toString() === templates[0]._id.toString() ? 3 : 2,
        assigned: shift.employees.length,
      }))
    );
    console.log(`Created coverage requirements\n`);

    // Create sample swap request
    console.log('Creating sample swap request...');
    await ShiftSwap.create({
      requesterId: demoEmployees[0].id,
      targetId: demoEmployees[2].id,
      shiftId: shifts[0]._id,
      status: 'pending',
      reason: 'Personal appointment',
    });
    console.log('Created sample swap request\n');

    // Create sample shift request
    console.log('Creating sample shift request...');
    await ShiftRequest.create({
      employeeId: demoEmployees[1].id,
      date: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      type: 'time_off',
      reason: 'Family event',
      status: 'pending',
    });
    console.log('Created sample shift request\n');

    console.log('Seed data created successfully!\n');
    console.log('='.repeat(50));
    console.log('Demo Data Summary:');
    console.log('='.repeat(50));
    console.log(`Templates: ${templates.length}`);
    console.log(`Shifts: ${shifts.length}`);
    console.log(`Employees: ${demoEmployees.length}`);
    console.log('\nEmployee IDs for testing:');
    demoEmployees.forEach((emp) => {
      console.log(`  - ${emp.id}: ${emp.name}`);
    });
    console.log('\nSample API calls:');
    console.log(`  curl http://localhost:${process.env.PORT || 4739}/api/shifts/templates`);
    console.log(`  curl http://localhost:${process.env.PORT || 4739}/api/shifts/${new Date().toISOString().split('T')[0]}`);

  } catch (error) {
    console.error('Seeding failed:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
  }
}

seed().catch(console.error);
