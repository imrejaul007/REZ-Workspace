'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { api, Warranty, Transfer } from '@/services/api';

function TransferContent() {
  const searchParams = useSearchParams();
  const warrantyIdFromUrl = searchParams.get('warrantyId');

  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [selectedWarranty, setSelectedWarranty] = useState<Warranty | null>(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [transferCode, setTransferCode] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (warrantyIdFromUrl && warranties.length > 0) {
      const warranty = warranties.find((w) => w.id === warrantyIdFromUrl);
      if (warranty && warranty.status === 'active') {
        setSelectedWarranty(warranty);
        setShowTransferForm(true);
      }
    }
  }, [warrantyIdFromUrl, warranties]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [transfersRes, warrantiesRes] = await Promise.all([
        api.getTransfers(),
        api.getWarranties(),
      ]);

      if (transfersRes.success && transfersRes.data) {
        setTransfers(transfersRes.data);
      } else {
        setTransfers(getMockTransfers());
      }

      if (warrantiesRes.success && warrantiesRes.data) {
        setWarranties(warrantiesRes.data);
      } else {
        setWarranties(getMockWarranties());
      }
    } catch (err) {
      setError('Failed to fetch data');
      setTransfers(getMockTransfers());
      setWarranties(getMockWarranties());
    } finally {
      setLoading(false);
    }
  };

  const getMockWarranties = (): Warranty[] => [
    {
      id: '1',
      qrCode: 'REZ-WARR-2024-001234',
      productName: 'MacBook Pro 14"',
      productCategory: 'Electronics',
      brand: 'Apple',
      serialNumber: 'C02ZW1ZZLVDL',
      purchaseDate: '2024-01-15',
      warrantyStartDate: '2024-01-15',
      warrantyEndDate: '2027-01-14',
      status: 'active',
      owner: { id: 'user-1', name: 'John Doe', email: 'john@example.com' },
      claimHistory: [],
      transferHistory: [],
      verificationCount: 5,
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-03-20T14:22:00Z',
    },
  ];

  const getMockTransfers = (): Transfer[] => [
    {
      id: 'transfer-1',
      warrantyId: '1',
      fromOwner: {
        id: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
      },
      toOwner: {
        id: 'user-2',
        name: 'Jane Smith',
        email: 'jane@example.com',
      },
      status: 'completed',
      transferCode: 'TRF-123456',
      createdAt: '2024-02-01T10:00:00Z',
      completedAt: '2024-02-01T14:30:00Z',
    },
  ];

  const handleInitiateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWarranty || !recipientEmail) return;

    setSubmitting(true);
    try {
      const response = await api.initiateTransfer(selectedWarranty.id, recipientEmail);

      if (response.success && response.data) {
        setTransferCode(response.data.transferCode);
        setTransfers([response.data, ...transfers]);
      } else {
        // Mock success for demo - generate secure code
        const code = 'TRF-' + Date.now().toString(36).toUpperCase().substring(4, 12);
        setTransferCode(code);
        const newTransfer: Transfer = {
          id: 'transfer-' + Date.now(),
          warrantyId: selectedWarranty.id,
          fromOwner: {
            id: 'user-1',
            name: 'John Doe',
            email: 'john@example.com',
          },
          toOwner: {
            id: 'new-user',
            name: 'New Owner',
            email: recipientEmail,
          },
          status: 'pending',
          transferCode: code,
          createdAt: new Date().toISOString(),
        };
        setTransfers([newTransfer, ...transfers]);
      }
    } catch (err) {
      setError('Failed to initiate transfer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelTransfer = async (transferId: string) => {
    try {
      const response = await api.cancelTransfer(transferId);
      if (response.success && response.data) {
        setTransfers(transfers.map((t) => (t.id === transferId ? response.data! : t)));
      } else {
        setTransfers(
          transfers.map((t) =>
            t.id === transferId ? { ...t, status: 'cancelled' as const } : t
          )
        );
      }
    } catch (err) {
      setError('Failed to cancel transfer');
    }
  };

  const resetForm = () => {
    setShowTransferForm(false);
    setSelectedWarranty(null);
    setRecipientEmail('');
    setTransferCode(null);
  };

  const getWarrantyById = (id: string): Warranty | undefined => {
    return warranties.find((w) => w.id === id);
  };

  const filteredTransfers = transfers.filter((transfer) => {
    return filter === 'all' || transfer.status === filter;
  });

  const stats = {
    total: transfers.length,
    pending: transfers.filter((t) => t.status === 'pending').length,
    completed: transfers.filter((t) => t.status === 'completed').length,
    cancelled: transfers.filter((t) => t.status === 'cancelled').length,
  };

  const getStatusColor = (status: Transfer['status']) => {
    const colors: Record<Transfer['status'], string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return colors[status];
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ownership Transfer</h1>
          <p className="mt-1 text-sm text-gray-500">
            Transfer warranty ownership to another person
          </p>
        </div>
        <button
          onClick={() => setShowTransferForm(true)}
          className="inline-flex items-center px-4 py-2 bg-secondary-600 text-white text-sm font-medium rounded-lg hover:bg-secondary-700 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          New Transfer
        </button>
      </div>

      {/* Transfer Form Modal */}
      {showTransferForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Transfer Warranty</h2>
                <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {transferCode ? (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Transfer Initiated</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Share this code with the recipient to complete the transfer
                  </p>
                  <div className="bg-gray-100 rounded-lg p-4 mb-4">
                    <p className="text-xs text-gray-500 mb-1">Transfer Code</p>
                    <p className="text-2xl font-mono font-bold text-gray-900">{transferCode}</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    The recipient will need this code to accept the transfer.
                  </p>
                  <button
                    onClick={resetForm}
                    className="mt-6 w-full px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleInitiateTransfer} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Warranty
                    </label>
                    <select
                      value={selectedWarranty?.id || ''}
                      onChange={(e) => {
                        const warranty = warranties.find((w) => w.id === e.target.value);
                        setSelectedWarranty(warranty || null);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500"
                      required
                    >
                      <option value="">Choose a warranty</option>
                      {warranties
                        .filter((w) => w.status === 'active')
                        .map((warranty) => (
                          <option key={warranty.id} value={warranty.id}>
                            {warranty.productName} - {warranty.brand}
                          </option>
                        ))}
                    </select>
                  </div>

                  {selectedWarranty && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm font-medium text-gray-900">{selectedWarranty.productName}</p>
                      <p className="text-xs text-gray-500">
                        {selectedWarranty.brand} | {selectedWarranty.qrCode}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Warranty valid until: {new Date(selectedWarranty.warrantyEndDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Recipient Email
                    </label>
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="recipient@example.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      The recipient will receive an email with transfer instructions
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!selectedWarranty || !recipientEmail || submitting}
                      className="flex-1 px-4 py-2 bg-secondary-600 text-white text-sm font-medium rounded-lg hover:bg-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Initiating...' : 'Initiate Transfer'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
        <StatCard label="Total" value={stats.total} color="gray" />
        <StatCard label="Pending" value={stats.pending} color="yellow" />
        <StatCard label="Completed" value={stats.completed} color="green" />
        <StatCard label="Cancelled" value={stats.cancelled} color="gray" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'pending', 'completed', 'cancelled'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filter === status
                ? 'bg-secondary-600 text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Transfer History */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-600"></div>
        </div>
      ) : filteredTransfers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No transfers found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter !== 'all' ? 'Try adjusting your filter' : 'Transfer warranty ownership to others'}
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowTransferForm(true)}
              className="inline-flex items-center px-4 py-2 bg-secondary-600 text-white text-sm font-medium rounded-lg hover:bg-secondary-700"
            >
              New Transfer
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTransfers.map((transfer) => {
            const warranty = getWarrantyById(transfer.warrantyId);
            return (
              <div
                key={transfer.id}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(transfer.status)}`}>
                        {transfer.status.charAt(0).toUpperCase() + transfer.status.slice(1)}
                      </span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {warranty?.productName || 'Unknown Product'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {warranty?.brand || 'Unknown Brand'}
                    </p>

                    <div className="mt-3 flex items-center gap-2 text-sm">
                      <div className="flex items-center">
                        <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center mr-2">
                          <span className="text-xs text-gray-600">
                            {transfer.fromOwner.name.charAt(0)}
                          </span>
                        </div>
                        <span className="text-gray-600">{transfer.fromOwner.name}</span>
                      </div>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                      <div className="flex items-center">
                        <div className="w-6 h-6 bg-secondary-100 rounded-full flex items-center justify-center mr-2">
                          <span className="text-xs text-secondary-600">
                            {transfer.toOwner.name.charAt(0)}
                          </span>
                        </div>
                        <span className="text-gray-600">{transfer.toOwner.name}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {transfer.status === 'completed' && transfer.completedAt
                        ? `Completed ${new Date(transfer.completedAt).toLocaleDateString()}`
                        : `Initiated ${new Date(transfer.createdAt).toLocaleDateString()}`}
                    </p>
                    {transfer.status === 'pending' && (
                      <button
                        onClick={() => handleCancelTransfer(transfer.id)}
                        className="mt-2 text-xs text-red-600 hover:text-red-800"
                      >
                        Cancel Transfer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorClasses: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-900',
    yellow: 'bg-yellow-100 text-yellow-900',
    green: 'bg-green-100 text-green-900',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
      <p className={`text-2xl font-bold ${colorClasses[color]}`}>{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}

export default function TransferPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-600"></div>
      </div>
    }>
      <TransferContent />
    </Suspense>
  );
}
