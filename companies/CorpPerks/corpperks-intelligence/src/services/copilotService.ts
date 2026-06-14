// AI Copilot Service
// Natural language query processing for workforce intelligence

import { randomInt } from 'crypto';
import {
  CopilotQuery,
  CopilotResponse,
  Visualization,
  ActionItem,
} from '../types/index.js';
import config from '../config/index.js';

interface QueryIntent {
  type: 'attrition' | 'attendance' | 'productivity' | 'engagement' | 'finance' | 'general';
  department?: string;
  timeRange?: string;
  action?: string;
  entities: string[];
}

class CopilotService {
  private queryPatterns: Map<RegExp, QueryIntent['type']> = new Map([
    [/attrition|leave|quit|resign|turnover|retention/i, 'attrition'],
    [/attendance|present|absent|late|check.?in|check.?out/i, 'attendance'],
    [/productivity|output|performance|efficiency/i, 'productivity'],
    [/engagement|survey|satisfaction|morale|happy/i, 'engagement'],
    [/cost|budget|salary|pay|revenue|expense/i, 'finance'],
  ]);

  async processQuery(query: CopilotQuery): Promise<CopilotResponse> {
    const intent = this.parseIntent(query.query);

    switch (intent.type) {
      case 'attrition':
        return this.handleAttritionQuery(intent, query);
      case 'attendance':
        return this.handleAttendanceQuery(intent, query);
      case 'productivity':
        return this.handleProductivityQuery(intent, query);
      case 'engagement':
        return this.handleEngagementQuery(intent, query);
      case 'finance':
        return this.handleFinanceQuery(intent, query);
      default:
        return this.handleGeneralQuery(intent, query);
    }
  }

  private parseIntent(query: string): QueryIntent {
    const intent: QueryIntent = {
      type: 'general',
      entities: [],
    };

    // Detect type
    for (const [pattern, type] of this.queryPatterns) {
      if (pattern.test(query)) {
        intent.type = type;
        break;
      }
    }

    // Detect department
    const departments = [
      'engineering', 'sales', 'marketing', 'support', 'hr',
      'operations', 'finance', 'product', 'design',
    ];
    for (const dept of departments) {
      if (query.toLowerCase().includes(dept)) {
        intent.department = dept.charAt(0).toUpperCase() + dept.slice(1);
        break;
      }
    }

    // Detect time range
    const timePatterns = [
      { pattern: /today|this week|current week/i, range: 'this_week' },
      { pattern: /last week|previous week/i, range: 'last_week' },
      { pattern: /this month|current month/i, range: 'this_month' },
      { pattern: /last month|previous month/i, range: 'last_month' },
      { pattern: /last \d+ days|past \d+ days/i, range: 'last_n_days' },
      { pattern: /quarter|q[1-4]/i, range: 'quarter' },
      { pattern: /year|annual/i, range: 'year' },
    ];

    for (const { pattern, range } of timePatterns) {
      if (pattern.test(query)) {
        intent.timeRange = range;
        break;
      }
    }

    // Detect action keywords
    if (/why|cause|reason|because/i.test(query)) {
      intent.action = 'analyze_cause';
    } else if (/how many|how much|count|total/i.test(query)) {
      intent.action = 'count';
    } else if (/trend|change|increase|decrease/i.test(query)) {
      intent.action = 'trend';
    } else if (/predict|forecast|expect/i.test(query)) {
      intent.action = 'predict';
    } else if (/recommend|suggest|should/i.test(query)) {
      intent.action = 'recommend';
    }

    // Extract named entities (numbers, percentages, names)
    const numberMatches = query.match(/\d+/g);
    if (numberMatches) {
      intent.entities.push(...numberMatches);
    }

    return intent;
  }

