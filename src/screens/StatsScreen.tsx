import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getLastNDayTotals } from '../store/storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type RangeOption = 7 | 14 | 30;

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const [range, setRange] = useState<RangeOption>(7);
  const [data, setData] = useState<{ date: string; totalStars: number }[]>([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const totals = await getLastNDayTotals(range);
        setData(totals);
      })();
    }, [range])
  );

  const maxStars = Math.max(...data.map((d) => d.totalStars), 1);

  function formatLabel(dateStr: string): string {
    const parts = dateStr.split('-');
    return `${parts[1]}/${parts[2]}`;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.header}>Star Stats</Text>

      {/* Range selector */}
      <View style={styles.rangeRow}>
        {([7, 14, 30] as RangeOption[]).map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.rangeBtn, range === r && styles.rangeBtnActive]}
            onPress={() => setRange(r)}
          >
            <Text style={[styles.rangeBtnText, range === r && styles.rangeBtnTextActive]}>
              {r}d
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Bar chart */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chartContainer}
      >
        {data.map((entry) => {
          const barHeight = maxStars > 0 ? (entry.totalStars / maxStars) * 160 : 0;
          return (
            <View key={entry.date} style={styles.barColumn}>
              <Text style={styles.barValue}>
                {entry.totalStars.toFixed(1).replace(/\.0$/, '')}
              </Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max(barHeight, 2),
                      backgroundColor: entry.totalStars > 0 ? '#818cf8' : '#333',
                    },
                  ]}
                />
              </View>
              <Text style={styles.barLabel}>{formatLabel(entry.date)}</Text>
            </View>
          );
        })}
      </ScrollView>

      {/* Summary */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total</Text>
          <View style={styles.summaryValueRow}>
            <Text style={styles.summaryValue}>
              {data.reduce((s, d) => s + d.totalStars, 0).toFixed(1).replace(/\.0$/, '')}
            </Text>
            <MaterialCommunityIcons name="star" size={18} color="#fbbf24" />
          </View>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Average</Text>
          <View style={styles.summaryValueRow}>
            <Text style={styles.summaryValue}>
              {data.length > 0
                ? (data.reduce((s, d) => s + d.totalStars, 0) / data.length)
                    .toFixed(1)
                    .replace(/\.0$/, '')
                : '0'}
            </Text>
            <MaterialCommunityIcons name="star" size={18} color="#fbbf24" />
          </View>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Best</Text>
          <View style={styles.summaryValueRow}>
            <Text style={styles.summaryValue}>
              {maxStars.toFixed(1).replace(/\.0$/, '')}
            </Text>
            <MaterialCommunityIcons name="star" size={18} color="#fbbf24" />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', paddingHorizontal: 16 },
  header: { fontSize: 26, fontWeight: 'bold', color: '#f0f0f0', paddingTop: 16, paddingBottom: 12 },
  rangeRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  rangeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
  },
  rangeBtnActive: { borderColor: '#6366f1', backgroundColor: '#1e1b4b' },
  rangeBtnText: { color: '#9ca3af', fontSize: 14, fontWeight: '500' },
  rangeBtnTextActive: { color: '#818cf8', fontWeight: '600' },
  chartContainer: { paddingVertical: 8, alignItems: 'flex-end', minWidth: '100%' },
  barColumn: { alignItems: 'center', marginHorizontal: 4, minWidth: 36 },
  barValue: { fontSize: 10, color: '#9ca3af', marginBottom: 4 },
  barTrack: { height: 160, justifyContent: 'flex-end', width: 28 },
  bar: { width: 28, borderRadius: 4 },
  barLabel: { fontSize: 10, color: '#6b7280', marginTop: 6 },
  summaryRow: { flexDirection: 'row', gap: 10, marginTop: 24 },
  summaryCard: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  summaryLabel: { fontSize: 12, color: '#9ca3af', marginBottom: 4 },
  summaryValueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  summaryValue: { fontSize: 22, fontWeight: 'bold', color: '#f0f0f0' },
});
