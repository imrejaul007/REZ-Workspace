import { logger } from '../../shared/logger';
/**
 * Sample Data Generator
 *
 * Generates realistic demo data for TwinOS:
 * - 50 sample users with twins
 * - 10 companies with hires
 * - Hiring history
 * - Metrics and analytics
 *
 * Run with: npx tsx scripts/generate-sample-data.ts
 */

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/twinos';

// Sample data
const FIRST_NAMES = [
  'Rahul', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Anita', 'Raj', 'Meera', 'Arjun', 'Kavya',
  'Rohan', 'Nisha', 'Vivek', 'Pooja', 'Sanjay', 'Divya', 'Kiran', 'Lakshmi', 'Deepak', 'Shreya',
  'Aditya', 'Ishita', 'Ravi', 'Ananya', 'Varun', 'Riya', 'Karthik', 'Sneha', 'Nikhil', 'Aishwarya'
];

const LAST_NAMES = [
  'Sharma', 'Patel', 'Kumar', 'Reddy', 'Singh', 'Gupta', 'Menon', 'Desai', 'Nair', 'Iyer',
  'Verma', 'Kapoor', 'Mehta', 'Chopra', 'Bhat', 'Pillai', 'Krishnan', 'Srinivasan', 'Rao', 'Joshi'
];

const DEPARTMENTS = [
  'Engineering', 'Design', 'Marketing', 'Sales', 'Finance', 'Operations', 'HR', 'Product', 'Data Science', 'Customer Success'
];

