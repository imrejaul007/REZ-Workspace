/**
 * Prospect Database
 *
 * Persistent storage for all prospect data with:
 * - Full CRUD operations
 * - Search & filtering
 * - Bulk operations
 * - Import/Export (CSV, JSON)
 * - Activity tracking
 * - Tags & segments
 */

const { v4: uuidv4 } = require('uuid');

// In-memory database (can be replaced with MongoDB/PostgreSQL)
class ProspectDatabase {
  constructor() {
    this.prospects = new Map();
    this.activities = new Map();
    this.tags = new Map();
    this.segments = new Map();
    this.views = new Map();
    this.lastId = 0;

    // Seed sample data
    this.seedSampleData();
  }

  // ============================================
  // PROSPECT CRUD
  // ============================================

  create(prospectData) {
    const id = uuidv4();
    const now = new Date().toISOString();

    const prospect = {
      id,
      ...prospectData,
      // Core fields
      firstName: prospectData.firstName || '',
      lastName: prospectData.lastName || '',
      fullName: `${prospectData.firstName || ''} ${prospectData.lastName || ''}`.trim(),
      email: prospectData.email || null,
      phone: prospectData.phone || null,
      linkedinUrl: prospectData.linkedinUrl || null,
      // Company info
      company: prospectData.company || '',
      companyDomain: prospectData.companyDomain || prospectData.domain || null,
      title: prospectData.title || '',
      seniority: prospectData.seniority || 'Unknown',
      department: prospectData.department || '',
      // Location
      location: prospectData.location || '',
      city: prospectData.city || '',
      state: prospectData.state || '',
      country: prospectData.country || 'India',
      // Scoring
      scores: prospectData.scores || {
        opportunity: 50,
        pain: 50,
        intent: 50,
        urgency: 50,
        revenue: 50,
        overall: 50
      },
      // Status
      status: prospectData.status || 'new', // new, contacted, qualified, engaged, customer, churned
      stage: prospectData.stage || 'lead', // lead, mql, sql, opportunity, customer
      source: prospectData.source || 'gtm', // gtm, import, linkedin, referral, api
      // Enrichment
      enriched: prospectData.enriched || false,
      enrichmentSources: prospectData.enrichmentSources || [],
      enrichedAt: prospectData.enrichedAt || null,
      // Communication
      tags: prospectData.tags || [],
      notes: prospectData.notes || [],
      customFields: prospectData.customFields || {},
      // Engagement
      engagement: {
        emailsSent: 0,
        emailsOpened: 0,
        emailsClicked: 0,
        emailsReplied: 0,
        callsMade: 0,
        callsConnected: 0,
        linkedinMessages: 0,
        whatsappMessages: 0,
        meetings: 0,
        lastContactedAt: null,
        lastEngagedAt: null
      },
      // Meta
      owner: prospectData.owner || null,
      team: prospectData.team || null,
      createdAt: now,
      updatedAt: now,
      createdBy: prospectData.createdBy || 'system'
    };

    this.prospects.set(id, prospect);
    this.lastId++;

    // Track activity
    this.trackActivity(id, 'created', { source: 'gtm' });

    return prospect;
  }

  get(id) {
    return this.prospects.get(id) || null;
  }

  getByEmail(email) {
    for (const prospect of this.prospects.values()) {
      if (prospect.email?.toLowerCase() === email.toLowerCase()) {
        return prospect;
      }
    }
    return null;
  }

  getByLinkedIn(url) {
    for (const prospect of this.prospects.values()) {
      if (prospect.linkedinUrl === url) {
        return prospect;
      }
    }
    return null;
  }

  update(id, updates) {
    const prospect = this.prospects.get(id);
    if (!prospect) return null;

    const updated = {
      ...prospect,
      ...updates,
      id, // Prevent ID change
      updatedAt: new Date().toISOString()
    };

    // Recalculate full name
    updated.fullName = `${updated.firstName || ''} ${updated.lastName || ''}`.trim();

    this.prospects.set(id, updated);
    this.trackActivity(id, 'updated', { fields: Object.keys(updates) });

    return updated;
  }

  delete(id) {
    const prospect = this.prospects.get(id);
    if (!prospect) return false;

    this.prospects.delete(id);
    this.trackActivity(id, 'deleted', { reason: 'user_request' });

    return true;
  }

  // ============================================
  // BULK OPERATIONS
  // ============================================

  createBulk(prospects) {
    const results = { created: 0, updated: 0, errors: [] };

    for (const p of prospects) {
      try {
        // Check for duplicates
        const existing = p.email ? this.getByEmail(p.email) :
 p.linkedinUrl ? this.getByLinkedIn(p.linkedinUrl) : null;

        if (existing) {
          this.update(existing.id, p);
          results.updated++;
        } else {
          this.create(p);
          results.created++;
        }
      } catch (error) {
        results.errors.push({ data: p, error: error.message });
      }
    }

    return results;
  }

