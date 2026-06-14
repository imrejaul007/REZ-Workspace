/**
 * Audit Log Detail Screen - Premium Redesign
 * Shows complete details of a single audit log entry
 * Uses premium components matching dashboard design
 * Permissions required: logs:view
 */

import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { showAlert, showConfirm } from '@/utils/alert';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';

import { Colors, Spacing, Shadows, BorderRadius } from '@/constants/DesignTokens';
import { Heading2, Heading3, BodyText, Caption } from '@/components/ui/DesignSystemComponents';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/utils/permissions';
import type { MerchantRole } from '@/types/team';
import {
  useAuditLogs,
  useResourceHistory,
  useExportAuditLogs,
  useFormatAuditLog,
} from '@/hooks/queries/useAudit';
import { AuditLog, AuditSeverity, AuditChangeDetail } from '@/types/audit';
import { ActionTypeBadge } from '@/components/audit/ActionTypeBadge';
import { SeverityBadge } from '@/components/audit/SeverityBadge';
import { ChangesDiff } from '@/components/audit/ChangesDiff';

export default function AuditLogDetailScreen() {
  const { logId } = useLocalSearchParams();
  const { user } = useAuth();
  const formatLog = useFormatAuditLog();

  // Permission check
  const canView = user?.role ? hasPermission(user.role as MerchantRole, 'logs:view') : false;
  const canExport = user?.role ? hasPermission(user.role as MerchantRole, 'logs:export') : false;

  // Fetch logs and find the specific one
  const {
    data: logsData,
    isLoading,
    isError,
    error,
  } = useAuditLogs({ limit: 100 }, { enabled: canView && !!logId });

  // Find the specific log
  const log = useMemo(() => {
    if (!logsData?.logs) return null;
    return logsData.logs.find((l) => l.id === logId);
  }, [logsData, logId]);

  // Fetch related logs
  const { data: relatedLogsData, isLoading: relatedLoading } = useResourceHistory(
    log?.resourceType || '',
    log?.resourceId || '',
    { enabled: !!log?.resourceType && !!log?.resourceId }
  );

  // Get severity styling
  const getSeverityColor = (severity: AuditSeverity): string => {
    const colors: Record<AuditSeverity, string> = {
      info: '#3B82F6',
      warning: '#F59E0B',
      error: '#EF4444',
      critical: '#991B1B',
    };
    return colors[severity] || '#3B82F6';
  };

  const getSeverityGradient = (severity: AuditSeverity): readonly [string, string] => {
    const gradients: Record<AuditSeverity, readonly [string, string]> = {
      info: ['#3B82F6', '#2563EB'] as const,
      warning: ['#F59E0B', '#D97706'] as const,
      error: ['#EF4444', '#DC2626'] as const,
      critical: ['#991B1B', '#7F1D1D'] as const,
    };
    return gradients[severity] || (['#3B82F6', '#2563EB'] as const);
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      relative: formatLog({ timestamp } as AuditLog).displayTime,
      absolute: date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    };
  };

  // Get action type from audit action
  const getActionType = (
    action: string
  ): 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'IMPORT' => {
    if (action.includes('created')) return 'CREATE';
    if (action.includes('updated') || action.includes('changed')) return 'UPDATE';
    if (action.includes('deleted')) return 'DELETE';
    if (action.includes('login')) return 'LOGIN';
    if (action.includes('logout')) return 'LOGOUT';
    if (action.includes('export')) return 'EXPORT';
    if (action.includes('import')) return 'IMPORT';
    return 'READ';
  };

  // Handle share log
  const handleShare = async () => {
    if (!log) return;

    try {
      const logSummary = `Audit Log: ${formatLog(log).displayAction}\n\nUser: ${log.user?.name || 'System'}\nResource: ${log.resourceType} #${log.resourceId?.substring(0, 8)}\nTimestamp: ${formatTimestamp(log.timestamp).absolute}\nSeverity: ${log.severity}\n\nID: ${log.id}`;

      await Share.share({
        message: logSummary,
        title: 'Audit Log Details',
      });
    } catch (err) {
      showAlert('Error', 'Failed to share log details');
    }
  };

  // Handle export
  const handleExport = async () => {
    if (!canExport || !log) return;

    showConfirm('Export Log', 'Export this audit log entry to JSON?', () => {
      const jsonData = JSON.stringify(log, null, 2);
      showAlert('Success', 'Log exported. In production, this would trigger a download.');
    });
  };

  // Navigate to resource
  const handleNavigateToResource = () => {
    if (!log?.resourceType || !log?.resourceId) return;

    const routes: Record<string, string> = {
      product: `/products/${log.resourceId}`,
      order: `/orders/${log.resourceId}`,
      user: `/team/${log.resourceId}`,
    };

    const route = routes[log.resourceType];
    if (route) {
      router.push(route);
    } else {
      showAlert('Navigation', `Cannot navigate to ${log.resourceType} resource`);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
          <BodyText style={styles.loadingText}>Loading log details...</BodyText>
        </View>
      </SafeAreaView>
    );
  }

  // Error or not found
  if (isError || !log) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <View style={styles.errorIconContainer}>
            <Ionicons name="alert-circle" size={48} color="#EF4444" />
          </View>
          <Heading3 style={styles.errorTitle}>Log Not Found</Heading3>
          <BodyText style={styles.errorText}>
            {error?.message || 'The requested audit log could not be found'}
          </BodyText>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <BodyText style={styles.backButtonText}>Go Back</BodyText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Permission denied
  if (!canView) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <View style={styles.permissionIconContainer}>
            <Ionicons name="lock-closed" size={48} color="#9CA3AF" />
          </View>
          <Heading3 style={styles.permissionTitle}>Access Restricted</Heading3>
          <BodyText style={styles.permissionText}>
            You don't have permission to view this log
          </BodyText>
        </View>
      </SafeAreaView>
    );
  }

  const formatted = formatLog(log);
  const timestamps = formatTimestamp(log.timestamp);
  const severityColor = getSeverityColor(log.severity);
  const severityGradient = getSeverityGradient(log.severity);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primary[100], Colors.primary[50], '#F8F9FE']}
        style={styles.backgroundGradient}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Card */}
        <Animated.View entering={FadeInDown.springify()}>
          <LinearGradient
            colors={severityGradient as unknown as readonly [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerCard}
          >
            <View style={styles.headerOverlay}>
              <View style={styles.headerTop}>
                <SeverityBadge severity={log.severity} size="large" />
                <View style={styles.headerActions}>
                  <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
                    <Ionicons name="share-outline" size={20} color="#fff" />
                  </TouchableOpacity>
                  {canExport && (
                    <TouchableOpacity style={styles.headerButton} onPress={handleExport}>
                      <Ionicons name="download-outline" size={20} color="#fff" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <Heading2 style={styles.headerTitle}>{formatted.displayAction}</Heading2>

              <View style={styles.headerMeta}>
                <ActionTypeBadge actionType={getActionType(log.action)} size="medium" />
                <Caption style={styles.headerTimestamp}>{timestamps.relative}</Caption>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* User Section */}
        {log.user && (
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderIcon}>
                  <Ionicons name="person" size={18} color={Colors.primary[500]} />
                </View>
                <Heading3 style={styles.cardTitle}>User Information</Heading3>
              </View>

              <View style={styles.userInfo}>
                <LinearGradient
                  colors={[Colors.primary[400], Colors.primary[600]]}
                  style={styles.userAvatar}
                >
                  <BodyText style={styles.userAvatarText}>
                    {(log.user.name || 'U').charAt(0).toUpperCase()}
                  </BodyText>
                </LinearGradient>

                <View style={styles.userDetails}>
                  <BodyText style={styles.userName}>{log.user.name}</BodyText>
                  <Caption style={styles.userEmail}>{log.user.email}</Caption>
                  <View style={styles.userRoleBadge}>
                    <BodyText style={styles.userRoleText}>{log.user.role}</BodyText>
                  </View>
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Action Details */}
        <Animated.View entering={FadeInDown.delay(150).springify()}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderIcon}>
                <Ionicons name="information-circle" size={18} color={Colors.primary[500]} />
              </View>
              <Heading3 style={styles.cardTitle}>Action Details</Heading3>
            </View>

            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Caption style={styles.detailLabel}>Action Type</Caption>
                <BodyText style={styles.detailValue}>{log.action}</BodyText>
              </View>

              <View style={styles.detailItem}>
                <Caption style={styles.detailLabel}>Resource Type</Caption>
                <BodyText style={styles.detailValue}>{log.resourceType}</BodyText>
              </View>

              {log.resourceId && (
                <View style={styles.detailItem}>
                  <Caption style={styles.detailLabel}>Resource ID</Caption>
                  <BodyText style={styles.detailValueMono} numberOfLines={1}>
                    {log.resourceId}
                  </BodyText>
                </View>
              )}

              <View style={styles.detailItem}>
                <Caption style={styles.detailLabel}>Timestamp</Caption>
                <BodyText style={styles.detailValue}>{timestamps.absolute}</BodyText>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Changes Section */}
        {log.details?.changes && log.details.changes.length > 0 && (
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderIcon}>
                  <Ionicons name="git-compare" size={18} color={Colors.primary[500]} />
                </View>
                <Heading3 style={styles.cardTitle}>Changes Made</Heading3>
              </View>

              <ChangesDiff
                before={log.details.changes.reduce((acc, c: AuditChangeDetail) => {
                  acc[c.field] = c.before ?? c.oldValue;
                  return acc;
                }, {})}
                after={log.details.changes.reduce((acc, c: AuditChangeDetail) => {
                  acc[c.field] = c.after ?? c.newValue;
                  return acc;
                }, {})}
              />
            </View>
          </Animated.View>
        )}

        {/* Technical Details */}
        <Animated.View entering={FadeInDown.delay(250).springify()}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderIcon}>
                <Ionicons name="code" size={18} color={Colors.primary[500]} />
              </View>
              <Heading3 style={styles.cardTitle}>Technical Details</Heading3>
            </View>

            <View style={styles.technicalDetails}>
              {log.ipAddress && (
                <View style={styles.technicalItem}>
                  <View style={styles.technicalItemIcon}>
                    <Ionicons name="location" size={16} color="#6B7280" />
                  </View>
                  <View style={styles.technicalItemContent}>
                    <Caption style={styles.technicalLabel}>IP Address</Caption>
                    <BodyText style={styles.technicalValue}>{log.ipAddress}</BodyText>
                  </View>
                </View>
              )}

              {log.userAgent && (
                <View style={styles.technicalItem}>
                  <View style={styles.technicalItemIcon}>
                    <Ionicons name="desktop" size={16} color="#6B7280" />
                  </View>
                  <View style={styles.technicalItemContent}>
                    <Caption style={styles.technicalLabel}>User Agent</Caption>
                    <BodyText style={styles.technicalValue} numberOfLines={2}>
                      {log.userAgent}
                    </BodyText>
                  </View>
                </View>
              )}

              <View style={styles.technicalItem}>
                <View style={styles.technicalItemIcon}>
                  <Ionicons name="finger-print" size={16} color="#6B7280" />
                </View>
                <View style={styles.technicalItemContent}>
                  <Caption style={styles.technicalLabel}>Log ID</Caption>
                  <BodyText style={styles.technicalValueMono}>{log.id}</BodyText>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Metadata */}
        {log.details?.metadata && Object.keys(log.details.metadata).length > 0 && (
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderIcon}>
                  <Ionicons name="layers" size={18} color={Colors.primary[500]} />
                </View>
                <Heading3 style={styles.cardTitle}>Additional Context</Heading3>
              </View>

              <View style={styles.metadataList}>
                {Object.entries(log.details.metadata).map(([key, value], index) => (
                  <View key={index} style={styles.metadataItem}>
                    <Caption style={styles.metadataKey}>{key}</Caption>
                    <BodyText style={styles.metadataValue}>
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </BodyText>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>
        )}

        {/* Related Logs */}
        {!relatedLoading && relatedLogsData?.history && relatedLogsData.history.length > 1 && (
          <Animated.View entering={FadeInDown.delay(350).springify()}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderIcon}>
                  <Ionicons name="git-network" size={18} color={Colors.primary[500]} />
                </View>
                <Heading3 style={styles.cardTitle}>
                  Related Logs ({relatedLogsData.history.filter((l) => l.id !== logId).length})
                </Heading3>
              </View>

              {relatedLogsData.history
                .filter((l) => l.id !== logId)
                .slice(0, 5)
                .map((relatedLog, index) => {
                  const relFormatted = formatLog(relatedLog);
                  return (
                    <TouchableOpacity
                      key={relatedLog.id}
                      style={[styles.relatedItem, index === 0 && { borderTopWidth: 0 }]}
                      onPress={() => router.push(`/audit/${relatedLog.id}`)}
                    >
                      <View
                        style={[
                          styles.relatedDot,
                          { backgroundColor: getSeverityColor(relatedLog.severity) },
                        ]}
                      />
                      <View style={styles.relatedContent}>
                        <BodyText style={styles.relatedAction}>
                          {relFormatted.displayAction}
                        </BodyText>
                        <Caption style={styles.relatedTime}>{relFormatted.displayTime}</Caption>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                  );
                })}
            </View>
          </Animated.View>
        )}

        {/* Action Buttons */}
        <Animated.View
          entering={FadeInDown.delay(400).springify()}
          style={styles.actionButtonsContainer}
        >
          {log.resourceId && log.resourceType && (
            <TouchableOpacity style={styles.primaryActionButton} onPress={handleNavigateToResource}>
              <LinearGradient
                colors={[Colors.primary[500], Colors.primary[600]]}
                style={styles.primaryActionButtonGradient}
              >
                <Ionicons name="open-outline" size={20} color="#fff" />
                <BodyText style={styles.primaryActionButtonText}>View Resource</BodyText>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {canExport && (
            <TouchableOpacity style={styles.secondaryActionButton} onPress={handleExport}>
              <Ionicons name="download-outline" size={20} color={Colors.primary[500]} />
              <BodyText style={styles.secondaryActionButtonText}>Export Log</BodyText>
            </TouchableOpacity>
          )}
        </Animated.View>
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
    height: 300,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.base,
    paddingBottom: 100,
    gap: Spacing.md,
  },

  // Header Card
  headerCard: {
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
    ...Shadows.lg,
  },
  headerOverlay: {
    padding: Spacing.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: Colors.text.inverse,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerTimestamp: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
  },

  // Cards
  card: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border.default,
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  cardHeaderIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },

  // User Info
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    color: Colors.text.inverse,
    fontSize: 22,
    fontWeight: '700',
  },
  userDetails: {
    flex: 1,
    gap: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  userRoleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: Colors.primary[100],
    borderRadius: 6,
    marginTop: 4,
  },
  userRoleText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary[600],
  },

  // Details Grid
  detailsGrid: {
    gap: Spacing.md,
  },
  detailItem: {
    gap: 4,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.text.secondary,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  detailValueMono: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: Colors.text.primary,
  },

  // Technical Details
  technicalDetails: {
    gap: Spacing.md,
  },
  technicalItem: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  technicalItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  technicalItemContent: {
    flex: 1,
    gap: 2,
  },
  technicalLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.text.secondary,
  },
  technicalValue: {
    fontSize: 14,
    color: Colors.text.primary,
  },
  technicalValueMono: {
    fontSize: 13,
    fontFamily: 'monospace',
    color: Colors.text.primary,
  },

  // Metadata
  metadataList: {
    gap: Spacing.sm,
  },
  metadataItem: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  metadataKey: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.secondary,
    minWidth: 100,
  },
  metadataValue: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.primary,
  },

  // Related Logs
  relatedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
    gap: Spacing.sm,
  },
  relatedDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  relatedContent: {
    flex: 1,
  },
  relatedAction: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  relatedTime: {
    fontSize: 12,
    color: Colors.text.secondary,
  },

  // Action Buttons
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  primaryActionButton: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    ...Shadows.md,
  },
  primaryActionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  primaryActionButtonText: {
    color: Colors.text.inverse,
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: Colors.background.primary,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.primary[500],
  },
  secondaryActionButtonText: {
    color: Colors.primary[500],
    fontSize: 15,
    fontWeight: '600',
  },

  // States
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.error[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.error[500],
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary[500],
    borderRadius: 12,
  },
  backButtonText: {
    color: Colors.text.inverse,
    fontWeight: '600',
    fontSize: 15,
  },
  permissionIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});
