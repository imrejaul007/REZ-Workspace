/**
 * Data Enrichment APIs
 *
 * Integrates with:
 * - Apollo.io (person & company data)
 * - Clearbit (company data, logo, revealing)
 * - Hunter.io (email finder, domain search)
 * - RocketReach (person data)
 * - People Data Labs (PDL)
 * - Pipl (person search)
 */

const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

// Configuration
const config = {
  apollo: {
    apiKey: process.env.APOLLO_API_KEY || null,
    baseUrl: 'https://api.apollo.io/v1'
  },
  clearbit: {
    apiKey: process.env.CLEARBIT_API_KEY || null,
    baseUrl: 'https://company.clearbit.com/v2'
  },
  hunter: {
    apiKey: process.env.HUNTER_API_KEY || null,
    baseUrl: 'https://api.hunter.io/v2'
  },
  rocketReach: {
    apiKey: process.env.ROCKETREACH_API_KEY || null,
    baseUrl: 'https://api.rocketreach.io/v2'
  }
};

// In-memory cache
const enrichmentCache = new Map();
const enrichmentJobs = new Map();

/**
 * Enrich company data from multiple sources
 */
async function enrichCompany(domain, options = {}) {
  const { sources = ['apollo', 'clearbit', 'hunter'], useCache = true } = options;

  // Check cache
  const cacheKey = `company:${domain}`;
  if (useCache && enrichmentCache.has(cacheKey)) {
    return enrichmentCache.get(cacheKey);
  }

  const results = {};
  const errors = {};

  // Run all enrichments in parallel
  const promises = [];

  if (sources.includes('apollo')) {
    promises.push(enrichFromApollo(domain).then(r => results.apollo = r).catch(e => errors.apollo = e.message));
  }

  if (sources.includes('clearbit')) {
    promises.push(enrichFromClearbit(domain).then(r => results.clearbit = r).catch(e => errors.clearbit = e.message));
  }

  if (sources.includes('hunter')) {
    promises.push(enrichFromHunter(domain).then(r => results.hunter = r).catch(e => errors.hunter = e.message));
  }

  await Promise.allSettled(promises);

  // Merge results
  const enriched = mergeCompanyData(results);

  // Cache for 24 hours
  enrichmentCache.set(cacheKey, enriched);
  setTimeout(() => enrichmentCache.delete(cacheKey), 24 * 60 * 60 * 1000);

  return {
    ...enriched,
    sources: Object.keys(results),
    errors: Object.keys(errors).length ? errors : null,
    enrichedAt: new Date().toISOString()
  };
}

/**
 * Enrich person/contact data
 */
async function enrichPerson(options = {}) {
  const {
    firstName,
    lastName,
    email,
    company,
    domain,
    sources = ['apollo', 'hunter', 'rocketreach'],
    useCache = true
  } = options;

  // Check cache
  const cacheKey = `person:${firstName}:${lastName}:${company}`;
  if (useCache && enrichmentCache.has(cacheKey)) {
    return enrichmentCache.get(cacheKey);
  }

  const results = {};
  const errors = {};

  const promises = [];

  if (sources.includes('apollo')) {
    promises.push(
      enrichPersonFromApollo({ firstName, lastName, company, domain })
        .then(r => results.apollo = r)
        .catch(e => errors.apollo = e.message)
    );
  }

  if (sources.includes('hunter') && (email || domain)) {
    promises.push(
      enrichPersonFromHunter({ firstName, lastName, email, domain })
        .then(r => results.hunter = r)
        .catch(e => errors.hunter = e.message)
    );
  }

  if (sources.includes('rocketreach')) {
    promises.push(
      enrichPersonFromRocketReach({ firstName, lastName, company })
        .then(r => results.rocketReach = r)
        .catch(e => errors.rocketReach = e.message)
    );
  }

  await Promise.allSettled(promises);

  const enriched = mergePersonData(results);

  enrichmentCache.set(cacheKey, enriched);
  setTimeout(() => enrichmentCache.delete(cacheKey), 24 * 60 * 60 * 1000);

  return {
    ...enriched,
    sources: Object.keys(results),
    errors: Object.keys(errors).length ? errors : null,
    enrichedAt: new Date().toISOString()
  };
}

