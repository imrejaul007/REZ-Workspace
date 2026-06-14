// MongoDB Initialization Script for Verify QR Service v2.0
// This runs on first container startup

db = db.getSiblingDB('verify-qr');

print("Initializing Verify QR Database v2.0...");

// ============================================
// CORE COLLECTIONS
// ============================================

// Serial Registry - Product serial master table
db.createCollection('serialregistries');
db.serialregistries.createIndex({ "serial_number": 1 }, { unique: true });
db.serialregistries.createIndex({ "merchant_id": 1 });
db.serialregistries.createIndex({ "brand": 1, "model": 1 });
db.serialregistries.createIndex({ "created_at": -1 });
db.serialregistries.createIndex({ "ownership_status": 1 });
print("✓ serialregistries collection created");

// Scan Log - Every scan event
db.createCollection('scanlogs');
db.scanlogs.createIndex({ "serial_number": 1 });
db.scanlogs.createIndex({ "user_id": 1 });
db.scanlogs.createIndex({ "created_at": -1 });
db.scanlogs.createIndex({ "location.city": 1, "location.state": 1 });
db.scanlogs.createIndex({ "result": 1 });
print("✓ scanlogs collection created");

// Serial Batch - Bulk serial generation
db.createCollection('serialbatches');
db.serialbatches.createIndex({ "batch_id": 1 }, { unique: true });
db.serialbatches.createIndex({ "merchant_id": 1 });
db.serialbatches.createIndex({ "created_at": -1 });
print("✓ serialbatches collection created");

// Warranty - Warranty records
db.createCollection('warranties');
db.warranties.createIndex({ "serial_number": 1 }, { unique: true });
db.warranties.createIndex({ "user_id": 1 });
db.warranties.createIndex({ "warranty_status": 1 });
db.warranties.createIndex({ "warranty_expiry_date": 1 });
db.warranties.createIndex({ "activated_at": -1 });
print("✓ warranties collection created");

// Claim - Warranty claims
db.createCollection('claims');
db.claims.createIndex({ "claim_id": 1 }, { unique: true });
db.claims.createIndex({ "warranty_id": 1 });
db.claims.createIndex({ "user_id": 1 });
db.claims.createIndex({ "status": 1 });
db.claims.createIndex({ "priority": 1 });
db.claims.createIndex({ "created_at": -1 });
print("✓ claims collection created");

// Verify Queue - Fraud review
db.createCollection('verifyqueues');
db.verifyqueues.createIndex({ "serial_number": 1 });
db.verifyqueues.createIndex({ "status": 1, "priority": 1 });
db.verifyqueues.createIndex({ "created_at": -1 });
print("✓ verifyqueues collection created");

// ============================================
// SERVICE CENTERS & BOOKINGS
// ============================================

// Service Centers
db.createCollection('servicecenters');
db.servicecenters.createIndex({ "center_id": 1 }, { unique: true });
db.servicecenters.createIndex({ "merchant_id": 1 });
db.servicecenters.createIndex({ "city": 1 });
db.servicecenters.createIndex({ "status": 1 });
db.servicecenters.createIndex({ "location": "2dsphere" });
print("✓ servicecenters collection created");

// Service Bookings
db.createCollection('servicebookings');
db.servicebookings.createIndex({ "booking_id": 1 }, { unique: true });
db.servicebookings.createIndex({ "user_id": 1 });
db.servicebookings.createIndex({ "serial_number": 1 });
db.servicecenters.createIndex({ "service_center_id": 1 });
db.servicebookings.createIndex({ "scheduled_date": 1, "scheduled_time": 1 });
db.servicebookings.createIndex({ "status": 1 });
print("✓ servicebookings collection created");

// ============================================
// OWNERSHIP & RESALE (v2.0)
// ============================================

// Ownership Passport - Complete product identity
db.createCollection('ownershippassports');
db.ownershippassports.createIndex({ "passport_id": 1 }, { unique: true });
db.ownershippassports.createIndex({ "serial_number": 1 }, { unique: true });
db.ownershippassports.createIndex({ "current_owner.user_id": 1 });
db.ownershippassports.createIndex({ "status": 1 });
db.ownershippassports.createIndex({ "warranty.end_date": 1 });
print("✓ ownershippassports collection created");

