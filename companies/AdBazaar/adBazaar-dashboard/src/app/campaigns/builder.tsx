'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { AdType, BudgetAllocation, ChannelConfig, TargetingConfig, Estimation } from '../../lib/types/ai-campaign';

// Platform icons (SVG paths for common social platforms)
const PLATFORM_ICONS: Record<string, JSX.Element> = {
  'in-app': <span className="text-blue-400">📱</span>,
  'dooh': <span className="text-purple-400">🖥️</span>,
  'qr': <span className="text-green-400">📱</span>,
  'broadcast': <span className="text-amber-400">📢</span>,
  'influencer': <span className="text-pink-400">⭐</span>,
  'offline': <span className="text-gray-400">🏪</span>,
};

interface CampaignDraft {
  name: string;
  goal: string;
  description: string;
  merchantType: string;
  channels: ChannelConfig[];
  budget: BudgetAllocation;
  targeting: TargetingConfig;
  schedule: {
    startDate: string;
    endDate: string;
    timezone: string;
  };
  creative: {
    headline: string;
    body: string;
    cta: string;
  };
}

const initialDraft: CampaignDraft = {
  name: '',
  goal: '',
  description: '',
  merchantType: '',
  channels: [],
  budget: { total: 0, distribution: [] },
  targeting: {
    location: { city: '', area: '' },
    audience: { segment: 'all', income: 'medium' },
    timing: { preferredHours: [], daysOfWeek: [] },
  },
  schedule: {
    startDate: '',
    endDate: '',
    timezone: 'Asia/Kolkata',
  },
  creative: {
    headline: '',
    body: '',
    cta: '',
  },
};

const AD_TYPES: { type: AdType; label: string; description: string }[] = [
  { type: 'in-app', label: 'In-App Ads', description: 'Banner, interstitial, and native ads within the ReZ app' },
  { type: 'dooh', label: 'Digital Out-of-Home', description: 'Retail displays, elevators, taxi screens' },
  { type: 'qr', label: 'QR Code Campaigns', description: 'Scannable QR codes for offline-to-online tracking' },
  { type: 'broadcast', label: 'Broadcast/WhatsApp', description: 'WhatsApp messages and push notifications' },
  { type: 'influencer', label: 'Creator/Influencer', description: 'Partner with content creators' },
  { type: 'offline', label: 'Offline Retail', description: 'In-store promotions and loyalty' },
];

const CITY_OPTIONS = [
  'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata',
  'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow'
];

const AUDIENCE_SEGMENTS = [
  { value: 'all', label: 'All Users' },
  { value: 'new_users', label: 'New Users' },
  { value: 'repeat', label: 'Repeat Customers' },
  { value: 'vip', label: 'VIP/Premium' },
  { value: 'dormant', label: 'Dormant Users' },
];

const INCOME_LEVELS = [
  { value: 'low', label: 'Budget Conscious' },
  { value: 'medium', label: 'Middle Income' },
  { value: 'high', label: 'Premium' },
];

const TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'Asia/Dubai', label: 'UAE (GST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
];

