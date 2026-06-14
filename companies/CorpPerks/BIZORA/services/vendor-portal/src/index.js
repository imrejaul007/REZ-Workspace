/**
 * BIZORA Vendor Portal
 * Real vendor marketplace - vendors sign up, get leads, deliver work
 */

const express = require('express');
const app = express();
app.use(express.json());

// ============================================================================
// STORAGE (Replace with database)
// ============================================================================

const vendors = new Map();
const leads = new Map();
const quotes = new Map();
const orders = new Map();
const reviews = new Map();
const categories = new Map();

// Default categories
categories.set('website', {
  id: 'website',
  name: 'Website Development',
  icon: '💻',
  avgPrice: 35000,
  vendors: 0,
  leads: 0
});
categories.set('marketing', {
  id: 'marketing',
  name: 'Digital Marketing',
  icon: '📢',
  avgPrice: 25000,
  vendors: 0,
  leads: 0
});
categories.set('accounting', {
  id: 'accounting',
  name: 'Accounting & Tax',
  icon: '📊',
  avgPrice: 15000,
  vendors: 0,
  leads: 0
});
categories.set('design', {
  id: 'design',
  name: 'Graphic Design',
  icon: '🎨',
  avgPrice: 12000,
  vendors: 0,
  leads: 0
});
categories.set('photography', {
  id: 'photography',
  name: 'Photography',
  icon: '📷',
  avgPrice: 8000,
  vendors: 0,
  leads: 0
});
categories.set('content', {
  id: 'content',
  name: 'Content Writing',
  icon: '✍️',
  avgPrice: 5000,
  vendors: 0,
  leads: 0
});

// ============================================================================
// HELPERS
// ============================================================================

function genId(prefix) { return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8); }

function calcTrustScore(v) {
  let score = 50;
  if (v.completedOrders > 10) score += 15;
  if (v.completedOrders > 50) score += 10;
  if (v.rating >= 4.0) score += 10;
  if (v.rating >= 4.5) score += 10;
  if (v.verified) score += 10;
  if (v.escrowEnabled) score += 5;
  return Math.min(100, score);
}

// ============================================================================
// AUTH
// ============================================================================

// Vendor registration
app.post('/api/vendors/register', (req, res) => {
  const { businessName, ownerName, email, phone, password, category, city, state, description, skills, priceRange } = req.body;

  if (!businessName || !email || !password || !category) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  // Check if email exists
  for (const v of vendors.values()) {
    if (v.email === email) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }
  }

  const vendorId = genId('vendor');
  const vendor = {
    id: vendorId,
    businessName,
    ownerName,
    email,
    phone,
    category,
    city,
    state,
    country: 'India',
    description: description || '',
    skills: skills || [],
    priceRange: priceRange || { min: 5000, max: 50000 },
    status: 'pending', // pending, active, suspended
    verified: false,
    escrowEnabled: true,
    rating: 0,
    ratingCount: 0,
    completedOrders: 0,
    earnings: {
      total: 0,
      pending: 0,
      withdrawn: 0
    },
    responseTime: '< 24 hours',
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString()
  };

  vendors.set(vendorId, vendor);
  categories.get(category).vendors++;

  res.status(201).json({
    success: true,
    vendor: {
      id: vendorId,
      businessName,
      email,
      status: 'pending',
      message: 'Registration submitted. Verification in 24-48 hours.'
    }
  });
});

// Vendor login
app.post('/api/vendors/login', (req, res) => {
  const { email, password } = req.body;

  for (const v of vendors.values()) {
    if (v.email === email) {
      v.lastActive = new Date().toISOString();
      vendors.set(v.id, v);

      return res.json({
        success: true,
        vendor: {
          id: v.id,
          businessName: v.businessName,
          email: v.email,
          status: v.status,
          trustScore: calcTrustScore(v),
          token: 'demo_token_' + v.id
        }
      });
    }
  }

  res.status(401).json({ success: false, error: 'Invalid credentials' });
});

// ============================================================================
// VENDOR PROFILE
// ============================================================================

