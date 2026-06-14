'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/api';
import { ClientDocument, ClientUser } from '@/types';
import { Loader2, Search, FileText, Download, Filter, File, FileCheck, Receipt, FolderOpen } from 'lucide-react';
import { formatDate, formatFileSize, cn } from '@/lib/utils';

const typeConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
  contract: { icon: FileCheck, color: 'text-green-600', bgColor: 'bg-green-100' },
  invoice: { icon: Receipt, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  report: { icon: FileText, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  proposal: { icon: FileText, color: 'text-amber-600', bgColor: 'bg-amber-100' },
  other: { icon: File, color: 'text-slate-600', bgColor: 'bg-slate-100' },
};

export default function DocumentsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<ClientUser | null>(null);
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    const loadData = async () => {
      if (!api.isAuthenticated()) {
        router.push('/');
        return;
      }

      const [profileRes, docsRes] = await Promise.all([
        api.getProfile(),
        api.getDocuments(),
      ]);

      if (!profileRes.success) {
        router.push('/');
        return;
      }

      setUser(profileRes.data as ClientUser);
      setDocuments((docsRes.data as ClientDocument[]) || []);
      setIsLoading(false);
    };

    loadData();
  }, [router]);

  const handleLogout = () => {
    api.logout();
    router.push('/');
  };

  const handleDownload = (doc: ClientDocument) => {
    logger.info('Download document:', doc.name);
    alert(`Downloading ${doc.name}...`);
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || doc.type === filterType;
    return matchesSearch && matchesType;
  });

  const typeCounts = {
    all: documents.length,
    contract: documents.filter((d) => d.type === 'contract').length,
    invoice: documents.filter((d) => d.type === 'invoice').length,
    report: documents.filter((d) => d.type === 'report').length,
    proposal: documents.filter((d) => d.type === 'proposal').length,
    other: documents.filter((d) => d.type === 'other').length,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Loading documents...</p>
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
              <h1 className="font-heading text-3xl font-bold text-slate-900 mb-2">Documents</h1>
              <p className="text-slate-500">
                Access your contracts, invoices, and project files
              </p>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          {Object.entries(typeCounts).map(([type, count]) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`p-4 rounded-xl border transition-all ${
                filterType === type
                  ? 'bg-primary-50 border-primary-200 ring-2 ring-primary-500/20'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <p className="text-2xl font-bold text-slate-900">{count}</p>
              <p className="text-sm text-slate-500 capitalize">{type}</p>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
            />
          </div>
        </div>

        {/* Documents Grid */}
        {filteredDocuments.length > 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Document
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Uploaded
                  </th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocuments.map((doc) => {
                  const config = typeConfig[doc.type] || typeConfig.other;
                  const Icon = config.icon;
                  return (
                    <tr
                      key={doc.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', config.bgColor)}>
                            <Icon className={cn('w-5 h-5', config.color)} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">{doc.name}</p>
                            {doc.projectName && (
                              <p className="text-xs text-slate-500">{doc.projectName}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                          {doc.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-500">{formatFileSize(doc.size)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm text-slate-700">{formatDate(doc.uploadedAt)}</p>
                          <p className="text-xs text-slate-400">by {doc.uploadedBy}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDownload(doc)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-primary-600 hover:bg-primary-50 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="font-heading font-semibold text-slate-900 mb-2">No documents found</h3>
            <p className="text-slate-500">
              {searchTerm
                ? 'Try adjusting your search terms'
                : 'No documents match the selected filter'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
