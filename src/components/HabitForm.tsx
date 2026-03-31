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
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Habit name" placeholderTextColor="#555" />

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
            placeholderTextColor="#555"
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
            placeholderTextColor="#555"
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
                placeholderTextColor="#555"
              />
              <Text style={styles.tierArrow}>→</Text>
              <TextInput
                style={[styles.input, styles.tierInput]}
                value={String(tier.stars)}
                onChangeText={(v) => updateTier(i, 'stars', v)}
                keyboardType="decimal-pad"
                placeholder="Stars"
                placeholderTextColor="#555"
              />
              <Text style={styles.text}>⭐</Text>
            </View>
          ))}

          <View style={styles.row}>
            <Text style={styles.label}>Extra stars rule</Text>
            <Switch value={hasExtra} onValueChange={setHasExtra} />
          </View>

          {hasExtra && (
            <View style={styles.tierRow}>
              <Text style={styles.text}>Every </Text>
              <TextInput
                style={[styles.input, styles.tierInput]}
                value={extraPer}
                onChangeText={setExtraPer}
                keyboardType="decimal-pad"
                placeholderTextColor="#555"
              />
              <Text style={styles.text}> {unit} →</Text>
              <TextInput
                style={[styles.input, styles.tierInput]}
                value={extraStars}
                onChangeText={setExtraStars}
                keyboardType="decimal-pad"
                placeholderTextColor="#555"
              />
              <Text style={styles.text}>⭐</Text>
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
  container: { padding: 20, backgroundColor: '#121212' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, color: '#f0f0f0' },
  label: { fontSize: 14, fontWeight: '600', marginTop: 12, marginBottom: 4, color: '#9ca3af' },
  input: {
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#1e1e1e',
    color: '#f0f0f0',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 6 },
  typeBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
    alignItems: 'center',
  },
  typeBtnActive: { borderColor: '#6366f1', backgroundColor: '#1e1b4b' },
  typeBtnText: { fontSize: 14, color: '#9ca3af' },
  typeBtnTextActive: { color: '#818cf8', fontWeight: '600' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, fontSize: 12 },
  goodBadge: { backgroundColor: '#14532d', color: '#4ade80' },
  badBadge: { backgroundColor: '#7f1d1d', color: '#f87171' },
  tierRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 4 },
  tierInput: { flex: 1 },
  tierArrow: { fontSize: 18, color: '#9ca3af' },
  text: { color: '#f0f0f0' },
  saveBtn: {
    flex: 1,
    backgroundColor: '#6366f1',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelBtnText: { color: '#bbb', fontSize: 16 },
});
