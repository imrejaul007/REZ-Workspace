/**
 * Compliance Report Screen
 * Premium-designed compliance dashboard with framework analysis
 * Permissions required: logs:view
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { Colors, Spacing, Shadows, BorderRadius, Typography } from '@/constants/DesignTokens';
import {
  Card,
  Heading2,
  Heading3,
  BodyText,
  Caption,
  Badge,
  Button,
  Section,
  Divider,
} from '@/components/ui/DesignSystemComponents';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/utils/permissions';
import type { MerchantRole } from '@/types/team';
import { useComplianceReport, useRetentionStatistics } from '@/hooks/queries/useAudit';
import { ComplianceStatus, ComplianceFinding } from '@/types/audit';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ComplianceFramework = 'gdpr' | 'soc2' | 'pci' | 'iso27001';

interface ComplianceItemProps {
  requirement: string;
  status: 'compliant' | 'non_compliant' | 'partial' | 'not_applicable';
  evidence: string[];
  note?: string;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}

// Compliance Item Component
const ComplianceItem: React.FC<ComplianceItemProps> = ({
  requirement,
  status,
  evidence,
  note,
  index,
  isExpanded,
  onToggle,
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'compliant':
        return {
          icon: 'checkmark-circle',
          color: Colors.success[500],
          bgColor: Colors.success[50],
          label: 'Compliant',
        };
      case 'non_compliant':
        return {
          icon: 'close-circle',
          color: Colors.error[500],
          bgColor: Colors.error[50],
          label: 'Non-Compliant',
        };
      case 'partial':
        return {
          icon: 'alert-circle',
          color: Colors.warning[500],
          bgColor: Colors.warning[50],
          label: 'Partial',
        };
      case 'not_applicable':
        return {
          icon: 'remove-circle',
          color: Colors.gray[400],
          bgColor: Colors.gray[100],
          label: 'N/A',
        };
      default:
        return {
          icon: 'help-circle',
          color: Colors.gray[500],
          bgColor: Colors.gray[100],
          label: 'Unknown',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).springify()}
      style={styles.complianceItemContainer}
    >
      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.7}
        style={[styles.complianceItem, isExpanded && styles.complianceItemExpanded]}
      >
        <View style={styles.complianceItemMain}>
          <View style={[styles.statusIconContainer, { backgroundColor: config.bgColor }]}>
            <Ionicons name={config.icon as unknown as keyof typeof Ionicons.glyphMap} size={20} color={config.color} />
          </View>
          <View style={styles.complianceItemContent}>
            <BodyText style={styles.requirementText}>{requirement}</BodyText>
            <View style={[styles.statusBadge, { backgroundColor: config.bgColor }]}>
              <BodyText style={[styles.statusBadgeText, { color: config.color }]}>
                {config.label}
              </BodyText>
            </View>
          </View>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={Colors.text.tertiary}
          />
        </View>

        {isExpanded && (
          <Animated.View entering={FadeInDown.duration(200)} style={styles.complianceItemDetails}>
            {note && (
              <View style={styles.noteContainer}>
                <Ionicons name="information-circle-outline" size={16} color={Colors.primary[500]} />
                <Caption style={styles.noteText}>{note}</Caption>
              </View>
            )}
            {evidence.length > 0 && (
              <View style={styles.evidenceContainer}>
                <Caption style={styles.evidenceLabel}>Evidence:</Caption>
                {evidence.map((item, idx) => (
                  <View key={idx} style={styles.evidenceItem}>
                    <View style={styles.evidenceDot} />
                    <Caption style={styles.evidenceText}>{item}</Caption>
                  </View>
                ))}
              </View>
            )}
          </Animated.View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// Circular Score Gauge Component
const ScoreGauge: React.FC<{ score: number; size?: number }> = ({ score, size = 140 }) => {
  const getScoreColor = () => {
    if (score > 80) return Colors.success[500];
    if (score > 60) return Colors.warning[500];
    return Colors.error[500];
  };

  const getScoreGradient = (): [string, string] => {
    if (score > 80) return [Colors.success[400], Colors.success[600]];
    if (score > 60) return [Colors.warning[400], Colors.warning[600]];
    return [Colors.error[400], Colors.error[600]];
  };

  const circumference = 2 * Math.PI * (size / 2 - 10);
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <View style={[styles.gaugeContainer, { width: size, height: size }]}>
      {/* Background Circle */}
      <View
        style={[
          styles.gaugeBackground,
          {
            width: size - 20,
            height: size - 20,
            borderRadius: (size - 20) / 2,
            borderWidth: 8,
            borderColor: Colors.gray[200],
          },
        ]}
      />
      {/* Progress Arc (simulated with View) */}
      <View
        style={[
          styles.gaugeProgress,
          {
            width: size - 20,
            height: size - 20,
            borderRadius: (size - 20) / 2,
            borderWidth: 8,
            borderColor: getScoreColor(),
            borderTopColor: 'transparent',
            borderRightColor: score > 25 ? getScoreColor() : 'transparent',
            borderBottomColor: score > 50 ? getScoreColor() : 'transparent',
            borderLeftColor: score > 75 ? getScoreColor() : 'transparent',
            transform: [{ rotate: '-45deg' }],
          },
        ]}
      />
      {/* Center Content */}
      <View style={styles.gaugeCenter}>
        <Heading2 style={[styles.gaugeScore, { color: getScoreColor() }]}>{score}%</Heading2>
        <Caption style={styles.gaugeLabel}>Overall Score</Caption>
      </View>
    </View>
  );
};

