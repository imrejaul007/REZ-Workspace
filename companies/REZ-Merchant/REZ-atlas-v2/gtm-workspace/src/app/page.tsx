'use client';

import { useState, useEffect } from 'react';
import {
  Radar, Search, Target, Users, Mail, MessageSquare, Phone,
  TrendingUp, Building2, User, Zap, Sparkles, GitCompare,
  BarChart3, Calendar, Bot, ChevronRight, ArrowRight, Check,
  AlertCircle, Clock, Play, RefreshCw, ExternalLink, Copy,
  Linkedin, Send, FileText, Eye, EyeOff, Loader2, Plus,
  Settings, Bell, HelpCircle, ChevronDown, ChevronUp, Filter
} from 'lucide-react';

// API Base URL
const API_BASE = 'http://localhost:5200';

type View = 'campaigns' | 'company' | 'competitors' | 'segments' | 'prospects' | 'messages' | 'outreach';

interface CompanyInsight {
  summary: string;
  industry: string;
  valueProps: string[];
  painPoints: string[];
  useCases: string[];
  keywords: string[];
  differentiators: string[];
}

interface Competitor {
  name: string;
  type: string;
  confidence: number;
}

interface Segment {
  name: string;
  count: number;
  icp: string;
  prospects?: any[];
}

interface Prospect {
  id: string;
  company: string;
  domain: string;
  persona: string;
  seniority: string;
  painPoints: string[];
  competitorUsing: string | null;
  budget: number;
  scores: {
    opportunity: number;
    pain: number;
    intent: number;
    urgency: number;
    revenue: number;
    overall: number;
  };
}

interface Campaign {
  id: string;
  domain: string;
  status: string;
  companyInsight: CompanyInsight;
  competitors: Competitor[];
  segments: Segment[];
  personas: any[];
  stats: {
    prospectsFound: number;
    contactsFound: number;
    companiesTargeted: number;
    emailsGenerated: number;
  };
}

