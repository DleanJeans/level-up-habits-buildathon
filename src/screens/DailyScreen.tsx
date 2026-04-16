import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
  SectionList,
  Animated,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Habit, HabitLog, Task, MoodLog, CueType } from '../models/types';
import {
  getHabits,
  getLogsForDate,
  saveLog,
  formatDate,
  getTasksForDate,
  saveTask,
  deleteTask,
  toggleTask,
  getHabitsWithReminderAfter,
  saveMoodLog,
  getMoodLogsForDate,
  deleteMoodLog,
  saveHabit,
} from '../store/storage';
import { calculateStars } from '../store/starCalculator';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { v4 as uuidv4 } from 'uuid';
import WebContainer from '../components/WebContainer';
import HabitForm from '../components/HabitForm';
import DateNav from '../components/DateNav';
import EditTimeModal, { toHHMM } from '../components/EditTimeModal';

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
  // Reminder banners
  const [reminderBanners, setReminderBanners] = useState<{ habitName: string; message: string }[]>([]);
  // Cue prompt
  const [cuePrompt, setCuePrompt] = useState<{ cue: string; cueType: CueType; habitName: string } | null>(null);
  // Mood logs
  const [moodLogs, setMoodLogs] = useState<MoodLog[]>([]);
  // All habits (for cue matching)
  const [allHabits, setAllHabits] = useState<Habit[]>([]);
  // Habit form
  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  // Edit log time
  const [editingLog, setEditingLog] = useState<{ habit: Habit; log: HabitLog } | null>(null);

  const dateStr = formatDate(currentDate);

  const loadData = useCallback(async () => {
    const [h, l, t, ml] = await Promise.all([
      getHabits(),
      getLogsForDate(dateStr),
      getTasksForDate(dateStr),
      getMoodLogsForDate(dateStr),
    ]);
    setAllHabits(h);
    // Filter to daily good habits only (bad habits and non-daily habits don't show on daily view)
    const dailyHabits = h.filter((habit) => (habit.frequency || 'daily') === 'daily' && habit.isGood !== false);
    setHabits(dailyHabits);
    const logMap = new Map<string, HabitLog>();
    l.forEach((log) => logMap.set(log.habitId, log));
    setLogs(logMap);
    setTasks(t);
    setMoodLogs(ml);
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
    if (newValue) {
      await checkRemindersAndCues(habit);
    }
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
    if (newValue) {
      await checkRemindersAndCues(habit);
    }
    loadData();
  }

  // --- After logging a habit, check for reminders and cue matches ---
  async function checkRemindersAndCues(loggedHabit: Habit) {
    // 1. Check if any habits have a reminder triggered by this habit
    const triggered = await getHabitsWithReminderAfter(loggedHabit.id);
    if (triggered.length > 0) {
      const banners = triggered.map((h) => {
        const rem = h.reminders!.find((r) => r.afterHabitId === loggedHabit.id)!;
        return {
          habitName: h.name,
          message: rem.message || `Time to do: ${h.name}`,
        };
      });
      setReminderBanners(banners);
      // Auto-dismiss after 5 seconds
      setTimeout(() => setReminderBanners([]), 5000);
    }

    // 2. Check if any habits have a "habit" cue pointing to the logged habit
    const cueMatches = allHabits.filter(
      (h) =>
        h.id !== loggedHabit.id &&
        h.cues?.some((c) => c.type === 'habit' && c.habitId === loggedHabit.id)
    );
    if (cueMatches.length > 0) {
      const match = cueMatches[0];
      const cue = match.cues!.find((c) => c.type === 'habit' && c.habitId === loggedHabit.id)!;
      setCuePrompt({ cue: cue.value || loggedHabit.name, cueType: 'habit', habitName: match.name });
    }
  }

  function dismissCuePrompt() {
    setCuePrompt(null);
  }

  async function logCueAsMood() {
    if (!cuePrompt) return;
    const moodLog: MoodLog = {
      id: uuidv4(),
      date: dateStr,
      cue: cuePrompt.cue,
      cueType: cuePrompt.cueType,
      routineChosen: cuePrompt.habitName,
      createdAt: new Date().toISOString(),
    };
    await saveMoodLog(moodLog);
    setCuePrompt(null);
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

  async function handleSaveHabit(habit: Habit) {
    await saveHabit(habit);
    setShowForm(false);
    setEditingHabit(null);
    loadData();
  }

  async function handleSaveLogTime(hours: number, minutes: number) {
    if (!editingLog) return;
    const base = editingLog.log.loggedAt
      ? new Date(editingLog.log.loggedAt)
      : new Date(dateStr + 'T12:00:00');
    base.setHours(hours, minutes, 0, 0);
    const updatedLog: HabitLog = { ...editingLog.log, loggedAt: base.toISOString() };
    await saveLog(updatedLog);
    setEditingLog(null);
    loadData();
  }

  function changeDate(delta: number) {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + delta);
    setCurrentDate(d);
  }

  function handleEditHabit(habit: Habit) {
    setEditingHabit(habit);
    setShowForm(true);
  }

  function renderHabitItem({ item }: { item: Habit }) {
    const log = logs.get(item.id);
    const starsEarned = log?.starsEarned ?? 0;

    return (
      <TouchableOpacity style={styles.habitRow} onPress={() => handleEditHabit(item)}>
        <View style={styles.habitInfo}>
          <Text style={styles.habitName}>{item.name}</Text>
        </View>
        {(starsEarned !== 0 || ((item.type === 'checkbox' || item.type === 'time-based') && log?.value === true && log?.loggedAt)) && (
          <View style={styles.starCol}>
            {starsEarned !== 0 && (
              <View style={styles.starRow}>
                <Text style={[styles.starText, starsEarned < 0 && styles.negativeStars]}>
                  {starsEarned > 0 ? '+' : ''}
                  {starsEarned.toFixed(2).replace(/\.?0+$/, '')}
                </Text>
                <MaterialCommunityIcons name="star" size={13} color="#facc15" />
              </View>
            )}
            {(item.type === 'checkbox' || item.type === 'time-based') && log?.value === true && log?.loggedAt && (
              <TouchableOpacity
                onPress={() => setEditingLog({ habit: item, log: log! })}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <View style={styles.completedTimeRow}>
                  <Text style={styles.completedTime}>
                    {new Date(log.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <MaterialCommunityIcons name="pencil-outline" size={11} color="#4b5563" />
                </View>
              </TouchableOpacity>
            )}
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
              <View style={styles.stepValueContainer}>
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
                {item.unit ? (
                  <Text style={styles.stepUnitText}>{item.unit}</Text>
                ) : null}
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => {
                  const currentVal = typeof log?.value === 'number' ? log.value : 0;
                  setEditDraft(String(currentVal));
                  setEditingId(item.id);
                }}
              >
                <View style={styles.stepValueContainer}>
                  <Text style={styles.stepValue}>
                    {typeof log?.value === 'number' ? log.value : 0}
                  </Text>
                  {item.unit ? (
                    <Text style={styles.stepUnitText}>{item.unit}</Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.stepBtn} onPress={() => updateNumeral(item, 1)}>
              <Text style={styles.stepBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  }

  return (
    <WebContainer>
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <EditTimeModal
        visible={!!editingLog}
        habitName={editingLog?.habit.name ?? ''}
        initialTime={editingLog?.log.loggedAt ? toHHMM(new Date(editingLog.log.loggedAt)) : ''}
        onSave={handleSaveLogTime}
        onCancel={() => setEditingLog(null)}
      />

      {/* Date navigation */}
      <DateNav currentDate={currentDate} onChangeDate={changeDate} />

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

      {/* Reminder banners */}
      {reminderBanners.map((banner, i) => (
        <View key={i} style={styles.reminderBanner}>
          <MaterialCommunityIcons name="bell-ring" size={18} color="#818cf8" />
          <View style={styles.reminderBannerContent}>
            <Text style={styles.reminderBannerTitle}>{banner.habitName}</Text>
            <Text style={styles.reminderBannerMsg}>{banner.message}</Text>
          </View>
          <TouchableOpacity onPress={() => setReminderBanners((b) => b.filter((_, j) => j !== i))}>
            <MaterialCommunityIcons name="close" size={18} color="#9ca3af" />
          </TouchableOpacity>
        </View>
      ))}

      {/* Cue prompt modal */}
      <Modal visible={!!cuePrompt} transparent animationType="fade" onRequestClose={dismissCuePrompt}>
        <View style={styles.modalOverlay}>
          <View style={styles.cueModal}>
            <MaterialCommunityIcons name="link-variant" size={28} color="#818cf8" />
            <Text style={styles.cueModalTitle}>Cue Detected</Text>
            <Text style={styles.cueModalText}>
              You just logged a habit linked as a cue for:
            </Text>
            <Text style={styles.cueModalHabit}>{cuePrompt?.habitName}</Text>
            <View style={styles.cueModalActions}>
              <TouchableOpacity style={styles.cueModalBtn} onPress={logCueAsMood}>
                <Text style={styles.cueModalBtnText}>Log It</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cueModalDismiss} onPress={dismissCuePrompt}>
                <Text style={styles.cueModalDismissText}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Cues display — active cues for today */}
      {allHabits.some((h) => h.cues && h.cues.length > 0) && (
        <View style={styles.cuesSection}>
          {allHabits
            .filter((h) => h.cues && h.cues.length > 0 && h.cues.some((c) => c.type !== 'habit'))
            .map((h) =>
              h.cues!
                .filter((c) => c.type !== 'habit')
                .map((c, ci) => (
                  <View key={`${h.id}-${ci}`} style={styles.cueChip}>
                    <MaterialCommunityIcons
                      name={
                        c.type === 'location'
                          ? 'map-marker'
                          : c.type === 'mood'
                          ? 'emoticon-outline'
                          : 'clock-outline'
                      }
                      size={14}
                      color="#818cf8"
                    />
                    <Text style={styles.cueChipText}>{c.value}</Text>
                    <Text style={styles.cueChipArrow}>→</Text>
                    <Text style={styles.cueChipHabit}>{h.name}</Text>
                  </View>
                ))
            )}
        </View>
      )}

      {/* Mood logs for today */}
      {moodLogs.length > 0 && (
        <View style={styles.moodLogsSection}>
          <Text style={styles.sectionTitle}>Mood Log</Text>
          {moodLogs.map((ml) => (
            <View key={ml.id} style={styles.moodLogRow}>
              <MaterialCommunityIcons
                name={
                  ml.cueType === 'location'
                    ? 'map-marker'
                    : ml.cueType === 'mood'
                    ? 'emoticon-outline'
                    : ml.cueType === 'habit'
                    ? 'link-variant'
                    : 'clock-outline'
                }
                size={16}
                color="#818cf8"
              />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.moodLogCue}>{ml.cue}</Text>
                {ml.routineChosen && (
                  <Text style={styles.moodLogRoutine}>→ {ml.routineChosen}</Text>
                )}
              </View>
              <TouchableOpacity onPress={() => { deleteMoodLog(ml.id, dateStr); loadData(); }}>
                <MaterialCommunityIcons name="close" size={16} color="#555" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {habits.length === 0 && tasks.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No habits yet. Go to Habits tab to add some!</Text>
        </View>
      ) : (
        <FlatList
          data={habits}
          keyExtractor={(item) => item.id}
          renderItem={renderHabitItem}
          contentContainerStyle={[styles.list, { paddingBottom: 120 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
      <TouchableOpacity
        style={[styles.fab, { bottom: 24 + insets.bottom }]}
        onPress={() => {
          setEditingHabit(null);
          setShowForm(true);
        }}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="plus" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <HabitForm
          habit={editingHabit}
          onSave={handleSaveHabit}
          onCancel={() => {
            setShowForm(false);
            setEditingHabit(null);
          }}
        />
      </Modal>
    </KeyboardAvoidingView>
    </WebContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  totalValueRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
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
  completedTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  completedTime: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  badText: { color: '#f87171' },
  starCol: { alignItems: 'center', marginRight: 8, gap: 3 },
  starRow: { flexDirection: 'row', alignItems: 'center' },
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
  stepValueContainer: {
    alignItems: 'center',
    minWidth: 56,
  },
  stepValue: { fontSize: 15, fontWeight: '500', textAlign: 'center', color: '#f0f0f0' },
  stepValueInput: { fontSize: 15, fontWeight: '500', width: 40, flexGrow: 0, textAlign: 'center', color: '#f0f0f0', borderBottomWidth: 1, borderBottomColor: '#818cf8', paddingVertical: 2 },
  stepUnitText: { fontSize: 11, color: '#9ca3af', textAlign: 'center', marginTop: 2 },
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
  // Reminder banners
  reminderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    backgroundColor: '#1e1b4b',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#6366f1',
    gap: 10,
  },
  reminderBannerContent: { flex: 1 },
  reminderBannerTitle: { fontSize: 14, fontWeight: '600', color: '#818cf8' },
  reminderBannerMsg: { fontSize: 13, color: '#c4b5fd', marginTop: 2 },
  // Cue prompt modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  cueModal: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: '#333',
  },
  cueModalTitle: { fontSize: 18, fontWeight: 'bold', color: '#f0f0f0', marginTop: 10 },
  cueModalText: { fontSize: 14, color: '#9ca3af', textAlign: 'center', marginTop: 8 },
  cueModalHabit: { fontSize: 16, fontWeight: '600', color: '#818cf8', marginTop: 4 },
  cueModalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cueModalBtn: {
    flex: 1,
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cueModalBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  cueModalDismiss: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cueModalDismissText: { color: '#bbb', fontSize: 14 },
  // Cue chips
  cuesSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  cueChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#333',
  },
  cueChipText: { fontSize: 12, color: '#c4b5fd' },
  cueChipArrow: { fontSize: 12, color: '#555' },
  cueChipHabit: { fontSize: 12, color: '#818cf8', fontWeight: '500' },
  // FAB
  fab: {
    position: 'absolute',
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    zIndex: 10,
  },
  // Mood logs
  moodLogsSection: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 10,
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
  },
  moodLogRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  moodLogCue: { fontSize: 13, color: '#c4b5fd' },
  moodLogRoutine: { fontSize: 12, color: '#818cf8' },
});
