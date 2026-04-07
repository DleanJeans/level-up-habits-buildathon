import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatDate } from '../store/storage';

interface DateNavProps {
  currentDate: Date;
  onChangeDate: (delta: number) => void;
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

export default function DateNav({ currentDate, onChangeDate }: DateNavProps) {
  return (
    <View style={styles.dateNav}>
      <TouchableOpacity
        onPress={() => onChangeDate(-1)}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <MaterialCommunityIcons name="chevron-left" size={32} color="#818cf8" style={styles.dateArrow} />
      </TouchableOpacity>
      <Text style={styles.dateText}>{formatDisplayDate(currentDate)}</Text>
      <TouchableOpacity
        onPress={() => onChangeDate(1)}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <MaterialCommunityIcons name="chevron-right" size={32} color="#818cf8" style={styles.dateArrow} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  dateNav: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 8,
  },
  dateArrow: { padding: 4 },
  dateText: { fontSize: 18, fontWeight: '600', color: '#f0f0f0' },
});
