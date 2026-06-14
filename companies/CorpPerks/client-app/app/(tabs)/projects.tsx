// ==========================================
// CorpPerks Client App - Projects List Screen
// ==========================================

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Card, Badge, ProgressBar, EmptyState } from '../../src/components';
import { api } from '../../src/services/api';
import { useStore } from '../../src/store';
import {
  Colors,
  Spacing,
  FontSize,
  BorderRadius,
  formatCurrency,
  formatDate,
  getProjectStatusColor,
} from '../../src/utils/theme';
import { Project } from '../../src/types';

export default function ProjectsListScreen() {
  const navigation = useNavigation<any>();
  const { setProjects } = useStore();
  const [projects, setProjectsData] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'completed', label: 'Completed' },
  ];

  const loadProjects = async () => {
    try {
      const response = await api.getProjects();
      if (response.success && response.data) {
        setProjectsData(response.data);
        setFilteredProjects(response.data);
        setProjects(response.data);
      }
    } catch (error) {
      logger.error('Error loading projects:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedFilter === 'all') {
      setFilteredProjects(projects);
    } else {
      setFilteredProjects(projects.filter((p) => p.status === selectedFilter));
    }
  }, [selectedFilter, projects]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProjects();
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'priority_high';
      case 'high': return 'arrow_upward';
      case 'medium': return 'remove';
      case 'low': return 'arrow_downward';
      default: return 'remove';
    }
  };

  const renderProjectCard = ({ item }: { item: Project }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('Projects', { screen: 'ProjectDetail', params: { projectId: item.id } })}
      activeOpacity={0.7}
    >
      <Card style={styles.projectCard}>
        <View style={styles.projectHeader}>
          <View style={styles.projectInfo}>
            <Text style={styles.projectName}>{item.name}</Text>
            <Text style={styles.projectClient}>{item.clientName}</Text>
          </View>
          <View style={styles.projectBadges}>
            <Badge
              label={item.status.replace('_', ' ')}
              variant="status"
              size="sm"
            />
          </View>
        </View>

        <Text style={styles.projectDescription} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.projectProgress}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progress</Text>
            <Text style={styles.progressValue}>{item.progress}%</Text>
          </View>
          <ProgressBar
            progress={item.progress}
            color={getProjectStatusColor(item.status)}
            height={6}
          />
        </View>

        <View style={styles.projectMeta}>
          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>{getPriorityIcon(item.priority)}</Text>
            <Text style={styles.metaText}>{item.priority}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>schedule</Text>
            <Text style={styles.metaText}>Due {formatDate(item.endDate, 'short')}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>attach_money</Text>
            <Text style={styles.metaText}>{formatCurrency(item.budget)}</Text>
          </View>
        </View>

        <View style={styles.projectFooter}>
          <View style={styles.teamAvatars}>
            {item.teamMembers.slice(0, 3).map((member, index) => (
              <View key={member.id} style={[styles.avatar, { marginLeft: index > 0 ? -10 : 0 }]}>
                <Text style={styles.avatarText}>
                  {member.name.split(' ').map(n => n[0]).join('')}
                </Text>
              </View>
            ))}
            {item.teamMembers.length > 3 && (
              <View style={[styles.avatar, styles.avatarMore, { marginLeft: -10 }]}>
                <Text style={styles.avatarMoreText}>+{item.teamMembers.length - 3}</Text>
              </View>
            )}
          </View>
          <Text style={styles.lastUpdated}>
            Updated {formatDate(item.lastUpdated, 'relative')}
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={filters}
          keyExtractor={(item) => item.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterTab,
                selectedFilter === item.key && styles.filterTabActive,
              ]}
              onPress={() => setSelectedFilter(item.key)}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === item.key && styles.filterTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Projects List */}
      <FlatList
        data={filteredProjects}
        keyExtractor={(item) => item.id}
        renderItem={renderProjectCard}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="folder_open"
            title="No Projects Found"
            description={
              selectedFilter === 'all'
                ? 'You don\'t have any projects yet.'
                : `No ${selectedFilter.replace('_', ' ')} projects.`
            }
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  filterContainer: {
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterList: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  filterTab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: Colors.textInverse,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  projectCard: {
    marginBottom: Spacing.md,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  projectInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  projectName: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  projectClient: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  projectBadges: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  projectDescription: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  projectProgress: {
    marginBottom: Spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  progressLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  progressValue: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  projectMeta: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.lg,
  },
  metaIcon: {
    fontSize: 14,
    color: Colors.textMuted,
    marginRight: 4,
  },
  metaText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
  projectFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  teamAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.card,
  },
  avatarText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textInverse,
  },
  avatarMore: {
    backgroundColor: Colors.textMuted,
  },
  avatarMoreText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textInverse,
  },
  lastUpdated: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
});
