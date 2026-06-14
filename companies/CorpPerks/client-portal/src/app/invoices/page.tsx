'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import InvoiceCard from '@/components/InvoiceCard';
import api from '@/lib/api';
import { ClientInvoice, ClientUser } from '@/types';
import { Loader2, Search, Receipt, Download } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function InvoicesPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<ClientUser | null>(null);
  const [invoices, setInvoices] = useState<ClientInvoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    const loadData = async () => {
      if (!api.isAuthenticated()) {
        router.push('/');
        return;
      }

      const [profileRes, invoicesRes] = await Promise.all([
        api.getProfile(),
        api.getInvoices(),
      ]);

      if (!profileRes.success) {
        router.push('/');
        return;
      }

      setUser(profileRes.data as ClientUser);
      setInvoices((invoicesRes.data as ClientInvoice[]) || []);
      setIsLoading(false);
    };

    loadData();
  }, [router]);

  const handleLogout = () => {
    api.logout();
    router.push('/');
  };

  const handleDownload = (invoice: ClientInvoice) => {
    // In production, this would trigger PDF download
    logger.info('Download invoice:', invoice.invoiceNumber);
    alert(`Downloading ${invoice.invoiceNumber}...`);
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: invoices.length,
    pending: invoices.filter((i) => i.status === 'pending').length,
    paid: invoices.filter((i) => i.status === 'paid').length,
    overdue: invoices.filter((i) => i.status === 'overdue').length,
  };

  const totalPending = invoices
    .filter((i) => i.status === 'pending' || i.status === 'overdue')
    .reduce((sum, i) => sum + i.amount, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Loading invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar clientName={user?.companyName} onLogout={handleLogout} />
      <main className="ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-3xl font-bold text-slate-900 mb-2">Invoices</h1>
              <p className="text-slate-500">
                View and manage your billing history
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">Total Outstanding</p>
              <p className="font-heading text-2xl font-bold text-red-600">
                {formatCurrency(totalPending, 'INR')}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {Object.entries(statusCounts).map(([status, count]) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`p-4 rounded-xl border transition-all ${
                filterStatus === status
                  ? 'bg-primary-50 border-primary-200 ring-2 ring-primary-500/20'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <p className="text-2xl font-bold text-slate-900">{count}</p>
              <p className="text-sm text-slate-500 capitalize">{status}</p>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
            />
          </div>
        </div>

        {/* Invoices Grid */}
        {filteredInvoices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInvoices.map((invoice) => (
              <InvoiceCard
                key={invoice.id}
                invoice={invoice}
                onDownload={handleDownload}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="font-heading font-semibold text-slate-900 mb-2">No invoices found</h3>
            <p className="text-slate-500">
              {searchTerm
                ? 'Try adjusting your search terms'
                : 'No invoices match the selected filter'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
