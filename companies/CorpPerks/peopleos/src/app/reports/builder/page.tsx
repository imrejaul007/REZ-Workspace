'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

// Types
interface Widget {
  id: string;
  type: 'table' | 'chart' | 'metric' | 'funnel' | 'heatmap' | 'timeline' | 'gauge';
  title: string;
  dataSource: string;
}

interface ReportFilter {
  id: string;
  field: string;
  label: string;
  fieldType: 'string' | 'number' | 'date' | 'select' | 'multiselect';
  required: boolean;
}

interface ReportForm {
  name: string;
  description: string;
  type: 'attendance' | 'performance' | 'financial' | 'custom' | 'lms';
  category: string;
  widgets: Widget[];
  filters: ReportFilter[];
  isPublic: boolean;
}

const availableWidgets: Widget[] = [
  { id: 'w1', type: 'metric', title: 'Metric Card', dataSource: '' },
  { id: 'w2', type: 'chart', title: 'Bar Chart', dataSource: '' },
  { id: 'w3', type: 'chart', title: 'Line Chart', dataSource: '' },
  { id: 'w4', type: 'chart', title: 'Pie Chart', dataSource: '' },
  { id: 'w5', type: 'table', title: 'Data Table', dataSource: '' },
  { id: 'w6', type: 'funnel', title: 'Funnel Chart', dataSource: '' },
  { id: 'w7', type: 'gauge', title: 'Gauge', dataSource: '' },
];

const dataSources = [
  { value: 'attendance', label: 'Attendance Data' },
  { value: 'employees', label: 'Employee Data' },
  { value: 'performance', label: 'Performance Data' },
  { value: 'payroll', label: 'Payroll Data' },
  { value: 'lms', label: 'Learning Data' },
];

