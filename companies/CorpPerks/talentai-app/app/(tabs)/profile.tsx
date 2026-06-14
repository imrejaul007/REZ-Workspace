/**
 * TalentAI - Profile Screen
 * User profile and career stats
 */

import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Avatar, Card, Text, List, Divider, Button } from 'react-native-paper';

export default function ProfileScreen({ navigation }: any) {
  const stats = [
    { label: 'Profile Views', value: '1,234' },
    { label: 'Applications', value: '45' },
    { label: 'Interviews', value: '12' },
    { label: 'Offers', value: '3' },
  ];

  const skills = [
    'Product Management',
    'Agile/Scrum',
    'Data Analysis',
    'User Research',
    'Roadmapping',
    'Stakeholder Management',
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <Avatar.Image
          size={100}
          source={{ uri: 'https://i.pravatar.cc/200' }}
          style={styles.avatar}
        />
        <Text variant="headlineSmall" style={styles.name}>Sarah Johnson</Text>
        <Text variant="bodyMedium" style={styles.title}>Senior Product Manager</Text>
        <Text variant="bodySmall" style={styles.location}>📍 Bangalore, India</Text>

        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statItem}>
              <Text variant="headlineSmall" style={styles.statValue}>{stat.value}</Text>
              <Text variant="bodySmall" style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <Button
          mode="outlined"
          style={styles.editButton}
          onPress={() => navigation.navigate('Resume')}
        >
          Edit Profile
        </Button>
      </View>

      {/* Skills */}
      <Card style={styles.card}>
        <Card.Title title="Top Skills" />
        <Card.Content>
          <View style={styles.skillsContainer}>
            {skills.map((skill, index) => (
              <View key={index} style={styles.skillBadge}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            ))}
          </View>
        </Card.Content>
      </Card>

      {/* Career Progress */}
      <Card style={styles.card}>
        <Card.Title title="Career Progress" />
        <Card.Content>
          <List.Item
            title="Match Score"
            description="87% for Senior PM roles"
            left={(props) => <List.Icon {...props} icon="target" />}
          />
          <Divider />
          <List.Item
            title="Skills Gap"
            description="3 skills to learn"
            left={(props) => <List.Icon {...props} icon="chart-line" />}
          />
          <Divider />
          <List.Item
            title="Market Value"
            description="+12% this quarter"
            left={(props) => <List.Icon {...props} icon="trending-up" />}
          />
        </Card.Content>
      </Card>

      {/* Quick Actions */}
      <Card style={styles.card}>
        <Card.Title title="Quick Actions" />
        <Card.Content>
          <List.Item
            title="View Resume"
            left={(props) => <List.Icon {...props} icon="file-document" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('Resume')}
          />
          <Divider />
          <List.Item
            title="AI Interview Prep"
            left={(props) => <List.Icon {...props} icon="chat-processing" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('Interview')}
          />
          <Divider />
          <List.Item
            title="Learning Courses"
            left={(props) => <List.Icon {...props} icon="school" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('Courses')}
          />
        </Card.Content>
      </Card>

      {/* Settings */}
      <Card style={styles.card}>
        <Card.Content>
          <List.Item
            title="Settings"
            left={(props) => <List.Icon {...props} icon="cog" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
          <Divider />
          <List.Item
            title="Help & Support"
            left={(props) => <List.Icon {...props} icon="help-circle" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
          <Divider />
          <List.Item
            title="Logout"
            titleStyle={{ color: '#ef4444' }}
            left={(props) => <List.Icon {...props} icon="logout" color="#ef4444" />}
          />
        </Card.Content>
      </Card>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#6366f1',
  },
  avatar: {
    marginBottom: 16,
  },
  name: {
    color: '#fff',
    fontWeight: 'bold',
  },
  title: {
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  location: {
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
    paddingHorizontal: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: '#fff',
    fontWeight: 'bold',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
  },
  editButton: {
    marginTop: 16,
    borderColor: '#fff',
  },
  card: {
    margin: 16,
    marginBottom: 0,
    backgroundColor: '#fff',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillBadge: {
    backgroundColor: '#ede9fe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  skillText: {
    color: '#6366f1',
    fontSize: 13,
  },
});