/**
 * Find email for a person
 */
async function findEmail(options = {}) {
  const { firstName, lastName, company, domain } = options;

  // Try Hunter first
  if (config.hunter.apiKey && (domain || company)) {
    const hunterResult = await hunterFindEmail({ firstName, lastName, company, domain });
    if (hunterResult.email && hunterResult.confidence > 50) {
      return hunterResult;
    }
  }

  // Fall back to Apollo
  if (config.apollo.apiKey) {
    const apolloResult = await apolloFindEmail({ firstName, lastName, company });
    if (apolloResult.email) {
      return { ...apolloResult, source: 'apollo' };
    }
  }

  // Mock fallback
  return {
    email: generateMockEmail(firstName, lastName, company),
    source: 'mock',
    confidence: 30,
    provider: null,
    verified: false
  };
}

/**
 * Verify email
 */
async function verifyEmail(email) {
  // Hunter email verification
  if (config.hunter.apiKey) {
    try {
      const response = await axios.get(
        `${config.hunter.baseUrl}/email-verifier`,
        {
          params: { email },
          headers: { 'Authorization': `Bearer ${config.hunter.apiKey}` }
        }
      );

      const data = response.data.data;
      return {
        email,
        valid: data.result === 'valid',
        score: data.score || 0,
        disposable: data.disposable || false,
        webmail: data.webmail || false,
        mxRecords: data.mx_records || false,
        smtpServer: data.smtp_server || null,
        smtpCheck: data.smtp_check || false
      };
    } catch (error) {
      console.error('Hunter verification error:', error.message);
    }
  }

  // Mock verification
  return {
    email,
    valid: email.includes('@') && email.includes('.'),
    score: 50,
    disposable: false,
    webmail: ['gmail', 'yahoo', 'hotmail', 'outlook'].some(d => email.includes(d)),
    mxRecords: true,
    smtpServer: 'mock-server',
    smtpCheck: true
  };
}

// ============================================
// APOLLO ENRICHMENT
// ============================================

async function enrichFromApollo(domain) {
  if (!config.apollo.apiKey) {
    return generateMockCompany(domain);
  }

  try {
    const response = await axios.get(
      `${config.apollo.baseUrl}/companies/search`,
      {
        params: { domain },
        headers: { 'Authorization': `Bearer ${config.apollo.apiKey}` }
      }
    );

    const company = response.data.organizations?.[0];
    if (!company) return generateMockCompany(domain);

    return {
      name: company.name,
      domain,
      industry: company.industry,
      size: company.employees_range,
      location: company.city,
      country: company.country,
      linkedinUrl: company.linkedin_url,
      logo: company.logo_url,
      description: company.short_description,
      founded: company.founded,
      technologies: company.technologies || [],
      facebookUrl: company.facebook_url,
      twitterUrl: company.twitter_url,
     Crunchbase: company.crunchbase_url
    };
  } catch (error) {
    console.error('Apollo enrichment error:', error.message);
    return generateMockCompany(domain);
  }
}

async function enrichPersonFromApollo(options) {
  const { firstName, lastName, company, domain } = options;

  if (!config.apollo.apiKey) {
    return generateMockPerson(firstName, lastName, company);
  }

  try {
    const response = await axios.get(
      `${config.apollo.baseUrl}/people/search`,
      {
        params: {
          first_name: firstName,
          last_name: lastName,
          ...(company && { organization_name: company }),
          ...(domain && { domain })
        },
        headers: { 'Authorization': `Bearer ${config.apollo.apiKey}` }
      }
    );

    const person = response.data.people?.[0];
    if (!person) return generateMockPerson(firstName, lastName, company);

    return {
      firstName: person.first_name,
      lastName: person.last_name,
      title: person.title,
      company: person.organization_name,
      companyDomain: person.domain,
      linkedinUrl: person.linkedin_url,
      linkedinId: person.linkedin_id,
      email: person.email,
      phone: person.phone_number,
      seniority: person.seniority,
      department: person.department,
      seniority: person.seniority,
      yearsExperience: person.experience,
      education: person.education,
      location: person.location
    };
  } catch (error) {
    console.error('Apollo person enrichment error:', error.message);
    return generateMockPerson(firstName, lastName, company);
  }
}

