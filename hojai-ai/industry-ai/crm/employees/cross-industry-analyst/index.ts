/**
 * Cross-Industry Analyst AI Agent
 * Analyzes performance across all 15 Industry AI products
 */

import { hojaiCore, IndustryType } from '../../connectors/hojai-core';
import { unifiedLeadService } from '../../services/unified-lead-service';
import { customer360Service } from '../../services/customer-360-service';
import { revenueConsolidationService } from '../../services/revenue-consolidation-service';
import { industryInsightsService } from '../../services/industry-insights-service';
import { crossSellService } from '../../services/cross-sell-service';

export interface AnalysisReport {
  id: string;
  type: 'comprehensive' | 'industry' | 'comparative' | 'trend' | 'customer';
  industries: IndustryType[];
  generatedAt: Date;
  summary: string;
  findings: Finding[];
  metrics: Record<string, any>;
  recommendations: string[];
}

export interface Finding {
  category: 'performance' | 'opportunity' | 'risk' | 'trend';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  data: Record<string, any>;
  suggestedAction?: string;
}

export interface ComparisonData {
  industries: IndustryType[];
  metrics: {
    name: string;
    values: Record<IndustryType, number>;
  }[];
  insights: string[];
}

class CrossIndustryAnalystAgent {
  private agentName = 'Cross-Industry Analyst';
  private agentId = 'analyst-001';

  /**
   * Perform comprehensive analysis across all industries
   */
  async performComprehensiveAnalysis(): Promise<AnalysisReport> {
    console.log(`[${this.agentName}] Starting comprehensive analysis...`);

    const findings: Finding[] = [];
    const insights = await industryInsightsService.getAllIndustryInsights();
    const crossIndustry = await industryInsightsService.getCrossIndustryAnalysis();
    const customerStats = await customer360Service.getCrossIndustryStats();

    // Analyze each industry's performance
    for (const insight of insights) {
      // Performance findings
      if (insight.performance.overall === 'poor') {
        findings.push({
          category: 'risk',
          severity: 'high',
          title: `${insight.productName} Underperforming`,
          description: `${insight.productName} is rated as poor with a score of ${insight.performance.score}`,
          data: insight.metrics
        });
      }

      // Opportunity findings
      for (const rec of insight.recommendations) {
        if (rec.priority === 'high') {
          findings.push({
            category: 'opportunity',
            severity: 'high',
            title: rec.title,
            description: rec.description,
            data: { industry: insight.industry }
          });
        }
      }
    }

    // Cross-industry insights
    if (crossIndustry.opportunities.length > 0) {
      findings.push({
        category: 'opportunity',
        severity: 'medium',
        title: 'Cross-Industry Opportunities Available',
        description: `Found ${crossIndustry.opportunities.length} cross-sell opportunities across industries`,
        data: { opportunityCount: crossIndustry.opportunities.length }
      });
    }

    // Customer insights
    if (customerStats.multiIndustry > customerStats.singleIndustry) {
      findings.push({
        category: 'trend',
        severity: 'medium',
        title: 'Multi-Industry Customers Growing',
        description: `${customerStats.multiIndustry} customers use multiple industries vs ${customerStats.singleIndustry} single-industry`,
        data: customerStats
      });
    }

    // Generate summary
    const summary = this.generateSummary(findings, crossIndustry);

    console.log(`[${this.agentName}] Analysis complete: ${findings.length} findings`);

    return {
      id: `report-${Date.now()}`,
      type: 'comprehensive',
      industries: Object.keys(hojaiCore.getAllProducts()) as IndustryType[],
      generatedAt: new Date(),
      summary,
      findings,
      metrics: {
        totalRevenue: await revenueConsolidationService.getTotalRevenue(),
        totalCustomers: (await customer360Service.getAllCustomers()).length,
        totalLeads: (await unifiedLeadService.getLeads()).length,
        overallScore: crossIndustry.overallScore,
        bestPerforming: crossIndustry.bestPerforming,
        worstPerforming: crossIndustry.worstPerforming
      },
      recommendations: this.generateRecommendations(findings)
    };
  }

