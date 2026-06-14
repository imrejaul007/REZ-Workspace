/**
 * REZ Atlas GTM - PDF Reports Module
 * Generate PDF reports for campaigns, prospects, analytics
 */

const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

// Report storage (in-memory for demo, use database in production)
const reportTemplates = new Map();
const generatedReports = new Map();

// ============================================
// TEMPLATE DEFINITIONS
// ============================================

const DEFAULT_TEMPLATES = {
  campaign_summary: {
    id: 'campaign_summary',
    name: 'Campaign Summary Report',
    description: 'Overview of campaign performance',
    sections: ['header', 'metrics', 'funnel', 'top_prospects', 'recommendations'],
    styles: {
      primaryColor: '#2563EB',
      secondaryColor: '#64748B',
      accentColor: '#10B981'
    }
  },
  prospect_intelligence: {
    id: 'prospect_intelligence',
    name: 'Prospect Intelligence Report',
    description: 'Detailed prospect analysis and scoring',
    sections: ['header', 'overview', 'segments', 'priorities', 'actions'],
    styles: {
      primaryColor: '#7C3AED',
      secondaryColor: '#64748B',
      accentColor: '#F59E0B'
    }
  },
  analytics_overview: {
    id: 'analytics_overview',
    name: 'Analytics Overview',
    description: 'Comprehensive analytics dashboard',
    sections: ['header', 'summary', 'channels', 'trends', 'insights'],
    styles: {
      primaryColor: '#059669',
      secondaryColor: '#64748B',
      accentColor: '#EF4444'
    }
  },
  weekly_standup: {
    id: 'weekly_standup',
    name: 'Weekly Standup Report',
    description: 'Weekly team performance summary',
    sections: ['header', 'wins', 'pipeline', 'blockers', 'next_week'],
    styles: {
      primaryColor: '#0891B2',
      secondaryColor: '#64748B',
      accentColor: '#8B5CF6'
    }
  }
};

// ============================================
// REPORT GENERATOR
// ============================================

/**
 * Generate PDF report from data
 */
async function generateReport(options = {}) {
  const {
    type = 'campaign_summary',
    title,
    data,
    format = 'pdf',
    template = null
  } = options;

  const reportId = uuidv4();
  const timestamp = new Date().toISOString();

  // Get template
  const templateConfig = template || reportTemplates.get(type) || DEFAULT_TEMPLATES[type] || DEFAULT_TEMPLATES.campaign_summary;

  // Generate report content
  const content = generateReportContent(templateConfig, {
    title: title || templateConfig.name,
    data,
    timestamp,
    reportId
  });

  // Generate HTML for PDF conversion
  const html = generateHTML(templateConfig, content);

  // In production, convert HTML to PDF using puppeteer, pdfkit, or similar
  // For now, return the HTML structure that can be converted
  const report = {
    id: reportId,
    type,
    title: content.title,
    template: templateConfig.id,
    format,
    status: 'generated',
    content,
    html,
    generatedAt: timestamp,
    metadata: {
      pageCount: estimatePageCount(content),
      size: estimateSize(content)
    }
  };

  generatedReports.set(reportId, report);

  return report;
}

/**
 * Generate report content from template
 */
function generateReportContent(template, context) {
  const sections = [];

  for (const sectionId of template.sections) {
    const section = generateSection(sectionId, context);
    if (section) {
      sections.push(section);
    }
  }

  return {
    title: context.title,
    generatedAt: context.timestamp,
    reportId: context.reportId,
    sections
  };
}

/**
 * Generate individual section
 */
