/**
 * Audit Log Advanced Filters Modal - Premium Redesign
 * Comprehensive filtering for audit logs
 * Uses AuditFilterContext for state management
 * Permissions required: logs:view
 */

import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Colors, Spacing, Shadows, BorderRadius } from '@/constants/DesignTokens';
import { Heading3, BodyText, Caption } from '@/components/ui/DesignSystemComponents';
import { AuditLogFilters, AuditSeverity, AuditAction, AuditResourceType } from '@/types/audit';
import {
  useActionOptions,
  useResourceTypeOptions,
  useSeverityOptions,
} from '@/hooks/queries/useAudit';
import { useAuditFilters } from '@/contexts/AuditFilterContext';

type DateRangePreset =
  | 'today'
  | 'yesterday'
  | 'last_7_days'
  | 'last_30_days'
  | 'last_90_days'
  | 'custom';

export default function AuditFiltersScreen() {
  const contextFilters = useAuditFilters();

  // Get filter options from service
  const actionOptions = useActionOptions();
  const resourceOptions = useResourceTypeOptions();
  const severityOptions = useSeverityOptions();

  // Local state (used if context not available)
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>(
    contextFilters?.dateRangePreset || 'last_7_days'
  );
  const [selectedActions, setSelectedActions] = useState<Set<string>>(
    new Set(contextFilters?.filters.action || [])
  );
  const [selectedResourceTypes, setSelectedResourceTypes] = useState<Set<string>>(
    new Set(contextFilters?.filters.resourceType || [])
  );
  const [selectedSeverities, setSelectedSeverities] = useState<Set<string>>(
    new Set(contextFilters?.filters.severity || [])
  );
  const [userSearch, setUserSearch] = useState(contextFilters?.filters.search || '');
  const [ipAddress, setIpAddress] = useState(contextFilters?.filters.ipAddress || '');

  // Date range presets
  const datePresets: { label: string; value: DateRangePreset; icon: string }[] = [
    { label: 'Today', value: 'today', icon: 'today' },
    { label: 'Yesterday', value: 'yesterday', icon: 'calendar' },
    { label: 'Last 7 days', value: 'last_7_days', icon: 'calendar-outline' },
    { label: 'Last 30 days', value: 'last_30_days', icon: 'calendar-outline' },
    { label: 'Last 90 days', value: 'last_90_days', icon: 'time' },
  ];

  // Handlers
  const handleDatePresetChange = (preset: DateRangePreset) => {
    setDateRangePreset(preset);
    if (contextFilters) {
      contextFilters.setDateRangePreset(preset);
    }
  };

  const toggleAction = (action: string) => {
    const newSet = new Set(selectedActions);
    if (newSet.has(action)) {
      newSet.delete(action);
    } else {
      newSet.add(action);
    }
    setSelectedActions(newSet);
  };

  const toggleResourceType = (type: string) => {
    const newSet = new Set(selectedResourceTypes);
    if (newSet.has(type)) {
      newSet.delete(type);
    } else {
      newSet.add(type);
    }
    setSelectedResourceTypes(newSet);
  };

  const toggleSeverity = (severity: string) => {
    const newSet = new Set(selectedSeverities);
    if (newSet.has(severity)) {
      newSet.delete(severity);
    } else {
      newSet.add(severity);
    }
    setSelectedSeverities(newSet);
  };

  const handleReset = () => {
    setDateRangePreset('last_7_days');
    setSelectedActions(new Set());
    setSelectedResourceTypes(new Set());
    setSelectedSeverities(new Set());
    setUserSearch('');
    setIpAddress('');

    if (contextFilters) {
      contextFilters.resetFilters();
    }
  };

  const handleApply = () => {
    if (contextFilters) {
      // Update context with all filter values
      contextFilters.setDateRangePreset(dateRangePreset);
      contextFilters.setSeverities(Array.from(selectedSeverities) as AuditSeverity[]);
      contextFilters.setActions(Array.from(selectedActions) as AuditAction[]);
      contextFilters.setResourceTypes(Array.from(selectedResourceTypes) as AuditResourceType[]);
      contextFilters.setSearch(userSearch);
      contextFilters.setIpAddress(ipAddress);
    }

    router.back();
  };

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedActions.size > 0) count++;
    if (selectedResourceTypes.size > 0) count++;
    if (selectedSeverities.size > 0) count++;
    if (userSearch.trim()) count++;
    if (ipAddress.trim()) count++;
    if (dateRangePreset !== 'last_7_days') count++;
    return count;
  }, [
    selectedActions,
    selectedResourceTypes,
    selectedSeverities,
    userSearch,
    ipAddress,
    dateRangePreset,
  ]);

  // Severity colors
  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: '#991B1B',
      error: '#EF4444',
      warning: '#F59E0B',
      info: '#3B82F6',
    };
    return colors[severity] || '#6B7280';
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Date Range Section */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Ionicons name="calendar" size={18} color={Colors.primary[500]} />
              </View>
              <Heading3 style={styles.sectionTitle}>Date Range</Heading3>
            </View>

            <View style={styles.dateGrid}>
              {datePresets.map((preset) => (
                <TouchableOpacity
                  key={preset.value}
                  style={[
                    styles.dateCard,
                    dateRangePreset === preset.value && styles.dateCardActive,
                  ]}
                  onPress={() => handleDatePresetChange(preset.value)}
                >
                  <Ionicons
                    name={preset.icon as unknown as keyof typeof Ionicons.glyphMap}
                    size={20}
                    color={dateRangePreset === preset.value ? '#fff' : Colors.text.secondary}
                  />
                  <BodyText
                    style={[
                      styles.dateCardText,
                      dateRangePreset === preset.value && styles.dateCardTextActive,
                    ]}
                  >
                    {preset.label}
                  </BodyText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Severity Section */}
        <Animated.View entering={FadeInDown.delay(150).springify()}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Ionicons name="alert-circle" size={18} color={Colors.primary[500]} />
              </View>
              <Heading3 style={styles.sectionTitle}>Severity Level</Heading3>
              {selectedSeverities.size > 0 && (
                <View style={styles.selectionBadge}>
                  <BodyText style={styles.selectionBadgeText}>{selectedSeverities.size}</BodyText>
                </View>
              )}
            </View>

            <View style={styles.severityGrid}>
              {severityOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.severityCard,
                    selectedSeverities.has(option.value) && {
                      backgroundColor: getSeverityColor(option.value),
                      borderColor: getSeverityColor(option.value),
                    },
                  ]}
                  onPress={() => toggleSeverity(option.value)}
                >
                  <Ionicons
                    name={
                      option.value === 'critical'
                        ? 'alert-circle'
                        : option.value === 'error'
                          ? 'close-circle'
                          : option.value === 'warning'
                            ? 'warning'
                            : 'information-circle'
                    }
                    size={24}
                    color={
                      selectedSeverities.has(option.value) ? '#fff' : getSeverityColor(option.value)
                    }
                  />
                  <BodyText
                    style={[
                      styles.severityCardText,
                      selectedSeverities.has(option.value) && styles.severityCardTextActive,
                    ]}
                  >
                    {option.label}
                  </BodyText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Resource Types Section */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Ionicons name="cube" size={18} color={Colors.primary[500]} />
              </View>
              <Heading3 style={styles.sectionTitle}>Resource Types</Heading3>
              {selectedResourceTypes.size > 0 && (
                <View style={styles.selectionBadge}>
                  <BodyText style={styles.selectionBadgeText}>
                    {selectedResourceTypes.size}
                  </BodyText>
                </View>
              )}
            </View>

            <View style={styles.chipGrid}>
              {resourceOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.chip,
                    selectedResourceTypes.has(option.value) && styles.chipActive,
                  ]}
                  onPress={() => toggleResourceType(option.value)}
                >
                  <BodyText
                    style={[
                      styles.chipText,
                      selectedResourceTypes.has(option.value) && styles.chipTextActive,
                    ]}
                  >
                    {option.label}
                  </BodyText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Action Types Section */}
        <Animated.View entering={FadeInDown.delay(250).springify()}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Ionicons name="flash" size={18} color={Colors.primary[500]} />
              </View>
              <Heading3 style={styles.sectionTitle}>Action Types</Heading3>
              {selectedActions.size > 0 && (
                <View style={styles.selectionBadge}>
                  <BodyText style={styles.selectionBadgeText}>{selectedActions.size}</BodyText>
                </View>
              )}
            </View>

            <View style={styles.checkboxList}>
              {actionOptions.slice(0, 12).map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.checkboxItem}
                  onPress={() => toggleAction(option.value)}
                >
                  <View
                    style={[
                      styles.checkbox,
                      selectedActions.has(option.value) && styles.checkboxChecked,
                    ]}
                  >
                    {selectedActions.has(option.value) && (
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    )}
                  </View>
                  <BodyText style={styles.checkboxLabel}>{option.label}</BodyText>
                </TouchableOpacity>
              ))}
            </View>

            {actionOptions.length > 12 && (
              <Caption style={styles.moreText}>
                +{actionOptions.length - 12} more action types available
              </Caption>
            )}
          </View>
        </Animated.View>

        {/* User Search Section */}
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Ionicons name="person" size={18} color={Colors.primary[500]} />
              </View>
              <Heading3 style={styles.sectionTitle}>User Filter</Heading3>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="search-outline" size={20} color="#9CA3AF" />
              <TextInput
                style={styles.input}
                placeholder="Search by user name or email..."
                value={userSearch}
                onChangeText={setUserSearch}
                placeholderTextColor="#9CA3AF"
              />
              {userSearch.length > 0 && (
                <TouchableOpacity onPress={() => setUserSearch('')}>
                  <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Animated.View>

        {/* IP Address Section */}
        <Animated.View entering={FadeInDown.delay(350).springify()}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Ionicons name="location" size={18} color={Colors.primary[500]} />
              </View>
              <Heading3 style={styles.sectionTitle}>IP Address</Heading3>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="globe-outline" size={20} color="#9CA3AF" />
              <TextInput
                style={styles.input}
                placeholder="Enter IP address..."
                value={ipAddress}
                onChangeText={setIpAddress}
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
              {ipAddress.length > 0 && (
                <TouchableOpacity onPress={() => setIpAddress('')}>
                  <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Info Box */}
        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color={Colors.primary[500]} />
            <BodyText style={styles.infoText}>
              Filters are combined with AND logic. Logs must match all selected criteria.
            </BodyText>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <Ionicons name="refresh" size={20} color="#6B7280" />
          <BodyText style={styles.resetButtonText}>Reset</BodyText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
          <LinearGradient
            colors={[Colors.primary[500], Colors.primary[600]]}
            style={styles.applyButtonGradient}
          >
            <BodyText style={styles.applyButtonText}>
              Apply Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </BodyText>
            <Ionicons name="checkmark" size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.base,
    gap: Spacing.lg,
    paddingBottom: 100,
  },

  // Section
  section: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border.default,
    ...Shadows.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  selectionBadge: {
    backgroundColor: Colors.primary[500],
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  selectionBadgeText: {
    color: Colors.text.inverse,
    fontSize: 12,
    fontWeight: '700',
  },

  // Date Grid
  dateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.gray[100],
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dateCardActive: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  dateCardText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.secondary,
  },
  dateCardTextActive: {
    color: Colors.text.inverse,
  },

  // Severity Grid
  severityGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  severityCard: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border.default,
  },
  severityCardText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  severityCardTextActive: {
    color: Colors.text.inverse,
  },

  // Chip Grid
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.gray[100],
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  chipActive: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.text.secondary,
  },
  chipTextActive: {
    color: Colors.text.inverse,
  },

  // Checkbox List
  checkboxList: {
    gap: 12,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background.primary,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  checkboxLabel: {
    fontSize: 14,
    color: Colors.text.primary,
  },
  moreText: {
    marginTop: Spacing.sm,
    fontSize: 12,
    color: Colors.text.secondary,
    fontStyle: 'italic',
  },

  // Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.text.primary,
    padding: 0,
  },

  // Info Box
  infoBox: {
    flexDirection: 'row',
    gap: 12,
    padding: Spacing.md,
    backgroundColor: Colors.primary[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary[100],
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.primary[700],
    lineHeight: 18,
  },

  // Action Bar
  actionBar: {
    flexDirection: 'row',
    gap: 12,
    padding: Spacing.base,
    backgroundColor: Colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    ...Shadows.sm,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: Colors.gray[100],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.gray[500],
  },
  applyButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  applyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  applyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
});
