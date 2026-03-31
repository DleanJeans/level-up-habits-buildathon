import AsyncStorage from '@react-native-async-storage/async-storage';
import { Habit, HabitLog } from '../models/types';

const HABITS_KEY = 'habits';
const LOGS_PREFIX = 'logs_';

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

// --- Day totals ---

export async function getDayTotal(date: string): Promise<number> {
  const logs = await getLogsForDate(date);
  return logs.reduce((sum, l) => sum + l.starsEarned, 0);
}

export async function getLast7DayTotals(): Promise<{ date: string; totalStars: number }[]> {
  const results: { date: string; totalStars: number }[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = formatDate(d);
    const total = await getDayTotal(dateStr);
    results.push({ date: dateStr, totalStars: total });
  }
  return results;
}

export function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