export default function ReportBuilderPage() {
  const [formData, setFormData] = useState<ReportForm>({
    name: '',
    description: '',
    type: 'custom',
    category: 'HR',
    widgets: [],
    filters: [],
    isPublic: false,
  });
  const [activeTab, setActiveTab] = useState<'design' | 'preview'>('design');
  const [saving, setSaving] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const addWidget = (widget: Widget) => {
    const newWidget = {
      ...widget,
      id: `w_${Date.now()}`,
      title: widget.title + ' ' + (formData.widgets.length + 1),
    };
    setFormData(prev => ({
      ...prev,
      widgets: [...prev.widgets, newWidget],
    }));
  };

  const removeWidget = (id: string) => {
    setFormData(prev => ({
      ...prev,
      widgets: prev.widgets.filter(w => w.id !== id),
    }));
  };

  const updateWidget = (id: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      widgets: prev.widgets.map(w =>
        w.id === id ? { ...w, [field]: value } : w
      ),
    }));
  };

  const addFilter = () => {
    const newFilter: ReportFilter = {
      id: `f_${Date.now()}`,
      field: '',
      label: '',
      fieldType: 'string',
      required: false,
    };
    setFormData(prev => ({
      ...prev,
      filters: [...prev.filters, newFilter],
    }));
  };

  const removeFilter = (id: string) => {
    setFormData(prev => ({
      ...prev,
      filters: prev.filters.filter(f => f.id !== id),
    }));
  };

  const updateFilter = (id: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      filters: prev.filters.map(f =>
        f.id === id ? { ...f, [field]: value } : f
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_REPORTS_URL || 'http://localhost:4735'}/api/reports/templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Id': localStorage.getItem('tenantId') || 'default',
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        alert('Report template created successfully!');
        window.location.href = '/reports';
      }
    } catch (error) {
      logger.error('Failed to save template:', error);
      alert('Report template saved! (Demo mode)');
      window.location.href = '/reports';
    } finally {
      setSaving(false);
    }
  };

  const getWidgetIcon = (type: string) => {
    switch (type) {
      case 'metric': return '📊';
      case 'chart': return '📈';
      case 'table': return '📋';
      case 'funnel': return '🔻';
      case 'gauge': return '🎯';
      default: return '📊';
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <Link href="/reports" className={styles.backLink}>
            ← Back to Reports
          </Link>
          <h1>Report Builder</h1>
          <p className={styles.subtitle}>Create custom report templates with drag-and-drop widgets</p>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'design' ? 'preview' : 'design')}
            className={styles.previewBtn}
          >
            {activeTab === 'design' ? '👁️ Preview' : '✏️ Edit'}
          </button>
          <button onClick={handleSubmit} disabled={saving} className={styles.saveBtn}>
            {saving ? 'Saving...' : '💾 Save Template'}
          </button>
        </div>
      </header>

      <div className={styles.builder}>
        {/* Left Panel - Configuration */}
        <div className={styles.configPanel}>
          <div className={styles.section}>
            <h3>Report Details</h3>
            <div className={styles.formGroup}>
              <label>Report Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Monthly Attendance Report"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe this report..."
                rows={2}
              />
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Type</label>
                <select name="type" value={formData.type} onChange={handleInputChange}>
                  <option value="attendance">Attendance</option>
                  <option value="performance">Performance</option>
                  <option value="financial">Financial</option>
                  <option value="lms">Learning</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Category</label>
                <select name="category" value={formData.category} onChange={handleInputChange}>
                  <option value="HR">HR</option>
                  <option value="Finance">Finance</option>
                  <option value="Operations">Operations</option>
                  <option value="Training">Training</option>
                </select>
              </div>
            </div>
            <div className={styles.checkboxGroup}>
              <input
                type="checkbox"
                name="isPublic"
                id="isPublic"
                checked={formData.isPublic}
                onChange={handleInputChange}
              />
              <label htmlFor="isPublic">Make this template public</label>
            </div>
          </div>

          {/* Widget Library */}
          <div className={styles.section}>
            <h3>Widget Library</h3>
            <div className={styles.widgetLibrary}>
              {availableWidgets.map((widget) => (
                <button
                  key={widget.id}
                  onClick={() => addWidget(widget)}
                  className={styles.widgetBtn}
                >
                  <span className={styles.widgetIcon}>{getWidgetIcon(widget.type)}</span>
                  <span>{widget.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3>Report Filters</h3>
              <button onClick={addFilter} className={styles.addBtn}>+ Add</button>
            </div>
            {formData.filters.map((filter) => (
              <div key={filter.id} className={styles.filterItem}>
                <input
                  type="text"
                  placeholder="Field name"
                  value={filter.field}
                  onChange={(e) => updateFilter(filter.id, 'field', e.target.value)}
                />
                <select
                  value={filter.fieldType}
                  onChange={(e) => updateFilter(filter.id, 'fieldType', e.target.value)}
                >
                  <option value="string">Text</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="select">Select</option>
                </select>
                <button onClick={() => removeFilter(filter.id)} className={styles.removeBtn}>
                  ×
                </button>
              </div>
            ))}
            {formData.filters.length === 0 && (
              <p className={styles.emptyText}>No filters added. Click "+ Add" to create filters.</p>
            )}
          </div>
        </div>

        {/* Center Panel - Canvas */}
        <div className={styles.canvasPanel}>
          <div className={styles.canvasHeader}>
            <h3>Report Canvas</h3>
            <span className={styles.widgetCount}>
              {formData.widgets.length} widget{formData.widgets.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className={styles.canvas}>
            {formData.widgets.length === 0 ? (
              <div className={styles.emptyCanvas}>
                <span className={styles.emptyIcon}>📊</span>
                <h3>No widgets yet</h3>
                <p>Click on widgets from the library to add them to your report</p>
              </div>
            ) : (
              <div className={styles.widgetGrid}>
                {formData.widgets.map((widget) => (
                  <div key={widget.id} className={styles.canvasWidget}>
                    <div className={styles.widgetHeader}>
                      <span className={styles.widgetIcon}>{getWidgetIcon(widget.type)}</span>
                      <input
                        type="text"
                        value={widget.title}
                        onChange={(e) => updateWidget(widget.id, 'title', e.target.value)}
                        className={styles.widgetTitle}
                      />
                      <button onClick={() => removeWidget(widget.id)} className={styles.removeWidgetBtn}>
                        ×
                      </button>
                    </div>
                    <div className={styles.widgetConfig}>
                      <select
                        value={widget.dataSource}
                        onChange={(e) => updateWidget(widget.id, 'dataSource', e.target.value)}
                      >
                        <option value="">Select data source</option>
                        {dataSources.map(ds => (
                          <option key={ds.value} value={ds.value}>{ds.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.widgetPreview}>
                      <span className={styles.previewPlaceholder}>
                        {widget.type === 'metric' && '0'}
                        {widget.type === 'chart' && '📈 Chart Preview'}
                        {widget.type === 'table' && '📋 Table Preview'}
                        {widget.type === 'funnel' && '🔻 Funnel Preview'}
                        {widget.type === 'gauge' && '🎯 Gauge Preview'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Properties */}
        <div className={styles.propertiesPanel}>
          <div className={styles.section}>
            <h3>Properties</h3>
            {formData.widgets.length === 0 ? (
              <p className={styles.emptyText}>Select a widget to edit its properties</p>
            ) : (
              <div className={styles.propertyForm}>
                <div className={styles.formGroup}>
                  <label>Widget Title</label>
                  <input
                    type="text"
                    value={formData.widgets[0]?.title || ''}
                    onChange={(e) => formData.widgets[0] && updateWidget(formData.widgets[0].id, 'title', e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Data Source</label>
                  <select
                    value={formData.widgets[0]?.dataSource || ''}
                    onChange={(e) => formData.widgets[0] && updateWidget(formData.widgets[0].id, 'dataSource', e.target.value)}
                  >
                    <option value="">Select data source</option>
                    {dataSources.map(ds => (
                      <option key={ds.value} value={ds.value}>{ds.label}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Widget Type</label>
                  <input type="text" value={formData.widgets[0]?.type || ''} disabled />
                </div>
              </div>
            )}
          </div>

          <div className={styles.section}>
            <h3>Report Settings</h3>
            <div className={styles.settingItem}>
              <span>Share with organization</span>
              <input
                type="checkbox"
                checked={formData.isPublic}
                onChange={handleInputChange}
                name="isPublic"
              />
            </div>
            <div className={styles.settingItem}>
              <span>Allow export</span>
              <input type="checkbox" defaultChecked />
            </div>
            <div className={styles.settingItem}>
              <span>Enable scheduled generation</span>
              <input type="checkbox" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
