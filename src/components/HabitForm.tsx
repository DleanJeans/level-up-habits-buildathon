import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { Cue, CueType, Frequency, Habit, HabitCategory, HabitType, Reminder, Tier, TimeFrame } from '../models/types';
import { getHabits } from '../store/storage';
import WebContainer from './WebContainer';

interface Props {
  habit?: Habit | null;
  onSave: (habit: Habit) => void;
  onCancel: () => void;
}

const HABIT_TYPES: { value: HabitType; label: string; icon: string }[] = [
  { value: 'checkbox',   label: 'Checkbox', icon: 'checkbox-marked-outline' },
  { value: 'numeral',    label: 'Numeral',  icon: 'numeric'                 },
  { value: 'tiered',     label: 'Tiered',   icon: 'stairs-up'               },
  { value: 'time-based', label: 'Time',     icon: 'clock-outline'           },
];

export default function HabitForm({ habit, onSave, onCancel }: Props) {
  const [name, setName] = useState(habit?.name || '');
  const [type, setType] = useState<HabitType>(habit?.type || 'checkbox');
  const [category, setCategory] = useState<HabitCategory>(
    habit?.category || (habit?.isGood !== undefined ? (habit.isGood ? 'good' : 'bad') : 'good')
  );
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
  // Cues state
  const [cues, setCues] = useState<Cue[]>(habit?.cues || []);
  // Reminders state
  const [reminders, setReminders] = useState<Reminder[]>(habit?.reminders || []);
  // All habits for reminder "after habit" picker
  const [allHabits, setAllHabits] = useState<Habit[]>([]);

  useEffect(() => {
    getHabits().then(setAllHabits);
  }, []);

  function handleSave() {
    if (!name.trim()) return;

    const h: Habit = {
      id: habit?.id || uuidv4(),
      name: name.trim(),
      type,
      category,
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

    // Cues
    const validCues = cues.filter((c) => c.value.trim() || (c.type === 'habit' && c.habitId));
    if (validCues.length > 0) {
      h.cues = validCues;
    }

    // Reminders
    const validReminders = reminders.filter((r) => r.afterHabitId || r.message?.trim());
    if (validReminders.length > 0) {
      h.reminders = validReminders;
    }

    onSave(h);
  }

  // --- Cue helpers ---
  const CUE_TYPES: CueType[] = ['location', 'mood', 'time', 'habit'];
  const CUE_TYPE_ICONS: Record<CueType, string> = {
    location: 'map-marker',
    mood: 'emoticon-outline',
    time: 'clock-outline',
    habit: 'link-variant',
  };

  function addCue() {
    setCues([...cues, { type: 'location', value: '' }]);
  }

  function updateCue(index: number, field: keyof Cue, val: string) {
    const updated = [...cues];
    updated[index] = { ...updated[index], [field]: val };
    // Clear habitId if type is not 'habit'
    if (field === 'type' && val !== 'habit') {
      delete updated[index].habitId;
    }
    setCues(updated);
  }

  function removeCue(index: number) {
    setCues(cues.filter((_, i) => i !== index));
  }

  // --- Reminder helpers ---
  function addReminder() {
    setReminders([...reminders, { delayMinutes: 5, message: '' }]);
  }

  function updateReminder(index: number, field: keyof Reminder, val: string | number) {
    const updated = [...reminders];
    updated[index] = { ...updated[index], [field]: val };
    setReminders(updated);
  }

  function removeReminder(index: number) {
    setReminders(reminders.filter((_, i) => i !== index));
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
    <WebContainer>
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
      <View style={styles.typeGrid}>
        {HABIT_TYPES.map(({ value, label, icon }) => (
          <TouchableOpacity
            key={value}
            style={[styles.typeBtn, type === value && styles.typeBtnActive]}
            onPress={() => setType(value)}
          >
            <View style={styles.typeBtnContent}>
              <MaterialCommunityIcons
                name={icon as any}
                size={15}
                color={type === value ? '#818cf8' : '#9ca3af'}
              />
              <Text style={[styles.typeBtnText, type === value && styles.typeBtnTextActive]}>{label}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Habit Category</Text>
      <View style={styles.categoryRow}>
        <TouchableOpacity
          style={[styles.categoryBtn, category === 'good' && styles.categoryBtnGood]}
          onPress={() => setCategory('good')}
        >
          <MaterialCommunityIcons
            name="thumb-up"
            size={16}
            color={category === 'good' ? '#4ade80' : '#9ca3af'}
          />
          <Text style={[styles.categoryBtnText, category === 'good' && styles.categoryBtnTextGood]}>
            Good
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.categoryBtn, category === 'neutral' && styles.categoryBtnNeutral]}
          onPress={() => setCategory('neutral')}
        >
          <MaterialCommunityIcons
            name="minus-circle-outline"
            size={16}
            color={category === 'neutral' ? '#9ca3af' : '#6b7280'}
          />
          <Text style={[styles.categoryBtnText, category === 'neutral' && styles.categoryBtnTextNeutral]}>
            Neutral
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.categoryBtn, category === 'bad' && styles.categoryBtnBad]}
          onPress={() => setCategory('bad')}
        >
          <MaterialCommunityIcons
            name="thumb-down"
            size={16}
            color={category === 'bad' ? '#f87171' : '#9ca3af'}
          />
          <Text style={[styles.categoryBtnText, category === 'bad' && styles.categoryBtnTextBad]}>
            Bad
          </Text>
        </TouchableOpacity>
      </View>

      {type === 'checkbox' && category !== 'neutral' && (
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

          {category !== 'neutral' && (
            <>
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

          {category !== 'neutral' && (
            <>
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
        </>
      )}

      {type === 'time-based' && category !== 'neutral' && (
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

      {(type === 'numeral' || type === 'tiered') && category !== 'neutral' && (
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

      {/* Cues Section */}
      <Text style={styles.label}>Cues</Text>
      {cues.map((cue, i) => (
        <View key={i} style={styles.cueRow}>
          <View style={styles.cueTypeRow}>
            {CUE_TYPES.map((ct) => (
              <TouchableOpacity
                key={ct}
                style={[styles.cueTypeBtn, cue.type === ct && styles.cueTypeBtnActive]}
                onPress={() => updateCue(i, 'type', ct)}
              >
                <MaterialCommunityIcons
                  name={CUE_TYPE_ICONS[ct] as any}
                  size={14}
                  color={cue.type === ct ? '#818cf8' : '#9ca3af'}
                />
                <Text style={[styles.cueTypeBtnText, cue.type === ct && styles.cueTypeBtnTextActive]}>
                  {ct.charAt(0).toUpperCase() + ct.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {cue.type === 'habit' ? (
            <View style={styles.cueHabitPicker}>
              {allHabits
                .filter((h) => h.id !== habit?.id)
                .map((h) => (
                  <TouchableOpacity
                    key={h.id}
                    style={[styles.cueHabitOption, cue.habitId === h.id && styles.cueHabitOptionActive]}
                    onPress={() => {
                      const updated = [...cues];
                      updated[i] = { ...updated[i], habitId: h.id, value: h.name };
                      setCues(updated);
                    }}
                  >
                    <Text style={[styles.cueHabitOptionText, cue.habitId === h.id && styles.cueHabitOptionTextActive]}>
                      {h.name}
                    </Text>
                  </TouchableOpacity>
                ))}
            </View>
          ) : (
            <TextInput
              style={styles.input}
              value={cue.value}
              onChangeText={(v) => updateCue(i, 'value', v)}
              placeholder={
                cue.type === 'location'
                  ? 'e.g. At the gym'
                  : cue.type === 'mood'
                  ? 'e.g. Feeling stressed'
                  : 'e.g. After lunch'
              }
              placeholderTextColor="#555"
            />
          )}
          <TouchableOpacity onPress={() => removeCue(i)} style={styles.removeCueBtn}>
            <MaterialCommunityIcons name="close-circle" size={20} color="#f87171" />
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity style={styles.addFrameBtn} onPress={addCue}>
        <MaterialCommunityIcons name="plus-circle-outline" size={18} color="#818cf8" />
        <Text style={styles.addFrameText}>Add cue</Text>
      </TouchableOpacity>

      {/* Reminders Section */}
      <Text style={styles.label}>Reminders</Text>
      {reminders.map((rem, i) => (
        <View key={i} style={styles.reminderRow}>
          <Text style={styles.reminderLabel}>After completing:</Text>
          <View style={styles.cueHabitPicker}>
            {allHabits
              .filter((h) => h.id !== habit?.id)
              .map((h) => (
                <TouchableOpacity
                  key={h.id}
                  style={[styles.cueHabitOption, rem.afterHabitId === h.id && styles.cueHabitOptionActive]}
                  onPress={() => updateReminder(i, 'afterHabitId', h.id)}
                >
                  <Text style={[styles.cueHabitOptionText, rem.afterHabitId === h.id && styles.cueHabitOptionTextActive]}>
                    {h.name}
                  </Text>
                </TouchableOpacity>
              ))}
          </View>
          <View style={styles.tierRow}>
            <Text style={styles.text}>Delay: </Text>
            <TextInput
              style={[styles.input, styles.tierInput]}
              value={String(rem.delayMinutes ?? 5)}
              onChangeText={(v) => updateReminder(i, 'delayMinutes', parseInt(v) || 0)}
              keyboardType="number-pad"
              placeholder="5"
              placeholderTextColor="#555"
            />
            <Text style={styles.text}> min</Text>
          </View>
          <TextInput
            style={styles.input}
            value={rem.message ?? ''}
            onChangeText={(v) => updateReminder(i, 'message', v)}
            placeholder="Reminder message..."
            placeholderTextColor="#555"
          />
          <TouchableOpacity onPress={() => removeReminder(i)} style={styles.removeCueBtn}>
            <MaterialCommunityIcons name="close-circle" size={20} color="#f87171" />
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity style={styles.addFrameBtn} onPress={addReminder}>
        <MaterialCommunityIcons name="plus-circle-outline" size={18} color="#818cf8" />
        <Text style={styles.addFrameText}>Add reminder</Text>
      </TouchableOpacity>

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
    </WebContainer>
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
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 6 },
  typeBtnContent: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  typeBtn: {
    width: '48%',
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
  categoryRow: { flexDirection: 'row', gap: 8, marginVertical: 6 },
  categoryBtn: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#444',
    alignItems: 'center',
    flexDirection: 'column',
    gap: 6,
    minHeight: 60,
    justifyContent: 'center',
  },
  categoryBtnGood: { borderColor: '#4ade80', backgroundColor: '#14532d' },
  categoryBtnNeutral: { borderColor: '#9ca3af', backgroundColor: '#374151' },
  categoryBtnBad: { borderColor: '#f87171', backgroundColor: '#7f1d1d' },
  categoryBtnText: { fontSize: 13, color: '#9ca3af', fontWeight: '500' },
  categoryBtnTextGood: { color: '#4ade80', fontWeight: '600' },
  categoryBtnTextNeutral: { color: '#d1d5db', fontWeight: '600' },
  categoryBtnTextBad: { color: '#f87171', fontWeight: '600' },
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
  // Cue styles
  cueRow: { marginVertical: 6, backgroundColor: '#1a1a2e', borderRadius: 10, padding: 10 },
  cueTypeRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  cueTypeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  cueTypeBtnActive: { borderColor: '#6366f1', backgroundColor: '#1e1b4b' },
  cueTypeBtnText: { fontSize: 11, color: '#9ca3af' },
  cueTypeBtnTextActive: { color: '#818cf8', fontWeight: '600' },
  cueHabitPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 6 },
  cueHabitOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#444',
    backgroundColor: '#1e1e1e',
  },
  cueHabitOptionActive: { borderColor: '#6366f1', backgroundColor: '#1e1b4b' },
  cueHabitOptionText: { fontSize: 13, color: '#9ca3af' },
  cueHabitOptionTextActive: { color: '#818cf8', fontWeight: '600' },
  removeCueBtn: { alignSelf: 'flex-end', padding: 4, marginTop: 4 },
  // Reminder styles
  reminderRow: { marginVertical: 6, backgroundColor: '#1a1a2e', borderRadius: 10, padding: 10 },
  reminderLabel: { fontSize: 13, color: '#9ca3af', marginBottom: 4 },
});
