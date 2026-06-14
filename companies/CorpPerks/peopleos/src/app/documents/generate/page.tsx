'use client';

import { useState } from 'react';

interface Template {
  id: string;
  name: string;
  category: string;
  icon: string;
  color: string;
  fields: { name: string; type: string; required: boolean }[];
}

interface GeneratedDocument {
  id: string;
  templateName: string;
  employeeName: string;
  createdAt: string;
  status: 'draft' | 'pending' | 'signed' | 'expired';
  downloadUrl: string;
}

const templates: Template[] = [
  { id: '1', name: 'Offer Letter', category: 'Hiring', icon: '📄', color: '#8b5cf6', fields: [{ name: 'employeeName', type: 'text', required: true }, { name: 'position', type: 'text', required: true }, { name: 'salary', type: 'currency', required: true }, { name: 'startDate', type: 'date', required: true }, { name: 'department', type: 'select', required: true }] },
  { id: '2', name: 'Employment Contract', category: 'Hiring', icon: '📝', color: '#3b82f6', fields: [{ name: 'employeeName', type: 'text', required: true }, { name: 'position', type: 'text', required: true }, { name: 'salary', type: 'currency', required: true }, { name: 'startDate', type: 'date', required: true }, { name: 'endDate', type: 'date', required: false }, { name: 'probation', type: 'select', required: true }] },
  { id: '3', name: 'NDA Agreement', category: 'Legal', icon: '🔒', color: '#ef4444', fields: [{ name: 'employeeName', type: 'text', required: true }, { name: 'effectiveDate', type: 'date', required: true }, { name: 'duration', type: 'select', required: true }] },
  { id: '4', name: 'Promotion Letter', category: 'HR', icon: '🎉', color: '#10b981', fields: [{ name: 'employeeName', type: 'text', required: true }, { name: 'currentPosition', type: 'text', required: true }, { name: 'newPosition', type: 'text', required: true }, { name: 'effectiveDate', type: 'date', required: true }, { name: 'newSalary', type: 'currency', required: true }] },
  { id: '5', name: 'Salary Revision', category: 'HR', icon: '💰', color: '#f59e0b', fields: [{ name: 'employeeName', type: 'text', required: true }, { name: 'currentSalary', type: 'currency', required: true }, { name: 'newSalary', type: 'currency', required: true }, { name: 'effectiveDate', type: 'date', required: true }, { name: 'reason', type: 'textarea', required: false }] },
  { id: '6', name: 'Experience Letter', category: 'HR', icon: '🏆', color: '#06b6d4', fields: [{ name: 'employeeName', type: 'text', required: true }, { name: 'position', type: 'text', required: true }, { name: 'joinDate', type: 'date', required: true }, { name: 'relieveDate', type: 'date', required: true }, { name: 'lastCompany', type: 'text', required: false }] },
  { id: '7', name: 'Relieving Letter', category: 'HR', icon: '📤', color: '#64748b', fields: [{ name: 'employeeName', type: 'text', required: true }, { name: 'position', type: 'text', required: true }, { name: 'joinDate', type: 'date', required: true }, { name: 'relieveDate', type: 'date', required: true }, { name: 'reason', type: 'textarea', required: false }] },
  { id: '8', name: 'Bonus Letter', category: 'Compensation', icon: '🎁', color: '#ec4899', fields: [{ name: 'employeeName', type: 'text', required: true }, { name: 'bonusAmount', type: 'currency', required: true }, { name: 'bonusType', type: 'select', required: true }, { name: 'period', type: 'text', required: true }] },
  { id: '9', name: 'Benefits Enrollment', category: 'Benefits', icon: '🎯', color: '#14b8a6', fields: [{ name: 'employeeName', type: 'text', required: true }, { name: 'healthInsurance', type: 'checkbox', required: false }, { name: 'dentalInsurance', type: 'checkbox', required: false }, { name: 'lifeInsurance', type: 'checkbox', required: false }, { name: 'effectiveDate', type: 'date', required: true }] },
  { id: '10', name: 'Policy Acknowledgment', category: 'Legal', icon: '📋', color: '#6366f1', fields: [{ name: 'employeeName', type: 'text', required: true }, { name: 'policyName', type: 'select', required: true }, { name: 'ackDate', type: 'date', required: true }] },
];

