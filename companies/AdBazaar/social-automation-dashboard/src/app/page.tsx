'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  Server,
  CheckCircle,
  XCircle,
  TrendingUp,
  Clock,
  RefreshCw,
  Search,
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import ServiceCard from '@/components/ServiceCard';
import { Service } from '@/types';
import axios from 'axios';

const initialServices: Omit<Service, 'status' | 'lastChecked' | 'responseTime'>[] = [
  {
    id: 'instagram-shop',
    name: 'Instagram Shop Integration',
    port: 5080,
    description: 'Product tagging & checkout',
  },
  {
    id: 'instagram-publishing',
    name: 'Instagram Publishing',
    port: 5081,
    description: 'Feed/Reels/Stories publishing',
  },
  {
    id: 'instagram-insights',
    name: 'Instagram Insights',
    port: 5082,
    description: 'Analytics & insights',
  },
  {
    id: 'social-content-publisher',
    name: 'Social Content Publisher',
    port: 5083,
    description: 'Unified multi-platform publisher',
  },
  {
    id: 'hashtag-research',
    name: 'Hashtag Research Engine',
    port: 5090,
    description: 'Hashtag discovery',
  },
  {
    id: 'caption-generator',
    name: 'Caption Generator AI',
    port: 5091,
    description: 'AI caption generation',
  },
  {
    id: 'content-calendar',
    name: 'Content Calendar',
    port: 5092,
    description: 'Visual calendar',
  },
  {
    id: 'follower-growth',
    name: 'Follower Growth Tracker',
    port: 5093,
    description: 'Follower analytics',
  },
  {
    id: 'youtube-integration',
    name: 'YouTube Integration',
    port: 5094,
    description: 'YouTube API',
  },
  {
    id: 'pinterest-integration',
    name: 'Pinterest Integration',
    port: 5095,
    description: 'Pinterest API',
  },
  {
    id: 'content-repurposing',
    name: 'Content Repurposing Engine',
    port: 5100,
    description: 'Content adaptation',
  },
  {
    id: 'ugc-management',
    name: 'UGC Management Service',
    port: 5101,
    description: 'UGC collection',
  },
  {
    id: 'social-inbox',
    name: 'Unified Social Inbox',
    port: 5102,
    description: 'Multi-platform inbox',
  },
  {
    id: 'crisis-alert',
    name: 'Crisis Alert Service',
    port: 5103,
    description: 'Crisis detection',
  },
  {
    id: 'snapchat-integration',
    name: 'Snapchat Integration',
    port: 5104,
    description: 'Snapchat ads',
  },
  {
    id: 'competitor-tracker',
    name: 'Social Competitor Tracker',
    port: 5105,
    description: 'Competitor monitoring',
  },
  {
    id: 'reddit-integration',
    name: 'Reddit Integration',
    port: 5110,
    description: 'Reddit API',
  },
  {
    id: 'influencer-authenticity',
    name: 'Influencer Authenticity Check',
    port: 5111,
    description: 'Fake follower detection',
  },
  {
    id: 'brand-partnership',
    name: 'Brand Partnership Portal',
    port: 5112,
    description: 'Brand-influencer matching',
  },
  {
    id: 'content-compliance',
    name: 'Content Compliance AI',
    port: 5113,
    description: 'Policy compliance',
  },
];

export default function Dashboard() {
  const [services, setServices] = useState<Service[]>(
    initialServices.map((s) => ({ ...s, status: 'offline', lastChecked: null }))
  );
  const [isLoading, setIsLoading] = useState(true);
  const [lastGlobalCheck, setLastGlobalCheck] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'online' | 'offline'>('all');

  const checkServiceHealth = useCallback(async (service: Service): Promise<{
    id: string;
    status: 'online' | 'offline';
    responseTime?: number;
  }> => {
    const startTime = Date.now();
    try {
      await axios.get(`http://localhost:${service.port}/health`, {
        timeout: 5000,
      });
      return {
        id: service.id,
        status: 'online',
        responseTime: Date.now() - startTime,
      };
    } catch {
      return {
        id: service.id,
        status: 'offline',
      };
    }
  }, []);

  const checkAllServices = useCallback(async () => {
    setIsLoading(true);
    const results = await Promise.all(services.map(checkServiceHealth));

    setServices((prev) =>
      prev.map((service) => {
        const result = results.find((r) => r.id === service.id);
        if (result) {
          return {
            ...service,
            status: result.status,
            responseTime: result.responseTime,
            lastChecked: new Date(),
          };
        }
        return service;
      })
    );
    setLastGlobalCheck(new Date());
    setIsLoading(false);
  }, [services, checkServiceHealth]);

  const handleStatusChange = (
    id: string,
    status: 'online' | 'offline',
    responseTime?: number
  ) => {
    setServices((prev) =>
      prev.map((service) =>
        service.id === id
          ? { ...service, status, responseTime, lastChecked: new Date() }
          : service
      )
    );
  };

  // Initial check and polling every 30 seconds
  useEffect(() => {
    checkAllServices();
    const interval = setInterval(checkAllServices, 30000);
    return () => clearInterval(interval);
  }, [checkAllServices]);

  const stats = {
    totalServices: services.length,
    onlineCount: services.filter((s) => s.status === 'online').length,
    offlineCount: services.filter((s) => s.status === 'offline').length,
    avgResponseTime: Math.round(
      services
        .filter((s) => s.responseTime)
        .reduce((acc, s) => acc + (s.responseTime || 0), 0) /
        services.filter((s) => s.responseTime).length || 0
    ),
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
        {/* Header */}
        <header className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">Service Overview</h1>
                <p className="text-sm text-slate-400 mt-1">
                  Monitor and manage all 20 social automation services
                </p>
              </div>
              <button
                onClick={checkAllServices}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium rounded-lg transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Checking...' : 'Refresh All'}
              </button>
            </div>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="px-6 py-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Services</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.totalServices}</p>
              </div>
              <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center">
                <Server className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Online</p>
                <p className="text-3xl font-bold text-green-400 mt-1">{stats.onlineCount}</p>
              </div>
              <div className="w-12 h-12 bg-green-600/20 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Offline</p>
                <p className="text-3xl font-bold text-red-400 mt-1">{stats.offlineCount}</p>
              </div>
              <div className="w-12 h-12 bg-red-600/20 rounded-xl flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Avg Response</p>
                <p className="text-3xl font-bold text-yellow-400 mt-1">
                  {stats.avgResponseTime > 0 ? `${stats.avgResponseTime}ms` : 'N/A'}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-600/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 pb-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'online', 'offline'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  filter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Last Check Time */}
        <div className="px-6 pb-4 flex items-center gap-2 text-sm text-slate-500">
          <Clock className="w-4 h-4" />
          <span>
            Last checked: {lastGlobalCheck
              ? lastGlobalCheck.toLocaleTimeString()
              : 'Never'}
          </span>
          <span className="text-slate-600">|</span>
          <span>Auto-refresh every 30s</span>
          <Activity className="w-4 h-4 text-green-500 animate-pulse-dot" />
        </div>

        {/* Services Grid */}
        <div className="px-6 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>

          {filteredServices.length === 0 && (
            <div className="text-center py-12">
              <Server className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">No services found</p>
              <p className="text-slate-500 text-sm mt-1">
                Try adjusting your search or filter
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}