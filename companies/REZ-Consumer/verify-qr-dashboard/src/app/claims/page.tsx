'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ClaimForm from '@/components/ClaimForm';
import { api, Claim, Warranty } from '@/services/api';

function ClaimsContent() {
  const searchParams = useSearchParams();
  const warrantyIdFromUrl = searchParams.get('warrantyId');

  const [claims, setClaims] = useState<Claim[]>([]);
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewClaimForm, setShowNewClaimForm] = useState(false);
  const [selectedWarranty, setSelectedWarranty] = useState<Warranty | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'resolved'>('all');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (warrantyIdFromUrl && warranties.length > 0) {
      const warranty = warranties.find((w) => w.warranty_id === warrantyIdFromUrl);
      if (warranty) {
        setSelectedWarranty(warranty);
        setShowNewClaimForm(true);
      }
    }
  }, [warrantyIdFromUrl, warranties]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [claimsRes, warrantiesRes] = await Promise.all([
        api.getClaims(),
        api.getWarranties(),
      ]);

      if (claimsRes.success && claimsRes.data) {
        setClaims(claimsRes.data);
      } else {
        setClaims(getMockClaims());
      }

      if (warrantiesRes.success && warrantiesRes.data) {
        setWarranties(warrantiesRes.data);
      } else {
        setWarranties(getMockWarranties());
      }
    } catch (err) {
      setError('Failed to fetch data');
      setClaims(getMockClaims());
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

  const getMockClaims = (): Claim[] => [
    {
      id: 'claim-1',
      warrantyId: '4',
      status: 'approved',
      type: 'repair',
      description: 'Screen replacement needed - display showing dead pixels',
      priority: 'high',
      attachments: [],
      resolution: 'Screen replaced at authorized service center',
      createdAt: '2024-04-15T09:00:00Z',
      updatedAt: '2024-04-20T14:30:00Z',
    },
    {
      id: 'claim-2',
      warrantyId: '1',
      status: 'pending',
      type: 'repair',
      description: 'Keyboard not working properly - some keys unresponsive',
      priority: 'medium',
      attachments: [],
      createdAt: '2024-05-01T11:30:00Z',
      updatedAt: '2024-05-01T11:30:00Z',
    },
  ];

  const getWarrantyById = (id: string): Warranty | undefined => {
    return warranties.find((w) => w.id === id);
  };

  const handleCreateClaim = async (claimData: {
    warrantyId: string;
    type: 'repair' | 'replacement' | 'refund';
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
  }) => {
    try {
      const response = await api.createClaim(claimData.warrantyId, {
        type: claimData.type,
        description: claimData.description,
        priority: claimData.priority,
      });

      if (response.success && response.data) {
        setClaims([response.data, ...claims]);
        setShowNewClaimForm(false);
        setSelectedWarranty(null);
      } else {
        // Mock success for demo
        const newClaim: Claim = {
          id: 'claim-' + Date.now(),
          ...claimData,
          status: 'pending',
          attachments: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setClaims([newClaim, ...claims]);
        setShowNewClaimForm(false);
        setSelectedWarranty(null);
      }
    } catch (err) {
      throw new Error('Failed to create claim');
    }
  };

  const filteredClaims = claims.filter((claim) => {
    return filter === 'all' || claim.status === filter;
  });

  const stats = {
    total: claims.length,
    pending: claims.filter((c) => c.status === 'pending').length,
    approved: claims.filter((c) => c.status === 'approved').length,
    rejected: claims.filter((c) => c.status === 'rejected').length,
    resolved: claims.filter((c) => c.status === 'resolved').length,
  };

  const getStatusColor = (status: Claim['status']) => {
    const colors: Record<Claim['status'], string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800',
      resolved: 'bg-green-100 text-green-800',
    };
    return colors[status];
  };

  const getPriorityColor = (priority: Claim['priority']) => {
    const colors: Record<Claim['priority'], string> = {
      low: 'bg-gray-100 text-gray-600',
      medium: 'bg-blue-100 text-blue-600',
      high: 'bg-orange-100 text-orange-600',
      urgent: 'bg-red-100 text-red-600',
    };
    return colors[priority];
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Claims</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track and manage your warranty claims
          </p>
        </div>
        <button
          onClick={() => setShowNewClaimForm(true)}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Claim
        </button>
      </div>

      {/* New Claim Form Modal */}
      {showNewClaimForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">File a New Claim</h2>
                <button
                  onClick={() => {
                    setShowNewClaimForm(false);
                    setSelectedWarranty(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <ClaimForm
                warranties={warranties.filter((w) => w.status === 'active')}
                selectedWarranty={selectedWarranty}
                onSelectWarranty={setSelectedWarranty}
                onSubmit={handleCreateClaim}
                onCancel={() => {
                  setShowNewClaimForm(false);
                  setSelectedWarranty(null);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Total" value={stats.total} color="gray" />
        <StatCard label="Pending" value={stats.pending} color="yellow" />
        <StatCard label="Approved" value={stats.approved} color="blue" />
        <StatCard label="Rejected" value={stats.rejected} color="red" />
        <StatCard label="Resolved" value={stats.resolved} color="green" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'pending', 'approved', 'rejected', 'resolved'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filter === status
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      )}

      {/* Claims List */}
      {!loading && (
        <>
          {filteredClaims.length === 0 ? (
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No claims found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filter !== 'all'
                  ? 'Try adjusting your filter'
                  : 'File a claim for unknown warranty issues'}
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setShowNewClaimForm(true)}
                  className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700"
                >
                  File a Claim
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredClaims.map((claim) => {
                const warranty = getWarrantyById(claim.warrantyId);
                return (
                  <div
                    key={claim.id}
                    className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(claim.status)}`}>
                            {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(claim.priority)}`}>
                            {claim.priority.toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-500">
                            {claim.type.charAt(0).toUpperCase() + claim.type.slice(1)}
                          </span>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {warranty?.productName || 'Unknown Product'}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {warranty?.brand || 'Unknown Brand'}
                        </p>
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          {claim.description}
                        </p>
                        {claim.resolution && (
                          <div className="mt-3 p-3 bg-green-50 rounded-lg">
                            <p className="text-xs font-medium text-green-800 mb-1">Resolution</p>
                            <p className="text-sm text-green-700">{claim.resolution}</p>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          Filed {new Date(claim.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          ID: {claim.id.slice(0, 8)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorClasses: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-900',
    yellow: 'bg-yellow-100 text-yellow-900',
    blue: 'bg-blue-100 text-blue-900',
    red: 'bg-red-100 text-red-900',
    green: 'bg-green-100 text-green-900',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
      <p className={`text-2xl font-bold ${colorClasses[color]}`}>{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}

export default function ClaimsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    }>
      <ClaimsContent />
    </Suspense>
  );
}