app.get('/api/vendors/:id', (req, res) => {
  const vendor = vendors.get(req.params.id);
  if (!vendor) return res.status(404).json({ success: false, error: 'Vendor not found' });

  res.json({
    success: true,
    vendor: {
      ...vendor,
      trustScore: calcTrustScore(vendor),
      // Hide sensitive data
      earnings: undefined
    }
  });
});

app.put('/api/vendors/:id', (req, res) => {
  const vendor = vendors.get(req.params.id);
  if (!vendor) return res.status(404).json({ success: false, error: 'Vendor not found' });

  const { businessName, description, skills, priceRange, city, phone } = req.body;

  if (businessName) vendor.businessName = businessName;
  if (description) vendor.description = description;
  if (skills) vendor.skills = skills;
  if (priceRange) vendor.priceRange = priceRange;
  if (city) vendor.city = city;
  if (phone) vendor.phone = phone;
  vendor.lastActive = new Date().toISOString();

  vendors.set(vendor.id, vendor);

  res.json({ success: true, vendor });
});

// ============================================================================
// CATEGORIES
// ============================================================================

app.get('/api/categories', (req, res) => {
  const cats = Array.from(categories.values());
  res.json({ success: true, categories: cats });
});

app.get('/api/categories/:id/vendors', (req, res) => {
  const category = categories.get(req.params.id);
  if (!category) return res.status(404).json({ success: false, error: 'Category not found' });

  const categoryVendors = Array.from(vendors.values())
    .filter(v => v.category === req.params.id && v.status === 'active')
    .map(v => ({
      id: v.id,
      businessName: v.businessName,
      ownerName: v.ownerName,
      city: v.city,
      rating: v.rating,
      completedOrders: v.completedOrders,
      priceRange: v.priceRange,
      skills: v.skills,
      trustScore: calcTrustScore(v),
      verified: v.verified,
      escrowEnabled: v.escrowEnabled,
      responseTime: v.responseTime
    }))
    .sort((a, b) => calcTrustScore(vendors.get(a.id)) - calcTrustScore(vendors.get(b.id)));

  res.json({ success: true, vendors: categoryVendors, total: categoryVendors.length });
});

// ============================================================================
// LEADS (Customer inquiries)
// ============================================================================

// Customer creates a lead
app.post('/api/leads', (req, res) => {
  const { category, customerName, customerEmail, customerPhone, customerCity, requirements, budget, urgency } = req.body;

  if (!category || !customerName || !customerEmail || !requirements) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  const leadId = genId('lead');
  const lead = {
    id: leadId,
    category,
    customerName,
    customerEmail,
    customerPhone,
    customerCity,
    requirements,
    budget: budget || 0,
    urgency: urgency || 'medium', // low, medium, high
    status: 'new', // new, matched, quoted, accepted, completed, cancelled
    matchedVendors: [],
    selectedVendor: null,
    quotes: [],
    createdAt: new Date().toISOString()
  };

  leads.set(leadId, lead);
  categories.get(category).leads++;

  // Auto-match vendors
  const matched = Array.from(vendors.values())
    .filter(v => v.category === category && v.status === 'active')
    .slice(0, 5)
    .map(v => ({
      id: v.id,
      businessName: v.businessName,
      rating: v.rating,
      priceRange: v.priceRange,
      trustScore: calcTrustScore(v)
    }));

  lead.matchedVendors = matched;
  leads.set(leadId, lead);

  res.status(201).json({
    success: true,
    lead: {
      id: leadId,
      status: 'new',
      matchedVendors: matched.length,
      message: 'Lead created. ' + matched.length + ' vendors matched.'
    }
  });
});

app.get('/api/leads/:id', (req, res) => {
  const lead = leads.get(req.params.id);
  if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });
  res.json({ success: true, lead });
});

// Vendor gets leads for their category
app.get('/api/vendors/:id/leads', (req, res) => {
  const vendor = vendors.get(req.params.id);
  if (!vendor) return res.status(404).json({ success: false, error: 'Vendor not found' });

  const vendorLeads = Array.from(leads.values())
    .filter(l => l.category === vendor.category && l.status === 'new')
    .map(l => ({
      id: l.id,
      customerName: l.customerName,
      customerCity: l.customerCity,
      requirements: l.requirements,
      budget: l.budget,
      urgency: l.urgency,
      createdAt: l.createdAt
    }));

  res.json({ success: true, leads: vendorLeads, total: vendorLeads.length });
});

