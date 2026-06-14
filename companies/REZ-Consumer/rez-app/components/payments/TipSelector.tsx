import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

const TIP_PRESETS = [0, 20, 50, 100, 200];

interface TipSelectorProps {
  onTipSelected: (amount: number) => void;
  billAmount: number;
}

export default function TipSelector({ onTipSelected, billAmount }: TipSelectorProps) {
  const { colors } = useTheme();
  const [selected, setSelected] = useState<number | null>(null);
  const [custom, setCustom] = useState('');

  const handleSelect = (amount: number) => {
    setSelected(amount);
    setCustom('');
    onTipSelected(amount);
  };

  const handleCustom = (val: string) => {
    setCustom(val);
    setSelected(null);
    onTipSelected(Number(val) || 0);
  };

  const s = StyleSheet.create({
    container: { padding: 16 },
    title: { fontSize: 16, fontWeight: '700', color: colors.text.primary, marginBottom: 12 },
    row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5, borderColor: colors.border.default, backgroundColor: colors.background.secondary },
    chipActive: { borderColor: colors.primary[500], backgroundColor: '#FFF9E6' },
    chipText: { fontSize: 14, fontWeight: '600', color: colors.text.secondary },
    chipTextActive: { color: colors.primary[700] },
    customInput: { marginTop: 10, borderWidth: 1.5, borderColor: colors.border.default, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16, color: colors.text.primary },
  });

  return (
    <View style={s.container}>
      <Text style={s.title}>Add a tip? 🙏</Text>
      <View style={s.row}>
        {TIP_PRESETS.map(amount => (
          <TouchableOpacity key={amount} style={[s.chip, selected === amount && s.chipActive]} onPress={() => handleSelect(amount)}>
            <Text style={[s.chipText, selected === amount && s.chipTextActive]}>
              {amount === 0 ? 'No tip' : `₹${amount}`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput
        style={s.customInput}
        placeholder="Custom amount"
        placeholderTextColor={colors.text.tertiary}
        keyboardType="numeric"
        value={custom}
        onChangeText={handleCustom}
      />
    </View>
  );
}
