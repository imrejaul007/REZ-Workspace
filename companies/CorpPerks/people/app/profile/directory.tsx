// ==========================================
// MyTalent - People Directory Screen
// ==========================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../src/components/Badge';
import { Card } from '../../src/components';

const employees = [
  { id: '1', name: 'Priya Patel', designation: 'Engineering Manager', department: 'Engineering', email: 'priya@corpperks.com', phone: '+91 98765 43211', avatar: 'PP' },
  { id: '2', name: 'Amit Kumar', designation: 'Senior Engineer', department: 'Engineering', email: 'amit@corpperks.com', phone: '+91 98765 43212', avatar: 'AK' },
  { id: '3', name: 'Sneha Gupta', designation: 'Product Manager', department: 'Product', email: 'sneha@corpperks.com', phone: '+91 98765 43213', avatar: 'SG' },
  { id: '4', name: 'Raj Verma', designation: 'Tech Lead', department: 'Engineering', email: 'raj@corpperks.com', phone: '+91 98765 43214', avatar: 'RV' },
  { id: '5', name: 'Anita Sharma', designation: 'HR Manager', department: 'HR', email: 'anita@corpperks.com', phone: '+91 98765 43215', avatar: 'AS' },
];

export default function DirectoryScreen() {
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');

  const departments = ['All', ...new Set(employees.map(e => e.department))];

  const filteredEmployees = employees.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase()) || e.designation.toLowerCase().includes(search.toLowerCase());
    const matchesDept = selectedDept === 'All' || e.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  const handleCall = (emp: any) => Alert.alert('Call', `Calling ${emp.name}...`, [{ text: 'OK' }]);
  const handleEmail = (emp: any) => Alert.alert('Email', `Emailing ${emp.name}...`, [{ text: 'OK' }]);

  return (
    <View style={styles.container}>
      <View style={styles.searchSection}>
        <TextInput style={styles.searchInput} placeholder="Search employees..." placeholderTextColor={Colors.textMuted} value={search} onChangeText={setSearch} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.deptScroll}>
          {departments.map(dept => (
            <TouchableOpacity key={dept} style={[styles.deptChip, selectedDept === dept && styles.deptChipActive]} onPress={() => setSelectedDept(dept)}>
              <Text style={[styles.deptText, selectedDept === dept && styles.deptTextActive]}>{dept}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.employeeList}>
        {filteredEmployees.map(emp => (
          <Card key={emp.id} style={styles.empCard}>
            <View style={styles.empRow}>
              <View style={styles.empAvatar}>
                <Text style={styles.empAvatarText}>{emp.avatar}</Text>
              </View>
              <View style={styles.empInfo}>
                <Text style={styles.empName}>{emp.name}</Text>
                <Text style={styles.empDesignation}>{emp.designation}</Text>
                <Text style={styles.empDept}>{emp.department}</Text>
              </View>
              <View style={styles.empActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleCall(emp)}>
                  <Text style={styles.actionIcon}>📞</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleEmail(emp)}>
                  <Text style={styles.actionIcon}>✉️</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  searchSection: { padding: Spacing.md, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  searchInput: { backgroundColor: Colors.backgroundDark, borderRadius: BorderRadius.lg, padding: Spacing.md, fontSize: FontSize.md, color: Colors.textPrimary },
  deptScroll: { marginTop: Spacing.sm },
  deptChip: { backgroundColor: Colors.backgroundDark, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, marginRight: Spacing.sm },
  deptChipActive: { backgroundColor: Colors.primary },
  deptText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  deptTextActive: { color: Colors.textInverse, fontWeight: FontWeight.semibold },
  employeeList: { flex: 1, padding: Spacing.md },
  empCard: { marginBottom: Spacing.sm },
  empRow: { flexDirection: 'row', alignItems: 'center' },
  empAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  empAvatarText: { color: Colors.textInverse, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  empInfo: { flex: 1, marginLeft: Spacing.md },
  empName: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  empDesignation: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  empDept: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  empActions: { flexDirection: 'row', gap: Spacing.sm },
  actionBtn: { padding: Spacing.sm },
  actionIcon: { fontSize: 20 },
});
