/**
 * Groups Screen
 */

import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { SearchInput } from '../../components/Input';
import { Card } from '../../components/Card';
import { api } from '../../services/api';

interface Group {
  _id: string;
  name: string;
  slug: string;
  description: string;
  type: string;
  city: string;
  memberCount: number;
  followersCount: number;
  isJoined?: boolean;
}

const GROUP_TYPES = ['All', 'Club', 'Chapter', 'Crew', 'Community', 'Brand'];

export default function GroupsScreen() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');

  const loadGroups = async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      const params: any = {};
      if (searchQuery) params.q = searchQuery;
      if (selectedType !== 'All') params.type = selectedType.toLowerCase();

      const data = await api.getGroups(params);
      setGroups(data);
    } catch (error) {
      console.error('Failed to load groups:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, [selectedType, searchQuery]);

  const onRefresh = useCallback(() => {
    loadGroups(true);
  }, [selectedType, searchQuery]);

  const handleJoin = async (groupId: string, isJoined: boolean) => {
    try {
      if (isJoined) {
        await api.leaveGroup(groupId);
      } else {
        await api.joinGroup(groupId);
      }
      // Refresh list
      loadGroups();
    } catch (error) {
      console.error('Failed to join/leave group:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'club': return '🏆';
      case 'chapter': return '📖';
      case 'crew': return '👥';
      case 'community': return '🌐';
      case 'brand': return '🏍️';
      default: return '👥';
    }
  };

  const renderGroup = ({ item }: { item: Group }) => (
    <Card
      style={styles.groupCard}
      onPress={() => router.push(`/community/group/${item._id}`)}
    >
      <View style={styles.groupHeader}>
        <View style={styles.groupAvatar}>
          <Text style={styles.groupAvatarText}>{getTypeIcon(item.type)}</Text>
        </View>
        <View style={styles.groupInfo}>
          <Text style={styles.groupName}>{item.name}</Text>
          <Text style={styles.groupMeta}>
            {item.type} • {item.city}
          </Text>
        </View>
      </View>

      <Text style={styles.groupDescription} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.groupStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.memberCount.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Members</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.followersCount.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.joinButton, item.isJoined && styles.joinedButton]}
        onPress={() => handleJoin(item._id, item.isJoined || false)}
      >
        <Text style={[styles.joinButtonText, item.isJoined && styles.joinedButtonText]}>
          {item.isJoined ? '✓ Joined' : '+ Join'}
        </Text>
      </TouchableOpacity>
    </Card>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Search */}
      <SearchInput
        placeholder="Search groups..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        onClear={() => setSearchQuery('')}
        style={styles.searchInput}
      />

      {/* Type Filter */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={GROUP_TYPES}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedType === item && styles.filterChipActive,
              ]}
              onPress={() => setSelectedType(item)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedType === item && styles.filterChipTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Create Group Button */}
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => router.push('/community/create-group')}
      >
        <Text style={styles.createButtonText}>+ Create Group</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>👥</Text>
      <Text style={styles.emptyTitle}>No groups found</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery ? 'Try a different search' : 'Create your first group!'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.screenHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Groups</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={groups}
        renderItem={renderGroup}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!loading ? renderEmpty : null}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#e94560"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16213e',
  },
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 48,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 20,
    color: '#fff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  header: {
    marginBottom: 16,
  },
  searchInput: {
    marginBottom: 16,
  },
  filterContainer: {
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#e94560',
  },
  filterChipText: {
    fontSize: 14,
    color: '#888',
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: '#0f3460',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  groupCard: {
    marginBottom: 12,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  groupAvatar: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#0f3460',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  groupAvatarText: {
    fontSize: 24,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  groupMeta: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  groupDescription: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 12,
    lineHeight: 20,
  },
  groupStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#2a2a4e',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  joinButton: {
    backgroundColor: '#e94560',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  joinedButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#e94560',
  },
  joinButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  joinedButtonText: {
    color: '#e94560',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
});