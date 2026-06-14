'use client';

import { useState, useEffect } from 'react';
import { FormList } from '@/components/FormList';
import { FormEditor } from '@/components/FormEditor';
import { AIAssistant } from '@/components/AIAssistant';
import { FormPreview } from '@/components/FormPreview';
import { SettingsPanel } from '@/components/SettingsPanel';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { ResponseManager } from '@/components/ResponseManager';
import { ConditionalLogicEditor } from '@/components/ConditionalLogicEditor';
import { TemplateLibrary } from '@/components/TemplateLibrary';
import { CalculatedFieldsEditor } from '@/components/CalculatedFieldsEditor';
import { SkipLogicEditor } from '@/components/SkipLogicEditor';
import { FormThemes } from '@/components/FormThemes';
import { EmailTemplatesEditor } from '@/components/EmailTemplatesEditor';
import { SpamProtection } from '@/components/SpamProtection';
import { Plus, Search, Settings, Eye, Sparkles, BarChart3, MessageSquare, GitBranch, Layout, Database, Calculator, GitMerge, Palette, Mail, Shield } from 'lucide-react';

type View = 'list' | 'editor' | 'preview' | 'settings' | 'analytics' | 'responses' | 'logic' | 'templates' | 'calculated' | 'skiplogic' | 'themes' | 'email' | 'spam';

interface Form {
  id: string;
  title: string;
  description?: string;
  blocks: any[];
  fields: any[];
  published: boolean;
  submissionCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function FormsDashboard() {
  const [view, setView] = useState<View>('list');
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);
  const [forms, setForms] = useState<Form[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAI, setShowAI] = useState(false);

  useEffect(() => {
    // Fetch forms on mount
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      const res = await fetch('/api/forms');
      const data = await res.json();
      setForms(data.forms || []);
    } catch (error) {
      console.error('Failed to fetch forms:', error);
    }
  };