  updateBulk(ids, updates) {
    const results = { updated: 0, errors: [] };

    for (const id of ids) {
      try {
        const updated = this.update(id, updates);
        if (updated) results.updated++;
        else results.errors.push({ id, error: 'Not found' });
      } catch (error) {
        results.errors.push({ id, error: error.message });
      }
    }

    return results;
  }

  deleteBulk(ids) {
    const results = { deleted: 0, errors: [] };

    for (const id of ids) {
      try {
        if (this.delete(id)) results.deleted++;
        else results.errors.push({ id, error: 'Not found' });
      } catch (error) {
        results.errors.push({ id, error: error.message });
      }
    }

    return results;
  }

  // ============================================
  // SEARCH& FILTER
  // ============================================

  search(options = {}) {
    const {
      query = '',
      filters = {},
      sort = { field: 'createdAt', order: 'desc' },
      page = 1,
      limit = 50
    } = options;

    let results = Array.from(this.prospects.values());

    // Text search
    if (query) {
      const q = query.toLowerCase();
      results = results.filter(p =>
        p.fullName?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.company?.toLowerCase().includes(q) ||
        p.title?.toLowerCase().includes(q) ||
        p.location?.toLowerCase().includes(q)
      );
    }

    // Apply filters
    if (filters.status?.length) {
      results = results.filter(p => filters.status.includes(p.status));
    }
    if (filters.stage?.length) {
      results = results.filter(p => filters.stage.includes(p.stage));
    }
    if (filters.source?.length) {
      results = results.filter(p => filters.source.includes(p.source));
    }
    if (filters.seniority?.length) {
      results = results.filter(p => filters.seniority.includes(p.seniority));
    }
    if (filters.country?.length) {
      results = results.filter(p => filters.country.includes(p.country));
    }
    if (filters.owner) {
      results = results.filter(p => p.owner === filters.owner);
    }
    if (filters.tags?.length) {
      results = results.filter(p =>
        filters.tags.some(tag => p.tags.includes(tag))
      );
    }
    if (filters.minScore !== undefined) {
      results = results.filter(p => p.scores.overall >= filters.minScore);
    }
    if (filters.maxScore !== undefined) {
      results = results.filter(p => p.scores.overall <= filters.maxScore);
    }
    if (filters.enriched !== undefined) {
      results = results.filter(p => p.enriched === filters.enriched);
    }
    if (filters.dateFrom) {
      results = results.filter(p => new Date(p.createdAt) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      results = results.filter(p => new Date(p.createdAt) <= new Date(filters.dateTo));
    }

    // Sort
    results.sort((a, b) => {
      const aVal = a[sort.field] ??0;
      const bVal = b[sort.field] ?? 0;
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sort.order === 'desc' ? -cmp : cmp;
    });

    // Pagination
    const total = results.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedResults = results.slice(offset, offset + limit);

    return {
      data: paginatedResults,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  // ============================================
  // TAGS
  // ============================================

  addTag(prospectId, tag) {
    const prospect = this.prospects.get(prospectId);
    if (!prospect) return null;

    if (!prospect.tags.includes(tag)) {
      prospect.tags.push(tag);
      prospect.updatedAt = new Date().toISOString();
      this.prospects.set(prospectId, prospect);
      this.trackActivity(prospectId, 'tag_added', { tag });
    }

    return prospect;
  }

  removeTag(prospectId, tag) {
    const prospect = this.prospects.get(prospectId);
    if (!prospect) return null;

    prospect.tags = prospect.tags.filter(t => t !== tag);
    prospect.updatedAt = new Date().toISOString();
    this.prospects.set(prospectId, prospect);
    this.trackActivity(prospectId, 'tag_removed', { tag });

    return prospect;
  }

  getAllTags() {
    const tagCounts = {};
    for (const prospect of this.prospects.values()) {
      for (const tag of prospect.tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }
    return Object.entries(tagCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }

  // ============================================
  // SEGMENTS
  // ============================================

  createSegment(name, query) {
    const id = uuidv4();
    const segment = {
      id,
      name,
      query,
      prospectCount: 0,
      createdAt: new Date().toISOString()
    };

    this.segments.set(id, segment);
    return segment;
  }

  getSegmentProspects(segmentId) {
    const segment = this.segments.get(segmentId);
    if (!segment) return [];

    const result = this.search(segment.query);
    return result.data;
  }

  // ============================================
  // ACTIVITY TRACKING
  // ============================================

  trackActivity(prospectId, type, data = {}) {
    const activity = {
      id: uuidv4(),
      prospectId,
      type,
      data,
      timestamp: new Date().toISOString()
    };

    if (!this.activities.has(prospectId)) {
      this.activities.set(prospectId, []);
    }
    this.activities.get(prospectId).push(activity);

    return activity;
  }

  getActivities(prospectId, options = {}) {
    const { type, limit = 50 } = options;
    let activities = this.activities.get(prospectId) || [];

    if (type) {
      activities = activities.filter(a => a.type === type);
    }

    return activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  // ============================================
  // ENGAGEMENT
  // ============================================

  recordEngagement(prospectId, type, data = {}) {
    const prospect = this.prospects.get(prospectId);
    if (!prospect) return null;

    const engagement = prospect.engagement;
    const now = new Date().toISOString();

    switch (type) {
      case 'email_sent':
        engagement.emailsSent++;
        prospect.lastContactedAt = now;
        break;
      case 'email_opened':
        engagement.emailsOpened++;
        prospect.lastEngagedAt = now;
        break;
      case 'email_clicked':
        engagement.emailsClicked++;
        prospect.lastEngagedAt = now;
        break;
      case 'email_replied':
        engagement.emailsReplied++;
        prospect.lastEngagedAt = now;
        break;
      case 'call_made':
        engagement.callsMade++;
        prospect.lastContactedAt = now;
        break;
      case 'call_connected':
        engagement.callsConnected++;
        prospect.lastEngagedAt = now;
        break;
      case 'linkedin_message':
        engagement.linkedinMessages++;
        prospect.lastContactedAt = now;
        break;
      case 'whatsapp_message':
        engagement.whatsappMessages++;
        prospect.lastContactedAt = now;
        break;
      case 'meeting':
        engagement.meetings++;
        prospect.lastEngagedAt = now;
        break;
    }

    prospect.updatedAt = now;
    this.prospects.set(prospectId, prospect);
    this.trackActivity(prospectId, type, data);

    return prospect;
  }

  // ============================================
  // VIEWS (Saved Searches)
  // ============================================

  createView(name, query, filters) {
    const id = uuidv4();
    const view = {
      id,
      name,
      query,
      filters,
      createdAt: new Date().toISOString()
    };

    this.views.set(id, view);
    return view;
  }

  getViews() {
    return Array.from(this.views.values());
  }

  // ============================================
  // IMPORT / EXPORT
  // ============================================

  exportCSV(options = {}) {
    const { filters = {}, fields = [] } = options;
    const result = this.search({ filters, limit: 10000 });

    const defaultFields = ['firstName', 'lastName', 'email', 'phone', 'company', 'title', 'location', 'status', 'scores.overall'];
    const exportFields = fields.length ? fields : defaultFields;

    // CSV header
    let csv = exportFields.join(',') + '\n';

    // CSV rows
    for (const p of result.data) {
      const row = exportFields.map(field => {
        const value = field.includes('.') ?
          field.split('.').reduce((obj, key) => obj?.[key], p) :
          p[field];
        // Escape commas and quotes
        const str = String(value ?? '');
        return str.includes(',') || str.includes('"') ?
          `"${str.replace(/"/g, '""')}"` : str;
      });
      csv += row.join(',') + '\n';
    }

    return csv;
  }

  exportJSON(options = {}) {
    const { filters = {}, fields = [] } = options;
    const result = this.search({ filters, limit: 10000 });

    let data = result.data;
    if (fields.length) {
      data = data.map(p => {
        const filtered = {};
        for (const field of fields) {
          filtered[field] = field.includes('.') ?
            field.split('.').reduce((obj, key) => obj?.[key], p) :
            p[field];
        }
        return filtered;
      });
    }

    return JSON.stringify(data, null, 2);
  }

  importCSV(csvString) {
    const lines = csvString.split('\n').filter(l => l.trim());
    if (lines.length < 2) return { imported: 0, errors: [] };

    const headers = lines[0].split(',').map(h => h.trim());
    const prospects = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      const prospect = {};
      headers.forEach((header, idx) => {
        prospect[header] = values[idx] || '';
      });
      prospects.push(prospect);
    }

    return this.createBulk(prospects);
  }

  parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    return values;
  }

  // ============================================
  // STATISTICS
  // ============================================

  getStats() {
    const prospects = Array.from(this.prospects.values());

    const statusCounts = {};
    const stageCounts = {};
    const sourceCounts = {};
    const seniorityCounts = {};
    const countryCounts = {};

    for (const p of prospects) {
      statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
      stageCounts[p.stage] = (stageCounts[p.stage] || 0) + 1;
      sourceCounts[p.source] = (sourceCounts[p.source] || 0) + 1;
      seniorityCounts[p.seniority] = (seniorityCounts[p.seniority] || 0) + 1;
      countryCounts[p.country] = (countryCounts[p.country] || 0) + 1;
    }

    // Engagement totals
    const engagement = {
      emailsSent: 0,
      emailsOpened: 0,
      emailsClicked: 0,
      emailsReplied: 0,
      callsMade: 0,
      callsConnected: 0,
      linkedinMessages: 0,
      whatsappMessages: 0,
      meetings: 0
    };

    for (const p of prospects) {
      Object.keys(engagement).forEach(key => {
        engagement[key] += p.engagement[key];
      });
    }

    // Score distribution
    const scoreRanges = {
      '0-25': 0,
      '26-50': 0,
      '51-75': 0,
      '76-100': 0
    };

    for (const p of prospects) {
      const score = p.scores?.overall || 50;
      if (score <= 25) scoreRanges['0-25']++;
      else if (score <= 50) scoreRanges['26-50']++;
      else if (score <= 75) scoreRanges['51-75']++;
      else scoreRanges['76-100']++;
    }

    return {
      total: prospects.length,
      enriched: prospects.filter(p => p.enriched).length,
      statusCounts,
      stageCounts,
      sourceCounts,
      seniorityCounts,
      countryCounts,
      engagement,
      scoreDistribution: scoreRanges,
      avgScore: prospects.length ?
        (prospects.reduce((sum, p) => sum + (p.scores?.overall || 0), 0) / prospects.length).toFixed(1) : 0
    };
  }

  // ============================================
  // SEED DATA
  // ============================================

  seedSampleData() {
    const sampleProspects = [
      {
        firstName: 'Sarah',
        lastName: 'Chen',
        email: 'sarah.chen@techcorp.com',
        phone: '+91 98765 43210',
        company: 'TechCorp India',
        companyDomain: 'techcorp.com',
        title: 'VP of Marketing',
        seniority: 'VP',
        department: 'Marketing',
        location: 'Mumbai, India',
        country: 'India',
        scores: { opportunity: 85, pain: 70, intent: 75, urgency: 60, revenue: 80, overall: 74 },
        status: 'engaged',
        stage: 'sql',
        source: 'gtm',
        tags: ['enterprise', 'marketing', 'high-priority']
      },
      {
        firstName: 'Raj',
        lastName: 'Patel',
        email: 'raj.patel@startupx.io',
        phone: '+91 98765 43211',
        company: 'StartupX',
        companyDomain: 'startupx.io',
        title: 'Founder& CEO',
        seniority: 'C-level',
        department: 'Executive',
        location: 'Bangalore, India',
        country: 'India',
        scores: { opportunity: 90, pain: 85, intent: 80, urgency: 75, revenue: 95, overall: 85 },
        status: 'qualified',
        stage: 'opportunity',
        source: 'gtm',
        tags: ['startup', 'founder', 'hot-lead']
      },
      {
        firstName: 'Priya',
        lastName: 'Sharma',
        email: 'priya@retailmart.com',
        phone: '+91 98765 43212',
        company: 'RetailMart',
        companyDomain: 'retailmart.com',
        title: 'Head of Growth',
        seniority: 'VP',
        department: 'Growth',
        location: 'Delhi, India',
        country: 'India',
        scores: { opportunity: 75, pain: 65, intent: 70, urgency: 55, revenue: 70, overall: 67 },
        status: 'contacted',
        stage: 'mql',
        source: 'linkedin',
        tags: ['retail', 'growth']
      },
      {
        firstName: 'Michael',
        lastName: 'Johnson',
        email: 'mjohnson@enterprise.co',
        phone: '+91 98765 43213',
        company: 'Enterprise Co',
        companyDomain: 'enterprise.co',
        title: 'CRM Manager',
        seniority: 'Manager',
        department: 'Sales',
        location: 'Pune, India',
        country: 'India',
        scores: { opportunity: 60, pain: 55, intent: 50, urgency: 45, revenue: 55, overall: 53 },
        status: 'new',
        stage: 'lead',
        source: 'import',
        tags: ['enterprise', 'sales']
      },
      {
        firstName: 'Aisha',
        lastName: 'Khan',
        email: 'aisha.khan@digitalfirst.in',
        phone: '+91 98765 43214',
        company: 'DigitalFirst',
        companyDomain: 'digitalfirst.in',
        title: 'Marketing Director',
        seniority: 'Director',
        department: 'Marketing',
        location: 'Hyderabad, India',
        country: 'India',
        scores: { opportunity: 80, pain: 75, intent: 70, urgency: 65, revenue: 75, overall: 73 },
        status: 'engaged',
        stage: 'sql',
        source: 'gtm',
        tags: ['d2c', 'marketing', 'director']
      }
    ];

    for (const p of sampleProspects) {
      this.create(p);
    }
  }
}

// Singleton instance
const db = new ProspectDatabase();

module.exports = db;