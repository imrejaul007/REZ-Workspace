import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '@/services/api/client';
import { Colors } from '@/constants/DesignTokens';
import { logger } from '@/utils/logger';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function formatWeek(d: Date): string {
  const end = new Date(d);
  end.setDate(end.getDate() + 6);
  return `${d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  })} – ${end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

interface StaffShift {
  _id: string;
  staffId: string;
  staffName: string;
  shifts: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isOff: boolean;
  }>;
}

export default function StaffRotaScreen() {
  const params = useLocalSearchParams();
  const storeId = params.storeId as string;

  const [staffShifts, setStaffShifts] = useState<StaffShift[]>([]);
  const [weekStart, setWeekStart] = useState<Date>(getMonday(new Date()));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (storeId) {
      loadRota();
    }
  }, [weekStart, storeId]);

  const loadRota = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/merchant/staff-shifts', {
        params: {
          storeId,
          weekStart: weekStart.toISOString().split('T')[0],
        },
      });
      if (response.data?.success) {
        setStaffShifts(response.data.data || []);
      }
    } catch (error) {
      logger.error('Failed to load rota:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateWeek = (delta: number) => {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + delta * 7);
    setWeekStart(next);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Week Navigation */}
      <View style={styles.weekNav}>
        <TouchableOpacity
          onPress={() => navigateWeek(-1)}
          style={styles.navBtn}
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.weekLabel}>{formatWeek(weekStart)}</Text>
        <TouchableOpacity
          onPress={() => navigateWeek(1)}
          style={styles.navBtn}
          accessibilityRole="button"
        >
          <Ionicons name="chevron-forward" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Rota Table */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* Header Row */}
          <View style={styles.headerRow}>
            <View style={styles.staffCol}>
              <Text style={styles.headerText}>Staff</Text>
            </View>
            {DAYS.map((d) => (
              <View key={d} style={styles.dayCol}>
                <Text style={styles.headerText}>{d}</Text>
              </View>
            ))}
          </View>

          {/* Staff Rows */}
          {staffShifts.length > 0 ? (
            staffShifts.map((staff) => (
              <View key={staff._id} style={styles.staffRow}>
                <View style={styles.staffCol}>
                  <Text style={styles.staffName}>{staff.staffName}</Text>
                </View>
                {DAYS.map((_, dayIdx) => {
                  const shift = staff.shifts?.find((s) => s.dayOfWeek === dayIdx + 1);
                  const isOff = !shift || shift.isOff;
                  return (
                    <View
                      key={dayIdx}
                      style={[styles.dayCol, isOff ? styles.dayOff : styles.dayOn]}
                    >
                      {isOff ? (
                        <Text style={styles.offText}>OFF</Text>
                      ) : (
                        <>
                          <Text style={styles.shiftTime}>{shift?.startTime}</Text>
                          <Text style={styles.shiftTime}>{shift?.endTime}</Text>
                        </>
                      )}
                    </View>
                  );
                })}
              </View>
            ))
          ) : (
            <View style={styles.emptyRow}>
              <Text style={styles.emptyText}>No staff assigned for this week</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  navBtn: {
    padding: 8,
  },
  weekLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: Colors.primary[700] || '#1a3a52',
    paddingVertical: 10,
  },
  staffCol: {
    width: 100,
    paddingHorizontal: 8,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  dayCol: {
    width: 80,
    paddingHorizontal: 4,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  staffRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    backgroundColor: '#fff',
  },
  staffName: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  dayOff: {
    backgroundColor: '#f5f5f5',
  },
  dayOn: {
    backgroundColor: '#f0fdf4',
  },
  offText: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
  },
  shiftTime: {
    fontSize: 10,
    color: '#16a34a',
    fontWeight: '600',
  },
  emptyRow: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.text.tertiary,
    fontSize: 14,
    textAlign: 'center',
  },
});
