import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  TextInput,
  Modal,
  Pressable,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { POStatus, PaymentStatus } from '../types';

// Status Badge Component
interface StatusBadgeProps {
  status: POStatus | PaymentStatus;
  type?: 'po' | 'payment';
  size?: 'small' | 'medium' | 'large';
}

const PO_STATUS_CONFIG: Record<POStatus, { color: string; icon: string; label: string }> = {
  draft: { color: '#9E9E9E', icon: 'file-edit-outline', label: 'Draft' },
  pending_approval: { color: '#FF9800', icon: 'clock-outline', label: 'Pending' },
  approved: { color: '#4CAF50', icon: 'check-circle-outline', label: 'Approved' },
  rejected: { color: '#F44336', icon: 'close-circle-outline', label: 'Rejected' },
  sent: { color: '#2196F3', icon: 'send-outline', label: 'Sent' },
  acknowledged: { color: '#03A9F4', icon: 'check-all', label: 'Acknowledged' },
  in_transit: { color: '#9C27B0', icon: 'truck-delivery-outline', label: 'In Transit' },
  delivered: { color: '#4CAF50', icon: 'package-variant-closed-check', label: 'Delivered' },
  cancelled: { color: '#757575', icon: 'cancel', label: 'Cancelled' },
};

const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { color: string; label: string }> = {
  unpaid: { color: '#F44336', label: 'Unpaid' },
  partial: { color: '#FF9800', label: 'Partial' },
  paid: { color: '#4CAF50', label: 'Paid' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  type = 'po',
  size = 'medium',
}) => {
  const config = type === 'po'
    ? PO_STATUS_CONFIG[status as POStatus] || PO_STATUS_CONFIG.draft
    : PAYMENT_STATUS_CONFIG[status as PaymentStatus] || PAYMENT_STATUS_CONFIG.unpaid;

  const sizeStyles = {
    small: { paddingH: 6, paddingV: 2, fontSize: 10, iconSize: 10 },
    medium: { paddingH: 8, paddingV: 4, fontSize: 11, iconSize: 12 },
    large: { paddingH: 12, paddingV: 6, fontSize: 13, iconSize: 14 },
  };

  const s = sizeStyles[size];

  return (
    <View
      style={[
        styles.statusBadge,
        {
          backgroundColor: config.color + '20',
          paddingHorizontal: s.paddingH,
          paddingVertical: s.paddingV,
        },
      ]}
    >
      {type === 'po' && (
        <MaterialCommunityIcons
          name={config.icon as unknown}
          size={s.iconSize}
          color={config.color}
        />
      )}
      <Text style={[styles.statusText, { color: config.color, fontSize: s.fontSize }]}>
        {config.label}
      </Text>
    </View>
  );
};

// Loading Spinner
interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  fullScreen?: boolean;
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  color = '#2196F3',
  fullScreen = false,
  message,
}) => {
  if (fullScreen) {
    return (
      <View style={styles.fullScreenLoader}>
        <ActivityIndicator size={size} color={color} />
        {message && <Text style={styles.loadingMessage}>{message}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.inlineLoader}>
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={styles.loadingMessage}>{message}</Text>}
    </View>
  );
};