function generateSection(sectionId, context) {
  const { data, title } = context;

  switch (sectionId) {
    case 'header':
      return {
        id: 'header',
        type: 'header',
        content: {
          title: title,
          subtitle: `Generated on ${new Date(context.timestamp).toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}`,
          company: 'REZ Atlas GTM',
          logo: 'https://rez.money/logo.png'
        }
      };

    case 'metrics':
      return {
        id: 'metrics',
        type: 'metrics',
        title: 'Key Metrics',
        items: generateMetrics(data)
      };

    case 'funnel':
      return {
        id: 'funnel',
        type: 'funnel',
        title: 'Conversion Funnel',
        stages: generateFunnel(data)
      };

    case 'top_prospects':
      return {
        id: 'top_prospects',
        type: 'table',
        title: 'Top Prospects',
        headers: ['Name', 'Company', 'Score', 'Stage', 'Last Activity'],
        rows: generateProspectRows(data)
      };

    case 'recommendations':
      return {
        id: 'recommendations',
        type: 'list',
        title: 'Recommendations',
        items: generateRecommendations(data)
      };

    case 'overview':
      return {
        id: 'overview',
        type: 'text',
        title: 'Overview',
        content: generateOverview(data)
      };

    case 'segments':
      return {
        id: 'segments',
        type: 'chart',
        title: 'Segment Distribution',
        data: generateSegmentData(data)
      };

    case 'priorities':
      return {
        id: 'priorities',
        type: 'list',
        title: 'Priority Actions',
        items: generatePriorities(data)
      };

    case 'actions':
      return {
        id: 'actions',
        type: 'checklist',
        title: 'Action Items',
        items: generateActionItems(data)
      };

    case 'summary':
      return {
        id: 'summary',
        type: 'metrics',
        title: 'Performance Summary',
        items: generateSummaryMetrics(data)
      };

    case 'channels':
      return {
        id: 'channels',
        type: 'table',
        title: 'Channel Performance',
        headers: ['Channel', 'Sent', 'Opened', 'Clicked', 'Converted', 'ROI'],
        rows: generateChannelRows(data)
      };

    case 'trends':
      return {
        id: 'trends',
        type: 'chart',
        title: 'Trends',
        data: generateTrendData(data)
      };

    case 'insights':
      return {
        id: 'insights',
        type: 'list',
        title: 'Key Insights',
        items: generateInsights(data)
      };

    case 'wins':
      return {
        id: 'wins',
        type: 'list',
        title: '🏆 Wins This Week',
        items: generateWins(data)
      };

    case 'pipeline':
      return {
        id: 'pipeline',
        type: 'funnel',
        title: 'Pipeline Status',
        stages: generatePipelineStages(data)
      };

    case 'blockers':
      return {
        id: 'blockers',
        type: 'list',
        title: '🔴 Blockers',
        items: generateBlockers(data)
      };

    case 'next_week':
      return {
        id: 'next_week',
        type: 'checklist',
        title: '📅 Next Week Plan',
        items: generateNextWeek(data)
      };

    default:
      return null;
  }
}

// ============================================
// CONTENT GENERATORS
// ============================================

function generateMetrics(data) {
  return [
    {
      label: 'Total Prospects',
      value: data.totalProspects || data.prospects?.length || 0,
      change: '+12%',
      trend: 'up'
    },
    {
      label: 'Active Sequences',
      value: data.activeSequences || 0,
      change: '+3',
      trend: 'up'
    },
    {
      label: 'Emails Sent',
      value: data.emailsSent || 0,
      change: '+8%',
      trend: 'up'
    },
    {
      label: 'Open Rate',
      value: data.openRate || '0%',
      change: '+2.5%',
      trend: 'up'
    },
    {
      label: 'Reply Rate',
      value: data.replyRate || '0%',
      change: '+1.2%',
      trend: 'up'
    },
    {
      label: 'Meetings Booked',
      value: data.meetingsBooked || 0,
      change: '+5',
      trend: 'up'
    }
  ];
}

function generateFunnel(data) {
  return [
    { stage: 'Targeted', count: data.targeted || 100, rate: '100%' },
    { stage: 'Contacted', count: data.contacted || 80, rate: '80%' },
    { stage: 'Opened', count: data.opened || 48, rate: '60%' },
    { stage: 'Engaged', count: data.engaged || 24, rate: '50%' },
    { stage: 'Qualified', count: data.qualified || 12, rate: '50%' },
    { stage: 'Converted', count: data.converted || 6, rate: '50%' }
  ];
}

function generateProspectRows(data) {
  const prospects = data.prospects || [];
  return prospects.slice(0, 20).map(p => [
    p.name || 'Unknown',
    p.company || '-',
    p.score || 0,
    p.stage || '-',
    p.lastActivity || '-'
  ]);
}

function generateRecommendations(data) {
  return [
    'Focus outreach on prospects with score > 80 for higher conversion',
    'Increase email frequency for engaged segment (3x per week)',
    'A/B test subject lines for better open rates',
    'Prioritize follow-ups for prospects who opened but didn\'t reply',
    'Consider WhatsApp for Indian prospects for better response rates',
    'Review and optimize sequences with low engagement rates'
  ];
}

function generateOverview(data) {
  return `This report provides a comprehensive overview of your GTM campaign performance.
  With ${data.totalProspects || 0} prospects in your pipeline and ${data.activeSequences || 0} active sequences,
  your current conversion rate stands at ${data.conversionRate || '0%'}.

  Key highlights:
  • Email open rate: ${data.openRate || '0%'}
  • Reply rate: ${data.replyRate || '0%'}
  • Average prospect score: ${data.avgScore || 0}
  • Top performing segment: ${data.topSegment || 'N/A'}`;
}

