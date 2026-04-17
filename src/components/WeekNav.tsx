import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatDate, getDayTotal } from '../store/storage';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';

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

// Always start week on Monday
function getWeekDays(selectedDate: Date): DayInfo[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get the start of the week (Monday)
  const startOfWeek = new Date(selectedDate);
  const currentDay = selectedDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

  // Calculate days to subtract to get to Monday
  let daysToSubtract = currentDay - 1;
  if (daysToSubtract < 0) {
    daysToSubtract += 7;
  }

  startOfWeek.setDate(selectedDate.getDate() - daysToSubtract);
  startOfWeek.setHours(0, 0, 0, 0);

  const days: DayInfo[] = [];
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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

export default function WeekNav({ currentDate, onChangeDate, onResetToToday }: WeekNavProps) {
  const { width: windowWidth } = useWindowDimensions();
  const [weekDays, setWeekDays] = useState<DayInfo[]>(() => getWeekDays(currentDate));
  const [nextWeekDays, setNextWeekDays] = useState<DayInfo[]>([]);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [isAnimating, setIsAnimating] = useState(false);

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
    if (isAnimating) return;

    setIsAnimating(true);

    // Prepare the next week's data immediately
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + delta * 7);
    const nextDays = getWeekDays(newDate);

    // Load stars for next week asynchronously
    Promise.all(
      nextDays.map(async (day) => ({
        ...day,
        stars: await getDayTotal(day.dateStr),
      }))
    ).then((daysWithStars) => {
      setNextWeekDays(daysWithStars);
    });

    // Continuous slide animation with both weeks visible
    const containerPadding = 32;
    const gap = 8;
    const totalGaps = 6 * gap;
    const maxWidth = 600;
    const effectiveWidth = Math.min(windowWidth - containerPadding, maxWidth);
    const slideDistance = effectiveWidth + 16; // Include padding between weeks

    Animated.timing(slideAnim, {
      toValue: delta > 0 ? -slideDistance : slideDistance,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      // Update the date after animation completes
      onChangeDate(newDate);
      slideAnim.setValue(0);
      setNextWeekDays([]);
      setIsAnimating(false);
    });
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
      <GestureDetector gesture={swipeGesture}>
        <View style={[styles.animationContainer, { width: effectiveWidth, marginHorizontal: 16 }]}>
          <Animated.View
            style={[
              styles.daysWrapper,
              {
                transform: [{ translateX: slideAnim }],
              },
            ]}
          >
            <View style={[styles.weeksRow, { width: effectiveWidth }]}>
              {/* Current week */}
              <View style={[styles.daysContainer, { width: effectiveWidth }]}>
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

              {/* Next week (shown during animation) */}
              {nextWeekDays.length > 0 && (
                <View style={[styles.daysContainer, { width: effectiveWidth, marginLeft: 16 }]}>
                  {nextWeekDays.map((day) => (
                    <View
                      key={day.dateStr}
                      style={[
                        styles.dayCard,
                        { width: dayCardWidth },
                        day.isSelected && styles.dayCardSelected,
                        day.isToday && !day.isSelected && styles.dayCardToday,
                      ]}
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
                    </View>
                  ))}
                </View>
              )}
            </View>
          </Animated.View>
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    overflow: 'hidden',
  },
  animationContainer: {
    overflow: 'hidden',
  },
  daysWrapper: {
  },
  weeksRow: {
    flexDirection: 'row',
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  dayCard: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    minHeight: 80,
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
    fontSize: 10,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f0f0f0',
    marginBottom: 4,
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
    fontSize: 10,
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