// Empty State
interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'inbox-outline',
  title,
  message,
  actionLabel,
  onAction,
}) => {
  return (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name={icon as unknown} size={64} color="#CCC" />
      <Text style={styles.emptyTitle}>{title}</Text>
      {message && <Text style={styles.emptyMessage}>{message}</Text>}
      {actionLabel && onAction && (
        <TouchableOpacity style={styles.emptyButton} onPress={onAction}>
          <Text style={styles.emptyButtonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Network Status Banner
interface NetworkBannerProps {
  isOnline: boolean;
  pendingCount: number;
}

export const NetworkBanner: React.FC<NetworkBannerProps> = ({
  isOnline,
  pendingCount,
}) => {
  if (isOnline && pendingCount === 0) return null;

  return (
    <View
      style={[
        styles.networkBanner,
        { backgroundColor: isOnline ? '#FFF3E0' : '#FFEBEE' },
      ]}
    >
      <MaterialCommunityIcons
        name={isOnline ? 'cloud-sync' : 'cloud-off-outline'}
        size={16}
        color={isOnline ? '#FF9800' : '#F44336'}
      />
      <Text
        style={[
          styles.networkText,
          { color: isOnline ? '#E65100' : '#C62828' },
        ]}
      >
        {isOnline
          ? `${pendingCount} item${pendingCount !== 1 ? 's' : ''} pending sync`
          : 'You are offline. Changes will sync when connected.'}
      </Text>
    </View>
  );
};

// Search Bar
interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search...',
  onClear,
}) => {
  return (
    <View style={styles.searchContainer}>
      <MaterialCommunityIcons name="magnify" size={20} color="#999" />
      <TextInput
        style={styles.searchInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#999"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={onClear || (() => onChangeText(''))}>
          <MaterialCommunityIcons name="close-circle" size={18} color="#999" />
        </TouchableOpacity>
      )}
    </View>
  );
};

// Filter Chip
interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: string;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  selected,
  onPress,
  icon,
}) => {
  return (
    <TouchableOpacity
      style={[styles.filterChip, selected && styles.filterChipSelected]}
      onPress={onPress}
    >
      {icon && (
        <MaterialCommunityIcons
          name={icon as unknown}
          size={14}
          color={selected ? '#FFF' : '#666'}
        />
      )}
      <Text style={[styles.filterChipText, selected && styles.filterChipTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

// Stats Card
interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  color?: string;
  trend?: { value: number; direction: 'up' | 'down' };
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color = '#2196F3',
  trend,
}) => {
  return (
    <View style={styles.statsCard}>
      <View style={styles.statsCardHeader}>
        {icon && (
          <View style={[styles.statsIconContainer, { backgroundColor: color + '20' }]}>
            <MaterialCommunityIcons name={icon as unknown} size={20} color={color} />
          </View>
        )}
        {trend && (
          <View
            style={[
              styles.trendBadge,
              {
                backgroundColor: trend.direction === 'up' ? '#E8F5E9' : '#FFEBEE',
              },
            ]}
          >
            <MaterialCommunityIcons
              name={trend.direction === 'up' ? 'trending-up' : 'trending-down'}
              size={12}
              color={trend.direction === 'up' ? '#4CAF50' : '#F44336'}
            />
            <Text
              style={[
                styles.trendText,
                { color: trend.direction === 'up' ? '#4CAF50' : '#F44336' },
              ]}
            >
              {trend.value}%
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.statsValue}>{value}</Text>
      <Text style={styles.statsTitle}>{title}</Text>
      {subtitle && <Text style={styles.statsSubtitle}>{subtitle}</Text>}
    </View>
  );
};

// Confirm Modal
interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmColor = '#F44336',
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.modalOverlay} onPress={onCancel}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalMessage}>{message}</Text>
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalCancelButton]}
              onPress={onCancel}
            >
              <Text style={styles.modalCancelText}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalConfirmButton]}
              onPress={onConfirm}
            >
              <Text style={[styles.modalConfirmText, { color: confirmColor }]}>
                {confirmLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};

// Pull to Refresh List
interface PullRefreshListProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  refreshing: boolean;
  onRefresh: () => void;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  ListEmptyComponent?: React.ReactElement;
  ListHeaderComponent?: React.ReactElement;
  contentContainerStyle?;
}

export function PullRefreshList<T>({
  data,
  renderItem,
  keyExtractor,
  refreshing,
  onRefresh,
  onEndReached,
  onEndReachedThreshold = 0.5,
  ListEmptyComponent,
  ListHeaderComponent,
  contentContainerStyle,
}: PullRefreshListProps<T>) {
  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#2196F3']}
          tintColor="#2196F3"
        />
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      ListEmptyComponent={ListEmptyComponent}
      ListHeaderComponent={ListHeaderComponent}
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={false}
    />
  );
}

