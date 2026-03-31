import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Habit, HabitLog } from '../models/types';
import { getHabits, getLogsForDate, saveLog, formatDate } from '../store/storage';
import { calculateStars } from '../store/starCalculator';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function DailyLogScreen() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<Map<string, HabitLog>>(new Map());
  const [totalStars, setTotalStars] = useState(0);

  const dateStr = formatDate(currentDate);

  const loadData = useCallback(async () => {
    const [h, l] = await Promise.all([getHabits(), getLogsForDate(dateStr)]);
    setHabits(h);
    const logMap = new Map<string, HabitLog>();
    l.forEach((log) => logMap.set(log.habitId, log));
    setLogs(logMap);
    setTotalStars(l.reduce((sum, log) => sum + log.starsEarned, 0));
  }, [dateStr]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  async function toggleCheckbox(habit: Habit) {
    const existing = logs.get(habit.id);
    const newValue = existing ? !existing.value : true;
    const starsEarned = newValue ? calculateStars(habit, true) : 0;

    const log: HabitLog = {
      habitId: habit.id,
      date: dateStr,
      value: newValue,
      starsEarned,
    };
    await saveLog(log);
    loadData();
  }

  async function updateNumeral(habit: Habit, delta: number) {
    const existing = logs.get(habit.id);
    const currentVal = existing ? (typeof existing.value === 'number' ? existing.value : 0) : 0;
    const newVal = Math.max(0, currentVal + delta);
    const starsEarned = calculateStars(habit, newVal);

    const log: HabitLog = {
      habitId: habit.id,
      date: dateStr,
      value: newVal,
      starsEarned,
    };
    await saveLog(log);
    loadData();
  }

  function changeDate(delta: number) {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + delta);
    setCurrentDate(d);
  }

  function formatDisplayDate(d: Date): string {
    const today = formatDate(new Date());
    const ds = formatDate(d);
    if (ds === today) return 'Today';
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (ds === formatDate(yesterday)) return 'Yesterday';
    return ds;
  }

  function renderHabitItem({ item }: { item: Habit }) {
    const log = logs.get(item.id);
    const starsEarned = log?.starsEarned ?? 0;
    const isBad = !item.isGood;

    return (
      <View style={[styles.habitRow, isBad && styles.badRow]}>
        <View style={styles.habitInfo}>
          <Text style={[styles.habitName, isBad && styles.badText]}>{item.name}</Text>
          <View style={styles.starRow}>
            <Text style={[styles.starText, starsEarned < 0 && styles.negativeStars]}>
              {starsEarned > 0 ? '+' : ''}
              {starsEarned.toFixed(2).replace(/\.?0+$/, '')}
            </Text>
            <MaterialCommunityIcons name="star" size={13} color="#facc15" />
          </View>
        </View>

        {item.type === 'checkbox' ? (
          <TouchableOpacity
            style={[styles.checkbox, log?.value === true && styles.checkboxChecked]}
            onPress={() => toggleCheckbox(item)}
          >
            {log?.value === true && <MaterialCommunityIcons name="check" size={18} color="#fff" />}
          </TouchableOpacity>
        ) : (item.type === 'numeral' || item.type === 'tiered') ? (
          <View style={styles.stepper}>
            <TouchableOpacity style={styles.stepBtn} onPress={() => updateNumeral(item, -1)}>
              <Text style={styles.stepBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.stepValue}>
              {typeof log?.value === 'number' ? log.value : 0} {item.unit || ''}
            </Text>
            <TouchableOpacity style={styles.stepBtn} onPress={() => updateNumeral(item, 1)}>
              <Text style={styles.stepBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Date navigation */}
      <View style={styles.dateNav}>
        <TouchableOpacity onPress={() => changeDate(-1)}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#818cf8" style={styles.dateArrow} />
        </TouchableOpacity>
        <Text style={styles.dateText}>{formatDisplayDate(currentDate)}</Text>
        <TouchableOpacity onPress={() => changeDate(1)}>
          <MaterialCommunityIcons name="chevron-right" size={28} color="#818cf8" style={styles.dateArrow} />
        </TouchableOpacity>
      </View>

      {/* Daily star total */}
      <View style={styles.totalBox}>
        <Text style={styles.totalLabel}>Daily Stars</Text>
        <View style={styles.totalValueRow}>
          <Text style={styles.totalValue}>
            {totalStars.toFixed(2).replace(/\.?0+$/, '')}
          </Text>
          <MaterialCommunityIcons name="star" size={28} color="#fbbf24" />
        </View>
      </View>

      {habits.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No habits yet. Go to Habits tab to add some!</Text>
        </View>
      ) : (
        <FlatList
          data={habits}
          keyExtractor={(item) => item.id}
          renderItem={renderHabitItem}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  dateNav: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 16,
    gap: 20,
  },
  dateArrow: { padding: 8 },
  totalValueRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateText: { fontSize: 18, fontWeight: '600', color: '#f0f0f0' },
  totalBox: {
    margin: 16,
    padding: 16,
    backgroundColor: '#1c1a14',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ca8a04',
  },
  totalLabel: { fontSize: 14, color: '#fde68a', fontWeight: '500' },
  totalValue: { fontSize: 32, fontWeight: 'bold', color: '#fbbf24' },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginVertical: 4,
    backgroundColor: '#0a2318',
    borderRadius: 10,
  },
  badRow: { backgroundColor: '#2d0707' },
  habitInfo: { flex: 1 },
  habitName: { fontSize: 16, fontWeight: '500', color: '#f0f0f0' },
  badText: { color: '#f87171' },
  starRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  starText: { fontSize: 13, color: '#4ade80' },
  negativeStars: { color: '#f87171' },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#555',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  checkboxText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1e1b4b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBtnText: { fontSize: 20, color: '#818cf8', fontWeight: 'bold' },
  stepValue: { fontSize: 16, fontWeight: '500', minWidth: 50, textAlign: 'center', color: '#f0f0f0' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#555', fontSize: 16, textAlign: 'center', paddingHorizontal: 40 },
});
