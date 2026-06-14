'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Mail, Plus, Trash2, Edit2, Eye, Check, Copy,
  FileText, Send, Users, MessageSquare
} from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: 'confirmation' | 'notification' | 'custom';
  enabled: boolean;
}

interface EmailTemplatesEditorProps {
  templates: EmailTemplate[];
  onUpdate: (templates: EmailTemplate[]) => void;
}

const VARIABLES = [
  { variable: '{{form_title}}', description: 'The name of your form' },
  { variable: '{{submission_date}}', description: 'Date of submission' },
  { variable: '{{respondent_email}}', description: "Respondent's email" },
  { variable: '{{respondent_name}}', description: "Respondent's name" },
  { variable: '{{all_answers}}', description: 'All form responses' },
  { variable: '{{answer_fieldname}}', description: 'Specific field value (replace fieldname)' },
];

const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: 'confirmation',
    name: 'Submission Confirmation',
    subject: 'We received your {{form_title}} response!',
    body: `Hi {{respondent_name}},

Thank you for submitting the {{form_title}} form. We have received your response and will get back to you shortly.

Your responses:
{{all_answers}}

If you have any questions, please reply to this email.

Best regards,
The Team`,
    type: 'confirmation',
    enabled: true,
  },
  {
    id: 'notification',
    name: 'Admin Notification',
    subject: 'New {{form_title}} submission received',
    body: `A new submission was received for {{form_title}}.

Respondent: {{respondent_name}} ({{respondent_email}})
Date: {{submission_date}}

Responses:
{{all_answers}}

---
View all submissions in your REZ Forms dashboard.`,
    type: 'notification',
    enabled: true,
  },
];

