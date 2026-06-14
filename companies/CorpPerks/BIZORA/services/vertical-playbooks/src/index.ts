/**
 * BIZORA Vertical Playbooks
 * Industry-specific launch and operation playbooks
 */

import express, { Request, Response } from 'express';

const app = express();
app.use(express.json());

// ============================================================================
// Vertical Playbooks
// ============================================================================

const PLAYBOOKS = {
  restaurant: {
    industry: 'Restaurant',
    tagline: 'From registration to 100 orders/day',
    phases: [
      {
        phase: 1,
        name: 'Legal Setup (Week 1-2)',
        duration: '2 weeks',
        tasks: [
          { id: 'r1', task: 'Company Registration', service: 'taxflow', action: 'register', priority: 'high' },
          { id: 'r2', task: 'GST Registration', service: 'taxflow', action: 'gst', priority: 'high' },
          { id: 'r3', task: 'FSSAI License', service: 'compliance', action: 'fssai', priority: 'high' },
          { id: 'r4', task: 'Bank Account', service: 'finance', action: 'open_account', priority: 'medium' },
        ],
        automatable: ['gst_registration', 'bank_account'],
      },
      {
        phase: 2,
        name: 'Operations Setup (Week 2-3)',
        duration: '2 weeks',
        tasks: [
          { id: 'r5', task: 'RestaurantOS Setup', service: 'restaurant-os', action: 'setup', priority: 'high' },
          { id: 'r6', task: 'Menu Configuration', service: 'restaurant-os', action: 'menu_setup', priority: 'high' },
          { id: 'r7', task: 'QR Menu Setup', service: 'restaurant-os', action: 'qr_menu', priority: 'medium' },
          { id: 'r8', task: 'Printer Setup', service: 'restaurant-os', action: 'printer', priority: 'low' },
        ],
        automatable: ['menu_setup', 'qr_menu'],
      },
      {
        phase: 3,
        name: 'Delivery Integration (Week 3)',
        duration: '1 week',
        tasks: [
          { id: 'r9', task: 'Zomato Onboarding', service: 'delivery', action: 'zomato', priority: 'medium' },
          { id: 'r10', task: 'Swiggy Onboarding', service: 'delivery', action: 'swiggy', priority: 'medium' },
          { id: 'r11', task: 'Delivery Packaging', service: 'procurement', action: 'packaging', priority: 'low' },
        ],
        automatable: ['zomato', 'swiggy'],
      },
      {
        phase: 4,
        name: 'Team Setup (Week 3-4)',
        duration: '2 weeks',
        tasks: [
          { id: 'r12', task: 'Staff Hiring', service: 'people-os', action: 'post_jobs', priority: 'high' },
          { id: 'r13', task: 'Attendance Setup', service: 'people-os', action: 'attendance', priority: 'medium' },
          { id: 'r14', task: 'Payroll Setup', service: 'people-os', action: 'payroll', priority: 'medium' },
          { id: 'r15', task: 'Training Materials', service: 'people-os', action: 'training', priority: 'low' },
        ],
        automatable: ['attendance', 'payroll'],
      },
      {
        phase: 5,
        name: 'Marketing Launch (Week 4)',
        duration: '1 week',
        tasks: [
          { id: 'r16', task: 'Google Business Listing', service: 'marketing', action: 'google_business', priority: 'high' },
          { id: 'r17', task: 'Social Media Setup', service: 'marketing', action: 'social_setup', priority: 'high' },
          { id: 'r18', task: 'Launch Campaign', service: 'marketing', action: 'launch_campaign', priority: 'medium' },
          { id: 'r19', task: 'Loyalty Program', service: 'restaurant-os', action: 'loyalty', priority: 'low' },
        ],
        automatable: ['google_business', 'social_setup'],
      },
      {
        phase: 6,
        name: 'Opening & Operations (Week 5-6)',
        duration: '2 weeks',
        tasks: [
          { id: 'r20', task: 'Soft Launch', service: 'workflow', action: 'announce', priority: 'high' },
          { id: 'r21', task: 'Grand Opening', service: 'marketing', action: 'grand_opening', priority: 'high' },
          { id: 'r22', task: 'Review Collection', service: 'marketing', action: 'reviews', priority: 'medium' },
          { id: 'r23', task: 'First Month Review', service: 'advisor', action: 'review', priority: 'medium' },
        ],
        automatable: ['announce', 'reviews'],
      },
    ],
    aiActions: [
      'file_gst_automatically',
      'post_job_listings',
      'create_social_content',
      'send_review_requests',
      'analyze_competitor_pricing',
      'optimize_menu_pricing',
    ],
    kpis: ['daily_orders', 'average_order_value', 'delivery_rating', 'dine_in_rating', 'table_turnover'],
  },

  salon: {
    industry: 'Salon & Beauty',
    tagline: 'Build your beauty business from scratch',
    phases: [
      {
        phase: 1,
        name: 'Legal Setup (Week 1-2)',
        duration: '2 weeks',
        tasks: [
          { id: 's1', task: 'Company Registration', service: 'taxflow', action: 'register', priority: 'high' },
          { id: 's2', task: 'GST Registration', service: 'taxflow', action: 'gst', priority: 'high' },
          { id: 's3', task: 'Shop License', service: 'compliance', action: 'shop_license', priority: 'medium' },
        ],
        automatable: ['gst_registration'],
      },
      {
        phase: 2,
        name: 'SalonOS Setup (Week 2-3)',
        duration: '2 weeks',
        tasks: [
          { id: 's4', task: 'SalonOS Setup', service: 'salon-os', action: 'setup', priority: 'high' },
          { id: 's5', task: 'Service Menu', service: 'salon-os', action: 'services', priority: 'high' },
          { id: 's6', task: 'Staff Scheduling', service: 'salon-os', action: 'schedule', priority: 'medium' },
          { id: 's7', task: 'SMS Setup', service: 'notification', action: 'sms_reminders', priority: 'medium' },
        ],
        automatable: ['services', 'schedule', 'sms_reminders'],
      },
      {
        phase: 3,
        name: 'Marketing (Week 3-4)',
        duration: '2 weeks',
        tasks: [
          { id: 's8', task: 'Instagram Setup', service: 'marketing', action: 'instagram', priority: 'high' },
          { id: 's9', task: 'Google Business', service: 'marketing', action: 'google', priority: 'high' },
          { id: 's10', task: 'Launch Offer', service: 'marketing', action: 'launch_offer', priority: 'medium' },
          { id: 's11', task: 'Loyalty Program', service: 'salon-os', action: 'loyalty', priority: 'medium' },
        ],
        automatable: ['instagram', 'google', 'loyalty'],
      },
    ],
    aiActions: [
      'post_instagram_content',
      'send_appointment_reminders',
      'manage_staff_schedule',
      'analyze_service_popularity',
      'recommend_pricing',
    ],
    kpis: ['bookings_per_day', 'repeat_rate', 'average_service_value', 'rating'],
  },

  hotel: {
    industry: 'Hotel & Homestay',
    tagline: 'Your complete property launch guide',
    phases: [
      {
        phase: 1,
        name: 'Legal Setup (Week 1-3)',
        duration: '3 weeks',
        tasks: [
          { id: 'h1', task: 'Company Registration', service: 'taxflow', action: 'register', priority: 'high' },
          { id: 'h2', task: 'GST Registration', service: 'taxflow', action: 'gst', priority: 'high' },
          { id: 'h3', task: 'Hotel License', service: 'compliance', action: 'hotel_license', priority: 'high' },
          { id: 'h4', task: 'Fire Safety', service: 'compliance', action: 'fire_safety', priority: 'high' },
          { id: 'h5', task: 'Police Verification', service: 'compliance', action: 'police_verify', priority: 'medium' },
        ],
        automatable: ['gst_registration'],
      },
      {
        phase: 2,
        name: 'HotelOS Setup (Week 3-4)',
        duration: '2 weeks',
        tasks: [
          { id: 'h6', task: 'HotelOS Setup', service: 'hotel-os', action: 'setup', priority: 'high' },
          { id: 'h7', task: 'Room Configuration', service: 'hotel-os', action: 'rooms', priority: 'high' },
          { id: 'h8', task: 'Housekeeping Setup', service: 'hotel-os', action: 'housekeeping', priority: 'medium' },
          { id: 'h9', task: 'Channel Manager', service: 'hotel-os', action: 'channels', priority: 'medium' },
        ],
        automatable: ['rooms', 'housekeeping'],
      },
      {
        phase: 3,
        name: 'OTA Integration (Week 4-5)',
        duration: '2 weeks',
        tasks: [
          { id: 'h10', task: 'Booking.com', service: 'hotel-os', action: 'booking', priority: 'high' },
          { id: 'h11', task: 'MakeMyTrip', service: 'hotel-os', action: 'mmt', priority: 'medium' },
          { id: 'h12', task: 'Goibibo', service: 'hotel-os', action: 'goibibo', priority: 'medium' },
          { id: 'h13', task: 'Direct Booking', service: 'hotel-os', action: 'direct', priority: 'low' },
        ],
        automatable: ['booking', 'mmt', 'goibibo'],
      },
      {
        phase: 4,
        name: 'Marketing (Week 5-6)',
        duration: '2 weeks',
        tasks: [
          { id: 'h14', task: 'Google Hotels', service: 'marketing', action: 'google_hotels', priority: 'high' },
          { id: 'h15', task: 'Social Media', service: 'marketing', action: 'social', priority: 'medium' },
          { id: 'h16', task: 'Travel Agent Network', service: 'marketing', action: 'agents', priority: 'low' },
          { id: 'h17', task: 'Pricing Strategy', service: 'advisor', action: 'pricing', priority: 'medium' },
        ],
        automatable: ['google_hotels', 'social'],
      },
    ],
    aiActions: [
      'optimize_room_pricing',
      'manage_housekeeping_schedule',
      'respond_to_reviews',
      'forecast_demand',
      'manage_channel_availability',
    ],
    kpis: ['occupancy_rate', 'adr', 'revpar', 'guest_rating', 'review_score'],
  },

  clinic: {
    industry: 'Clinic & Healthcare',
    tagline: 'Digital-first clinic setup',
    phases: [
      { phase: 1, name: 'Legal Setup', duration: '3 weeks', tasks: [
        { id: 'c1', task: 'Company Registration', service: 'taxflow', action: 'register', priority: 'high' },
        { id: 'c2', task: 'GST Registration', service: 'taxflow', action: 'gst', priority: 'high' },
        { id: 'c3', task: 'Clinic License', service: 'compliance', action: 'clinic_license', priority: 'high' },
        { id: 'c4', task: 'Doctor Verification', service: 'compliance', action: 'doctor_verify', priority: 'high' },
      ], automatable: ['gst_registration'] },
      { phase: 2, name: 'ClinicOS Setup', duration: '2 weeks', tasks: [
        { id: 'c5', task: 'Appointment System', service: 'clinic-os', action: 'setup', priority: 'high' },
        { id: 'c6', task: 'Patient Records', service: 'clinic-os', action: 'emr', priority: 'high' },
        { id: 'c7', task: 'SMS Reminders', service: 'notification', action: 'sms', priority: 'medium' },
      ], automatable: ['appointment_system', 'sms_reminders'] },
      { phase: 3, name: 'Marketing', duration: '2 weeks', tasks: [
        { id: 'c8', task: 'Google Business', service: 'marketing', action: 'google', priority: 'high' },
        { id: 'c9', task: 'WhatsApp Business', service: 'whatsapp-os', action: 'setup', priority: 'medium' },
      ], automatable: ['google', 'whatsapp_business'] },
    ],
    aiActions: ['send_appointment_reminders', 'follow_up_patients', 'manage_waitlist', 'analyze_no_shows'],
    kpis: ['appointments_per_day', 'no_show_rate', 'patient_retention', 'rating'],
  },
};

