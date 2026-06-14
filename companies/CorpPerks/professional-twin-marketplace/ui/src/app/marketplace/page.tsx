'use client';

import { useState, useEffect } from 'react';

// Types
interface Twin {
  twinId: string;
  ownerName: string;
  twinType: string;
  expertise: string[];
  metrics: {
    combinedScore: number;
    productivityMultiplier: number;
    reliabilityScore: number;
  };
  learningHours: number;
  highlight: string;
}

interface Company {
  companyId: string;
  companyName: string;
  accessCount: number;
}

interface HireRequest {
  grantId: string;
  twinId: string;
  ownerName: string;
  twinType: string;
  companyName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

interface Tab {
  id: 'browse' | 'my-hires' | 'requests' | 'analytics';
  label: string;
  icon: string;
}

const TABS: Tab[] = [
  { id: 'browse', label: 'Browse Twins', icon: '🔍' },
  { id: 'my-hires', label: 'My Hires', icon: '👥' },
  { id: 'requests', label: 'Requests', icon: '📋' },
  { id: 'analytics', label: 'Analytics', icon: '📊' }
];

const TWIN_TYPES = [
  { id: 'ALL', name: 'All Twins', emoji: '🎯', color: 'from-purple-500 to-pink-500' },
  { id: 'KNOWLEDGE', name: 'Knowledge', emoji: '🧠', color: 'from-blue-500 to-cyan-500' },
  { id: 'SKILL', name: 'Skill', emoji: '🎯', color: 'from-green-500 to-emerald-500' },
  { id: 'CAREER', name: 'Career', emoji: '📈', color: 'from-purple-500 to-violet-500' },
  { id: 'PRODUCTIVITY', name: 'Productivity', emoji: '⚡', color: 'from-yellow-500 to-orange-500' },
  { id: 'EXECUTION', name: 'Execution', emoji: '🚀', color: 'from-red-500 to-pink-500' }
];

export default function MarketplacePage() {
  const [activeTab, setActiveTab] = useState<'browse' | 'my-hires' | 'requests' | 'analytics'>('browse');
  const [selectedTwinType, setSelectedTwinType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [twins, setTwins] = useState<Twin[]>([]);
  const [myHires, setMyHires] = useState<Twin[]>([]);
  const [requests, setRequests] = useState<HireRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTwin, setSelectedTwin] = useState<Twin | null>(null);

  // Sample data
  const sampleTwins: Twin[] = [
    { twinId: 'TWIN-CI-001-KNOWLEDGE', ownerName: 'Rahul Sharma', twinType: 'KNOWLEDGE', expertise: ['Python', 'System Design', 'ML'], metrics: { combinedScore: 92, productivityMultiplier: 1.8, reliabilityScore: 96 }, learningHours: 2500, highlight: 'Highly Trained' },
    { twinId: 'TWIN-CI-002-SKILL', ownerName: 'Priya Patel', twinType: 'SKILL', expertise: ['Figma', 'UI/UX', 'Design Systems'], metrics: { combinedScore: 88, productivityMultiplier: 2.2, reliabilityScore: 94 }, learningHours: 1800, highlight: 'High Productivity' },
    { twinId: 'TWIN-CI-003-EXECUTION', ownerName: 'Amit Kumar', twinType: 'EXECUTION', expertise: ['Sales', 'Negotiation', 'CRM'], metrics: { combinedScore: 85, productivityMultiplier: 3.1, reliabilityScore: 91 }, learningHours: 1200, highlight: 'Top Rated' },
    { twinId: 'TWIN-CI-004-SKILL', ownerName: 'Sneha Reddy', twinType: 'SKILL', expertise: ['Data Science', 'Python', 'Analytics'], metrics: { combinedScore: 90, productivityMultiplier: 2.4, reliabilityScore: 93 }, learningHours: 2100, highlight: 'Rising Star' },
    { twinId: 'TWIN-CI-005-PRODUCTIVITY', ownerName: 'Vikram Singh', twinType: 'PRODUCTIVITY', expertise: ['Project Management', 'Agile', 'Leadership'], metrics: { combinedScore: 86, productivityMultiplier: 1.7, reliabilityScore: 97 }, learningHours: 1600, highlight: 'Highly Trained' },
    { twinId: 'TWIN-CI-006-KNOWLEDGE', ownerName: 'Anita Desai', twinType: 'KNOWLEDGE', expertise: ['Finance', 'Accounting', 'Excel'], metrics: { combinedScore: 89, productivityMultiplier: 1.6, reliabilityScore: 95 }, learningHours: 2000, highlight: 'Top Rated' },
    { twinId: 'TWIN-CI-007-EXECUTION', ownerName: 'Raj Menon', twinType: 'EXECUTION', expertise: ['Java', 'Spring Boot', 'Microservices'], metrics: { combinedScore: 91, productivityMultiplier: 2.8, reliabilityScore: 92 }, learningHours: 2300, highlight: 'Highly Trained' },
    { twinId: 'TWIN-CI-008-CAREER', ownerName: 'Meera Gupta', twinType: 'CAREER', expertise: ['HR', 'Recruitment', 'Training'], metrics: { combinedScore: 84, productivityMultiplier: 1.5, reliabilityScore: 98 }, learningHours: 1400, highlight: 'Rising Star' }
  ];

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setTwins(sampleTwins);
      setMyHires(sampleTwins.slice(0, 3));
      setRequests([
        { grantId: 'GRT-001', twinId: 'TWIN-CI-001-KNOWLEDGE', ownerName: 'Rahul Sharma', twinType: 'KNOWLEDGE', companyName: 'TechCorp Inc', status: 'PENDING', createdAt: '2026-06-08' },
        { grantId: 'GRT-002', twinId: 'TWIN-CI-002-SKILL', ownerName: 'Priya Patel', twinType: 'SKILL', companyName: 'Design Studio', status: 'APPROVED', createdAt: '2026-06-07' },
        { grantId: 'GRT-003', twinId: 'TWIN-CI-003-EXECUTION', ownerName: 'Amit Kumar', twinType: 'EXECUTION', companyName: 'SalesForce', status: 'PENDING', createdAt: '2026-06-06' }
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const filteredTwins = twins.filter(t => {
    const matchesType = selectedTwinType === 'ALL' || t.twinType === selectedTwinType;
    const matchesSearch = searchQuery === '' ||
      t.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.expertise.some(e => e.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const handleHire = (twin: Twin) => {
    alert(`Hire request sent for ${twin.ownerName}'s ${twin.twinType} Twin!`);
  };

  const handleApprove = (grantId: string) => {
    setRequests(prev => prev.map(r => r.grantId === grantId ? { ...r, status: 'APPROVED' } : r));
  };

  const handleReject = (grantId: string) => {
    setRequests(prev => prev.map(r => r.grantId === grantId ? { ...r, status: 'REJECTED' } : r));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Twin Marketplace
            </span>
          </h1>
          <p className="text-gray-400">
            Hire employees + their AI professional twins
          </p>
        </header>

        {/* Stats Banner */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Available Twins', value: twins.length, emoji: '🧠' },
            { label: 'My Hires', value: myHires.length, emoji: '👥' },
            { label: 'Pending Requests', value: requests.filter(r => r.status === 'PENDING').length, emoji: '📋' },
            { label: 'Avg Productivity', value: '2.3x', emoji: '⚡' }
          ].map((stat, i) => (
            <div key={i} className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-4">
              <div className="text-2xl mb-1">{stat.emoji}</div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-700">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-all border-b-2 -mb-[2px] ${
                activeTab === tab.id
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
              {tab.id === 'requests' && requests.filter(r => r.status === 'PENDING').length > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {requests.filter(r => r.status === 'PENDING').length}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <>
            {/* Browse Tab */}
            {activeTab === 'browse' && (
              <div className="space-y-6">
                {/* Search & Filter */}
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                    <input
                      type="text"
                      placeholder="Search by name, skill, or expertise..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Twin Type Filter */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {TWIN_TYPES.map(type => (
                    <button
                      key={type.id}
                      onClick={() => setSelectedTwinType(type.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                        selectedTwinType === type.id
                          ? `bg-gradient-to-r ${type.color} text-white`
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      <span>{type.emoji}</span>
                      {type.name}
                    </button>
                  ))}
                </div>

                {/* Twin Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTwins.map(twin => (
                    <div
                      key={twin.twinId}
                      className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6 hover:border-purple-500/50 transition-all cursor-pointer"
                      onClick={() => setSelectedTwin(twin)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${TWIN_TYPES.find(t => t.id === twin.twinType)?.color || 'from-gray-500 to-gray-600'} flex items-center justify-center`}>
                          <span className="text-2xl">{TWIN_TYPES.find(t => t.id === twin.twinType)?.emoji}</span>
                        </div>
                        <span className="px-2 py-1 rounded text-xs font-medium bg-purple-500/20 text-purple-400">
                          {twin.highlight}
                        </span>
                      </div>

                      <h3 className="text-lg font-semibold text-white mb-1">{twin.ownerName}</h3>
                      <p className="text-gray-400 text-sm mb-3">
                        {TWIN_TYPES.find(t => t.id === twin.twinType)?.name} Twin
                      </p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {twin.expertise.slice(0, 3).map(skill => (
                          <span key={skill} className="px-2 py-1 bg-gray-700/50 rounded text-xs text-gray-300">{skill}</span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <div className="text-center">
                          <div className="text-xl font-bold text-white">{twin.metrics.productivityMultiplier}x</div>
                          <div className="text-xs text-gray-500">Productivity</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-white">{twin.metrics.combinedScore}</div>
                          <div className="text-xs text-gray-500">Score</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-white">{twin.learningHours}</div>
                          <div className="text-xs text-gray-500">Hours</div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => { e.stopPropagation(); handleHire(twin); }}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-medium transition-colors"
                      >
                        Hire Twin
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* My Hires Tab */}
            {activeTab === 'my-hires' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {myHires.map(twin => (
                    <div key={twin.twinId} className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${TWIN_TYPES.find(t => t.id === twin.twinType)?.color || 'from-gray-500 to-gray-600'} flex items-center justify-center`}>
                          <span>{TWIN_TYPES.find(t => t.id === twin.twinType)?.emoji}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{twin.ownerName}</h3>
                          <p className="text-sm text-gray-400">{twin.twinType} Twin</p>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Productivity</span>
                          <span className="text-white font-medium">{twin.metrics.productivityMultiplier}x</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Invocations</span>
                          <span className="text-white font-medium">247</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Satisfaction</span>
                          <span className="text-green-400 font-medium">4.8/5</span>
                        </div>
                      </div>

                      <button className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg font-medium transition-colors">
                        Manage Access
                      </button>
                    </div>
                  ))}
                </div>

                <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-2">Workforce Summary</h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <div className="text-2xl font-bold text-green-400">+6.9x</div>
                      <div className="text-sm text-gray-400">Total Productivity</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">741</div>
                      <div className="text-sm text-gray-400">Total Invocations</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">4.8</div>
                      <div className="text-sm text-gray-400">Avg Satisfaction</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">₹45,000</div>
                      <div className="text-sm text-gray-400">Monthly Value</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Requests Tab */}
            {activeTab === 'requests' && (
              <div className="space-y-4">
                {requests.map(request => (
                  <div key={request.grantId} className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${TWIN_TYPES.find(t => t.id === request.twinType)?.color || 'from-gray-500 to-gray-600'} flex items-center justify-center`}>
                          <span>{TWIN_TYPES.find(t => t.id === request.twinType)?.emoji}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{request.ownerName}</h3>
                          <p className="text-sm text-gray-400">
                            {request.twinType} Twin • Requested by {request.companyName}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">{request.createdAt}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {request.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApprove(request.grantId)}
                              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(request.grantId)}
                              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {request.status === 'APPROVED' && (
                          <span className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg font-medium">Approved</span>
                        )}
                        {request.status === 'REJECTED' && (
                          <span className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg font-medium">Rejected</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Productivity by Twin Type</h3>
                    <div className="space-y-3">
                      {['EXECUTION', 'SKILL', 'KNOWLEDGE', 'CAREER', 'PRODUCTIVITY'].map((type, i) => (
                        <div key={type}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-400">{type}</span>
                            <span className="text-white">{(5 - i) * 0.5 + 1.5}x</span>
                          </div>
                          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full bg-gradient-to-r ${TWIN_TYPES.find(t => t.id === type)?.color || 'from-gray-500 to-gray-600'} rounded-full`}
                              style={{ width: `${((5 - i) * 0.5 + 1.5) / 4 * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">ROI Summary</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Twin Investment</span>
                        <span className="text-white font-medium">₹30,000/mo</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Productivity Gain</span>
                        <span className="text-green-400 font-medium">+6.9x</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Equivalent Hires Saved</span>
                        <span className="text-white font-medium">3.5 employees</span>
                      </div>
                      <div className="border-t border-gray-700 pt-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Net Value</span>
                          <span className="text-green-400 font-bold text-xl">₹2,45,000/mo</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Twin Detail Modal */}
        {selectedTwin && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 z-50">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 max-w-2xl w-full">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${TWIN_TYPES.find(t => t.id === selectedTwin.twinType)?.color || 'from-gray-500 to-gray-600'} flex items-center justify-center`}>
                    <span className="text-3xl">{TWIN_TYPES.find(t => t.id === selectedTwin.twinType)?.emoji}</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedTwin.ownerName}</h2>
                    <p className="text-gray-400">{TWIN_TYPES.find(t => t.id === selectedTwin.twinType)?.name} Twin</p>
                  </div>
                </div>
                <button onClick={() => setSelectedTwin(null)} className="text-gray-400 hover:text-white text-2xl">×</button>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-900/50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-white mb-1">{selectedTwin.metrics.productivityMultiplier}x</div>
                  <div className="text-sm text-gray-400">Productivity</div>
                </div>
                <div className="bg-gray-900/50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-white mb-1">{selectedTwin.metrics.combinedScore}</div>
                  <div className="text-sm text-gray-400">Combined Score</div>
                </div>
                <div className="bg-gray-900/50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-white mb-1">{selectedTwin.learningHours}</div>
                  <div className="text-sm text-gray-400">Training Hours</div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Expertise</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedTwin.expertise.map(skill => (
                    <span key={skill} className="px-3 py-1 bg-gray-700 rounded-lg text-sm text-white">{skill}</span>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { handleHire(selectedTwin); setSelectedTwin(null); }}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Hire Twin
                </button>
                <button
                  onClick={() => setSelectedTwin(null)}
                  className="px-6 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
