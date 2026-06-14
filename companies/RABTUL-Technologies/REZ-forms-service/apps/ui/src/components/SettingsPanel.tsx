'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings, Globe, Bell, Shield, Palette, Link2,
  Copy, Check, ExternalLink, QrCode, Zap, Save
} from 'lucide-react';

interface Form {
  id: string;
  slug: string;
  settings: {
    allowAnonymous: boolean;
    oneSubmissionPerUser: boolean;
    showProgressBar: boolean;
    showQuestionNumbers: boolean;
    notifyOnSubmission: boolean;
    notificationEmails: string[];
    confirmationMessage: string;
    requireCorpID: boolean;
    storeResponses: boolean;
    scheduleStart?: string;
    scheduleEnd?: string;
    maxSubmissions?: number;
    closedMessage?: string;
  };
  branding: {
    logo?: string;
    primaryColor: string;
    backgroundColor: string;
    fontFamily?: string;
    hidePoweredBy: boolean;
  };
  qrEnabled: boolean;
  qrSettings?: {
    size: number;
    color: string;
    offlineMode: boolean;
  };
}

interface SettingsPanelProps {
  form: Form;
  onUpdate: (updates: any) => void;
}

type Tab = 'general' | 'branding' | 'sharing' | 'workflows';

export function SettingsPanel({ form, onUpdate }: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [copied, setCopied] = useState(false);
  const [notificationEmail, setNotificationEmail] = useState('');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addNotificationEmail = () => {
    if (notificationEmail && !form.settings.notificationEmails.includes(notificationEmail)) {
      onUpdate({
        settings: {
          ...form.settings,
          notificationEmails: [...form.settings.notificationEmails, notificationEmail],
        },
      });
      setNotificationEmail('');
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'sharing', label: 'Sharing', icon: Link2 },
    { id: 'workflows', label: 'Workflows', icon: Zap },
  ] as const;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-gray-200 p-6"
      >
        {activeTab === 'general' && (
          <div className="space-y-6">
            <h3 className="font-semibold text-gray-900">General Settings</h3>

            {/* Submission Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700">Allow anonymous submissions</p>
                  <p className="text-sm text-gray-500">Let users submit without logging in</p>
                </div>
                <Toggle
                  checked={form.settings.allowAnonymous}
                  onChange={(v) => onUpdate({ settings: { ...form.settings, allowAnonymous: v } })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700">One submission per user</p>
                  <p className="text-sm text-gray-500">Prevent duplicate submissions</p>
                </div>
                <Toggle
                  checked={form.settings.oneSubmissionPerUser}
                  onChange={(v) => onUpdate({ settings: { ...form.settings, oneSubmissionPerUser: v } })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700">Require CorpID login</p>
                  <p className="text-sm text-gray-500">Users must be logged in to submit</p>
                </div>
                <Toggle
                  checked={form.settings.requireCorpID}
                  onChange={(v) => onUpdate({ settings: { ...form.settings, requireCorpID: v } })}
                />
              </div>
            </div>

            {/* Display Settings */}
            <div className="border-t border-gray-100 pt-6">
              <h4 className="font-medium text-gray-700 mb-4">Display</h4>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700">Show progress bar</p>
                </div>
                <Toggle
                  checked={form.settings.showProgressBar}
                  onChange={(v) => onUpdate({ settings: { ...form.settings, showProgressBar: v } })}
                />
              </div>

              <div className="flex items-center justify-between mt-4">
                <div>
                  <p className="font-medium text-gray-700">Show question numbers</p>
                </div>
                <Toggle
                  checked={form.settings.showQuestionNumbers}
                  onChange={(v) => onUpdate({ settings: { ...form.settings, showQuestionNumbers: v } })}
                />
              </div>
            </div>

            {/* Notifications */}
            <div className="border-t border-gray-100 pt-6">
              <h4 className="font-medium text-gray-700 mb-4 flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Notifications
              </h4>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700">Email on new submission</p>
                </div>
                <Toggle
                  checked={form.settings.notifyOnSubmission}
                  onChange={(v) => onUpdate({ settings: { ...form.settings, notifyOnSubmission: v } })}
                />
              </div>

              {form.settings.notifyOnSubmission && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notification emails
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={notificationEmail}
                      onChange={(e) => setNotificationEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                    <button
                      onClick={addNotificationEmail}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.settings.notificationEmails.map((email, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm"
                      >
                        {email}
                        <button
                          onClick={() => onUpdate({
                            settings: {
                              ...form.settings,
                              notificationEmails: form.settings.notificationEmails.filter((_, idx) => idx !== i),
                            },
                          })}
                          className="text-gray-400 hover:text-red-500"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmation message
                </label>
                <textarea
                  value={form.settings.confirmationMessage}
                  onChange={(e) => onUpdate({ settings: { ...form.settings, confirmationMessage: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  rows={2}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'branding' && (
          <div className="space-y-6">
            <h3 className="font-semibold text-gray-900">Branding</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primary Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.branding.primaryColor}
                  onChange={(e) => onUpdate({ branding: { ...form.branding, primaryColor: e.target.value } })}
                  className="w-12 h-12 rounded-lg border-2 border-gray-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={form.branding.primaryColor}
                  onChange={(e) => onUpdate({ branding: { ...form.branding, primaryColor: e.target.value } })}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Background Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.branding.backgroundColor}
                  onChange={(e) => onUpdate({ branding: { ...form.branding, backgroundColor: e.target.value } })}
                  className="w-12 h-12 rounded-lg border-2 border-gray-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={form.branding.backgroundColor}
                  onChange={(e) => onUpdate({ branding: { ...form.branding, backgroundColor: e.target.value } })}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-700">Hide "Powered by REZ Forms"</p>
              </div>
              <Toggle
                checked={form.branding.hidePoweredBy}
                onChange={(v) => onUpdate({ branding: { ...form.branding, hidePoweredBy: v } })}
              />
            </div>
          </div>
        )}

        {activeTab === 'sharing' && (
          <div className="space-y-6">
            <h3 className="font-semibold text-gray-900">Share Your Form</h3>

            {/* Form URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Form URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={`https://forms.rez.money/${form.slug}`}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50"
                />
                <button
                  onClick={() => copyToClipboard(`https://forms.rez.money/${form.slug}`)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Embed Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Embed Code
              </label>
              <textarea
                readOnly
                value={`<iframe src="https://forms.rez.money/embed/${form.id}" width="100%" height="600" frameborder="0"></iframe>`}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 font-mono"
                rows={3}
              />
            </div>

            {/* QR Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <QrCode className="w-4 h-4" />
                QR Code
              </label>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                  <QrCode className="w-12 h-12 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-2">
                    QR codes let users fill your form offline
                  </p>
                  <button
                    onClick={() => onUpdate({ qrEnabled: !form.qrEnabled })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      form.qrEnabled
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {form.qrEnabled ? 'QR Enabled' : 'Enable QR'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'workflows' && (
          <div className="space-y-6">
            <h3 className="font-semibold text-gray-900">Workflows</h3>
            <p className="text-sm text-gray-500">
              Automate actions when someone submits your form
            </p>

            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
              <Zap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h4 className="font-medium text-gray-700 mb-2">No workflows yet</h4>
              <p className="text-sm text-gray-500 mb-4">
                Connect your form to other services to automate actions
              </p>
              <button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">
                Add Workflow
              </button>
            </div>

            {/* Available Integrations */}
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Available Integrations</h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: 'REZ Merchant', desc: 'Create leads automatically' },
                  { name: 'CorpID CRM', desc: 'Add contacts to CRM' },
                  { name: 'Email', desc: 'Send confirmation emails' },
                  { name: 'Genie AI', desc: 'Trigger AI agents' },
                  { name: 'SafeQR', desc: 'Generate emergency QR' },
                  { name: 'Webhook', desc: 'Send data to external URL' },
                ].map((integration) => (
                  <div
                    key={integration.name}
                    className="p-3 border border-gray-200 rounded-lg hover:border-purple-300 cursor-pointer"
                  >
                    <p className="font-medium text-gray-900 text-sm">{integration.name}</p>
                    <p className="text-xs text-gray-500">{integration.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// Toggle Component
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full transition-colors ${
        checked ? 'bg-purple-600' : 'bg-gray-200'
      }`}
    >
      <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
        checked ? 'translate-x-5' : 'translate-x-0.5'
      }`} />
    </button>
  );
}