export default function CampaignBuilder() {
  const [currentStep, setCurrentStep] = useState(1);
  const [draft, setDraft] = useState<CampaignDraft>(initialDraft);
  const [selectedChannels, setSelectedChannels] = useState<AdType[]>([]);
  const [budgetInput, setBudgetInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [estimation, setEstimation] = useState<Estimation | null>(null);

  // Handle channel selection
  const toggleChannel = (type: AdType) => {
    setSelectedChannels((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  // Update budget distribution when channels change
  const updateBudgetDistribution = (total: number) => {
    const distribution = selectedChannels.map((type) => ({
      type,
      amount: Math.round(total / selectedChannels.length),
      percentage: Math.round(100 / selectedChannels.length),
    }));
    setDraft((prev) => ({
      ...prev,
      budget: { total, distribution },
    }));
  };

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (sourceIndex === targetIndex) return;

    const newDistribution = [...draft.budget.distribution];
    const [removed] = newDistribution.splice(sourceIndex, 1);
    newDistribution.splice(targetIndex, 0, removed);

    // Recalculate percentages
    const total = draft.budget.total;
    const updatedDistribution = newDistribution.map((item, i) => ({
      ...item,
      percentage: Math.round(100 / newDistribution.length),
      amount: Math.round(total / newDistribution.length),
    }));

    setDraft((prev) => ({
      ...prev,
      budget: { ...prev.budget, distribution: updatedDistribution },
    }));
    setDragOverIndex(null);
  }, [draft.budget.total, draft.budget.distribution]);

  // AI Generation
  const generateWithAI = async () => {
    setIsGenerating(true);
    try {
      // Simulate AI generation delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock AI-generated content
      setDraft((prev) => ({
        ...prev,
        name: `AI Campaign - ${prev.goal.slice(0, 30)}`,
        description: `Targeted campaign for ${prev.goal} targeting ${prev.targeting.audience.segment} users`,
        creative: {
          headline: `Discover Amazing ${prev.goal} Deals!`,
          body: `Don't miss out on exclusive offers! Get up to 40% off on ${prev.goal}. Limited time only.`,
          cta: 'Shop Now',
        },
      }));

      // Mock estimation
      setEstimation({
        reach: Math.round(draft.budget.total * 50),
        impressions: Math.round(draft.budget.total * 200),
        clicks: Math.round(draft.budget.total * 10),
        conversions: Math.round(draft.budget.total * 0.5),
        cpm: 25,
        cpc: 2.5,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Form handlers
  const updateDraft = (field: string, value: unknown) => {
    setDraft((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateTargeting = (field: string, value: unknown) => {
    setDraft((prev) => ({
      ...prev,
      targeting: { ...prev.targeting, [field]: value },
    }));
  };

  const updateLocation = (field: string, value: string) => {
    setDraft((prev) => ({
      ...prev,
      targeting: {
        ...prev.targeting,
        location: { ...prev.targeting.location, [field]: value },
      },
    }));
  };

  const updateAudience = (field: string, value: string) => {
    setDraft((prev) => ({
      ...prev,
      targeting: {
        ...prev.targeting,
        audience: { ...prev.targeting.audience, [field]: value as TargetingConfig['audience']['segment'] | TargetingConfig['audience']['income'] },
      },
    }));
  };

  const updateCreative = (field: string, value: string) => {
    setDraft((prev) => ({
      ...prev,
      creative: { ...prev.creative, [field]: value },
    }));
  };

  const nextStep = () => setCurrentStep((s) => Math.min(s + 1, 5));
  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 1));

  const canProceed = () => {
    switch (currentStep) {
      case 1: return draft.name && draft.goal;
      case 2: return selectedChannels.length > 0;
      case 3: return draft.budget.total > 0;
      case 4: return draft.schedule.startDate && draft.schedule.endDate;
      case 5: return draft.creative.headline && draft.creative.body;
      default: return true;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/unified-dashboard" className="text-2xl font-bold">
              Ad<span className="text-amber-500">Bazaar</span>
            </Link>
            <span className="text-gray-400">Campaign Builder</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">
              Step {currentStep} of 5
            </span>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-gray-800 px-6 py-4">
        <div className="flex gap-2">
          {['Basics', 'Channels', 'Budget', 'Schedule', 'Creative'].map((label, i) => (
            <div
              key={label}
              className={`flex-1 h-2 rounded-full transition-colors ${
                i + 1 <= currentStep ? 'bg-amber-500' : 'bg-gray-700'
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2">
          {['Basics', 'Channels', 'Budget', 'Schedule', 'Creative'].map((label, i) => (
            <span
              key={label}
              className={`text-xs ${
                i + 1 === currentStep ? 'text-amber-500 font-medium' : 'text-gray-500'
              }`}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="p-6 max-w-6xl mx-auto">
        {/* Step 1: Basics */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-6">Campaign Basics</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Campaign Name *
                  </label>
                  <input
                    type="text"
                    value={draft.name}
                    onChange={(e) => updateDraft('name', e.target.value)}
                    placeholder="e.g., Summer Sale 2026"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Campaign Goal *
                  </label>
                  <textarea
                    value={draft.goal}
                    onChange={(e) => updateDraft('goal', e.target.value)}
                    placeholder="Describe your campaign goal in natural language..."
                    rows={3}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-amber-500"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Tip: Be specific about what you want to achieve (e.g., "Increase foot traffic to my restaurant by 30% this weekend")
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Description
                  </label>
                  <textarea
                    value={draft.description}
                    onChange={(e) => updateDraft('description', e.target.value)}
                    placeholder="Optional campaign description..."
                    rows={2}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Merchant/Store Type
                  </label>
                  <select
                    value={draft.merchantType}
                    onChange={(e) => updateDraft('merchantType', e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-amber-500"
                  >
                    <option value="">Select type...</option>
                    <option value="restaurant">Restaurant/Food</option>
                    <option value="retail">Retail Store</option>
                    <option value="fitness">Fitness/Gym</option>
                    <option value="beauty">Beauty/Salon</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* AI Generate Button */}
                <button
                  onClick={generateWithAI}
                  disabled={!draft.goal || isGenerating}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Generating with AI...
                    </>
                  ) : (
                    <>
                      ✨ Generate with AI
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Targeting Preview */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Targeting (Optional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">City</label>
                  <select
                    value={draft.targeting.location.city}
                    onChange={(e) => updateLocation('city', e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2"
                  >
                    <option value="">All India</option>
                    {CITY_OPTIONS.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Audience</label>
                  <select
                    value={draft.targeting.audience.segment}
                    onChange={(e) => updateAudience('segment', e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2"
                  >
                    {AUDIENCE_SEGMENTS.map((seg) => (
                      <option key={seg.value} value={seg.value}>{seg.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Channel Selection */}
        {currentStep === 2 && (
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-2">Select Channels</h2>
            <p className="text-gray-400 text-sm mb-6">
              Choose one or more channels to distribute your campaign
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {AD_TYPES.map(({ type, label, description }) => (
                <button
                  key={type}
                  onClick={() => toggleChannel(type)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    selectedChannels.includes(type)
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-gray-700 bg-gray-700/50 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{PLATFORM_ICONS[type]}</span>
                    <span className="font-medium">{label}</span>
                    {selectedChannels.includes(type) && (
                      <span className="ml-auto text-amber-500">✓</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">{description}</p>
                </button>
              ))}
            </div>

            {selectedChannels.length > 0 && (
              <div className="mt-6 p-4 bg-gray-700/50 rounded-lg">
                <div className="text-sm text-gray-400 mb-2">Selected Channels:</div>
                <div className="flex flex-wrap gap-2">
                  {selectedChannels.map((type) => (
                    <span
                      key={type}
                      className="bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-sm"
                    >
                      {AD_TYPES.find((t) => t.type === type)?.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Budget Allocation */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-6">Budget Allocation</h2>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Total Budget (₹)
                </label>
                <input
                  type="number"
                  value={budgetInput}
                  onChange={(e) => {
                    setBudgetInput(e.target.value);
                    updateBudgetDistribution(parseInt(e.target.value) || 0);
                  }}
                  placeholder="Enter budget in INR"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-2xl font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              {selectedChannels.length > 0 && draft.budget.total > 0 && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-400">Drag to reorder channels (budget auto-distributes)</p>

                  <div className="space-y-3">
                    {draft.budget.distribution.map((item, index) => (
                      <div
                        key={item.type}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, index)}
                        className={`bg-gray-700 rounded-lg p-4 cursor-move transition-all ${
                          dragOverIndex === index ? 'ring-2 ring-amber-500' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-gray-500">⋮⋮</span>
                            <span className="text-2xl">{PLATFORM_ICONS[item.type]}</span>
                            <span className="font-medium">
                              {AD_TYPES.find((t) => t.type === item.type)?.label}
                            </span>
                          </div>
                          <span className="text-2xl font-bold text-amber-400">
                            ₹{item.amount.toLocaleString()}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-600 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 transition-all"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                        <div className="text-sm text-gray-400 mt-1">
                          {item.percentage}% of total budget
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Estimation */}
            {estimation && (
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Estimated Reach</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[
                    { label: 'Reach', value: (estimation.reach / 1000).toFixed(0) + 'K' },
                    { label: 'Impressions', value: (estimation.impressions / 1000).toFixed(0) + 'K' },
                    { label: 'Clicks', value: (estimation.clicks / 1000).toFixed(0) + 'K' },
                    { label: 'Conversions', value: estimation.conversions.toString() },
                    { label: 'CPM', value: '₹' + estimation.cpm },
                    { label: 'CPC', value: '₹' + estimation.cpc },
                  ].map((item) => (
                    <div key={item.label} className="bg-gray-700 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold">{item.value}</div>
                      <div className="text-sm text-gray-400">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Scheduling */}
        {currentStep === 4 && (
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6">Campaign Schedule</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={draft.schedule.startDate}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      schedule: { ...prev.schedule, startDate: e.target.value },
                    }))
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  value={draft.schedule.endDate}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      schedule: { ...prev.schedule, endDate: e.target.value },
                    }))
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Timezone
                </label>
                <select
                  value={draft.schedule.timezone}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      schedule: { ...prev.schedule, timezone: e.target.value },
                    }))
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-amber-500"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Duration Summary */}
            {draft.schedule.startDate && draft.schedule.endDate && (
              <div className="mt-6 p-4 bg-gray-700/50 rounded-lg">
                <div className="text-sm text-gray-400 mb-2">Campaign Duration</div>
                <div className="text-xl font-bold">
                  {Math.ceil(
                    (new Date(draft.schedule.endDate).getTime() - new Date(draft.schedule.startDate).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )}{' '}
                  days
                </div>
              </div>
            )}

            {/* Quick Presets */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-400 mb-3">
                Quick Presets
              </label>
              <div className="flex flex-wrap gap-3">
                {[
                  { label: 'This Weekend', days: 2 },
                  { label: 'This Week', days: 7 },
                  { label: '2 Weeks', days: 14 },
                  { label: '1 Month', days: 30 },
                ].map((preset) => {
                  const startDate = new Date();
                  const endDate = new Date();
                  endDate.setDate(endDate.getDate() + preset.days);
                  return (
                    <button
                      key={preset.label}
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          schedule: {
                            ...prev.schedule,
                            startDate: startDate.toISOString().split('T')[0],
                            endDate: endDate.toISOString().split('T')[0],
                          },
                        }))
                      }
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Creative */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-6">Creative Content</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Headline *
                  </label>
                  <input
                    type="text"
                    value={draft.creative.headline}
                    onChange={(e) => updateCreative('headline', e.target.value)}
                    placeholder="Catchy headline for your ad"
                    maxLength={60}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-amber-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {draft.creative.headline.length}/60 characters
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Body Text *
                  </label>
                  <textarea
                    value={draft.creative.body}
                    onChange={(e) => updateCreative('body', e.target.value)}
                    placeholder="Describe your offer in detail..."
                    rows={4}
                    maxLength={300}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-amber-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {draft.creative.body.length}/300 characters
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Call to Action
                  </label>
                  <select
                    value={draft.creative.cta}
                    onChange={(e) => updateCreative('cta', e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-amber-500"
                  >
                    <option value="">Select CTA...</option>
                    <option value="Shop Now">Shop Now</option>
                    <option value="Learn More">Learn More</option>
                    <option value="Sign Up">Sign Up</option>
                    <option value="Book Now">Book Now</option>
                    <option value="Get Offer">Get Offer</option>
                    <option value="Redeem">Redeem</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Ad Preview</h3>
              <div className="bg-white text-gray-900 rounded-lg p-4 max-w-md">
                <div className="font-bold text-lg mb-2">
                  {draft.creative.headline || 'Your Headline Here'}
                </div>
                <div className="text-gray-700 mb-3">
                  {draft.creative.body || 'Your ad body text will appear here...'}
                </div>
                <button className="bg-amber-500 text-black font-semibold px-6 py-2 rounded-lg">
                  {draft.creative.cta || 'Shop Now'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-6 py-3 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>

          {currentStep < 5 ? (
            <button
              onClick={nextStep}
              disabled={!canProceed()}
              className="px-6 py-3 bg-amber-500 text-black rounded-lg font-medium hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next Step
            </button>
          ) : (
            <button
              onClick={() => alert('Campaign created! (Demo)')}
              disabled={!canProceed()}
              className="px-8 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Launch Campaign
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