const SKILLS = {
  Engineering: ['Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'Go', 'Rust', 'AWS', 'Kubernetes', 'Docker', 'PostgreSQL', 'MongoDB', 'Redis'],
  Design: ['Figma', 'Sketch', 'Adobe XD', 'UI/UX', 'Design Systems', 'Prototyping', 'User Research', 'Wireframing'],
  Marketing: ['SEO', 'Content Marketing', 'Social Media', 'Google Ads', 'Analytics', 'Copywriting', 'Brand Strategy'],
  Sales: ['CRM', 'Negotiation', 'Cold Calling', 'Lead Generation', 'Account Management', 'Salesforce'],
  Finance: ['Financial Modeling', 'Excel', 'SAP', 'QuickBooks', 'Tax Planning', 'Auditing'],
  Operations: ['Project Management', 'Lean Six Sigma', 'Supply Chain', 'Process Optimization', 'Vendor Management'],
  HR: ['Recruiting', 'Training', 'Performance Management', 'Employee Relations', 'Compensation'],
  Product: ['Product Strategy', 'Roadmapping', 'User Stories', 'A/B Testing', 'Analytics'],
  'Data Science': ['Python', 'Machine Learning', 'TensorFlow', 'PyTorch', 'SQL', 'Data Visualization', 'Statistics'],
  'Customer Success': ['Onboarding', 'Churn Prevention', 'QBRs', 'Customer Health', 'Support']
};

const CITIES = [
  'Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', 'Ahmedabad'
];

const COMPANIES = [
  { name: 'TechCorp India', type: 'IT Services', size: 500 },
  { name: 'Innovate Labs', type: 'Startup', size: 50 },
  { name: 'FinanceHub', type: 'FinTech', size: 200 },
  { name: 'RetailMax', type: 'E-commerce', size: 300 },
  { name: 'HealthFirst', type: 'Healthcare', size: 150 },
  { name: 'EduLearn', type: 'EdTech', size: 80 },
  { name: 'LogiSwift', type: 'Logistics', size: 250 },
  { name: 'MediaWorks', type: 'Media', size: 100 },
  { name: 'GreenEnergy Co', type: 'CleanTech', size: 75 },
  { name: 'FoodieExpress', type: 'Food Tech', size: 120 }
];

// Utilities
function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals: number = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function generateCorpId(): string {
  return `CI-IND-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function generateTwinId(corpId: string, type: string): string {
  return `TWIN-${corpId}-${type}`;
}

function generateCompanyId(): string {
  return `CI-BIZ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

// Generate sample twin
function generateTwin(corpId: string, firstName: string, lastName: string, department: string, type: string) {
  const skills = SKILLS[department as keyof typeof SKILLS] || SKILLS.Engineering;
  const expertiseCount = randomInt(3, 7);
  const expertise = [];
  for (let i = 0; i < expertiseCount; i++) {
    const skill = randomItem(skills);
    if (!expertise.includes(skill)) expertise.push(skill);
  }

  const baseMultiplier = type === 'EXECUTION' ? 3.0 : type === 'SKILL' ? 2.5 : type === 'KNOWLEDGE' ? 1.5 : type === 'PRODUCTIVITY' ? 1.5 : 1.0;
  const variance = randomFloat(0, 0.5);
  const productivityMultiplier = parseFloat((baseMultiplier + variance).toFixed(1));

  const trainingHours = randomInt(100, 3000);
  const knowledgeScore = randomInt(40, 95);
  const executionScore = randomInt(40, 95);
  const reliabilityScore = randomInt(80, 99);

  return {
    twinId: generateTwinId(corpId, type),
    ownerCorpId: corpId,
    ownerName: `${firstName} ${lastName}`,
    ownerEmail: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
    twinType: type,
    ownership: {
      ownedBy: 'EMPLOYEE',
      transferRights: true,
      portability: true
    },
    learning: {
      sources: [
        { sourceType: 'CORPPERKS_SYNC', lastSync: new Date(), dataPoints: randomInt(10, 100) },
        { sourceType: 'SKILLNET', lastSync: new Date(), dataPoints: randomInt(50, 500) }
      ],
      totalTrainingHours: trainingHours,
      lastActiveAt: new Date()
    },
    knowledge: {
      domains: [department],
      expertise,
      methodologies: ['Agile', 'TDD'].slice(0, randomInt(0, 2)),
      tools: expertise.slice(0, randomInt(2, 5)),
      languages: ['English', 'Hindi'].slice(0, randomInt(1, 2))
    },
    behavior: {
      workStyle: randomItem(['deep_worker', 'collaborative', 'fast_deliver']),
      communicationStyle: randomItem(['clear_direct', 'concise', 'collaborative']),
      decisionPattern: randomItem(['data_driven', 'balanced', 'intuitive']),
      learningStyle: randomItem(['hands_on', 'reading', 'visual']),
      strengths: expertise.slice(0, 3),
      growthAreas: []
    },
    metrics: {
      productivityMultiplier,
      knowledgeScore,
      executionScore,
      reliabilityScore,
      combinedScore: Math.round((knowledgeScore + executionScore + reliabilityScore) / 3)
    },
    privacy: {
      shareWithCurrentEmployer: true,
      shareWithFutureEmployer: true,
      showInResume: type !== 'PRODUCTIVITY',
      verifiedClaims: expertise.slice(0, 3)
    },
    status: trainingHours > 100 ? 'ACTIVE' : 'TRAINING',
    version: 1,
    createdAt: new Date(Date.now() - randomInt(1, 90) * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  };
}

// Generate sample company
function generateCompany(index: number) {
  const company = COMPANIES[index];
  return {
    companyId: generateCompanyId(),
    companyName: company.name,
    companyType: company.type,
    companySize: company.size,
    city: randomItem(CITIES),
    status: 'active',
    twinsHired: randomInt(0, 10),
    totalSpend: randomInt(10000, 200000),
    subscriptionPlan: randomItem(['startup', 'business', 'enterprise']),
    createdAt: new Date(Date.now() - randomInt(30, 365) * 24 * 60 * 60 * 1000)
  };
}

// Generate access grant
function generateAccessGrant(userCorpId: string, companyId: string, twinId: string, type: string) {
  const startDate = new Date(Date.now() - randomInt(1, 180) * 24 * 60 * 60 * 1000);
  const isActive = Math.random() > 0.3;

  return {
    grantId: `GRANT-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    twinId,
    ownerCorpId: userCorpId,
    companyCorpId: companyId,
    companyName: COMPANIES.find((_, i) => i % 10 === 0)?.name || 'TechCorp India',
    accessType: 'USE',
    employmentStartDate: startDate,
    employmentEndDate: isActive ? null : startDate,
    isActive,
    usage: {
      totalInvocations: randomInt(10, 500),
      lastUsedAt: new Date(),
      avgSatisfaction: randomFloat(3.5, 5.0)
    },
    createdAt: startDate,
    expiresAt: new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000)
  };
}

// Main
async function generateData(count: number = 50) {
  logger.info('\n🎲 TwinOS Sample Data Generator\n');
  logger.info('═'.repeat(50));

  try {
    await mongoose.connect(MONGODB_URI);
    logger.info(`\n✅ Connected to MongoDB`);

    const db = mongoose.connection.db!;

    // Collections
    const twinsCollection = db.collection('professionaltwins');
    const grantsCollection = db.collection('accessgrants');
    const companiesCollection = db.collection('companies');
    const subscriptionsCollection = db.collection('subscriptions');

    // Clear existing data
    logger.info('\n🗑️  Clearing existing data...');
    await twinsCollection.deleteMany({});
    await grantsCollection.deleteMany({});
    await companiesCollection.deleteMany({});
    await subscriptionsCollection.deleteMany({});

    logger.info(`\n📊 Generating ${count} users with twins...`);

    let twinsCreated = 0;
    let grantsCreated = 0;
    const users = [];

    // Generate users and twins
    for (let i = 0; i < count; i++) {
      const firstName = randomItem(FIRST_NAMES);
      const lastName = randomItem(LAST_NAMES);
      const department = randomItem(DEPARTMENTS);
      const corpId = generateCorpId();

      users.push({ corpId, firstName, lastName, department });

      // Create 5 twins for each user
      const twinTypes = ['KNOWLEDGE', 'SKILL', 'CAREER', 'PRODUCTIVITY', 'EXECUTION'];

      for (const type of twinTypes) {
        const twin = generateTwin(corpId, firstName, lastName, department, type);
        await twinsCollection.insertOne(twin);
        twinsCreated++;

        // Random access grants (30% chance)
        if (Math.random() < 0.3 && i < 10) {
          const company = COMPANIES[i % 10];
          const grant = generateAccessGrant(corpId, company.companyId, twin.twinId, type);
          await grantsCollection.insertOne(grant);
          grantsCreated++;
        }
      }

      if ((i + 1) % 10 === 0) {
        logger.info(`   Created ${i + 1}/${count} users...`);
      }
    }

    // Generate companies
    logger.info('\n🏢 Generating companies...');
    for (let i = 0; i < COMPANIES.length; i++) {
      const company = generateCompany(i);
      await companiesCollection.insertOne(company);
    }
    logger.info(`   Created ${COMPANIES.length} companies`);

    // Generate subscriptions
    logger.info('\n💳 Generating subscriptions...');
    for (const user of users.slice(0, 20)) {
      const plan = randomItem(['basic', 'pro', 'premium']);
      const subscription = {
        subscriptionId: `SUB-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        ownerCorpId: user.corpId,
        planId: `twinos-${plan}`,
        planType: 'individual',
        status: 'active',
        price: plan === 'basic' ? 0 : plan === 'pro' ? 499 : 999,
        twinsLimit: plan === 'basic' ? 1 : plan === 'pro' ? 3 : 5,
        memoryLimit: plan === 'basic' ? 1024 : plan === 'pro' ? 10240 : 102400,
        twinTypes: plan === 'basic' ? ['KNOWLEDGE'] : plan === 'pro' ? ['KNOWLEDGE', 'SKILL', 'CAREER'] : ['KNOWLEDGE', 'SKILL', 'CAREER', 'PRODUCTIVITY', 'EXECUTION'],
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date()
      };
      await subscriptionsCollection.insertOne(subscription);
    }
    logger.info(`   Created 20 subscriptions`);

    // Summary
    logger.info('\n' + '═'.repeat(50));
    logger.info('\n✅ Sample data generated successfully!\n');
    logger.info('📊 Summary:');
    logger.info(`   Users:          ${count}`);
    logger.info(`   Twins:          ${twinsCreated}`);
    logger.info(`   Access Grants:   ${grantsCreated}`);
    logger.info(`   Companies:      ${COMPANIES.length}`);
    logger.info(`   Subscriptions:  20`);
    logger.info('\n' + '═'.repeat(50));

    // Show sample twin
    const sampleTwin = await twinsCollection.findOne({});
    logger.info('\n📌 Sample Twin:');
    logger.info(JSON.stringify(sampleTwin, null, 2));

  } catch (error) {
    logger.error('\n❌ Error generating data:', error);
  } finally {
    await mongoose.disconnect();
    logger.info('\n🔌 Disconnected from MongoDB\n');
  }
}

// Run
const count = parseInt(process.argv[2] || '50');
generateData(count);