// Framework Tab Component
const FrameworkTab: React.FC<{
  framework: ComplianceFramework;
  label: string;
  isActive: boolean;
  score?: number;
  onPress: () => void;
  index: number;
}> = ({ framework, label, isActive, score, onPress, index }) => {
  const getFrameworkColor = () => {
    switch (framework) {
      case 'gdpr':
        return '#3B82F6';
      case 'soc2':
        return '#8B5CF6';
      case 'pci':
        return '#EC4899';
      case 'iso27001':
        return '#10B981';
      default:
        return Colors.primary[500];
    }
  };

  const color = getFrameworkColor();

  return (
    <Animated.View entering={FadeInRight.delay(index * 80).springify()}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={[
          styles.frameworkTab,
          isActive && { backgroundColor: `${color}15`, borderColor: color },
        ]}
      >
        <View style={[styles.frameworkTabDot, { backgroundColor: color }]} />
        <BodyText style={[styles.frameworkTabText, isActive && { color, fontWeight: '700' }]}>
          {label}
        </BodyText>
        {score !== undefined && (
          <View style={[styles.frameworkScoreBadge, { backgroundColor: `${color}20` }]}>
            <BodyText style={[styles.frameworkScoreText, { color }]}>{score}%</BodyText>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function ComplianceReportScreen() {
  const { user } = useAuth();

  // Permission check
  const canView = user?.role ? hasPermission(user.role as MerchantRole, 'logs:view') : false;

  // State
  const [activeFramework, setActiveFramework] = useState<ComplianceFramework>('gdpr');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Queries
  const {
    data: complianceData,
    isLoading: complianceLoading,
    isError: complianceError,
    error: complianceErrorData,
    refetch: refetchCompliance,
    isFetching: complianceFetching,
  } = useComplianceReport(undefined, {
    enabled: canView,
  });

  const { data: retentionData, isLoading: retentionLoading } = useRetentionStatistics({
    enabled: canView,
  });

  const isLoading = complianceLoading || retentionLoading;
  const isRefreshing = complianceFetching && !complianceLoading;

  // Handlers
  const handleRefresh = useCallback(() => {
    refetchCompliance();
  }, [refetchCompliance]);

  const toggleItemExpanded = useCallback((itemId: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  // Get active framework data
  const activeFrameworkData = useMemo(() => {
    if (!complianceData?.compliance) return null;
    return complianceData.compliance[activeFramework];
  }, [complianceData, activeFramework]);

  // Get overall score
  const overallScore = useMemo(() => {
    return complianceData?.summary?.overallScore || 0;
  }, [complianceData]);

  // Get risk level color
  const getRiskLevelConfig = (level?: string) => {
    switch (level) {
      case 'low':
        return { color: Colors.success[500], bgColor: Colors.success[50], label: 'Low Risk' };
      case 'medium':
        return { color: Colors.warning[500], bgColor: Colors.warning[50], label: 'Medium Risk' };
      case 'high':
        return { color: Colors.error[500], bgColor: Colors.error[50], label: 'High Risk' };
      case 'critical':
        return { color: Colors.error[700], bgColor: Colors.error[100], label: 'Critical Risk' };
      default:
        return { color: Colors.gray[500], bgColor: Colors.gray[100], label: 'Unknown' };
    }
  };

  const riskConfig = getRiskLevelConfig(complianceData?.summary?.riskLevel);

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Permission denied screen
  if (!canView) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionDenied}>
          <View style={styles.permissionDeniedIcon}>
            <Ionicons name="lock-closed-outline" size={48} color={Colors.gray[400]} />
          </View>
          <Heading3 style={styles.permissionDeniedTitle}>Access Restricted</Heading3>
          <BodyText style={styles.permissionDeniedText}>
            You don't have permission to view compliance reports
          </BodyText>
          <Button
            title="Go Back"
            onPress={() => router.back()}
            variant="secondary"
            style={{ marginTop: Spacing.lg }}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (complianceError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <LinearGradient
            colors={[Colors.error[50], Colors.error[100]]}
            style={styles.errorIconContainer}
          >
            <Ionicons name="alert-circle" size={48} color={Colors.error[500]} />
          </LinearGradient>
          <Heading3 style={styles.errorTitle}>Failed to Load Report</Heading3>
          <BodyText style={styles.errorText}>
            {complianceErrorData?.message || 'An unexpected error occurred'}
          </BodyText>
          <Button
            title="Try Again"
            onPress={() => refetchCompliance()}
            variant="primary"
            style={{ marginTop: Spacing.lg }}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LinearGradient
            colors={[Colors.primary[50], Colors.primary[100]]}
            style={styles.loadingIconContainer}
          >
            <ActivityIndicator size="large" color={Colors.primary[500]} />
          </LinearGradient>
          <BodyText style={styles.loadingText}>Loading compliance report...</BodyText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primary[100], Colors.primary[50], Colors.gray[50]]}
        style={styles.backgroundGradient}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary[500]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Glassmorphic Header */}
        <Animated.View entering={FadeInDown.springify()} style={styles.glassHeader}>
          <LinearGradient
            colors={['rgba(59, 130, 246, 0.95)', 'rgba(99, 102, 241, 0.9)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.glassHeaderGradient}
          >
            <View style={styles.glassHeaderOverlay}>
              <View style={styles.headerContent}>
                <View style={styles.headerTitleSection}>
                  <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                  </TouchableOpacity>
                  <View>
                    <Heading2 style={styles.headerTitle}>Compliance Report</Heading2>
                    <Caption style={styles.headerSubtitle}>
                      Last audit: {formatDate(complianceData?.generatedAt)}
                    </Caption>
                  </View>
                </View>
                <View style={[styles.riskBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <View style={[styles.riskDot, { backgroundColor: riskConfig.color }]} />
                  <BodyText style={styles.riskBadgeText}>{riskConfig.label}</BodyText>
                </View>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Overall Score Card */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <View style={styles.scoreCard}>
            <LinearGradient colors={['#fff', '#F8FAFC']} style={styles.scoreCardGradient}>
              <View style={styles.scoreCardContent}>
                <ScoreGauge score={overallScore} />
                <View style={styles.scoreDetails}>
                  <View style={styles.scoreDetailItem}>
                    <View style={[styles.scoreDetailIcon, { backgroundColor: Colors.success[50] }]}>
                      <Ionicons name="shield-checkmark" size={20} color={Colors.success[500]} />
                    </View>
                    <View>
                      <Caption style={styles.scoreDetailLabel}>Compliant Status</Caption>
                      <BodyText style={styles.scoreDetailValue}>
                        {complianceData?.summary?.compliant ? 'Compliant' : 'Action Required'}
                      </BodyText>
                    </View>
                  </View>
                  <View style={styles.scoreDetailItem}>
                    <View style={[styles.scoreDetailIcon, { backgroundColor: Colors.primary[50] }]}>
                      <Ionicons name="document-text" size={20} color={Colors.primary[500]} />
                    </View>
                    <View>
                      <Caption style={styles.scoreDetailLabel}>Report Period</Caption>
                      <BodyText style={styles.scoreDetailValue}>
                        {formatDate(complianceData?.period?.start)} -{' '}
                        {formatDate(complianceData?.period?.end)}
                      </BodyText>
                    </View>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Framework Tabs */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <View style={styles.frameworkSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconBg}>
                <Ionicons name="layers" size={18} color="#fff" />
              </View>
              <Heading3 style={styles.sectionTitle}>Compliance Frameworks</Heading3>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.frameworkTabsContainer}
            >
              <FrameworkTab
                framework="gdpr"
                label="GDPR"
                isActive={activeFramework === 'gdpr'}
                score={complianceData?.compliance?.gdpr?.score}
                onPress={() => setActiveFramework('gdpr')}
                index={0}
              />
              <FrameworkTab
                framework="soc2"
                label="SOC 2"
                isActive={activeFramework === 'soc2'}
                score={complianceData?.compliance?.soc2?.score}
                onPress={() => setActiveFramework('soc2')}
                index={1}
              />
              <FrameworkTab
                framework="pci"
                label="PCI-DSS"
                isActive={activeFramework === 'pci'}
                score={complianceData?.compliance?.pci?.score}
                onPress={() => setActiveFramework('pci')}
                index={2}
              />
              <FrameworkTab
                framework="iso27001"
                label="ISO 27001"
                isActive={activeFramework === 'iso27001'}
                score={complianceData?.compliance?.iso27001?.score}
                onPress={() => setActiveFramework('iso27001')}
                index={3}
              />
            </ScrollView>
          </View>
        </Animated.View>

        {/* Framework Details */}
        {activeFrameworkData && (
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <View style={styles.frameworkDetailsCard}>
              <View style={styles.frameworkDetailsHeader}>
                <View style={styles.frameworkDetailsInfo}>
                  <Heading3 style={styles.frameworkDetailsTitle}>
                    {activeFrameworkData.framework}
                  </Heading3>
                  <Caption style={styles.frameworkDetailsSubtitle}>
                    Next review: {formatDate(activeFrameworkData.nextReview)}
                  </Caption>
                </View>
                <View style={styles.frameworkScoreDisplay}>
                  <Heading2
                    style={[
                      styles.frameworkScoreValue,
                      {
                        color:
                          activeFrameworkData.score > 80
                            ? Colors.success[500]
                            : activeFrameworkData.score > 60
                              ? Colors.warning[500]
                              : Colors.error[500],
                      },
                    ]}
                  >
                    {activeFrameworkData.score}%
                  </Heading2>
                  <Caption style={styles.frameworkScoreLabel}>Score</Caption>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBackground}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${activeFrameworkData.score}%`,
                        backgroundColor:
                          activeFrameworkData.score > 80
                            ? Colors.success[500]
                            : activeFrameworkData.score > 60
                              ? Colors.warning[500]
                              : Colors.error[500],
                      },
                    ]}
                  />
                </View>
              </View>

              <Divider style={{ marginVertical: Spacing.md }} />

              {/* Requirements List */}
              <View style={styles.requirementsList}>
                {activeFrameworkData.checklist?.map((item, index) => (
                  <ComplianceItem
                    key={`${activeFramework}-${index}`}
                    requirement={item.requirement}
                    status={item.status}
                    evidence={item.evidence}
                    note={item.note}
                    index={index}
                    isExpanded={expandedItems.has(`${activeFramework}-${index}`)}
                    onToggle={() => toggleItemExpanded(`${activeFramework}-${index}`)}
                  />
                ))}
              </View>
            </View>
          </Animated.View>
        )}

        {/* Recommendations Section */}
        {complianceData?.summary?.recommendedActions &&
          complianceData.summary.recommendedActions.length > 0 && (
            <Animated.View entering={FadeInDown.delay(400).springify()}>
              <View style={styles.recommendationsCard}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIconBg, { backgroundColor: Colors.warning[500] }]}>
                    <Ionicons name="bulb" size={18} color="#fff" />
                  </View>
                  <Heading3 style={styles.sectionTitle}>Recommendations</Heading3>
                </View>
                <View style={styles.recommendationsList}>
                  {complianceData.summary.recommendedActions.map((action, index) => (
                    <Animated.View
                      key={index}
                      entering={FadeInRight.delay(index * 60).springify()}
                      style={styles.recommendationItem}
                    >
                      <View style={styles.recommendationNumber}>
                        <BodyText style={styles.recommendationNumberText}>{index + 1}</BodyText>
                      </View>
                      <BodyText style={styles.recommendationText}>{action}</BodyText>
                    </Animated.View>
                  ))}
                </View>
              </View>
            </Animated.View>
          )}

        {/* Data Retention Stats Card */}
        {retentionData && (
          <Animated.View entering={FadeInDown.delay(500).springify()}>
            <View style={styles.retentionCard}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconBg, { backgroundColor: '#8B5CF6' }]}>
                  <Ionicons name="server" size={18} color="#fff" />
                </View>
                <Heading3 style={styles.sectionTitle}>Data Retention</Heading3>
              </View>

              <View style={styles.retentionGrid}>
                <View style={styles.retentionItem}>
                  <View style={[styles.retentionItemIcon, { backgroundColor: '#EEF2FF' }]}>
                    <Ionicons name="documents" size={20} color="#6366F1" />
                  </View>
                  <BodyText style={styles.retentionItemValue}>
                    {retentionData.totalRecords?.toLocaleString() || 0}
                  </BodyText>
                  <Caption style={styles.retentionItemLabel}>Total Records</Caption>
                </View>

                <View style={styles.retentionItem}>
                  <View style={[styles.retentionItemIcon, { backgroundColor: '#F0FDF4' }]}>
                    <Ionicons name="cloud" size={20} color="#10B981" />
                  </View>
                  <BodyText style={styles.retentionItemValue}>
                    {retentionData.storageUsed || 'N/A'}
                  </BodyText>
                  <Caption style={styles.retentionItemLabel}>Storage Used</Caption>
                </View>

                <View style={styles.retentionItem}>
                  <View style={[styles.retentionItemIcon, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="time" size={20} color="#F59E0B" />
                  </View>
                  <BodyText style={styles.retentionItemValue}>
                    {retentionData.retentionPolicy?.activeRetentionDays || 0} days
                  </BodyText>
                  <Caption style={styles.retentionItemLabel}>Retention Period</Caption>
                </View>

                <View style={styles.retentionItem}>
                  <View style={[styles.retentionItemIcon, { backgroundColor: '#FCE7F3' }]}>
                    <Ionicons name="archive" size={20} color="#EC4899" />
                  </View>
                  <BodyText style={styles.retentionItemValue}>
                    {retentionData.archivedRecords?.count?.toLocaleString() || 0}
                  </BodyText>
                  <Caption style={styles.retentionItemLabel}>Archived Records</Caption>
                </View>
              </View>

              {/* Storage Progress */}
              <View style={styles.storageProgress}>
                <View style={styles.storageProgressHeader}>
                  <Caption style={styles.storageProgressLabel}>Storage Utilization</Caption>
                  <Caption style={styles.storageProgressValue}>
                    {retentionData.utilizationPercent || 0}%
                  </Caption>
                </View>
                <View style={styles.storageProgressBar}>
                  <View
                    style={[
                      styles.storageProgressFill,
                      {
                        width: `${retentionData.utilizationPercent || 0}%`,
                        backgroundColor:
                          (retentionData.utilizationPercent || 0) > 80
                            ? Colors.error[500]
                            : (retentionData.utilizationPercent || 0) > 60
                              ? Colors.warning[500]
                              : Colors.success[500],
                      },
                    ]}
                  />
                </View>
                <Caption style={styles.storageLimitText}>
                  {retentionData.storageUsed || '0 MB'} of {retentionData.storageLimit || 'N/A'}
                </Caption>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Security Events Summary */}
        {complianceData?.securityEvents && (
          <Animated.View entering={FadeInDown.delay(600).springify()}>
            <View style={styles.securityCard}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconBg, { backgroundColor: Colors.error[500] }]}>
                  <Ionicons name="shield" size={18} color="#fff" />
                </View>
                <Heading3 style={styles.sectionTitle}>Security Overview</Heading3>
              </View>

              <View style={styles.securityGrid}>
                <View style={styles.securityItem}>
                  <LinearGradient
                    colors={[Colors.warning[50], Colors.warning[100]]}
                    style={styles.securityItemGradient}
                  >
                    <Ionicons name="eye-off" size={24} color={Colors.warning[600]} />
                    <BodyText style={[styles.securityItemValue, { color: Colors.warning[700] }]}>
                      {complianceData.securityEvents.suspiciousActivities || 0}
                    </BodyText>
                    <Caption style={styles.securityItemLabel}>Suspicious Activities</Caption>
                  </LinearGradient>
                </View>

                <View style={styles.securityItem}>
                  <LinearGradient
                    colors={[Colors.error[50], Colors.error[100]]}
                    style={styles.securityItemGradient}
                  >
                    <Ionicons name="hand-left" size={24} color={Colors.error[600]} />
                    <BodyText style={[styles.securityItemValue, { color: Colors.error[700] }]}>
                      {complianceData.securityEvents.unauthorizedAccessAttempts || 0}
                    </BodyText>
                    <Caption style={styles.securityItemLabel}>Unauthorized Attempts</Caption>
                  </LinearGradient>
                </View>

                <View style={styles.securityItem}>
                  <LinearGradient
                    colors={[Colors.primary[50], Colors.primary[100]]}
                    style={styles.securityItemGradient}
                  >
                    <Ionicons name="analytics" size={24} color={Colors.primary[600]} />
                    <BodyText style={[styles.securityItemValue, { color: Colors.primary[700] }]}>
                      {complianceData.securityEvents.dataAccessLogs || 0}
                    </BodyText>
                    <Caption style={styles.securityItemLabel}>Data Access Logs</Caption>
                  </LinearGradient>
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 400,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.base,
  },

  // Glass Header
  glassHeader: {
    marginBottom: Spacing.xl,
    borderRadius: BorderRadius['3xl'],
    overflow: 'hidden',
    ...Shadows.lg,
  },
  glassHeaderGradient: {
    padding: 0,
  },
  glassHeaderOverlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '800',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  riskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  riskBadgeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },

  // Score Card
  scoreCard: {
    marginBottom: Spacing.xl,
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
    ...Shadows.md,
  },
  scoreCardGradient: {
    padding: Spacing.lg,
  },
  scoreCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xl,
  },
  gaugeContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeBackground: {
    position: 'absolute',
  },
  gaugeProgress: {
    position: 'absolute',
  },
  gaugeCenter: {
    alignItems: 'center',
  },
  gaugeScore: {
    fontSize: 32,
    fontWeight: '800',
  },
  gaugeLabel: {
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  scoreDetails: {
    flex: 1,
    gap: Spacing.md,
  },
  scoreDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  scoreDetailIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreDetailLabel: {
    color: Colors.text.tertiary,
    fontSize: 11,
  },
  scoreDetailValue: {
    color: Colors.text.primary,
    fontWeight: '600',
    fontSize: 14,
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: Spacing.md,
  },
  sectionIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },

  // Framework Section
  frameworkSection: {
    marginBottom: Spacing.xl,
  },
  frameworkTabsContainer: {
    gap: 10,
    paddingRight: Spacing.base,
  },
  frameworkTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.border.default,
    gap: 8,
    ...Shadows.sm,
  },
  frameworkTabDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  frameworkTabText: {
    color: Colors.text.secondary,
    fontWeight: '600',
    fontSize: 14,
  },
  frameworkScoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  frameworkScoreText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Framework Details Card
  frameworkDetailsCard: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border.light,
    ...Shadows.sm,
  },
  frameworkDetailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  frameworkDetailsInfo: {
    flex: 1,
  },
  frameworkDetailsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  frameworkDetailsSubtitle: {
    color: Colors.text.tertiary,
    marginTop: 4,
  },
  frameworkScoreDisplay: {
    alignItems: 'flex-end',
  },
  frameworkScoreValue: {
    fontSize: 28,
    fontWeight: '800',
  },
  frameworkScoreLabel: {
    color: Colors.text.tertiary,
  },
  progressBarContainer: {
    marginBottom: Spacing.md,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: Colors.gray[200],
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  requirementsList: {
    gap: Spacing.sm,
  },

  // Compliance Item
  complianceItemContainer: {
    marginBottom: Spacing.xs,
  },
  complianceItem: {
    backgroundColor: Colors.gray[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  complianceItemExpanded: {
    backgroundColor: '#fff',
    borderColor: Colors.primary[200],
  },
  complianceItemMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  statusIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  complianceItemContent: {
    flex: 1,
    gap: 6,
  },
  requirementText: {
    color: Colors.text.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  complianceItemDetails: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    gap: Spacing.sm,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.primary[50],
    padding: Spacing.sm,
    borderRadius: BorderRadius.base,
  },
  noteText: {
    flex: 1,
    color: Colors.primary[700],
  },
  evidenceContainer: {
    gap: 6,
  },
  evidenceLabel: {
    color: Colors.text.secondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  evidenceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingLeft: Spacing.sm,
  },
  evidenceDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gray[400],
    marginTop: 6,
  },
  evidenceText: {
    flex: 1,
    color: Colors.text.tertiary,
  },

  // Recommendations Card
  recommendationsCard: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border.light,
    ...Shadows.sm,
  },
  recommendationsList: {
    gap: Spacing.md,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    backgroundColor: Colors.warning[50],
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.warning[100],
  },
  recommendationNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.warning[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendationNumberText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  recommendationText: {
    flex: 1,
    color: Colors.warning[900],
    fontWeight: '500',
    fontSize: 14,
  },

  // Retention Card
  retentionCard: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border.light,
    ...Shadows.sm,
  },
  retentionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: Spacing.lg,
  },
  retentionItem: {
    width: (SCREEN_WIDTH - Spacing.base * 2 - Spacing.lg * 2 - 12) / 2,
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.gray[50],
    borderRadius: BorderRadius.lg,
    gap: 6,
  },
  retentionItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  retentionItemValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  retentionItemLabel: {
    color: Colors.text.tertiary,
    fontSize: 11,
    textAlign: 'center',
  },
  storageProgress: {
    gap: Spacing.sm,
  },
  storageProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storageProgressLabel: {
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  storageProgressValue: {
    color: Colors.text.primary,
    fontWeight: '700',
  },
  storageProgressBar: {
    height: 8,
    backgroundColor: Colors.gray[200],
    borderRadius: 4,
    overflow: 'hidden',
  },
  storageProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  storageLimitText: {
    color: Colors.text.tertiary,
    textAlign: 'center',
    marginTop: 4,
  },

  // Security Card
  securityCard: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border.light,
    ...Shadows.sm,
  },
  securityGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  securityItem: {
    flex: 1,
  },
  securityItemGradient: {
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: 6,
  },
  securityItemValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  securityItemLabel: {
    color: Colors.text.secondary,
    fontSize: 10,
    textAlign: 'center',
    fontWeight: '600',
  },

  // Loading State
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  loadingIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: Colors.text.secondary,
  },

  // Error State
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTitle: {
    color: Colors.error[700],
    marginTop: Spacing.sm,
  },
  errorText: {
    color: Colors.text.secondary,
    textAlign: 'center',
  },

  // Permission Denied
  permissionDenied: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  permissionDeniedIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  permissionDeniedTitle: {
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  permissionDeniedText: {
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});
