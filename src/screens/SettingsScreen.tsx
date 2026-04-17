import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getTimeFormat, setTimeFormat, TimeFormat, getWeekStartDay, setWeekStartDay, WeekStartDay } from '../store/storage';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [timeFormat, setTimeFormatState] = useState<TimeFormat>('24');
  const [weekStartDay, setWeekStartDayState] = useState<WeekStartDay>('monday');

  useFocusEffect(
    React.useCallback(() => {
      loadSettings();
    }, [])
  );

  async function loadSettings() {
    const format = await getTimeFormat();
    const startDay = await getWeekStartDay();
    setTimeFormatState(format);
    setWeekStartDayState(startDay);
  }

  async function handleTimeFormatChange(format: TimeFormat) {
    setTimeFormatState(format);
    await setTimeFormat(format);
  }

  async function handleWeekStartDayChange(startDay: WeekStartDay) {
    setWeekStartDayState(startDay);
    await setWeekStartDay(startDay);
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: Math.max(20, insets.bottom) },
      ]}
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Calendar & Time</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Week Starts On</Text>
            <Text style={styles.settingDescription}>
              Choose which day starts the week in the calendar
            </Text>
          </View>
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleOption,
                weekStartDay === 'monday' && styles.toggleOptionActive,
              ]}
              onPress={() => handleWeekStartDayChange('monday')}
            >
              <Text
                style={[
                  styles.toggleText,
                  weekStartDay === 'monday' && styles.toggleTextActive,
                ]}
              >
                Mon
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleOption,
                weekStartDay === 'sunday' && styles.toggleOptionActive,
              ]}
              onPress={() => handleWeekStartDayChange('sunday')}
            >
              <Text
                style={[
                  styles.toggleText,
                  weekStartDay === 'sunday' && styles.toggleTextActive,
                ]}
              >
                Sun
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Time Format</Text>
            <Text style={styles.settingDescription}>
              Choose how times are displayed throughout the app
            </Text>
          </View>
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleOption,
                timeFormat === '12' && styles.toggleOptionActive,
              ]}
              onPress={() => handleTimeFormatChange('12')}
            >
              <Text
                style={[
                  styles.toggleText,
                  timeFormat === '12' && styles.toggleTextActive,
                ]}
              >
                12h
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleOption,
                timeFormat === '24' && styles.toggleOptionActive,
              ]}
              onPress={() => handleTimeFormatChange('24')}
            >
              <Text
                style={[
                  styles.toggleText,
                  timeFormat === '24' && styles.toggleTextActive,
                ]}
              >
                24h
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.exampleContainer}>
          <Text style={styles.exampleLabel}>Example:</Text>
          <Text style={styles.exampleTime}>
            {timeFormat === '12' ? '02:30 PM' : '14:30'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  content: {
    padding: 20,
  },
  section: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f0f0f0',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f0f0f0',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#9ca3af',
    lineHeight: 18,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 2,
  },
  toggleOption: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  toggleOptionActive: {
    backgroundColor: '#6366f1',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
  },
  toggleTextActive: {
    color: '#fff',
  },
  exampleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  exampleLabel: {
    fontSize: 13,
    color: '#9ca3af',
    marginRight: 8,
  },
  exampleTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#a5b4fc',
  },
});
