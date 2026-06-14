'use client';

import { useState } from 'react';
import {
  Radar, Target, Users, Mail, Phone, MessageSquare,
  TrendingUp, Building2, User, Zap, Sparkles, GitCompare,
  BarChart3, Calendar, Bot, MessageCircle, DollarSign,
  CheckCircle, Clock, AlertCircle, ArrowUpRight, ArrowDownRight,
  Search, Filter, Download, RefreshCw, ChevronRight, Layers
} from 'lucide-react';

// Mock data for v2 dashboard
const mockMetrics = {
  totalLeads: 1247,
  qualifiedLeads: 423,
  meetingsBooked: 156,
  revenue: 2847500,
  leadsGrowth: 12.5,
  qualifiedGrowth: 8.3,
  meetingsGrowth: 15.2,
  revenueGrowth: 22.1,
};

const mockIntelligence = {
  highIntent: 89,
  mediumIntent: 234,
  icpMatches: 312,
  recentSignals: 45,
};

const mockEngageStats = {
  emailsSent: 8934,
  emailsOpenRate: 42.3,
  emailsReplyRate: 8.7,
  whatsappSent: 2341,
  smsSent: 5678,
  callsMade: 1234,
  callConnectRate: 67.2,
};

const mockPipeline = [
  { stage: 'Prospect', count: 234, value: 4500000, color: 'bg-blue-500' },
  { stage: 'Qualified', count: 123, value: 8900000, color: 'bg-purple-500' },
  { stage: 'Proposal', count: 67, value: 12000000, color: 'bg-orange-500' },
  { stage: 'Negotiation', count: 34, value: 8500000, color: 'bg-yellow-500' },
  { stage: 'Closed', count: 28, value: 10500000, color: 'bg-green-500' },
];

const mockRecentActivity = [
  { type: 'email', action: 'Email opened by Sarah Chen', company: 'TechCorp India', time: '2 min ago', icon: Mail },
  { type: 'meeting', action: 'Meeting booked with Raj Patel', company: 'StartupXYZ', time: '15 min ago', icon: Calendar },
  { type: 'qualify', action: 'Lead qualified: Enterprise tier', company: 'GlobalTech Ltd', time: '32 min ago', icon: CheckCircle },
  { type: 'intent', action: 'High intent signal detected', company: 'InnovateCo', time: '1 hour ago', icon: Zap },
  { type: 'research', action: 'Company research completed', company: 'ScaleUp Inc', time: '2 hours ago', icon: Search },
];

const mockCompanyIntelligence = [
  { name: 'TechCorp India', revenue: '$50M', employees: 500, intent: 'high', signals: ['New funding', 'Hiring SDRs', 'Expanding'] },
  { name: 'StartupXYZ', revenue: '$10M', employees: 100, intent: 'medium', signals: ['Website update', 'New product'] },
  { name: 'GlobalTech Ltd', revenue: '$200M', employees: 2000, intent: 'high', signals: ['Competitor switch', 'Enterprise ready'] },
  { name: 'InnovateCo', revenue: '$25M', employees: 250, intent: 'low', signals: ['Review spike'] },
];

const mockAiWorkers = [
  { name: 'SDR Agent', status: 'active', tasks: 45, icon: Bot },
  { name: 'Research Agent', status: 'active', tasks: 23, icon: Search },
  { name: 'Qualification Agent', status: 'active', tasks: 12, icon: CheckCircle },
  { name: 'Meeting Agent', status: 'idle', tasks: 0, icon: Calendar },
];

const mockSequences = [
  { name: 'Enterprise Outreach', steps: 8, active: 234, engaged: 89, replied: 34 },
  { name: 'Follow-up Sequence', steps: 5, active: 156, engaged: 67, replied: 28 },
  { name: 'Demo Request', steps: 6, active: 78, engaged: 45, replied: 19 },
];

