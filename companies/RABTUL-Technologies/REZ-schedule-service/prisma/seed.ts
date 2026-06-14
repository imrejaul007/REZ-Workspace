// ReZ Schedule - Seed Script
// Run with: yarn db:seed
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  console.log('Cleaning existing data...');
  await prisma.webhookDelivery.deleteMany();
  await prisma.webhook.deleteMany();
  await prisma.videoMeeting.deleteMany();
  await prisma.bookingReference.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.waitingList.deleteMany();
  await prisma.seat.deleteMany();
  await prisma.customQuestion.deleteMany();
  await prisma.eventTypeSchedule.deleteMany();
  await prisma.specialDate.deleteMany();
  await prisma.scheduleDay.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.eventType.deleteMany();
  await prisma.attendee.deleteMany();
  await prisma.calendarIntegration.deleteMany();
  await prisma.selectedCalendar.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.auditLog.deleteMany();

  // Create organization
  console.log('Creating organization...');
  const org = await prisma.organization.create({
    data: {
      name: 'ReZ Technologies',
      slug: 'rez-tech',
      logo: 'https://rez.money/logo.png',
      primaryColor: '#6366f1',
      settings: {
        defaultTimezone: 'Asia/Kolkata',
        weekStartDay: 0,
      },
    },
  });

  // Create users
  console.log('Creating users...');
  const users = await Promise.all([
    prisma.user.create({
      data: {
        userId: 'user_admin_001',
        username: 'admin',
        name: 'Admin User',
        email: 'admin@rez.money',
        timeZone: 'Asia/Kolkata',
        weekStartDay: 0,
        bio: 'Platform administrator',
        role: 'OWNER',
        organizationId: org.id,
      },
    }),
    prisma.user.create({
      data: {
        userId: 'user_salon_001',
        username: 'glamstudio',
        name: 'Glam Studio',
        email: 'glam@salon.example.com',
        timeZone: 'Asia/Kolkata',
        weekStartDay: 1,
        bio: 'Premium hair and beauty salon',
        role: 'ADMIN',
        organizationId: org.id,
      },
    }),
    prisma.user.create({
      data: {
        userId: 'user_clinic_001',
        username: 'drsharma',
        name: 'Dr. Priya Sharma',
        email: 'priya@clinic.example.com',
        timeZone: 'Asia/Kolkata',
        weekStartDay: 1,
        bio: 'General Physician - 10 years experience',
        role: 'MEMBER',
        organizationId: org.id,
      },
    }),
    prisma.user.create({
      data: {
        userId: 'user_consultant_001',
        username: 'consultant_raj',
        name: 'Raj Patel',
        email: 'raj@consultant.example.com',
        timeZone: 'Asia/Kolkata',
        weekStartDay: 1,
        bio: 'Business Strategy Consultant',
        role: 'MEMBER',
        organizationId: org.id,
      },
    }),
  ]);

  const [admin, salon, doctor, consultant] = users;

  // Create schedules
  console.log('Creating schedules...');
  const salonSchedule = await prisma.schedule.create({
    data: {
      name: 'Salon Hours',
      userId: salon.id,
      isDefault: true,
      availability: {
        createMany: {
          data: [
            { dayOfWeek: 0, enabled: false, startTime: '10:00', endTime: '20:00' },
            { dayOfWeek: 1, enabled: true, startTime: '10:00', endTime: '20:00' },
            { dayOfWeek: 2, enabled: true, startTime: '10:00', endTime: '20:00' },
            { dayOfWeek: 3, enabled: true, startTime: '10:00', endTime: '20:00' },
            { dayOfWeek: 4, enabled: true, startTime: '10:00', endTime: '20:00' },
            { dayOfWeek: 5, enabled: true, startTime: '10:00', endTime: '20:00' },
            { dayOfWeek: 6, enabled: true, startTime: '10:00', endTime: '18:00' },
          ],
        },
      },
    },
  });

  const doctorSchedule = await prisma.schedule.create({
    data: {
      name: 'Clinic Hours',
      userId: doctor.id,
      isDefault: true,
      availability: {
        createMany: {
          data: [
            { dayOfWeek: 0, enabled: false, startTime: '09:00', endTime: '18:00' },
            { dayOfWeek: 1, enabled: true, startTime: '09:00', endTime: '18:00' },
            { dayOfWeek: 2, enabled: true, startTime: '09:00', endTime: '18:00' },
            { dayOfWeek: 3, enabled: true, startTime: '09:00', endTime: '18:00' },
            { dayOfWeek: 4, enabled: true, startTime: '09:00', endTime: '18:00' },
            { dayOfWeek: 5, enabled: true, startTime: '09:00', endTime: '18:00' },
            { dayOfWeek: 6, enabled: false, startTime: '09:00', endTime: '14:00' },
          ],
        },
      },
    },
  });

  const consultantSchedule = await prisma.schedule.create({
    data: {
      name: 'Business Hours',
      userId: consultant.id,
      isDefault: true,
      availability: {
        createMany: {
          data: [
            { dayOfWeek: 0, enabled: true, startTime: '08:00', endTime: '20:00' },
            { dayOfWeek: 1, enabled: true, startTime: '08:00', endTime: '20:00' },
            { dayOfWeek: 2, enabled: true, startTime: '08:00', endTime: '20:00' },
            { dayOfWeek: 3, enabled: true, startTime: '08:00', endTime: '20:00' },
            { dayOfWeek: 4, enabled: true, startTime: '08:00', endTime: '20:00' },
            { dayOfWeek: 5, enabled: true, startTime: '08:00', endTime: '20:00' },
            { dayOfWeek: 6, enabled: false, startTime: '10:00', endTime: '16:00' },
          ],
        },
      },
    },
  });

  // Create event types
  console.log('Creating event types...');

  // Salon event types
  const haircutEvent = await prisma.eventType.create({
    data: {
      slug: 'haircut-styling',
      title: 'Haircut & Styling',
      description: 'Professional haircut with styling. Includes consultation, wash, cut, and blow-dry.',
      duration: 45,
      bufferTime: 15,
      locationType: 'IN_PERSON',
      locationAddress: '123 Beauty Lane, Mumbai',
      requiresConfirmation: false,
      maxBookingsPerDay: 12,
      minNoticeMinutes: 60,
      price: 1500,
      currency: 'INR',
      paidBooking: true,
      userId: salon.id,
      organizationId: org.id,
      customQuestions: {
        create: [
          { question: 'Preferred stylist', type: 'SELECT', required: true, options: ['Any', 'Senior Stylist', 'Junior Stylist'], order: 0 },
          { question: 'Hair type/style notes', type: 'TEXTAREA', required: false, order: 1 },
        ],
      },
    },
  });

  const facialEvent = await prisma.eventType.create({
    data: {
      slug: 'facial-treatment',
      title: 'Facial Treatment',
      description: 'Rejuvenating facial treatment with premium products.',
      duration: 60,
      bufferTime: 15,
      locationType: 'IN_PERSON',
      locationAddress: '123 Beauty Lane, Mumbai',
      requiresConfirmation: true,
      maxBookingsPerDay: 8,
      minNoticeMinutes: 120,
      price: 2500,
      currency: 'INR',
      paidBooking: true,
      userId: salon.id,
      organizationId: org.id,
    },
  });

  // Doctor event types
  await prisma.eventType.create({
    data: {
      slug: 'consultation',
      title: 'General Consultation',
      description: '15-minute consultation for general health concerns.',
      duration: 15,
      bufferTime: 5,
      locationType: 'VIDEO_CALL',
      meetingUrl: 'https://meet.example.com/dr-sharma',
      requiresConfirmation: true,
      maxBookingsPerDay: 30,
      minNoticeMinutes: 30,
      price: 500,
      currency: 'INR',
      paidBooking: true,
      userId: doctor.id,
      organizationId: org.id,
      customQuestions: {
        create: [
          { question: 'Symptoms', type: 'TEXTAREA', required: true, order: 0 },
          { question: 'Current medications', type: 'TEXTAREA', required: false, order: 1 },
        ],
      },
    },
  });

  await prisma.eventType.create({
    data: {
      slug: 'follow-up',
      title: 'Follow-up Visit',
      description: 'Follow-up consultation for existing patients.',
      duration: 10,
      bufferTime: 5,
      locationType: 'VIDEO_CALL',
      requiresConfirmation: false,
      maxBookingsPerDay: 40,
      minNoticeMinutes: 15,
      price: 300,
      currency: 'INR',
      paidBooking: true,
      userId: doctor.id,
      organizationId: org.id,
    },
  });

  // Consultant event types
  await prisma.eventType.create({
    data: {
      slug: 'strategy-session',
      title: 'Business Strategy Session',
      description: 'Deep-dive into your business challenges with actionable insights.',
      duration: 60,
      bufferTime: 15,
      locationType: 'VIDEO_CALL',
      meetingUrl: 'https://zoom.example.com/raj',
      requiresConfirmation: true,
      maxBookingsPerDay: 5,
      minNoticeMinutes: 1440, // 24 hours
      price: 10000,
      currency: 'INR',
      paidBooking: true,
      userId: consultant.id,
      organizationId: org.id,
      customQuestions: {
        create: [
          { question: 'Company name', type: 'TEXT', required: true, order: 0 },
          { question: 'Current challenges', type: 'SELECT', required: true, options: ['Growth', 'Sales', 'Operations', 'Marketing', 'Other'], order: 1 },
          { question: 'Brief description', type: 'TEXTAREA', required: true, order: 2 },
        ],
      },
    },
  });

  await prisma.eventType.create({
    data: {
      slug: 'quick-call',
      title: 'Quick Call (Free)',
      description: '15-minute introductory call to discuss your needs.',
      duration: 15,
      bufferTime: 5,
      locationType: 'PHONE_CALL',
      phoneNumber: '+919876543210',
      requiresConfirmation: false,
      maxBookingsPerDay: 10,
      minNoticeMinutes: 60,
      userId: consultant.id,
      organizationId: org.id,
    },
  });

  // Create sample bookings
  console.log('Creating sample bookings...');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const attendee1 = await prisma.attendee.create({
    data: {
      email: 'john.doe@example.com',
      name: 'John Doe',
      phone: '+919876543211',
    },
  });

  await prisma.booking.create({
    data: {
      uid: `bk_${Date.now()}_001`,
      status: 'CONFIRMED',
      eventTypeId: haircutEvent.id,
      userId: salon.id,
      startTime: tomorrow,
      endTime: new Date(tomorrow.getTime() + 45 * 60000),
      timezone: 'Asia/Kolkata',
      attendeeId: attendee1.id,
      locationType: 'IN_PERSON',
      price: 1500,
      currency: 'INR',
      paymentStatus: 'PAID',
      confirmedAt: new Date(),
    },
  });

  // Create a webhook for testing
  console.log('Creating test webhook...');
  await prisma.webhook.create({
    data: {
      userId: admin.id,
      url: 'https://webhook.site/test',
      secret: 'test_secret_1234567890abcdef',
      triggers: ['booking.created', 'booking.cancelled', 'booking.confirmed'],
      active: true,
    },
  });

  console.log('✅ Seeding completed!');
  console.log('\n📋 Created:');
  console.log(`   - 1 Organization: ${org.name}`);
  console.log(`   - ${users.length} Users`);
  console.log(`   - 3 Schedules`);
  console.log(`   - 6 Event Types`);
  console.log(`   - 1 Sample Booking`);
  console.log(`   - 1 Test Webhook`);
  console.log('\n🔗 Test URLs:');
  console.log(`   - Salon: /api/event-types/public/glamstudio/haircut-styling`);
  console.log(`   - Doctor: /api/event-types/public/drsharma/consultation`);
  console.log(`   - Consultant: /api/event-types/public/consultant_raj/quick-call`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
