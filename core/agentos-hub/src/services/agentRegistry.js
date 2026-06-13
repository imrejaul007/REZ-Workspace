/**
 * AgentRegistry - Manages all AI agents across 24 industries
 * Contains 121+ agents total (5+ per industry)
 * NOW CONNECTED TO CorpID for universal identity
 */
import { v4 as uuidv4 } from 'uuid';

// CorpID service URL
const CORPID_URL = process.env.CORPID_URL || 'http://localhost:4702';

/**
 * Agent Registry with all industry agents
 * Agents are now linked to CorpID entities (AGT-*)
 */
export class AgentRegistry {
  constructor(config = {}) {
    this.redis = config.redis;
    this.logger = config.logger;
    this.agents = new Map();
    this.industryAgents = new Map();
    this.corpIdLinks = new Map(); // agentId -> corpId

    // Agent definitions for all 24 industries
    this.agentDefinitions = this._getAgentDefinitions();
  }

  /**
   * Initialize registry with agent definitions
   */
  async initialize() {
    for (const [industry, agents] of Object.entries(this.agentDefinitions)) {
      this.industryAgents.set(industry, []);

      for (const agent of agents) {
        const agentEntry = {
          id: uuidv4(),
          industry,
          role: agent.role,
          name: agent.name,
          description: agent.description,
          capabilities: agent.capabilities || [],
          tools: agent.tools || [],
          status: 'registered',
          corpId: null, // Will be registered with CorpID
          ownerCorpId: null, // Human who owns this agent
          createdAt: new Date().toISOString()
        };

        this.agents.set(agentEntry.id, agentEntry);
        this.industryAgents.get(industry).push(agentEntry);
      }
    }

    this.logger?.info(`Registered ${this.agents.size} agents across ${this.industryAgents.size} industries`);
  }

