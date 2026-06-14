/**
 * TalentAI - Explore Screen
 * Job search and opportunity discovery
 */

import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Searchbar, Card, Text, Chip, SegmentedButtons } from 'react-native-paper';

export default function ExploreScreen({ navigation }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'jobs', label: 'Jobs' },
    { id: 'courses', label: 'Courses' },
    { id: 'mentors', label: 'Mentors' },
    { id: 'companies', label: 'Companies' },
  ];

  const jobs = [
    {
      id: 1,
      title: 'Senior Product Manager',
      company: 'Google',
      location: 'Bangalore, India',
      salary: '₹45-60 LPA',
      type: 'Full-time',
      match: 92,
      skills: ['Product Strategy', 'Agile', 'Data Analysis'],
    },
    {
      id: 2,
      title: 'Product Lead',
      company: 'Amazon',
      location: 'Remote',
      salary: '₹50-70 LPA',
      type: 'Full-time',
      match: 88,
      skills: ['Leadership', 'Strategy', 'Tech'],
    },
    {
      id: 3,
      title: 'VP of Product',
      company: 'Flipkart',
      location: 'Bangalore, India',
      salary: '₹80-120 LPA',
      type: 'Full-time',
      match: 75,
      skills: ['Executive', 'P&L', 'Vision'],
    },
  ];

  const renderJobCard = ({ item }: any) => (
    <TouchableOpacity onPress={() => navigation.navigate('Jobs')}>
      <Card style={styles.jobCard}>
        <Card.Content>
          <View style={styles.jobHeader}>
            <View style={styles.jobInfo}>
              <Text variant="titleMedium">{item.title}</Text>
              <Text variant="bodyMedium" style={styles.company}>{item.company}</Text>
            </View>
            <Chip
              style={[styles.matchChip, { backgroundColor: item.match >= 90 ? '#dcfce7' : '#fef3c7' }]}
              textStyle={{ color: item.match >= 90 ? '#16a34a' : '#d97706' }}
            >
              {item.match}% Match
            </Chip>
          </View>

          <View style={styles.jobMeta}>
            <Text variant="bodySmall">📍 {item.location}</Text>
            <Text variant="bodySmall">💰 {item.salary}</Text>
            <Text variant="bodySmall">⏰ {item.type}</Text>
          </View>

          <View style={styles.skillsContainer}>
            {item.skills.map((skill: string, index: number) => (
              <Chip key={index} style={styles.skillChip} compact>
                {skill}
              </Chip>
            ))}
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.header}>
        <Searchbar
          placeholder="Search jobs, skills, companies..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      {/* Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            onPress={() => setFilter(cat.id)}
          >
            <Chip
              selected={filter === cat.id}
              style={[styles.categoryChip, filter === cat.id && styles.categoryChipActive]}
              textStyle={{ color: filter === cat.id ? '#fff' : '#64748b' }}
            >
              {cat.label}
            </Chip>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results */}
      <FlatList
        data={jobs}
        renderItem={renderJobCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  searchBar: {
    backgroundColor: '#f1f5f9',
    elevation: 0,
  },
  categories: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  categoryChip: {
    marginRight: 8,
    backgroundColor: '#f1f5f9',
  },
  categoryChipActive: {
    backgroundColor: '#6366f1',
  },
  list: {
    padding: 16,
  },
  jobCard: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  jobInfo: {
    flex: 1,
  },
  company: {
    color: '#64748b',
    marginTop: 4,
  },
  matchChip: {
    backgroundColor: '#dcfce7',
  },
  jobMeta: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  skillChip: {
    backgroundColor: '#ede9fe',
  },
});