const mockGeneratedDocs: GeneratedDocument[] = [
  { id: '1', templateName: 'Offer Letter', employeeName: 'Priya Sharma', createdAt: '2026-05-28', status: 'pending', downloadUrl: '#' },
  { id: '2', templateName: 'NDA Agreement', employeeName: 'Rahul Verma', createdAt: '2026-05-27', status: 'signed', downloadUrl: '#' },
  { id: '3', templateName: 'Promotion Letter', employeeName: 'Sneha Patel', createdAt: '2026-05-26', status: 'draft', downloadUrl: '#' },
  { id: '4', templateName: 'Salary Revision', employeeName: 'Amit Kumar', createdAt: '2026-05-25', status: 'expired', downloadUrl: '#' },
];

const employees = ['Priya Sharma', 'Rahul Verma', 'Sneha Patel', 'Amit Kumar', 'Neha Singh', 'Vikram Rao'];
const departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Operations', 'Finance'];
const positions = ['Software Engineer', 'Product Manager', 'Marketing Lead', 'Sales Executive', 'HR Manager', 'Operations Lead'];

export default function DocumentGeneratePage() {
  const [activeTab, setActiveTab] = useState<'templates' | 'generate' | 'history'>('templates');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generatedDocs, setGeneratedDocs] = useState<GeneratedDocument[]>(mockGeneratedDocs);
  const [formData, setFormData] = useState<Record<string, string | boolean>>({});
  const [categoryFilter, setCategoryFilter] = useState('All');

  const categories = ['All', 'Hiring', 'HR', 'Legal', 'Compensation', 'Benefits'];

  const filteredTemplates = categoryFilter === 'All'
    ? templates
    : templates.filter((t) => t.category === categoryFilter);

  const stats = {
    templates: templates.length,
    generatedThisMonth: generatedDocs.length,
    pendingSignatures: generatedDocs.filter((d) => d.status === 'pending').length,
    signed: generatedDocs.filter((d) => d.status === 'signed').length,
  };

  const handleGenerate = () => {
    if (!selectedTemplate) return;
    const newDoc: GeneratedDocument = {
      id: `${Date.now()}`,
      templateName: selectedTemplate.name,
      employeeName: (formData.employeeName as string) || 'Employee',
      createdAt: new Date().toISOString().split('T')[0],
      status: 'draft',
      downloadUrl: '#',
    };
    setGeneratedDocs((prev) => [newDoc, ...prev]);
    setShowGenerateModal(false);
    setSelectedTemplate(null);
    setFormData({});
    setActiveTab('history');
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; color: string; label: string }> = {
      draft: { bg: '#f3f4f6', color: '#6b7280', label: 'Draft' },
      pending: { bg: '#fef3c7', color: '#b45309', label: 'Pending Signature' },
      signed: { bg: '#dcfce7', color: '#15803d', label: 'Signed' },
      expired: { bg: '#fee2e2', color: '#dc2626', label: 'Expired' },
    };
    const s = styles[status] || styles.draft;
    return (
      <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: s.bg, color: s.color }}>
        {s.label}
      </span>
    );
  };

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span>Document Generator</span>
          <span style={{ fontSize: 14, padding: '4px 12px', background: '#10b981', color: 'white', borderRadius: 20, fontWeight: 500 }}>AI-Powered</span>
        </h1>
        <p style={{ color: '#6b7280', margin: '8px 0 0' }}>Create professional HR documents in seconds with AI assistance</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ background: 'white', padding: 20, borderRadius: 12, textAlign: 'center' }}>
          <p style={{ fontSize: 32, fontWeight: 700, color: '#8b5cf6', margin: 0 }}>{stats.templates}</p>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '8px 0 0' }}>Templates</p>
        </div>
        <div style={{ background: 'white', padding: 20, borderRadius: 12, textAlign: 'center' }}>
          <p style={{ fontSize: 32, fontWeight: 700, color: '#3b82f6', margin: 0 }}>{stats.generatedThisMonth}</p>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '8px 0 0' }}>Generated This Month</p>
        </div>
        <div style={{ background: 'white', padding: 20, borderRadius: 12, textAlign: 'center' }}>
          <p style={{ fontSize: 32, fontWeight: 700, color: '#f59e0b', margin: 0 }}>{stats.pendingSignatures}</p>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '8px 0 0' }}>Pending Signatures</p>
        </div>
        <div style={{ background: 'white', padding: 20, borderRadius: 12, textAlign: 'center' }}>
          <p style={{ fontSize: 32, fontWeight: 700, color: '#10b981', margin: 0 }}>{stats.signed}</p>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '8px 0 0' }}>Signed Documents</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[
          { key: 'templates', label: 'Templates', icon: '📋' },
          { key: 'generate', label: 'Generate', icon: '✨' },
          { key: 'history', label: 'History', icon: '📜' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 500,
              background: activeTab === tab.key ? '#10b981' : '#e5e7eb',
              color: activeTab === tab.key ? 'white' : '#6b7280',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: 20,
                  cursor: 'pointer',
                  fontWeight: 500,
                  background: categoryFilter === cat ? '#10b981' : '#e5e7eb',
                  color: categoryFilter === cat ? 'white' : '#6b7280',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                style={{
                  background: 'white',
                  padding: 24,
                  borderRadius: 12,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  border: '2px solid transparent',
                }}
                onClick={() => {
                  setSelectedTemplate(template);
                  setShowGenerateModal(true);
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = template.color;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: `${template.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 24 }}>{template.icon}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{template.name}</h3>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>{template.category}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                  {template.fields.slice(0, 3).map((field, i) => (
                    <span key={i} style={{ fontSize: 11, padding: '2px 8px', background: '#f3f4f6', borderRadius: 12, color: '#6b7280' }}>
                      {field.name}
                    </span>
                  ))}
                  {template.fields.length > 3 && (
                    <span style={{ fontSize: 11, padding: '2px 8px', background: '#f3f4f6', borderRadius: 12, color: '#6b7280' }}>
                      +{template.fields.length - 3} more
                    </span>
                  )}
                </div>
                <button
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    background: template.color,
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  Use Template
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generate Tab */}
      {activeTab === 'generate' && (
        <div style={{ background: 'white', padding: 32, borderRadius: 12 }}>
          <h2 style={{ margin: '0 0 24px' }}>Generate New Document</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Select Template</label>
              <select
                style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                onChange={(e) => {
                  const t = templates.find((t) => t.id === e.target.value);
                  setSelectedTemplate(t || null);
                }}
              >
                <option value="">Choose a template...</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Employee</label>
              <select
                style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                onChange={(e) => setFormData((prev) => ({ ...prev, employeeName: e.target.value }))}
              >
                <option value="">Select employee...</option>
                {employees.map((emp) => (
                  <option key={emp} value={emp}>{emp}</option>
                ))}
              </select>
            </div>
          </div>

          {selectedTemplate && (
            <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #e5e7eb' }}>
              <h3 style={{ margin: '0 0 16px' }}>Fill Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {selectedTemplate.fields.map((field) => (
                  <div key={field.name} style={{ gridColumn: field.type === 'textarea' ? 'span 2' : 'auto' }}>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 13 }}>
                      {field.name.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                      {field.required && <span style={{ color: '#ef4444' }}> *</span>}
                    </label>
                    {field.type === 'text' && (
                      <input
                        type="text"
                        style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                        onChange={(e) => setFormData((prev) => ({ ...prev, [field.name]: e.target.value }))}
                      />
                    )}
                    {field.type === 'currency' && (
                      <input
                        type="number"
                        placeholder="₹0"
                        style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                        onChange={(e) => setFormData((prev) => ({ ...prev, [field.name]: e.target.value }))}
                      />
                    )}
                    {field.type === 'date' && (
                      <input
                        type="date"
                        style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                        onChange={(e) => setFormData((prev) => ({ ...prev, [field.name]: e.target.value }))}
                      />
                    )}
                    {field.type === 'select' && (
                      <select
                        style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                        onChange={(e) => setFormData((prev) => ({ ...prev, [field.name]: e.target.value }))}
                      >
                        <option value="">Select...</option>
                        {(field.name === 'department' ? departments : field.name === 'position' ? positions : ['Yes', 'No', '3 months', '6 months', '12 months', '24 months', 'Annual', 'Quarterly', 'Performance Bonus', 'Signing Bonus']).map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}
                    {field.type === 'textarea' && (
                      <textarea
                        style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e5e7eb', minHeight: 80 }}
                        placeholder="Enter details..."
                        onChange={(e) => setFormData((prev) => ({ ...prev, [field.name]: e.target.value }))}
                      />
                    )}
                    {field.type === 'checkbox' && (
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          onChange={(e) => setFormData((prev) => ({ ...prev, [field.name]: e.target.checked }))}
                        />
                        <span style={{ fontSize: 13, color: '#6b7280' }}>Include {field.name.replace(/([A-Z])/g, ' $1')}</span>
                      </label>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 24, padding: 16, background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 16 }}>🤖</span>
                  <span style={{ fontWeight: 600, color: '#15803d' }}>AI Preview</span>
                </div>
                <p style={{ fontSize: 13, color: '#166534', margin: 0 }}>
                  Document will be generated with auto-filled company details, legal clauses, and professional formatting.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button
                  style={{ flex: 1, padding: 12, background: '#e5e7eb', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 500 }}
                >
                  Save as Draft
                </button>
                <button
                  onClick={handleGenerate}
                  style={{ flex: 1, padding: 12, background: '#10b981', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
                >
                  Generate Document
                </button>
              </div>
            </div>
          )}

          {!selectedTemplate && (
            <div style={{ textAlign: 'center', padding: 48, color: '#6b7280' }}>
              <span style={{ fontSize: 48, display: 'block', marginBottom: 16 }}>📋</span>
              <p>Select a template to start generating documents</p>
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', textAlign: 'left', fontSize: 13, color: '#6b7280' }}>
                <th style={{ padding: '12px 16px' }}>Document</th>
                <th style={{ padding: '12px 16px' }}>Employee</th>
                <th style={{ padding: '12px 16px' }}>Created</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {generatedDocs.map((doc) => (
                <tr key={doc.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: '#8b5cf620', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span>📄</span>
                      </div>
                      <span style={{ fontWeight: 500 }}>{doc.templateName}</span>
                    </div>
                  </td>
                  <td style={{ padding: 16 }}>{doc.employeeName}</td>
                  <td style={{ padding: 16, color: '#6b7280' }}>{doc.createdAt}</td>
                  <td style={{ padding: 16 }}>{getStatusBadge(doc.status)}</td>
                  <td style={{ padding: 16 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button style={{ padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                        {doc.status === 'draft' ? 'Edit' : doc.status === 'pending' ? 'Send for Signature' : 'Download'}
                      </button>
                      <button style={{ padding: '6px 12px', background: '#e5e7eb', color: '#6b7280', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                        Preview
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Generate Modal */}
      {showGenerateModal && selectedTemplate && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setShowGenerateModal(false)}
        >
          <div
            style={{ background: 'white', padding: 32, borderRadius: 16, width: 600, maxHeight: '80vh', overflow: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: `${selectedTemplate.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 24 }}>{selectedTemplate.icon}</span>
              </div>
              <div>
                <h2 style={{ margin: 0 }}>{selectedTemplate.name}</h2>
                <span style={{ fontSize: 13, color: '#6b7280' }}>{selectedTemplate.category}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {selectedTemplate.fields.map((field) => (
                <div key={field.name} style={{ gridColumn: field.type === 'textarea' ? 'span 2' : 'auto' }}>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 13 }}>
                    {field.name.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                    {field.required && <span style={{ color: '#ef4444' }}> *</span>}
                  </label>
                  {field.type === 'text' && (
                    <input
                      type="text"
                      style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                      onChange={(e) => setFormData((prev) => ({ ...prev, [field.name]: e.target.value }))}
                    />
                  )}
                  {field.type === 'currency' && (
                    <input
                      type="number"
                      placeholder="₹0"
                      style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                      onChange={(e) => setFormData((prev) => ({ ...prev, [field.name]: e.target.value }))}
                    />
                  )}
                  {field.type === 'date' && (
                    <input
                      type="date"
                      style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                      onChange={(e) => setFormData((prev) => ({ ...prev, [field.name]: e.target.value }))}
                    />
                  )}
                  {field.type === 'select' && (
                    <select
                      style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                      onChange={(e) => setFormData((prev) => ({ ...prev, [field.name]: e.target.value }))}
                    >
                      <option value="">Select...</option>
                      {employees.map((emp) => (
                        <option key={emp} value={emp}>{emp}</option>
                      ))}
                    </select>
                  )}
                  {field.type === 'textarea' && (
                    <textarea
                      style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e5e7eb', minHeight: 80 }}
                      onChange={(e) => setFormData((prev) => ({ ...prev, [field.name]: e.target.value }))}
                    />
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button
                onClick={() => setShowGenerateModal(false)}
                style={{ flex: 1, padding: 12, background: '#e5e7eb', border: 'none', borderRadius: 8, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                style={{ flex: 1, padding: 12, background: '#10b981', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
              >
                Generate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
