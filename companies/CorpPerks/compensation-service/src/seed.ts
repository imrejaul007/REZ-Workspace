import mongoose from 'mongoose';
import { SalaryBand } from './models/SalaryBand.js';
import { CompensationPackage } from './models/CompensationPackage.js';
import { IncrementPlan } from './models/IncrementPlan.js';
import { BonusPlan } from './models/BonusPlan.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/compensation_db';

async function seed(): Promise<void> {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    console.log('Clearing existing data...');
    await Promise.all([
      SalaryBand.deleteMany({}),
      CompensationPackage.deleteMany({}),
      IncrementPlan.deleteMany({}),
      BonusPlan.deleteMany({}),
    ]);

    // Create Salary Bands
    console.log('Creating salary bands...');
    const bands = await SalaryBand.insertMany([
      { name: 'Associate', minSalary: 300000, maxSalary: 600000, level: 'L1', currency: 'INR' },
      { name: 'Senior Associate', minSalary: 500000, maxSalary: 900000, level: 'L2', currency: 'INR' },
      { name: 'Team Lead', minSalary: 800000, maxSalary: 1400000, level: 'L3', currency: 'INR' },
      { name: 'Manager', minSalary: 1200000, maxSalary: 2000000, level: 'L4', currency: 'INR' },
      { name: 'Senior Manager', minSalary: 1800000, maxSalary: 3000000, level: 'L5', currency: 'INR' },
      { name: 'Director', minSalary: 2500000, maxSalary: 4500000, level: 'L6', currency: 'INR' },
    ]);
    console.log(`Created ${bands.length} salary bands`);

    // Create Compensation Packages
    console.log('Creating compensation packages...');
    const compensations = await CompensationPackage.insertMany([
      {
        employeeId: 'EMP001',
        bandId: bands[0]._id,
        salary: 450000,
        equity: { shares: 1000, vestingPeriodMonths: 48, strikePrice: 10 },
        benefits: { healthInsurance: 30000, retirement: 45000, allowances: {}, otherBenefits: {} },
        effectiveDate: new Date('2025-01-01'),
      },
      {
        employeeId: 'EMP002',
        bandId: bands[1]._id,
        salary: 750000,
        equity: { shares: 2500, vestingPeriodMonths: 48, strikePrice: 15 },
        benefits: { healthInsurance: 50000, retirement: 75000, allowances: { car: 240000 }, otherBenefits: {} },
        effectiveDate: new Date('2025-01-01'),
      },
      {
        employeeId: 'EMP003',
        bandId: bands[2]._id,
        salary: 1100000,
        equity: { shares: 5000, vestingPeriodMonths: 48, strikePrice: 20 },
        benefits: { healthInsurance: 75000, retirement: 110000, allowances: { car: 360000 }, otherBenefits: {} },
        effectiveDate: new Date('2025-01-01'),
      },
      {
        employeeId: 'EMP004',
        bandId: bands[3]._id,
        salary: 1600000,
        equity: { shares: 10000, vestingPeriodMonths: 48, strikePrice: 25 },
        benefits: { healthInsurance: 100000, retirement: 160000, allowances: { car: 480000 }, otherBenefits: {} },
        effectiveDate: new Date('2025-01-01'),
      },
    ]);
    console.log(`Created ${compensations.length} compensation packages`);

    // Create Increment Plan
    console.log('Creating increment plan...');
    const incrementPlan = await IncrementPlan.create({
      name: 'FY26 Annual Increment',
      fiscalYear: 'FY26',
      percentage: 8,
      criteria: {
        minPerformanceRating: 3,
        maxPerformanceRating: 5,
        eligibilityType: 'performance_based',
      },
      plannedDate: new Date('2026-04-01'),
      status: 'draft',
      createdBy: 'admin',
    });
    console.log('Created increment plan:', incrementPlan.name);

    // Create Bonus Plans
    console.log('Creating bonus plans...');
    const bonusPlans = await BonusPlan.insertMany([
      {
        name: 'FY25 Annual Bonus',
        type: 'annual',
        criteria: {
          eligibilityType: 'tiered',
          tiers: [
            { minRating: 4.5, maxRating: 5.0, percentage: 20 },
            { minRating: 4.0, maxRating: 4.49, percentage: 15 },
            { minRating: 3.5, maxRating: 3.99, percentage: 10 },
            { minRating: 3.0, maxRating: 3.49, percentage: 5 },
          ],
        },
        payoutDate: new Date('2026-03-31'),
        budget: 5000000,
        status: 'active',
      },
      {
        name: 'Q4 Performance Bonus',
        type: 'quarterly',
        criteria: {
          eligibilityType: 'performance_based',
          minPerformanceRating: 3.5,
        },
        payoutDate: new Date('2026-03-31'),
        status: 'active',
      },
      {
        name: 'Retention Bonus 2026',
        type: 'retention',
        criteria: {
          eligibilityType: 'tenure_based',
          minTenureMonths: 24,
        },
        payoutDate: new Date('2026-06-30'),
        status: 'active',
      },
    ]);
    console.log(`Created ${bonusPlans.length} bonus plans`);

    console.log('\n✅ Seed completed successfully!');
    console.log('\nSample Data:');
    console.log('-------------');
    console.log('Salary Bands:', bands.map(b => b.name).join(', '));
    console.log('Employees:', compensations.map(c => c.employeeId).join(', '));
    console.log('Increment Plan:', incrementPlan.name);
    console.log('Bonus Plans:', bonusPlans.map(b => b.name).join(', '));

  } catch (error) {
    console.error('Seed failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

seed();
