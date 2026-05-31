/**
 * HOJAI Performance Dashboard - Report Generator Service
 *
 * Generates comprehensive performance reports for AI employees.
 */
import { v4 as uuid } from 'uuid';
import { format } from 'date-fns';
import { PerformanceReport, KPI, Evaluation, Compensation, EmployeeProfile, } from '../models/performanceModel.js';
export class ReportGenerator {
    /**
     * Generate performance report for an employee
     */
    async generateReport(employeeId, tenantId, periodStart, periodEnd, reportType = 'individual', generatedBy = 'system') {
        const employee = await EmployeeProfile.findOne({ employeeId, tenantId });
        if (!employee) {
            throw new Error(`Employee ${employeeId} not found`);
        }
        const period = format(periodStart, 'yyyy-MM');
        const [kpiData, evaluationHistory, compensationHistory, trendAnalysis] = await Promise.all([
            this.gatherKPIData(employeeId, tenantId, periodStart, periodEnd),
            this.gatherEvaluationHistory(employeeId, tenantId, periodStart, periodEnd),
            this.gatherCompensationHistory(employeeId, tenantId, periodStart, periodEnd),
            this.gatherTrendData(employeeId, tenantId, periodStart, periodEnd),
        ]);
        const summary = this.generateSummary(kpiData, evaluationHistory);
        let report = await PerformanceReport.findOne({
            employeeId,
            tenantId,
            period,
            reportType,
        });
        const reportData = {
            reportId: report?.reportId || `report_${uuid().slice(0, 12)}`,
            employeeId,
            tenantId,
            reportType,
            period,
            periodStart,
            periodEnd,
            summary,
            kpiData,
            evaluationHistory,
            compensationHistory,
            trendAnalysis,
            generatedAt: new Date(),
            generatedBy,
        };
        if (report) {
            Object.assign(report, reportData);
        }
        else {
            report = new PerformanceReport(reportData);
        }
        await report.save();
        return report;
    }
    /**
     * Get report
     */
    async getReport(employeeId, tenantId, period) {
        const query = { employeeId, tenantId };
        if (period)
            query.period = period;
        return PerformanceReport.findOne(query).sort({ generatedAt: -1 });
    }
    /**
     * Get report history
     */
    async getReportHistory(employeeId, tenantId, limit = 12) {
        return PerformanceReport.find({ employeeId, tenantId })
            .sort({ generatedAt: -1 })
            .limit(limit);
    }
    /**
     * Generate team performance report
     */
    async generateTeamReport(tenantId, department, periodStart, periodEnd, generatedBy = 'system') {
        const employees = await EmployeeProfile.find({ tenantId, department, status: 'active' });
        const reports = [];
        for (const employee of employees) {
            try {
                const report = await this.generateReport(employee.employeeId, tenantId, periodStart, periodEnd, 'team', generatedBy);
                reports.push(report);
            }
            catch (error) {
                console.error(`Failed to generate report for ${employee.employeeId}:`, error);
            }
        }
        return reports;
    }
    /**
     * Generate department performance report
     */
    async generateDepartmentReport(tenantId, department, periodStart, periodEnd, generatedBy = 'system') {
        const period = format(periodStart, 'yyyy-MM');
        const employees = await EmployeeProfile.find({ tenantId, department, status: 'active' });
        const employeeIds = employees.map((e) => e.employeeId);
        const [kpis, evaluations] = await Promise.all([
            KPI.find({
                tenantId,
                employeeId: { $in: employeeIds },
                period,
            }),
            Evaluation.find({
                tenantId,
                employeeId: { $in: employeeIds },
                period,
            }),
        ]);
        const aggregatedKPIs = this.aggregateKPIs(kpis);
        const aggregatedEvaluations = this.aggregateEvaluations(evaluations);
        const summary = this.generateDepartmentSummary(department, employees.length, aggregatedKPIs, aggregatedEvaluations);
        const reportId = `report_dept_${uuid().slice(0, 12)}`;
        return {
            reportId,
            employeeId: 'DEPARTMENT',
            tenantId,
            reportType: 'department',
            period,
            periodStart,
            periodEnd,
            summary,
            kpiData: aggregatedKPIs,
            evaluationHistory: [],
            compensationHistory: [],
            trendAnalysis: [],
            generatedAt: new Date(),
            generatedBy,
            createdAt: new Date(),
        };
    }
    /**
     * Generate organization-wide report
     */
    async generateOrganizationReport(tenantId, periodStart, periodEnd, generatedBy = 'system') {
        const period = format(periodStart, 'yyyy-MM');
        const [kpis, evaluations] = await Promise.all([
            KPI.find({ tenantId, period }),
            Evaluation.find({ tenantId, period }),
        ]);
        const aggregatedKPIs = this.aggregateKPIs(kpis);
        const aggregatedEvaluations = this.aggregateEvaluations(evaluations);
        const departments = await EmployeeProfile.distinct('department', { tenantId });
        const summary = {
            overallScore: aggregatedEvaluations.avgOverallScore || 0,
            scoreChange: 0,
            percentileChange: 0,
            topStrength: this.determineTopStrength(aggregatedKPIs, aggregatedEvaluations),
            topImprovement: this.determineTopImprovement(aggregatedKPIs, aggregatedEvaluations),
            totalTasks: aggregatedKPIs.totalTasksCompleted || 0,
            completionRate: aggregatedKPIs.completionRate || 0,
            avgCustomerSatisfaction: aggregatedKPIs.avgCustomerSatisfaction || 0,
            totalRevenue: aggregatedKPIs.totalRevenue || 0,
            periodHighlights: this.generateOrgHighlights(aggregatedKPIs, aggregatedEvaluations, departments.length),
        };
        const reportId = `report_org_${uuid().slice(0, 12)}`;
        return {
            reportId,
            employeeId: 'ORGANIZATION',
            tenantId,
            reportType: 'organization',
            period,
            periodStart,
            periodEnd,
            summary,
            kpiData: aggregatedKPIs,
            evaluationHistory: [],
            compensationHistory: [],
            trendAnalysis: [],
            generatedAt: new Date(),
            generatedBy,
            createdAt: new Date(),
        };
    }
    /**
     * Export report as different formats
     */
    async exportReport(employeeId, tenantId, exportFormat = 'json', period) {
        const report = await this.getReport(employeeId, tenantId, period);
        if (!report) {
            throw new Error('Report not found');
        }
        const filename = `performance-report-${employeeId}-${period || 'latest'}.${exportFormat}`;
        switch (exportFormat) {
            case 'csv':
                return {
                    data: this.convertToCSV(report),
                    contentType: 'text/csv',
                    filename,
                };
            case 'pdf':
                return {
                    data: JSON.stringify(report, null, 2),
                    contentType: 'application/json',
                    filename: filename.replace('.pdf', '.json'),
                };
            case 'json':
            default:
                return {
                    data: JSON.stringify(report, null, 2),
                    contentType: 'application/json',
                    filename,
                };
        }
    }
    // ============ Private Helper Methods ============
    async gatherKPIData(employeeId, tenantId, periodStart, periodEnd) {
        const kpis = await KPI.find({
            employeeId,
            tenantId,
            period: {
                $gte: format(periodStart, 'yyyy-MM'),
                $lte: format(periodEnd, 'yyyy-MM'),
            },
        }).sort({ period: 1 });
        const current = kpis[kpis.length - 1] || {};
        const previous = kpis.length > 1 ? kpis[kpis.length - 2] : {};
        const changes = {};
        const metrics = ['tasksCompleted', 'customerSatisfaction', 'qualityScore', 'revenueGenerated', 'errorRate'];
        for (const metric of metrics) {
            const curr = current[metric] || 0;
            const prev = previous[metric] || 0;
            changes[metric] = prev > 0 ? ((curr - prev) / prev) * 100 : 0;
        }
        return { current, previous, changes };
    }
    async gatherEvaluationHistory(employeeId, tenantId, periodStart, periodEnd) {
        const evaluations = await Evaluation.find({
            employeeId,
            tenantId,
            period: {
                $gte: format(periodStart, 'yyyy-MM'),
                $lte: format(periodEnd, 'yyyy-MM'),
            },
            status: 'completed',
        }).sort({ period: 1 });
        return evaluations.map((e) => ({
            evaluationId: e.evaluationId,
            period: e.period,
            overallScore: e.overallScore,
            componentScores: {
                quality: e.qualityScore,
                productivity: e.productivityScore,
                reliability: e.reliabilityScore,
                collaboration: e.collaborationScore,
                growth: e.growthScore,
            },
        }));
    }
    async gatherCompensationHistory(employeeId, tenantId, periodStart, periodEnd) {
        const compensations = await Compensation.find({
            employeeId,
            tenantId,
            period: {
                $gte: format(periodStart, 'yyyy-MM'),
                $lte: format(periodEnd, 'yyyy-MM'),
            },
        }).sort({ period: 1 });
        return compensations.map((c) => ({
            compensationId: c.compensationId,
            period: c.period,
            grossAmount: c.grossAmount,
            netAmount: c.netAmount,
            breakdown: {
                base: c.baseAmount,
                bonus: c.performanceBonus + c.qualityBonus,
                penalty: c.penalty,
            },
        }));
    }
    async gatherTrendData(employeeId, tenantId, periodStart, periodEnd) {
        const trends = [];
        const kpis = await KPI.find({
            employeeId,
            tenantId,
            period: {
                $gte: format(periodStart, 'yyyy-MM'),
                $lte: format(periodEnd, 'yyyy-MM'),
            },
        }).sort({ period: 1 });
        for (const kpi of kpis) {
            trends.push({ date: kpi.period, metric: 'tasksCompleted', value: kpi.tasksCompleted });
            trends.push({ date: kpi.period, metric: 'qualityScore', value: kpi.qualityScore });
            trends.push({ date: kpi.period, metric: 'customerSatisfaction', value: kpi.customerSatisfaction });
            trends.push({ date: kpi.period, metric: 'revenueGenerated', value: kpi.revenueGenerated });
        }
        return trends;
    }
    generateSummary(kpiData, evaluationHistory) {
        const current = kpiData.current;
        const latestEvaluation = evaluationHistory[evaluationHistory.length - 1];
        const scoreChange = latestEvaluation && evaluationHistory.length > 1
            ? latestEvaluation.overallScore - evaluationHistory[evaluationHistory.length - 2].overallScore
            : 0;
        const highlights = [];
        if ((current?.tasksCompleted || 0) > (kpiData.previous?.tasksCompleted || 0) * 1.2) {
            highlights.push('Task completion increased by 20%');
        }
        if ((current?.customerSatisfaction || 0) > 90) {
            highlights.push('Customer satisfaction rating exceeds 90%');
        }
        if ((current?.qualityScore || 0) > 85) {
            highlights.push('Quality score maintained above 85%');
        }
        return {
            overallScore: latestEvaluation?.overallScore || current?.qualityScore || 0,
            scoreChange,
            percentileChange: 0,
            topStrength: this.determineTopStrength(kpiData, evaluationHistory),
            topImprovement: this.determineTopImprovement(kpiData, evaluationHistory),
            totalTasks: current?.tasksCompleted || 0,
            completionRate: current?.totalTasksAttempted
                ? (current?.tasksCompleted || 0) / current.totalTasksAttempted
                : 0,
            avgCustomerSatisfaction: current?.customerSatisfaction || 0,
            totalRevenue: current?.revenueGenerated || 0,
            periodHighlights: highlights,
        };
    }
    determineTopStrength(kpiData, evaluations) {
        const current = kpiData.current;
        if ((current?.customerSatisfaction || 0) > 90)
            return 'Excellent customer satisfaction';
        if ((current?.qualityScore || 0) > 85)
            return 'High quality work output';
        if ((current?.tasksCompleted || 0) > 100)
            return 'Strong productivity';
        if ((current?.revenueGenerated || 0) > 10000)
            return 'Significant revenue contribution';
        return 'Consistent performance';
    }
    determineTopImprovement(kpiData, evaluations) {
        const current = kpiData.current;
        if ((current?.errorRate || 0) > 0.1)
            return 'Reduce error rate';
        if ((current?.escalationRate || 0) > 0.1)
            return 'Improve problem resolution';
        if ((current?.customerSatisfaction || 0) < 70)
            return 'Enhance customer interactions';
        if ((current?.throughputPerHour || 0) < 5)
            return 'Increase task throughput';
        return 'Maintain current performance';
    }
    aggregateKPIs(kpis) {
        if (kpis.length === 0) {
            return {
                totalTasksCompleted: 0,
                totalTasksFailed: 0,
                completionRate: 0,
                avgCustomerSatisfaction: 0,
                avgQualityScore: 0,
                totalRevenue: 0,
                avgErrorRate: 0,
                avgEscalationRate: 0,
            };
        }
        return {
            totalTasksCompleted: kpis.reduce((sum, k) => sum + k.tasksCompleted, 0),
            totalTasksFailed: kpis.reduce((sum, k) => sum + k.tasksFailed, 0),
            completionRate: kpis.reduce((sum, k) => sum + (k.tasksCompleted / Math.max(1, k.totalTasksAttempted)), 0) / kpis.length,
            avgCustomerSatisfaction: kpis.reduce((sum, k) => sum + k.customerSatisfaction, 0) / kpis.length,
            avgQualityScore: kpis.reduce((sum, k) => sum + k.qualityScore, 0) / kpis.length,
            totalRevenue: kpis.reduce((sum, k) => sum + k.revenueGenerated, 0),
            avgErrorRate: kpis.reduce((sum, k) => sum + k.errorRate, 0) / kpis.length,
            avgEscalationRate: kpis.reduce((sum, k) => sum + k.escalationRate, 0) / kpis.length,
        };
    }
    aggregateEvaluations(evaluations) {
        if (evaluations.length === 0) {
            return {
                avgOverallScore: 0,
                avgQualityScore: 0,
                avgProductivityScore: 0,
                avgReliabilityScore: 0,
                avgCollaborationScore: 0,
                avgGrowthScore: 0,
            };
        }
        return {
            avgOverallScore: evaluations.reduce((sum, e) => sum + e.overallScore, 0) / evaluations.length,
            avgQualityScore: evaluations.reduce((sum, e) => sum + e.qualityScore, 0) / evaluations.length,
            avgProductivityScore: evaluations.reduce((sum, e) => sum + e.productivityScore, 0) / evaluations.length,
            avgReliabilityScore: evaluations.reduce((sum, e) => sum + e.reliabilityScore, 0) / evaluations.length,
            avgCollaborationScore: evaluations.reduce((sum, e) => sum + e.collaborationScore, 0) / evaluations.length,
            avgGrowthScore: evaluations.reduce((sum, e) => sum + e.growthScore, 0) / evaluations.length,
        };
    }
    generateDepartmentSummary(department, employeeCount, aggregatedKPIs, aggregatedEvaluations) {
        return {
            overallScore: aggregatedEvaluations.avgOverallScore || 0,
            scoreChange: 0,
            percentileChange: 0,
            topStrength: `${employeeCount} team members contributing to department goals`,
            topImprovement: 'Cross-team collaboration opportunities',
            totalTasks: aggregatedKPIs.totalTasksCompleted || 0,
            completionRate: aggregatedKPIs.completionRate || 0,
            avgCustomerSatisfaction: aggregatedKPIs.avgCustomerSatisfaction || 0,
            totalRevenue: aggregatedKPIs.totalRevenue || 0,
            periodHighlights: [`${employeeCount} employees in ${department}`],
        };
    }
    generateOrgHighlights(aggregatedKPIs, aggregatedEvaluations, departmentCount) {
        const highlights = [];
        if (aggregatedKPIs.totalRevenue > 100000) {
            highlights.push(`Total revenue: Rs.${aggregatedKPIs.totalRevenue.toLocaleString()}`);
        }
        if (aggregatedEvaluations.avgOverallScore > 80) {
            highlights.push(`Average performance score: ${aggregatedEvaluations.avgOverallScore.toFixed(1)}`);
        }
        if (departmentCount > 1) {
            highlights.push(`${departmentCount} departments evaluated`);
        }
        return highlights;
    }
    convertToCSV(report) {
        const lines = [];
        lines.push('HOJAI Performance Report');
        lines.push(`Employee: ${report.employeeId}`);
        lines.push(`Period: ${report.period}`);
        lines.push(`Generated: ${new Date(report.generatedAt).toISOString()}`);
        lines.push('');
        lines.push('=== Summary ===');
        lines.push(`Overall Score,${report.summary.overallScore}`);
        lines.push(`Score Change,${report.summary.scoreChange}`);
        lines.push(`Total Tasks,${report.summary.totalTasks}`);
        lines.push(`Completion Rate,${(report.summary.completionRate * 100).toFixed(1)}%`);
        lines.push(`Customer Satisfaction,${report.summary.avgCustomerSatisfaction.toFixed(1)}%`);
        lines.push(`Total Revenue,${report.summary.totalRevenue}`);
        lines.push('');
        lines.push('=== KPI Data ===');
        const currentKPI = report.kpiData?.current || {};
        lines.push(`Tasks Completed,${currentKPI.tasksCompleted || 0}`);
        lines.push(`Quality Score,${currentKPI.qualityScore || 0}`);
        lines.push(`Error Rate,${((currentKPI.errorRate || 0) * 100).toFixed(1)}%`);
        lines.push('');
        return lines.join('\n');
    }
}
export const reportGenerator = new ReportGenerator();
export default reportGenerator;
//# sourceMappingURL=reportGenerator.js.map