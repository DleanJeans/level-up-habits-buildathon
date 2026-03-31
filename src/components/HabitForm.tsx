import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
} from 'react-native';
import { Habit, HabitType, Tier, ExtraRule } from '../models/types';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  habit?: Habit | null;
  onSave: (habit: Habit) => void;
  onCancel: () => void;
}

export default function HabitForm({ habit, onSave, onCancel }: Props) {
  const [name, setName] = useState(habit?.name || '');
  const [type, setType] = useState<HabitType>(habit?.type || 'checkbox');
  const [isGood, setIsGood] = useState(habit?.isGood ?? true);
  const [stars, setStars] = useState(String(habit?.stars ?? 1));
  const [unit, setUnit] = useState(habit?.unit || 'mins');
  const [tiers, setTiers] = useState<Tier[]>(
    habit?.tiers || [
      { value: 1, stars: 1 },
      { value: 2, stars: 2 },
      { value: 3, stars: 3 },
    ]
  );
  const [hasExtra, setHasExtra] = useState(!!habit?.extraRule);
  const [extraPer, setExtraPer] = useState(String(habit?.extraRule?.per ?? 10));
  const [extraStars, setExtraStars] = useState(String(habit?.extraRule?.stars ?? 1));

  function handleSave() {
    if (!name.trim()) return;

    const h: Habit = {
      id: habit?.id || uuidv4(),
      name: name.trim(),
      type,
      isGood,
      stars: parseFloat(stars) || 1,
    };

    if (type === 'numeral') {
      h.unit = unit;
      h.tiers = tiers.map((t) => ({
        value: parseFloat(String(t.value)) || 0,
        stars: parseFloat(String(t.stars)) || 0,
      }));
      h.extraRule = hasExtra
        ? { per: parseFloat(extraPer) || 1, stars: parseFloat(extraStars) || 1 }
        : null;
    }

    onSave(h);
  }

  function updateTier(index: number, field: 'value' | 'stars', val: string) {
    const newTiers = [...tiers];
    newTiers[index] = { ...newTiers[index], [field]: val };
    setTiers(newTiers);
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{habit ? 'Edit Habit' : 'New Habit'}</Text>

      <Text style={styles.label}>Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Habit name" />

      <Text style={styles.label}>Type</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.typeBtn, type === 'checkbox' && styles.typeBtnActive]}
          onPress={() => setType('checkbox')}
        >
          <Text style={[styles.typeBtnText, type === 'checkbox' && styles.typeBtnTextActive]}>
            ☑️ Checkbox
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeBtn, type === 'numeral' && styles.typeBtnActive]}
          onPress={() => setType('numeral')}
        >
          <Text style={[styles.typeBtnText, type === 'numeral' && styles.typeBtnTextActive]}>
            🔢 Numeral
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Good habit</Text>
        <Switch value={isGood} onValueChange={setIsGood} />
        <Text style={[styles.badge, isGood ? styles.goodBadge : styles.badBadge]}>
          {isGood ? '✅ Good' : '❌ Bad'}
        </Text>
      </View>

      {type === 'checkbox' && (
        <>
          <Text style={styles.label}>Stars ⭐</Text>
          <TextInput
            style={styles.input}
            value={stars}
            onChangeText={setStars}
            keyboardType="decimal-pad"
            placeholder="1"
          />
        </>
      )}

      {type === 'numeral' && (
        <>
          <Text style={styles.label}>Unit</Text>
          <TextInput
            style={styles.input}
            value={unit}
            onChangeText={setUnit}
            placeholder="mins, sets, meals..."
          />

          <Text style={styles.label}>Tiers (value → stars)</Text>
          {tiers.map((tier, i) => (
            <View key={i} style={styles.tierRow}>
              <TextInput
                style={[styles.input, styles.tierInput]}
                value={String(tier.value)}
                onChangeText={(v) => updateTier(i, 'value', v)}
                keyboardType="decimal-pad"
                placeholder="Value"
              />
              <Text style={styles.tierArrow}>→</Text>
              <TextInput
                style={[styles.input, styles.tierInput]}
                value={String(tier.stars)}
                onChangeText={(v) => updateTier(i, 'stars', v)}
                keyboardType="decimal-pad"
                placeholder="Stars"
              />
              <Text>⭐</Text>
            </View>
          ))}

          <View style={styles.row}>
            <Text style={styles.label}>Extra stars rule</Text>
            <Switch value={hasExtra} onValueChange={setHasExtra} />
          </View>

          {hasExtra && (
            <View style={styles.tierRow}>
              <Text>Every </Text>
              <TextInput
                style={[styles.input, styles.tierInput]}
                value={extraPer}
                onChangeText={setExtraPer}
                keyboardType="decimal-pad"
              />
              <Text> {unit} →</Text>
              <TextInput
                style={[styles.input, styles.tierInput]}
                value={extraStars}
                onChangeText={setExtraStars}
                keyboardType="decimal-pad"
              />
              <Text>⭐</Text>
            </View>
          )}
        </>
      )}

      <View style={[styles.row, { marginTop: 20 }]}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginTop: 12, marginBottom: 4, color: '#555' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 6 },
  typeBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  typeBtnActive: { borderColor: '#4f46e5', backgroundColor: '#eef2ff' },
  typeBtnText: { fontSize: 14, color: '#666' },
  typeBtnTextActive: { color: '#4f46e5', fontWeight: '600' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, fontSize: 12 },
  goodBadge: { backgroundColor: '#dcfce7', color: '#16a34a' },
  badBadge: { backgroundColor: '#fef2f2', color: '#dc2626' },
  tierRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 4 },
  tierInput: { flex: 1 },
  tierArrow: { fontSize: 18 },
  saveBtn: {
    flex: 1,
    backgroundColor: '#4f46e5',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelBtnText: { color: '#666', fontSize: 16 },
});
