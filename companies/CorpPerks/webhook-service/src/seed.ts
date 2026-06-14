import mongoose from 'mongoose';
import { WebhookSubscription } from './models/webhookSubscription.js';
import { config } from './config/index.js';

const seedSubscriptions = [
  {
    url: 'https://webhook.site/test-1',
    events: ['employee.created', 'employee.updated', 'leave.approved'],
    description: 'Test subscription for employee events',
    createdBy: 'system',
  },
  {
    url: 'https://webhook.site/test-2',
    events: ['attendance.recorded', 'project.updated'],
    description: 'Test subscription for attendance and project events',
    createdBy: 'system',
  },
];

async function seed(): Promise<void> {
  try {
    await mongoose.connect(config.database.mongoUri);
    console.log('Connected to MongoDB');

    // Clear existing data
    await WebhookSubscription.deleteMany({});
    console.log('Cleared existing webhook subscriptions');

    // Insert seed data
    const created = await WebhookSubscription.insertMany(seedSubscriptions);
    console.log(`Created ${created.length} webhook subscriptions`);

    // Log created subscriptions
    for (const sub of created) {
      console.log(`  - ${sub._id}: ${sub.url} (events: ${sub.events.join(', ')})`);
    }

    console.log('Seed completed successfully');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