async function apolloFindEmail(options) {
  const { firstName, lastName, company } = options;

  if (!config.apollo.apiKey) {
    return { email: null, confidence: 0 };
  }

  try {
    const response = await axios.get(
      `${config.apollo.baseUrl}/email-finder`,
      {
        params: {
          first_name: firstName,
          last_name: lastName,
          domain: company?.toLowerCase().replace(/\s+/g, '') + '.com'
        },
        headers: { 'Authorization': `Bearer ${config.apollo.apiKey}` }
      }
    );

    return {
      email: response.data.email,
      confidence: response.data.disposition?.confidence_score || 0,
      source: 'apollo'
    };
  } catch (error) {
    return { email: null, confidence: 0 };
  }
}

// ============================================
// CLEARBIT ENRICHMENT
// ============================================

async function enrichFromClearbit(domain) {
  if (!config.clearbit.apiKey) {
    return generateMockCompany(domain);
  }

  try {
    const response = await axios.get(
      `${config.clearbit.baseUrl}/companies/find?domain=${domain}`,
      {
        headers: { 'Authorization': `Bearer ${config.clearbit.apiKey}` }
      }
    );

    const company = response.data;
    return {
      name: company.name,
      domain,
      industry: company.category?.industry,
      sector: company.category?.sector,
      size: company.metrics?.employeesRange,
      location: company.location,
      country: company.geo?.country,
      linkedinUrl: company.linkedin?.handle,
      logo: company.logo,
      description: company.description,
      founded: company.foundedYear,
      metrics: {
        annualRevenue: company.metrics?.annualRevenue,
        raised: company.metrics?.raised,
        employees: company.metrics?.employees,
        growthRate: company.metrics?.growthRate
      },
      twitter: company.twitter?.handle,
      facebook: company.facebook?.handle,
      github: company.github?.handle
    };
  } catch (error) {
    console.error('Clearbit enrichment error:', error.message);
    return generateMockCompany(domain);
  }
}