export function EmailTemplatesEditor({ templates, onUpdate }: EmailTemplatesEditorProps) {
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const allTemplates = templates.length > 0 ? templates : DEFAULT_TEMPLATES;

  const addTemplate = () => {
    const newTemplate: EmailTemplate = {
      id: `template_${Date.now()}`,
      name: 'New Email Template',
      subject: 'New message from {{form_title}}',
      body: `Hi,

Thank you for your submission.

Best regards`,
      type: 'custom',
      enabled: true,
    };
    onUpdate([...allTemplates, newTemplate]);
    setEditingTemplate(newTemplate.id);
  };

  const updateTemplate = (id: string, updates: Partial<EmailTemplate>) => {
    onUpdate(allTemplates.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTemplate = (id: string) => {
    onUpdate(allTemplates.filter(t => t.id !== id));
    setEditingTemplate(null);
  };

  const toggleEnabled = (id: string) => {
    const template = allTemplates.find(t => t.id === id);
    if (template) {
      updateTemplate(id, { enabled: !template.enabled });
    }
  };

  const copyTemplate = (template: EmailTemplate) => {
    const copied: EmailTemplate = {
      ...template,
      id: `template_${Date.now()}`,
      name: `${template.name} (Copy)`,
    };
    onUpdate([...allTemplates, copied]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const insertVariable = (templateId: string, variable: string) => {
    const template = allTemplates.find(t => t.id === templateId);
    if (template) {
      updateTemplate(templateId, { body: template.body + '\n' + variable });
    }
  };

  const getTemplateIcon = (type: string) => {
    switch (type) {
      case 'confirmation': return <Mail className="w-4 h-4" />;
      case 'notification': return <Send className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const formatPreview = (template: EmailTemplate) => {
    return template.body
      .replace(/\{\{form_title\}\}/g, 'Contact Form')
      .replace(/\{\{submission_date\}\}/g, new Date().toLocaleDateString())
      .replace(/\{\{respondent_email\}\}/g, 'john@example.com')
      .replace(/\{\{respondent_name\}\}/g, 'John Doe')
      .replace(/\{\{all_answers\}\}/g, '- Name: John Doe\n- Email: john@example.com\n- Message: Hello!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Templates
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Customize confirmation and notification emails
          </p>
        </div>
        <button
          onClick={addTemplate}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
        >
          <Plus className="w-4 h-4" />
          New Template
        </button>
      </div>

      {/* Templates List */}
      <div className="space-y-4">
        {allTemplates.map((template) => {
          const isEditing = editingTemplate === template.id;
          const isPreview = previewTemplate === template.id;

          return (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white border rounded-xl overflow-hidden ${
                template.enabled ? 'border-gray-200' : 'border-gray-100 opacity-60'
              }`}
            >
              {/* Template Header */}
              <div className="flex items-center gap-4 p-4 border-b border-gray-100">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  template.type === 'confirmation' ? 'bg-green-100 text-green-600' :
                  template.type === 'notification' ? 'bg-blue-100 text-blue-600' :
                  'bg-purple-100 text-purple-600'
                }`}>
                  {getTemplateIcon(template.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900">{template.name}</h4>
                  <p className="text-sm text-gray-500 truncate">{template.subject}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleEnabled(template.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      template.enabled
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {template.enabled ? 'Active' : 'Disabled'}
                  </button>

                  <button
                    onClick={() => setPreviewTemplate(isPreview ? null : template.id)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                    title="Preview"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => copyTemplate(template)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                    title="Duplicate"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => setEditingTemplate(isEditing ? null : template.id)}
                    className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => deleteTemplate(template.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Preview */}
              {isPreview && (
                <div className="p-4 bg-gray-50 border-b border-gray-100">
                  <div className="bg-white rounded-lg border border-gray-200 max-w-xl">
                    <div className="p-3 border-b border-gray-100 bg-gray-50">
                      <p className="text-sm"><strong>Subject:</strong> {formatPreview(template).split('\n')[0]}</p>
                    </div>
                    <div className="p-4">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                        {formatPreview(template)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {/* Editor */}
              {isEditing && (
                <div className="p-4 bg-gray-50 border-b border-gray-100 space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Template Name
                    </label>
                    <input
                      type="text"
                      value={template.name}
                      onChange={(e) => updateTemplate(template.id, { name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Subject
                    </label>
                    <input
                      type="text"
                      value={template.subject}
                      onChange={(e) => updateTemplate(template.id, { subject: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>

                  {/* Body */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm font-medium text-gray-700">
                        Email Body
                      </label>
                      <div className="relative group">
                        <button className="text-xs text-purple-600 hover:text-purple-700">
                          + Insert Variable
                        </button>
                        <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10 hidden group-hover:block">
                          {VARIABLES.map((v) => (
                            <button
                              key={v.variable}
                              onClick={() => insertVariable(template.id, v.variable)}
                              className="w-full px-3 py-2 text-left hover:bg-gray-50"
                            >
                              <code className="text-xs text-purple-600">{v.variable}</code>
                              <p className="text-xs text-gray-500">{v.description}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <textarea
                      value={template.body}
                      onChange={(e) => updateTemplate(template.id, { body: e.target.value })}
                      rows={10}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono"
                    />
                  </div>

                  {/* Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Template Type
                    </label>
                    <div className="flex gap-4">
                      {(['confirmation', 'notification', 'custom'] as const).map((type) => (
                        <label key={type} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`type-${template.id}`}
                            checked={template.type === type}
                            onChange={() => updateTemplate(template.id, { type })}
                            className="text-purple-600"
                          />
                          <span className="text-sm text-gray-700 capitalize">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => setEditingTemplate(null)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
                    >
                      Done Editing
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}

        {allTemplates.length === 0 && (
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
            <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h4 className="font-medium text-gray-700 mb-2">No email templates</h4>
            <p className="text-sm text-gray-500 mb-4">
              Create custom emails for confirmations and notifications
            </p>
            <button
              onClick={addTemplate}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
            >
              Create your first template
            </button>
          </div>
        )}
      </div>

      {/* Available Variables */}
      <div className="bg-purple-50 rounded-xl p-4">
        <h4 className="font-medium text-purple-900 mb-2 flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Available Variables
        </h4>
        <p className="text-sm text-purple-700 mb-3">
          Use these variables in your email templates to personalize content:
        </p>
        <div className="grid grid-cols-2 gap-2">
          {VARIABLES.map((v) => (
            <div key={v.variable} className="flex items-start gap-2">
              <code className="text-xs bg-purple-100 px-2 py-1 rounded text-purple-700 whitespace-nowrap">
                {v.variable}
              </code>
              <span className="text-xs text-purple-600">{v.description}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}