function generateSegmentData(data) {
  const segments = data.segments || [
    { name: 'Enterprise', count: 45 },
    { name: 'Mid-Market', count: 38 },
    { name: 'SMB', count: 25 }
  ];
  return segments;
}

function generatePriorities(data) {
  return [
    'Follow up with 25 hot prospects (score > 80)',
    'Review and approve pending email sequences',
    'Analyze competitor engagement patterns',
    'Schedule demos for qualified leads',
    'Update prospect data quality'
  ];
}

function generateActionItems(data) {
  return [
    { text: 'Send follow-up emails to 15 prospects', done: false },
    { text: 'Update LinkedIn outreach messages', done: false },
    { text: 'Review campaign analytics', done: false },
    { text: 'Schedule team standup', done: true }
  ];
}

function generateSummaryMetrics(data) {
  return [
    { label: 'Revenue Pipeline', value: `₹${data.pipelineValue || 0} L`, change: '+15%' },
    { label: 'Deal Velocity', value: `${data.dealVelocity || 0} days`, change: '-3 days' },
    { label: 'Win Rate', value: data.winRate || '0%', change: '+5%' },
    { label: 'Avg Deal Size', value: `₹${data.avgDealSize || 0}K`, change: '+12%' }
  ];
}

function generateChannelRows(data) {
  const channels = data.channels || [
    { name: 'Email', sent: 500, opened: 200, clicked: 50, converted: 10, roi: '300%' },
    { name: 'LinkedIn', sent: 200, opened: 100, clicked: 30, converted: 8, roi: '250%' },
    { name: 'WhatsApp', sent: 150, opened: 120, clicked: 40, converted: 15, roi: '400%' }
  ];
  return channels.map(c => [
    c.name,
    c.sent,
    c.opened,
    c.clicked,
    c.converted,
    c.roi
  ]);
}

function generateTrendData(data) {
  return {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      { name: 'Prospects', values: [10, 25, 40, 55] },
      { name: 'Conversions', values: [2, 5, 8, 12] }
    ]
  };
}

function generateInsights(data) {
  return [
    'WhatsApp messages have 40% higher response rate than email',
    'Best time to send emails is 9-11 AM IST',
    'LinkedIn InMail performs 2x better for enterprise prospects',
    'Follow-up on day 3 after initial email increases reply rate by 35%',
    'Personalized subject lines increase open rate by 25%'
  ];
}

function generateWins(data) {
  return [
    'Closed 3 deals worth ₹5L total',
    'Generated 50 new qualified leads',
    'Increased email open rate by 15%',
    'Booked 10 demos this week',
    'Launched new campaign for enterprise segment'
  ];
}

function generatePipelineStages(data) {
  return [
    { stage: 'Discovery', count: 100 },
    { stage: 'Qualification', count: 75 },
    { stage: 'Proposal', count: 40 },
    { stage: 'Negotiation', count: 20 },
    { stage: 'Closed Won', count: 8 }
  ];
}

function generateBlockers(data) {
  return [
    'Waiting for pricing approval from finance',
    'Decision maker on vacation until next week',
    'Need additional case studies for enterprise',
    'Legal review pending for MSA'
  ];
}

function generateNextWeek(data) {
  return [
    { text: 'Follow up with 25 warm prospects', priority: 'high' },
    { text: 'Prepare for 10 scheduled demos', priority: 'high' },
    { text: 'Launch A/B test on email subject lines', priority: 'medium' },
    { text: 'Update prospect database', priority: 'low' }
  ];
}

// ============================================
// HTML GENERATOR
// ============================================

