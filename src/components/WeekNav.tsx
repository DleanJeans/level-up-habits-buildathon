import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatDate, getDayTotal } from '../store/storage';

interface WeekNavProps {
  currentDate: Date;
  onChangeDate: (date: Date) => void;
  onResetToToday?: () => void;
}

interface DayInfo {
  date: Date;
  dateStr: string;
  dayOfWeek: string;
  dayNum: number;
  isToday: boolean;
  isSelected: boolean;
  stars: number;
}

// Get ISO week number
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// Format full date like "Monday, January 1, 2024"
function formatFullDate(date: Date): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const dayName = days[date.getDay()];
  const monthName = months[date.getMonth()];
  const dayNum = date.getDate();
  const year = date.getFullYear();

  return `${dayName}, ${monthName} ${dayNum}, ${year}`;
}

// Generate days from the past up to today (no future days)
// Returns days in chronological order (oldest to newest)
function getPastDays(selectedDate: Date, numDays: number = 30): DayInfo[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const compareSelected = new Date(selectedDate);
  compareSelected.setHours(0, 0, 0, 0);

  const days: DayInfo[] = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Generate days from numDays ago to today
  for (let i = numDays - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const dayOfWeek = date.getDay();

    days.push({
      date,
      dateStr: formatDate(date),
      dayOfWeek: dayNames[dayOfWeek],
      dayNum: date.getDate(),
      isToday: i === 0,
      isSelected: date.getTime() === compareSelected.getTime(),
      stars: 0,
    });
  }

  return days;
}

export default function WeekNav({ currentDate, onChangeDate, onResetToToday }: WeekNavProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [days, setDays] = useState<DayInfo[]>(() => getPastDays(currentDate, 30));

  // Load stars when component mounts
  useEffect(() => {
    async function loadStars() {
      const pastDays = getPastDays(currentDate, 30);
      const daysWithStars = await Promise.all(
        pastDays.map(async (day) => ({
          ...day,
          stars: await getDayTotal(day.dateStr),
        }))
      );
      setDays(daysWithStars);
    }
    loadStars();
  }, []); // Only run on mount

  // Update selection when currentDate changes
  useEffect(() => {
    setDays((prevDays) =>
      prevDays.map((day) => ({
        ...day,
        isSelected: day.date.getTime() === new Date(currentDate).setHours(0, 0, 0, 0),
      }))
    );
  }, [currentDate]);

  // Scroll to the end (today) only when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: false });
    }, 100);
    return () => clearTimeout(timer);
  }, []); // Only run on mount

  function selectDay(day: DayInfo) {
    onChangeDate(day.date);
  }

  const dayCardWidth = 45; // Fixed width for each day card to fit 7 on screen

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {days.map((day) => (
          <TouchableOpacity
            key={day.dateStr}
            style={[
              styles.dayCard,
              { width: dayCardWidth },
              day.isSelected && styles.dayCardSelected,
              day.isToday && !day.isSelected && styles.dayCardToday,
            ]}
            onPress={() => selectDay(day)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.dayOfWeek,
                day.isSelected && styles.dayOfWeekSelected,
                day.isToday && !day.isSelected && styles.dayOfWeekToday,
              ]}
            >
              {day.dayOfWeek}
            </Text>
            <Text
              style={[
                styles.dayNum,
                day.isSelected && styles.dayNumSelected,
                day.isToday && !day.isSelected && styles.dayNumToday,
              ]}
            >
              {day.dayNum}
            </Text>
            <View style={styles.starsRow}>
              <Text
                style={[
                  styles.starsText,
                  day.isSelected && styles.starsTextSelected,
                  day.isToday && !day.isSelected && styles.starsTextToday,
                ]}
              >
                {day.stars > 0 ? day.stars.toFixed(0) : '–'}
              </Text>
              {day.stars > 0 && (
                <MaterialCommunityIcons
                  name="star"
                  size={12}
                  color={day.isSelected ? '#fbbf24' : day.isToday ? '#818cf8' : '#ca8a04'}
                />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Date information display */}
      <View style={styles.dateInfoContainer}>
        <Text style={styles.dateInfoText}>
          {formatFullDate(currentDate)} • Week {getWeekNumber(currentDate)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 12,
    gap: 6,
  },
  dateInfoContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    alignItems: 'center',
  },
  dateInfoText: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
  },
  dayCard: {
    paddingVertical: 6,
    paddingHorizontal: 2,
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    minHeight: 70,
    justifyContent: 'center',
  },
  dayCardSelected: {
    backgroundColor: '#1e1b4b',
    borderColor: '#6366f1',
  },
  dayCardToday: {
    backgroundColor: '#1c1a14',
    borderColor: '#ca8a04',
  },
  dayOfWeek: {
    fontSize: 9,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 1,
  },
  dayOfWeekSelected: {
    color: '#c4b5fd',
  },
  dayOfWeekToday: {
    color: '#fde68a',
  },
  dayNum: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#f0f0f0',
    marginBottom: 3,
  },
  dayNumSelected: {
    color: '#fff',
  },
  dayNumToday: {
    color: '#fbbf24',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  starsText: {
    fontSize: 9,
    fontWeight: '500',
    color: '#ca8a04',
  },
  starsTextSelected: {
    color: '#fbbf24',
  },
  starsTextToday: {
    color: '#818cf8',
  },
});
