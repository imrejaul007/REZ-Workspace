/**
 * Territory Management
 *
 * Geo-based assignment of prospects to sales reps
 * - Define territories by region, industry, company size
 * - Auto-assign based on rules
 * - Balance workload
 * - Track territory performance
 */

const { v4: uuidv4 } = require('uuid');

// Storage
const territories = new Map();
const assignments = new Map();
const reps = new Map();
const rules = new Map();

/**
 * Create territory
 */
function createTerritory(data) {
  const territory = {
    id: uuidv4(),
    name: data.name,
    description: data.description || '',
    type: data.type || 'geographic', // geographic, industry, company_size, hybrid
    // Geographic config
    regions: data.regions || [],
    cities: data.cities || [],
    states: data.states || [],
    countries: data.countries || ['India'],
    // Industry config
    industries: data.industries || [],
    // Company size config
    companySizes: data.companySizes || [], // e.g., '1-10', '11-50', '51-200', '201-500', '500+'
    // Settings
    settings: {
      autoAssign: data.autoAssign ?? true,
      maxProspects: data.maxProspects || 100,
      roundRobin: data.roundRobin ?? false
    },
    // Stats
    stats: {
      totalProspects: 0,
      assignedProspects: 0,
      conversionRate: 0,
      revenue: 0
    },
    ownerId: data.ownerId || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  territories.set(territory.id, territory);
  return territory;
}

/**
 * Update territory
 */
function updateTerritory(id, updates) {
  const territory = territories.get(id);
  if (!territory) return null;

  const updated = {
    ...territory,
    ...updates,
    id,
    updatedAt: new Date().toISOString()
  };

  territories.set(id, updated);
  return updated;
}

/**
 * Get territory
 */
function getTerritory(id) {
  return territories.get(id) || null;
}

/**
 * List territories
 */
function listTerritories(filters = {}) {
  let results = Array.from(territories.values());

  if (filters.type) {
    results = results.filter(t => t.type === filters.type);
  }
  if (filters.ownerId) {
    results = results.filter(t => t.ownerId === filters.ownerId);
  }

  return results.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Add sales rep
 */
function addRep(data) {
  const rep = {
    id: uuidv4(),
    name: data.name,
    email: data.email,
    role: data.role || 'rep', // rep, manager, sdrm
    territoryIds: data.territoryIds || [],
    settings: {
      maxProspects: data.maxProspects || 100,
      quota: data.quota || 10,
      currentLoad: 0
    },
    stats: {
      assigned: 0,
      contacted: 0,
      qualified: 0,
      converted: 0,
      revenue: 0
    },
    active: true,
    createdAt: new Date().toISOString()
  };

  reps.set(rep.id, rep);

  // Update territory assignments
  for (const territoryId of rep.territoryIds) {
    const territory = territories.get(territoryId);
    if (territory) {
      territory.ownerId = rep.id;
    }
  }

  return rep;
}

/**
 * Update rep
 */
function updateRep(id, updates) {
  const rep = reps.get(id);
  if (!rep) return null;

  const updated = { ...rep, ...updates, id };
  reps.set(id, updated);
  return updated;
}

/**
 * Get rep
 */
function getRep(id) {
  return reps.get(id) || null;
}

/**
 * List reps
 */
function listReps(filters = {}) {
  let results = Array.from(reps.values());

  if (filters.active !== undefined) {
    results = results.filter(r => r.active === filters.active);
  }
  if (filters.territoryId) {
    results = results.filter(r => r.territoryIds.includes(filters.territoryId));
  }

  return results.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Create assignment rule
 */
function createRule(data) {
  const rule = {
    id: uuidv4(),
    name: data.name,
    priority: data.priority || 1, // Lower = higher priority
    conditions: data.conditions || [], // Array of condition objects
    actions: data.actions || [], // Array of action objects
    active: true,
    createdAt: new Date().toISOString()
  };

  rules.set(rule.id, rule);
  return rule;
}

/**
 * Evaluate rules for prospect
 */
function evaluateRules(prospect) {
  const activeRules = Array.from(rules.values())
    .filter(r => r.active)
    .sort((a, b) => a.priority - b.priority);

  for (const rule of activeRules) {
    const matches = evaluateConditions(rule.conditions, prospect);
    if (matches) {
      return { ruleId: rule.id, ruleName: rule.name, actions: rule.actions };
    }
  }

  return null;
}

/**
 * Evaluate conditions
 */
function evaluateConditions(conditions, prospect) {
  if (!conditions.length) return true;

  for (const condition of conditions) {
    const { field, operator, value } = condition;
    const prospectValue = getNestedValue(prospect, field);

    let matches = false;
    switch (operator) {
      case 'equals':
        matches = prospectValue === value;
        break;
      case 'not_equals':
        matches = prospectValue !== value;
        break;
      case 'contains':
        matches = String(prospectValue).toLowerCase().includes(String(value).toLowerCase());
        break;
      case 'in':
        matches = Array.isArray(value) && value.includes(prospectValue);
        break;
      case 'not_in':
        matches = !Array.isArray(value) || !value.includes(prospectValue);
        break;
      case 'greater_than':
        matches = Number(prospectValue) > Number(value);
        break;
      case 'less_than':
        matches = Number(prospectValue) < Number(value);
        break;
      case 'exists':
        matches = prospectValue !== null && prospectValue !== undefined;
        break;
      case 'not_exists':
        matches = prospectValue === null || prospectValue === undefined;
        break;
    }

    if (!matches) return false;
  }

  return true;
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Auto-assign prospect to territory/rep
 */
async function assignProspect(prospectId) {
  const db = require('./prospect-database');
  const prospect = db.get(prospectId);

  if (!prospect) return { success: false, error: 'Prospect not found' };

  // Evaluate rules
  const ruleResult = evaluateRules(prospect);
  let territory = null;
  let rep = null;

  if (ruleResult) {
    // Execute rule actions
    for (const action of ruleResult.actions) {
      if (action.type === 'assign_territory') {
        territory = territories.get(action.territoryId);
      } else if (action.type === 'assign_rep') {
        rep = reps.get(action.repId);
      } else if (action.type === 'add_tag') {
        db.addTag(prospectId, action.tag);
      } else if (action.type === 'update_field') {
        db.update(prospectId, { [action.field]: action.value });
      }
    }
  }

  // If no territory from rules, find by geography
  if (!territory) {
    territory = findTerritoryByLocation(prospect);
  }

  // If no rep from rules, get rep with least load
  if (!rep && territory) {
    rep = findRepWithLeastLoad(territory.id);
  }

  // Create assignment
  if (territory || rep) {
    const assignment = {
      id: uuidv4(),
      prospectId,
      territoryId: territory?.id || null,
      territoryName: territory?.name || null,
      repId: rep?.id || null,
      repName: rep?.name || null,
      assignedAt: new Date().toISOString(),
      reason: ruleResult?.ruleName || 'auto_assignment'
    };

    assignments.set(assignment.id, assignment);

    // Update stats
    if (territory) {
      territory.stats.assignedProspects++;
      territory.stats.totalProspects++;
    }
    if (rep) {
      rep.stats.assigned++;
      rep.settings.currentLoad++;
    }

    // Update prospect with assignment info
    db.update(prospectId, {
      territoryId: territory?.id,
      territoryName: territory?.name,
      owner: rep?.id,
      ownerName: rep?.name
    });

    return { success: true, assignment, territory, rep };
  }

  return { success: false, error: 'No matching territory or rep found' };
}

/**
 * Find territory by prospect location
 */
function findTerritoryByLocation(prospect) {
  const location = prospect.location?.toLowerCase() || '';
  const city = prospect.city?.toLowerCase() || '';
  const state = prospect.state?.toLowerCase() || '';
  const country = prospect.country?.toLowerCase() || 'india';

  for (const territory of territories.values()) {
    // Check country
    if (!territory.countries.map(c => c.toLowerCase()).includes(country)) {
      continue;
    }

    // Check cities
    if (territory.cities.length && !territory.cities.some(c => location.includes(c.toLowerCase()) || city.includes(c.toLowerCase()))) {
      continue;
    }

    // Check states
    if (territory.states.length && !territory.states.some(s => state.includes(s.toLowerCase()))) {
      continue;
    }

    // Check capacity
    if (territory.settings.maxProspects && territory.stats.assignedProspects >= territory.settings.maxProspects) {
      continue;
    }

    return territory;
  }

  return null;
}

/**
 * Find rep with least load in territory
 */
function findRepWithLeastLoad(territoryId) {
  const eligibleReps = Array.from(reps.values())
    .filter(r => r.active && r.territoryIds.includes(territoryId))
    .filter(r => r.settings.currentLoad < r.settings.maxProspects);

  if (!eligibleReps.length) return null;

  // Round robin or least load
  return eligibleReps.reduce((best, rep) =>
    rep.settings.currentLoad < best.settings.currentLoad ? rep : best
  );
}

/**
 * Reassign prospects (e.g., when rep leaves)
 */
function reassignProspects(fromRepId, toRepId) {
  const fromRep = reps.get(fromRepId);
  const toRep = reps.get(toRepId);

  if (!fromRep || !toRep) return { success: false, error: 'Rep not found' };

  let reassigned = 0;

  for (const [id, assignment] of assignments.entries()) {
    if (assignment.repId === fromRepId) {
      assignment.repId = toRepId;
      assignment.repName = toRep.name;
      assignment.reassignedAt = new Date().toISOString();
      reassigned++;
    }
  }

  // Update stats
  toRep.settings.currentLoad += reassigned;
  fromRep.settings.currentLoad = 0;

  return { success: true, reassigned };
}

/**
 * Get territory analytics
 */
function getTerritoryAnalytics(territoryId) {
  const territory = territories.get(territoryId);
  if (!territory) return null;

  // Get all assignments for this territory
  const territoryAssignments = Array.from(assignments.values())
    .filter(a => a.territoryId === territoryId);

  // Get prospect stats
  const db = require('./prospect-database');
  const prospects = territoryAssignments
    .map(a => db.get(a.prospectId))
    .filter(Boolean);

  const byStatus = {};
  const byStage = {};

  for (const p of prospects) {
    byStatus[p.status] = (byStatus[p.status] || 0) + 1;
    byStage[p.stage] = (byStage[p.stage] || 0) + 1;
  }

  // Get rep performance
  const repPerformance = [];
  for (const repId of [...new Set(territoryAssignments.map(a => a.repId).filter(Boolean))]) {
    const rep = reps.get(repId);
    const repAssignments = territoryAssignments.filter(a => a.repId === repId);
    repPerformance.push({
      repId,
      name: rep?.name,
      assigned: repAssignments.length,
      conversionRate: repAssignments.length ?
        ((rep?.stats.converted || 0) / repAssignments.length * 100).toFixed(1) + '%' : '0%'
    });
  }

  return {
    territory: {
      id: territory.id,
      name: territory.name,
      type: territory.type
    },
    stats: territory.stats,
    prospects: {
      total: prospects.length,
      byStatus,
      byStage
    },
    reps: repPerformance,
    recentAssignments: territoryAssignments.slice(-10)
  };
}

/**
 * Get rep analytics
 */
function getRepAnalytics(repId) {
  const rep = reps.get(repId);
  if (!rep) return null;

  const repAssignments = Array.from(assignments.values())
    .filter(a => a.repId === repId);

  const db = require('./prospect-database');
  const prospects = repAssignments
    .map(a => db.get(a.prospectId))
    .filter(Boolean);

  return {
    rep: {
      id: rep.id,
      name: rep.name,
      email: rep.email,
      role: rep.role
    },
    workload: {
      current: rep.settings.currentLoad,
      max: rep.settings.maxProspects,
      utilization: ((rep.settings.currentLoad / rep.settings.maxProspects) * 100).toFixed(1) + '%'
    },
    performance: rep.stats,
    territories: rep.territoryIds.map(id => territories.get(id)?.name).filter(Boolean),
    recentAssignments: repAssignments.slice(-10).map(a => ({
      prospectId: a.prospectId,
      prospectName: db.get(a.prospectId)?.fullName,
      assignedAt: a.assignedAt
    }))
  };
}

/**
 * Balance territories
 */
function balanceTerritories() {
  const results = [];

  for (const territory of territories.values()) {
    const reps = listReps({ territoryId: territory.id, active: true });
    const totalProspects = territory.stats.totalProspects;
    const idealPerRep = Math.ceil(totalProspects / reps.length);

    for (const rep of reps) {
      const diff = rep.settings.currentLoad - idealPerRep;
      if (Math.abs(diff) > 5) {
        results.push({
          territoryId: territory.id,
          territoryName: territory.name,
          repId: rep.id,
          repName: rep.name,
          currentLoad: rep.settings.currentLoad,
          idealLoad: idealPerRep,
          recommendation: diff > 0 ? 'unload' : 'load_more'
        });
      }
    }
  }

  return results;
}

/**
 * Delete territory
 */
function deleteTerritory(id) {
  const territory = territories.get(id);
  if (!territory) return false;

  // Unassign all prospects
  for (const [assignmentId, assignment] of assignments.entries()) {
    if (assignment.territoryId === id) {
      assignment.territoryId = null;
      assignment.territoryName = null;
    }
  }

  territories.delete(id);
  return true;
}

module.exports = {
  // Territory CRUD
  createTerritory,
  updateTerritory,
  getTerritory,
  listTerritories,
  deleteTerritory,

  // Rep CRUD
  addRep,
  updateRep,
  getRep,
  listReps,

  // Rules
  createRule,
  evaluateRules,

  // Assignment
  assignProspect,
  reassignProspects,

  // Analytics
  getTerritoryAnalytics,
  getRepAnalytics,
  balanceTerritories,

  // Storage
  territories,
  assignments,
  reps,
  rules
};