// Service Records - Portable service history
db.createCollection('servicerecords');
db.servicerecords.createIndex({ "record_id": 1 }, { unique: true });
db.servicerecords.createIndex({ "serial_number": 1 });
db.servicerecords.createIndex({ "passport_id": 1 });
db.servicerecords.createIndex({ "service_date": -1 });
print("✓ servicerecords collection created");

// Resale Verification - Buyer protection
db.createCollection('resaleverifications');
db.resaleverifications.createIndex({ "verification_id": 1 }, { unique: true });
db.resaleverifications.createIndex({ "serial_number": 1 });
db.resaleverifications.createIndex({ "buyer.user_id": 1 });
db.resaleverifications.createIndex({ "status": 1 });
db.resaleverifications.createIndex({ "created_at": -1 });
print("✓ resaleverifications collection created");

// Ownership Transfer
db.createCollection('ownershiptransfers');
db.ownershiptransfers.createIndex({ "transfer_id": 1 }, { unique: true });
db.ownershiptransfers.createIndex({ "serial_number": 1 });
db.ownershiptransfers.createIndex({ "from_user_id": 1 });
db.ownershiptransfers.createIndex({ "to_user_id": 1 });
db.ownershiptransfers.createIndex({ "created_at": -1 });
print("✓ ownershiptransfers collection created");

// ============================================
// EXTENDED WARRANTY & INSURANCE (v2.0)
// ============================================

// Warranty Plans
db.createCollection('warrantyplans');
db.warrantyplans.createIndex({ "plan_id": 1 }, { unique: true });
db.warrantyplans.createIndex({ "brand_id": 1 });
db.warrantyplans.createIndex({ "tier": 1 });
db.warrantyplans.createIndex({ "status": 1 });
print("✓ warrantyplans collection created");

// Warranty Subscriptions
db.createCollection('warrantysubscriptions');
db.warrantysubscriptions.createIndex({ "subscription_id": 1 }, { unique: true });
db.warrantysubscriptions.createIndex({ "serial_number": 1 });
db.warrantysubscriptions.createIndex({ "user_id": 1 });
db.warrantysubscriptions.createIndex({ "plan_id": 1 });
db.warrantysubscriptions.createIndex({ "status": 1 });
db.warrantysubscriptions.createIndex({ "end_date": 1 });
print("✓ warrantysubscriptions collection created");

// Insurance Policies
db.createCollection('insurancepolicies');
db.insurancepolicies.createIndex({ "policy_id": 1 }, { unique: true });
db.insurancepolicies.createIndex({ "serial_number": 1 });
db.insurancepolicies.createIndex({ "user_id": 1 });
db.insurancepolicies.createIndex({ "status": 1 });
print("✓ insurancepolicies collection created");

// ============================================
// EXPRESS REPLACEMENT (v2.0)
// ============================================

// Express Replacements
db.createCollection('expressreplacements');
db.expressreplacements.createIndex({ "replacement_id": 1 }, { unique: true });
db.expressreplacements.createIndex({ "original_serial": 1 });
db.expressreplacements.createIndex({ "user_id": 1 });
db.expressreplacements.createIndex({ "status": 1 });
db.expressreplacements.createIndex({ "created_at": -1 });
print("✓ expressreplacements collection created");

// Replacement Inventory
db.createCollection('replacementinventories');
db.replacementinventories.createIndex({ "inventory_id": 1 }, { unique: true });
db.replacementinventories.createIndex({ "brand_id": 1 });
db.replacementinventories.createIndex({ "model": 1 });
db.replacementinventories.createIndex({ "status": 1 });
print("✓ replacementinventories collection created");

// ============================================
// OEM & ANALYTICS (v2.0)
// ============================================

// OEM Brands
db.createCollection('oembrands');
db.oembrands.createIndex({ "brand_id": 1 }, { unique: true });
db.oembrands.createIndex({ "brand_name": 1 });
print("✓ oembrands collection created");

// OEM Products
db.createCollection('oemproducts');
db.oemproducts.createIndex({ "product_id": 1 }, { unique: true });
db.oemproducts.createIndex({ "brand_id": 1 });
print("✓ oemproducts collection created");