async function clearbitReveal(email) {
  if (!config.clearbit.apiKey) {
    return null;
  }

  try {
    const response = await axios.post(
      'https://reveal.clearbit.com/v1/companies/find',
      { email },
      {
        headers: {
          'Authorization': `Bearer ${config.clearbit.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Clearbit reveal error:', error.message);
    return null;
  }
}

// ============================================
// HUNTER ENRICHMENT
// ============================================

async function enrichFromHunter(domain) {
  if (!config.hunter.apiKey) {
    return generateMockCompany(domain);
  }

  try {
    const response = await axios.get(
      `${config.hunter.baseUrl}/domains/search`,
      {
        params: { domain },
        headers: { 'Authorization': `Bearer ${config.hunter.apiKey}` }
      }
    );

    const data = response.data.data;
    return {
      domain,
      organization: data.organization,
      country: data.country,
      twitter: data.twitter,
      facebook: data.facebook,
      linkedin: data.linkedin,
      emails: data.emails?.map(e => ({
        value: e.value,
        type: e.type,
        confidence: e.confidence
      })) || []
    };
  } catch (error) {
    console.error('Hunter enrichment error:', error.message);
    return generateMockCompany(domain);
  }
}

async function enrichPersonFromHunter(options) {
  // Hunter focuses on email finding
  return hunterFindEmail(options);
}

async function hunterFindEmail(options) {
  const { firstName, lastName, company, domain } = options;

  if (!config.hunter.apiKey) {
    return { email: null, confidence: 0 };
  }

  try {
    const response = await axios.get(
      `${config.hunter.baseUrl}/email-finder`,
      {
        params: {
          first_name: firstName,
          last_name: lastName,
          company: company || domain
        },
        headers: { 'Authorization': `Bearer ${config.hunter.apiKey}` }
      }
    );

    const data = response.data.data;
    return {
      email: data.email,
      confidence: data.confidence || 0,
      source: 'hunter',
      type: data.type,
      position: data.position,
      department: data.department
    };
  } catch (error) {
    console.error('Hunter email finder error:', error.message);
    return { email: null, confidence: 0 };
  }
}

async function hunterDomainSearch(domain) {
  if (!config.hunter.apiKey) {
    return { emails: [] };
  }

  try {
    const response = await axios.get(
      `${config.hunter.baseUrl}/domain-search`,
      {
        params: { domain },
        headers: { 'Authorization': `Bearer ${config.hunter.apiKey}` }
      }
    );

    return response.data.data;
  } catch (error) {
    console.error('Hunter domain search error:', error.message);
    return { emails: [] };
  }
}

// ============================================
// ROCKETREACH ENRICHMENT
// ============================================

async function enrichPersonFromRocketReach(options) {
  const { firstName, lastName, company } = options;

  if (!config.rocketReach.apiKey) {
    return generateMockPerson(firstName, lastName, company);
  }

  try {
    const response = await axios.get(
      `${config.rocketReach.baseUrl}/person/search`,
      {
        params: { firstName, lastName, currentCompany: company },
        headers: { 'Authorization': `Bearer ${config.rocketReach.apiKey}` }
      }
    );

    const person = response.data.persons?.[0];
    if (!person) return generateMockPerson(firstName, lastName, company);

    return {
      firstName: person.firstName,
      lastName: person.lastName,
      title: person.title,
      company: person.currentEmployer,
      location: person.location,
      linkedinUrl: person.linkedinUrl,
      email: person.email,
      phone: person.phone,
      salary: person.estimatedSalary,
      workHistory: person.workHistory
    };
  } catch (error) {
    console.error('RocketReach enrichment error:', error.message);
    return generateMockPerson(firstName, lastName, company);
  }
}

// ============================================
// MERGE & UTILITIES
// ============================================

function mergeCompanyData(results) {
  const merged = {
    name: null,
    domain: null,
    industry: null,
    size: null,
    location: null,
    country: null,
    description: null,
    founded: null,
    logo: null,
    linkedinUrl: null,
    twitter: null,
    facebook: null,
    technologies: [],
    metrics: {}
  };

  // Priority: Apollo > Clearbit > Hunter
  if (results.apollo) {
    Object.assign(merged, results.apollo);
  }
  if (results.clearbit) {
    merged.logo = merged.logo || results.clearbit.logo;
    merged.metrics = results.clearbit.metrics || {};
    merged.twitter = merged.twitter || results.clearbit.twitter;
    merged.facebook = merged.facebook || results.clearbit.facebook;
  }
  if (results.hunter) {
    merged.twitter = merged.twitter || results.hunter.twitter;
    merged.facebook = merged.facebook || results.hunter.facebook;
  }

  return merged;
}

function mergePersonData(results) {
  const merged = {
    firstName: null,
    lastName: null,
    title: null,
    company: null,
    companyDomain: null,
    email: null,
    phone: null,
    linkedinUrl: null,
    location: null,
    seniority: null,
    department: null
  };

  if (results.apollo) {
    Object.assign(merged, results.apollo);
  }
  if (results.hunter && !merged.email && results.hunter.email) {
    merged.email = results.hunter.email;
  }
  if (results.rocketReach) {
    merged.location = merged.location || results.rocketReach.location;
    merged.salary = results.rocketReach.salary;
    merged.workHistory = results.rocketReach.workHistory;
  }

  return merged;
}

function generateMockCompany(domain) {
  const name = domain?.split('.')[0]?.replace(/-/g, ' ') || 'Company';
  return {
    name: name.charAt(0).toUpperCase() + name.slice(1),
    domain,
    industry: 'Technology',
    size: '11-50',
    location: 'Mumbai, India',
    country: 'India',
    description: `${name} is a technology company.`,
    founded: 2020,
    logo: `https://logo.clearbit.com/${domain}`,
    linkedinUrl: `https://linkedin.com/company/${name.toLowerCase().replace(/\s/g, '-')}`,
    twitter: null,
    facebook: null,
    technologies: ['React', 'Node.js', 'MongoDB'],
    metrics: {}
  };
}

function generateMockPerson(firstName, lastName, company) {
  return {
    firstName,
    lastName,
    title: 'Marketing Manager',
    company: company || 'Tech Company',
    companyDomain: null,
    email: null,
    phone: null,
    linkedinUrl: `https://linkedin.com/in/${firstName?.toLowerCase()}${lastName?.toLowerCase()}`,
    location: 'Mumbai, India',
    seniority: 'Manager',
    department: 'Marketing'
  };
}

function generateMockEmail(firstName, lastName, company) {
  const domain = company?.toLowerCase().replace(/\s+/g, '') || 'company';
  return `${firstName?.toLowerCase()}.${lastName?.toLowerCase()}@${domain}.com`;
}

/**
 * Bulk enrichment job
 */
function createBulkJob(options = {}) {
  const {
    name,
    type = 'person',
    records = [],
    sources = ['apollo']
  } = options;

  const job = {
    id: uuidv4(),
    name,
    type,
    records: records.map(r => ({
      id: r.id || uuidv4(),
      data: r,
      status: 'pending',
      enrichedAt: null,
      result: null,
      error: null
    })),
    sources,
    status: 'created',
    progress: { processed: 0, total: records.length, failed: 0 },
    createdAt: new Date().toISOString()
  };

  enrichmentJobs.set(job.id, job);
  return job;
}

/**
 * Execute bulk enrichment
 */
async function executeBulkJob(jobId, options = {}) {
  const job = enrichmentJobs.get(jobId);
  if (!job) throw new Error('Job not found');

  job.status = 'running';
  job.startedAt = new Date().toISOString();

  const { concurrency = 5, delay = 1000 } = options;

  for (let i = 0; i < job.records.length; i += concurrency) {
    const batch = job.records.slice(i, i + concurrency);

    await Promise.all(batch.map(async (record) => {
      try {
        let result;
        if (job.type === 'company') {
          result = await enrichCompany(record.data.domain || record.data.website, {
            sources: job.sources
          });
        } else {
          result = await enrichPerson({ ...record.data, sources: job.sources });
        }

        record.status = 'completed';
        record.result = result;
        record.enrichedAt = new Date().toISOString();
      } catch (error) {
        record.status = 'failed';
        record.error = error.message;
        job.progress.failed++;
      }

      job.progress.processed++;
    }));

    // Delay between batches
    if (i + concurrency < job.records.length) {
      await new Promise(r => setTimeout(r, delay));
    }
  }

  job.status = 'completed';
  job.completedAt = new Date().toISOString();

  return job;
}

/**
 * Get job status
 */
function getJobStatus(jobId) {
  return enrichmentJobs.get(jobId);
}

/**
 * Get cache stats
 */
function getCacheStats() {
  return {
    total: enrichmentCache.size,
    companies: Array.from(enrichmentCache.keys()).filter(k => k.startsWith('company:')).length,
    persons: Array.from(enrichmentCache.keys()).filter(k => k.startsWith('person:')).length,
    jobs: {
      total: enrichmentJobs.size,
      running: Array.from(enrichmentJobs.values()).filter(j => j.status === 'running').length,
      completed: Array.from(enrichmentJobs.values()).filter(j => j.status === 'completed').length
    }
  };
}

/**
 * Clear cache
 */
function clearCache(pattern = null) {
  if (!pattern) {
    enrichmentCache.clear();
    return { cleared: true, count: 0 };
  }

  let cleared = 0;
  for (const key of enrichmentCache.keys()) {
    if (key.includes(pattern)) {
      enrichmentCache.delete(key);
      cleared++;
    }
  }

  return { cleared, pattern };
}

module.exports = {
  // Company enrichment
  enrichCompany,
  enrichFromApollo,
  enrichFromClearbit,
  enrichFromHunter,
  clearbitReveal,

  // Person enrichment
  enrichPerson,
  enrichPersonFromApollo,
  enrichPersonFromHunter,
  enrichPersonFromRocketReach,

  // Email operations
  findEmail,
  verifyEmail,
  hunterDomainSearch,

  // Bulk operations
  createBulkJob,
  executeBulkJob,
  getJobStatus,

  // Cache management
  getCacheStats,
  clearCache,
  enrichmentCache
};