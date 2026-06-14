import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, TextStyle, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';

const { width } = Dimensions.get('window');

type WidgetColors = typeof Colors.light;

export interface WidgetConfig {
  id: string;
  type: 'metric' | 'chart' | 'list' | 'notification' | 'custom';
  title: string;
  size: 'small' | 'medium' | 'large' | 'full';
  position: { x: number; y: number };
  isVisible: boolean;
  refreshInterval?: number; // in seconds
  data?;
}

export interface DashboardWidgetProps {
  config: WidgetConfig;
  onEdit?: (config: WidgetConfig) => void;
  onRemove?: (id: string) => void;
  onMove?: (id: string, position: { x: number; y: number }) => void;
  onResize?: (id: string, size: 'small' | 'medium' | 'large' | 'full') => void;
  children: React.ReactNode;
  isEditing?: boolean;
}

export const DashboardWidget: React.FC<DashboardWidgetProps> = ({
  config,
  onEdit,
  onRemove,
  onMove,
  onResize,
  children,
  isEditing = false,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'] as WidgetColors;
  const themedStyles = getThemedStyles(colors);

  const getWidgetDimensions = () => {
    const padding = 16;
    const gap = 12;
    const availableWidth = width - (padding * 2);

    switch (config.size) {
      case 'small':
        return {
          width: (availableWidth - gap) / 2,
          height: 120,
        };
      case 'medium':
        return {
          width: availableWidth,
          height: 160,
        };
      case 'large':
        return {
          width: availableWidth,
          height: 240,
        };
      case 'full':
        return {
          width: availableWidth,
          height: 320,
        };
      default:
        return {
          width: availableWidth,
          height: 160,
        };
    }
  };

  const dimensions = getWidgetDimensions();

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleEdit = () => {
    setIsMenuOpen(false);
    onEdit?.(config);
  };

  const handleRemove = () => {
    setIsMenuOpen(false);
    onRemove?.(config.id);
  };

  const handleResize = (newSize: typeof config.size) => {
    setIsMenuOpen(false);
    onResize?.(config.id, newSize);
  };

  const MenuButton = ({ icon, label, onPress, color }: {
    icon: string;
    label: string;
    onPress: () => void;
    color?: string;
  }) => (
    <TouchableOpacity style={themedStyles.menuButton} onPress={onPress}>
      <Ionicons name={icon as unknown} size={16} color={color || colors.textSecondary} />
      <ThemedText style={[themedStyles.menuButtonText, color && { color }]}>
        {label}
      </ThemedText>
    </TouchableOpacity>
  );

  if (!config.isVisible) {
    return null;
  }

  return (
    <ThemedView style={[
      themedStyles.container,
      {
        width: dimensions.width,
        height: dimensions.height,
      },
      isEditing && themedStyles.editingContainer,
    ]}>
      {/* Widget Header */}
      <View style={themedStyles.header}>
        <View style={themedStyles.titleContainer}>
          <ThemedText type="defaultSemiBold" style={themedStyles.title}>
            {config.title}
          </ThemedText>
          {config.refreshInterval && (
            <View style={themedStyles.refreshIndicator}>
              <Ionicons name="refresh" size={12} color={colors.textMuted} />
              <ThemedText style={themedStyles.refreshText}>
                {config.refreshInterval}s
              </ThemedText>
            </View>
          )}
        </View>

        {isEditing && (
          <View style={themedStyles.controls}>
            <TouchableOpacity onPress={handleMenuToggle} style={themedStyles.menuToggle}>
              <Ionicons name="ellipsis-vertical" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Widget Content */}
      <View style={themedStyles.content}>
        {children}
      </View>

      {/* Widget Menu */}
      {isMenuOpen && (
        <View style={themedStyles.menu}>
          <MenuButton
            icon="create"
            label="Edit"
            onPress={handleEdit}
          />
          <MenuButton
            icon="resize"
            label="Small"
            onPress={() => handleResize('small')}
            color={config.size === 'small' ? colors.primary : undefined}
          />
          <MenuButton
            icon="resize"
            label="Medium"
            onPress={() => handleResize('medium')}
            color={config.size === 'medium' ? colors.primary : undefined}
          />
          <MenuButton
            icon="resize"
            label="Large"
            onPress={() => handleResize('large')}
            color={config.size === 'large' ? colors.primary : undefined}
          />
          <MenuButton
            icon="trash"
            label="Remove"
            onPress={handleRemove}
            color={colors.error}
          />
        </View>
      )}

      {/* Size Indicator */}
      {isEditing && (
        <View style={themedStyles.sizeIndicator}>
          <ThemedText style={themedStyles.sizeText}>
            {config.size.charAt(0).toUpperCase() + config.size.slice(1)}
          </ThemedText>
        </View>
      )}
    </ThemedView>
  );
};

// Pre-built widget components
export const MetricWidget: React.FC<{
  title: string;
  value: string | number;
  icon: string;
  color: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
}> = ({ title, value, icon, color, change, trend }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'] as WidgetColors;
  const themedStyles = getThemedStyles(colors);

  return (
    <View style={themedStyles.metricWidget}>
      <View style={themedStyles.metricHeader}>
        <Ionicons name={icon as unknown} size={24} color={color} />
        <ThemedText type="caption" style={themedStyles.metricTitle}>
          {title}
        </ThemedText>
      </View>
      <ThemedText type="title" style={themedStyles.metricValue}>
        {typeof value === 'number' && title.toLowerCase().includes('revenue')
          ? `₹${value.toLocaleString()}`
          : value.toLocaleString()}
      </ThemedText>
      {change && (
        <View style={themedStyles.metricChangeContainer}>
          {trend && trend !== 'neutral' && (
            <Ionicons
              name={trend === 'up' ? 'arrow-up' : 'arrow-down'}
              size={12}
              color={trend === 'up' ? colors.success : colors.error}
            />
          )}
          <ThemedText style={[
            themedStyles.metricChange,
            { color: trend === 'up' ? colors.success : trend === 'down' ? colors.error : colors.textSecondary }
          ]}>
            {change}
          </ThemedText>
        </View>
      )}
    </View>
  );
};

export const ListWidget: React.FC<{
  items: Array<{
    id: string;
    title: string;
    subtitle?: string;
    value?: string;
    icon?: string;
    color?: string;
  }>;
  emptyMessage?: string;
}> = ({ items, emptyMessage = 'No items to display' }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'] as WidgetColors;
  const themedStyles = getThemedStyles(colors);

  return (
    <View style={themedStyles.listWidget}>
      {items.length === 0 ? (
        <View style={themedStyles.emptyState}>
          <ThemedText style={themedStyles.emptyMessage}>{emptyMessage}</ThemedText>
        </View>
      ) : (
        items.slice(0, 4).map((item) => (
          <View key={item.id} style={themedStyles.listItem}>
            {item.icon && (
              <View style={[themedStyles.listItemIcon, { backgroundColor: item.color || colors.primary }]}>
                <Ionicons name={item.icon as unknown} size={16} color="white" />
              </View>
            )}
            <View style={themedStyles.listItemContent}>
              <ThemedText style={themedStyles.listItemTitle}>{item.title}</ThemedText>
              {item.subtitle && (
                <ThemedText style={themedStyles.listItemSubtitle}>{item.subtitle}</ThemedText>
              )}
            </View>
            {item.value && (
              <ThemedText style={themedStyles.listItemValue}>{item.value}</ThemedText>
            )}
          </View>
        ))
      )}
    </View>
  );
};

export const ChartWidget: React.FC<{
  data: Array<{ label: string; value: number }>;
  type: 'bar' | 'line' | 'pie';
  color?: string;
  showValues?: boolean;
}> = ({ data, type, color, showValues = false }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'] as WidgetColors;
  const themedStyles = getThemedStyles(colors);
  const widgetColor = color ?? colors.primary;
  const maxValue = Math.max(...data.map(item => item.value));

  if (type === 'bar') {
    return (
      <View style={themedStyles.chartWidget}>
        <View style={themedStyles.barChart}>
          {data.slice(0, 6).map((item, index) => {
            const barHeight = maxValue > 0 ? (item.value / maxValue) * 60 : 0;

            return (
              <View key={index} style={themedStyles.barContainer}>
                <View style={themedStyles.barColumn}>
                  <View
                    style={[
                      themedStyles.bar,
                      {
                        height: barHeight,
                        backgroundColor: widgetColor,
                      }
                    ]}
                  />
                </View>
                <ThemedText style={themedStyles.barLabel} numberOfLines={1}>
                  {item.label}
                </ThemedText>
                {showValues && (
                  <ThemedText style={themedStyles.barValue}>
                    {item.value}
                  </ThemedText>
                )}
              </View>
            );
          })}
        </View>
      </View>
    );
  }

  // Simplified line chart for small widgets
  return (
    <View style={themedStyles.chartWidget}>
      <View style={themedStyles.lineChart}>
        {data.map((item, index) => {
          const pointHeight = maxValue > 0 ? (item.value / maxValue) * 60 : 0;
          const x = (index / (data.length - 1)) * 100;

          return (
            <View
              key={index}
              style={[
                themedStyles.dataPoint,
                {
                  left: `${x}%`,
                  bottom: pointHeight,
                  backgroundColor: widgetColor,
                }
              ]}
            />
          );
        })}
      </View>
    </View>
  );
};

const getThemedStyles = (colors: WidgetColors) => StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  editingContainer: {
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 14,
  },
  refreshIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 4,
    paddingVertical: 2,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 4,
  },
  refreshText: {
    fontSize: 10,
    color: colors.textMuted,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuToggle: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: colors.backgroundSecondary,
  },
  content: {
    flex: 1,
  },
  menu: {
    position: 'absolute',
    top: 40,
    right: 16,
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 1000,
    minWidth: 120,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  menuButtonText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  sizeIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sizeText: {
    fontSize: 8,
    color: 'white',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  // Metric Widget Styles
  metricWidget: {
    flex: 1,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  metricTitle: {
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 11,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  metricChangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricChange: {
    fontSize: 12,
    fontWeight: '600',
  },
  // List Widget Styles
  listWidget: {
    flex: 1,
    gap: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyMessage: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  listItemIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 12,
    color: colors.text,
    marginBottom: 1,
  },
  listItemSubtitle: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  listItemValue: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  // Chart Widget Styles
  chartWidget: {
    flex: 1,
    justifyContent: 'center',
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 60,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
    maxWidth: 30,
  },
  barColumn: {
    height: 60,
    width: 12,
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  bar: {
    width: '100%',
    borderRadius: 2,
    minHeight: 2,
  },
  barLabel: {
    fontSize: 8,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 1,
  },
  barValue: {
    fontSize: 7,
    color: colors.textMuted,
    textAlign: 'center',
  },
  lineChart: {
    height: 60,
    position: 'relative',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 4,
  },
  dataPoint: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    marginLeft: -2,
    marginBottom: -2,
  },
});