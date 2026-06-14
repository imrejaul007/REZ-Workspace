'use client';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Award, Briefcase, GraduationCap, Trophy, FolderGit2, CheckCircle, Calendar, ChevronRight, Plus } from 'lucide-react-native';
import { useAppStore } from '../../store/useAppStore';

const { width } = Dimensions.get('window');

export default function PassportScreen() {
  const { passportEntries, verifications, initializeMockData } = useAppStore();
  const [activeTab, setActiveTab] = useState<'all' | 'education' | 'employment' | 'certification' | 'awards'>('all');

  useEffect(() => {
    if (passportEntries.length === 0) {
      initializeMockData();
    }
  }, []);

  const filteredEntries = activeTab === 'all'
    ? passportEntries
    : passportEntries.filter(entry => {
        switch (activeTab) {
          case 'education': return entry.type === 'education';
          case 'employment': return entry.type === 'employment';
          case 'certification': return entry.type === 'certification';
          case 'awards': return entry.type === 'award' || entry.type === 'project';
          default: return true;
        }
      });

  const getEntryIcon = (type: string) => {
    switch (type) {
      case 'education':
        return <GraduationCap size={20} color="#6366f1" />;
      case 'employment':
        return <Briefcase size={20} color="#22c55e" />;
      case 'certification':
        return <Award size={20} color="#f59e0b" />;
      case 'award':
        return <Trophy size={20} color="#FFD700" />;
      case 'project':
        return <FolderGit2 size={20} color="#8b5cf6" />;
      default:
        return <Award size={20} color="#6366f1" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'education': return '#6366f1';
      case 'employment': return '#22c55e';
      case 'certification': return '#f59e0b';
      case 'award': return '#FFD700';
      case 'project': return '#8b5cf6';
      default: return '#6366f1';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#1a1a2e', '#0f0f23']} style={styles.header}>
        <Text style={styles.headerTitle}>Career Passport</Text>
        <Text style={styles.headerSubtitle}>
          Your verified professional credentials
        </Text>
      </LinearGradient>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{passportEntries.length}</Text>
          <Text style={styles.statLabel}>Entries</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{passportEntries.filter(e => e.verified).length}</Text>
          <Text style={styles.statLabel}>Verified</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{verifications.filter(v => v.status === 'approved').length}</Text>
          <Text style={styles.statLabel}>Checks</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {['all', 'education', 'employment', 'certification', 'awards'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterTab, activeTab === tab && styles.filterTabActive]}
            onPress={() => setActiveTab(tab as typeof activeTab)}
          >
            <Text style={[styles.filterTabText, activeTab === tab && styles.filterTabTextActive]}>
              {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Entries List */}
      <ScrollView style={styles.entriesContainer} showsVerticalScrollIndicator={false}>
        {filteredEntries.map((entry) => (
          <TouchableOpacity key={entry.id} style={styles.entryCard} activeOpacity={0.8}>
            <View style={styles.entryHeader}>
              <View style={[styles.entryIcon, { backgroundColor: `${getTypeColor(entry.type)}20` }]}>
                {getEntryIcon(entry.type)}
              </View>
              <View style={styles.entryHeaderContent}>
                <Text style={styles.entryTitle}>{entry.title}</Text>
                <Text style={styles.entryOrganization}>{entry.organization}</Text>
              </View>
              {entry.verified && (
                <View style={styles.verifiedBadge}>
                  <CheckCircle size={16} color="#22c55e" />
                </View>
              )}
            </View>
            <View style={styles.entryBody}>
              <Text style={styles.entryDescription} numberOfLines={2}>
                {entry.description}
              </Text>
            </View>
            <View style={styles.entryFooter}>
              <View style={styles.dateRange}>
                <Calendar size={12} color="#888" />
                <Text style={styles.dateText}>
                  {new Date(entry.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  {entry.endDate && ` - ${new Date(entry.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`}
                  {!entry.endDate && ' - Present'}
                </Text>
              </View>
              <View style={styles.typeTag}>
                <Text style={[styles.typeTagText, { color: getTypeColor(entry.type) }]}>
                  {entry.type.toUpperCase()}
                </Text>
              </View>
            </View>
            {entry.verifiedAt && (
              <View style={styles.verifiedInfo}>
                <CheckCircle size={12} color="#22c55e" />
                <Text style={styles.verifiedInfoText}>
                  Verified on {new Date(entry.verifiedAt).toLocaleDateString()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        {/* Add Entry Button */}
        <TouchableOpacity style={styles.addEntryButton} activeOpacity={0.8}>
          <View style={styles.addEntryIcon}>
            <Plus size={20} color="#6366f1" />
          </View>
          <Text style={styles.addEntryText}>Add New Entry</Text>
          <ChevronRight size={16} color="#666" />
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#888',
    fontSize: 14,
    marginTop: 4,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    marginHorizontal: 16,
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#333',
  },
  statValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1a1a2e',
    marginRight: 8,
  },
  filterTabActive: {
    backgroundColor: '#6366f1',
  },
  filterTabText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: '#fff',
  },
  entriesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  entryCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  entryHeaderContent: {
    flex: 1,
  },
  entryTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  entryOrganization: {
    color: '#888',
    fontSize: 13,
    marginTop: 2,
  },
  verifiedBadge: {
    marginLeft: 8,
  },
  entryBody: {
    marginTop: 12,
  },
  entryDescription: {
    color: '#aaa',
    fontSize: 14,
    lineHeight: 20,
  },
  entryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  dateRange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    color: '#888',
    fontSize: 12,
  },
  typeTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  typeTagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  verifiedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2d2d4a',
  },
  verifiedInfoText: {
    color: '#22c55e',
    fontSize: 12,
  },
  addEntryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2d2d4a',
    borderStyle: 'dashed',
    marginBottom: 12,
  },
  addEntryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addEntryText: {
    flex: 1,
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 32,
  },
});