// ============================================================================
// API Routes
// ============================================================================

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'vertical-playbooks',
    industries: Object.keys(PLAYBOOKS).length,
  });
});

app.get('/api/playbooks', (_req, res) => {
  const playbooks = Object.entries(PLAYBOOKS).map(([id, playbook]) => ({
    id,
    industry: playbook.industry,
    tagline: playbook.tagline,
    phases: playbook.phases.length,
    automatableTasks: playbook.phases.reduce((sum, p) => sum + p.automatable.length, 0),
  }));
  res.json({ playbooks });
});

app.get('/api/playbooks/:industry', (req, res) => {
  const playbook = PLAYBOOKS[req.params.industry];
  if (!playbook) return res.status(404).json({ error: 'Industry not found' });
  res.json(playbook);
});

app.get('/api/playbooks/:industry/phases/:phase', (req, res) => {
  const playbook = PLAYBOOKS[req.params.industry];
  if (!playbook) return res.status(404).json({ error: 'Industry not found' });
  const phase = playbook.phases.find(p => p.phase === parseInt(req.params.phase));
  if (!phase) return res.status(404).json({ error: 'Phase not found' });
  res.json(phase);
});

app.get('/api/playbooks/:industry/ai-actions', (req, res) => {
  const playbook = PLAYBOOKS[req.params.industry];
  if (!playbook) return res.status(404).json({ error: 'Industry not found' });
  res.json({ actions: playbook.aiActions });
});

app.get('/api/playbooks/:industry/kpis', (req, res) => {
  const playbook = PLAYBOOKS[req.params.industry];
  if (!playbook) return res.status(404).json({ error: 'Industry not found' });
  res.json({ kpis: playbook.kpis });
});

const PORT = process.env.PORT || 4056;
app.listen(PORT, () => {
  logger.info(`\n🎯 Vertical Playbooks Service\nPort: ${PORT}\nIndustries: ${Object.keys(PLAYBOOKS).join(', ')}\n`);
});