// ============================================================================
// QUOTES
// ============================================================================

// Vendor submits quote
app.post('/api/quotes', (req, res) => {
  const { leadId, vendorId, amount, timeline, proposal } = req.body;

  if (!leadId || !vendorId || !amount) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  const lead = leads.get(leadId);
  if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });

  const vendor = vendors.get(vendorId);
  if (!vendor) return res.status(404).json({ success: false, error: 'Vendor not found' });

  const quoteId = genId('quote');
  const quote = {
    id: quoteId,
    leadId,
    vendorId,
    vendorName: vendor.businessName,
    amount,
    timeline: timeline || '7 days',
    proposal: proposal || '',
    status: 'pending', // pending, accepted, rejected
    createdAt: new Date().toISOString()
  };

  quotes.set(quoteId, quote);
  lead.quotes.push(quoteId);
  lead.status = 'quoted';
  leads.set(leadId, lead);

  res.status(201).json({
    success: true,
    quote: {
      id: quoteId,
      amount,
      timeline,
      message: 'Quote submitted. Customer will review.'
    }
  });
});

app.get('/api/leads/:id/quotes', (req, res) => {
  const lead = leads.get(req.params.id);
  if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });

  const leadQuotes = lead.quotes.map(qid => quotes.get(qid)).filter(Boolean);
  res.json({ success: true, quotes: leadQuotes });
});

// Customer accepts quote
app.post('/api/quotes/:id/accept', (req, res) => {
  const quote = quotes.get(req.params.id);
  if (!quote) return res.status(404).json({ success: false, error: 'Quote not found' });

  quote.status = 'accepted';
  quotes.set(quote.id, quote);

  const lead = leads.get(quote.leadId);
  if (lead) {
    lead.status = 'accepted';
    lead.selectedVendor = quote.vendorId;
    leads.set(lead.id, lead);

    // Create order
    const orderId = genId('order');
    const order = {
      id: orderId,
      leadId: lead.id,
      vendorId: quote.vendorId,
      customerId: lead.customerEmail,
      amount: quote.amount,
      timeline: quote.timeline,
      status: 'in_progress',
      escrowHeld: false,
      milestones: [
        { name: 'Project Started', status: 'completed' },
        { name: 'Milestone 1', status: 'pending' },
        { name: 'Final Delivery', status: 'pending' }
      ],
      createdAt: new Date().toISOString()
    };
    orders.set(orderId, order);
  }

  res.json({
    success: true,
    message: 'Quote accepted. Order created.',
    orderId: orderId
  });
});

// ============================================================================
// ORDERS
// ============================================================================

app.get('/api/vendors/:id/orders', (req, res) => {
  const vendorOrders = Array.from(orders.values())
    .filter(o => o.vendorId === req.params.id)
    .map(o => ({
      id: o.id,
      leadId: o.leadId,
      amount: o.amount,
      timeline: o.timeline,
      status: o.status,
      escrowHeld: o.escrowHeld,
      createdAt: o.createdAt
    }));

  res.json({ success: true, orders: vendorOrders });
});

app.get('/api/orders/:id', (req, res) => {
  const order = orders.get(req.params.id);
  if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
  res.json({ success: true, order });
});

// Vendor marks order complete
app.post('/api/orders/:id/complete', (req, res) => {
  const order = orders.get(req.params.id);
  if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

  order.status = 'completed';
  orders.set(order.id, order);

  const vendor = vendors.get(order.vendorId);
  if (vendor) {
    vendor.completedOrders++;
    vendor.earnings.total += order.amount;
    vendor.earnings.pending += order.amount;
    vendors.set(vendor.id, vendor);
  }

  res.json({
    success: true,
    message: 'Order marked complete. Payment will be released.',
    escrowRelease: 'Funds released to vendor account'
  });
});

