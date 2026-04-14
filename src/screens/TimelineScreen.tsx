import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Habit, HabitLog } from '../models/types';
import { getHabits, getLogsForDate, saveLog, formatDate } from '../store/storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import WebContainer from '../components/WebContainer';
import DateNav from '../components/DateNav';
import EditTimeModal, { toHHMM } from '../components/EditTimeModal';

interface TimelineEntry {
  habit: Habit;
  log: HabitLog;
  time: Date;
}

function getSegment(hour: number): string {
  if (hour < 6) return 'Night';
  if (hour < 12) return 'Morning';
  if (hour < 18) return 'Afternoon';
  return 'Evening';
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function TimelineScreen() {
  const insets = useSafeAreaInsets();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [totalStars, setTotalStars] = useState(0);
  const [editingEntry, setEditingEntry] = useState<TimelineEntry | null>(null);

  const dateStr = formatDate(currentDate);

  const loadData = useCallback(async () => {
    const [habits, logs] = await Promise.all([getHabits(), getLogsForDate(dateStr)]);
    const habitMap = new Map(habits.map((h) => [h.id, h]));

    const timeline: TimelineEntry[] = [];
    for (const log of logs) {
      const habit = habitMap.get(log.habitId);
      if (!habit) continue;
      // Only show logs that have a loggedAt timestamp and non-zero activity
      const hasActivity = log.value === true || (typeof log.value === 'number' && log.value > 0);
      if (!hasActivity) continue;
      const time = log.loggedAt ? new Date(log.loggedAt) : new Date(dateStr + 'T12:00:00');
      timeline.push({ habit, log, time });
    }
    timeline.sort((a, b) => a.time.getTime() - b.time.getTime());
    setEntries(timeline);
    setTotalStars(logs.reduce((s, l) => s + l.starsEarned, 0));
  }, [dateStr]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  function changeDate(delta: number) {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + delta);
    setCurrentDate(d);
  }

  function openEditTime(entry: TimelineEntry) {
    setEditingEntry(entry);
  }

  async function handleSaveTime(hours: number, minutes: number) {
    if (!editingEntry) return;
    const newTime = new Date(editingEntry.time);
    newTime.setHours(hours, minutes, 0, 0);
    const updatedLog: HabitLog = { ...editingEntry.log, loggedAt: newTime.toISOString() };
    await saveLog(updatedLog);
    setEditingEntry(null);
    loadData();
  }

  // Group entries by time segment
  const grouped = new Map<string, TimelineEntry[]>();
  for (const entry of entries) {
    const seg = getSegment(entry.time.getHours());
    if (!grouped.has(seg)) grouped.set(seg, []);
    grouped.get(seg)!.push(entry);
  }

  const segments = ['Night', 'Morning', 'Afternoon', 'Evening'];

  return (
    <WebContainer>
    <View style={styles.container}>
      {/* Date navigation */}
      <DateNav currentDate={currentDate} onChangeDate={changeDate} />

      <EditTimeModal
        visible={!!editingEntry}
        habitName={editingEntry?.habit.name ?? ''}
        initialTime={editingEntry ? toHHMM(editingEntry.time) : ''}
        onSave={handleSaveTime}
        onCancel={() => setEditingEntry(null)}
      />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {entries.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="timeline-clock-outline" size={48} color="#333" />
            <Text style={styles.emptyText}>No logged habits for this day</Text>
          </View>
        ) : (
          segments
            .filter((seg) => grouped.has(seg))
            .map((seg) => (
              <View key={seg}>
                <Text style={styles.segmentTitle}>{seg}</Text>
                {grouped.get(seg)!.map((entry, i) => (
                  <View key={entry.log.habitId} style={styles.entryRow}>
                    <View style={styles.timelineTrack}>
                      <View style={styles.dot} />
                      {i < grouped.get(seg)!.length - 1 && <View style={styles.line} />}
                    </View>
                    <View style={styles.entryContent}>
                      <TouchableOpacity onPress={() => openEditTime(entry)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                        <View style={styles.entryTimeRow}>
                          <Text style={styles.entryTime}>{formatTime(entry.time)}</Text>
                          <MaterialCommunityIcons name="pencil-outline" size={11} color="#4b5563" style={styles.editIcon} />
                        </View>
                      </TouchableOpacity>
                      <Text
                        style={[
                          styles.entryName,
                          !entry.habit.isGood && styles.badText,
                        ]}
                      >
                        {entry.habit.name}
                      </Text>
                      {typeof entry.log.value === 'number' && entry.log.value > 0 && (
                        <Text style={styles.entryValue}>
                          {entry.log.value} {entry.habit.unit || ''}
                        </Text>
                      )}
                    </View>
                    <View style={styles.entryStars}>
                      <Text
                        style={[
                          styles.starText,
                          entry.log.starsEarned < 0 && styles.negativeStars,
                        ]}
                      >
                        {entry.log.starsEarned > 0 ? '+' : ''}
                        {entry.log.starsEarned.toFixed(2).replace(/\.?0+$/, '')}
                      </Text>
                      <MaterialCommunityIcons name="star" size={14} color="#facc15" />
                    </View>
                  </View>
                ))}
              </View>
            ))
        )}
      </ScrollView>
    </View>
    </WebContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  scrollContent: { paddingHorizontal: 16 },
  segmentTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#818cf8',
    marginTop: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  entryRow: { flexDirection: 'row', alignItems: 'flex-start', minHeight: 56 },
  timelineTrack: { width: 24, alignItems: 'center', paddingTop: 4 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#818cf8',
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: '#333',
    marginTop: 2,
    minHeight: 30,
  },
  entryContent: { flex: 1, paddingLeft: 12, paddingBottom: 16 },
  entryTimeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  entryTime: { fontSize: 11, color: '#6b7280' },
  editIcon: { marginLeft: 4 },
  entryName: { fontSize: 15, fontWeight: '500', color: '#f0f0f0' },
  entryValue: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  badText: { color: '#f87171' },
  entryStars: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingTop: 4 },
  starText: { fontSize: 13, color: '#4ade80', fontWeight: '500' },
  negativeStars: { color: '#f87171' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyText: { color: '#555', fontSize: 16, marginTop: 12 },

});
