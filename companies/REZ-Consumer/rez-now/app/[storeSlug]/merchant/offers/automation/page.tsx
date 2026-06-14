'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  getOfferRules,
  createOfferRule,
  updateOfferRule,
  deleteOfferRule,
  getRuleAudit,
  type OfferRule,
  type RuleType,
  type AuditResponse,
  getRuleLabel,
  getRuleColor,
  formatTriggerDescription,
} from '@/lib/api/offerAutomation';

const RULE_TYPES: { type: RuleType; label: string; description: string }[] = [
  { type: 'dormant_customer', label: 'Dormant Customer', description: 'Re-engage customers who haven\'t visited in N days' },
  { type: 'birthday', label: 'Birthday', description: 'Send personalized offers on customer birthdays' },
  { type: 'first_visit', label: 'First Visit', description: 'Welcome offer for new customers' },
  { type: 'milestone_visit', label: 'Milestone Visit', description: 'Reward customers at 5th, 10th, 15th visit' },
  { type: 'happy_hour', label: 'Happy Hour', description: 'Activate discounts during off-peak hours' },
  { type: 'low_footfall', label: 'Low Footfall', description: 'Trigger offers when daily revenue drops' },
  { type: 'weather_trigger', label: 'Weather Trigger', description: 'Send contextual offers based on weather' },
];

