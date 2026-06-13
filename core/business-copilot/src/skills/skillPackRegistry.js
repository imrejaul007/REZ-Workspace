/**
 * SkillPackRegistry - Manages all industry skill packs
 * Contains skills for all 24 industries
 */
import { v4 as uuidv4 } from 'uuid';

/**
 * Skill Pack Registry
 */
export class SkillPackRegistry {
  constructor(config = {}) {
    this.logger = config.logger;
    this.skills = new Map();
    this.industrySkills = new Map();
    
    // Initialize skill definitions
    this.skillDefinitions = this._getSkillDefinitions();
  }

  /**
   * Initialize registry with skill definitions
   */
  async initialize() {
    for (const [industry, skills] of Object.entries(this.skillDefinitions)) {
      this.industrySkills.set(industry, []);
      
      for (const skill of skills) {
        const skillEntry = {
          id: uuidv4(),
          industry,
          name: skill.name,
          description: skill.description,
          category: skill.category,
          actions: skill.actions,
          prompts: skill.prompts,
          examples: skill.examples
        };
        
        this.skills.set(skillEntry.id, skillEntry);
        this.industrySkills.get(industry).push(skillEntry);
      }
    }
    
    this.logger?.info(`Registered ${this.skills.size} skills across ${this.industrySkills.size} industries`);
  }

