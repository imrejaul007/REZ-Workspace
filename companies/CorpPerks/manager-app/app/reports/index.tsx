// ==========================================
// CorpPerks Manager App - Reports Screen
// ==========================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Card, Badge, Button } from '../../src/components';
import {
  Colors,
  Spacing,
  FontSize,
  BorderRadius,
  formatDate,
  formatCurrency,
} from '../../src/utils/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ReportType {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: 'attendance' | 'leave' | 'performance' | 'overview';
}

const reportTypes: ReportType[] = [
  {
    id: 'attendance',
    title: 'Attendance Report',
    description: 'Team attendance patterns, late arrivals, WFH days',
    icon: 'schedule',
    type: 'attendance',
  },
  {
    id: 'leave',
    title: 'Leave Report',
    description: 'Leave requests, approvals, and balances',
    icon: 'event_busy',
    type: 'leave',
  },
  {
    id: 'performance',
    title: 'Performance Report',
    description: 'OKRs, ratings, and team productivity',
    icon: 'trending_up',
    type: 'performance',
  },
  {
    id: 'overview',
    title: 'Team Overview',
    description: 'Complete team summary with all metrics',
    icon: 'dashboard',
    type: 'overview',
  },
];

export default function ReportsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState('this_month');
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  const periods = [
    { id: 'this_week', label: 'This Week' },
    { id: 'this_month', label: 'This Month' },
    { id: 'last_month', label: 'Last Month' },
    { id: 'this_quarter', label: 'This Quarter' },
  ];

  const mockReportData = {
    attendance: {
      avgPresent: 95,
      totalLate: 12,
      totalWfh: 28,
      avgHoursWorked: 8.5,
      trend: 3,
    },
    leave: {
      pendingRequests: 5,
      approvedDays: 45,
      rejectedDays: 3,
      avgResponseTime: '1.5 days',
    },
    performance: {
      avgRating: 4.2,
      topPerformer: 'Vikram Rao',
      avgOkrProgress: 68,
      completedReviews: 3,
    },
    overview: {
      teamSize: 5,
      avgAttendance: 92,
      avgPerformance: 4.26,
      totalLeaveDays: 48,
    },
  };

  const handleGenerateReport = (reportType: string) => {
    setSelectedReport(reportType);
  };

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    logger.info(`Exporting ${selectedReport} as ${format}`);
  };

  const getReportData = (type: string) => {
    switch (type) {
      case 'attendance':
        return mockReportData.attendance;
      case 'leave':
        return mockReportData.leave;
      case 'performance':
        return mockReportData.performance;
      case 'overview':
        return mockReportData.overview;
      default:
        return null;
    }
  };

  const renderReportContent = () => {
    if (!selectedReport) return null;

    const data = getReportData(selectedReport);
    if (!data) return null;

    switch (selectedReport) {
      case 'attendance':
        return (
          <View style={styles.reportContent}>
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{data.avgPresent}%</Text>
                <Text style={styles.metricLabel}>Avg Present</Text>
                <Badge label={`+${data.trend}%`} variant="success" size="sm" />
              </View>
              <View style={styles.metricCard}>
                <Text style={[styles.metricValue, { color: Colors.warning }]}>{data.totalLate}</Text>
                <Text style={styles.metricLabel}>Late Arrivals</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={[styles.metricValue, { color: Colors.info }]}>{data.totalWfh}</Text>
                <Text style={styles.metricLabel}>WFH Days</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{data.avgHoursWorked}h</Text>
                <Text style={styles.metricLabel}>Avg Hours</Text>
              </View>
            </View>

            {/* Simple bar visualization */}
            <View style={styles.chartSection}>
              <Text style={styles.chartTitle}>Weekly Attendance</Text>
              {[95, 88, 100, 92, 85].map((value, index) => (
                <View key={index} style={styles.barRow}>
                  <Text style={styles.barLabel}>Day {index + 1}</Text>
                  <View style={styles.barContainer}>
                    <View style={[styles.bar, { width: `${value}%` }]} />
                  </View>
                  <Text style={styles.barValue}>{value}%</Text>
                </View>
              ))}
            </View>
          </View>
        );

      case 'leave':
        return (
          <View style={styles.reportContent}>
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Text style={[styles.metricValue, { color: Colors.warning }]}>{data.pendingRequests}</Text>
                <Text style={styles.metricLabel}>Pending</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={[styles.metricValue, { color: Colors.success }]}>{data.approvedDays}</Text>
                <Text style={styles.metricLabel}>Approved Days</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={[styles.metricValue, { color: Colors.error }]}>{data.rejectedDays}</Text>
                <Text style={styles.metricLabel}>Rejected</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{data.avgResponseTime}</Text>
                <Text style={styles.metricLabel}>Avg Response</Text>
              </View>
            </View>

            {/* Leave breakdown */}
            <View style={styles.chartSection}>
              <Text style={styles.chartTitle}>Leave Type Breakdown</Text>
              {[
                { type: 'Sick', days: 15, color: Colors.error },
                { type: 'Casual', days: 20, color: Colors.success },
                { type: 'Earned', days: 10, color: Colors.primary },
                { type: 'WFH', days: 3, color: Colors.info },
              ].map((item) => (
                <View key={item.type} style={styles.barRow}>
                  <Text style={styles.barLabel}>{item.type}</Text>
                  <View style={styles.barContainer}>
                    <View style={[styles.bar, { width: `${(item.days / 25) * 100}%`, backgroundColor: item.color }]} />
                  </View>
                  <Text style={styles.barValue}>{item.days}</Text>
                </View>
              ))}
            </View>
          </View>
        );

      case 'performance':
        return (
          <View style={styles.reportContent}>
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{data.avgRating}</Text>
                <Text style={styles.metricLabel}>Avg Rating</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={[styles.metricValue, { color: Colors.success }]}>{data.avgOkrProgress}%</Text>
                <Text style={styles.metricLabel}>OKR Progress</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{data.completedReviews}</Text>
                <Text style={styles.metricLabel}>Reviews Done</Text>
              </View>
            </View>

            {/* Top performer */}
            <View style={styles.topPerformer}>
              <Text style={styles.chartTitle}>Top Performer</Text>
              <View style={styles.performerCard}>
                <Text style={styles.performerIcon}>emoji_events</Text>
                <Text style={styles.performerName}>{data.topPerformer}</Text>
                <Badge label="4.8" variant="success" />
              </View>
            </View>

            {/* Rating distribution */}
            <View style={styles.chartSection}>
              <Text style={styles.chartTitle}>Rating Distribution</Text>
              {[5, 4, 3, 2, 1].map((rating) => (
                <View key={rating} style={styles.barRow}>
                  <Text style={styles.barLabel}>{rating} Star</Text>
                  <View style={styles.barContainer}>
                    <View
                      style={[
                        styles.bar,
                        { width: `${rating === 5 ? 60 : rating === 4 ? 80 : rating === 3 ? 40 : 10}%`, backgroundColor: Colors.warning },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
        );

      case 'overview':
        return (
          <View style={styles.reportContent}>
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{data.teamSize}</Text>
                <Text style={styles.metricLabel}>Team Size</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={[styles.metricValue, { color: Colors.success }]}>{data.avgAttendance}%</Text>
                <Text style={styles.metricLabel}>Avg Attendance</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{data.avgPerformance}</Text>
                <Text style={styles.metricLabel}>Avg Performance</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{data.totalLeaveDays}</Text>
                <Text style={styles.metricLabel}>Leave Days</Text>
              </View>
            </View>

            {/* Summary text */}
            <View style={styles.summarySection}>
              <Text style={styles.chartTitle}>Summary</Text>
              <Text style={styles.summaryText}>
                Your team is performing well with {data.avgAttendance}% average attendance
                and {data.avgPerformance} average performance rating. Keep up the great work!
              </Text>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Period Selection */}
        <View style={styles.periodContainer}>
          <Text style={styles.sectionTitle}>Select Period</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {periods.map((period) => (
              <TouchableOpacity
                key={period.id}
                style={[
                  styles.periodChip,
                  selectedPeriod === period.id && styles.periodChipActive,
                ]}
                onPress={() => setSelectedPeriod(period.id)}
              >
                <Text
                  style={[
                    styles.periodText,
                    selectedPeriod === period.id && styles.periodTextActive,
                  ]}
                >
                  {period.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Report Types */}
        <View style={styles.reportsGrid}>
          {reportTypes.map((report) => (
            <TouchableOpacity
              key={report.id}
              style={[
                styles.reportCard,
                selectedReport === report.id && styles.reportCardSelected,
              ]}
              onPress={() => handleGenerateReport(report.id)}
            >
              <View style={styles.reportIconContainer}>
                <Text style={styles.reportIcon}>{report.icon}</Text>
              </View>
              <Text style={styles.reportTitle}>{report.title}</Text>
              <Text style={styles.reportDescription}>{report.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Report Content */}
        {selectedReport && (
          <Card title="Report Details" style={styles.detailsCard}>
            {renderReportContent()}

            {/* Export Options */}
            <View style={styles.exportSection}>
              <Text style={styles.exportTitle}>Export Report</Text>
              <View style={styles.exportButtons}>
                <TouchableOpacity
                  style={styles.exportButton}
                  onPress={() => handleExport('pdf')}
                >
                  <Text style={styles.exportButtonIcon}>picture_as_pdf</Text>
                  <Text style={styles.exportButtonText}>PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.exportButton}
                  onPress={() => handleExport('excel')}
                >
                  <Text style={styles.exportButtonIcon}>table_chart</Text>
                  <Text style={styles.exportButtonText}>Excel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.exportButton}
                  onPress={() => handleExport('csv')}
                >
                  <Text style={styles.exportButtonIcon}>grid_on</Text>
                  <Text style={styles.exportButtonText}>CSV</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        )}

        {/* Quick Stats Summary */}
        <Card title="Quick Stats" style={styles.section}>
          <View style={styles.quickStats}>
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatValue}>92%</Text>
              <Text style={styles.quickStatLabel}>Attendance</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatValue}>4.2</Text>
              <Text style={styles.quickStatLabel}>Performance</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatValue}>48</Text>
              <Text style={styles.quickStatLabel}>Leave Days</Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  periodContainer: {
    marginBottom: Spacing.lg,
  },
  periodChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  periodChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  periodText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  periodTextActive: {
    color: Colors.textInverse,
  },
  reportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  reportCard: {
    width: '48%',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  reportCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  reportIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  reportIcon: {
    fontSize: 24,
    color: Colors.primary,
  },
  reportTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  reportDescription: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  detailsCard: {
    marginBottom: Spacing.md,
  },
  reportContent: {
    marginBottom: Spacing.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  metricCard: {
    width: '48%',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  metricValue: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  chartSection: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  chartTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  barLabel: {
    width: 60,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  barContainer: {
    flex: 1,
    height: 20,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.sm,
    marginHorizontal: Spacing.sm,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
  },
  barValue: {
    width: 40,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    textAlign: 'right',
    fontWeight: '500',
  },
  topPerformer: {
    marginTop: Spacing.md,
  },
  performerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning + '15',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  performerIcon: {
    fontSize: 24,
    color: Colors.warning,
    marginRight: Spacing.md,
  },
  performerName: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  summarySection: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  summaryText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  exportSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
    marginTop: Spacing.md,
  },
  exportTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  exportButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  exportButton: {
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    minWidth: 80,
  },
  exportButtonIcon: {
    fontSize: 24,
    color: Colors.primary,
    marginBottom: 4,
  },
  exportButtonText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  section: {
    marginBottom: Spacing.md,
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  quickStatValue: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 2,
  },
  quickStatLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  quickStatDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
});
