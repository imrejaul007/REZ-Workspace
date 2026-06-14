'use client';

import { useState } from 'react';
import styles from './page.module.css';

// Mock data
const mockInvoices = [
  { id: '1', invoiceNumber: 'INV-202605-0001', clientName: 'TechCorp India', total: 250000, status: 'sent', dueDate: '2026-06-15', items: [{ description: 'Enterprise License', quantity: 1, unitPrice: 250000 }] },
  { id: '2', invoiceNumber: 'INV-202605-0002', clientName: 'DataSoft Solutions', total: 180000, status: 'paid', dueDate: '2026-05-30', paidDate: '2026-05-28', items: [{ description: 'Cloud Migration Services', quantity: 1, unitPrice: 180000 }] },
  { id: '3', invoiceNumber: 'INV-202605-0003', clientName: 'FinSecure Ltd', total: 95000, status: 'overdue', dueDate: '2026-05-20', items: [{ description: 'Security Audit', quantity: 1, unitPrice: 95000 }] },
  { id: '4', invoiceNumber: 'INV-202605-0004', clientName: 'CloudBase Inc', total: 120000, status: 'draft', dueDate: '2026-06-30', items: [{ description: 'SaaS Implementation', quantity: 1, unitPrice: 120000 }] },
  { id: '5', invoiceNumber: 'INV-202605-0005', clientName: 'RetailMax Corp', total: 80000, status: 'sent', dueDate: '2026-06-25', items: [{ description: 'Analytics Platform', quantity: 1, unitPrice: 80000 }] },
  { id: '6', invoiceNumber: 'INV-202605-0006', clientName: 'HealthFirst Hospitals', total: 65000, status: 'viewed', dueDate: '2026-06-10', items: [{ description: 'CRM Integration', quantity: 1, unitPrice: 65000 }] },
];

const statusColors: Record<string, { bg: string; text: string }> = {
  draft: { bg: '#f3f4f6', text: '#6b7280' },
  sent: { bg: '#dbeafe', text: '#1d4ed8' },
  viewed: { bg: '#fef3c7', text: '#b45309' },
  paid: { bg: '#d1fae5', text: '#047857' },
  overdue: { bg: '#fee2e2', text: '#dc2626' },
  cancelled: { bg: '#f3f4f6', text: '#9ca3af' },
};

const formatCurrency = (value: number): string => {
  return `₹${value.toLocaleString('en-IN')}`;
};

export default function InvoicesPage() {
  const [invoices] = useState(mockInvoices);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch = inv.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: invoices.reduce((sum, inv) => sum + inv.total, 0),
    paid: invoices.filter((inv) => inv.status === 'paid').reduce((sum, inv) => sum + inv.total, 0),
    pending: invoices.filter((inv) => ['sent', 'viewed'].includes(inv.status)).reduce((sum, inv) => sum + inv.total, 0),
    overdue: invoices.filter((inv) => inv.status === 'overdue').reduce((sum, inv) => sum + inv.total, 0),
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Invoices</h1>
          <p className={styles.subtitle}>Manage invoices and payments</p>
        </div>
        <button className="btn btn-primary">+ Create Invoice</button>
      </header>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>💰</span>
          <div>
            <span className={styles.statValue}>{formatCurrency(stats.total)}</span>
            <span className={styles.statLabel}>Total Invoiced</span>
          </div>
        </div>
        <div className={styles.statCard} style={{ borderLeft: '4px solid #10b981' }}>
          <span className={styles.statIcon}>✅</span>
          <div>
            <span className={styles.statValue}>{formatCurrency(stats.paid)}</span>
            <span className={styles.statLabel}>Collected</span>
          </div>
        </div>
        <div className={styles.statCard} style={{ borderLeft: '4px solid #f59e0b' }}>
          <span className={styles.statIcon}>⏳</span>
          <div>
            <span className={styles.statValue}>{formatCurrency(stats.pending)}</span>
            <span className={styles.statLabel}>Pending</span>
          </div>
        </div>
        <div className={styles.statCard} style={{ borderLeft: '4px solid #ef4444' }}>
          <span className={styles.statIcon}>⚠️</span>
          <div>
            <span className={styles.statValue}>{formatCurrency(stats.overdue)}</span>
            <span className={styles.statLabel}>Overdue</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Search invoices..."
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
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="viewed">Viewed</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Invoice List */}
      <div className={styles.invoiceList}>
        <div className={styles.tableHeader}>
          <span>Invoice</span>
          <span>Client</span>
          <span>Amount</span>
          <span>Status</span>
          <span>Due Date</span>
          <span>Actions</span>
        </div>
        {filteredInvoices.map((invoice) => (
          <div key={invoice.id} className={styles.tableRow}>
            <span className={styles.invoiceNumber}>{invoice.invoiceNumber}</span>
            <span className={styles.clientName}>{invoice.clientName}</span>
            <span className={styles.amount}>{formatCurrency(invoice.total)}</span>
            <span
              className={styles.statusBadge}
              style={{
                backgroundColor: statusColors[invoice.status].bg,
                color: statusColors[invoice.status].text,
              }}
            >
              {invoice.status}
            </span>
            <span className={styles.dueDate}>
              {new Date(invoice.dueDate).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
              {invoice.paidDate && (
                <span className={styles.paidDate}>
                  Paid: {new Date(invoice.paidDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
              )}
            </span>
            <div className={styles.actions}>
              <button className={styles.actionBtn} title="View">👁️</button>
              <button className={styles.actionBtn} title="Download">📥</button>
              {invoice.status === 'draft' && (
                <button className={styles.actionBtn} title="Send">📤</button>
              )}
              {['sent', 'viewed', 'overdue'].includes(invoice.status) && (
                <button className={styles.actionBtn} title="Mark Paid">💵</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredInvoices.length === 0 && (
        <div className={styles.emptyState}>
          <p>No invoices found</p>
        </div>
      )}
    </div>
  );
}
