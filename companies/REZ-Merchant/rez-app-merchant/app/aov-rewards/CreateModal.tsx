/**
 * CreateModal — bottom-sheet form for creating a new AOV reward tier.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';

export type RewardType = 'coins' | 'discount' | 'cashback';

export interface DraftRow {
  spendRupees: string;
  rewardType: RewardType;
  rewardValue: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string, rows: DraftRow[]) => void;
  isSaving: boolean;
}

const REWARD_TYPES: RewardType[] = ['coins', 'discount', 'cashback'];
const DEFAULT_ROW: DraftRow = { spendRupees: '', rewardType: 'coins', rewardValue: '' };

function placeholder(type: RewardType) {
  if (type === 'coins') return 'e.g. 100';
  if (type === 'discount') return 'e.g. 10 (%)';
  return 'e.g. 5 (%)';
}

export default function CreateModal({ visible, onClose, onSave, isSaving }: Props) {
  const [name, setName] = useState('');
  const [rows, setRows] = useState<DraftRow[]>([{ ...DEFAULT_ROW }]);

  const reset = useCallback(() => {
    setName('');
    setRows([{ ...DEFAULT_ROW }]);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const updateRow = useCallback(<K extends keyof DraftRow>(i: number, k: K, v: DraftRow[K]) => {
    setRows((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [k]: v };
      return next;
    });
  }, []);

  const cycleType = useCallback(
    (i: number, cur: RewardType) => {
      updateRow(i, 'rewardType', REWARD_TYPES[(REWARD_TYPES.indexOf(cur) + 1) % 3]);
    },
    [updateRow]
  );

  const handleSave = useCallback(() => {
    if (!name.trim()) {
      Alert.alert('Missing name', 'Enter a tier name.');
      return;
    }
    if (rows.some((r) => !r.spendRupees.trim() || !r.rewardValue.trim())) {
      Alert.alert('Incomplete rows', 'Fill spend amount and reward value for each row.');
      return;
    }
    onSave(name.trim(), rows);
    reset();
  }, [name, rows, onSave, reset]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={s.overlay}
      >
        <View style={s.sheet}>
          <View style={s.handle} />
          <View style={s.header}>
            <ThemedText style={s.title}>New Spend Reward</ThemedText>
            <TouchableOpacity onPress={handleClose} accessibilityLabel="Close">
              <Ionicons name="close" size={24} color={Colors.light.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <ThemedText style={s.label}>Reward Name</ThemedText>
            <TextInput
              style={s.input}
              placeholder="e.g. Weekend Bonus"
              placeholderTextColor={Colors.light.textMuted}
              value={name}
              onChangeText={setName}
            />

            <ThemedText style={[s.label, { marginTop: 18 }]}>Tier Rows</ThemedText>

            {rows.map((row, i) => (
              <View key={i} style={s.draftRow}>
                <View style={s.draftTop}>
                  <ThemedText style={s.draftIdx}>Tier {i + 1}</ThemedText>
                  {rows.length > 1 && (
                    <TouchableOpacity onPress={() => setRows((p) => p.filter((_, j) => j !== i))}>
                      <Ionicons name="close-circle-outline" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>
                <View style={s.fields}>
                  <View style={s.half}>
                    <ThemedText style={s.fieldLabel}>Spend (₹)</ThemedText>
                    <TextInput
                      style={s.input}
                      placeholder="e.g. 300"
                      placeholderTextColor={Colors.light.textMuted}
                      keyboardType="numeric"
                      value={row.spendRupees}
                      onChangeText={(v) => updateRow(i, 'spendRupees', v)}
                    />
                  </View>
                  <View style={s.half}>
                    <ThemedText style={s.fieldLabel}>Value</ThemedText>
                    <TextInput
                      style={s.input}
                      placeholder={placeholder(row.rewardType)}
                      placeholderTextColor={Colors.light.textMuted}
                      keyboardType="numeric"
                      value={row.rewardValue}
                      onChangeText={(v) => updateRow(i, 'rewardValue', v)}
                    />
                  </View>
                </View>
                <TouchableOpacity style={s.pill} onPress={() => cycleType(i, row.rewardType)}>
                  <Ionicons
                    name={
                      row.rewardType === 'coins'
                        ? 'star-outline'
                        : row.rewardType === 'discount'
                          ? 'pricetag-outline'
                          : 'cash-outline'
                    }
                    size={13}
                    color="#7c3aed"
                  />
                  <ThemedText style={s.pillText}>
                    {row.rewardType.charAt(0).toUpperCase() + row.rewardType.slice(1)} — tap to
                    change
                  </ThemedText>
                </TouchableOpacity>
              </View>
            ))}

            {rows.length < 3 && (
              <TouchableOpacity
                style={s.addRow}
                onPress={() => setRows((p) => [...p, { ...DEFAULT_ROW }])}
              >
                <Ionicons name="add-circle-outline" size={18} color="#7c3aed" />
                <ThemedText style={s.addRowText}>Add Tier Row</ThemedText>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[s.saveBtn, isSaving && s.saveBtnOff]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={s.saveBtnText}>Save Reward Tier</ThemedText>
              )}
            </TouchableOpacity>

            <View style={{ height: 32 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#d1d5db',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  title: { fontSize: 18, fontWeight: '800', color: Colors.light.text },
  label: { fontSize: 13, fontWeight: '600', color: Colors.light.textSecondary, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.light.text,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  draftRow: {
    backgroundColor: '#f9f5ff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ede9fe',
  },
  draftTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  draftIdx: { fontSize: 13, fontWeight: '700', color: '#7c3aed' },
  fields: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  half: { flex: 1 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ede9fe',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  pillText: { fontSize: 12, color: '#7c3aed', fontWeight: '600' },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    marginBottom: 10,
  },
  addRowText: { color: '#7c3aed', fontSize: 14, fontWeight: '600' },
  saveBtn: {
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnOff: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
