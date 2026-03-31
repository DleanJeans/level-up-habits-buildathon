import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
  SectionList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Habit, HabitLog, Task } from '../models/types';
import {
  getHabits,
  getLogsForDate,
  saveLog,
  formatDate,
  getTasksForDate,
  saveTask,
  deleteTask,
  toggleTask,
} from '../store/storage';
import { calculateStars } from '../store/starCalculator';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { v4 as uuidv4 } from 'uuid';

export default function DailyLogScreen() {
  const insets = useSafeAreaInsets();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<Map<string, HabitLog>>(new Map());
  const [totalStars, setTotalStars] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  // Tasks
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskStars, setNewTaskStars] = useState('1');

  const dateStr = formatDate(currentDate);

  const loadData = useCallback(async () => {
    const [h, l, t] = await Promise.all([
      getHabits(),
      getLogsForDate(dateStr),
      getTasksForDate(dateStr),
    ]);
    // Filter to daily habits only (non-daily habits don't show on daily view)
    const dailyHabits = h.filter((habit) => (habit.frequency || 'daily') === 'daily');
    setHabits(dailyHabits);
    const logMap = new Map<string, HabitLog>();
    l.forEach((log) => logMap.set(log.habitId, log));
    setLogs(logMap);
    setTasks(t);
    const logStars = l.reduce((sum, log) => sum + log.starsEarned, 0);
    const taskStars = t.filter((task) => task.completed).reduce((sum, task) => sum + task.stars, 0);
    setTotalStars(logStars + taskStars);
  }, [dateStr]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  async function toggleCheckbox(habit: Habit) {
    const existing = logs.get(habit.id);
    const newValue = existing ? !existing.value : true;
    const now = new Date().toISOString();
    const starsEarned = newValue ? calculateStars(habit, true, now) : 0;

    const log: HabitLog = {
      habitId: habit.id,
      date: dateStr,
      value: newValue,
      starsEarned,
      loggedAt: now,
    };
    await saveLog(log);
    loadData();
  }

  async function setNumeralValue(habit: Habit, newVal: number) {
    const clamped = Math.max(0, newVal);
    const starsEarned = calculateStars(habit, clamped);
    const log: HabitLog = {
      habitId: habit.id,
      date: dateStr,
      value: clamped,
      starsEarned,
      loggedAt: new Date().toISOString(),
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
      loggedAt: new Date().toISOString(),
    };
    await saveLog(log);
    loadData();
  }

  // --- Time-based habit: log as checked with current time ---
  async function toggleTimeBased(habit: Habit) {
    const existing = logs.get(habit.id);
    const newValue = existing ? !existing.value : true;
    const now = new Date().toISOString();
    const starsEarned = newValue ? calculateStars(habit, true, now) : 0;

    const log: HabitLog = {
      habitId: habit.id,
      date: dateStr,
      value: newValue,
      starsEarned,
      loggedAt: now,
    };
    await saveLog(log);
    loadData();
  }

  // --- Task functions ---
  async function handleAddTask() {
    if (!newTaskName.trim()) return;
    const task: Task = {
      id: uuidv4(),
      name: newTaskName.trim(),
      stars: parseFloat(newTaskStars) || 1,
      completed: false,
      date: dateStr,
      createdAt: new Date().toISOString(),
    };
    await saveTask(task);
    setNewTaskName('');
    setNewTaskStars('1');
    loadData();
  }

  async function handleToggleTask(id: string) {
    await toggleTask(id, dateStr);
    loadData();
  }

  async function handleDeleteTask(id: string) {
    await deleteTask(id, dateStr);
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
        </View>
        {starsEarned !== 0 && (
          <View style={styles.starRow}>
            <Text style={[styles.starText, starsEarned < 0 && styles.negativeStars]}>
              {starsEarned > 0 ? '+' : ''}
              {starsEarned.toFixed(2).replace(/\.?0+$/, '')}
            </Text>
            <MaterialCommunityIcons name="star" size={13} color="#facc15" />
          </View>
        )}

        {item.type === 'checkbox' ? (
          <TouchableOpacity
            style={[styles.checkbox, log?.value === true && styles.checkboxChecked]}
            onPress={() => toggleCheckbox(item)}
          >
            {log?.value === true && <MaterialCommunityIcons name="check" size={18} color="#fff" />}
          </TouchableOpacity>
        ) : item.type === 'time-based' ? (
          <TouchableOpacity
            style={[styles.checkbox, log?.value === true && styles.checkboxChecked]}
            onPress={() => toggleTimeBased(item)}
          >
            {log?.value === true ? (
              <MaterialCommunityIcons name="check" size={18} color="#fff" />
            ) : (
              <MaterialCommunityIcons name="clock-outline" size={18} color="#555" />
            )}
          </TouchableOpacity>
        ) : (item.type === 'numeral' || item.type === 'tiered') ? (
          <View style={styles.stepper}>
            <TouchableOpacity style={styles.stepBtn} onPress={() => updateNumeral(item, -1)}>
              <Text style={styles.stepBtnText}>−</Text>
            </TouchableOpacity>
            {editingId === item.id ? (
              <TextInput
                style={styles.stepValueInput}
                value={editDraft}
                onChangeText={setEditDraft}
                keyboardType="numeric"
                autoFocus
                selectTextOnFocus
                onBlur={() => {
                  const parsed = parseInt(editDraft, 10);
                  setNumeralValue(item, isNaN(parsed) ? 0 : parsed);
                  setEditingId(null);
                }}
                onSubmitEditing={() => {
                  const parsed = parseInt(editDraft, 10);
                  setNumeralValue(item, isNaN(parsed) ? 0 : parsed);
                  setEditingId(null);
                }}
              />
            ) : (
              <TouchableOpacity
                onPress={() => {
                  const currentVal = typeof log?.value === 'number' ? log.value : 0;
                  setEditDraft(String(currentVal));
                  setEditingId(item.id);
                }}
              >
                <Text style={styles.stepValue}>
                  {typeof log?.value === 'number' ? log.value : 0}{item.unit ? ` ${item.unit}` : ''}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.stepBtn} onPress={() => updateNumeral(item, 1)}>
              <Text style={styles.stepBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Date navigation */}
      <View style={styles.dateNav}>
        <TouchableOpacity onPress={() => changeDate(-1)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <MaterialCommunityIcons name="chevron-left" size={32} color="#818cf8" style={styles.dateArrow} />
        </TouchableOpacity>
        <Text style={styles.dateText}>{formatDisplayDate(currentDate)}</Text>
        <TouchableOpacity onPress={() => changeDate(1)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <MaterialCommunityIcons name="chevron-right" size={32} color="#818cf8" style={styles.dateArrow} />
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

      {habits.length === 0 && tasks.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No habits yet. Go to Habits tab to add some!</Text>
        </View>
      ) : (
        <FlatList
          data={habits}
          keyExtractor={(item) => item.id}
          renderItem={renderHabitItem}
          contentContainerStyle={[styles.list, { paddingBottom: 24 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            <View style={styles.tasksSection}>
              <Text style={styles.sectionTitle}>Tasks</Text>
              {tasks.map((task) => (
                <View key={task.id} style={[styles.taskRow, task.completed && styles.taskCompleted]}>
                  <TouchableOpacity
                    style={[styles.checkbox, task.completed && styles.checkboxChecked]}
                    onPress={() => handleToggleTask(task.id)}
                  >
                    {task.completed && <MaterialCommunityIcons name="check" size={18} color="#fff" />}
                  </TouchableOpacity>
                  <View style={styles.taskInfo}>
                    <Text style={[styles.habitName, task.completed && styles.taskDoneText]}>{task.name}</Text>
                  </View>
                  <View style={styles.starRow}>
                    <Text style={[styles.starText, task.completed && styles.taskDoneText]}>
                      +{task.stars.toFixed(2).replace(/\.?0+$/, '')}
                    </Text>
                    <MaterialCommunityIcons name="star" size={13} color="#facc15" />
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteTask(task.id)} style={styles.taskDeleteBtn}>
                    <MaterialCommunityIcons name="close" size={18} color="#555" />
                  </TouchableOpacity>
                </View>
              ))}
              <View style={styles.addTaskRow}>
                <TextInput
                  style={[styles.addTaskInput, { flex: 1 }]}
                  value={newTaskName}
                  onChangeText={setNewTaskName}
                  placeholder="New task..."
                  placeholderTextColor="#555"
                  onSubmitEditing={handleAddTask}
                />
                <TextInput
                  style={[styles.addTaskInput, { width: 50, textAlign: 'center' }]}
                  value={newTaskStars}
                  onChangeText={setNewTaskStars}
                  keyboardType="decimal-pad"
                  placeholder="★"
                  placeholderTextColor="#555"
                />
                <TouchableOpacity style={styles.addTaskBtn} onPress={handleAddTask}>
                  <MaterialCommunityIcons name="plus" size={22} color="#818cf8" />
                </TouchableOpacity>
              </View>
            </View>
          }
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
    paddingTop: 12,
    paddingBottom: 4,
    gap: 16,
  },
  dateArrow: { padding: 10 },
  totalValueRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateText: { fontSize: 18, fontWeight: '600', color: '#f0f0f0' },
  totalBox: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    padding: 14,
    backgroundColor: '#1c1a14',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ca8a04',
  },
  totalLabel: { fontSize: 13, color: '#fde68a', fontWeight: '500' },
  totalValue: { fontSize: 28, fontWeight: 'bold', color: '#fbbf24' },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginVertical: 4,
    backgroundColor: '#0a2318',
    borderRadius: 12,
    minHeight: 64,
  },
  badRow: { backgroundColor: '#2d0707' },
  habitInfo: { flex: 1, marginRight: 12 },
  habitName: { fontSize: 16, fontWeight: '500', color: '#f0f0f0' },
  badText: { color: '#f87171' },
  starRow: { flexDirection: 'row', alignItems: 'center', marginRight: 8 },
  starText: { fontSize: 13, color: '#4ade80' },
  negativeStars: { color: '#f87171' },
  checkbox: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#555',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  checkboxText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1e1b4b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBtnText: { fontSize: 22, color: '#818cf8', fontWeight: 'bold' },
  stepValue: { fontSize: 15, fontWeight: '500', minWidth: 56, textAlign: 'center', color: '#f0f0f0' },
  stepValueInput: { fontSize: 15, fontWeight: '500', width: 40, flexGrow: 0, textAlign: 'center', color: '#f0f0f0', borderBottomWidth: 1, borderBottomColor: '#818cf8', paddingVertical: 2 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#555', fontSize: 16, textAlign: 'center', paddingHorizontal: 40 },
  // Tasks section
  tasksSection: { marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#2a2a2a' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#9ca3af', marginBottom: 8 },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginVertical: 3,
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    minHeight: 52,
  },
  taskCompleted: { opacity: 0.6 },
  taskInfo: { flex: 1, marginLeft: 12 },
  taskDoneText: { textDecorationLine: 'line-through', color: '#888' },
  taskDeleteBtn: { padding: 8 },
  addTaskRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  addTaskInput: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#1e1e1e',
    color: '#f0f0f0',
  },
  addTaskBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e1b4b',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