  const createNewForm = async () => {
    try {
      const res = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Untitled Form' }),
      });
      const form = await res.json();
      setSelectedForm(form);
      setView('editor');
    } catch (error) {
      console.error('Failed to create form:', error);
    }
  };

  const generateWithAI = async (prompt: string) => {
    try {
      const res = await fetch('/api/ai/generate/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          title: `AI Form - ${new Date().toLocaleDateString()}`,
        }),
      });
      const data = await res.json();
      if (data.form) {
        setSelectedForm(data.form);
        setView('editor');
      }
    } catch (error) {
      console.error('Failed to generate form:', error);
    }
  };

  const updateForm = async (formId: string, updates: Partial<Form>) => {
    try {
      const res = await fetch(`/api/forms/${formId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const updated = await res.json();
      setSelectedForm(updated);
      setForms(prev => prev.map(f => f.id === formId ? updated : f));
    } catch (error) {
      console.error('Failed to update form:', error);
    }
  };

  const filteredForms = forms.filter(f =>
    f.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900">REZ Forms</h1>
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                Beta
              </span>
            </div>

            {view === 'list' && (
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search forms..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-64 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <button
                  onClick={() => setShowAI(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-sm font-medium hover:opacity-90"
                >
                  <Sparkles className="w-4 h-4" />
                  AI Create
                </button>
                <button
                  onClick={createNewForm}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800"
                >
                  <Plus className="w-4 h-4" />
                  New Form
                </button>
              </div>
            )}

            {view !== 'list' && selectedForm && (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setView('editor')}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg ${
                    view === 'editor'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Layout className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => setView('preview')}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg ${
                    view === 'preview'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </button>
                <button
                  onClick={() => setView('responses')}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg ${
                    view === 'responses'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  Responses
                </button>
                <button
                  onClick={() => setView('analytics')}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg ${
                    view === 'analytics'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  Analytics
                </button>
                <button
                  onClick={() => setView('logic')}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg ${
                    view === 'logic'
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <GitBranch className="w-4 h-4" />
                  Logic
                </button>
                <button
                  onClick={() => setView('calculated')}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg ${
                    view === 'calculated'
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Calculator className="w-4 h-4" />
                  Calc
                </button>
                <button
                  onClick={() => setView('skiplogic')}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg ${
                    view === 'skiplogic'
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <GitMerge className="w-4 h-4" />
                  Skip
                </button>
                <button
                  onClick={() => setView('themes')}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg ${
                    view === 'themes'
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Palette className="w-4 h-4" />
                  Theme
                </button>
                <button
                  onClick={() => setView('email')}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg ${
                    view === 'email'
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  Email
                </button>
                <button
                  onClick={() => setView('spam')}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg ${
                    view === 'spam'
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  Spam
                </button>
                <button
                  onClick={() => setView('settings')}
                  className={`p-2 text-sm font-medium rounded-lg ${
                    view === 'settings'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setSelectedForm(null); setView('list'); }}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  ← Back
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'list' && (
          <>
            {/* Templates Tab */}
            <div className="mb-8">
              <button
                onClick={() => setView('templates')}
                className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-md transition-all"
              >
                <Layout className="w-5 h-5 text-purple-600" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">Browse Templates</p>
                  <p className="text-sm text-gray-500">Start with a proven template</p>
                </div>
              </button>
            </div>

            <FormList
              forms={filteredForms}
              onSelect={(form) => {
                setSelectedForm(form);
                setView('editor');
              }}
              onDelete={async (formId) => {
                await fetch(`/api/forms/${formId}`, { method: 'DELETE' });
                setForms(prev => prev.filter(f => f.id !== formId));
              }}
              onDuplicate={async (form) => {
                const res = await fetch(`/api/forms/${form.id}/clone`, { method: 'POST' });
                const cloned = await res.json();
                setForms(prev => [...prev, cloned]);
              }}
            />
          </>
        )}

        {view === 'templates' && (
          <TemplateLibrary onSelect={generateWithAI} />
        )}

        {view === 'editor' && selectedForm && (
          <FormEditor
            form={selectedForm}
            onUpdate={(updates) => updateForm(selectedForm.id, updates)}
          />
        )}

        {view === 'preview' && selectedForm && (
          <FormPreview form={selectedForm} />
        )}

        {view === 'responses' && selectedForm && (
          <ResponseManager formId={selectedForm.id} fields={selectedForm.fields} />
        )}

        {view === 'analytics' && selectedForm && (
          <AnalyticsDashboard formId={selectedForm.id} />
        )}

        {view === 'logic' && selectedForm && (
          <ConditionalLogicEditor
            fields={selectedForm.fields}
            rules={selectedForm.workflows || []}
            onUpdate={(rules) => updateForm(selectedForm.id, { workflows: rules })}
          />
        )}

        {view === 'calculated' && selectedForm && (
          <CalculatedFieldsEditor
            fields={selectedForm.fields}
            calculations={[]}
            onUpdate={(calculations) => console.log('Calculations:', calculations)}
          />
        )}

        {view === 'skiplogic' && selectedForm && (
          <SkipLogicEditor
            fields={selectedForm.fields}
            skipRules={[]}
            onUpdate={(skipRules) => console.log('Skip Rules:', skipRules)}
          />
        )}

        {view === 'themes' && selectedForm && (
          <FormThemes
            currentBranding={selectedForm.branding}
            onApply={(branding) => updateForm(selectedForm.id, { branding })}
          />
        )}

        {view === 'email' && selectedForm && (
          <EmailTemplatesEditor
            templates={[]}
            onUpdate={(templates) => console.log('Templates:', templates)}
          />
        )}

        {view === 'spam' && selectedForm && (
          <SpamProtection
            settings={{
              enabled: false,
              captchaType: 'none',
              honeypot: false,
              rateLimit: false,
              maxSubmissionsPerIP: 3,
              timeLimit: 60,
              blockEmails: [],
              requireConsent: false,
            }}
            onUpdate={(settings) => console.log('Spam settings:', settings)}
          />
        )}

        {view === 'settings' && selectedForm && (
          <SettingsPanel
            form={selectedForm}
            onUpdate={(updates) => updateForm(selectedForm.id, updates)}
          />
        )}
      </main>

      {/* AI Assistant Modal */}
      {showAI && (
        <AIAssistant
          onClose={() => setShowAI(false)}
          onGenerate={generateWithAI}
        />
      )}
    </div>
  );
}