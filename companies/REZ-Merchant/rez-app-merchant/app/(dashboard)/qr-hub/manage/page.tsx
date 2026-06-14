'use client';

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

interface QRCode {
  id: string;
  type: 'menu' | 'room' | 'ads' | 'link';
  name: string;
  shortCode: string;
  isActive: boolean;
  scansCount: number;
  createdAt: string;
  metadata?: {
    roomNumber?: string;
    campaignName?: string;
    tableId?: string;
  };
}

type FilterType = 'all' | 'menu' | 'room' | 'ads' | 'link';
type ActiveFilter = 'all' | 'active' | 'inactive';

export default function ManageQRPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
  const [codes, setCodes] = useState<QRCode[]>([]);
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Simulated data - replace with actual API call
    setTimeout(() => {
      setCodes([
        {
          id: '1',
          type: 'menu',
          name: 'Main Dining Menu',
          shortCode: 'rez.menu.main',
          isActive: true,
          scansCount: 4520,
          createdAt: '2024-01-15',
          metadata: { tableId: 'main' },
        },
        {
          id: '2',
          type: 'menu',
          name: 'Banquet Menu',
          shortCode: 'rez.menu.banquet',
          isActive: true,
          scansCount: 1230,
          createdAt: '2024-02-01',
          metadata: { tableId: 'banquet' },
        },
        {
          id: '3',
          type: 'room',
          name: 'Room 101',
          shortCode: 'rez.room.101',
          isActive: true,
          scansCount: 45,
          createdAt: '2024-01-20',
          metadata: { roomNumber: '101' },
        },
        {
          id: '4',
          type: 'room',
          name: 'Room 102',
          shortCode: 'rez.room.102',
          isActive: true,
          scansCount: 32,
          createdAt: '2024-01-20',
          metadata: { roomNumber: '102' },
        },
        {
          id: '5',
          type: 'room',
          name: 'Room 103',
          shortCode: 'rez.room.103',
          isActive: false,
          scansCount: 12,
          createdAt: '2024-01-20',
          metadata: { roomNumber: '103' },
        },
        {
          id: '6',
          type: 'ads',
          name: 'Summer Sale Campaign',
          shortCode: 'rez.ads.summer24',
          isActive: true,
          scansCount: 1890,
          createdAt: '2024-04-01',
          metadata: { campaignName: 'Summer Sale 2024' },
        },
        {
          id: '7',
          type: 'ads',
          name: 'Coffee Promo',
          shortCode: 'rez.ads.coffee',
          isActive: true,
          scansCount: 567,
          createdAt: '2024-03-15',
          metadata: { campaignName: 'Coffee Promo' },
        },
        {
          id: '8',
          type: 'link',
          name: 'WhatsApp Link',
          shortCode: 'rez.link.wa',
          isActive: true,
          scansCount: 890,
          createdAt: '2024-01-10',
        },
        {
          id: '9',
          type: 'link',
          name: 'Instagram Link',
          shortCode: 'rez.link.ig',
          isActive: true,
          scansCount: 456,
          createdAt: '2024-01-10',
        },
        {
          id: '10',
          type: 'menu',
          name: 'Takeaway Menu',
          shortCode: 'rez.menu.takeaway',
          isActive: false,
          scansCount: 234,
          createdAt: '2024-02-10',
        },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const filteredCodes = codes.filter((code) => {
    if (typeFilter !== 'all' && code.type !== typeFilter) return false;
    if (activeFilter === 'active' && !code.isActive) return false;
    if (activeFilter === 'inactive' && code.isActive) return false;
    return true;
  });

  const getTypeIcon = (type: QRCode['type']) => {
    switch (type) {
      case 'menu':
        return { icon: 'restaurant' as const, color: '#10B981', label: 'Menu' };
      case 'room':
        return { icon: 'bed' as const, color: '#8B5CF6', label: 'Room' };
      case 'ads':
        return { icon: 'megaphone' as const, color: '#F59E0B', label: 'Ads' };
      case 'link':
        return { icon: 'link' as const, color: '#EC4899', label: 'Link' };
    }
  };

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedCodes);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedCodes(newSelection);
  };

  const selectAll = () => {
    if (selectedCodes.size === filteredCodes.length) {
      setSelectedCodes(new Set());
    } else {
      setSelectedCodes(new Set(filteredCodes.map((c) => c.id)));
    }
  };

  const handleDownload = (format: 'png' | 'svg' | 'pdf') => {
    Alert.alert(
      'Download QR Code',
      `Downloading as ${format.toUpperCase()}...`,
      [{ text: 'OK' }]
    );
  };

  const handleToggleActive = (code: QRCode) => {
    setCodes(codes.map((c) => (c.id === code.id ? { ...c, isActive: !c.isActive } : c)));
  };

  const handleBulkAction = (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedCodes.size === 0) {
      Alert.alert('No Selection', 'Please select at least one QR code.');
      return;
    }

    if (action === 'delete') {
      Alert.alert(
        'Delete QR Codes',
        `Are you sure you want to delete ${selectedCodes.size} QR code(s)?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              setCodes(codes.filter((c) => !selectedCodes.has(c.id)));
              setSelectedCodes(new Set());
            },
          },
        ]
      );
    } else {
      setCodes(
        codes.map((c) =>
          selectedCodes.has(c.id) ? { ...c, isActive: action === 'activate' } : c
        )
      );
      setSelectedCodes(new Set());
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#1a3a52', '#2d5a7b']} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manage QR Codes</Text>
          <TouchableOpacity>
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <Text style={styles.searchPlaceholder}>Search QR codes...</Text>
        </View>
      </LinearGradient>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, typeFilter === 'all' && styles.filterChipActive]}
            onPress={() => setTypeFilter('all')}
          >
            <Text
              style={[styles.filterChipText, typeFilter === 'all' && styles.filterChipTextActive]}
            >
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, typeFilter === 'menu' && styles.filterChipActive]}
            onPress={() => setTypeFilter('menu')}
          >
            <Ionicons
              name="restaurant"
              size={14}
              color={typeFilter === 'menu' ? '#FFFFFF' : '#6B7280'}
            />
            <Text
              style={[styles.filterChipText, typeFilter === 'menu' && styles.filterChipTextActive]}
            >
              Menu
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, typeFilter === 'room' && styles.filterChipActive]}
            onPress={() => setTypeFilter('room')}
          >
            <Ionicons
              name="bed"
              size={14}
              color={typeFilter === 'room' ? '#FFFFFF' : '#6B7280'}
            />
            <Text
              style={[styles.filterChipText, typeFilter === 'room' && styles.filterChipTextActive]}
            >
              Room
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, typeFilter === 'ads' && styles.filterChipActive]}
            onPress={() => setTypeFilter('ads')}
          >
            <Ionicons
              name="megaphone"
              size={14}
              color={typeFilter === 'ads' ? '#FFFFFF' : '#6B7280'}
            />
            <Text
              style={[styles.filterChipText, typeFilter === 'ads' && styles.filterChipTextActive]}
            >
              Ads
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, typeFilter === 'link' && styles.filterChipActive]}
            onPress={() => setTypeFilter('link')}
          >
            <Ionicons
              name="link"
              size={14}
              color={typeFilter === 'link' ? '#FFFFFF' : '#6B7280'}
            />
            <Text
              style={[styles.filterChipText, typeFilter === 'link' && styles.filterChipTextActive]}
            >
              Link
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Status Filter */}
        <View style={styles.statusFilters}>
          <TouchableOpacity
            style={[
              styles.statusChip,
              activeFilter === 'all' && styles.statusChipActive,
            ]}
            onPress={() => setActiveFilter('all')}
          >
            <Text
              style={[
                styles.statusChipText,
                activeFilter === 'all' && styles.statusChipTextActive,
              ]}
            >
              All ({codes.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.statusChip,
              activeFilter === 'active' && styles.statusChipActive,
            ]}
            onPress={() => setActiveFilter('active')}
          >
            <Text
              style={[
                styles.statusChipText,
                activeFilter === 'active' && styles.statusChipTextActive,
              ]}
            >
              Active ({codes.filter((c) => c.isActive).length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.statusChip,
              activeFilter === 'inactive' && styles.statusChipActive,
            ]}
            onPress={() => setActiveFilter('inactive')}
          >
            <Text
              style={[
                styles.statusChipText,
                activeFilter === 'inactive' && styles.statusChipTextActive,
              ]}
            >
              Inactive ({codes.filter((c) => !c.isActive).length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bulk Actions */}
      {selectedCodes.size > 0 && (
        <View style={styles.bulkActions}>
          <Text style={styles.bulkCount}>{selectedCodes.size} selected</Text>
          <View style={styles.bulkButtons}>
            <TouchableOpacity
              style={styles.bulkButton}
              onPress={() => handleBulkAction('activate')}
            >
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              <Text style={[styles.bulkButtonText, { color: '#10B981' }]}>Activate</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.bulkButton}
              onPress={() => handleBulkAction('deactivate')}
            >
              <Ionicons name="pause-circle" size={18} color="#F59E0B" />
              <Text style={[styles.bulkButtonText, { color: '#F59E0B' }]}>Deactivate</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.bulkButton}
              onPress={() => handleBulkAction('delete')}
            >
              <Ionicons name="trash" size={18} color="#EF4444" />
              <Text style={[styles.bulkButtonText, { color: '#EF4444' }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Select All / Actions Row */}
      <View style={styles.selectRow}>
        <TouchableOpacity style={styles.selectAllBtn} onPress={selectAll}>
          <Ionicons
            name={selectedCodes.size === filteredCodes.length ? 'checkbox' : 'square-outline'}
            size={20}
            color="#6366F1"
          />
          <Text style={styles.selectAllText}>
            {selectedCodes.size === filteredCodes.length ? 'Deselect All' : 'Select All'}
          </Text>
        </TouchableOpacity>
        <View style={styles.downloadMenu}>
          <TouchableOpacity
            style={styles.downloadBtn}
            onPress={() => handleDownload('png')}
          >
            <Ionicons name="download" size={16} color="#6366F1" />
            <Text style={styles.downloadBtnText}>Download</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* QR Codes List */}
      <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
        {filteredCodes.map((code) => {
          const typeInfo = getTypeIcon(code.type);
          const isSelected = selectedCodes.has(code.id);
          return (
            <TouchableOpacity
              key={code.id}
              style={[styles.qrCard, isSelected && styles.qrCardSelected]}
              onPress={() => toggleSelection(code.id)}
              activeOpacity={0.7}
            >
              <View style={styles.qrCardLeft}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => toggleSelection(code.id)}
                >
                  <Ionicons
                    name={isSelected ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={isSelected ? '#6366F1' : '#D1D5DB'}
                  />
                </TouchableOpacity>
                <View style={[styles.typeIcon, { backgroundColor: typeInfo.color + '20' }]}>
                  <Ionicons name={typeInfo.icon} size={20} color={typeInfo.color} />
                </View>
                <View style={styles.qrInfo}>
                  <Text style={styles.qrName}>{code.name}</Text>
                  <Text style={styles.qrCode}>{code.shortCode}</Text>
                  <View style={styles.qrMeta}>
                    <Text style={styles.qrScans}>{code.scansCount} scans</Text>
                    <Text style={styles.qrDate}>
                      {new Date(code.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.qrCardRight}>
                <View
                  style={[
                    styles.activeBadge,
                    { backgroundColor: code.isActive ? '#10B98120' : '#EF444420' },
                  ]}
                >
                  <View
                    style={[
                      styles.activeDot,
                      { backgroundColor: code.isActive ? '#10B981' : '#EF4444' },
                    ]}
                  />
                  <Text
                    style={[
                      styles.activeText,
                      { color: code.isActive ? '#10B981' : '#EF4444' },
                    ]}
                  >
                    {code.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleDownload('png')}
                  >
                    <Ionicons name="download-outline" size={20} color="#6B7280" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleToggleActive(code)}
                  >
                    <Ionicons
                      name={code.isActive ? 'pause' : 'play'}
                      size={20}
                      color="#6B7280"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        {filteredCodes.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="qr-code-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No QR codes found</Text>
            <Text style={styles.emptyText}>
              Create your first QR code to get started
            </Text>
            <TouchableOpacity style={styles.createButton}>
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.createButtonText}>Create QR Code</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.bottomBarBtn}>
          <Ionicons name="print-outline" size={20} color="#6366F1" />
          <Text style={styles.bottomBarBtnText}>Print Labels</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomBarBtn}>
          <Ionicons name="refresh" size={20} color="#6366F1" />
          <Text style={styles.bottomBarBtnText}>Regenerate</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.bottomBarBtn}
          onPress={() => router.push('/(dashboard)/qr-generator')}
        >
          <Ionicons name="add-circle" size={20} color="#6366F1" />
          <Text style={styles.bottomBarBtnText}>New QR</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchPlaceholder: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    paddingTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filterScroll: {
    paddingHorizontal: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: '#6366F1',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  statusFilters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  statusChipActive: {
    backgroundColor: '#EEF2FF',
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  statusChipTextActive: {
    color: '#6366F1',
  },
  bulkActions: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bulkCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bulkButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  bulkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bulkButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6366F1',
  },
  downloadMenu: {
    flexDirection: 'row',
    gap: 12,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  downloadBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6366F1',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  qrCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  qrCardSelected: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  qrCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    marginRight: 8,
  },
  typeIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  qrInfo: {
    flex: 1,
  },
  qrName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  qrCode: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  qrMeta: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  qrScans: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  qrDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  qrCardRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    padding: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 24,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 28,
    gap: 16,
  },
  bottomBarBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    gap: 6,
  },
  bottomBarBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6366F1',
  },
});
