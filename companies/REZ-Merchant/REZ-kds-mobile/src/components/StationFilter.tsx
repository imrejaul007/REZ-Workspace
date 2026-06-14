/**
 * KDS Mobile - StationFilter Component
 * Station filter tabs/chips for kitchen display
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { KitchenStation, StationConfig } from '../types';
import { getStationLabel, getStationColor } from '../utils/helpers';
import { STATION_COLORS, DEFAULT_STATIONS } from '../utils/constants';

interface StationFilterProps {
  stations: StationConfig[];
  activeStation: KitchenStation;
  allStationActive: boolean;
  onStationChange: (station: KitchenStation) => void;
  onToggleAll: () => void;
  orderCounts?: Record<KitchenStation, number>;
}

const StationFilter: React.FC<StationFilterProps> = ({
  stations,
  activeStation,
  allStationActive,
  onStationChange,
  onToggleAll,
  orderCounts = {},
}) => {
  const getStationCount = useCallback(
    (station: KitchenStation) => {
      return orderCounts[station] || 0;
    },
    [orderCounts]
  );

  const totalActiveCount = Object.values(orderCounts).reduce((sum, count) => sum + count, 0);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* All Stations */}
        <TouchableOpacity
          style={[
            styles.stationChip,
            allStationActive && styles.stationChipActive,
            allStationActive && { backgroundColor: '#2196F3' },
          ]}
          onPress={onToggleAll}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.stationChipText,
              allStationActive && styles.stationChipTextActive,
            ]}
          >
            ALL
          </Text>
          <View
            style={[
              styles.countBadge,
              allStationActive && styles.countBadgeActive,
            ]}
          >
            <Text
              style={[
                styles.countText,
                allStationActive && styles.countTextActive,
              ]}
            >
              {totalActiveCount}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Station Chips */}
        {stations.map((station) => {
          const isActive =
            !allStationActive && activeStation === station.type;
          const count = getStationCount(station.type);

          return (
            <TouchableOpacity
              key={station.id}
              style={[
                styles.stationChip,
                isActive && styles.stationChipActive,
                isActive && { backgroundColor: station.color },
              ]}
              onPress={() => onStationChange(station.type)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.stationIndicator,
                  { backgroundColor: station.color },
                  isActive && styles.stationIndicatorActive,
                ]}
              />
              <Text
                style={[
                  styles.stationChipText,
                  isActive && styles.stationChipTextActive,
                ]}
              >
                {getStationLabel(station.type)}
              </Text>
              {count > 0 && (
                <View
                  style={[
                    styles.countBadge,
                    isActive && styles.countBadgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.countText,
                      isActive && styles.countTextActive,
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a2e',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
  },
  scrollContent: {
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  stationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#2a2a3e',
    marginHorizontal: 4,
    gap: 8,
  },
  stationChipActive: {
    backgroundColor: '#2196F3',
  },
  stationIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.6,
  },
  stationIndicatorActive: {
    opacity: 1,
    backgroundColor: '#FFFFFF',
  },
  stationChipText: {
    color: '#888888',
    fontSize: 13,
    fontWeight: '600',
  },
  stationChipTextActive: {
    color: '#FFFFFF',
  },
  countBadge: {
    backgroundColor: '#3a3a4e',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  countText: {
    color: '#888888',
    fontSize: 12,
    fontWeight: 'bold',
  },
  countTextActive: {
    color: '#FFFFFF',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#3a3a4e',
    marginHorizontal: 8,
  },
});

export default StationFilter;