// Header Button
interface HeaderButtonProps {
  icon: string;
  onPress: () => void;
  color?: string;
  badge?: number;
}

export const HeaderButton: React.FC<HeaderButtonProps> = ({
  icon,
  onPress,
  color = '#333',
  badge,
}) => {
  return (
    <TouchableOpacity style={styles.headerButton} onPress={onPress}>
      <MaterialCommunityIcons name={icon as unknown} size={24} color={color} />
      {badge && badge > 0 && (
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{badge > 9 ? '9+' : badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// Quantity Selector
interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  value,
  onChange,
  min = 1,
  max = 9999,
  step = 1,
}) => {
  const decrease = () => {
    const newValue = Math.max(min, value - step);
    onChange(newValue);
  };

  const increase = () => {
    const newValue = Math.min(max, value + step);
    onChange(newValue);
  };

  return (
    <View style={styles.quantitySelector}>
      <TouchableOpacity
        style={[styles.quantityButton, value <= min && styles.quantityButtonDisabled]}
        onPress={decrease}
        disabled={value <= min}
      >
        <MaterialCommunityIcons name="minus" size={18} color={value <= min ? '#CCC' : '#333'} />
      </TouchableOpacity>
      <Text style={styles.quantityValue}>{value}</Text>
      <TouchableOpacity
        style={[styles.quantityButton, value >= max && styles.quantityButtonDisabled]}
        onPress={increase}
        disabled={value >= max}
      >
        <MaterialCommunityIcons name="plus" size={18} color={value >= max ? '#CCC' : '#333'} />
      </TouchableOpacity>
    </View>
  );
};

// Floating Action Button
interface FABProps {
  icon: string;
  onPress: () => void;
  color?: string;
  backgroundColor?: string;
}

export const FAB: React.FC<FABProps> = ({
  icon,
  onPress,
  color = '#FFF',
  backgroundColor = '#2196F3',
}) => {
  const insets = useSafeAreaInsets();

  return (
    <TouchableOpacity
      style={[
        styles.fab,
        { backgroundColor, bottom: insets.bottom + 16 },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <MaterialCommunityIcons name={icon as unknown} size={24} color={color} />
    </TouchableOpacity>
  );
};

// Section Header
interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  actionLabel,
  onAction,
}) => {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity onPress={onAction}>
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    gap: 4,
  },
  statusText: {
    fontWeight: '600',
  },
  fullScreenLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  inlineLoader: {
    padding: 20,
    alignItems: 'center',
  },
  loadingMessage: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#2196F3',
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  networkBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  networkText: {
    fontSize: 12,
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    gap: 4,
  },
  filterChipSelected: {
    backgroundColor: '#2196F3',
  },
  filterChipText: {
    fontSize: 13,
    color: '#666',
  },
  filterChipTextSelected: {
    color: '#FFF',
    fontWeight: '500',
  },
  statsCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statsCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statsIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statsValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  statsTitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  statsSubtitle: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#F5F5F5',
  },
  modalConfirmButton: {
    backgroundColor: '#F5F5F5',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: '600',
  },
  headerButton: {
    padding: 8,
  },
  headerBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#F44336',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  headerBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  quantityButton: {
    padding: 8,
  },
  quantityButtonDisabled: {
    opacity: 0.5,
  },
  quantityValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    minWidth: 40,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  sectionAction: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
  },
});

export default {
  StatusBadge,
  LoadingSpinner,
  EmptyState,
  NetworkBanner,
  SearchBar,
  FilterChip,
  StatsCard,
  ConfirmModal,
  PullRefreshList,
  HeaderButton,
  QuantitySelector,
  FAB,
  SectionHeader,
};