function generateHTML(template, content) {
  const { styles } = template;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${content.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1F2937; line-height: 1.6; }
    .container { max-width: 800px; margin: 0 auto; padding: 40px; }
    .header { text-align: center; padding: 40px 0; border-bottom: 3px solid ${styles.primaryColor}; margin-bottom: 40px; }
    .header h1 { color: ${styles.primaryColor}; font-size: 28px; margin-bottom: 10px; }
    .header p { color: ${styles.secondaryColor}; font-size: 14px; }
    .section { margin-bottom: 40px; }
    .section-title { color: ${styles.primaryColor}; font-size: 18px; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid #E5E7EB; }
    .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
    .metric-card { background: #F9FAFB; padding: 20px; border-radius: 8px; text-align: center; }
    .metric-value { font-size: 32px; font-weight: bold; color: ${styles.primaryColor}; }
    .metric-label { font-size: 12px; color: ${styles.secondaryColor}; margin-top: 5px; }
    .metric-change { font-size: 12px; color: ${styles.accentColor}; margin-top: 5px; }
    .funnel { display: flex; flex-direction: column; gap: 10px; }
    .funnel-stage { display: flex; align-items: center; gap: 15px; }
    .funnel-label { width: 100px; font-size: 14px; }
    .funnel-bar { flex: 1; height: 30px; background: linear-gradient(90deg, ${styles.primaryColor}, ${styles.accentColor}); border-radius: 4px; }
    .funnel-count { width: 80px; text-align: right; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { background: ${styles.primaryColor}; color: white; padding: 12px; text-align: left; font-size: 12px; }
    td { padding: 10px; border-bottom: 1px solid #E5E7EB; font-size: 13px; }
    tr:hover { background: #F9FAFB; }
    ul { list-style: none; }
    li { padding: 10px 0; border-bottom: 1px solid #E5E7EB; padding-left: 20px; position: relative; }
    li:before { content: "•"; position: absolute; left: 0; color: ${styles.accentColor}; }
    .footer { text-align: center; padding-top: 40px; border-top: 1px solid #E5E7EB; color: ${styles.secondaryColor}; font-size: 12px; }
    .page-break { page-break-after: always; }
  </style>
</head>
<body>
  <div class="container">
    ${generateHeaderHTML(content)}
    ${generateSectionsHTML(content)}
    <div class="footer">
      <p>Generated by REZ Atlas GTM • ${content.generatedAt}</p>
      <p>Report ID: ${content.reportId}</p>
    </div>
  </div>
</body>
</html>`;
}

function generateHeaderHTML(content) {
  return `
    <div class="header">
      <h1>${content.title}</h1>
      <p>Generated on ${new Date(content.generatedAt).toLocaleDateString()}</p>
    </div>`;
}

function generateSectionsHTML(content) {
  return content.sections.map(section => {
    switch (section.type) {
      case 'metrics':
        return generateMetricsHTML(section);
      case 'funnel':
        return generateFunnelHTML(section);
      case 'table':
        return generateTableHTML(section);
      case 'list':
        return generateListHTML(section);
      case 'checklist':
        return generateChecklistHTML(section);
      default:
        return '';
    }
  }).join('\n');
}

function generateMetricsHTML(section) {
  const items = section.items || [];
  return `
    <div class="section">
      <h2 class="section-title">${section.title}</h2>
      <div class="metrics-grid">
        ${items.map(item => `
          <div class="metric-card">
            <div class="metric-value">${item.value}</div>
            <div class="metric-label">${item.label}</div>
            ${item.change ? `<div class="metric-change">${item.change}</div>` : ''}
          </div>
        `).join('')}
      </div>
    </div>`;
}

function generateFunnelHTML(section) {
  const stages = section.stages || [];
  const maxCount = Math.max(...stages.map(s => s.count));

  return `
    <div class="section">
      <h2 class="section-title">${section.title}</h2>
      <div class="funnel">
        ${stages.map(stage => `
          <div class="funnel-stage">
            <span class="funnel-label">${stage.stage}</span>
            <div class="funnel-bar" style="width: ${(stage.count / maxCount) * 100}%"></div>
            <span class="funnel-count">${stage.count}</span>
          </div>
        `).join('')}
      </div>
    </div>`;
}

function generateTableHTML(section) {
  const headers = section.headers || [];
  const rows = section.rows || [];

  return `
    <div class="section">
      <h2 class="section-title">${section.title}</h2>
      <table>
        <thead>
          <tr>
            ${headers.map(h => `<th>${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.map(row => `
            <tr>
              ${row.map(cell => `<td>${cell}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>`;
}

function generateListHTML(section) {
  const items = section.items || [];

  return `
    <div class="section">
      <h2 class="section-title">${section.title}</h2>
      <ul>
        ${items.map(item => `<li>${typeof item === 'string' ? item : item.text}</li>`).join('')}
      </ul>
    </div>`;
}

function generateChecklistHTML(section) {
  const items = section.items || [];

  return `
    <div class="section">
      <h2 class="section-title">${section.title}</h2>
      <ul>
        ${items.map(item => `
          <li>${item.text} ${item.priority ? `(${item.priority})` : ''}</li>
        `).join('')}
      </ul>
    </div>`;
}

// ============================================
// REPORT MANAGEMENT
// ============================================

/**
 * Save report template
 */
function saveTemplate(template) {
  reportTemplates.set(template.id, template);
  return template;
}

/**
 * Get report template
 */
function getTemplate(templateId) {
  return reportTemplates.get(templateId) || DEFAULT_TEMPLATES[templateId] || null;
}

/**
 * List all templates
 */
function listTemplates() {
  const templates = [...Object.values(DEFAULT_TEMPLATES)];
  for (const [id, template] of reportTemplates.entries()) {
    if (!templates.find(t => t.id === id)) {
      templates.push(template);
    }
  }
  return templates;
}

/**
 * Get generated report
 */
function getReport(reportId) {
  return generatedReports.get(reportId);
}

/**
 * List generated reports
 */
function listReports(filters = {}) {
  let reports = Array.from(generatedReports.values());

  if (filters.type) {
    reports = reports.filter(r => r.type === filters.type);
  }

  if (filters.from) {
    const fromTime = new Date(filters.from).getTime();
    reports = reports.filter(r => new Date(r.generatedAt).getTime() >= fromTime);
  }

  if (filters.to) {
    const toTime = new Date(filters.to).getTime();
    reports = reports.filter(r => new Date(r.generatedAt).getTime() <= toTime);
  }

  return reports.sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt));
}

/**
 * Delete generated report
 */
function deleteReport(reportId) {
  return generatedReports.delete(reportId);
}

// ============================================
// UTILITIES
// ============================================

function estimatePageCount(content) {
  // Rough estimation: 100 lines per page
  let lines = 0;
  content.sections.forEach(section => {
    switch (section.type) {
      case 'metrics':
        lines += Math.ceil((section.items?.length || 0) / 3) + 5;
        break;
      case 'funnel':
        lines += (section.stages?.length || 0) + 3;
        break;
      case 'table':
        lines += (section.rows?.length || 0) + 5;
        break;
      case 'list':
        lines += (section.items?.length || 0) + 3;
        break;
      default:
        lines += 5;
    }
  });
  return Math.max(1, Math.ceil(lines / 40));
}

function estimateSize(content) {
  // Estimate HTML size in bytes
  const htmlStr = JSON.stringify(content);
  return new Blob([htmlStr]).size;
}

/**
 * Export report to different formats
 */
function exportReport(reportId, format = 'html') {
  const report = generatedReports.get(reportId);
  if (!report) return null;

  switch (format) {
    case 'html':
      return { type: 'text/html', data: report.html };
    case 'json':
      return { type: 'application/json', data: JSON.stringify(report.content, null, 2) };
    case 'csv':
      return { type: 'text/csv', data: convertToCSV(report.content) };
    default:
      return { type: 'text/html', data: report.html };
  }
}

/**
 * Convert report content to CSV
 */
function convertToCSV(content) {
  let csv = '';

  content.sections.forEach(section => {
    if (section.type === 'table') {
      csv += section.title + '\n';
      csv += (section.headers || []).join(',') + '\n';
      (section.rows || []).forEach(row => {
        csv += row.map(cell => `"${cell}"`).join(',') + '\n';
      });
      csv += '\n';
    }
  });

  return csv;
}

// ============================================
// REPORT SCHEDULING
// ============================================

const scheduledReports = new Map();

/**
 * Schedule a recurring report
 */
function scheduleReport(config) {
  const {
    name,
    type,
    schedule, // cron expression
    recipients,
    format = 'pdf'
  } = config;

  const scheduled = {
    id: uuidv4(),
    name,
    type,
    schedule,
    recipients,
    format,
    enabled: true,
    lastRun: null,
    nextRun: null,
    createdAt: new Date().toISOString()
  };

  scheduledReports.set(scheduled.id, scheduled);
  return scheduled;
}

/**
 * Get scheduled reports
 */
function getScheduledReports() {
  return Array.from(scheduledReports.values());
}

/**
 * Enable/disable scheduled report
 */
function toggleScheduledReport(reportId, enabled) {
  const report = scheduledReports.get(reportId);
  if (!report) return null;

  report.enabled = enabled;
  return report;
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // Generation
  generateReport,

  // Templates
  saveTemplate,
  getTemplate,
  listTemplates,
  DEFAULT_TEMPLATES,

  // Management
  getReport,
  listReports,
  deleteReport,
  exportReport,

  // Scheduling
  scheduleReport,
  getScheduledReports,
  toggleScheduledReport
};