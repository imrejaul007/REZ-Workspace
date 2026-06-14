/**
 * Events Screen
 */

import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { SearchInput } from '../../components/Input';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { api } from '../../services/api';

interface Event {
  _id: string;
  title: string;
  description: string;
  type: string;
  startTime: string;
  endTime?: string;
  startLocation: { name: string; address?: string };
  maxParticipants: number;
  currentParticipants: number;
  fees?: { amount: number; includes: string[] };
  organizer?: { displayName: string; avatar?: string };
  isRsvped?: boolean;
}

const EVENT_TYPES = [
  { id: 'all', label: 'All', icon: '🎉' },
  { id: 'ride', label: 'Rides', icon: '🏍️' },
  { id: 'meet', label: 'Meets', icon: '☕' },
  { id: 'rally', label: 'Rallies', icon: '🏁' },
  { id: 'track_day', label: 'Track', icon: '🏁' },
  { id: 'workshop', label: 'Workshops', icon: '🔧' },
];

export default function EventsScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadEvents = async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      const params: any = {};
      if (selectedType !== 'all') params.type = selectedType;

      const data = await api.getEvents(params);
      setEvents(data);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [selectedType]);

  const onRefresh = useCallback(() => {
    loadEvents(true);
  }, [selectedType]);

  const handleRSVP = async (eventId: string, isRsvped: boolean) => {
    try {
      if (isRsvped) {
        await api.rsvpEvent(eventId, 'going');
      }
      loadEvents();
    } catch (error) {
      console.error('Failed to RSVP:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeIcon = (type: string) => {
    const eventType = EVENT_TYPES.find(t => t.id === type);
    return eventType?.icon || '🎉';
  };

  const getSpotsLeft = (event: Event) => {
    return event.maxParticipants - event.currentParticipants;
  };

  const renderEvent = ({ item }: { item: Event }) => {
    const spotsLeft = getSpotsLeft(item);
    const isFull = spotsLeft <= 0;

    return (
      <Card style={styles.eventCard}>
        <View style={styles.eventHeader}>
          <View style={styles.eventIcon}>
            <Text style={styles.eventIconText}>{getTypeIcon(item.type)}</Text>
          </View>
          <View style={styles.eventInfo}>
            <Text style={styles.eventTitle}>{item.title}</Text>
            <View style={styles.eventMeta}>
              <Text style={styles.eventDate}>
                📅 {formatDate(item.startTime)} • {formatTime(item.startTime)}
              </Text>
              <Text style={styles.eventLocation}>
                📍 {item.startLocation.name}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.eventDescription} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.eventStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{item.currentParticipants}</Text>
            <Text style={styles.statLabel}>Joined</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, isFull && styles.fullText]}>
              {spotsLeft}
            </Text>
            <Text style={styles.statLabel}>Spots Left</Text>
          </View>
          {item.fees && item.fees.amount > 0 && (
            <>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>₹{item.fees.amount}</Text>
                <Text style={styles.statLabel}>Entry</Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.eventActions}>
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() => router.push(`/community/event/${item._id}`)}
          >
            <Text style={styles.detailsButtonText}>View Details</Text>
          </TouchableOpacity>

          {item.isRsvped ? (
            <View style={styles.rsvpedBadge}>
              <Text style={styles.rsvpedText}>✓ Going</Text>
            </View>
          ) : (
            <Button
              title={isFull ? 'Full' : 'RSVP'}
              onPress={() => handleRSVP(item._id, item.isRsvped || false)}
              disabled={isFull}
              size="small"
            />
          )}
        </View>
      </Card>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Search */}
      <SearchInput
        placeholder="Search events..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        onClear={() => setSearchQuery('')}
        style={styles.searchInput}
      />

      {/* Type Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
      >
        {EVENT_TYPES.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.filterChip,
              selectedType === type.id && styles.filterChipActive,
            ]}
            onPress={() => setSelectedType(type.id)}
          >
            <Text style={styles.filterIcon}>{type.icon}</Text>
            <Text
              style={[
                styles.filterText,
                selectedType === type.id && styles.filterTextActive,
              ]}
            >
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Create Event Button */}
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => router.push('/community/create-event')}
      >
        <Text style={styles.createButtonText}>+ Create Event</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📅</Text>
      <Text style={styles.emptyTitle}>No events found</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery ? 'Try a different search' : 'Create an event for the community!'}
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
        <Text style={styles.headerTitle}>Events</Text>
        <TouchableOpacity
          style={styles.filterIconButton}
          onPress={() => router.push('/community/create-event')}
        >
          <Text style={styles.filterIconText}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={events}
        renderItem={renderEvent}
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
  filterIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e94560',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterIconText: {
    fontSize: 24,
    color: '#fff',
  },
  header: {
    marginBottom: 16,
  },
  searchInput: {
    marginBottom: 16,
  },
  filterContainer: {
    paddingRight: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1a1a2e',
    borderRadius: 24,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: '#e94560',
  },
  filterIcon: {
    fontSize: 16,
  },
  filterText: {
    fontSize: 14,
    color: '#888',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  createButton: {
    marginTop: 16,
    backgroundColor: '#0f3460',
    padding: 14,
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
  eventCard: {
    marginBottom: 12,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  eventIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#0f3460',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eventIconText: {
    fontSize: 24,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  eventMeta: {
    gap: 4,
  },
  eventDate: {
    fontSize: 13,
    color: '#e94560',
  },
  eventLocation: {
    fontSize: 13,
    color: '#888',
  },
  eventDescription: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
    marginBottom: 12,
  },
  eventStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#2a2a4e',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#2a2a4e',
  },
  fullText: {
    color: '#ef4444',
  },
  eventActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailsButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
  },
  detailsButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  rsvpedBadge: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#4ade80',
  },
  rsvpedText: {
    color: '#fff',
    fontWeight: 'bold',
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