export default function GTMWorkspace() {
  const [view, setView] = useState<View>('campaigns');
  const [domain, setDomain] = useState('');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [generatedMessages, setGeneratedMessages] = useState<any>(null);
  const [messageChannel, setMessageChannel] = useState<'email' | 'linkedin' | 'whatsapp' | 'call'>('email');
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null);

  // Fetch campaigns on mount
  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/gtm/campaigns`);
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    }
  };

  const startCampaign = async () => {
    if (!domain) return;
    setGenerating(true);
    setGenerationStep(0);

    try {
      // Step 1: Company Understanding
      setGenerationStep(1);
      const res = await fetch(`${API_BASE}/api/gtm/campaign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain })
      });
      const data = await res.json();

      if (data.success) {
        setActiveCampaign(data.data);
        setView('company');
        fetchCampaigns();
      }
    } catch (error) {
      console.error('Failed to start campaign:', error);
    } finally {
      setGenerating(false);
    }
  };

  const loadCampaign = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/gtm/campaign/${id}`);
      const data = await res.json();
      if (data.success) {
        setActiveCampaign(data.data);
        setView('company');
      }
    } catch (error) {
      console.error('Failed to load campaign:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMessages = async (prospect: Prospect) => {
    setSelectedProspect(prospect);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/gtm/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prospectId: prospect.id, channel: 'all' })
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedMessages(data.data);
      }
    } catch (error) {
      console.error('Failed to generate messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessage(key);
    setTimeout(() => setCopiedMessage(null), 2000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const generationSteps = [
    { step: 1, name: 'Company Understanding', icon: Building2 },
    { step: 2, name: 'Competitor Discovery', icon: GitCompare },
    { step: 3, name: 'Segment Building', icon: Target },
    { step: 4, name: 'Prospect Intelligence', icon: Users },
    { step: 5, name: 'Message Generation', icon: Mail }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Radar className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">REZ Atlas GTM</h1>
                <p className="text-xs text-purple-200">Autonomous Revenue Engine</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="p-2 bg-white/10 rounded-lg hover:bg-white/20">
                <Bell className="w-5 h-5" />
              </button>
              <button className="p-2 bg-white/10 rounded-lg hover:bg-white/20">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Campaign Start Input */}
        {!activeCampaign && (
          <div className="bg-white rounded-2xl p-8 shadow-sm mb-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Start Your GTM Campaign</h2>
              <p className="text-gray-500">Enter a company domain and let AI do the rest</p>
            </div>

            <div className="flex gap-3 max-w-xl mx-auto">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Enter company domain (e.g., rez.money)"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  onKeyDown={(e) => e.key === 'Enter' && startCampaign()}
                />
              </div>
              <button
                onClick={startCampaign}
                disabled={!domain || generating}
                className="px-8 py-4 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Launch GTM
                  </>
                )}
              </button>
            </div>

            {/* Generation Progress */}
            {generating && (
              <div className="mt-8 max-w-xl mx-auto">
                <div className="space-y-3">
                  {generationSteps.map((s, i) => (
                    <div key={s.step} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        generationStep > s.step ? 'bg-green-500 text-white' :
                        generationStep === s.step ? 'bg-purple-500 text-white animate-pulse' :
                        'bg-gray-100 text-gray-400'
                      }`}>
                        {generationStep > s.step ? <Check className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
                      </div>
                      <span className={`text-sm ${
                        generationStep >= s.step ? 'text-gray-900 font-medium' : 'text-gray-400'
                      }`}>{s.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Active Campaign View */}
        {activeCampaign && (
          <>
            {/* Campaign Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-purple-200 text-sm mb-1">
                    <Radar className="w-4 h-4" />
                    GTM Campaign
                  </div>
                  <h2 className="text-2xl font-bold">{activeCampaign.domain}</h2>
                  <p className="text-purple-200">{activeCampaign.companyInsight.industry}</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setView('campaigns')}
                    className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30"
                  >
                    All Campaigns
                  </button>
                  <button
                    onClick={startCampaign}
                    disabled={generating}
                    className="px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-purple-50 flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Regenerate
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4 mt-6">
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="text-3xl font-bold">{activeCampaign.stats.prospectsFound}</div>
                  <div className="text-sm text-purple-200">Prospects Found</div>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="text-3xl font-bold">{activeCampaign.stats.contactsFound}</div>
                  <div className="text-sm text-purple-200">Contacts</div>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="text-3xl font-bold">{activeCampaign.stats.companiesTargeted}</div>
                  <div className="text-sm text-purple-200">Companies</div>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="text-3xl font-bold">{activeCampaign.segments.length}</div>
                  <div className="text-sm text-purple-200">Segments</div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white rounded-xl shadow-sm mb-6">
              <div className="flex overflow-x-auto">
                {[
                  { id: 'company', label: 'Company', icon: Building2 },
                  { id: 'competitors', label: 'Competitors', icon: GitCompare },
                  { id: 'segments', label: 'Segments', icon: Target },
                  { id: 'prospects', label: 'Prospects', icon: Users },
                  { id: 'outreach', label: 'Outreach', icon: Send },
                  { id: 'messages', label: 'Messages', icon: Mail }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setView(tab.id as View)}
                    className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium whitespace-nowrap ${
                      view === tab.id
                        ? 'border-purple-600 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Views */}
            <div className="space-y-6">
              {/* Company View */}
              {view === 'company' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Summary</h3>
                    <p className="text-gray-600 mb-6">{activeCampaign.companyInsight.summary}</p>

                    <h4 className="font-medium text-gray-900 mb-2">Value Proposition</h4>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {activeCampaign.companyInsight.valueProps.map((vp, i) => (
                        <span key={i} className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm">
                          {vp}
                        </span>
                      ))}
                    </div>

                    <h4 className="font-medium text-gray-900 mb-2">Products</h4>
                    <div className="space-y-2">
                      {['Core Loyalty Engine', 'Cashback System', 'Gamification Suite', 'Analytics Dashboard'].map((p, i) => (
                        <div key={i} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                          <Check className="w-4 h-4 text-green-500" />
                          <span className="text-gray-700">{p}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Pain Points</h3>
                    <div className="space-y-3 mb-6">
                      {activeCampaign.companyInsight.painPoints.map((pp, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                          <span className="text-gray-700">{pp}</span>
                        </div>
                      ))}
                    </div>

                    <h4 className="font-medium text-gray-900 mb-2">Use Cases</h4>
                    <div className="flex flex-wrap gap-2">
                      {activeCampaign.companyInsight.useCases.map((uc, i) => (
                        <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                          {uc}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Competitors View */}
              {view === 'competitors' && (
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Competitor Analysis</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeCampaign.competitors.map((comp, i) => (
                      <div key={i} className="p-4 border border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-900">{comp.name}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            comp.type === 'direct' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {comp.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-500 rounded-full"
                              style={{ width: `${comp.confidence}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-600">{comp.confidence}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Segments View */}
              {view === 'segments' && (
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Target Segments</h3>
                  <div className="space-y-4">
                    {activeCampaign.segments.map((seg, i) => (
                      <div key={i} className="p-4 border border-gray-200 rounded-xl hover:border-purple-300 transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">{seg.name}</h4>
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                            {seg.count} companies
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mb-3">{seg.icp}</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setView('prospects'); }}
                            className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-sm hover:bg-purple-100 flex items-center gap-1"
                          >
                            View Prospects <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Prospects View */}
              {view === 'prospects' && (
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Prospects</h3>
                    <div className="flex items-center gap-2">
                      <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm flex items-center gap-1">
                        <Filter className="w-4 h-4" />
                        Filter
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-sm text-gray-500 border-b">
                          <th className="pb-3 font-medium">Company</th>
                          <th className="pb-3 font-medium">Contact</th>
                          <th className="pb-3 font-medium">Seniority</th>
                          <th className="pb-3 font-medium">Score</th>
                          <th className="pb-3 font-medium">Pain</th>
                          <th className="pb-3 font-medium">Intent</th>
                          <th className="pb-3 font-medium"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeCampaign.segments.flatMap(s => s.prospects || []).slice(0, 20).map((prospect, i) => (
                          <tr key={i} className="border-b border-gray-50 last:border-0">
                            <td className="py-4">
                              <div className="flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-gray-400" />
                                <div>
                                  <p className="font-medium text-gray-900">{prospect.company}</p>
                                  <p className="text-xs text-gray-500">{prospect.domain}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 text-gray-600">{prospect.persona}</td>
                            <td className="py-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                prospect.seniority === 'C-level' ? 'bg-purple-100 text-purple-700' :
                                prospect.seniority === 'VP' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {prospect.seniority}
                              </span>
                            </td>
                            <td className="py-4">
                              <span className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreColor(75)}`}>
                                75
                              </span>
                            </td>
                            <td className="py-4">
                              <div className="flex gap-1">
                                {prospect.painPoints.slice(0, 2).map((p, j) => (
                                  <span key={j} className="px-2 py-0.5 bg-red-50 text-red-700 text-xs rounded">
                                    {p}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="py-4">
                              {prospect.competitorUsing ? (
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">
                                  Using {prospect.competitorUsing}
                                </span>
                              ) : (
                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                                  Greenfield
                                </span>
                              )}
                            </td>
                            <td className="py-4">
                              <button
                                onClick={() => generateMessages(prospect)}
                                className="px-3 py-1 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
                              >
                                Generate
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Outreach View */}
              {view === 'outreach' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Outreach Intelligence</h3>
                    <div className="space-y-6">
                      <div className="p-4 bg-purple-50 rounded-xl">
                        <h4 className="font-medium text-purple-900 mb-2">Who to Target</h4>
                        <p className="text-gray-700">Head of Marketing (primary)</p>
                        <p className="text-sm text-gray-500">Head of Customer Success (secondary)</p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-xl">
                        <h4 className="font-medium text-green-900 mb-2">Why Now</h4>
                        <p className="text-gray-700">Recently raised funding - budget available</p>
                      </div>
                      <div className="p-4 bg-red-50 rounded-xl">
                        <h4 className="font-medium text-red-900 mb-2">Pain Points</h4>
                        <ul className="text-gray-700 space-y-1">
                          <li>• High customer acquisition cost</li>
                          <li>• Low repeat purchase rate</li>
                          <li>• No loyalty program</li>
                        </ul>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-xl">
                        <h4 className="font-medium text-blue-900 mb-2">Best Offer</h4>
                        <p className="text-gray-700 font-medium">3 Months Free + Free Setup</p>
                        <ul className="text-sm text-gray-600 mt-2 space-y-1">
                          <li>• No upfront cost</li>
                          <li>• Setup in 24 hours</li>
                          <li>• ROI guarantee</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Talking Points</h3>
                    <div className="space-y-3">
                      {[
                        'Companies like yours typically see 25-40% increase in repeat purchases',
                        'Competitors using loyalty see 40% higher LTV',
                        'We integrate with Shopify in one click',
                        'Companies saw results in 30 days'
                      ].map((point, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-sm font-bold">
                            {i + 1}
                          </div>
                          <p className="text-gray-700">{point}</p>
                        </div>
                      ))}
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-6 mt-8">Objection Handlers</h3>
                    <div className="space-y-3">
                      {[
                        { obj: 'Too expensive', handler: 'We only charge when you see results.' },
                        { obj: 'Not a priority', handler: 'What if you could reduce churn by 20%?' },
                        { obj: 'Already have solution', handler: 'We might complement what you have.' }
                      ].map((o, i) => (
                        <div key={i} className="p-3 border border-gray-200 rounded-lg">
                          <p className="text-sm font-medium text-red-600">"{o.obj}"</p>
                          <p className="text-sm text-gray-700 mt-1">{o.handler}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Messages View */}
              {view === 'messages' && (
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Message Factory</h3>

                  {!selectedProspect ? (
                    <div className="text-center py-12 text-gray-500">
                      <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Select a prospect from the Prospects tab to generate personalized messages</p>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-3 mb-6 p-4 bg-gray-50 rounded-xl">
                        <Building2 className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">{selectedProspect.company}</p>
                          <p className="text-sm text-gray-500">{selectedProspect.persona}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2 mb-6">
                        {['email', 'linkedin', 'whatsapp', 'call'].map((ch) => (
                          <button
                            key={ch}
                            onClick={() => setMessageChannel(ch as any)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
                              messageChannel === ch
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {ch}
                          </button>
                        ))}
                      </div>

                      {loading ? (
                        <div className="text-center py-12">
                          <Loader2 className="w-8 h-8 mx-auto mb-4 text-purple-600 animate-spin" />
                          <p className="text-gray-500">Generating personalized message...</p>
                        </div>
                      ) : generatedMessages ? (
                        <div className="space-y-6">
                          {/* Email */}
                          <div className="border border-gray-200 rounded-xl overflow-hidden">
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-gray-500" />
                                <span className="font-medium text-gray-700">Email</span>
                              </div>
                              <button
                                onClick={() => copyToClipboard(generatedMessages.messages.email?.body || '', 'email')}
                                className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-sm flex items-center gap-1 hover:bg-gray-50"
                              >
                                {copiedMessage === 'email' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                {copiedMessage === 'email' ? 'Copied!' : 'Copy'}
                              </button>
                            </div>
                            <div className="p-4">
                              <p className="text-sm text-gray-500 mb-1">Subject: {generatedMessages.messages.email?.subject}</p>
                              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                                {generatedMessages.messages.email?.body}
                              </div>
                            </div>
                          </div>

                          {/* LinkedIn */}
                          <div className="border border-gray-200 rounded-xl overflow-hidden">
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Linkedin className="w-4 h-4 text-gray-500" />
                                <span className="font-medium text-gray-700">LinkedIn</span>
                              </div>
                              <button
                                onClick={() => copyToClipboard(generatedMessages.messages.linkedin?.message || '', 'linkedin')}
                                className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-sm flex items-center gap-1 hover:bg-gray-50"
                              >
                                {copiedMessage === 'linkedin' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                {copiedMessage === 'linkedin' ? 'Copied!' : 'Copy'}
                              </button>
                            </div>
                            <div className="p-4">
                              <p className="text-sm text-gray-500 mb-1">Connection Note:</p>
                              <p className="text-gray-700 mb-4">{generatedMessages.messages.linkedin?.connectionNote}</p>
                              <p className="text-sm text-gray-500 mb-1">Message:</p>
                              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                                {generatedMessages.messages.linkedin?.message}
                              </div>
                            </div>
                          </div>

                          {/* WhatsApp */}
                          <div className="border border-gray-200 rounded-xl overflow-hidden">
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-gray-500" />
                                <span className="font-medium text-gray-700">WhatsApp</span>
                              </div>
                              <button
                                onClick={() => copyToClipboard(generatedMessages.messages.whatsapp?.intro || '', 'whatsapp')}
                                className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-sm flex items-center gap-1 hover:bg-gray-50"
                              >
                                {copiedMessage === 'whatsapp' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                {copiedMessage === 'whatsapp' ? 'Copied!' : 'Copy'}
                              </button>
                            </div>
                            <div className="p-4">
                              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                                {generatedMessages.messages.whatsapp?.intro}
                              </div>
                            </div>
                          </div>

                          {/* Call Script */}
                          <div className="border border-gray-200 rounded-xl overflow-hidden">
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-gray-500" />
                                <span className="font-medium text-gray-700">Call Script</span>
                              </div>
                              <button
                                onClick={() => copyToClipboard(generatedMessages.messages.callScript?.opening || '', 'call')}
                                className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-sm flex items-center gap-1 hover:bg-gray-50"
                              >
                                {copiedMessage === 'call' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                {copiedMessage === 'call' ? 'Copied!' : 'Copy'}
                              </button>
                            </div>
                            <div className="p-4 space-y-4">
                              <div>
                                <p className="text-sm font-medium text-gray-700 mb-1">Opening:</p>
                                <p className="text-gray-700">{generatedMessages.messages.callScript?.opening}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">Discovery Questions:</p>
                                <ul className="space-y-1">
                                  {generatedMessages.messages.callScript?.discovery?.map((q: string, i: number) => (
                                    <li key={i} className="text-gray-700 flex items-start gap-2">
                                      <span className="text-purple-600 font-medium">{i + 1}.</span>
                                      {q}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-700 mb-1">Close:</p>
                                <p className="text-gray-700">{generatedMessages.messages.callScript?.close}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12 text-gray-500">
                          <p>Click "Generate" on a prospect to create messages</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Campaign List */}
        {view === 'campaigns' && !activeCampaign && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Campaigns</h3>
            {campaigns.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No campaigns yet. Enter a domain above to start.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    onClick={() => loadCampaign(campaign.id)}
                    className="p-4 border border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{campaign.domain}</h4>
                          <p className="text-sm text-gray-500">{campaign.companyInsight?.industry}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-lg font-bold text-gray-900">{campaign.stats?.prospectsFound || 0}</p>
                          <p className="text-xs text-gray-500">Prospects</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-gray-900">{campaign.stats?.contactsFound || 0}</p>
                          <p className="text-xs text-gray-500">Contacts</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
