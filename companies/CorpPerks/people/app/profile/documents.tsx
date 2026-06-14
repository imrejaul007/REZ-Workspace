// ==========================================
// MyTalent - Documents Screen
// ==========================================

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../src/components/Badge';
import { Card, Button } from '../../src/components';

const documents = [
  { id: '1', title: 'Offer Letter', type: 'Offer', date: 'Jan 15, 2024', icon: '📄' },
  { id: '2', title: 'Appointment Letter', type: 'Appointment', date: 'Jan 15, 2024', icon: '📄' },
  { id: '3', title: 'Payslip - May 2026', type: 'Payslip', date: 'May 30, 2026', icon: '💰' },
  { id: '4', title: 'Payslip - April 2026', type: 'Payslip', date: 'Apr 30, 2026', icon: '💰' },
  { id: '5', title: 'Increment Letter', type: 'Certificate', date: 'Apr 1, 2025', icon: '📈' },
  { id: '6', title: 'Experience Certificate', type: 'Certificate', date: 'Jan 15, 2024', icon: '🏆' },
  { id: '7', title: 'Relieving Letter', type: 'Certificate', date: 'N/A', icon: '📋' },
  { id: '8', title: 'Form 16 - 2025-26', type: 'Tax', date: 'May 30, 2026', icon: '📊' },
];

export default function DocumentsScreen() {
  const handleDownload = (doc: any) => {
    Alert.alert('Download', `Downloading ${doc.title}...`, [{ text: 'OK' }]);
  };

  const handleView = (doc: any) => {
    Alert.alert('View', `Opening ${doc.title}...`, [{ text: 'OK' }]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.documentsList}>
        {documents.map((doc) => (
          <Card key={doc.id} style={styles.docCard}>
            <View style={styles.docRow}>
              <Text style={styles.docIcon}>{doc.icon}</Text>
              <View style={styles.docInfo}>
                <Text style={styles.docTitle}>{doc.title}</Text>
                <Text style={styles.docMeta}>{doc.type} • {doc.date}</Text>
              </View>
              <View style={styles.docActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleView(doc)}>
                  <Text style={styles.actionIcon}>👁️</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleDownload(doc)}>
                  <Text style={styles.actionIcon}>⬇️</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        ))}
      </View>

      <Card style={styles.uploadCard}>
        <Text style={styles.uploadIcon}>📤</Text>
        <Text style={styles.uploadTitle}>Upload Documents</Text>
        <Text style={styles.uploadDesc}>Upload additional documents to your vault</Text>
        <Button title="Upload" variant="outline" onPress={() => Alert.alert('Coming Soon', 'Document upload will be available soon!')} />
      </Card>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  documentsList: { padding: Spacing.md },
  docCard: { marginBottom: Spacing.sm },
  docRow: { flexDirection: 'row', alignItems: 'center' },
  docIcon: { fontSize: 32, marginRight: Spacing.md },
  docInfo: { flex: 1 },
  docTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  docMeta: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
  docActions: { flexDirection: 'row', gap: Spacing.sm },
  actionBtn: { padding: Spacing.sm },
  actionIcon: { fontSize: 18 },
  uploadCard: { margin: Spacing.md, alignItems: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: Colors.border },
  uploadIcon: { fontSize: 40 },
  uploadTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.textPrimary, marginTop: Spacing.sm },
  uploadDesc: { fontSize: FontSize.sm, color: Colors.textMuted, marginVertical: Spacing.sm, textAlign: 'center' },
  bottomSpacer: { height: Spacing.xxl },
});
