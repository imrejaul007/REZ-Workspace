'use client';

import { useState } from 'react';

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 99,
    period: 'per employee/month',
    description: 'Perfect for small teams',
    features: ['Up to 50 employees', 'Core HRMS', 'Basic Attendance', 'Leave Management', 'WhatsApp Bot', 'Email support'],
    popular: false,
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 199,
    period: 'per employee/month',
    description: 'For growing businesses',
    features: ['Up to 500 employees', 'Everything in Starter', 'AI Productivity Score', 'Task Intelligence', 'Field Workforce', 'OKRs', 'Priority support'],
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    period: 'contact sales',
    description: 'For large organizations',
    features: ['Unlimited employees', 'Everything in Professional', 'AI Attrition Prediction', 'OT Intelligence', 'Custom integrations', 'Dedicated CSM', 'SLA guarantee'],
    popular: false,
  },
];

const addons = [
  { name: 'REZ Wallet Integration', price: '₹20/employee' },
  { name: 'Field Workforce GPS', price: '₹30/employee' },
  { name: 'AI Task Intelligence', price: '₹25/employee' },
  { name: 'Custom Branding', price: '₹5,000/month' },
];

export default function PricingPage() {
  const [billing, setBilling] = useState('monthly');

  return (
    <div style={{ padding: 24 }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <h1 style={{ fontSize: 36, fontWeight: 700, marginBottom: 12 }}>Simple, transparent pricing</h1>
        <p style={{ fontSize: 18, color: '#6b7280', marginBottom: 24 }}>Start free for 14 days. No credit card required.</p>
        <div style={{ display: 'inline-flex', gap: 8, background: '#f3f4f6', padding: 4, borderRadius: 8 }}>
          <button onClick={() => setBilling('monthly')} style={{ padding: '8px 24px', borderRadius: 6, border: 'none', cursor: 'pointer', background: billing === 'monthly' ? 'white' : 'transparent', fontWeight: 600, boxShadow: billing === 'monthly' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>Monthly</button>
          <button onClick={() => setBilling('yearly')} style={{ padding: '8px 24px', borderRadius: 6, border: 'none', cursor: 'pointer', background: billing === 'yearly' ? 'white' : 'transparent', fontWeight: 600, boxShadow: billing === 'yearly' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
            Yearly <span style={{ background: '#10b981', color: 'white', padding: '2px 8px', borderRadius: 12, fontSize: 12, marginLeft: 8 }}>Save 20%</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, maxWidth: 1200, margin: '0 auto 48px' }}>
        {plans.map(plan => (
          <div key={plan.id} style={{ background: plan.popular ? 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)' : 'white', padding: 32, borderRadius: 16, position: 'relative', color: plan.popular ? 'white' : '#1f2937', border: plan.popular ? 'none' : '1px solid #e5e7eb' }}>
            {plan.popular && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#ffd700', padding: '4px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>Most Popular</div>}
            <h2 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 8px' }}>{plan.name}</h2>
            <p style={{ fontSize: 14, opacity: 0.8, margin: '0 0 16px' }}>{plan.description}</p>
            <div style={{ marginBottom: 24 }}>
              <span style={{ fontSize: 48, fontWeight: 700 }}>{typeof plan.price === 'number' ? `₹${billing === 'yearly' ? Math.round(plan.price * 0.8) : plan.price}` : plan.price}</span>
              <span style={{ fontSize: 14, opacity: 0.8 }}>/{billing === 'yearly' ? 'mo' : plan.period}</span>
            </div>
            <button style={{ width: '100%', padding: 14, borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, marginBottom: 24, background: plan.popular ? 'white' : '#8b5cf6', color: plan.popular ? '#8b5cf6' : 'white' }}>
              {plan.id === 'enterprise' ? 'Contact Sales' : 'Start Free Trial'}
            </button>
            <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
              {plan.features.map(f => (
                <li key={f} style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>✅</span> {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div style={{ background: '#f9fafb', borderRadius: 16, padding: 32, maxWidth: 1200, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', marginBottom: 24 }}>Add-ons</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {addons.map(addon => (
            <div key={addon.name} style={{ background: 'white', padding: 20, borderRadius: 12, textAlign: 'center' }}>
              <p style={{ fontWeight: 600, margin: '0 0 8px' }}>{addon.name}</p>
              <p style={{ color: '#8b5cf6', fontWeight: 700, margin: 0 }}>{addon.price}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: 48, padding: '48px 0', borderTop: '1px solid #e5e7eb' }}>
        <h2 style={{ fontSize: 24, marginBottom: 16 }}>Enterprise pricing?</h2>
        <p style={{ color: '#6b7280', marginBottom: 24 }}>Custom contracts, SLAs, dedicated support, on-premise options</p>
        <button style={{ padding: '12px 32px', background: '#1f2937', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Talk to Sales</button>
      </div>
    </div>
  );
}