// Counterfeit Reports
db.createCollection('counterfeitreports');
db.counterfeitreports.createIndex({ "report_id": 1 }, { unique: true });
db.counterfeitreports.createIndex({ "brand_id": 1 });
db.counterfeitreports.createIndex({ "serial_number": 1 });
db.counterfeitreports.createIndex({ "status": 1 });
db.counterfeitreports.createIndex({ "confidence_score": -1 });
db.counterfeitreports.createIndex({ "created_at": -1 });
print("✓ counterfeitreports collection created");

// Fraud Patterns
db.createCollection('fraudpatterns');
db.fraudpatterns.createIndex({ "pattern_id": 1 }, { unique: true });
db.fraudpatterns.createIndex({ "brand_id": 1 });
db.fraudpatterns.createIndex({ "type": 1 });
db.fraudpatterns.createIndex({ "status": 1 });
print("✓ fraudpatterns collection created");

// Regional Analytics (pre-aggregated)
db.createCollection('regionalanalytics');
db.regionalanalytics.createIndex({ "brand_id": 1, "region": 1, "date": 1 });
print("✓ regionalanalytics collection created");

// Recall Campaigns
db.createCollection('recallcampaigns');
db.recallcampaigns.createIndex({ "campaign_id": 1 }, { unique: true });
db.recallcampaigns.createIndex({ "brand_id": 1 });
db.recallcampaigns.createIndex({ "status": 1 });
print("✓ recallcampaigns collection created");

// ============================================
// SEED DATA (Optional - for testing)
// ============================================

// Create sample warranty plan
db.warrantyplans.insertOne({
    plan_id: "PLAN-BASIC-001",
    name: "Basic Protection",
    tier: "basic",
    description: "Essential coverage for manufacturing defects",
    duration_months: 12,
    price: 499,
    currency: "INR",
    coverage: {
        manufacturing_defects: true,
        accidental_damage: false,
        liquid_damage: false,
        theft_protection: false,
        pickup_delivery: false,
        express_service: false,
        unlimited_claims: false
    },
    benefits: {
        cashback_percentage: 0,
        loyalty_points_multiplier: 1,
        priority_support: false
    },
    limits: {
        max_claim_amount: 5000,
        max_total_claims: 2,
        deductible: 500
    },
    status: "active",
    created_at: new Date()
});

db.warrantyplans.insertOne({
    plan_id: "PLAN-PREMIUM-001",
    name: "Premium Protection",
    tier: "premium",
    description: "Full coverage with express service",
    duration_months: 24,
    price: 1999,
    currency: "INR",
    coverage: {
        manufacturing_defects: true,
        accidental_damage: true,
        liquid_damage: true,
        theft_protection: false,
        pickup_delivery: true,
        express_service: true,
        unlimited_claims: false
    },
    benefits: {
        cashback_percentage: 2,
        loyalty_points_multiplier: 2,
        priority_support: true
    },
    limits: {
        max_claim_amount: 20000,
        max_total_claims: 5,
        deductible: 200
    },
    status: "active",
    created_at: new Date()
});

print("✓ Sample warranty plans created");

// Create sample service center
db.servicecenters.insertOne({
    center_id: "SC-DEMO-001",
    name: "REZ Authorized Service Center",
    merchant_id: "REZ-DEMO",
    address: "123 Tech Park, MG Road",
    city: "Bangalore",
    state: "Karnataka",
    phone: "+919999999999",
    email: "support@rez.money",
    services: ["repair", "replacement", "inspection"],
    brands: ["Samsung", "Apple", "OnePlus"],
    location: {
        type: "Point",
        coordinates: [77.5946, 12.9716]
    },
    working_hours: "Mon-Sat: 9AM-7PM",
    status: "active",
    created_at: new Date()
});

print("✓ Sample service center created");

print("");
print("===========================================");
print("Verify QR Database v2.0 initialized!");
print("===========================================");
print("");
print("Collections created:");
print("  - serialregistries");
print("  - scanlogs");
print("  - warranties");
print("  - claims");
print("  - servicecenters");
print("  - servicebookings");
print("  - ownershippassports");
print("  - servicerecords");
print("  - resaleverifications");
print("  - warrantyplans");
print("  - warrantysubscriptions");
print("  - insurancepolicies");
print("  - expressreplacements");
print("  - oembrands");
print("  - counterfeitreports");
print("  - fraudpatterns");
print("  - recallcampaigns");
print("");
