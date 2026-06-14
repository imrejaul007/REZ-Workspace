const { v4: uuidv4 } = require('uuid');

// In-memory store for clients
const clients = new Map();

// Initialize with sample clients
const initClients = () => {
  const sampleClients = [
    {
      id: 'client-001',
      brandId: 'brand-001',
      name: 'TechCorp Industries',
      slug: 'techcorp',
      logo: 'https://cdn.adbazaar.com/clients/techcorp/logo.png',
      contactEmail: 'marketing@techcorp.com',
      contactName: 'John Smith',
      industry: 'Technology',
      dashboards: ['dash-001'],
      reports: ['report-001'],
      settings: {
        defaultPeriod: '30d',
        showBenchmarks: true,
        exportFormat: 'pdf'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'client-002',
      brandId: 'brand-001',
      name: 'RetailMax Stores',
      slug: 'retailmax',
      logo: 'https://cdn.adbazaar.com/clients/retailmax/logo.png',
      contactEmail: 'ads@retailmax.com',
      contactName: 'Sarah Johnson',
      industry: 'Retail',
      dashboards: ['dash-001', 'dash-002'],
      reports: ['report-002'],
      settings: {
        defaultPeriod: '7d',
        showBenchmarks: true,
        exportFormat: 'xlsx'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'client-003',
      brandId: 'brand-002',
      name: 'MediaMax Broadcasting',
      slug: 'mediamax',
      logo: 'https://cdn.adbazaar.com/clients/mediamax/logo.png',
      contactEmail: 'digital@mediamax.com',
      contactName: 'Mike Chen',
      industry: 'Media',
      dashboards: ['dash-003'],
      reports: ['report-003'],
      settings: {
        defaultPeriod: '90d',
        showBenchmarks: false,
        exportFormat: 'pdf'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  sampleClients.forEach(client => clients.set(client.id, client));
};

initClients();

module.exports = {
  clients,
  createClient: (clientData) => {
    const id = uuidv4();
    const client = {
      id,
      brandId: clientData.brandId,
      name: clientData.name,
      slug: clientData.slug || clientData.name.toLowerCase().replace(/\s+/g, '-'),
      logo: clientData.logo || '',
      contactEmail: clientData.contactEmail || '',
      contactName: clientData.contactName || '',
      industry: clientData.industry || '',
      dashboards: clientData.dashboards || [],
      reports: clientData.reports || [],
      settings: clientData.settings || {
        defaultPeriod: '30d',
        showBenchmarks: true,
        exportFormat: 'pdf'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    clients.set(id, client);
    return client;
  },
  getClient: (id) => clients.get(id),
  getClientBySlug: (slug) => {
    for (const client of clients.values()) {
      if (client.slug === slug) return client;
    }
    return null;
  },
  getClientsByBrand: (brandId) => {
    return Array.from(clients.values()).filter(c => c.brandId === brandId);
  },
  updateClient: (id, updates) => {
    const client = clients.get(id);
    if (!client) return null;
    const updated = {
      ...client,
      ...updates,
      id,
      updatedAt: new Date().toISOString()
    };
    clients.set(id, updated);
    return updated;
  },
  deleteClient: (id) => clients.delete(id),
  getAllClients: () => Array.from(clients.values())
};
