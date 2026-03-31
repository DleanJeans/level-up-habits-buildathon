import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Habit, HabitType, Tier, ExtraRule, TimeFrame, Frequency } from '../models/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
  // Numeral (flat conversion) state
  const [convPer, setConvPer] = useState(String(habit?.conversion?.per ?? 1));
  const [convStars, setConvStars] = useState(String(habit?.conversion?.stars ?? 1));
  // Tiered state
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
  // Starting stars & threshold
  const [hasStartingStars, setHasStartingStars] = useState((habit?.startingStars ?? 0) > 0);
  const [startingStars, setStartingStars] = useState(String(habit?.startingStars ?? 1));
  const [extraThreshold, setExtraThreshold] = useState(String(habit?.extraThreshold ?? 0));
  // Time-based state
  const [timeFrames, setTimeFrames] = useState<TimeFrame[]>(
    habit?.timeFrames || [
      { startHour: 6, endHour: 12, stars: 3 },
      { startHour: 12, endHour: 18, stars: 2 },
    ]
  );
  // Frequency state
  const [frequency, setFrequency] = useState<Frequency>(habit?.frequency || 'daily');

  function handleSave() {
    if (!name.trim()) return;

    const h: Habit = {
      id: habit?.id || uuidv4(),
      name: name.trim(),
      type,
      isGood,
      stars: parseFloat(stars) || 1,
      frequency,
    };

    // Starting stars (for numeral/tiered)
    if ((type === 'numeral' || type === 'tiered') && hasStartingStars) {
      h.startingStars = parseFloat(startingStars) || 0;
      h.extraThreshold = parseFloat(extraThreshold) || 0;
    }

    if (type === 'numeral') {
      h.unit = unit;
      h.conversion = {
        per: parseFloat(convPer) || 1,
        stars: parseFloat(convStars) || 1,
      };
    } else if (type === 'tiered') {
      h.unit = unit;
      h.tiers = tiers.map((t) => ({
        value: parseFloat(String(t.value)) || 0,
        stars: parseFloat(String(t.stars)) || 0,
      }));
      h.extraRule = hasExtra
        ? { per: parseFloat(extraPer) || 1, stars: parseFloat(extraStars) || 1 }
        : null;
    } else if (type === 'time-based') {
      h.timeFrames = timeFrames.map((f) => ({
        startHour: Math.max(0, Math.min(23, Math.round(f.startHour))),
        endHour: Math.max(0, Math.min(23, Math.round(f.endHour))),
        stars: parseFloat(String(f.stars)) || 1,
      }));
    }

    onSave(h);
  }

  function updateTier(index: number, field: 'value' | 'stars', val: string) {
    const newTiers = [...tiers];
    newTiers[index] = { ...newTiers[index], [field]: val };
    setTiers(newTiers);
  }

  function updateTimeFrame(index: number, field: keyof TimeFrame, val: string) {
    const newFrames = [...timeFrames];
    newFrames[index] = { ...newFrames[index], [field]: parseFloat(val) || 0 };
    setTimeFrames(newFrames);
  }

  function addTimeFrame() {
    setTimeFrames([...timeFrames, { startHour: 0, endHour: 23, stars: 1 }]);
  }

  function removeTimeFrame(index: number) {
    setTimeFrames(timeFrames.filter((_, i) => i !== index));
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoid}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
      <Text style={styles.title}>{habit ? 'Edit Habit' : 'New Habit'}</Text>

      <Text style={styles.label}>Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Habit name" placeholderTextColor="#555" />

      <Text style={styles.label}>Type</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.typeBtn, type === 'checkbox' && styles.typeBtnActive]}
          onPress={() => setType('checkbox')}
        >
          <View style={styles.typeBtnContent}>
            <MaterialCommunityIcons
              name="checkbox-marked-outline"
              size={15}
              color={type === 'checkbox' ? '#818cf8' : '#9ca3af'}
            />
            <Text style={[styles.typeBtnText, type === 'checkbox' && styles.typeBtnTextActive]}> Checkbox</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeBtn, type === 'numeral' && styles.typeBtnActive]}
          onPress={() => setType('numeral')}
        >
          <View style={styles.typeBtnContent}>
            <MaterialCommunityIcons
              name="numeric"
              size={15}
              color={type === 'numeral' ? '#818cf8' : '#9ca3af'}
            />
            <Text style={[styles.typeBtnText, type === 'numeral' && styles.typeBtnTextActive]}> Numeral</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeBtn, type === 'tiered' && styles.typeBtnActive]}
          onPress={() => setType('tiered')}
        >
          <View style={styles.typeBtnContent}>
            <MaterialCommunityIcons
              name="stairs-up"
              size={15}
              color={type === 'tiered' ? '#818cf8' : '#9ca3af'}
            />
            <Text style={[styles.typeBtnText, type === 'tiered' && styles.typeBtnTextActive]}> Tiered</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeBtn, type === 'time-based' && styles.typeBtnActive]}
          onPress={() => setType('time-based')}
        >
          <View style={styles.typeBtnContent}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={15}
              color={type === 'time-based' ? '#818cf8' : '#9ca3af'}
            />
            <Text style={[styles.typeBtnText, type === 'time-based' && styles.typeBtnTextActive]}> Time</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Good habit</Text>
        <Switch value={isGood} onValueChange={setIsGood} />
        <View style={[styles.badge, isGood ? styles.goodBadge : styles.badBadge]}>
          <MaterialCommunityIcons
            name={isGood ? 'thumb-up' : 'thumb-down'}
            size={12}
            color={isGood ? '#4ade80' : '#f87171'}
          />
          <Text style={[styles.badgeText, isGood ? styles.goodBadgeText : styles.badBadgeText]}>
            {isGood ? 'Good' : 'Bad'}
          </Text>
        </View>
      </View>

      {type === 'checkbox' && (
        <>
          <View style={styles.starsLabelRow}>
            <Text style={styles.starsLabel}>Stars</Text>
            <MaterialCommunityIcons name="star" size={14} color="#facc15" />
          </View>
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

          <Text style={styles.label}>Conversion rate</Text>
          <View style={styles.tierRow}>
            <View style={[styles.input, styles.tierInput, styles.inputWithSuffix]}>
              <TextInput
                style={styles.innerInput}
                value={convPer}
                onChangeText={setConvPer}
                keyboardType="decimal-pad"
                placeholder="1"
                placeholderTextColor="#555"
              />
              <Text style={styles.inputSuffix} numberOfLines={1}>{unit}</Text>
            </View>

            <Text style={styles.tierArrow}>→</Text>
            
            <View style={[styles.input, styles.tierInput, styles.inputWithSuffix]}>
              <TextInput
                style={styles.innerInput}
                value={convStars}
                onChangeText={setConvStars}
                keyboardType="decimal-pad"
                placeholder="1"
                placeholderTextColor="#555"
              />
              <MaterialCommunityIcons name="star" size={16} color="#facc15" style={{ paddingRight: 10 }} />
            </View>
          </View>
        </>
      )}

      {type === 'tiered' && (
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
              <MaterialCommunityIcons name="star" size={16} color="#facc15" />
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
              <MaterialCommunityIcons name="star" size={16} color="#facc15" />
            </View>
          )}
        </>
      )}

      {type === 'time-based' && (
        <>
          <View style={styles.starsLabelRow}>
            <Text style={styles.starsLabel}>Fallback Stars</Text>
            <MaterialCommunityIcons name="star" size={14} color="#facc15" />
          </View>
          <TextInput
            style={styles.input}
            value={stars}
            onChangeText={setStars}
            keyboardType="decimal-pad"
            placeholder="1"
            placeholderTextColor="#555"
          />

          <Text style={styles.label}>Time Frames</Text>
          {timeFrames.map((frame, i) => (
            <View key={i} style={styles.timeFrameRow}>
              <View style={styles.timeFrameInputs}>
                <TextInput
                  style={[styles.input, styles.timeInput]}
                  value={String(frame.startHour)}
                  onChangeText={(v) => updateTimeFrame(i, 'startHour', v)}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor="#555"
                />
                <Text style={styles.text}>h –</Text>
                <TextInput
                  style={[styles.input, styles.timeInput]}
                  value={String(frame.endHour)}
                  onChangeText={(v) => updateTimeFrame(i, 'endHour', v)}
                  keyboardType="number-pad"
                  placeholder="23"
                  placeholderTextColor="#555"
                />
                <Text style={styles.text}>h →</Text>
                <TextInput
                  style={[styles.input, styles.timeInput]}
                  value={String(frame.stars)}
                  onChangeText={(v) => updateTimeFrame(i, 'stars', v)}
                  keyboardType="decimal-pad"
                  placeholder="1"
                  placeholderTextColor="#555"
                />
                <MaterialCommunityIcons name="star" size={16} color="#facc15" />
              </View>
              {timeFrames.length > 1 && (
                <TouchableOpacity onPress={() => removeTimeFrame(i)} style={styles.removeFrameBtn}>
                  <MaterialCommunityIcons name="close-circle" size={20} color="#f87171" />
                </TouchableOpacity>
              )}
            </View>
          ))}
          <TouchableOpacity style={styles.addFrameBtn} onPress={addTimeFrame}>
            <MaterialCommunityIcons name="plus-circle-outline" size={18} color="#818cf8" />
            <Text style={styles.addFrameText}>Add time frame</Text>
          </TouchableOpacity>
        </>
      )}

      {(type === 'numeral' || type === 'tiered') && (
        <>
          <View style={styles.row}>
            <Text style={styles.label}>Starting stars</Text>
            <Switch value={hasStartingStars} onValueChange={setHasStartingStars} />
          </View>
          {hasStartingStars && (
            <>
              <View style={styles.tierRow}>
                <Text style={styles.text}>Start = </Text>
                <TextInput
                  style={[styles.input, styles.tierInput]}
                  value={startingStars}
                  onChangeText={setStartingStars}
                  keyboardType="decimal-pad"
                  placeholder="1"
                  placeholderTextColor="#555"
                />
                <MaterialCommunityIcons name="star" size={16} color="#facc15" />
              </View>
              <View style={styles.tierRow}>
                <Text style={styles.text}>Skip first </Text>
                <TextInput
                  style={[styles.input, styles.tierInput]}
                  value={extraThreshold}
                  onChangeText={setExtraThreshold}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor="#555"
                />
                <Text style={styles.text}> {unit}</Text>
              </View>
            </>
          )}
        </>
      )}

      <Text style={styles.label}>Frequency</Text>
      <View style={styles.row}>
        {(['daily', 'weekly', 'monthly', 'yearly'] as Frequency[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.freqBtn, frequency === f && styles.freqBtnActive]}
            onPress={() => setFrequency(f)}
          >
            <Text style={[styles.freqBtnText, frequency === f && styles.freqBtnTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.row, { marginTop: 24, marginBottom: 16 }]}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.7}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.7}>
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: { flex: 1, backgroundColor: '#121212' },
  container: { flex: 1, backgroundColor: '#121212' },
  contentContainer: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, color: '#f0f0f0' },
  label: { fontSize: 14, fontWeight: '600', marginTop: 14, marginBottom: 6, color: '#9ca3af' },
  input: {
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#1e1e1e',
    color: '#f0f0f0',
    minHeight: 48,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 6 },
  typeBtnContent: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  typeBtn: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#444',
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  typeBtnActive: { borderColor: '#6366f1', backgroundColor: '#1e1b4b' },
  typeBtnText: { fontSize: 13, color: '#9ca3af' },
  typeBtnTextActive: { color: '#818cf8', fontWeight: '600' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4 },
  badgeText: { fontSize: 12 },
  goodBadge: { backgroundColor: '#14532d' },
  goodBadgeText: { color: '#4ade80' },
  badBadge: { backgroundColor: '#7f1d1d' },
  badBadgeText: { color: '#f87171' },
  tierRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 5 },
  tierInput: { flex: 1 },
  inputWithSuffix: { flexDirection: 'row', alignItems: 'center', padding: 0 },
  innerInput: { flex: 1, padding: 12, fontSize: 16, color: '#f0f0f0' },
  inputSuffix: { paddingRight: 12, fontSize: 14, color: '#555' },
  tierArrow: { fontSize: 18, color: '#9ca3af' },
  text: { color: '#f0f0f0' },
  saveBtn: {
    flex: 1,
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  cancelBtnText: { color: '#bbb', fontSize: 16 },
  starsLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, marginBottom: 6 },
  starsLabel: { fontSize: 14, fontWeight: '600', color: '#9ca3af' },
  timeFrameRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  timeFrameInputs: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeInput: { flex: 1, textAlign: 'center' },
  removeFrameBtn: { padding: 6, marginLeft: 4 },
  addFrameBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, paddingVertical: 8 },
  addFrameText: { color: '#818cf8', fontSize: 14, fontWeight: '500' },
  freqBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
    alignItems: 'center',
  },
  freqBtnActive: { borderColor: '#6366f1', backgroundColor: '#1e1b4b' },
  freqBtnText: { fontSize: 12, color: '#9ca3af' },
  freqBtnTextActive: { color: '#818cf8', fontWeight: '600' },
});
