'use client';

import { useState, useEffect } from 'react';
import { Brain, Users, TrendingUp, Award, ChevronRight, Activity, Zap, Target, Shield, Plus, BarChart3, Search, Star, Briefcase, GraduationCap, Clock, CheckCircle, AlertCircle } from 'lucide-react';

// Types
interface Twin {
  twinId: string;
  twinType: string;
  twinTypeName: string;
  status: string;
  metrics: {
    productivityMultiplier: number;
    knowledgeScore: number;
    executionScore: number;
    reliabilityScore: number;
    combinedScore: number;
  };
}

interface TwinSet {
  ownerCorpId: string;
  ownerName: string;
  twinCount: number;
  combinedProductivity: string;
  twins: Twin[];
}

interface MarketplaceTwin {
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

// Twin type configuration
const TWIN_TYPES = {
  KNOWLEDGE: {
    name: 'Knowledge Twin',
    icon: Brain,
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-500/20',
    description: 'Knows everything you know',
    learnFrom: ['SkillNet', 'Work', 'Memory'],
    purpose: 'What you know'
  },
  SKILL: {
    name: 'Skill Twin',
    icon: Target,
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-500/20',
    description: 'Can do everything you can do',
    learnFrom: ['SkillNet', 'Feedback', 'Projects'],
    purpose: 'What you can do'
  },
  CAREER: {
    name: 'Career Twin',
    icon: TrendingUp,
    color: 'from-purple-500 to-violet-500',
    bgColor: 'bg-purple-500/20',
    description: 'Tracks where you\'re going',
    learnFrom: ['Work', 'Goals', 'Feedback'],
    purpose: 'Where you\'re going'
  },
  PRODUCTIVITY: {
    name: 'Productivity Twin',
    icon: Zap,
    color: 'from-yellow-500 to-orange-500',
    bgColor: 'bg-yellow-500/20',
    description: 'Optimizes how you work',
    learnFrom: ['Work patterns', 'Calendar'],
    purpose: 'How you work'
  },
  EXECUTION: {
    name: 'Execution Twin',
    icon: Activity,
    color: 'from-red-500 to-pink-500',
    bgColor: 'bg-red-500/20',
    description: 'Delegates tasks to AI',
    learnFrom: ['Projects', 'Performance'],
    purpose: 'What you delegate'
  }
};

export default function TwinDashboard() {
  const [activeTab, setActiveTab] = useState<'my-twins' | 'marketplace' | 'analytics'>('my-twins');
  const [twins, setTwins] = useState<TwinSet | null>(null);
  const [marketplaceTwins, setMarketplaceTwins] = useState<MarketplaceTwin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Sample corpId (in real app, this would come from auth)
  const sampleCorpId = 'CI-IND-EMP01';

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);