  /**
   * Generate summary from findings
   */
  private generateSummary(findings: Finding[], crossIndustry: any): string {
    const criticalCount = findings.filter(f => f.severity === 'critical').length;
    const opportunityCount = findings.filter(f => f.category === 'opportunity').length;
    const riskCount = findings.filter(f => f.category === 'risk').length;

    let summary = `Analysis of ${crossIndustry.industryRankings.length} industries `;
    summary += `identified ${findings.length} key findings. `;

    if (criticalCount > 0) {
      summary += `${criticalCount} critical issues require immediate attention. `;
    }
    if (opportunityCount > 0) {
      summary += `${opportunityCount} growth opportunities identified. `;
    }
    if (riskCount > 0) {
      summary += `${riskCount} risk areas need monitoring.`;
    }

    return summary;
  }

  /**
   * Generate recommendations from findings
   */
  private generateRecommendations(findings: Finding[]): string[] {
    const recommendations: string[] = [];
    const highPriority = findings.filter(f => f.severity === 'high');

    for (const finding of highPriority) {
      if (finding.category === 'risk') {
        recommendations.push(`Address ${finding.title}: ${finding.suggestedAction || 'Investigate and resolve'}`);
      } else if (finding.category === 'opportunity') {
        recommendations.push(`Pursue ${finding.title}: ${finding.suggestedAction || 'Develop action plan'}`);
      }
    }

    return recommendations;
  }

  /**
   * Analyze specific industry
   */
  async analyzeIndustry(industry: IndustryType): Promise<AnalysisReport> {
    console.log(`[${this.agentName}] Analyzing ${industry}...`);

    const insight = await industryInsightsService.getIndustryInsights(industry);
    if (!insight) {
      return {
        id: `report-${Date.now()}`,
        type: 'industry',
        industries: [industry],
        generatedAt: new Date(),
        summary: `Industry ${industry} not found`,
        findings: [],
        metrics: {},
        recommendations: []
      };
    }

    const findings: Finding[] = [];

    // Performance assessment
    findings.push({
      category: 'performance',
      severity: insight.performance.overall === 'excellent' ? 'low' :
        insight.performance.overall === 'good' ? 'medium' :
          insight.performance.overall === 'average' ? 'medium' : 'high',
      title: `${insight.productName} Performance: ${insight.performance.overall}`,
      description: `Performance score: ${insight.performance.score}/100, Trend: ${insight.performance.trend}`,
      data: insight.metrics
    });

    // Benchmark analysis
    findings.push({
      category: 'performance',
      severity: 'low',
      title: 'Benchmark Comparison',
      description: `${insight.benchmark.percentile.toFixed(0)}th percentile in industry`,
      data: insight.benchmark
    });

    // Recommendations from insights
    for (const rec of insight.recommendations) {
      findings.push({
        category: rec.type === 'growth' || rec.type === 'optimization' ? 'opportunity' : 'risk',
        severity: rec.priority === 'high' ? 'high' : rec.priority === 'medium' ? 'medium' : 'low',
        title: rec.title,
        description: rec.description,
        data: { impact: rec.impact, effort: rec.effort }
      });
    }

    // Trends
    if (insight.trends.length > 1) {
      const firstTrend = insight.trends[0];
      const lastTrend = insight.trends[insight.trends.length - 1];
      const trendDirection = lastTrend.revenue > firstTrend.revenue ? 'upward' : 'downward';

      findings.push({
        category: 'trend',
        severity: 'low',
        title: `${trendDirection.charAt(0).toUpperCase() + trendDirection.slice(1)} Revenue Trend`,
        description: `Revenue trend showing ${trendDirection} movement over 12 months`,
        data: { firstMonth: firstTrend.revenue, lastMonth: lastTrend.revenue, change: lastTrend.revenue - firstTrend.revenue }
      });
    }

    return {
      id: `report-${Date.now()}`,
      type: 'industry',
      industries: [industry],
      generatedAt: new Date(),
      summary: `${insight.productName} analysis complete. ${insight.metrics.totalCustomers} customers, ${insight.metrics.totalLeads} leads, $${insight.metrics.revenue.toLocaleString()} revenue.`,
      findings,
      metrics: insight.metrics,
      recommendations: insight.recommendations.map(r => r.title)
    };
  }

