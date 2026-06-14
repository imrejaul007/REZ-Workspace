import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useRideStore, Location } from '../stores/ride.store';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

// Add stop to route
interface AddStopScreenProps {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<{ AddStop: { stopIndex?: number } }, 'AddStop'>;
}

export const AddStopScreen: React.FC<AddStopScreenProps> = ({ navigation, route }) => {
  const { stops, addStop, removeStop } = useRideStore();
  const [showAddModal, setShowAddModal] = useState(false);

  // Max 2 stops allowed
  const MAX_STOPS = 2;

  const handleAddStop = (location: Location) => {
    addStop(location);
    setShowAddModal(false);
    navigation.goBack();
  };

  const handleRemoveStop = (index: number) => {
    removeStop(index);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Add Stops</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Info */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={24} color="#6B4EFF" />
        <Text style={styles.infoText}>
          Add up to {MAX_STOPS} stops to your route. The final fare will be calculated based on the total distance.
        </Text>
      </View>

      {/* Current Stops */}
      <ScrollView style={styles.stopsList}>
        {/* Pickup */}
        <View style={styles.stopItem}>
          <View style={[styles.stopDot, styles.greenDot]} />
          <View style={styles.stopInfo}>
            <Text style={styles.stopLabel}>Pickup</Text>
            <Text style={styles.stopAddress}>MG Road, Bangalore</Text>
          </View>
          <TouchableOpacity style={styles.editButton}>
            <Ionicons name="pencil" size={20} color="#6B4EFF" />
          </TouchableOpacity>
        </View>

        {/* Intermediate Stops */}
        {stops.map((stop, index) => (
          <View key={index} style={styles.stopItem}>
            <View style={styles.stopNumber}>
              <Text style={styles.stopNumberText}>{index + 1}</Text>
            </View>
            <View style={styles.stopInfo}>
              <Text style={styles.stopLabel}>Stop {index + 1}</Text>
              <Text style={styles.stopAddress}>{stop.address || 'Location added'}</Text>
            </View>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemoveStop(index)}
            >
              <Ionicons name="trash" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        ))}

        {/* Drop */}
        <View style={styles.stopItem}>
          <View style={[styles.stopDot, styles.redDot]} />
          <View style={styles.stopInfo}>
            <Text style={styles.stopLabel}>Drop</Text>
            <Text style={styles.stopAddress}>Koramangala, Bangalore</Text>
          </View>
          <TouchableOpacity style={styles.editButton}>
            <Ionicons name="pencil" size={20} color="#6B4EFF" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Add Stop Button */}
      {stops.length < MAX_STOPS && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('LocationSearch', { mode: 'stop', stopIndex: stops.length })}
        >
          <Ionicons name="add-circle" size={24} color="#6B4EFF" />
          <Text style={styles.addButtonText}>Add Stop</Text>
        </TouchableOpacity>
      )}

      {/* Done Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  backButton: { padding: 8 },
  title: { fontSize: 18, fontWeight: '600', color: '#333' },
  placeholder: { width: 40 },
  infoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f3ff', margin: 16, padding: 16, borderRadius: 12 },
  infoText: { flex: 1, marginLeft: 12, fontSize: 14, color: '#6B4EFF', lineHeight: 20 },
  stopsList: { flex: 1 },
  stopItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  stopDot: { width: 12, height: 12, borderRadius: 6 },
  greenDot: { backgroundColor: '#22c55e' },
  redDot: { backgroundColor: '#ef4444' },
  stopNumber: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#6B4EFF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  stopNumberText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  stopInfo: { flex: 1 },
  stopLabel: { fontSize: 12, color: '#6b7280' },
  stopAddress: { fontSize: 16, color: '#333', marginTop: 2 },
  editButton: { padding: 8 },
  removeButton: { padding: 8 },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, marginHorizontal: 16, borderWidth: 2, borderColor: '#6B4EFF', borderRadius: 12, borderStyle: 'dashed' },
  addButtonText: { marginLeft: 8, fontSize: 16, fontWeight: '600', color: '#6B4EFF' },
  footer: { padding: 16 },
  doneButton: { backgroundColor: '#6B4EFF', padding: 16, borderRadius: 12, alignItems: 'center' },
  doneButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default AddStopScreen;