export default function AtlasDashboardV2() {
  const [activeTab, setActiveTab] = useState<'overview' | 'intelligence' | 'engage' | 'pipeline' | 'ai'>('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Layers },
    { id: 'intelligence', label: 'Intelligence', icon: Radar },
    { id: 'engage', label: 'Engage', icon: Mail },
    { id: 'pipeline', label: 'Pipeline', icon: BarChart3 },
    { id: 'ai', label: 'AI Workforce', icon: Bot },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Radar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">REZ Atlas v2</h1>
                <p className="text-xs text-gray-500">Revenue Intelligence Platform</p>
              </div>
            </div>

            {/* Tab Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                <RefreshCw className="w-5 h-5" />
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Zap className="w-4 h-4" />
                Launch Campaign
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricCard
                title="Total Leads"
                value={mockMetrics.totalLeads.toLocaleString()}
                growth={mockMetrics.leadsGrowth}
                icon={Users}
                color="blue"
              />
              <MetricCard
                title="Qualified Leads"
                value={mockMetrics.qualifiedLeads.toLocaleString()}
                growth={mockMetrics.qualifiedGrowth}
                icon={Target}
                color="purple"
              />
              <MetricCard
                title="Meetings Booked"
                value={mockMetrics.meetingsBooked.toLocaleString()}
                growth={mockMetrics.meetingsGrowth}
                icon={Calendar}
                color="green"
              />
              <MetricCard
                title="Pipeline Value"
                value={`₹${(mockMetrics.revenue / 100000).toFixed(1)}L`}
                growth={mockMetrics.revenueGrowth}
                icon={DollarSign}
                color="orange"
              />
            </div>

            {/* Intelligence Summary */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 mb-8 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  <h2 className="text-lg font-semibold">Intelligence Summary</h2>
                </div>
                <button className="text-sm bg-white/20 px-3 py-1 rounded-full hover:bg-white/30">
                  View All Signals
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="text-2xl font-bold">{mockIntelligence.highIntent}</div>
                  <div className="text-sm text-white/80">High Intent</div>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="text-2xl font-bold">{mockIntelligence.mediumIntent}</div>
                  <div className="text-sm text-white/80">Medium Intent</div>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="text-2xl font-bold">{mockIntelligence.icpMatches}</div>
                  <div className="text-sm text-white/80">ICP Matches</div>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="text-2xl font-bold">{mockIntelligence.recentSignals}</div>
                  <div className="text-sm text-white/80">Recent Signals</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Recent Activity */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {mockRecentActivity.map((activity, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                        <activity.icon className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                        <p className="text-xs text-gray-500">{activity.company} • {activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Workforce Status */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Workforce</h3>
                <div className="space-y-3">
                  {mockAiWorkers.map((worker, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          worker.status === 'active' ? 'bg-green-100' : 'bg-gray-200'
                        }`}>
                          <worker.icon className={`w-5 h-5 ${
                            worker.status === 'active' ? 'text-green-600' : 'text-gray-500'
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{worker.name}</p>
                          <p className="text-xs text-gray-500">
                            {worker.status === 'active' ? `${worker.tasks} tasks running` : 'Idle'}
                          </p>
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        worker.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {worker.status === 'active' ? 'Active' : 'Idle'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Company Intelligence Feed */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Company Intelligence</h3>
                <div className="flex items-center gap-2">
                  <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                    <Filter className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-500 border-b">
                      <th className="pb-3 font-medium">Company</th>
                      <th className="pb-3 font-medium">Revenue</th>
                      <th className="pb-3 font-medium">Employees</th>
                      <th className="pb-3 font-medium">Intent</th>
                      <th className="pb-3 font-medium">Signals</th>
                      <th className="pb-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockCompanyIntelligence.map((company, i) => (
                      <tr key={i} className="border-b border-gray-50 last:border-0">
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-gray-400" />
                            <span className="font-medium text-gray-900">{company.name}</span>
                          </div>
                        </td>
                        <td className="py-4 text-gray-600">{company.revenue}</td>
                        <td className="py-4 text-gray-600">{company.employees}</td>
                        <td className="py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            company.intent === 'high' ? 'bg-green-100 text-green-700' :
                            company.intent === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {company.intent}
                          </span>
                        </td>
                        <td className="py-4">
                          <div className="flex gap-1">
                            {company.signals.map((signal, j) => (
                              <span key={j} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded">
                                {signal}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-4">
                          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Intelligence Tab */}
        {activeTab === 'intelligence' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Intelligence Layer</h2>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                  <Search className="w-4 h-4" />
                  Search Companies
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Zap className="w-4 h-4" />
                  Research Now
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <IntelligenceCard
                title="Company Twin"
                description="Deep company intelligence with funding, tech stack, and buying signals"
                services={['Revenue estimation', 'Funding analysis', 'Tech detection', 'Hiring signals']}
                icon={Building2}
                color="blue"
              />
              <IntelligenceCard
                title="Person Twin"
                description="Contact intelligence with email finding, seniority detection"
                services={['Email discovery', 'Phone finding', 'Seniority scoring', 'LinkedIn enrichment']}
                icon={User}
                color="purple"
              />
              <IntelligenceCard
                title="Intent Engine"
                description="Real-time intent signal detection and ICP matching"
                services={['Hiring intent', 'Funding signals', 'Review spikes', 'Expansion signals']}
                icon={Target}
                color="green"
              />
              <IntelligenceCard
                title="Research Agent"
                description="AI-powered deep research on companies and contacts"
                services={['Website analysis', 'Review mining', 'Competitor intel', 'News tracking']}
                icon={Search}
                color="orange"
              />
              <IntelligenceCard
                title="Enrichment"
                description="Multi-source data enrichment from 50+ providers"
                services={['Clearbit', 'Apollo', 'Hunter', 'ZoomInfo']}
                icon={GitCompare}
                color="red"
              />
              <IntelligenceCard
                title="Lookalike Engine"
                description="Find similar companies matching your best customers"
                services={['ICP matching', 'Firmographic match', 'Behavioral match', 'Expansion zones']}
                icon={Sparkles}
                color="indigo"
              />
            </div>

            {/* Live Intent Signals */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Intent Signals</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <SignalCard type="hiring" count={23} trend="up" description="SDRs & AEs hired" />
                <SignalCard type="funding" count={8} trend="up" description="Recent funding rounds" />
                <SignalCard type="tech" count={45} trend="up" description="Tech stack changes" />
                <SignalCard type="reviews" count={34} trend="up" description="Review activity" />
              </div>
            </div>
          </div>
        )}

        {/* Engage Tab */}
        {activeTab === 'engage' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Engage Layer</h2>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Mail className="w-4 h-4" />
                Create Sequence
              </button>
            </div>

            {/* Engagement Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <EngageCard
                title="Email Campaigns"
                sent={mockEngageStats.emailsSent}
                openRate={mockEngageStats.emailsOpenRate}
                replyRate={mockEngageStats.emailsReplyRate}
                icon={Mail}
                color="blue"
              />
              <EngageCard
                title="WhatsApp"
                sent={mockEngageStats.whatsappSent}
                openRate={95}
                replyRate={42}
                icon={MessageCircle}
                color="green"
              />
              <EngageCard
                title="SMS Campaigns"
                sent={mockEngageStats.smsSent}
                openRate={98}
                replyRate={15}
                icon={MessageSquare}
                color="purple"
              />
              <EngageCard
                title="Calls"
                made={mockEngageStats.callsMade}
                connectRate={mockEngageStats.callConnectRate}
                icon={Phone}
                color="orange"
              />
            </div>

            {/* Active Sequences */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Sequences</h3>
              <div className="space-y-4">
                {mockSequences.map((seq, i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">{seq.name}</h4>
                      <span className="text-sm text-gray-500">{seq.steps} steps</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-lg font-bold text-gray-900">{seq.active}</div>
                        <div className="text-xs text-gray-500">Active</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-blue-600">{seq.engaged}</div>
                        <div className="text-xs text-gray-500">Engaged</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-green-600">{seq.replied}</div>
                        <div className="text-xs text-gray-500">Replied</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Deliverability */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Deliverability</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <DeliverabilityCard title="Domain Health" score={94} status="good" />
                <DeliverabilityCard title="Warmup Status" score={78} status="moderate" />
                <DeliverabilityCard title="Bounce Rate" score={2.1} status="good" invertScore />
                <DeliverabilityCard title="Spam Score" score={3} status="good" invertScore />
              </div>
            </div>
          </div>
        )}

        {/* Pipeline Tab */}
        {activeTab === 'pipeline' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Pipeline & CRM</h2>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                  <Download className="w-4 h-4" />
                  Export
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <TrendingUp className="w-4 h-4" />
                  Forecast
                </button>
              </div>
            </div>

            {/* Pipeline Visualization */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Sales Pipeline</h3>
              <div className="flex gap-2">
                {mockPipeline.map((stage, i) => (
                  <div key={i} className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">{stage.stage}</span>
                      <span className="text-xs text-gray-500">{stage.count}</span>
                    </div>
                    <div className="h-48 bg-gray-100 rounded-lg overflow-hidden relative">
                      <div
                        className={`${stage.color} absolute bottom-0 w-full transition-all`}
                        style={{ height: `${(stage.value / 12000000) * 100}%` }}
                      />
                    </div>
                    <div className="text-sm font-bold text-gray-900 mt-2">
                      ₹{(stage.value / 100000).toFixed(0)}L
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Forecast */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Forecast</h3>
                <div className="space-y-4">
                  <ForecastItem label="Predicted" value={mockMetrics.revenue * 1.15} color="blue" />
                  <ForecastItem label="Committed" value={mockMetrics.revenue * 0.85} color="green" />
                  <ForecastItem label="Best Case" value={mockMetrics.revenue * 1.35} color="purple" />
                  <ForecastItem label="Target" value={mockMetrics.revenue * 1.2} color="orange" />
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Deal Sources</h3>
                <div className="space-y-3">
                  <DealSourceItem source="Intelligence Layer" deals={45} percentage={35} />
                  <DealSourceItem source="Inbound" deals={32} percentage={25} />
                  <DealSourceItem source="Referrals" deals={28} percentage={22} />
                  <DealSourceItem source="Cold Outreach" deals={23} percentage={18} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Workforce Tab */}
        {activeTab === 'ai' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">AI Workforce</h2>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Bot className="w-4 h-4" />
                Add AI Agent
              </button>
            </div>

            {/* AI Agents Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AIAgentCard
                name="SDR Agent"
                description="Autonomous outbound prospecting - research, email, reply handling"
                status="active"
                tasksCompleted={1247}
                responseRate={42}
                meetingsBooked={156}
              />
              <AIAgentCard
                name="Research Agent"
                description="Deep company and contact research with multi-source enrichment"
                status="active"
                tasksCompleted={892}
                accuracy={94}
              />
              <AIAgentCard
                name="Qualification Agent"
                description="BANT/MEDDIC qualification with dynamic scoring"
                status="active"
                tasksCompleted={423}
                accuracy={91}
              />
              <AIAgentCard
                name="Meeting Agent"
                description="Calendar sync, scheduling, and meeting reminders"
                status="active"
                tasksCompleted={156}
                noShowRate={3}
              />
              <AIAgentCard
                name="Follow-up Agent"
                description="Multi-channel follow-up with personalization"
                status="active"
                tasksCompleted={678}
                followUpRate={89}
              />
              <AIAgentCard
                name="Conversation Intel"
                description="Call transcription and objection extraction"
                status="active"
                callsAnalyzed={234}
                objectionsIdentified={89}
              />
            </div>

            {/* Performance Metrics */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Performance Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <PerformanceMetric label="Research Accuracy" value={94} unit="%" />
                <PerformanceMetric label="Qualification Speed" value={2.3} unit="min" />
                <PerformanceMetric label="Meeting Book Rate" value={23} unit="%" />
                <PerformanceMetric label="Avg Response Time" value={45} unit="sec" />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Component helpers
function MetricCard({ title, value, growth, icon: Icon, color }: {
  title: string;
  value: string;
  growth: number;
  icon: any;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className={`flex items-center gap-1 text-sm font-medium ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {growth >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          {Math.abs(growth)}%
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm text-gray-500">{title}</div>
    </div>
  );
}

function IntelligenceCard({ title, description, services, icon: Icon, color }: {
  title: string;
  description: string;
  services: string[];
  icon: any;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
    indigo: 'bg-indigo-50 text-indigo-600',
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${colorClasses[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-4">{description}</p>
      <div className="flex flex-wrap gap-2">
        {services.map((service, i) => (
          <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
            {service}
          </span>
        ))}
      </div>
    </div>
  );
}

function SignalCard({ type, count, trend, description }: {
  type: string;
  count: number;
  trend: string;
  description: string;
}) {
  return (
    <div className="p-4 bg-gray-50 rounded-xl">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-500 uppercase">{type}</span>
        {trend === 'up' ? (
          <ArrowUpRight className="w-4 h-4 text-green-600" />
        ) : (
          <ArrowDownRight className="w-4 h-4 text-red-600" />
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900">{count}</div>
      <div className="text-xs text-gray-500">{description}</div>
    </div>
  );
}

function EngageCard({ title, sent, openRate, replyRate, icon: Icon, color, made, connectRate }: {
  title: string;
  sent?: number;
  made?: number;
  openRate: number;
  replyRate?: number;
  icon: any;
  color: string;
  connectRate?: number;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${colorClasses[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="font-medium text-gray-900 mb-2">{title}</h3>
      {sent && <div className="text-2xl font-bold text-gray-900">{sent.toLocaleString()}</div>}
      {made && <div className="text-2xl font-bold text-gray-900">{made.toLocaleString()}</div>}
      <div className="text-sm text-gray-500 mb-3">
        {sent ? 'Sent' : made ? 'Made' : ''}
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Open Rate</span>
          <span className="font-medium text-gray-900">{openRate}%</span>
        </div>
        {replyRate && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Reply Rate</span>
            <span className="font-medium text-gray-900">{replyRate}%</span>
          </div>
        )}
        {connectRate && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Connect Rate</span>
            <span className="font-medium text-gray-900">{connectRate}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

function DeliverabilityCard({ title, score, status, invertScore }: {
  title: string;
  score: number;
  status: string;
  invertScore?: boolean;
}) {
  const displayScore = invertScore ? Math.max(100 - score, 0) : score;
  const scoreColor = status === 'good' ? 'text-green-600' : status === 'moderate' ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="p-4 bg-gray-50 rounded-xl">
      <div className="text-sm text-gray-500 mb-1">{title}</div>
      <div className={`text-2xl font-bold ${scoreColor}`}>{score}{invertScore ? '%' : '/100'}</div>
      <div className="flex items-center gap-1 mt-1">
        {status === 'good' ? (
          <CheckCircle className="w-3 h-3 text-green-600" />
        ) : status === 'moderate' ? (
          <Clock className="w-3 h-3 text-yellow-600" />
        ) : (
          <AlertCircle className="w-3 h-3 text-red-600" />
        )}
        <span className="text-xs text-gray-500 capitalize">{status}</span>
      </div>
    </div>
  );
}

function ForecastItem({ label, value, color }: { label: string; value: number; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
  };

  return (
    <div className="flex items-center gap-4">
      <div className={`w-3 h-3 rounded-full ${colorClasses[color]}`} />
      <div className="flex-1">
        <div className="text-sm text-gray-500">{label}</div>
      </div>
      <div className="font-semibold text-gray-900">₹{(value / 100000).toFixed(1)}L</div>
    </div>
  );
}

function DealSourceItem({ source, deals, percentage }: { source: string; deals: number; percentage: number }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-600">{source}</span>
        <span className="text-sm font-medium text-gray-900">{deals} ({percentage}%)</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function AIAgentCard({ name, description, status, tasksCompleted, responseRate, meetingsBooked, accuracy, noShowRate, followUpRate, callsAnalyzed, objectionsIdentified }: {
  name: string;
  description: string;
  status: string;
  tasksCompleted: number;
  responseRate?: number;
  meetingsBooked?: number;
  accuracy?: number;
  noShowRate?: number;
  followUpRate?: number;
  callsAnalyzed?: number;
  objectionsIdentified?: number;
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
          <Bot className="w-6 h-6 text-blue-600" />
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
        }`}>
          {status === 'active' ? 'Active' : 'Idle'}
        </span>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{name}</h3>
      <p className="text-sm text-gray-500 mb-4">{description}</p>
      <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-100">
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">{tasksCompleted}</div>
          <div className="text-xs text-gray-500">Tasks</div>
        </div>
        {responseRate && (
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">{responseRate}%</div>
            <div className="text-xs text-gray-500">Response</div>
          </div>
        )}
        {meetingsBooked && (
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">{meetingsBooked}</div>
            <div className="text-xs text-gray-500">Meetings</div>
          </div>
        )}
        {accuracy && (
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">{accuracy}%</div>
            <div className="text-xs text-gray-500">Accuracy</div>
          </div>
        )}
        {noShowRate && (
          <div className="text-center">
            <div className="text-lg font-bold text-orange-600">{noShowRate}%</div>
            <div className="text-xs text-gray-500">No-Show</div>
          </div>
        )}
        {followUpRate && (
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">{followUpRate}%</div>
            <div className="text-xs text-gray-500">Follow-up</div>
          </div>
        )}
        {callsAnalyzed && (
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">{callsAnalyzed}</div>
            <div className="text-xs text-gray-500">Calls</div>
          </div>
        )}
        {objectionsIdentified && (
          <div className="text-center">
            <div className="text-lg font-bold text-orange-600">{objectionsIdentified}</div>
            <div className="text-xs text-gray-500">Objections</div>
          </div>
        )}
      </div>
    </div>
  );
}

function PerformanceMetric({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="text-center p-4 bg-gray-50 rounded-xl">
      <div className="text-2xl font-bold text-gray-900">{value}<span className="text-sm text-gray-500">{unit}</span></div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}
