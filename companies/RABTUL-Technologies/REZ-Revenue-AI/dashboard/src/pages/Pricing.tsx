import { useState } from 'react';
import { Percent, TrendingUp, Clock, Calendar, MapPin } from 'lucide-react';

const services = [
  { id: 1, name: 'Haircut', basePrice: 500, category: 'basic' },
  { id: 2, name: 'Hair Coloring', basePrice: 2500, category: 'premium' },
  { id: 3, name: 'Hair Wash', basePrice: 200, category: 'basic' },
  { id: 4, name: 'Hair Treatment', basePrice: 1500, category: 'premium' },
  { id: 5, name: 'Manicure', basePrice: 400, category: 'basic' },
  { id: 6, name: 'Facial', basePrice: 1200, category: 'premium' },
];

const mockPricing = {
  1: { price: 650, factors: ['Peak hour (7PM)', 'Friday surge', 'Low slots'] },
  2: { price: 2800, factors: ['Weekend boost', 'Premium positioning'] },
  3: { price: 150, factors: ['Afternoon discount', 'Off-peak'] },
  4: { price: 1650, factors: ['Friday evening', 'High demand'] },
  5: { price: 380, factors: ['Normal pricing'] },
  6: { price: 1100, factors: ['Off-peak discount', 'Tuesday promotion'] },
};

export default function Pricing() {
  const [selectedService, setSelectedService] = useState(services[0]);
  const [currentTime, setCurrentTime] = useState('Friday 7:00 PM');

  return (
    <div>
      <div className="header">
        <div>
          <h2>Dynamic Pricing</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            AI-powered price optimization
          </p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline">
            <Calendar size={18} />
            {currentTime}
          </button>
          <button className="btn btn-primary">
            <Percent size={18} />
            Enable Dynamic Pricing
          </button>
        </div>
      </div>

      {/* Current Time Context */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', background: 'rgba(99, 102, 241, 0.2)', borderRadius: '0.5rem' }}>
              <Clock size={24} style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Time Context</div>
              <div style={{ fontWeight: 600 }}>Friday 7:00 PM</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', background: 'rgba(34, 197, 94, 0.2)', borderRadius: '0.5rem' }}>
              <TrendingUp size={24} style={{ color: 'var(--success)' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Demand Level</div>
              <div style={{ fontWeight: 600 }}>78/100 (High)</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', background: 'rgba(245, 158, 11, 0.2)', borderRadius: '0.5rem' }}>
              <MapPin size={24} style={{ color: 'var(--warning)' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Slots Remaining</div>
              <div style={{ fontWeight: 600 }}>2 of 8</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', background: 'rgba(99, 102, 241, 0.2)', borderRadius: '0.5rem' }}>
              <Percent size={24} style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Current Surge</div>
              <div style={{ fontWeight: 600, color: 'var(--success)' }}>+30%</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Service List */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Services & Pricing</span>
          </div>
          <div className="pricing-preview">
            {services.map((service) => {
              const pricing = mockPricing[service.id as keyof typeof mockPricing];
              const adjustment = ((pricing.price - service.basePrice) / service.basePrice) * 100;
              const isSurge = adjustment > 0;

              return (
                <div
                  key={service.id}
                  className="pricing-item"
                  style={{
                    cursor: 'pointer',
                    border: selectedService.id === service.id ? '2px solid var(--primary)' : 'none',
                  }}
                  onClick={() => setSelectedService(service)}
                >
                  <div className="pricing-item-info">
                    <div className="pricing-item-name">{service.name}</div>
                    <div className="pricing-item-base">Base: ₹{service.basePrice}</div>
                  </div>
                  <div className="pricing-item-dynamic">
                    <div className="pricing-dynamic-value" style={{ color: isSurge ? 'var(--success)' : 'var(--warning)' }}>
                      ₹{pricing.price}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: isSurge ? 'var(--success)' : 'var(--warning)' }}>
                      {isSurge ? '+' : ''}{adjustment.toFixed(0)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Service Details */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Price Factors: {selectedService.name}</span>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Base Price</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>₹{selectedService.basePrice}</div>
              </div>
              <div style={{ fontSize: '2rem', color: 'var(--text-secondary)' }}>→</div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Dynamic Price</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--success)' }}>
                  ₹{mockPricing[selectedService.id as keyof typeof mockPricing].price}
                </div>
              </div>
            </div>

            <div style={{ padding: '1rem', background: 'var(--bg-dark)', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--success)', fontWeight: 600, marginBottom: '0.5rem' }}>
                Active Price Factors
              </div>
              {mockPricing[selectedService.id as keyof typeof mockPricing].factors.map((factor, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0', fontSize: '0.875rem' }}>
                  <div style={{ width: '6px', height: '6px', background: 'var(--success)', borderRadius: '50%' }} />
                  {factor}
                </div>
              ))}
            </div>
          </div>

          <div className="card-header" style={{ marginTop: '1rem' }}>
            <span className="card-title">Alternative Pricing</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '0.5rem)' }}>
              <span>Book tomorrow 2PM</span>
              <span style={{ color: 'var(--success)' }}>₹{Math.round(selectedService.basePrice * 0.85)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '0.5rem)' }}>
              <span>Bundle with wash</span>
              <span style={{ color: 'var(--success)' }}>₹{Math.round((selectedService.basePrice + 200) * 0.9)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '0.5rem)' }}>
              <span>Weekday morning</span>
              <span style={{ color: 'var(--success)' }}>₹{Math.round(selectedService.basePrice * 0.75)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
