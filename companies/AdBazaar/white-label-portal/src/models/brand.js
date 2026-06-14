const { v4: uuidv4 } = require('uuid');

// In-memory store for brands
const brands = new Map();

// Initialize with sample brands
const initBrands = () => {
  const sampleBrands = [
    {
      id: 'brand-001',
      name: 'Acme Advertising',
      slug: 'acme-ad',
      logo: 'https://cdn.adbazaar.com/brands/acme/logo.png',
      primaryColor: '#2563eb',
      secondaryColor: '#1e40af',
      accentColor: '#3b82f6',
      fontFamily: 'Inter, sans-serif',
      customDomain: 'dashboard.acme-ad.com',
      footerText: 'Powered by AdBazaar',
      showPoweredBy: true,
      features: {
        analytics: true,
        reporting: true,
        whiteLabel: true,
        customBranding: true
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'brand-002',
      name: 'Global Media Group',
      slug: 'global-media',
      logo: 'https://cdn.adbazaar.com/brands/global-media/logo.png',
      primaryColor: '#059669',
      secondaryColor: '#047857',
      accentColor: '#10b981',
      fontFamily: 'Roboto, sans-serif',
      customDomain: 'reports.globalmedia.com',
      footerText: 'Global Media Analytics',
      showPoweredBy: false,
      features: {
        analytics: true,
        reporting: true,
        whiteLabel: true,
        customBranding: true
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'brand-003',
      name: 'Digital Marketing Pro',
      slug: 'dmp',
      logo: 'https://cdn.adbazaar.com/brands/dmp/logo.png',
      primaryColor: '#dc2626',
      secondaryColor: '#b91c1c',
      accentColor: '#ef4444',
      fontFamily: 'Poppins, sans-serif',
      customDomain: 'portal.digitalmarketingpro.io',
      footerText: 'DMP Analytics Platform',
      showPoweredBy: true,
      features: {
        analytics: true,
        reporting: true,
        whiteLabel: true,
        customBranding: true
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  sampleBrands.forEach(brand => brands.set(brand.id, brand));
};

initBrands();

module.exports = {
  brands,
  createBrand: (brandData) => {
    const id = uuidv4();
    const brand = {
      id,
      name: brandData.name,
      slug: brandData.slug || brandData.name.toLowerCase().replace(/\s+/g, '-'),
      logo: brandData.logo || '',
      primaryColor: brandData.primaryColor || '#2563eb',
      secondaryColor: brandData.secondaryColor || '#1e40af',
      accentColor: brandData.accentColor || '#3b82f6',
      fontFamily: brandData.fontFamily || 'Inter, sans-serif',
      customDomain: brandData.customDomain || '',
      footerText: brandData.footerText || 'Powered by AdBazaar',
      showPoweredBy: brandData.showPoweredBy !== false,
      features: brandData.features || {
        analytics: true,
        reporting: true,
        whiteLabel: true,
        customBranding: true
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    brands.set(id, brand);
    return brand;
  },
  getBrand: (id) => brands.get(id),
  getBrandBySlug: (slug) => {
    for (const brand of brands.values()) {
      if (brand.slug === slug) return brand;
    }
    return null;
  },
  updateBrand: (id, updates) => {
    const brand = brands.get(id);
    if (!brand) return null;
    const updated = {
      ...brand,
      ...updates,
      id,
      updatedAt: new Date().toISOString()
    };
    brands.set(id, updated);
    return updated;
  },
  deleteBrand: (id) => brands.delete(id),
  getAllBrands: () => Array.from(brands.values())
};