function TriggerConfigForm({ ruleType, config, onChange }: {
  ruleType: RuleType;
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}) {
  switch (ruleType) {
    case 'dormant_customer':
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Days since last visit</label>
          <input
            type="number"
            min={1}
            max={365}
            defaultValue={(config.daysSinceLastVisit as number) ?? 14}
            onChange={(e) => onChange({ daysSinceLastVisit: parseInt(e.target.value) })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <p className="text-xs text-gray-500 mt-1">Send offer to customers who haven&apos;t visited in this many days</p>
        </div>
      );

    case 'birthday':
      return (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Days before birthday</label>
            <input
              type="number"
              min={0}
              max={30}
              defaultValue={(config.daysBefore as number) ?? 0}
              onChange={(e) => onChange({ ...config, daysBefore: parseInt(e.target.value) })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Days after birthday</label>
            <input
              type="number"
              min={0}
              max={30}
              defaultValue={(config.daysAfter as number) ?? 0}
              onChange={(e) => onChange({ ...config, daysAfter: parseInt(e.target.value) })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      );

    case 'milestone_visit':
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Milestone visit counts</label>
          <input
            type="text"
            defaultValue={((config.visitCounts as number[]) ?? [5, 10, 15]).join(', ')}
            onChange={(e) => onChange({ visitCounts: e.target.value.split(',').map((n) => parseInt(n.trim())).filter((n) => !isNaN(n)) })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
            placeholder="5, 10, 15"
          />
          <p className="text-xs text-gray-500 mt-1">Comma-separated visit counts (e.g. 5, 10, 15)</p>
        </div>
      );

    case 'happy_hour':
      return (
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start time</label>
            <input
              type="time"
              defaultValue={(config.startTime as string) ?? '14:00'}
              onChange={(e) => onChange({ ...config, startTime: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End time</label>
            <input
              type="time"
              defaultValue={(config.endTime as string) ?? '17:00'}
              onChange={(e) => onChange({ ...config, endTime: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Active days</label>
            <input
              type="text"
              defaultValue={((config.activeDays as number[]) ?? [1, 2, 3, 4, 5]).join(', ')}
              onChange={(e) => onChange({ ...config, activeDays: e.target.value.split(',').map((n) => parseInt(n.trim())).filter((n) => !isNaN(n)) })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
              placeholder="1,2,3,4,5"
            />
          </div>
        </div>
      );

    case 'low_footfall':
      return (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Revenue threshold (INR)</label>
            <input
              type="number"
              min={0}
              defaultValue={(config.revenueThreshold as number) ?? 5000}
              onChange={(e) => onChange({ ...config, revenueThreshold: parseInt(e.target.value) })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
            <select
              defaultValue={(config.period as string) ?? 'day'}
              onChange={(e) => onChange({ ...config, period: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
            >
              <option value="day">Per day</option>
              <option value="week">Per week</option>
            </select>
          </div>
        </div>
      );

    case 'weather_trigger':
      return (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Weather condition</label>
            <select
              defaultValue={(config.condition as string) ?? 'rain'}
              onChange={(e) => onChange({ ...config, condition: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
            >
              <option value="rain">Rain</option>
              <option value="hot">Hot</option>
              <option value="cold">Cold</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input
              type="text"
              defaultValue={(config.city as string) ?? ''}
              onChange={(e) => onChange({ ...config, city: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
              placeholder="Bangalore"
            />
          </div>
        </div>
      );

    default:
      return null;
  }
}

function AddRuleModal({ storeId, onClose, onCreated }: {
  storeId: string;
  onClose: () => void;
  onCreated: (rule: OfferRule) => void;
}) {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<RuleType | null>(null);
  const [triggerConfig, setTriggerConfig] = useState<Record<string, unknown>>({});
  const [offerConfig, setOfferConfig] = useState<{
    type: 'cashback' | 'discount' | 'free_item';
    value: number;
    minOrderValue: number;
    maxDiscount: number;
    validityDays: number;
    title: string;
    message: string;
  }>({
    type: 'cashback',
    value: 10,
    minOrderValue: 0,
    maxDiscount: 0,
    validityDays: 7,
    title: '',
    message: 'Hi {{name}}! We miss you. Here\'s a special offer just for you. Valid for {{days}} days!',
  });
  const [channel, setChannel] = useState<'whatsapp' | 'push' | 'sms'>('whatsapp');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!selectedType) return;
    if (!offerConfig.title.trim()) { setError('Offer title is required'); return; }
    if (!offerConfig.message.trim()) { setError('Offer message is required'); return; }

    setSubmitting(true);
    setError('');
    try {
      const rule = await createOfferRule(storeId, {
        type: selectedType,
        triggerConfig,
        offerConfig: {
          ...offerConfig,
          validityDays: Number(offerConfig.validityDays),
          value: Number(offerConfig.value),
          minOrderValue: offerConfig.minOrderValue ? Number(offerConfig.minOrderValue) : undefined,
          maxDiscount: offerConfig.maxDiscount ? Number(offerConfig.maxDiscount) : undefined,
        },
        notificationChannel: channel,
        enabled: true,
      });
      onCreated(rule);
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to create rule');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Add Automation Rule</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-3">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${step >= s ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {s}
                </div>
                {s < 3 && <div className={`w-8 h-0.5 ${step > s ? 'bg-indigo-600' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Step 1: Choose rule type */}
          {step === 1 && (
            <>
              <p className="text-sm text-gray-600">Select the trigger type for this automation rule.</p>
              <div className="space-y-2">
                {RULE_TYPES.map(({ type, label, description }) => (
                  <button
                    key={type}
                    onClick={() => { setSelectedType(type); setStep(2); }}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedType === type ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm text-gray-900">{label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRuleColor(type)}`}>
                        {getRuleLabel(type)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Step 2: Configure trigger */}
          {step === 2 && selectedType && (
            <>
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Configure Trigger</h3>
                <TriggerConfigForm ruleType={selectedType} config={triggerConfig} onChange={setTriggerConfig} />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button onClick={() => setStep(1)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Back</button>
                <button onClick={() => setStep(3)} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">Next</button>
              </div>
            </>
          )}

          {/* Step 3: Configure offer */}
          {step === 3 && (
            <>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Offer type</label>
                  <select
                    value={offerConfig.type}
                    onChange={(e) => setOfferConfig({ ...offerConfig, type: e.target.value as 'cashback' | 'discount' | 'free_item' })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="cashback">Cashback (%)</option>
                    <option value="discount">Discount (%)</option>
                    <option value="free_item">Free Item</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {offerConfig.type === 'free_item' ? 'Item ID' : 'Value (%)'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={offerConfig.type === 'free_item' ? undefined : 100}
                    value={offerConfig.value}
                    onChange={(e) => setOfferConfig({ ...offerConfig, value: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Offer title</label>
                  <input
                    type="text"
                    maxLength={100}
                    value={offerConfig.title}
                    onChange={(e) => setOfferConfig({ ...offerConfig, title: e.target.value })}
                    placeholder="We miss you!"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={offerConfig.message}
                    onChange={(e) => setOfferConfig({ ...offerConfig, message: e.target.value })}
                    placeholder="Hi {{name}}! We miss you. Here's a special offer just for you."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">Use &#123;&#123;name&#125;&#125; for customer name, &#123;&#123;days&#125;&#125; for validity days</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min order (INR)</label>
                    <input
                      type="number"
                      min={0}
                      value={offerConfig.minOrderValue}
                      onChange={(e) => setOfferConfig({ ...offerConfig, minOrderValue: parseInt(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max discount</label>
                    <input
                      type="number"
                      min={0}
                      value={offerConfig.maxDiscount}
                      onChange={(e) => setOfferConfig({ ...offerConfig, maxDiscount: parseInt(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valid for (days)</label>
                    <input
                      type="number"
                      min={1}
                      max={90}
                      value={offerConfig.validityDays}
                      onChange={(e) => setOfferConfig({ ...offerConfig, validityDays: parseInt(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notification channel</label>
                  <div className="flex gap-4">
                    {(['whatsapp', 'push', 'sms'] as const).map((ch) => (
                      <label key={ch} className="flex items-center gap-1.5 text-sm">
                        <input
                          type="radio"
                          name="channel"
                          value={ch}
                          checked={channel === ch}
                          onChange={() => setChannel(ch)}
                          className="text-indigo-600"
                        />
                        {ch.charAt(0).toUpperCase() + ch.slice(1)}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-2 justify-end pt-2">
                <button onClick={() => setStep(2)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Back</button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Rule'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function RuleCard({ rule, onToggle, onDelete, onAudit }: {
  rule: OfferRule;
  onToggle: (enabled: boolean) => void;
  onDelete: () => void;
  onAudit: () => void;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRuleColor(rule.type)}`}>
              {getRuleLabel(rule.type)}
            </span>
            {!rule.enabled && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Paused</span>
            )}
          </div>
          <p className="font-medium text-gray-900 mt-2 text-sm">{rule.offerConfig.title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{formatTriggerDescription(rule)}</p>
          <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
            <span>
              {rule.offerConfig.type === 'cashback' ? `${rule.offerConfig.value}% cashback` :
               rule.offerConfig.type === 'discount' ? `${rule.offerConfig.value}% off` :
               `Free item #${rule.offerConfig.value}`}
            </span>
            <span>{rule.notificationChannel}</span>
            <span>Valid {rule.offerConfig.validityDays}d</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle */}
          <button
            onClick={() => onToggle(!rule.enabled)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              rule.enabled ? 'bg-indigo-600' : 'bg-gray-200'
            }`}
          >
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
              rule.enabled ? 'translate-x-4' : 'translate-x-1'
            }`} />
          </button>

          {/* Audit */}
          <button
            onClick={onAudit}
            className="text-gray-400 hover:text-indigo-600 p-1"
            title="View audit log"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </button>

          {/* Delete */}
          <button
            onClick={onDelete}
            className="text-gray-400 hover:text-red-600 p-1"
            title="Delete rule"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function AuditModal({ storeId, ruleId, ruleTitle, onClose }: {
  storeId: string;
  ruleId: string;
  ruleTitle: string;
  onClose: () => void;
}) {
  const [audit, setAudit] = useState<AuditResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRuleAudit(storeId, ruleId, { limit: 20 }).then(setAudit).finally(() => setLoading(false));
  }, [storeId, ruleId]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Audit Log</h2>
              <p className="text-sm text-gray-500">{ruleTitle}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading...</div>
          ) : audit ? (
            <>
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-indigo-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-indigo-700">{audit.stats.totalSent}</p>
                  <p className="text-xs text-indigo-600">Offers Sent</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-700">{audit.stats.totalUsed}</p>
                  <p className="text-xs text-green-600">Offers Used</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-yellow-700">₹{audit.stats.totalRevenue.toFixed(0)}</p>
                  <p className="text-xs text-yellow-600">Revenue</p>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 text-gray-500 font-medium">Customer</th>
                      <th className="text-left py-2 text-gray-500 font-medium">Sent</th>
                      <th className="text-left py-2 text-gray-500 font-medium">Used</th>
                      <th className="text-right py-2 text-gray-500 font-medium">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {audit.audits.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-gray-400">No audit entries yet</td>
                      </tr>
                    ) : audit.audits.map((entry) => (
                      <tr key={entry._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2">
                          <p className="font-medium text-gray-900">
                            {entry.customerId?.profile?.firstName
                              ? `${entry.customerId.profile.firstName} ${entry.customerId.profile.lastName || ''}`
                              : entry.customerId?._id?.slice(-6) ?? '—'}
                          </p>
                          <p className="text-xs text-gray-400">{entry.sentAt?.slice(0, 10)}</p>
                        </td>
                        <td className="py-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            entry.offerSent ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {entry.offerSent ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="py-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            entry.offerUsed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {entry.offerUsed ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="py-2 text-right font-medium text-gray-700">
                          {entry.revenue ? `₹${entry.revenue.toFixed(0)}` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-gray-400 mt-4 text-center">
                Showing {audit.audits.length} of {audit.pagination.total} entries
              </p>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function OfferAutomationPage() {
  const params = useParams();
  const storeSlug = params.storeSlug as string;
  const [rules, setRules] = useState<OfferRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [auditRule, setAuditRule] = useState<{ rule: OfferRule } | null>(null);
  const [error, setError] = useState('');

  const loadRules = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getOfferRules(storeSlug);
      setRules(result.data);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [storeSlug]);

  useEffect(() => { loadRules(); }, [loadRules]);

  const handleToggle = async (rule: OfferRule, enabled: boolean) => {
    try {
      await updateOfferRule(storeSlug, rule._id, { enabled });
      setRules((prev) => prev.map((r) => r._id === rule._id ? { ...r, enabled } : r));
    } catch (err: unknown) {
      setError((err as Error).message);
    }
  };

  const handleDelete = async (rule: OfferRule) => {
    if (!confirm('Delete this automation rule?')) return;
    try {
      await deleteOfferRule(storeSlug, rule._id);
      setRules((prev) => prev.filter((r) => r._id !== rule._id));
    } catch (err: unknown) {
      setError((err as Error).message);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Offer Automation</h1>
          <p className="text-sm text-gray-500 mt-0.5">Automatically send personalized offers to your customers</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Rule
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">Dismiss</button>
        </div>
      )}

      {/* Rules grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-2/3 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : rules.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center">
          <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
          </svg>
          <h3 className="font-medium text-gray-900 mb-1">No automation rules yet</h3>
          <p className="text-sm text-gray-500 mb-4">Create your first rule to start sending automated offers</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
          >
            Create your first rule
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rules.map((rule) => (
            <RuleCard
              key={rule._id}
              rule={rule}
              onToggle={(enabled) => handleToggle(rule, enabled)}
              onDelete={() => handleDelete(rule)}
              onAudit={() => setAuditRule({ rule })}
            />
          ))}
        </div>
      )}

      {/* Add rule modal */}
      {showAddModal && (
        <AddRuleModal
          storeId={storeSlug}
          onClose={() => setShowAddModal(false)}
          onCreated={(rule) => { setRules((prev) => [rule, ...prev]); }}
        />
      )}

      {/* Audit modal */}
      {auditRule && (
        <AuditModal
          storeId={storeSlug}
          ruleId={auditRule.rule._id}
          ruleTitle={auditRule.rule.offerConfig.title}
          onClose={() => setAuditRule(null)}
        />
      )}
    </div>
  );
}