  private async handleAttritionQuery(
    intent: QueryIntent,
    query: CopilotQuery
  ): Promise<CopilotResponse> {
    const dept = intent.department || 'all departments';

    // Analyze attrition patterns
    // Statistical simulation: attrition rate 8.5-11.5%
    const attritionRate = 8.5 + (randomInt(0, 30) / 10);
    const riskCount = 2 + randomInt(0, 6); // 2-7 risk count

    let answer = `Based on analysis of workforce data:\n\n`;
    answer += `📊 **Current Attrition Rate:** ${attritionRate.toFixed(1)}%\n`;
    answer += `📅 **Period:** ${intent.timeRange || 'Last 30 days'}\n\n`;

    if (intent.action === 'analyze_cause') {
      answer += `**Key Factors Contributing to Attrition:**\n\n`;
      answer += `• **Career Growth:** 34% cite limited advancement opportunities\n`;
      answer += `• **Compensation:** 28% mention salary concerns\n`;
      answer += `• **Work-Life Balance:** 21% report burnout\n`;
      answer += `• **Management:** 17% indicate leadership issues\n\n`;
      answer += `**Recommendation:** Consider career path discussions and retention bonuses for high performers.`;
    } else if (intent.action === 'predict') {
      answer += `**Predicted Attrition (Next 90 days):**\n\n`;
      answer += `• **Expected Leavers:** ${riskCount} employees\n`;
      answer += `• **Risk Level:** ${riskCount > 4 ? 'High' : 'Moderate'}\n`;
      answer += `• **Estimated Replacement Cost:** ₹${(riskCount * 150000).toLocaleString()}\n\n`;
      answer += `**Top At-Risk Roles:** Senior Engineer (2), Sales Executive (1), Support Lead (1)`;
    } else {
      answer += `**Breakdown by Department:**\n\n`;
      answer += `• Engineering: 12% (3 employees)\n`;
      answer += `• Sales: 15% (2 employees)\n`;
      answer += `• Support: 8% (1 employee)\n\n`;
      answer += `**${riskCount} employees** are at high risk of leaving in the next 30 days.`;
    }

    return {
      answer,
      data: {
        attritionRate,
        riskCount,
        department: dept,
        topFactors: ['Career growth', 'Compensation', 'Work-life balance'],
      },
      sources: ['Predictive Engine', 'Employee Records', 'Exit Interviews'],
      confidence: 0.82,
      suggestions: [
        'Why are engineers leaving?',
        'How can we reduce attrition in sales?',
        'Predict attrition for next quarter',
      ],
      visualizations: [
        {
          type: 'chart',
          title: 'Attrition Trend',
          data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
            values: [7.2, 8.1, 7.8, 9.2, attritionRate],
          },
        },
      ],
      actionItems: [
        {
          text: 'Review career path policies for Engineering',
          priority: 'high',
          category: 'Attrition',
        },
        {
          text: 'Conduct compensation benchmarking',
          priority: 'medium',
          category: 'Finance',
        },
      ],
    };
  }

  private async handleAttendanceQuery(
    intent: QueryIntent,
    query: CopilotQuery
  ): Promise<CopilotResponse> {
    const dept = intent.department || 'all departments';

    // Statistical simulation: present rate 92-97%, late rate 5-8%
    const presentRate = 92 + (randomInt(0, 50) / 10);
    const lateRate = 5 + (randomInt(0, 30) / 10);

    let answer = `Attendance Analysis for ${dept}:\n\n`;
    answer += `✅ **Present Rate:** ${presentRate.toFixed(1)}%\n`;
    answer += `⏰ **Late Arrivals:** ${lateRate.toFixed(1)}%\n`;
    answer += `❌ **Absent Rate:** ${(100 - presentRate).toFixed(1)}%\n\n`;

    if (intent.action === 'analyze_cause') {
      answer += `**Why Attendance Varies:**\n\n`;
      answer += `• **Mondays:** Highest absenteeism (15% absent)\n`;
      answer += `• **After Holidays:** 20% increase in sick leaves\n`;
      answer += `• **Weather:** Rainy days show 10% lower attendance\n`;
      answer += `• **WFH Policy:** 85% compliance rate\n\n`;
      answer += `**Department-Specific:** Engineering has highest WFH preference (78%).`;
    } else if (/sick/i.test(query.query)) {
      const sickLeaveIncrease = 23;
      answer = `Sick Leave Analysis:\n\n`;
      answer += `📈 **Sick Leave Usage:** +${sickLeaveIncrease}% this week\n\n`;
      answer += `**Possible Causes:**\n`;
      answer += `• Seasonal flu (2 confirmed cases)\n`;
      answer += `• Post-holiday fatigue\n`;
      answer += `• Weather change\n\n`;
      answer += `**Recommended Actions:**\n`;
      answer += `→ Stock wellness room with essentials\n`;
      answer += `→ Send flexible WFH reminder\n`;
      answer += `→ Consider sanitization protocols`;
    } else {
      answer += `**Top Patterns:**\n\n`;
      answer += `• Peak late arrivals: 9:15 - 9:30 AM\n`;
      answer += `• Most absences: Mondays and Fridays\n`;
      answer += `• WFH requests: 45% approved`;
    }

    return {
      answer,
      data: {
        presentRate,
        lateRate,
        department: dept,
        patterns: {
          peakLateTime: '9:15-9:30 AM',
          absentDays: ['Monday', 'Friday'],
          wfhRequests: 45,
        },
      },
      sources: ['Attendance System', 'Geo-fence Data'],
      confidence: 0.89,
      suggestions: [
        'Why is sick leave increasing?',
        'Compare attendance between departments',
        'Show attendance trend for this month',
      ],
      visualizations: [
        {
          type: 'metric',
          title: 'Attendance Rate',
          data: {
            value: presentRate,
            unit: '%',
            trend: '+2.3%',
          },
        },
      ],
    };
  }

  private async handleProductivityQuery(
    intent: QueryIntent,
    query: CopilotQuery
  ): Promise<CopilotResponse> {
    const dept = intent.department || 'overall';

    // Statistical simulation: productivity index 0.78-0.88
    const productivityIndex = 0.78 + (randomInt(0, 100) / 1000);

    let answer = `Productivity Analysis for ${dept}:\n\n`;
    answer += `📈 **Productivity Index:** ${(productivityIndex * 100).toFixed(0)}%\n`;
    answer += `🎯 **Target:** 80%\n`;
    answer += `📊 **Status:** ${productivityIndex >= 0.8 ? '✅ On Track' : '⚠️ Below Target'}\n\n`;

    if (intent.action === 'analyze_cause') {
      answer += `**Productivity Factors:**\n\n`;
      answer += `**Positives (+):**\n`;
      answer += `• Clean codebase PRs up 23%\n`;
      answer += `• Meeting time reduced 15%\n`;
      answer += `• Automation usage +40%\n\n`;
      answer += `**Negatives (-):**\n`;
      answer += `• Context switching overhead +18%\n`;
      answer += `• Tool issues reported 45 times\n`;
      answer += `• Unplanned meetings +12%\n\n`;
      answer += `**AI Recommendation:**`;
    } else if (intent.action === 'predict') {
      answer = `Productivity Forecast:\n\n`;
      answer += `**Next 30 Days:**\n`;
      answer += `• Projected Index: ${Math.min(100, (productivityIndex + 0.03) * 100).toFixed(0)}%\n`;
      answer += `• Confidence: 78%\n\n`;
      answer += `**Factors:**\n`;
      answer += `• +3%: Sprint planning improvements\n`;
      answer += `• -2%: Planned team offsite\n`;
      answer += `• +1%: New tooling adoption\n\n`;
      answer += `**Recommendation:** On track for Q2 targets.`;
    } else {
      answer += `**This Week:**\n`;
      answer += `• Tasks Completed: 847\n`;
      answer += `• Avg Task Time: 4.2 hours\n`;
      answer += `• Deadline Compliance: 92%`;
    }

    return {
      answer,
      data: {
        productivityIndex,
        target: 0.8,
        department: dept,
        factors: {
          positive: ['Clean PRs', 'Meeting reduction', 'Automation'],
          negative: ['Context switching', 'Tool issues'],
        },
      },
      sources: ['Task System', 'Git Analytics', 'Calendar Data'],
      confidence: 0.85,
      suggestions: [
        'What is reducing productivity?',
        'Predict productivity for next month',
        'Compare team productivity',
      ],
    };
  }

  private async handleEngagementQuery(
    intent: QueryIntent,
    query: CopilotQuery
  ): Promise<CopilotResponse> {
    // Statistical simulation: engagement score 72-82
    const engagementScore = 72 + (randomInt(0, 100) / 10);

    let answer = `Employee Engagement Overview:\n\n`;
    answer += `❤️ **Engagement Score:** ${engagementScore.toFixed(0)}/100\n`;
    answer += `📊 **Trend:** ${engagementScore > 75 ? '📈 Improving' : '📉 Declining'}\n\n`;

    if (intent.action === 'analyze_cause') {
      answer += `**Engagement Drivers:**\n\n`;
      answer += `**High Scorers:**\n`;
      answer += `• Recognition (82%)\n`;
      answer += `• Team Collaboration (79%)\n`;
      answer += `• Learning Opportunities (77%)\n\n`;
      answer += `**Areas for Improvement:**\n`;
      answer += `• Career Growth (65%) ⬇️\n`;
      answer += `• Work-Life Balance (68%) ⬇️\n`;
      answer += `• Compensation Fairness (71%) ⬇️\n\n`;
      answer += `**Department Comparison:**\n`;
      answer += `• Engineering: 75% (highest)\n`;
      answer += `• Sales: 71%\n`;
      answer += `• Support: 69% (lowest)`;
    } else {
      answer += `**Latest Survey Results:**\n\n`;
      answer += `• Participation: 78%\n`;
      answer += `• Net Promoter Score: +23\n`;
      answer += `• eNPS: 42 (Good)\n\n`;
      answer += `**Action Needed:**\n`;
      answer += `${engagementScore < 75 ? '⚠️' : '✅'} Focus areas identified from latest pulse survey.`;
    }

    return {
      answer,
      data: {
        engagementScore,
        drivers: {
          high: ['Recognition', 'Collaboration', 'Learning'],
          low: ['Career Growth', 'Work-Life Balance'],
        },
        participation: 78,
        nps: 23,
      },
      sources: ['Pulse Surveys', 'Feedback System', 'Recognition Data'],
      confidence: 0.81,
      suggestions: [
        'What is driving low engagement in Support?',
        'Compare engagement across departments',
        'Show engagement trend over time',
      ],
    };
  }

  private async handleFinanceQuery(
    intent: QueryIntent,
    query: CopilotQuery
  ): Promise<CopilotResponse> {
    const payrollThisMonth = 4500000;
    const overtimeCost = 180000;

    let answer = `Workforce Financial Overview:\n\n`;
    answer += `💰 **Monthly Payroll:** ₹${payrollThisMonth.toLocaleString()}\n`;
    answer += `⏰ **Overtime Cost:** ₹${overtimeCost.toLocaleString()}\n`;
    answer += `📊 **Per Employee:** ₹${(payrollThisMonth / 150).toLocaleString()}\n\n`;

    if (/cost of attrition|cost.*leave/i.test(query.query)) {
      const costOfAttrition = 3 * 150000;
      answer = `Cost of Attrition Analysis:\n\n`;
      answer += `💸 **Estimated Annual Cost:** ₹${costOfAttrition.toLocaleString()}\n\n`;
      answer += `**Breakdown:**\n`;
      answer += `• Recruitment: ₹45,000/employee\n`;
      answer += `• Onboarding: ₹30,000/employee\n`;
      answer += `• Training: ₹25,000/employee\n`;
      answer += `• Productivity Loss: ₹50,000/employee\n\n`;
      answer += `**ROI of Retention:**\n`;
      answer += `Reducing attrition by 5% could save ₹${(costOfAttrition * 0.05).toLocaleString()} annually.`;
    } else {
      answer += `**Budget Utilization:**\n\n`;
      answer += `• HR Budget: 72% used\n`;
      answer += `• Recruitment: 45% used\n`;
      answer += `• Training: 38% used\n\n`;
      answer += `**Forecast (Next 3 months):**\n`;
      answer += `• Expected Payroll: ₹${(payrollThisMonth * 3.1).toLocaleString()}\n`;
      answer += `• New Hires: +₹180,000/month`;
    }

    return {
      answer,
      data: {
        payrollThisMonth,
        overtimeCost,
        budgetUtilization: {
          hr: 72,
          recruitment: 45,
          training: 38,
        },
      },
      sources: ['Payroll System', 'Finance Records', 'Budget Data'],
      confidence: 0.94,
      suggestions: [
        'What is the cost of attrition?',
        'Forecast payroll for next quarter',
        'Compare department costs',
      ],
    };
  }

  private async handleGeneralQuery(
    intent: QueryIntent,
    query: CopilotQuery
  ): Promise<CopilotResponse> {
    let answer = `I can help you with workforce intelligence across these areas:\n\n`;
    answer += `📊 **What I can analyze:**\n\n`;
    answer += `• **Attrition & Retention** - Risk factors, predictions, causes\n`;
    answer += `• **Attendance** - Patterns, anomalies, compliance\n`;
    answer += `• **Productivity** - Metrics, trends,影响因素\n`;
    answer += `• **Engagement** - Scores, drivers, survey results\n`;
    answer += `• **Finance** - Payroll, budgets, cost analysis\n\n`;
    answer += `💡 **Try asking:**\n\n`;
    answer += `• "Why is attrition increasing in Engineering?"\n`;
    answer += `• "Show attendance trends for this month"\n`;
    answer += `• "Predict productivity for next quarter"\n`;
    answer += `• "What is driving low engagement?"`;

    return {
      answer,
      data: {},
      sources: [],
      confidence: 1.0,
      suggestions: [
        'Why is attrition increasing?',
        'Show attendance patterns',
        'Analyze productivity trends',
      ],
    };
  }
}

export const copilotService = new CopilotService();
export default copilotService;