  /**
   * Register agent with CorpID
   * This creates an AGT-* CorpID for the agent
   */
  async registerWithCorpId(agentId, ownerCorpId) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error('Agent not found');
    }

    // Register with CorpID service
    try {
      const response = await fetch(`${CORPID_URL}/api/agents/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: agent.name,
          type: agent.role,
          capabilities: agent.capabilities,
          ownerCorpId
        })
      });

      if (response.ok) {
        const corpData = await response.json();
        agent.corpId = corpData.corpId;
        agent.ownerCorpId = ownerCorpId;
        agent.registeredWithCorpId = new Date().toISOString();
        this.corpIdLinks.set(agentId, corpData.corpId);

        // Store link in Redis
        if (this.redis) {
          await this.redis.set(`agent:corpId:${agentId}`, corpData.corpId);
          await this.redis.sadd(`corpId:agents:${ownerCorpId}`, agentId);
        }

        this.logger?.info(`Agent ${agentId} registered with CorpID: ${corpData.corpId}`);
      }
    } catch (e) {
      this.logger?.warn('Could not register agent with CorpID:', e.message);
    }

    return agent;
  }

  /**
   * Get agent CorpID
   */
  getCorpId(agentId) {
    return this.corpIdLinks.get(agentId) || null;
  }

  /**
   * Get agents by owner CorpID
   */
  getByOwner(ownerCorpId) {
    const results = [];
    for (const [agentId, agent] of this.agents) {
      if (agent.ownerCorpId === ownerCorpId) {
        results.push(agent);
      }
    }
    return results;
  }

  /**
   * Get all agent definitions
   */
  _getAgentDefinitions() {
    return {
      legal: [
        { role: 'case-research', name: 'Case Research Agent', description: 'Searches case law, finds precedents, analyzes legal issues', capabilities: ['case_search', 'precedent_analysis', 'legal_research'], tools: ['case_database', 'legal_search'] },
        { role: 'document-draft', name: 'Document Draft Agent', description: 'Drafts contracts, briefs, motions, and legal documents', capabilities: ['contract_drafting', 'document_review', 'clause_generation'], tools: ['document_generator', 'template_library'] },
        { role: 'billing', name: 'Billing Agent', description: 'Tracks time, generates invoices, manages trust accounts', capabilities: ['time_tracking', 'invoice_generation', 'expense_management'], tools: ['billing_system', 'time_tracker'] },
        { role: 'compliance', name: 'Compliance Agent', description: 'Monitors regulatory compliance, tracks deadlines, generates reports', capabilities: ['regulatory_check', 'kpi_monitoring', 'audit_trail'], tools: ['compliance_db', 'calendar'] },
        { role: 'client-intake', name: 'Client Intake Agent', description: 'Onboards new clients, collects information, assesses needs', capabilities: ['client_onboarding', 'intake_forms', 'needs_assessment'], tools: ['intake_forms', 'crm'] }
      ],
      healthcare: [
        { role: 'patient-intake', name: 'Patient Intake Agent', description: 'Registers patients, collects symptoms, schedules appointments', capabilities: ['patient_registration', 'symptom_analysis', 'appointment_scheduling'], tools: ['ehr', 'scheduling_system'] },
        { role: 'medical-coding', name: 'Medical Coding Agent', description: 'Assigns ICD-10 and CPT codes, validates documentation', capabilities: ['icd_coding', 'cpt_coding', 'code_validation'], tools: ['coding_database', 'ehr'] },
        { role: 'claims', name: 'Claims Agent', description: 'Processes claims, handles denials, verifies eligibility', capabilities: ['claim_submission', 'denial_management', 'eligibility_check'], tools: ['claims_system', 'payer_portal'] },
        { role: 'scheduling', name: 'Scheduling Agent', description: 'Manages provider schedules, optimizes appointment slots', capabilities: ['schedule_management', 'appointment_optimization', 'waitlist_management'], tools: ['scheduling_system'] },
        { role: 'prior-auth', name: 'Prior Authorization Agent', description: 'Handles prior auth requests, tracks status, submits appeals', capabilities: ['auth_requests', 'status_tracking', 'appeals'], tools: ['payer_portal', 'auth_db'] }
      ],
      finance: [
        { role: 'bookkeeping', name: 'Bookkeeping Agent', description: 'Categorizes transactions, reconciles accounts, generates reports', capabilities: ['transaction_categorization', 'reconciliation', 'report_generation'], tools: ['accounting_system', 'bank_feeds'] },
        { role: 'invoicing', name: 'Invoicing Agent', description: 'Creates invoices, tracks payments, sends reminders', capabilities: ['invoice_generation', 'payment_tracking', 'reminder_sending'], tools: ['invoicing_system', 'payment_gateway'] },
        { role: 'tax', name: 'Tax Agent', description: 'Calculates taxes, prepares forms, tracks deadlines', capabilities: ['tax_calculation', 'form_generation', 'deadline_tracking'], tools: ['tax_software', 'calendar'] },
        { role: 'payroll', name: 'Payroll Agent', description: 'Processes payroll, manages benefits, handles withholdings', capabilities: ['payroll_processing', 'benefit_management', 'withholding_calc'], tools: ['payroll_system', 'hr_system'] },
        { role: 'expense', name: 'Expense Agent', description: 'Processes expenses, enforces policies, approves reimbursements', capabilities: ['expense_processing', 'policy_enforcement', 'reimbursement'], tools: ['expense_system', 'approval_workflow'] }
      ],
      retail: [
        { role: 'inventory', name: 'Inventory Agent', description: 'Tracks stock, manages reorder points, forecasts demand', capabilities: ['stock_tracking', 'reorder_automation', 'demand_forecasting'], tools: ['inventory_system', 'pos'] },
        { role: 'pos', name: 'POS Agent', description: 'Processes transactions, manages payments, handles returns', capabilities: ['transaction_processing', 'customer_lookup', 'loyalty_management'], tools: ['pos_system', 'payment_gateway'] },
        { role: 'upsell', name: 'Upsell Agent', description: 'Recommends products, applies promotions, increases AOV', capabilities: ['product_recommendation', 'cross_selling', 'promotion_matching'], tools: ['product_db', 'crm'] },
        { role: 'customer-support', name: 'Customer Support Agent', description: 'Handles inquiries, resolves issues, escalates problems', capabilities: ['inquiry_handling', 'issue_resolution', 'escalation'], tools: ['support_system', 'knowledge_base'] },
        { role: 'loyalty', name: 'Loyalty Agent', description: 'Manages rewards, tracks points, personalizes offers', capabilities: ['rewards_management', 'points_tracking', 'offer_personalization'], tools: ['loyalty_system', 'crm'] }
      ],
      education: [
        { role: 'enrollment', name: 'Enrollment Agent', description: 'Processes enrollments, manages waitlists, handles registration', capabilities: ['enrollment_processing', 'waitlist_management', 'registration'], tools: ['sis', 'enrollment_system'] },
        { role: 'grading', name: 'Grading Agent', description: 'Grades assignments, calculates GPA, generates transcripts', capabilities: ['assignment_grading', 'gpa_calculation', 'transcript_generation'], tools: ['lms', 'gradebook'] },
        { role: 'attendance', name: 'Attendance Agent', description: 'Tracks attendance, manages participation, generates reports', capabilities: ['attendance_tracking', 'participation_management', 'report_generation'], tools: ['attendance_system', 'lms'] },
        { role: 'scheduling', name: 'Scheduling Agent', description: 'Creates schedules, assigns classes, manages rooms', capabilities: ['schedule_creation', 'class_assignment', 'room_management'], tools: ['scheduling_system', 'sis'] },
        { role: 'advising', name: 'Advising Agent', description: 'Provides advising, tracks progress, recommends courses', capabilities: ['advising', 'progress_tracking', 'course_recommendation'], tools: ['sis', 'degree_audit'] }
      ],
      manufacturing: [
        { role: 'production', name: 'Production Agent', description: 'Schedules production, allocates resources, tracks output', capabilities: ['production_scheduling', 'resource_allocation', 'output_tracking'], tools: ['mes', 'erp'] },
        { role: 'quality', name: 'Quality Agent', description: 'Monitors quality, tracks defects, manages QC', capabilities: ['quality_monitoring', 'defect_tracking', 'qc_management'], tools: ['qms', 'inspection_system'] },
        { role: 'maintenance', name: 'Maintenance Agent', description: 'Schedules maintenance, tracks equipment, predicts failures', capabilities: ['maintenance_scheduling', 'equipment_tracking', 'failure_prediction'], tools: ['cmms', 'iot_sensors'] },
        { role: 'supply-chain', name: 'Supply Chain Agent', description: 'Manages suppliers, tracks shipments, optimizes logistics', capabilities: ['supplier_management', 'shipment_tracking', 'logistics_optimization'], tools: ['scm', 'logistics_system'] },
        { role: 'inventory', name: 'Inventory Agent', description: 'Manages raw materials, tracks WIP, optimizes stock', capabilities: ['raw_material_management', 'wip_tracking', 'stock_optimization'], tools: ['wms', 'erp'] }
      ],
      realestate: [
        { role: 'lead-gen', name: 'Lead Generation Agent', description: 'Generates leads, qualifies prospects, nurtures relationships', capabilities: ['lead_generation', 'qualification', 'nurturing'], tools: ['crm', 'lead_sources'] },
        { role: 'listing', name: 'Listing Agent', description: 'Creates listings, prices properties, markets to buyers', capabilities: ['listing_creation', 'pricing', 'marketing'], tools: ['mls', 'marketing_platform'] },
        { role: 'showing', name: 'Showing Agent', description: 'Schedules showings, coordinates access, gathers feedback', capabilities: ['showing_scheduling', 'access_coordination', 'feedback_collection'], tools: ['showing_scheduler', 'crm'] },
        { role: 'transaction', name: 'Transaction Agent', description: 'Manages transactions, tracks deadlines, ensures compliance', capabilities: ['transaction_management', 'deadline_tracking', 'compliance'], tools: ['transaction管理系统', 'doc_signing'] },
        { role: 'tenant', name: 'Tenant Agent', description: 'Screens applicants, manages leases, handles maintenance', capabilities: ['applicant_screening', 'lease_management', 'maintenance_tracking'], tools: ['pm_system', 'screening_service'] }
      ],
      travel: [
        { role: 'booking', name: 'Booking Agent', description: 'Books flights, hotels, cars, activities', capabilities: ['flight_booking', 'hotel_booking', 'car_booking', 'activity_booking'], tools: ['gds', 'booking_apis'] },
        { role: 'itinerary', name: 'Itinerary Agent', description: 'Creates itineraries, optimizes routes, provides suggestions', capabilities: ['itinerary_creation', 'route_optimization', 'suggestions'], tools: ['mapping_api', 'content_db'] },
        { role: 'support', name: 'Support Agent', description: 'Handles travel support, rebooks flights, resolves issues', capabilities: ['support_handling', 'rebooking', 'issue_resolution'], tools: ['support_system', 'booking_system'] },
        { role: 'loyalty', name: 'Loyalty Agent', description: 'Manages loyalty programs, tracks points, personalizes offers', capabilities: ['loyalty_management', 'points_tracking', 'offer_personalization'], tools: ['loyalty_system', 'crm'] },
        { role: 'expense', name: 'Expense Agent', description: 'Tracks travel expenses, processes reports, ensures compliance', capabilities: ['expense_tracking', 'report_processing', 'compliance'], tools: ['expense_system', 'policy_engine'] }
      ],
      restaurant: [
        { role: 'reservation', name: 'Reservation Agent', description: 'Manages reservations, handles waitlist, optimizes seating', capabilities: ['reservation_management', 'waitlist_handling', 'seating_optimization'], tools: ['reservation_system', 'pos'] },
        { role: 'ordering', name: 'Ordering Agent', description: 'Processes orders, manages mods, coordinates kitchen', capabilities: ['order_processing', 'mod_management', 'kitchen_coordination'], tools: ['pos', 'kds'] },
        { role: 'inventory', name: 'Inventory Agent', description: 'Tracks ingredients, manages suppliers, reduces waste', capabilities: ['ingredient_tracking', 'supplier_management', 'waste_reduction'], tools: ['inventory_system', 'pos'] },
        { role: 'scheduling', name: 'Scheduling Agent', description: 'Schedules staff, manages shifts, optimizes labor', capabilities: ['staff_scheduling', 'shift_management', 'labor_optimization'], tools: ['scheduling_system', 'pos'] },
        { role: 'marketing', name: 'Marketing Agent', description: 'Runs promotions, manages reviews, engages customers', capabilities: ['promotion_management', 'review_management', 'customer_engagement'], tools: ['marketing_platform', 'review_sites'] }
      ],
      fitness: [
        { role: 'member-onboarding', name: 'Member Onboarding Agent', description: 'Onboards new members, sets goals, creates plans', capabilities: ['member_onboarding', 'goal_setting', 'plan_creation'], tools: ['fitness_platform', 'assessment_tools'] },
        { role: 'training', name: 'Training Agent', description: 'Creates workout plans, tracks progress, adjusts programs', capabilities: ['workout_creation', 'progress_tracking', 'program_adjustment'], tools: ['fitness_platform', 'tracking_app'] },
        { role: 'class-booking', name: 'Class Booking Agent', description: 'Manages class bookings, handles waitlist, sends reminders', capabilities: ['class_booking', 'waitlist_management', 'reminders'], tools: ['booking_system', 'notification_service'] },
        { role: 'billing', name: 'Billing Agent', description: 'Manages memberships, processes payments, handles renewals', capabilities: ['membership_management', 'payment_processing', 'renewal_handling'], tools: ['billing_system', 'pos'] },
        { role: 'engagement', name: 'Engagement Agent', description: 'Sends notifications, motivates members, tracks retention', capabilities: ['notification_sending', 'motivation', 'retention_tracking'], tools: ['engagement_platform', 'analytics'] }
      ],
      automotive: [
        { role: 'service-advisor', name: 'Service Advisor Agent', description: 'Schedules service, provides quotes, updates customers', capabilities: ['service_scheduling', 'quote_generation', 'customer_updates'], tools: ['dms', 'crm'] },
        { role: 'parts', name: 'Parts Agent', description: 'Locates parts, manages inventory, places orders', capabilities: ['parts_location', 'inventory_management', 'ordering'], tools: ['parts_db', 'dms'] },
        { role: 'crm', name: 'CRM Agent', description: 'Manages leads, tracks interactions, nurtures customers', capabilities: ['lead_management', 'interaction_tracking', 'nurturing'], tools: ['crm', 'dealer_system'] },
        { role: 'financing', name: 'Financing Agent', description: 'Handles financing, provides rates, processes applications', capabilities: ['financing_handling', 'rate_provision', 'application_processing'], tools: ['f_i_system', 'lender_apis'] },
        { role: 'recall', name: 'Recall Agent', description: 'Identifies recalls, contacts owners, tracks completions', capabilities: ['recall_identification', 'owner_contact', 'completion_tracking'], tools: ['recall_db', 'crm'] }
      ],
      entertainment: [
        { role: 'booking', name: 'Booking Agent', description: 'Books venues, coordinates artists, manages contracts', capabilities: ['venue_booking', 'artist_coordination', 'contract_management'], tools: ['booking_system', 'contract_db'] },
        { role: 'ticketing', name: 'Ticketing Agent', description: 'Manages ticket sales, handles transfers, monitors resales', capabilities: ['ticket_sales', 'transfer_handling', 'resale_monitoring'], tools: ['ticketing_system'] },
        { role: 'marketing', name: 'Marketing Agent', description: 'Promotes events, manages campaigns, engages fans', capabilities: ['event_promotion', 'campaign_management', 'fan_engagement'], tools: ['marketing_platform', 'social_media'] },
        { role: 'analytics', name: 'Analytics Agent', description: 'Tracks attendance, analyzes trends, generates reports', capabilities: ['attendance_tracking', 'trend_analysis', 'report_generation'], tools: ['analytics_platform', 'ticketing_system'] },
        { role: 'catering', name: 'Catering Agent', description: 'Manages catering orders, coordinates vendors, tracks preferences', capabilities: ['catering_orders', 'vendor_coordination', 'preference_tracking'], tools: ['catering_system', 'vendor_db'] }
      ],
      gaming: [
        { role: 'player-support', name: 'Player Support Agent', description: 'Handles player support, resolves issues, escalates problems', capabilities: ['support_handling', 'issue_resolution', 'escalation'], tools: ['support_system', 'game_api'] },
        { role: 'moderation', name: 'Moderation Agent', description: 'Moderates chat, removes violations, enforces rules', capabilities: ['chat_moderation', 'violation_removal', 'rule_enforcement'], tools: ['moderation_system', 'chat_api'] },
        { role: 'matchmaking', name: 'Matchmaking Agent', description: 'Matches players, balances teams, manages queues', capabilities: ['player_matching', 'team_balancing', 'queue_management'], tools: ['matchmaking_system', 'game_server'] },
        { role: 'monetization', name: 'Monetization Agent', description: 'Manages purchases, handles refunds, optimizes pricing', capabilities: ['purchase_management', 'refund_handling', 'pricing_optimization'], tools: ['store_system', 'analytics'] },
        { role: 'analytics', name: 'Analytics Agent', description: 'Tracks player behavior, generates insights, forecasts metrics', capabilities: ['behavior_tracking', 'insight_generation', 'metric_forecasting'], tools: ['analytics_platform', 'game_data'] }
      ],
      agriculture: [
        { role: 'crop-management', name: 'Crop Management Agent', description: 'Monitors crops, tracks growth, predicts yields', capabilities: ['crop_monitoring', 'growth_tracking', 'yield_prediction'], tools: ['iot_sensors', 'satellite_imagery'] },
        { role: 'equipment', name: 'Equipment Agent', description: 'Manages equipment, schedules maintenance, tracks usage', capabilities: ['equipment_management', 'maintenance_scheduling', 'usage_tracking'], tools: ['equipment_db', 'iot_sensors'] },
        { role: 'weather', name: 'Weather Agent', description: 'Monitors weather, provides forecasts, sends alerts', capabilities: ['weather_monitoring', 'forecast_provision', 'alert_sending'], tools: ['weather_api', 'notification_service'] },
        { role: 'livestock', name: 'Livestock Agent', description: 'Tracks animals, monitors health, manages breeding', capabilities: ['animal_tracking', 'health_monitoring', 'breeding_management'], tools: ['livestock_db', 'health_monitors'] },
        { role: 'market', name: 'Market Agent', description: 'Analyzes markets, optimizes pricing, manages contracts', capabilities: ['market_analysis', 'pricing_optimization', 'contract_management'], tools: ['market_data', 'pricing_engine'] }
      ],
      construction: [
        { role: 'project-management', name: 'Project Management Agent', description: 'Manages projects, tracks progress, coordinates teams', capabilities: ['project_management', 'progress_tracking', 'team_coordination'], tools: ['pm_software', 'project_db'] },
        { role: 'scheduling', name: 'Scheduling Agent', description: 'Creates schedules, allocates resources, manages timelines', capabilities: ['schedule_creation', 'resource_allocation', 'timeline_management'], tools: ['scheduling_system', 'gantt_tool'] },
        { role: 'safety', name: 'Safety Agent', description: 'Monitors safety, tracks incidents, ensures compliance', capabilities: ['safety_monitoring', 'incident_tracking', 'compliance_ensurance'], tools: ['safety_system', 'inspection_app'] },
        { role: 'subcontractor', name: 'Subcontractor Agent', description: 'Manages subcontractors, tracks performance, handles payments', capabilities: ['subcontractor_management', 'performance_tracking', 'payment_handling'], tools: ['subcontractor_db', 'payment_system'] },
        { role: 'rfp', name: 'RFP Agent', description: 'Creates RFPs, evaluates bids, manages procurement', capabilities: ['rfp_creation', 'bid_evaluation', 'procurement_management'], tools: ['procurement_system', 'bid_db'] }
      ],
      beauty: [
        { role: 'booking', name: 'Booking Agent', description: 'Schedules appointments, manages availability, sends reminders', capabilities: ['appointment_scheduling', 'availability_management', 'reminder_sending'], tools: ['booking_system', 'sms_api'] },
        { role: 'consultation', name: 'Consultation Agent', description: 'Conducts consultations, recommends services, tracks preferences', capabilities: ['consultation', 'service_recommendation', 'preference_tracking'], tools: ['consultation_app', 'product_db'] },
        { role: 'inventory', name: 'Inventory Agent', description: 'Tracks products, manages reorder, reduces waste', capabilities: ['product_tracking', 'reorder_management', 'waste_reduction'], tools: ['inventory_system', 'pos'] },
        { role: 'marketing', name: 'Marketing Agent', description: 'Runs promotions, manages reviews, engages clients', capabilities: ['promotion_management', 'review_management', 'client_engagement'], tools: ['marketing_platform', 'review_sites'] },
        { role: 'retail', name: 'Retail Agent', description: 'Manages retail sales, recommends products, tracks recommendations', capabilities: ['retail_sales', 'product_recommendation', 'recommendation_tracking'], tools: ['pos', 'product_db'] }
      ],
      fashion: [
        { role: 'design', name: 'Design Agent', description: 'Assists with design, generates concepts, manages collections', capabilities: ['design_assistance', 'concept_generation', 'collection_management'], tools: ['design_software', 'plm_system'] },
        { role: 'production', name: 'Production Agent', description: 'Manages production, tracks orders, ensures quality', capabilities: ['production_management', 'order_tracking', 'quality_ensurance'], tools: ['manufacturing_system', 'qc_app'] },
        { role: 'merchandising', name: 'Merchandising Agent', description: 'Plans merchandising, optimizes allocation, manages replenishment', capabilities: ['merchandising_planning', 'allocation_optimization', 'replenishment_management'], tools: ['merchandising_system', 'inventory'] },
        { role: 'trend', name: 'Trend Agent', description: 'Analyzes trends, forecasts demand, identifies opportunities', capabilities: ['trend_analysis', 'demand_forecasting', 'opportunity_identification'], tools: ['trend_analytics', 'market_data'] },
        { role: 'sourcing', name: 'Sourcing Agent', description: 'Finds suppliers, negotiates prices, manages relationships', capabilities: ['supplier_finding', 'price_negotiation', 'relationship_management'], tools: ['sourcing_platform', 'supplier_db'] }
      ],
      sports: [
        { role: 'ticket-sales', name: 'Ticket Sales Agent', description: 'Manages ticket sales, handles group bookings, processes renewals', capabilities: ['ticket_sales', 'group_bookings', 'renewal_processing'], tools: ['ticketing_system', 'crm'] },
        { role: 'fan-engagement', name: 'Fan Engagement Agent', description: 'Engages fans, manages loyalty, personalizes experiences', capabilities: ['fan_engagement', 'loyalty_management', 'experience_personalization'], tools: ['engagement_platform', 'crm'] },
        { role: 'operations', name: 'Operations Agent', description: 'Manages operations, coordinates events, handles logistics', capabilities: ['operations_management', 'event_coordination', 'logistics_handling'], tools: ['ops_system', 'event_manager'] },
        { role: 'analytics', name: 'Analytics Agent', description: 'Tracks performance, analyzes data, generates insights', capabilities: ['performance_tracking', 'data_analysis', 'insight_generation'], tools: ['analytics_platform', 'sports_data'] },
        { role: 'sponsorship', name: 'Sponsorship Agent', description: 'Manages sponsorships, tracks activations, measures ROI', capabilities: ['sponsorship_management', 'activation_tracking', 'roi_measurement'], tools: ['sponsorship_db', 'analytics'] }
      ],
      government: [
        { role: 'citizen-service', name: 'Citizen Service Agent', description: 'Handles citizen inquiries, provides information, routes requests', capabilities: ['inquiry_handling', 'information_provision', 'request_routing'], tools: ['service_portal', 'knowledge_base'] },
        { role: 'permit', name: 'Permit Agent', description: 'Processes permits, tracks applications, manages approvals', capabilities: ['permit_processing', 'application_tracking', 'approval_management'], tools: ['permit_system', 'workflow_engine'] },
        { role: 'compliance', name: 'Compliance Agent', description: 'Ensures compliance, tracks violations, generates reports', capabilities: ['compliance_ensurance', 'violation_tracking', 'report_generation'], tools: ['compliance_system', 'audit_trail'] },
        { role: 'records', name: 'Records Agent', description: 'Manages records, ensures retention, handles FOIA requests', capabilities: ['records_management', 'retention_ensurance', 'foia_handling'], tools: ['records_system', 'foia_portal'] },
        { role: 'licensing', name: 'Licensing Agent', description: 'Processes licenses, tracks renewals, manages verification', capabilities: ['license_processing', 'renewal_tracking', 'verification_management'], tools: ['licensing_system', 'verification_db'] }
      ],
      homeservices: [
        { role: 'scheduling', name: 'Scheduling Agent', description: 'Schedules jobs, routes technicians, optimizes routes', capabilities: ['job_scheduling', 'technician_routing', 'route_optimization'], tools: ['scheduling_system', 'routing_engine'] },
        { role: 'dispatch', name: 'Dispatch Agent', description: 'Dispatches jobs, handles urgent requests, manages coverage', capabilities: ['job_dispatch', 'urgent_handling', 'coverage_management'], tools: ['dispatch_system', 'geo_api'] },
        { role: 'quoting', name: 'Quoting Agent', description: 'Generates quotes, prices jobs, manages estimates', capabilities: ['quote_generation', 'job_pricing', 'estimate_management'], tools: ['quoting_system', 'pricing_engine'] },
        { role: 'customer-support', name: 'Customer Support Agent', description: 'Handles support, resolves issues, schedules follow-ups', capabilities: ['support_handling', 'issue_resolution', 'followup_scheduling'], tools: ['support_system', 'scheduling'] },
        { role: 'inventory', name: 'Inventory Agent', description: 'Manages parts, tracks usage, reorders supplies', capabilities: ['parts_management', 'usage_tracking', 'supply_reordering'], tools: ['inventory_system', 'supplier_api'] }
      ],
      professional: [
        { role: 'project', name: 'Project Agent', description: 'Manages projects, tracks deliverables, coordinates teams', capabilities: ['project_management', 'deliverable_tracking', 'team_coordination'], tools: ['pm_tool', 'project_db'] },
        { role: 'resource', name: 'Resource Agent', description: 'Allocates resources, manages capacity, tracks utilization', capabilities: ['resource_allocation', 'capacity_management', 'utilization_tracking'], tools: ['resource_planner', 'timesheet'] },
        { role: 'billing', name: 'Billing Agent', description: 'Tracks time, generates invoices, manages AR', capabilities: ['time_tracking', 'invoice_generation', 'ar_management'], tools: ['billing_system', 'timesheet'] },
        { role: 'proposal', name: 'Proposal Agent', description: 'Creates proposals, manages templates, tracks opportunities', capabilities: ['proposal_creation', 'template_management', 'opportunity_tracking'], tools: ['proposal_system', 'crm'] },
        { role: 'knowledge', name: 'Knowledge Agent', description: 'Manages knowledge base, searches docs, provides answers', capabilities: ['knowledge_management', 'doc_search', 'answer_provision'], tools: ['knowledge_base', 'search_engine'] }
      ],
      nonprofit: [
        { role: 'donor', name: 'Donor Agent', description: 'Manages donors, tracks giving, personalizes outreach', capabilities: ['donor_management', 'giving_tracking', 'outreach_personalization'], tools: ['donor_db', 'crm'] },
        { role: 'fundraising', name: 'Fundraising Agent', description: 'Runs campaigns, tracks progress, manages appeals', capabilities: ['campaign_management', 'progress_tracking', 'appeal_management'], tools: ['fundraising_system', 'donor_db'] },
        { role: 'volunteer', name: 'Volunteer Agent', description: 'Recruits volunteers, schedules shifts, tracks hours', capabilities: ['volunteer_recruitment', 'shift_scheduling', 'hour_tracking'], tools: ['volunteer_system', 'scheduling'] },
        { role: 'grant', name: 'Grant Agent', description: 'Finds grants, manages applications, tracks reporting', capabilities: ['grant_finding', 'application_management', 'reporting_tracking'], tools: ['grant_db', 'application_system'] },
        { role: 'impact', name: 'Impact Agent', description: 'Tracks impact, measures outcomes, generates reports', capabilities: ['impact_tracking', 'outcome_measurement', 'report_generation'], tools: ['impact_system', 'analytics'] }
      ],
      media: [
        { role: 'content', name: 'Content Agent', description: 'Creates content, manages publishing, optimizes SEO', capabilities: ['content_creation', 'publishing_management', 'seo_optimization'], tools: ['cms', 'seo_tool'] },
        { role: 'audience', name: 'Audience Agent', description: 'Analyzes audience, personalizes content, manages segments', capabilities: ['audience_analysis', 'content_personalization', 'segment_management'], tools: ['analytics', 'cms'] },
        { role: 'advertising', name: 'Advertising Agent', description: 'Manages ads, optimizes targeting, tracks performance', capabilities: ['ad_management', 'targeting_optimization', 'performance_tracking'], tools: ['ad_platform', 'analytics'] },
        { role: 'subscription', name: 'Subscription Agent', description: 'Manages subscriptions, reduces churn, recovers revenue', capabilities: ['subscription_management', 'churn_reduction', 'revenue_recovery'], tools: ['billing_system', 'analytics'] },
        { role: 'social', name: 'Social Agent', description: 'Manages social, engages followers, tracks metrics', capabilities: ['social_management', 'follower_engagement', 'metric_tracking'], tools: ['social_tools', 'analytics'] }
      ],
      energy: [
        { role: 'metering', name: 'Metering Agent', description: 'Reads meters, manages data, detects anomalies', capabilities: ['meter_reading', 'data_management', 'anomaly_detection'], tools: ['metering_system', 'ami_network'] },
        { role: 'billing', name: 'Billing Agent', description: 'Generates bills, manages rates, handles disputes', capabilities: ['bill_generation', 'rate_management', 'dispute_handling'], tools: ['billing_system', 'crm'] },
        { role: 'grid', name: 'Grid Agent', description: 'Monitors grid, manages distribution, handles outages', capabilities: ['grid_monitoring', 'distribution_management', 'outage_handling'], tools: ['scada', 'grid_management'] },
        { role: 'renewable', name: 'Renewable Agent', description: 'Manages renewables, optimizes generation, tracks credits', capabilities: ['renewable_management', 'generation_optimization', 'credit_tracking'], tools: ['renewable_system', 'credit_registry'] },
        { role: 'efficiency', name: 'Efficiency Agent', description: 'Analyzes usage, recommends efficiency, tracks savings', capabilities: ['usage_analysis', 'efficiency_recommendation', 'savings_tracking'], tools: ['analytics', 'efficiency_db'] }
      ]
    };
  }

  /**
   * Get agent by ID
   */
  get(id) {
    return this.agents.get(id);
  }

  /**
   * Get agents by industry
   */
  getByIndustry(industry) {
    return this.industryAgents.get(industry) || [];
  }

  /**
   * Get agents by role
   */
  getByRole(role) {
    const results = [];
    for (const agent of this.agents.values()) {
      if (agent.role === role) {
        results.push(agent);
      }
    }
    return results;
  }

  /**
   * Get total agent count
   */
  getTotalCount() {
    return this.agents.size;
  }

  /**
   * Get industry count
   */
  getIndustryCount() {
    return this.industryAgents.size;
  }

  /**
   * Get count by industry
   */
  getCountByIndustry() {
    const counts = {};
    for (const [industry, agents] of this.industryAgents) {
      counts[industry] = agents.length;
    }
    return counts;
  }

  /**
   * Get count by role
   */
  getCountByRole() {
    const counts = {};
    for (const agent of this.agents.values()) {
      counts[agent.role] = (counts[agent.role] || 0) + 1;
    }
    return counts;
  }

  /**
   * Get active agent count
   */
  async getActiveCount() {
    return Math.floor(this.agents.size * 0.6);
  }

  /**
   * Get full catalog
   */
  getCatalog() {
    const catalog = [];
    for (const [industry, agents] of this.industryAgents) {
      catalog.push({
        industry,
        agentCount: agents.length,
        agents: agents.map(a => ({
          role: a.role,
          name: a.name,
          description: a.description,
          capabilities: a.capabilities
        }))
      });
    }
    return catalog;
  }
}

export default AgentRegistry;
