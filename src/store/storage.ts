import AsyncStorage from '@react-native-async-storage/async-storage';
import { Habit, HabitLog, Task, MoodLog } from '../models/types';

const HABITS_KEY = 'habits';
const LOGS_PREFIX = 'logs_';
const TASKS_PREFIX = 'tasks_';
const MOOD_LOGS_PREFIX = 'mood_logs_';
const SETTINGS_KEY = 'settings';

export type TimeFormat = '12' | '24';

export interface Settings {
  timeFormat: TimeFormat;
}

// --- Habits ---

export async function getHabits(): Promise<Habit[]> {
  const json = await AsyncStorage.getItem(HABITS_KEY);
  return json ? JSON.parse(json) : [];
}

export async function saveHabit(habit: Habit): Promise<void> {
  const habits = await getHabits();
  const idx = habits.findIndex((h) => h.id === habit.id);
  if (idx >= 0) {
    habits[idx] = habit;
  } else {
    habits.push(habit);
  }
  await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(habits));
}

export async function deleteHabit(id: string): Promise<void> {
  const habits = await getHabits();
  const filtered = habits.filter((h) => h.id !== id);
  await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(filtered));
}

// --- Logs ---

function logsKey(date: string): string {
  return `${LOGS_PREFIX}${date}`;
}

export async function getLogsForDate(date: string): Promise<HabitLog[]> {
  const json = await AsyncStorage.getItem(logsKey(date));
  return json ? JSON.parse(json) : [];
}

export async function saveLog(log: HabitLog): Promise<void> {
  const logs = await getLogsForDate(log.date);
  const idx = logs.findIndex((l) => l.habitId === log.habitId);
  if (idx >= 0) {
    logs[idx] = log;
  } else {
    logs.push(log);
  }
  await AsyncStorage.setItem(logsKey(log.date), JSON.stringify(logs));
}

export async function deleteLog(habitId: string, date: string): Promise<void> {
  const logs = await getLogsForDate(date);
  const filtered = logs.filter((l) => l.habitId !== habitId);
  await AsyncStorage.setItem(logsKey(date), JSON.stringify(filtered));
}

// --- Tasks ---

function tasksKey(date: string): string {
  return `${TASKS_PREFIX}${date}`;
}

export async function getTasksForDate(date: string): Promise<Task[]> {
  const json = await AsyncStorage.getItem(tasksKey(date));
  return json ? JSON.parse(json) : [];
}

export async function saveTask(task: Task): Promise<void> {
  const tasks = await getTasksForDate(task.date);
  const idx = tasks.findIndex((t) => t.id === task.id);
  if (idx >= 0) {
    tasks[idx] = task;
  } else {
    tasks.push(task);
  }
  await AsyncStorage.setItem(tasksKey(task.date), JSON.stringify(tasks));
}

export async function deleteTask(id: string, date: string): Promise<void> {
  const tasks = await getTasksForDate(date);
  const filtered = tasks.filter((t) => t.id !== id);
  await AsyncStorage.setItem(tasksKey(date), JSON.stringify(filtered));
}

export async function toggleTask(id: string, date: string): Promise<Task | null> {
  const tasks = await getTasksForDate(date);
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx < 0) return null;
  tasks[idx] = { ...tasks[idx], completed: !tasks[idx].completed };
  await AsyncStorage.setItem(tasksKey(date), JSON.stringify(tasks));
  return tasks[idx];
}

// --- Day totals ---

export async function getDayTotal(date: string): Promise<number> {
  const [logs, tasks] = await Promise.all([
    getLogsForDate(date),
    getTasksForDate(date),
  ]);
  const logStars = logs.reduce((sum, l) => sum + l.starsEarned, 0);
  const taskStars = tasks
    .filter((t) => t.completed)
    .reduce((sum, t) => sum + t.stars, 0);
  return logStars + taskStars;
}

export async function getLastNDayTotals(
  n: number,
): Promise<{ date: string; totalStars: number }[]> {
  const results: { date: string; totalStars: number }[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = formatDate(d);
    const total = await getDayTotal(dateStr);
    results.push({ date: dateStr, totalStars: total });
  }
  return results;
}