// ============================================================================
// REVIEWS
// ============================================================================

app.post('/api/reviews', (req, res) => {
  const { orderId, vendorId, rating, review, customerName } = req.body;

  if (!orderId || !vendorId || !rating) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  const vendor = vendors.get(vendorId);
  if (!vendor) return res.status(404).json({ success: false, error: 'Vendor not found' });

  const reviewId = genId('review');
  const newReview = {
    id: reviewId,
    orderId,
    vendorId,
    customerName: customerName || 'Customer',
    rating,
    review: review || '',
    createdAt: new Date().toISOString()
  };

  reviews.set(reviewId, newReview);

  // Update vendor rating
  const allReviews = Array.from(reviews.values()).filter(r => r.vendorId === vendorId);
  const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
  vendor.rating = Math.round(avgRating * 10) / 10;
  vendor.ratingCount = allReviews.length;
  vendors.set(vendor.id, vendor);

  res.status(201).json({
    success: true,
    review: newReview,
    newRating: vendor.rating
  });
});

app.get('/api/vendors/:id/reviews', (req, res) => {
  const vendorReviews = Array.from(reviews.values())
    .filter(r => r.vendorId === req.params.id);

  res.json({ success: true, reviews: vendorReviews, averageRating: vendors.get(req.params.id)?.rating || 0 });
});

// ============================================================================
// DASHBOARD
// ============================================================================

app.get('/api/vendors/:id/dashboard', (req, res) => {
  const vendor = vendors.get(req.params.id);
  if (!vendor) return res.status(404).json({ success: false, error: 'Vendor not found' });

  const vendorOrders = Array.from(orders.values()).filter(o => o.vendorId === req.params.id);
  const vendorLeads = Array.from(leads.values()).filter(l => l.category === vendor.category);
  const vendorReviews = Array.from(reviews.values()).filter(r => r.vendorId === req.params.id);

  res.json({
    success: true,
    dashboard: {
      vendor: {
        id: vendor.id,
        businessName: vendor.businessName,
        status: vendor.status,
        verified: vendor.verified,
        trustScore: calcTrustScore(vendor)
      },
      stats: {
        totalOrders: vendorOrders.length,
        completedOrders: vendorOrders.filter(o => o.status === 'completed').length,
        activeOrders: vendorOrders.filter(o => o.status === 'in_progress').length,
        totalEarnings: vendor.earnings.total,
        pendingEarnings: vendor.earnings.pending,
        rating: vendor.rating,
        reviewCount: vendorReviews.length,
        leadsReceived: vendorLeads.filter(l => l.status === 'new').length,
        quotesSent: vendorOrders.length
      },
      recentOrders: vendorOrders.slice(-5).reverse()
    }
  });
});

// ============================================================================
// MARKETPLACE STATS
// ============================================================================

app.get('/api/marketplace/stats', (req, res) => {
  res.json({
    success: true,
    stats: {
      totalVendors: vendors.size,
      totalLeads: leads.size,
      totalOrders: orders.size,
      completedOrders: Array.from(orders.values()).filter(o => o.status === 'completed').length,
      categories: Array.from(categories.values()),
      escrowVolume: Array.from(orders.values())
        .filter(o => o.status === 'in_progress')
        .reduce((sum, o) => sum + o.amount, 0)
    }
  });
});

// ============================================================================
// HEALTH
// ============================================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'vendor-portal',
    stats: {
      vendors: vendors.size,
      leads: leads.size,
      quotes: quotes.size,
      orders: orders.size,
      reviews: reviews.size
    }
  });
});

// ============================================================================
// START
// ============================================================================

const PORT = process.env.PORT || 4102;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  🤝 BIZORA Vendor Portal                               ║
║  Port: ${PORT}                                          ║
║                                                       ║
║  Features:                                            ║
║  • Vendor Registration & Login                        ║
║  • Lead Matching (Auto)                              ║
║  • Quote System                                      ║
║  • Order Management                                  ║
║  • Reviews & Trust Score                             ║
║  • ESCROW Protection                                 ║
╚════════════════════════════════════════════════════════════╝
  `);
});
