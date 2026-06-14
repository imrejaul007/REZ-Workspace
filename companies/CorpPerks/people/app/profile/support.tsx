// ==========================================
// MyTalent - Support Center Screen
// ==========================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../src/components/Badge';
import { Card, Button } from '../../src/components';

const categories = [
  { id: 'hr', title: 'HR', icon: '👥', description: 'Leave, policies, benefits' },
  { id: 'payroll', title: 'Payroll', icon: '💰', description: 'Salary, deductions, tax' },
  { id: 'it', title: 'IT', icon: '💻', description: 'Laptop, software, access' },
  { id: 'attendance', title: 'Attendance', icon: '📍', description: 'Check-in, WFH, leave' },
];

const faqs = [
  { q: 'How do I apply for leave?', a: 'Go to Work > Leave Management and tap Apply for Leave.' },
  { q: 'When is salary credited?', a: 'Salary is credited on the 1st of every month.' },
  { q: 'How to update my profile?', a: 'Go to Profile > Settings to update your information.' },
];

export default function SupportScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (!selectedCategory || !subject || !description) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    Alert.alert('Success', 'Ticket submitted successfully!');
    setSelectedCategory(null);
    setSubject('');
    setDescription('');
  };

  return (
    <ScrollView style={styles.container}>
      {/* Categories */}
      <Text style={styles.sectionTitle}>Categories</Text>
      <View style={styles.categoriesGrid}>
        {categories.map(cat => (
          <TouchableOpacity key={cat.id} style={[styles.categoryCard, selectedCategory === cat.id && styles.categoryCardActive]} onPress={() => setSelectedCategory(cat.id)}>
            <Text style={styles.categoryIcon}>{cat.icon}</Text>
            <Text style={[styles.categoryTitle, selectedCategory === cat.id && styles.categoryTitleActive]}>{cat.title}</Text>
            <Text style={styles.categoryDesc}>{cat.description}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Raise Ticket */}
      <Text style={styles.sectionTitle}>Raise a Ticket</Text>
      <Card style={styles.ticketCard}>
        <Text style={styles.inputLabel}>Subject</Text>
        <TextInput style={styles.textInput} placeholder="Enter subject" placeholderTextColor={Colors.textMuted} value={subject} onChangeText={setSubject} />

        <Text style={styles.inputLabel}>Description</Text>
        <TextInput style={[styles.textInput, styles.textArea]} placeholder="Describe your issue..." placeholderTextColor={Colors.textMuted} value={description} onChangeText={setDescription} multiline />
        <Button title="Submit Ticket" variant="primary" fullWidth onPress={handleSubmit} />
      </Card>

      {/* FAQs */}
      <Text style={styles.sectionTitle}>FAQs</Text>
      {faqs.map((faq, i) => (
        <Card key={i} style={styles.faqCard}>
          <Text style={styles.faqQ}>{faq.q}</Text>
          <Text style={styles.faqA}>{faq.a}</Text>
        </Card>
      ))}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.textPrimary, marginHorizontal: Spacing.md, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.md, gap: Spacing.sm },
  categoryCard: { width: '48%', backgroundColor: Colors.card, padding: Spacing.md, borderRadius: BorderRadius.lg, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  categoryCardActive: { borderColor: Colors.primary },
  categoryIcon: { fontSize: 28 },
  categoryTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary, marginTop: Spacing.xs },
  categoryTitleActive: { color: Colors.primary },
  categoryDesc: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 4, textAlign: 'center' },
  ticketCard: { marginHorizontal: Spacing.md },
  inputLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary, marginBottom: Spacing.xs },
  textInput: { backgroundColor: Colors.backgroundDark, borderRadius: BorderRadius.lg, padding: Spacing.md, fontSize: FontSize.md, color: Colors.textPrimary, marginBottom: Spacing.md },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  faqCard: { marginHorizontal: Spacing.md, marginBottom: Spacing.sm' },
  faqQ: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  faqA: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: Spacing.xs, lineHeight: 22 },
  bottomSpacer: { height: Spacing.xxl },
});
