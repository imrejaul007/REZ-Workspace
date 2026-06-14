'use client';

import { useState } from 'react';
import styles from './page.module.css';

// Mock data
const mockClients = [
  { id: '1', clientId: 'CLIENT-00001', companyName: 'TechCorp India', industry: 'Technology', email: 'contact@techcorp.in', phone: '+91 98765 43210', status: 'active', dealValue: 4500000, source: 'referral' },
  { id: '2', clientId: 'CLIENT-00002', companyName: 'DataSoft Solutions', industry: 'IT Services', email: 'info@datasoft.com', phone: '+91 87654 32109', status: 'active', dealValue: 3200000, source: 'website' },
  { id: '3', clientId: 'CLIENT-00003', companyName: 'FinSecure Ltd', industry: 'Finance', email: 'hello@finsecure.co', phone: '+91 76543 21098', status: 'prospect', dealValue: 2800000, source: 'linkedin' },
  { id: '4', clientId: 'CLIENT-00004', companyName: 'CloudBase Inc', industry: 'Cloud Services', email: 'sales@cloudbase.io', phone: '+91 65432 10987', status: 'active', dealValue: 2100000, source: 'event' },
  { id: '5', clientId: 'CLIENT-00005', companyName: 'HealthFirst Hospitals', industry: 'Healthcare', email: 'admin@healthfirst.in', phone: '+91 54321 09876', status: 'active', dealValue: 1800000, source: 'cold_call' },
  { id: '6', clientId: 'CLIENT-00006', companyName: 'RetailMax Corp', industry: 'Retail', email: 'partners@retailmax.com', phone: '+91 43210 98765', status: 'inactive', dealValue: 0, source: 'referral' },
];

const formatCurrency = (value: number): string => {
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  return `₹${value.toLocaleString('en-IN')}`;
};

const statusColors: Record<string, string> = {
  active: '#10b981',
  prospect: '#f59e0b',
  inactive: '#6b7280',
  churned: '#ef4444',
};

export default function ClientsPage() {
  const [clients, setClients] = useState(mockClients);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredClients = clients.filter((client) => {
    const matchesSearch = client.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Clients</h1>
          <p className={styles.subtitle}>Manage your business clients</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          + Add Client
        </button>
      </header>

      {/* Filters */}
      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Search clients..."
          className={styles.searchInput}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className={styles.filterSelect}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="prospect">Prospect</option>
          <option value="inactive">Inactive</option>
          <option value="churned">Churned</option>
        </select>
      </div>

      {/* Client List */}
      <div className={styles.clientList}>
        <div className={styles.tableHeader}>
          <span>Company</span>
          <span>Industry</span>
          <span>Contact</span>
          <span>Status</span>
          <span>Deal Value</span>
          <span>Source</span>
          <span>Actions</span>
        </div>
        {filteredClients.map((client) => (
          <div key={client.id} className={styles.tableRow}>
            <div className={styles.companyCell}>
              <div className={styles.avatar}>
                {client.companyName.charAt(0)}
              </div>
              <div>
                <div className={styles.companyName}>{client.companyName}</div>
                <div className={styles.clientId}>{client.clientId}</div>
              </div>
            </div>
            <span className={styles.industry}>{client.industry}</span>
            <div className={styles.contactCell}>
              <div>{client.email}</div>
              <div className={styles.phone}>{client.phone}</div>
            </div>
            <span
              className={styles.statusBadge}
              style={{ backgroundColor: `${statusColors[client.status]}20`, color: statusColors[client.status] }}
            >
              {client.status}
            </span>
            <span className={styles.dealValue}>{formatCurrency(client.dealValue)}</span>
            <span className={styles.source}>{client.source.replace('_', ' ')}</span>
            <div className={styles.actions}>
              <button className={styles.actionBtn} title="View">👁️</button>
              <button className={styles.actionBtn} title="Edit">✏️</button>
              <button className={styles.actionBtn} title="Add Deal">💼</button>
            </div>
          </div>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <div className={styles.emptyState}>
          <p>No clients found matching your criteria</p>
        </div>
      )}
    </div>
  );
}
