'use client';

import { useState, useEffect } from 'react';

interface OwnershipPassport {
  passport_id: string;
  serial_number: string;
  product: {
    brand: string;
    model: string;
    category: string;
  };
  status: string;
  warranty: {
    status: string;
    start_date: string;
    end_date: string;
    remaining_days: number;
    transferable: boolean;
  };
  ownership: {
    current_owner: {
      name: string;
      phone: string;
      owned_since: string;
    };
    chain_length: number;
    chain: Array<{
      owner_name: string;
      transfer_type: string;
      acquired_date: string;
      verification_status: string;
    }>;
  };
  certificate: {
    certificate_id: string;
    hash: string;
    qr_code: string;
  };
}

export default function PassportPage() {
  const [serial, setSerial] = useState('');
  const [passports, setPassports] = useState<OwnershipPassport[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPassport, setSelectedPassport] = useState<OwnershipPassport | null>(null);

  useEffect(() => {
    // Load demo data
    setPassports(getMockPassports());
  }, []);

  const getMockPassports = (): OwnershipPassport[] => [
    {
      passport_id: 'PASS-2026-001234',
      serial_number: 'REZ123456789',
      product: {
        brand: 'Apple',
        model: 'MacBook Pro 14"',
        category: 'Electronics',
      },
      status: 'active',
      warranty: {
        status: 'active',
        start_date: '2026-01-15',
        end_date: '2027-01-15',
        remaining_days: 268,
        transferable: true,
      },
      ownership: {
        current_owner: {
          name: 'John Doe',
          phone: '+919999999999',
          owned_since: '2026-01-15',
        },
        chain_length: 1,
        chain: [
          {
            owner_name: 'John Doe',
            transfer_type: 'purchase',
            acquired_date: '2026-01-15',
            verification_status: 'verified',
          },
        ],
      },
      certificate: {
        certificate_id: 'CERT-2026-001234',
        hash: 'a1b2c3d4e5f6',
        qr_code: 'REZ:PASS:PASS-2026-001234',
      },
    },
    {
      passport_id: 'PASS-2026-002345',
      serial_number: 'R5CR50NGXYZ',
      product: {
        brand: 'Samsung',
        model: 'Galaxy S24 Ultra',
        category: 'Electronics',
      },
      status: 'active',
      warranty: {
        status: 'active',
        start_date: '2026-02-10',
        end_date: '2029-02-09',
        remaining_days: 997,
        transferable: true,
      },
      ownership: {
        current_owner: {
          name: 'John Doe',
          phone: '+919999999999',
          owned_since: '2026-02-10',
        },
        chain_length: 1,
        chain: [
          {
            owner_name: 'John Doe',
            transfer_type: 'purchase',
            acquired_date: '2026-02-10',
            verification_status: 'verified',
          },
        ],
      },
      certificate: {
        certificate_id: 'CERT-2026-002345',
        hash: 'f6e5d4c3b2a1',
        qr_code: 'REZ:PASS:PASS-2026-002345',
      },
    },
  ];

  const searchPassport = async () => {
    if (!serial) return;
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      const found = getMockPassports().find(p => p.serial_number === serial);
      if (found) {
        setSelectedPassport(found);
      } else {
        setSelectedPassport(null);
      }
      setLoading(false);
    }, 1000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'expired': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'transferred': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getTransferIcon = (type: string) => {
    switch (type) {
      case 'purchase': return '💰';
      case 'gift': return '🎁';
      case 'resale': return '🔄';
      default: return '📦';
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 p-8 mb-8">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Ownership Passport
            </h1>
            <p className="text-purple-100 text-lg">
              Complete product identity & verification certificate
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl p-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 7c0 3.308 2.692 6 6 6s6-2.692 6-6c0-1.05-.18-2.05-.5-2.98z" />
              </svg>
            </div>
            <div>
              <p className="text-white/80 text-sm">Total Passports</p>
              <p className="text-white text-2xl font-bold">{passports.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Search Passport</h2>
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={serial}
              onChange={(e) => setSerial(e.target.value.toUpperCase())}
              placeholder="Enter serial number"
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
            />
          </div>
          <button
            onClick={searchPassport}
            disabled={loading || !serial}
            className="px-8 py-3.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Search'
            )}
          </button>
        </div>
      </div>

      {/* Passport Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {(selectedPassport ? [selectedPassport] : passports).map((passport) => (
          <div key={passport.passport_id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300">
            {/* Certificate Header */}
            <div className="relative bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 p-6">
              <div className="absolute top-4 right-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white backdrop-blur-sm ${getStatusColor(passport.status)}`}>
                  {passport.status.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 7c0 3.308 2.692 6 6 6s6-2.692 6-6c0-1.05-.18-2.05-.5-2.98z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white/80 text-sm">Ownership Passport</p>
                  <h3 className="text-xl font-bold text-white">
                    {passport.product.brand} {passport.product.model}
                  </h3>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Serial & Certificate */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Serial Number</p>
                  <p className="font-mono font-semibold text-gray-900">{passport.serial_number}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Certificate ID</p>
                  <p className="font-mono text-sm text-gray-700">{passport.certificate.certificate_id}</p>
                </div>
              </div>

              {/* Warranty Progress */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Warranty Status</p>
                    <p className="text-2xl font-bold text-gray-900 capitalize">{passport.warranty.status}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-emerald-600">{passport.warranty.remaining_days}</p>
                    <p className="text-xs text-gray-500">days left</p>
                  </div>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((passport.warranty.remaining_days / 365) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span>{passport.warranty.start_date}</span>
                  <span>{passport.warranty.end_date}</span>
                </div>
              </div>

              {/* Current Owner */}
              <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                  {passport.ownership.current_owner.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{passport.ownership.current_owner.name}</p>
                  <p className="text-sm text-gray-500">Owner since {passport.ownership.current_owner.owned_since}</p>
                </div>
                {passport.warranty.transferable && (
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                    Transferable
                  </span>
                )}
              </div>

              {/* Ownership Chain */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Ownership Chain</p>
                <div className="space-y-2">
                  {passport.ownership.chain.map((entry, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <span className="text-lg">{getTransferIcon(entry.transfer_type)}</span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{entry.owner_name}</p>
                        <p className="text-xs text-gray-500 capitalize">{entry.transfer_type} • {entry.acquired_date}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        entry.verification_status === 'verified'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {entry.verification_status}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {passport.ownership.chain_length} owner(s) in chain
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  View Certificate
                </button>
                <button className="px-4 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </button>
                <button className="px-4 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {passports.length === 0 && !selectedPassport && (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Passports Found</h3>
          <p className="text-gray-500 mb-6">Scan a QR code to create your first ownership passport</p>
          <button className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-medium rounded-xl">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            Scan Now
          </button>
        </div>
      )}
    </div>
  );
}
