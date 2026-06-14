/**
 * REZ Unified Merchant Dashboard - Main Page
 */

'use client';

import React, { useState, useEffect } from 'react';

// Types
interface DashboardData {
  profile: {
    merchantId: string;
    businessName: string;
    industry: string;
    tier: string;
  };
  overview: {
    revenue: number;
    orders: number;
    customers: number;
    rating: number;
  };
  financial: {
    balance: number;
    pendingPayments: number;
    totalRevenue: number;
  };
  loyalty: {
    members: number;
    pointsIssued: number;
    pointsRedeemed: number;
  };
  trust: {
    score: number;
    tier: string;
    status: string;
  };
  orders: unknown[];
  lowStock: unknown[];
  suppliers: unknown[];
  campaigns: unknown[];
}

// API Configuration
const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:4080';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      setLoading(true);

      // Fetch from unified gateway
      const response = await fetch(`${GATEWAY_URL}/api/v1/dashboard`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '24px' }}>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'red' }}>
        Error: {error}
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#1a1a2e',
        color: 'white',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px' }}>REZ Merchant Dashboard</h1>
          <p style={{ margin: 0, fontSize: '14px', opacity: 0.8 }}>
            {data?.profile?.businessName || 'Merchant'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <span style={{
            backgroundColor: data?.trust?.tier === 'high' ? '#22c55e' : '#eab308',
            padding: '4px 12px',
            borderRadius: '16px',
            fontSize: '12px'
          }}>
            Trust: {data?.trust?.score || 0}/100
          </span>
          <span style={{
            backgroundColor: '#3b82f6',
            padding: '4px 12px',
            borderRadius: '16px',
            fontSize: '12px',
            textTransform: 'capitalize'
          }}>
            {data?.profile?.tier || 'basic'}
          </span>
        </div>
      </header>

      <main style={{ padding: '24px' }}>
        {/* Overview Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <StatCard
            title="Revenue"
            value={`₹${(data?.financial?.totalRevenue || 0).toLocaleString()}`}
            subtitle="Total"
            color="#22c55e"
          />
          <StatCard
            title="Orders"
            value={(data?.overview?.orders || 0).toString()}
            subtitle="This month"
            color="#3b82f6"
          />
          <StatCard
            title="Customers"
            value={(data?.overview?.customers || 0).toString()}
            subtitle="Active"
            color="#8b5cf6"
          />
          <StatCard
            title="Balance"
            value={`₹${(data?.financial?.balance || 0).toLocaleString()}`}
            subtitle="Available"
            color="#f59e0b"
          />
        </div>

        {/* Two Column Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Recent Orders */}
            <Card title="Recent Orders">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e5e5e5' }}>
                    <th style={{ textAlign: 'left', padding: '12px 8px', color: '#666' }}>Order ID</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', color: '#666' }}>Customer</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', color: '#666' }}>Amount</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', color: '#666' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.orders || []).slice(0, 5).map((order) => (
                    <tr key={order.orderId} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '12px 8px' }}>{order.orderId?.slice(0, 8)}</td>
                      <td style={{ padding: '12px 8px' }}>{order.customerName || 'Customer'}</td>
                      <td style={{ padding: '12px 8px' }}>₹{order.amount?.toLocaleString()}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{
                          backgroundColor: order.status === 'completed' ? '#dcfce7' : '#fef3c7',
                          color: order.status === 'completed' ? '#166534' : '#92400e',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '12px'
                        }}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            {/* Marketing Campaigns */}
            <Card title="Active Campaigns">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(data?.campaigns || []).map((campaign) => (
                  <div key={campaign.id} style={{
                    padding: '12px',
                    backgroundColor: '#f9f9f9',
                    borderRadius: '8px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 500 }}>{campaign.name}</span>
                      <span style={{ color: '#666' }}>{campaign.status}</span>
                    </div>
                    <div style={{ height: '4px', backgroundColor: '#e5e5e5', borderRadius: '2px' }}>
                      <div style={{
                        width: `${campaign.reach || 0}%`,
                        height: '100%',
                        backgroundColor: '#3b82f6',
                        borderRadius: '2px'
                      }} />
                    </div>
                  </div>
                ))}
                {(!data?.campaigns || data.campaigns.length === 0) && (
                  <p style={{ color: '#666', textAlign: 'center' }}>No active campaigns</p>
                )}
              </div>
            </Card>
          </div>

          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Loyalty */}
            <Card title="Loyalty Program">
              <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
                    {data?.loyalty?.members || 0}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Members</div>
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#22c55e' }}>
                    {((data?.loyalty?.pointsIssued || 0) / 1000).toFixed(1)}K
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Points Issued</div>
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
                    {((data?.loyalty?.pointsRedeemed || 0) / 1000).toFixed(1)}K
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Redeemed</div>
                </div>
              </div>
            </Card>

            {/* Low Stock Alerts */}
            <Card title="Low Stock Alert">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(data?.lowStock || []).slice(0, 5).map((item) => (
                  <div key={item.sku} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px',
                    backgroundColor: '#fef2f2',
                    borderRadius: '4px'
                  }}>
                    <span>{item.name}</span>
                    <span style={{ color: '#dc2626', fontWeight: 500 }}>{item.stock} left</span>
                  </div>
                ))}
                {(!data?.lowStock || data.lowStock.length === 0) && (
                  <p style={{ color: '#666', textAlign: 'center' }}>All stocked up!</p>
                )}
              </div>
            </Card>

            {/* B2B Suppliers */}
            <Card title="Top Suppliers">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(data?.suppliers || []).slice(0, 5).map((supplier) => (
                  <div key={supplier.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px',
                    backgroundColor: '#f9f9f9',
                    borderRadius: '4px'
                  }}>
                    <span>{supplier.name}</span>
                    <span style={{ color: '#666' }}>₹{supplier.pending?.toLocaleString() || 0}</span>
                  </div>
                ))}
                {(!data?.suppliers || data.suppliers.length === 0) && (
                  <p style={{ color: '#666', textAlign: 'center' }}>No suppliers</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

// Components
function StatCard({ title, value, subtitle, color }: {
  title: string;
  value: string;
  subtitle: string;
  color: string;
}) {
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>{title}</div>
      <div style={{ fontSize: '28px', fontWeight: 'bold', color }}>{value}</div>
      <div style={{ fontSize: '12px', color: '#666' }}>{subtitle}</div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>{title}</h3>
      {children}
    </div>
  );
}
