import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatDate, getDayTotal, getWeekStartDay, WeekStartDay } from '../store/storage';
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

function getWeekDays(selectedDate: Date, weekStartDay: WeekStartDay): DayInfo[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get the start of the week based on user preference
  const startOfWeek = new Date(selectedDate);
  const currentDay = selectedDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const startDayOffset = weekStartDay === 'monday' ? 1 : 0;

  // Calculate days to subtract to get to the start of week
  let daysToSubtract = currentDay - startDayOffset;
  if (daysToSubtract < 0) {
    daysToSubtract += 7;
  }

  startOfWeek.setDate(selectedDate.getDate() - daysToSubtract);
  startOfWeek.setHours(0, 0, 0, 0);

  const days: DayInfo[] = [];
  const dayNames = weekStartDay === 'monday'
    ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
      dayOfWeek: dayNames[i],
      dayNum: date.getDate(),
      isToday: compareDate.getTime() === today.getTime(),
      isSelected: compareDate.getTime() === compareSelected.getTime(),
      stars: 0,
    });
  }

  return days;
}

export default function WeekNav({ currentDate, onChangeDate }: WeekNavProps) {
  const { width: windowWidth } = useWindowDimensions();
  const [weekStartDay, setWeekStartDayState] = useState<WeekStartDay>('monday');
  const [weekDays, setWeekDays] = useState<DayInfo[]>(() => getWeekDays(currentDate, 'monday'));
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    async function loadWeekStartDay() {
      const startDay = await getWeekStartDay();
      setWeekStartDayState(startDay);
    }
    loadWeekStartDay();
  }, []);

  useEffect(() => {
    async function loadStars() {
      const days = getWeekDays(currentDate, weekStartDay);
      const daysWithStars = await Promise.all(
        days.map(async (day) => ({
          ...day,
          stars: await getDayTotal(day.dateStr),
        }))
      );
      setWeekDays(daysWithStars);
    }
    loadStars();
  }, [currentDate, weekStartDay]);

  function changeWeek(delta: number) {
    if (isAnimating) return;

    setIsAnimating(true);
    const direction = delta > 0 ? 1 : -1;

    // Slide animation
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: -direction * 20,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsAnimating(false);
    });

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

  // Calculate responsive width for day cards
  const containerPadding = 32; // 16px on each side
  const gap = 8;
  const totalGaps = 6 * gap; // 6 gaps between 7 days
  const maxWidth = 600; // Max width for web landscape
  const effectiveWidth = Math.min(windowWidth - containerPadding, maxWidth);
  const dayCardWidth = (effectiveWidth - totalGaps) / 7;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => changeWeek(-1)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          disabled={isAnimating}
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color="#818cf8" />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          onPress={() => changeWeek(1)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          disabled={isAnimating}
        >
          <MaterialCommunityIcons name="chevron-right" size={28} color="#818cf8" />
        </TouchableOpacity>
      </View>

      <GestureDetector gesture={swipeGesture}>
        <Animated.View
          style={[
            styles.daysWrapper,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          <View style={[styles.daysContainer, { maxWidth, alignSelf: 'center', width: '100%' }]}>
            {weekDays.map((day) => (
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
          </View>
        </Animated.View>
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
  daysWrapper: {
    paddingHorizontal: 16,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  dayCard: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
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