  /**
   * Compare multiple industries
   */
  async compareIndustries(industries: IndustryType[]): Promise<ComparisonData> {
    console.log(`[${this.agentName}] Comparing ${industries.length} industries...`);

    const insights = await Promise.all(industries.map(i => industryInsightsService.getIndustryInsights(i)));
    const validInsights = insights.filter(i => i !== null);

    const metrics: ComparisonData['metrics'] = [];
    const comparisonInsights: string[] = [];

    // Revenue comparison
    const revenueValues: Record<string, number> = {};
    for (const insight of validInsights) {
      revenueValues[insight.industry] = insight.metrics.revenue;
    }
    metrics.push({
      name: 'Revenue',
      values: revenueValues
    });

    // Customer comparison
    const customerValues: Record<string, number> = {};
    for (const insight of validInsights) {
      customerValues[insight.industry] = insight.metrics.totalCustomers;
    }
    metrics.push({
      name: 'Total Customers',
      values: customerValues
    });

    // Lead conversion comparison
    const conversionValues: Record<string, number> = {};
    for (const insight of validInsights) {
      conversionValues[insight.industry] = insight.metrics.leadConversionRate * 100;
    }
    metrics.push({
      name: 'Lead Conversion Rate (%)',
      values: conversionValues
    });

    // Average order value
    const aovValues: Record<string, number> = {};
    for (const insight of validInsights) {
      aovValues[insight.industry] = insight.metrics.averageOrderValue;
    }
    metrics.push({
      name: 'Average Order Value',
      values: aovValues
    });

    // Performance score
    const scoreValues: Record<string, number> = {};
    for (const insight of validInsights) {
      scoreValues[insight.industry] = insight.performance.score;
    }
    metrics.push({
      name: 'Performance Score',
      values: scoreValues
    });

    // Generate insights
    const sortedByRevenue = [...validInsights].sort((a, b) => b.metrics.revenue - a.metrics.revenue);
    comparisonInsights.push(`${sortedByRevenue[0].productName} leads in revenue with $${sortedByRevenue[0].metrics.revenue.toLocaleString()}`);

    const sortedByConversion = [...validInsights].sort((a, b) => b.metrics.leadConversionRate - a.metrics.leadConversionRate);
    comparisonInsights.push(`${sortedByConversion[0].productName} has the highest lead conversion at ${(sortedByConversion[0].metrics.leadConversionRate * 100).toFixed(1)}%`);

    return {
      industries,
      metrics,
      insights: comparisonInsights
    };
  }

  /**
   * Analyze customer journey across industries
   */
  async analyzeCustomerJourney(customerId: string): Promise<{
    customerId: string;
    industries: IndustryType[];
    timeline: any[];
    value: number;
    insights: string[];
  }> {
    console.log(`[${this.agentName}] Analyzing customer journey for ${customerId}...`);

    const customer = await customer360Service.getCustomer(customerId);
    if (!customer) {
      return {
        customerId,
        industries: [],
        timeline: [],
        value: 0,
        insights: ['Customer not found']
      };
    }

    const timeline = customer.communicationHistory.map(h => ({
      date: h.timestamp,
      type: h.channel,
      description: h.content
    }));

    const insights: string[] = [];
    if (customer.industries.length > 1) {
      insights.push(`Multi-industry customer engaged with ${customer.industries.length} industries`);
    }
    if (customer.totalLifetimeValue > 1000) {
      insights.push(`High-value customer with $${customer.totalLifetimeValue.toLocaleString()} lifetime value`);
    }

    return {
      customerId,
      industries: customer.industries,
      timeline,
      value: customer.totalLifetimeValue,
      insights
    };
  }

  /**
   * Generate weekly report
   */
  async generateWeeklyReport(): Promise<AnalysisReport> {
    console.log(`[${this.agentName}] Generating weekly report...`);

    const comprehensive = await this.performComprehensiveAnalysis();
    const crossIndustry = await industryInsightsService.getCrossIndustryAnalysis();

    // Add weekly-specific insights
    const weeklyFindings: Finding[] = [
      {
        category: 'trend',
        severity: 'medium',
        title: 'Weekly Performance Summary',
        description: `Overall score: ${crossIndustry.overallScore}/100`,
        data: { bestPerformer: crossIndustry.bestPerforming, worstPerformer: crossIndustry.worstPerforming }
      },
      {
        category: 'opportunity',
        severity: 'medium',
        title: 'Top Cross-Sell Opportunity',
        description: crossIndustry.opportunities[0]?.description || 'No high-value opportunities found',
        data: { potential: crossIndustry.opportunities[0]?.potential }
      }
    ];

    return {
      ...comprehensive,
      id: `weekly-${Date.now()}`,
      findings: [...comprehensive.findings, ...weeklyFindings]
    };
  }

  /**
   * Get agent status
   */
  getStatus(): { agentId: string; name: string; ready: boolean; lastAnalysis?: Date } {
    return {
      agentId: this.agentId,
      name: this.agentName,
      ready: true
    };
  }
}

export const crossIndustryAnalyst = new CrossIndustryAnalystAgent();