  /**
   * Get all skill definitions
   */
  _getSkillDefinitions() {
    return {
      legal: [
        { name: 'Case Research', description: 'Search case law, find precedents, analyze legal issues', category: 'research', actions: ['search_cases', 'find_precedents', 'analyze_issue'], prompts: ['Find similar cases', 'What precedents apply?'], examples: ['Search for contract dispute cases in California'] },
        { name: 'Document Drafting', description: 'Draft contracts, briefs, motions, legal documents', category: 'drafting', actions: ['draft_contract', 'review_document', 'generate_clause'], prompts: ['Draft an NDA', 'Review this contract'], examples: ['Create a standard non-disclosure agreement'] },
        { name: 'Billing & Time Tracking', description: 'Track time, generate invoices, manage billing', category: 'billing', actions: ['track_time', 'generate_invoice', 'manage_expenses'], prompts: ['How many hours this month?', 'Generate invoice'], examples: ['Generate invoice for services rendered'] },
        { name: 'Compliance Monitoring', description: 'Monitor regulatory compliance, track deadlines', category: 'compliance', actions: ['check_compliance', 'track_deadlines', 'generate_report'], prompts: ['What deadlines are coming?', 'Compliance status'], examples: ['Show upcoming filing deadlines'] },
        { name: 'Client Intake', description: 'Onboard clients, collect information, assess needs', category: 'intake', actions: ['onboard_client', 'collect_info', 'assess_needs'], prompts: ['New client intake', 'Collect client information'], examples: ['Start new client onboarding process'] }
      ],
      healthcare: [
        { name: 'Patient Intake', description: 'Register patients, collect symptoms, schedule appointments', category: 'patient', actions: ['register_patient', 'collect_symptoms', 'schedule_appointment'], prompts: ['Schedule appointment', 'Register new patient'], examples: ['Book a new patient appointment'] },
        { name: 'Medical Coding', description: 'Assign ICD-10 and CPT codes, validate documentation', category: 'coding', actions: ['assign_icd', 'assign_cpt', 'validate_codes'], prompts: ['Code this diagnosis', 'Find CPT code'], examples: ['What ICD-10 code for diabetes type 2?'] },
        { name: 'Claims Processing', description: 'Process claims, handle denials, verify eligibility', category: 'claims', actions: ['submit_claim', 'handle_denial', 'verify_eligibility'], prompts: ['Check claim status', 'Verify insurance'], examples: ['Verify patient insurance eligibility'] },
        { name: 'Scheduling', description: 'Manage schedules, optimize appointment slots', category: 'scheduling', actions: ['manage_schedule', 'optimize_slots', 'handle_waitlist'], prompts: ['Find available slots', 'Schedule follow-up'], examples: ['Find next available appointment slot'] },
        { name: 'Prior Authorization', description: 'Handle prior auth requests, track status, submit appeals', category: 'auth', actions: ['request_auth', 'track_status', 'submit_appeal'], prompts: ['Check auth status', 'Submit prior auth'], examples: ['Check prior authorization status'] }
      ],
      finance: [
        { name: 'Bookkeeping', description: 'Categorize transactions, reconcile accounts, generate reports', category: 'bookkeeping', actions: ['categorize', 'reconcile', 'generate_report'], prompts: ['Reconcile accounts', 'Generate financial report'], examples: ['Reconcile this month bank statements'] },
        { name: 'Invoicing', description: 'Create invoices, track payments, send reminders', category: 'invoicing', actions: ['create_invoice', 'track_payment', 'send_reminder'], prompts: ['Create invoice', 'Send payment reminder'], examples: ['Create invoice for $5000 consulting'] },
        { name: 'Tax Preparation', description: 'Calculate taxes, prepare forms, track deadlines', category: 'tax', actions: ['calculate_tax', 'prepare_form', 'track_deadline'], prompts: ['Calculate estimated tax', 'Due dates for filing'], examples: ['Calculate quarterly estimated taxes'] },
        { name: 'Payroll Processing', description: 'Process payroll, manage benefits, handle withholdings', category: 'payroll', actions: ['process_payroll', 'manage_benefits', 'handle_withholding'], prompts: ['Run payroll', 'Calculate withholdings'], examples: ['Process payroll for this period'] },
        { name: 'Expense Management', description: 'Process expenses, enforce policies, approve reimbursements', category: 'expense', actions: ['process_expense', 'enforce_policy', 'approve_reimbursement'], prompts: ['Process expense report', 'Approve reimbursement'], examples: ['Review and approve expense report'] }
      ],
      retail: [
        { name: 'Inventory Management', description: 'Track stock, manage reorder points, forecast demand', category: 'inventory', actions: ['track_stock', 'manage_reorder', 'forecast_demand'], prompts: ['Stock levels', 'Reorder alert'], examples: ['Which items need reordering?'] },
        { name: 'POS Operations', description: 'Process transactions, manage payments, handle returns', category: 'pos', actions: ['process_transaction', 'handle_payment', 'process_return'], prompts: ['Process return', 'Check transaction'], examples: ['Process a return for customer'] },
        { name: 'Upselling', description: 'Recommend products, apply promotions, increase AOV', category: 'sales', actions: ['recommend_product', 'apply_promotion', 'increase_aov'], prompts: ['Product recommendation', 'Current promotions'], examples: ['What upsell would you recommend?'] },
        { name: 'Customer Support', description: 'Handle inquiries, resolve issues, escalate problems', category: 'support', actions: ['handle_inquiry', 'resolve_issue', 'escalate'], prompts: ['Help customer', 'Track order'], examples: ['Help customer track their order'] },
        { name: 'Loyalty Program', description: 'Manage rewards, track points, personalize offers', category: 'loyalty', actions: ['manage_rewards', 'track_points', 'personalize_offer'], prompts: ['Check points', 'Available rewards'], examples: ['What rewards is this customer eligible for?'] }
      ],
      education: [
        { name: 'Enrollment', description: 'Process enrollments, manage waitlists, handle registration', category: 'enrollment', actions: ['process_enrollment', 'manage_waitlist', 'handle_registration'], prompts: ['Enroll student', 'Waitlist status'], examples: ['Enroll this student in course'] },
        { name: 'Grading', description: 'Grade assignments, calculate GPA, generate transcripts', category: 'grading', actions: ['grade_assignment', 'calculate_gpa', 'generate_transcript'], prompts: ['Grade submission', 'Generate transcript'], examples: ['Calculate GPA for this student'] },
        { name: 'Attendance Tracking', description: 'Track attendance, manage participation, generate reports', category: 'attendance', actions: ['track_attendance', 'manage_participation', 'generate_report'], prompts: ['Attendance report', 'Track participation'], examples: ['Generate attendance report'] },
        { name: 'Course Scheduling', description: 'Create schedules, assign classes, manage rooms', category: 'scheduling', actions: ['create_schedule', 'assign_class', 'manage_room'], prompts: ['Schedule class', 'Find available room'], examples: ['Schedule chemistry class for room 101'] },
        { name: 'Academic Advising', description: 'Provide advising, track progress, recommend courses', category: 'advising', actions: ['advise', 'track_progress', 'recommend_course'], prompts: ['Degree progress', 'Course recommendations'], examples: ['What courses does this student need?'] }
      ],
      manufacturing: [
        { name: 'Production Planning', description: 'Schedule production, allocate resources, track output', category: 'production', actions: ['schedule_production', 'allocate_resource', 'track_output'], prompts: ['Schedule production', 'Resource allocation'], examples: ['Schedule production for next week'] },
        { name: 'Quality Control', description: 'Monitor quality, track defects, manage QC', category: 'quality', actions: ['monitor_quality', 'track_defect', 'manage_qc'], prompts: ['Quality report', 'Defect analysis'], examples: ['Show quality metrics for this batch'] },
        { name: 'Maintenance Management', description: 'Schedule maintenance, track equipment, predict failures', category: 'maintenance', actions: ['schedule_maintenance', 'track_equipment', 'predict_failure'], prompts: ['Maintenance schedule', 'Equipment status'], examples: ['Schedule preventive maintenance'] },
        { name: 'Supply Chain', description: 'Manage suppliers, track shipments, optimize logistics', category: 'supply', actions: ['manage_supplier', 'track_shipment', 'optimize_logistics'], prompts: ['Track shipment', 'Supplier status'], examples: ['Track order from supplier'] },
        { name: 'Inventory Control', description: 'Manage raw materials, track WIP, optimize stock', category: 'inventory', actions: ['manage_material', 'track_wip', 'optimize_stock'], prompts: ['Material inventory', 'WIP status'], examples: ['What raw materials are low?'] }
      ],
      realestate: [
        { name: 'Lead Generation', description: 'Generate leads, qualify prospects, nurture relationships', category: 'leads', actions: ['generate_lead', 'qualify_prospect', 'nurture'], prompts: ['New leads', 'Qualify prospect'], examples: ['Show me new buyer leads'] },
        { name: 'Listing Management', description: 'Create listings, price properties, market to buyers', category: 'listing', actions: ['create_listing', 'price_property', 'market'], prompts: ['Create listing', 'Price analysis'], examples: ['Create listing for 123 Main St'] },
        { name: 'Showing Coordination', description: 'Schedule showings, coordinate access, gather feedback', category: 'showing', actions: ['schedule_showing', 'coordinate_access', 'gather_feedback'], prompts: ['Schedule showing', 'Showing feedback'], examples: ['Schedule showing for this weekend'] },
        { name: 'Transaction Management', description: 'Manage transactions, track deadlines, ensure compliance', category: 'transaction', actions: ['manage_transaction', 'track_deadline', 'ensure_compliance'], prompts: ['Transaction status', 'Upcoming deadlines'], examples: ['Show transaction timeline'] },
        { name: 'Tenant Management', description: 'Screen applicants, manage leases, handle maintenance', category: 'tenant', actions: ['screen_applicant', 'manage_lease', 'handle_maintenance'], prompts: ['Screen applicant', 'Lease status'], examples: ['Screen this rental applicant'] }
      ],
      travel: [
        { name: 'Booking', description: 'Book flights, hotels, cars, activities', category: 'booking', actions: ['book_flight', 'book_hotel', 'book_car', 'book_activity'], prompts: ['Book flight', 'Find hotels'], examples: ['Book flight to NYC next week'] },
        { name: 'Itinerary Creation', description: 'Create itineraries, optimize routes, provide suggestions', category: 'itinerary', actions: ['create_itinerary', 'optimize_route', 'provide_suggestion'], prompts: ['Create itinerary', 'Trip suggestions'], examples: ['Plan a 5-day NYC itinerary'] },
        { name: 'Travel Support', description: 'Handle support, rebook flights, resolve issues', category: 'support', actions: ['handle_support', 'rebook', 'resolve_issue'], prompts: ['Rebook flight', 'Change booking'], examples: ['Rebook this flight to different time'] },
        { name: 'Loyalty Management', description: 'Manage loyalty programs, track points, personalizes offers', category: 'loyalty', actions: ['manage_loyalty', 'track_points', 'personalize_offer'], prompts: ['Check points', 'Available awards'], examples: ['What airline points does customer have?'] },
        { name: 'Expense Tracking', description: 'Track travel expenses, process reports, ensure compliance', category: 'expense', actions: ['track_expense', 'process_report', 'ensure_compliance'], prompts: ['Expense report', 'Policy check'], examples: ['Generate travel expense report'] }
      ],
      restaurant: [
        { name: 'Reservation Management', description: 'Manage reservations, handle waitlist, optimize seating', category: 'reservation', actions: ['manage_reservation', 'handle_waitlist', 'optimize_seating'], prompts: ['Book table', 'Waitlist'], examples: ['Book a table for 4 tonight'] },
        { name: 'Order Processing', description: 'Process orders, manage modifications, coordinate kitchen', category: 'order', actions: ['process_order', 'manage_mod', 'coordinate_kitchen'], prompts: ['Process order', 'Add to order'], examples: ['Add dessert to table 5 order'] },
        { name: 'Inventory Tracking', description: 'Track ingredients, manage suppliers, reduce waste', category: 'inventory', actions: ['track_ingredient', 'manage_supplier', 'reduce_waste'], prompts: ['Low stock', 'Supplier order'], examples: ['Which ingredients are running low?'] },
        { name: 'Staff Scheduling', description: 'Schedule staff, manage shifts, optimize labor', category: 'scheduling', actions: ['schedule_staff', 'manage_shift', 'optimize_labor'], prompts: ['Schedule staff', 'Shift coverage'], examples: ['Create schedule for next week'] },
        { name: 'Marketing', description: 'Run promotions, manage reviews, engage customers', category: 'marketing', actions: ['run_promotion', 'manage_review', 'engage_customer'], prompts: ['Current specials', 'Review response'], examples: ['Create a happy hour promotion'] }
      ],
      fitness: [
        { name: 'Member Onboarding', description: 'Onboard new members, set goals, create plans', category: 'member', actions: ['onboard_member', 'set_goals', 'create_plan'], prompts: ['New member', 'Goal setting'], examples: ['Create fitness plan for new member'] },
        { name: 'Workout Planning', description: 'Create workout plans, track progress, adjust programs', category: 'workout', actions: ['create_plan', 'track_progress', 'adjust_program'], prompts: ['Create workout', 'Track progress'], examples: ['Create a 12-week strength program'] },
        { name: 'Class Booking', description: 'Manage class bookings, handle waitlist, send reminders', category: 'booking', actions: ['manage_booking', 'handle_waitlist', 'send_reminder'], prompts: ['Book class', 'Class schedule'], examples: ['Book spin class for tomorrow'] },
        { name: 'Membership Billing', description: 'Manage memberships, process payments, handle renewals', category: 'billing', actions: ['manage_membership', 'process_payment', 'handle_renewal'], prompts: ['Membership status', 'Process payment'], examples: ['Process monthly membership payment'] },
        { name: 'Engagement', description: 'Send notifications, motivate members, track retention', category: 'engagement', actions: ['send_notification', 'motivate', 'track_retention'], prompts: ['Send reminder', 'Member engagement'], examples: ['Send workout reminder to members'] }
      ],
      automotive: [
        { name: 'Service Scheduling', description: 'Schedule service, provide quotes, update customers', category: 'service', actions: ['schedule_service', 'provide_quote', 'update_customer'], prompts: ['Schedule service', 'Get quote'], examples: ['Schedule oil change for tomorrow'] },
        { name: 'Parts Management', description: 'Locate parts, manage inventory, place orders', category: 'parts', actions: ['locate_part', 'manage_inventory', 'place_order'], prompts: ['Find part', 'Part availability'], examples: ['Find brake pads for Honda Civic'] },
        { name: 'Customer CRM', description: 'Manage leads, track interactions, nurture customers', category: 'crm', actions: ['manage_lead', 'track_interaction', 'nurture'], prompts: ['Lead status', 'Follow up'], examples: ['Show leads needing follow-up'] },
        { name: 'Financing', description: 'Handle financing, provide rates, process applications', category: 'financing', actions: ['handle_financing', 'provide_rate', 'process_application'], prompts: ['Financing options', 'Apply for loan'], examples: ['Calculate financing for this vehicle'] },
        { name: 'Recall Management', description: 'Identify recalls, contact owners, track completions', category: 'recall', actions: ['identify_recall', 'contact_owner', 'track_completion'], prompts: ['Open recalls', 'Owner contact'], examples: ['Find vehicles with open recalls'] }
      ],
      entertainment: [
        { name: 'Event Booking', description: 'Book venues, coordinate artists, manage contracts', category: 'booking', actions: ['book_venue', 'coordinate_artist', 'manage_contract'], prompts: ['Book venue', 'Artist availability'], examples: ['Check venue availability for July 4th'] },
        { name: 'Ticketing', description: 'Manage ticket sales, handle transfers, monitor resales', category: 'ticketing', actions: ['manage_tickets', 'handle_transfer', 'monitor_resale'], prompts: ['Ticket sales', 'Transfer ticket'], examples: ['Show ticket sales for this event'] },
        { name: 'Marketing', description: 'Promote events, manage campaigns, engage fans', category: 'marketing', actions: ['promote_event', 'manage_campaign', 'engage_fan'], prompts: ['Event promotion', 'Campaign status'], examples: ['Create social media campaign for event'] },
        { name: 'Analytics', description: 'Track attendance, analyze trends, generate reports', category: 'analytics', actions: ['track_attendance', 'analyze_trend', 'generate_report'], prompts: ['Attendance report', 'Trend analysis'], examples: ['Show attendance trends for this year'] },
        { name: 'Catering', description: 'Manage catering orders, coordinate vendors, track preferences', category: 'catering', actions: ['manage_order', 'coordinate_vendor', 'track_preference'], prompts: ['Catering order', 'Vendor status'], examples: ['Create catering order for 500 guests'] }
      ],
      gaming: [
        { name: 'Player Support', description: 'Handle player support, resolve issues, escalate problems', category: 'support', actions: ['handle_support', 'resolve_issue', 'escalate'], prompts: ['Player issue', 'Support ticket'], examples: ['Help player with login issue'] },
        { name: 'Moderation', description: 'Moderate chat, remove violations, enforce rules', category: 'moderation', actions: ['moderate_chat', 'remove_violation', 'enforce_rule'], prompts: ['Moderation report', 'Rule violation'], examples: ['Check for chat violations in last hour'] },
        { name: 'Matchmaking', description: 'Match players, balance teams, manage queues', category: 'matchmaking', actions: ['match_players', 'balance_team', 'manage_queue'], prompts: ['Match stats', 'Queue status'], examples: ['Show matchmaking metrics'] },
        { name: 'Monetization', description: 'Manage purchases, handle refunds, optimize pricing', category: 'monetization', actions: ['manage_purchase', 'handle_refund', 'optimize_pricing'], prompts: ['Purchase report', 'Refund request'], examples: ['Process refund for player'] },
        { name: 'Analytics', description: 'Track player behavior, generate insights, forecast metrics', category: 'analytics', actions: ['track_behavior', 'generate_insight', 'forecast_metric'], prompts: ['Player analytics', 'DAU report'], examples: ['Show player retention metrics'] }
      ],
      agriculture: [
        { name: 'Crop Management', description: 'Monitor crops, track growth, predict yields', category: 'crop', actions: ['monitor_crop', 'track_growth', 'predict_yield'], prompts: ['Crop status', 'Growth stage'], examples: ['Show crop health for field 5'] },
        { name: 'Equipment Management', description: 'Manage equipment, schedule maintenance, track usage', category: 'equipment', actions: ['manage_equipment', 'schedule_maintenance', 'track_usage'], prompts: ['Equipment status', 'Maintenance due'], examples: ['Show equipment maintenance schedule'] },
        { name: 'Weather Monitoring', description: 'Monitor weather, provide forecasts, send alerts', category: 'weather', actions: ['monitor_weather', 'provide_forecast', 'send_alert'], prompts: ['Weather forecast', 'Weather alert'], examples: ['What is the 7-day weather forecast?'] },
        { name: 'Livestock Management', description: 'Track animals, monitor health, manage breeding', category: 'livestock', actions: ['track_animal', 'monitor_health', 'manage_breeding'], prompts: ['Herd status', 'Health alert'], examples: ['Show health records for cattle herd'] },
        { name: 'Market Analysis', description: 'Analyze markets, optimize pricing, manage contracts', category: 'market', actions: ['analyze_market', 'optimize_pricing', 'manage_contract'], prompts: ['Market prices', 'Contract status'], examples: ['What are current corn prices?'] }
      ],
      construction: [
        { name: 'Project Management', description: 'Manage projects, track progress, coordinate teams', category: 'project', actions: ['manage_project', 'track_progress', 'coordinate_team'], prompts: ['Project status', 'Progress report'], examples: ['Show progress for Building A'] },
        { name: 'Scheduling', description: 'Create schedules, allocate resources, manage timelines', category: 'scheduling', actions: ['create_schedule', 'allocate_resource', 'manage_timeline'], prompts: ['Project schedule', 'Resource allocation'], examples: ['Update construction schedule'] },
        { name: 'Safety Management', description: 'Monitor safety, track incidents, ensure compliance', category: 'safety', actions: ['monitor_safety', 'track_incident', 'ensure_compliance'], prompts: ['Safety report', 'Incident log'], examples: ['Show safety incidents this month'] },
        { name: 'Subcontractor Management', description: 'Manage subcontractors, track performance, handle payments', category: 'subcontractor', actions: ['manage_sub', 'track_performance', 'handle_payment'], prompts: ['Subcontractor status', 'Payment due'], examples: ['Show subcontractor performance'] },
        { name: 'RFP Management', description: 'Create RFPs, evaluate bids, manage procurement', category: 'rfp', actions: ['create_rfp', 'evaluate_bid', 'manage_procurement'], prompts: ['Create RFP', 'Bid status'], examples: ['Create RFP for electrical work'] }
      ],
      beauty: [
        { name: 'Appointment Booking', description: 'Schedule appointments, manage availability, send reminders', category: 'booking', actions: ['schedule_appointment', 'manage_availability', 'send_reminder'], prompts: ['Book appointment', 'Availability'], examples: ['Book hair appointment for Saturday'] },
        { name: 'Consultation', description: 'Conduct consultations, recommend services, track preferences', category: 'consultation', actions: ['conduct_consultation', 'recommend_service', 'track_preference'], prompts: ['Service recommendation', 'Client preferences'], examples: ['What services does this client prefer?'] },
        { name: 'Product Inventory', description: 'Track products, manage reorder, reduce waste', category: 'inventory', actions: ['track_product', 'manage_reorder', 'reduce_waste'], prompts: ['Product stock', 'Reorder alert'], examples: ['Which products need reordering?'] },
        { name: 'Marketing', description: 'Run promotions, manage reviews, engage clients', category: 'marketing', actions: ['run_promotion', 'manage_review', 'engage_client'], prompts: ['Current specials', 'Review response'], examples: ['Create a Valentine promotion'] },
        { name: 'Retail Sales', description: 'Manage retail sales, recommend products, track recommendations', category: 'retail', actions: ['manage_sale', 'recommend_product', 'track_recommendation'], prompts: ['Product recommendation', 'Sales report'], examples: ['Recommend retail products to client'] }
      ],
      fashion: [
        { name: 'Design Assistance', description: 'Assist with design, generate concepts, manage collections', category: 'design', actions: ['assist_design', 'generate_concept', 'manage_collection'], prompts: ['Design concept', 'Collection status'], examples: ['Generate spring collection concepts'] },
        { name: 'Production Management', description: 'Manage production, track orders, ensure quality', category: 'production', actions: ['manage_production', 'track_order', 'ensure_quality'], prompts: ['Production status', 'Order tracking'], examples: ['Track production order status'] },
        { name: 'Merchandising', description: 'Plan merchandising, optimize allocation, manage replenishment', category: 'merchandising', actions: ['plan_merchandising', 'optimize_allocation', 'manage_replenishment'], prompts: ['Allocation plan', 'Replenishment'], examples: ['Optimize store allocation'] },
        { name: 'Trend Analysis', description: 'Analyze trends, forecast demand, identify opportunities', category: 'trend', actions: ['analyze_trend', 'forecast_demand', 'identify_opportunity'], prompts: ['Trend report', 'Demand forecast'], examples: ['What trends are emerging for summer?'] },
        { name: 'Sourcing', description: 'Find suppliers, negotiate prices, manage relationships', category: 'sourcing', actions: ['find_supplier', 'negotiate_price', 'manage_relationship'], prompts: ['Supplier search', 'Price negotiation'], examples: ['Find sustainable fabric suppliers'] }
      ],
      sports: [
        { name: 'Ticket Sales', description: 'Manage ticket sales, handle group bookings, process renewals', category: 'tickets', actions: ['manage_sales', 'handle_group', 'process_renewal'], prompts: ['Ticket sales', 'Group booking'], examples: ['Process group ticket order'] },
        { name: 'Fan Engagement', description: 'Engage fans, manage loyalty, personalize experiences', category: 'engagement', actions: ['engage_fan', 'manage_loyalty', 'personalize_experience'], prompts: ['Fan engagement', 'Loyalty status'], examples: ['Show fan engagement metrics'] },
        { name: 'Operations', description: 'Manage operations, coordinate events, handle logistics', category: 'operations', actions: ['manage_operations', 'coordinate_event', 'handle_logistics'], prompts: ['Event coordination', 'Logistics'], examples: ['Coordinate game day operations'] },
        { name: 'Performance Analytics', description: 'Track performance, analyze data, generate insights', category: 'analytics', actions: ['track_performance', 'analyze_data', 'generate_insight'], prompts: ['Performance report', 'Analytics'], examples: ['Show team performance analytics'] },
        { name: 'Sponsorship', description: 'Manage sponsorships, track activations, measure ROI', category: 'sponsorship', actions: ['manage_sponsorship', 'track_activation', 'measure_roi'], prompts: ['Sponsorship status', 'ROI report'], examples: ['Show sponsorship ROI report'] }
      ],
      government: [
        { name: 'Citizen Service', description: 'Handle citizen inquiries, provide information, route requests', category: 'service', actions: ['handle_inquiry', 'provide_info', 'route_request'], prompts: ['Citizen inquiry', 'Service request'], examples: ['Help citizen with permit question'] },
        { name: 'Permit Processing', description: 'Process permits, track applications, manage approvals', category: 'permit', actions: ['process_permit', 'track_application', 'manage_approval'], prompts: ['Permit status', 'Application'], examples: ['Check permit application status'] },
        { name: 'Compliance', description: 'Ensure compliance, track violations, generate reports', category: 'compliance', actions: ['ensure_compliance', 'track_violation', 'generate_report'], prompts: ['Compliance report', 'Violation'], examples: ['Generate compliance report'] },
        { name: 'Records Management', description: 'Manage records, ensure retention, handle FOIA requests', category: 'records', actions: ['manage_records', 'ensure_retention', 'handle_foia'], prompts: ['Records request', 'FOIA'], examples: ['Process FOIA request'] },
        { name: 'Licensing', description: 'Process licenses, track renewals, manage verification', category: 'licensing', actions: ['process_license', 'track_renewal', 'manage_verification'], prompts: ['License status', 'Renewal'], examples: ['Check license renewal status'] }
      ],
      homeservices: [
        { name: 'Job Scheduling', description: 'Schedule jobs, route technicians, optimize routes', category: 'scheduling', actions: ['schedule_job', 'route_technician', 'optimize_route'], prompts: ['Schedule job', 'Route optimization'], examples: ['Schedule service call for tomorrow'] },
        { name: 'Dispatch', description: 'Dispatch jobs, handle urgent requests, manage coverage', category: 'dispatch', actions: ['dispatch_job', 'handle_urgent', 'manage_coverage'], prompts: ['Dispatch job', 'Coverage'], examples: ['Dispatch urgent repair call'] },
        { name: 'Quoting', description: 'Generate quotes, price jobs, manage estimates', category: 'quoting', actions: ['generate_quote', 'price_job', 'manage_estimate'], prompts: ['Generate quote', 'Price estimate'], examples: ['Generate quote for HVAC install'] },
        { name: 'Customer Support', description: 'Handle support, resolve issues, schedule follow-ups', category: 'support', actions: ['handle_support', 'resolve_issue', 'schedule_followup'], prompts: ['Support ticket', 'Follow up'], examples: ['Handle customer complaint'] },
        { name: 'Parts Inventory', description: 'Manage parts, track usage, reorder supplies', category: 'inventory', actions: ['manage_parts', 'track_usage', 'reorder_supplies'], prompts: ['Parts inventory', 'Reorder'], examples: ['Check parts inventory status'] }
      ],
      professional: [
        { name: 'Project Management', description: 'Manage projects, track deliverables, coordinate teams', category: 'project', actions: ['manage_project', 'track_deliverable', 'coordinate_team'], prompts: ['Project status', 'Deliverable'], examples: ['Show project milestone status'] },
        { name: 'Resource Allocation', description: 'Allocate resources, manage capacity, track utilization', category: 'resource', actions: ['allocate_resource', 'manage_capacity', 'track_utilization'], prompts: ['Resource allocation', 'Capacity'], examples: ['Show resource utilization report'] },
        { name: 'Billing', description: 'Track time, generate invoices, manage AR', category: 'billing', actions: ['track_time', 'generate_invoice', 'manage_ar'], prompts: ['Invoice', 'Time tracking'], examples: ['Generate invoice for project'] },
        { name: 'Proposal Generation', description: 'Create proposals, manage templates, track opportunities', category: 'proposal', actions: ['create_proposal', 'manage_template', 'track_opportunity'], prompts: ['Create proposal', 'Opportunity'], examples: ['Create proposal for client'] },
        { name: 'Knowledge Management', description: 'Manage knowledge base, search docs, provide answers', category: 'knowledge', actions: ['manage_knowledge', 'search_doc', 'provide_answer'], prompts: ['Search knowledge', 'Find answer'], examples: ['Search for client service best practices'] }
      ],
      nonprofit: [
        { name: 'Donor Management', description: 'Manage donors, track giving, personalize outreach', category: 'donor', actions: ['manage_donor', 'track_giving', 'personalize_outreach'], prompts: ['Donor profile', 'Giving history'], examples: ['Show donor giving history'] },
        { name: 'Fundraising', description: 'Run campaigns, track progress, manage appeals', category: 'fundraising', actions: ['run_campaign', 'track_progress', 'manage_appeal'], prompts: ['Campaign status', 'Fundraising goal'], examples: ['Show campaign progress'] },
        { name: 'Volunteer Management', description: 'Recruit volunteers, schedule shifts, track hours', category: 'volunteer', actions: ['recruit_volunteer', 'schedule_shift', 'track_hours'], prompts: ['Volunteer schedule', 'Hours'], examples: ['Schedule volunteer shifts'] },
        { name: 'Grant Management', description: 'Find grants, manage applications, track reporting', category: 'grant', actions: ['find_grant', 'manage_application', 'track_reporting'], prompts: ['Grant opportunity', 'Application'], examples: ['Find grants for education programs'] },
        { name: 'Impact Measurement', description: 'Track impact, measure outcomes, generate reports', category: 'impact', actions: ['track_impact', 'measure_outcome', 'generate_report'], prompts: ['Impact report', 'Outcomes'], examples: ['Generate impact report'] }
      ],
      media: [
        { name: 'Content Creation', description: 'Create content, manage publishing, optimize SEO', category: 'content', actions: ['create_content', 'manage_publishing', 'optimize_seo'], prompts: ['Create article', 'SEO analysis'], examples: ['Create article about AI trends'] },
        { name: 'Audience Analysis', description: 'Analyze audience, personalize content, manage segments', category: 'audience', actions: ['analyze_audience', 'personalize_content', 'manage_segment'], prompts: ['Audience report', 'Segment'], examples: ['Show audience demographics'] },
        { name: 'Advertising', description: 'Manage ads, optimize targeting, track performance', category: 'advertising', actions: ['manage_ad', 'optimize_targeting', 'track_performance'], prompts: ['Ad performance', 'Targeting'], examples: ['Show ad campaign performance'] },
        { name: 'Subscription Management', description: 'Manage subscriptions, reduce churn, recover revenue', category: 'subscription', actions: ['manage_subscription', 'reduce_churn', 'recover_revenue'], prompts: ['Subscription status', 'Churn'], examples: ['Show subscription churn rate'] },
        { name: 'Social Media', description: 'Manage social, engage followers, track metrics', category: 'social', actions: ['manage_social', 'engage_follower', 'track_metric'], prompts: ['Social metrics', 'Engagement'], examples: ['Show social media engagement'] }
      ],
      energy: [
        { name: 'Meter Reading', description: 'Read meters, manage data, detect anomalies', category: 'metering', actions: ['read_meter', 'manage_data', 'detect_anomaly'], prompts: ['Meter reading', 'Anomaly'], examples: ['Show meter readings for today'] },
        { name: 'Billing', description: 'Generate bills, manage rates, handle disputes', category: 'billing', actions: ['generate_bill', 'manage_rate', 'handle_dispute'], prompts: ['Generate bill', 'Rate change'], examples: ['Generate monthly bills'] },
        { name: 'Grid Management', description: 'Monitor grid, manage distribution, handle outages', category: 'grid', actions: ['monitor_grid', 'manage_distribution', 'handle_outage'], prompts: ['Grid status', 'Outage'], examples: ['Show grid status'] },
        { name: 'Renewable Management', description: 'Manage renewables, optimize generation, track credits', category: 'renewable', actions: ['manage_renewable', 'optimize_generation', 'track_credit'], prompts: ['Renewable output', 'Credits'], examples: ['Show renewable energy output'] },
        { name: 'Efficiency Analysis', description: 'Analyze usage, recommend efficiency, track savings', category: 'efficiency', actions: ['analyze_usage', 'recommend_efficiency', 'track_savings'], prompts: ['Efficiency report', 'Savings'], examples: ['Show energy efficiency recommendations'] }
      ]
    };
  }

  /**
   * Get skill by ID
   */
  get(id) {
    return this.skills.get(id);
  }

  /**
   * Get skills by industry
   */
  getByIndustry(industry) {
    return this.industrySkills.get(industry) || [];
  }

  /**
   * Get skills by category
   */
  getByCategory(category) {
    const results = [];
    for (const skill of this.skills.values()) {
      if (skill.category === category) {
        results.push(skill);
      }
    }
    return results;
  }

  /**
   * Get total skill count
   */
  getTotalSkillCount() {
    return this.skills.size;
  }

  /**
   * Get industry count
   */
  getIndustryCount() {
    return this.industrySkills.size;
  }

  /**
   * Get catalog
   */
  getCatalog(industry) {
    if (industry) {
      return {
        industry,
        skills: this.industrySkills.get(industry) || [],
        count: (this.industrySkills.get(industry) || []).length
      };
    }
    
    const catalog = [];
    for (const [ind, skills] of this.industrySkills) {
      catalog.push({
        industry: ind,
        skillCount: skills.length,
        skills: skills.map(s => ({
          name: s.name,
          description: s.description,
          category: s.category,
          actions: s.actions
        }))
      });
    }
    return catalog;
  }
}

export default SkillPackRegistry;
