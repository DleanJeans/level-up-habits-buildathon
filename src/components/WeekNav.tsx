import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatDate, getDayTotal } from '../store/storage';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';

interface WeekNavProps {
  currentDate: Date;
  onChangeDate: (date: Date) => void;
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

function getWeekDays(selectedDate: Date): DayInfo[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get the start of the week (Sunday)
  const startOfWeek = new Date(selectedDate);
  startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const days: DayInfo[] = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);

    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);

    const compareSelected = new Date(selectedDate);
    compareSelected.setHours(0, 0, 0, 0);

    days.push({
      date,
      dateStr: formatDate(date),
      dayOfWeek: dayNames[date.getDay()],
      dayNum: date.getDate(),
      isToday: compareDate.getTime() === today.getTime(),
      isSelected: compareDate.getTime() === compareSelected.getTime(),
      stars: 0,
    });
  }

  return days;
}

export default function WeekNav({ currentDate, onChangeDate }: WeekNavProps) {
  const [weekDays, setWeekDays] = useState<DayInfo[]>(() => getWeekDays(currentDate));
  const scrollViewRef = React.useRef<ScrollView>(null);

  useEffect(() => {
    async function loadStars() {
      const days = getWeekDays(currentDate);
      const daysWithStars = await Promise.all(
        days.map(async (day) => ({
          ...day,
          stars: await getDayTotal(day.dateStr),
        }))
      );
      setWeekDays(daysWithStars);
    }
    loadStars();
  }, [currentDate]);

  function changeWeek(delta: number) {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + delta * 7);
    onChangeDate(newDate);
  }

  function selectDay(day: DayInfo) {
    onChangeDate(day.date);
  }

  // Swipe gesture for week navigation
  const swipeGesture = Gesture.Pan()
    .onEnd((event) => {
      const SWIPE_THRESHOLD = 50;
      if (event.translationX > SWIPE_THRESHOLD) {
        // Swipe right - go to previous week
        changeWeek(-1);
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        // Swipe left - go to next week
        changeWeek(1);
      }
    });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => changeWeek(-1)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color="#818cf8" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Week View</Text>
        <TouchableOpacity
          onPress={() => changeWeek(1)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <MaterialCommunityIcons name="chevron-right" size={28} color="#818cf8" />
        </TouchableOpacity>
      </View>

      <GestureDetector gesture={swipeGesture}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daysContainer}
        >
          {weekDays.map((day) => (
            <TouchableOpacity
              key={day.dateStr}
              style={[
                styles.dayCard,
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
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  daysContainer: {
    paddingHorizontal: 12,
    gap: 8,
  },
  dayCard: {
    width: 48,
    paddingVertical: 10,
    paddingHorizontal: 6,
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
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
    fontSize: 11,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 4,
  },
  dayOfWeekSelected: {
    color: '#c4b5fd',
  },
  dayOfWeekToday: {
    color: '#fde68a',
  },
  dayNum: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f0f0f0',
    marginBottom: 6,
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
    fontSize: 11,
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