export async function getLast7DayTotals(): Promise<{ date: string; totalStars: number }[]> {
  return getLastNDayTotals(7);
}

// --- Mood Logs ---

function moodLogsKey(date: string): string {
  return `${MOOD_LOGS_PREFIX}${date}`;
}

export async function getMoodLogsForDate(date: string): Promise<MoodLog[]> {
  const json = await AsyncStorage.getItem(moodLogsKey(date));
  return json ? JSON.parse(json) : [];
}

export async function saveMoodLog(log: MoodLog): Promise<void> {
  const logs = await getMoodLogsForDate(log.date);
  const idx = logs.findIndex((l) => l.id === log.id);
  if (idx >= 0) {
    logs[idx] = log;
  } else {
    logs.push(log);
  }
  await AsyncStorage.setItem(moodLogsKey(log.date), JSON.stringify(logs));
}

export async function deleteMoodLog(id: string, date: string): Promise<void> {
  const logs = await getMoodLogsForDate(date);
  const filtered = logs.filter((l) => l.id !== id);
  await AsyncStorage.setItem(moodLogsKey(date), JSON.stringify(filtered));
}

// --- Reminder helpers ---

export async function getHabitsWithReminderAfter(triggerHabitId: string): Promise<Habit[]> {
  const habits = await getHabits();
  return habits.filter(
    (h) => h.reminders?.some((r) => r.afterHabitId === triggerHabitId)
  );
}

export function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// --- Settings ---

const defaultSettings: Settings = {
  timeFormat: '24',
};

export async function getSettings(): Promise<Settings> {
  const json = await AsyncStorage.getItem(SETTINGS_KEY);
  return json ? { ...defaultSettings, ...JSON.parse(json) } : defaultSettings;
}

export async function saveSettings(settings: Settings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export async function getTimeFormat(): Promise<TimeFormat> {
  const settings = await getSettings();
  return settings.timeFormat;
}

export async function setTimeFormat(format: TimeFormat): Promise<void> {
  const settings = await getSettings();
  settings.timeFormat = format;
  await saveSettings(settings);
}

// --- Auto-Habits ---

const APP_CHECK_IN_ID = 'auto-habit-app-check-in';

export async function ensureAutoHabits(): Promise<void> {
  const habits = await getHabits();
  const hasAppCheckIn = habits.some((h) => h.id === APP_CHECK_IN_ID);

  if (!hasAppCheckIn) {
    const appCheckInHabit: Habit = {
      id: APP_CHECK_IN_ID,
      name: 'App Check-in',
      type: 'numeral',
      isGood: true,
      stars: 1,
      unit: 'check-ins',
      conversion: { per: 1, stars: 1 }, // 1 check-in = 1 star
      isAutoHabit: true,
      cooldownMinutes: 15,
      frequency: 'daily',
    };
    await saveHabit(appCheckInHabit);
  }
}

export function getAppCheckInHabitId(): string {
  return APP_CHECK_IN_ID;
}

export async function canLogAppCheckIn(date: string): Promise<boolean> {
  const logs = await getLogsForDate(date);
  const checkInLog = logs.find((l) => l.habitId === APP_CHECK_IN_ID);

  if (!checkInLog || !checkInLog.loggedAt) {
    return true;
  }

  const lastLogTime = new Date(checkInLog.loggedAt).getTime();
  const now = Date.now();
  const cooldownMs = 15 * 60 * 1000; // 15 minutes in milliseconds

  return now - lastLogTime >= cooldownMs;
}

export async function getAppCheckInCooldownRemaining(date: string): Promise<number> {
  const logs = await getLogsForDate(date);
  const checkInLog = logs.find((l) => l.habitId === APP_CHECK_IN_ID);

  if (!checkInLog || !checkInLog.loggedAt) {
    return 0;
  }

  const lastLogTime = new Date(checkInLog.loggedAt).getTime();
  const now = Date.now();
  const cooldownMs = 15 * 60 * 1000; // 15 minutes in milliseconds
  const elapsed = now - lastLogTime;

  if (elapsed >= cooldownMs) {
    return 0;
  }

  return Math.ceil((cooldownMs - elapsed) / 1000); // Return seconds remaining
}