    // Simulated data - in real app, this would be API calls
    setTimeout(() => {
      if (activeTab === 'my-twins') {
        setTwins({
          ownerCorpId: sampleCorpId,
          ownerName: 'You',
          twinCount: 5,
          combinedProductivity: '8.5',
          twins: [
            { twinId: `${sampleCorpId}-KNOWLEDGE`, twinType: 'KNOWLEDGE', twinTypeName: 'Knowledge Twin', status: 'ACTIVE', metrics: { productivityMultiplier: 1.5, knowledgeScore: 85, executionScore: 60, reliabilityScore: 92, combinedScore: 79 } },
            { twinId: `${sampleCorpId}-SKILL`, twinType: 'SKILL', twinTypeName: 'Skill Twin', status: 'ACTIVE', metrics: { productivityMultiplier: 2.5, knowledgeScore: 70, executionScore: 88, reliabilityScore: 94, combinedScore: 84 } },
            { twinId: `${sampleCorpId}-CAREER`, twinType: 'CAREER', twinTypeName: 'Career Twin', status: 'ACTIVE', metrics: { productivityMultiplier: 1.0, knowledgeScore: 75, executionScore: 50, reliabilityScore: 98, combinedScore: 74 } },
            { twinId: `${sampleCorpId}-PRODUCTIVITY`, twinType: 'PRODUCTIVITY', twinTypeName: 'Productivity Twin', status: 'ACTIVE', metrics: { productivityMultiplier: 1.5, knowledgeScore: 60, executionScore: 80, reliabilityScore: 96, combinedScore: 79 } },
            { twinId: `${sampleCorpId}-EXECUTION`, twinType: 'EXECUTION', twinTypeName: 'Execution Twin', status: 'TRAINING', metrics: { productivityMultiplier: 3.0, knowledgeScore: 50, executionScore: 92, reliabilityScore: 88, combinedScore: 77 } }
          ]
        });
      } else if (activeTab === 'marketplace') {
        setMarketplaceTwins([
          { twinId: 'TWIN-CI-IND-001-KNOWLEDGE', ownerName: 'Rahul S.', twinType: 'KNOWLEDGE', expertise: ['Python', 'System Design', 'ML'], metrics: { combinedScore: 92, productivityMultiplier: 1.8, reliabilityScore: 96 }, learningHours: 2500, highlight: 'Highly Trained' },
          { twinId: 'TWIN-CI-IND-002-SKILL', ownerName: 'Priya P.', twinType: 'SKILL', expertise: ['Figma', 'UI/UX', 'Design Systems'], metrics: { combinedScore: 88, productivityMultiplier: 2.2, reliabilityScore: 94 }, learningHours: 1800, highlight: 'High Productivity' },
          { twinId: 'TWIN-CI-IND-003-EXECUTION', ownerName: 'Amit K.', twinType: 'EXECUTION', expertise: ['Sales', 'Negotiation', 'CRM'], metrics: { combinedScore: 85, productivityMultiplier: 3.1, reliabilityScore: 91 }, learningHours: 1200, highlight: 'Top Rated' },
          { twinId: 'TWIN-CI-IND-004-SKILL', ownerName: 'Sneha R.', twinType: 'SKILL', expertise: ['Data Science', 'Python', 'Analytics'], metrics: { combinedScore: 90, productivityMultiplier: 2.4, reliabilityScore: 93 }, learningHours: 2100, highlight: 'Rising Star' },
          { twinId: 'TWIN-CI-IND-005-PRODUCTIVITY', ownerName: 'Vikram S.', twinType: 'PRODUCTIVITY', expertise: ['Project Management', 'Agile', 'Leadership'], metrics: { combinedScore: 86, productivityMultiplier: 1.7, reliabilityScore: 97 }, learningHours: 1600, highlight: 'Highly Trained' }
        ]);
      }
      setLoading(false);
    }, 500);
  };

  const filteredMarketplace = marketplaceTwins.filter(t =>
    t.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.expertise.some(e => e.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Professional Twin Dashboard
              </h1>
              <p className="text-gray-400">
                Your AI Workforce - Employee-Owned Professional Twins
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 rounded-lg">
                <div className="text-2xl font-bold text-white">{twins?.combinedProductivity || '0'}x</div>
                <div className="text-xs text-white/80">Combined Productivity</div>
              </div>
            </div>
          </div>
        </header>

        {/* Concept Banner */}
        <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-500/30 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-8">
            <div className="flex-1">
              <div className="text-sm text-purple-400 mb-1">Today</div>
              <div className="text-xl text-white font-semibold">Company → Hire 1 Human</div>
            </div>
            <ChevronRight className="text-purple-400" size={32} />
            <div className="flex-1">
              <div className="text-sm text-green-400 mb-1">Future</div>
              <div className="text-xl text-white font-semibold">Company → Hire 1 Human + N Professional Twins</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {[
            { id: 'my-twins', label: 'My Twins', icon: Brain },
            { id: 'marketplace', label: 'Marketplace', icon: Search },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <tab.icon size={20} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        ) : activeTab === 'my-twins' && twins ? (
          <div className="space-y-6">
            {/* Twin Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {twins.twins.map(twin => {
                const config = TWIN_TYPES[twin.twinType as keyof typeof TWIN_TYPES];
                const Icon = config?.icon || Brain;

                return (
                  <div key={twin.twinId} className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6 hover:border-purple-500/50 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${config?.color || 'from-gray-500 to-gray-600'} flex items-center justify-center`}>
                        <Icon className="text-white" size={24} />
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        twin.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {twin.status}
                      </span>
                    </div>

                    <h3 className="text-xl font-semibold text-white mb-1">{config?.name}</h3>
                    <p className="text-gray-400 text-sm mb-4">{config?.description}</p>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-gray-900/50 rounded-lg p-3">
                        <div className="text-2xl font-bold text-white">{twin.metrics.productivityMultiplier}x</div>
                        <div className="text-xs text-gray-500">Productivity</div>
                      </div>
                      <div className="bg-gray-900/50 rounded-lg p-3">
                        <div className="text-2xl font-bold text-white">{twin.metrics.combinedScore}</div>
                        <div className="text-xs text-gray-500">Combined Score</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Knowledge</span>
                        <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${twin.metrics.knowledgeScore}%` }} />
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Execution</span>
                        <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: `${twin.metrics.executionScore}%` }} />
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Reliability</span>
                        <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500 rounded-full" style={{ width: `${twin.metrics.reliabilityScore}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Create New Twin */}
            <button className="w-full bg-gray-800/50 border-2 border-dashed border-gray-600 rounded-xl p-8 flex flex-col items-center justify-center gap-3 hover:border-purple-500/50 transition-all">
              <Plus className="text-gray-400" size={32} />
              <span className="text-gray-400 font-medium">Create New Twin</span>
            </button>
          </div>
        ) : activeTab === 'marketplace' ? (
          <div className="space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search twins by name, skill, or expertise..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Featured Twins */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMarketplace.map(twin => {
                const config = TWIN_TYPES[twin.twinType as keyof typeof TWIN_TYPES];
                const Icon = config?.icon || Brain;

                return (
                  <div key={twin.twinId} className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6 hover:border-purple-500/50 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${config?.color || 'from-gray-500 to-gray-600'} flex items-center justify-center`}>
                        <Icon className="text-white" size={24} />
                      </div>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-purple-500/20 text-purple-400">
                        {twin.highlight}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-white mb-1">{twin.ownerName}</h3>
                    <p className="text-gray-400 text-sm mb-3">{config?.name}</p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {twin.expertise.slice(0, 3).map(skill => (
                        <span key={skill} className="px-2 py-1 bg-gray-700/50 rounded text-xs text-gray-300">{skill}</span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-xl font-bold text-white">{twin.metrics.productivityMultiplier}x</div>
                        <div className="text-xs text-gray-500">Productivity</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-white">{twin.metrics.combinedScore}</div>
                        <div className="text-xs text-gray-500">Score</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-white">{twin.learningHours}</div>
                        <div className="text-xs text-gray-500">Hours</div>
                      </div>
                    </div>

                    <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-medium transition-colors">
                      Hire Twin
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Analytics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Total Twins', value: twins?.twinCount || 0, icon: Brain, color: 'from-blue-500 to-cyan-500' },
                { label: 'Combined Productivity', value: `${twins?.combinedProductivity || 0}x`, icon: Zap, color: 'from-yellow-500 to-orange-500' },
                { label: 'Training Hours', value: '12,500', icon: Clock, color: 'from-green-500 to-emerald-500' },
                { label: 'Companies Accessing', value: '3', icon: Briefcase, color: 'from-purple-500 to-violet-500' }
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div key={i} className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                      <Icon className="text-white" size={20} />
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                    <div className="text-sm text-gray-400">{stat.label}</div>
                  </div>
                );
              })}
            </div>

            {/* Value Proposition */}
            <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Shield className="text-green-400" size={24} />
                Your Professional Twin Value
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-400 mb-2">{twins?.combinedProductivity || 0}x</div>
                  <div className="text-gray-400">Productivity Multiplier</div>
                  <div className="text-xs text-gray-500 mt-1">Baseline vs AI-Augmented</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-400 mb-2">5</div>
                  <div className="text-gray-400">Professional Skills</div>
                  <div className="text-xs text-gray-500 mt-1">Knowledge, Skill, Career, Productivity, Execution</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-purple-400 mb-2">100%</div>
                  <div className="text-gray-400">Ownership</div>
                  <div className="text-xs text-gray-500 mt-1">You own your twins, not companies</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
