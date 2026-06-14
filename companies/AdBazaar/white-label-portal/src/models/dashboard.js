const { v4: uuidv4 } = require('uuid');

// In-memory store for dashboards
const dashboards = new Map();

// Initialize with sample dashboards
const initDashboards = () => {
  const sampleDashboards = [
    {
      id: 'dash-001',
      brandId: 'brand-001',
      name: 'Campaign Overview',
      type: 'campaign',
      layout: 'grid',
      widgets: [
        { id: 'w1', type: 'chart', title: 'Impressions', chartType: 'line' },
        { id: 'w2', type: 'metric', title: 'Total Spend', format: 'currency' },
        { id: 'w3', type: 'table', title: 'Top Campaigns' },
        { id: 'w4', type: 'chart', title: 'CTR Trend', chartType: 'area' }
      ],
      isDefault: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'dash-002',
      brandId: 'brand-001',
      name: 'Performance Analytics',
      type: 'performance',
      layout: 'dashboard',
      widgets: [
        { id: 'w1', type: 'metric', title: 'ROAS', format: 'ratio' },
        { id: 'w2', type: 'metric', title: 'Conversion Rate', format: 'percent' },
        { id: 'w3', type: 'chart', title: 'Conversion Funnel', chartType: 'funnel' },
        { id: 'w4', type: 'map', title: 'Geographic Performance' }
      ],
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'dash-003',
      brandId: 'brand-002',
      name: 'Media Overview',
      type: 'media',
      layout: 'grid',
      widgets: [
        { id: 'w1', type: 'chart', title: 'Reach', chartType: 'bar' },
        { id: 'w2', type: 'metric', title: 'Frequency', format: 'number' },
        { id: 'w3', type: 'chart', title: 'Audience Mix', chartType: 'pie' }
      ],
      isDefault: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  sampleDashboards.forEach(dash => dashboards.set(dash.id, dash));
};

initDashboards();

module.exports = {
  dashboards,
  createDashboard: (dashboardData) => {
    const id = uuidv4();
    const dashboard = {
      id,
      brandId: dashboardData.brandId,
      name: dashboardData.name,
      type: dashboardData.type || 'custom',
      layout: dashboardData.layout || 'grid',
      widgets: dashboardData.widgets || [],
      isDefault: dashboardData.isDefault || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    dashboards.set(id, dashboard);
    return dashboard;
  },
  getDashboard: (id) => dashboards.get(id),
  getDashboardsByBrand: (brandId) => {
    return Array.from(dashboards.values()).filter(d => d.brandId === brandId);
  },
  updateDashboard: (id, updates) => {
    const dashboard = dashboards.get(id);
    if (!dashboard) return null;
    const updated = {
      ...dashboard,
      ...updates,
      id,
      updatedAt: new Date().toISOString()
    };
    dashboards.set(id, updated);
    return updated;
  },
  deleteDashboard: (id) => dashboards.delete(id),
  getAllDashboards: () => Array.from(dashboards.values())
};
