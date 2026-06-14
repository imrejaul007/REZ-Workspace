'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Server,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { Service } from '@/types';
import axios from 'axios';

const initialServices: Omit<Service, 'status' | 'lastChecked' | 'responseTime'>[] = [
  { id: 'instagram-shop', name: 'Instagram Shop Integration', port: 5080, description: 'Product tagging & checkout' },
  { id: 'instagram-publishing', name: 'Instagram Publishing', port: 5081, description: 'Feed/Reels/Stories publishing' },
  { id: 'instagram-insights', name: 'Instagram Insights', port: 5082, description: 'Analytics & insights' },
  { id: 'social-content-publisher', name: 'Social Content Publisher', port: 5083, description: 'Unified multi-platform publisher' },
  { id: 'hashtag-research', name: 'Hashtag Research Engine', port: 5090, description: 'Hashtag discovery' },
  { id: 'caption-generator', name: 'Caption Generator AI', port: 5091, description: 'AI caption generation' },
  { id: 'content-calendar', name: 'Content Calendar', port: 5092, description: 'Visual calendar' },
  { id: 'follower-growth', name: 'Follower Growth Tracker', port: 5093, description: 'Follower analytics' },
  { id: 'youtube-integration', name: 'YouTube Integration', port: 5094, description: 'YouTube API' },
  { id: 'pinterest-integration', name: 'Pinterest Integration', port: 5095, description: 'Pinterest API' },
  { id: 'content-repurposing', name: 'Content Repurposing Engine', port: 5100, description: 'Content adaptation' },
  { id: 'ugc-management', name: 'UGC Management Service', port: 5101, description: 'UGC collection' },
  { id: 'social-inbox', name: 'Unified Social Inbox', port: 5102, description: 'Multi-platform inbox' },
  { id: 'crisis-alert', name: 'Crisis Alert Service', port: 5103, description: 'Crisis detection' },
  { id: 'snapchat-integration', name: 'Snapchat Integration', port: 5104, description: 'Snapchat ads' },
  { id: 'competitor-tracker', name: 'Social Competitor Tracker', port: 5105, description: 'Competitor monitoring' },
  { id: 'reddit-integration', name: 'Reddit Integration', port: 5110, description: 'Reddit API' },
  { id: 'influencer-authenticity', name: 'Influencer Authenticity Check', port: 5111, description: 'Fake follower detection' },
  { id: 'brand-partnership', name: 'Brand Partnership Portal', port: 5112, description: 'Brand-influencer matching' },
  { id: 'content-compliance', name: 'Content Compliance AI', port: 5113, description: 'Policy compliance' },
];

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>(
    initialServices.map((s) => ({ ...s, status: 'offline', lastChecked: null }))
  );
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [checkingId, setCheckingId] = useState<string | null>(null);

  const checkServiceHealth = useCallback(async (service: Service): Promise<{
    id: string;
    status: 'online' | 'offline';
    responseTime?: number;
  }> => {
    const startTime = Date.now();
    try {
      await axios.get(`http://localhost:${service.port}/health`, { timeout: 5000 });
      return { id: service.id, status: 'online', responseTime: Date.now() - startTime };
    } catch {
      return { id: service.id, status: 'offline' };
    }
  }, []);

  const checkAllServices = useCallback(async () => {
    setIsLoading(true);
    const results = await Promise.all(services.map(checkServiceHealth));
    setServices((prev) =>
      prev.map((service) => {
        const result = results.find((r) => r.id === service.id);
        return result ? { ...service, status: result.status, responseTime: result.responseTime, lastChecked: new Date() } : service;
      })
    );
    setIsLoading(false);
  }, [services, checkServiceHealth]);

  const checkSingleService = async (id: string) => {
    setCheckingId(id);
    const service = services.find((s) => s.id === id);
    if (service) {
      const result = await checkServiceHealth(service);
      setServices((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, status: result.status, responseTime: result.responseTime, lastChecked: new Date() } : s
        )
      );
    }
    setCheckingId(null);
  };

  useEffect(() => {
    checkAllServices();
    const interval = setInterval(checkAllServices, 30000);
    return () => clearInterval(interval);
  }, [checkAllServices]);

  const stats = {
    totalServices: services.length,
    onlineCount: services.filter((s) => s.status === 'online').length,
    offlineCount: services.filter((s) => s.status === 'offline').length,
  };

  const filteredServices = services.filter((service) => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' ||
      (filter === 'online' && service.status === 'online') ||
      (filter === 'offline' && service.status === 'offline');
    return matchesSearch && matchesFilter;
  });

  return (
    <>
      <Sidebar stats={stats} />
      <main className="flex-1 overflow-auto bg-slate-950">
        <header className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">All Services</h1>
              <p className="text-sm text-slate-400 mt-1">Detailed view of all 20 social automation services</p>
            </div>
            <button onClick={checkAllServices} disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium rounded-lg transition-colors">
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Checking...' : 'Refresh All'}
            </button>
          </div>
        </header>

        <div className="px-6 py-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input type="text" placeholder="Search services..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <div className="flex gap-2">
            {(['all', 'online', 'offline'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 pb-6">
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Service</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Port</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Response</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredServices.map((service) => (
                  <tr key={service.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${service.status === 'online' ? 'bg-green-500 animate-pulse-dot' : 'bg-red-500'}`} />
                        <div>
                          <p className="text-sm font-medium text-white">{service.name}</p>
                          <p className="text-xs text-slate-400">{service.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-blue-400">{service.port}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        service.status === 'online' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {service.status === 'online' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {service.status === 'online' ? 'Online' : 'Offline'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-300">
                        {service.responseTime ? `${service.responseTime}ms` : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => checkSingleService(service.id)} disabled={checkingId === service.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors">
                        {checkingId === service.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                        Check
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}