import { Gift, Plus, TrendingUp, Target } from 'lucide-react';

const activeOffers = [
  {
    id: 1,
    name: 'Weekend Hair Special',
    type: 'Bundle',
    value: '20% off',
    status: 'active',
    conversions: 45,
    revenue: '₹12,500',
    roi: '3.2x',
  },
  {
    id: 2,
    name: 'New Customer Welcome',
    type: 'Percentage',
    value: '15% off',
    status: 'active',
    conversions: 28,
    revenue: '₹8,200',
    roi: '2.8x',
  },
  {
    id: 3,
    name: 'Buy 2 Get 1',
    type: 'Bundle',
    value: 'Free item',
    status: 'paused',
    conversions: 62,
    revenue: '₹18,400',
    roi: '4.1x',
  },
];

const offerTemplates = [
  { name: 'Percentage Discount', icon: '%', description: '5-30% off orders' },
  { name: 'Fixed Discount', icon: '₹', description: '₹50-500 off' },
  { name: 'Buy X Get Y', icon: 'G', description: 'Spend X get Y free' },
  { name: 'Bundle Deal', icon: 'B', description: 'Buy together save' },
  { name: 'Cashback', icon: 'C', description: 'Earn on purchase' },
  { name: 'Free Upgrade', icon: 'U', description: 'Premium upgrade' },
];

const aiRecommendations = [
  {
    title: 'Create off-peak promotion',
    description: '3PM on weekdays have 35% unused capacity. A 20% discount could fill 15 more slots.',
    expectedLift: '+18%',
    confidence: '85%',
  },
  {
    title: 'Bundle hair treatment with cut',
    description: 'Customers who get cuts often skip treatments. Bundle at ₹200 off could increase AOV.',
    expectedLift: '+₹180 avg',
    confidence: '78%',
  },
  {
    title: 'Dormant customer reactivation',
    description: '38 customers haven\'t visited in 45+ days. A special 25% comeback offer could bring 8 back.',
    expectedLift: '+₹24,000',
    confidence: '72%',
  },
];

export default function Offers() {
  return (
    <div>
      <div className="header">
        <div>
          <h2>Offer Optimizer</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            AI-generated offers that maximize conversion
          </p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary">
            <Plus size={18} />
            Create New Offer
          </button>
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="card" style={{ marginBottom: '2rem', borderColor: 'var(--primary)' }}>
        <div className="card-header">
          <span className="card-title">
            <Target size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
            AI Recommendations
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {aiRecommendations.map((rec, index) => (
            <div key={index} style={{ padding: '1rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '0.5rem' }}>
              <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{rec.title}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>{rec.description}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge badge-success">{rec.expectedLift}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Confidence: {rec.confidence}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Offer Templates */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Quick Create</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '1rem' }}>
          {offerTemplates.map((template, index) => (
            <div key={index} style={{ padding: '1rem', background: 'var(--bg-card)', borderRadius: '0.5rem', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }} className="pricing-item">
              <div style={{ width: '48px', height: '48px', background: 'rgba(99, 102, 241, 0.2)', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem', fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>
                {template.icon}
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{template.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{template.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Offers */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Active Offers</span>
          <span className="badge badge-success">{activeOffers.filter(o => o.status === 'active').length} active</span>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Offer</th>
              <th>Type</th>
              <th>Value</th>
              <th>Conversions</th>
              <th>Revenue</th>
              <th>ROI</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {activeOffers.map((offer) => (
              <tr key={offer.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Gift size={18} style={{ color: 'var(--primary)' }} />
                    <span style={{ fontWeight: 600 }}>{offer.name}</span>
                  </div>
                </td>
                <td><span className="badge badge-warning">{offer.type}</span></td>
                <td style={{ fontWeight: 600, color: 'var(--success)' }}>{offer.value}</td>
                <td>{offer.conversions}</td>
                <td>{offer.revenue}</td>
                <td>
                  <span style={{ color: 'var(--success)', fontWeight: 600 }}>{offer.roi}</span>
                  <TrendingUp size={14} style={{ marginLeft: '0.25rem', color: 'var(--success)' }} />
                </td>
                <td>
                  <span className={`badge badge-${offer.status === 'active' ? 'success' : 'warning'}`}>
                    {offer.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
