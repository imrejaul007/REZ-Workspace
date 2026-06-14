/**
 * TableMap Component
 * Visual floor plan representation of restaurant tables
 */

import React, { memo, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/DesignTokens';

interface Table {
  id: string;
  number: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  currentOrder?: {
    orderId: string;
    customerName: string;
    items: number;
    startedAt: string;
    estimatedTime: number;
  };
  position: { x: number; y: number };
  shape: 'round' | 'square' | 'rectangle';
  size: 'small' | 'medium' | 'large';
}

interface TableMapProps {
  tables: Table[];
  onTablePress?: (table: Table) => void;
  canvasWidth?: number;
  canvasHeight?: number;
}

const { width: screenWidth } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.gray[100],
    borderRadius: 16,
    padding: Spacing.md,
    position: 'relative',
  },
  canvas: {
    position: 'relative',
  },
  table: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  tableRound: {
    borderRadius: 9999,
  },
  tableSquare: {
    borderRadius: 8,
  },
  tableRectangle: {
    borderRadius: 8,
  },
  tableSmall: {
    width: 50,
    height: 50,
  },
  tableMedium: {
    width: 70,
    height: 70,
  },
  tableLarge: {
    width: 90,
    height: 60,
  },
  tableAvailable: {
    backgroundColor: Colors.success[50],
    borderColor: Colors.success[500],
  },
  tableOccupied: {
    backgroundColor: Colors.warning[50],
    borderColor: Colors.warning[500],
  },
  tableReserved: {
    backgroundColor: Colors.primary[50],
    borderColor: Colors.primary[500],
  },
  tableCleaning: {
    backgroundColor: Colors.info[50],
    borderColor: Colors.info[500],
  },
  tableNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  tableCapacity: {
    fontSize: 10,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  tableOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderInfo: {
    alignItems: 'center',
  },
  orderCustomer: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.text.primary,
    textAlign: 'center',
  },
  orderTime: {
    fontSize: 8,
    fontWeight: '500',
    color: Colors.warning[600],
    marginTop: 1,
  },
  timer: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Colors.warning[500],
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  timerText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: Colors.background.primary,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  gridLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gridLineHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.border.light,
  },
  gridLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: Colors.border.light,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: Spacing.md,
    gap: Spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 11,
    color: Colors.text.secondary,
  },
});

const STATUS_CONFIG: Record<string, { color: string; bgColor: string; label: string }> = {
  available: { color: Colors.success[700], bgColor: Colors.success[500], label: 'Available' },
  occupied: { color: Colors.warning[700], bgColor: Colors.warning[500], label: 'Occupied' },
  reserved: { color: Colors.primary[700], bgColor: Colors.primary[500], label: 'Reserved' },
  cleaning: { color: Colors.info[700], bgColor: Colors.info[500], label: 'Cleaning' },
};

export const TableMap = memo<TableMapProps>(({
  tables,
  onTablePress,
  canvasWidth = screenWidth - Spacing.lg * 2,
  canvasHeight = 400,
}) => {
  // Calculate elapsed time for occupied tables
  const getElapsedMinutes = (startedAt: string): number => {
    return Math.floor((Date.now() - new Date(startedAt).getTime()) / 60000);
  };

  // Generate grid lines
  const gridLines = useMemo(() => {
    const horizontalLines = [];
    const verticalLines = [];
    const gridSpacing = 50;

    for (let i = 1; i < Math.floor(canvasHeight / gridSpacing); i++) {
      horizontalLines.push(
        <View
          key={`h-${i}`}
          style={[styles.gridLineHorizontal, { top: i * gridSpacing }]}
        />
      );
    }

    for (let i = 1; i < Math.floor(canvasWidth / gridSpacing); i++) {
      verticalLines.push(
        <View
          key={`v-${i}`}
          style={[styles.gridLineVertical, { left: i * gridSpacing }]}
        />
      );
    }

    return [...horizontalLines, ...verticalLines];
  }, [canvasWidth, canvasHeight]);

  const handleTablePress = (table: Table) => {
    onTablePress?.(table);
  };

  const getTableStyle = (table: Table) => {
    const statusStyle = {
      available: styles.tableAvailable,
      occupied: styles.tableOccupied,
      reserved: styles.tableReserved,
      cleaning: styles.tableCleaning,
    }[table.status];

    const shapeStyle = {
      round: styles.tableRound,
      square: styles.tableSquare,
      rectangle: styles.tableRectangle,
    }[table.shape];

    const sizeStyle = {
      small: styles.tableSmall,
      medium: styles.tableMedium,
      large: styles.tableLarge,
    }[table.size];

    return [styles.table, statusStyle, shapeStyle, sizeStyle];
  };

  if (tables.length === 0) {
    return (
      <View style={[styles.container, { height: canvasHeight }]}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="grid-outline" size={48} color={Colors.gray[300]} />
          <Text style={{ color: Colors.text.secondary, marginTop: Spacing.md, fontSize: 14 }}>
            No tables configured
          </Text>
          <Text style={{ color: Colors.text.tertiary, marginTop: 4, fontSize: 12 }}>
            Add tables to see the floor layout
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.canvas, { width: canvasWidth, height: canvasHeight }]}>
        {/* Grid lines */}
        <View style={styles.gridLines}>{gridLines}</View>

        {/* Tables */}
        {tables.map(table => {
          const statusConfig = STATUS_CONFIG[table.status];
          const isOccupied = table.status === 'occupied' && table.currentOrder;
          const elapsedMinutes = isOccupied ? getElapsedMinutes(table.currentOrder!.startedAt) : 0;

          return (
            <TouchableOpacity
              key={table.id}
              style={[
                ...getTableStyle(table),
                {
                  left: table.position.x,
                  top: table.position.y,
                },
              ]}
              onPress={() => handleTablePress(table)}
              activeOpacity={0.7}
            >
              {/* Table Info */}
              <Text style={styles.tableNumber}>{table.number}</Text>
              <Text style={styles.tableCapacity}>{table.capacity}</Text>

              {/* Order Overlay */}
              {isOccupied && (
                <View style={styles.tableOverlay}>
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderCustomer} numberOfLines={1}>
                      {table.currentOrder!.customerName.split(' ')[0]}
                    </Text>
                    <Text style={styles.orderTime}>
                      {table.currentOrder!.items} items
                    </Text>
                  </View>
                </View>
              )}

              {/* Timer Badge */}
              {isOccupied && (
                <View style={styles.timer}>
                  <Text style={styles.timerText}>{elapsedMinutes}m</Text>
                </View>
              )}

              {/* Status Indicator */}
              <View style={[styles.statusIndicator, { backgroundColor: statusConfig.bgColor }]}>
                <View style={[styles.statusDot, { backgroundColor: statusConfig.bgColor }]} />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {Object.entries(STATUS_CONFIG).map(([status, config]) => (
          <View key={status} style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: config.bgColor },
              ]}
            />
            <Text style={styles.legendText}>{config.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
});

TableMap.displayName = 'TableMap';

export default TableMap;
